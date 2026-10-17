
import { INDUSTRIES, DEPARTMENTS, JOB_TITLES } from './profiles.js';

export const OTHER = 'Other';


export const EMPLOYMENT_STATUS = [
  { value: 'Employed full-time', kind: 'employed' },
  { value: 'Employed part-time', kind: 'employed' },
  { value: 'Government/Public Employee', kind: 'employed' },
  { value: 'Temporary & Seasonal Employed', kind: 'employed' },
  { value: 'Self-employed full-time', kind: 'own' },
  { value: 'Self-employed part-time', kind: 'own' },
  { value: 'Freelancer', kind: 'own' },
  { value: 'Unemployed', label: 'Unemployed / Not Working', kind: 'between' },
  { value: 'Retired', kind: 'between' },
  { value: 'homemaker', label: 'Homemaker', kind: 'between' },
];
export const employmentKind = (status) => (EMPLOYMENT_STATUS.find((s) => s.value === status) || {}).kind || '';

// Extra group for people who work for themselves.
const INDEPENDENT = {
  group: 'Independent & Freelance',
  items: ['Freelance Services', 'Consulting & Advisory', 'Creative Studio / Agency', 'Small Business / Retail Shop', 'Trades & Contracting'],
};

// Industries offered for an employment status:
//   employed  → every industry
//   own       → private-sector industries + the "Independent & Freelance" group (public-sector / armed-forces roles are salaried)
//   between   → every industry (they pick the one they last worked in)
export function industriesFor(status) {
  const kind = employmentKind(status);
  if (!kind) return [];
  if (kind === 'own') return [...INDUSTRIES.filter((g) => g.group !== 'Public Sector & Defence'), INDEPENDENT];
  return INDUSTRIES;
}
export const industryQuestion = (status) => (employmentKind(status) === 'between' ? 'Which industry did you last work in?' : employmentKind(status) === 'own' ? 'Which industry is your work / business in?' : 'Which industry do you work in?');

