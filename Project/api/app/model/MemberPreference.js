import mongoose from "mongoose";
import { mongooseModel } from "../utils/index.js";

// A member's engagement preferences, kept apart from the User record so nothing on User changes shape.
// Created on first save; a member without a row gets the defaults below. Added Nov 2026.
export default mongooseModel(
    "MemberPreference",
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        // what to invite the member to
        survey: {
            topics: [{ type: String, trim: true, lowercase: true }],
            bestTimes: [{ type: String, enum: ["morning", "afternoon", "evening", "night"] }],
            invitesPerWeek: { type: Number, min: 0, max: 50, default: null }, // null = no limit chosen
        },
        // how to reach the member
        notifications: {
            email: { type: Boolean, default: true },
            push: { type: Boolean, default: false },
            whatsapp: { type: Boolean, default: false },
            weeklySummary: { type: Boolean, default: true },
            expiryReminders: { type: Boolean, default: true },
            newSurvey: { type: Boolean, default: true },
            quietHours: {
                enabled: { type: Boolean, default: false },
                start: { type: String, default: "22:00", match: /^\d{2}:\d{2}$/ },
                end: { type: String, default: "08:00", match: /^\d{2}:\d{2}$/ },
            },
        },
        // referral leaderboard: off unless the member opts in, and then only a first name + initial is shown
        leaderboard: { optIn: { type: Boolean, default: false } },
        // the reward the member is saving for (Rewards page goal)
        goal: {
            item: { type: String, trim: true },
            points: { type: Number, min: 0 },
            setAt: Date,
            reachedAt: Date,
        },
        lastWeeklySummaryAt: Date,
        expiryReminders: [{ key: String, at: Date }],
    },
    [
        [{ user: 1, origin: 1 }, { unique: true }],
    ]
);
