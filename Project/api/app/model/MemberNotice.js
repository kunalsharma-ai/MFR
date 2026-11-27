import mongoose from "mongoose";
import { mongooseModel } from "../utils/index.js";

// A notice for one member in their portal bell and Messages page (GET /api/v1/alerts), next to the team's messages.
// Written by the Auto reminders (engagement/reminders.js), so every reminder also shows on the dashboard.
export default mongooseModel(
    "MemberNotice",
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        kind: { type: String, required: true, trim: true }, // the reminder case, e.g. "surveys"
        title: { type: String, required: true, trim: true, maxlength: 120 },
        body: { type: String, required: true, maxlength: 1000 },
        cta: { type: String, trim: true, maxlength: 500 },
        ctaLabel: { type: String, trim: true, maxlength: 60 },
        readAt: { type: Date, default: null },
    },
    [[{ user: 1, origin: 1, createdAt: -1 }]],
);
