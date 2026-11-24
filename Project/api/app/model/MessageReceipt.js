import mongoose from "mongoose";
import { mongooseModel } from "../utils/index.js";

// One member's copy of a portal message, and when they read it.
export default mongooseModel(
    "MessageReceipt",
    {
        message: { type: mongoose.Schema.Types.ObjectId, ref: "AdminMessage", required: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        readAt: { type: Date, default: null },
    },
    [[{ message: 1, user: 1 }, { unique: true }], [{ user: 1, origin: 1, createdAt: -1 }]],
);
