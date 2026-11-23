// GET /api/v1/teen/me/family — what the teen's parent or guardian submitted, for the Teen profile (Nov 2026).
//
// Read only. Nothing here writes, copies or re-asks anything: it reads the records the registration already keeps
//   TeenRegistration  status, history, the guardian's YES/NO, what the teen typed at sign-up
//   TeenGuardian      the parent's details and their onboarding answers (Module 1, P01...P12, HQ1...)
//   TeenConsent       the teen's sign-up assent and the guardian's consent (version, statements, time)
//   Redemption        learning-reward requests and the guardian's YES/NO on each
//   GuardianLink      read-only activity links the teen sent to the guardian
//
// Who can see it: only the signed-in teen whose registration it is (req.user is that teen; there is no id in the
// request, so no other account can be asked for). Nothing is returned until the guardian has said YES, finished the
// onboarding form and given consent, and the teen's account is active. IP address and browser of the consent stay
// on the server (select: false) and are never sent.
import { User, TeenRegistration, TeenGuardian, TeenConsent, Redemption, GuardianLink } from "../model/index.js";
import { PARENT_SURVEY_RULES, GUARDIAN_CONSENT, TEEN_CONSENT } from "./content.js";
import { config } from "../engagement/config.js";
import { world, TeenError } from "./service.js";
import * as R from "./rules.js";

const { STATUS } = R;
const iso = (d) => (d ? new Date(d).toISOString() : null);
const day = (d) => (d ? new Date(d).toISOString().slice(0, 10) : null);
const list = (v) => (Array.isArray(v) ? v : v == null || v === "" ? [] : [v]);

// One onboarding answer as the parent gave it: the exact option wording, with "Other" text, or the place name
// for a country / region code. `answered: false` means the parent left it empty (or the question did not apply).
function answerOf(q, a, w) {
    const raw = a[q.n];
    if (q.kind === "name") {
        const parts = (q.fields || []).map((f) => String(a[f] || "").trim()).filter(Boolean);
        return { answered: parts.length > 0, display: parts.length ? [parts.join(" ")] : [] };
    }
    if (q.kind === "country") {
        const c = String(raw || "").toUpperCase();
        return { answered: Boolean(c), display: c ? [w[c]?.name || c] : [], code: c || undefined };
    }
    if (q.kind === "region") {
        const c = String(a.P01 || "").toUpperCase();
        const v = String(raw || "");
        return { answered: Boolean(v), display: v ? [w[c]?.states?.[v]?.name || v] : [], code: v || undefined };
    }
    if (q.kind === "language") return { answered: Boolean(raw), display: raw ? [String(raw)] : [], code: raw ? String(raw) : undefined, format: "language" };
    if (q.kind === "dob") return { answered: Boolean(raw), display: raw ? [String(raw)] : [], format: "date" };
    const vals = list(raw).map(String);
    const display = vals.map((v) => {
        const label = q.labels?.[v] || v;
        const other = q.other && v === q.other && a[`${q.n}__other`] ? `: ${a[`${q.n}__other`]}` : "";
        return `${label}${other}`;
    });
    if (q.kind === "phone" && raw && a[`${q.n}__country`]) return { answered: true, display, country: String(a[`${q.n}__country`]) };
    return { answered: vals.length > 0, display };
}

function onboardingView(g, w) {
    const a = g.onboarding?.answers || {};
    const sections = [];
    PARENT_SURVEY_RULES.questions.forEach((q) => {
        let s = sections.find((x) => x.name === q.section);
        if (!s) { s = { name: q.section, optional: q.optional, questions: [] }; sections.push(s); }
        const applies = typeof q.when === "function" ? q.when(a) : true;
        const ans = answerOf(q, a, w);
        s.questions.push({ n: q.n, q: q.q || q.n, kind: q.kind, required: q.req, applies, ...ans });
    });
    // the questionnaire's age band (P05): only when the form actually sent one (the current page sends the date of birth)
    const band = a.P05;
    const about = sections.find((s) => s.name === "About you");
    if (about && band) {
        const i = about.questions.findIndex((x) => x.n === "parent-dob");
        about.questions.splice(i + 1, 0, { n: "P05", q: "Age group", kind: "band", required: false, applies: true, answered: true, display: [String(band)] });
    }
    return {
        form: PARENT_SURVEY_RULES.id,
        submittedAt: iso(g.onboarding?.submittedAt),
        healthSkipped: Boolean(g.onboarding?.healthSkipped),
        sections,
    };
}

function consentView(c, catalogue) {
    const byId = Object.fromEntries((catalogue || []).map((s) => [s.id, s]));
    return {
        party: c.party,
        version: c.version,
        acceptedAt: iso(c.acceptedAt),
        language: c.language || null,
        sectionsRead: c.sectionsRead || [],
        // the statement texts were recorded with the consent: show those, not today's wording
        statements: (c.statements || []).map((s) => ({ id: s.id, title: byId[s.id]?.title || null, text: s.text, required: Boolean(s.required), accepted: s.accepted === true })),
    };
}

// The empty form: every section and question the parent will be asked, and every consent permission, with no
// answers. Lets the profile show all the fields ("not filled yet") before the parent has finished.
function skeleton() {
    const form = onboardingView({ onboarding: {} }, {});
    form.sections.forEach((s) => s.questions.forEach((q) => { q.applies = true; }));
    return {
        onboarding: { ...form, submittedAt: null },
        consent: {
            version: GUARDIAN_CONSENT.version,
            statements: GUARDIAN_CONSENT.selections.map((s) => ({ id: s.id, title: s.title || null, text: s.text, required: Boolean(s.required), accepted: null })),
        },
        rewards: { redemptionsOpen: Boolean(config().teen?.redemptionsEnabled), guardianApprovalRequired: true },
    };
}

