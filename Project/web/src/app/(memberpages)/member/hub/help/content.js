// Help centre content (English source; the portal's page translator translates it like the rest of the member area).
//
// Every answer here describes how the member area works in the code today. Nothing here sets a policy.
//   - `review: true`  marks copy taken from the existing public FAQ (src/data/data.json) that states a time or a policy.
//                     It is shown to members as it is live today, and is listed in HELP-REVIEW.md for Kunal to confirm.
//   - `types`         limits an entry to some member types: "consumer" | "professional" | "teen". Missing = everyone.
//   - `feature`       shows an entry only when that feature exists on the server (see useHelpFeatures in data.js).
//                     New engagement features add their guides and FAQs here with their own feature key.
//   - answers         are a list of blocks: a string is a paragraph, { ul: [...] } a bullet list, { ol: [...] } steps,
//                     { note: "..." } a highlighted tip. A function block receives ctx (live values, see HelpCentre).
//
// Teen entries use short, friendly sentences, never show money values, and always point to the parent or guardian.

export const TOPICS = [
  { id: "start", icon: "rocket", title: "Getting started", blurb: "Your dashboard, the header and finding your way around.", sec: "dashboard", c1: "#ff6a13", c2: "#ffc233" },
  { id: "profiles", icon: "profile", title: "Profiles", blurb: "Complete your profiles to unlock surveys that fit you.", sec: "profile", href: "/member/profiles", c1: "#2f6bff", c2: "#22c1ee" },
  { id: "surveys", icon: "surveys", title: "Surveys", blurb: "Finding, taking and finishing surveys.", sec: "surveys", href: "/member/surveys", c1: "#10b981", c2: "#22c1ee" },
  { id: "rewards", icon: "rewards", title: "Points & rewards", blurb: "How points work, your balance and the payout milestone.", blurbTeen: "How points work, your balance and your level.", sec: "rewards", href: "/member/rewards", c1: "#e09b00", c2: "#ff6a13" },
  { id: "quality", icon: "quality", title: "Quality Score", blurb: "What your score means and how to raise it.", sec: "quality", href: "/member/quality", c1: "#0f9f8a", c2: "#34d399" },
  { id: "activity", icon: "activity", title: "Activity", blurb: "Your timeline of everything you have earned.", sec: "activity", href: "/member/activity", c1: "#0ea5e9", c2: "#6366f1" },
  { id: "referrals", icon: "referrals", title: "Referrals", blurb: "Invite friends and follow each invitation.", sec: "referrals", href: "/member/referrals", c1: "#8b5cf6", c2: "#ec4899" },
  { id: "account", icon: "account", title: "My Account", blurb: "Your details, photo, contacts and account requests.", sec: "account", href: "/member/myaccount", c1: "#4f46e5", c2: "#0ea5e9" },
  { id: "settings", icon: "settings", title: "Settings & security", blurb: "Theme, sound, language, notifications and password.", sec: "settings", href: "/member/settings", c1: "#475569", c2: "#6366f1" },
  { id: "pro", icon: "briefcase", title: "For professionals", blurb: "Your work profile, expert studies and performance view.", types: ["professional"], c1: "#0b1e5b", c2: "#2f6bff" },
  { id: "teen", icon: "shield", title: "Teen Zone & your guardian", blurb: "Staying safe, levels and what your parent or guardian agreed to.", types: ["teen"], c1: "#7c4dff", c2: "#ff5fa2" },
  { id: "support", icon: "support", title: "Contact & queries", blurb: "Raise a query and follow our replies.", c1: "#ec4899", c2: "#f97316" },
];

// which help topic belongs to each hub section (the header help button opens it)
export const SECTION_TOPIC = {
  dashboard: "start", profile: "profiles", surveys: "surveys", rewards: "rewards", quality: "quality", activity: "activity",
  referrals: "referrals", account: "account", settings: "settings", support: "support", help: "start",
};

