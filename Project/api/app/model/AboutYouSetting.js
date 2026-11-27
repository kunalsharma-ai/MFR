import { mongooseModel } from "../utils/index.js";

// Which "About You" profiles a member must finish before surveys and the other profiles open, set from the MADP
// console (Profiles > About You lock). One row per brand. With no row the brand uses the default list in
// member/aboutYou.js (T2O's four: Basic, Educational, Finance, Health).
//
// groups: the About You profiles in order. Each group lists the profile slugs that count for it; the first slug the
//         member's category has is used (so "finance" and "financial" can both mean the Finance profile).
// byCategory: { <profile category, e.g. b2c, b2b, minor>: groups } for a category that needs its own list. An empty
//         list for a category means nothing is locked for it.
export default mongooseModel(
    "AboutYouSetting",
    {
        groups: { type: [[String]], default: undefined },
        byCategory: { type: Object, default: {} },
        updatedBy: { type: String },
        reason: { type: String, trim: true, maxlength: 500 },
        history: [{ groups: [[String]], byCategory: Object, by: String, reason: String, at: { type: Date, default: Date.now }, _id: false }],
    },
    [[{ origin: 1 }, { unique: true, name: "origin_unique" }]]
);
