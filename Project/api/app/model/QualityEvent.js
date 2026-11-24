import mongoose from "mongoose";
import { mongooseModel } from "../utils/index.js";

// A logged change to a member's quality score (spec module 9): which rule moved it, by how much, from what to what,
// and who. User.qualityScore stays the score itself.
export default mongooseModel(
    "QualityEvent",
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        rule: { type: String, required: true, trim: true, lowercase: true },
        delta: { type: Number, required: true },
        from: { type: Number, required: true },
        to: { type: Number, required: true },
        note: { type: String, trim: true, maxlength: 500 },
        survey: { type: String, trim: true },
        actor: { type: String, required: true },
    },
    [[{ user: 1, origin: 1, createdAt: -1 }]],
);
