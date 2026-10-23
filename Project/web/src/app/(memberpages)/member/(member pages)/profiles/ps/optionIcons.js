// Picks a 3D icon for an answer option from its (English) label/value. First match wins.
// Shown on tile / list answers (≤ 30 options) to make every question visual.
const RULES = [
  [/^(yes|y|true)\b/i, 'check'], [/^(no|n|false|none|never|not at all|i (don.?t|do not)|not involved|none of these)\b/i, 'cross'],
  [/prefer not/i, 'lock'], [/non-?binary|another identity/i, 'person'], [/^male$|^man$|\bmen\b/i, 'man'], [/^female$|^woman$|\bwomen\b/i, 'woman'],
  [/smart ?phone|mobile|android|iphone|ios/i, 'tech'], [/laptop/i, 'digital'], [/desktop|computer|\bpc\b/i, 'desktop'], [/tablet|ipad/i, 'tech'],
  [/smart ?tv|television|\btv\b/i, 'tv'], [/smartwatch|watch|wearable|fitness band/i, 'watch'], [/console|playstation|xbox|nintendo/i, 'console'],
  [/\bvr\b|virtual reality|headset/i, 'vr'], [/speaker|alexa|echo/i, 'speaker'], [/satellite/i, 'satellite'], [/wi-?fi|broadband|fibre|fiber|internet/i, 'wifi'],
  [/e-?mail/i, 'mail'], [/\bsms\b|text message/i, 'sms'], [/whatsapp|chat/i, 'sms'], [/phone call|by phone|call/i, 'phonecall'], [/notification|dashboard|push/i, 'bell'],
  [/morning/i, 'sun'], [/afternoon/i, 'sunset'], [/evening|night/i, 'moon'], [/minute|hour|time/i, 'clock'], [/daily|weekly|monthly|year|month|week|day/i, 'calendar'],
  [/\bcar\b|sedan|suv|hatchback|automobile/i, 'automobile'], [/motor ?bike|motorcycle|scooter|two.wheeler/i, 'motorbike'], [/bicycle|cycling|\bbike\b/i, 'bike'],
  [/\bbus\b|public transport/i, 'bus'], [/train|metro|rail/i, 'train'], [/flight|plane|air ?travel|airline/i, 'travel'], [/cruise|ship|boat/i, 'ship'], [/taxi|uber|ola|ride/i, 'taxi'],
  [/electric|\bev\b|hybrid/i, 'electric'], [/petrol|diesel|fuel|gas/i, 'fuel'],
  [/\bdog/i, 'dog'], [/\bcat/i, 'cat'], [/bird|parrot/i, 'bird'], [/fish|aquarium/i, 'fishpet'], [/rabbit|hamster|guinea/i, 'rabbit'], [/\bpet/i, 'pawprint'],
  [/coffee/i, 'coffee'], [/\btea\b/i, 'tea'], [/beer/i, 'beer'], [/wine|champagne/i, 'wine2'], [/whisk|vodka|rum|spirits|cocktail|gin/i, 'cocktail'], [/juice/i, 'juice'],
  [/soda|soft drink|cola/i, 'soda'], [/water/i, 'water'], [/pizza/i, 'pizza'], [/burger|fast food/i, 'food'], [/salad|vegetarian|vegan|healthy/i, 'salad'], [/cake|dessert|bakery|sweet/i, 'cake'],
  [/chocolate/i, 'chocolate'], [/ice ?cream/i, 'icecream'], [/rice|biryani/i, 'rice'], [/noodle|chinese|asian/i, 'noodle'], [/delivery|zomato|swiggy|uber eats|doordash/i, 'delivery'], [/restaurant|dine|dining/i, 'bento'],
  [/smok|cigar|tobacco|vape|nicotine/i, 'smoking'],
  [/bank/i, 'banking'], [/credit card|debit card|\bcard\b/i, 'card2'], [/upi|paypal|wallet|payment/i, 'card2'], [/loan|mortgage/i, 'house2'], [/invest|stock|share|mutual fund|crypto/i, 'chart'],
  [/insurance/i, 'shield'], [/income|salary|\$|₹|€|£|rupee|dollar|euro/i, 'money'], [/saving/i, 'piggy'], [/gift card|amazon|voucher/i, 'gift'], [/wire transfer/i, 'banking'],
  [/apartment|flat|condo/i, 'apartment'], [/own|house|home|villa|bungalow/i, 'house2'], [/rent/i, 'key'], [/parents|family/i, 'family'],
  [/school|high school/i, 'school'], [/college|university|bachelor|degree|graduate|diploma/i, 'graduation'], [/master|mba|doctor|phd|professional degree/i, 'university'], [/student/i, 'book'],
  [/employed|full-?time|part-?time|job|work|office/i, 'professional'], [/self-?employed|freelanc|owner|founder|business/i, 'handshake'], [/retired/i, 'sunset'], [/homemaker/i, 'home'], [/unemployed|not working/i, 'hourglass'],
  [/c-level|ceo|cfo|cto|chief|director|vp|vice president|head of/i, 'crown'], [/manager|team lead/i, 'briefcase2'], [/intern|trainee|entry/i, 'seedling'],
  [/marketing/i, 'chart2'], [/sales/i, 'handshake'], [/finance|accounting/i, 'chart'], [/\bit\b|engineering|software|developer|tech/i, 'digital'], [/human resources|\bhr\b/i, 'family'],
  [/legal|compliance/i, 'shield'], [/research|science/i, 'research'], [/health|medical|doctor|hospital|clinic/i, 'health'], [/teach|education/i, 'teacher'], [/operations|production|manufactur/i, 'tools'],
  [/customer service|support/i, 'phonecall'], [/procure|purchas/i, 'cart'], [/admin/i, 'pencil'],
  [/music|concert/i, 'music'], [/movie|film|cinema|netflix|streaming|ott/i, 'media'], [/podcast/i, 'podcast'], [/radio/i, 'radio'], [/news/i, 'news'], [/book|reading/i, 'book'],
  [/game|gaming/i, 'game'], [/cricket/i, 'cricket'], [/football|soccer/i, 'sports'], [/basketball/i, 'basketball'], [/tennis|badminton/i, 'tennis'], [/gym|weight|fitness/i, 'fitness'],
  [/yoga|meditation|wellness/i, 'wellness'], [/run|jog|marathon/i, 'running'], [/swim/i, 'swim'], [/golf/i, 'golf'], [/chess/i, 'chess'],
  [/fashion|cloth|apparel|dress|wear/i, 'fashion'], [/shoe|footwear|sneaker/i, 'shoe'], [/jewel|ring|gold/i, 'ringjewel'], [/perfume|fragrance|skincare|lotion|cream/i, 'personal-care'],
  [/makeup|cosmetic|lipstick/i, 'beauty'], [/hair/i, 'haircut'], [/luxury|premium/i, 'luxury'], [/online|e-?commerce|website|app/i, 'cart'], [/store|shop|mall|retail|supermarket/i, 'shopping'],
  [/travel|holiday|vacation|tour/i, 'tourism'], [/hotel|resort/i, 'hotel'], [/beach/i, 'beach'], [/mountain|hiking|trek/i, 'mountain'], [/camp/i, 'tent'],
  [/baby|infant|newborn/i, 'parenting'], [/child|kid|toddler/i, 'child'], [/toy/i, 'toy'],
  [/art|design|craft|paint/i, 'art'], [/photo|camera|instagram|youtube|creator|influenc/i, 'creator'], [/video/i, 'video'], [/garden|plant/i, 'plant'], [/environment|sustainab|eco/i, 'seedling'],
  [/volunteer|charity/i, 'heart'], [/screen reader|voice|keyboard|zoom|larger text/i, 'glasses'], [/disab|wheelchair/i, 'wheelchair'],
  [/rural|village|country ?side/i, 'leaf'], [/urban|city|metro/i, 'apartment'], [/suburb/i, 'house2'],
  [/single/i, 'person'], [/married|partner|relationship/i, 'heart'], [/divorc|separat|widow/i, 'person'],
  [/always|very|extremely|definitely/i, 'star2'], [/often|frequent|regular/i, 'fire'], [/sometimes|occasional/i, 'neutral'], [/rarely|seldom/i, 'snow'],
  [/other/i, 'sparkles']
];
export function iconFor(label, value) {
  const s = `${label}`;
  for (const [re, ic] of RULES) if (re.test(s) || (value && re.test(String(value)))) return ic;
  return null;
}

