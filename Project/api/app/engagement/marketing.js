// Marketing e-mail consent: the "Send me news and offers" box at sign-up and in profile settings.
// Kunal's decision (24 Nov 2026): an explicit opt-in, stored with a timestamp. Nothing is ticked by default, nothing
// opts existing members in, and the MFR "news-letter" profile answer does not count as consent.
// Teens can't opt in. Withdrawing always works. MADP reads this as the `email_marketing` consent purpose.
import mongoose from "mongoose";
import { User } from "../model/index.js";
import { fail, isTeen } from "./http.js";

export const WORDING = "news-offers-v1"; // "Send me news and offers"
export const SOURCES = ["signup", "profile", "admin"];
const HISTORY_MAX = 50;

/** The member's state as shown to them and to MADP. Unset means never asked, which counts as no. */
export function view(u) {
    const m = u?.marketingOptIn;
    if (!m || typeof m.granted !== "boolean") return { granted: false, at: null, source: null, asked: false };
    return { granted: m.granted, at: m.at || null, source: m.source || null, asked: true };
}

/** The fields to $set for a change. `granted` must be a real boolean: anything else is refused. */
export function change(granted, source, by = "member", now = new Date()) {
    if (typeof granted !== "boolean") fail("bad_request", "optIn must be true or false.");
    if (!SOURCES.includes(source)) fail("bad_request", "Unknown source.");
    const entry = { granted, at: now, source, wording: WORDING };
    return { entry, history: { ...entry, by: String(by).slice(0, 80) } };
}

/** Record a change for one member. Refuses a teen opting in; a withdrawal always goes through. */
export async function setOptIn(userOrId, origin, granted, source, by) {
    const id = String(userOrId?._id || userOrId || "");
    if (!mongoose.isValidObjectId(id)) fail("bad_request", "Bad member id.");
    const u = await User.findOne({ _id: new mongoose.Types.ObjectId(id), origin }).select("category").lean();
    if (!u) fail("not_found", "No such member.", 404);
    if (granted === true && isTeen(u)) fail("teen_not_allowed", "Teen Panel members can't sign up for marketing e-mails.", 403);
    const { entry, history } = change(granted, source, by);
    const updated = await User.findOneAndUpdate(
        { _id: u._id, origin },
        { $set: { marketingOptIn: entry }, $push: { marketingOptInHistory: { $each: [history], $slice: -HISTORY_MAX } } },
        { new: true }
    ).select("marketingOptIn").lean();
    return view(updated);
}

/**
 * The T2O consent kit saves its choices as ids in User.terms (PUT /api/v1/me { terms }), and "marketing" is the
 * "News and offers" choice. Call this with the terms before and after a save: when "marketing" was added or removed,
 * the change is recorded here too, with a timestamp. Teens never keep "marketing" (see stripForTeen).
 */
export async function syncFromTerms(userId, origin, before = [], after = []) {
    const had = Array.isArray(before) && before.includes("marketing");
    const has = Array.isArray(after) && after.includes("marketing");
    if (had === has) return null;
    return setOptIn(userId, origin, has, "profile", "member");
}
export const stripForTeen = (user, terms) => (Array.isArray(terms) && isTeen(user) ? terms.filter((t) => t !== "marketing") : terms);
