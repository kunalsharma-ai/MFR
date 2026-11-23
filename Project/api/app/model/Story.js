import { mongooseModel } from "../utils/index.js";

// Admin-written content shown in the member area (Nov 2026):
//   story    "Your opinion mattered": a product or service that changed because of survey answers
//   insight  an anonymised industry insight report shared back with Professionals (phase 5)
// Never contains anything about an individual member; figures are aggregates only.
export default mongooseModel(
    "Story",
    {
        type: { type: String, enum: ["story", "insight"], required: true },
        title: { type: String, required: true, trim: true, maxlength: 140 },
        summary: { type: String, trim: true, maxlength: 400 },
        body: { type: String, trim: true, maxlength: 8000 },
        image: { type: String, trim: true },
        brand: { type: String, trim: true, maxlength: 80 },          // optional: only with the client's permission
        stats: [{ label: { type: String, maxlength: 80 }, value: { type: String, maxlength: 40 }, _id: false }],
        audience: [{ type: String, enum: ["consumer", "professional", "teen"] }],
        industries: [{ type: String, trim: true, lowercase: true }], // insights: who it is for
        sampleSize: Number,                                          // insights: respondents behind the figures
        fileUrl: { type: String, trim: true },                       // insights: the full report (PDF)
        publishedAt: Date,
    },
    [[{ type: 1, publishedAt: -1, origin: 1 }]]
);
