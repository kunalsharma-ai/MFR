// The "About You" lock on the server (Kunal, 27 Nov 2026; T2O issue #47 / PR #53 put it on the member screen only).
//
// Until a member has finished every About You profile of their category:
//   - no survey opens (PUT /me/survey), and no survey answers are saved (PATCH /me/survey),
//   - no other profile opens or saves answers (PUT /me/survey with a profile slug, PATCH /me/profile, PATCH /me/answer).
// The About You profiles themselves, and answers to questions that are in no profile (settings such as payment method
// or contact channels), are never blocked.
//
// Which profiles are About You is set per brand, and per profile category if needed, from the MADP console
// (model/AboutYouSetting.js, admin/aboutyou.js). With nothing saved the brand uses DEFAULT_GROUPS, T2O's four.
// Each group lists the slugs a panel may use for that profile; the first one the category has counts.
// Default list only: a category that has fewer than two of them falls back to its first two profiles, exactly like the
// T2O member screen (frontend-1 member/data/MemberData.jsx aboutYou()), so the screen and the server agree.
import { AboutYouSetting, Profile } from "../model/index.js";
import profileController from "../controller/Profile.js";
import { withRequest } from "../utils/requestContext.js";

export const DEFAULT_GROUPS = [
    ["basic"],
    ["educational", "education", "teen-education"],
    ["financial", "finance", "banking-financial-services"],
    ["health", "health-wellness", "healthcare"],
];
export const LIMITS = { groups: 20, slugsPerGroup: 10, categories: 30 };

const low = (s) => String(s ?? "").trim().toLowerCase();
const SLUG = /^[a-z0-9][a-z0-9_-]{0,79}$/;
const CATEGORY = /^[a-z0-9][a-z0-9_-]{0,39}$/;
const live = { isActive: true, isDeleted: false };

/** Checks and cleans a groups list from the console. Returns { groups } or { error }. */
export function cleanGroups(groups) {
    if (!Array.isArray(groups)) return { error: "groups is a list of profile groups" };
    if (groups.length > LIMITS.groups) return { error: `at most ${LIMITS.groups} About You profiles` };
    const seen = new Set();
    const out = [];
    for (const g of groups) {
        const list = (Array.isArray(g) ? g : [g]).map(low).filter(Boolean);
        if (!list.length) return { error: "every About You profile needs at least one slug" };
        if (list.length > LIMITS.slugsPerGroup) return { error: `at most ${LIMITS.slugsPerGroup} slugs for one profile` };
        for (const s of list) {
            if (!SLUG.test(s)) return { error: `"${s}" is not a profile slug` };
            if (seen.has(s)) return { error: `"${s}" is listed twice` };
            seen.add(s);
        }
        out.push(list);
    }
    return { groups: out };
}

/** Checks and cleans { category: groups } from the console. null removes a category's own list. */
export function cleanByCategory(byCategory) {
    if (byCategory == null) return { byCategory: {} };
    if (typeof byCategory !== "object" || Array.isArray(byCategory)) return { error: "byCategory is { category: groups }" };
    const keys = Object.keys(byCategory);
    if (keys.length > LIMITS.categories) return { error: `at most ${LIMITS.categories} categories` };
    const out = {};
    for (const k of keys) {
        const c = low(k);
        if (!CATEGORY.test(c)) return { error: `"${k}" is not a profile category` };
        if (byCategory[k] === null) continue;
        const r = cleanGroups(byCategory[k]);
        if (r.error) return { error: `${c}: ${r.error}` };
        out[c] = r.groups;
    }
    return { byCategory: out };
}

/** The brand's saved setting, or null. */
export async function savedSetting(origin) {
    return AboutYouSetting.findOne({ origin: low(origin), ...live }).lean();
}

/** The groups for one category and where they come from: "category", "brand" or "default". */
export function groupsOf(setting, category) {
    const c = low(category);
    const own = setting?.byCategory && Object.prototype.hasOwnProperty.call(setting.byCategory, c) ? setting.byCategory[c] : null;
    if (Array.isArray(own)) return { groups: own, source: "category" };
    if (Array.isArray(setting?.groups)) return { groups: setting.groups, source: "brand" };
    return { groups: DEFAULT_GROUPS, source: "default" };
}

