// Shared set-up for the engagement API tests: a real MongoDB, the real routes, members created straight in the DB.
//   MONGO_URL=mongodb://127.0.0.1:27017/mfr_engagement_test node --test tests/engagement.*.test.mjs
import dns from "node:dns";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

dns.resolveMx = (domain, cb) => cb(null, [{ exchange: `mx.${domain}`, priority: 10 }]);
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
export const OUTBOX = fs.mkdtempSync(path.join(os.tmpdir(), "eng-outbox-"));
process.env.ENGAGEMENT_MAIL_OUTBOX = OUTBOX;
process.env.TEEN_MAIL_OUTBOX = OUTBOX;
process.env.PUBLIC_SITE_URL = "https://www.myfrequentrewards.com";

const { default: mongoose } = await import("mongoose");
const { default: express } = await import("express");
const { default: cookieParser } = await import("cookie-parser");
const { default: appRoute } = await import("../../app/routes/index.js");
const { setOrigin, Token } = await import("../../app/utils/index.js");
export const Models = await import("../../app/model/index.js");
export { mongoose };

export async function start(db = "mfr_engagement_test") {
    // a fresh database per run (dropping one while the app's start-up queries run makes them fail)
    const url = process.env.MONGO_URL || `mongodb://127.0.0.1:27017/${db}_${Date.now()}`;
    await mongoose.connect(url);
    await Promise.all(Object.values(Models).map((m) => m.syncIndexes?.().catch(() => {})));
    const app = express();
    app.use([express.json(), cookieParser(), setOrigin, appRoute]);
    const server = await new Promise((r) => { const s = app.listen(0, "127.0.0.1", () => r(s)); });
    const BASE = `http://127.0.0.1:${server.address().port}`;
    const ORIGIN = `127.0.0.1:${server.address().port}`;
    let n = 0;
    async function member(over = {}) {
        n += 1;
        const u = await Models.User.create({
            name: { first: over.first || `Member${n}`, last: "Test" },
            gender: "Female",
            dob: over.dob || new Date("1990-01-01"),
            mail: `m${n}-${Date.now()}@example.com`,
            timezone: over.timezone || "Asia/Kolkata",
            category: over.category || "b2c",
            origin: ORIGIN,
            ...(over.extra || {}),
        });
        if (over.role) await Models.User.updateOne({ _id: u._id }, { $set: { role: over.role } });
        const token = Token.generate({ _id: String(u._id), origin: ORIGIN });
        return { user: u, id: String(u._id), token };
    }
    async function call(method, url, body, token) {
        const headers = { "content-type": "application/json", "x-real-ip": `10.1.0.${(n++ % 250) + 1}` };
        if (token) headers.authorization = `Bearer ${token}`;
        const res = await fetch(`${BASE}${url}`, { method, headers, body: body ? JSON.stringify(body) : undefined, redirect: "manual" });
        const text = await res.text();
        let json = {};
        try { json = JSON.parse(text); } catch { /* csv / html */ }
        return { status: res.status, json, text, headers: res.headers };
    }
    async function stop() {
        server.close();
        if (!process.env.MONGO_URL) await mongoose.connection.db.dropDatabase().catch(() => {});
        await mongoose.disconnect();
        // rate-limit stores and the app's start-up timers keep the event loop alive; the test result is already set
        setTimeout(() => process.exit(), 1000).unref();
    }
    return { BASE, ORIGIN, member, call, stop };
}
export const outbox = () => fs.readdirSync(OUTBOX).sort().map((f) => JSON.parse(fs.readFileSync(path.join(OUTBOX, f), "utf-8")));
