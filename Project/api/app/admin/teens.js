// Teen Panel and guardians (super admin spec module 13), including the turning-18 path.
//
// Guardian details stay masked; the teen's own record shows a first name and initial, birth year and age only.
// Turning 18: a teen whose 18th birthday has passed moves to the adult Consumer segment ("b2c") on an admin's
// decision with a reason. The move is logged in SegmentChange, the guardian's links stop working, and any reward
// request still waiting for the guardian is cancelled (the points come back). Answers and points are kept. The guardian
// record and consent evidence are kept as they were: deleting them is a data request, not this step.
import mongoose from "mongoose";
import { User, TeenRegistration, TeenGuardian, TeenConsent, GuardianLink, Redemption, SegmentChange } from "../model/index.js";
import { AdminError } from "./http.js";
import { maskEmail, birthYear } from "./mask.js";

const oid = (v) => new mongoose.Types.ObjectId(String(v));
const isId = (v) => /^[a-f0-9]{24}$/i.test(String(v || ""));
const TEEN = "b2c-minor";
const ADULT = "b2c";
const DAY = 86400000;

export function ageOn(dob, now = new Date()) {
    const d = new Date(dob);
    if (isNaN(d)) return null;
    let a = now.getUTCFullYear() - d.getUTCFullYear();
    if (now.getUTCMonth() < d.getUTCMonth() || (now.getUTCMonth() === d.getUTCMonth() && now.getUTCDate() < d.getUTCDate())) a -= 1;
    return a;
}
export function eighteenth(dob) {
    const d = new Date(dob);
    if (isNaN(d)) return null;
    const t = new Date(Date.UTC(d.getUTCFullYear() + 18, d.getUTCMonth(), d.getUTCDate()));
    // 29 Feb birthdays turn 18 on 1 Mar in a non-leap year (Date.UTC rolls over by itself)
    return t;
}
const short = (u) => [u?.name?.first, u?.name?.last ? `${String(u.name.last)[0]}.` : ""].filter(Boolean).join(" ");

async function regsFor(origin, ids) {
    const regs = await TeenRegistration.find({ origin, teen: { $in: ids } }).sort({ createdAt: -1 }).lean();
    const latest = new Map();
    for (const r of regs) if (!latest.has(String(r.teen))) latest.set(String(r.teen), r);
    const gs = await TeenGuardian.find({ _id: { $in: [...latest.values()].map((r) => r.guardian) } }).select("relation email name").lean();
    const gById = new Map(gs.map((g) => [String(g._id), g]));
    return { latest, gById };
}

function teenView(u, reg, g, now) {
    const t18 = eighteenth(u.dob);
    return {
        id: String(u._id), name: short(u), birthYear: birthYear(u.dob), age: ageOn(u.dob, now), turns18: t18,
        daysTo18: t18 ? Math.ceil((t18 - now) / DAY) : null, memberStatus: u.memberStatus || null,
        registration: reg ? { reference: reg.reference, status: reg.status, activatedAt: reg.activatedAt || null } : null,
        guardian: g ? { relation: g.relation, email: maskEmail(g.email), firstName: g.name?.first || "" } : null,
    };
}

/** Teens of the brand. `turning18=<days>` keeps those whose 18th birthday is within that many days (or already past). */
export async function list(origin, q = {}) {
    const now = new Date();
    const f = { origin, category: TEEN, isDeleted: { $ne: true } };
    if (q.turning18 !== undefined) {
        const days = Math.min(365, Math.max(0, Number(q.turning18) || 30));
        // 18th birthday <= now + days  <=>  dob <= (now + days) - 18 years
        const limit = new Date(now.getTime() + days * DAY);
        limit.setUTCFullYear(limit.getUTCFullYear() - 18);
        f.dob = { $lte: limit };
    }
    const users = await User.find(f).select("name dob memberStatus").sort({ dob: 1 }).limit(500).lean();
    const { latest, gById } = await regsFor(origin, users.map((u) => u._id));
    const items = users.map((u) => { const r = latest.get(String(u._id)); return teenView(u, r, r && gById.get(String(r.guardian)), now); });
    return { total: items.length, due: items.filter((x) => x.age !== null && x.age >= 18).length, items };
}

