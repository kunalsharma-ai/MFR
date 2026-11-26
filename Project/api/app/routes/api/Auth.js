import { HttpError, asyncHandler, API } from "express-web-tools"
import express from "express";
import { expressRoute, expressView, isAuthenticated, fsLogger, Mutate, Token } from "../../utils/index.js"
import JWT from "jsonwebtoken";
import { limit } from "../../utils/security.js";
import { fileAccountAction, AccountActionError } from "../../member/accountActions.js";
import {
  User as userController
} from "../../controller/index.js";

const router = express.Router();
router
  .route(["/socials", "/social"])
  .get(
    expressRoute(async (req) => {
      let { token } = req.query;
      if (!token) return { redirect: "/?signup=1" };
      // The sign-on service's key comes from the environment. It used to be written here in the code, so anyone who
      // saw the code could make a token for any e-mail and be signed in as that member. Without the key social
      // sign-on is off. Tokens must be HS256 and at most 15 minutes old.
      const key = process.env.SOCIAL_JWT_SECRET;
      if (!key || key.length < 32) return { redirect: "/?signup=1" };
      let info;
      try {
        info = JWT.verify(String(token), key, { algorithms: ["HS256"], maxAge: "15m" });
      } catch (e) {
        return { redirect: "/?signup=1" };
      }
      if (!info.email) {
        let searchParams = new URLSearchParams(info);
        return {
          redirect: `/?signup=1&${searchParams.toString()}`
        };
      }
      const user = await userController.findOne({ mail: String(info.email).trim().toLowerCase() });
      if (!user) {
        let searchParams = new URLSearchParams(info);
        return {
          redirect: `/?signup=1&${searchParams.toString()}`
        };
      }
      // not verified yet: back to the site's "verify your email" prompt, with no session and nothing about the account
      if (user?.isVerified?.email === "unverified") return { redirect: `/?verifyemail=${encodeURIComponent(user.mail)}` }
      token = Token.generate({
        _id: user._id,
        category: user.category,
        email: user.mail,
        phone: user.phone,
        name: user.name,
        origin: user.origin,
        role: user.role ?? ""
      })
      // No `redirect` here: expressRoute sets the login cookie for a token and then sends the member to
      // /member/dashboard itself. A redirect returned with the token skipped the cookie, so a social sign-in
      // landed on the dashboard logged out and bounced back to the home page.
      return { message: "", data: [], token }
    },
      userController
    )
  )
  .post(
    asyncHandler(
      async (req, res) => {
        let socialUrl = process.env.socials;
        if (!socialUrl) throw new HttpError(404, "Social signon is not allowed")
        let temp = new URL(socialUrl);
        let api = new API(
          {
            baseURL: `${temp.origin}`,
            useHttps: (temp.protocol === "https:")
          }
        )

        let resp = await api.get(temp.pathname.replace(/^\//, ""));
        return res.json({
          status: "success",
          data: resp?.data?.data?.providers
        });
      }
    )
  )
// "Delete or Deactivate Account" page (My Account): files the member's request for the support team. Nothing on the
// account changes here; see member/accountActions.js. The member types their password again.
router.post("/delete", limit(10, 15), isAuthenticated, async (req, res) => {
  try {
    const data = await fileAccountAction(req.user, req.origin, req.body || {});
    res.json({ status: "success", message: "Your request has been sent to our Support Team.", data });
  } catch (e) {
    if (e instanceof AccountActionError) return res.status(e.status).json({ status: "error", error: e.code, message: e.message });
    fsLogger.Log(`auth/delete failed: ${e?.message}`);
    res.status(500).json({ status: "error", error: "server_error", message: "Something went wrong. Please try again." });
  }
});
export default router;
