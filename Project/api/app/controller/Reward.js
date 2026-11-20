import mongoose from "mongoose";
import { CrudController, Mutate } from "../utils/index.js";
import { Reward as rewardModel, Response as responseModel } from "../model/index.js";
import profileController from "./Profile.js";

export const DEFAULT_PROFILE_POINTS = 50; // same default the member area uses when a profile has no points of its own
const PROFILE_TAG = /\[profile:([^\]]+)\]/;
const slugOf = (s) => String(s ?? "").trim().toLowerCase();

class RewardController extends CrudController {
    get userId() {
        return new mongoose.Types.ObjectId(this.request.user._id);
    }

    // The member's completed survey responses (they carry the survey's points).
    async completedResponses() {
        return Mutate(await responseModel.find({
            user: this.userId,
            status: "complete",
            isActive: true,
            isDeleted: false,
            origin: this.request.origin
        }).sort({ updatedAt: -1 }));
    }

    // The member's own rewards (profile payments).
    async mine() {
        return Mutate(await rewardModel.find({
            user: this.userId,
            isActive: true,
            isDeleted: false,
            origin: this.request.origin
        }).sort({ createdAt: -1 }));
    }

    /**
     * Everything the member has earned, newest first: completed surveys (points from the response) and paid profiles.
     * A profile completed as a survey is counted once (from its response).
     * Each entry: { _id, category, name, slug, points, remarks, createdAt, source }
     */
    async ledger() {
        const [responses, rewards] = await Promise.all([this.completedResponses(), this.mine()]);
        const surveySlugs = new Set(responses.map((r) => slugOf(r?.survey?.slug)));
        const fromSurveys = responses.map((r) => ({
            _id: r._id,
            category: "survey",
            name: r?.survey?.name,
            slug: slugOf(r?.survey?.slug),
            points: Number(r.points) || 0,
            remarks: `Survey completed: ${r?.survey?.name || r?.survey?.slug} [profile:${slugOf(r?.survey?.slug)}]`,
            createdAt: r.updatedAt || r.createdAt,
            source: "survey"
        }));
        const fromRewards = rewards
            .filter((r) => !(r.category === "profile" && surveySlugs.has(slugOf(String(r.key).replace(/^profile:/, "")))))
            .map((r) => ({
                _id: r._id,
                category: r.category,
                name: r.name,
                slug: slugOf(String(r.key).replace(/^profile:/, "")),
                points: Number(r.points) || 0,
                remarks: r.remarks,
                createdAt: r.createdAt,
                source: "reward"
            }));
        return [...fromSurveys, ...fromRewards].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    async total() {
        return (await this.ledger()).reduce((n, r) => n + (Number(r.points) || 0), 0);
    }

    /**
     * Pays a completed profile once. The member is always the signed-in one (never taken from the request body),
     * the profile must really be complete for them, and the points are decided here, not by the browser.
     * body: { remarks: "Profile completed: Name [profile:<slug>]", name?, slug? }
     */
    async creditProfile(body = {}) {
        const slug = slugOf(body.slug || PROFILE_TAG.exec(String(body.remarks || ""))?.[1]);
        if (!slug) throw new Error("Which profile was completed?");
        const key = `profile:${slug}`;
        const filter = { user: this.userId, key, origin: this.request.origin };

        const already = await rewardModel.findOne(filter);
        if (already) return Mutate(already);

        // completed as a survey: its response already carries the points
        const response = Mutate(await responseModel.findOne({
            user: this.userId, "survey.slug": slug, status: "complete", origin: this.request.origin
        }));
        if (!response) {
            profileController.request = this.request;
            const status = await profileController.status();
            if (!(Number(status?.[slug]) >= 100)) throw new Error("This profile is not complete yet.");
        }
        const points = response ? 0 : DEFAULT_PROFILE_POINTS;
        const name = String(body.name || "").trim() || slug;
        try {
            return Mutate(await rewardModel.create({
                ...filter,
                category: "profile",
                name,
                points,
                remarks: `Profile completed: ${name} [profile:${slug}]`,
                created: { By: this.request.user._id, From: this.request.clientIP }
            }));
        } catch (e) {
            if (e?.code === 11000) return Mutate(await rewardModel.findOne(filter)); // paid by a parallel request
            throw e;
        }
    }
}

export default new RewardController(rewardModel);
