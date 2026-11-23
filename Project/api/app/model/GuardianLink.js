import mongoose from "mongoose";
import { mongooseModel } from "../utils/index.js";

// Secure links sent to a Teen's parent or guardian by the engagement features (Nov 2026). Like TeenToken, only a
// SHA-256 of the token is stored; the link exists only in the email.
//   reward  YES / NO on one learning-reward request (single use)
//   view    a read-only view of the teen's points, level, badges and activity (reusable until it expires)
export default mongooseModel(
    "GuardianLink",
    {
        hash: { type: String, required: true },
        purpose: { type: String, enum: ["reward", "view"], required: true },
        teen: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        guardian: { type: mongoose.Schema.Types.ObjectId, ref: "TeenGuardian" },
        redemption: { type: mongoose.Schema.Types.ObjectId, ref: "Redemption" },
        expiresAt: { type: Date, required: true },
        usedAt: Date,
        revokedAt: Date,
    },
    [
        [{ hash: 1 }, { unique: true }],
        [{ teen: 1, purpose: 1 }],
        [{ expiresAt: 1 }, { expireAfterSeconds: 30 * 24 * 3600 }],
    ]
);
