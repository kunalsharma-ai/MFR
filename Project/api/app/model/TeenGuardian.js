import mongoose from "mongoose";
import { mongooseModel } from "../utils/index.js";

// The parent or legal guardian of a Teen Panel member. Kept apart from the teen's User record (and from the member
// routes) so guardian details are never mixed with, or served alongside, the teen's own profile.
export default mongooseModel(
    "TeenGuardian",
    {
        relation: { type: String, enum: ["mother", "father", "legal_guardian"], required: true },
        name: { first: { type: String, trim: true }, middle: { type: String, trim: true }, last: { type: String, trim: true } },
        dob: Date,
        gender: String,
        email: { type: String, lowercase: true, trim: true, required: true },
        phone: String,                       // E.164 digits, optional
        // Module 1 answers (parent onboarding), stored under the questionnaire's own keys (P01...P12, HQ1...)
        onboarding: {
            answers: { type: mongoose.Schema.Types.Mixed, select: false },
            draftAt: Date,
            submittedAt: Date,
            healthSkipped: Boolean
        },
        verification: {
            method: { type: String, default: "email-link" },   // the invitation link proves control of the inbox
            emailVerifiedAt: Date,
            authority: String                                   // P04 answer: yes | no | unsure
        }
    },
    [[{ email: 1, origin: 1 }]]
);
