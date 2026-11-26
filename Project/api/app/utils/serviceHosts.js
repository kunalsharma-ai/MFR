// Where the two internal email services live (issues #91 and #92, Nov 2026).
//
// The API used to call one fixed host name for each: email-template:8080 and email:3000. Older deployments named
// the template service api-email-template, and a server whose docker-compose name does not match the code gets
// "getaddrinfo EAI_AGAIN <name>" on every registration and password-reset email.
//
// Now:
//   - EMAIL_TEMPLATE_URL / EMAIL_SERVICE_URL (comma separated) win when set, e.g. EMAIL_TEMPLATE_URL=http://api-email-template:8080
//   - otherwise both known names are tried in turn
// A name that does not resolve or refuses the connection moves on to the next one; the one that answered is
// remembered for the rest of the process.
import API from "./API.js";

const DEFAULTS = {
    template: ["http://email-template:8080", "http://api-email-template:8080"],
    email: ["http://email:3000", "http://api-email:3000"],
};
const ENV = { template: "EMAIL_TEMPLATE_URL", email: "EMAIL_SERVICE_URL" };
// only "this name/host is not there" errors move to the next candidate; a slow or failing service does not
const NOT_THERE = new Set(["ENOTFOUND", "EAI_AGAIN", "ECONNREFUSED", "EHOSTUNREACH"]);

const working = {};

export function candidates(kind, env = process.env) {
    const set = String(env[ENV[kind]] || "").split(",").map((s) => s.trim()).filter(Boolean);
    const list = set.length ? set : DEFAULTS[kind];
    const first = working[kind];
    return first && list.includes(first) ? [first, ...list.filter((u) => u !== first)] : list;
}

// call(api) runs against each candidate until one is reachable; throws the last error when none is
export async function withService(kind, headers, call, env = process.env) {
    let last;
    for (const baseURL of candidates(kind, env)) {
        try {
            const r = await call(new API({ baseURL, headers }));
            working[kind] = baseURL;
            return r;
        } catch (e) {
            last = e;
            if (!NOT_THERE.has(e?.code)) throw e;
        }
    }
    throw last || new Error(`no ${kind} service configured`);
}

export function _reset() { for (const k of Object.keys(working)) delete working[k]; }
