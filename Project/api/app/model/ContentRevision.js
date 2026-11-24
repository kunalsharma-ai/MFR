import mongoose from "mongoose";
import { mongooseModel } from "../utils/index.js";

// Every published version of a console page, kept for the record (what a member was shown on a given day).
export default mongooseModel(
    "ContentRevision",
    {
        page: { type: mongoose.Schema.Types.ObjectId, required: true },
        key: { type: String, required: true },
        lang: { type: String, required: true },
        kind: { type: String, required: true },
        version: { type: Number, required: true },
        title: String,
        body: { type: [mongoose.Schema.Types.Mixed], default: [] },
        editedBy: String,
        reviewRequestedBy: String,
        publishedBy: String,
        publishedAt: Date,
    },
    [[{ origin: 1, page: 1, version: 1 }, { unique: true }]],
);
