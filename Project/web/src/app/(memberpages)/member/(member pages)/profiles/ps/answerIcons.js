
import { emojiUrl, assetUrl, flagUrl } from './assets.js';
import { COUNTRY_CC } from './countryNames.js';

/* ---------- 1. flags ---------- */
// currency code -> country (EUR uses the EU flag)
const CUR_CC = { INR: 'IN', USD: 'US', EUR: 'EU', GBP: 'GB', CNY: 'CN', JPY: 'JP', CAD: 'CA', AUD: 'AU', AED: 'AE', SAR: 'SA', SGD: 'SG', MYR: 'MY', IDR: 'ID', PHP: 'PH', THB: 'TH', VND: 'VN', KRW: 'KR', BRL: 'BR', MXN: 'MX', ZAR: 'ZA', NGN: 'NG', KES: 'KE', PKR: 'PK', BDT: 'BD', TRY: 'TR', RUB: 'RU', CHF: 'CH', SEK: 'SE', PLN: 'PL', NZD: 'NZ', HKD: 'HK', TWD: 'TW', EGP: 'EG', QAR: 'QA', KWD: 'KW', NOK: 'NO', DKK: 'DK', ILS: 'IL', ARS: 'AR', CLP: 'CL', COP: 'CO', LKR: 'LK', NPR: 'NP' };
// language / nationality / ethnicity words -> country flag
let DEMONYM; const DEMONYM_SRC = () => [
  ['english|british|scottish|welsh|cymraeg', 'GB'], ['american(?! (indian|samoa))|united states', 'US'], ['hindi|(?<!american )indian(?! ocean)|marathi|gujarati|punjabi|bengali(?!.*bangla)|tamil|telugu|kannada|malayalam|odia|assamese|konkani|sindhi', 'IN'],
  ['chinese|mandarin|cantonese|简体|繁體', 'CN'], ['japanese|日本', 'JP'], ['korean|한국', 'KR'], ['german|deutsch', 'DE'], ['french|français', 'FR'], ['spanish|español|hispanic|latino|latina', 'ES'],
  ['portuguese|português', 'PT'], ['brazilian', 'BR'], ['italian|italiano', 'IT'], ['dutch|nederlands', 'NL'], ['russian|русский', 'RU'], ['ukrainian|українська', 'UA'], ['polish|polski', 'PL'],
  ['arabic|العربية|arab\\b', 'SA'], ['persian|farsi|فارسی|iranian', 'IR'], ['urdu|اردو|pakistani', 'PK'], ['turkish|türkçe', 'TR'], ['hebrew|עברית|israeli|jewish', 'IL'], ['greek|ελληνικά', 'GR'],
  ['vietnamese|tiếng việt', 'VN'], ['thai|ไทย', 'TH'], ['indonesian|bahasa indonesia|javanese|jawa', 'ID'], ['malay|melayu|malaysian', 'MY'], ['filipino|tagalog', 'PH'], ['swahili|kiswahili|kenyan', 'KE'],
  ['bangladeshi|bangla|বাংলা', 'BD'], ['nepali|नेपाली', 'NP'], ['sinhala|sri lankan|සිංහල', 'LK'], ['burmese|myanmar|မြန်မာ', 'MM'], ['khmer|cambodian', 'KH'], ['lao\\b|ລາວ', 'LA'], ['mongolian|монгол', 'MN'],
  ['georgian|ქართული', 'GE'], ['armenian|հայերեն', 'AM'], ['kazakh|қазақ', 'KZ'], ['uzbek', 'UZ'], ['kyrgyz', 'KG'], ['tajik', 'TJ'], ['turkmen', 'TM'], ['azerbaijani|azərbaycan', 'AZ'],
  ['amharic|አማርኛ|ethiopian', 'ET'], ['somali|soomaali', 'SO'], ['yoruba|yorùbá|igbo|hausa|nigerian', 'NG'], ['zulu|xhosa|afrikaans|south african', 'ZA'], ['kinyarwanda|rwandan', 'RW'], ['malagasy', 'MG'],
  ['swedish|svenska', 'SE'], ['norwegian|norsk', 'NO'], ['danish|dansk', 'DK'], ['finnish|suomi', 'FI'], ['icelandic|íslenska', 'IS'], ['irish|gaeilge', 'IE'], ['estonian|eesti', 'EE'], ['latvian|latviešu', 'LV'],
  ['lithuanian|lietuvių', 'LT'], ['czech|čeština', 'CZ'], ['slovak|slovenčina', 'SK'], ['slovenian|slovenščina', 'SI'], ['hungarian|magyar', 'HU'], ['romanian|română', 'RO'], ['bulgarian|български', 'BG'],
  ['serbian|српски', 'RS'], ['croatian|hrvatski', 'HR'], ['bosnian|bosanski|bosniak', 'BA'], ['albanian|shqip', 'AL'], ['macedonian|македонски', 'MK'], ['belarusian|беларуская', 'BY'], ['maltese|malti', 'MT'],
  ['catalan|català|basque|euskara', 'ES'], ['maori|māori', 'NZ'], ['kurdish|kurdî', 'IQ'], ['pashto|پښتو|afghan', 'AF'], ['uyghur|ئۇيغۇرچە', 'CN'], ['mexican', 'MX'], ['canadian', 'CA'], ['australian', 'AU'],
  ['egyptian', 'EG'], ['moroccan', 'MA'], ['algerian', 'DZ'], ['tunisian', 'TN'], ['ghanaian', 'GH'], ['jamaican', 'JM'], ['haitian', 'HT'], ['cuban', 'CU'], ['colombian', 'CO'], ['peruvian', 'PE'],
  ['argentin', 'AR'], ['chilean', 'CL'], ['venezuelan', 'VE'], ['saudi', 'SA'], ['emirati', 'AE'], ['lebanese', 'LB'], ['syrian', 'SY'], ['iraqi', 'IQ'], ['jordanian', 'JO'], ['palestinian', 'PS'], ['yemeni', 'YE'],
  ['cape verdean', 'CV'], ['roma\\b|rusyn', 'EU'], ['native hawaiian|hawaiian', 'US'], ['samoan', 'WS'], ['tongan', 'TO'], ['fijian', 'FJ'], ['guamanian|chamorro', 'GU'], ['taiwanese', 'TW'], ['singaporean', 'SG']
].map(([re, cc]) => [new RegExp('(?:^|[^\\p{L}])(?:' + re + ')', 'iu'), cc]);

// ethnicity groups without a single country (only for ethnicity / origin questions)
let ETHNIC; const ETHNIC_SRC = () => [
  ['american indian|alaska native|indigenous|aboriginal|first nations|native american', '🪶'], ['pacific islander|polynesian|melanesian|micronesian|native hawaiian', '🌺'], ['mixed|multiracial|biracial|two or more', '🌈'],
  ['black|african american|afro', '🌍'], ['middle eastern|north african|mena', '🌍'],
  ['white|caucasian|european', '🌍'], ['african(?! republic)', '🌍'], ['latin', '🌎'], ['asian', '🌏']
].map(([re, e]) => [new RegExp('(?:^|[^\\p{L}])(?:' + re + ')', 'iu'), e]);

