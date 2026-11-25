import mongoose from "mongoose";
import { mongooseModel } from "../utils/index.js";

// One merge of a duplicate member account into another (admin/merge.js). `moved` lists, per collection, the ids of
// the rows that moved, so the merge can be undone exactly; `stayed` counts the rows the kept account already had.
export default mongooseModel(
    "MemberMerge",
    {
        keep: { type: mongoose.Schema.Types.ObjectId, required: true },
        duplicate: { type: mongoose.Schema.Types.ObjectId, required: true },
        reason: { type: String, required: true, maxlength: 500 },
        actor: String,
        previousStatus: { type: String, default: null },
        moved: { type: mongoose.Schema.Types.Mixed, default: {} },
        stayed: { type: mongoose.Schema.Types.Mixed, default: {} },
        referrals: { type: [mongoose.Schema.Types.ObjectId], default: [] },
        undoneAt: { type: Date, default: null },
        undoneBy: String,
        undoReason: String,
    },
    [[{ origin: 1, keep: 1 }], [{ origin: 1, duplicate: 1 }]],
);
