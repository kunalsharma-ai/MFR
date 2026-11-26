/**
 * THE TEEN'S OWN PROFILES (Teen Panel question bank).
 *
 * Source: "Master profiling question bank | Ages 13–17" (Nov 2026), modules 02–28, merged with the earlier Global
 * Teen Research Panel Questionnaire bank. One key per question, no duplicates:
 *   · where the earlier bank already asked the same thing, its key, wording and stored values are kept and the
 *     master file's missing options are added (doc: shows which master question it covers);
 *   · a master question with no earlier twin uses the master code as its key (E001, GM005, HP001_snacks …);
 *   · earlier questions the master file does not have are kept (no doc:).
 * by: 'parent' = the parent or guardian answers it in the onboarding form and it is copied into the teen's profile;
 *     'both' = either may answer. Module 01 (parent verification) lives in parentSurvey.js.
 * Never add: exact birth dates, addresses, school names, usernames, health diagnoses, financial credentials or
 * live location (master file, Global localization and routing).
 *
 * This file is the teen bank: edit it here, then run `node scripts/teen-content-sync.mjs` in frontend-1 (it updates the
 * API's allowed values and api/scripts/teen-bank-2026-11/bank.json for the member-hub Profiles page).
 * doc: = master file code, by: = who answers, note: = what still needs a local list (income or currency bands).
 */

// ══════ The basics · 02 Teen demographics + 03 Geography ══════
const BASIC = {
  id: "minor__basic",
  owner: "minor",
  name: "The basics",
  blurb: "Where you are and what language you want surveys in. Five minutes, tops.",
  icon: "👋",
  theme: "sunrise",
  first: true,
  source: "02 Teen demographics + 03 Geography",
  sections: [
    {
      name: "The basics",
      icon: "👋",
      qs: [
        { n: "D01", q: "When is your birthday?", kind: "dob", segment: "minor", ageOnly: true, help: "Tap the year to jump to it. We only keep your age — never your birthday.", req: true, doc: "T001 + T002 + T003" },
        { n: "D06", q: "How do you describe yourself?", req: false, o: [["Male","Male","👨"],["Female","Female","👩"],["Other","Other","🧑"]], doc: "T004" },
        { n: "D02", q: "Which country do you live in?", kind: "country", req: true, doc: "G001" },
        { n: "D03", q: "Which state, province or region?", kind: "region", from: "D02", req: true, doc: "G002" },
        { n: "D04", q: "What kind of place is it?", req: true, o: [["A large city","city","🏙️"],["A suburb","suburb","🏘️"],["A small town","town","🏡"],["The countryside","rural","🌾"],["Remote","remote","🔹"],["Prefer not to say","na","🤐"]], doc: "G003" },
        { n: "D07", q: "How long have you lived in this country?", req: false, o: [["Less than a year","<1","🧳"],["1–3 years","1-3","📦"],["More than 3 years","3+","🏠"],["Most of my life","most","🌳"],["Prefer not to say","na","🤐"]], doc: "G004" },
        { n: "D05", q: "Which language would you like your surveys in?", kind: "language", req: true, doc: "G005 + LG003" },
        { n: "D10", q: "Which time zone are you in?", help: "So invitations land at a sensible hour.", kind: "timezone", req: false },
      ],
    },
  ],
};

// ══════ School & learning · 06 Education ══════
const EDUCATION = {
  id: "minor__education",
  owner: "minor",
  name: "School & learning",
  blurb: "What you study, what you are into, and how you like to learn it.",
  icon: "🎓",
  theme: "campus",
  source: "06 Education",
  sections: [
    {
      name: "School & learning",
      icon: "🎓",
      qs: [
        { n: "D08", q: "What stage of education are you at?", req: true, o: [["Lower secondary","lower","📗"],["Upper secondary","upper","📘"],["Vocational or technical","vocational","🛠️"],["Not studying right now","none","⏸️"],["Another pathway","other","🧭"],["Prefer not to say","na","🤐"]], other: "other", doc: "T005" },
        { n: "D09", q: "Which best describes how you study?", req: true, o: [["Full-time student","ft","🎒"],["Part-time student","pt","🕐"],["Homeschooled","home","🏠"],["Not attending at the moment","break","⏸️"],["Not studying","none","⭕"],["Prefer not to say","na","🤐"]] },
        { n: "E001", q: "What kind of school do you go to?", req: false, o: [["Public / state school","public-state-school","🏫"],["Private school","private-school","🎒"],["International school","international-school","🌐"],["Boarding school","boarding-school","🛏️"],["Home school","home-school","🏠"],["Vocational school","vocational-school","🛠️"],["Other","other","✨"],["Prefer not to answer","na","🤐"]], other: "other", doc: "E001" },
        { n: "E002", q: "Which grade or year are you in?", req: false, o: [["Year 7 / Grade 7 or below","year-7-grade-7-or-below","7️⃣"],["Year 8 / Grade 8","year-8-grade-8","8️⃣"],["Year 9 / Grade 9","year-9-grade-9","9️⃣"],["Year 10 / Grade 10","year-10-grade-10","🔟"],["Year 11 / Grade 11","year-11-grade-11","1️⃣"],["Year 12 / Grade 12","year-12-grade-12","2️⃣"],["Year 13 or college","year-13-or-college","3️⃣"],["Not in school","not-in-school","🚸"],["Prefer not to answer","na","🤐"]], doc: "E002", note: "doc: country-specific grade directory; a common 7-13 scale until the local lists exist" },
        { n: "E01", q: "Which subjects do you like most?", req: false, multi: true, o: [["Maths","maths","➗"],["Science","science","🔬"],["Languages","languages","🗣️"],["Art","arts","🎨"],["Computing","computing","💻"],["History & social studies","history","🏛️"],["Business","business","📈"],["PE & sport","pe","⚽"],["Not sure yet","unsure","🤷"],["Geography","geography","🔹"],["Technology","technology","💡"],["Sports","sports","🔸"],["Something else","other","🧩"]], other: "other", exclusive: ["unsure"], doc: "E003" },
        { n: "E004", q: "Do you have extra tuition or coaching outside school?", req: false, o: [["Regularly","regularly","🔁"],["Occasionally","occasionally","🌙"],["Never","never","🙅"],["Prefer not to answer","na","🤐"]], doc: "E004" },
        { n: "E02", q: "How do you prefer to learn something new?", req: false, o: [["Reading","reading","📖"],["Watching videos","video","📺"],["Listening","audio","🎧"],["Doing it hands-on","practical","🙌"],["With other people","group","👥"],["Interactive apps","apps","📱"],["A mix of all of it","mix","🔀"],["In a classroom","classroom","🔹"]], doc: "E005" },
        { n: "E03", q: "What do you actually use to learn?", req: false, multi: true, o: [["Books","books","📚"],["Websites","web","🌐"],["Learning apps","apps","📱"],["Videos","video","▶️"],["Online courses","courses","🎓"],["AI tools","ai","🤖"],["A tutor","tutor","🧑‍🏫"],["Whatever school gives us","classroom","🏫"],["Nothing in particular","none","➖"],["Something else","other","💡"]], other: "other", exclusive: ["none"] },
        { n: "E006", q: "How often do you learn online?", req: false, o: [["Daily","daily","🔥"],["Weekly","weekly","🗓️"],["Monthly","monthly","📅"],["Rarely","rarely","🌙"],["Never","never","🙅"],["Prefer not to answer","na","🤐"]], doc: "E006" },
        { n: "E04", q: "How often do you use digital tools for schoolwork?", req: false, o: [["Daily","daily","🔥"],["Several times a week","often","📆"],["Weekly","weekly","🗓️"],["Occasionally","sometimes","🌙"],["Never","never","🙅"]] },
        { n: "E05", q: "Which device do you use most for schoolwork?", req: false, o: [["Smartphone","phone","📱"],["Tablet","tablet","📲"],["Laptop","laptop","💻"],["Desktop computer","desktop","🖥️"],["A device the family shares","shared","👨‍👩‍👧"],["I don’t use one","none","⭕"],["Something else","other","💡"]], other: "other" },
        { n: "E09", q: "Which learning apps or services do you use?", req: false, multi: true, when: (a) => a.E04 !== 'never', o: [["Khan Academy","khan","🟩"],["Duolingo","duolingo","🦉"],["Google Classroom","classroom","🟦"],["BYJU’S","byjus","🟪"],["Coursera or edX","mooc","🎓"],["YouTube learning channels","youtube","▶️"],["A school-provided platform","school","🏫"],["Something else","other","💡"],["None","none","⭕"],["Prefer not to say","na","🤐"]], other: "other", exclusive: ["none","na"] },
        { n: "E06", q: "What would you like to learn more about?", req: false, multi: true, o: [["Science","science","🔬"],["Technology","tech","🤖"],["Creative arts","creative","🎭"],["Languages","languages","🌏"],["Money & business","finance","💰"],["The environment","environment","🌍"],["Health & wellbeing","health","🧘"],["Careers","careers","🧭"],["Something else","other","💡"]], other: "other" },
        { n: "E007", q: "Which activities do you do outside lessons?", req: false, multi: true, o: [["Sports","sports","⚽"],["Music","music","🎵"],["Dance","dance","💃"],["Drama","drama","🎭"],["Coding","coding","👩‍💻"],["Art","art","🎨"],["Debate","debate","🗣️"],["Science clubs","science-clubs","🔬"],["Volunteering","volunteering","🤲"],["None","none","⭕"],["Prefer not to answer","na","🤐"]], exclusive: ["none","na"], doc: "E007" },
        { n: "E07", q: "How often do you do clubs, classes or activities outside school?", req: false, o: [["Daily","daily","🔥"],["Several times a week","often","📆"],["Weekly","weekly","🗓️"],["Monthly","monthly","📅"],["Rarely","rarely","🌙"],["Never","never","🙅"]] },
        { n: "E008", q: "What would you like to do after school?", req: false, o: [["University","university","🎓"],["Vocational education","vocational-education","🛠️"],["Get a job","get-a-job","💼"],["Start my own business","start-my-own-business","🚀"],["Not decided yet","not-decided-yet","🤔"],["Other","other","✨"],["Prefer not to answer","na","🤐"]], other: "other", doc: "E008" },
        { n: "E009", q: "How do you usually get to school?", req: false, multi: true, o: [["Walk","walk","🚶"],["Bicycle","bicycle","🚲"],["School bus","school-bus","🏫"],["Public bus","public-bus","🚌"],["Train or metro","train-or-metro","🚆"],["Car (driven by family)","car-driven-by-family","👨‍👩‍👧"],["Scooter or motorbike (as a passenger)","scooter-or-motorbike-as-a-passenger","🛵"],["Other","other","✨"],["Prefer not to answer","na","🤐"]], exclusive: ["na"], other: "other", doc: "E009", note: "carried over from the old teen profile (travel1, commute)" },
      ],
    },
  ],
};

