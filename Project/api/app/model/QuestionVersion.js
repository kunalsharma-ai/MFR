import mongoose from "mongoose";
import { mongooseModel } from "../utils/index.js";

// Question bank versions (super admin spec, module 3): draft -> review -> published. A version is a snapshot of the
// brand's bank (Profile, Question and Option rows, gzip + base64) with the diff from the last published version.
// Answers stay linked to the question key, never to a version.
export default mongooseModel(
    "QuestionVersion",
    {
        number: { type: Number, required: true },
        status: { type: String, enum: ["draft", "review", "published", "discarded"], default: "draft" },
        note: { type: String, trim: true },
        counts: { type: mongoose.Schema.Types.Mixed },
        diff: { type: mongoose.Schema.Types.Mixed },
        snapshot: { type: String, select: false },
        // MADP admin ids
        createdBy: { type: String, required: true },
        reviewRequestedBy: { type: String },
        publishedBy: { type: String },
        publishedAt: { type: Date },
    },
    [[{ origin: 1, number: 1 }, { unique: true }]],
);
