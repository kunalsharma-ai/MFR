// Issues #91, #92 and #93 (26 Nov 2026).
//   - the email services are found under either known host name, or the one set in EMAIL_TEMPLATE_URL / EMAIL_SERVICE_URL
//   - a forgot-password request still answers normally when no email service can be found
//   - Google sign-in for an existing member sets the login cookie and redirects to the dashboard (never raw JSON)
//   MONGO_URL=mongodb://127.0.0.1:27017/mfr_mail_social_test node --test --test-force-exit tests/mail.social.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import JWT from "jsonwebtoken";

process.env.SOCIAL_JWT_SECRET = "s".repeat(40);
const { start, Models } = await import("./helpers/harness.mjs");
const { candidates, withService, _reset } = await import("../app/utils/serviceHosts.js");
const H = await start("mfr_mail_social_test");
test.after(() => H.stop());

const stub = () => new Promise((r) => {
    const s = http.createServer((req, res) => { res.setHeader("content-type", "application/json"); res.end(JSON.stringify({ ok: true, path: req.url })); });
    s.listen(0, "127.0.0.1", () => r(s));
});

test("a missing host name moves on to the next candidate and is remembered", async () => {
    const s = await stub();
    const env = { EMAIL_TEMPLATE_URL: `http://no-such-host.invalid:8080, http://127.0.0.1:${s.address().port}` };
    _reset();
    const r = await withService("template", {}, (api) => api.post("/api/v1/mailer/register/respondent", {}), env);
    assert.equal(r.status, 200);
    assert.equal(r.data.path, "/api/v1/mailer/register/respondent");
    assert.equal(candidates("template", env)[0], `http://127.0.0.1:${s.address().port}`);
    s.close();
});

test("both known names are tried when nothing is set", () => {
    _reset();
    assert.deepEqual(candidates("template", {}), ["http://email-template:8080", "http://api-email-template:8080"]);
    assert.deepEqual(candidates("email", {}), ["http://email:3000", "http://api-email:3000"]);
});

test("forgot password answers normally when the email services can't be reached", async () => {
    const m = await H.member();
    const r = await H.call("POST", "/api/v1/forgot-password", { user: m.user.mail });
    assert.equal(r.status, 200, r.text);
    assert.equal(r.json.status, "success");
    assert.doesNotMatch(r.text, /EAI_AGAIN|getaddrinfo/);
});

test("Google sign-in of an existing member redirects to the dashboard with the login cookie", async () => {
    const m = await H.member();
    await Models.User.updateOne({ _id: m.id }, { $set: { "isVerified.email": "verified" } });
    const token = JWT.sign({ email: m.user.mail.toUpperCase(), name: "Member" }, process.env.SOCIAL_JWT_SECRET, { algorithm: "HS256" });
    const r = await H.call("GET", `/api/v1/auth/socials?token=${encodeURIComponent(token)}`);
    assert.equal(r.status, 302, r.text);
    assert.equal(r.headers.get("location"), "/member/dashboard");
    assert.match(r.headers.get("set-cookie") || "", /^authorization=Bearer/);
    assert.doesNotMatch(r.text, /"token"/);
});

test("GET /api/v1/version says which build is running", async () => {
    const r = await H.call("GET", "/api/v1/version");
    assert.equal(r.status, 200);
    assert.ok(r.json.data.commit);
});