// ══════ Home & family · 04 Household composition (parent answers) ══════
const HOUSEHOLD = {
  id: "minor__household",
  owner: "minor",
  name: "Home & family",
  blurb: "Who is at home with you. Your parent or guardian may already have filled some of this in.",
  icon: "🏡",
  theme: "nest",
  source: "04 Household composition (parent answers)",
  sections: [
    {
      name: "Home & family",
      icon: "🏡",
      qs: [
        { n: "H01", q: "Who do you usually live with?", req: true, o: [["Both parents","both","👨‍👩‍👧"],["One parent","one","👩‍👧"],["A parent and a step-parent","step","👪"],["A guardian or relatives","guardian","🛡️"],["Between two homes","shared","🔁"],["Another arrangement","other","🏠"],["Prefer not to say","na","🤐"]], other: "other" },
        { n: "H02", q: "How many people live there, counting you?", req: false, o: [["1–2","1-2","👥"],["3–4","3-4","👨‍👩‍👦"],["5–6","5-6","👨‍👩‍👧‍👦"],["7 or more","7+","🏘️"],["Prefer not to say","na","🤐"]], by: "parent", doc: "H001" },
        { n: "H03", q: "How many brothers and sisters do you have?", req: false, o: [["None","0","⭕"],["1","1","🧍"],["2","2","👥"],["3 or more","3+","👨‍👩‍👧‍👦"],["Prefer not to say","na","🤐"]], by: "parent", doc: "H004" },
        { n: "H002", q: "How many children under 18 live in your home?", req: false, o: [["1","1","1️⃣"],["2","2","2️⃣"],["3","3","3️⃣"],["4","4","4️⃣"],["5+","5plus","5️⃣"],["Prefer not to answer","na","🤐"]], by: "parent", doc: "H002" },
        { n: "H003", q: "Which age groups live in your home?", req: false, multi: true, o: [["0–4","0-4","0️⃣"],["5–8","5-8","5️⃣"],["9–12","9-12","🔹"],["13–15","13-15","1️⃣"],["16–17","16-17","🔸"],["18+","18plus","🟣"],["Prefer not to answer","na","🤐"]], exclusive: ["na"], by: "parent", doc: "H003" },
        { n: "H005", q: "What kind of home do you live in?", req: false, o: [["Owned house","owned-house","🏡"],["Owned apartment","owned-apartment","🏢"],["Rented house","rented-house","🏠"],["Rented apartment","rented-apartment","🏬"],["Other","other","✨"],["Prefer not to answer","na","🤐"]], other: "other", by: "parent", doc: "H005" },
        { n: "H006", q: "Which pets live in your home?", req: false, multi: true, o: [["Dog","dog","🐶"],["Cat","cat","🐱"],["Fish","fish","🐟"],["Bird","bird","🐦"],["Small animal","small-animal","🐹"],["Other","other","✨"],["None","none","⭕"],["Prefer not to answer","na","🤐"]], exclusive: ["none","na"], other: "other", by: "parent", doc: "H006" },
        { n: "H007", q: "What do you have at home?", req: false, multi: true, o: [["Internet","internet","🌐"],["A place to study","a-place-to-study","📚"],["Computer","computer","💻"],["TV","tv","📺"],["Outdoor space","outdoor-space","🌳"],["None","none","⭕"],["Prefer not to answer","na","🤐"]], exclusive: ["none","na"], by: "parent", doc: "H007" },
        { n: "G006", q: "Which language is spoken most at home?", req: false, kind: "language", by: "parent", doc: "G006" },
        { n: "H06", q: "Who decides on technology bought for your home?", req: false, o: [["A parent or guardian","parent","🧑‍🍼"],["We decide together","shared","🤝"],["Another adult","other-adult","👤"],["It depends on the thing","varies","🔀"],["Not sure","unsure","🤷"],["Prefer not to say","na","🤐"]] },
        { n: "H07", q: "Who chooses the food and snacks bought for your home?", req: false, o: [["A parent or guardian","parent","🧑‍🍼"],["Me","me","🙋"],["We decide together","shared","🤝"],["Someone else at home","other","👤"],["It varies","varies","🔀"],["Prefer not to say","na","🤐"]] },
        { n: "H10", q: "Which household purchases do you get a say in?", req: false, multi: true, o: [["Food and drink","food","🍽️"],["Technology","tech","📱"],["Clothing","clothing","👕"],["Entertainment subscriptions","subs","📺"],["Travel","travel","✈️"],["Household products","household","🧽"],["None of them","none","⭕"],["Something else","other","💡"]], other: "other", exclusive: ["none"] },
      ],
    },
  ],
};

// ══════ About my parent · 05 Socioeconomic background (parent answers) ══════
const FAMILY = {
  id: "minor__family",
  owner: "parent",
  name: "About my parent",
  blurb: "Filled in by your parent or guardian when they gave permission. Used only for grouping, never shown to anyone else.",
  icon: "👪",
  theme: "nest",
  source: "05 Socioeconomic background (parent answers)",
  sections: [
    {
      name: "About my parent",
      icon: "👪",
      qs: [
        { n: "S001", q: "What is your parent or guardian’s work situation?", req: false, o: [["Full-time","full-time","🕘"],["Part-time","part-time","🕐"],["Self-employed","self-employed","🧰"],["Homemaker","homemaker","🏠"],["Student","student","🎓"],["Retired","retired","🌅"],["Unemployed","unemployed","🔍"],["Other","other","✨"],["Prefer not to answer","na","🤐"]], other: "other", by: "parent", doc: "S001" },
        { n: "S002", q: "What is their highest education?", req: false, o: [["Primary","primary","1️⃣"],["Secondary","secondary","2️⃣"],["Higher secondary","higher-secondary","3️⃣"],["Vocational","vocational","🛠️"],["Bachelor’s","bachelors","🎓"],["Master’s","masters","📜"],["Doctorate","doctorate","🧑‍🔬"],["Other","other","✨"],["Prefer not to answer","na","🤐"]], other: "other", by: "parent", doc: "S002" },
        { n: "S003", q: "What is the yearly household income?", req: false, o: [["Lower","lower","⬇️"],["Lower middle","lower-middle","📉"],["Middle","middle","➡️"],["Upper middle","upper-middle","📈"],["Higher","higher","⬆️"],["Prefer not to answer","na","🤐"]], by: "parent", doc: "S003", note: "doc: country-specific currency bands; five relative bands until the local bands exist" },
        { n: "S004", q: "How many adults in your home earn an income?", req: false, o: [["0","0","0️⃣"],["1","1","1️⃣"],["2","2","2️⃣"],["3+","3plus","3️⃣"],["Prefer not to answer","na","🤐"]], by: "parent", doc: "S004" },
        { n: "S005", q: "Which of these does your household have?", req: false, multi: true, o: [["Car","car","🚗"],["Motorcycle","motorcycle","🏍️"],["Computer","computer","💻"],["Smart TV","smart-tv","📺"],["Tablet","tablet","📲"],["Gaming console","gaming-console","🎮"],["None","none","⭕"],["Prefer not to answer","na","🤐"]], exclusive: ["none","na"], by: "parent", doc: "S005" },
      ],
    },
  ],
};

// ══════ Devices · 07 Technology ══════
const DEVICES = {
  id: "minor__devices",
  owner: "minor",
  name: "Devices",
  blurb: "What you use, and what you could do a survey on.",
  icon: "📱",
  theme: "circuit",
  source: "07 Technology",
  sections: [
    {
      name: "Devices",
      icon: "📱",
      qs: [
        { n: "T01", q: "Which devices do you personally use?", req: true, multi: true, o: [["Smartphone","phone","📱"],["Tablet","tablet","📲"],["Laptop","laptop","💻"],["Desktop computer","desktop","🖥️"],["Games console","console","🎮"],["Smart TV","tv","📺"],["Smartwatch","watch","⌚"],["VR headset","vr","🥽"],["Something else","other","💡"],["None of these","none","⭕"]], other: "other", exclusive: ["none"], doc: "D001" },
        { n: "D002", q: "Do you have your own smartphone?", req: false, o: [["My own","my-own","🔹"],["I share one","i-share-one","🔸"],["No","no","🚫"],["Prefer not to answer","na","🤐"]], doc: "D002" },
        { n: "T13", q: "Which operating system do you use most?", req: false, o: [["Android","android","🤖"],["iOS / iPhone","ios","🍎"],["Windows","windows","🪟"],["macOS","macos","💻"],["ChromeOS","chromeos","🌐"],["Not sure","unsure","🤷"],["Don’t know","dontknow","🤔"],["Something else","other","💡"]], other: "other", doc: "D003" },
        { n: "D004", q: "Which brand is your phone?", req: false, o: [["Apple","apple","🍎"],["Samsung","samsung","🌌"],["Xiaomi","xiaomi","🔹"],["Vivo","vivo","🔸"],["Oppo","oppo","🟣"],["Realme","realme","🟢"],["Motorola","motorola","🟡"],["Google","google","🔍"],["OnePlus","oneplus","🔵"],["Huawei","huawei","🟠"],["Honor","honor","🟤"],["Another brand","another-brand","🏷️"],["Prefer not to answer","na","🤐"]], when: (a) => a.D002 === 'my-own' || a.D002 === 'i-share-one', doc: "D004", note: "carries over the old phone-brand question (mobile11)" },
        { n: "D005", q: "Which device do you use most to go online?", req: false, o: [["Smartphone","smartphone","📱"],["Tablet","tablet","📲"],["Laptop","laptop","💻"],["Desktop","desktop","🖥️"],["Other","other","✨"],["Prefer not to answer","na","🤐"]], other: "other", doc: "D005" },
        { n: "D006", q: "How often do you use a computer?", req: false, o: [["Daily","daily","🔥"],["Several times weekly","several-times-weekly","📆"],["Weekly","weekly","🗓️"],["Rarely","rarely","🌙"],["Never","never","🙅"],["Prefer not to answer","na","🤐"]], doc: "D006" },
        { n: "D007", q: "Which wearables do you use?", req: false, multi: true, o: [["Smartwatch","smartwatch","⌚"],["Fitness tracker","fitness-tracker","🏃"],["Smart glasses","smart-glasses","👓"],["Other","other","✨"],["None","none","⭕"],["Prefer not to answer","na","🤐"]], exclusive: ["none","na"], other: "other", doc: "D007" },
        { n: "D008", q: "How often do you use headphones?", req: false, o: [["Daily","daily","🔥"],["Occasionally","occasionally","🌙"],["Never","never","🙅"],["Prefer not to answer","na","🤐"]], doc: "D008" },
        { n: "D009", q: "Do you share devices with your family?", req: false, o: [["Always","always","♾️"],["Sometimes","sometimes","🌗"],["Never","never","🙅"],["Prefer not to answer","na","🤐"]], doc: "D009" },
        { n: "X06", q: "Which smart devices do you use?", req: false, multi: true, o: [["Smartwatch","watch","⌚"],["Smart speaker","speaker","🔊"],["Smart TV","tv","📺"],["Smart home devices","home","🏠"],["VR headset","vr","🥽"],["Fitness tracker","tracker","📿"],["None","none","⭕"],["Something else","other","💡"]], other: "other", exclusive: ["none"] },
        { n: "T10", q: "Could you comfortably do an online survey on your main device?", help: "There is no wrong answer — it only decides which studies you get.", req: true, o: [["Yes","yes","✅"],["No","no","🚫"],["Not sure","unsure","🤷"]] },
        { n: "T11", q: "Could you use a webcam if a study needed one?", req: false, o: [["Yes","yes","📷"],["No","no","🚫"],["Only with permission","permission","🗝️"],["Not sure","unsure","🤷"]] },
        { n: "T12", q: "Could you use headphones for an online interview?", req: false, o: [["Yes","yes","🎧"],["No","no","🚫"],["Sometimes","sometimes","🔀"]] },
      ],
    },
  ],
};