/* ------------------------------------------------------------------------------------------------------------------ */
/* Step-by-step guides                                                                                                 */
/* ------------------------------------------------------------------------------------------------------------------ */
export const GUIDES = [
  {
    id: "g-tour", topic: "start", icon: "dashboard", title: "Take a tour of your member area", mins: 2, types: ["consumer", "professional"],
    steps: [
      { t: "Start on your dashboard", d: "It shows what you can do today, what you have earned and how close your next milestone is." },
      { t: "Read the header", d: "Your points balance is top right; tap it to open Rewards. The ring next to it is your Quality Score. The bell shows notifications." },
      { t: "Make it yours", d: "Use the globe for language, the sun or moon for Light, Dark or Night theme, and the speaker to turn sounds on or off." },
      { t: "Find every section", d: "On a computer the menu is on the left. On a phone use the bar at the bottom, and tap More for the full menu." },
      { t: "Get help anywhere", d: "Tap Help (the question mark) on any page to open the tips for that page, or this Help centre." },
    ],
    cta: { label: "Open my dashboard", href: "/member/dashboard" },
  },
  {
    id: "g-teen-tour", topic: "start", icon: "rocket", title: "Your Teen Zone in 5 steps", mins: 2, types: ["teen"],
    steps: [
      { t: "Check your level", d: "Your dashboard shows your level and how many points you need for the next one." },
      { t: "Power up your profile", d: "Finish your profile topics first. They help us send you surveys made for you." },
      { t: "Play today's surveys", d: "Open Surveys and pick one. You can skip any question or stop at any time." },
      { t: "Collect badges", d: "Badges unlock as you take part: your first survey, ten surveys, a complete profile and more." },
      { t: "Ask for help", d: "If anything feels wrong or confusing, talk to your parent or guardian, or send us a query from Help." },
    ],
    cta: { label: "Open my Teen Zone", href: "/member/dashboard" },
  },
  {
    id: "g-profile", topic: "profiles", icon: "profile", title: "Complete your profile", mins: 5,
    steps: [
      { t: "Open Profile", d: "Choose Profile in the menu. Your core profiles (Basic, Educational, Professional and Financial) are listed first." },
      { t: "Pick the next topic", d: "Your dashboard's Profile journey card also shows which topic is next." },
      { t: "Answer the questions", d: "Answer honestly. Your progress is shown as a percentage on each topic." },
      { t: "Collect your points", d: "A profile pays its points once, when you finish it. The points are shown on the topic." },
      { t: "Explore more topics", d: "When your core profile is complete, more topics open, matched to the interests you chose." },
    ],
    cta: { label: "Go to my profiles", href: "/member/profiles" },
  },
  {
    id: "g-survey", topic: "surveys", icon: "surveys", title: "Take your first survey", mins: 3,
    steps: [
      { t: "Open Surveys", d: "All New shows every survey for you. High Reward and Short filter them by the points they pay." },
      { t: "Check the points", d: "Each survey shows its reward before you start." },
      { t: "Start and finish", d: "Take the survey in one go if you can. Leaving surveys unfinished lowers your Quality Score." },
      { t: "See your points land", d: "Completed surveys appear in your Reward history and Activity timeline." },
    ],
    cta: { label: "See my surveys", href: "/member/surveys" },
  },
  {
    id: "g-rewards", topic: "rewards", icon: "rewards", title: "Track your points to the payout milestone", mins: 2, types: ["consumer", "professional"],
    steps: [
      { t: "Open Rewards", d: "Tap your points in the header, or choose Rewards in the menu." },
      { t: "Read the milestone ladder", d: "It shows the steps on the way to your payout milestone and how many points are left." },
      { t: "Check your history", d: "Reward history lists every survey and profile that paid you, with the date." },
      { t: "Reach the milestone", d: "Once you reach the milestone, our accounts team handles your payout." },
    ],
    cta: { label: "Open my rewards", href: "/member/rewards" },
  },
  {
    id: "g-teen-rewards", topic: "rewards", icon: "trophy", title: "Watch your points and level grow", mins: 2, types: ["teen"],
    steps: [
      { t: "See your points", d: "Your points are always at the top of the screen." },
      { t: "Open Rewards", d: "Reward history shows each survey and profile you finished." },
      { t: "Level up", d: "Your dashboard shows how many points you need for your next level." },
    ],
    cta: { label: "Open my rewards", href: "/member/rewards" },
  },
  {
    id: "g-redeem", topic: "rewards", icon: "wallet", title: "Pick a reward and set a goal", mins: 2, types: ["consumer", "professional"], feature: "rewardsShop",
    steps: [
      { t: "Open Rewards", d: "Scroll to the rewards catalogue. Rewards you can already afford carry a badge." },
      { t: "Set a reward goal", d: "Choose the reward you are saving for. A progress bar shows how close you are." },
      { t: "Watch for bonus offers", d: "When a limited-time bonus offer is running, a banner shows it at the top of Rewards." },
      { t: "Request your reward", d: "When redeeming is open and you have enough ready points, request the reward. If a request is rejected or cancelled, your points come back." },
    ],
    cta: { label: "Open the catalogue", href: "/member/rewards" },
  },
  {
    id: "g-teen-learning", topic: "rewards", icon: "book", title: "Choose a learning reward", mins: 2, types: ["teen"], feature: "rewardsShop",
    steps: [
      { t: "Open Rewards", d: "Learning rewards are listed with the points they need." },
      { t: "Set a goal", d: "Pick the reward you want and watch your progress bar grow." },
      { t: "Ask for it", d: "When requests are open, send a request. Your parent or guardian has to say OK first." },
      { t: "Not this time?", d: "If a request is turned down or cancelled, your points come back." },
    ],
    cta: { label: "Open my rewards", href: "/member/rewards" },
  },
  {
    id: "g-today", topic: "start", icon: "calendar", title: "Use your daily Today strip", mins: 2, feature: "today",
    steps: [
      { t: "Answer the daily poll", d: "One quick question a day on your dashboard. You see the results after you answer." },
      { t: "Follow your challenges", d: "Monthly challenges track your real activity and show your progress." },
      { t: "Read the stories", d: "\"Your opinion mattered\" stories show what came out of research members took part in." },
    ],
    cta: { label: "Open my dashboard", href: "/member/dashboard" },
  },
  {
    id: "g-quality", topic: "quality", icon: "quality", title: "Raise your Quality Score", mins: 2,
    steps: [
      { t: "Open Quality Score", d: "Tap the ring in the header or choose Quality Score in the menu." },
      { t: "Read your factors", d: "Profiles completed, surveys completed, surveys left unfinished, screen-outs and email verification all count." },
      { t: "Finish your profiles", d: "Each completed profile adds to your score." },
      { t: "Finish what you start", d: "Complete the surveys you open and read every question carefully." },
    ],
    cta: { label: "See my Quality Score", href: "/member/quality" },
  },
  {
    id: "g-activity-export", topic: "activity", icon: "activity", title: "Filter and export your points history", mins: 2, feature: "engage1",
    steps: [
      { t: "Open Activity", d: "Your balances show points ready to use, pending, on hold and earned in total." },
      { t: "Filter the ledger", d: "Filter by type, status, date range or name to find any entry." },
      { t: "Check when points clear", d: "\"When your points clear\" lists the dates pending points become ready, and explains any entry on hold." },
      { t: "Export as CSV", d: "Download the filtered list as a CSV file to keep your own record." },
    ],
    cta: { label: "Open my activity", href: "/member/activity" },
  },
  {
    id: "g-refer", topic: "referrals", icon: "referrals", title: "Invite friends", mins: 2, types: ["consumer", "professional"],
    steps: [
      { t: "Open Referrals", d: "Choose Referrals in the menu." },
      { t: "Share your link", d: "Copy your personal referral link or use Share to send it in any app." },
      { t: "Or invite by email", d: "Type one or more email addresses, separated by commas, and press Send invitations." },
      { t: "Follow each invitation", d: "See who you invited, who joined with your link and who verified their email." },
    ],
    cta: { label: "Open referrals", href: "/member/referrals" },
  },
  {
    id: "g-tiers", topic: "quality", icon: "trophy", title: "Climb the quality tiers", mins: 2, feature: "qualityTiers",
    steps: [
      { t: "Find your tier", d: "Quality Score shows your tier (Bronze, Silver, Gold or Platinum) and the score bands for each." },
      { t: "See what the next tier opens", d: "Some surveys need a minimum score. The page shows how many open surveys are waiting for a higher tier." },
      { t: "Follow the tips", d: "Your score breakdown comes with tips on what to do next." },
      { t: "Track your trend", d: "Your monthly trend builds up from your first visit, and you'll see a message when your score goes up." },
    ],
    cta: { label: "See my tier", href: "/member/quality" },
  },
  {
    id: "g-share", topic: "referrals", icon: "share", title: "Share your invite in one tap", mins: 2, types: ["consumer", "professional"], feature: "referralsLive",
    steps: [
      { t: "Open Referrals", d: "Your link and the share buttons are at the top." },
      { t: "Pick where to share", d: "WhatsApp, Instagram, email or an invite card. For Instagram we save the invite card and copy your link, because Instagram has no web share link." },
      { t: "Follow each friend", d: "See whether each friend has joined, verified their email and finished a first survey." },
    ],
    cta: { label: "Open referrals", href: "/member/referrals" },
  },
  {
    id: "g-photo", topic: "account", icon: "camera", title: "Add or change your profile photo", mins: 1,
    steps: [
      { t: "Open My Account", d: "Choose My Account in the menu or from your avatar at the top right." },
      { t: "Upload a photo", d: "Pick an image file under 5 MB. You will see a preview first." },
      { t: "Use this photo", d: "Press Use this photo to save it. You can replace or remove it at any time." },
    ],
    cta: { label: "Open My Account", href: "/member/myaccount" },
  },
  {
    id: "g-password", topic: "settings", icon: "lock", title: "Change your password", mins: 1,
    steps: [
      { t: "Open Settings", d: "Choose Settings in the menu, then Security." },
      { t: "Enter your current password", d: "Then type your new password twice. Use at least 8 characters." },
      { t: "Save", d: "Press Change password. You will see a confirmation when it is saved." },
    ],
    cta: { label: "Open Security settings", href: "/member/settings#st-security" },
  },
  {
    id: "g-look", topic: "settings", icon: "palette", title: "Change the theme, colours and sound", mins: 1,
    steps: [
      { t: "Open Settings", d: "Appearance is the first section." },
      { t: "Pick a theme", d: "Light is bright and clear, Dark is deep and rich, Night is warm and low glare." },
      { t: "Pick a palette", d: "Choose a colour palette, or Custom to pick your own primary colour." },
      { t: "Set your sound", d: "Turn sound effects and notification sounds on or off, and play a sample." },
    ],
    cta: { label: "Open Appearance", href: "/member/settings#st-appearance" },
  },
  {
    id: "g-notify", topic: "settings", icon: "bell", title: "Choose how we tell you about surveys", mins: 1,
    steps: [
      { t: "Open Settings", d: "Go to the Notifications section." },
      { t: "Pick your channels", d: "Choose e-mail, SMS, phone call, dashboard or WhatsApp." },
      { t: "Save", d: "Your choice is saved to your account, so it applies on every device." },
    ],
    cta: { label: "Open Notifications", href: "/member/settings#st-notifications" },
  },
  {
    id: "g-pro", topic: "pro", icon: "briefcase", title: "Get the most from expert studies", mins: 3, types: ["professional"],
    steps: [
      { t: "Complete your work profile", d: "Your Professional profile tells us your industry and role, which decides the expert studies you see." },
      { t: "Check your qualification status", d: "Your dashboard shows core profiles, work profile and email verification." },
      { t: "Open expert surveys", d: "Start from Open expert surveys on your dashboard." },
      { t: "Read your performance", d: "Points earned, completion rate, quality score and studies started are on your dashboard, with your monthly earning trend." },
    ],
    cta: { label: "Open my dashboard", href: "/member/dashboard" },
  },
  {
    id: "g-teen-create", topic: "teen", icon: "spark", title: "Try a creative task", mins: 2, types: ["teen"], feature: "teenTasks",
    steps: [
      { t: "Open your creative tasks", d: "Design votes, quick polls and idea contests are on your Teen Zone." },
      { t: "Vote or answer", d: "Design votes and polls pay points once, and you see the results after you vote." },
      { t: "Share an idea", d: "In an idea contest, write your idea without links, usernames or phone numbers. A moderator checks it first." },
      { t: "Collect your points", d: "An idea earns points once it is approved, and it is shown to others without your name. Every task counts as a streak day." },
    ],
    cta: { label: "Open my Teen Zone", href: "/member/dashboard" },
  },
  {
    id: "g-guardian-view", topic: "teen", icon: "mail", title: "Show your guardian your activity", mins: 1, types: ["teen"], feature: "teenProgress",
    steps: [
      { t: "Find the guardian option", d: "Choose \"Send my parent or guardian a view of my activity\"." },
      { t: "We email them a link", d: "It goes to the parent or guardian from your registration. The link is read-only and works for 90 days." },
      { t: "Need a fresh one?", d: "Sending again makes a new link, and the old one stops working." },
    ],
    cta: { label: "Open my Teen Zone", href: "/member/dashboard" },
  },
  {
    id: "g-pro-expert", topic: "pro", icon: "id", title: "Get your verified expert badge", mins: 3, types: ["professional"], feature: "proExpertise",
    steps: [
      { t: "Request the badge", d: "Send your LinkedIn profile link, your work email, or both. Personal email addresses (like Gmail) aren't accepted." },
      { t: "Our team checks it", d: "The check is done by hand by our team." },
      { t: "Watch your expertise score", d: "Your expertise score (0–100) takes in your profiles, Professional surveys finished, your quality score and the verified badge." },
    ],
    cta: { label: "Open my dashboard", href: "/member/dashboard" },
  },
  {
    id: "g-teen-safe", topic: "teen", icon: "shield", title: "Stay safe and in control", mins: 2, types: ["teen"],
    steps: [
      { t: "Keep your password secret", d: "Never share it, not even with friends. Nobody from MyFrequentRewards will ask for it." },
      { t: "Skip what you don't want to answer", d: "You can skip any question or stop a survey at any time." },
      { t: "Keep personal details out of answers", d: "Don't type your address, phone number or passwords into open answers." },
      { t: "Talk to your guardian", d: "If something worries you, tell your parent or guardian, and send us a query from Help." },
    ],
    cta: { label: "Raise a query", href: "#raise" },
  },
  {
    id: "g-query", topic: "support", icon: "support", title: "Raise a query and follow our reply", mins: 2,
    steps: [
      { t: "Pick a topic", d: "In \"Still need help?\" choose the topic closest to your question, or Other." },
      { t: "Describe it", d: "Write a short subject and the details. A screenshot helps us a lot." },
      { t: "Send", d: "You get a ticket number and a confirmation e-mail." },
      { t: "Follow the conversation", d: "Open My queries to read replies. We also e-mail you when we reply." },
    ],
    cta: { label: "Raise a query", href: "#raise" },
  },
];

