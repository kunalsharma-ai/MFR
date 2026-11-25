import mongoose from "mongoose";
import { mongooseModel } from "../utils/index.js";

// "Log in as member" from the MADP console. MADP asks for a ticket (admin/memberactions.js); the admin opens the
// one-use link on the member site within REDEEM minutes, and gets a member session that ends 15 minutes after the
// ticket was issued. Only a SHA-256 hash of the ticket is stored. The session token names this row (claim adm.sid), so
// every request checks it is still open, and MADP can end it early.
export default mongooseModel(
    "AdminSession",
    {
        hash: { type: String, required: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        actor: { type: String, required: true },
        reason: { type: String, required: true, trim: true },
        redeemBy: { type: Date, required: true },
        expiresAt: { type: Date, required: true },
        usedAt: Date,
        endedAt: Date,
        endedBy: String,
    },
    [
        [{ hash: 1 }, { unique: true }],
        [{ origin: 1, user: 1, createdAt: -1 }],
        // kept 30 days after they end, then deleted (MADP holds the audit trail)
        [{ expiresAt: 1 }, { expireAfterSeconds: 30 * 24 * 3600 }],
    ]
);
