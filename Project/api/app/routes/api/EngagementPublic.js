// /api/v1/engagement-public - links in engagement emails that must work without signing in.
//   GET|POST /unsubscribe?u=<member id>&l=<weekly|expiry>&s=<signature>   one-click unsubscribe (RFC 8058 style)
import express from "express";
import mongoose from "mongoose";
import { MemberPreference } from "../../model/index.js";
import { checkUnsubscribe, siteUrl } from "../../engagement/mail.js";
import { limit } from "../../engagement/http.js";

const LISTS = { weekly: "notifications.weeklySummary", expiry: "notifications.expiryReminders" };
const router = express.Router();
const unsubscribe = async (req, res) => {
    const { u, l, s } = { ...req.query, ...(req.body || {}) };
    if (!LISTS[l] || !mongoose.isValidObjectId(String(u)) || !checkUnsubscribe(String(u), String(l), String(s))) {
        return res.status(400).send("This unsubscribe link isn't valid.");
    }
    await MemberPreference.updateOne(
        { user: new mongoose.Types.ObjectId(String(u)), origin: req.origin },
        { $set: { [LISTS[l]]: false }, $setOnInsert: { user: new mongoose.Types.ObjectId(String(u)), origin: req.origin } },
        { upsert: true }
    );
    if (req.method === "POST") return res.json({ status: "success" });
    res.set("Content-Type", "text/html; charset=utf-8");
    return res.send(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribed</title><body style="font-family:system-ui,sans-serif;max-width:520px;margin:15vh auto;padding:0 16px;color:#14213d"><h1 style="font-size:22px">You're unsubscribed</h1><p>We won't send you these emails any more. You can switch them back on in <a href="${siteUrl(req.origin)}/member/settings">Settings</a>.</p></body>`);
};
router.get("/unsubscribe", limit(30, 10), unsubscribe).post("/unsubscribe", limit(30, 10), express.urlencoded({ extended: false }), unsubscribe);
export default router;
