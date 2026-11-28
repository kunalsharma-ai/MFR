// /api/v1/user/apps - integrated applications (issue #124). Admins only.
//   GET    list the apps of this site
//   PUT    add an app            { name: { first } } (the admin page's form) or { name }
//   PATCH  rename / switch on-off { _id, name?, isActive? }
//   POST   make a new token       { _id }  -> { token }. The app's older token stops working at once.
// The token is a bearer token for the API (Authorization: Bearer <token>) that acts as an admin, so other systems
// can read live data. It is shown once and never stored; lose it and make a new one. It lasts APP_TOKEN_TTL
// (default 365d) or until a newer token is made or the app is switched off.
import express from "express";
import mongoose from "mongoose";
import { IntegratedApp } from "../../model/index.js";
import { requireAdmin } from "../../utils/access.js";
import { Token } from "../../utils/index.js";

const router = express.Router();
const TTL = () => process.env.APP_TOKEN_TTL || "365d";

const ok = (res, message, data) => res.json({ status: "success", message, data });
const bad = (res, status, message) => res.status(status).json({ status: "error", message });

const nameFrom = (body) => {
    const raw = typeof body?.name === "string" ? body.name : body?.name?.first;
    return typeof raw === "string" ? raw.trim().slice(0, 120) : "";
};
// the shape the admin page reads (it was built for apps stored as member records: name.first, fullName, mail)
const view = (a) => ({
    _id: String(a._id),
    name: { first: a.name, last: "app" },
    fullName: a.name,
    mail: "",
    isActive: a.isActive !== false,
    tokenIssuedAt: a.tokenIssuedAt || null,
    lastUsedAt: a.lastUsedAt || null,
    createdAt: a.createdAt,
});
const findOwn = (req, id) => mongoose.isValidObjectId(String(id || ""))
    ? IntegratedApp.findOne({ _id: String(id), origin: req.origin, isDeleted: { $ne: true } }).select("+isActive")
    : null;

router.use(requireAdmin, (req, res, next) => {
    // an app token can read live data, but cannot make, change or mint tokens for apps
    if (req.appClient) return bad(res, 403, "Forbidden");
    return next();
});

router
    .route("/")
    .get(async (req, res) => {
        try {
            const apps = await IntegratedApp.find({ origin: req.origin, isDeleted: { $ne: true } }).select("+isActive").sort({ createdAt: -1 }).lean();
            return ok(res, "", apps.map(view));
        } catch (e) { return bad(res, 500, "Could not load the apps"); }
    })
    .put(async (req, res) => {
        const name = nameFrom(req.body);
        if (!name) return bad(res, 400, "App name is required");
        try {
            const app = await IntegratedApp.create({ name, origin: req.origin, created: { By: req.user._id } });
            return ok(res, "App added", view(app.toObject()));
        } catch (e) { return bad(res, 400, e.message || "Could not add the app"); }
    })
    .patch(async (req, res) => {
        const app = await findOwn(req, req.body?._id);
        if (!app) return bad(res, 404, "App not found");
        if (req.body?.name !== undefined) {
            const name = nameFrom(req.body);
            if (!name) return bad(res, 400, "App name is required");
            app.name = name;
        }
        if (typeof req.body?.isActive === "boolean") app.isActive = req.body.isActive;
        app.updated = { By: req.user._id };
        await app.save();
        return ok(res, "App updated", view(app.toObject()));
    })
    .post(async (req, res) => {
        const app = await findOwn(req, req.body?._id);
        if (!app) return bad(res, 404, "App not found");
        if (app.isActive === false) return bad(res, 400, "Switch the app on before making a token");
        app.tokenVersion = Number(app.tokenVersion || 0) + 1;
        app.tokenIssuedAt = new Date();
        app.tokenIssuedBy = req.user._id;
        await app.save();
        // no member session (sid) and no admin-session flag: isAuthenticated checks the app and the version instead
        const token = Token.generate({ _id: String(app._id), app: true, tv: app.tokenVersion, name: app.name, origin: app.origin, role: "root" }, TTL());
        return ok(res, "Token created. Copy it now: it is not shown again.", { token, expiresIn: TTL(), app: view(app.toObject()) });
    });

export default router;