// ══════ Internet · 08 Internet ══════
const INTERNET = {
  id: "minor__internet",
  owner: "minor",
  name: "Internet",
  blurb: "How much you are online and what you do there.",
  icon: "🌐",
  theme: "circuit",
  source: "08 Internet",
  sections: [
    {
      name: "Internet",
      icon: "🌐",
      qs: [
        { n: "T02", q: "How often do you go online?", req: true, o: [["Several times a day","many-daily","🔥"],["About once a day","daily","📆"],["Several times a week","weekly","🗓️"],["Less often","rare","🌙"],["Never","never","🙅"]] },
        { n: "I001", q: "How much time a day do you spend online for yourself (not school)?", req: false, o: [["Under 1 hour","under-1-hour","🔹"],["1 to under 2 hours","1-to-under-2-hours","1️⃣"],["2 to under 4 hours","2-to-under-4-hours","2️⃣"],["4 to under 6 hours","4-to-under-6-hours","4️⃣"],["6+ hours","6plus-hours","6️⃣"],["Prefer not to answer","na","🤐"]], doc: "I001" },
        { n: "I002", q: "What do you do online?", req: false, multi: true, o: [["Education","education","📚"],["Gaming","gaming","🎮"],["Entertainment","entertainment","🍿"],["Social media","social-media","📲"],["Chatting with people I know","chatting-with-people-i-know","💬"],["Shopping","shopping","🛍️"],["Creating things","creating-things","✏️"],["News","news","📰"],["Prefer not to answer","na","🤐"]], exclusive: ["na"], doc: "I002" },
        { n: "T05", q: "Where do you usually get online?", req: false, multi: true, when: (a) => a.T02 !== 'never', o: [["At home","home","🏠"],["At school","school","🏫"],["On mobile data when out","mobile","📶"],["Public Wi-Fi","public","📡"],["A library or community centre","library","📚"],["Somewhere else","other","✨"]], other: "other" },
        { n: "T06", q: "Which connection do you use most?", req: false, when: (a) => a.T02 !== 'never', o: [["Home Wi-Fi","home-wifi","🏠"],["Mobile data","mobile","📶"],["Public Wi-Fi","public","📡"],["The school network","school","🏫"],["No regular access","none","⭕"],["Something else","other","💡"]], other: "other", doc: "I003" },
        { n: "I004", q: "Which browser do you use?", req: false, multi: true, o: [["Chrome","chrome","🌐"],["Safari","safari","🧭"],["Edge","edge","🌊"],["Firefox","firefox","🦊"],["Samsung Internet","samsung-internet","🌌"],["Other","other","✨"],["Prefer not to answer","na","🤐"]], exclusive: ["na"], other: "other", doc: "I004", note: "also covers the old browser question (tech_computer_browser)" },
        { n: "I005", q: "How often do you watch online videos?", req: false, o: [["Daily","daily","🔥"],["Weekly","weekly","🗓️"],["Monthly","monthly","📅"],["Rarely","rarely","🌙"],["Never","never","🙅"],["Prefer not to answer","na","🤐"]], doc: "I005" },
        { n: "I006", q: "How often do you create digital content (videos, art, music, posts)?", req: false, o: [["Daily","daily","🔥"],["Weekly","weekly","🗓️"],["Monthly","monthly","📅"],["Rarely","rarely","🌙"],["Never","never","🙅"],["Prefer not to answer","na","🤐"]], doc: "I006" },
      ],
    },
  ],
};

// ══════ Social media · 09 Social media ══════
const SOCIAL = {
  id: "minor__social",
  owner: "minor",
  name: "Social media",
  blurb: "Where you scroll, what you post, and who you follow.",
  icon: "💬",
  theme: "feed",
  source: "09 Social media",
  sections: [
    {
      name: "Social media",
      icon: "💬",
      qs: [
        { n: "SM01", q: "Which social platforms do you use regularly?", req: true, multi: true, o: [["Instagram","instagram","📸"],["YouTube","youtube","▶️"],["WhatsApp","whatsapp","🟢"],["Snapchat","snapchat","👻"],["TikTok","tiktok","🎵"],["Facebook","facebook","🔵"],["Discord","discord","🎧"],["Telegram","telegram","✈️"],["X","x","✖️"],["Reddit","reddit","🟠"],["Pinterest","pinterest","🔹"],["Something else","other","💡"],["None of these","none","⭕"]], other: "other", exclusive: ["none"], doc: "SM001" },
        { n: "SM02", q: "Which one do you use the most?", req: false, when: (a) => Array.isArray(a.SM01) && a.SM01.length > 0 && !a.SM01.includes('none'), o: [["Instagram","instagram","📸"],["YouTube","youtube","▶️"],["WhatsApp","whatsapp","🟢"],["Snapchat","snapchat","👻"],["TikTok","tiktok","🎵"],["Discord","discord","🎧"],["Something else","other","💡"]], other: "other" },
        { n: "SM002", q: "How often do you use social media?", req: false, o: [["Daily","daily","🔥"],["Several times weekly","several-times-weekly","📆"],["Weekly","weekly","🗓️"],["Rarely","rarely","🌙"],["Never","never","🙅"],["Prefer not to answer","na","🤐"]], when: (a) => Array.isArray(a.SM01) && !a.SM01.includes('none'), doc: "SM002" },
        { n: "SM03", q: "Roughly how long do you spend on social media a day?", req: false, when: (a) => Array.isArray(a.SM01) && !a.SM01.includes('none'), o: [["Under 30 minutes","<30","⏱️"],["30–60 minutes","30-60","🕐"],["1–2 hours","1-2h","🕑"],["2–4 hours","2-4h","🕓"],["More than 4 hours","4h+","🕘"]] },
        { n: "SM04", q: "What do you mostly use it for?", req: false, multi: true, when: (a) => Array.isArray(a.SM01) && !a.SM01.includes('none'), o: [["Entertainment","fun","🍿"],["Chatting with friends","friends","💬"],["Following creators","creators","⭐"],["Learning things","learning","🧠"],["Sharing photos and videos","sharing","📷"],["Gaming communities","gaming","🎮"],["News and trends","news","📰"]] },
        { n: "SM003", q: "Which formats do you like most?", req: false, multi: true, o: [["Short videos","short-videos","🎬"],["Long videos","long-videos","🔹"],["Images","images","🖼️"],["Stories","stories","📖"],["Live streams","live-streams","🔴"],["Text","text","📝"],["Prefer not to answer","na","🤐"]], exclusive: ["na"], doc: "SM003" },
        { n: "SM004", q: "Which kinds of content are you into?", req: false, multi: true, o: [["Gaming","gaming","🎮"],["Fashion","fashion","👗"],["Sports","sports","⚽"],["Music","music","🎵"],["Comedy","comedy","😂"],["Education","education","📚"],["Technology","technology","💡"],["Food","food","🍔"],["Art","art","🎨"],["Entertainment","entertainment","🍿"],["Prefer not to answer","na","🤐"]], exclusive: ["na"], doc: "SM004" },
        { n: "SM07", q: "How often do you post something?", req: false, when: (a) => Array.isArray(a.SM01) && !a.SM01.includes('none'), o: [["Daily","daily","🔥"],["Several times a week","often","📆"],["Weekly","weekly","🗓️"],["Now and then","sometimes","🌙"],["Never","never","🙅"]], doc: "SM005" },
        { n: "SM08", q: "What do you usually post?", req: false, multi: true, when: (a) => a.SM07 && a.SM07 !== 'never', o: [["Photos","photos","📷"],["Videos or reels","video","🎞️"],["Stories","stories","⭕"],["Text posts","text","✍️"],["Memes","memes","😂"]] },
        { n: "SM06", q: "Is any of your profile public?", req: false, when: (a) => Array.isArray(a.SM01) && !a.SM01.includes('none'), o: [["Yes","yes","🌍"],["No, all private","no","🔒"],["Some are public","some","🔀"]] },
        { n: "SM006", q: "Do you discover products through social media?", req: false, o: [["Often","often","🔁"],["Sometimes","sometimes","🌗"],["Rarely","rarely","🌙"],["Never","never","🙅"],["Prefer not to answer","na","🤐"]], doc: "SM006" },
        { n: "SM007", q: "Which kinds of creators do you follow?", req: false, multi: true, o: [["Gaming","gaming","🎮"],["Music","music","🎵"],["Sports","sports","⚽"],["Education","education","📚"],["Art","art","🎨"],["Technology","technology","💡"],["Entertainment","entertainment","🍿"],["None","none","⭕"],["Prefer not to answer","na","🤐"]], exclusive: ["none","na"], doc: "SM007" },
        { n: "GE05", q: "Do you follow gaming or entertainment creators?", req: false, o: [["Yes, loads","many","🔥"],["Yes, a few","few","⭐"],["Now and then","sometimes","🌙"],["No","no","👎"]] },
      ],
    },
  ],
};

// ══════ Gaming · 10 Gaming ══════
const GAMING = {
  id: "minor__gaming",
  owner: "minor",
  name: "Gaming",
  blurb: "What you play, how often, and who you play with.",
  icon: "🎮",
  theme: "arcade",
  source: "10 Gaming",
  sections: [
    {
      name: "Gaming",
      icon: "🎮",
      qs: [
        { n: "G01", q: "Do you play games?", req: true, o: [["Yes","yes","🎮"],["No","no","🚫"],["Prefer not to say","na","🤐"]], doc: "GM001" },
        { n: "G02", q: "What do you play on?", req: false, multi: true, when: (a) => a.G01 === 'yes', o: [["Smartphone","phone","📱"],["Tablet","tablet","📲"],["PC","pc","💻"],["Console","console","🎮"],["A handheld","handheld","🎲"],["VR","vr","🥽"],["Cloud gaming","cloud-gaming","☁️"],["Something else","other","💡"],["None","none","⭕"]], other: "other", exclusive: ["none"], doc: "GM002" },
        { n: "GE01", q: "How often do you play?", req: false, when: (a) => a.G01 === 'yes', o: [["Daily","daily","🔥"],["Several times a week","often","📆"],["Once a week","weekly","🗓️"],["Now and then","sometimes","🌙"],["Never","never","🙅"]], doc: "GM003" },
        { n: "GE02", q: "What kind of gaming do you prefer?", req: false, when: (a) => a.G01 === 'yes', o: [["Mobile games","mobile","📱"],["PC games","pc","💻"],["Console games","console","🎮"],["Online multiplayer","multiplayer","🌐"],["Casual games","casual","🧩"]] },
        { n: "G05", q: "Which genres do you enjoy?", req: false, multi: true, when: (a) => a.G01 === 'yes', o: [["Action","action","💥"],["Adventure","adventure","🗺️"],["Puzzle","puzzle","🧩"],["Sports","sports","⚽"],["Simulation","sim","🚜"],["Strategy","strategy","♟️"],["Role-playing","rpg","🗡️"],["Racing","racing","🏎️"],["Casual","casual","🍬"],["Creative sandbox","sandbox","🧱"],["Something else","other","💡"]], other: "other", doc: "GM004" },
        { n: "GM005", q: "Which of these games do you play?", req: false, multi: true, o: [["Minecraft","minecraft","⛏️"],["Roblox","roblox","🧱"],["Fortnite","fortnite","🪂"],["EA Sports FC","ea-sports-fc","⚽"],["Rocket League","rocket-league","🚗"],["Other","other","✨"],["None","none","⭕"],["Prefer not to answer","na","🤐"]], exclusive: ["none","na"], other: "other", when: (a) => a.G01 === 'yes', doc: "GM005", note: "doc: age-appropriate local list" },
        { n: "GM006", q: "Do you prefer playing alone or with others?", req: false, o: [["Single-player","single-player","🧍"],["Multiplayer","multiplayer","👥"],["Both","both","🔀"],["Prefer not to answer","na","🤐"]], when: (a) => a.G01 === 'yes', doc: "GM006" },
        { n: "GE03", q: "Do you watch gaming content online?", req: false, o: [["Often","often","🔥"],["Sometimes","sometimes","📺"],["Rarely","rarely","🌙"],["Never","never","🙅"]], doc: "GM007" },
        { n: "GM008", q: "Do you watch esports?", req: false, o: [["Frequently","frequently","🔁"],["Occasionally","occasionally","🌙"],["Never","never","🙅"],["Prefer not to answer","na","🤐"]], doc: "GM008" },
        { n: "GM009", q: "Do you take part in gaming competitions?", req: false, o: [["Regularly","regularly","🔁"],["Occasionally","occasionally","🌙"],["Never","never","🙅"],["Prefer not to answer","na","🤐"]], when: (a) => a.G01 === 'yes', doc: "GM009" },
        { n: "GM010", q: "Do your parents buy games or gaming products for you?", req: false, o: [["Frequently","frequently","🔁"],["Occasionally","occasionally","🌙"],["Never","never","🙅"],["Prefer not to answer","na","🤐"]], by: "both", doc: "GM010" },
        { n: "GE06", q: "Which feature would you most want in a gaming or entertainment app?", req: false, o: [["Gaming communities","communities","👥"],["Live streaming","streaming","📡"],["Challenges with friends","challenges","🏁"],["Watch parties","watchparty","🍿"],["Reviews and ratings","reviews","⭐"],["Better recommendations","recs","🎯"],["Tournaments","tournaments","🏆"],["Creator content","creator","🎬"]] },
      ],
    },
  ],
};

