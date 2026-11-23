import mongoose from "mongoose";
import { mongooseModel } from "../utils/index.js";

// The member's quality score as it stood in a month (Nov 2026), for the monthly trend on the Quality page.
// Written when the member (or a job) reads their score; User.qualityScore itself is never changed by this.
export default mongooseModel(
    "QualitySnapshot",
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        month: { type: String, required: true, match: /^\d{4}-\d{2}$/ },
        score: { type: Number, required: true },  // the latest score seen in that month
        first: { type: Number },                  // the first score seen in that month
    },
    [[{ user: 1, month: 1, origin: 1 }, { unique: true }]]
);
