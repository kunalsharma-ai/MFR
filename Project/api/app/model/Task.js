import { mongooseModel } from "../utils/index.js";

// Something a member can do for points that isn't a survey (Nov 2026):
//   poll         the quick daily poll (one per day per audience; `day` is the day it belongs to)
//   design_vote  Teens: vote on a design (options carry an image)
//   idea         Teens: an idea contest (free text, moderated before anyone else sees it)
//   challenge    a monthly challenge: reach goal.target of goal.metric in `month` for bonus points
// Admin-made. When no poll is scheduled for a day, one is taken from a built-in rotation (engagement/daily.js).
export default mongooseModel(
    "Task",
    {
        kind: { type: String, enum: ["poll", "design_vote", "idea", "challenge"], required: true },
        title: { type: String, required: true, trim: true, maxlength: 120 },
        question: { type: String, trim: true, maxlength: 300 },
        description: { type: String, trim: true, maxlength: 1000 },
        options: [{ key: { type: String, trim: true }, label: { type: String, trim: true, maxlength: 120 }, image: String, _id: false }],
        audience: [{ type: String, enum: ["consumer", "professional", "teen"] }],
        day: { type: String, match: /^\d{4}-\d{2}-\d{2}$/ },
        month: { type: String, match: /^\d{4}-\d{2}$/ },
        startsAt: Date,
        endsAt: Date,
        points: { type: Number, min: 0, default: 0 },
        goal: { metric: { type: String, enum: ["surveys", "profiles", "polls", "streak_days", "tasks"] }, target: { type: Number, min: 1 } },
        season: { type: String, trim: true },  // Teen seasons
        builtIn: { type: String },             // key of the built-in poll it came from
    },
    [
        [{ kind: 1, day: 1, origin: 1 }],
        [{ kind: 1, month: 1, origin: 1 }],
        [{ builtIn: 1, day: 1, origin: 1 }, { unique: true, partialFilterExpression: { builtIn: { $type: "string" } } }],
    ]
);
