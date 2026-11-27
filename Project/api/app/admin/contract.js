// MADP Panel API Contract discovery (contract 1.0.0, docs/PANEL_API_CONTRACT.md in kunalsharma-ai/MADP).
// GET /api/v1/contract, signed like every /api/v1/admin call (auth.js), tells MADP which contract version this
// admin API speaks and which capabilities it serves, so MADP only calls those. It holds no personal data.
// The read and sync routes (questions, changes feeds) are declared by the T2O backend that serves them.
export const CONTRACT = "madp-panel-api";
export const CONTRACT_VERSION = "1.0.0";

// One entry per group of routes in routes.js.
export const CAPABILITIES = [
    "contract.discovery",
    "admin.members",
    "admin.members.actions",
    "admin.members.engagement",
    "admin.members.duplicates",
    "admin.members.archive",
    "admin.question_bank",
    "admin.profiles",
    "admin.segments",
    "admin.audiences",
    "admin.surveys",
    "admin.points",
    "admin.quality",
    "admin.experts",
    "admin.tickets",
    "admin.messages",
    "admin.help",
    "admin.content",
    "admin.switches",
    "admin.reminders",
    "admin.prize_machines",
    "admin.reports",
    "admin.rewards",
    "admin.draws",
    "admin.offers",
    "admin.engagement",
    "admin.teens",
    "admin.data_requests"
];

/** The discovery answer for the signed brand (req.adminOrigin, already checked against MADP_ADMIN_API_ORIGINS). */
export function discoveryFor(origin, env = process.env) {
    return {
        contract: CONTRACT,
        version: CONTRACT_VERSION,
        implementation: { name: "panel-admin-api", version: env.GIT_SHA || "unknown" },
        brands: [{ origin: String(origin || "").toLowerCase() }],
        capabilities: [...CAPABILITIES]
    };
}
