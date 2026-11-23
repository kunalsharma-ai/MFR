// /api/v1/engagement - member engagement (Nov 2026): points ledger, streaks, preferences and the features built on
// them. Every route needs a signed-in member; /admin/* also needs an admin role (read fresh from the database).
// Each area adds its routes in its own app/engagement/*.routes.js file.
import express from "express";
import { isAuthenticated } from "../../utils/index.js";
import * as points from "../../engagement/points.routes.js";
import * as rewards from "../../engagement/rewards.routes.js";
import * as daily from "../../engagement/daily.routes.js";

const router = express.Router();
router.use(isAuthenticated);
points.mount(router);
rewards.mount(router);
daily.mount(router);

export default router;
