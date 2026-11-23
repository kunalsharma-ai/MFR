import mongoose from "mongoose";
import { mongooseModel } from "../utils/index.js";

// A member's request to spend points on a catalogue reward. The points are held from the moment of the request (the
// ledger shows it as a negative "redemption" entry) and come back automatically if it is rejected or cancelled.
// `open` is true while it waits for a decision: a member can have only one open request at a time (unique index), so
// two quick clicks can't spend the same points twice. Added Nov 2026.
export default mongooseModel(
    "Redemption",
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        reference: { type: String, required: true },
        item: { key: String, kind: String, title: String, subtitle: String, value: Number, currency: String },
        points: { type: Number, required: true, min: 1 },
        status: { type: String, enum: ["requested", "guardian_pending", "approved", "fulfilled", "rejected", "cancelled"], default: "requested" },
        open: { type: Boolean, default: true },
        // where it goes, masked for display (the full destination is kept for the team, never sent back to the browser)
        payout: { method: String, destination: { type: String, select: false }, masked: String },
        guardian: { decision: { type: String, enum: ["yes", "no", null], default: null }, at: Date },
        note: { type: String, trim: true, maxlength: 300 },          // shown to the member
        adminNote: { type: String, trim: true, maxlength: 1000, select: false },
        providerRef: { type: String, select: false },
        history: [{ status: String, at: { type: Date, default: Date.now }, by: String, _id: false }],
        fulfilledAt: Date,
    },
    [
        [{ reference: 1 }, { unique: true }],
        [{ user: 1, origin: 1 }, { unique: true, partialFilterExpression: { open: true } }],
        [{ status: 1, createdAt: 1 }],
    ]
);
