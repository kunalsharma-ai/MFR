// Unit tests for the Teen registration rules (no database).   node --test tests/
import test from "node:test";
import assert from "node:assert/strict";
import * as R from "../app/teen/rules.js";

const on = (iso) => new Date(`${iso}T12:00:00Z`);

test("real age, not year difference", () => {
    assert.equal(R.ageOn("2013-11-22", on("2026-11-21")), 12); // birthday tomorrow
    assert.equal(R.ageOn("2013-11-21", on("2026-11-21")), 13); // birthday today
    assert.equal(R.ageOn("2008-11-22", on("2026-11-21")), 17);
    assert.equal(R.ageOn("2008-11-21", on("2026-11-21")), 18);
    assert.equal(R.ageOn("2012-02-29", on("2025-02-28")), 12);
    assert.equal(R.ageOn("2012-02-29", on("2025-03-01")), 13);
});

test("classify: under 13 blocked, 13-17 teen, 18+ adult, bad dates refused", () => {
    const now = on("2026-11-21");
    assert.equal(R.classifyDob("2013-11-22", now), "blocked");
    assert.equal(R.classifyDob("2013-11-21", now), "teen");
    assert.equal(R.classifyDob("2008-11-22", now), "teen");
    assert.equal(R.classifyDob("2008-11-21", now), "adult");
    assert.equal(R.classifyDob("2027-01-01", now), "future");
    assert.equal(R.classifyDob("2010-02-31", now), "invalid");
    assert.equal(R.classifyDob("hello", now), "invalid");
    assert.equal(R.classifyDob("1890-01-01", now), "implausible");
});

test("status machine refuses skipping stages", () => {
    assert.ok(R.canMove("pending_guardian_approval", "guardian_approved"));
    assert.ok(!R.canMove("pending_guardian_approval", "active"));
    assert.ok(!R.canMove("pending_guardian_approval", "pending_password"));
    assert.ok(!R.canMove("guardian_approved", "active"));
    assert.ok(R.canMove("pending_consent", "pending_password"));
    assert.ok(R.canMove("pending_password", "active"));
    assert.ok(!R.canMove("rejected", "pending_guardian_approval"));
    assert.ok(!R.canMove("active", "pending_password"));
});

const world = { IN: { name: "India", zipFormat: "\\d{6}", states: { DL: { name: "Delhi", cities: ["New Delhi"] } } }, SG: { name: "Singapore", states: {} } };
const teen = {
    firstName: "Aarav", lastName: "Sharma", dob: "2011-05-04", email: "aarav@example.com", gender: "Male",
    location: { country: "IN", stateCode: "DL", city: "New Delhi", zip: "110085" },
};

test("teen details: names from any script, location rules", () => {
    const now = on("2026-11-21");
    assert.deepEqual(R.validateTeen(teen, { world, now }), {});
    assert.deepEqual(R.validateTeen({ ...teen, firstName: "आरव", lastName: "O’Brien-Núñez" }, { world, now }), {});
    assert.equal(R.validateTeen({ ...teen, firstName: "" }, { world, now }).firstName, "first_name");
    assert.equal(R.validateTeen({ ...teen, dob: "2015-01-01" }, { world, now }).dob, "under_13");
    assert.equal(R.validateTeen({ ...teen, dob: "2000-01-01" }, { world, now }).dob, "adult");
    assert.equal(R.validateTeen({ ...teen, location: { ...teen.location, stateCode: "XX" } }, { world, now }).state, "state");
    // typed by hand is accepted
    assert.deepEqual(R.validateTeen({ ...teen, location: { ...teen.location, stateCode: "", stateManual: true, state: "My region" } }, { world, now }), {});
    // a country without states or postcodes
    assert.deepEqual(R.validateTeen({ ...teen, location: { country: "SG", city: "Singapore" } }, { world, now }), {});
    assert.equal(R.validateTeen({ ...teen, location: { ...teen.location, zip: "" } }, { world, now }).zip, "zip_required");
    assert.deepEqual(R.validateTeen({ ...teen, location: { ...teen.location, zip: "", noZip: true } }, { world, now }), {});
    assert.equal(R.validateTeen({ ...teen, gender: "x" }, { world, now }).gender, "gender");
});

test("guardian: adult, own email, gender only for legal guardian", () => {
    const now = on("2026-11-21");
    const g = { relation: "mother", firstName: "Priya", lastName: "Sharma", dob: "1985-03-02", email: "priya@example.com" };
    assert.deepEqual(R.validateGuardian(g, teen, { now }), {});
    assert.equal(R.validateGuardian({ ...g, email: teen.email }, teen, { now }).email, "guardian_own_email");
    assert.equal(R.validateGuardian({ ...g, dob: "2010-01-01" }, teen, { now }).dob, "guardian_adult");
    assert.equal(R.validateGuardian({ ...g, relation: "legal_guardian" }, teen, { now }).gender, "gender");
    assert.deepEqual(R.validateGuardian({ ...g, relation: "legal_guardian", gender: "Other" }, teen, { now }), {});
    assert.equal(R.guardianGender({ relation: "father" }), "Male");
});

test("teen consent: every required box, right version", () => {
    const st = { version: "V1", items: [{ id: "a", required: true }, { id: "b", required: true }] };
    assert.deepEqual(R.validateTeenConsent({ version: "V1", accepted: { a: true, b: true } }, st), {});
    assert.equal(R.validateTeenConsent({ version: "V1", accepted: { a: true } }, st).b, "consent_required");
    assert.equal(R.validateTeenConsent({ version: "V0", accepted: { a: true, b: true } }, st).version, "consent_version");
    assert.equal(R.validateTeenConsent({ version: "V1", accepted: { a: "yes", b: true } }, st).a, "consent_required");
});

test("passwords", () => {
    assert.equal(R.validatePassword("short1"), "pw_short");
    assert.equal(R.validatePassword("abcdefgh"), "pw_mix");
    assert.equal(R.validatePassword("aarav2026x", { email: "aarav@x.com" }), "pw_personal");
    assert.equal(R.validatePassword("Blue-Kite-42"), null);
});

test("masking", () => {
    assert.equal(R.maskEmail("priya.sharma@example.com"), "pr•••••@example.com");
    assert.equal(R.maskEmail("ab@x.io"), "ab•••@x.io");
});