/* ------------------------------------------------------------------------------------------------------------------ */
/* FAQs                                                                                                                */
/* ------------------------------------------------------------------------------------------------------------------ */
export const FAQS = [
  // ---- getting started
  {
    id: "what-is", topic: "start", q: "What is MyFrequentRewards?",
    kw: "about panel frequent research join free",
    a: [
      "MyFrequentRewards is the research panel of Frequent Research. You share your opinions in surveys and earn reward points for taking part.",
      "Membership is free. You will never be asked to pay to join or to take part in surveys.",
    ],
  },
  {
    id: "types", topic: "start", q: "What are Consumer, Professional and Teen members?",
    kw: "member type category b2b b2c teen consumer professional",
    a: [
      { ul: [
        "Consumer members share their views as shoppers and everyday users.",
        "Professional members share their expertise from work, in studies matched to their industry and role.",
        "Teen members are 13 to 17 years old and take part with their parent's or guardian's permission.",
      ] },
      (ctx) => `You are a ${ctx.typeLabel}. Your type is shown on your account menu, and your dashboard is designed for it.`,
    ],
  },
  {
    id: "dashboard", topic: "start", q: "What does my dashboard show?",
    kw: "home overview today earned milestone",
    a: [
      (ctx) => ctx.type === "professional"
        ? "Your performance view: points earned, completion rate, quality score and studies started, your monthly earning trend, a breakdown of every study you started, your qualification status and the studies waiting for you."
        : ctx.type === "teen"
          ? "Your Teen Zone: your level and points to the next level, your progress, your badges, your profile journey and today's surveys."
          : "What you can do today, what you have earned, your next reward, your profile journey, the surveys matched to you, your achievements and recent activity.",
      "Every number comes from your real account. If something can't load, you'll see a \"Try again\" button instead of a guess.",
    ],
  },
  {
    id: "phone", topic: "start", q: "Can I use MyFrequentRewards on my phone?",
    kw: "mobile app phone tablet bottom bar menu install",
    a: [
      "Yes. The member area adapts to phones and tablets. On a phone, the bar at the bottom takes you to Dashboard, Surveys, Rewards, Profile and Help, and More opens the full menu.",
    ],
  },
  {
    id: "verify", topic: "start", q: "Why do I need to verify my email address?",
    kw: "verification email link confirm spam",
    a: [
      "We confirm every member's email address before they use the member area. Email verification is also one of your Quality Score factors.",
      { note: "Can't find the email? Check your spam or promotions folder. If it is not there, raise a query and we'll help." },
    ],
  },
  {
    id: "language", topic: "start", q: "Can I use the member area in my language?",
    kw: "language translate hindi spanish",
    a: ["Yes. Tap the globe in the header, or open Settings and choose Language. The page is translated as you browse."],
  },

  // ---- profiles
  {
    id: "why-profile", topic: "profiles", q: "Why should I complete my profile?",
    kw: "profile matter match surveys invitations",
    a: [
      "Your profile decides which surveys reach you. The more complete it is, the better we can match you to surveys that fit, and the fewer times you are screened out.",
      "Each finished profile also pays its reward points once and adds to your Quality Score.",
    ],
  },
  {
    id: "core", topic: "profiles", q: "What are core profiles?",
    kw: "basic educational professional financial core",
    a: [
      "Your core profiles are Basic, Educational, Professional and Financial. They are listed first and your dashboard tracks them in the Profile journey.",
      "When your core profile is complete, more profile topics open, matched to the interests you picked when you joined.",
    ],
  },
  {
    id: "profile-points", topic: "profiles", q: "How many points does a profile pay?",
    kw: "profile points reward once",
    a: [
      "Each profile shows its points on its card. A profile pays once, when you finish it, and the payment is checked on our server so it can't be paid twice.",
    ],
  },
  {
    id: "profile-edit", topic: "profiles", q: "Can I change my profile answers?", review: true,
    kw: "edit change answers date of birth gender",
    a: [
      "You can keep most of your profile up to date. Keeping it current increases your chances of qualifying for more surveys.",
      "Some core details, such as date of birth, age and gender, may not be editable, for data accuracy.",
    ],
  },
  {
    id: "why-personal", topic: "profiles", q: "Why do you ask about age, income and personal details?",
    kw: "personal income age privacy why",
    types: ["consumer", "professional"],
    a: [
      "Many surveys need people from specific groups. Accurate answers match you with relevant surveys, raise your qualification rate and improve your earning opportunities.",
      "Your personal data is handled securely. See the Privacy policy (Settings → Privacy) for how we use it.",
    ],
  },
  {
    id: "teen-profile", topic: "profiles", q: "Why does my profile ask questions about me?", types: ["teen"],
    kw: "teen profile questions why",
    a: [
      "Your answers help us send you surveys made for people like you. You can skip a question you don't want to answer.",
      "Never type passwords, your address or phone number into an open answer.",
    ],
  },

  // ---- surveys
  {
    id: "find-surveys", topic: "surveys", q: "Where do I find surveys?",
    kw: "find surveys available new take start",
    a: [
      "Open Surveys in the menu. All New shows every survey available to you. High Reward shows surveys paying more than 50 points, and Short shows those paying 50 points or fewer.",
      "Your dashboard also shows how many surveys are waiting: Your surveys are handpicked for your profile, and Partner surveys come from our research partners.",
    ],
  },
  {
    id: "no-surveys", topic: "surveys", q: "Why don't I see any surveys?",
    kw: "no surveys empty none available",
    a: [
      "Surveys are matched to your profile, so there may be none for you at a given moment. We'll notify you when a new survey matches.",
      { ul: ["Complete your remaining profiles.", "Check your notification choices in Settings.", "Come back regularly: new surveys open all the time."] },
    ],
  },
  {
    id: "survey-points", topic: "surveys", q: "How many points will I get for a survey?",
    kw: "how much points survey reward length",
    a: ["Points depend on the survey's length and complexity. The reward is shown on the survey before you start."],
  },
  {
    id: "closed", topic: "surveys", q: "Why did a survey close after I clicked it?",
    kw: "closed quota full survey ended",
    a: ["Surveys go to many members and close once they have enough people. \"Survey closed\" means the quota was already filled. Keep an eye on your dashboard for new ones."],
  },
  {
    id: "screened", topic: "surveys", q: "What does \"screened out\" mean?",
    kw: "screened out disqualified not qualify terminated",
    a: [
      "Some surveys look for a specific group. The first questions check whether you fit, and if you don't, the survey ends early. This is called a screen-out.",
      "Screen-outs are counted in your Quality Score factors. Keeping your profile accurate means you are invited to surveys you are more likely to fit.",
    ],
  },
  {
    id: "unfinished", topic: "surveys", q: "What happens if I leave a survey unfinished?",
    kw: "leave quit unfinished dropout abandon",
    a: ["An unfinished survey doesn't pay points, and surveys left unfinished lower your Quality Score. Try to start a survey only when you have the time shown."],
  },
  {
    id: "teen-skip", topic: "surveys", q: "Can I skip a question or stop?", types: ["teen"],
    kw: "skip stop question teen",
    a: ["Yes. You can skip any question or stop at any time. A survey you stop early doesn't pay points."],
  },
  {
    id: "repeat-q", topic: "surveys", q: "Why are some questions repeated in different surveys?",
    kw: "repeat same questions again",
    a: ["Questions like age, location or household are asked again to check the answers are accurate, to confirm you qualify and to meet each study's requirements."],
  },
  {
    id: "tech", topic: "surveys", q: "A survey isn't working. What can I do?",
    kw: "error problem bug technical not loading broken",
    a: [
      { ol: ["Wait a few minutes and try again.", "Refresh the page or clear your browser cache.", "Try a different browser or device."] },
      { note: "Still stuck? Raise a query under Surveys and add a screenshot of the error." },
    ],
  },
  {
    id: "honest", topic: "surveys", q: "What if my answers are inconsistent?", review: true,
    kw: "inconsistent false fake answers suspension",
    a: [
      "Inconsistent or false answers can lead to survey disqualification, an account review, or suspension. Please read each question and answer honestly.",
    ],
  },

  // ---- rewards
  {
    id: "balance", topic: "rewards", q: "Where can I see my points?",
    kw: "points balance total where",
    a: ["Your balance is always in the header. Tap it to open Rewards, where you can see your balance, your milestone and your full reward history."],
  },
  {
    id: "milestone", topic: "rewards", q: "What is the payout milestone?", types: ["consumer", "professional"],
    kw: "milestone threshold minimum redeem cash out payout how much worth value",
    a: [
      (ctx) => ctx.threshold
        ? `The payout milestone is ${ctx.fmt(ctx.threshold)} points${ctx.money(ctx.threshold) ? ` (about ${ctx.money(ctx.threshold)})` : ""}. Your Rewards page shows how many points you still need and the steps on the way.`
        : "Your Rewards page shows the payout milestone, how many points you still need and the steps on the way.",
      (ctx) => ctx.rate ? `Points convert at ${ctx.fmt(1 / ctx.rate)} points = ${ctx.money(1 / ctx.rate)}.` : null,
    ],
  },
  {
    id: "payout", topic: "rewards", q: "How do I receive my rewards?", types: ["consumer", "professional"], review: true,
    kw: "payout paypal amazon gift card bank upi receive redeem withdraw cash",
    a: [
      "Once you reach the payout milestone, our accounts team handles your payout.",
      "Reward options may include PayPal, gift cards, bank transfer and UPI, depending on your country. Please make sure your payment details in My Account are correct, to avoid delays.",
    ],
  },
  {
    id: "payout-time", topic: "rewards", q: "How long does a payout take?", types: ["consumer", "professional"], review: true,
    kw: "how long time processing payout weeks days",
    a: ["After you request a payout, our team verifies your account and survey participation, and the accounts department processes it. This can take 2–3 weeks, depending on volume and verification."],
  },
  {
    id: "missing-points", topic: "rewards", q: "I finished a survey but my points didn't appear.",
    kw: "missing points not credited not added not showing",
    a: [
      "Points appear when the survey reports that you completed it. Refresh the page and check Rewards → Reward history and your Activity timeline.",
      "If a survey ended with a screen-out or closed, it doesn't pay points.",
      { note: "Still missing? Raise a query under Points & rewards with the survey name and the date you took it." },
    ],
  },
  {
    id: "ways", topic: "rewards", q: "What are the ways to earn points?",
    kw: "earn more points ways how",
    a: [
      { ul: ["Complete a profile (each pays once).", "Finish a survey.", "Invite friends."] },
      (ctx) => ctx.features.today ? "Answer the daily poll and complete monthly challenges on your dashboard." : null,
    ],
  },
  {
    id: "teen-points", topic: "rewards", q: "What are my points for?", types: ["teen"],
    kw: "teen points level badges",
    a: [
      "Points show how much you have taken part. They raise your level on your dashboard and help unlock badges.",
    ],
  },
  {
    id: "pending", topic: "rewards", q: "What do \"pending\" and \"on hold\" points mean?", feature: "engage1",
    kw: "pending hold cleared ready spendable",
    a: [
      "Ready points can be used. Pending points are new and become ready on the clear date shown in Activity → \"When your points clear\".",
      "On hold means our quality team is checking an entry. You'll see a note explaining why, and the points become ready once it is released.",
    ],
  },

  {
    id: "rw-catalogue", topic: "rewards", q: "Can I redeem my points for a reward?", types: ["consumer", "professional"], feature: "rewardsShop",
    kw: "redeem catalogue gift card reward shop exchange",
    a: [
      "The rewards catalogue on your Rewards page lists every reward with the points it needs, and marks the ones you can already afford.",
      (ctx) => ctx.rewardsOpen
        ? "Redeeming is open: when you have enough ready points, request the reward from the catalogue."
        : "Redeeming opens soon. Until then you can browse the catalogue and set a reward goal so you're ready.",
    ],
  },
  {
    id: "rw-goal", topic: "rewards", q: "What is a reward goal?", feature: "rewardsShop",
    kw: "goal saving target progress",
    a: ["Pick one reward from the catalogue as your goal. A progress bar on Rewards shows how many points you still need. You can change or clear your goal at any time."],
  },
  {
    id: "rw-back", topic: "rewards", q: "What happens to my points if a request is rejected or cancelled?", feature: "rewardsShop",
    kw: "rejected cancelled refund points back request",
    a: ["Your points come back to your balance."],
  },
  {
    id: "rw-offers", topic: "rewards", q: "What are bonus offers?", types: ["consumer", "professional"], feature: "rewardsShop",
    kw: "bonus offer promotion limited time",
    a: ["When our team runs a limited-time bonus offer, a banner on your Rewards page shows it and what it applies to."],
  },
  {
    id: "teen-redeem", topic: "teen", q: "Can I swap my points for something?", types: ["teen"], feature: "rewardsShop",
    kw: "teen redeem learning reward guardian ok",
    a: [
      "Yes, for learning rewards, which are shown in points. Every request needs your parent's or guardian's OK first.",
      (ctx) => ctx.rewardsOpen ? null : "Requests open soon. You can already pick a goal and watch your progress.",
      "If a request is turned down or cancelled, your points come back.",
    ],
  },
  {
    id: "poll", topic: "start", q: "What is the daily poll?", feature: "today",
    kw: "daily poll question today",
    a: [
      (ctx) => `One quick question a day, on your dashboard${ctx.pollPoints ? `, worth ${ctx.fmt(ctx.pollPoints)} points` : ""}. You see how other members answered after you reply.`,
      (ctx) => ctx.features.engage1 ? "Answering it also counts as a streak day." : null,
    ],
  },
  {
    id: "challenges", topic: "start", q: "How do monthly challenges work?", feature: "today",
    kw: "challenge monthly bonus goal",
    a: ["Each month has challenges, such as finishing a number of surveys. Your progress comes from your real activity, and each challenge's bonus is paid once when you complete it."],
  },
  {
    id: "stories", topic: "start", q: "What are \"Your opinion mattered\" stories?", feature: "today",
    kw: "stories opinion mattered results impact",
    a: ["Short stories written by our team about what came out of research that members took part in."],
  },
  // ---- quality
  {
    id: "q-what", topic: "quality", q: "What is my Quality Score?",
    kw: "quality score rating what",
    a: [
      "It shows how carefully and honestly you take part. Research partners rely on it when they choose who to invite.",
      (ctx) => ctx.quality ? `Your score right now is ${ctx.quality.score}${ctx.quality.scale ? ` out of ${ctx.quality.scale}` : ""}.` : null,
    ],
  },
  {
    id: "q-bands", topic: "quality", q: "What do Excellent, Good, Fair and Needs attention mean?",
    kw: "band level excellent good fair low",
    a: [
      { ul: ["Excellent: 90% of the scale or more.", "Good: 70% to 89%.", "Fair: 50% to 69%.", "Needs attention: below 50%."] },
    ],
  },
  {
    id: "q-improve", topic: "quality", q: "How do I improve my Quality Score?",
    kw: "improve raise increase quality",
    a: [{ ul: ["Complete your remaining profiles: each one adds to your score.", "Finish the surveys you start.", "Answer honestly and read each question.", "Verify your email address."] }],
  },
  {
    id: "q-tiers", topic: "quality", q: "What are Bronze, Silver, Gold and Platinum?", feature: "qualityTiers",
    kw: "tier bronze silver gold platinum level band",
    a: [
      "They are quality tiers based on your Quality Score. The Quality Score page shows your tier, the score bands for each tier, and how far you are from the next one.",
      "Some surveys need a minimum score, so a higher tier can open more surveys. The page shows how many open surveys are waiting for a higher tier.",
    ],
  },
  {
    id: "q-who", topic: "quality", q: "Who sets my Quality Score?", feature: "qualityTiers",
    kw: "who sets calculated formula change score",
    a: ["Our quality team sets it. The page shows the factors that count and tips to improve, and a message appears when your score has gone up since your last visit."],
  },
  {
    id: "q-history", topic: "quality", q: "Can I see how my score changed over time?",
    kw: "history chart trend score",
    a: [(ctx) => ctx.features.qualityTiers
      ? "Yes. The Quality Score page shows your score month by month, starting from your first visit after the trend was switched on. Earlier months aren't filled in."
      : "Not yet. We keep your current score only. A history view will appear on the Quality Score page once score changes are recorded."],
  },

  // ---- activity
  {
    id: "ac-what", topic: "activity", q: "What is the Activity timeline?",
    kw: "activity timeline history",
    a: ["Every reward you earned, newest first: each completed survey and profile, with its points and date."],
  },
  {
    id: "ac-export", topic: "activity", q: "Can I download my points history?", feature: "engage1",
    kw: "download export csv excel history",
    a: ["Yes. On Activity, filter the ledger by type, status, date or name, then export it as a CSV file."],
  },
  {
    id: "streak", topic: "activity", q: "How does my daily streak work?", feature: "engage1",
    kw: "streak daily days bonus",
    a: [
      "A streak day is a day on which you take part, for example by finishing a survey or a profile. Your Activity page shows your streak over the last four weeks and your next streak bonus.",
      (ctx) => ctx.streakBonuses?.length ? `Streak bonuses: ${ctx.streakBonuses.map((b) => `${ctx.fmt(b.points)} points at ${b.days} days`).join(", ")}.` : null,
    ],
  },

  // ---- referrals
  {
    id: "rf-how", topic: "referrals", q: "How do I invite friends?", types: ["consumer", "professional"],
    kw: "invite refer friend link share",
    a: ["Open Referrals. Copy or share your referral link, or type email addresses (separated by commas) and press Send invitations."],
  },
  {
    id: "rf-status", topic: "referrals", q: "How do I know if my friend joined?", types: ["consumer", "professional"],
    kw: "joined verified status friend",
    a: ["Referrals shows the invitations you sent, the people who joined with your link, and whether they verified their email. If an address already belongs to a member, we tell you when you send."],
  },
  {
    id: "rf-bonus", topic: "referrals", q: "Do I get points for referrals?",
    kw: "referral bonus points reward",
    a: [(ctx) => ctx.features.referralTiersOn
      ? "Yes. The Referrals page shows the referral tiers and the bonus for each. A friend counts once they finish their first survey, and each tier bonus is paid once."
      : ctx.type === "teen"
        ? "Referral bonuses aren't part of Teen membership. You can still see how each friend you invited is doing."
        : "Referral rewards are not switched on yet. We'll show them on the Referrals page when they start."],
  },
  {
    id: "rf-teen", topic: "referrals", q: "Can I invite my friends?", types: ["teen"],
    kw: "teen invite friend",
    a: ["Ask your parent or guardian first. Friends under 18 need their own parent's or guardian's YES before they can join."],
  },

  {
    id: "rf-count", topic: "referrals", q: "When does a friend count for my referral tier?", feature: "referralTiersOn",
    kw: "count tier friend first survey bonus when",
    a: ["Once they finish their first survey. Only first surveys from 1 December 2026 count, and each tier bonus is paid once."],
  },
  {
    id: "rf-live", topic: "referrals", q: "What do joined, verified and first survey mean?", feature: "referralsLive",
    kw: "status joined verified first survey friend",
    a: ["They are the steps each friend goes through: they joined with your link, verified their email, and finished their first survey. The Referrals page shows where each friend is."],
  },
  {
    id: "rf-instagram", topic: "referrals", q: "How do I share my invite on Instagram?", types: ["consumer", "professional"], feature: "referralsLive",
    kw: "instagram share story card",
    a: ["Tap Instagram on Referrals. We save your invite card and copy your link, so you can post the card and paste the link. Instagram has no web share link, so this is the way to do it."],
  },
  {
    id: "rf-board", topic: "referrals", q: "How does the referral leaderboard work?", feature: "leaderboard",
    kw: "leaderboard ranking top board opt in",
    a: ["It is opt-in. Turn on \"Show me on the leaderboard\" to appear; we show only your first name and initial."],
  },
  // ---- account
  {
    id: "ma-what", topic: "account", q: "What can I change in My Account?",
    kw: "account details personal information edit update",
    a: [
      "My Account shows your photo, membership status, your numbers, personal information, location, payment methods and social contacts.",
      "You can add or edit your alternate email and alternate mobile there, and add or change your profile photo.",
    ],
  },
  {
    id: "ma-email", topic: "account", q: "How do I change my email address?", review: true,
    kw: "change email address",
    a: ["For security, your sign-in email can't be changed from the member area. Raise a query under My Account and our team will help."],
  },
  {
    id: "ma-photo", topic: "account", q: "Why won't my photo upload?",
    kw: "photo picture avatar upload fail",
    a: ["Use an image file (JPG, PNG or WebP) smaller than 5 MB. If it still fails, try another image."],
  },
  {
    id: "ma-close", topic: "account", q: "How do I take a break or delete my account?", review: true,
    kw: "delete close cancel remove account break",
    a: [
      "Send a request to our support team: raise a query under My Account and say whether you want a break or a deletion. They will confirm it with you before anything happens.",
    ],
  },
  {
    id: "ma-guardian", topic: "account", q: "Where can I see my guardian's consent?", types: ["teen"],
    kw: "guardian consent parent record",
    a: ["My Account shows the Parent / guardian consent card: your guardian's name, the date, the consent version and its status."],
  },

  // ---- settings
  {
    id: "st-theme", topic: "settings", q: "How do I switch to dark mode?",
    kw: "dark mode night light theme colour palette",
    a: ["Tap the sun or moon in the header, or open Settings → Appearance. Choose Light, Dark or Night, and a colour palette. These choices are saved on this device."],
  },
  {
    id: "st-sound", topic: "settings", q: "How do I turn sounds off?",
    kw: "sound mute audio off",
    a: ["Tap the speaker in the header, or open Settings → Sound to switch sound effects and notification sounds separately."],
  },
  {
    id: "st-notify", topic: "settings", q: "How do I choose how you contact me about surveys?",
    kw: "notifications email sms whatsapp phone contact",
    a: ["Open Settings → Notifications and pick e-mail, SMS, phone call, dashboard or WhatsApp. Your choice is saved to your account."],
  },
  {
    id: "st-password", topic: "settings", q: "How do I change my password?",
    kw: "password change reset security",
    a: ["Open Settings → Security, enter your current password and your new one twice (at least 8 characters), then press Change password."],
  },
  {
    id: "st-forgot", topic: "settings", q: "I forgot my password.",
    kw: "forgot password reset login",
    a: ["Log out, then use \"Forgot password\" on the login page. We'll email you a link to set a new one."],
  },
  {
    id: "st-privacy", topic: "settings", q: "How is my data used?",
    kw: "privacy data gdpr security sell",
    a: ["Your terms and our Privacy policy are in Settings → Privacy. Survey answers are used for research."],
  },

  // ---- professionals
  {
    id: "pro-work", topic: "pro", q: "Why does my work profile matter so much?", types: ["professional"],
    kw: "work profile industry role seniority expert",
    a: ["Expert studies look for specific industries and roles. Your work profile is what we use to match you, and it is part of your qualification status."],
  },
  {
    id: "pro-kpi", topic: "pro", q: "How are my completion rate and participation breakdown worked out?", types: ["professional"],
    kw: "completion rate funnel breakdown statistics",
    a: ["They come from every study you started: completed, screened out and left unfinished. Your completion rate is the share you completed."],
  },
  {
    id: "pro-trend", topic: "pro", q: "Why is my earning trend empty?", types: ["professional"],
    kw: "trend chart empty earning",
    a: ["The trend shows your points by month from your reward history. It appears after your first rewarded survey or profile."],
  },

  // ---- teen
  {
    id: "teen-why-guardian", topic: "teen", q: "Why did my parent or guardian need to say YES?", types: ["teen"],
    kw: "guardian parent permission consent why",
    a: ["Because you are under 18, a parent or guardian has to agree before you can join. They received an email, said YES, and gave their consent. That is why your dashboard says \"Parent approved\"."],
  },
  {
    id: "teen-guardian-sees", topic: "teen", q: "What did my guardian agree to?", types: ["teen"],
    kw: "guardian agree consent terms",
    a: ["They agreed to the Teen terms. You can read them any time from Settings → Privacy → Terms and conditions, and see the consent record in My Account."],
  },
  {
    id: "teen-safe", topic: "teen", q: "How do I stay safe here?", types: ["teen"],
    kw: "safe safety password personal",
    a: [{ ul: [
      "Never share your password.",
      "Nobody from MyFrequentRewards will ask for your password.",
      "Don't type your address, phone number or other private details into open answers.",
      "You can skip any question or stop at any time.",
      "If anything worries you, tell your parent or guardian and send us a query.",
    ] }],
  },
  {
    id: "teen-levels", topic: "teen", q: "How do levels and badges work?", types: ["teen"],
    kw: "level badges xp unlock season",
    a: [(ctx) => ctx.features.teenProgress
      ? "There are 5 levels. Your level comes from all the points you have ever earned, so swapping points for a reward never lowers it. Badges unlock from what you really do, and each badge shows your progress towards it."
      : "Every point you earn moves you towards your next level; your dashboard shows how many you need. Badges unlock when you reach goals such as your first survey, ten surveys or a complete profile.",
    (ctx) => ctx.features.teenProgress ? "Seasons are themed stretches of time with stages to complete. Each stage gives you a badge (there are no prizes)." : null],
  },
  {
    id: "teen-change", topic: "teen", q: "My guardian's details changed, or they want to ask something.", types: ["teen"],
    kw: "guardian change details email question withdraw",
    a: ["Ask your parent or guardian to contact us, or raise a query here under Teen Zone & your guardian, and we'll help."],
  },

  {
    id: "teen-ideas", topic: "teen", q: "What happens to the ideas I send?", types: ["teen"], feature: "teenTasks",
    kw: "idea contest moderator approved name",
    a: ["A moderator checks each idea first. Don't include links, usernames or phone numbers. Once approved you earn the points, and the idea may be shown to others without your name."],
  },
  {
    id: "teen-guardian-link", topic: "teen", q: "Can my parent or guardian see what I do here?", types: ["teen"], feature: "teenProgress",
    kw: "guardian see activity view link",
    a: ["Only if you send them a view. \"Send my parent or guardian a view of my activity\" emails them a read-only link that works for 90 days. Sending again replaces the old link."],
  },
  {
    id: "teen-guardian-yes", topic: "teen", q: "Why does my guardian get an email when I ask for a reward?", types: ["teen"], feature: "rewardsShop",
    kw: "guardian email yes no reward request",
    a: ["Every Teen reward request is emailed to the parent or guardian from your registration, who answers YES or NO. If they say NO, your points come back."],
  },
  {
    id: "pro-premium", topic: "pro", q: "What are premium studies?", types: ["professional"], feature: "proExpertise",
    kw: "premium studies industry seniority match",
    a: ["Studies matched to the industry and seniority answers in your profile. If those answers are missing, we ask you to add them so we can match you."],
  },
  {
    id: "pro-expertise", topic: "pro", q: "How is my expertise score worked out?", types: ["professional"], feature: "proExpertise",
    kw: "expertise score 0 100 how",
    a: ["It runs from 0 to 100 and takes in your completed profiles, the Professional surveys you finished, your quality score and whether you have the verified expert badge."],
  },
  {
    id: "pro-statements", topic: "pro", q: "Can I get statements or receipts for my earnings?", types: ["professional"], feature: "proExpertise",
    kw: "invoice statement receipt pdf earnings tax",
    a: ["Yes. Monthly earnings statements and payout receipts are available to print or save as PDF."],
  },
  {
    id: "pro-insights", topic: "pro", q: "What are industry insight reports?", types: ["professional"], feature: "proExpertise",
    kw: "insight report industry findings",
    a: ["Reports our team shares back with professionals about findings in their industry."],
  },
  // ---- support
  {
    id: "sp-how", topic: "support", q: "How do I contact support?",
    kw: "contact support help email ticket query",
    a: [
      "Raise a query from \"Still need help?\" at the bottom of this page. Pick a topic (or Other), describe your question, and add a screenshot if it helps.",
      "You get a ticket number and a confirmation email. Our replies appear in My queries, and we email you each time we reply.",
    ],
  },
  {
    id: "sp-time", topic: "support", q: "How quickly will you reply?", review: true,
    kw: "reply time response how long",
    a: ["Please allow 24–72 business hours for a reply."],
  },
];

