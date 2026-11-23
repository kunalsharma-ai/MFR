import express from "express";
import {
    Support as supportController,
    User
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
import { requireMember, safeFilter } from "../../utils/access.js";

// Access (Nov 2026 lock-down): a member sees, reads and replies to their own tickets only; admins (ADMIN_ROLES,
// role read from the database by requireMember) keep full access. A ticket belongs to the member whose email is in
// issueRaisedBy.email; that email is always read from the database, never taken from the request.
const router = express.Router();
router.use(requireMember);

async function myEmail(req) {
    User.request = req;
    const me = await User.read(req.user._id);
    if (!me?.mail) throw new Error("Ticket not found");
    return String(me.mail).toLowerCase();
}
const ownerEmail = (ticket) => String(ticket?.issueRaisedBy?.email || "").toLowerCase();
// the ticket, if this member may see it; the same "not found" either way, so ticket ids can't be probed
async function ticketFor(req) {
    supportController.request = req;
    const ticket = await supportController.read(req.params.id).catch(() => null);
    if (!ticket) throw new Error("Ticket not found");
    if (req.isAdmin) return ticket;
    if (ownerEmail(ticket) !== await myEmail(req)) throw new Error("Ticket not found");
    return ticket;
}
const adminOnly = (req) => { if (!req.isAdmin) throw new Error("Forbidden"); };
router
    .route("/")
    .get(expressRoute(
        async req => {
            // admins: every ticket. members: their own
            let message = ""
            const filter = req.isAdmin ? {} : { "issueRaisedBy.email": await myEmail(req) };
            let data = await supportController.list(filter, null, {
                _id: -1
            });
            return { message, data };
        },
        supportController
    ))
    .post(expressRoute(
        async req => {
            // filtered list. A member's filter is always narrowed to their own tickets.
            let message = ""
            const filter = safeFilter(req.body && typeof req.body === "object" ? { ...req.body } : {});
            if (!req.isAdmin) filter["issueRaisedBy.email"] = await myEmail(req);
            let data = await supportController.list(filter, null, {
                _id: -1
            });
            return { message, data };
        },
        supportController
    ))
    .put(expressRoute(
        async req => {
            User.request = req;
            const {
                subject = "",
                description = "",
                category = "",
                department = "",
                attachments = [],
                tags = "",
                priority = ""
            } = req.body;
            let issueRaisedBy;
            // only an admin may open a ticket on behalf of another member
            if (req.isAdmin && "user" in req.body) {
                const temp = await User.list({
                    mail: req.body.user
                })
                if (temp.length === 1) issueRaisedBy = {
                    name: temp[0].fullName,
                    email: temp[0].mail
                };
                else throw new Error("Something went wrong, Please contact administrator");
            } else {
                const temp = await User.read(req.user._id)
                issueRaisedBy = {
                    name: temp.fullName,
                    email: temp.mail
                }
            }
            let teamMembers = await User.list({
                role: {
                    $in: ["admin", "root", "agent"]
                }
            })
            const message = "Your request is accepted by the system, One of our correspondent will reach you soon. Keep checking your inbox/spam folders of email or this section of dashboard for status."
            const data = await supportController.create({
                subject,
                issueRaisedBy,
                description,
                category,
                department,
                attachments,
                tags,
                priority
            })
            // let user = await User.read(req.user._id);
            let toUser = await getMailer(
                "support",
                "ticket-created-user",
                {
                    user: issueRaisedBy,
                    data
                }
            )
            await sendMail(
                { origin: req.origin, "content-type": "application/json" },
                issueRaisedBy.email,
                "My Frequent Rewards: Support Ticket Created",
                toUser.data
            )
            let toTeam = await getMailer(
                "support",
                "ticket-created-team",
                {
                    user: issueRaisedBy,
                    data
                }
            )

            for (let index = 0; index < teamMembers.length; index++) {
                const member = teamMembers[index];
                await sendMail(
                    { origin: req.origin, "content-type": "application/json" },
                    member.mail,
                    "My Frequent Rewards: Support Ticket Created",
                    toTeam.data
                )
            }
            return { message, data };
        },
        supportController
    ))
// The signed-in member's own tickets, newest first (also used by the member Help centre).
router
    .route("/mine")
    .get(expressRoute(
        async req => {
            const data = await supportController.list({ "issueRaisedBy.email": await myEmail(req) }, null, { _id: -1 });
            return { message: "", data };
        },
        supportController
    ))
router
    .route('/:id')
    .get(expressRoute(
        async req => {
            let message = "";
            let data = await ticketFor(req)
            return { message, data }
        },
        supportController
    ))
    .post(expressRoute(
        async req => {
            adminOnly(req);
        },
        supportController
    ))
    .put(expressRoute(
        async req => {
            adminOnly(req);
        },
        supportController
    ))
    .patch(expressRoute(
        async req => {
            adminOnly(req);
        },
        supportController
    ))
    .delete(expressRoute(
        async req => {
            adminOnly(req);
            let data = [];
            let message = "Successfully deleted";

            await supportController.delete(req.params.id);
            return { message, data }
        },
        supportController
    ))
router
    .route('/:id/reply')
    .get(expressRoute(
        async req => {
            let ticket = await ticketFor(req)
            let [message, data] = ["",
                await supportController.conversation(ticket)
            ];
            return { message, data }
        },
        supportController
    ))
    .post(expressRoute(
        async req => {
            adminOnly(req);
            let [message, data] = ["", []];
            return { message, data }
        },
        supportController
    ))
    .put(expressRoute(
        async req => {
            let ticket = await ticketFor(req)
            // a member can add a reply but not change the ticket's status
            const body = req.isAdmin ? req.body : { message: req.body?.message, attachments: req.body?.attachments, status: ticket.status };
            let [message, data] = [
                "",
                await supportController.reply(ticket, body)
            ];
            let toUser = await getMailer(
                "support",
                "ticket-updated-user",
                {
                    user: ticket.issueRaisedBy,
                    reply: data,
                    repliedBy: req.user
                }
            )


            await sendMail(
                { origin: req.origin, "content-type": "application/json" },
                ticket.issueRaisedBy.email,
                "Re: My Frequent Rewards: Support Ticket Created",
                toUser.data
            )
            User.request = req;
            let teamMembers = await User.list({
                role: {
                    $in: ["admin", "root", "agent"]
                }
            })
            let toTeam = await getMailer(
                "support",
                "ticket-updated-team",
                {
                    user: ticket.issueRaisedBy,
                    reply: data,
                    repliedBy: req.user
                }
            )
            for (let index = 0; index < teamMembers.length; index++) {
                const member = teamMembers[index];
                await sendMail(
                    { origin: req.origin, "content-type": "application/json" },
                    member.mail,
                    "My Frequent Rewards: Support Ticket Created",
                    toTeam.data
                )
            }

            return { message, data }
        },
        supportController
    ))
    .patch(expressRoute(
        async req => {
            adminOnly(req);
            let [message, data] = ["", []];
            return { message, data }
        },
        supportController
    ))
    .delete(expressRoute(
        async req => {
            adminOnly(req);
            let [message, data] = ["", []];
            return { message, data }
        },
        supportController
    ))
export default router;