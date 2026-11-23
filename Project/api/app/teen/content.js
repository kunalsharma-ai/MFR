// Server copy of the Teen registration content (generated from frontend-1/src/teen/data by
// frontend-1/scripts/teen-content-sync.mjs). The API records the exact statement texts and versions from here,
// never from the request, so a consent record always shows what was really on screen.
import { readFileSync } from "fs";

const data = JSON.parse(readFileSync(new URL("./content.json", import.meta.url), "utf-8"));

export const TEEN_CONSENT = data.teenConsent;
export const GUARDIAN_CONSENT = data.guardianConsent;
export const WELCOME = data.welcome;
export const PROFILE_KEYS = data.profileKeys;

// Conditional rules of the onboarding form (the browser has the same two rules in parentSurvey.js)
const asList = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);
const RULES = {
    P09: { reqWhen: (a) => asList(a.P07).some((v) => ["sms", "call", "whatsapp"].includes(v)) },
    HQ4: { when: (a) => ["primary", "shared"].includes(a.HQ2) },
};
export const PARENT_SURVEY_RULES = {
    id: data.parentSurvey.id,
    questions: data.parentSurvey.questions.map((q) => ({ ...q, ...(RULES[q.n] || {}) })),
};
export const ONBOARDING_KEYS = new Set(
    data.parentSurvey.questions.flatMap((q) => [q.n, ...(q.fields || []), `${q.n}__other`, `${q.n}__country`])
        .concat(["parent-name", "P05", "HQ_skipped"])
);
