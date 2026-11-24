// Feature switches (super admin spec, step 4). MADP allows only its Super Admin to call set/kill and always sends a
// reason. Every money, legal and email feature starts off; see engagement/switches.js for how callers read them.
import * as S from "../engagement/switches.js";
import { AdminError } from "./http.js";

export const board = (origin) => S.board(origin);

export async function set(origin, key, { on, reason } = {}, actor) {
    if (!S.isKey(key)) throw new AdminError("not_found", "No such switch", 404);
    if (typeof on !== "boolean") throw new AdminError("invalid_value", "on is true or false");
    if (!reason || String(reason).trim().length < 5) throw new AdminError("reason_required", "A reason is required");
    const r = await S.set(origin, key, on, String(reason).trim().slice(0, 500), actor);
    return { ...r, board: await S.board(origin) };
}
