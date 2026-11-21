import mongoose from "mongoose";
import { mongooseModel } from "../utils/index.js";

// One Teen Panel registration request (ages 13-17): links the teen's account, the parent/guardian record, the consent
// records and every status change. Status rules live in app/teen/rules.js (TRANSITIONS); only the server moves them.
const event = new mongoose.Schema({
    status: String,
    at: { type: Date, default: Date.now },
    by: { type: String, enum: ["teen", "guardian", "system", "support"] },
    note: String
}, { _id: false });
const mail = new mongoose.Schema({
    template: String,
    to: { type: String, enum: ["teen", "guardian"] },
    at: { type: Date, default: Date.now },
    ok: Boolean
}, { _id: false });

export default mongooseModel(
    "TeenRegistration",
    {
        reference: { type: String, required: true },           // TR-XXXX-XXXX, shown to the family and support
        idempotencyKey: { type: String, required: true },      // one submit = one registration, even if clicked twice
        status: { type: String, required: true, default: "initial_registration" },
        history: [event],
        teen: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        guardian: { type: mongoose.Schema.Types.ObjectId, ref: "TeenGuardian", required: true },
        // what the teen typed that the User model has no exact place for
        teenDetails: {
            gender: String,          // Female | Male | Non-binary | Self-describe | Prefer not to say
            genderSelf: String,
            phone: String,           // E.164 digits, optional
            location: {
                country: String, countryName: String,
                stateCode: String, state: String, stateManual: Boolean,
                city: String, cityManual: Boolean,
                zip: String, noZip: Boolean
            },
            language: String
        },
        decision: {
            value: { type: String, enum: ["yes", "no", null], default: null },
            at: Date,
            reasons: [String],
            comment: { type: String, select: false }
        },
        expiresAt: Date,                // when the guardian's invitation lapses
        reminders: { count: { type: Number, default: 0 }, lastAt: Date },
        emails: [mail],
        welcomeDoneAt: Date,
        activatedAt: Date
    },
    [
        [{ reference: 1 }, { unique: true }],
        [{ idempotencyKey: 1, origin: 1 }, { unique: true }],
        [{ teen: 1 }],
        [{ status: 1, expiresAt: 1 }]
    ]
);
