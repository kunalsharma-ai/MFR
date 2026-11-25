// /api/v1/teen - Teen Panel registration (ages 13-17). Every rule is enforced in app/teen/service.js.
//
//  public (no account yet)                                     | rate limit
//  POST /age-check                 {dob}                       | 60 / 10 min / IP
//  POST /register                  steps 1-3 in one submit     | 10 / hour / IP
//  GET  /status/:token             the teen's status page      | 60 / 10 min
//  POST /verify-email/:token       the teen confirms their email (link in their first email) | 30 / 10 min
//  POST /resend                    {statusToken} | {mail}      | 10 / hour
//  POST /renew                     {mail} expired/lost links   | 10 / hour
//  parent or guardian (the secure link from their email)
//  GET  /guardian/:token           what the parent sees
//  POST /guardian/:token/decision  {decision: yes|no, confirm: true, reasons?, comment?}
//  PUT  /guardian/:token/onboarding {answers, submit}
//  POST /guardian/:token/consent   {version, selections, sectionsRead}
//  POST /guardian/:token/renew     a new link when this one lapsed
//  teen password link
//  GET  /password/:token, POST /password/:token {password, confirm}
//  signed-in teen (JWT, same as /api/v1/me)
//  GET  /me, PUT /me/answers
//  GET  /me/family              what the guardian submitted (only once approved, onboarded, consented, active)
//  operations
//  POST /jobs/sweep                header x-job-key = TEEN_JOB_KEY (reminders + expiry; also app/jobs/teen-reminders.js)
import express from "express";
import rateLimit from "express-rate-limit";
import { isAuthenticated, fsLogger } from "../../utils/index.js";
import * as S from "../../teen/service.js";
import * as Adult from "../../teen/adult.js";
import { family } from "../../teen/family.js";

const router = express.Router();

// Friendly English for every code; the Teen pages show their own (translated) text for the same codes.
const MESSAGES = {
    not_turning_adult: "Your account isn't waiting to move to an adult account.",
    terms_required: "Please accept the terms and the privacy notice.",
    bad_segment: "Choose Consumer or Business Professional.",
    not_18: "The move happens once you turn 18.",
    conflict: "Your account has already moved.",
    under_13: "Registration is not available for anyone under 13.",
    adult: "You are 18 or older, so please use the normal Consumer or Professional registration.",
    validation: "Please check the highlighted details.",
    email_taken: "This email address is already registered. Try logging in or resetting your password.",
    pending_exists: "A Teen registration with this email is already waiting for a parent or guardian.",
    mail_failed: "We couldn't send the email to your parent or guardian just now. Nothing was saved - please try again in a few minutes.",
    link_invalid: "This link isn't valid. Please use the latest email we sent.",
    link_expired: "This link has expired. You can ask for a new one.",
    link_used: "This link has already been used.",
    link_revoked: "A newer link has been sent. Please use the latest email.",
    already_done: "This step is already complete.",
    already_declined: "This request was declined, so there is nothing more to do.",
    bad_state: "This step isn't available right now.",
    confirm_required: "Please confirm your choice.",
    too_soon: "We just sent that. Please wait a couple of minutes before asking again.",
    not_teen: "This area is for Teen Panel members.",
    not_active: "Your Teen Panel account isn't active yet.",
    bad_request: "Something about that request wasn't right. Please refresh and try again.",
    server: "Something went wrong on our side. Please try again in a moment.",
};

const handle = (fn) => async (req, res) => {
    try {
        const data = await fn(req);
        res.set("Cache-Control", "no-store");
        return res.json({ status: "success", message: "", data });
    } catch (e) {
        if (e instanceof S.TeenError) {
            return res.status(e.status).json({ status: "error", code: e.code, message: MESSAGES[e.code] || MESSAGES.server, fields: e.fields, ...(e.extra || {}) });
        }
        // never show a database or stack message to a family
        fsLogger.Log("teen route error", { path: req.path, error: e && e.message });
        console.log(e);
        return res.status(500).json({ status: "error", code: "server", message: MESSAGES.server });
    }
};
const limit = (max, minutes) => rateLimit({
    windowMs: minutes * 60 * 1000, max, standardHeaders: true, legacyHeaders: false,
    // the API sits behind the nginx gateway: count per visitor, not per gateway
    keyGenerator: (req) => String(req.headers["x-real-ip"] || String(req.headers["x-forwarded-for"] || "").split(",")[0] || req.ip || "").trim(),
    validate: false,
    handler: (req, res) => res.status(429).json({ status: "error", code: "too_soon", message: "Too many attempts. Please wait a few minutes and try again." }),
});
// links carry their token in the path: keep them out of logs, referrers and caches
const noReferrer = (req, res, next) => { res.set("Referrer-Policy", "no-referrer"); next(); };

router
    .post("/age-check", limit(60, 10), handle(async (req) => S.ageCheck(req.body?.dob)))
    .post("/register", limit(10, 60), handle(S.register))
    .get("/status/:token", limit(60, 10), noReferrer, handle(S.statusView))
    .post("/verify-email/:token", limit(30, 10), noReferrer, handle(S.verifyEmail))
    .post("/resend", limit(10, 60), handle(S.resendInvite))
    .post("/renew", limit(10, 60), handle(S.renew))
    .get("/guardian/:token", limit(60, 10), noReferrer, handle(S.guardianView))
    .post("/guardian/:token/decision", limit(20, 10), noReferrer, handle(S.guardianDecide))
    .put("/guardian/:token/onboarding", limit(60, 10), noReferrer, handle(S.guardianOnboarding))
    .post("/guardian/:token/consent", limit(20, 10), noReferrer, handle(S.guardianConsent))
    .post("/guardian/:token/renew", limit(5, 60), noReferrer, handle(S.guardianRenew))
    .get("/password/:token", limit(30, 10), noReferrer, handle(S.passwordView))
    .post("/password/:token", limit(10, 10), noReferrer, handle(S.setPassword))
    // turning 18: the move screen (teen/adult.js)
    .get("/adult", isAuthenticated, handle(async (req) => Adult.view(req.user)))
    .post("/adult", isAuthenticated, limit(10, 10), handle(async (req) => {
        if (req.user.adultMove?.stage !== "turning_adult") throw new S.TeenError("not_turning_adult", { status: 409 });
        if (req.body?.acceptTerms !== true || req.body?.acceptPrivacy !== true) throw new S.TeenError("terms_required", { status: 400 });
        try {
            return await Adult.completeMove(req.user._id, req.origin, { segment: req.body?.segment, by: "member" });
        } catch (e) {
            if (e instanceof Adult.AdultError) throw new S.TeenError(e.code, { status: e.status });
            throw e;
        }
    }))
    .get("/me", isAuthenticated, handle(S.me))
    .put("/me/answers", isAuthenticated, handle(S.saveAnswers))
    .get("/me/family", isAuthenticated, handle(family))
    .post("/jobs/sweep", (req, res, next) => {
        const key = process.env.TEEN_JOB_KEY;
        if (!key || req.headers["x-job-key"] !== key) return res.status(403).json({ status: "error", message: "Forbidden" });
        return next();
    }, handle(async (req) => ({ ...(await S.sweep({ dryRun: Boolean(req.body?.dryRun) })), adult: await Adult.sweepAdult({ dryRun: Boolean(req.body?.dryRun) }) })));

export default router;
