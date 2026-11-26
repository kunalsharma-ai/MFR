// Issues #88 and #90: Consumer and Professional sign-up offer the same five gender choices as the Teen form, and a
// middle name. The exact answer is kept in genderIdentity; `gender` stays Male | Female | Other.
//   MONGO_URL=mongodb://127.0.0.1:27017/mfr_signup_gender_test node --test --test-force-exit tests/signup.gender-name.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { start, Models } from "./helpers/harness.mjs";

const H = await start("mfr_signup_gender_test");
const { User, Category } = Models;
test.after(() => H.stop());

const body = (mail, extra) => ({
    category: "consumer", name: { first: "Sam", middle: "K", last: "Rivera" }, gender: "Other", dob: "1990-05-06", mail,
    phone: "919876543211", timezone: "UTC", address: [{ tag: "home", country: "in" }],
    notification: [{ channel: "email", category: [], identity: mail }], marketingOptIn: false, termsAccepted: true,
    ...extra,
});

test("middle name and the exact gender answer are stored", async () => {
    await Category.create({ name: "consumer", origin: H.ORIGIN, terms: [] });
    const mail = `nb-${Date.now()}@example.com`;
    const r = await H.call("PUT", "/api/v1/user", body(mail, { genderIdentity: "Non-binary" }));
    assert.equal(r.status, 200, r.text);
    assert.notEqual(r.json.status, "error", r.text);
    const u = await User.findById(r.json.data.user).lean();
    assert.equal(u.name.middle, "K");
    assert.equal(u.gender, "Other");
    assert.equal(u.genderIdentity, "Non-binary");
    assert.equal(u.genderSelf, "");
});

test("Self-describe keeps the member's words; Female maps to Female", async () => {
    const a = `sd-${Date.now()}@example.com`;
    const r = await H.call("PUT", "/api/v1/user", body(a, { gender: "Male", genderIdentity: "Self-describe", genderSelf: "  Genderfluid  " }));
    assert.notEqual(r.json.status, "error", r.text);
    const u = await User.findById(r.json.data.user).lean();
    assert.equal(u.gender, "Other", "derived from genderIdentity, not the browser's gender");
    assert.equal(u.genderSelf, "Genderfluid");

    const b = `f-${Date.now()}@example.com`;
    const r2 = await H.call("PUT", "/api/v1/user", body(b, { genderIdentity: "Female", genderSelf: "ignored" }));
    const u2 = await User.findById(r2.json.data.user).lean();
    assert.equal(u2.gender, "Female");
    assert.equal(u2.genderSelf, "");
});

test("an unknown gender answer is refused; older forms without genderIdentity still work", async () => {
    const r = await H.call("PUT", "/api/v1/user", body(`x-${Date.now()}@example.com`, { genderIdentity: "Robot" }));
    assert.equal(r.json.status, "error");
    const old = await H.call("PUT", "/api/v1/user", body(`o-${Date.now()}@example.com`, { gender: "Male", name: { first: "Old", last: "Form" } }));
    assert.notEqual(old.json.status, "error", old.text);
    const u = await User.findById(old.json.data.user).lean();
    assert.equal(u.gender, "Male");
    assert.equal(u.genderIdentity, "");
});
