import express from "express";
import ansRouter from "./api/Answers.js";
import authRouter from "./api/Auth.js";
import batchRouter from "./api/Batch.js"
import categoryRouter from "./api/Category.js";
import feasibilityRouter from "./api/Feasibility.js";
import forgotPassword from "./api/forgotPassword.js";
import questionRouter from "./api/Question.js";
import optionRouter from "./api/Option.js";
import optionsRouter from "./api/options.js";
import surveyRouter from "./api/Survey.js";
import profileRouter from "./api/Profile.js";
import userRouter from "./api/User.js";
import projectRouter from "./api/ProjectLaunch.js";
import supportRouter from "./api/Support.js";
import meResponse from "./api/Response.js";
import llmRouter from "./api/llm.js"
import rewardsRouter from "./api/Rewards.js";
import teenRouter from "./api/Teen.js";
import engagementRouter from "./api/Engagement.js";
import engagementPublicRouter from "./api/EngagementPublic.js";

import { isAuthenticated } from "../utils/index.js";
import { requireAdmin } from "../utils/access.js";
import { bindRequest } from "../utils/requestContext.js";
import { securityHeaders, sanitizeInput } from "../utils/security.js";

import meRouter from "./api/Me.js";
import adminRouter from "../admin/routes.js";
import changeEmail from "./api/changeEmail.js"
import contentRouter from "./api/Content.js";
import { alerts as alertsRouter, help as helpRouter } from "./api/Inbox.js";
const router = express.Router();
router
    // every answer gets the browser security headers; member routes run in their own request context (so two
    // requests for different brands can't swap origins) and never see code-running Mongo operators
    .use(securityHeaders)
    // the MADP console's signed admin API sits under the same /api/v1 prefix as the member API (so the gateway's
    // /api/v1/ rule covers it), but is mounted first: it checks its own signature and parses its own body
    .use("/api/v1/admin", adminRouter)
    .use("/api/v1", bindRequest, sanitizeInput)
    // which build is running (issues #92 and #93 were an old API image on the server): GIT_SHA / BUILD_DATE are set
    // by `docker build --build-arg GIT_SHA=$(git rev-parse --short HEAD) --build-arg BUILD_DATE=...`
    .get("/api/v1/version", (req, res) => res.json({ status: "success", data: { commit: process.env.GIT_SHA || "unknown", builtAt: process.env.BUILD_DATE || "unknown" } }))
    .use("/api/v1/llm", llmRouter)
    .use("/api/v1/auth",authRouter)
    .use("/api/v1/answers", ansRouter)
    .use("/api/v1/category", categoryRouter)
    .use("/api/v1/survey", surveyRouter)
    .use("/api/v1/question", questionRouter)
    .use("/api/v1/option", optionRouter)
    .use("/api/v1/options", optionsRouter)
    .use("/api/v1/user", userRouter)
    .use("/api/v1/teen", teenRouter)
    .use("/api/v1/profile", profileRouter)
    .use("/api/v1/forgot-password", forgotPassword)
    .use("/api/v1/change-email", changeEmail)
    .use("/api/v1/feasibility", feasibilityRouter)
    // projects and scheduled e-mail batches are admin tools (project-dev had no sign-in at all, and any member could
    // create projects or schedule e-mails to any address from the brand's sender)
    .use("/api/v1/project-dev", requireAdmin, projectRouter)
    .use("/api/v1/me", isAuthenticated, meRouter)
    .use("/api/v1/response", isAuthenticated, meResponse)
    .use("/api/v1/rewards", isAuthenticated, rewardsRouter)
    .use("/api/v1/support", isAuthenticated, supportRouter)
    .use("/api/v1/project", requireAdmin, projectRouter)
    .use("/api/v1/batch", requireAdmin, batchRouter)
    .use("/api/v1/engagement-public", engagementPublicRouter)
    .use("/api/v1/engagement", engagementRouter)
    .use("/api/v1/alerts", isAuthenticated, alertsRouter)
    .use("/api/v1/help", isAuthenticated, helpRouter)
    .use("/api/v1/content", contentRouter)


// router
//     .use("/api/v1/respondent",respondentRouter)
export default router;