// ══════ Entertainment · 11 Entertainment ══════
const ENTERTAINMENT = {
  id: "minor__entertainment",
  owner: "minor",
  name: "Entertainment",
  blurb: "What you watch, where, and how you find it.",
  icon: "🍿",
  theme: "arcade",
  source: "11 Entertainment",
  sections: [
    {
      name: "Entertainment",
      icon: "🍿",
      qs: [
        { n: "EN001", q: "Which streaming services do you use?", req: false, multi: true, o: [["YouTube","youtube","▶️"],["Netflix","netflix","🎞️"],["Prime Video","prime-video","🎬"],["Disney+","disneyplus","🏰"],["Apple TV+","apple-tvplus","🍎"],["Local services","local-services","📍"],["None","none","⭕"],["Prefer not to answer","na","🤐"]], exclusive: ["none","na"], doc: "EN001" },
        { n: "GE04", q: "What do you watch most?", req: false, multi: true, o: [["Films","films","🎬"],["TV and streaming shows","tv","📺"],["YouTube videos","youtube","▶️"],["Short videos and reels","shorts","📱"],["Anime","anime","🌸"],["Sport","sport","🏟️"],["Gaming streams","streams","🎮"],["Music videos","music","🎵"],["Documentaries","documentaries","🎥"],["Reality shows","reality-shows","📸"]], doc: "EN002" },
        { n: "G10", q: "Which formats do you get through most?", req: false, multi: true, o: [["Films","films","🎬"],["Series","series","📺"],["Online videos","video","▶️"],["Music","music","🎵"],["Podcasts","podcasts","🎙️"],["Books","books","📚"],["Live events","live","🎪"],["Gaming streams","streams","🎮"],["Something else","other","💡"]], other: "other" },
        { n: "EN003", q: "Which genres do you like?", req: false, multi: true, o: [["Comedy","comedy","😂"],["Adventure","adventure","🧭"],["Fantasy","fantasy","🐉"],["Science fiction","science-fiction","👽"],["Animation","animation","🐭"],["Drama","drama","🎭"],["Mystery","mystery","🕵️"],["Action","action","💥"],["Prefer not to answer","na","🤐"]], exclusive: ["na"], doc: "EN003" },
        { n: "EN004", q: "How often do you go to the cinema?", req: false, o: [["Weekly","weekly","🗓️"],["Monthly","monthly","📅"],["Every few months","every-few-months","🔹"],["Rarely","rarely","🌙"],["Never","never","🙅"],["Prefer not to answer","na","🤐"]], doc: "EN004" },
        { n: "EN005", q: "Which device do you watch on most?", req: false, o: [["Smartphone","smartphone","📱"],["TV","tv","📺"],["Tablet","tablet","📲"],["Computer","computer","💻"],["Prefer not to answer","na","🤐"]], doc: "EN005" },
        { n: "EN006", q: "Which languages do you watch shows in?", req: false, kind: "language", multi: true, doc: "EN006" },
        { n: "EN007", q: "How do you find new shows?", req: false, multi: true, o: [["Family","family","👨‍👩‍👧"],["Friends","friends","🧑‍🤝‍🧑"],["Platform recommendations","platform-recommendations","✨"],["Social media","social-media","📲"],["Advertising","advertising","📣"],["Other","other","🔹"],["Prefer not to answer","na","🤐"]], exclusive: ["na"], other: "other", doc: "EN007" },
        { n: "G14", q: "Do you go to entertainment events?", req: false, o: [["Often","often","🎪"],["Sometimes","sometimes","🎟️"],["Rarely","rarely","🌙"],["Never","never","🙅"]] },
        { n: "G15", q: "Which subscriptions does your household have?", req: false, multi: true, o: [["Video","video","📺"],["Music","music","🎵"],["Gaming","gaming","🎮"],["Books or audiobooks","books","📚"],["Something else","other","💡"],["None","none","⭕"]], other: "other", exclusive: ["none"] },
      ],
    },
  ],
};

// ══════ Music & audio · 12 Music and audio ══════
const MUSIC = {
  id: "minor__music",
  owner: "minor",
  name: "Music & audio",
  blurb: "What you listen to and how.",
  icon: "🎧",
  theme: "arcade",
  source: "12 Music and audio",
  sections: [
    {
      name: "Music & audio",
      icon: "🎧",
      qs: [
        { n: "MU001", q: "How often do you listen to music?", req: false, o: [["Daily","daily","🔥"],["Weekly","weekly","🗓️"],["Occasionally","occasionally","🌙"],["Never","never","🙅"],["Prefer not to answer","na","🤐"]], doc: "MU001" },
        { n: "G12", q: "Which music do you like?", req: false, multi: true, o: [["Pop","pop","🎤"],["Hip-hop","hiphop","🎧"],["Rock","rock","🎸"],["Electronic","electronic","🎛️"],["Classical","classical","🎻"],["Regional music","regional","🪘"],["Jazz","jazz","🎷"],["K-pop","kpop","💜"],["No preference","any","🤷"],["Country","country","🤠"],["Something else","other","💡"]], other: "other", exclusive: ["any"], doc: "MU002" },
        { n: "G13", q: "How do you usually listen to music?", req: false, multi: true, o: [["A streaming service","streaming","🎧"],["Radio","radio","📻"],["Downloads","downloads","⬇️"],["Through videos","video","▶️"],["Physical media","physical","💿"],["Live","live","🎪"],["Something else","other","💡"],["I don’t","never","🙅"]], other: "other", exclusive: ["never"] },
        { n: "MU003", q: "Which music services do you use?", req: false, multi: true, o: [["Spotify","spotify","🟢"],["Apple Music","apple-music","🍎"],["YouTube Music","youtube-music","▶️"],["Amazon Music","amazon-music","📦"],["Local services","local-services","📍"],["None","none","⭕"],["Prefer not to answer","na","🤐"]], exclusive: ["none","na"], doc: "MU003" },
        { n: "MU004", q: "Do you play an instrument?", req: false, o: [["Yes","yes","✅"],["Learning","learning","🌱"],["No","no","🚫"],["Prefer not to answer","na","🤐"]], doc: "MU004" },
        { n: "MU005", q: "Do you listen to podcasts?", req: false, o: [["Frequently","frequently","🔁"],["Occasionally","occasionally","🌙"],["Never","never","🙅"],["Prefer not to answer","na","🤐"]], doc: "MU005" },
        { n: "MU006", q: "Do you go to music events with your parents or guardians?", req: false, o: [["Frequently","frequently","🔁"],["Occasionally","occasionally","🌙"],["Never","never","🙅"],["Prefer not to answer","na","🤐"]], doc: "MU006" },
      ],
    },
  ],
};

// ══════ Sports · 13 Sports ══════
const SPORTS = {
  id: "minor__sports",
  owner: "minor",
  name: "Sports",
  blurb: "What you play, where, and what you watch.",
  icon: "⚽",
  theme: "arena",
  source: "13 Sports",
  sections: [
    {
      name: "Sports",
      icon: "⚽",
      qs: [
        { n: "SP001", q: "Do you take part in sports?", req: false, o: [["Regularly","regularly","🔁"],["Occasionally","occasionally","🌙"],["Never","never","🙅"],["Prefer not to answer","na","🤐"]], doc: "SP001" },
        { n: "SP01", q: "How often do you do sport or get active?", req: true, o: [["Daily","daily","🔥"],["Several times a week","often","📆"],["Weekly","weekly","🗓️"],["Now and then","sometimes","🌙"],["Never","never","🙅"]], doc: "SP004" },
        { n: "SP02", q: "Which sports do you play?", req: false, multi: true, when: (a) => a.SP01 !== 'never', o: [["Cricket","cricket","🏏"],["Football","football","⚽"],["Basketball","basketball","🏀"],["Badminton","badminton","🏸"],["Swimming","swimming","🏊"],["Running or cycling","running","🚴"],["Gym & fitness","gym","🏋️"],["Tennis","tennis","🎾"],["Volleyball","volleyball","🏐"],["Athletics","athletics","🏃"],["Something else","other","💡"],["None","none","⭕"]], other: "other", exclusive: ["none"], doc: "SP002" },
        { n: "L16", q: "Which kinds of activity do you enjoy?", req: false, multi: true, o: [["Team sports","team","🤾"],["Individual sports","solo","🎯"],["Dance","dance","💃"],["Fitness","fitness","🏋️"],["Cycling","cycling","🚴"],["Walking","walking","🚶"],["Outdoors","outdoor","🏕️"],["Esports","esports","🎮"],["None","none","⭕"],["Something else","other","💡"]], other: "other", exclusive: ["none"] },
        { n: "SP003", q: "Where do you usually do sport?", req: false, multi: true, o: [["School","school","🏫"],["A club","a-club","🏟️"],["Home","home","🏠"],["A community facility","a-community-facility","🤝"],["Other","other","✨"],["Prefer not to answer","na","🤐"]], exclusive: ["na"], other: "other", when: (a) => a.SP001 !== 'never', doc: "SP003" },
        { n: "SP04", q: "Which sport do you follow most?", req: false, o: [["Cricket","cricket","🏏"],["Football","football","⚽"],["Basketball","basketball","🏀"],["Tennis","tennis","🎾"],["Motorsport","motorsport","🏎️"],["Something else","other","💡"],["None","none","⭕"]], other: "other", doc: "SP005" },
        { n: "SP006", q: "Do you take part in organised competitions?", req: false, o: [["Regularly","regularly","🔁"],["Occasionally","occasionally","🌙"],["Never","never","🙅"],["Prefer not to answer","na","🤐"]], doc: "SP006" },
        { n: "SP007", q: "Which sports products do you use?", req: false, multi: true, o: [["Shoes","shoes","👟"],["Sportswear","sportswear","🎽"],["Equipment","equipment","🏸"],["Accessories","accessories","👜"],["None","none","⭕"],["Prefer not to answer","na","🤐"]], exclusive: ["none","na"], doc: "SP007" },
        { n: "SP05", q: "How often do you watch sport online?", req: false, o: [["Daily","daily","🔥"],["Several times a week","often","📆"],["Weekly","weekly","🗓️"],["Occasionally","sometimes","🌙"],["Never","never","🙅"]] },
        { n: "SP09", q: "Do you follow athletes, teams or hobby creators online?", req: false, o: [["Yes, regularly","regular","🔥"],["Sometimes","sometimes","👍"],["Rarely","rarely","🌙"],["Never","never","🙅"]] },
      ],
    },
  ],
};

