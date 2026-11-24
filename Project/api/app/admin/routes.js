// Panel admin API for the MADP super admin console. Every route is signed by MADP (see auth.js) and scoped to the
// brand in x-madp-origin. MADP checks the admin's permissions and writes the audit trail; this backend only does the
// data work for one brand at a time.
import express from "express";
import { requireMadp } from "./auth.js";
import { handle } from "./http.js";
import * as members from "./members.js";
import * as qb from "./qb.js";
import * as versions from "./versions.js";

const router = express.Router();
// Keep the exact bytes: the signature covers them. Bank imports can be several MB.
router.use(express.json({ limit: "25mb", verify: (req, res, buf) => { req.rawBody = buf; } }));
router.use(requireMadp);

router.get("/members", handle((req) => members.search(req.adminOrigin, req.query)));
router.post("/members/archive-run", handle((req) => members.archiveRun(req.adminOrigin, { months: req.body?.months, dryRun: req.body?.dryRun !== false })));
router.post("/members/restore", handle((req) => members.bulkRestore(req.adminOrigin, req.body?.ids || [], req.body?.reason)));
router.get("/members/:id", handle((req) => members.detail(req.adminOrigin, req.params.id)));
router.get("/members/:id/ledger", handle((req) => members.ledger(req.adminOrigin, req.params.id)));
router.put("/members/:id", handle((req) => members.update(req.adminOrigin, req.params.id, req.body || {})));
router.post("/members/:id/status", handle((req) => members.setStatus(req.adminOrigin, req.params.id, req.body?.action, req.body?.reason)));
router.post("/members/:id/segment", handle((req) => members.changeSegment(req.adminOrigin, req.params.id, req.body?.category, req.body?.reason, req.adminActor)));
router.post("/members/:id/unmask", handle((req) => members.unmask(req.adminOrigin, req.params.id, req.body?.fields || [])));

// Question bank (module 3)
router.get("/qb/export", handle((req) => qb.exportBank(req.adminOrigin)));
router.post("/qb/import", handle((req) => qb.importBank(req.adminOrigin, req.body || {}, { dryRun: req.query.dryRun !== "0" })));
router.get("/qb/rules/check", handle((req) => qb.checkRules(req.adminOrigin)));
router.get("/questions", handle((req) => qb.listQuestions(req.adminOrigin, req.query)));
router.post("/questions", handle((req) => qb.createQuestion(req.adminOrigin, req.body || {})));
router.get("/questions/:name", handle((req) => qb.getQuestion(req.adminOrigin, req.params.name)));
router.put("/questions/:name", handle((req) => qb.updateQuestion(req.adminOrigin, req.params.name, req.body || {})));
router.put("/questions/:name/options", handle((req) => qb.setOptions(req.adminOrigin, req.params.name, req.body?.options)));
// Versions and translations (module 3)
router.get("/qb/versions", handle((req) => versions.listVersions(req.adminOrigin)));
router.post("/qb/versions", handle((req) => versions.createDraft(req.adminOrigin, req.body || {}, req.adminActor)));
router.get("/qb/versions/:number", handle((req) => versions.versionBank(req.adminOrigin, req.params.number)));
router.post("/qb/versions/:number/:action(review|publish|discard)", handle((req) => versions.move(req.adminOrigin, req.params.number, req.params.action, req.adminActor)));
router.put("/questions/:name/translations", handle((req) => versions.setTranslation(req.adminOrigin, req.params.name, req.body || {})));
router.get("/qb/translations/missing", handle((req) => versions.missingTranslations(req.adminOrigin, req.query.lang, req.query)));
// Profiles (module 4)
router.get("/profiles", handle((req) => qb.listProfiles(req.adminOrigin, req.query)));
router.get("/profiles/completion", handle((req) => qb.completionReport(req.adminOrigin, req.query)));
router.put("/profiles/:id", handle((req) => qb.updateProfile(req.adminOrigin, req.params.id, req.body || {})));

export default router;
