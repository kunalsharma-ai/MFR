import mongoose from "mongoose";
import { mongooseModel } from "../utils/index.js";

// Monthly points prize draw. BUILT BUT OFF (config.drawEnabled): Kunal chose on 23 Nov 2026 to keep it off until
// legal confirms it is allowed in each country. Never offered to Teens. Tickets cost points (a "draw" ledger entry).
export default mongooseModel(
    "PrizeDraw",
    {
        month: { type: String, required: true, match: /^\d{4}-\d{2}$/ },
        title: { type: String, required: true, trim: true, maxlength: 120 },
        prize: { type: String, required: true, trim: true, maxlength: 300 },
        ticketPoints: { type: Number, required: true, min: 1 },
        maxTicketsPerMember: { type: Number, default: 10, min: 1 },
        winners: { type: Number, default: 1, min: 1 },
        countries: [{ type: String, lowercase: true, trim: true }], // where legal has cleared it; empty = nowhere
        closesAt: { type: Date, required: true },
        rulesUrl: { type: String, trim: true }, // the official rules page, written and approved by legal
        status: { type: String, enum: ["open", "drawn", "cancelled"], default: "open" },
        result: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, at: Date, _id: false }],
        seed: { type: String, select: false }, // the random seed used for the draw, kept for audit
    },
    [[{ month: 1, origin: 1 }, { unique: true }]]
);
