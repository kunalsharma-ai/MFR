// COPIED from api/app/teen/rules.js by scripts/teen-content-sync.mjs - edit the API file, then run the script.
// Teen Panel registration rules (ages 13-17). Pure functions only, so they can be unit-tested without a database
// (tests/teen.rules.test.mjs) and so the browser rules in frontend-1 (src/teen/rules.js) can mirror them exactly.
//
// The server never trusts the browser: every rule here runs again on every request, whatever the page did.

export const MIN_AGE = 13;      // below this: registration is not permitted anywhere
export const ADULT_AGE = 18;    // 18+ use the normal Consumer / Professional registration
export const TEEN_MAX_AGE = ADULT_AGE - 1;
export const GUARDIAN_MIN_AGE = 18;

// ---- age ------------------------------------------------------------------------------------------------------------
// Real age in whole years on `now`, from an ISO date (YYYY-MM-DD). Not "this year minus birth year": a teen born on
// 21 Nov 2013 is 12 until 21 Nov 2026. Dates are read as calendar dates (UTC) so the server's time zone never matters.
export function parseIsoDate(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || "").slice(0, 10));
    if (!m) return null;
    const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
    const dt = new Date(Date.UTC(y, mo - 1, d));
    // rejects 2010-02-31 and friends
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
    return { y, mo, d, dt };
}
export function ageOn(iso, now = new Date()) {
    const p = parseIsoDate(iso);
    if (!p) return NaN;
    const ny = now.getUTCFullYear(), nm = now.getUTCMonth() + 1, nd = now.getUTCDate();
    let age = ny - p.y;
    if (nm < p.mo || (nm === p.mo && nd < p.d)) age -= 1;
    return age;
}
export function isFuture(iso, now = new Date()) {
    const p = parseIsoDate(iso);
    if (!p) return false;
    const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    return p.dt.getTime() > today;
}
// 'invalid' | 'future' | 'blocked' (under 13) | 'teen' (13-17) | 'adult' (18+) | 'implausible' (over 120)
export function classifyDob(iso, now = new Date()) {
    if (!parseIsoDate(iso)) return "invalid";
    if (isFuture(iso, now)) return "future";
    const a = ageOn(iso, now);
    if (a < MIN_AGE) return "blocked";
    if (a <= TEEN_MAX_AGE) return "teen";
    if (a > 120) return "implausible";
    return "adult";
}

// ---- statuses -------------------------------------------------------------------------------------------------------
export const STATUS = Object.freeze({
    INITIAL: "initial_registration",
    PENDING_APPROVAL: "pending_guardian_approval",
    APPROVED: "guardian_approved",
    PENDING_ONBOARDING: "pending_onboarding",
    PENDING_CONSENT: "pending_consent",
    MANUAL_REVIEW: "manual_review",
    PENDING_PASSWORD: "pending_password",
    ACTIVE: "active",
    REJECTED: "rejected",
    EXPIRED: "expired",
    CANCELLED: "cancelled",
});
// The only moves the server will make. Anything else is refused, so nobody can jump to a later stage.
export const TRANSITIONS = Object.freeze({
    initial_registration: ["pending_guardian_approval", "cancelled"],
    pending_guardian_approval: ["guardian_approved", "rejected", "expired", "cancelled"],
    guardian_approved: ["pending_onboarding", "pending_consent", "cancelled", "expired", "manual_review"],
    pending_onboarding: ["pending_consent", "manual_review", "cancelled", "expired"],
    pending_consent: ["pending_password", "pending_onboarding", "cancelled", "expired"],
    manual_review: ["pending_consent", "cancelled"],
    pending_password: ["active", "cancelled"],
    expired: ["pending_guardian_approval", "cancelled"], // renewal sends a fresh invitation
    active: [],
    rejected: [],
    cancelled: [],
});
export const canMove = (from, to) => (TRANSITIONS[from] || []).includes(to);
// Stages in which the guardian's link is usable
export const GUARDIAN_STAGES = ["pending_guardian_approval", "guardian_approved", "pending_onboarding", "pending_consent"];
export const FINAL = ["active", "rejected", "cancelled"];

