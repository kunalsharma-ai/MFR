import mongoose from "mongoose";
import { mongooseModel } from "../utils/index.js";

// Evidence of each consent given in the Teen registration: who, which statement texts, which version, when.
// Written once, never updated (a withdrawal is a new record).
export default mongooseModel(
    "TeenConsent",
    {
        registration: { type: mongoose.Schema.Types.ObjectId, ref: "TeenRegistration", required: true },
        reference: { type: String, required: true },
        party: { type: String, enum: ["teen", "guardian"], required: true },
        guardian: { type: mongoose.Schema.Types.ObjectId, ref: "TeenGuardian" },
        version: { type: String, required: true },
        statements: [{ _id: false, id: String, text: String, required: Boolean, accepted: Boolean }],
        sectionsRead: [Number],
        acceptedAt: { type: Date, required: true },
        ip: { type: String, select: false },
        userAgent: { type: String, select: false },
        language: String
    },
    [[{ registration: 1, party: 1 }]]
);
