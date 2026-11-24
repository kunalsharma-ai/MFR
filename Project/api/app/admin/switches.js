// Feature switches (super admin spec, step 4). MADP allows only its Super Admin to call set/kill and always sends a
// reason. A switch can be set for the whole brand or narrowed to a segment and/or a country; some carry a number.
// See engagement/switches.js for the order in which rows apply and how callers read them.
import * as S from "../engagement/switches.js";
import { AdminError } from "./http.js";

function scopeFrom({ segment, country } = {}) {
    const seg = segment == null || segment === "" ? null : String(segment).trim().toLowerCase();
    const cty = country == null || country === "" ? null : String(country).trim().toLowerCase();
    if (seg && !S.SEGMENTS.includes(seg)) throw new AdminError("invalid_segment", `segment is one of ${S.SEGMENTS.join(", ")}`);
    if (cty && !S.COUNTRY.test(cty)) throw new AdminError("invalid_country", "country is a country name or code");
    return { segment: seg, country: cty };
}

export const board = (origin, query = {}) => S.board(origin, scopeFrom(query));

export async function set(origin, key, { on, reason, segment, country, value } = {}, actor) {
    if (!S.isKey(key)) throw new AdminError("not_found", "No such switch", 404);
    const scope = scopeFrom({ segment, country });
    const narrow = Boolean(scope.segment || scope.country);
    if (key === S.KILL && narrow) throw new AdminError("invalid_scope", "The kill switch is for the whole brand");
    if (on === null && !narrow) throw new AdminError("invalid_value", "Only a segment or country setting can be removed");
    if (on !== null && typeof on !== "boolean") throw new AdminError("invalid_value", "on is true or false");
    if (!reason || String(reason).trim().length < 5) throw new AdminError("reason_required", "A reason is required");
    const v = S.spec(key)?.value;
    let num;
    if (value !== undefined && value !== null) {
        if (!v) throw new AdminError("invalid_value", "This switch has no number");
        num = Number(value);
        if (!Number.isFinite(num) || num < v.min || num > v.max) throw new AdminError("invalid_value", `value is from ${v.min} to ${v.max} ${v.unit}`);
        num = v.step >= 1 ? Math.round(num) : Math.round(num * 10) / 10;
    }
    const r = await S.set(origin, key, on, String(reason).trim().slice(0, 500), actor, { ...scope, value: num });
    return { ...r, board: await S.board(origin, scope) };
}
