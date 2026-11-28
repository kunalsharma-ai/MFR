// Issue #124: /api/v1/user/apps (admin "Integrated Applications" page) adds apps and makes API tokens for live data.
//   node --test --test-force-exit tests/apps.token.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { start, Models } from "./helpers/harness.mjs";

const H = await start("mfr_apps_token");
test.after(() => H.stop());

test("only admins can use /api/v1/user/apps", async () => {
    const m = await H.member();
    assert.equal((await H.call("GET", "/api/v1/user/apps")).status, 401);
    assert.equal((await H.call("GET", "/api/v1/user/apps", null, m.token)).status, 403);
    assert.equal((await H.call("PUT", "/api/v1/user/apps", { name: { first: "X" } }, m.token)).status, 403);
});

test("an admin adds an app, makes a token, and the token reads live admin data", async () => {
    const admin = await H.member({ role: "root" });
    const add = await H.call("PUT", "/api/v1/user/apps", { name: { first: "Live feed", last: "app" }, role: "root", gender: "Other" }, admin.token);
    assert.equal(add.json.status, "success", add.text);
    const id = add.json.data._id;
    assert.equal(add.json.data.fullName, "Live feed");
    // the app is not a member record
    assert.equal(await Models.User.countDocuments({ "name.first": "Live feed" }), 0);

    const list = await H.call("GET", "/api/v1/user/apps", null, admin.token);
    assert.equal(list.status, 200);
    assert.deepEqual(list.json.data.map((a) => a._id), [id]);
    assert.equal(list.json.data[0].isActive, true);

    const made = await H.call("POST", "/api/v1/user/apps", { _id: id }, admin.token);
    assert.equal(made.status, 200, made.text);
    const token = made.json.data.token;
    assert.ok(token);
    // the admin's own sign-in cookie is not replaced
    assert.equal(made.headers.get("set-cookie"), null);

    // the token works on an admin endpoint (the member list) ...
    const live = await H.call("GET", "/api/v1/user", null, token);
    assert.equal(live.status, 200, live.text);
    assert.ok(Array.isArray(live.json.data));
    // ... but cannot manage apps
    assert.equal((await H.call("GET", "/api/v1/user/apps", null, token)).status, 403);
    // last used is recorded
    await new Promise((r) => setTimeout(r, 100));
    assert.ok((await Models.IntegratedApp.findById(id).lean()).lastUsedAt);

    // a new token stops the old one
    const again = await H.call("POST", "/api/v1/user/apps", { _id: id }, admin.token);
    const token2 = again.json.data.token;
    assert.equal((await H.call("GET", "/api/v1/user", null, token)).status, 401);
    assert.equal((await H.call("GET", "/api/v1/user", null, token2)).status, 200);

    // rename, then switch off: the token stops working and no new token can be made
    const ren = await H.call("PATCH", "/api/v1/user/apps", { _id: id, name: { first: "Feed 2" } }, admin.token);
    assert.equal(ren.json.data.fullName, "Feed 2");
    const off = await H.call("PATCH", "/api/v1/user/apps", { _id: id, isActive: false }, admin.token);
    assert.equal(off.json.data.isActive, false);
    assert.equal((await H.call("GET", "/api/v1/user", null, token2)).status, 401);
    assert.equal((await H.call("POST", "/api/v1/user/apps", { _id: id }, admin.token)).status, 400);
    const on = await H.call("PATCH", "/api/v1/user/apps", { _id: id, isActive: true }, admin.token);
    assert.equal(on.json.data.isActive, true);
    assert.equal((await H.call("GET", "/api/v1/user", null, token2)).status, 200);
});

test("bad input", async () => {
    const admin = await H.member({ role: "root" });
    assert.equal((await H.call("PUT", "/api/v1/user/apps", { name: { first: "  " } }, admin.token)).status, 400);
    assert.equal((await H.call("POST", "/api/v1/user/apps", { _id: "not-an-id" }, admin.token)).status, 404);
    assert.equal((await H.call("POST", "/api/v1/user/apps", { _id: "64b000000000000000000000" }, admin.token)).status, 404);
    // a member id is not an app
    assert.equal((await H.call("POST", "/api/v1/user/apps", { _id: admin.id }, admin.token)).status, 404);
});