// ══════ Hobbies · 14 Hobbies ══════
const HOBBIES = {
  id: "minor__hobbies",
  owner: "minor",
  name: "Hobbies",
  blurb: "What you do in your free time.",
  icon: "🎨",
  theme: "arena",
  source: "14 Hobbies",
  sections: [
    {
      name: "Hobbies",
      icon: "🎨",
      qs: [
        { n: "SP06", q: "Do you have hobbies outside school?", req: false, o: [["Yes, regularly","regular","🔥"],["Yes, now and then","sometimes","👍"],["Not really","no","🤷‍♂️"]] },
        { n: "SP07", q: "Which hobbies do you enjoy most?", req: false, multi: true, when: (a) => a.SP06 && a.SP06 !== 'no', o: [["Music","music","🎵"],["Art & drawing","art","🎨"],["Reading","reading","📚"],["Gaming","gaming","🎮"],["Gardening","gardening","🌱"],["Photo & video","photo","📸"],["Dance","dance","💃"],["Cooking","cooking","🍳"],["Collecting things","collecting","🗃️"],["Painting","painting","🖌️"],["Photography","photography","📷"],["Coding","coding","👩‍💻"],["Crafts","crafts","✂️"],["Sports","sports","⚽"],["Something else","other","💡"]], other: "other", doc: "HB001" },
        { n: "HB002", q: "Do you prefer indoor or outdoor activities?", req: false, o: [["Indoor","indoor","🏠"],["Outdoor","outdoor","🌳"],["Both","both","🔀"],["Prefer not to answer","na","🤐"]], doc: "HB002" },
        { n: "HB003", q: "How do you like to spend free time?", req: false, multi: true, o: [["With family","with-family","👨‍👩‍👧"],["With friends","with-friends","🧑‍🤝‍🧑"],["On my own hobbies","on-my-own-hobbies","🎨"],["Sports","sports","⚽"],["Entertainment","entertainment","🍿"],["Learning","learning","🌱"],["Prefer not to answer","na","🤐"]], exclusive: ["na"], doc: "HB003" },
        { n: "L17", q: "Which creative things are you into?", req: false, multi: true, o: [["Drawing","drawing","✏️"],["Painting","painting","🖌️"],["Photography","photography","📷"],["Music","music","🎸"],["Writing","writing","✍️"],["Crafts","crafts","🧶"],["Video editing","editing","🎞️"],["Design","design","🎨"],["None","none","⭕"],["Something else","other","💡"]], other: "other", exclusive: ["none"], doc: "HB004" },
        { n: "L19", q: "Which of these do you enjoy in your free time?", req: false, multi: true, o: [["Reading","reading","📚"],["Travel","travel","✈️"],["Cooking","cooking","🍳"],["Gardening","gardening","🌿"],["Animals","animals","🐾"],["Collecting","collecting","🗃️"],["Volunteering","volunteering","🤝"],["Being outdoors","outdoors","🏕️"],["Something else","other","💡"]], other: "other" },
        { n: "HB005", q: "How interested are you in science and technology?", req: false, o: [["Very","very","🤩"],["Somewhat","somewhat","🙂"],["Not interested","not-interested","😐"],["Prefer not to answer","na","🤐"]], doc: "HB005" },
        { n: "HB006", q: "Do you take part in community activities?", req: false, o: [["Regularly","regularly","🔁"],["Occasionally","occasionally","🌙"],["Never","never","🙅"],["Prefer not to answer","na","🤐"]], doc: "HB006" },
      ],
    },
  ],
};

// ══════ Food & drink · 15 Food and beverages ══════
const FOOD = {
  id: "minor__food",
  owner: "minor",
  name: "Food & drink",
  blurb: "What you eat, what you snack on, and who chooses.",
  icon: "🍕",
  theme: "bistro",
  source: "15 Food and beverages",
  sections: [
    {
      name: "Food & drink",
      icon: "🍕",
      qs: [
        { n: "FB02", q: "Which kind of food do you like most?", req: false, o: [["Fast food","fastfood","🍔"],["Indian","indian","🍛"],["Chinese or other Asian","asian","🥡"],["Italian","italian","🍝"],["Snacks & street food","street","🌮"],["Healthy food","healthy","🥗"],["Desserts & bakery","dessert","🧁"],["Fruit","fruit","🍎"],["Vegetables","vegetables","🥦"],["Pizza","pizza","🍕"],["Burgers","burgers","🔹"],["Pasta","pasta","🔸"],["Noodles","noodles","🍜"],["Rice dishes","rice-dishes","🍚"],["Sandwiches","sandwiches","🥪"],["Local cuisine","local-cuisine","📍"]], multi: true, doc: "FD001" },
        { n: "FB01", q: "Where do you usually get your food?", req: true, multi: true, o: [["Home","home","🏠"],["School canteen","school","🏫"],["Restaurants & cafés","restaurant","🍴"],["Fast food","fastfood","🍔"],["Delivery apps","delivery","🛵"],["Local shops & street food","street","🌮"]] },
        { n: "FB06", q: "Which snacks do you go for?", req: false, multi: true, o: [["Crisps & chips","chips","🍟"],["Chocolate","chocolate","🍫"],["Biscuits & cookies","biscuits","🍪"],["Namkeen & savoury mixes","namkeen","🥨"],["Fast food","fastfood","🍔"],["Ice cream","icecream","🍦"],["Bakery","bakery","🥐"],["Fruit & healthy snacks","fruit","🍎"],["Popcorn","popcorn","🍿"],["Nuts","nuts","🥜"],["Yogurt","yogurt","🥣"]], doc: "FD002" },
        { n: "FB10", q: "Which snack flavours do you prefer?", req: false, multi: true, o: [["Sweet","sweet","🍬"],["Salty","salty","🧂"],["Savoury","savoury","🧄"],["Fruity","fruit","🍓"],["Baked","baked","🥖"],["No preference","any","🤷"],["Something else","other","💡"]], other: "other", exclusive: ["any"] },
        { n: "FB07", q: "Which drinks do you have most often?", req: false, multi: true, o: [["Water","water","💧"],["Soft drinks","soft","🥤"],["Fruit juice","juice","🧃"],["Energy drinks","energy","⚡"],["Sports drinks","sports","🏃"],["Tea or coffee","tea","☕"],["Milk drinks","milk","🥛"],["Shakes & mocktails","shakes","🍹"],["Smoothies","smoothies","🔹"]], doc: "FD003" },
        { n: "FB08", q: "How often do you have soft drinks?", req: false, o: [["Daily","daily","🔥"],["Several times a week","often","📆"],["Weekly","weekly","🗓️"],["Occasionally","sometimes","🌙"],["Never","never","🙅"]] },
        { n: "FB09", q: "How often do you have energy drinks?", req: false, o: [["Daily","daily","🔥"],["Several times a week","often","📆"],["Weekly","weekly","🗓️"],["Occasionally","sometimes","🌙"],["Never","never","🙅"]] },
        { n: "FD004", q: "How often do you eat at restaurants?", req: false, o: [["Weekly","weekly","🗓️"],["Monthly","monthly","📅"],["Occasionally","occasionally","🌙"],["Never","never","🙅"],["Prefer not to answer","na","🤐"]], doc: "FD004" },
        { n: "FB03", q: "How often do you order food online?", req: false, o: [["Several times a week","often","🔥"],["Once a week","weekly","🗓️"],["2–3 times a month","biweekly","📆"],["Now and then","sometimes","🌙"],["Never","never","🙅"]], doc: "FD005" },
        { n: "FB04", q: "Which delivery app gets used most?", req: false, when: (a) => a.FB03 && a.FB03 !== 'never', o: [["Swiggy","swiggy","🟠"],["Zomato","zomato","🔴"],["Uber Eats","ubereats","🟢"],["The restaurant’s own app","own","🍴"],["Something else","other","💡"]], other: "other" },
        { n: "FD006", q: "Who chooses your snacks?", req: false, o: [["Me","me","🙋"],["My parent","my-parent","👪"],["We decide together","we-decide-together","🤝"],["Prefer not to answer","na","🤐"]], doc: "FD006" },
        { n: "FD007", q: "What matters most when choosing food?", req: false, multi: true, o: [["Taste","taste","😋"],["Price","price","🏷️"],["Nutrition","nutrition","🥗"],["Family","family","👨‍👩‍👧"],["Friends","friends","🧑‍🤝‍🧑"],["Packaging","packaging","📦"],["Availability","availability","🏪"],["Prefer not to answer","na","🤐"]], exclusive: ["na"], doc: "FD007" },
        { n: "FD008", q: "Do you enjoy trying new foods?", req: false, o: [["Yes","yes","✅"],["Sometimes","sometimes","🌗"],["No","no","🚫"],["Prefer not to answer","na","🤐"]], doc: "FD008" },
        { n: "FB05", q: "What makes you try a new food brand?", req: false, multi: true, o: [["A friend recommended it","friends","🧑‍🤝‍🧑"],["I saw it on social media","social","📱"],["A creator I follow","creator","⭐"],["A discount or offer","offer","🏷️"],["The packaging looked good","packaging","📦"],["A restaurant suggested it","restaurant","🍴"],["Plain curiosity","curiosity","🔍"]] },
        { n: "FB11", q: "Do you have any food preferences or restrictions we should know about for product tests?", help: "Only so we never send you something you cannot eat.", req: false, multi: true, o: [["No, nothing","none","✅"],["Vegetarian","vegetarian","🥦"],["Vegan","vegan","🌱"],["Religious or cultural requirements","religious","🕊️"],["An allergy or intolerance","allergy","⚠️"],["Something else","other","💡"],["Prefer not to say","na","🤐"]], other: "other", exclusive: ["none","na"] },
      ],
    },
  ],
};

