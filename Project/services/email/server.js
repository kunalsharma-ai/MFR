import fs from "fs";
import express from 'express';
import Mail from './utils/Mail.js';
import fileUpload from "express-fileupload";
import { decrypt } from "encryption-aes";
const port = process.env.port || 3000;
function getOrigin(data) {
    if (/^https?:\/\//i.test(data)) {
        return new URL(data).hostname; // 'domain.tld'
    }
    return data;
}

// Which mail account an origin sends from: config/<origin>.json, else the same without "www.", else the account
// config/aliases.json names for it (so myfrequentrewards.com can use the existing MFR account without copying its
// password into a second file), else EMAIL_DEFAULT_ORIGIN. Before this, the live host name had no file, every
// email was answered with 405 and nothing was sent.
const safe = (o) => /^[a-z0-9.-]+$/i.test(String(o || "")) ? String(o).toLowerCase() : "";
const fileOf = (o) => (safe(o) && fs.existsSync(`config/${safe(o)}.json`) ? `config/${safe(o)}.json` : "");
function readAliases() {
    try { return JSON.parse(fs.readFileSync("config/aliases.json", "utf-8")); } catch { return {}; }
}
function configFor(origin) {
    const o = safe(origin);
    const bare = o.replace(/^www\./, "");
    const aliases = readAliases();
    return fileOf(o) || fileOf(bare) || fileOf(aliases[o]) || fileOf(aliases[bare]) || fileOf(process.env.EMAIL_DEFAULT_ORIGIN) || "";
}

(async () => {
    const app = express();
    app
        .use([
            (req, res, next) => {
                req.origin = getOrigin(req.headers.origin ?? req.headers.host);
                const file = configFor(req.origin);
                if (!file) {
                    console.log(`[${new Date()}] No mail account for "${req.origin}". Add config/${req.origin}.json or an entry in config/aliases.json.`);
                    return next();
                }
                req.creds = JSON.parse(fs.readFileSync(file, "utf-8"));
                next();
            },
            express.static('public'),
            express.json(),
            (r, s, n) => {
                console.log("yahan tak theek hai")
                n();
            },
            express.urlencoded({
                extended: true,
            }),
            fileUpload(),
        ])
        .post("/email/verify", async (r, s) => {
            try {
                let data = r.body;
                const mail = new Mail({
                    name: data.name,
                    host: data.host,
                    port: data.port,
                    secure: ["ssl", "tls"].includes(data.security),
                    auth: data.auth,
                    from: data.from,
                    replyTo: data.replyTo
                });
                await mail.verify();
                return s.json({
                    status: "success",
                    message: "verified"
                });
            } catch (error) {
                console.log(error)
                return s.json({
                    status: "error",
                    message: "Invalid credentials. Unable to connect your smtp server."
                })
            }
        })
        .use("/email", async (r, s, n) => {
            try {
                console.log({ creds: r.creds })
                if (r.creds) return n();
                if (r?.headers?.creds) {
                    const creds = r.headers.creds.split(".");
                    const temp = decrypt({
                        iv: creds[0],
                        data: creds[1],
                        tag: creds[3]
                    }, Buffer.from(creds[2], "base64"))
                    console.log(temp)
                    let data = JSON.parse(temp)
                    if (data.origin !== r.origin)
                        return s.status(403).json({
                            status: "error",
                            message: "Invalid request"
                        })

                    r.creds = {
                        name: data.name,
                        host: data.host,
                        port: data.port,
                        secure: ["ssl", "tls"].includes(data.security),
                        auth: data.auth,
                        from: data.from,
                        replyTo: data.replyTo
                    };
                    return n();
                }
                return s.status(405).json({
                    headers: r.headers
                })

            } catch (error) {
                console.log(error);
                return s.json({ message: error.message })
            }
        })
        .get("/email", async (r, s) => {
            try {
                // console.log(r.creds)
                // return s.json({
                //     ...r.creds
                // })
                const mail = new Mail(r.creds);
                const status = await mail.send(
                    "Sampledge App <om.tiwari@frequentresearch.com",
                    "optiwari.india@gmail.com",
                    "test mail",
                    {
                        html: "<b>It Works</b>",
                        text: "Chal Gaya"
                    },
                    "sanjeet@frequentresearch.com", "om.tiwari@frequentresearch.com"
                )
                console.log({ status })
                s.json({
                    status: "success",
                    data: r.data
                })
            } catch (error) {
                console.log({ error })
                s.json({
                    status: "success",
                    data: r.data,
                    error: error.message
                })
            }

        })
        .post("/email", async (r, s, n) => {
            try {
                console.log(`[${new Date()}] Sending Mail to ${r.body.to}`);
                const mail = new Mail(r.creds);
                const from = `${r.creds.name} <${r.creds.from}>`;
                const to = r.body.to;
                const subject = r.body.subject;
                const message = r.body.message ?? { html: r.body.content };
                let [cc, bcc, attachments] = []
                if (r.body.cc) cc = r.body.cc;
                if (r.body.bcc) bcc = r.body.bcc;
                if (r?.files?.attachments) {
                    let temp = r.files.attachments;
                    attachments = (temp instanceof Array) ? temp.map((e) => {
                        if (e.url) return { filename: e.name, url: e.url }
                        return {
                            filename: e.name,
                            content: e.data
                        }
                    }) : temp.url ? [{
                        filename: temp.name,
                        url: temp.url
                    }] : temp.name ? [{
                        filename: temp.name,
                        content: temp.data
                    }] : []
                }
                let resp = await mail.send(from, to, subject, message, cc, bcc, attachments)
                return s.json({
                    message: "message sent",
                    data: resp
                })

            } catch (error) {
                console.log(r.creds)
                console.log(error)
                return s.json({ error: error.message, status: "error", message: "Unable to send email." })
            }
        })
    app.listen(port, () => {
        console.log(`[${new Date()}]: Started on port ${port}`);
    })
})();