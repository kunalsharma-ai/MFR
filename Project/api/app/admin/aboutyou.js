// The About You lock for the MADP console (one brand at a time, req.adminOrigin). See member/aboutYou.js.
//   GET /about-you   the brand's list (or the default), each category's own list, and which profiles that picks
//   PUT /about-you   save { groups, byCategory, reason }. groups: null goes back to the default list.
// Nothing here reads or changes members: the lock is worked out for each member when they open a survey or profile.
import { AboutYouSetting, Profile } from "../model/index.js";
import * as A from "../member/aboutYou.js";
import { AdminError } from "./http.js";

const live = { isActive: true, isDeleted: false };

export async function get(origin) {
    const [setting, profiles] = await Promise.all([
        A.savedSetting(origin),
        Profile.find({ origin, ...live }).select("slug name category +sortOrder").sort({ category: 1, sortOrder: 1, slug: 1 }).lean(),
    ]);
    const byCat = new Map();
    for (const p of profiles) {
        const c = String(p.category || "").toLowerCase();
        if (!byCat.has(c)) byCat.set(c, []);
        byCat.get(c).push(p);
    }
    const categories = [...byCat.entries()].map(([category, list]) => {
        const { groups, source } = A.groupsOf(setting, category);
        const about = A.pickAboutYou(list, groups, source);
        const aboutSlugs = new Set(about.map((p) => p.slug));
        return {
            category,
            source,
            ownGroups: source === "category" ? groups : null,
            aboutYou: about.map((p) => ({ slug: p.slug, name: p.name || p.slug })),
            locked: list.filter((p) => !aboutSlugs.has(p.slug)).length,
            profiles: list.map((p) => ({ slug: p.slug, name: p.name || p.slug })),
        };
    });
    return {
        saved: Boolean(setting && Array.isArray(setting.groups)),
        groups: Array.isArray(setting?.groups) ? setting.groups : A.DEFAULT_GROUPS,
        defaultGroups: A.DEFAULT_GROUPS,
        byCategory: setting?.byCategory || {},
        categories,
        limits: A.LIMITS,
        updatedBy: setting?.updatedBy || null,
        updatedAt: setting?.updatedAt || null,
        reason: setting?.reason || null,
        history: (setting?.history || []).slice(-10).reverse(),
    };
}

export async function save(origin, body = {}, actor) {
    const reason = String(body.reason ?? "").trim();
    if (reason.length < 5) throw new AdminError("reason_required", "A reason is required");
    let groups = null;
    if (body.groups !== null && body.groups !== undefined) {
        const r = A.cleanGroups(body.groups);
        if (r.error) throw new AdminError("invalid_value", r.error);
        if (!r.groups.length) throw new AdminError("invalid_value", "List at least one About You profile, or send groups: null for the default");
        groups = r.groups;
    }
    const c = A.cleanByCategory(body.byCategory);
    if (c.error) throw new AdminError("invalid_value", c.error);
    const entry = { ...(groups ? { groups } : {}), byCategory: c.byCategory, by: actor || null, reason: reason.slice(0, 500), at: new Date() };
    await AboutYouSetting.updateOne(
        { origin, ...live },
        {
            $set: { ...(groups ? { groups } : {}), byCategory: c.byCategory, updatedBy: actor || null, reason: entry.reason },
            ...(groups ? {} : { $unset: { groups: "" } }),
            $push: { history: { $each: [entry], $slice: -50 } },
        },
        { upsert: true }
    );
    return get(origin);
}
