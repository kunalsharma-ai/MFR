// What each brand looks like in a member message: name, logo, colours, support address and legal links. All three
// brands share this backend, so the brand comes from the member's origin. Logos are the square brand marks in
// mailer/assets/v7/brand (published with the other mailer assets); MAIL_LOGO_T2O / _MFR / _MHO override the URL.
const ASSETS = "https://www.frequentresearch.com/mailer/v7/brand";
const LEGAL = "Frequent Research Fieldwork Solutions Private Limited, 70/1/2 Mangolpur Kalan, First Floor, West Enclave, Pitampura, Delhi 110085, India";

export const BRANDS = {
    t2o: {
        code: "t2o", name: "Turn2Opinion", match: /turn2opinion/i,
        logo: () => process.env.MAIL_LOGO_T2O || `${ASSETS}/t2o-mark.png`,
        primary: "#4f5bd5", light: "#60a5fa", soft: "#eef2ff", ink: "#1e1b4b",
        support: "support@turn2opinion.com", privacy: "https://www.turn2opinion.com/privacy/",
    },
    mfr: {
        code: "mfr", name: "MyFrequentRewards", match: /myfrequentrewards/i,
        logo: () => process.env.MAIL_LOGO_MFR || `${ASSETS}/mfr-mark.png`,
        primary: "#f97316", light: "#fdba74", soft: "#fff4eb", ink: "#0b1e5b",
        support: "support@myfrequentrewards.com", privacy: "https://www.myfrequentrewards.com/privacy",
    },
    mho: {
        code: "mho", name: "MyHealthOpinions", match: /myhealthopinions/i,
        logo: () => process.env.MAIL_LOGO_MHO || `${ASSETS}/mho-mark.png`,
        primary: "#0d9488", light: "#5eead4", soft: "#ecfdf9", ink: "#123b3a",
        support: "support@myhealthopinions.com", privacy: "https://www.myhealthopinions.com/privacy/",
    },
};

/** The brand for an origin (host name). Anything else (local, preview) looks like MyFrequentRewards. */
export function brandOf(origin) {
    const b = Object.values(BRANDS).find((x) => x.match.test(String(origin || ""))) || BRANDS.mfr;
    return { code: b.code, name: b.name, logo: b.logo(), primary: b.primary, light: b.light, soft: b.soft, ink: b.ink, support: b.support, privacy: b.privacy, legal: LEGAL };
}
