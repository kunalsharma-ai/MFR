import mongoose from "mongoose";
import { mongooseModel } from "../utils/index.js";

// Secure links for the Teen registration. Only a SHA-256 hash of the token is stored: the link itself exists only in
// the email. purpose: guardian (YES/NO + onboarding + consent), password (teen sets a password), status (the teen's
// own "where is my registration" view), verify (the link in the teen's first email: opening it confirms their email).
export default mongooseModel(
    "TeenToken",
    {
        hash: { type: String, required: true },
        purpose: { type: String, enum: ["guardian", "password", "status", "verify"], required: true },
        registration: { type: mongoose.Schema.Types.ObjectId, ref: "TeenRegistration", required: true },
        expiresAt: { type: Date, required: true },
        usedAt: Date,
        revokedAt: Date
    },
    [
        [{ hash: 1 }, { unique: true }],
        [{ registration: 1, purpose: 1 }],
        // tokens are deleted 30 days after they lapse (kept a while so an old link can say "expired" instead of "invalid")
        [{ expiresAt: 1 }, { expireAfterSeconds: 30 * 24 * 3600 }]
    ]
);
