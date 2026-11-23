import mongoose from "mongoose";
import { mongooseModel } from "../utils/index.js";

// A browser's Web Push subscription for a member (Nov 2026). Push is OFF until config.push is set up.
export default mongooseModel(
    "PushSubscription",
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        endpoint: { type: String, required: true, maxlength: 1000 },
        keys: { p256dh: { type: String, maxlength: 200 }, auth: { type: String, maxlength: 100 } },
        ua: { type: String, maxlength: 300 },
        lastOkAt: Date,
        failures: { type: Number, default: 0 },
    },
    [[{ endpoint: 1 }, { unique: true }], [{ user: 1, origin: 1 }]]
);
