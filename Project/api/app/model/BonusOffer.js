import { mongooseModel } from "../utils/index.js";

// A limited-time points multiplier on surveys finished between startsAt and endsAt (admin-made). The extra points are
// paid as a separate "bonus" ledger entry; the survey's own points never change. Added Nov 2026.
export default mongooseModel(
    "BonusOffer",
    {
        title: { type: String, required: true, trim: true, maxlength: 80 },
        description: { type: String, trim: true, maxlength: 300 },
        multiplier: { type: Number, required: true, min: 1, max: 5 },
        startsAt: { type: Date, required: true },
        endsAt: { type: Date, required: true },
        audience: [{ type: String, enum: ["consumer", "professional", "teen"] }],
    },
    [[{ startsAt: 1, endsAt: 1 }]]
);
