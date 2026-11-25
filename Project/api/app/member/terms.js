// What a member has agreed to, for the Terms section of Settings (GET /api/v1/me/terms).
// Before Nov 2026 nothing showed this: the box ticked at sign-up was never sent to the server, the consent page saved
// only the term names (no date), and the Teen consent records were not readable by the teen. The QA check found the
// section empty / "not checked" after the terms had been accepted.
//
// Consumer / Professional: the sign-up box (termsAcceptance.signupAt) and each term of the member's category that
// they accepted on the consent page (user.terms, dated termsAcceptance.acceptedAt).
// Teen: the teen's own agreement at registration and the parent or guardian's consent (TeenConsent records).
import { User, Category, TeenRegistration, TeenConsent } from "../model/index.js";

const TEEN_CATEGORY = "b2c-minor";
const iso = (d) => (d ? new Date(d).toISOString() : null);
const plain = (html = "") => String(html).replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const titleOf = (t) => {
    const text = plain(t.body);
    return text.length > 140 ? `${text.slice(0, 137)}…` : text || t.name;
};

export async function termsFor(userId, origin) {
    const u = await User.findOne({ _id: userId, origin }).select("category terms termsAcceptance parent createdAt").lean();
    if (!u) return { items: [] };
    const items = [];
    if (u.category === TEEN_CATEGORY) {
        const reg = await TeenRegistration.findOne({ teen: u._id, origin }).select("_id reference").lean();
        const records = reg ? await TeenConsent.find({ registration: reg._id }).sort({ acceptedAt: 1 }).lean() : [];
        const teen = records.filter((r) => r.party === "teen").pop();
        const guardian = records.filter((r) => r.party === "guardian").pop();
        items.push({
            id: "teen-terms", kind: "teen", title: "Teen Research Terms (you agreed at registration)",
            accepted: Boolean(teen && teen.statements.filter((s) => s.required).every((s) => s.accepted)),
            at: iso(teen?.acceptedAt), version: teen?.version || null, href: "/teen-terms",
            statements: (teen?.statements || []).map((s) => ({ id: s.id, text: s.text, required: Boolean(s.required), accepted: Boolean(s.accepted) })),
        });
        items.push({
            id: "parent-consent", kind: "guardian", title: "Parental consent (your parent or guardian)",
            accepted: Boolean(guardian) || u.parent?.consent === true,
            at: iso(guardian?.acceptedAt), version: guardian?.version || null, href: "/teen-terms",
        });
        return { items, reference: reg?.reference || null };
    }
    const accepted = Array.isArray(u.terms) ? u.terms.map((t) => String(t).toLowerCase()) : [];
    const ta = u.termsAcceptance || {};
    items.push({
        id: "signup", kind: "signup", title: "Terms of Use and Privacy Policy (ticked at sign-up)",
        // members who joined before the sign-up box was recorded: the consent page accepted the full terms anyway
        accepted: Boolean(ta.signupAt) || accepted.length > 0,
        at: iso(ta.signupAt), href: "/terms",
    });
    const cat = await Category.findOne({ name: String(u.category || "").toLowerCase() }).select("terms").lean();
    const catTerms = cat?.terms || [];
    for (const t of catTerms) {
        items.push({
            id: t.name, kind: "member", title: titleOf(t), required: Boolean(t.isRequired),
            accepted: accepted.includes(t.name), at: accepted.includes(t.name) ? iso(ta.acceptedAt) : null,
        });
    }
    // accepted names the category no longer lists (renamed terms) still show, so nothing accepted is hidden
    for (const name of accepted.filter((n) => !catTerms.some((t) => t.name === n))) {
        items.push({ id: name, kind: "member", title: name.replace(/[-_]+/g, " "), required: false, accepted: true, at: iso(ta.acceptedAt) });
    }
    return { items };
}
