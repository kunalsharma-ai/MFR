// Phase 5: Professionals. Premium studies matched on industry and seniority, the verified expert badge and expertise
// score, monthly earnings statements and payout receipts. Only for Professional (b2b) members.
//
// Industry and seniority come from the member's own profile answers (Answer, by the question names in
// config.professional). Nothing is guessed: with no answer, only studies open to every industry/seniority match.
import mongoose from "mongoose";
import { Answers, Survey, Response, User, ExpertVerification, Redemption } from "../model/index.js";
import { config } from "./config.js";
import { ledger } from "./ledger.js";
import { profileProgress } from "./lifecycle.js";
import { monthKey } from "./time.js";
import { fail, memberType } from "./http.js";

const oid = (id) => new mongoose.Types.ObjectId(String(id));
const low = (v) => String(v ?? "").trim().toLowerCase();
const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function requirePro(user) {
    if (memberType(user) !== "professional") fail("forbidden", "This is for Professional members.", 403);
}

// the member's industry and seniority answers (lower case), [] when not answered
export async function memberFacts(user, origin) {
    const c = config().professional || {};
    const names = [c.industryQuestion, c.seniorityQuestion].filter(Boolean);
    if (!names.length) return { industries: [], seniority: [] };
    const rows = await Answers.find({ user: String(user._id), question: { $in: names }, origin, isDeleted: { $ne: true } }).select("+answer question").lean();
    const of = (q) => rows.filter((r) => r.question === q).flatMap((r) => [r.answer].flat()).map(low).filter(Boolean);
    return { industries: of(c.industryQuestion), seniority: of(c.seniorityQuestion) };
}
const fits = (want = [], have = []) => !want?.length || want.some((w) => have.includes(low(w)));

export async function premiumStudies(user, origin) {
    requirePro(user);
    const facts = await memberFacts(user, origin);
    const list = await Survey.find({ origin, isActive: true, isDeleted: false, status: "active", "premium.enabled": true, category: user.category }).lean();
    const matched = list.filter((s) => fits(s.premium?.industries, facts.industries) && fits(s.premium?.seniority, facts.seniority));
    const mine = await Response.find({ user: oid(user._id), origin, "survey.slug": { $in: matched.map((s) => s.slug) } }).select("survey status").lean();
    const by = new Map(mine.map((r) => [r.survey?.slug, r.status]));
    const stateOf = (st) => (st === "complete" ? "done" : ["invited", "dropout", "", null].includes(st) ? "open" : st ? "closed" : "matched");
    return {
        facts: { industry: facts.industries[0] || null, seniority: facts.seniority[0] || null, missing: !facts.industries.length || !facts.seniority.length },
        studies: matched.map((s) => ({
            slug: s.slug, name: s.name, summary: s.summary || "", points: s.points || 0, loi: s.loi || 0,
            industries: s.premium?.industries || [], seniority: s.premium?.seniority || [],
            state: stateOf(by.has(s.slug) ? by.get(s.slug) ?? "" : undefined),
            until: s.active?.to || null,
        })).sort((a, b) => ["open", "matched", "done", "closed"].indexOf(a.state) - ["open", "matched", "done", "closed"].indexOf(b.state)),
    };
}

// For bulk invites of a premium study: the ids of members whose answers fit it, or null when it has no conditions.
export async function premiumEligibleIds(survey, origin) {
    const p = survey?.premium;
    if (!p?.enabled || (!p.industries?.length && !p.seniority?.length)) return null;
    const c = config().professional || {};
    const pick = async (question, values) => {
        if (!values?.length) return null;
        if (!question) return new Set();
        const rows = await Answers.find({ question, origin, isDeleted: { $ne: true }, answer: { $in: values.map((v) => new RegExp(`^${esc(v)}$`, "i")) } }).select("user").lean();
        return new Set(rows.map((r) => String(r.user)));
    };
    const [a, b] = await Promise.all([pick(c.industryQuestion, p.industries), pick(c.seniorityQuestion, p.seniority)]);
    const sets = [a, b].filter(Boolean);
    const [first, ...rest] = sets;
    return [...first].filter((id) => rest.every((s) => s.has(id)));
}

