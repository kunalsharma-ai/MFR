// Teen Panel registration service: every rule of the journey, enforced on the server.
//
//   teen  : register (steps 1-3)  -> status link, resend invite
//   parent: open link -> YES / NO -> onboarding (Module 1) -> consent (MINOR-2026.10 Part B)
//   teen  : create password (link) -> account active -> log in -> welcome survey -> profile
//
// Data separation: the teen's own details live on their User record (category b2c-minor) plus registration.teenDetails;
// the parent/guardian lives in TeenGuardian; consents in TeenConsent; tokens in TeenToken. None of these are served by
// the member routes. See docs/teen-registration/BACKEND.md.
import crypto from "crypto";
import { readFileSync } from "fs";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { User, TeenRegistration, TeenGuardian, TeenConsent, Answers, Survey, Response } from "../model/index.js";
import * as R from "./rules.js";
import { TEEN_CONSENT, GUARDIAN_CONSENT, PARENT_SURVEY_RULES, ONBOARDING_KEYS, PROFILE_KEYS } from "./content.js";
import * as T from "./tokens.js";
import * as M from "./mail.js";

const { STATUS } = R;
export const TEEN_CATEGORY = "b2c-minor";

// ---- errors ---------------------------------------------------------------------------------------------------------
export class TeenError extends Error {
    constructor(code, { status = 400, fields, extra } = {}) {
        super(code);
        this.code = code;
        this.status = status;
        this.fields = fields;
        this.extra = extra;
    }
}
const fail = (code, opts) => { throw new TeenError(code, opts); };

// ---- the world dataset (countries, states, cities, postcode formats) ------------------------------------------------
let WORLD = null;
export function world() {
    if (!WORLD) {
        const candidates = [new URL("../dataBank/theworld.json", import.meta.url), "/src/app/dataBank/theworld.json"];
        for (const c of candidates) {
            try { WORLD = JSON.parse(readFileSync(c, "utf-8")); break; } catch (e) { /* try the next */ }
        }
        WORLD = WORLD || {};
    }
    return WORLD;
}

// ---- helpers --------------------------------------------------------------------------------------------------------
const refAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function newReference() {
    const b = crypto.randomBytes(8);
    const s = Array.from(b, (x) => refAlphabet[x % refAlphabet.length]).join("");
    return `TR-${s.slice(0, 4)}-${s.slice(4)}`;
}
function e164(phone) {
    if (!phone || !String(phone.number || "").trim()) return "";
    const p = parsePhoneNumberFromString(String(phone.number), String(phone.country || "").toUpperCase() || undefined);
    if (!p || !p.isValid()) return null;
    return p.number.replace(/^\+/, "");
}
function move(reg, to, by, note) {
    if (reg.status === to) return false;
    if (!R.canMove(reg.status, to)) fail("bad_state", { status: 409, extra: { status: reg.status } });
    reg.status = to;
    reg.history.push({ status: to, at: new Date(), by, ...(note ? { note } : {}) });
    return true;
}
const ipOf = (req) => String(req.ip || req.headers["x-forwarded-for"] || "").split(",")[0].trim();
const fullName = (n = {}) => [n.first, n.middle, n.last].filter(Boolean).join(" ");
const relationLabel = (r) => (r === "mother" ? "Mother" : r === "father" ? "Father" : "Legal guardian");

async function loadReg(id) {
    const reg = await TeenRegistration.findById(id);
    if (!reg) fail("invalid_link", { status: 404 });
    return reg;
}
async function loadAll(reg) {
    const [teen, guardian] = await Promise.all([User.findById(reg.teen), TeenGuardian.findById(reg.guardian).select("+onboarding.answers")]);
    return { teen, guardian };
}
async function viaToken(token, purpose, origin, { allowExpired = false } = {}) {
    const r = await T.check(token, purpose, origin);
    if (!r.ok && !(allowExpired && r.reason === "expired")) fail(`link_${r.reason}`, { status: r.reason === "invalid" ? 404 : 410 });
    const reg = await loadReg(r.doc.registration);
    return { reg, tokenDoc: r.doc, expired: !r.ok };
}

// ---- age check (used by every sign-up page before anything is collected) --------------------------------------------
export function ageCheck(dob) {
    const c = R.classifyDob(dob);
    if (c === "invalid" || c === "future" || c === "implausible") return { route: "invalid", reason: c };
    return { route: c === "blocked" ? "blocked" : c, age: c === "blocked" ? undefined : R.ageOn(dob) };
}

