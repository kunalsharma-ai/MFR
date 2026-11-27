import mongoose from "mongoose";
import { mongooseModel } from "../utils/index.js";

// A member's own sign-in (issue #112, Nov 2026): one row per log in, so Settings > Privacy & security can list every
// device that is signed in and sign one out. The login token names this row (claim sid); a request with a token
// whose row has ended is refused. Only a short device label and a keyed hash of the IP address are kept, never the
// raw address. Tokens issued before this existed have no sid and keep working until they expire.
export default mongooseModel(
    "MemberSession",
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        device: { type: String, trim: true, maxlength: 80 },   // "Chrome · Windows"
        method: { type: String, trim: true, maxlength: 20 },   // password | social
        ipHash: { type: String, select: false },
        lastSeenAt: { type: Date },
        expiresAt: { type: Date, required: true },
        endedAt: Date,
        endedBy: String,                                       // member | logout | password
    },
    [
        [{ origin: 1, user: 1, createdAt: -1 }],
        // gone a day after they expire
        [{ expiresAt: 1 }, { expireAfterSeconds: 24 * 3600 }],
    ]
);
