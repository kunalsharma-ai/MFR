import mongoose from "mongoose";
import { mongooseModel } from "../utils/index.js";

// Points paid to a member outside a survey response, e.g. for completing a profile.
// `key` makes a payment happen once per member (e.g. "profile:home-and-pet-ownership").
export default mongooseModel(
    "Reward",
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        category: { type: String, trim: true, lowercase: true, default: "profile" },
        key: { type: String, trim: true, lowercase: true, required: true },
        name: { type: String, trim: true },
        points: { type: Number, required: true, min: 0, default: 0 },
        remarks: { type: String, trim: true },
    },
    [
        [
            { user: 1, key: 1, origin: 1 },
            { unique: true }
        ]
    ]
);