// ---- 1. the teen registers (steps 1-3) ------------------------------------------------------------------------------
export async function register(req) {
    const b = req.body || {};
    const origin = req.origin;
    const key = R.clean(b.idempotencyKey, 80);
    if (!/^[A-Za-z0-9_-]{16,80}$/.test(key)) fail("bad_request");

    // the same submit arriving twice (double click, retry after a timeout) returns the first result
    const again = await settled(key, origin);
    if (again) return summary(again, await TeenGuardian.findById(again.guardian).lean(), { repeat: true });

    const teen = b.teen || {};
    const guardian = b.guardian || {};
    // age first: under-13s are refused before anything is looked at or stored
    const route = ageCheck(teen.dob).route;
    if (route === "blocked") fail("under_13", { status: 403 });
    if (route === "adult") fail("adult", { status: 409 });

    const w = world();
    const fields = { ...R.validateTeen(teen, { world: w }) };
    const gErr = R.validateGuardian(guardian, teen);
    Object.entries(gErr).forEach(([k, v]) => { fields[`guardian.${k}`] = v; });
    const cErr = R.validateTeenConsent(b.consent, TEEN_CONSENT);
    Object.entries(cErr).forEach(([k, v]) => { fields[`consent.${k}`] = v; });
    const teenPhone = e164(teen.phone);
    if (teenPhone === null) fields.phone = "phone";
    const gPhone = e164(guardian.phone);
    if (gPhone === null) fields["guardian.phone"] = "phone";
    if (Object.keys(fields).length) fail("validation", { status: 422, fields });

    const mail = R.normEmail(teen.email);
    const gMail = R.normEmail(guardian.email);
    const existing = await User.findOne({ mail, origin }).lean();
    if (existing) {
        const pending = existing.category === TEEN_CATEGORY && !["active", "rejected", "cancelled"].includes(existing.registrationStatus);
        fail(pending ? "pending_exists" : "email_taken", { status: 409, fields: { email: pending ? "pending_exists" : "email_taken" } });
    }
    if (await User.exists({ mail: gMail, origin, category: TEEN_CATEGORY })) fail("validation", { status: 422, fields: { "guardian.email": "guardian_is_teen" } });

    const loc = teen.location || {};
    const cn = w[String(loc.country).toUpperCase()];
    const stateName = loc.stateManual ? R.clean(loc.state, 80) : (cn.states?.[loc.stateCode]?.name || "");
    const now = new Date();

    const g = await TeenGuardian.create({
        origin,
        relation: guardian.relation,
        name: { first: R.clean(guardian.firstName, 60), middle: R.clean(guardian.middleName, 60), last: R.clean(guardian.lastName, 60) },
        dob: new Date(`${guardian.dob}T00:00:00Z`),
        gender: R.guardianGender(guardian),
        email: gMail,
        ...(gPhone ? { phone: gPhone } : {}),
    });
    let user;
    try {
        user = await User.create({
            origin,
            category: TEEN_CATEGORY,
            name: { first: R.clean(teen.firstName, 60), middle: R.clean(teen.middleName, 60), last: R.clean(teen.lastName, 60) },
            gender: R.userGender(teen.gender),
            dob: new Date(`${teen.dob}T00:00:00Z`),
            mail,
            ...(teenPhone ? { phone: teenPhone } : {}),
            timezone: R.clean(b.timezone, 60) || "UTC",
            address: [{
                tag: "home",
                country: cn.codes?.iso2 ? cn.codes.iso2.toLowerCase() : String(loc.country).toLowerCase(),
                state: stateName,
                city: R.clean(loc.city, 80),
                ...(R.clean(loc.zip, 12) ? { zipcode: R.clean(loc.zip, 12) } : {}),
            }],
            notification: [{ channel: "email", category: [], identity: mail }],
            registrationStatus: STATUS.PENDING_APPROVAL,
            parent: { relation: guardian.relation, consent: null },
            ...(b.referredBy && /^[a-f0-9]{24}$/i.test(String(b.referredBy)) ? { referredBy: String(b.referredBy) } : {}),
        });
    } catch (e) {
        await TeenGuardian.deleteOne({ _id: g._id });
        if (e && e.code === 11000) {
            // the same submit, arriving twice at the same moment: wait for the first one and return its result
            for (let i = 0; i < 20; i += 1) {
                const first = await settled(key, origin);
                if (first) return summary(first, await TeenGuardian.findById(first.guardian).lean(), { repeat: true });
                await new Promise((r) => setTimeout(r, 150));
            }
            fail("email_taken", { status: 409, fields: { email: "email_taken" } });
        }
        if (e && e.errors) fail("validation", { status: 422, fields: Object.fromEntries(Object.keys(e.errors).map((k) => [k === "mail" ? "email" : k, k === "mail" ? "email" : "invalid"])) });
        throw e;
    }

    let reg;
    try {
        reg = await TeenRegistration.create({
            origin,
            reference: newReference(),
            idempotencyKey: key,
            status: STATUS.INITIAL,
            history: [{ status: STATUS.INITIAL, at: now, by: "teen" }],
            teen: user._id,
            guardian: g._id,
            teenDetails: {
                gender: teen.gender,
                genderSelf: teen.gender === "Self-describe" ? R.clean(teen.genderSelf, 40) : "",
                phone: teenPhone || "",
                location: {
                    country: String(loc.country).toUpperCase(), countryName: cn.name,
                    stateCode: loc.stateManual ? "" : String(loc.stateCode || ""), state: stateName, stateManual: Boolean(loc.stateManual),
                    city: R.clean(loc.city, 80), cityManual: Boolean(loc.cityManual),
                    zip: R.clean(loc.zip, 12), noZip: Boolean(loc.noZip),
                },
                language: R.clean(b.language, 12) || "en",
            },
            expiresAt: new Date(now.getTime() + T.TTL.guardian),
        });
    } catch (e) {
        await Promise.all([User.deleteOne({ _id: user._id }), TeenGuardian.deleteOne({ _id: g._id })]);
        if (e && e.code === 11000) {
            const first = await settled(key, origin);
            if (first) return summary(first, await TeenGuardian.findById(first.guardian).lean(), { repeat: true });
        }
        throw e;
    }

    await TeenConsent.create({
        origin,
        registration: reg._id,
        reference: reg.reference,
        party: "teen",
        version: TEEN_CONSENT.version,
        statements: TEEN_CONSENT.items.map((s) => ({ id: s.id, text: s.text, required: s.required, accepted: b.consent.accepted[s.id] === true })),
        acceptedAt: now,
        ip: ipOf(req),
        userAgent: R.clean(req.headers["user-agent"], 300),
        language: reg.teenDetails.language,
    });

    const invite = await T.issue(reg._id, "guardian", origin);
    const status = await T.issue(reg._id, "status", origin);
    const okInvite = await M.send(reg, "guardian-invite", "guardian", gMail, inviteData(reg, user, g, invite, origin), origin);
    if (!okInvite) {
        // nobody was told: undo everything so the teen can simply try again
        await Promise.all([
            TeenRegistration.deleteOne({ _id: reg._id }), User.deleteOne({ _id: user._id }),
            TeenGuardian.deleteOne({ _id: g._id }), TeenConsent.deleteMany({ registration: reg._id }), T.revokeAll(reg._id),
        ]);
        fail("mail_failed", { status: 503 });
    }
    move(reg, STATUS.PENDING_APPROVAL, "system", "invitation sent");
    await M.send(reg, "teen-registered", "teen", mail, {
        teen: { firstName: user.name.first },
        guardian: { relation: guardian.relation, relationLabel: relationLabel(guardian.relation), emailMasked: R.maskEmail(gMail) },
        links: { status: M.linkTo(origin, "/sign-up?type=teen", status.token), help: M.linkTo(origin, "/contact-us") },
        expires: invite.expiresAt.toISOString(),
    }, origin);
    await reg.save();
    return summary(reg, g, { statusToken: status.token });
}

