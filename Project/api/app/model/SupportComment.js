import mongoose from "mongoose";
import { mongooseModel } from "../utils/index.js";

export default mongooseModel(
    "SupportComment",
    {
        ticketNo: {
            type: String,
            trim: true
        },
        type: {
            type: String,
            trim: true,
            lowercase: true
        },
        message: {
            type: String
        },
        // Nov 2026, super admin console: who wrote it when it came from the console ("agent"); a "note" is internal
        // and never shown to the member
        author: {
            kind: { type: String, enum: ["agent", "member", null], default: null },
            name: { type: String, trim: true },
            actor: { type: String, select: false },
        },
        attachments: [{
            type: String
        }]
    }
)