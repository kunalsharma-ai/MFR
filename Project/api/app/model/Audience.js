import mongoose from "mongoose";
import { mongooseModel } from "../utils/index.js";

// Saved member filter (super admin spec module 2) with its last count. Used by surveys, offers, tasks, messages and
// exports. Archived, suspended and banned members never match.
export default mongooseModel(
    "Audience",
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, trim: true },
        filter: { type: mongoose.Schema.Types.Mixed, required: true },
        lastCount: { type: Number },
        lastCountAt: { type: Date },
        createdBy: { type: String, required: true },
        updatedBy: { type: String },
    },
    [[{ origin: 1, name: 1 }, { unique: true }]],
);