// ---- expert badge + expertise score --------------------------------------------------------------------------------
export async function expertise(user, origin) {
    requirePro(user);
    const c = config().professional.expertise;
    const w = c.weights;
    const [prof, surveys, u, v] = await Promise.all([
        profileProgress(user, origin).catch(() => null),
        Response.countDocuments({ user: oid(user._id), origin, status: "complete", isDeleted: false }),
        User.findById(user._id).select("qualityScore").lean(),
        ExpertVerification.findOne({ user: oid(user._id), origin }).lean(),
    ]);
    const q = Number.isFinite(Number(u?.qualityScore)) ? Number(u.qualityScore) : 100;
    const parts = [
        { key: "profiles", weight: w.profiles, value: prof && prof.total ? prof.done / prof.total : 0, detail: prof ? { done: prof.done, total: prof.total } : null },
        { key: "surveys", weight: w.surveys, value: Math.min(1, surveys / Math.max(1, c.surveysForFull)), detail: { done: surveys, full: c.surveysForFull } },
        { key: "quality", weight: w.quality, value: Math.min(1, q / 200), detail: { score: q } },
        { key: "verified", weight: w.verified, value: v?.status === "verified" ? 1 : 0, detail: null },
    ].map((p) => ({ ...p, points: Math.round(p.weight * p.value) }));
    return {
        score: Math.min(100, parts.reduce((s, p) => s + p.points, 0)),
        parts,
        verification: v ? { status: v.status, linkedin: v.linkedin || null, workDomain: v.workDomain || null, jobTitle: v.jobTitle || null, note: v.status === "declined" ? v.note || null : null, at: v.decidedAt || v.createdAt } : null,
        badge: v?.status === "verified",
    };
}

const LINKEDIN = /^https:\/\/([a-z]{2,3}\.)?linkedin\.com\/in\/[A-Za-z0-9\-_%]{3,100}\/?$/;
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,}$/i;
const FREE_MAIL = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "live.com", "icloud.com", "aol.com", "proton.me", "protonmail.com", "rediffmail.com", "yandex.com", "mail.com", "gmx.com"];
export async function requestVerification(user, origin, b = {}) {
    requirePro(user);
    const linkedin = b.linkedin ? String(b.linkedin).trim() : "";
    const workEmail = b.workEmail ? low(b.workEmail) : "";
    if (!linkedin && !workEmail) fail("validation", "Add your LinkedIn profile link or your work email.", 422);
    if (linkedin && !LINKEDIN.test(linkedin)) fail("validation", "That doesn't look like a LinkedIn profile link (linkedin.com/in/…).", 422);
    if (workEmail && !EMAIL.test(workEmail)) fail("validation", "That email address isn't valid.", 422);
    const domain = workEmail ? workEmail.split("@")[1] : "";
    if (domain && FREE_MAIL.includes(domain)) fail("validation", "Please use your work email, not a personal one.", 422);
    const cur = await ExpertVerification.findOne({ user: oid(user._id), origin }).lean();
    if (cur?.status === "verified") fail("already", "You're already verified.", 409);
    if (cur?.status === "requested") fail("already", "We're already checking your request.", 409);
    const set = { status: "requested", linkedin: linkedin || undefined, workEmail: workEmail || undefined, workDomain: domain || undefined, jobTitle: b.jobTitle ? String(b.jobTitle).trim().slice(0, 120) : undefined, note: undefined };
    await ExpertVerification.updateOne(
        { user: oid(user._id), origin },
        { $set: set, $push: { history: { status: "requested", by: String(user._id) } }, $setOnInsert: { user: oid(user._id), origin, isActive: true, isDeleted: false } },
        { upsert: true, runValidators: true }
    );
    return { status: "requested" };
}

export async function decideVerification(admin, origin, id, b = {}) {
    if (!["verified", "declined"].includes(b.status)) fail("validation", "status must be verified or declined.", 422);
    const v = await ExpertVerification.findOneAndUpdate(
        { _id: id, origin, status: "requested" },
        { $set: { status: b.status, note: b.note ? String(b.note).slice(0, 300) : undefined, adminNote: b.adminNote ? String(b.adminNote).slice(0, 500) : undefined, decidedAt: new Date(), decidedBy: admin._id }, $push: { history: { status: b.status, by: String(admin._id) } } },
        { new: true }
    ).lean();
    if (!v) fail("conflict", "Only a waiting request can be decided.", 409);
    return { id: String(v._id), status: v.status };
}

// ---- earnings statements + payout receipts ---------------------------------------------------------------------------
export async function statements(user, origin) {
    requirePro(user);
    const { entries } = await ledger(user, origin);
    const by = new Map();
    for (const e of entries) {
        if (!e.at) continue;
        const m = monthKey(e.at, user.timezone);
        const s = by.get(m) || { month: m, earned: 0, spent: 0, entries: 0, bySource: {} };
        if (e.points >= 0) { s.earned += e.points; s.bySource[e.type] = (s.bySource[e.type] || 0) + e.points; } else s.spent += -e.points;
        s.entries += 1;
        by.set(m, s);
    }
    const usd = config().points.usdPerPoint;
    return [...by.values()].sort((a, b) => b.month.localeCompare(a.month)).slice(0, 24).map((s) => ({ ...s, earnedValue: +(s.earned * usd).toFixed(2), currency: config().points.currency }));
}

export async function statementMonth(user, origin, month) {
    requirePro(user);
    if (!/^\d{4}-\d{2}$/.test(month)) fail("bad_request", "Month must look like 2026-11.");
    const { entries } = await ledger(user, origin);
    const list = entries.filter((e) => e.at && monthKey(e.at, user.timezone) === month).sort((a, b) => a.at - b.at);
    const earned = list.filter((e) => e.points > 0).reduce((s, e) => s + e.points, 0);
    const spent = list.filter((e) => e.points < 0).reduce((s, e) => s - e.points, 0);
    return { month, entries: list.map((e) => ({ at: e.at, type: e.type, name: e.name, points: e.points, status: e.status })), earned, spent };
}

