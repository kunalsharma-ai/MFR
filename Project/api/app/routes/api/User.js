Date.prototype.isMinor = function (cn = "IN") {
    let today = new Date();
    let age = (today - this) / (365.25 * 24 * 3600 * 1000);
    return age < 18
}

// /api/v1/user - member records.
//
// ACCESS (member-API lock-down, Nov 2026 - every rule is checked here, on the server):
//   public   PUT /            register (Consumer / Professional; 18+ only, safe fields only, no code returned)
//            PATCH /          set a password with the emailed code
//            POST /login, /resend, POST /:id (check an emailed code), PATCH /:id {action:"resend-otp"}
//   member   POST /            the member's OWN referrals only (admins: the full list, as before)
//            GET /:id, PUT /:id, POST /:id/profile-data    own record only (PUT: a short list of fields)
//   admin    GET /, GET /summarize, POST /autologin (410, moved to MADP), DELETE /terms, POST /refresh, DELETE /:id,
//            GET/PUT /:id of any member (role read fresh from the database, never from the request)
// Teen Panel registration moved to /api/v1/teen (routes/api/Teen.js); the old /teen and /parent-consent routes answer 410.
import express from "express";
import * as Emails from "../../engagement/transactional.js";
import rateLimit from "express-rate-limit";
import {
    User as userController,
    OTP as otpController,
    Answer as answerController,
} from "../../controller/index.js";
import {
    Mutate,
    expressRoute,
    getMailer,
    sendMail,
    mailOk,
    fsLogger,
    Token
} from "../../utils/index.js"
import { requireAdmin, requireMember, selfOrAdmin, SELF_EDITABLE, ADMIN_BLOCKED, pick, omit, safeFilter } from "../../utils/access.js";
import { classifyDob } from "../../teen/rules.js";
import { lockedFor, fail, clear, norm } from "../../utils/throttle.js";
import { createCaptcha, requireCaptcha } from "../../utils/captcha.js";
import { setOptIn } from "../../engagement/marketing.js";
import responseController from "../../controller/Response.js";
import { redeem as redeemAdminTicket } from "../../admin/memberactions.js";

const router = express.Router();

const limit = (max, minutes) => rateLimit({
    windowMs: minutes * 60 * 1000, max, standardHeaders: true, legacyHeaders: false, validate: false,
    keyGenerator: (req) => String(req.headers["x-real-ip"] || String(req.headers["x-forwarded-for"] || "").split(",")[0] || req.ip || "").trim(),
    handler: (req, res) => res.status(429).json({ status: "error", message: "Too many attempts. Please wait a few minutes and try again." }),
});

// what a visitor may send when registering (everything else - role, status, verification, password... - is dropped)
const REGISTER_FIELDS = ["category", "name", "gender", "dob", "mail", "phone", "timezone", "address", "notification", "referredBy", "socials", "consent"];
const REFERRAL_FIELDS = "mail name isVerified createdAt";

