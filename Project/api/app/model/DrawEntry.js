import mongoose from "mongoose";
import { mongooseModel } from "../utils/index.js";

// Tickets a member bought in a PrizeDraw. Their points show in the ledger as a negative "draw" entry; a cancelled
// draw returns them (the ledger skips entries of cancelled draws).
export default mongooseModel(
    "DrawEntry",
    {
        draw: { type: mongoose.Schema.Types.ObjectId, ref: "PrizeDraw", required: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        tickets: { type: Number, required: true, min: 1 },
        points: { type: Number, required: true, min: 1 },
    },
    [[{ draw: 1, user: 1, origin: 1 }, { unique: true }]]
);
