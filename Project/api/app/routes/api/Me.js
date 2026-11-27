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

// Every survey and every non-About-You profile stays locked until the member's About You profiles are complete
// (member/aboutYou.js; the list is set per brand from the MADP console). The member screen shows the same lock; this
// is the rule on the server, so a direct survey link or an API call cannot open a survey or a locked profile early.
import * as AboutYou from "../../member/aboutYou.js";

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
import { termsFor } from "../../member/terms.js";
import { settleProfiles, DEFAULT_PROFILE_POINTS } from "../../member/profileCredit.js";
import * as Sessions from "../../utils/memberSession.js";
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
            // a new password signs out every other device (Settings > Sessions, issue #112)
            await Sessions.endOthers(req.user._id, req.origin, req.memberSessionId, "password").catch(() => {});
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
            // The Quality Score is no longer sent by the browser: completed profiles and surveys raise it on the server,
            // once each (member/profileCredit.js, POST /me/quality/settle). A qualityScore in the body is ignored.
            if (!Object.keys(body).length) throw new Error("Nothing to update.");
            // the consent kit's "marketing" id is the marketing e-mail opt-in: keep User.marketingOptIn in step
            let termsBefore = null;
            if (Array.isArray(body.terms)) {
                const cur = await User.findOne({ _id: req.user._id, origin: req.origin }).select("terms category").lean();
                termsBefore = cur?.terms || [];
                body.terms = Marketing.stripForTeen(cur, body.terms);
                body["termsAcceptance.acceptedAt"] = body.terms.length ? new Date() : null; // Settings > Terms shows the date
            }
            await userController.update(req.user._id, body);
            if (termsBefore) await Marketing.syncFromTerms(req.user._id, req.origin, termsBefore, body.terms);
            return { message, data };
        },
        userController
    ))
    .delete(async (req, res) => {
        // log out: this device's session ends too, so a copy of the token stops working (issue #112)
        if (req.memberSessionId) await Sessions.end(req.user._id, req.origin, req.memberSessionId, "logout").catch(() => {});
        res.cookie("authorization", null, {
            maxAge: -1
        })
        return res.json({})
    })
router
    // Settings > Privacy & security > Sessions (issue #112): every device this member is signed in on
    .get("/sessions", expressRoute(
        async req => ({ message: "", data: { current: req.memberSessionId || null, sessions: await Sessions.list(req.user._id, req.origin, req.memberSessionId) } }),
        userController
    ))
    // sign out one device (not this one: that is Log out)
    .post("/sessions/:sid/end", expressRoute(
        async req => {
            if (String(req.params.sid) === String(req.memberSessionId || "")) throw new Error("Use Log out to sign out of this device.");
            const n = await Sessions.end(req.user._id, req.origin, req.params.sid, "member");
            if (!n) throw new Error("That session has already ended.");
            return { message: "Signed out", data: { ended: n } };
        },
        userController
    ))
    // sign out every other device
    .post("/sessions/end-others", expressRoute(
        async req => ({ message: "Signed out", data: { ended: await Sessions.endOthers(req.user._id, req.origin, req.memberSessionId, "member") } }),
        userController
    ))
router
    // Quality Score for completed profiles and surveys: worked out and saved here, once per item (member/profileCredit.js)
    .post("/quality/settle", expressRoute(
        async req => {
            const r = await settleProfiles(req, { force: true });
            const u = await User.findOne({ _id: req.user._id, origin: req.origin }).select("qualityScore").lean();
            return { message: "", data: { added: r.quality, paid: r.paid, qualityScore: u?.qualityScore ?? null } };
        },
        userController
    ))
    // Settings > Terms: what this member agreed to, and when (member/terms.js)
    .get("/terms", expressRoute(
        async req => ({ message: "", data: await termsFor(req.user._id, req.origin) }),
        userController
    ))
    // The About You lock for this member: which profiles must be finished first, which are still open, and which
    // profiles stay locked until then. The member site reads this instead of keeping its own list.
    .get("/about-you", expressRoute(
        async req => ({ message: "", data: AboutYou.publicView(await AboutYou.aboutYouState(req)) }),
        profileController
    ))
    .get("/points",
        expressRoute(
            async req => {
                let message = "";
                let data = []
                // completed profiles are paid (and add their Quality Score point) here, on the server
                await settleProfiles(req);
                responseController.request = req;
                rewardController.request = req;
                let respPoints = await responseController.getPoints();
                // completed surveys + paid profiles (a profile completed as a survey is counted once)
                let earned = await rewardController.total();
                // points spent on rewards (Redemption, Nov 2026); 0 for everyone until redemptions open
                const redeemed = await redeemedPoints(req.user._id, req.origin);
                // the profile payments the database holds: the Profiles page's prize machine counts these instead of
                // working the points out in the browser (it showed 390 points while the balance was 0)
                const own = await rewardController.mine();
                const profileRewards = own.filter((r) => r.category === "profile").map((r) => ({ profile: String(r.key || "").replace(/^profile:/, ""), points: Number(r.points) || 0 }));
                data = {
                    respPoints,
                    rewardPoints: earned - respPoints,
                    redeemPoints: redeemed,
                    totalPoints: earned - redeemed,
                    threshold: 15000,
                    conversionRate: 0.001,
                    profileRewards,
                    profilePoints: profileRewards.reduce((n, r) => n + r.points, 0),
                    pointsPerProfile: DEFAULT_PROFILE_POINTS,
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
                await AboutYou.assertCanAnswer(req, questions);
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
            await AboutYou.assertCanAnswer(req, questions);
            const updatedAnswers = questions.map(fld => {
                if (!(fld in answers)) return false;
                return {
                    user: user._id,
                    question: fld,
                    answer: answers[fld]
                }
            }).filter(q => Boolean(q))
            await answerController.save(updatedAnswers)
            // Issue #106: a profile completed by these answers is paid (and adds its Quality Score point) right now,
            // so the header and the Rewards page show the new points on their next read
            const settled = await settleProfiles(req, { force: true });
            return { message: "Profile updated successfully", data: { paid: settled.paid, quality: settled.quality } }
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
            await AboutYou.assertCanOpen(req, String(req.body?.slug ?? ""));
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
            if (!response || String(response.user?._id ?? response.user) !== String(req.user._id)) throw new Error("Invalid request");
            // a survey opened before the lock (or a profile run as a survey) still needs About You done to save
            await AboutYou.assertCanOpen(req, response.survey?.slug);

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