// A repeat of a submit that is still being processed: wait (up to ~3 s) until the first one has sent the invite,
// so both answers show the same status.
async function settled(key, origin) {
    let reg = await TeenRegistration.findOne({ idempotencyKey: key, origin });
    for (let i = 0; reg && reg.status === STATUS.INITIAL && i < 20; i += 1) {
        await new Promise((r) => setTimeout(r, 150));
        reg = await TeenRegistration.findOne({ idempotencyKey: key, origin });
    }
    return reg;
}

function inviteData(reg, user, g, invite, origin, extra = {}) {
    const base = M.linkTo(origin, "/teen/parent", invite.token);
    return {
        teen: { firstName: user.name.first, age: R.ageOn(user.dob.toISOString().slice(0, 10)) },
        guardian: { firstName: g.name.first, relation: g.relation, relationLabel: relationLabel(g.relation) },
        links: { yes: `${base}&d=yes`, no: `${base}&d=no`, review: base },
        expires: invite.expiresAt.toISOString(),
        ...extra,
    };
}

function summary(reg, g, extra = {}) {
    return {
        reference: reg.reference,
        status: reg.status,
        guardianEmail: g ? R.maskEmail(g.email) : undefined,
        expiresAt: reg.expiresAt,
        ...extra,
    };
}

// ---- the teen's status view (step 4 and the "where is my registration" link) ----------------------------------------
export async function statusView(req) {
    const { reg } = await viaToken(req.params.token, "status", req.origin);
    const g = await TeenGuardian.findById(reg.guardian).lean();
    const teen = await User.findById(reg.teen).lean();
    return {
        reference: reg.reference,
        status: reg.status,
        teenFirstName: teen?.name?.first,
        guardian: { relation: g?.relation, emailMasked: R.maskEmail(g?.email) },
        timeline: reg.history.map((h) => ({ status: h.status, at: h.at })),
        expiresAt: reg.expiresAt,
        canResend: [STATUS.PENDING_APPROVAL, STATUS.EXPIRED].includes(reg.status),
    };
}

// resend the parent's invitation: from the teen's status token, or by email (same answer whether or not it exists)
export async function resendInvite(req) {
    const origin = req.origin;
    let reg = null;
    if (req.body?.statusToken) reg = (await viaToken(req.body.statusToken, "status", origin)).reg;
    else {
        const u = await User.findOne({ mail: R.normEmail(req.body?.mail), origin, category: TEEN_CATEGORY }).lean();
        if (u) reg = await TeenRegistration.findOne({ teen: u._id, origin });
    }
    if (reg && [STATUS.PENDING_APPROVAL, STATUS.EXPIRED].includes(reg.status)) {
        const last = [...reg.emails].reverse().find((m) => m.template === "guardian-invite" || m.template === "link-renewed");
        if (last && Date.now() - new Date(last.at).getTime() < 2 * 60 * 1000) fail("too_soon", { status: 429 });
        await reinvite(reg, origin, "teen");
    }
    return { message: "sent_if_pending" };
}
async function reinvite(reg, origin, by) {
    const { teen, guardian } = await loadAll(reg);
    if (reg.status === STATUS.EXPIRED) move(reg, STATUS.PENDING_APPROVAL, by, "invitation renewed");
    const invite = await T.issue(reg._id, "guardian", origin);
    reg.expiresAt = invite.expiresAt;
    await M.send(reg, "guardian-invite", "guardian", guardian.email, inviteData(reg, teen, guardian, invite, origin, { resent: true }), origin);
    await reg.save();
}