// search synonyms: a word the member types → words used in the content
export const SYNONYMS = {
  money: ["payout", "rewards", "points"], cash: ["payout", "milestone"], withdraw: ["payout"], redeem: ["payout", "milestone"],
  paypal: ["payout"], upi: ["payout"], amazon: ["payout"], gift: ["payout"], pay: ["payout", "points"], paid: ["payout", "points"],
  login: ["password"], signin: ["password"], otp: ["verify"], delete: ["close", "account"], remove: ["delete"],
  dark: ["theme"], mode: ["theme"], mute: ["sound"], app: ["phone", "mobile"], mobile: ["phone"],
  friend: ["referral", "invite"], refer: ["referral", "invite"], parent: ["guardian"], mom: ["guardian"], dad: ["guardian"],
  score: ["quality"], disqualified: ["screened"], terminate: ["screened"], ticket: ["query", "support"], complaint: ["query"],
};

// what the header "?" shows on a page: that section's topic, its first guide and up to three questions
export function helpForSection(section, type) {
  const fits = (e) => (!e.types || e.types.includes(type)) && !e.feature;
  const id = SECTION_TOPIC[section] || "start";
  const topic = TOPICS.find((tp) => tp.id === id && fits(tp)) || TOPICS[0];
  const guide = GUIDES.find((g) => g.topic === topic.id && fits(g)) || null;
  const faqs = FAQS.filter((f) => f.topic === topic.id && fits(f)).slice(0, 3);
  return { topic, guide, faqs };
}
