import mongoose from "mongoose";
import { mongooseModel } from "../utils/index.js";

// A Professional's request to be shown as a verified expert (Nov 2026). The member gives evidence (a LinkedIn
// profile and/or a work email); the team checks it by hand and approves or declines. One record per member.
export default mongooseModel(
    "ExpertVerification",
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        status: { type: String, enum: ["requested", "verified", "declined"], default: "requested" },
        linkedin: { type: String, trim: true, maxlength: 300 },
        workEmail: { type: String, trim: true, lowercase: true, maxlength: 200, select: false },
        workDomain: { type: String, trim: true, lowercase: true, maxlength: 120 },
        jobTitle: { type: String, trim: true, maxlength: 120 },
        note: { type: String, trim: true, maxlength: 300 },       // shown to the member when declined
        adminNote: { type: String, trim: true, maxlength: 500, select: false },
        decidedAt: Date,
        decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        history: [{ status: String, at: { type: Date, default: Date.now }, by: String, _id: false }],
    },
    [[{ user: 1, origin: 1 }, { unique: true }], [{ status: 1, createdAt: 1 }]]
);
