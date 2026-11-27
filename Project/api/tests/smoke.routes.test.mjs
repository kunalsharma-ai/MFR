// Smoke checks that every deploy should pass (MFR test case sheet: API & security).
//   node --test --test-force-exit tests/smoke.routes.test.mjs   (needs MongoDB, like the other API tests)
import test from "node:test";
import assert from "node:assert/strict";

process.env.GIT_SHA = "abc1234";
process.env.BUILD_DATE = "2026-11-27T00:00:00Z";
const { start } = await import("./helpers/harness.mjs");
const H = await start("mfr_smoke_routes");
test.after(() => H.stop());

test("#95 GET /api/v1/version reports the deployed build", async () => {
    const r = await H.call("GET", "/api/v1/version");
    assert.equal(r.status, 200);
    assert.deepEqual(r.json.data, { commit: "abc1234", builtAt: "2026-11-27T00:00:00Z" });
});

test("security headers are on API replies", async () => {
    const r = await H.call("GET", "/api/v1/version");
    assert.equal(r.headers.get("x-content-type-options"), "nosniff");
    assert.equal(r.headers.get("x-frame-options"), "DENY");
    assert.match(r.headers.get("strict-transport-security") || "", /max-age=\d+/);
});

test("member routes refuse a visitor with no sign-in", async () => {
    for (const [method, url] of [
        ["GET", "/api/v1/me"], ["GET", "/api/v1/me/sessions"], ["GET", "/api/v1/me/about-you"], ["GET", "/api/v1/me/points"],
        ["POST", "/api/v1/rewards"], ["GET", "/api/v1/support/mine"], ["GET", "/api/v1/engagement/summary"],
    ]) {
        const r = await H.call(method, url, method === "GET" ? null : {});
        assert.ok([401, 403].includes(r.status) || r.json.status === "error", `${method} ${url} answered ${r.status} ${r.text.slice(0, 120)}`);
        assert.notEqual(r.json.status, "success", `${method} ${url} must not succeed without a sign-in`);
    }
});

test("a signed-in member can read their own record", async () => {
    const m = await H.member();
    const r = await H.call("GET", "/api/v1/me", null, m.token);
    assert.equal(r.json.status, "success", r.text);
    assert.equal(String(r.json.data?._id || r.json.data?.id), m.id);
});

test("options: the country data loads outside Docker (zip code pattern)", async () => {
    const r = await H.call("POST", "/api/v1/options/zipcode", { country: "IN" });
    assert.equal(r.json.status, "success", r.text);
    assert.ok(r.json.data[0].pattern, "a base64 zip pattern");
});
