import express from "express";
import { User as userController, OTP as otpController } from "../../controller/index.js";
import { expressRoute, expressView, isAuthenticated, fsLogger, getMailer, sendMail, Token } from "../../utils/index.js"

const router = express.Router();
router
    .route("/")
    .post(expressRoute(
        async req => {
            // Same answer whether or not the e-mail is registered, so the form cannot be used to find out who is a member.
            let message = "If this e-mail is registered with us, a password reset link is on its way. Please check your mailbox.";
            if (typeof req.body?.user !== "string" || !req.body.user.trim()) throw new Error("Please enter your e-mail address.");
            let user = await userController.list({ mail: req.body.user });
            if (user.length !== 1) return { message, data: [] };
            let otp = await otpController.generate(
                user[0]._id,
                "email",
                req.origin,
                1 * 24 * 60 * 60 * 1000
            );
            let mailer = await getMailer(
                "register",
                "forgot-password",
                {
                    user: user[0],
                    otp
                }
            )
            // /*
            await sendMail(
                { origin: req.origin, "content-type": "application/json" },
                user[0].mail,
                "My Frequent Rewards: Forgot Password",
                mailer.data
            )
                //*/
            return { message, data: [] };
        },
        userController
    ))
    .patch(expressRoute(
        async req=>{

        },
        userController
    ))
// Generate and Send OTP
// Verify OTP
// Set Password
export default router;