// ---- 2. the parent or guardian --------------------------------------------------------------------------------------
export async function guardianView(req) {
    const { reg, expired } = await viaToken(req.params.token, "guardian", req.origin, { allowExpired: true });
    if (expired) fail("link_expired", { status: 410, extra: { canRenew: R.GUARDIAN_STAGES.includes(reg.status) || reg.status === STATUS.EXPIRED } });
    if (!R.GUARDIAN_STAGES.includes(reg.status)) fail(reg.status === STATUS.REJECTED ? "already_declined" : "already_done", { status: 409, extra: { status: reg.status } });
    const { teen, guardian } = await loadAll(reg);
    // opening the link from the email proves the parent controls that inbox
    if (!guardian.verification?.emailVerifiedAt) {
        guardian.verification = { ...(guardian.verification || {}), method: "email-link", emailVerifiedAt: new Date() };
        await guardian.save();
    }
    const loc = reg.teenDetails?.location || {};
    return {
        reference: reg.reference,
        status: reg.status,
        decision: reg.decision?.value || null,
        teen: {
            firstName: teen.name.first,
            age: R.ageOn(new Date(teen.dob).toISOString().slice(0, 10)),
            country: loc.countryName, countryCode: loc.country,
        },
        guardian: {
            relation: guardian.relation,
            firstName: guardian.name.first, middleName: guardian.name.middle, lastName: guardian.name.last,
            dob: guardian.dob ? guardian.dob.toISOString().slice(0, 10) : "",
            gender: guardian.gender || "",
            email: guardian.email,
            phone: guardian.phone || "",
        },
        // what the teen told us, so the form can pre-fill the country/region instead of asking again
        prefill: { country: loc.country, stateCode: loc.stateCode, state: loc.state },
        onboarding: { answers: guardian.onboarding?.answers || {}, submittedAt: guardian.onboarding?.submittedAt || null },
        consent: { version: GUARDIAN_CONSENT.version },
        expiresAt: reg.expiresAt,
    };
}

export async function guardianRenew(req) {
    const { reg } = await viaToken(req.params.token, "guardian", req.origin, { allowExpired: true });
    if (!(R.GUARDIAN_STAGES.includes(reg.status) || reg.status === STATUS.EXPIRED)) fail("already_done", { status: 409 });
    const last = [...reg.emails].reverse().find((m) => m.template === "link-renewed" || m.template === "guardian-invite");
    if (last && Date.now() - new Date(last.at).getTime() < 2 * 60 * 1000) fail("too_soon", { status: 429 });
    const { teen, guardian } = await loadAll(reg);
    if (reg.status === STATUS.EXPIRED) move(reg, STATUS.PENDING_APPROVAL, "guardian", "link renewed");
    const invite = await T.issue(reg._id, "guardian", req.origin);
    reg.expiresAt = invite.expiresAt;
    await M.send(reg, "link-renewed", "guardian", guardian.email, {
        who: "guardian",
        teen: { firstName: teen.name.first },
        guardian: { firstName: guardian.name.first },
        links: { action: M.linkTo(req.origin, "/teen/parent", invite.token) },
        expires: invite.expiresAt.toISOString(),
    }, req.origin);
    await reg.save();
    return { message: "renewed" };
}

export async function guardianDecide(req) {
    const { reg } = await viaToken(req.params.token, "guardian", req.origin);
    const d = req.body || {};
    if (!["yes", "no"].includes(d.decision)) fail("bad_request");
    if (d.confirm !== true) fail("confirm_required");
    const { teen, guardian } = await loadAll(reg);
    const origin = req.origin;

    if (d.decision === "yes") {
        if (reg.decision?.value === "yes") return { status: reg.status }; // already recorded
        if (reg.status !== STATUS.PENDING_APPROVAL) fail("bad_state", { status: 409 });
        reg.decision = { value: "yes", at: new Date(), reasons: [], comment: "" };
        move(reg, STATUS.APPROVED, "guardian");
        teen.registrationStatus = STATUS.APPROVED;
        await teen.save();
        await M.send(reg, "guardian-approved", "guardian", guardian.email, {
            teen: { firstName: teen.name.first },
            guardian: { firstName: guardian.name.first },
            links: { continue: M.linkTo(origin, "/teen/parent", req.params.token) },
            expires: reg.expiresAt?.toISOString(),
        }, origin);
        await reg.save();
        return { status: reg.status };
    }

    // NO: allowed until the parent has given consent
    if (![STATUS.PENDING_APPROVAL, STATUS.APPROVED, STATUS.PENDING_ONBOARDING, STATUS.PENDING_CONSENT].includes(reg.status)) fail("bad_state", { status: 409 });
    const errs = R.validateDecline(d);
    if (Object.keys(errs).length) fail("validation", { status: 422, fields: errs });
    reg.decision = { value: "no", at: new Date(), reasons: (d.reasons || []).slice(0, 7), comment: R.clean(d.comment, 1500) };
    // pending_* -> rejected is not in TRANSITIONS from every stage; a NO after YES is recorded as cancelled
    if (reg.status === STATUS.PENDING_APPROVAL) move(reg, STATUS.REJECTED, "guardian");
    else move(reg, STATUS.CANCELLED, "guardian", "guardian declined after starting");
    await T.revokeAll(reg._id);
    teen.registrationStatus = reg.status;
    teen.isActive = false; // cannot log in, cannot be invited to anything
    await teen.save();
    await M.send(reg, "guardian-declined", "guardian", guardian.email, {
        teen: { firstName: teen.name.first },
        guardian: { firstName: guardian.name.first },
        notRecognised: (d.reasons || []).includes("not_recognised") || (d.reasons || []).includes("not_guardian"),
    }, origin);
    await M.send(reg, "teen-declined", "teen", teen.mail, {
        teen: { firstName: teen.name.first },
        guardian: { relationLabel: relationLabel(guardian.relation) },
    }, origin);
    await reg.save();
    return { status: reg.status };
}

