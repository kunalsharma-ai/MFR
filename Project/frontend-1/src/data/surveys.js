
import { SURVEY_CATEGORIES } from './community.js';

export const CONSUMER_SURVEYS = [
  { id: 'health', seg: 'consumer', tag: 'Health', title: 'Health & Wellness', desc: 'Fitness, nutrition, sleep and the wellness products you rely on.', range: '$4–$7', mins: 12, icon: 'heart', tone: '#E8457A' },
  { id: 'auto', seg: 'consumer', tag: 'Automotive', title: 'Cars & EVs', desc: 'Driving habits, EV charging, insurance and your next vehicle.', range: '$4–$7', mins: 15, icon: 'activity', tone: '#2F6BFF' },
  { id: 'finance', seg: 'consumer', tag: 'Finance', title: 'Banking & Payments', desc: 'Cards, digital wallets, savings and the apps you bank with.', range: '$4–$7', mins: 14, icon: 'coins', tone: '#0E9F6E' },
  { id: 'gaming', seg: 'consumer', tag: 'Gaming', title: 'Mobile & Console Gaming', desc: 'The games you play, how you discover them and what you spend.', range: '$4–$7', mins: 10, icon: 'mobile', tone: '#8B5CF6' },
  { id: 'family', seg: 'consumer', tag: 'Family', title: 'Parenting & Family', desc: 'Household decisions, kids’ products and family routines.', range: '$4–$7', mins: 12, icon: 'user', tone: '#FF8A00' },
  { id: 'beauty', seg: 'consumer', tag: 'Beauty', title: 'Beauty & Personal Care', desc: 'Skincare, haircare, grooming and the brands you trust.', range: '$4–$7', mins: 11, icon: 'sparkle', tone: '#D6336C' },
  { id: 'pets', seg: 'consumer', tag: 'Pets', title: 'Pet Owners', desc: 'Pet food, care, insurance and everyday life with pets.', range: '$4–$7', mins: 10, icon: 'heart', tone: '#C77700' },
  { id: 'streaming', seg: 'consumer', tag: 'Media', title: 'Streaming & Social Media', desc: 'Shows, podcasts, creators and the platforms you scroll.', range: '$4–$7', mins: 12, icon: 'eye', tone: '#14C9B5' },
  { id: 'home', seg: 'consumer', tag: 'Home', title: 'Home & Living', desc: 'Appliances, furniture, smart-home devices and renovations.', range: '$4–$7', mins: 13, icon: 'layers', tone: '#7048E8' },
  { id: 'sports', seg: 'consumer', tag: 'Sports', title: 'Sports & Fitness Fans', desc: 'Cricket, football, fantasy leagues, gyms and gear.', range: '$4–$7', mins: 10, icon: 'trend', tone: '#E8590C' },
];

export const PRO_SURVEYS = [
  { id: 'itdm', seg: 'pro', tag: 'IT', title: 'IT Decision Makers', desc: 'Software, cloud and infrastructure you evaluate or buy.', tier: 3, mins: 20, icon: 'database', tone: '#2F6BFF', who: 'CIOs · IT managers · architects' },
  { id: 'cyber', seg: 'pro', tag: 'Security', title: 'Cybersecurity Leaders', desc: 'Threats, tools and budgets for keeping organisations safe.', tier: 3, mins: 20, icon: 'shield', tone: '#0B1E5B', who: 'CISOs · security engineers' },
  { id: 'hcp', seg: 'pro', tag: 'Healthcare', title: 'Healthcare Professionals', desc: 'Clinical practice, treatments, devices and care pathways.', tier: 3, mins: 25, icon: 'medical', tone: '#D6336C', who: 'Doctors · nurses · pharmacists' },
  { id: 'finance', seg: 'pro', tag: 'Finance', title: 'Finance & Accounting', desc: 'Tools, regulation and how finance teams make decisions.', tier: 2, mins: 18, icon: 'coins', tone: '#0E9F6E', who: 'CFOs · CAs · finance managers' },
  { id: 'hr', seg: 'pro', tag: 'HR', title: 'HR & People Leaders', desc: 'Hiring, training, payroll and workplace technology.', tier: 2, mins: 15, icon: 'user', tone: '#8B5CF6', who: 'CHROs · HR managers · recruiters' },
  { id: 'procure', seg: 'pro', tag: 'Procurement', title: 'Procurement & Supply Chain', desc: 'How vendors are chosen, contracts set and goods moved.', tier: 2, mins: 18, icon: 'clipboard', tone: '#C77700', who: 'Buyers · supply-chain heads' },
  { id: 'marketing', seg: 'pro', tag: 'Marketing', title: 'Marketing & Advertising', desc: 'Campaigns, media buying, martech and brand strategy.', tier: 2, mins: 15, icon: 'trend', tone: '#E8590C', who: 'CMOs · brand & digital managers' },
  { id: 'smb', seg: 'pro', tag: 'SMB', title: 'Small Business Owners', desc: 'Running a business: banking, software, hiring and growth.', tier: 2, mins: 15, icon: 'briefcase', tone: '#FF8A00', who: 'Founders · owners · freelancers' },
  { id: 'engineering', seg: 'pro', tag: 'Industry', title: 'Manufacturing & Engineering', desc: 'Plant operations, automation, quality and equipment.', tier: 2, mins: 20, icon: 'activity', tone: '#14C9B5', who: 'Plant heads · engineers' },
  { id: 'legal', seg: 'pro', tag: 'Legal', title: 'Legal & Compliance', desc: 'Regulation, contracts and the tools legal teams use.', tier: 3, mins: 20, icon: 'book', tone: '#1E3A9E', who: 'Counsel · compliance officers' },
  { id: 'education', seg: 'pro', tag: 'Education', title: 'Teachers & Trainers', desc: 'Classrooms, ed-tech and learning outcomes.', tier: 1, mins: 15, icon: 'book', tone: '#7048E8', who: 'Teachers · L&D managers' },
  { id: 'agri', seg: 'pro', tag: 'Agriculture', title: 'Agriculture & AgTech', desc: 'Seeds, crop protection, machinery and farm technology.', tier: 1, mins: 15, icon: 'globe', tone: '#2F9E44', who: 'Farm owners · agronomists' },
];

// All consumer surveys: the six supplied categories first, then the additional ones
export const ALL_CONSUMER_SURVEYS = [...SURVEY_CATEGORIES.map((s) => ({ ...s, seg: 'consumer' })), ...CONSUMER_SURVEYS];
export const TIER_LABEL = { 1: 'Standard B2B reward', 2: 'Higher reward', 3: 'Premium reward' };
