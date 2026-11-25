import express from "express";
import {
    Survey as surveyController,
    User as userController,
    OTP as otpController,
    Answer as answerController,
    Response as responseController,
    Reward as rewardController,
    Profile as profileController
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
import { SELF_EDITABLE, pick, omit, requireAdmin } from "../../utils/access.js";

// Round 9 (Kunal, 24 Nov 2026): every survey stays locked until the member's basic profiles are complete. The hub
// shows the lock; this is the same rule on the server, so a direct survey link cannot open a survey early.
// The basic profiles are the ones of these slugs that exist for the member's category (Teens have fewer).
// Profiles themselves are never blocked here, so the basics (and other profiles) can always be filled in.
const CORE_SLUGS = ["basic", "educational", "professional", "financial"];
async function basicsGate(req, slug) {
    profileController.request = req;
    const [status, profiles] = await Promise.all([
        profileController.status(),
        profileController.list({ category: req.user?.category }),
    ]);
    const list = Mutate(profiles) || [];
    if (list.some((p) => String(p.slug) === String(slug))) return; // opening a profile, not a survey
    const missing = list.filter((p) => CORE_SLUGS.includes(p.slug) && !(Number(status?.[p.slug]) >= 100));
    if (missing.length) {
        const err = new Error("Finish your basic profiles first. Surveys open as soon as they are done.");
        err.code = "basics";
        throw err;
    }
}

const QUALITY_MAX = 200; // same cap as model/User.js
const QUALITY_STEP_MAX = 5; // most profiles a member can complete in one save
Date.prototype.resetTime = function (type = "start") {
    if (type === "end") {
        this.setHours(23);
        this.setMinutes(59);
        this.setSeconds(59);
    } else {
        this.setHours(0);
        this.setMinutes(0);
        this.setSeconds(0);
    }
}
import { Redemption, User, AdminSession } from "../../model/index.js";
import mongoose from "mongoose";
import * as Marketing from "../../engagement/marketing.js";
async function redeemedPoints(user, origin) {
    const r = await Redemption.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(String(user)), origin, status: { $in: ["requested", "guardian_pending", "approved", "fulfilled"] } } },
        { $group: { _id: null, n: { $sum: "$points" } } },
    ]);
    return r[0]?.n || 0;
}
const router = express.Router();
router
    .route('/')
    .get(expressRoute(
        async req => {
            if (!req.user || !req.user._id) throw new Error("Invalid request");
            answerController.request = req;
            let message = "";
            let data = Mutate(await userController.read(req.user._id))
            let navbar = [
                {
                    link: "/admin/dashboard",
                    text: "Admin Zone",
                    icon: "fa-solid fa-gear",
                    roles: ["admin", "superadmin", "root"]
                },
                {
                    link: "/member/dashboard",
                    text: "Dashboard",
                    icon: "icon-drawer",
                    roles: ["admin", "superadmin", "root", "respondent"]
                },
                {
                    link: "/member/myaccount",
                    text: "My Account",
                    icon: "icon-user",
                    roles: ["admin", "superadmin", "root", "respondent"]
                },
                {
                    link: "/member/settings",
                    text: "Settings",
                    icon: "icon-settings",
                    roles: ["admin", "superadmin", "root", "respondent"]
                }
            ]
                .map(link => link.roles.includes(data.role) ? ({
                    link: link.link,
                    text: link.text,
                    icon: link.icon
                }) : null)
                .filter(link => Boolean(link));
            data = { ...Mutate(data), ...req.user, navbar }
            // Set only while an admin is signed in as this member, so the member site can show the banner.
            data.adminSession = req.adminSession ? { expiresAt: req.adminSession.expiresAt } : null;
            data.firstname = data.name.first;
            data.lastname = data.name.last;
            return { message, data };
        },
        userController
    ))
    .post(expressRoute(
        async req => {
            if (!req.user || !req.user._id) throw new Error("Invalid request");
            answerController.request = req;
            let message = "";
            let data = Mutate(await userController.read(req.user._id))
            data.whatsapp = data.phone;
            let temp = Mutate(await answerController.getAnswers({ user: req.user._id, question: { $in: [...req.body.questions] } }))
            temp.firstname = data.name.first;
            temp.lastname = data.name.last;
            return { message, data: { ...data, ...temp } };
        },
        userController
    ))
    .patch(expressRoute(
        async req => {
            const [message, data] = ["Password Change Successfully", []];
            const { oldPassword, newPassword, cnfPassword } = req.body;
            if (newPassword !== cnfPassword) throw new Error("Invalid request")
            await userController.changePassword(oldPassword, newPassword);
            return { message, data }
        },
        userController
    ))
    .put(expressRoute(
        async req => {
            const [message, data] = ["Updated successfully", []];
            // Only the member's own preference fields (the same list as PUT /api/v1/user/:id). Role, category,
            // verification flags, status, email, password and Teen/guardian data can never be set from here.
            const body = omit(pick(req.body || {}, SELF_EDITABLE), []);
            // The quality score is still worked out in the browser (profiles page). Until it moves to the server,
            // accept it only as a small step up from the stored value, never down and never above the cap.
            if (req.body && Object.prototype.hasOwnProperty.call(req.body, "qualityScore")) {
                const current = Number((await userController.read(req.user._id))?.qualityScore) || 0;
                const wanted = Math.round(Number(req.body.qualityScore));
                if (Number.isFinite(wanted) && wanted > current && wanted - current <= QUALITY_STEP_MAX) {
                    body.qualityScore = Math.min(wanted, QUALITY_MAX);
                }
            }
            if (!Object.keys(body).length) throw new Error("Nothing to update.");
            // the consent kit's "marketing" id is the marketing e-mail opt-in: keep User.marketingOptIn in step
            let termsBefore = null;
            if (Array.isArray(body.terms)) {
                const cur = await User.findOne({ _id: req.user._id, origin: req.origin }).select("terms category").lean();
                termsBefore = cur?.terms || [];
                body.terms = Marketing.stripForTeen(cur, body.terms);
            }
            await userController.update(req.user._id, body);
            if (termsBefore) await Marketing.syncFromTerms(req.user._id, req.origin, termsBefore, body.terms);
            return { message, data };
        },
        userController
    ))
    .delete(async (req, res) => {
        res.cookie("authorization", null, {
            maxAge: -1
        })
        return res.json({})
    })
