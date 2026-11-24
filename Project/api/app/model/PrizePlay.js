import mongoose from "mongoose";
import { mongooseModel } from "../utils/index.js";

// One play of a prize machine. `slot` (1..dailyPlays) with the unique index stops two quick taps from going past the
// daily limit. The prize is copied as it was when won, so later edits to the machine don't change history. A points
// prize is paid as a ledger reward with key prize:<play id>.
export default mongooseModel(
    "PrizePlay",
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        machine: { type: mongoose.Schema.Types.ObjectId, ref: "PrizeMachine", required: true },
        segment: { type: String, required: true },
        day: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ }, // member's time zone
        slot: { type: Number, required: true, min: 1 },
        prize: { key: String, label: String, kind: String, points: Number },
    },
    [[{ origin: 1, machine: 1, user: 1, day: 1, slot: 1 }, { unique: true }], [{ origin: 1, machine: 1, createdAt: -1 }]]
);
