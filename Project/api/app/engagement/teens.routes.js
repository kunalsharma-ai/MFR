// Phase 6: Teen Panel (Teen members only; others get 403).
//  GET  /teen/progress            level, badges, season, streak (points only, never money)
//  GET  /teen/tasks               open creative tasks (design votes, polls, idea contests) with my answer
//  POST /teen/tasks/:id           {choice} or {text}
//  POST /teen/guardian-view       email my parent or guardian a read-only view link
//  admin
//  GET  /admin/ideas?status=submitted     POST /admin/ideas/:id {status: approved|rejected}
//  (creative tasks themselves are made with /admin/tasks, kind design_vote | idea | poll, audience ["teen"])
import mongoose from "mongoose";
import { TaskEntry } from "../model/index.js";
import * as T from "./teens.js";
import { handle, fail, limit, requireAdmin, clean } from "./http.js";

export function mount(router) {
    router
        .get("/teen/progress", handle(async (req) => { T.requireTeen(req.user); return T.progress(req.user, req.origin); }))
        .get("/teen/tasks", handle(async (req) => T.tasks(req.user, req.origin)))
        .post("/teen/tasks/:id", limit(20, 1), handle(async (req) => T.answerTask(req.user, req.origin, req.params.id, clean(req.body) || {})))
        .post("/teen/guardian-view", limit(3, 60), handle(async (req) => T.sendViewLink(req.user, req.origin)));

    router
        .get("/admin/ideas", requireAdmin, handle(async (req) => {
            const list = await TaskEntry.find({ origin: req.origin, status: String(req.query.status || "submitted"), text: { $exists: true } }).populate({ path: "task", select: "title kind" }).sort({ createdAt: 1 }).limit(200).lean();
            return list.filter((e) => e.task?.kind === "idea").map((e) => ({ id: String(e._id), task: e.task.title, text: e.text, status: e.status, at: e.createdAt }));
        }))
        .post("/admin/ideas/:id", requireAdmin, handle(async (req) => {
            if (!mongoose.isValidObjectId(req.params.id)) fail("bad_request", "That id isn't valid.");
            return T.moderateIdea(req.user, req.origin, req.params.id, String(req.body?.status || ""));
        }));
}
