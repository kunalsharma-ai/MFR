// Triggers for the v6 templates that had no sender in the API yet. Each one is OFF until config.emails switches it on,
// and each is fire-and-forget: a mail failure never breaks the request that triggered it.
//
//   welcome     register/welcome.liquid     after the member sets their password        config.emails.welcome
//   newuser     newuser/newuser.liquid      a new Consumer/Professional registration    config.emails.newUser
//   newsurvey   survey/newsurvey.liquid     a survey invitation was created for them    config.emails.newSurvey
//   birthday    birthday/birthday.liquid    daily job, on the member's birthday         config.emails.birthday
import mongoose from "mongoose";
import { User, MemberPreference } from "../model/index.js";
import { config } from "./config.js";
import { isOn, onAnywhere } from "./switches.js";
import { memberType } from "./http.js";
import { send, unsubscribeLink, siteUrl } from "./mail.js";
import { dayKey } from "./time.js";
import { fsLogger, Mutate } from "../utils/index.js";

const later = (fn) => { setImmediate(() => fn().catch((e) => fsLogger.Log("engagement email failed", { error: e.message }))); };
const plainUser = (u) => { const x = Mutate(u); x.fullName = [x?.name?.first, x?.name?.middle, x?.name?.last].filter(Boolean).join(" "); return x; };

// The brand's name for subject lines, from its hostname.
export const brandName = (origin) => {
    const o = String(origin || "").toLowerCase();
    if (o.includes("turn2opinion")) return "Turn2Opinion";
    if (o.includes("myhealthopinions")) return "MyHealthOpinions";
    return "MyFrequentRewards";
};

// The two member e-mails the MADP console can send again (admin/memberactions.js), built the same way as the
// member's own: the "account active" welcome, and the forgot-password link (an e-mailed code, 5 wrong guesses).
export const welcomeMessage = (u, origin) => ({
    origin, to: u.mail, category: "register", template: "welcome",
    subject: `Your ${brandName(origin)} account is active`, data: { user: plainUser(u) },
});
export const resetMessage = (u, origin, otp) => ({
    origin, to: u.mail, category: "register", template: "forgot-password",
    subject: `${brandName(origin)}: Forgot Password`, data: { user: plainUser(u), otp },
});
export const sendNow = (message) => send(message);

export function welcome(user, origin) {
    later(async () => {
        if (!(await isOn(origin, "email_welcome"))) return;
        const u = await User.findById(user._id || user).lean();
        if (!u?.mail || memberType(u) === "teen") return; // Teens get teen/teen-active
        await send(welcomeMessage(u, origin));
    });
}

export function newUser(user, origin) {
    const c = config().emails.newUser;
    if (!c?.to?.length) return;
    later(async () => {
        if (!(await isOn(origin, "email_new_user"))) return;
        const u = plainUser(user);
        for (const to of c.to) {
            await send({ origin, to, category: "newuser", template: "newuser", subject: "New registration on the MyFrequentRewards panel", data: { user: u, member: { email: u.mail }, preferences_url: `${siteUrl(origin)}/member/settings` } });
        }
    });
}

// survey: { name, slug, points, loi } ; userIds: who was just invited
export function newSurvey(userIds, survey, origin) {
    // a push to each member's browsers too, when push is set up and the member switched it on (phase 7)
    if (userIds?.length) {
        later(async () => {
            if (!(await isOn(origin, "push"))) return;
            const { pushTo } = await import("./account.js");
            for (const id of userIds) await pushTo(id, origin, { title: "A new survey is open for you", body: `${survey.name} · ${survey.points || 0} points`, url: "/member/surveys" });
        });
    }
    if (!userIds?.length) return;
    later(async () => {
        if (!(await isOn(origin, "email_new_survey"))) return;
        const week = new Date(Date.now() - 7 * 86400000);
        for (const id of userIds) {
            const u = plainUser(await User.findById(id).lean());
            if (!u?.mail || u.isActive === false || (u.registrationStatus && u.registrationStatus !== "active")) continue;
            const prefs = await MemberPreference.findOne({ user: u._id, origin }).lean();
            const n = prefs?.notifications || {};
            if (n.email === false || n.newSurvey === false) continue;
            const recent = (prefs?.newSurveyEmails || []).filter((x) => new Date(x.at) >= week).length;
            const cap = prefs?.survey?.invitesPerWeek;
            if (cap !== null && cap !== undefined && recent >= cap) continue;
            const ok = await send({
                origin, to: u.mail, category: "survey", template: "newsurvey",
                subject: `New survey available: ${survey.name}`,
                data: {
                    user: u,
                    survey: { name: survey.name, points: survey.points, time: survey.loi, link: `${siteUrl(origin)}/member/surveys` },
                    preferences_url: `${siteUrl(origin)}/member/settings`,
                    unsubscribe_url: unsubscribeLink(origin, String(u._id), "newsurvey"),
                },
            });
            if (ok) {
                await MemberPreference.updateOne(
                    { user: u._id, origin },
                    { $push: { newSurveyEmails: { $each: [{ at: new Date(), survey: survey.slug }], $slice: -60 } }, $setOnInsert: { user: u._id, origin } },
                    { upsert: true }
                );
            }
        }
    });
}

export async function runBirthdays({ dryRun = false, origin, now = new Date(), force = false } = {}) {
    const enabled = origin ? await isOn(origin, "email_birthday") : await onAnywhere("email_birthday");
    const report = { enabled, sent: 0, dryRun };
    if (!enabled && !force) return report;
    const q = { isActive: true, isDeleted: false, registrationStatus: { $in: ["active", null] }, dob: { $ne: null } };
    if (origin) q.origin = origin;
    const year = now.getUTCFullYear();
    for await (const u of User.find(q).select("name mail dob timezone origin category").lean().cursor()) {
        // the member's own date today vs their birthday (the DOB is stored as a UTC date)
        const today = dayKey(now, u.timezone).slice(5);
        const bday = new Date(u.dob).toISOString().slice(5, 10);
        if (today !== bday) continue;
        if (!force && !(await isOn(u.origin, "email_birthday"))) continue;
        const prefs = await MemberPreference.findOne({ user: u._id, origin: u.origin }).lean();
        if (prefs?.lastBirthdayYear === year || prefs?.notifications?.email === false || prefs?.notifications?.birthday === false) continue;
        if (dryRun) { report.sent += 1; continue; }
        const x = plainUser(u);
        const ok = await send({
            origin: u.origin, to: u.mail, category: "birthday", template: "birthday", subject: `Happy birthday, ${x?.name?.first || ""}`.trim(),
            data: { user: x, preferences_url: `${siteUrl(u.origin)}/member/settings`, unsubscribe_url: unsubscribeLink(u.origin, String(u._id), "birthday") },
        });
        if (ok) {
            await MemberPreference.updateOne({ user: u._id, origin: u.origin }, { $set: { lastBirthdayYear: year }, $setOnInsert: { user: u._id, origin: u.origin } }, { upsert: true });
            report.sent += 1;
        }
    }
    return report;
}
