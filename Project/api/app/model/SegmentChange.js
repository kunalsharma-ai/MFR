import mongoose from "mongoose";
import { mongooseModel } from "../utils/index.js";

// Segment change log (super admin spec, Members module): every move between Consumer, Business Professional and the
// other adult segments, with who asked for it and why. Answers are kept across the move.
export default mongooseModel(
    "SegmentChange",
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        from: { type: String, required: true },
        to: { type: String, required: true },
        reason: { type: String, required: true },
        // MADP admin id
        actor: { type: String, required: true },
    },
    [[{ user: 1, origin: 1, createdAt: -1 }]],
);
