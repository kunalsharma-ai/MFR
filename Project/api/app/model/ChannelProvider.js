import { mongooseModel } from "../utils/index.js";

// A brand's WhatsApp or SMS provider, set from the MADP console (Message channels screen) without a developer.
// The provider keys are encrypted (utils/secretBox.js) and never sent back in full. See engagement/channels.js.
export default mongooseModel(
    "ChannelProvider",
    {
        channel: { type: String, enum: ["whatsapp", "sms"], required: true },
        provider: { type: String, required: true, trim: true },
        secret: { type: String, required: true, select: false }, // sealed credentials
        keyHint: { type: String, trim: true }, // last 4 characters of the main key, to recognise it
        sender: { type: String, trim: true, maxlength: 60 },
        // provider template id per reminder case (WhatsApp templates, DLT SMS templates)
        templates: { type: Object, default: {} },
        language: { type: String, trim: true, default: "en" },
        checkedAt: Date,
        checkOk: Boolean,
        checkMessage: { type: String, trim: true, maxlength: 300 },
        updatedBy: String,
    },
    [[{ origin: 1, channel: 1 }, { unique: true, name: "origin_channel" }]],
);
