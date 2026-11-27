// Issues #106-#113 (Sanjeet QA, 27 Nov 2026), against a real MongoDB:
//   #106 a completed profile is paid as soon as its answers are saved (no 3-second wait)
//   #107 every Quality Score change is listed on the Quality page (events)
//   #112 Settings > Sessions lists every signed-in device and can sign one out
//   #113 the Teen sign-up can be sent to PUT /api/v1/user with category "minor" (same handler as /teen/register)
//   node --test --test-force-exit tests/issues.106-113.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { start, Models, outbox } from "./helpers/harness.mjs";

const H = await start("mfr_issues_106_113");
test.after(() => H.stop());
const { Profile, Question, User, MemberSession, TeenRegistration } = Models;

test("#106 #107 a profile is paid and logged the moment it is completed", async () => {
    await Question.create({ name: "q-basic-1", label: "Q1", type: "radio", category: ["b2c"], origin: H.ORIGIN });
    await Profile.create({ name: "basic", slug: "basic", category: "b2c", pages: [["q-basic-1"]], points: 40, origin: H.ORIGIN });
    const m = await H.member({ category: "b2c" });
    // a read right before the save used to leave the next reads with the old, unpaid result for 3 seconds
    await H.call("POST", "/api/v1/rewards", {}, m.token);
    const save = await H.call("PATCH", "/api/v1/me/profile", { "q-basic-1": "a" }, m.token);
    assert.equal(save.json.status, "success", save.text);
    assert.equal(save.json.data.paid, 1);
    const s = await H.call("GET", "/api/v1/engagement/summary", null, m.token);
    assert.equal(s.json.data.balances.earned, 40);
    const q = await H.call("GET", "/api/v1/engagement/quality", null, m.token);
    assert.equal(q.json.data.score, 101);
    assert.equal(q.json.data.events.length, 1);
    assert.deepEqual(
        (({ rule, delta, from, to, name }) => ({ rule, delta, from, to, name }))(q.json.data.events[0]),
        { rule: "profile_complete", delta: 1, from: 100, to: 101, name: "basic" },
    );
    // saving the same answers again pays nothing more and logs nothing more
    const again = await H.call("PATCH", "/api/v1/me/profile", { "q-basic-1": "b" }, m.token);
    assert.equal(again.json.data.paid, 0);
    const q2 = await H.call("GET", "/api/v1/engagement/quality", null, m.token);
    assert.equal(q2.json.data.events.length, 1);
});

async function login(mail, password, ua) {
    const res = await fetch(`${H.BASE}/api/v1/user/login`, {
        method: "POST", redirect: "manual",
        headers: { "content-type": "application/json", "user-agent": ua, "x-real-ip": `10.9.0.${Math.floor(Math.random() * 200) + 1}` },
        body: JSON.stringify({ mail, password }),
    });
    const cookie = res.headers.get("set-cookie") || "";
    const m = /authorization=Bearer%20([^;]+)/.exec(cookie) || /authorization=Bearer ([^;]+)/.exec(cookie);
    assert.ok(m, `no login cookie (${res.status})`);
    return decodeURIComponent(m[1]);
}

