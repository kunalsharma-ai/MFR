import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import fileUpload from "express-fileupload";
import pureIP from "express-pureip";
import mongoose from "mongoose";
import appRoute from "./routes/index.js";
import compression from "compression";
import { setOrigin, expressRoute, fsLogger } from "./utils/index.js";

(async () => {
    const env = {
        port: process.env.port ?? 3000,
        db: process.env.mongodb ?? "mongodb://db/mfr"
    }
    await mongoose.connect(env.db);
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
        fsLogger.Log("WARNING: JWT_SECRET is missing or shorter than 32 characters. Use a long random secret in production.");
    const app = express();
    app
        .disable("x-powered-by")
        .set("view-engine", "twig")
        .set('views', "views")
        .use([
            compression(),
            express.static("/src/public"),
            cors({
                origin: ["https://mfr.sampledge.duckdns.org", "https://admin.sampledge.duckdns.org"],
                credentials: true,
                allowedHeaders: ["Content-Type", "Authorization", "test"],
                methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
            }),
            // The panel admin API (/api/admin/v1) parses its own bodies (bigger limit, raw bytes kept for MADP's signature)
            express.json({ type: (req) => !req.url.startsWith("/api/admin/") && /json/i.test(req.headers["content-type"] || "") }),
            express.urlencoded({
                extended: true
            }),
            cookieParser(),
            pureIP,
            // uploads: 10 MB a file, 5 files a request, nothing parsed into the request beyond that
            fileUpload({ limits: { fileSize: 10 * 1024 * 1024, files: 5, fields: 50 }, abortOnLimit: true, safeFileNames: true, preserveExtension: 4 }),
            setOrigin,
            errorRoute,
            appRoute
        ])
        .use(expressRoute(
            async (req) => {
                fsLogger.Log("Fallback route", {
                    ...req.headers,
                    endpoint: req.path,
                    origin: req.origin
                })
                return { message: `Fallback route: ${req.path} is not available`, status: "error" }
            },
            {}
        ))
        .listen(env.port, () => {
            fsLogger.Log(`Server started at port ${env.port}`)
        })
})();

async function errorRoute(error, req, res, next) {
    let { status, message } = error;
    if (isNaN(status)) status = 500;
    fsLogger.Log(`Error: ${error.message}`, {
        ...req.headers,
        origin: req.origin
    })
    return res.status(status).json({
        status: "error",
        message
    })
}