// ---- text checks ----------------------------------------------------------------------------------------------------
// Names: any script (Devanagari, Arabic, CJK, accents...), spaces, apostrophes, hyphens and dots. Up to 60 characters.
const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M}\s.'’\-]{0,59}$/u;
export const validName = (s) => NAME_RE.test(String(s || "").trim());
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const normEmail = (s) => String(s || "").trim().toLowerCase();
export const validEmail = (s) => EMAIL_RE.test(normEmail(s)) && normEmail(s).length <= 254;
// E.164 without the "+": 7-15 digits. Country-specific checks run with libphonenumber-js in the controller.
export const digitsOnly = (s) => String(s || "").replace(/\D/g, "");
export const clean = (s, max = 120) => String(s ?? "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, max);

// the same three choices as Consumer and Professional sign-up (Kunal, 26 Nov 2026)
export const TEEN_GENDERS = ["Male", "Female", "Other"];
export const GUARDIAN_GENDERS = ["Male", "Female", "Other"];
export const RELATIONS = ["mother", "father", "legal_guardian"];
// The User model's gender field only knows these three; the exact answer is kept on the registration record.
export const userGender = (g) => (g === "Female" || g === "Male" ? g : "Other");

// "kunal@example.com" -> "ku•••@example.com" (domain kept so the family recognises which inbox to check)
export function maskEmail(m = "") {
    const [u, d] = String(m).split("@");
    if (!d) return "•••";
    return `${u.slice(0, 2)}${"•".repeat(Math.max(3, Math.min(5, u.length - 2)))}@${d}`;
}

// ---- step 1: the teen -----------------------------------------------------------------------------------------------
// `world` = the dataBank (theworld.json). Location rules: the country must be a real ISO code; a state picked from the
// list must belong to that country; anything typed by hand is accepted (manual: true) because the dataset is never
// complete. Countries without states / postcodes may leave them empty.
export function validateTeen(t = {}, { world = {}, now = new Date() } = {}) {
    const e = {};
    if (!validName(t.firstName)) e.firstName = "first_name";
    if (clean(t.middleName) && !validName(t.middleName)) e.middleName = "middle_name";
    if (!validName(t.lastName)) e.lastName = "last_name";
    const c = classifyDob(t.dob, now);
    if (c !== "teen") e.dob = c === "blocked" ? "under_13" : c === "adult" || c === "implausible" ? "adult" : c === "future" ? "dob_future" : "dob_invalid";
    if (!validEmail(t.email)) e.email = "email";
    if (t.phone && t.phone.number) {
        const n = digitsOnly(t.phone.number);
        if (n.length < 5 || n.length > 14) e.phone = "phone";
    }
    if (!TEEN_GENDERS.includes(t.gender)) e.gender = "gender";
    const loc = t.location || {};
    const iso = String(loc.country || "").toUpperCase();
    const cn = world[iso];
    if (!cn) e.country = "country";
    else {
        const states = cn.states || {};
        const hasStates = Object.keys(states).length > 0;
        if (loc.stateManual) { if (!clean(loc.state, 80)) e.state = "state"; }
        else if (hasStates) { if (!states[loc.stateCode]) e.state = "state"; }
        if (!clean(loc.city, 80)) e.city = "city";
        const zip = clean(loc.zip, 12);
        if (zip && !/^[\p{L}\p{N}][\p{L}\p{N}\s-]{1,11}$/u.test(zip)) e.zip = "zip";
        if (cn.zipFormat && !loc.noZip && !zip) e.zip = "zip_required";
    }
    return e;
}

// ---- step 2: the parent or guardian ---------------------------------------------------------------------------------
export function validateGuardian(g = {}, teen = {}, { now = new Date() } = {}) {
    const e = {};
    if (!RELATIONS.includes(g.relation)) e.relation = "relation";
    if (!validName(g.firstName)) e.firstName = "first_name";
    if (clean(g.middleName) && !validName(g.middleName)) e.middleName = "middle_name";
    if (!validName(g.lastName)) e.lastName = "last_name";
    const c = classifyDob(g.dob, now);
    if (c === "invalid" || c === "future") e.dob = "dob_invalid";
    else if (ageOn(g.dob, now) < GUARDIAN_MIN_AGE) e.dob = "guardian_adult";
    else if (c === "implausible") e.dob = "dob_invalid";
    if (!validEmail(g.email)) e.email = "email";
    else if (normEmail(g.email) === normEmail(teen.email)) e.email = "guardian_own_email";
    if (g.phone && g.phone.number) {
        const n = digitsOnly(g.phone.number);
        if (n.length < 5 || n.length > 14) e.phone = "phone";
    }
    // gender is asked on the Legal Guardian tab only (mother / father imply it)
    if (g.relation === "legal_guardian" && !GUARDIAN_GENDERS.includes(g.gender)) e.gender = "gender";
    return e;
}
export const guardianGender = (g) => (g.relation === "mother" ? "Female" : g.relation === "father" ? "Male" : g.gender);

// ---- step 3: the teen's confirmations -------------------------------------------------------------------------------
export function validateTeenConsent(consent = {}, statements = []) {
    const e = {};
    if (!consent || consent.version !== statements.version) e.version = "consent_version";
    const accepted = consent && consent.accepted && typeof consent.accepted === "object" ? consent.accepted : {};
    (statements.items || []).forEach((s) => { if (s.required && accepted[s.id] !== true) e[s.id] = "consent_required"; });
    return e;
}

// ---- guardian onboarding (Module 1 of the Global Teen Research Panel Questionnaire) ---------------------------------
// `survey` = content.PARENT_SURVEY_RULES. Required answers must be present and, for choice questions, one of the
// listed values (or the question's "other" value with text). Conditional questions count only when shown.
export function validateOnboarding(a = {}, survey = { questions: [] }, { now = new Date() } = {}) {
    const e = {};
    const has = (v) => (Array.isArray(v) ? v.length > 0 : String(v ?? "").trim() !== "");
    for (const q of survey.questions) {
        if (q.when && !q.when(a)) continue;
        const v = a[q.n];
        const req = q.req || (q.reqWhen && q.reqWhen(a));
        if (!has(v)) { if (req) e[q.n] = "required"; continue; }
        if (q.kind === "name" && !validName(v)) e[q.n] = "first_name";
        if (q.kind === "email" && !validEmail(v)) e[q.n] = "email";
        if (q.kind === "dob") {
            const c = classifyDob(v, now);
            if (c === "invalid" || c === "future" || c === "implausible" || ageOn(v, now) < GUARDIAN_MIN_AGE) e[q.n] = "guardian_adult";
        }
        if (q.kind === "phone") { const n = digitsOnly(v); if (n.length < 7 || n.length > 15) e[q.n] = "phone"; }
        if (q.values) {
            const vals = Array.isArray(v) ? v : [v];
            if (!q.multi && Array.isArray(v)) e[q.n] = "one_answer";
            if (vals.some((x) => !q.values.includes(x))) e[q.n] = "unknown_option";
            if (q.exclusive && vals.length > 1 && vals.some((x) => q.exclusive.includes(x))) e[q.n] = "exclusive";
        }
    }
    return e;
}

// ---- guardian consent (MINOR-2026.10 Part B selections) -------------------------------------------------------------
export function validateGuardianConsent(c = {}, form = { version: "", selections: [] }) {
    const e = {};
    if (!c || c.version !== form.version) e.version = "consent_version";
    const sel = (c && c.selections) || {};
    form.selections.forEach((s) => {
        if (s.required && sel[s.id] !== true) e[s.id] = "consent_required";
        if (sel[s.id] !== undefined && typeof sel[s.id] !== "boolean") e[s.id] = "consent_invalid";
    });
    return e;
}

// ---- passwords ------------------------------------------------------------------------------------------------------
export function validatePassword(pw = "", { email = "", firstName = "" } = {}) {
    const p = String(pw);
    if (p.length < 8) return "pw_short";
    if (p.length > 128) return "pw_long";
    if (!/[A-Za-z]/.test(p) || !/\d/.test(p)) return "pw_mix";
    const low = p.toLowerCase();
    const local = normEmail(email).split("@")[0];
    if (local && local.length >= 4 && low.includes(local)) return "pw_personal";
    if (firstName && firstName.length >= 3 && low.includes(String(firstName).toLowerCase())) return "pw_personal";
    if (/^(.)\1+$/.test(p) || ["password1", "12345678a", "qwerty123", "abc12345"].includes(low)) return "pw_common";
    return null;
}

// ---- decline reasons ------------------------------------------------------------------------------------------------
export const DECLINE_REASONS = ["not_now", "understand_more", "privacy", "surveys", "not_guardian", "not_recognised", "other"];
export function validateDecline(d = {}) {
    const e = {};
    const r = Array.isArray(d.reasons) ? d.reasons : [];
    // reasons and the comment are both optional: the guardian never has to explain a "no"
    if (r.some((x) => !DECLINE_REASONS.includes(x))) e.reasons = "reason_unknown";
    if (clean(d.comment, 2000).length > 1500) e.comment = "too_long";
    return e;
}
