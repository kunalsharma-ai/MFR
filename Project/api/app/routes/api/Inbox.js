// Member side of portal messages and console help entries (Nov 2026, super admin step 3b).
//   GET  /api/v1/alerts          the member's portal messages (the bell and Messages page already call this)
//   POST /api/v1/alerts/:id/read mark one as read
//   GET  /api/v1/help            published help entries for the member's type
import express from "express";
import { User } from "../../model/index.js";
import { handle, memberType } from "../../engagement/http.js";
import { inbox, markRead } from "../../admin/messages.js";
import { forMember } from "../../admin/help.js";

export const alerts = express.Router()
    .get("/", handle((req) => inbox(req.user, req.origin)))
    .post("/:id/read", handle((req) => markRead(req.user, req.origin, req.params.id)));

export const help = express.Router()
    .get("/", handle(async (req) => {
        const me = await User.findOne({ _id: req.user._id, origin: req.origin }).select("category").lean();
        return forMember(memberType(me), req.origin);
    }));