// ══════ Fashion · 16 Fashion ══════
const FASHION = {
  id: "minor__fashion",
  owner: "minor",
  name: "Fashion",
  blurb: "What you wear, where it comes from, and who decides.",
  icon: "👟",
  theme: "runway",
  source: "16 Fashion",
  sections: [
    {
      name: "Fashion",
      icon: "👟",
      qs: [
        { n: "FA001", q: "How interested are you in fashion?", req: false, o: [["Very","very","🤩"],["Somewhat","somewhat","🙂"],["Not interested","not-interested","😐"],["Prefer not to answer","na","🤐"]], doc: "FA001" },
        { n: "L09", q: "Which clothing styles are you into?", req: false, multi: true, o: [["Casual wear","casual","👕"],["Sportswear","sports","🏃"],["Formal wear","formal","👔"],["Streetwear","street","🧢"],["Traditional clothing","traditional","🥻"],["Accessories","accessories","💍"],["Outdoor","outdoor","🌳"],["Something else","other","💡"]], other: "other", doc: "FA002" },
        { n: "L12", q: "Which footwear do you prefer?", req: false, multi: true, o: [["Trainers & sports shoes","sports","👟"],["Casual shoes","casual","👞"],["Formal shoes","formal","🥿"],["Sandals","sandals","🩴"],["Boots","boots","🥾"],["No preference","any","🤷"],["Something else","other","💡"]], other: "other", exclusive: ["any"], doc: "FA003" },
        { n: "FA004", q: "Who chooses your clothes?", req: false, o: [["Me","me","🙋"],["My parent","my-parent","👪"],["We decide together","we-decide-together","🤝"],["Prefer not to answer","na","🤐"]], doc: "FA004" },
        { n: "FL02", q: "Where do you shop for it?", req: false, o: [["Online","online","💻"],["In shops","store","🏬"],["Both","both","🔀"],["I rarely shop","rarely","🌙"],["Mall","mall","🔹"],["Local market","local-market","🧺"],["Brand stores","brand-stores","🏷️"],["Department stores","department-stores","🔸"]], multi: true, doc: "FA005" },
        { n: "FA006", q: "What matters most when choosing clothes?", req: false, multi: true, o: [["Comfort","comfort","☁️"],["Style","style","✨"],["Price","price","🏷️"],["Brand","brand","🔹"],["Quality","quality","⭐"],["Durability","durability","🛡️"],["Prefer not to answer","na","🤐"]], exclusive: ["na"], doc: "FA006" },
        { n: "FL01", q: "How often do you shop for fashion?", req: true, o: [["Weekly","weekly","🔥"],["Monthly","monthly","📅"],["Every few months","quarterly","🗓️"],["Rarely or never","rarely","🌙"],["Seasonally","seasonally","🍂"]], doc: "FA007" },
        { n: "FL03", q: "What do you buy most?", req: false, multi: true, o: [["Clothes","clothing","👕"],["Shoes","shoes","👟"],["Accessories","accessories","🧢"],["Beauty & personal care","beauty","🧴"],["All of it","all","✨"]], exclusive: ["all"] },
        { n: "FL05", q: "Does social media shape what you wear?", req: false, o: [["A lot","lot","🔥"],["Somewhat","some","👍"],["A little","little","🤏"],["Not at all","none","➖"]] },
        { n: "FL06", q: "Have you bought something after seeing it on social media?", req: false, o: [["Yes, often","often","🔥"],["Yes, now and then","sometimes","👍"],["No","no","👎"]] },
        { n: "FL07", q: "Which platform shapes your style most?", req: false, when: (a) => a.FL05 && a.FL05 !== 'none', o: [["Instagram","instagram","📸"],["YouTube","youtube","▶️"],["TikTok","tiktok","🎵"],["Pinterest","pinterest","📌"],["Something else","other","💡"],["None","none","⭕"]], other: "other" },
        { n: "FL09", q: "Who has the most influence on what you wear?", req: false, o: [["Me","me","🙋"],["Friends","friends","🧑‍🤝‍🧑"],["Parents & family","family","👨‍👩‍👧"],["Creators","creators","⭐"],["Celebrities","celebs","🌟"]] },
      ],
    },
  ],
};

// ══════ Personal care · 17 Personal care ══════
const CARE = {
  id: "minor__care",
  owner: "minor",
  name: "Personal care",
  blurb: "The everyday products you use and who picks them.",
  icon: "🧴",
  theme: "runway",
  source: "17 Personal care",
  sections: [
    {
      name: "Personal care",
      icon: "🧴",
      qs: [
        { n: "PC001", q: "Which of these do you use?", req: false, multi: true, o: [["Shampoo","shampoo","🧴"],["Conditioner","conditioner","💆"],["Soap","soap","🧼"],["Face wash","face-wash","🫧"],["Moisturiser","moisturiser","💧"],["Sunscreen","sunscreen","🔹"],["Toothpaste","toothpaste","🪥"],["Deodorant","deodorant","🌸"],["None","none","⭕"],["Prefer not to answer","na","🤐"]], exclusive: ["none","na"], doc: "PC001" },
        { n: "L13", q: "Which personal care are you interested in?", req: false, multi: true, o: [["Hair care","hair","💇"],["Skin care","skin","🧴"],["Oral care","oral","🪥"],["Bath & body","bath","🛁"],["Fragrance","fragrance","🌸"],["None","none","⭕"],["Something else","other","💡"]], other: "other", exclusive: ["none"] },
        { n: "PC002", q: "Who chooses your personal care products?", req: false, o: [["Me","me","🙋"],["My parent","my-parent","👪"],["We decide together","we-decide-together","🤝"],["Prefer not to answer","na","🤐"]], doc: "PC002" },
        { n: "PC003", q: "What matters most when choosing them?", req: false, multi: true, o: [["Quality","quality","⭐"],["Comfort","comfort","☁️"],["Fragrance","fragrance","🌸"],["Price","price","🏷️"],["Ingredients","ingredients","🧪"],["Family recommendation","family-recommendation","✨"],["Prefer not to answer","na","🤐"]], exclusive: ["na"], doc: "PC003" },
        { n: "PC004", q: "Do you have favourite brands?", req: false, o: [["Yes","yes","✅"],["No","no","🚫"],["Prefer not to answer","na","🤐"]], doc: "PC004" },
        { n: "PC005", q: "Do you like trying new products?", req: false, o: [["Often","often","🔁"],["Sometimes","sometimes","🌗"],["Rarely","rarely","🌙"],["Never","never","🙅"],["Prefer not to answer","na","🤐"]], doc: "PC005" },
      ],
    },
  ],
};

// ══════ Shopping · 18 Shopping + 20 Household purchase participation ══════
const SHOPPING = {
  id: "minor__shopping",
  owner: "minor",
  name: "Shopping",
  blurb: "What you buy, how you choose, and how much say you get.",
  icon: "🛍️",
  theme: "boutique",
  source: "18 Shopping + 20 Household purchase participation",
  sections: [
    {
      name: "Shopping",
      icon: "🛍️",
      qs: [
        { n: "SH001", q: "Do you help choose the things you get?", req: false, o: [["Always","always","♾️"],["Sometimes","sometimes","🌗"],["Never","never","🙅"],["Prefer not to answer","na","🤐"]], doc: "SH001" },
        { n: "SH01", q: "How often do you go shopping?", req: true, o: [["Several times a week","often","🔥"],["Once a week","weekly","🗓️"],["2–3 times a month","biweekly","📆"],["Once a month","monthly","📅"],["Rarely","rarely","🌙"]] },
        { n: "SH04", q: "What do you shop for most?", req: false, multi: true, o: [["Clothes & fashion","fashion","👕"],["Shoes","shoes","👟"],["Beauty & personal care","beauty","🧴"],["Food & snacks","food","🍫"],["Electronics & gadgets","tech","🎧"],["Gaming things","gaming","🎮"],["Accessories","accessories","🎒"],["Books & stationery","books","📚"],["Snacks","snacks","🔹"],["Games","games","🎲"],["School supplies","school-supplies","✏️"]], doc: "SH002" },
        { n: "SH02", q: "Where do you shop most?", req: false, o: [["Online","online","💻"],["Shopping malls","mall","🏬"],["Local shops","local","🏪"],["Brand stores","brand","🏷️"],["Both online and in person","both","🔀"],["Shopping apps","shopping-apps","🛍️"],["Brand websites","brand-websites","🌐"]], doc: "SH003" },
        { n: "SH03", q: "Which device do you shop on?", req: false, when: (a) => ['online', 'both'].includes(a.SH02), o: [["Smartphone","phone","📱"],["Laptop","laptop","💻"],["Tablet","tablet","📲"],["A family member’s device","family","👨‍👩‍👧"]] },
        { n: "SH07", q: "Which shopping platform do you use most?", req: false, o: [["Amazon","amazon","📦"],["Flipkart","flipkart","🛒"],["Myntra","myntra","👗"],["Meesho","meesho","🧺"],["Shein","shein","👚"],["Brand websites or apps","brand","🏷️"],["Something else","other","💡"],["I don’t shop online","none","🙅"]], other: "other" },
        { n: "SH004", q: "What matters most when choosing?", req: false, multi: true, o: [["Quality","quality","⭐"],["Price","price","🏷️"],["Design","design","🎨"],["Brand","brand","🔹"],["Family","family","👨‍👩‍👧"],["Friends","friends","🧑‍🤝‍🧑"],["Reviews","reviews","🔸"],["Prefer not to answer","na","🤐"]], exclusive: ["na"], doc: "SH004" },
        { n: "SH005", q: "Do you compare products before asking your parents?", req: false, o: [["Often","often","🔁"],["Sometimes","sometimes","🌗"],["Never","never","🙅"],["Prefer not to answer","na","🤐"]], doc: "SH005" },
        { n: "SH006", q: "Branded or non-branded?", req: false, o: [["Branded","branded","🏷️"],["Non-branded","non-branded","📦"],["No preference","no-preference","🤷"],["Prefer not to answer","na","🤐"]], doc: "SH006" },
        { n: "SH007", q: "How often do you go to a mall?", req: false, o: [["Weekly","weekly","🗓️"],["Monthly","monthly","📅"],["Occasionally","occasionally","🌙"],["Never","never","🙅"],["Prefer not to answer","na","🤐"]], doc: "SH007" },
        { n: "SH05", q: "Who usually pays?", req: false, o: [["I pay myself","me","🙋"],["My parents or guardians","parents","🧑‍🍼"],["Other family","family","👨‍👩‍👧"],["A mix of me and family","shared","🤝"]] },
        { n: "SH06", q: "How much say do you get over what you buy?", req: false, o: [["I decide completely","full","👑"],["I decide most of the time","mostly","✅"],["We decide together","shared","🤝"],["My parents decide","parents","🧑‍🍼"]] },
        { n: "HP001_snacks", q: "How involved are you in choosing snacks?", req: false, o: [["Some","some","🌗"],["High","high","⬆️"],["None","none","⭕"],["Not applicable","not-applicable","➖"],["Prefer not to answer","na","🤐"]], by: "both", doc: "HP001" },
        { n: "HP001_entertainment", q: "How involved are you in choosing family entertainment?", req: false, o: [["Some","some","🌗"],["High","high","⬆️"],["None","none","⭕"],["Not applicable","not-applicable","➖"],["Prefer not to answer","na","🤐"]], by: "both", doc: "HP001" },
        { n: "HP001_devices", q: "How involved are you in choosing devices?", req: false, o: [["Some","some","🌗"],["High","high","⬆️"],["None","none","⭕"],["Not applicable","not-applicable","➖"],["Prefer not to answer","na","🤐"]], by: "both", doc: "HP001" },
        { n: "HP001_games", q: "How involved are you in choosing games?", req: false, o: [["Some","some","🌗"],["High","high","⬆️"],["None","none","⭕"],["Not applicable","not-applicable","➖"],["Prefer not to answer","na","🤐"]], by: "both", doc: "HP001" },
        { n: "HP001_clothing", q: "How involved are you in choosing clothing?", req: false, o: [["Some","some","🌗"],["High","high","⬆️"],["None","none","⭕"],["Not applicable","not-applicable","➖"],["Prefer not to answer","na","🤐"]], by: "both", doc: "HP001" },
        { n: "HP001_restaurants", q: "How involved are you in choosing restaurants?", req: false, o: [["Some","some","🌗"],["High","high","⬆️"],["None","none","⭕"],["Not applicable","not-applicable","➖"],["Prefer not to answer","na","🤐"]], by: "both", doc: "HP001" },
        { n: "HP001_holidays", q: "How involved are you in choosing holidays?", req: false, o: [["Some","some","🌗"],["High","high","⬆️"],["None","none","⭕"],["Not applicable","not-applicable","➖"],["Prefer not to answer","na","🤐"]], by: "both", doc: "HP001" },
        { n: "HP001_streaming", q: "How involved are you in choosing streaming subscriptions?", req: false, o: [["Some","some","🌗"],["High","high","⬆️"],["None","none","⭕"],["Not applicable","not-applicable","➖"],["Prefer not to answer","na","🤐"]], by: "both", doc: "HP001" },
      ],
    },
  ],
};