export async function family(req) {
    if (!req.user || !String(req.user.category || "").includes("minor")) {
        throw new TeenError("not_teen", { status: 403 });
    }
    const origin = req.origin;
    const reg = await TeenRegistration.findOne({ teen: req.user._id, origin }).sort({ createdAt: -1 }).lean();
    if (!reg) return { ready: false, found: false, steps: { approved: false, onboarding: false, consent: false, active: false }, skeleton: skeleton() };

    const [g, consents] = await Promise.all([
        TeenGuardian.findById(reg.guardian).select("+onboarding.answers").lean(),
        TeenConsent.find({ registration: reg._id }).sort({ acceptedAt: 1 }).lean(),
    ]);
    const guardianConsent = [...consents].reverse().find((c) => c.party === "guardian") || null;
    const steps = {
        approved: reg.decision?.value === "yes",
        onboarding: Boolean(g?.onboarding?.submittedAt),
        consent: Boolean(guardianConsent),
        active: reg.status === STATUS.ACTIVE,
    };
    const ready = Boolean(g) && steps.approved && steps.onboarding && steps.consent && steps.active;
    // not finished: say how far it got, and nothing the parent submitted
    if (!ready) return { ready: false, found: true, status: reg.status, reference: reg.reference, steps, skeleton: skeleton() };

    const teen = await User.findById(reg.teen).select("name dob mail phone").lean();
    const w = world();
    const [requests, views] = await Promise.all([
        Redemption.find({ user: reg.teen, origin }).sort({ createdAt: -1 }).limit(50).lean(),
        GuardianLink.find({ teen: reg.teen, origin, purpose: "view" }).sort({ createdAt: -1 }).select("createdAt expiresAt").lean(),
    ]);
    const td = reg.teenDetails || {};
    const loc = td.location || {};
    const teenAssent = consents.find((c) => c.party === "teen") || null;
    const at = (status) => iso((reg.history || []).find((h) => h.status === status)?.at);
    const cfg = config().teen || {};

    return {
        ready: true,
        reference: reg.reference,
        status: reg.status,
        registration: {
            submittedAt: iso(reg.createdAt) || at(STATUS.INITIAL),
            decision: { value: reg.decision?.value || null, at: iso(reg.decision?.at) },
            onboardingAt: iso(g.onboarding?.submittedAt),
            consentAt: iso(guardianConsent.acceptedAt),
            activatedAt: iso(reg.activatedAt),
            welcomeDoneAt: iso(reg.welcomeDoneAt),
            timeline: (reg.history || []).map((h) => ({ status: h.status, at: iso(h.at), by: h.by || null })),
        },
        guardian: {
            relation: g.relation,
            firstName: g.name?.first || "", middleName: g.name?.middle || "", lastName: g.name?.last || "",
            dob: day(g.dob),
            gender: g.gender || "",
            email: g.email,
            phone: g.phone || "",
            verification: {
                method: g.verification?.method || null,
                emailVerifiedAt: iso(g.verification?.emailVerifiedAt),
                authority: g.verification?.authority || null,
            },
        },
        onboarding: onboardingView(g, w),
        teen: {
            firstName: teen?.name?.first || "", middleName: teen?.name?.middle || "", lastName: teen?.name?.last || "",
            dob: day(teen?.dob), email: teen?.mail || "", phone: td.phone || teen?.phone || "",
            gender: td.gender || "", genderSelf: td.genderSelf || "",
            location: { country: loc.country || "", countryName: loc.countryName || "", state: loc.state || "", city: loc.city || "", zip: loc.zip || "", noZip: Boolean(loc.noZip) },
            language: td.language || "",
        },
        consent: {
            guardian: consentView(guardianConsent, GUARDIAN_CONSENT.selections),
            teen: teenAssent ? consentView(teenAssent, TEEN_CONSENT.items) : null,
            // the full text of the agreement the guardian accepted, when the recorded version is the current one
            document: guardianConsent.version === GUARDIAN_CONSENT.version
                ? { version: GUARDIAN_CONSENT.version, effective: GUARDIAN_CONSENT.effective, declaration: GUARDIAN_CONSENT.declaration }
                : { version: guardianConsent.version, effective: null, declaration: null },
            assent: teenAssent && teenAssent.version === TEEN_CONSENT.version ? { version: TEEN_CONSENT.version, agreement: TEEN_CONSENT.agreement, points: TEEN_CONSENT.assentPoints } : null,
        },
        rewards: {
            // from the engagement settings: Teens earn points only (never money) and every learning reward needs
            // the guardian's YES by email
            redemptionsOpen: Boolean(cfg.redemptionsEnabled),
            guardianApprovalRequired: true,
            requests: requests.map((r) => ({
                reference: r.reference, title: r.item?.title || "", kind: r.item?.kind || "", points: r.points, status: r.status,
                guardian: { decision: r.guardian?.decision || null, at: iso(r.guardian?.at) },
                requestedAt: iso(r.createdAt),
            })),
            viewLinks: { sent: views.length, lastAt: iso(views[0]?.createdAt), activeUntil: iso(views.find((v) => v.expiresAt > new Date())?.expiresAt) },
        },
        // what the registration does not record, so the profile can say so instead of guessing
        notRecorded: [
            "consent_receipt",      // the receipt number on the consent page (made in the browser, not sent to the server)
            "consent_timezone",     // the guardian's time zone at consent (the time itself is kept, in UTC)
            "consent_page_version", // the page design version (v2.0.1); the server keeps the agreement version
            "reward_questions",     // the onboarding form has no questions about reward preferences or expectations
        ],
    };
}
