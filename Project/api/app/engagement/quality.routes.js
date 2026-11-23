// Phase 4: quality tiers and referrals.
//  GET  /quality                 score, tier, next tier, breakdown + tips, monthly trend, surveys a higher tier opens,
//                                and `celebrate` when the score went up since the member last looked
//  POST /quality/seen            the member has seen the celebration
//  GET  /referrals               live status of each referral, invites still waiting, tiers and the next one
//  GET  /referrals/leaderboard   this month's board (opted-in members only; the member opts in via PUT /preferences)
import * as Q from "./quality.js";
import * as R from "./referrals.js";
import { reconcile } from "./ledger.js";
import { handle, limit } from "./http.js";

export function mount(router) {
    router
        .get("/quality", handle(async (req) => Q.qualityView(req.user, req.origin)))
        .post("/quality/seen", limit(30, 1), handle(async (req) => Q.markSeen(req.user, req.origin)))
        .get("/referrals", handle(async (req) => { await reconcile(req.user, req.origin); return R.referralView(req.user, req.origin); }))
        .get("/referrals/leaderboard", handle(async (req) => R.leaderboard(req.user, req.origin)));
}