// ══════ Pocket money · 19 Pocket money and financial literacy ══════
const MONEY = {
  id: "minor__money",
  owner: "minor",
  name: "Pocket money",
  blurb: "Pocket money and saving. Only ranges, never account details.",
  icon: "🪙",
  theme: "boutique",
  source: "19 Pocket money and financial literacy",
  sections: [
    {
      name: "Pocket money",
      icon: "🪙",
      qs: [
        { n: "FM001", q: "Do you get pocket money?", req: false, o: [["Regularly","regularly","🔁"],["Occasionally","occasionally","🌙"],["No","no","🚫"],["Prefer not to answer","na","🤐"]], by: "both", doc: "FM001" },
        { n: "FM002", q: "How often?", req: false, o: [["Daily","daily","🔥"],["Weekly","weekly","🗓️"],["Monthly","monthly","📅"],["Occasionally","occasionally","🌙"],["Prefer not to answer","na","🤐"]], when: (a) => a.FM001 && a.FM001 !== 'no', by: "both", doc: "FM002" },
        { n: "FM003", q: "About how much a month?", req: false, o: [["Very little","very-little","🪙"],["A little","a-little","🔹"],["A moderate amount","a-moderate-amount","💰"],["Quite a lot","quite-a-lot","💎"],["Prefer not to answer","na","🤐"]], when: (a) => a.FM001 && a.FM001 !== 'no', by: "both", doc: "FM003", note: "doc: localized currency bands; relative bands until the local bands exist" },
        { n: "FM004", q: "What do you spend it on?", req: false, multi: true, o: [["Snacks","snacks","🍫"],["Books","books","📚"],["Games","games","🎲"],["Clothing","clothing","👕"],["Hobbies","hobbies","🎨"],["Gifts","gifts","🎁"],["Savings","savings","🐷"],["Prefer not to answer","na","🤐"]], exclusive: ["na"], when: (a) => a.FM001 && a.FM001 !== 'no', doc: "FM004" },
        { n: "FM005", q: "Do you save some of it?", req: false, o: [["Regularly","regularly","🔁"],["Sometimes","sometimes","🌗"],["Never","never","🙅"],["Prefer not to answer","na","🤐"]], when: (a) => a.FM001 && a.FM001 !== 'no', doc: "FM005" },
        { n: "FM006", q: "Where did you learn about budgeting?", req: false, o: [["At home","at-home","🏠"],["At school","at-school","🏫"],["Both","both","🔀"],["I haven’t yet","i-havent-yet","🔹"],["Prefer not to answer","na","🤐"]], doc: "FM006" },
        { n: "FM007", q: "How do you pay for things?", req: false, multi: true, o: [["Cash","cash","💵"],["A card my parent manages","a-card-my-parent-manages","👪"],["A digital payment my parent approved","a-digital-payment-my-parent-approved","📲"],["My parent pays","my-parent-pays","🔹"],["Prefer not to answer","na","🤐"]], exclusive: ["na"], by: "both", doc: "FM007" },
      ],
    },
  ],
};

// ══════ AI & new tech · 21 AI and emerging technology ══════
const TECH = {
  id: "minor__tech",
  owner: "minor",
  name: "AI & new tech",
  blurb: "The apps you keep open and the tech you find interesting.",
  icon: "🤖",
  theme: "future",
  source: "21 AI and emerging technology",
  sections: [
    {
      name: "AI & new tech",
      icon: "🤖",
      qs: [
        { n: "X08", q: "Which kinds of app do you use most?", req: true, multi: true, o: [["Social media","social","💬"],["Messaging","messaging","✉️"],["Gaming","gaming","🎮"],["Streaming","streaming","📺"],["Shopping","shopping","🛒"],["Study & education","education","🎓"],["Money & payments","finance","💳"],["AI tools","ai","🤖"],["Fitness & health","fitness","🏃"],["Something else","other","💡"]], other: "other" },
        { n: "X01", q: "Which technology do you use?", req: false, multi: true, o: [["Smartphones","phones","📱"],["Computers","computers","💻"],["Wearables","wearables","⌚"],["Smart home devices","smarthome","🏠"],["Robotics","robotics","🦾"],["AI","ai","🤖"],["Virtual reality","vr","🥽"],["Creative software","creative","🎨"],["Something else","other","💡"]], other: "other" },
        { n: "AI001", q: "Have you heard of AI?", req: false, o: [["Yes","yes","✅"],["No","no","🚫"],["Not sure","not-sure","🤔"],["Prefer not to answer","na","🤐"]], doc: "AI001" },
        { n: "AI002", q: "Have you used AI tools?", req: false, o: [["Yes","yes","✅"],["No","no","🚫"],["Not sure","not-sure","🤔"],["Prefer not to answer","na","🤐"]], doc: "AI002" },
        { n: "X04", q: "What have you used AI tools for?", req: false, multi: true, when: (a) => a.TA03 && a.TA03 !== 'never', o: [["Learning something","learning","🧠"],["Help with writing","writing","✍️"],["Creative work","creative","🎨"],["Translation","translation","🌍"],["Entertainment","fun","🍿"],["Coding","coding","💻"],["General questions","questions","❓"],["Homework help","homework-help","📓"],["Language learning","language-learning","🌱"],["Something else","other","💡"],["Not applicable","na","➖"]], other: "other", exclusive: ["na"], doc: "AI003" },
        { n: "AI004", q: "Which AI tools have you used?", req: false, multi: true, o: [["ChatGPT","chatgpt","🤖"],["Gemini","gemini","♊"],["Copilot","copilot","🧑‍✈️"],["Educational AI","educational-ai","🎓"],["Other","other","✨"],["None","none","⭕"],["Prefer not to answer","na","🤐"]], exclusive: ["none","na"], other: "other", when: (a) => a.AI002 === 'yes', doc: "AI004" },
        { n: "TA03", q: "How often do you use AI tools like ChatGPT or Gemini?", req: false, o: [["Daily","daily","🔥"],["Several times a week","often","📆"],["Weekly","weekly","🗓️"],["Occasionally","sometimes","🌙"],["Never","never","🙅"],["Monthly","monthly","📅"],["Rarely","rarely","🔹"]], doc: "AI005" },
        { n: "AI006", q: "Are you interested in coding?", req: false, o: [["Yes","yes","✅"],["Maybe","maybe","🤔"],["No","no","🚫"],["Prefer not to answer","na","🤐"]], doc: "AI006" },
        { n: "AI007", q: "Have you used VR?", req: false, o: [["Yes","yes","✅"],["No","no","🚫"],["Prefer not to answer","na","🤐"]], doc: "AI007" },
        { n: "TA04", q: "Which new technology interests you most?", req: false, multi: true, o: [["AI","ai","🤖"],["VR & AR","vr","🥽"],["Smart devices & wearables","wearables","⌚"],["Robotics","robotics","🦾"],["Electric vehicles","ev","🔋"],["Gaming tech","gaming","🎮"],["Space","space","🚀"],["Renewable energy","renewable-energy","☀️"],["Something else","other","💡"],["None of it","none","⭕"]], other: "other", exclusive: ["none"], doc: "AI008" },
      ],
    },
  ],
};

// ══════ Future & careers · 22 Career aspirations ══════
const CAREERS = {
  id: "minor__careers",
  owner: "minor",
  name: "Future & careers",
  blurb: "What you might want to do one day. No wrong answers.",
  icon: "🚀",
  theme: "future",
  source: "22 Career aspirations",
  sections: [
    {
      name: "Future & careers",
      icon: "🚀",
      qs: [
        { n: "CA001", q: "Which careers interest you?", req: false, multi: true, o: [["Technology","technology","💡"],["Engineering","engineering","⚙️"],["Medicine","medicine","🩺"],["Science","science","🔬"],["Business","business","🚀"],["Arts","arts","🎨"],["Sports","sports","⚽"],["Education","education","📚"],["Media","media","📺"],["Law","law","⚖️"],["Public services","public-services","🏛️"],["Not decided yet","not-decided-yet","🤔"],["Other","other","✨"],["Prefer not to answer","na","🤐"]], exclusive: ["na"], other: "other", doc: "CA001" },
        { n: "CA002", q: "Are you interested in starting your own business one day?", req: false, o: [["Yes","yes","✅"],["Maybe","maybe","🤔"],["No","no","🚫"],["Prefer not to answer","na","🤐"]], doc: "CA002" },
        { n: "CA003", q: "Would you consider studying abroad?", req: false, o: [["Yes","yes","✅"],["Maybe","maybe","🤔"],["No","no","🚫"],["Prefer not to answer","na","🤐"]], doc: "CA003" },
        { n: "CA004", q: "Which skills would you like to learn?", req: false, multi: true, o: [["Coding","coding","👩‍💻"],["Communication","communication","💬"],["Design","design","🎨"],["Leadership","leadership","🧭"],["Money skills","money-skills","💰"],["Languages","languages","🗣️"],["Creative writing","creative-writing","✍️"],["Prefer not to answer","na","🤐"]], exclusive: ["na"], doc: "CA004" },
        { n: "CA005", q: "What influences your career ideas?", req: false, multi: true, o: [["My own interests","my-own-interests","💡"],["Family","family","👨‍👩‍👧"],["Teachers","teachers","👩‍🏫"],["Friends","friends","🧑‍🤝‍🧑"],["Career events","career-events","🎪"],["Online content","online-content","📲"],["Prefer not to answer","na","🤐"]], exclusive: ["na"], doc: "CA005" },
        { n: "CA006", q: "What kind of work would you like?", req: false, o: [["A job with an employer","a-job-with-an-employer","💼"],["Working for myself","working-for-myself","🧑‍💻"],["Research","research","🔬"],["Creative work","creative-work","🎨"],["Not decided yet","not-decided-yet","🤔"],["Prefer not to answer","na","🤐"]], doc: "CA006" },
      ],
    },
  ],
};

// ══════ Environment · 23 Environment ══════
const ENVIRONMENT = {
  id: "minor__environment",
  owner: "minor",
  name: "Environment",
  blurb: "What you think and do about the planet.",
  icon: "🌍",
  theme: "atlas",
  source: "23 Environment",
  sections: [
    {
      name: "Environment",
      icon: "🌍",
      qs: [
        { n: "EV001", q: "How interested are you in the environment?", req: false, o: [["Very","very","🤩"],["Somewhat","somewhat","🙂"],["Not interested","not-interested","😐"],["Prefer not to answer","na","🤐"]], doc: "EV001" },
        { n: "EV002", q: "Which of these do you do?", req: false, multi: true, o: [["Recycling","recycling","♻️"],["Saving water","saving-water","💧"],["Saving electricity","saving-electricity","💡"],["Gardening","gardening","🌱"],["Using less plastic","using-less-plastic","🧴"],["None","none","⭕"],["Prefer not to answer","na","🤐"]], exclusive: ["none","na"], doc: "EV002" },
        { n: "EV003", q: "Does your school run environmental activities?", req: false, o: [["Yes","yes","✅"],["No","no","🚫"],["Prefer not to answer","na","🤐"]], doc: "EV003" },
        { n: "EV004", q: "Do you think about the environment when choosing products?", req: false, o: [["Often","often","🔁"],["Sometimes","sometimes","🌗"],["Never","never","🙅"],["Prefer not to answer","na","🤐"]], doc: "EV004" },
        { n: "EV005", q: "Which environmental topics interest you?", req: false, multi: true, o: [["Wildlife","wildlife","🦊"],["Oceans","oceans","🌊"],["Renewable energy","renewable-energy","☀️"],["Recycling","recycling","♻️"],["Climate science","climate-science","🔬"],["Forests","forests","🌲"],["Prefer not to answer","na","🤐"]], exclusive: ["na"], doc: "EV005" },
      ],
    },
  ],
};

