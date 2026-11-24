import mongoose from "mongoose";
import { mongooseModel } from "../utils/index.js";

// Manual points adjustment from the super admin console (spec module 6). Positive adds points, negative takes them
// away. Above the brand's four-eyes amount it waits for a second admin (status pending) and only counts in the
// ledger once approved. Requester and approver are MADP admin ids.
export default mongooseModel(
    "PointsAdjustment",
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        points: { type: Number, required: true },
        reasonCode: { type: String, required: true, trim: true, lowercase: true },
        note: { type: String, trim: true, maxlength: 500 },
        status: { type: String, enum: ["pending", "applied", "rejected"], required: true },
        requestedBy: { type: String, required: true },
        decidedBy: { type: String },
        decidedAt: { type: Date },
        decisionNote: { type: String, trim: true, maxlength: 500 },
    },
    [[{ origin: 1, status: 1, createdAt: -1 }], [{ user: 1, origin: 1 }]],
);
