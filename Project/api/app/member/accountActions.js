// "Delete or Deactivate Account" (My Account > Account Settings, the page built from account-actions-src/).
// The page sends POST /api/v1/auth/delete with { id, action, password }:
//   action 30 | 60 | 90  deactivate for that many days
//   action -1            put the account on hold, no end date
//   action "Delete"      delete the account and its data
//   action "reactivate"  take a deactivated or held account back (the page has no button for it yet)
// Nothing changes on the account here. Each request is filed as a DataRequest for the support team, who review it
// (open reward requests, points holds, a Teen's guardian) and carry it out by hand, as the page tells the member
// ("Processed by Support, within 7 working days"). The member must type their password again.
import { DataRequest, User } from "../model/index.js";

export class AccountActionError extends Error {
    constructor(message, status = 400, code = "invalid") {
        super(message);
        this.status = status;
        this.code = code;
    }
}

const DAYS = [30, 60, 90];

/** { kind, days } for the page's action code, or null when it is not one of them. */
export function parseAction(action) {
    if (typeof action === "number" || /^-?\d+$/.test(String(action ?? "").trim())) {
        const n = Number(action);
        if (n === -1) return { kind: "hold", days: null };
        if (DAYS.includes(n)) return { kind: "deactivate", days: n };
        return null;
    }
    const a = String(action ?? "").trim().toLowerCase();
    if (a === "delete") return { kind: "delete", days: null };
    if (a === "reactivate") return { kind: "reactivate", days: null };
    return null;
}

const REASON = {
    deactivate: (d) => `Deactivate the account for ${d} days (requested from My Account)`,
    hold: () => "Put the account on hold, no end date (requested from My Account)",
    delete: () => "Delete the account and its data (requested from My Account)",
    reactivate: () => "Reactivate the account (requested from My Account)",
};

export async function fileAccountAction(member, origin, body = {}) {
    const parsed = parseAction(body.action);
    if (!parsed) throw new AccountActionError("This action is not available.");
    if (body.id && String(body.id) !== String(member._id)) throw new AccountActionError("This request is not for your account.", 403, "forbidden");

    const password = typeof body.password === "string" ? body.password : "";
    if (!password) throw new AccountActionError("Please enter your password.", 401, "password");
    const user = await User.findById(member._id);
    if (!user) throw new AccountActionError("This request is not for your account.", 403, "forbidden");
    let ok = false;
    try {
        ok = await user.verifyPassword(password);
    } catch (e) {
        throw new AccountActionError("Your account has no password yet. Set one with Forgot password, then try again.", 401, "password");
    }
    if (!ok) throw new AccountActionError("That password is not right. Please try again.", 401, "password");

    const { kind, days } = parsed;
    try {
        const r = await DataRequest.create({
            user: user._id, kind, days: days ?? undefined, origin,
            reason: REASON[kind](days),
            history: [{ status: "requested", by: "member" }],
        });
        return { requestId: String(r._id), kind, days, status: r.status };
    } catch (e) {
        if (e?.code === 11000) throw new AccountActionError("We already have this request and our Support Team is looking at it.", 409, "already");
        throw e;
    }
}