export async function guardianOnboarding(req) {
    const { reg } = await viaToken(req.params.token, "guardian", req.origin);
    if (![STATUS.APPROVED, STATUS.PENDING_ONBOARDING, STATUS.PENDING_CONSENT].includes(reg.status)) fail("bad_state", { status: 409, extra: { status: reg.status } });
    const { teen, guardian } = await loadAll(reg);
    const raw = (req.body && req.body.answers) || {};
    const answers = {};
    for (const [k, v] of Object.entries(raw)) {
        if (!ONBOARDING_KEYS.has(k)) continue;
        answers[k] = Array.isArray(v) ? v.map((x) => R.clean(x, 200)).slice(0, 20) : typeof v === "boolean" ? v : R.clean(v, 200);
    }
    guardian.onboarding = { ...(guardian.onboarding?.toObject?.() || guardian.onboarding || {}), answers, draftAt: new Date() };

    if (!req.body.submit) {
        if (reg.status === STATUS.APPROVED) move(reg, STATUS.PENDING_ONBOARDING, "guardian");
        await Promise.all([guardian.save(), reg.save()]);
        return { status: reg.status, saved: true };
    }

    const errs = R.validateOnboarding(answers, PARENT_SURVEY_RULES);
    if (Object.keys(errs).length) fail("validation", { status: 422, fields: errs });

    guardian.onboarding.submittedAt = new Date();
    guardian.onboarding.healthSkipped = Boolean(answers.HQ_skipped);
    guardian.verification = { ...(guardian.verification?.toObject?.() || guardian.verification || {}), authority: answers.P04 };
    // the onboarding form is the parent's own correction of what the teen typed
    guardian.name = { first: R.clean(answers["parent-first-name"], 60), middle: R.clean(answers["parent-middle-name"], 60), last: R.clean(answers["parent-last-name"], 60) };
    if (answers["parent-dob"]) guardian.dob = new Date(`${answers["parent-dob"]}T00:00:00Z`);
    if (answers["parent-gender"]) guardian.gender = answers["parent-gender"];
    if (answers.P09) guardian.phone = R.digitsOnly(answers.P09);
    if (reg.status === STATUS.APPROVED) move(reg, STATUS.PENDING_ONBOARDING, "guardian");

    if (answers.P04 === "no") {
        move(reg, STATUS.CANCELLED, "guardian", "not legally authorised (P04)");
        await T.revokeAll(reg._id);
        teen.registrationStatus = reg.status; teen.isActive = false;
        await M.send(reg, "teen-declined", "teen", teen.mail, { teen: { firstName: teen.name.first }, guardian: { relationLabel: relationLabel(guardian.relation) }, notAuthorised: true }, req.origin);
        await Promise.all([guardian.save(), teen.save(), reg.save()]);
        return { status: reg.status, stop: "not_authorised" };
    }
    if (answers.P04 === "unsure") {
        move(reg, STATUS.MANUAL_REVIEW, "guardian", "authority unsure (P04): support will contact the parent");
        teen.registrationStatus = reg.status;
        await Promise.all([guardian.save(), teen.save(), reg.save()]);
        return { status: reg.status, stop: "manual_review" };
    }
    if (reg.status !== STATUS.PENDING_CONSENT) move(reg, STATUS.PENDING_CONSENT, "guardian");
    teen.registrationStatus = reg.status;
    await Promise.all([guardian.save(), teen.save(), reg.save()]);
    return { status: reg.status };
}

