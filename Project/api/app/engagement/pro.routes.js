// Phase 5: Professionals (b2b members only; others get 403).
//  GET  /pro/studies                    premium studies matched on the member's industry + seniority answers
//  GET  /pro/expertise                  expertise score, its parts, the expert badge and verification status
//  POST /pro/verification               {linkedin?, workEmail?, jobTitle?}  ask to be verified
//  GET  /pro/statements                 monthly earnings totals (last 24 months)
//  GET  /pro/statements/:month          one month's entries;  /pro/statements/:month.html  printable statement
//  GET  /pro/receipts/:id.html          printable payout receipt for a reward that has been sent
//  admin
//  GET  /admin/verifications?status=    POST /admin/verifications/:id {status: verified|declined, note?, adminNote?}
import mongoose from "mongoose";
import { ExpertVerification } from "../model/index.js";
import * as P from "./pro.js";
import { handle, fail, limit, requireAdmin, clean } from "./http.js";

const html = (fn) => handle(async (req, res) => {
    const out = await fn(req);
    res.set({ "Cache-Control": "no-store", "X-Robots-Tag": "noindex", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; form-action 'none'" });
    res.type("html").send(out);
});

export function mount(router) {
    router
        .get("/pro/studies", handle(async (req) => P.premiumStudies(req.user, req.origin)))
        .get("/pro/expertise", handle(async (req) => P.expertise(req.user, req.origin)))
        .post("/pro/verification", limit(5, 60), handle(async (req) => P.requestVerification(req.user, req.origin, clean(req.body) || {})))
        .get("/pro/statements", handle(async (req) => P.statements(req.user, req.origin)))
        .get(/^\/pro\/statements\/(\d{4}-\d{2})\.html$/, html(async (req) => P.statementHtml(req.user, req.origin, req.params[0])))
        .get("/pro/statements/:month", handle(async (req) => P.statementMonth(req.user, req.origin, req.params.month)))
        .get(/^\/pro\/receipts\/([a-f0-9]{24})\.html$/, html(async (req) => P.receiptHtml(req.user, req.origin, req.params[0])));

    router
        .get("/admin/verifications", requireAdmin, handle(async (req) => {
            const q = { origin: req.origin, isDeleted: false };
            if (req.query.status) q.status = String(req.query.status);
            return ExpertVerification.find(q).select("+workEmail +adminNote").populate({ path: "user", select: "name mail category" }).sort({ createdAt: 1 }).limit(200).lean();
        }))
        .post("/admin/verifications/:id", requireAdmin, handle(async (req) => {
            if (!mongoose.isValidObjectId(req.params.id)) fail("bad_request", "That id isn't valid.");
            return P.decideVerification(req.user, req.origin, req.params.id, clean(req.body) || {});
        }));
}