/** The About You profiles among `profiles` (in display order), for these groups. */
export function pickAboutYou(profiles, groups, source) {
    const list = Array.isArray(profiles) ? profiles : [];
    const hit = groups.map((g) => g.map((s) => list.find((p) => low(p.slug) === s)).find(Boolean)).filter(Boolean);
    if (source === "default" && hit.length < 2) return list.slice(0, 2);
    return hit;
}

const questionsOf = (p) => (p.pages || []).flatMap((pg) => (Array.isArray(pg) ? pg.slice(1) : [])).map(String);

/** The category's live profiles, in the order the member sees them. */
async function profilesOf(origin, category) {
    return Profile.find({ origin, category: low(category), ...live }).select("slug name pages +sortOrder").sort({ sortOrder: 1, slug: 1 }).lean();
}

async function completion(req) {
    const status = await withRequest(req, () => {
        profileController.request = req;
        return profileController.status();
    });
    return status && !Array.isArray(status) ? status : {};
}

/**
 * The member's About You state: which profiles are About You, which are still open, and the other profiles.
 * `req` is the member's request (req.user, req.origin).
 */
export async function aboutYouState(req) {
    const origin = req.origin;
    const category = req.user?.category;
    const [setting, profiles, status] = await Promise.all([savedSetting(origin), profilesOf(origin, category), completion(req)]);
    const { groups, source } = groupsOf(setting, category);
    const about = pickAboutYou(profiles, groups, source);
    const aboutSlugs = new Set(about.map((p) => low(p.slug)));
    const pct = (slug) => Math.max(0, Math.min(100, Number(status?.[slug]) || 0));
    const required = about.map((p) => ({ slug: p.slug, name: p.name || p.slug, completion: pct(p.slug) }));
    const missing = required.filter((p) => p.completion < 100);
    return {
        complete: missing.length === 0,
        source,
        required,
        missing,
        aboutSlugs,
        profiles,
        isAboutYou: (slug) => aboutSlugs.has(low(slug)),
        isProfile: (slug) => profiles.some((p) => low(p.slug) === low(slug)),
    };
}

/** What the member site shows: the About You list and what is still open (no personal data beyond the member's own). */
export function publicView(state) {
    return {
        complete: state.complete,
        source: state.source,
        required: state.required,
        missing: state.missing.map((p) => p.slug),
        locked: state.complete ? [] : state.profiles.filter((p) => !state.aboutSlugs.has(low(p.slug))).map((p) => p.slug),
    };
}

export class AboutYouLocked extends Error {
    constructor(state, message) {
        super(message || "Finish your About You profiles first. Surveys and the other profiles open as soon as they are done.");
        this.code = "about_you";
        this.status = 403;
        this.expose = true; // utils/expressRoute.js answers with this status, code and data
        this.data = { missing: state.missing.map((p) => p.slug), required: state.required.map((p) => p.slug) };
    }
}

/** Throws AboutYouLocked unless the member may open this survey or profile now. About You profiles always open. */
export async function assertCanOpen(req, slug) {
    const state = await aboutYouState(req);
    if (state.complete || state.isAboutYou(slug)) return state;
    throw new AboutYouLocked(state);
}

/**
 * Throws AboutYouLocked if any of these question names belongs only to profiles that are still locked.
 * A question that is in an About You profile, or in no profile at all, is always allowed.
 */
export async function assertCanAnswer(req, questionNames) {
    const state = await aboutYouState(req);
    if (state.complete) return state;
    const open = new Set();
    const locked = new Set();
    for (const p of state.profiles) {
        const target = state.aboutSlugs.has(low(p.slug)) ? open : locked;
        for (const q of questionsOf(p)) target.add(q);
    }
    const blocked = (questionNames || []).map(String).filter((q) => locked.has(q) && !open.has(q));
    if (blocked.length) throw new AboutYouLocked(state);
    return state;
}