const h = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
function page(title, body) {
    const iss = config().professional.issuer || {};
    const from = iss.name
        ? `<p><b>${h(iss.name)}</b><br>${h(iss.address).replace(/\n/g, "<br>")}${iss.email ? `<br>${h(iss.email)}` : ""}</p>`
        : `<p class="muted">Company details will be added here.</p>`;
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${h(title)}</title>
<style>body{font:14px/1.5 system-ui,sans-serif;color:#111;max-width:760px;margin:32px auto;padding:0 16px}h1{font-size:22px;margin:0 0 4px}table{width:100%;border-collapse:collapse;margin:16px 0}th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #ddd}td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}.muted{color:#666}.top{display:flex;justify-content:space-between;gap:24px;flex-wrap:wrap}.tot td{font-weight:700;border-top:2px solid #111}button{margin-top:16px;padding:8px 14px}@media print{button{display:none}}</style></head>
<body><div class="top"><div><h1>${h(title)}</h1><p class="muted">MyFrequentRewards</p></div>${from}</div>${body}<button onclick="window.print()">Print or save as PDF</button></body></html>`;
}
const fmtN = (n) => new Intl.NumberFormat("en-US").format(n);
const fmtD = (d, tz) => new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: tz || "UTC" }).format(new Date(d));
const nameOf = (u) => [u?.name?.first, u?.name?.last].filter(Boolean).join(" ");

export async function statementHtml(user, origin, month) {
    const s = await statementMonth(user, origin, month);
    const u = await User.findById(user._id).select("name mail respondentID").lean();
    const usd = config().points.usdPerPoint;
    const rows = s.entries.map((e) => `<tr><td>${fmtD(e.at, user.timezone)}</td><td>${h(e.type)}</td><td>${h(e.name)}</td><td>${h(e.status)}</td><td class="n">${fmtN(e.points)}</td></tr>`).join("");
    const monthName = new Date(`${month}-15`).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    return page(`Earnings statement, ${monthName}`, `
<p>For <b>${h(nameOf(u))}</b>${u?.respondentID ? ` · Member ID ${h(u.respondentID)}` : ""}<br><span class="muted">${h(u?.mail || "")}</span></p>
<table><thead><tr><th>Date</th><th>Type</th><th>Item</th><th>Status</th><th class="n">Points</th></tr></thead><tbody>${rows || `<tr><td colspan="5" class="muted">No activity this month.</td></tr>`}</tbody>
<tfoot><tr class="tot"><td colspan="4">Points earned</td><td class="n">${fmtN(s.earned)}</td></tr><tr><td colspan="4">Points redeemed or used</td><td class="n">${fmtN(s.spent)}</td></tr>
<tr><td colspan="4" class="muted">Value of points earned at ${fmtN(Math.round(1 / usd))} points = 1 ${h(config().points.currency)}</td><td class="n">${(s.earned * usd).toFixed(2)} ${h(config().points.currency)}</td></tr></tfoot></table>
<p class="muted">Pending and on-hold points are listed with their status and can still change.</p>`);
}

export async function receiptHtml(user, origin, id) {
    requirePro(user);
    if (!mongoose.isValidObjectId(id)) fail("bad_request", "That id isn't valid.");
    const r = await Redemption.findOne({ _id: id, user: oid(user._id), origin, status: "fulfilled" }).lean();
    if (!r) fail("not_found", "Receipts are available once a reward has been sent.", 404);
    const u = await User.findById(user._id).select("name mail respondentID").lean();
    return page(`Payout receipt ${r.reference}`, `
<p>For <b>${h(nameOf(u))}</b>${u?.respondentID ? ` · Member ID ${h(u.respondentID)}` : ""}<br><span class="muted">${h(u?.mail || "")}</span></p>
<table><tbody>
<tr><th>Reference</th><td>${h(r.reference)}</td></tr>
<tr><th>Reward</th><td>${h([r.item?.title, r.item?.subtitle].filter(Boolean).join(" · "))}</td></tr>
<tr><th>Paid to</th><td>${h(r.payout?.masked || r.payout?.method || "")}</td></tr>
<tr><th>Points</th><td>${fmtN(r.points)}</td></tr>
${r.item?.value != null ? `<tr><th>Value</th><td>${Number(r.item.value).toFixed(2)} ${h(r.item.currency || config().points.currency)}</td></tr>` : ""}
<tr><th>Requested</th><td>${fmtD(r.createdAt, user.timezone)}</td></tr>
<tr><th>Sent</th><td>${r.fulfilledAt ? fmtD(r.fulfilledAt, user.timezone) : ""}</td></tr>
${r.providerRef ? `<tr><th>Payment reference</th><td>${h(r.providerRef)}</td></tr>` : ""}
</tbody></table>`);
}
