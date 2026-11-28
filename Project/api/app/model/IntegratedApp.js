import mongoose from "mongoose";
import { mongooseModel } from "../utils/index.js";

// An integrated application (issue #124): another system that reads live data from this API with a bearer token
// made on the admin "Integrated Applications" page (/admin/apps, API /api/v1/user/apps). Apps are kept apart from
// members, so they never show up in member lists, survey sends or emails. Their token carries `app: true` and the
// app's tokenVersion; making a new token bumps the version, so the old token stops working at once, and switching
// the app off (isActive false) stops every token of the app.
export default mongooseModel(
    "IntegratedApp",
    {
        name: { type: String, required: [true, "App name is required"], trim: true, maxlength: 120 },
        tokenVersion: { type: Number, default: 0 },
        tokenIssuedAt: { type: Date, default: null },
        tokenIssuedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        lastUsedAt: { type: Date, default: null },
    },
    [[{ origin: 1, name: 1 }]]
);
