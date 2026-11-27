// MADP Panel API Contract discovery (app/admin/contract.js, GET /api/v1/contract). Run: node --test tests/admin.contract.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CAPABILITIES, CONTRACT_VERSION, discoveryFor } from "../app/admin/contract.js";

test("declares contract 1.1.0, the signed brand and the admin capabilities", () => {
    const d = discoveryFor("WWW.MyFrequentRewards.com", { GIT_SHA: "abc123" });
    assert.equal(d.contract, "madp-panel-api");
    assert.equal(d.version, CONTRACT_VERSION);
    assert.deepEqual(d.brands, [{ origin: "www.myfrequentrewards.com" }]);
    assert.deepEqual(d.implementation, { name: "panel-admin-api", version: "abc123" });
    assert.ok(d.capabilities.includes("contract.discovery"));
    assert.ok(d.capabilities.includes("admin.members"));
    assert.ok(d.capabilities.every((c) => c === "contract.discovery" || c.startsWith("admin.")));
});

test("every declared admin group has routes in admin/routes.js", () => {
    const routes = readFileSync(new URL("../app/admin/routes.js", import.meta.url), "utf8");
    const prefix = {
        "admin.members": "/members", "admin.members.actions": "/reset-password", "admin.members.engagement": "/engagement",
        "admin.members.duplicates": "/members/duplicates", "admin.members.archive": "/members/archive-run",
        "admin.question_bank": "/qb/", "admin.profiles": "/profiles", "admin.about_you": "/about-you", "admin.segments": "/segments",
        "admin.audiences": "/audiences", "admin.surveys": "/surveys", "admin.points": "/points/", "admin.quality": "/quality/",
        "admin.experts": "/experts", "admin.tickets": "/tickets", "admin.messages": "/messages", "admin.help": "/help",
        "admin.content": "/content", "admin.switches": "/switches", "admin.reminders": "/reminders",
        "admin.prize_machines": "/prize-machines", "admin.reports": "/reports/", "admin.rewards": "/redemptions",
        "admin.draws": "/draws", "admin.offers": "/offers", "admin.engagement": "/engagement/", "admin.teens": "/teens",
        "admin.data_requests": "/data-requests"
    };
    for (const c of CAPABILITIES.filter((x) => x !== "contract.discovery")) {
        assert.ok(prefix[c], `no route check for ${c}`);
        assert.ok(routes.includes(prefix[c]), `${c}: no ${prefix[c]} route`);
    }
});

test("the route is signed like the admin API", () => {
    const index = readFileSync(new URL("../app/routes/index.js", import.meta.url), "utf8");
    assert.match(index, /\.get\("\/api\/v1\/contract", requireMadp,/);
});

test("holds no personal data", () => {
    assert.ok(!/@|mail|phone/.test(JSON.stringify(discoveryFor("www.turn2opinion.com"))));
});