router
    .route('/')
    .get(requireAdmin, expressRoute(
        async req => {
            // Read all entries (admin)
            let message = "";
            let data = await userController.list()
            return { message, data };
        },
        userController
    ))
    .post(requireMember, expressRoute(
        async req => {
            let message = "";
            if (!req.isAdmin) {
                // a member sees only the people who joined with their referral link, and only what the page shows
                const own = Mutate(await userController.list({ referredBy: String(req.user._id) }, null, {}, REFERRAL_FIELDS));
                return { message, data: own.map(({ _id, mail, fullName, name, isVerified, createdAt }) => ({ _id, mail, fullName, name, isVerified: { email: isVerified?.email }, createdAt })) };
            }
            responseController.request = req;
            let status = Mutate(await responseController.surveySummaryByUsers())
            let data = Mutate(await userController.list(safeFilter(req.body), null, {}, "+role")).map(
                user => {
                    const stat = status.find(st => st._id === user._id);
                    user.status = {
                        "total": 0,
                        "complete": 0,
                        "disqualified": 0,
                        "abdoned": 0,
                        "internal": 0,
                        "external": 0,
                        "points": 0,
                        "totalRewards": 0,
                        ...stat
                    }
                    return user;
                }
            )
            return { message, data };
        },
        userController
    ))
    .put(limit(20, 60), expressRoute(
        async req => {
            await requireCaptcha(req); // the human check (required for every client once CAPTCHA_REQUIRED=true)
            // public registration: Consumer / Professional, 18 and over
            const userInfo = pick(req.body || {}, REGISTER_FIELDS);
            const age = classifyDob(String(userInfo.dob || "").slice(0, 10));
            if (age === "blocked") throw new Error("Registration is not available for anyone under 13.");
            if (age === "teen") throw new Error("You are under 18, so you can join through the Teen registration with your parent or guardian's permission.");
            if (age !== "adult") throw new Error("Please enter a valid date of birth.");
            if (String(userInfo.category || "").toLowerCase().includes("minor")) throw new Error("Please choose Consumer or Professional.");
            // the "I agree to the Terms of Use and Privacy Policy" box on the sign-up form (dated here, never by the browser)
            if (req.body?.termsAccepted === true) userInfo.termsAcceptance = { signupAt: new Date(), signupVersion: String(req.body.termsVersion || "").slice(0, 40) };
            let message = "";
            let data = await userController.create(userInfo);
            // "Send me news and offers": recorded only when the form sent a real true/false (unticked by default)
            if (typeof req.body?.marketingOptIn === "boolean") await setOptIn(data._id, req.origin, req.body.marketingOptIn, "signup", "member");
            Emails.newUser(data, req.origin); // off unless config.emails.newUser

            let otp = await otpController.generate(
                data._id,
                "email",
                req.origin,
                1 * 24 * 60 * 60 * 1000
            );

            let mailer = await getMailer(
                "register",
                "respondent",
                {
                    user: data,
                    otp
                }
            )
            const emailStatus = await sendMail(
                { origin: req.origin, "content-type": "application/json" },
                data.mail,
                "My Frequent Rewards: Registration",
                mailer.data
            ).catch((e) => ({ status: 0, data: { error: e.message } }))
            const emailSent = mailOk(emailStatus, mailer);
            if (!emailSent) fsLogger.Log("registration email not sent", { user: String(data._id), origin: req.origin, status: emailStatus?.status });
            // only the new member's id: the emailed code never goes back to the browser. emailSent lets the page say
            // "we couldn't send it, press Resend" instead of "check your inbox" when the email service refused it.
            return { message, data: { user: data._id, emailSent } };
        },
        userController
    ))
    .patch(limit(20, 10), expressRoute(
        async req => {
            if (!req?.body?.password || !req?.body?.confirmPassword || req?.body?.password !== req?.body?.confirmPassword) throw new Error("Passwords not matching.")
            const message = "Your password is created. Go to login page and proceed.";
            let otp = await otpController.verify(req.body.userID, "email", req.origin, String(req.body.emailOTP || ""));
            if (!otp || otp.expired) throw new Error("Link Expired. Unable to set password.");
            let status = await userController.setPassword(req.body.userID, req.body.password)
            if (!status) throw new Error("Something went wrong. Please contact support for more details");
            await otp.remove();
            Emails.welcome(req.body.userID, req.origin); // off unless config.emails.welcome
            // read back, so the page says "email confirmed" only when the account really says so
            const after = await userController.read(req.body.userID).catch(() => null);
            return { message, data: { emailVerified: after?.isVerified?.email === "verified" } };
        },
        userController
    ))
