// Phase 7: My Account extras, privacy centre, push, guardian tab.
//  GET  /account/summary             profile strength, anniversary, lifetime stats, identity + payout in one place
//  GET  /privacy/export              download my data (JSON file)
//  GET  /privacy/requests            my delete requests     POST /privacy/delete {reason?}   POST /privacy/delete/cancel
//  POST /push/subscribe {subscription}   POST /push/unsubscribe {endpoint}   (409 until push is set up)
//  GET  /teen/guardian               Teen: my parent or guardian (masked) and what they approve
//  admin
//  GET  /admin/data-requests?status=   POST /admin/data-requests/:id {status: approved|rejected|done, note?, adminNote?}
import mongoose from "mongoose";
import { DataRequest } from "../model/index.js";
import * as A from "./account.js";
import { handle, fail, limit, requireAdmin, clean } from "./http.js";

export function mount(router) {
    router
        .get("/account/summary", handle(async (req) => A.summary(req.user, req.origin)))
        .get("/privacy/export", limit(5, 60), handle(async (req, res) => {
            const data = await A.exportData(req.user, req.origin);
            res.set({ "Cache-Control": "no-store", "Content-Disposition": `attachment; filename="myfrequentrewards-my-data-${new Date().toISOString().slice(0, 10)}.json"` });
            res.type("application/json").send(JSON.stringify(data, null, 2));
        }))
        .get("/privacy/requests", handle(async (req) => A.myRequests(req.user, req.origin)))
        .post("/privacy/delete", limit(3, 60), handle(async (req) => A.requestDelete(req.user, req.origin, req.body?.reason)))
        .post("/privacy/delete/cancel", limit(10, 60), handle(async (req) => A.cancelDelete(req.user, req.origin)))
        .post("/push/subscribe", limit(10, 10), handle(async (req) => A.subscribe(req.user, req.origin, clean(req.body?.subscription) || {}, req.headers["user-agent"])))
        .post("/push/unsubscribe", limit(10, 10), handle(async (req) => A.unsubscribe(req.user, req.origin, req.body?.endpoint)))
        .get("/teen/guardian", handle(async (req) => A.guardianInfo(req.user, req.origin)));

    router
        .get("/admin/data-requests", requireAdmin, handle(async (req) => {
            const q = { origin: req.origin };
            if (req.query.status) q.status = String(req.query.status);
            return DataRequest.find(q).select("+adminNote").populate({ path: "user", select: "name mail category" }).sort({ createdAt: 1 }).limit(200).lean();
        }))
        .post("/admin/data-requests/:id", requireAdmin, handle(async (req) => {
            if (!mongoose.isValidObjectId(req.params.id)) fail("bad_request", "That id isn't valid.");
            return A.adminDecide(req.user, req.origin, req.params.id, clean(req.body) || {});
        }));
}
