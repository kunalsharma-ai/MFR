import mongoose from "mongoose";
import { mongooseModel } from "../utils/index.js";

// A member's answer to a Task: the poll / design option they chose, or the idea they sent. One per member per task.
// Ideas are "submitted" until a moderator approves them; only approved ideas are ever shown to anyone else.
export default mongooseModel(
    "TaskEntry",
    {
        task: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        choice: { type: String, trim: true },
        text: { type: String, trim: true, maxlength: 500 },
        status: { type: String, enum: ["submitted", "approved", "rejected"], default: "approved" },
    },
    [[{ task: 1, user: 1, origin: 1 }, { unique: true }], [{ task: 1, choice: 1 }]]
);
