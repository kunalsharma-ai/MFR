import mongoose from "mongoose";
import { mongooseModel } from "../utils/index.js";

// An admin's hold on one ledger entry (a survey response or a reward) while it is reviewed, e.g. a suspected
// speeder. The entry itself is never changed: while an active hold exists the ledger shows it as "on hold" and its
// points cannot be spent. Releasing the hold (releasedAt) clears it again. Added Nov 2026, additive only.
export default mongooseModel(
    "PointsHold",
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        source: { type: String, enum: ["survey", "reward"], required: true },
        entry: { type: mongoose.Schema.Types.ObjectId, required: true },
        reason: { type: String, trim: true, maxlength: 500 },
        // shown to the member; never the internal reason
        memberNote: { type: String, trim: true, maxlength: 200 },
        expectedBy: Date,
        releasedAt: Date,
        outcome: { type: String, enum: ["released", "reversed", null], default: null },
    },
    [
        [{ user: 1, releasedAt: 1 }],
        [{ entry: 1, source: 1, origin: 1 }],
    ]
);
