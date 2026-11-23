import { mongooseModel } from "../utils/index.js";

// A reward members can redeem points for. Managed by admins (/api/v1/engagement/admin/catalogue). While the collection
// is empty the member area shows config.rewards.defaultCatalogue (placeholders). Added Nov 2026.
export default mongooseModel(
    "CatalogueItem",
    {
        key: { type: String, required: true, trim: true, lowercase: true },
        kind: { type: String, enum: ["giftcard", "upi", "paypal", "charity", "learning"], required: true },
        title: { type: String, required: true, trim: true, maxlength: 80 },
        subtitle: { type: String, trim: true, maxlength: 120 },
        description: { type: String, trim: true, maxlength: 1000 },
        image: { type: String, trim: true },
        points: { type: Number, required: true, min: 1 },
        value: { type: Number, min: 0 },              // in config.points.currency
        audience: [{ type: String, enum: ["consumer", "professional", "teen"] }],
        countries: [{ type: String, lowercase: true, trim: true }], // empty = everywhere
        availableUntil: Date,
        sortOrder: { type: Number, default: 0 },
    },
    [[{ key: 1, origin: 1 }, { unique: true }]]
);