// ══════ Travel · 24 Travel ══════
const TRAVEL = {
  id: "minor__travel",
  owner: "minor",
  name: "Travel",
  blurb: "Family holidays and how you get there.",
  icon: "✈️",
  theme: "atlas",
  source: "24 Travel",
  sections: [
    {
      name: "Travel",
      icon: "✈️",
      qs: [
        { n: "TR001", q: "How often does your family go on holiday?", req: false, o: [["Several times a year","several-times-a-year","📆"],["Once a year","once-a-year","📅"],["Occasionally","occasionally","🌙"],["Never","never","🙅"],["Prefer not to answer","na","🤐"]], by: "both", doc: "TR001" },
        { n: "TR002", q: "Which holidays do you like?", req: false, multi: true, o: [["Beaches","beaches","🏖️"],["Mountains","mountains","🏔️"],["Cities","cities","🏙️"],["Theme parks","theme-parks","🎢"],["Nature","nature","🌿"],["Cultural places","cultural-places","🏛️"],["Prefer not to answer","na","🤐"]], exclusive: ["na"], doc: "TR002" },
        { n: "TR003", q: "How do you travel on holiday?", req: false, multi: true, o: [["Car","car","🚗"],["Bus","bus","🚌"],["Train","train","🚆"],["Airplane","airplane","✈️"],["Boat","boat","⛴️"],["Prefer not to answer","na","🤐"]], exclusive: ["na"], by: "both", doc: "TR003" },
        { n: "TR004", q: "Do you help choose where to go?", req: false, o: [["Often","often","🔁"],["Sometimes","sometimes","🌗"],["Never","never","🙅"],["Prefer not to answer","na","🤐"]], doc: "TR004" },
        { n: "TR005", q: "Have you travelled abroad with your family?", req: false, o: [["Yes","yes","✅"],["No","no","🚫"],["Prefer not to answer","na","🤐"]], by: "both", doc: "TR005" },
      ],
    },
  ],
};

// ══════ Reading & learning · 25 Reading + 26 Languages ══════
const READING = {
  id: "minor__reading",
  owner: "minor",
  name: "Reading & learning",
  blurb: "Books, apps and languages.",
  icon: "📚",
  theme: "campus",
  source: "25 Reading + 26 Languages",
  sections: [
    {
      name: "Reading & learning",
      icon: "📚",
      qs: [
        { n: "RL001", q: "How often do you read outside school?", req: false, o: [["Daily","daily","🔥"],["Weekly","weekly","🗓️"],["Monthly","monthly","📅"],["Rarely","rarely","🌙"],["Never","never","🙅"],["Prefer not to answer","na","🤐"]], doc: "RL001" },
        { n: "RL002", q: "What do you read?", req: false, multi: true, o: [["Printed books","printed-books","📖"],["E-books","e-books","📱"],["Comics","comics","💥"],["Audiobooks","audiobooks","🎧"],["Magazines","magazines","📰"],["Prefer not to answer","na","🤐"]], exclusive: ["na"], doc: "RL002" },
        { n: "RL003", q: "Which genres do you read?", req: false, multi: true, o: [["Fantasy","fantasy","🐉"],["Adventure","adventure","🧭"],["Science","science","🔬"],["History","history","🏺"],["Mystery","mystery","🕵️"],["Biography","biography","👤"],["Graphic novels","graphic-novels","🖍️"],["Prefer not to answer","na","🤐"]], exclusive: ["na"], doc: "RL003" },
        { n: "RL004", q: "How often do you use learning apps?", req: false, o: [["Regularly","regularly","🔁"],["Occasionally","occasionally","🌙"],["Never","never","🙅"],["Prefer not to answer","na","🤐"]], doc: "RL004" },
        { n: "RL005", q: "Do you take online courses?", req: false, o: [["Regularly","regularly","🔁"],["Occasionally","occasionally","🌙"],["Never","never","🙅"],["Prefer not to answer","na","🤐"]], doc: "RL005" },
        { n: "RL006", q: "Are you learning another language?", req: false, o: [["Yes","yes","✅"],["No","no","🚫"],["Planning to","planning-to","🗓️"],["Prefer not to answer","na","🤐"]], doc: "RL006" },
        { n: "LG001", q: "Which languages do you understand?", req: false, kind: "language", multi: true, by: "both", doc: "LG001" },
        { n: "LG002", q: "Which languages can you read comfortably?", req: false, kind: "language", multi: true, by: "both", doc: "LG002" },
        { n: "LG004", q: "How comfortable are you answering surveys in English?", req: false, o: [["Very","very","🤩"],["Somewhat","somewhat","🙂"],["Not comfortable","not-comfortable","😟"],["Prefer not to answer","na","🤐"]], by: "both", doc: "LG004" },
      ],
    },
  ],
};

// ══════ Taking part · 27 Accessibility + 28 Research preferences ══════
const RESEARCH = {
  id: "minor__research",
  owner: "minor",
  name: "Taking part",
  blurb: "What kind of research you are up for, and what makes surveys easier.",
  icon: "🔬",
  theme: "lab",
  source: "27 Accessibility + 28 Research preferences",
  sections: [
    {
      name: "Taking part",
      icon: "🔬",
      qs: [
        { n: "T006", q: "Would you like to take part in research?", req: false, o: [["Yes","yes","✅"],["No","no","🚫"],["Not sure","not-sure","🤔"],["Prefer not to answer","na","🤐"]], doc: "T006" },
        { n: "R01", q: "Which kinds of research would you be comfortable with?", req: true, multi: true, o: [["Online surveys","surveys","📝"],["Online interviews","interviews","🎙️"],["Group discussions","groups","👥"],["Product testing","products","📦"],["Diary studies","diary","📔"],["Usability testing","usability","🖱️"],["None at the moment","none","⭕"]], exclusive: ["none"] },
        { n: "A19", q: "Which topics would you like to be invited to?", req: true, multi: true, o: [["Technology","tech","📱"],["Entertainment","entertainment","🍿"],["Food & drink","food","🍕"],["Clothes & fashion","fashion","👕"],["Education","education","🎓"],["Gaming","gaming","🎮"],["Travel","travel","✈️"],["The environment","environment","🌍"],["Sport","sport","⚽"],["Household products","household","🧽"],["No preference — send me anything","any","🤷"],["Hobbies","hobbies","🎨"]], exclusive: ["any"], doc: "RP001" },
        { n: "R02", q: "How long should a survey be, ideally?", req: true, o: [["1–5 minutes","1-5","⚡"],["6–10 minutes","6-10","🕐"],["11–15 minutes","11-15","🕑"],["16–20 minutes","16-20","🕓"],["More than 20 minutes","20+","🕘"]], doc: "RP002" },
        { n: "R04", q: "Which days usually work?", req: false, multi: true, when: (a) => a.R03 !== 'none', o: [["Weekdays","weekdays","🗓️"],["Weekends","weekends","🎉"],["School holidays","holidays","🏖️"],["It varies","varies","🔀"],["Prefer not to say","na","🤐"]], exclusive: ["varies","na"], doc: "RP003" },
        { n: "R05", q: "What time of day works best?", req: false, multi: true, when: (a) => a.R03 !== 'none', o: [["Morning","morning","🌅"],["Afternoon","afternoon","☀️"],["Evening","evening","🌆"],["Weekends","weekends","🎉"],["School holidays","holidays","🏖️"],["It varies","varies","🔀"]], exclusive: ["varies"], doc: "RP004" },
        { n: "R08", q: "Would you test a digital product — an app or a website?", req: false, o: [["Yes","yes","✅"],["No","no","🚫"],["Maybe","maybe","🤔"]], doc: "RP005" },
        { n: "R07", q: "Would you join an online group discussion with other teens?", req: false, o: [["Yes","yes","✅"],["No","no","🚫"],["Maybe","maybe","🤔"]], doc: "RP006" },
        { n: "RP007", q: "Would you take part in follow-up research?", req: false, o: [["Yes","yes","✅"],["Maybe","maybe","🤔"],["No","no","🚫"],["Prefer not to answer","na","🤐"]], doc: "RP007" },
        { n: "RP008", q: "Should invitations come through your parent or guardian?", req: false, o: [["Yes","yes","✅"],["No","no","🚫"],["Prefer not to answer","na","🤐"]], by: "both", doc: "RP008" },
        { n: "R09", q: "Would you test a physical product sent to your home?", req: false, o: [["Yes","yes","✅"],["No","no","🚫"],["Depends what it is","depends","🤔"]] },
        { n: "R10", q: "Would you take part in a study that records audio?", help: "Your parent or guardian is asked separately every time.", req: false, o: [["Yes","yes","🎙️"],["No","no","🚫"],["Depends on the study","depends","🤔"]] },
        { n: "R11", q: "Would you take part in a study that records video?", help: "Your parent or guardian is asked separately every time.", req: false, o: [["Yes","yes","🎬"],["No","no","🚫"],["Depends on the study","depends","🤔"]] },
        { n: "R15", q: "Are you happy to answer a few screening questions before a study?", req: false, o: [["Yes","yes","✅"],["No","no","🚫"],["Depends on the study","depends","🤔"]] },
        { n: "R03", q: "How often would you like invitations?", req: true, o: [["Once a week","weekly","📬"],["2–3 times a month","biweekly","📆"],["Once a month","monthly","📅"],["Only topics I’ve picked","selected","🎯"],["None for now","none","🔕"]] },
        { n: "R06", q: "Which language would you want an interview in?", kind: "language", req: false, when: (a) => Array.isArray(a.R01) && (a.R01.includes('interviews') || a.R01.includes('groups')) },
        { n: "R12", q: "Would you like invitations for brand-new research topics?", req: false, o: [["Yes","yes","✅"],["No","no","🚫"]] },
        { n: "AC001", q: "Which of these would make surveys easier for you?", req: false, multi: true, o: [["Larger text","larger-text","🔠"],["Audio instructions","audio-instructions","🎧"],["Simpler language","simpler-language","🗣️"],["Captions","captions","💬"],["Keyboard navigation","keyboard-navigation","⌨️"],["More time","more-time","⏳"],["None","none","⭕"],["Prefer not to answer","na","🤐"]], exclusive: ["none","na"], doc: "AC001" },
        { n: "AC002", q: "Which survey format do you prefer?", req: false, multi: true, o: [["Text","text","📝"],["Images","images","🖼️"],["Audio","audio","🎧"],["Video","video","🎬"],["Interactive questions","interactive-questions","🕹️"],["Prefer not to answer","na","🤐"]], exclusive: ["na"], doc: "AC002" },
        { n: "AC003", q: "Do you prefer shorter surveys?", req: false, o: [["Yes","yes","✅"],["No preference","no-preference","🤷"],["Prefer not to answer","na","🤐"]], doc: "AC003" },
        { n: "AC004", q: "Would you like to be able to take breaks?", req: false, o: [["Yes","yes","✅"],["No preference","no-preference","🤷"],["Prefer not to answer","na","🤐"]], doc: "AC004" },
        { n: "A20", q: "How often should we ask you to refresh your profile?", req: true, o: [["Every 3 months","3m","🗓️"],["Every 6 months","6m","📆"],["Once a year","12m","📅"],["Only when you prompt me","prompted","🔔"]] },
        { n: "A21", q: "Is there anything you wish we would ask teenagers about?", help: "Totally optional, and there is no wrong answer. One line is plenty.", kind: "textarea", icon: "💭", req: false, maxLength: 400, ph: "Something nobody seems to ask about…" },
      ],
    },
  ],
};

export const MINOR_PROFILES = [
  BASIC, EDUCATION, HOUSEHOLD, FAMILY, DEVICES, INTERNET, SOCIAL, GAMING, ENTERTAINMENT, MUSIC, SPORTS, HOBBIES, FOOD, FASHION, CARE, SHOPPING, MONEY, TECH, CAREERS, ENVIRONMENT, TRAVEL, READING, RESEARCH,
];
export default MINOR_PROFILES;
