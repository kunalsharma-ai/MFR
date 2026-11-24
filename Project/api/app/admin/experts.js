// Expert verification queue (spec module 9, Professionals): a Professional asks to be shown as a verified expert and
// gives a LinkedIn profile and/or a work e-mail (engagement/pro.js requestVerification). The team checks the evidence by
// hand here and verifies or declines, one brand at a time. Nothing here sends e-mail.
//
// The work e-mail is masked; only its domain is shown in full, which is what the check needs. The LinkedIn link is
// shown because checking it is the job. MADP audits every read of this queue.
import mongoose from "mongoose";
import { User, ExpertVerification, Response } from "../model/index.js";
import { memberType } from "../engagement/http.js";
import { maskEmail } from "./mask.js";
import { AdminError } from "./http.js";

const oid = (v) => new mongoose.Types.ObjectId(String(v));
const isId = (v) => /^[a-f0-9]{24}$/i.test(String(v || ""));
const STATUSES = ["requested", "verified", "declined"];
const shortName = (u) => [u?.name?.first, u?.name?.last ? `${String(u.name.last)[0]}.` : ""].filter(Boolean).join(" ") || "Member";

function view(v, u, extra = {}) {
    return {
        id: String(v._id),
        status: v.status,
        member: u ? { id: String(u._id), name: shortName(u), segment: memberType(u), category: u.category || null, qualityScore: u.qualityScore ?? null, memberStatus: u.memberStatus || "active" } : { id: String(v.user), name: "Member", segment: null },
        linkedin: v.linkedin || null,
        workEmail: v.workEmail ? maskEmail(v.workEmail) : null,
        workDomain: v.workDomain || null,
        jobTitle: v.jobTitle || null,
        note: v.note || null,
        requestedAt: v.createdAt,
        decidedAt: v.decidedAt || null,
        history: (v.history || []).map((h) => ({ status: h.status, at: h.at, by: h.by })),
        ...extra,
    };
}

/** The queue, oldest waiting first. status: requested (default), verified, declined or all. */
export async function list(origin, { status = "requested", page = 1 } = {}) {
    if (status !== "all" && !STATUSES.includes(status)) throw new AdminError("invalid_value", `status is ${STATUSES.join(", ")} or all`);
    const q = { origin, isDeleted: { $ne: true }, ...(status === "all" ? {} : { status }) };
    const p = Math.max(1, Number(page) || 1);
    const [rows, total, counts] = await Promise.all([
        ExpertVerification.find(q).select("+workEmail").sort({ createdAt: 1 }).skip((p - 1) * 50).limit(50).lean(),
        ExpertVerification.countDocuments(q),
        ExpertVerification.aggregate([{ $match: { origin, isDeleted: { $ne: true } } }, { $group: { _id: "$status", n: { $sum: 1 } } }]),
    ]);
    const users = await User.find({ _id: { $in: rows.map((r) => r.user) }, origin }).select("name category qualityScore memberStatus dob").lean();
    const byId = new Map(users.map((u) => [String(u._id), u]));
    return {
        total, page: p,
        counts: Object.fromEntries(STATUSES.map((s) => [s, counts.find((c) => c._id === s)?.n || 0])),
        items: rows.map((v) => view(v, byId.get(String(v.user)))),
    };
}

/** One request with what helps the check: completed surveys and the other professionals at the same work domain. */
export async function get(origin, id) {
    if (!isId(id)) throw new AdminError("not_found", "Request not found", 404);
    const v = await ExpertVerification.findOne({ _id: oid(id), origin, isDeleted: { $ne: true } }).select("+workEmail +adminNote").lean();
    if (!v) throw new AdminError("not_found", "Request not found", 404);
    const u = await User.findOne({ _id: v.user, origin }).select("name category qualityScore memberStatus dob createdAt").lean();
    const [completes, sameDomain] = await Promise.all([
        Response.countDocuments({ origin, user: v.user, status: "complete", isDeleted: { $ne: true } }),
        v.workDomain ? ExpertVerification.countDocuments({ origin, workDomain: v.workDomain, _id: { $ne: v._id }, status: "verified" }) : 0,
    ]);
    return view(v, u, { adminNote: v.adminNote || null, memberSince: u?.createdAt || null, completedSurveys: completes, verifiedAtSameDomain: sameDomain });
}

/**
 * Verify or decline a waiting request. A decline needs a note for the member (shown on their expertise page); both
 * need a reason for the audit, which MADP keeps. Only a waiting request can be decided, so two admins can't both decide.
 */
export async function decide(origin, id, { decision, note, adminNote } = {}, actor) {
    if (!isId(id)) throw new AdminError("not_found", "Request not found", 404);
    if (!["verified", "declined"].includes(decision)) throw new AdminError("invalid_value", "decision is verified or declined");
    const memberNote = note ? String(note).trim().slice(0, 300) : "";
    if (decision === "declined" && memberNote.length < 5) throw new AdminError("reason_required", "Tell the member why (5 characters or more)");
    const cur = await ExpertVerification.findOne({ _id: oid(id), origin, isDeleted: { $ne: true } }).lean();
    if (!cur) throw new AdminError("not_found", "Request not found", 404);
    const u = await User.findOne({ _id: cur.user, origin }).select("category dob").lean();
    if (decision === "verified" && memberType(u || {}) !== "professional") throw new AdminError("invalid_value", "Only Professionals can be verified experts", 409);
    const v = await ExpertVerification.findOneAndUpdate(
        { _id: oid(id), origin, status: "requested" },
        {
            $set: { status: decision, note: memberNote || undefined, adminNote: adminNote ? String(adminNote).trim().slice(0, 500) : undefined, decidedAt: new Date() },
            $push: { history: { status: decision, at: new Date(), by: `madp:${actor || "unknown"}` } },
        },
        { new: true }
    ).lean();
    if (!v) throw new AdminError("conflict", "Only a waiting request can be decided", 409);
    return { id: String(v._id), before: { status: cur.status }, after: { status: v.status }, member: String(v.user) };
}