export async function guardianConsent(req) {
    const { reg, tokenDoc } = await viaToken(req.params.token, "guardian", req.origin);
    if (reg.status !== STATUS.PENDING_CONSENT) fail("bad_state", { status: 409, extra: { status: reg.status } });
    const b = req.body || {};
    const errs = R.validateGuardianConsent(b, GUARDIAN_CONSENT);
    if (Object.keys(errs).length) fail("validation", { status: 422, fields: errs });
    const { teen, guardian } = await loadAll(reg);
    if (!guardian.onboarding?.submittedAt) fail("bad_state", { status: 409 });
    // one consent per link: the token is used up here, so a second click cannot record twice
    if (!(await T.consume(tokenDoc))) fail("link_used", { status: 410 });
    const now = new Date();
    const sel = b.selections || {};
    await TeenConsent.create({
        origin: req.origin,
        registration: reg._id,
        reference: reg.reference,
        party: "guardian",
        guardian: guardian._id,
        version: GUARDIAN_CONSENT.version,
        statements: GUARDIAN_CONSENT.selections.map((s) => ({ id: s.id, text: s.text, required: s.required, accepted: sel[s.id] === true })),
        sectionsRead: Array.isArray(b.sectionsRead) ? b.sectionsRead.map(Number).filter((n) => n >= 1 && n <= 19).slice(0, 19) : [],
        acceptedAt: now,
        ip: ipOf(req),
        userAgent: R.clean(req.headers["user-agent"], 300),
        language: R.clean(b.language, 12) || "en",
    });
    move(reg, STATUS.PENDING_PASSWORD, "guardian", `consent ${GUARDIAN_CONSENT.version}`);
    await T.revokeAll(reg._id, "guardian");
    teen.registrationStatus = reg.status;
    teen.parent = { relation: guardian.relation, consent: true, consentAt: now, consentVersion: GUARDIAN_CONSENT.version };
    await teen.save();
    const pw = await T.issue(reg._id, "password", req.origin);
    await M.send(reg, "guardian-complete", "guardian", guardian.email, {
        teen: { firstName: teen.name.first, emailMasked: R.maskEmail(teen.mail) },
        guardian: { firstName: guardian.name.first },
        consent: { version: GUARDIAN_CONSENT.version, at: now.toISOString(), optional: GUARDIAN_CONSENT.selections.filter((s) => !s.required).map((s) => ({ title: s.title, given: sel[s.id] === true })) },
    }, req.origin);
    await M.send(reg, "teen-password", "teen", teen.mail, {
        teen: { firstName: teen.name.first, email: teen.mail },
        guardian: { relationLabel: relationLabel(guardian.relation) },
        links: { password: M.linkTo(req.origin, "/set-password?type=teen", pw.token) },
        expires: pw.expiresAt.toISOString(),
    }, req.origin);
    await reg.save();
    return { status: reg.status, teenEmail: R.maskEmail(teen.mail) };
}

// ---- 3. the teen creates a password and the account switches on ----------------------------------------------------
export async function passwordView(req) {
    const { reg } = await viaToken(req.params.token, "password", req.origin, { allowExpired: true });
    const teen = await User.findById(reg.teen).lean();
    const r = await T.check(req.params.token, "password", req.origin);
    if (!r.ok) fail(`link_${r.reason}`, { status: 410, extra: { canRenew: reg.status === STATUS.PENDING_PASSWORD } });
    if (reg.status !== STATUS.PENDING_PASSWORD) fail("already_done", { status: 409 });
    return { firstName: teen.name.first, email: teen.mail, reference: reg.reference };
}

export async function setPassword(req) {
    const { reg, tokenDoc } = await viaToken(req.params.token, "password", req.origin);
    if (reg.status !== STATUS.PENDING_PASSWORD) fail("already_done", { status: 409 });
    const { password, confirm } = req.body || {};
    if (password !== confirm) fail("validation", { status: 422, fields: { confirm: "pw_match" } });
    const teen = await User.findById(reg.teen);
    const pErr = R.validatePassword(password, { email: teen.mail, firstName: teen.name.first });
    if (pErr) fail("validation", { status: 422, fields: { password: pErr } });
    if (!(await T.consume(tokenDoc))) fail("link_used", { status: 410 });
    await teen.setPassword(password); // also marks the email as verified (the link was opened from that inbox)
    move(reg, STATUS.ACTIVE, "teen");
    reg.activatedAt = new Date();
    teen.registrationStatus = STATUS.ACTIVE;
    teen.isActive = true;
    await teen.save();
    await writeKnownAnswers(reg, teen);
    await autoInvite(teen);
    await M.send(reg, "teen-active", "teen", teen.mail, {
        teen: { firstName: teen.name.first, email: teen.mail },
        links: { login: M.linkTo(req.origin, "/login?type=teen"), reset: M.linkTo(req.origin, "/forgot-password") },
    }, req.origin);
    await reg.save();
    return { status: reg.status, email: teen.mail };
}

// Registration answers that fill Teen profile questions, so the welcome survey and profiles never ask them again.
async function writeKnownAnswers(reg, teen) {
    const loc = reg.teenDetails?.location || {};
    const known = {
        D01: String(R.ageOn(new Date(teen.dob).toISOString().slice(0, 10))),
        D02: loc.country,
        D03: loc.stateManual ? loc.state : (loc.stateCode || loc.state),
        D06: reg.teenDetails?.gender === "Self-describe" ? "Other" : reg.teenDetails?.gender,
    };
    if (reg.teenDetails?.gender === "Self-describe" && reg.teenDetails.genderSelf) known.D06__other = reg.teenDetails.genderSelf;
    // the parent's own profiling answers (onboarding "Your home" and "Work & income") fill the same teen keys
    const guardian = await TeenGuardian.findById(reg.guardian).select("+onboarding.answers").lean();
    const all = { ...Object.fromEntries(Object.entries(known).filter(([, v]) => v).map(([k, v]) => [k, [String(v)]])), ...parentProfileAnswers(guardian) };
    await Promise.all(Object.entries(all).map(([k, answer]) => Answers.updateOne(
        { user: String(teen._id), question: stored(k), origin: teen.origin },
        { $set: { answer }, $setOnInsert: { isActive: true, isDeleted: false, sortOrder: 0 } },
        { upsert: true }
    )));
}
// same rule the normal registration uses: invite the new member to the open auto-invite surveys of their category
async function autoInvite(user) {
    try {
        const surveys = await Survey.find({ category: user.category, autoInvite: true, status: "active", isActive: true, isDeleted: false, origin: user.origin });
        if (!surveys.length) return;
        await Response.insertMany(surveys.map((s) => ({
            user: user._id, survey: { name: s.name, slug: s.slug }, status: "invited", source: s.source, points: s.points,
            isActive: true, isDeleted: false, origin: user.origin,
        })), { ordered: false });
    } catch (e) { /* a survey invite must never block activation */ }
}