const SPECIALIZATIONS = {
  'IT & Software': ['Software Development', 'Cloud & DevOps', 'Cybersecurity', 'Data, Analytics & AI', 'IT Services & Consulting', 'Enterprise Software (ERP / CRM)', 'QA & Testing'],
  'Semiconductors': ['Chip Design', 'Fabrication & Foundry', 'Packaging & Test', 'Equipment & Materials', 'Embedded Systems'],
  'Telecommunications': ['Mobile Networks', 'Broadband & Fibre', 'Telecom Equipment', 'Satellite & Wireless', 'Managed Services'],
  'Internet Services': ['E-commerce Platforms', 'Web Hosting & Domains', 'Online Marketplaces', 'SaaS Platforms', 'Search & Social'],
  'Digital Marketing': ['SEO & Content', 'Paid Media & Performance', 'Social Media', 'Marketing Automation', 'Analytics & CRO'],
  'Industrial Robotics': ['Robot Manufacturing', 'Automation Integration', 'Vision Systems', 'Maintenance & Servicing', 'Research & Development'],
  'AgTech': ['Precision Farming', 'Farm Software & IoT', 'Drones & Sensors', 'Agri-Biotech', 'Supply Chain Tech'],
  'Automotive': ['Passenger Vehicles', 'Commercial Vehicles', 'EVs & Batteries', 'Auto Components', 'Dealerships & Aftermarket'],
  'Aerospace': ['Aircraft Manufacturing', 'Avionics', 'Maintenance, Repair & Overhaul', 'Space Systems', 'Defence Aerospace'],
  'Chemicals': ['Specialty Chemicals', 'Petrochemicals', 'Agrochemicals', 'Paints & Coatings', 'Industrial Gases'],
  'Pharmaceuticals': ['Generic Drugs', 'Branded & Specialty Drugs', 'Biotech & Biologics', 'Contract Research & Manufacturing', 'Regulatory Affairs', 'Clinical Trials'],
  'Electronics': ['Consumer Electronics', 'Industrial Electronics', 'PCB & Components', 'Electronics Manufacturing Services', 'Home Appliances'],
  'Steel': ['Primary Steel Production', 'Steel Processing', 'Alloys & Special Steel', 'Steel Trading', 'Foundry & Castings'],
  'Textiles': ['Spinning & Weaving', 'Garment Manufacturing', 'Technical Textiles', 'Dyeing & Processing', 'Textile Machinery'],
  'Petroleum, Oil & Gas': ['Exploration & Production', 'Refining', 'Pipelines & Midstream', 'Oilfield Services', 'Fuel Retail & Distribution'],
  'Electric Power': ['Thermal Power', 'Solar & Wind', 'Transmission & Distribution', 'Power Equipment', 'Energy Trading'],
  'Mining': ['Coal', 'Metals & Minerals', 'Quarrying', 'Mining Equipment', 'Exploration & Geology'],
  'Shipbuilding': ['Commercial Shipbuilding', 'Naval Shipbuilding', 'Ship Repair', 'Marine Equipment', 'Offshore Structures'],
  'Pulp & Paper': ['Paper Manufacturing', 'Packaging Paper', 'Pulp Production', 'Tissue & Specialty Paper', 'Paper Recycling'],
  'Financial Services': ['Retail Banking', 'Investment Banking', 'Asset & Wealth Management', 'Fintech & Payments', 'Lending & NBFC', 'Capital Markets'],
  'Insurance': ['Life Insurance', 'Health Insurance', 'General / Property & Casualty', 'Reinsurance', 'Brokerage & Underwriting'],
  'Healthcare Services': ['Hospitals', 'Diagnostics & Labs', 'Telemedicine', 'Medical Devices', 'Health IT', 'Clinics & Primary Care'],
  'Education': ['School Education (K-12)', 'Higher Education', 'EdTech', 'Vocational & Skill Training', 'Test Prep & Coaching'],
  'Hospitality': ['Hotels & Resorts', 'Restaurants & Catering', 'Travel & Tourism', 'Events & Conferences', 'Online Travel Agencies'],
  'Real Estate': ['Residential', 'Commercial', 'Construction & Development', 'Property Management', 'Real Estate Investment'],
  'Retail': ['Grocery & FMCG', 'Fashion & Apparel', 'Consumer Electronics Retail', 'E-commerce Retail', 'Franchise & Convenience'],
  'Transport & Logistics': ['Road Freight', 'Air & Sea Cargo', 'Warehousing', 'Courier & Last-mile', 'Railways', 'Supply Chain Software'],
  'Professional Services': ['Management Consulting', 'Accounting & Audit', 'HR & Staffing', 'Engineering Services', 'Market Research'],
  'Legal Services': ['Corporate Law', 'Litigation', 'IP & Patents', 'Compliance & Regulatory', 'In-house Counsel'],
  'Advertising': ['Creative Agencies', 'Media Buying', 'Brand Strategy', 'Outdoor Advertising', 'PR & Communications'],
  'Broadcasting': ['Television', 'Radio', 'OTT & Streaming', 'Production Studios', 'Broadcast Technology'],
  'Publishing': ['Books', 'Magazines', 'Digital Publishing', 'Educational Publishing', 'Printing'],
  'News Media': ['Newspapers', 'Digital News', 'TV News', 'News Agencies', 'Investigative Journalism'],
  'Film': ['Production', 'Distribution', 'Post-production & VFX', 'Animation', 'Cinemas & Exhibition'],
  'Music': ['Recording & Labels', 'Live Events & Concerts', 'Streaming & Distribution', 'Music Production', 'Instruments & Gear'],
  'Video Games': ['Game Development', 'Game Publishing', 'Esports', 'Mobile Games', 'Game Tools & Engines'],
  'Fashion': ['Apparel Design', 'Luxury & Accessories', 'Footwear', 'Fashion Retail', 'Beauty & Cosmetics'],
  'Sport': ['Professional Sports', 'Fitness & Wellness', 'Sports Goods', 'Sports Media', 'Sports Events & Management'],
  'Agriculture': ['Crop Farming', 'Agri-inputs', 'Agri Trading & Cooperatives', 'Organic Farming', 'Farm Services'],
  'Horticulture': ['Fruits & Vegetables', 'Floriculture', 'Nurseries & Greenhouses', 'Plantation Crops', 'Landscaping'],
  'Fishing': ['Marine Fishing', 'Aquaculture', 'Fish Processing', 'Fishing Equipment', 'Export & Trade'],
  'Food Processing': ['Packaged Foods', 'Beverages', 'Dairy', 'Bakery & Confectionery', 'Meat & Seafood Processing', 'Edible Oils'],
  'Livestock': ['Dairy Farming', 'Poultry', 'Cattle, Goat & Sheep', 'Animal Feed', 'Veterinary Services'],
  'Seeds & Crop Protection': ['Seed Production', 'Pesticides & Herbicides', 'Bio-products & Fertilisers', 'Plant Breeding', 'Distribution & Retail'],
  'Farm Machinery': ['Tractors', 'Harvesters', 'Irrigation Equipment', 'Farm Implements', 'Dealers & Service'],
  'Government': ['Central / Federal Government', 'State / Provincial Government', 'Local Government', 'Regulatory Bodies', 'Policy & Planning'],
  'Public Administration': ['Civil Services', 'Taxation & Revenue', 'Municipal Services', 'Judicial Administration', 'Public Procurement'],
  'Public Utilities': ['Water Supply', 'Electricity Utilities', 'Waste Management', 'Gas Utilities', 'Public Transport'],
  'Defence Contractors': ['Defence Manufacturing', 'Systems Integration', 'Intelligence & Cyber', 'Maintenance & Support', 'Research & Development'],
  'Armed Forces': ['Army', 'Navy', 'Air Force', 'Veteran Services', 'Defence Training & Support'],
  'Public Sector Undertakings': ['Energy', 'Banking & Finance', 'Infrastructure', 'Manufacturing', 'Transport'],
  'Freelance Services': ['Writing & Translation', 'Design & Creative', 'Software & Web', 'Coaching & Training', 'Photography & Video'],
  'Consulting & Advisory': ['Management', 'Finance & Tax', 'IT & Technology', 'HR & Training', 'Marketing & Strategy'],
  'Creative Studio / Agency': ['Branding & Design', 'Web & App Studio', 'Video & Animation', 'Marketing Agency', 'PR & Content'],
  'Small Business / Retail Shop': ['Grocery & General Store', 'Fashion & Boutique', 'Restaurant & Café', 'Online Store', 'Salon & Personal Services'],
  'Trades & Contracting': ['Construction & Civil', 'Electrical & Plumbing', 'Interior & Fit-out', 'Repair & Maintenance', 'Transport & Delivery'],
};

// Specializations offered for an industry (always ends with "Other").
export const specializationsFor = (industry) => (industry ? [...(SPECIALIZATIONS[industry] || []), OTHER] : []);

export const DEPARTMENT_OPTIONS = [...DEPARTMENTS, OTHER];
export const JOB_TITLE_GROUPS = JOB_TITLES.map((t) => ({ group: t.tier, items: t.items }));

// Flat {value,label,group?} lists for the 5 dropdowns, same shape the backend options have (used by the fallback).
export function staticLists(v) {
  const flat = (groups) => groups.flatMap((g) => g.items.map((i) => ({ value: i, label: i, group: g.group })));
  const plain = (arr) => arr.map((i) => ({ value: i, label: i }));
  return {
    empstat: EMPLOYMENT_STATUS.map((o) => ({ value: o.value, label: o.label || o.value })),
    industry: flat(industriesFor(v.empstat)),
    sector: plain(specializationsFor(v.industry)),
    department: plain(DEPARTMENT_OPTIONS),
    jobrole: [...flat(JOB_TITLE_GROUPS), { value: OTHER, label: `${OTHER} (type it)` }],
  };
}