test("#112 every signed-in device is listed and can be signed out", async () => {
    const m = await H.member({ category: "b2c", extra: { isVerified: { email: "verified" } } });
    const u = await User.findById(m.id);
    await u.setPassword("Secret-pass-123");
    const mail = u.mail;
    const a = await login(mail, "Secret-pass-123", "Mozilla/5.0 (Windows NT 10.0) Chrome/120.0 Safari/537.36");
    const b = await login(mail, "Secret-pass-123", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Version/17.0 Mobile Safari/604.1");
    const list = await H.call("GET", "/api/v1/me/sessions", null, a);
    assert.equal(list.json.status, "success", list.text);
    const rows = list.json.data.sessions;
    assert.equal(rows.length, 2);
    assert.deepEqual(rows.map((r) => r.device).sort(), ["Chrome · Windows", "Safari · iOS"]);
    assert.equal(rows.filter((r) => r.current).length, 1);
    assert.equal(rows.find((r) => r.current).device, "Chrome · Windows");
    // signing out the phone from the computer: the phone's token stops working at once
    const phone = rows.find((r) => !r.current);
    const end = await H.call("POST", `/api/v1/me/sessions/${phone.id}/end`, {}, a);
    assert.equal(end.json.status, "success", end.text);
    const refused = await H.call("GET", "/api/v1/me/sessions", null, b);
    assert.equal(refused.status, 401);
    assert.equal(refused.json.code, "session_ended");
    // this device can't be ended from the list (that is Log out), and log out ends it
    const self = await H.call("POST", `/api/v1/me/sessions/${rows.find((r) => r.current).id}/end`, {}, a);
    assert.equal(self.json.status, "error");
    await H.call("DELETE", "/api/v1/me", null, a);
    assert.equal((await H.call("GET", "/api/v1/me/sessions", null, a)).status, 401);
    // another member can't end someone else's session
    const c = await login(mail, "Secret-pass-123", "Mozilla/5.0 Firefox/120.0 (X11; Linux x86_64)");
    const other = await H.member({ category: "b2c" });
    const cRow = (await H.call("GET", "/api/v1/me/sessions", null, c)).json.data.sessions[0];
    const steal = await H.call("POST", `/api/v1/me/sessions/${cRow.id}/end`, {}, other.token);
    assert.equal(steal.json.status, "error");
    assert.equal((await H.call("GET", "/api/v1/me/sessions", null, c)).status, 200);
    // tokens from before sessions were recorded (no sid) keep working
    assert.equal((await H.call("GET", "/api/v1/me/sessions", null, m.token)).status, 200);
    assert.equal(await MemberSession.countDocuments({ user: u._id, endedAt: null }), 1);
});

const iso = (yearsAgo) => { const d = new Date(); d.setUTCFullYear(d.getUTCFullYear() - yearsAgo); d.setUTCDate(d.getUTCDate() - 3); return d.toISOString().slice(0, 10); };
test("#113 the Teen sign-up works through PUT /api/v1/user with category minor", async () => {
    const { TEEN_CONSENT } = await import("../app/teen/content.js");
    const body = {
        category: "minor",
        idempotencyKey: `key-${Math.random().toString(36).slice(2)}-${Date.now()}`,
        timezone: "Asia/Kolkata", language: "en",
        teen: {
            firstName: "Aarav", middleName: "", lastName: "Sharma", dob: iso(15), email: `aarav.${Date.now()}@example.com`,
            phone: { country: "IN", number: "9876543210" }, gender: "Male",
            location: { country: "IN", stateCode: "DL", city: "New Delhi", zip: "110085" },
        },
        guardian: { relation: "mother", firstName: "Priya", lastName: "Sharma", dob: "1984-06-12", email: `priya.${Date.now()}@example.com`, phone: { country: "IN", number: "9876543211" } },
        consent: { version: TEEN_CONSENT.version, accepted: Object.fromEntries(TEEN_CONSENT.items.map((s) => [s.id, true])) },
    };
    const r = await H.call("PUT", "/api/v1/user", body);
    assert.equal(r.json.status, "success", r.text);
    assert.equal(r.json.data.status, "pending_guardian_approval");
    assert.ok(await TeenRegistration.exists({ reference: r.json.data.reference }));
    const teen = await User.findOne({ mail: body.teen.email }).lean();
    assert.equal(teen.category, "b2c-minor");
    assert.notEqual(teen.registrationStatus, "active"); // no log in before the guardian says yes
    // both emails go out: the guardian's YES/NO invite and the teen's "you're in the queue"
    const sent = outbox().map((m) => [m.data?.template, m.to || m.data?.to]);
    assert.ok(outbox().some((m) => m.data?.template === "guardian-invite"), JSON.stringify(sent));
    assert.ok(outbox().some((m) => m.data?.template === "teen-registered"), JSON.stringify(sent));
    // a teen's date of birth with the adult body is still refused there
    const adult = await H.call("PUT", "/api/v1/user", { category: "consumer", name: { first: "A", last: "B" }, gender: "Male", dob: iso(15), mail: `x${Date.now()}@example.com`, phone: "919876543299", address: [{ tag: "home", country: "in" }] });
    assert.equal(adult.json.status, "error");
});
