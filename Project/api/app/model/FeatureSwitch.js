import { mongooseModel } from "../utils/index.js";

// A feature switch set from the MADP super admin console (step 4). One row per brand, key, segment and country: a row
// with no segment and no country is for the whole brand, the others narrow it (see engagement/switches.js for the
// order). With no row, the engagement config default applies. The "kill" row (whole brand only), when on, forces
// every switch of the brand off at once. Only MADP's Super Admin can change these.
//
// The unique index was (origin, key) before segment and country were added. On a database created before that, run
// `node app/scripts/feature-switch-index.js` once to drop the old index (it only drops it, it changes no rows).
export default mongooseModel(
    "FeatureSwitch",
    {
        key: { type: String, required: true, trim: true },
        segment: { type: String, trim: true, lowercase: true, default: null }, // consumer | professional | teen
        country: { type: String, trim: true, lowercase: true, default: null },
        on: { type: Boolean, required: true },
        value: { type: Number, default: null }, // e.g. hold days, weekend multiplier
        since: { type: Date, default: null }, // when it last went from off to on
        reason: { type: String, trim: true, maxlength: 500 },
        changedBy: { type: String },
        history: [{ on: Boolean, value: Number, reason: String, by: String, at: { type: Date, default: Date.now }, _id: false }],
    },
    [[{ origin: 1, key: 1, segment: 1, country: 1 }, { unique: true, name: "origin_key_segment_country" }]]
);