router
    .get("/points",
        expressRoute(
            async req => {
                let message = "";
                let data = []
                responseController.request = req;
                rewardController.request = req;
                let respPoints = await responseController.getPoints();
                // completed surveys + paid profiles (a profile completed as a survey is counted once)
                let earned = await rewardController.total();
                // points spent on rewards (Redemption, Nov 2026); 0 for everyone until redemptions open
                const redeemed = await redeemedPoints(req.user._id, req.origin);
                data = {
                    respPoints,
                    rewardPoints: earned - respPoints,
                    redeemPoints: redeemed,
                    totalPoints: earned - redeemed,
                    threshold: 15000,
                    conversionRate: 0.001
                }
                return { message, data }
            },
            userController
        )
    )
    .get(`/statistics`,
        expressRoute(
            async req => {
                let data = [];
                let message = "";

                responseController.request = req;
                data = Mutate(await responseController.surveySummary());
                if (data.length === 1) data = data[0]
                return { message, data }
            },
            responseController
        )
    )
    .get(`/rewards`,
        expressRoute(
            async req => {
                let message = "";
                rewardController.request = req;
                const earned = await rewardController.total();
                const data = {
                    total: earned,
                    claimed: 0,
                    earned,
                }
                return { message, data }
            },
            responseController
        )
    )
    .patch(`/answer`,
        expressRoute(
            async req => {
                let [message, data] = ["Updated successfully", []]
                const questions = Object.keys(req.body);
                const answers = questions.map(fld => {
                    return {
                        user: req.user._id,
                        question: fld,
                        answer: req.body[fld]
                    }
                })
                await answerController.save(answers)
                return { message, data }
            },
            answerController
        )
    )
    // A member could move themselves between Consumer, Professional and Teen. Segment changes are an admin action
    // (super admin console, Members module), so members get 403 here.
    .patch("/change-category",
        requireAdmin,
        expressRoute(
            async req => {
                const [message, data] = [
                    "Category Updated",
                    await userController.changeCategory(req.body.category)
                ];
                return { message, data };
            },
            userController
        )
    )
    .patch("/payment-method",
        expressRoute(
            async req => {
                const [message, data] = [
                    "Payment Method Updated",
                    await userController.changePaymentMethod(req.body)
                ];
                return { message, data };
            },
            userController
        )
    )
    .patch("/parent-details",
        expressRoute(
            async req => {
                // Only the guardian's details are taken from the body, and only for an existing teen who has not given
                // them yet. This used to write the whole request body onto the member (any field, including role) and
                // set any member's category to "minor".
                const me = await userController.read(req.user._id);
                if (!String(me?.category || "").includes("minor")) throw new Error("Only Teen Panel members can add guardian details");
                if (me?.parent?.email) throw new Error("Guardian details are already on file");
                const p = req.body?.parent || {};
                const clean = (v, max = 120) => String(v ?? "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, max);
                const parent = {
                    relation: clean(p.relation, 40),
                    name: { salutation: clean(p.name?.salutation, 10), first: clean(p.name?.first), last: clean(p.name?.last) },
                    email: clean(p.email, 254).toLowerCase(),
                };
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parent.email)) throw new Error("Please enter a valid email address");
                await userController.update(req.user._id, { parent });
                let user = Mutate(await userController.read(req.user._id))

                let mailer = await getMailer(
                    "register",
                    "minor",
                    {
                        user
                    }
                )
                const emailStatus = await sendMail(
                    { origin: req.origin, "content-type": "application/json" },
                    user?.parent?.email,
                    "My Frequent Rewards: Child Registration",
                    mailer.data
                )
                console.log(emailStatus)
                return {
                    status: "success",
                    message: "",
                    data: user
                }
            },
            userController
        )
    )

