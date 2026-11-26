import { mongooseModel } from "../utils/index.js";

// Auto reminder settings for one brand, set from the MADP console (Auto reminders screen). One row per brand. Each
// case has its own on/off, how many days between two reminders, and how many reminders at most while the case lasts.
// With no row, the brand keeps the old fixed sign-up reminder timing (config.emails.lifecycle). See
// engagement/reminders.js.
export default mongooseModel(
    "ReminderSetting",
    {
        // at most one reminder of any kind per member in this many days
        minGapDays: { type: Number, min: 1, max: 30, default: 2 },
        cases: { type: Object, default: {} }, // key -> { enabled, everyDays, max }
        updatedBy: { type: String },
        reason: { type: String, trim: true, maxlength: 500 },
        history: [{ cases: Object, minGapDays: Number, by: String, reason: String, at: { type: Date, default: Date.now }, _id: false }],
    },
    [[{ origin: 1 }, { unique: true, name: "origin_unique" }]]
);
