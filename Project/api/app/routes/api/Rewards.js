import express from "express";
import { Reward as rewardController } from "../../controller/index.js";
import { expressRoute } from "../../utils/index.js";
import { settleProfiles } from "../../member/profileCredit.js";

// /api/v1/rewards (signed-in members only). Always the signed-in member's own rewards; a `user` in the body is ignored.
const router = express.Router();
router
    .route("/")
    // the member's ledger: completed surveys and paid profiles, newest first
    .post(expressRoute(
        async (req) => { await settleProfiles(req); return { message: "", data: await rewardController.ledger() }; },
        rewardController
    ))
    .get(expressRoute(
        async (req) => { await settleProfiles(req); return { message: "", data: await rewardController.ledger() }; },
        rewardController
    ))
    // pay a completed profile once: { remarks: "... [profile:<slug>]", name? }
    .put(expressRoute(
        async (req) => ({ message: "Reward added", data: await rewardController.creditProfile(req.body) }),
        rewardController
    ));
export default router;