// expired / lost links: one public endpoint, same answer whether or not the address exists
export async function renew(req) {
    const origin = req.origin;
    const u = await User.findOne({ mail: R.normEmail(req.body?.mail), origin, category: TEEN_CATEGORY }).lean();
    if (!u) return { message: "sent_if_pending" };
    const reg = await TeenRegistration.findOne({ teen: u._id, origin });
    if (!reg) return { message: "sent_if_pending" };
    const last = [...reg.emails].reverse().find((m) => ["link-renewed", "guardian-invite", "teen-password"].includes(m.template));
    if (last && Date.now() - new Date(last.at).getTime() < 2 * 60 * 1000) return { message: "sent_if_pending" };
    if ([STATUS.PENDING_APPROVAL, STATUS.EXPIRED].includes(reg.status)) await reinvite(reg, origin, "teen");
    else if (reg.status === STATUS.PENDING_PASSWORD) {
        const pw = await T.issue(reg._id, "password", origin);
        await M.send(reg, "link-renewed", "teen", u.mail, {
            who: "teen", teen: { firstName: u.name.first },
            links: { action: M.linkTo(origin, "/set-password?type=teen", pw.token) }, expires: pw.expiresAt.toISOString(),
        }, origin);
        await reg.save();
    }
    return { message: "sent_if_pending" };
}

// ---- 4. the signed-in teen: welcome survey and profile --------------------------------------------------------------
const LOCKED = new Set(["D01", "D02", "D03", "D06", "D06__other"]); // owned by the registration
// Parent profiling: the onboarding questions marked `profile` (Your home, Work & income) use the teen bank's own keys
// and values. What the parent answered is copied into the teen's profile on activation and is the parent's to change,
// so the teen sees it but cannot overwrite it. Questions the parent skipped stay open for the teen.
// Answers are stored under the lower-case key ("d04", "hp001_snacks"): the member-hub Profiles page asks the same
// questions from the Question collection, whose names are always lower case, so both save into one answer.
// Answers saved before Nov 2026 under the upper-case key are still read (scripts/teen-bank-2026-11 renames them).
const stored = (k) => String(k).toLowerCase();
const KEY_OF = new Map(Object.keys(PROFILE_KEYS).flatMap((k) => [[k, k], [`${k}__other`, `${k}__other`], [stored(k), k], [stored(`${k}__other`), `${k}__other`]]));
const PARENT_PROFILE_KEYS = PARENT_SURVEY_RULES.questions.filter((q) => q.profile && PROFILE_KEYS[q.n]).map((q) => q.n);
function parentProfileAnswers(guardian) {
    const a = guardian?.onboarding?.answers || {};
    const out = {};
    for (const k of PARENT_PROFILE_KEYS) {
        const list = (Array.isArray(a[k]) ? a[k] : a[k] == null ? [] : [a[k]]).map(String).filter((x) => x !== "");
        if (!list.length) continue;
        const def = PROFILE_KEYS[k];
        if (def.values && list.some((x) => !def.values.includes(x))) continue;
        out[k] = list;
        if (def.other && list.includes(def.other) && a[`${k}__other`]) out[`${k}__other`] = [String(a[`${k}__other`])];
    }
    return out;
}
async function teenOf(req) {
    if (!req.user || !String(req.user.category || "").includes("minor")) fail("not_teen", { status: 403 });
    const reg = await TeenRegistration.findOne({ teen: req.user._id, origin: req.origin });
    if (!reg || reg.status !== STATUS.ACTIVE) fail("not_active", { status: 403 });
    return reg;
}
export async function me(req) {
    const reg = await teenOf(req);
    const teen = await User.findById(reg.teen).lean();
    const g = await TeenGuardian.findById(reg.guardian).select("+onboarding.answers").lean();
    const consent = await TeenConsent.findOne({ registration: reg._id, party: "guardian" }).sort({ acceptedAt: -1 }).lean();
    const ans = await Answers.find({ user: String(teen._id), origin: req.origin, question: { $in: [...KEY_OF.keys()] } }).select("+answer").lean();
    const answers = {};
    // the lower-case (current) answer wins over an older upper-case one
    ans.sort((x, y) => (x.question === stored(x.question)) - (y.question === stored(y.question))).forEach((a) => {
        const k = KEY_OF.get(a.question); const def = PROFILE_KEYS[k];
        answers[k] = def && def.multi ? a.answer : (a.answer || [])[0];
    });
    const loc = reg.teenDetails?.location || {};
    return {
        reference: reg.reference,
        teen: {
            firstName: teen.name.first, middleName: teen.name.middle, lastName: teen.name.last,
            dob: new Date(teen.dob).toISOString().slice(0, 10), email: teen.mail, phone: teen.phone || "",
            gender: reg.teenDetails?.gender, genderSelf: reg.teenDetails?.genderSelf || "",
            location: { country: loc.country, countryName: loc.countryName, state: loc.state, city: loc.city, zip: loc.zip },
            memberSince: reg.activatedAt,
        },
        guardian: {
            relation: g?.relation, firstName: g?.name?.first, emailMasked: R.maskEmail(g?.email),
            consentVersion: consent?.version, consentAt: consent?.acceptedAt,
            optional: (consent?.statements || []).filter((s) => !s.required).map((s) => ({ id: s.id, accepted: s.accepted })),
        },
        answers,
        locked: [...LOCKED, ...Object.keys(parentProfileAnswers(g))],
        welcomeDone: Boolean(reg.welcomeDoneAt),
    };
}
export async function saveAnswers(req) {
    const reg = await teenOf(req);
    const input = (req.body && req.body.answers) || {};
    const fromParent = parentProfileAnswers(await TeenGuardian.findById(reg.guardian).select("+onboarding.answers").lean());
    const bad = {};
    const writes = [];
    for (const [k, v] of Object.entries(input)) {
        const base = k.replace(/__other$/, "");
        const def = PROFILE_KEYS[base];
        if (!def) continue;
        if (LOCKED.has(k) || LOCKED.has(base) || fromParent[base]) { bad[k] = "locked"; continue; }
        let list = (Array.isArray(v) ? v : [v]).map((x) => R.clean(x, 200)).filter((x) => x !== "");
        if (k === base) {
            if (!def.multi && list.length > 1) { bad[k] = "one_answer"; continue; }
            if (def.values && list.some((x) => !def.values.includes(x))) { bad[k] = "unknown_option"; continue; }
        }
        writes.push([k, list.slice(0, 20)]);
    }
    if (Object.keys(bad).length) fail("validation", { status: 422, fields: bad });
    await Promise.all(writes.map(([k, answer]) => Answers.updateOne(
        { user: String(reg.teen), question: stored(k), origin: req.origin },
        { $set: { answer }, $setOnInsert: { isActive: true, isDeleted: false, sortOrder: 0 } },
        { upsert: true }
    )));
    if (req.body.welcomeDone && !reg.welcomeDoneAt) { reg.welcomeDoneAt = new Date(); await reg.save(); }
    return { saved: writes.length };
}

