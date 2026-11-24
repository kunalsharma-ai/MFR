
Date.prototype.isMinor = function (cn = "IN") {
    let today = new Date();
    let age = (today - this) / (365.25 * 24 * 3600 * 1000);
    return age < 18
}

import { CrudController, Mutate } from "../utils/index.js";
import * as Emails from "../engagement/transactional.js";
import { User as userModel, Invites as invitesModel, Answers, Survey,Response as responseModel } from "../model/index.js";
import fs from "fs"

const COMM_QUESTION = "communication-methods";
// signup channel -> question ke option ka value (is question me WhatsApp ka option nahi hai)
const COMM_VALUE = { dashboard: "dashboard", email: "email", sms: "sms" };

class User extends CrudController {
    fixUserIssue() {
        super.request = {
            ...this.request,
            user: {
                _id: null
            }
        }
    }
    async login({ phone, mail, password }) {
        let user
        if (!phone)
            user = await super.list({ mail });
        if (!mail) user = await super.list({ phone:phone.replace(/\D/g,"") });

        if (user.length !== 1) throw new Error(`${!phone ? "E-Mail id" : "Phone no."} or Password is invalid`)
        let temp = await userModel.findById(user[0]._id).select("+role");
        // Teen Panel: no log in until the parent/guardian has finished and the teen has created a password
        if (String(temp?.category || "").includes("minor") && (temp?.registrationStatus || "active") !== "active") {
            const st = temp.registrationStatus;
            if (["rejected", "cancelled"].includes(st)) throw new Error("This Teen Panel registration was not approved, so this account can't be used.");
            if (st === "pending_password") throw new Error("Your parent or guardian has finished. Use the link in your email to create your password first.");
            throw new Error("Your parent or guardian hasn't finished their part yet. Ask them to check their email.");
        }

        if (["suspended", "banned"].includes(temp?.memberStatus)) throw new Error("This account is not active. Please contact support.");

        let response = await temp.verifyPassword(password);
        if (response) {
            return temp;
        }
        throw new Error(`${!phone ? "E-Mail id" : "Phone no."} or Password is invalid`)
    }
    async list(query = {}, populateFields = null, sort = {}, project = null) {
        console.log(query)
        return await super.list(query, populateFields, sort, project)
    }

    async saveCommunicationAnswer(user) {
    console.log("saveCommunicationAnswer called", String(user._id), (user.notification || []).map((n) => n.channel));
    try {
        const values = [...new Set(
            (user.notification || []).map((n) => COMM_VALUE[n.channel]).filter(Boolean)
        )];
        if (!values.length) return;
        await Answers.updateOne(
            { user: String(user._id), question: COMM_QUESTION, origin: user.origin || this.request?.origin },
            {
                $set: { answer: values },
                $setOnInsert: { isActive: true, isDeleted: false, sortOrder: 0 },
            },
            { upsert: true, setDefaultsOnInsert: true }
        );
    } catch (e) {
        console.log("communication-methods answer not saved:", e.message); // signup kabhi fail nahi hona chahiye
    }
}
   async create(data) {
    console.log("User.create hit", data.mail);
    this.fixUserIssue();
    invitesModel.updateMany({
        email: data.mail
    }, {
        isActive: false
    })
    const user = await super.create(data);

    await this.saveCommunicationAnswer(user);   // naya

    // Auto-invite to active surveys with autoInvite enabled
    try {
        const surveys = await Survey.find({     // modelSurvey nahi, Survey
            category: user.category,
            autoInvite: true,
            status: "active",
            ...this.commonFilters
        });

        // a survey with a minimum quality score only invites members at or above it (Nov 2026; unset = everyone)
        const score = Number(user.qualityScore ?? 100);
        const open = surveys.filter((s) => s.minQualityScore == null || score >= s.minQualityScore);
        if (open.length > 0) {
            const autoInvites = open.map(s => ({
                user: user._id,
                survey: {
                    name: s.name,
                    slug: s.slug
                },
                status: "invited",
                source: s.source,
                points: s.points,
                ...this.commonFilters
            }));
            await responseModel.insertMany(autoInvites, { ordered: false });
            for (const s of open) Emails.newSurvey([user._id], s, this.request.origin); // off unless config.emails.newSurvey
        }
    } catch (e) {
        console.log("Auto-invite failed for new user", e.message);   // console.log, chhota l
    }

    return user;
}
    async update(id, data) {
        this.fixUserIssue();
        return await super.update(id, data);
    }
    async read(id) {
        let temp = Mutate(await userModel.findById(id).select("+role"))
        let dob = new Date(temp.dob);
        return {...temp, isMinor: dob.isMinor()};
    }
    async delete(id) {
        this.fixUserIssue();
        return await super.delete(id);
    }
    async setPassword(user, password) {
        let temp = await super.read(user);
        return await temp.setPassword(password);
    }
    async changePassword(currentPassword, newPassword) {
        let user = await super.read(this.request.user._id);
        return await user.changePassword(currentPassword, newPassword)
    }
    async addInvites(emails) {
        for (let index = 0; index < emails.length; index++) {
            const email = emails[index];
            let invite = await invitesModel.create({
                invitedBy: this.request.user._id,
                email,
                isActive: true,
                isDeleted: false,
                origin: this.request.origin
            })
            await invite.save();
        }
        return true;
    }
    async invitedUsers() {
        const temp = await invitesModel.find({
            ...this.commonFilters,
            invitedBy: this.request.user._id,
            isActive: {
                $in: [true, false]
            }
        }, {
            createdAt: -1,
            email: 1,
            isActive: 1,

        })
        return temp;
    }
    async summary() {
        let summary = Mutate(await userModel.aggregate([
            {
                $match: {
                    ...this.commonFilters
                }
            },
            {
                $group: {
                    _id: "$category",
                    value: {
                        $sum: 1
                    }
                }
            },
            {
                $project: {
                    label: "$_id",
                    value: 1,
                    _id: 0
                }
            }
        ]))
        summary.unshift({
            label: "Total Panelists",
            value: summary.reduce((a, c) => {
                a += Number(c.value);
                return a;
            }, 0)
        })
        return summary;
    }
    async changeCategory(newCategory) {
        let user = await super.read(this.request.user._id);
        user.category = newCategory;
        return await user.save();
    }
    async changePaymentMethod(paymentMethod) {
        return await super.update(this.request.user._id, { paymentMethod });
    }
    async refreshUser(data) {
        await Answers.deleteMany({
            user: data.user
        })
        let user = await userModel.findById(data.user);
        await responseModel.deleteMany({
            "survey.slug": "welcome",
            user: user._id
        })
        user.terms = [];
        await user.save();
        return true;
    }
}

export default new User(userModel)