/** One teen: registration history, consent records (versions and dates, never the IP), guardian links. */
export async function get(origin, id) {
    if (!isId(id)) throw new AdminError("not_found", "Not found", 404);
    const u = await User.findOne({ _id: oid(id), origin, category: TEEN }).select("name dob memberStatus createdAt").lean();
    if (!u) throw new AdminError("not_found", "Not found", 404);
    const { latest, gById } = await regsFor(origin, [u._id]);
    const reg = latest.get(String(u._id));
    const [consents, links, waiting] = await Promise.all([
        reg ? TeenConsent.find({ registration: reg._id, origin }).select("party version acceptedAt statements").lean() : [],
        GuardianLink.find({ teen: u._id, origin }).select("purpose expiresAt usedAt revokedAt createdAt").sort({ createdAt: -1 }).limit(20).lean(),
        Redemption.countDocuments({ user: u._id, origin, status: "guardian_pending" }),
    ]);
    return {
        ...teenView(u, reg, reg && gById.get(String(reg.guardian)), new Date()),
        history: reg?.history || [],
        consents: consents.map((c) => ({ party: c.party, version: c.version, acceptedAt: c.acceptedAt, accepted: (c.statements || []).filter((s) => s.accepted).map((s) => s.id) })),
        links: links.map((l) => ({ purpose: l.purpose, createdAt: l.createdAt, expiresAt: l.expiresAt, used: Boolean(l.usedAt), revoked: Boolean(l.revokedAt) })),
        rewardsWaitingForGuardian: waiting,
    };
}

/** Stop every guardian link of a teen (e.g. the guardian asks, or a link went to the wrong inbox). */
export async function revokeLinks(origin, id, reason) {
    if (!isId(id)) throw new AdminError("not_found", "Not found", 404);
    if (!reason || String(reason).trim().length < 5) throw new AdminError("reason_required", "A reason is required");
    const u = await User.exists({ _id: oid(id), origin, category: TEEN });
    if (!u) throw new AdminError("not_found", "Not found", 404);
    const r = await GuardianLink.updateMany({ teen: oid(id), origin, revokedAt: null }, { $set: { revokedAt: new Date() } });
    return { revoked: r.modifiedCount };
}

/** Move a teen who has turned 18 to the adult Consumer segment. dryRun (the default) says what would happen. */
export async function graduate(origin, id, { reason, dryRun = true } = {}, actor) {
    if (!isId(id)) throw new AdminError("not_found", "Not found", 404);
    const u = await User.findOne({ _id: oid(id), origin, isDeleted: { $ne: true } }).select("category dob").lean();
    if (!u) throw new AdminError("not_found", "Not found", 404);
    if (u.category !== TEEN) throw new AdminError("not_teen", "This member is not on the Teen Panel", 409);
    const age = ageOn(u.dob);
    if (age === null || age < 18) throw new AdminError("not_18", `The member is ${age ?? "of unknown age"}; the move happens once they turn 18`, 409);
    const [links, waiting] = await Promise.all([
        GuardianLink.countDocuments({ teen: u._id, origin, revokedAt: null, expiresAt: { $gt: new Date() } }),
        Redemption.countDocuments({ user: u._id, origin, status: "guardian_pending" }),
    ]);
    const plan = { from: TEEN, to: ADULT, age, guardianLinksToStop: links, rewardRequestsToCancel: waiting, answersKept: true, pointsKept: true };
    if (dryRun) return { dryRun: true, ...plan };
    if (!reason || String(reason).trim().length < 5) throw new AdminError("reason_required", "A reason is required");
    // only from the teen category that was read, so a double click moves the member once
    const moved = await User.updateOne({ _id: u._id, origin, category: TEEN }, { $set: { category: ADULT } });
    if (!moved.modifiedCount) throw new AdminError("conflict", "The member was already moved", 409);
    await SegmentChange.create({ origin, user: u._id, from: TEEN, to: ADULT, reason: `turned 18: ${String(reason).trim()}`.slice(0, 500), actor });
    await GuardianLink.updateMany({ teen: u._id, origin, revokedAt: null }, { $set: { revokedAt: new Date() } });
    await Redemption.updateMany(
        { user: u._id, origin, status: "guardian_pending" },
        { $set: { status: "cancelled", open: false, note: "Cancelled when your account moved to an adult account. Your points are back." }, $push: { history: { status: "cancelled", by: `madp:${actor}`, at: new Date() } } }
    );
    return { dryRun: false, ...plan };
}