router
    .get("/summarize", requireAdmin, expressRoute(
        async req => {
            const message = "";
            let data = await userController.summary();
            return { message, data }
        },
        userController
    ))
    // a new human check (picture, or ?mode=text for a small sum); each one can be checked once, within 5 minutes
    .get("/captcha", limit(60, 10), expressRoute(
        async req => ({ message: "", data: await createCaptcha(req.origin, req.query.mode === "text" ? "text" : "image") }),
        userController
    ))
    .post("/login", limit(30, 10), expressRoute(
        async req => {
            const message = "Login successful";
            let data = [];
            await requireCaptcha(req);
            // strings only (an object here would be a database filter), and a per-account lock after 10 wrong
            // passwords in 15 minutes, so a bot that keeps changing its address gets no further
            const { mail, phone, password } = req.body || {};
            if (typeof password !== "string" || !password || (typeof mail !== "string" && typeof phone !== "string"))
                throw new Error("E-Mail id or Password is invalid");
            const who = `login:${req.origin}:${norm(typeof mail === "string" && mail ? mail : phone)}`;
            const wait = await lockedFor(who);
            if (wait) throw new Error(`Too many wrong attempts. Please wait ${wait} minute${wait === 1 ? "" : "s"} or reset your password.`);
            let user;
            try {
                user = await userController.login(typeof mail === "string" && mail ? { mail, password } : { phone, password });
            } catch (e) {
                if (/invalid/i.test(e.message)) await fail(who, { max: 10, windowMin: 15, lockMin: 15 });
                throw e;
            }
            await clear(who);
            const token = Token.generate({
                _id: user._id,
                category: user.category,
                email: user.mail,
                phone: user.phone,
                name: user.name,
                origin: user.origin,
                role: user.role
            })
            return { message, data: [], token }
        },
        userController
    ))
    // "Log in as member" from the MADP console: swap the one-use ticket for a member session that ends 15 minutes
    // after the ticket was issued, marked as an admin session (admin/memberactions.js, utils/adminSession.js)
    .get("/admin-session", limit(20, 10), async (req, res) => {
        res.set({ "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" });
        const r = await redeemAdminTicket(req.origin, req.query?.ticket).catch(() => null);
        if (!r) return res.status(410).json({ status: "error", code: "ticket_used", message: "This sign-in link has been used or has expired. Ask for a new one in the console." });
        const left = Math.max(1, Math.floor((new Date(r.session.expiresAt).getTime() - Date.now()) / 1000));
        const token = Token.generate({
            _id: r.user._id, category: r.user.category, name: r.user.name, origin: r.user.origin,
            adm: { sid: String(r.session._id), by: r.session.actor },
        }, left);
        res.cookie("authorization", `Bearer ${token}`, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: left * 1000 });
        return res.redirect("/member/dashboard");
    })
    // The old "Login As User" gave a full, unlimited member token with no reason and no record. It is gone: admins use
    // "Log in as member" in MADP, which asks for a reason, lasts 15 minutes, blocks money and password changes, shows
    // the member a banner and is audited (admin/memberactions.js). The route answers 410 so old callers learn why.
    .post("/autologin", requireAdmin, (req, res) =>
        res.status(410).json({ status: "error", code: "moved_to_madp", message: "Log in as member has moved to the MADP console." }))
    .delete(`/terms`, requireAdmin, expressRoute(
        async req => {
            const message = "Terms reset";
            let token;
            const user = await userController.update(req.body._id, { terms: [] });
            if (!user) throw new Error("Invalid request");
            return { message, data: [], token }
        },
        userController
    ))
    .post("/refresh", requireAdmin, expressRoute(
        async req => {
            const message = "Refreshed Respondent, All Records other than registration details removed.";
            const data = await userController.refreshUser(req.body);
            return { message, data }
        },
        userController
    ))
    .post(`/resend`, limit(10, 60), expressRoute(
        async req => {
            // same answer whether or not the address is registered
            const message = "Please check your email to proceed.";
            let data = await userController.findOne({ mail: String(req.body?.mail || "").trim().toLowerCase(), origin: req.origin });
            if (!data || String(data.category || "").includes("minor")) return { message, data: [] };

            let otp = await otpController.generate(
                data._id,
                "email",
                req.origin,
                1 * 24 * 60 * 60 * 1000
            );
            let mailer = await getMailer(
                "register",
                "respondent",
                {
                    user: data,
                    otp
                }
            )
            const r = await sendMail(
                { origin: req.origin, "content-type": "application/json" },
                data.mail,
                "My Frequent Rewards: Registration",
                mailer.data
            ).catch((e) => ({ status: 0, data: { error: e.message } }));
            if (!mailOk(r, mailer)) {
                fsLogger.Log("registration email (resend) not sent", { user: String(data._id), origin: req.origin, status: r?.status });
                // the page says "we couldn't send it" instead of "sent again" (only while the email service is failing)
                return { message: "We couldn't send the email just now. Please try again in a few minutes.", data: { emailSent: false } };
            }

            return { message, data: [] };
        },
        userController
    ))
    .post(`/:user/profile-data`, selfOrAdmin("user"), expressRoute(
        async req => {
            answerController.request = req;
            let temp = Mutate(await answerController.getAnswers({ user: req.params.user, question: { $in: [...(req.body.questions || [])] } }))
            return {
                message: "under development", data: temp
            }
        },
        userController
    ))

