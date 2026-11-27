import API from "./API.js";
import { verify } from "./token.js";
import {User as userModel} from "../model/index.js"
import { Mutate } from "./index.js";
import { openSession, refused } from "./adminSession.js";
import { check as checkMemberSession } from "./memberSession.js";
export default async function isAuthenticated(req, res, next) {
    const authtoken = req.headers.authorization??req.cookies.authorization;
    
    if (!authtoken) {
        return res.status(401).json({
            status: "error",
            message: "Unauthorized [No Token Found]"
        })
    }
    const token = authtoken.split(" ")[1];
    if (!token) {
        return res.status(401).json({
            status: "error",
            message: "Unauthorized- [Invalid Token]"
        })
    }
    try {
        let user = verify(token);
        if (!user || !user._id || !req.origin) {
            return res.status(401).json({
                status: "error",
                message: "Unauthorized--[Token Mismatched]"
            })
        }

        if (user.origin !== req.origin) {
            return res.status(403).json({
                status: "error",
                message: "Forbidden"
            })
        }

        // An admin signed in as this member ("log in as member"): the session must still be open, and some actions
        // are refused (utils/adminSession.js).
        req.adminSession = null;
        req.memberSessionId = null;
        // the member's own sign-in (issue #112): one signed out from Settings > Sessions stops working at once.
        // Tokens from before sessions were recorded carry no sid and keep working until they expire.
        if (user.sid && !user.adm) {
            const own = await checkMemberSession(user, req.origin);
            if (!own) return res.status(401).json({ status: "error", code: "session_ended", message: "You were signed out on this device." });
            req.memberSessionId = String(user.sid);
        }
        if (user.adm) {
            const s = await openSession(user, req.origin);
            if (!s) return res.status(401).json({ status: "error", code: "admin_session_ended", message: "This admin session has ended." });
            req.adminSession = s;
            const why = refused(req);
            if (why) return res.status(403).json({ status: "error", code: "admin_session", message: why });
        }
        req.user = await getUserDetails(user);
        if (!req.user || ["suspended", "banned", "closed"].includes(req.user.memberStatus)) {
            return res.status(403).json({
                status: "error",
                message: "This account is not active"
            })
        }
        // Teen turning 18: everything pauses until the member accepts adult terms (teen/adult.js). Only the move
        // screen and reading their own account stay open.
        if (req.user.adultMove?.stage === "turning_adult") {
            const p = String(req.originalUrl || "").split("?")[0];
            const open = p.startsWith("/api/v1/teen/adult") || (req.method === "GET" && (p === "/api/v1/me" || p === "/api/v1/me/"));
            if (!open) {
                return res.status(403).json({ status: "error", code: "adult_terms_required", message: "You're 18 now. Please accept the adult terms to carry on." });
            }
        }
        return next();
    } catch (error) {
        console.log(error);

        return res.status(401).json({
            status: "error",
            message: "token expired"
        })
    }
}

async function getUserDetails(user) {
    let usr=Mutate(await userModel.findById(user._id));
    return usr;
}