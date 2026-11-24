import mongoose from "mongoose";
import { mongooseModel } from "../utils/index.js";

// Help centre entries edited in the super admin console (step 3b). The member Help centre shows the published ones
// next to the built-in content. body is a list of blocks: a string is a paragraph, { ul: [...] } a list,
// { ol: [...] } steps, { note: "..." } a tip. types limits an entry to consumer / professional / teen; empty = all.
export default mongooseModel(
    "HelpArticle",
    {
        slug: { type: String, required: true, trim: true, lowercase: true },
        kind: { type: String, enum: ["faq"], default: "faq" },
        topic: { type: String, required: true, trim: true, lowercase: true },
        title: { type: String, required: true, trim: true, maxlength: 200 },
        body: { type: [mongoose.Schema.Types.Mixed], default: [] },
        keywords: [{ type: String, trim: true, lowercase: true }],
        types: [{ type: String, enum: ["consumer", "professional", "teen"] }],
        status: { type: String, enum: ["draft", "published", "archived"], default: "draft" },
        createdBy: String,
        updatedBy: String,
        publishedAt: Date,
    },
    [[{ origin: 1, slug: 1 }, { unique: true }]],
);
