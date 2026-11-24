// Panel admin API for the MADP super admin console. Every route is signed by MADP (see auth.js) and scoped to the
// brand in x-madp-origin. MADP checks the admin's permissions and writes the audit trail; this backend only does the
// data work for one brand at a time.
import express from "express";
import { requireMadp } from "./auth.js";
import { handle } from "./http.js";
import * as members from "./members.js";
import * as qb from "./qb.js";
import * as versions from "./versions.js";
import * as points from "./points.js";
import * as audiences from "./audiences.js";
import * as surveys from "./surveys.js";
import * as quality from "./quality.js";
import * as tickets from "./tickets.js";
import * as messages from "./messages.js";
import * as help from "./help.js";
import * as switches from "./switches.js";
import * as rewards from "./rewards.js";
import * as engagement from "./engagement.js";
import * as teens from "./teens.js";
import * as dataRequests from "./datarequests.js";

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
router.post("/members/:id/marketing-opt-out", handle((req) => members.marketingOptOut(req.adminOrigin, req.params.id, req.body?.reason, req.adminActor)));
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

// Segments and audiences (module 2)
router.get("/segments", handle((req) => audiences.listSegments(req.adminOrigin)));
router.put("/segments/:name", handle((req) => audiences.updateSegment(req.adminOrigin, req.params.name, req.body || {})));
router.post("/audiences/count", handle((req) => audiences.count(req.adminOrigin, req.body?.filter || {})));
router.get("/audiences", handle((req) => audiences.listAudiences(req.adminOrigin)));
router.post("/audiences", handle((req) => audiences.saveAudience(req.adminOrigin, null, req.body || {}, req.adminActor)));
router.put("/audiences/:id", handle((req) => audiences.saveAudience(req.adminOrigin, req.params.id, req.body || {}, req.adminActor)));
router.post("/audiences/:id/count", handle((req) => audiences.audienceCount(req.adminOrigin, req.params.id)));
// Surveys and invitations (module 5)
router.get("/surveys", handle((req) => surveys.listSurveys(req.adminOrigin, req.query)));
router.post("/surveys", handle((req) => surveys.createSurvey(req.adminOrigin, req.body || {})));
router.get("/surveys/:id", handle((req) => surveys.getSurvey(req.adminOrigin, req.params.id)));
router.put("/surveys/:id", handle((req) => surveys.updateSurvey(req.adminOrigin, req.params.id, req.body || {})));
router.post("/surveys/:id/status", handle((req) => surveys.setStatus(req.adminOrigin, req.params.id, req.body?.status)));
router.post("/surveys/:id/feasibility", handle((req) => surveys.feasibility(req.adminOrigin, req.params.id, req.body || {})));
router.post("/surveys/:id/invite", handle((req) => surveys.invite(req.adminOrigin, req.params.id, req.body || {}, { dryRun: req.query.dryRun !== "0" })));
router.get("/surveys/:id/responses", handle((req) => surveys.responses(req.adminOrigin, req.params.id, req.query)));
router.post("/surveys/:id/reconcile", handle((req) => surveys.reconcile(req.adminOrigin, req.params.id, req.body || {})));
// Points (module 6)
router.post("/members/:id/points", handle((req) => points.adjust(req.adminOrigin, req.params.id, req.body || {}, req.adminActor)));
router.get("/points/approvals", handle((req) => points.approvals(req.adminOrigin, req.query)));
router.post("/points/approvals/:id", handle((req) => points.decide(req.adminOrigin, req.params.id, req.body || {}, req.adminActor)));
router.get("/points/holds", handle((req) => points.listHolds(req.adminOrigin, req.query)));
router.post("/points/holds", handle((req) => points.createHold(req.adminOrigin, req.body || {})));
router.post("/points/holds/:id/release", handle((req) => points.releaseHold(req.adminOrigin, req.params.id)));
// Quality (module 9) and referral fraud (module 10)
router.get("/quality/tiers", handle(() => quality.tierList()));
router.get("/quality/review", handle((req) => quality.review(req.adminOrigin, req.query)));
router.get("/members/:id/quality", handle((req) => quality.history(req.adminOrigin, req.params.id)));
router.post("/members/:id/quality", handle((req) => quality.changeScore(req.adminOrigin, req.params.id, req.body || {}, req.adminActor)));
router.get("/referrals/fraud", handle((req) => quality.referralFraud(req.adminOrigin, req.query)));
// Ticket desk, portal messages and help centre (step 3b). Nothing here sends e-mail.
router.get("/tickets", handle((req) => tickets.list(req.adminOrigin, req.query)));
router.get("/tickets/:id", handle((req) => tickets.get(req.adminOrigin, req.params.id)));
router.post("/tickets/:id/reply", handle((req) => tickets.reply(req.adminOrigin, req.params.id, req.body || {}, req.adminActor)));
router.post("/tickets/:id/status", handle((req) => tickets.setStatus(req.adminOrigin, req.params.id, req.body?.status, req.adminActor)));
router.put("/tickets/:id", handle((req) => tickets.update(req.adminOrigin, req.params.id, req.body || {}, req.adminActor)));
router.get("/messages", handle((req) => messages.list(req.adminOrigin, req.query)));
router.post("/messages", handle((req) => messages.create(req.adminOrigin, req.body || {}, req.adminActor)));
router.get("/messages/:id", handle((req) => messages.get(req.adminOrigin, req.params.id)));
router.put("/messages/:id", handle((req) => messages.update(req.adminOrigin, req.params.id, req.body || {})));
router.post("/messages/:id/preview", handle((req) => messages.preview(req.adminOrigin, req.params.id, req.body || {})));
router.post("/messages/:id/send", handle((req) => messages.send(req.adminOrigin, req.params.id, req.body || {}, req.adminActor)));
router.post("/messages/:id/withdraw", handle((req) => messages.withdraw(req.adminOrigin, req.params.id, req.adminActor)));
router.get("/help", handle((req) => help.list(req.adminOrigin, req.query)));
router.post("/help", handle((req) => help.create(req.adminOrigin, req.body || {}, req.adminActor)));
router.get("/help/:id", handle((req) => help.get(req.adminOrigin, req.params.id)));
router.put("/help/:id", handle((req) => help.update(req.adminOrigin, req.params.id, req.body || {}, req.adminActor)));
router.post("/help/:id/status", handle((req) => help.setStatus(req.adminOrigin, req.params.id, req.body?.status, req.adminActor)));

