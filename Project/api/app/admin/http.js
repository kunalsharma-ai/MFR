// Response helpers for the panel admin API.
import { fsLogger } from "../utils/index.js";

export class AdminError extends Error {
    constructor(code, message, status = 400) {
        super(message || code);
        this.code = code;
        this.status = status;
    }
}

export const handle = (fn) => async (req, res) => {
    try {
        const data = await fn(req, res);
        res.set("Cache-Control", "no-store");
        return res.json({ status: "success", data });
    } catch (e) {
        if (e instanceof AdminError) return res.status(e.status).json({ status: "error", code: e.code, message: e.message });
        fsLogger.Log("admin api error", { path: req.path, error: e && e.message });
        console.log(e);
        return res.status(500).json({ status: "error", code: "server", message: "Something went wrong" });
    }
};
