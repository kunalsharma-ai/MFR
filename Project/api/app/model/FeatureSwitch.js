import { mongooseModel } from "../utils/index.js";

// A per-brand on/off switch set from the MADP super admin console (step 4). One row per brand and key. With no row,
// the engagement config default applies (every money, legal and email feature is off by default). The "kill" row,
// when on, forces every switch of the brand off at once. Only MADP's Super Admin can change these.
export default mongooseModel(
    "FeatureSwitch",
    {
        key: { type: String, required: true, trim: true },
        on: { type: Boolean, required: true },
        reason: { type: String, trim: true, maxlength: 500 },
        changedBy: { type: String },
        history: [{ on: Boolean, reason: String, by: String, at: { type: Date, default: Date.now }, _id: false }],
    },
    [[{ origin: 1, key: 1 }, { unique: true }]]
);
