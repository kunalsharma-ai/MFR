import mongoose from "mongoose";
import { mongooseModel } from "../utils/index.js";

// One row per member per day (in the member's own time zone) on which they did something that counts for their
// streak: answered the daily poll, finished a survey or a profile, or (Teens) a creative task. Added Nov 2026.
export default mongooseModel(
    "StreakDay",
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        day: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
        sources: [{ type: String, trim: true }],
    },
    [
        [{ user: 1, day: 1, origin: 1 }, { unique: true }],
    ]
);
