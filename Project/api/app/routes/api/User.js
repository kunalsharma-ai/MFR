
Date.prototype.isMinor = function (cn = "IN") {
    let today = new Date();
    let age = (today - this) / (365.25 * 24 * 3600 * 1000);
    return age < 18
}

import express from "express";
import {
    User as userController,
    OTP as otpController,
    Answer as answerController,
} from "../../controller/index.js";
import {
    Mutate,
    expressRoute,
    expressView,
    isAuthenticated,
    fsLogger,
    getMailer,
    sendMail,
    Token
} from "../../utils/index.js"
import responseController from "../../controller/Response.js";
import { User as userModel } from "../../model/index.js";

const router = express.Router();
router
    .route('/')
    .get(expressRoute(
        async req => {
            // Read all entries
            let message = "";
            let data = await userController.list()
            return { message, data };
        },
        userController
    ))
    .post(expressRoute(
        async req => {
            // Read all entries matching filter
            let message = "";
            responseController.request = req;
            let status = Mutate(await responseController.surveySummaryByUsers())
            let data = Mutate(await userController.list(req.body, null, {}, "+role")).map(
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
    .put(expressRoute(
        async req => {
            const userInfo = req.body;
            const unwantedCols = ["password", "fullName", "age"];
            for (let index = 0; index < unwantedCols.length; index++) {
                const col = unwantedCols[index];
                if (col in userInfo) delete (userInfo[col]);
            }
            let message = "";
            let data = await userController.create(userInfo);

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
                "Turn 2 Opinion: Registration",
                mailer.data
            )
            return { message, data: otp };
        },
        userController
    ))
    .patch(expressRoute(
        async req => {
            if (!req?.body?.password || !req?.body?.confirmPassword || req?.body?.password !== req?.body?.confirmPassword) throw new Error("Passwords not matching.")
            const message = "Your password is created. Go to login page and proceed.";
            let otp = await otpController.verify(req.body.userID, "email", req.origin, req.body.emailOTP);
            if (!otp) throw new Error("Link Expired. Unable to set password.");
            let status = await userController.setPassword(req.body.userID, req.body.password)
            if (!status) throw new Error("Something went wrong. Please contact support for more details");
            await otp.remove();
            return { message, data: [] };
        },
        userController
    ))
router
    .get("/summarize", expressRoute(
        async req => {
            const message = "";
            let data = await userController.summary();
            return { message, data }
        },
        userController
    ))
    .post("/login", expressRoute(
        async req => {
            const message = "Login successful";
            let data = [];
            const user = await userController.login(req.body);
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
    .post("/autologin", expressRoute(
        async req => {
            const message = "Login successful";
            let token;
            const user = await userController.read(req.body._id);
            if (!user) throw new Error("Invalid request");
            token = Token.generate({
                _id: user._id,
                category: user.category,
                email: user.email,
                phone: user.phone,
                name: user.name,
                origin: user.origin
            })
            // throw new Error("Abhi login hold pe hai")
            return { message, data: [], token }
        },
        userController
    ))
    .delete(`/terms`, expressRoute(
        async req => {
            const message = "Terms reset";
            let token;
            const user = await userController.update(req.body._id, { terms: [] });
            if (!user) throw new Error("Invalid request");
            return { message, data: [], token }
        },
        userController
    ))
    .post("/refresh", expressRoute(
        async req => {
            const message = "Refreshed Respondent, All Records other than registration details removed.";
            const data = await userController.refreshUser(req.body);
            return { message, data }
        },
        userController
    ))
    .post(`/resend`, expressRoute(
        async req => {
            // update single entry
            let message = req.body.action;
            let data = await userController.findOne({ mail: req.body.mail, origin: req.origin });

            // if (req.body.action === "resend-otp") {
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

            return { message: "Please check your email to proceed.", data: [] };
            // }
            // return { message:"Please check your email to proceed.", data };
        },
        userController
    ))
    .post(`/:user/profile-data`, expressRoute(
        async req => {
            // let data = await userController.read(req.params.user)
            answerController.request = req;
            let temp = Mutate(await answerController.getAnswers({ user: req.params.user, question: { $in: [...req.body.questions] } }))
            return {
                message: "under development", data: temp
            }
        },
        userController
    ))
// ---- Teen Panel (13-17) ------------------------------------------------------------------------------------------------
// 1. POST /teen            the teen signs up: a pending account (no password) is created and the parent or guardian is
//                          emailed the consent form (/auth/parent-consent?user=..&code=..). Nothing is sent to the teen yet.
// 2. POST /teen/resend     sends the parent email again.
// 3. POST /:id             { code, channel: "parent-consent" } opens the consent form (returns the teen's basic details).
// 4. PUT  /parent-consent/:id { code, terms } the parent agrees: the account becomes active and the teen is emailed the
//                          usual set-password link (a password is never emailed).
const TEEN_CATEGORY = "b2c-minor";
const PARENT_LINK_TTL = 7 * 24 * 60 * 60 * 1000;
const ageOn = (dob, now = new Date()) => {
    const d = new Date(dob);
    if (isNaN(d)) return NaN;
    let age = now.getFullYear() - d.getFullYear();
    if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age -= 1;
    return age;
};
const teenView = (u) => ({
    _id: u._id,
    category: u.category,
    origin: u.origin,
    name: { first: u?.name?.first, last: u?.name?.last },
    parent: { name: u?.parent?.name, relation: u?.parent?.relation, email: u?.parent?.email },
    registrationStatus: u.registrationStatus
});
async function mailParent(req, user) {
    const otp = await otpController.generate(user._id, "parent-consent", req.origin, PARENT_LINK_TTL);
    const mailer = await getMailer("register", "minor", { user, otp });
    return await sendMail(
        { origin: req.origin, "content-type": "application/json" },
        user?.parent?.email,
        "My Frequent Rewards: please approve your child's registration",
        mailer.data
    );
}
const recent = new Map(); // mail -> last resend time (a simple per-process rate limit)

router
    .post("/teen", expressRoute(
        async req => {
            const b = req.body || {};
            const age = ageOn(b.dob);
            if (!(age >= 13 && age <= 17)) throw new Error("The Teen Panel is for ages 13 to 17.");
            const p = b.parent || {};
            if (!p.email || !p?.name?.first || !["mother", "father", "legal_guardian"].includes(String(p.relation || "").toLowerCase()))
                throw new Error("Please add your parent or guardian's details.");
            if (String(p.email).trim().toLowerCase() === String(b.mail || "").trim().toLowerCase())
                throw new Error("Your parent or guardian needs their own email address.");
            const tc = b.teenConsent || {};
            if (!["parentConsent", "participation", "terms", "privacy", "accurate"].every((k) => tc[k] === true))
                throw new Error("Please tick every consent box.");
            const userInfo = {
                name: b.name,
                gender: b.gender,
                dob: b.dob,
                mail: b.mail,
                timezone: b.timezone,
                address: b.address,
                category: TEEN_CATEGORY,
                registrationStatus: "consent_pending",
                parent: {
                    email: p.email,
                    name: p.name,
                    relation: String(p.relation).toLowerCase(),
                    dob: p.dob,
                    gender: p.gender,
                    phone: p.phone,
                    consent: null
                },
                ...(b.referredBy ? { referredBy: b.referredBy } : {})
            };
            const data = Mutate(await userController.create(userInfo));
            try {
                await mailParent(req, data);
            } catch (e) {
                // no email went out: remove the pending account so the teen can simply try again
                await userModel.deleteOne({ _id: data._id });
                fsLogger.Log("teen parent mail failed", { error: e.message });
                throw new Error("We couldn't email your parent or guardian right now. Please try again in a few minutes.");
            }
            return { message: "We emailed your parent or guardian.", data: { user: data._id } };
        },
        userController
    ))
    .post("/teen/resend", expressRoute(
        async req => {
            const mail = String(req.body?.mail || "").trim().toLowerCase();
            const last = recent.get(mail) || 0;
            if (Date.now() - last < 30 * 1000) throw new Error("Please wait a few seconds before asking again.");
            recent.set(mail, Date.now());
            const found = Mutate(await userController.list({ mail, category: TEEN_CATEGORY }));
            // the same answer whether or not the address exists, so this cannot be used to look up members
            if (found.length === 1 && found[0].registrationStatus === "consent_pending") await mailParent(req, found[0]);
            return { message: "If a registration is waiting, we emailed the parent or guardian again.", data: [] };
        },
        userController
    ))
    .put("/parent-consent/:id", expressRoute(
        async req => {
            const otp = await otpController.verify(req.params.id, "parent-consent", req.origin, String(req.body?.code || ""));
            if (!otp || otp.expired) throw new Error("This consent link has expired. Ask your child to resend it.");
            userController.fixUserIssue(); // nobody is signed in on this link
            const terms = Array.isArray(req.body?.terms) ? req.body.terms.filter(Boolean).map(String) : [];
            const user = await userController.update(req.params.id, {
                terms: terms.length ? terms : ["parent-consent"],
                "parent.consent": true,
                "parent.consentAt": new Date(),
                "parent.consentVersion": String(req.body?.version || "teen-panel-v1"),
                registrationStatus: "active"
            });
            await otp.remove?.();
            const data = Mutate(user);
            // now the teen gets the usual set-password link
            const setPw = await otpController.generate(data._id, "email", req.origin, 1 * 24 * 60 * 60 * 1000);
            const toTeen = await getMailer("register", "respondent", { user: data, otp: setPw });
            await sendMail({ origin: req.origin, "content-type": "application/json" }, data.mail, "My Frequent Rewards: set your password", toTeen.data);
            try {
                const toParent = await getMailer("register", "minor-permitted-parent", { user: data });
                await sendMail({ origin: req.origin, "content-type": "application/json" }, data?.parent?.email, "My Frequent Rewards: thank you for your consent", toParent.data);
            } catch (e) { fsLogger.Log("parent confirmation mail failed", { error: e.message }); }
            return { message: "Thank you. Your child can now set their password.", data: [] };
        },
        userController
    ))

router
    .route('/:id')
    .get(expressRoute(
        async req => {
            let message = "";
            let data = await userController.read(req.params.id);
            return { message, data };
        },
        userController
    ))
    .post(expressRoute(
        async req => {
            // read single entry
            let message = ""
            if (req.body?.channel === "parent-consent") {
                // the parent consent form: the link must be valid; only the teen's basic details are returned
                let otp = await otpController.verify(req.params.id, "parent-consent", req.origin, String(req.body.code || ""))
                if (!otp || otp.expired) throw new Error("Link Expired")
                return { message, data: teenView(Mutate(await userController.read(req.params.id))) };
            }
            let otp = await otpController.verify(req.params.id, "email", req.origin, req.body.code)
            if (!otp) throw new Error("Link Expired")
            return { message, data: {} };
        },
        userController
    ))
    .put(expressRoute(
        async req => {
            // update single entry
            let message = "";
            let data = await userController.update(req.params.id, req.body)
            return { message, data };
        },
        userController
    ))
    .patch(expressRoute(
        async req => {
            // update single entry
            let message = req.body.action;
            let data = await userController.read(req.params.id);
            if (req.body.action === "resend-otp") {
                let otp = await otpController.generate(
                    user._id,
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
            }
            return { message, data };
        },
        userController
    ))
    .delete(expressRoute(
        async req => {
            // delete single entry
            let message = "";
            let data = await userController.delete(req.params.id)
            return { message, data };
        },
        userController
    ))
export default router;