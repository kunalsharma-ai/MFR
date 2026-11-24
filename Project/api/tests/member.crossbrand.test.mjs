// T2O, MFR and MHO share one database. The member side must read profiles, questions, options, answers and surveys of
// the member's own brand only, even when two brands use the same profile slug, question name or survey slug.
//
//   MONGO_URL=mongodb://127.0.0.1:27017/mfr_member_crossbrand node --test --test-force-exit tests/member.crossbrand.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import dns from "node:dns";
import http from "node:http";

dns.resolveMx = (domain, cb) => cb(null, [{ exchange: `mx.${domain}`, priority: 10 }]);
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const { default: mongoose } = await import("mongoose");
const { default: express } = await import("express");
const { default: cookieParser } = await import("cookie-parser");
const { default: appRoute } = await import("../app/routes/index.js");
const { setOrigin, Token } = await import("../app/utils/index.js");
const { profileProgress } = await import("../app/engagement/lifecycle.js");

await mongoose.connect(process.env.MONGO_URL || "mongodb://127.0.0.1:27017/mfr_member_crossbrand");
await mongoose.connection.db.dropDatabase();
const app = express();
app.use([express.json(), cookieParser(), setOrigin, appRoute]);
const server = await new Promise((r) => { const s = app.listen(0, "127.0.0.1", () => r(s)); });
const PORT = server.address().port;
const T2O = "www.turn2opinion.com", MFR = "www.myfrequentrewards.com", MHO = "www.myhealthopinions.com";

/** A request as a member of one brand: the brand is the Host header, as in production. */
function call(host, method, path, body, token) {
    return new Promise((resolve, reject) => {
        const raw = body ? JSON.stringify(body) : "";
        const req = http.request({ host: "127.0.0.1", port: PORT, method, path, headers: { host, "content-type": "application/json", "content-length": Buffer.byteLength(raw), "x-real-ip": "10.9.0.1", ...(token ? { authorization: `Bearer ${token}` } : {}) } }, (res) => {
            let text = "";
            res.on("data", (c) => { text += c; });
            res.on("end", () => { let json = {}; try { json = JSON.parse(text); } catch { /* not JSON */ } resolve({ status: res.statusCode, json, text }); });
        });
        req.on("error", reject);
        req.end(raw);
    });
}
const db = mongoose.connection.db;
const base = (origin) => ({ origin, isActive: true, isDeleted: false, createdAt: new Date(), updatedAt: new Date() });

// The same keys in every brand, different content. MFR's "about-you" has 2 questions, T2O's has 3, MHO's has 4.
const brands = {};
for (const [code, origin, n] of [["t2o", T2O, 3], ["mfr", MFR, 2], ["mho", MHO, 4]]) {
    const tag = `zz${code}zz`;
    const names = ["q1", "q2", "q3", "q4"].slice(0, n);
    await db.collection("Question").insertMany(names.map((name, i) => ({ ...base(origin), name, label: `${name} ${tag}`, type: "radio", category: ["b2c"], parent: i === 1 ? "q1" : null })));
    await db.collection("Option").insertMany(names.flatMap((q) => Array.from({ length: n }, (_, i) => ({ ...base(origin), question: q, value: `v${i}`, label: `Option ${i} ${tag}` }))));
    await db.collection("Profile").insertOne({ ...base(origin), slug: "about-you", name: `About you ${tag}`, category: ["b2c"], pages: [names] });
    await db.collection("Survey").insertOne({ ...base(origin), slug: "grocery", name: `Grocery ${tag}`, category: "b2c", source: "demo", points: 100, loi: 10, status: "active" });
    const user = (await db.collection("User").insertOne({ ...base(origin), name: { first: `Asha${tag}`, last: "Demo" }, mail: `asha.${code}@example.invalid`, category: "b2c", dob: new Date("1990-01-01"), gender: "Female", address: [{ country: "india" }] })).insertedId;
    await db.collection("Answer").insertOne({ ...base(origin), user: String(user), question: "q1", answer: "v0" });
    await db.collection("Response").insertOne({ ...base(origin), user, status: "invited", survey: { slug: "grocery", name: `Grocery ${tag}` } });
    brands[code] = { code, origin, tag, user, n, token: Token.generate({ _id: String(user), origin }) };
}
const others = (b) => Object.values(brands).filter((x) => x !== b);
const noLeak = (b, text, what) => { for (const o of others(b)) assert.ok(!text.includes(o.tag), `${b.code} ${what} shows ${o.code} data`); };

test("profile status counts only the member's own brand's questions and answers", async () => {
    for (const b of Object.values(brands)) {
        const r = await call(b.origin, "POST", "/api/v1/profile", {}, b.token);
        assert.equal(r.status, 200, r.text.slice(0, 300));
        noLeak(b, r.text, "profiles");
        assert.equal(r.json.data.length, 1, `${b.code} sees one profile`);
        // q1 answered; q2 applies because its parent q1 is answered; the rest have no parent
        assert.equal(r.json.data[0].status, Math.round((1 / b.n) * 100), `${b.code} completion`);
    }
});

test("question list and option counts are the brand's own", async () => {
    for (const b of Object.values(brands)) {
        const r = await call(b.origin, "GET", "/api/v1/question");
        assert.equal(r.status, 200, r.text.slice(0, 300));
        noLeak(b, r.text, "questions");
        assert.equal(r.json.data.length, b.n);
        assert.ok(r.json.data.every((q) => q.count === b.n), `${b.code} option counts: ${JSON.stringify(r.json.data.map((q) => q.count))}`);
        const q1 = r.json.data.find((q) => q.name === "q1");
        assert.deepEqual(q1.children, ["q2"], `${b.code} q1's children`);
    }
});

test("my surveys shows the brand's own survey once, even when another brand uses the same slug", async () => {
    for (const b of Object.values(brands)) {
        const r = await call(b.origin, "POST", "/api/v1/me/survey", {}, b.token);
        assert.equal(r.status, 200, r.text.slice(0, 300));
        noLeak(b, r.text, "surveys");
        assert.equal(r.json.data.length, 1);
        assert.equal(r.json.data[0].name, `Grocery ${b.tag}`);
    }
});

test("feasibility counts only the brand's own members", async () => {
    for (const b of Object.values(brands)) {
        const r = await call(b.origin, "POST", "/api/v1/feasibility", {});
        assert.equal(r.status, 200, r.text.slice(0, 300));
        assert.equal(r.json.data, 1, `${b.code} counts its one member`);
    }
});

test("profile progress for nudges and the account summary uses the brand's own profiles", async () => {
    for (const b of Object.values(brands)) {
        const p = await profileProgress({ _id: b.user, category: "b2c" }, b.origin);
        assert.equal(p.total, 1, `${b.code} has one profile`);
        const r = await call(b.origin, "GET", "/api/v1/engagement/account/summary", null, b.token);
        assert.equal(r.status, 200, r.text.slice(0, 300));
        noLeak(b, r.text, "account summary");
    }
});

test("a member token is refused on another brand", async () => {
    const r = await call(MHO, "POST", "/api/v1/profile", {}, brands.mfr.token);
    assert.ok(r.status === 401 || r.status === 403, String(r.status));
});

test.after(async () => { server.close(); await mongoose.disconnect(); });
