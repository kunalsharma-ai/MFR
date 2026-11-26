// pm2 process file for the API's production image (Dockerfile, stage "production"): `pm2-runtime start ecosystem.config.cjs`.
// One process in fork mode by default: rate limits and a few caches live in memory, so several processes would each
// keep their own. Set PM2_INSTANCES (a number, or "max") to run more, in cluster mode.
const instances = process.env.PM2_INSTANCES || 1;
module.exports = {
    apps: [
        {
            name: "mfr-api",
            script: "app/server.js",
            cwd: __dirname,
            instances,
            exec_mode: String(instances) === "1" ? "fork" : "cluster",
            max_memory_restart: process.env.PM2_MAX_MEMORY || "768M",
            kill_timeout: 10000,
            time: true,
            env: { NODE_ENV: "production" },
        },
    ],
};