// ---- retired Teen routes (replaced by /api/v1/teen) ----------------------------------------------------------------
const moved = (req, res) => res.status(410).json({
    status: "error",
    message: "The Teen registration has moved. Please start again at /sign-up?type=teen, or use the newest email we sent.",
});
router
    .post("/teen", moved)
    .post("/teen/resend", moved)
    .put("/parent-consent/:id", moved)

router
    .route('/:id')
    .get(selfOrAdmin("id"), expressRoute(
        async req => {
            let message = "";
            let data = await userController.read(req.params.id);
            if (!req.isAdmin) delete data.role;
            return { message, data };
        },
        userController
    ))
    .post(limit(30, 10), expressRoute(
        async req => {
            // check an emailed set-password / verification code (public; says only "valid" or "expired")
            let message = ""
            if (req.body?.channel === "parent-consent") throw new Error("This consent link has been replaced. Please use the newest email we sent.");
            let otp = await otpController.verify(req.params.id, "email", req.origin, String(req.body?.code || ""))
            if (!otp || otp.expired) throw new Error("Link Expired")
            return { message, data: {} };
        },
        userController
    ))
    .put(selfOrAdmin("id"), expressRoute(
        async req => {
            let message = "";
            // a member may change only their own consent / preference fields; an admin anything but the
            // fields that have their own flows (password, Teen registration status and guardian consent)
            const body = req.isAdmin
                ? omit(req.body || {}, [...ADMIN_BLOCKED, "registrationStatus", "parent"])
                : omit(pick(req.body || {}, SELF_EDITABLE), []);
            if (!Object.keys(body).length) throw new Error("Nothing to update.");
            // the consent page saves the accepted term names; the date is added here so Settings can show it
            if (Array.isArray(body.terms)) body["termsAcceptance.acceptedAt"] = body.terms.length ? new Date() : null;
            let data = await userController.update(req.params.id, body)
            return { message, data: req.isAdmin ? data : { _id: req.params.id } };
        },
        userController
    ))
    .patch(limit(10, 60), expressRoute(
        async req => {
            // public: only "send me the set-password link again"; never returns the record
            let message = "If this account is waiting for a password, we've emailed a new link.";
            if (req.body?.action !== "resend-otp") throw new Error("Invalid request");
            let data = await userController.read(req.params.id).catch(() => null);
            if (!data || !data._id || String(data.category || "").includes("minor")) return { message, data: [] };
            let otp = await otpController.generate(
                data._id,
                "email",
                req.origin,
                1 * 24 * 60 * 60 * 1000
            );
            let mailer = await getMailer(
                "register",
                "respondent",
                {
                    user: data,
                    otp
                }
            )
            console.log({
                emailStatus: await sendMail(
                    { origin: req.origin, "content-type": "application/json" },
                    data.mail,
                    "My Frequent Rewards: Registration",
                    mailer.data
                )
            })
            return { message, data: [] };
        },
        userController
    ))
    .delete(requireAdmin, expressRoute(
        async req => {
            let message = "";
            let data = await userController.delete(req.params.id)
            return { message, data };
        },
        userController
    ))
export default router;