// Feature switches (step 4). MADP lets only its Super Admin change them, always with a reason.
router.get("/switches", handle((req) => switches.board(req.adminOrigin)));
router.put("/switches/:key", handle((req) => switches.set(req.adminOrigin, req.params.key, req.body || {}, req.adminActor)));
// Rewards (module 7): catalogue, redemption queue, prize draws, bonus offers
router.get("/rewards/catalogue", handle((req) => rewards.listCatalogue(req.adminOrigin)));
router.post("/rewards/catalogue", handle((req) => rewards.createItem(req.adminOrigin, req.body || {})));
router.put("/rewards/catalogue/:key", handle((req) => rewards.updateItem(req.adminOrigin, req.params.key, req.body || {})));
router.get("/redemptions", handle((req) => rewards.listRedemptions(req.adminOrigin, req.query)));
router.get("/redemptions/:id", handle((req) => rewards.getRedemption(req.adminOrigin, req.params.id)));
router.post("/redemptions/:id/decision", handle((req) => rewards.decideRedemption(req.adminOrigin, req.params.id, req.body || {}, req.adminActor)));
router.get("/draws", handle((req) => rewards.listDraws(req.adminOrigin)));
router.post("/draws", handle((req) => rewards.createDraw(req.adminOrigin, req.body || {})));
router.post("/draws/:id/run", handle((req) => rewards.runDraw(req.adminOrigin, req.params.id)));
router.post("/draws/:id/cancel", handle((req) => rewards.cancelDraw(req.adminOrigin, req.params.id)));
router.get("/offers", handle((req) => rewards.listOffers(req.adminOrigin)));
router.post("/offers", handle((req) => rewards.createOffer(req.adminOrigin, req.body || {})));
router.post("/offers/:id/end", handle((req) => rewards.endOffer(req.adminOrigin, req.params.id)));
// Engagement (module 8)
router.get("/engagement/tasks", handle((req) => engagement.listTasks(req.adminOrigin, req.query)));
router.post("/engagement/tasks", handle((req) => engagement.createTask(req.adminOrigin, req.body || {})));
router.put("/engagement/tasks/:id", handle((req) => engagement.updateTask(req.adminOrigin, req.params.id, req.body || {})));
router.get("/engagement/ideas", handle((req) => engagement.ideaQueue(req.adminOrigin, req.query)));
router.post("/engagement/ideas/:id", handle((req) => engagement.moderate(req.adminOrigin, req.params.id, req.body?.status)));
router.get("/engagement/stories", handle((req) => engagement.listStories(req.adminOrigin, req.query)));
router.post("/engagement/stories", handle((req) => engagement.createStory(req.adminOrigin, req.body || {})));
router.put("/engagement/stories/:id", handle((req) => engagement.updateStory(req.adminOrigin, req.params.id, req.body || {})));
router.get("/engagement/streaks", handle((req) => engagement.streakStats(req.adminOrigin, req.query)));
// Teen Panel and guardians (module 13)
router.get("/teens/registrations", handle((req) => teens.pipeline(req.adminOrigin, req.query)));
router.post("/teens/registrations/:id/approve", handle((req) => teens.decideRegistration(req.adminOrigin, req.params.id, "approve", req.body?.reason, req.adminActor)));
router.post("/teens/registrations/:id/cancel", handle((req) => teens.decideRegistration(req.adminOrigin, req.params.id, "cancel", req.body?.reason, req.adminActor)));
router.post("/teens/registrations/:id/renew", handle((req) => teens.decideRegistration(req.adminOrigin, req.params.id, "renew", req.body?.reason, req.adminActor)));
router.get("/teens", handle((req) => teens.list(req.adminOrigin, req.query)));
router.get("/teens/:id", handle((req) => teens.get(req.adminOrigin, req.params.id)));
router.post("/teens/:id/revoke-links", handle((req) => teens.revokeLinks(req.adminOrigin, req.params.id, req.body?.reason)));
router.post("/teens/:id/graduate", handle((req) => teens.graduate(req.adminOrigin, req.params.id, { reason: req.body?.reason, segment: req.body?.segment || "b2c", dryRun: req.query.dryRun !== "0" }, req.adminActor)));
router.post("/teens/:id/close", handle((req) => teens.closeAdult(req.adminOrigin, req.params.id, req.body?.reason, req.adminActor)));
// Data requests (module 14). Nothing here deletes anything.
router.get("/data-requests", handle((req) => dataRequests.list(req.adminOrigin, req.query)));
router.get("/data-requests/:id", handle((req) => dataRequests.get(req.adminOrigin, req.params.id)));
router.post("/data-requests/:id/decision", handle((req) => dataRequests.decide(req.adminOrigin, req.params.id, req.body || {}, req.adminActor)));

export default router;
