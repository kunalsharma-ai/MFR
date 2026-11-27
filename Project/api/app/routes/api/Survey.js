import express from "express";
import {
    Response as responseController,
    Survey as surveyController,
    User as userController
} from "../../controller/index.js";
import { Mutate, expressRoute, expressView, isAuthenticated, fsLogger } from "../../utils/index.js"
import { requireAdmin, requireMember, optionalMember } from "../../utils/access.js";

// The survey's entry link is only for admins here. Members get it from PUT /api/v1/me/survey, which checks the
// About You lock first (member/aboutYou.js), so the link cannot be read off these list routes to skip the lock.
function hideLinks(req, data) {
    if (req.isAdmin) return data;
    const strip = (s) => {
        if (!s || typeof s !== "object") return s;
        const o = typeof s.toObject === "function" ? s.toObject() : { ...s };
        delete o.link;
        return o;
    };
    return Array.isArray(data) ? data.map(strip) : strip(data);
}

// Statuses a member's own survey redirect may set (status page after the survey tool sends them back).
const MEMBER_END_STATUSES = ["complete", "terminate", "overquota"];

const router = express.Router();
router
    .route('/')
    .get(optionalMember, expressRoute(
        async req => {
            // Read all entries
            let message = "";
            let data = hideLinks(req, Mutate(await surveyController.list()))
            return { message, data };
        },
        surveyController
    ))
    .post(isAuthenticated, expressRoute(
        async req => {
            let message = "";
            req.isAdmin = false; // isAuthenticated does not check the role: admins use GET (above) or the admin API
            let data = hideLinks(req, Mutate(await surveyController.list(req.body)))
            return { message, data }
        },
        surveyController
    ))
    // creating surveys is an admin action (was open to anyone)
    .put(requireAdmin, expressRoute(
        async req => {
            // Create new entry
            let message = "Survey created";
            let data = await surveyController.create(req.body);
            return { message, data };
        },
        surveyController
    ))
router
    .route("/responses/:slug")
    // every member's response to a survey: admins only (was open to anyone)
    .get(requireAdmin, expressRoute(
        async req => {
            let data = await responseController.list({
                "survey.slug": req.params.slug
            })
            return { message: "", data }
        },
        responseController
    ))
router
    .route("/response")
    // Was unauthenticated: anyone could mark any response complete. Now the member who owns the response (or an
    // admin) may close it once, from invited/dropout, to one of the end statuses only.
    .patch(requireMember, expressRoute(
        async req => {
            const sid = String(req.body?.sid ?? "");
            const status = String(req.body?.status ?? "").toLowerCase();
            if (!/^[a-f0-9]{24}$/i.test(sid)) throw new Error("Invalid request");
            let data = await responseController.read(sid);
            if (!data) throw new Error("Invalid request");
            if (!req.isAdmin && String(data.user?._id ?? data.user) !== String(req.user._id)) throw new Error("Invalid request");
            if (data.status !== status && MEMBER_END_STATUSES.includes(status) && ["invited", "dropout", ""].includes(data.status)) {
                await responseController.update(sid, {
                    status,
                    "timeline.end": new Date()
                });
            }
            data = await responseController.read(sid);
            return { message: "", data }
        },
        responseController
    ))
router
    .route("/response")
    // The member's 1 to 5 star rating of a survey they finished, from the status page. Only their own response, only
    // after it ended (complete, terminate or overquota). A second rating replaces the first.
    .put(requireMember, expressRoute(
        async req => {
            const sid = String(req.body?.sid ?? "");
            const rating = Number(req.body?.rating);
            if (!/^[a-f0-9]{24}$/i.test(sid) || !Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error("Invalid request");
            const data = await responseController.read(sid);
            if (!data || String(data.user?._id ?? data.user) !== String(req.user._id)) throw new Error("Invalid request");
            if (!MEMBER_END_STATUSES.includes(String(data.status || "").toLowerCase())) throw new Error("You can rate a survey once it has ended");
            await responseController.update(sid, { rating, ratedAt: new Date() });
            return { message: "Thanks for your rating", data: { sid, rating } }
        },
        responseController
    ))
router
    .route('/:id/invite')
    .post(isAuthenticated, expressRoute(
        async req => {
            const user = await userController.read(req.user._id);
            if (!["admin", "root"].includes(user.role)) {
                throw new Error("Access denied: Admin only");
            }
            let message = "Invitations sent";
            let data = await surveyController.bulkInvite(req.params.id, req.body);
            return { message, data };
        },
        surveyController
    ))
router
    .route('/:id')
    .get(optionalMember, expressRoute(
        async req => {
            // read single entry
            let message = "";
            let data = hideLinks(req, Mutate((await surveyController.read(req.params.id)) ?? null));
            return { message, data };
        },
        surveyController
    ))
    // editing and deleting surveys are admin actions (were open to anyone)
    .put(requireAdmin, expressRoute(
        async req => {
            // update single entry
            let message = "Survey updated";
            let data = await surveyController.update(req.params.id, req.body)
            return { message, data };
        },
        surveyController
    ))
    .delete(requireAdmin, expressRoute(
        async req => {
            // delete single entry
            let message = "Survey Deleted";
            let data = await surveyController.delete(req.params.id)
            return { message, data };
        },
        surveyController
    ))
export default router;