router
    .route("/change-email")
    .patch(expressRoute(
        async req => {
            let [message, data] = ["", await userController.read(req.user._id)];
            let otp = await otpController.generate(
                data._id,
                "email",
                req.origin,
                1 * 24 * 60 * 60 * 1000
            );
            let token = Token.generate({
                user: data._id,
                otp: otp.code,
                email: req.body.email
            }, "24h")
            let mailer = await getMailer(
                "register",
                "change-email",
                {
                    user: data,
                    token,
                    email: req.body.email
                }
            )

            await sendMail(
                { origin: req.origin, "content-type": "application/json" },
                data.mail,
                `My Frequent Rewards: Update E-Mail Address`,
                mailer.data
            )
            message = `Please check your inbox and spam folders of email (${data.mail}) to proceed further in the process.`
            return { message, data };
        },
        userController
    ))
router
    .route("/invite")
    .post(expressRoute(
        async req => {
            const me = await userController.read(req?.user?._id);
            let mails = req.body.emails ?? [];
            let users = Mutate(await userController.list({
                mail: { $in: mails }
            })).map(u => u.mail)
            console.log({ users });
            const emails = mails.filter(e => !users.includes(e));
            // /*
            let mailer = await getMailer(
                "register",
                "invite",
                {
                    user: me,
                    ref: {
                        link: `https://${req.origin}/?ref=${me._id}&signup`
                    }
                }
            )

            for (let index = 0; index < emails.length; index++) {
                const email = emails[index];
                await sendMail(
                    {
                        origin: req.origin,
                        "content-type": "application/json"
                    },
                    email,
                    `Invitation from ${me.fullName} to join My Frequent Rewards, A survey portal for Business 2 Business Industry`,
                    mailer.data
                )
            }
            await userController.addInvites(emails);
            return {
                message: "E-Mail Sent Successfully", data: {
                    invited: emails,
                    alreadyRegistered: users
                }
            }
        },
        userController
    ))
    .get(expressRoute(
        async req => {
            return {
                message: "",
                data: await userController.invitedUsers()
            }
        },
        userController
    ))
router
    .route("/profile")
    .patch(expressRoute(
        async req => {
            const user = req.user;
            // const { questions, answers } = req.body;
            const answers = req.body;
            const questions = Object.keys(req.body);
            if (!user || !questions || !(questions instanceof Array) || questions.length < 1) throw new Error("Invalid request");
            const updatedAnswers = questions.map(fld => {
                if (!(fld in answers)) return false;
                return {
                    user: user._id,
                    question: fld,
                    answer: answers[fld]
                }
            }).filter(q => Boolean(q))
            await answerController.save(updatedAnswers)
            return { message: "Profile updated successfully", data: [] }
        },
        answerController
    ))
