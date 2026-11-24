import { mongooseModel } from "../utils/index.js";

// A prize machine (super admin spec, module 7): one per brand and segment. The skin is fixed by the segment: claw for
// Consumer, lift for Professional, spiral for Teen. Admins set the prizes and their odds (weights), how many plays a
// member gets per day and the countries where legal has cleared it. Members only see it while the brand's
// prize_machines switch (legal) is on for them, the machine is live and their country is listed.
// Teen prizes are never points or money: only a badge or "try again".
export default mongooseModel(
    "PrizeMachine",
    {
        segment: { type: String, required: true, enum: ["consumer", "professional", "teen"] },
        title: { type: String, required: true, trim: true, maxlength: 80 },
        status: { type: String, enum: ["draft", "live", "paused"], default: "draft" },
        dailyPlays: { type: Number, default: 1, min: 1, max: 10 },
        countries: [{ type: String, lowercase: true, trim: true }], // empty = nowhere
        prizes: [{
            key: { type: String, required: true },
            label: { type: String, required: true, trim: true, maxlength: 80 },
            kind: { type: String, enum: ["points", "badge", "nothing"], required: true },
            points: { type: Number, default: 0, min: 0 },
            weight: { type: Number, required: true, min: 0 }, // odds = weight / sum of weights
            _id: false,
        }],
        reason: { type: String, trim: true, maxlength: 500 },
        changedBy: { type: String },
    },
    [[{ origin: 1, segment: 1 }, { unique: true }]]
);