/* ---------- 2. answer scales (checked on the whole label) ---------- */
const SCALES = [
  [/^(no specific|no preference|no particular|no favou?rite|i have no (specific|particular|preference))/i, '🎲'],
  [/^(currently (use|using|own|have)|current user)/i, '✅'],
  [/^not an? /i, '🚫'],
  [/^(don'?t|do not|can'?t|cannot) remember/i, '🤷'], [/^once or twice/i, '☝️'], [/^(occasional|as-needed|as needed)\b/i, '🌤️'], [/^seasonal/i, '🍂'],
  [/^i (usually |generally |normally |often )?(do not|don'?t|don’t)\b/i, '❌'],
  [/^(prefer not|rather not|decline to answer|i'?d rather not)/i, '🤐'],
  [/^(not sure|unsure|don'?t know|don’t know|do not know|no idea|can'?t say|not certain)/i, '🤷'],
  [/^(definitely|absolutely|certainly) (yes|would|will|interested)|^yes,? definitely/i, '💯'],
  [/^(probably|likely) (yes|would|will)|^yes,? probably/i, '👍'],
  [/^(probably|likely) (no|not|won)/i, '👎'],
  [/^(definitely|absolutely|certainly) (no|not|won)/i, '🙅'],
  [/^(maybe|perhaps|possibly|might)\b/i, '🤔'],
  [/^(very|extremely|highly) unlikely/i, '😣'], [/^(somewhat|fairly|slightly) unlikely/i, '😕'], [/^neither/i, '😐'],
  [/^(extremely|completely|totally) (interested|likely|satisfied|important|confident|familiar)/i, '🤩'],
  [/^very (interested|likely|satisfied|important|confident|familiar|unlikely)/i, '😃'],
  [/^(somewhat|moderately|fairly) /i, '🙂'],
  [/^(slightly|a little|not very) /i, '😐'],
  [/^not (at all|interested|likely|important|satisfied|familiar)/i, '😶'],
  [/^(several|multiple|many) times (a|per) day|^hourly|^all day|^constantly/i, '🔥'],
  [/^(daily|every ?day|once a day|almost every day|nearly every day|most days)\b/i, '☀️'],
  [/^(several|a few|2-3|2–3|3-4|3–4) times (a|per) week|^most weeks/i, '📆'],
  [/^(weekly|once a week|every week|once per week)\b/i, '🗓️'],
  [/^(bi-?weekly|fortnightly|every (2|two) weeks|every 2[-–]3 weeks|(2|two|a few|2-3|2–3) times (a|per) month)/i, '📋'],
  [/^(monthly|once a month|every month)\b/i, '🌙'],
  [/^(every (2|3|2[-–]3) months|quarterly|every few months)/i, '🍂'],
  [/^((a )?few times a year|once a year|yearly|annually|twice a year|every year)/i, '🎆'],
  [/^(occasionally|sometimes|now and then|once in a while|from time to time)\b/i, '🌤️'],
  [/^(rarely|seldom|less often|hardly ever|almost never)\b/i, '🐢'],
  [/^(never|not at all)\b/i, '🚫'],
  [/^(as available|whenever|any ?time|flexible|no preference)\b/i, '🎲'],
  [/^(previously|used to|in the past|formerly|former\b|ex-?user|(played|used|owned|watched) in the past|used previously)/i, '⏮️'],
  [/^(planning|plan to|intend|considering|thinking of|interested but)/i, '🧭'],
  [/^yes,? (occasionally|sometimes|part[- ]time|a little)/i, '👌'],
  [/^yes,? (once|tried)|^tried once/i, '☝️'],
  [/^yes,? (regularly|actively|frequently|full[- ]time|daily|currently)/i, '🔁'],
  [/^i (have never|have not|haven'?t|am not|do not|don'?t|don’t|did not|didn'?t|never)\b/i, '❌'],
  [/^(yes\b|y$|true$|i do\b|i have\b|i am\b|i own\b|i use\b|agree\b|strongly agree)/i, '✅'],
  [/^(no\b|n$|false$|i don'?t|i do not|i don’t|i have not|i haven'?t|i am not|disagree|strongly disagree)/i, '❌'],
  [/^(none|none of (the|these)( above)?|nothing|nobody|no one|not applicable|n\/a|not involved|not working|no specific|no loans|no plans|no computer|no restrictions|no personal)/i, '🚫'],
  [/^(other|others|something else|anything else|another)\b/i, '✨'],
  [/^(both|all of (the|these)( above)?|mix of|a mix)/i, '🔀']
];

/* social platforms keep their picture even in brand lists */
let SOCIAL; const SOCIAL_SRC = () => [
  ['youtube', '🎬'], ['tiktok|douyin', '🎵'], ['facebook', '👍'], ['instagram', '📸'], ['^x$|^x \\(|twitter', '🐦'], ['linkedin', '💼'], ['snapchat', '👻'], ['pinterest', '📌'], ['reddit', '👽'],
  ['whatsapp|telegram|wechat|line\\b|viber|signal\\b|messenger', '💬'], ['twitch|kick\\b', '🔴'], ['blogs?\\b|websites?', '🌐'], ['podcast', '🎙️']
].map(([re, e]) => [new RegExp('(?:^|[^\\p{L}])(?:' + re + ')', 'iu'), e]);

/* job titles and departments (16,000+ titles): matched on the title's own keywords, then 💼 */
let JOB; const JOB_SRC = () => [
  ['sergeant|admiral|army|navy|naval|soldier|military|corporal|lieutenant|colonel|general\\b|major\\b|brigadier|commander|havaldar|subedar|marine corps|air force|airman|petty officer|warrant officer|gunnery|infantry|cadet', '🎖️'],
  ['police|sheriff|constable|detective|law enforcement|security officer|security guard|guard\\b|bailiff|marshal|patrol|correctional|prison|warden', '👮'], ['firefight|fire fighter|fireman|fire officer|rescue', '🧑‍🚒'],
  ['judge|magistrate|justice|lawyer|attorney|advocate|solicitor|barrister|paralegal|legal|counsel\\b|notary|mediator|arbitrator|compliance', '⚖️'],
  ['doctor|physician|surgeon|dentist|nurse|pharmacist|therapist|medical|clinical|health|hospital|caregiver|paramedic|radiolog|patholog|veterinar|optic|optometr|midwife|dietitian|nutrition|acupunct|chiropract|psychiatr|[a-z]*ologist\\b', '🧑‍⚕️'],
  ['teacher|teaching|professor|lecturer|tutor|instructor|principal|educat|faculty|school|academic|dean\\b|librarian', '🧑‍🏫'], ['scientist|chemist|biologist|physicist|laborator|lab\\b|research', '🧑‍🔬'],
  ['software|developer|programmer|coder|devops|sysadmin|network|it\\b|data\\b|cloud|cyber|web\\b|computer|systems analyst|database|engineer.*(software|systems|data)', '🧑‍💻'], ['analyst|analytics|statistic|actuar', '📊'],
  ['accountant|accounting|finance|financial|banker|banking|auditors?\\b|audit\\b|tax\\b|treasur|investment|trader|broker|credit|loan|insurance|underwrit|claims|payroll|cashier|teller|bookkeep|controller', '🧮'],
  ['designer|design|ux\\b|ui\\b|graphic|creative|artist|illustrat|animator|art\\b|photographer|videograph', '🎨'], ['writer|editor|author|journalist|reporter|copywrit|content|translator|interpreter|publisher', '✍️'],
  ['actor|actress|musician|singer|dancer|producer|director of photography|film|tv\\b|broadcast|media|entertainment|dj\\b|presenter|anchor', '🎬'], ['game|gaming', '🎮'],
  ['chef|cook|baker|kitchen|culinary|barista|bartender|waiter|waitress|catering|food service|cafeteria|restaurant', '🧑‍🍳'], ['farmer|farm|agricultur|gardener|landscap|fisher|forestry|livestock|dairy|ranch|wildlife|fish', '🧑‍🌾'],
  ['pilot|aviation|aircraft|airline|flight|aerospace|air traffic', '✈️'], ['driver|chauffeur|trucker|courier|delivery|dispatcher|transport|logistic|shipping|freight|fleet|warehouse|inventory|supply chain|procure|purchas|buyer', '📦'],
  ['captain|sailor|seafarer|mariner|deckhand|harbo|port\\b|ship', '⚓'], ['post|postal|mail carrier|postmaster|letter carrier', '📮'],
  ['construction|builder|mason|carpenter|plumber|electrician|painter|labou?rer|site engineer|surveyor|civil|roofer|welder|scaffold|installer|crane|flagman', '👷'], ['mechanic|repair|maintenance|technician|fitter|machinist|operator|assembler|fabricat|manufactur|production|plant\\b|factory|quality', '🧑‍🔧'],
  ['engineer|engineering', '⚙️'], ['architect', '🏛️'], ['real estate|property|realtor|estate agent|leasing', '🏘️'], ['hospitality|hotel|front desk|housekeep|concierge|tourism|travel|tour guide|event', '🛎️'],
  ['beautician|stylist|hairdresser|barber|makeup|cosmetolog|spa\\b|salon|nail tech|esthetician', '💇'], ['fitness|coach|athlet|sport|gym|yoga|personal trainer', '🏋️'], ['social worker|counsel|psycholog|ngo|non-profit|nonprofit|charity|volunteer|community|welfare|support worker|care worker|disability|day care|childcare|nanny', '🤲'],
  ['chief|ceo\\b|cfo\\b|cto\\b|coo\\b|president|chairman|founder|owner', '👔'],
  ['government|civil serv|public sector|public admin|municipal|policy|secretary of|minister|ambassador|diplomat|consul\\b|consulate|foreign service|commissioner|inspector', '🏛️'],
  ['marketing|advertis|brand|public relations|\\bpr\\b|communications|seo|social media', '📣'], ['sales|business development|account manager|account executive|retail|merchandis|salesperson|representative', '🤝'], ['human resources|\\bhr\\b|recruit|talent|people ops|training', '🧑‍🤝‍🧑'],
  ['customer service|customer support|call cent|support|helpdesk|help desk|client', '🎧'], ['administrat|admin|secretar|clerk|receptionist|office assistant|data entry|typist|assistant', '🗂️'], ['clean|janitor|housekeeping|domestic', '🧹'],
  ['partner', '👔'], ['executive|manager|director|head|lead|supervisor|coordinator|consultant|specialist|adviser|advisor|associate|officer', '🧑‍💼'], ['vlog|youtuber|influencer|creator|blogger', '🎥']
].map(([re, e]) => [new RegExp('(?:^|[^\\p{L}])(?:' + re + ')', 'iu'), e]);

/* ---------- 3. topic rules (first match wins; word-start match on the label) ---------- */
let R; const R_SRC = () => [
  // v4.1 extras (checked before the general rules)
  ['nintendo|playstation|xbox|steam deck|game boy', '🎮'], ['alcohol|wine\\b|wines\\b', '🍷'], ['cider', '🍏'], ['seltzer', '🥤'], ['ipa\\b|lager|stout|porter\\b|craft beer', '🍺'], ['^current\\b', '✅'], ['quit|cessation|nicotine replacement|patch\\b|lozenge|nicotine gum', '🚭'], ['support group', '🤝'],
  ['guesthouse|guest house|b&b|bed and breakfast|ranch|mansion|farmhouse', '🏡'], ['airport', '✈️'], ['hotel', '🏨'], ['translat', '🔤'], ['mediterranean', '🫒'], ['archery|bow and arrow', '🏹'], ['acting|actor', '🎭'], ['antiqu', '🏺'], ['airbrush', '🎨'], ['nordic|baltic|balkan|scandinavia|europe', '🌍'],
  ['guardian|foster', '👨‍👩‍👧'], ['daycare|day care|creche|crèche|nanny', '🧸'], ['preschool|nursery|kindergarten', '🏫'], ['homeschool', '🏡'], ['personal care', '🧴'], ['expecting|pregnan', '🤰'], ['video games?', '🎮'], ['lego|construction toys|building blocks|building/construction', '🧱'], ['dolls?\\b', '🪆'],
  ['telehealth|telemedicine', '📱'], ['joint supplement|joint health|skin/coat|coat supplement', '💊'], ['immun', '💊'], ['^service$|service sector|services sector', '🛎️'], ['aerospace', '✈️'], ['automotive', '🚗'], ['chemical', '🧪'], ['wood\\b|timber|furniture sector', '🪵'], ['recently joined|just joined|new joiner', '🆕'],
  ['pub\\b|pubs\\b|bar\\b|bars\\b|brewery|tavern', '🍻'], ['eggi?tarian', '🥚'], ['mobile shopping|app shopping', '📱'], ['catalog', '📖'], ['television shopping|tv shopping|teleshopping', '📺'], ['subscription', '🔁'], ['cheques?|checks?\\b', '🧾'], ['home & household|household goods|home & living', '🏡'],
  ['beginner|novice', '🌱'], ['intermediate', '🌿'], ['advanced', '🌳'], ['competitive', '🏆'], ['recreational(?! vehicle)', '😊'], ['aerobic', '🤸'], ['zumba|dance', '💃'], ['^\\d+ ?k$|marathon|fun run|trail run', '🏃'], ['mountain bike', '🚵'], ['dumbbell|kettlebell|barbell|treadmill|weights|elliptical|cross trainer|home gym|bench', '🏋️'],
  ['personal training|personal trainer', '🏋️'], ['muscle|strength|endurance|fat loss', '💪'], ['flexibility', '🤸'], ['^curling$', '🥌'], ['bowling', '🎳'], ['jiu-?jitsu|judo|karate|taekwondo|martial', '🥋'], ['cue sport', '🎱'], ['angling|fishing\\b', '🎣'], ['backpacking|backpack', '🎒'], ['all-terrain|atv\\b|quad bike', '🏍️'],
  ['mac ?book|chrome ?book|netbook|notebook', '💻'], ['streaming device|chromecast|fire tv|roku|apple tv', '📺'], ['prime video', '🎬'], ['oled|qled|led\\b|lcd|plasma', '📺'], ['sitcom', '😂'], ['video conferenc|video call', '📹'], ['messaging|messenger', '💬'], ['music streaming', '🎵'],
  ['wallets$', '👛'], ['jewel', '💍'], ['business casual|smart casual', '👔'], ['sandal|heels?\\b|stiletto|wedges', '👡'], ['boots?\\b', '👢'], ['formal shoe|formal footwear|loafer|oxford|brogue', '👞'], ['footwear|sneaker|shoes?\\b', '👟'], ['styling tips|tips\\b|how-to|tutorial', '📝'],
  ['share decision|shared decision|share decision-making|share the decision', '🤝'], ['visa\\b|mastercard|maestro|mastro|amex|american express|rupay|discover\\b|discover card|diners|jcb\\b|unionpay', '💳'], ['vending', '🥤'], ['quick-? ?commerce', '⚡'],
  ['platformer', '🍄'], ['board game|board/card|card games?|^cards?$|card game', '🃏'], ['mouse\\b', '🖱️'], ['keyboard', '⌨️'], ['chairs?\\b', '🪑'], ['trailer testing|movie trailer|game trailer|trailers/promotions|trailer/promotional', '🎞️'],
  ['doctor|physician|health professional|healthcare professional|healthcare provider|specialist doctor|[a-z]*(ologist|iatrist)\\b', '🧑‍⚕️'], ['mental', '😌'], ['traditional|ethnic wear|sherwani|kurta|saree|sari\\b|lehenga|salwar|kimono|hanbok', '🥻'],
  ['insurance|mediclaim', '🛡️'], ['braces|invisalign|aligner|orthodont', '🦷'], ['blind|low vision|visual', '👁️'], ['couple', '💑'], ['electrical|electrician|wiring|switch/socket|light switch|socket|generator|inverter', '⚡'], ['dishwash', '🍽️'],
  ['detergent|softener|bleach\\b|stain remover|laundry|ironing|dry clean|wash & fold', '🧺'], ['pipe repair|drain|tap/|faucet|plumb', '🔧'], ['emergency (repair|service)', '🚨'], ['amateur radio|ham radio', '📻'], ['american football|nfl', '🏈'], ['table tennis|ping pong', '🏓'],
  ['fairy tale|fable|folk ?tale', '🧚'], ['pool game|billiard|snooker', '🎱'], ['non-?veg', '🍗'], ['salad', '🥗'], ['diet coke|diet pepsi|pepsi max|coca-cola|coke zero|7 ?up', '🥤'], ['several times a year|times a year|once a year|every \\d.*years?|every year', '🎆'], ['special occasion', '🎉'],
  ['lipgloss|lip gloss', '💄'], ['prescri|\\brx\\b', '💊'], ['base coat|top coat|nail', '💅'], ['soap opera|drama|theatre|theater|stage play|musical\\b', '🎭'], ['talent show', '🌟'], ['international programming|regional-language programming|programming\\b', '📺'],
  ['set-top|dth\\b|satellite tv|cable tv', '📡'], ['football|soccer', '⚽'], ['true crime', '🕵️'], ['trailers?/promo|trailer\\b.*promo|movie trailer', '🎞️'], ['social media', '📱'],
  ['^marketing|marketing\\b', '📣'], ['^sales\\b|sales /', '🤝'], ['finance / accounting|^accounting', '🧮'], ['customer service|customer support|call cent', '🎧'], ['no restrictions', '🍽️'], ['hybrid \\(office|office \\+ home', '🔀'], ['work from home|from home|remote\\b|wfh', '🏠'],
  ['neighbou?rhood store|local store|corner shop|kirana', '🏪'], ['wi-?fi|broadband|fib(re|er)\\b|mobile data|4g|5g', '📶'], ['vr headset|vr\\b|virtual reality|meta quest|oculus|psvr', '🥽'], ['truck|lorry', '🚚'], ['houseboat|center console|centre console', '🚤'],
  ['motor ?cycle|motorbike|two[- ]wheeler', '🏍️'], ['commercial vehicle', '🚚'], ['garage|mechanic', '🔧'], ['braking|brakes?\\b', '🛑'], ['cruise control', '🎛️'], ['carplay|android auto', '📲'], ['product clinic', '🧪'], ['test drive', '🚗'], ['taxi|cab\\b|ride-?hail|ride[- ]?shar', '🚕'],
  ['since birth|born here', '🎂'], ['per year|annual|yearly', '📅'], ['per month|monthly', '🗓️'], ['excellent|outstanding', '🌟'], ['very good', '😃'], ['^good$|^good\\b', '🙂'], ['^fair$|^average$', '😐'], ['^poor$|^very poor$|^bad$', '🤒'],
  ['cement|concrete mixer|loader|road roller|backhoe|excavat|bulldoz', '🏗️'], ['runabout|jetboat|jet boat|speedboat|tugboat|lifeboat|schooner', '🚤'], ['aha|bha|toner|face pack|antifungal|antiseptic', '🧴'], ['hot brush|detangl|combs?\\b', '🪮'], ['haircut|toupee|hairpiece|wig', '💇'],
  ['glitter|shimmer|sparkle', '✨'], ['sindoor|bindi|mehndi|henna', '🔴'], ['^mists?\\b|body mist|^sprays?\\b|facial mist', '💦'], ['colou?rs?\\b|dye', '🎨'], ['product demonstration|demo\\b|unboxing|reviews?\\b|ratings?\\b', '⭐'], ['not available', '⛔'], ['reality show|talk show|soap opera', '📺'], ['crime|detective|police drama', '🕵️'],
  ['jazz|blues|saxophone', '🎷'], ['hip-?hop|rap\\b|r&b', '🎤'], ['rock|metal|punk|grunge', '🎸'], ['^pop\\b|k-pop|pop music', '🎤'], ['classical|orchestra|opera\\b|symphony', '🎻'], ['country music|^country$|folk|bluegrass', '🪕'], ['edm\\b|electronic music|techno\\b|house music|dj\\b', '🎧'], ['indie|alternative rock|alt-rock', '🎶'], ['bollywood|bhojpuri|regional cinema|tollywood|kollywood', '🎬'],
  ['search engine|searched|search\\b|google search', '🔍'], ['clicked|click|banner ad', '🖱️'], ['trouser|pants|jeans|leggings|track ?pants|shorts\\b|chinos', '👖'], ['blazer|sweater|hoodie|jumper|cardigan|coat|jacket|outerwear', '🧥'], ['activewear|sportswear|athleisure|gym wear', '🎽'], ['innerwear|underwear|lingerie|bra\\b|briefs', '🩲'],
  ['formal|suits?\\b|ties?\\b', '👔'], ['traditional|ethnic wear|sherwani|kurta|saree|sari|lehenga|salwar|kimono|hanbok', '🥻'], ['slipper|flip-?flop|chappal', '🩴'], ['flats\\b|loafer|oxford|brogue|formal shoe', '👞'], ['dupatta|scarf|scarves|stole|shawl', '🧣'], ['belt', '👖'], ['outfit|look\\b|style inspiration', '👗'],
  ['rrsp|tfsa|isa\\b|401k|ira\\b|ppf|nps', '🐷'], ['calcium|iron\\b|magnesium|zinc|multivitamin|immunity|omega|fish oil', '💊'], ['calorie|tracking|track\\b|counting', '📊'], ['portion', '🍽️'], ['hobby|hobbies|pastime', '🎨'], ['only when needed|when needed|as needed|if necessary', '🆘'], ['telemedicine|teleconsult|online doctor|video consult', '📱'],
  ['aromatherap|essential oil|candle|incense', '🕯️'], ['some days|certain days', '🌤️'], ['once or twice a year|more than once a year', '🎆'], ['less than (once a month|weekly|monthly)', '🐢'], ['beverage|drinks?\\b|protein shake|shake|electrolyte|isotonic|sports drink', '🥤'], ['at work|workplace|at the office', '🏢'], ['at home', '🏠'],
  ['\\.com\\b|\\.net\\b|\\.org\\b|website', '🌐'], ['steam\\b|battle\\.net|gog\\b|ubisoft|epic games|origin\\b|ea app|xbox game pass|game pass', '🎮'], ['discord', '💬'], ['kick\\b', '🔴'], ['moba|dota|league of legends', '⚔️'], ['survival', '🏕️'], ['amateur|competition|compete|tournament', '🏆'], ['frequently|often|regularly', '🔁'],
  ['leukaemia|leukemia|lymphoma|sarcoma|myeloma|mesothelioma|carcinoma|melanoma', '🎗️'], ['flu\\b|influenza|common cold|cough|fever|measles|mumps|chickenpox|covid|virus|infection|malaria|tuberculosis|pneumonia|bronchitis|tonsillitis|laryngitis|sore throat', '🤒'], ['thyroid', '🦋'],
  ['earache|tinnitus|hearing loss|deaf', '👂'], ['conjunctivitis|glaucoma|cataract|macular', '👁️'], ['itch|rash|hives|urticaria|warts|scabies|impetigo|shingles|cellulitis|sunburn|psoriasis|dermatitis', '🧴'], ['bowel|stomach|gastro|indigestion|ibs\\b|crohn|colitis|coeliac|celiac|constipation|diarrh|reflux|ulcer|hernia|gallstone|appendic|pancreat', '🩺'],
  ['x-?ray|mri|ct scan|scan\\b|ultrasound|biopsy|endoscop|colonoscop|bronchoscop|angiogram', '🩻'], ['transplant|bypass|heart valve|valve replacement|stent|angioplasty|catheter', '❤️‍🩹'], ['fracture|broken bone|sprain|acl|knee|hip replacement|ligament', '🦴'],
  // people & family
  ['non-?binary|another identity|gender ?fluid|genderqueer|transgender', '🧑'], ['^male$|^man$|^men$|^boys?$', '👨'], ['^female$|^woman$|^women$|^girls?$', '👩'],
  ['single|never married|unmarried', '🧍'], ['married|spouse|husband|wife', '💍'], ['domestic partner|living with someone|life partner|partnership|relationship|engaged|dating', '💑'], ['divorc|separat', '💔'], ['widow', '🕊️'],
  ['grand ?(parent|mother|father|child)', '👵'], ['new ?born|infant|baby|babies|toddler|nappy|diaper', '👶'], ['teen|adolescent', '🧑'], ['child|children|kids?\\b|son\\b|daughter|minor', '🧒'],
  ['parent|mother|father|mom|dad|family|household|relatives', '👨‍👩‍👧'], ['friends?\\b|colleague|peer\\b|peers\\b|neighbou?rs?\\b|community', '🤝'], ['myself|just me|^i do$|^me$|alone|solo|individual', '🙋'], ['someone else|other person', '🧑‍🤝‍🧑'],
  ['senior citizen|elderly|old age|retire', '🧓'], ['student|pupil|learner|study|studying', '🧑‍🎓'], ['homemaker|housewife|househusband|stay[- ]at[- ]home', '🏡'], ['unemployed|job ?seeker|looking for (a )?(job|work)|between jobs', '🔎'],
  ['self[- ]employed|freelanc|gig worker|contractor', '🧑‍💻'], ['owner|founder|entrepreneur|proprietor|partner\\b|business ?owner', '👑'], ['c-level|ceo\\b|cfo\\b|cto\\b|cmo\\b|coo\\b|chief|president|chairman|board member', '👔'],
  ['vice president|\\bvp\\b|director|head of', '🧑‍💼'], ['manager|supervisor|team lead|lead\\b|management', '📋'], ['specialist|expert|consultant|senior professional|professional\\b', '🎯'], ['entry level|associate\\b|junior|intern\\b|interns\\b|internship|trainee|apprentice|fresher', '🌱'],
  ['employed|full-?time|part-?time|employee|salaried|working|job\\b|work\\b|office', '💼'],
  // decisions & roles
  ['final decision|primary decision|decision[- ]maker|i decide|decide everything|make (most|all)', '⚖️'], ['joint|share decisions|shared|together|equally', '🤝'], ['recommend|influence|influencer|advise', '📣'], ['evaluat|compare|assess', '🔍'], ['budget', '💰'], ['renter|leaser|lease|rent\\b|rented|renting', '🔑'],
  ['company[- ]provided|employer|fleet|corporate|government provided', '🏢'], ['co-?owner|regular user|user\\b', '🙋'],
  // health & body
  ['alzheimer|dementia|memory', '🧠'], ['parkinson|neuro|epilep|migraine|stroke|brain', '🧠'], ['diabet|insulin|glucose|blood sugar', '🩸'], ['heart|cardio|blood pressure|hypertension|cholesterol', '❤️'],
  ['cancer|oncolog|tumou?r|chemo', '🎗️'], ['asthma|copd|lung|respirat|breath', '🫁'], ['arthritis|joint pain|bone|osteo|back pain|spine', '🦴'], ['kidney|renal|liver|hepat', '🩺'], ['allerg|hay fever|eczema|psoria|dermatitis|skin condition|rosacea', '🤧'],
  ['depress|anxiety|mental|stress|bipolar|adhd|autism|ocd|ptsd|sleep|insomnia', '😌'], ['obesity|weight loss|overweight|diet\\b|slimming', '⚖️'], ['pregnan|fertility|ivf|maternity', '🤰'], ['eye|vision|glasses|lens|contact lens|ophthalm|optic', '👓'],
  ['dental|teeth|tooth|oral|floss|mouthwash|gum\\b|dentist', '🦷'], ['ear\\b|hearing|ears', '👂'], ['nose|sinus', '👃'], ['lip\\b|lips|lip ', '👄'], ['foot|feet|insole|callus|toe', '🦶'], ['hand\\b|hands|nail|manicure|cuticle', '💅'],
  ['physician|doctor|gp\\b|general practitioner|md\\b|mbbs|surgeon|surgery|clinic', '🧑‍⚕️'], ['nurse|nursing|caregiver|carer|midwi', '👩‍⚕️'], ['hospitals?\\b|emergency|ambulance|icu\\b', '🏥'], ['pharmac|chemist|drugstore|medicine|medicat|prescription|rx\\b|pills?\\b|capsule|drug', '💊'],
  ['vaccin|inject|syringe|botox|filler|collagen|hyaluronic', '💉'], ['physio|rehab|chiropract|massage|spa\\b|spa |wellness|sauna', '💆'], ['yoga|meditat|mindful|pilates', '🧘'], ['herbal|ayurved|homeopath|unani|natural|organic|plant[- ]based|aloe|botanical', '🌿'],
  ['vitamin|supplement|protein powder|probiotic|enzyme|fortified|functional food', '💊'], ['insurance|insured', '🛡️'], ['health|medical|patient|healthcare|clinical', '🩺'], ['fitness tracker|smartwatch|smart watch|wearable|fitness band', '⌚'],
  ['disab|wheelchair|mobility aid|impair|physically challenged', '♿'], ['screen reader|voice input|larger text|zoom|keyboard only|accessib', '🦮'],
  // beauty & care
  ['lipstick|lip gloss|lip liner|lip stain|lip balm|lip kit|lip care|lip ', '💄'], ['mascara|eyeliner|eye ?shadow|eyebrow|brow|lash|kajal|kohl', '👁️'], ['foundation|concealer|powder|blush|bronzer|highlighter|primer|bb ?cream|cc ?cream|makeup|make-up|cosmetic|setting spray', '💄'],
  ['nail|polish|manicure|pedicure|top coat|base coat|cuticle', '💅'], ['perfume|parfum|fragrance|cologne|eau de|attar|scent|body mist|body spray|deodorant|antiperspirant', '🌸'], ['shampoo|conditioner|hair ?oil|hair serum|hair mask|dandruff|scalp|haircare|hair care', '🧴'],
  ['hair ?(dryer|straightener|styl|roller|brush|colou?r|dye|spray|gel|wax|pomade|mousse)|curling|frizz|relaxer|hairspray|hair ', '💇'], ['shav|razor|trimmer|beard|aftershave|grooming|epilator|wax|tweezer|threading|hair removal|depilat|bleach\\b', '🪒'],
  ['sunscreen|sun care|sun protect|spf|uv\\b|tanning', '🧴'], ['moistur|lotion|cream|serum|toner|cleanser|face wash|facial|exfoliat|scrub|mask|essence|skincare|skin care|retinol|niacinamide|acid\\b|ceramide|peptide|anti-?aging|blotting', '🧴'],
  ['soap|body wash|shower gel|bath|hand wash|hygiene|sanit|wipes', '🧼'], ['toothbrush|toothpaste|whitening|tongue', '🪥'], ['feminine|sanitary|tampon|menstrual|period', '🌸'], ['tattoo|piercing', '🖋️'],
  ['cosmetic surgery|plastic surg|liposuction|face lift|facelift|augmentation|implant|abdominoplasty|lift\\b|reduction|peel|dermabrasion|laser|rhinoplast|eyelid|cheek|chin\\b', '✨'], ['salon|beauty|glam\\b|glamour', '💅'],
  // food & drink
  ['beer|lager|ale\\b|stout|brew', '🍺'], ['red wine|white wine|rosé|wine|champagne|prosecco|sparkling', '🍷'], ['whisk|bourbon|scotch|brandy|cognac', '🥃'], ['vodka|rum\\b|gin\\b|tequila|liqueur|spirits|cocktail|mezcal|sake|soju|baijiu', '🍸'],
  ['coffee|espresso|latte|cappuccino|café|cafe', '☕'], ['tea\\b|chai\\b|matcha|green tea|herbal tea', '🍵'], ['energy drink|red bull|monster', '⚡'], ['juice|smoothie', '🧃'], ['soda|cola\\b|coke|pepsi|sprite|fanta\\b|dr pepper|mountain dew|soft drink|fizzy', '🥤'],
  ['water|mineral|sparkling water|hydrat', '💧'], ['milk|dairy|yogh?urt|cheese|butter|paneer', '🥛'], ['egg\\b|eggs|eggetarian', '🥚'], ['vegan|vegetable|veggie|plant-based|salad|healthy food|greens', '🥗'], ['vegetarian|veg\\b|jain', '🥦'],
  ['pescatarian|fish|seafood|sushi|prawn|shrimp|crab', '🐟'], ['chicken|poultry|meat|beef|pork|mutton|lamb\\b|non-?veg|bbq|barbecue|grill|kebab|steak', '🍗'], ['halal', '🌙'], ['kosher', '✡️'], ['gluten', '🌾'], ['keto|low-carb|low carb|paleo', '🥩'],
  ['pizza', '🍕'], ['burger|fast food|quick service', '🍔'], ['fries|chips|crisps|snack', '🍟'], ['noodle|ramen|pasta|spaghetti', '🍜'], ['rice|biryani|risotto|fried rice', '🍚'], ['curry|indian food|dal|thali', '🍛'], ['taco|burrito|mexican food', '🌮'],
  ['bread|bakery|baked|croissant|toast|bagel', '🥐'], ['cake|dessert|sweet|pastry|cookie|biscuit|donut|doughnut|pudding', '🍰'], ['chocolate|cocoa|candy|confection', '🍫'], ['ice ?cream|gelato|frozen dessert', '🍦'], ['fruit|apple|banana|berry|mango|orange', '🍎'],
  ['cereal|grain|oat|muesli|granola|whole grain|wheat|flour', '🌾'], ['street food|food truck|hawker', '🌭'], ['cook|kitchen|recipe|chef|culinary|baking', '🧑‍🍳'], ['restaurant|dine|dining|fine dining|bistro|buffet', '🍽️'], ['delivery|takeaway|take-away|takeout|zomato|swiggy|uber eats|doordash|deliveroo|grubhub', '🛵'],
  ['grocer|supermarket|hypermarket|groceries|mart\\b|convenience store|kirana', '🛒'], ['food|meal|eat|cuisine|dish|diet', '🍲'],
  // tobacco
  ['e-?cig|vape|vaping|pod\\b|juul', '💨'], ['hookah|shisha|hookah', '💨'], ['nicotine pouch|snus|chewing|smokeless|snuff|gutka|paan', '🌿'], ['heated tobacco|iqos|heat-not-burn', '🔥'], ['cigar|cigarette|tobacco|smok|pipe|rolling|marlboro|camel|pall mall|lucky strike|l&m|winston|kent|dunhill', '🚬'],
  // home & living
  ['apartment|flat\\b|condo|condominium|studio|bachelor pad|one-bedroom|two-bedroom|bedroom|high-?rise|tower', '🏢'], ['detached|house|bungalow|villa|cottage|townhouse|duplex|triplex|semi-detached|family home|single-wide|double-wide|triple-wide|mobile home|park model', '🏠'],
  ['dormitory|hostel|group quarters|shared accommodation|pg\\b', '🛏️'], ['mortgage|home loan|housing loan', '🏦'], ['own outright|own with|^own\\b|owned outright|home ?owner|ownership', '🔑'], ['live with parents|parents\\b', '👪'], ['garden|lawn|yard|patio|plants?\\b|gardening|horticulture', '🪴'],
  ['furniture|sofa|couch|bed\\b|mattress|decor|interior', '🛋️'], ['clean|cleaning|laundry|washing|detergent|vacuum|mop|dishwash', '🧽'], ['robot vacuum', '🤖'], ['appliance|fridge|refrigerator|microwave|oven|washing machine|air ?condition|\\bac\\b|heater|cooler|purifier', '🔌'],
  ['plumb|electrician|repair|maintenance|handyman|pest|carpent|renovat|install', '🔧'], ['security|lock|alarm|cctv|camera system|doorbell|guard', '🔒'], ['thermostat|heating|temperature', '🌡️'], ['lighting|bulb|lamp|^lights?$|led lights', '💡'], ['solar|renewable|energy|electricity|power', '⚡'],
  ['rural|village|countryside|farm\\b|agricultur', '🌾'], ['urban|city|metropolitan|downtown', '🏙️'], ['suburb|town\\b|small town', '🏘️'], ['coast|beach|seaside|island', '🏖️'], ['mountain|hill|alpine', '⛰️'],
  // pets
  ['\\bdogs?\\b|puppy|canine', '🐕'], ['\\bcats?\\b|kitten|feline', '🐈'], ['bird|parrot|budgie|canary|poultry farm', '🦜'], ['fish|aquarium|aquaria', '🐠'], ['rabbit|bunny', '🐇'], ['hamster|guinea pig|mouse|mice|rat\\b|gerbil|rodent', '🐹'], ['turtle|tortoise|reptile|snake|lizard|gecko|iguana', '🦎'],
  ['horse|pony|equestrian', '🐎'], ['vet|veterinar|animal care|pet care|grooming|kennel', '🐾'], ['pets?\\b|animals?\\b', '🐾'],
  // money & finance
  ['credit card|debit card|card\\b|cards', '💳'], ['upi|gpay|google pay|apple pay|samsung pay|paytm|phonepe|amazon pay|wallet|mobile payment|qr', '📱'], ['paypal|wire transfer|bank transfer|money transfer|remittance|western union|wise\\b|transfer', '💸'],
  ['gift card|voucher|coupon', '🎁'], ['cash\\b|cash ', '💵'], ['buy now pay later|bnpl|instal?lment|emi\\b', '🧾'], ['cryptocurrenc|crypto|bitcoin|ethereum|stablecoin|blockchain|web3', '🪙'], ['nft|digital collectible', '🖼️'],
  ['stocks?\\b|shares\\b|share market|equity|mutual fund|etf|index fund|trading|invest|portfolio|demat', '📈'], ['bond|fixed deposit|term deposit|recurring deposit|savings|saving|money market|piggy', '🐷'], ['gold\\b|silver\\b|bullion|precious metal', '🥇'], ['real estate|property|land plot|plot of land|plots?\\b', '🏘️'],
  ['pension|retirement|annuity|provident', '🧓'], ['loan|credit line|credit|lending|borrow|debt|overdraft', '🏦'], ['bank|banking|account|checking|current account|salary account|neobank|credit union|cooperative', '🏦'], ['tax\\b|taxes|taxation|accounting|accountant|bookkeep|audit\\b|auditors?\\b|auditing|ca\\b|cpa\\b|acca\\b|cma\\b|cfa\\b', '🧮'],
  ['financial advisor|financial planner|wealth|advisor', '🧑‍💼'], ['fintech|digital banking|payment|payments|pay\\b', '💳'], ['income|salary|wage|earning|revenue|profit|money|paid|payout|monetiz|sponsorship|affiliate|donation|commission', '💰'], ['currency|exchange', '💱'],
  // shopping
  ['online marketplace|e-?commerce|amazon|flipkart|taobao|ebay|alibaba|myntra|meesho|shopee|lazada|online shop|online store|website|web store|brand website', '🛍️'], ['quick-?commerce|blinkit|zepto|instamart|getir|gorillas', '⚡'], ['social commerce|social media shop|live shopping', '📲'],
  ['mall|shopping centre|shopping center|department store|outlet|boutique|store|shop|retail|showroom|dealership|brand store', '🏬'], ['second-?hand|refurbish|thrift|pre-?owned|used\\b', '♻️'], ['luxury|premium|designer|high-end|haute', '💎'], ['discount|sale\\b|deal|bargain|offer', '🏷️'],
  ['subscription|membership|subscribe', '🔁'], ['loyalty|reward|points|cashback|incentive', '🎁'],
  // fashion
  ['shoe|sneaker|footwear|boot|sandal|heel|trainer', '👟'], ['dress|gown|saree|sari|kurta|lehenga|skirt', '👗'], ['shirt|t-shirt|tops\\b|tank top|crop top|blouse|apparel|cloth|wear|fashion|garment|jeans|denim|jacket|coat|suit', '👕'], ['bag|handbag|purse|backpack|luggage', '👜'],
  ['watch\\b|watches|timepiece', '⌚'], ['jewel|ring\\b|necklace|earring|bracelet|diamond|gemstone', '💍'], ['sunglass|eyewear|spectacle', '🕶️'], ['hats?\\b|caps?\\b|headwear|beanie', '🧢'],
  // tech & devices
  ['smart ?phone|mobile phone|cell ?phone|iphone|android phone|\\bios\\b|android|harmonyos|mobile\\b|handset', '📱'], ['tablet|ipad|e-?reader|kindle', '📱'], ['laptop|notebook|macbook|chromebook|chrome os', '💻'], ['desktop|computer|\\bpc\\b|workstation|monitor', '🖥️'],
  ['smart tv|television|\\btv\\b|streaming device|chromecast|fire tv|apple tv|roku|set-top', '📺'], ['headphone|earbud|earphone|airpods|tws|headset', '🎧'], ['speaker|soundbar|bluetooth speaker|alexa|echo|google home|smart speaker|voice assistant', '🔊'], ['smart home|home hub|smart plug|smart lock|smart appliance|iot|connected', '🏠'],
  ['camera|dslr|gopro|webcam|photograph|photo|selfie', '📷'], ['printer|scanner|copier', '🖨️'], ['drone', '🛸'], ['vr\\b|virtual reality|ar\\b|augmented reality|meta quest|oculus|vive|valve index|pico', '🥽'], ['console|playstation|ps[345]|xbox|nintendo|switch\\b|handheld gaming|steam deck', '🎮'],
  ['wi-?fi\\b|broadband|fib(re|er)\\b|internet|isp|data plan|mobile data|4g|5g|lte|satellite|hotspot|router', '📶'], ['battery|charging|charger|power bank|wireless charging', '🔋'], ['cloud|saas|software|app\\b|apps\\b|application|platform|digital service|online service', '☁️'],
  ['ai\\b|artificial intelligence|chatbot|machine learning|ai-powered|gpt', '🤖'], ['cyber|antivirus|vpn|password|privacy|security software', '🛡️'], ['code|coding|programm|developer|software engineer|it\\b|information technology|tech support|data\\b|analytics|database|devops', '💻'], ['email|e-mail|newsletter|mail\\b', '📧'],
  ['sms|text message|whatsapp|telegram|messenger|chat\\b|wechat|line\\b|viber|signal', '💬'], ['phone call|telephone|calling\\b|cati\\b|voice call|by phone|calls?$', '📞'], ['notification|dashboard|push\\b|alert|in-app', '🔔'], ['electronic|gadget|device|tech\\b|technology', '🔌'],
  // social & media
  ['youtube|vlog|video|reels|shorts|tiktok|clip', '🎬'], ['instagram|photos?\\b|^stories$|carousel', '📸'], ['facebook|meta\\b', '👍'], ['^x$|^x\\b|twitter|tweet|threads', '🐦'], ['linkedin', '💼'], ['snapchat', '👻'], ['pinterest', '📌'], ['reddit|forum|community', '👽'],
  ['twitch|live ?stream|livestream|live videos?|go live|facebook live|youtube live|tiktok live|instagram live', '🔴'], ['podcast', '🎙️'], ['blog|personal website|article|writing|writer|newsletter', '✍️'], ['influenc|creator|content|followers|subscribers|audience', '🌟'],
  ['movie|film|cinema|netflix|prime video|hotstar|disney|hbo|ott|streaming|series|show\\b|drama', '🎬'], ['music|song|spotify|concert|band\\b|singer|album|playlist|gaana|jiosaavn', '🎵'], ['radio|fm\\b', '📻'], ['news|newspaper|journalism|current affairs', '📰'], ['magazine|comic|manga', '📖'],
  ['books?\\b|e-books?|audiobook|novel|reading|literature|library|fiction|non-fiction|biograph|historical|thriller|mystery|romance|science fiction|sci-fi|fantasy|poetry', '📚'], ['comedy|humou?r|funny|stand-?up', '😂'], ['horror|scary', '👻'], ['documentar', '🎞️'], ['anime|cartoon|animation', '🎨'],
  // games & sports
  ['esport|tournament|competitive gaming', '🏆'], ['fps|shooter|battle royale|call of duty|pubg|fortnite|valorant|counter-strike', '🎯'], ['rpg|role-?playing|adventure|open-?world|mmo', '🗡️'], ['racing|race\\b|motorsport|f1|formula', '🏎️'], ['strategy|puzzle|chess|board game|card game|trivia', '♟️'],
  ['simulation|sim\\b|sandbox|minecraft|roblox', '🧱'], ['fighting|boxing|mma|wrestl|martial art|karate|judo|taekwondo', '🥊'], ['casual gam|mobile gaming|candy crush|arcade', '🕹️'], ['multiplayer|co-?op|online gaming', '👾'], ['horror game', '👻'], ['action', '💥'], ['game|gaming|gamer|video game', '🎮'],
  ['football|soccer', '⚽'], ['cricket', '🏏'], ['basketball', '🏀'], ['baseball|softball', '⚾'], ['tennis|squash|padel|pickleball', '🎾'], ['badminton', '🏸'], ['table tennis|ping pong', '🏓'], ['volleyball', '🏐'], ['rugby|american football|nfl', '🏉'], ['hockey|ice hockey', '🏒'], ['golf', '⛳'],
  ['swim|aquatic|diving|surf\\b|surfing', '🏊'], ['cycl|bicycle|bike\\b|bikes\\b|mtb|bmx', '🚴'], ['run\\b|running|jog|marathon|athletic|track and field', '🏃'], ['gym|weight|strength|bodybuild|crossfit|workout|exercise|fitness', '🏋️'], ['ski\\b|skiing|snowboard|winter sport', '⛷️'], ['hiking|trek|climb|camping|outdoor|trails?\\b', '🥾'],
  ['dance|zumba|ballet', '💃'], ['sport|sports|athlete|team sport', '🏅'],
  // travel & places
  ['first class|business class|premium economy', '💺'], ['charter|private flight|private jet|business jet', '🛩️'], ['airline|flight|fly\\b|flying|air travel|airplane|aeroplane|airport|aircraft|airliner', '✈️'], ['helicopter', '🚁'], ['glider|hang glid', '🪂'], ['balloon|airship', '🎈'],
  ['cruise|ship|ferry|boat|yacht|sail|catamaran|canoe|kayak|dinghy|watercraft|pontoon|trawler|vessel|skiff|houseboat|jet ski', '⛵'], ['trains?\\b|rail\\b|railway|metro|subway|tram\\b|trams\\b|monorail|heritage railway', '🚆'], ['bus\\b|buses|coach\\b|public transport', '🚌'],
  ['taxi|cab\\b|uber|ola\\b|lyft|grab\\b|didi|rapido|ride-?hail|ride[- ]?shar|car-?shar|auto-?rickshaw|rickshaw|tuk', '🚕'], ['car rental|rent a car|rental car', '🚙'], ['motorhome|campervan|camper|caravan|rv\\b|rvs|recreational vehicle|trailer|fifth-wheel|popup|bus conversion|diesel pusher|class [abc]', '🚐'],
  ['hotel|resort|motel|inn\\b|lodging|accommodation|hostel|airbnb|homestay|stay', '🏨'], ['beach|seaside|coast|island|tropical', '🏖️'], ['mountain|hill station|alpine|volcano', '🏔️'], ['desert|safari|game reserve|wildlife|national park|zoo', '🦁'], ['camp\\b|camping|tent|glamping', '🏕️'],
  ['amusement park|theme park|water park|disneyland|roller coaster', '🎢'], ['casino|gambl|betting|poker|lottery', '🎰'], ['museum|archaeolog|heritage|historic|monument|castle|fort\\b|forts\\b|palace|ruins|folly|heraldic', '🏛️'], ['art venue|gallery|exhibition|arts', '🖼️'],
  ['festival|carnival|fair\\b|parade|event|events|celebration|party|nightlife|club\\b|entertainment district', '🎉'], ['airshow', '🛩️'], ['bungee|skydiv|paraglid|zip ?line|extreme|adventure|mysterious|thrill', '🪂'], ['bridge|glass-bottom', '🌉'], ['garden|botanical|park\\b|parks\\b', '🌳'],
  ['religious|temple|church|mosque|pilgrimage|shrine|cathedral', '⛪'], ['building|architecture|skyscraper|landmark|tower', '🏙️'], ['ski resort|snow', '🏂'], ['lake|river|waterfall', '🏞️'], ['spa resort|wellness retreat', '🧖'], ['shopping', '🛍️'], ['tour|tourism|holiday|vacation|sightseeing|travel|trip|journey|abroad|international|domestic', '🧳'],
  ['passport|visa|immigration', '🛂'], ['luggage|suitcase|baggage', '🧳'], ['map|navigation|gps', '🗺️'],
  // vehicles
  ['electric vehicle|\\bev\\b|\\bevs\\b|bev\\b|phev|hev\\b|erev|fcev|battery electric|plug-in|hybrid|electric car|electric two-wheeler|e-?bike|electric scooter|tesla', '🔋'], ['scooter|moped|vespa', '🛵'], ['motorcycle|motor cycle|motorbike|two[- ]wheeler|harley|ducati|royal enfield', '🏍️'],
  ['truck|lorry|semi-trailer|18-wheeler|tanker|flatbed|dump|tow truck|box truck|pickup|panel truck|log carrier|refrigerat', '🚚'], ['fire engine|fire truck', '🚒'], ['ambulance|emergency vehicle|police', '🚓'], ['tractor|agricultur|harvester|farm vehicle', '🚜'], ['construction|heavy machinery|excavator|bulldozer|crane|forklift', '🏗️'],
  ['van\\b|vans\\b|minivan|mpv|muv|people carrier', '🚐'], ['suv|crossover|jeep|4x4|off-?road', '🚙'], ['sports car|convertible|coupe|supercar|ferrari|lamborghini|porsche|mclaren|bugatti|maserati|aston martin|lotus', '🏎️'], ['sedan|hatchback|saloon|car\\b|cars\\b|automobile|vehicle', '🚗'],
  ['petrol|gasoline|diesel|fuel|lpg|cng|gas station', '⛽'], ['manual|automatic|cvt|transmission|gear', '⚙️'], ['tyre|tire|wheel', '🛞'], ['car wash|detailing|wash\\b', '🧽'], ['servicing|service cent|mechanic|garage|repair|inspection|roadside|maintenance', '🔧'], ['parking|park assist', '🅿️'],
  ['camera\\b|360|reversing camera|dashcam', '📹'], ['cruise control|lane assist|driver assist|adas|braking|autonomous|self-driving', '🛡️'], ['carplay|android auto|infotainment|instrument cluster|telematics', '📲'], ['driving|driver|test drive|licen[cs]e', '🧑‍✈️'], ['walk|walking|on foot|pedestrian', '🚶'],
  // education & degrees (field first, then level)
  ['law\\b|laws\\b|legal|llb|ll\\.b|llm|ll\\.m|jd\\b|juris|barrister|advocate|solicitor|attorney|lawyer|canon law|compliance', '⚖️'], ['medicine|medical|mbbs|md\\b|surgery|dental|bds|mds|nursing|pharmac|physiotherap|bpt|mpt|ayurved|bams|homeopath|bhms|unani|bums|optometr|audiolog|chiropract|veterinar|dvm|health science|biomedical|paramedic', '🩺'],
  ['engineer|engineering|b\\.?e\\.|m\\.?e\\.|b\\.?tech|m\\.?tech|polytechnic|iti\\b|mechanical|civil|electrical|electronics|mechatron|aeronaut|automobile engineering|chemical engineering|industrial training', '⚙️'], ['architect|b\\.?arch|m\\.?arch|urban planning|interior design', '🏛️'],
  ['computer|bca|mca|software|information tech|it\\b|data science|cyber|artificial intelligence|web design|multimedia|animation|programming', '💻'], ['business|bba|mba|management|pgdm|commerce|b\\.?com|m\\.?com|marketing|economics|finance|accountancy|accounting|actuar|hospitality|hotel management|tourism', '💼'],
  ['education|b\\.ed\\b|m\\.ed\\b|teach|pedagog|library|b\\.?lib|m\\.?lib', '🍎'], ['design|b\\.?des|m\\.?des|fashion|fine arts|art\\b|arts\\b|music|theatre|theater|film|media|journalism|mass comm|photograph|literature|liberal|humanities|philosophy|history|languages|linguist', '🎨'],
  ['science|b\\.?sc|m\\.?sc|physics|chemistry|biology|biotech|genetic|microbio|biochem|zoology|botany|mathemat|statistic|environment|geology|astronomy|research', '🔬'], ['agricult|horticult|forestry|fisheries|dairy|food tech|veterinary', '🌾'], ['psycholog|social work|sociology|anthropolog|political|public admin|criminolog', '🧠'],
  ['theolog|divinity|religious studies|seminary|ministry', '📿'], ['aviation|pilot|flight', '✈️'], ['nautical|marine|maritime|navy', '⚓'], ['sport science|physical education|fitness', '🏅'], ['nurs', '👩‍⚕️'],
  ['doctor|doctoral|phd|ph\\.d|d\\.sc|d\\.litt|ll\\.d|edd|dba|postdoc', '👨‍🎓'], ['master|postgraduate|post graduate|pg diploma|m\\.a\\.|m\\.s\\.|m\\.phil', '🎓'], ['bachelor|undergraduate|graduate|degree|b\\.a\\.|b\\.s\\.|associate', '🎓'], ['diploma|certificate|certification|vocational|course|training|apprentice', '📜'],
  ['high school|secondary|school|grade|class \\d|primary|elementary|kindergarten|nursery|preschool', '🏫'], ['college|university|campus|institute|academy', '🏛️'], ['online course|e-?learning|mooc|online learning|distance', '💻'], ['tuition|coaching|tutor', '📝'],
  // work functions & industries (also used by the 16,000 job titles)
  ['marketing|advertis|brand|pr\\b|public relations|communications|seo|social media manager', '📣'], ['sales|business development|account manager|account executive|retail associate|cashier|merchandis', '🤝'], ['human resources|\\bhr\\b|recruit|talent|payroll|people ops', '🧑‍🤝‍🧑'],
  ['customer service|customer support|tech support|call cent|helpdesk|help desk|client service', '🎧'], ['procure|purchas|buyer|sourcing|vendor|supply chain|logistic|warehouse|inventory|shipping|courier|delivery|dispatch|freight', '📦'], ['operations|production|manufactur|factory|plant\\b|assembly|machin|technician|operator|fabricat|weld', '🏭'],
  ['administrat|admin|secretar|clerk|receptionist|office assistant|data entry|typist', '🗂️'], ['research|r&d|scientist|laborator|lab\\b|analyst|statistician', '🔬'], ['design|designer|ux|ui\\b|graphic|creative|artist|illustrat|animator', '🎨'], ['writer|editor|author|journalist|reporter|copywrit|content|translator|interpreter', '✍️'],
  ['teacher|teaching|professor|lecturer|tutor|instructor|trainer|principal|educat|faculty|school', '🧑‍🏫'], ['chef|cook|baker|kitchen|culinary|barista|bartender|waiter|waitress|catering|food service', '🧑‍🍳'], ['farmer|farming|agricultur|gardener|landscap|fisher|forestry|livestock|dairy', '🧑‍🌾'],
  ['driver|chauffeur|trucker|delivery driver|bus driver|taxi driver|pilot|captain|sailor|seafarer|conductor|transport', '🧑‍✈️'], ['police|security guard|guard|army|military|soldier|defen[cs]e|navy|air force|firefight|fire fighter|rescue|emergency', '👮'], ['construction|builder|mason|carpenter|plumber|electrician|painter|labou?rer|contractor|site engineer|surveyor|civil', '👷'],
  ['mechanic|repair|maintenance|service technician|fitter|installer', '🧑‍🔧'], ['scientist|chemist|biologist|physicist|lab', '🧑‍🔬'], ['engineer|engineering', '🧑‍🔧'], ['developer|programmer|software|coder|devops|sysadmin|network|it\\b|data|cloud|cyber|web\\b', '🧑‍💻'],
  ['lawyer|legal|attorney|advocate|paralegal|judge|notary|compliance', '⚖️'], ['accountant|accounting|finance|financial|banker|banking|auditors?\\b|tax\\b|actuar|treasur|investment|trader|broker|credit|loan|insurance|underwrit|claims', '🧮'],
  ['doctor|physician|surgeon|dentist|nurse|pharmacist|therapist|medical|clinical|health|hospital|caregiver|paramedic|radiolog|patholog|veterinar|optometr|midwife|dietitian|nutrition', '🧑‍⚕️'], ['real estate|property|realtor|estate agent|leasing', '🏘️'], ['hospitality|hotel|front desk|housekeep|concierge|tourism|travel agent|tour guide|event', '🛎️'],
  ['beautician|stylist|hairdresser|barber|makeup artist|cosmetolog|spa|salon|nail tech', '💇'], ['fitness|coach|athlet|sport|gym|yoga|personal trainer', '🏋️'], ['social worker|counsel|psycholog|ngo|non-profit|nonprofit|charity|volunteer|community', '🤲'], ['government|civil serv|public sector|public admin|municipal|policy', '🏛️'],
  ['retail|store|shop|sales associate', '🛍️'], ['media|film|tv|broadcast|music|actor|actress|musician|singer|photographer|videograph|producer|entertainment', '🎬'], ['clean|janitor|housekeeping|domestic', '🧹'], ['executive|officer|manager|director|head|lead|supervisor|coordinator|consultant|associate', '🧑‍💼'],
  // research participation
  ['focus group|group discussion', '🗣️'], ['in-depth interview|interview|telephone interview|in-person', '🎤'], ['online survey|survey|poll|questionnaire|opinion', '📝'], ['diary|journal', '📔'], ['usability|user testing|prototype|concept testing|beta', '🧪'], ['in-?home|home use|home testing', '🏠'],
  ['product testing|product test|taste test|sampling|tasting|packaging|advertising testing|advert|ad testing|commercial', '🧪'], ['mystery shop', '🕵️'], ['community|online communit|panel', '👥'], ['video interview|webcam|video call', '📹'], ['clinic|product clinic', '🧪'], ['test drive|evaluation|test', '🧪'],
  ['healthcare / patient|patient-related', '🩺'], ['consumer|product feedback', '🛍️'], ['learning new|learn|knowledge|curious', '💡'], ['sharing my opinion|opinion|voice|feedback|say\\b', '💬'], ['helping|help|improve|contribute', '🤲'], ['rewards|incentive|earn|money', '🎁'],
  // religion & identity
  ['christian|catholic|protestant|orthodox|church|jesus|baptist|evangelical|anglican|mormon', '✝️'], ['islam|muslim|sunni|shia|sufi', '☪️'], ['hindu', '🕉️'], ['buddh', '☸️'], ['sikh', '🪯'], ['juda|jewish', '✡️'], ['jain', '🙏'], ['bahai|bahá', '⭐'], ['shinto', '⛩️'], ['tao|confuc', '☯️'], ['zoroastr|parsi', '🔥'],
  ['spiritual', '🕊️'], ['atheist|agnostic|no religion|secular|humanist|non-religious', '🌍'],
  // misc concepts
  ['phone|mobile', '📱'], ['online|internet|digital|virtual|remote|from home|work from home|wfh', '🌐'], ['offline|in-store|in person|in-person|physical|face to face|walk-in', '🏪'], ['hybrid', '🔀'], ['office|campus|on-?site', '🏢'], ['field|on the move|travelling|traveling', '🧭'],
  ['local|regional|neighbou?rhood|nearby', '📍'], ['national|domestic|nationwide|countrywide', '🗺️'], ['international|global|worldwide|overseas|foreign', '🌍'], ['morning|sunrise|dawn|breakfast', '🌅'], ['afternoon|midday|noon|lunch', '🌞'], ['evening|sunset|dinner', '🌆'], ['night|late|midnight', '🌙'], ['weekend|saturday|sunday', '🎉'],
  ['comedy|fun\\b|funny', '😄'], ['romance|love', '💕'], ['gift', '🎁'], ['kids?\\b|toys?\\b', '🧸'], ['art|craft|draw|paint|diy|handmade|sewing|knit', '🎨'], ['photo', '📷'], ['science|technology', '🔬'], ['nature|environment|eco|green|sustainab|recycl|climate', '♻️'], ['charit|volunteer|donat', '💝'],
  ['politic|election|government', '🗳️'], ['news\\b', '📰'], ['history|histor', '🏺'], ['food & cooking|cooking', '🍳'], ['home & garden|diy', '🏡'], ['cars & mobility|mobility', '🚗'], ['finance & invest|investing', '📈'], ['parenting', '👨‍👩‍👧'], ['pets?\\b', '🐾'],
  ['star|celebrit|famous', '⭐'], ['new\\b|newest|latest|launch', '🆕'], ['old|older|vintage|classic|retro', '🕰️'], ['fast\\b|quick\\b|instant|express', '⚡'], ['slow|relax|calm|leisure', '🌴'], ['quality|best|top', '🏅'],
  ['price|cheap|afford|value|economy|budget', '🏷️'], ['safe|safety|secure|protect', '🛡️'], ['brand', '🏷️'], ['normal|regular|standard|typical|average|moderate', '👌'], ['^dry$|dryness', '🏜️'], ['oily|oil', '💧'], ['sensitive', '🌸'], ['combination', '🔀'], ['damage|split ends|frizz|thinning|fall|greying|grey', '💇']
].map(([re, e]) => [new RegExp('(?:^|[^\\p{L}])(?:' + re + ')', 'iu'), e]);

/* ---------- degrees: the field of study decides the picture (⚖️ law, 🩺 medicine, ⚙️ engineering…) ---------- */
const DEGREE = /\b(bachelor|master|doctor of|doctoral|doctorate|associate of|associate'?s|associates degree|diploma|degree|ph\.?\s?d|post ?graduate|graduate certificate|professional certificate)\b|^(b|m|d)\.[a-z]+\.?\s|—/i;
let FIELD; const FIELD_SRC = () => [
  ['law|laws|legal|llb|ll\\.b|llm|ll\\.m|juris|canon law', '⚖️'], ['nursing|\\badn\\b|\\bbsn\\b|midwif', '👩‍⚕️'], ['dental|dentist|bds|mds', '🦷'], ['pharmac', '💊'], ['veterinar|dvm', '🐾'],
  ['medicine|medical|mbbs|\\bmd\\b|surgery|surgeon|chirurg|clinical|biomedical|health|physiotherap|bpt|mpt|ayurved|bams|homeopath|bhms|unani|bums|optometr|audiolog|chiropract|paramedic|public health|kinesiolog|nutrition|dietetic', '🩺'],
  ['architect|arch\\.|urban planning|interior design', '🏛️'], ['aero|aviation|aeronaut', '✈️'], ['automobile|automotive', '🚗'], ['agricult|horticult|forestry|fisheries|dairy|food tech|agronomy', '🌾'],
  ['computer|bca|mca|software|information tech|information systems|data science|cyber|artificial intelligence|web design|multimedia|animation|programming|\\bit\\b', '💻'],
  ['engineer|engineering|technology|b\\.?tech|m\\.?tech|b\\.e\\.|m\\.e\\.|polytechnic|mechanical|civil|electrical|electronics|mechatron|chemical|industrial', '⚙️'],
  ['accountanc|accounting|acc\\b|macc|finance|financial|actuar|taxation|banking', '🧮'], ['business|bba|mba|management|pgdm|commerce|com\\.|marketing|economics|econ|administration|hospitality|hotel|tourism|entrepreneur', '💼'],
  ['education|teaching|\\bed\\.|b\\.ed|m\\.ed|edd|pedagog|library|lib\\.', '🍎'], ['music|musical', '🎵'], ['design|des\\.|fashion|fine arts|visual arts|art\\b|arts\\b|theatre|theater|film|photograph|liberal', '🎨'],
  ['journalism|mass comm|communication|media', '📰'], ['literature|english|languages|linguist|humanities|philosophy|history|letters|litt', '📚'],
  ['psycholog|social work|sociology|anthropolog|political|public admin|criminolog|international relations', '🧠'], ['theolog|divinity|religious|ministry|canon|seminary', '📿'], ['nautical|marine|maritime', '⚓'], ['sport|physical education|fitness', '🏅'],
  ['science|b\\.?sc|m\\.?sc|physics|chemistry|biology|biotech|genetic|microbio|biochem|zoology|botany|mathemat|statistic|environment|geology|astronomy|research', '🔬']
].map(([re, e]) => [new RegExp('(?:^|[^\\p{L}])(?:' + re + ')', 'iu'), e]);

/* ---------- 4. numbers ---------- */
const KEYCAP = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
const num = (s) => parseFloat(String(s).replace(/[,\s]/g, ''));
function numberIcon(label, ctx) {
  const s = label.trim(), t = ctx.text || '';
  const m = s.match(/(\d[\d,.\s]*)/);
  if (!m) return null;
  const n = num(m[1]) * (/million|\bm\b/i.test(s) ? 1e6 : /\bk\b|thousand/i.test(s) ? 1e3 : 1);
  if (/%/.test(s)) return n >= 75 ? '🌕' : n >= 50 ? '🌔' : n >= 25 ? '🌓' : n > 0 ? '🌒' : '🌑';
  if (/\bminutes?|\bmins?\b/i.test(s)) return n >= 20 ? '⏰' : '⏱️';
  if (/\bhours?|\bhrs?\b/i.test(s)) return '⌛';
  if (/\bdays?\b/i.test(s)) return '📅';
  if (/\bweeks?\b/i.test(s)) return '🗓️';
  if (/\bmonths?\b/i.test(s)) return '🌙';
  if (/\byears?|\byrs?\b|year fixed/i.test(s)) {
    if (/child|kid|son\b|daughter|\bage\b/i.test(t)) return n < 3 ? '👶' : n < 13 ? '🧒' : '🧑';
    return /fixed|mortgage|loan/i.test(s + t) ? '🏦' : n >= 10 ? '🏆' : '📆';
  }
  if (/employee|organi[sz]ation|company size|staff|people work|workforce/i.test(t)) return n >= 1000 ? '🏙️' : n >= 100 ? '🏢' : n >= 10 ? '🏪' : '🏠';
  if (/follower|subscriber|audience|connection|fans/i.test(t) || n >= 500) return n >= 1e6 ? '🚀' : n >= 1e5 ? '⭐' : n >= 1e4 ? '🌳' : n >= 1e3 ? '🌿' : '🌱';
  if (/\bage\b|\baged\b|how old|years old/i.test(t)) return n < 3 ? '👶' : n < 13 ? '🧒' : n < 20 ? '🧑' : n < 60 ? '🧑' : '🧓';
  if (/\+|or more|and above|more than|over\b|^>/i.test(s) && n >= 10) return '🔢';
  if (n >= 0 && n <= 10 && Number.isInteger(n)) return KEYCAP[n];
  return '🔢';
}


function compile() {
  if (R) return;
  DEMONYM = DEMONYM_SRC(); ETHNIC = ETHNIC_SRC(); SOCIAL = SOCIAL_SRC(); JOB = JOB_SRC(); R = R_SRC(); FIELD = FIELD_SRC();
}

/* ---------- public API ---------- */
const cache = new Map();
/** Returns 'flag:<cc>' | an emoji character | an icon name (public/images/emoji/<name>.webp). Never null. */
export function answerIcon(label, value, ctx = {}) {
  compile();
  const L = String(label || '').trim(), V = String(value ?? '');
  const k = L + '|' + V + '|' + (ctx.q || '');
  if (cache.has(k)) return cache.get(k);
  let r = null;
  const cur = (V.match(/^([A-Z]{3})\b/) || L.match(/^([A-Z]{3})\s*[-–]/) || [])[1];
  if (cur && CUR_CC[cur]) r = 'flag:' + CUR_CC[cur];
  else if (/^other currenc/i.test(L)) r = '💱';
  if (!r && ctx.flags !== false && /ethnic|language|tongue|nationality|race|origin|speak|cuisine/i.test((ctx.q || '') + ' ' + (ctx.text || ''))) {
    for (const [re, e] of ETHNIC.slice(0, 5)) if (re.test(L)) { r = e; break; }   // multi-country groups first
    if (!r) for (const [re, cc] of DEMONYM) if (re.test(L)) { r = 'flag:' + cc; break; }
    if (!r) for (const [re, e] of ETHNIC.slice(5)) if (re.test(L)) { r = e; break; }
  }
  if (!r && (/^(jobrole|unemp-jobtype|department|unemp-department|job-title|designation)$/.test(ctx.q || '') || /job title|designation|job role|occupation/i.test(ctx.text || ''))) {
    for (const [re, e] of JOB) if (re.test(L)) { r = e; break; }
    if (!r && !SCALES.some(([re]) => re.test(L))) r = '💼';
  }
  if (!r && DEGREE.test(L) && !/studio|bachelor pad|bachelor party/i.test(L)) {
    // a degree LEVEL ("Bachelor's degree (BA, BS)", "Doctoral Degree Program") gets a level icon, a named degree its field
    if (/^(bachelor|master|doctor(al|ate)?|associate|graduate|professional|undergraduate|postgraduate)[’']?s?\s+(degree|program|certificate)\b|^(bachelor|doctoral|master) degree$/i.test(L)) r = /^doctor/i.test(L) ? '👨‍🎓' : /certificate/i.test(L) ? '📜' : '🎓';
    if (!r) for (const [re, e] of FIELD) if (re.test(L)) { r = e; break; }
    if (!r) r = /doctor|ph\.?d|d\.sc|d\.litt|ll\.d/i.test(L) ? '👨‍🎓' : /diploma|certificate/i.test(L) ? '📜' : '🎓';
  }
  if (!r) { const first = L.split(/\s*[/,(]\s*|\s+(and|&|or)\s+/)[0].trim().toLowerCase(); const cc = COUNTRY_CC[first] || COUNTRY_CC[L.toLowerCase()]; if (cc) r = 'flag:' + cc; }
  if (!r) for (const [re, e] of SCALES) if (re.test(L)) { r = e; break; }
  if (!r && /\.(com|net|org|io|in|co)\b/i.test(L)) r = '🌐';
  if (!r && /browser/i.test(ctx.text || '')) r = '🌐';
  if (!r) for (const [re, e] of SOCIAL) if (re.test(L)) { r = e; break; }
  // brand / title lists (car makers, beauty brands, games…): the question's own picture fits every brand better than a word match
  const brandQ = /\bbrands?\b|which (games|titles|apps?|platforms?|services?) do you|manufacturer|labels? do you/i.test(ctx.text || '');
  if (!r && !brandQ) for (const [re, e] of R) if (re.test(L)) { r = e; break; }
  if (!r && !brandQ && /^\s*(<|>|≤|≥|under|over|less than|more than|fewer than|up ?to|about|approx\.?|within|between|below|above|every)?\s*\d/i.test(L)) r = numberIcon(L, ctx);
  if (!r) r = ctx.fallback || 'sparkles';
  cache.set(k, r);
  return r;
}

const hex = (s) => [...s].filter((c) => c !== '️').map((c) => c.codePointAt(0).toString(16)).join('-');
/** Image URL for an answerIcon() result. */
export function answerIconUrl(ic) {
  if (!ic) return '';
  if (ic.startsWith('flag:')) return flagUrl(ic.slice(5));
  if (/^[a-z][\w-]*$/.test(ic)) return emojiUrl(ic);
  return assetUrl(`images/emoji/u/${hex(ic)}.webp`);
}
export const isFlagIcon = (ic) => typeof ic === 'string' && ic.startsWith('flag:');
