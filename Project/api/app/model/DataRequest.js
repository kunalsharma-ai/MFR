import mongoose from "mongoose";
import { mongooseModel } from "../utils/index.js";

// A member's request to delete their account and data (Nov 2026). Nothing is deleted by the code: the team reviews
// each request (open payouts, legal hold, Teen guardian) and carries it out by hand, then marks it done.
export default mongooseModel(
    "DataRequest",
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        kind: { type: String, enum: ["delete"], default: "delete" },
        status: { type: String, enum: ["requested", "approved", "rejected", "done", "cancelled"], default: "requested" },
        reason: { type: String, trim: true, maxlength: 500 },
        open: { type: Boolean, default: true },
        note: { type: String, trim: true, maxlength: 300 },           // shown to the member
        adminNote: { type: String, trim: true, maxlength: 1000, select: false },
        history: [{ status: String, at: { type: Date, default: Date.now }, by: String, _id: false }],
    },
    [[{ user: 1, kind: 1, origin: 1 }, { unique: true, partialFilterExpression: { open: true } }], [{ status: 1, createdAt: 1 }]]
);
