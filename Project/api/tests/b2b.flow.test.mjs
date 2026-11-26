// The whole B2B (Professional) sign-up, the way the browser does it (BUG-08, sign-up QA report 25 Nov 2026):
// register → set the password from the emailed link → log in → accept the member terms → Settings > Terms →
// complete a profile → points and Quality Score.
//   MONGO_URL=mongodb://127.0.0.1:27017/mfr_b2b_flow_test node --test --test-force-exit tests/b2b.flow.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { start, Models } from "./helpers/harness.mjs";

const H = await start("mfr_b2b_flow_test");
const { User, OTP, Category, Profile, Question, Answers } = Models;
test.after(() => H.stop());

const mail = `pro-${Date.now()}@example.com`;
const password = "Str0ng!Passw0rd";

test("B2B sign-up works end to end", async () => {
    await Category.create({
        name: "b2b", origin: H.ORIGIN,
        terms: [{ name: "pro-terms", body: "<p>I accept the <b>Professional Terms</b></p>", isRequired: true }],
    });

    // 1. the sign-up form (frontend-1 utils/registerPayload.js for memberType "professional")
    const reg = await H.call("PUT", "/api/v1/user", {
        category: "b2b", name: { first: "Priya", last: "Pro" }, gender: "Female", dob: "1988-04-02", mail,
        phone: "919876543210", timezone: "Asia/Kolkata",
        address: [{ tag: "home", country: "in", state: "Maharashtra", city: "Mumbai" }],
        notification: [{ channel: "email", category: [], identity: mail }], marketingOptIn: false, termsAccepted: true,
    });
    assert.equal(reg.status, 200, reg.text);
    assert.notEqual(reg.json.status, "error", reg.text);
    const id = String(reg.json.data.user);
    assert.equal(typeof reg.json.data.emailSent, "boolean", "the page is told whether the email really went");
    let u = await User.findById(id).lean();
    assert.equal(u.category, "b2b");
    assert.ok(u.termsAcceptance?.signupAt, "the sign-up box is dated");

    // 2. the set-password link from the email
    const otp = await OTP.findOne({ user: id, channel: "email" }).lean();
    assert.ok(otp, "a code was issued for the email link");
    const set = await H.call("PATCH", "/api/v1/user", { userID: id, emailOTP: otp.code, password, confirmPassword: password });
    assert.notEqual(set.json.status, "error", set.text);
    assert.equal(set.json.data.emailVerified, true, "setting the password from the email link confirms the email");

    // 3. log in
    const login = await H.call("POST", "/api/v1/user/login", { mail, password });
    assert.notEqual(login.json.status, "error", login.text);
    const cookie = login.headers.get("set-cookie") || "";
    const token = (login.json.token || decodeURIComponent(cookie).match(/authorization=Bearer ([^;]+)/)?.[1] || "").trim();
    assert.ok(token, "login gives a session");

    // 4. the member terms page (web auth/terms + consent/b2b)
    const cat = await H.call("POST", "/api/v1/category", { name: "b2b" }, token);
    assert.notEqual(cat.json.status, "error", cat.text);
    const put = await H.call("PUT", `/api/v1/user/${id}`, { terms: ["pro-terms"] }, token);
    assert.equal(put.status, 200, put.text);
    assert.notEqual(put.json.status, "error", put.text);

    // 5. Settings > Terms
    const terms = await H.call("GET", "/api/v1/me/terms", null, token);
    assert.equal(terms.status, 200, terms.text);
    const items = terms.json.data.items;
    assert.equal(items.find((i) => i.id === "signup")?.accepted, true);
    assert.equal(items.find((i) => i.id === "pro-terms")?.accepted, true);

    // 6. a completed B2B profile is paid once and adds +1
    await Profile.create({ name: "Work life", slug: "work-life", category: "b2b", pages: [["wl1"]], origin: H.ORIGIN });
    await Question.create({ name: "wl1", label: "wl1", type: "radio", category: ["b2b"], origin: H.ORIGIN });
    await Answers.create({ user: id, question: "wl1", answer: ["yes"], origin: H.ORIGIN });
    const q0 = (await User.findById(id).lean()).qualityScore;
    const pts = await H.call("GET", "/api/v1/me/points", null, token);
    assert.equal(pts.status, 200, pts.text);
    assert.equal(pts.json.data.profilePoints, 50, pts.text);
    u = await User.findById(id).lean();
    assert.equal(u.qualityScore - q0, 1);
    assert.equal(u.isVerified.email, "verified");
});

test("a registration still succeeds when the email services are down, and says the email was not sent", async () => {
    const r = await H.call("PUT", "/api/v1/user", {
        category: "b2b", name: { first: "Down", last: "Mail" }, gender: "Male", dob: "1985-01-01", mail: `down-${Date.now()}@example.com`,
        phone: "919800000001", timezone: "UTC", address: [{ tag: "home", country: "in" }], notification: [], termsAccepted: true,
    });
    assert.equal(r.status, 200, r.text);
    assert.equal(r.json.data.emailSent, false);
});

test("deploy checks name a missing social sign-in key and an email service without an account", async () => {
    const { checkSocialKey, checkMailAccounts } = await import("../app/utils/deployChecks.js");
    assert.equal(checkSocialKey({}), false);
    assert.equal(checkSocialKey({ SOCIAL_JWT_SECRET: "s".repeat(40) }), true);
    const http = await import("node:http");
    const srv = http.createServer((req, res) => {
        const o = new URL(req.url, "http://x").searchParams.get("origin");
        res.writeHead(o === "myfrequentrewards.com" ? 200 : 503, { "content-type": "application/json" }).end("{}");
    });
    await new Promise((r) => srv.listen(0, "127.0.0.1", r));
    const url = `http://127.0.0.1:${srv.address().port}`;
    assert.equal(await checkMailAccounts({ EMAIL_SERVICE_URL: url, MAIL_ORIGINS: "myfrequentrewards.com" }), true);
    assert.equal(await checkMailAccounts({ EMAIL_SERVICE_URL: url, MAIL_ORIGINS: "myfrequentrewards.com,www.other.com" }), false);
    srv.close();
    assert.equal(await checkMailAccounts({ EMAIL_SERVICE_URL: "http://127.0.0.1:1", MAIL_ORIGINS: "a.com" }), null);
});
