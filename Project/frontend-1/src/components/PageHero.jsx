import Icon from './Icon.jsx';
import Motto from './Motto.jsx';
import { AnswerScene, DashboardScene, JourneyScene, OriginScene, PeopleScene, PhoneScene, ScannerScene, SupportScene, VaultScene } from './HeroScenes.jsx';
import { Breadcrumbs } from './Common.jsx';
import Seo from '../seo/Seo.jsx';
import { breadcrumbLd, faqLd, organizationLd, webPageLd, websiteLd } from '../seo/schema.js';

// Shared SEO wiring for a page spec from src/data/pages.js
export function PageSeo({ page, faqs = [], crumbs, extraLd = [], home = false }) {
  const ld = [
    home ? organizationLd() : null,
    home ? websiteLd() : null,
    webPageLd({ name: page.metaTitle, description: page.metaDescription, path: page.path }),
    crumbs ? breadcrumbLd(crumbs) : null,
    faqLd(faqs),
    ...extraLd,
  ];
  return (
    <Seo
      title={page.metaTitle}
      description={page.metaDescription}
      path={page.path}
      noindex={page.noindex}
      keywords={page.primaryKeyword ? [page.primaryKeyword, ...(page.secondaryKeywords || [])].join(', ') : undefined}
      jsonLd={ld}
    />
  );
}

// Distinct animated hero scene per page — keeps every page header visually unique (see HeroScenes.jsx).
const ART = {
  steps: JourneyScene, // How it works
  coins: VaultScene, // Rewards & payouts
  bubbles: PhoneScene, // For consumers
  grid: DashboardScene, // For professionals
  shield: ScannerScene, // Quality & security
  globe: PeopleScene, // Who can join
  chat: SupportScene, // Contact
  question: AnswerScene, // FAQ
  pen: OriginScene, // About
};

export default function PageHero({ eyebrow, title, lead, crumbs, theme = 'navy', art = 'grid', artNode = null, tagline = null, tone = 'con', children }) {
  const Art = ART[art] || ART.grid;
  return (
    <section className={`page-hero ph-${theme}`}>
      <div className="ph-bg" aria-hidden="true" />
      <div className="container ph-row">
        <div className="ph-copy">
          {crumbs ? <Breadcrumbs items={crumbs} /> : null}
          <Motto />
          {eyebrow ? <p className="eyebrow eyebrow-light">{eyebrow}</p> : null}
          <h1>{title}</h1>
          {tagline ? (
            <p className={`ph-tag t-${tone}`}>
              <span className="sr-only">{tagline.map((x) => x[1]).join(' ')}</span>
              {tagline.map(([ic, t], k) => <span key={t} className="ph-slot" style={{ '--k': k }} aria-hidden="true"><span><Icon name={ic} size={16} /> {t}</span></span>)}
            </p>
          ) : null}
          {lead ? <p className="ph-lead">{lead}</p> : null}
          {children}
        </div>
        <div className="ph-art-wrap" aria-hidden="true">{artNode || <Art />}</div>
      </div>
    </section>
  );
}