// Picks the emoji shown beside every question title, from the question's (English) text / name.
const QRULES = [
  [/\bincome|salary|earn/i, 'money'], [/swimming pool|hot tub|spa\b/i, 'swim'], [/cigarette|smok|vape|tobacco/i, 'smoking'], [/parenting|parent\b/i, 'parenting'], [/physically challenged|disab/i, 'wheelchair'],
  [/credit card|debit card|cards? you have/i, 'card2'], [/pension|retire/i, 'piggy'], [/seeking a job|job search|looking for (a )?job/i, 'target'],
  [/speciali[sz]ation|expertise|skill/i, 'medal'], [/webcam|camera|dvr/i, 'video'], [/live (entertainment|event)|concert|festival|ticket/i, 'ticket'],
  [/advert|commercial|promotion/i, 'tag'], [/taste test|beverage|tasting/i, 'juice'], [/focus group|interview|participate/i, 'mic'], [/luxury|premium/i, 'luxury'],
  [/ride.?hailing|taxi|cab/i, 'taxi'], [/entertainment|discover new/i, 'popcorn'], [/smart.?phone|cell phone|mobile.?phone/i, 'tech'],
  [/first name|last name|middle name|full name|your name|nickname/i, 'person'], [/e-?mail/i, 'envelope'], [/phone|mobile number|whatsapp/i, 'phonecall'],
  [/birth|\bage\b|how old/i, 'cake'], [/gender|sex\b/i, 'person'], [/nationality|citizenship|passport/i, 'passport'], [/country|countries/i, 'globe'],
  [/\bstate\b|province|region|county|district/i, 'map'], [/city|town|village/i, 'apartment'], [/zip|postal|pin ?code/i, 'package'], [/address|street|landmark/i, 'home'],
  [/language/i, 'sms'], [/religio|faith/i, 'sparkles'], [/marital|relationship|partner|spouse/i, 'heart'], [/\bchild|\bkids?\b|\bsons?\b|daughter/i, 'child'], [/baby|pregnan|infant/i, 'baby_bottle'],
  [/household|family|people live|members/i, 'family'], [/income|salary|earn|revenue|turnover|budget|spend|cost|price/i, 'money'], [/bank|account number|ifsc|iban|swift/i, 'banking'],
  [/upi|paypal|payment|pay /i, 'card2'], [/education|degree|qualification|school|college|study|studies|student/i, 'graduation'],
  [/job title|designation|role|position|seniority/i, 'briefcase2'], [/employ|occupation|profession|work|career|industry|sector|department|company|organi[sz]ation|employer|business/i, 'professional'],
  [/linkedin|website|url|social|instagram|youtube|facebook|twitter|tiktok/i, 'creator'], [/decision|purchase|procure|vendor|supplier/i, 'handshake'],
  [/\bcars?\b|\bsuvs?\b|vehicle|\bdriv(e|ing|er)|licen[cs]e/i, 'automobile'], [/bike|motorcycle|scooter|two.?wheeler/i, 'motorbike'], [/travel|trip|holiday|vacation|flight|airline|hotel/i, 'travel'],
  [/\bpets?\b|\bdogs?\b|\bcats?\b/i, 'pawprint'], [/smok|tobacco|cigar|vape/i, 'smoking'], [/alcohol|drink|beer|wine|spirit/i, 'cocktail'], [/food|eat|diet|meal|cook|restaurant|snack/i, 'food'],
  [/health|medical|illness|condition|doctor|hospital|medicine|insurance/i, 'health'], [/fitness|exercise|sport|gym|yoga/i, 'fitness'], [/game|gaming|console/i, 'game'],
  [/music|song|radio|podcast/i, 'music'], [/\btv\b|television|movie|film|stream|ott|watch/i, 'media'], [/news|newspaper|magazine|read/i, 'news'],
  [/phone|smartphone|device|gadget|laptop|computer|tablet|electronic|tech|software|app/i, 'tech'], [/internet|wi-?fi|broadband|data plan|telecom|operator|carrier/i, 'wifi'],
  [/shop|buy|brand|store|retail|online/i, 'shoppingbag'], [/fashion|cloth|apparel|wear/i, 'fashion'], [/beauty|skin|makeup|cosmetic|hair|grooming/i, 'beauty'],
  [/\bhome\b|house|property|\brent|\bown\b|residence|live in/i, 'house2'], [/energy|electric|solar|power/i, 'lightning'], [/environment|sustainab|recycl|green/i, 'recycle'],
  [/invest|stock|crypto|mutual|trading|saving/i, 'chart'], [/credit|loan|debt|mortgage/i, 'coin'], [/volunteer|charity|donat/i, 'sparkle_heart'],
  [/survey|research|panel|opinion/i, 'research'], [/\btime\b|often|frequen|how many hours|when/i, 'clock'], [/how many|number of|count/i, 'dice'],
  [/hobby|hobbies|interest|leisure|free time|weekend/i, 'art'], [/accessib|disab|assist/i, 'wheelchair'], [/security|password|secret/i, 'lock'],
  [/rating|satisf|recommend|\blike\b|prefer|favou?rite/i, 'star2'], [/comment|anything else|tell us|describe|specify|note/i, 'pencil']
];
export function questionIcon(text, name, opts) {
  const s = `${text || ''} ${String(name || '').replace(/-/g, ' ')}`;
  for (const [re, ic] of QRULES) if (re.test(s)) return ic;
  if (opts && opts.length) {
    const c = {};
    for (const o of opts.slice(0, 30)) { const i = iconFor(o[0], o[1]); if (i && i !== 'check' && i !== 'cross') c[i] = (c[i] || 0) + 1; }
    const best = Object.entries(c).sort((a, b) => b[1] - a[1])[0];
    if (best) return best[0];
  }
  return 'question';
}
export const ALL_ICON_NAMES = () => [...new Set([...RULES, ...QRULES].map((r) => r[1]))];
