// Public side of console-edited pages: GET /api/v1/content/:key?lang=hi gives the published copy (or English), or
// 404 when the console has published nothing, and the site then shows its built-in text. No sign-in needed.
import express from "express";
import { handle, fail } from "../../engagement/http.js";
import { forSite } from "../../admin/content.js";

export default express.Router()
    .get("/:key", handle(async (req) => (await forSite(req.origin, req.params.key, req.query.lang)) || fail("not_found", "No published page", 404)));