// ---- 5. reminders and expiry (run hourly: app/jobs/teen-reminders.js or POST /api/v1/teen/jobs/sweep) --------------
const H = 3600 * 1000;
export async function sweep({ now = new Date(), dryRun = false } = {}) {
    const report = { expired: 0, guardianReminders: 0, teenReminders: 0, passwordExpired: 0 };
    // invitations that lapsed
    const lapsed = await TeenRegistration.find({ status: STATUS.PENDING_APPROVAL, expiresAt: { $lt: now } });
    for (const reg of lapsed) {
        report.expired += 1;
        if (dryRun) continue;
        const { teen, guardian } = await loadAll(reg);
        move(reg, STATUS.EXPIRED, "system");
        teen.registrationStatus = STATUS.EXPIRED; await teen.save();
        if (!M.sentBefore(reg, "link-expired", "teen")) {
            await M.send(reg, "link-expired", "teen", teen.mail, {
                who: "teen", teen: { firstName: teen.name.first }, guardian: { relationLabel: relationLabel(guardian.relation) },
                links: { action: M.linkTo(reg.origin, "/forgot-password?type=teen") },
            }, reg.origin);
        }
        await reg.save();
    }
    // reminders: every 48 h, at most 3, never within 24 h of another email
    const open = await TeenRegistration.find({ status: { $in: [STATUS.PENDING_APPROVAL, STATUS.APPROVED, STATUS.PENDING_ONBOARDING, STATUS.PENDING_CONSENT] } });
    for (const reg of open) {
        const lastAny = Math.max(0, ...reg.emails.map((m) => new Date(m.at).getTime()));
        const created = new Date(reg.createdAt).getTime();
        if ((reg.reminders?.count || 0) >= 3) continue;
        if (now.getTime() - created < 48 * H || now.getTime() - lastAny < 24 * H) continue;
        if (reg.reminders?.lastAt && now.getTime() - new Date(reg.reminders.lastAt).getTime() < 48 * H) continue;
        if (dryRun) { report.guardianReminders += 1; continue; }
        const { teen, guardian } = await loadAll(reg);
        // a fresh link, without cancelling the one the parent may already have open
        const invite = await T.issue(reg._id, "guardian", reg.origin, { revokeOthers: false });
        if (reg.status === STATUS.PENDING_APPROVAL) reg.expiresAt = invite.expiresAt;
        const stage = reg.status === STATUS.PENDING_APPROVAL ? "decision" : reg.status === STATUS.PENDING_CONSENT ? "consent" : "onboarding";
        await M.send(reg, "guardian-reminder", "guardian", guardian.email, {
            ...inviteData(reg, teen, guardian, invite, reg.origin), stage, count: (reg.reminders?.count || 0) + 1,
        }, reg.origin);
        report.guardianReminders += 1;
        if (reg.status === STATUS.PENDING_APPROVAL) {
            await M.send(reg, "teen-reminder", "teen", teen.mail, {
                teen: { firstName: teen.name.first }, guardian: { relationLabel: relationLabel(guardian.relation), emailMasked: R.maskEmail(guardian.email) },
                links: { status: M.linkTo(reg.origin, "/forgot-password?type=teen") },
            }, reg.origin);
            report.teenReminders += 1;
        }
        reg.reminders = { count: (reg.reminders?.count || 0) + 1, lastAt: now };
        await reg.save();
    }
    return report;
}
