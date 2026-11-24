import mongoose from "mongoose";
import { mongooseModel } from "../utils/index.js";

// A portal message from the team to members (super admin spec, step 3b). It shows in the member's bell and Messages
// page (GET /api/v1/alerts); it is never e-mailed. Recipients are fixed when it is sent (MessageReceipt rows).
export default mongooseModel(
    "AdminMessage",
    {
        title: { type: String, required: true, trim: true, maxlength: 120 },
        subtitle: { type: String, trim: true, maxlength: 200 },
        body: { type: String, required: true, maxlength: 4000 },
        cta: { type: String, trim: true, maxlength: 300 },
        ctaLabel: { type: String, trim: true, maxlength: 60 },
        filter: { type: mongoose.Schema.Types.Mixed, default: {} },
        status: { type: String, enum: ["draft", "sent", "withdrawn"], default: "draft" },
        recipients: { type: Number, default: 0 },
        sentAt: Date,
        withdrawnAt: Date,
        createdBy: { type: String, required: true },
        sentBy: String,
    },
    [[{ origin: 1, status: 1, createdAt: -1 }]],
);
