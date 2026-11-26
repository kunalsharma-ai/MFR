// Issues #88 and #90, and Kunal's 26 Nov 2026 change: every sign-up offers Male, Female and Other, and a middle name.
//   MONGO_URL=mongodb://127.0.0.1:27017/mfr_signup_gender_test node --test --test-force-exit tests/signup.gender-name.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { start, Models } from "./helpers/harness.mjs";
import * as R from "../app/teen/rules.js";

const H = await start("mfr_signup_gender_test");
const { User, Category } = Models;
test.after(() => H.stop());

const body = (mail, extra) => ({
    category: "consumer", name: { first: "Sam", middle: "K", last: "Rivera" }, gender: "Other", dob: "1990-05-06", mail,
    phone: "919876543211", timezone: "UTC", address: [{ tag: "home", country: "in" }],
    notification: [{ channel: "email", category: [], identity: mail }], marketingOptIn: false, termsAccepted: true,
    ...extra,
});

test("middle name and gender Other are stored", async () => {
    await Category.create({ name: "consumer", origin: H.ORIGIN, terms: [] });
    const r = await H.call("PUT", "/api/v1/user", body(`o-${Date.now()}@example.com`));
    assert.equal(r.status, 200, r.text);
    assert.notEqual(r.json.status, "error", r.text);
    const u = await User.findById(r.json.data.user).lean();
    assert.equal(u.name.middle, "K");
    assert.equal(u.gender, "Other");
});

test("a gender outside Male, Female, Other is refused", async () => {
    const r = await H.call("PUT", "/api/v1/user", body(`x-${Date.now()}@example.com`, { gender: "Non-binary" }));
    assert.equal(r.json.status, "error");
});

test("Teen and guardian offer the same three choices", () => {
    assert.deepEqual(R.TEEN_GENDERS, ["Male", "Female", "Other"]);
    assert.deepEqual(R.GUARDIAN_GENDERS, ["Male", "Female", "Other"]);
});
