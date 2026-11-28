// Issue #98: a Teen registration sends TWO emails through the real pipes (email-template builds them, email sends them):
//   - guardian-invite  to the parent or guardian (YES / NO links)
//   - teen-registered  to the teen ("your parent has your invite")
// Unlike teen.api.test.mjs this test does NOT use TEEN_MAIL_OUTBOX, so it checks the calls the live server makes.
//
//   MONGO_URL=mongodb://127.0.0.1:27017/mfr_teen_mail_test node --test --test-force-exit tests/teen.mail.test.mjs
//
// Needs: a MongoDB, the dataBank at /src/app/dataBank, and email-template + email resolving to 127.0.0.1 (stubs on
// :8080 and :3000), or EMAIL_TEMPLATE_URL / EMAIL_SERVICE_URL pointing at them.
import test from "node:test";
import assert from "node:assert/strict";
import dns from "node:dns";
import http from "node:http";

dns.resolveMx = (domain, cb) => cb(null, [{ exchange: `mx.${domain}`, priority: 10 }]);
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
delete process.env.TEEN_MAIL_OUTBOX;
process.env.PUBLIC_SITE_URL = "https://www.myfrequentrewards.com";
process.env.TEEN_MAIL_RETRY_MS = "10";
process.env.EMAIL_TEMPLATE_URL = process.env.EMAIL_TEMPLATE_URL || "http://127.0.0.1:8080";
process.env.EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || "http://127.0.0.1:3000";

const { default: mongoose } = await import("mongoose");
const { default: express } = await import("express");
const { default: cookieParser } = await import("cookie-parser");
const { default: appRoute } = await import("../app/routes/index.js");
const { setOrigin } = await import("../app/utils/index.js");
const Models = await import("../app/model/index.js");
const { TEEN_CONSENT } = await import("../app/teen/content.js");

const built = []; // { category, template }
const sent = []; // { to, subject }
let failTemplateOnce = new Set(); // template names whose next build answers 500
const stub = (port, fn) => new Promise((r) => {
    const s = http.createServer((req, res) => {
        let b = "";
        req.on("data", (c) => (b += c));
        req.on("end", () => {
            const out = fn(req, b ? JSON.parse(b) : {});
            res.statusCode = out.status || 200;
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify(out.body));
        });
    });
    s.listen(port, "127.0.0.1", () => r(s));
});
const stubs = await Promise.all([
    stub(8080, (req) => {
        const [, , , , category, template] = req.url.split("/"); // /api/v1/mailer/<category>/<template>
        built.push({ category, template });
        if (failTemplateOnce.has(template)) { failTemplateOnce.delete(template); return { status: 500, body: { status: "error", message: "busy" } }; }
        return { body: { data: `<html>${category}/${template}</html>` } }; // the template service answer is passed on as the content
    }),
    stub(3000, (req, body) => { sent.push({ to: body.to, subject: body.subject, content: body.content }); return { body: { status: "success" } }; }),
]);

await mongoose.connect(process.env.MONGO_URL || "mongodb://127.0.0.1:27017/mfr_teen_mail_test");
await mongoose.connection.db.dropDatabase();
// build the unique indexes before the first request (the "409 already exists" checks rely on them; dropping the
// database while the models' start-up index build runs could leave one missing for a moment)
const IndexModels = await import("../app/model/index.js");
await Promise.all(Object.values(IndexModels).map((m) => m.init?.().then(() => m.createIndexes()).catch(() => {})));
await Promise.all(Object.values(Models).map((m) => m.syncIndexes?.().catch(() => {})));

const app = express();
app.set("trust proxy", false);
app.use([express.json(), cookieParser(), setOrigin, appRoute]);
const server = await new Promise((r) => { const s = app.listen(0, "127.0.0.1", () => r(s)); });
const BASE = `http://127.0.0.1:${server.address().port}`;

let ipN = 1;
async function register(body) {
    const res = await fetch(`${BASE}/api/v1/teen/register`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-real-ip": `10.1.0.${ipN++ % 250}` },
        body: JSON.stringify(body),
    });
    return { status: res.status, json: await res.json() };
}
const iso = (yearsAgo) => { const d = new Date(); d.setUTCFullYear(d.getUTCFullYear() - yearsAgo); d.setUTCDate(d.getUTCDate() - 3); return d.toISOString().slice(0, 10); };
const allTicked = Object.fromEntries(TEEN_CONSENT.items.map((s) => [s.id, true]));
const body = (teenMail, guardianMail) => ({
    idempotencyKey: `key-${Math.random().toString(36).slice(2)}-${Date.now()}`,
    timezone: "Asia/Kolkata",
    language: "en",
    teen: {
        firstName: "Aarav", middleName: "", lastName: "Sharma", dob: iso(15), email: teenMail,
        phone: { country: "IN", number: "9876543210" }, gender: "Male",
        location: { country: "IN", stateCode: "DL", city: "New Delhi", zip: "110085" },
    },
    guardian: { relation: "mother", firstName: "Priya", lastName: "Sharma", dob: "1984-06-12", email: guardianMail },
    consent: { version: TEEN_CONSENT.version, accepted: allTicked },
});

test.after(async () => {
    await mongoose.disconnect();
    server.close();
    stubs.forEach((s) => s.close());
    setTimeout(() => process.exit(process.exitCode || 0), 200).unref();
});

test("teen registration emails the parent (approval) and the teen (acknowledgement)", async () => {
    built.length = 0; sent.length = 0;
    const r = await register(body("aarav.mail@example.com", "priya.mail@example.com"));
    assert.equal(r.json.status, "success", JSON.stringify(r.json));
    assert.equal(r.json.data.status, "pending_guardian_approval");

    assert.deepEqual(built.map((b) => `${b.category}/${b.template}`), ["teen/guardian-invite", "teen/teen-registered"]);
    assert.equal(sent.length, 2);
    const toParent = sent.find((m) => m.to === "priya.mail@example.com");
    const toTeen = sent.find((m) => m.to === "aarav.mail@example.com");
    assert.ok(toParent, "the parent gets an email");
    assert.ok(toTeen, "the teen gets an email");
    assert.match(toParent.subject, /Yes or no/);
    assert.match(toTeen.subject, /parent or guardian has your invite/);
    assert.deepEqual(toParent.content, { data: "<html>teen/guardian-invite</html>" });

    const reg = await Models.TeenRegistration.findOne({ reference: r.json.data.reference }).lean();
    assert.deepEqual(reg.emails.map((e) => [e.template, e.to, e.ok]), [["guardian-invite", "guardian", true], ["teen-registered", "teen", true]]);
});

test("one failed build is tried again, so neither email is lost", async () => {
    built.length = 0; sent.length = 0;
    failTemplateOnce = new Set(["guardian-invite", "teen-registered"]);
    const r = await register(body("kabir.mail@example.com", "vikram.mail@example.com"));
    assert.equal(r.json.status, "success", JSON.stringify(r.json));
    assert.deepEqual(sent.map((m) => m.to).sort(), ["kabir.mail@example.com", "vikram.mail@example.com"]);
});

test("start-up check reports a template service that can't build teen emails", async () => {
    const { checkTeenTemplates } = await import("../app/utils/deployChecks.js");
    assert.equal(await checkTeenTemplates(), true);
    failTemplateOnce = new Set(["guardian-invite"]);
    assert.equal(await checkTeenTemplates(), false);
});