router
    .route("/survey")
    .get(expressRoute(
        async req => {
            let message = "";
            let data = await responseController.mySurveyCounts();
            return { message, data }
        },
        responseController
    ))
    .post(expressRoute(
        async req => {
            let message = "";
            const { dateRange, source, status } = req.body;
            console.log({
                dateRange, source, status
            })
            let filters = {}
            if (dateRange && (dateRange instanceof Array) && dateRange.length === 2) {
                const start = new Date(dateRange[0]);
                const end = new Date(dateRange[1]);
                start.resetTime("start");
                end.resetTime("end");
                filters = {
                    ...filters,
                    createdAt: {
                        $gte: start,
                        $lte: end
                    }
                }
            }
            if (source) {
                filters = {
                    ...filters,
                    source
                }
            }
            if (status) {
                filters = {
                    ...filters,
                    status
                }
            }
            let data = await responseController.mySurveys(filters);
            // throw new Error("Under development")
            return { message, data }
        },
        responseController
    ))
    .put(expressRoute(
        async req => {
            let message = "";
            await basicsGate(req, req.body.slug);
            surveyController.request = req;
            let data = await surveyController.openBySlug(req.body.slug)
            if (!data) throw new Error("Invalid Request");
            let resp = Mutate(await responseController.createOrUpdate({
                user: req.user._id,
                survey: {
                    name: data.name,
                    slug: data.slug
                },
                timeline: {
                    start: new Date(),
                },
                telemetry: [
                    {
                        key: "UserAgent",
                        value: req.headers["user-agent"]
                    },
                    {
                        key: "Languages",
                        value: req.headers["accept-language"]
                    },
                    {
                        key: "IP Address",
                        value: req.clientIP
                    }
                ],
                status: "dropout",
                source: data.source,
                points: data.points
            }))

            return { message, data: { ...data, respID: resp._id, userInfo: req.user } }
        },
        responseController
    ))
    .patch(expressRoute(
        async req => {
            surveyController.request = req;
            answerController.request = req;
            let message = "";
            let data = []
            let response = await responseController.read(req.body.respID);

            // if (response.status !== "dropout") throw new Error("Invalid request");

            let questions = await surveyController.getQuestions(response.survey.slug);

            const answers = questions.filter(fld => Boolean(req.body[fld])).filter(fld => !(["age"].includes(fld))).map(fld => {
                return {
                    user: req.user._id,
                    question: fld,
                    answer: ("address-practice" === fld) ? JSON.stringify(req.body[fld]) : req.body[fld]
                }
            })
            const me = questions.filter(fld => typeof req.body[fld] === "object").map(
                fld => {
                    let temp = fld.split("-")
                    const ans = req.body[fld];
                    let gps = ans?.consent === "Yes" ? {
                        type: "Point",
                        coordinates: [ans.coordinates.lat, ans.coordinates.lng]
                    } : null;

                    if (temp[0] === "address") {
                        return {
                            address: {
                                tag: temp[1],
                                house: ans.line1,
                                street: ans.line2,
                                city: ans.city,
                                state: ans.state,
                                zipcode: ans.zipcode,
                                country: ans.country,
                                gps
                            }
                        }
                    }
                    else {
                        return { [fld]: ans }
                    }
                }
            )
            userController.req = req;
            for (let index = 0; index < me.length; index++) {
                const element = me[index];
                let resp = await userController.update(req.user._id, element)
            }
            await answerController.save(answers)
            response.status = "complete";
            response.timeline.end = new Date();
            await response.save()
            return { message, data }
        },
        responseController
    ))
// An admin signed in as this member ends the session from the banner: the session closes and the cookie is cleared.
// The member's own sessions have nothing to end here.
router.post("/admin-session/end", async (req, res) => {
    if (!req.adminSession) return res.status(400).json({ status: "error", code: "no_admin_session", message: "This is not an admin session." });
    await AdminSession.updateOne({ _id: req.adminSession.id, endedAt: null }, { $set: { endedAt: new Date(), endedBy: "banner" } });
    res.clearCookie("authorization");
    return res.json({ status: "success", message: "Admin session ended", data: [] });
});
export default router;