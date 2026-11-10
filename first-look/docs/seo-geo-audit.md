# Thruput Labs: complete source SEO and GEO audit

Audited November 7, 2026. Site: https://thruput-labs-first-look.ambrissh23.chatgpt.site/. Source: ten static documents comprising the homepage, case-study gallery, five project stories, blog index and two articles. This is a source and anonymous HTTP audit. It is not a verified Search Console, backlink, local-listing or AI-citation performance audit.

## Verdict

**The source foundation is sound after the fixes below. The current hosted site is not publicly crawlable.** Every sampled public route returned HTTP 401, including `/`, `/robots.txt`, `/sitemap.xml`, the case gallery and an article. The Sites connector separately confirms owner-private access. Metadata, a sitemap and crawler permissions inside the source cannot bypass authentication. Public access has been preserved because no audience change was requested.

There is no defensible “100/100 SEO/GEO” score here. Public indexing and actual citation performance remain unmeasured. Those are the two most important distinctions in this audit.

## Priorities

| Priority | Finding and evidence | Status / action |
| --- | --- | --- |
| P0 | Anonymous content, robots.txt and sitemap requests return 401. | **Open: launch decision.** Authorise a public launch on the intended domain, then retest page access, robots and missing URLs before submitting a sitemap. |
| P1 | Terminal has no recipient: `data-contact-email` is empty on every page. It copies a brief rather than delivering an enquiry. | **Open: business input.** Supply the receiving business email or a form endpoint. Do not count copies as leads or show a successful-send claim. |
| P1 | Canonicals currently identify the private Sites origin. | **Open: final domain.** Keep these while reviewing privately. If a custom domain is chosen, change `content/site.json`, rebuild, verify HTTPS/redirects, then submit that domain's sitemap. |
| P1 | Services are clear but brief: one homepage section covers workflow automation, connected tools, custom software and SEO/GEO/AEO. There is little material on scope, handover, maintenance or how a client starts. | **Open: content depth.** Add the business's real process, supported integrations and engagement boundaries. Consider dedicated service pages only when each can answer a distinct customer need with original detail; preserve Services linking to the home section for now. |
| P1 | Brand and author signals are limited. Ambrissh is named, but no public profile, business contact details or substantiated company location are supplied. | **Open: owner facts.** Add a short verifiable founder bio, official profile links and business contact details. Do not reuse client cities as the agency's address or invent LocalBusiness data. |
| P1 | No account-level performance data was supplied or connected. | **Unverified.** Obtain Search Console/Bing access or exports, analytics and enquiry counts. Check index coverage, real queries, crawl exclusions, manual actions and field Core Web Vitals. |
| P2 | 18 image occurrences lacked intrinsic dimensions, and gallery posters reused a generic aspect ratio. | **Fixed.** Dimensions now come from the ten actual project assets; templates and direct stories use the same measured sizes. |
| P2 | Home Services was a JavaScript-only button. | **Fixed.** It is now a real `#about` link. JavaScript enhances scrolling and closes the menu; ordinary fragment navigation also works without it. |
| P2 | Article publisher and page identities were separate from the shared site graph; case schema lacked a project image. | **Fixed.** Linked BlogPosting, WebPage, author and publisher identities; added case imagery and article word counts. |
| P2 | Several titles relied on the client name or a long editorial headline without explaining the page's subject. | **Fixed.** Search titles now describe the actual website, workflow or local SEO story. Visible editorial headings remain intact. |
| P2 | The current small header wordmark SVG is roughly 309 KB and contains 4,150 circles; the hero also uses elaborate vector artwork. | **Opportunity, unmeasured impact.** A lighter approved wordmark export could reduce transfer and rendering work. Do not reduce visual quality blindly. Compression/cache headers and real-device impact need testing on the public origin. |

## Technical results

| Check | Result |
| --- | --- |
| Pages reachable through ordinary internal links | 10/10 from the homepage; no orphan static document |
| Readable primary heading and main landmark | One H1 and one main per page |
| Titles / descriptions | Unique across all ten pages; titles 19–60 characters, descriptive summaries present |
| Canonical consistency | One absolute HTTPS canonical per page; homepage uses `/`; sitemap matches all ten |
| Robots source | `index,follow,max-image-preview:large`; robots.txt allows crawling and points to the sitemap |
| Local links / fragments / asset references | Automated checks pass; unique IDs and valid fragment targets |
| Images | Alt attribute and positive width/height on every image; decorative poster imagery has empty alt and an accessible parent link label |
| Social previews | Open Graph and Twitter metadata, existing 1200 × 630 social image |
| Structured data | Parseable Organization, WebSite, WebPage/CollectionPage, Services, ItemLists, CreativeWork, BlogPosting and BreadcrumbList data |
| False endorsement markup | No Review/AggregateRating data; robot cards describe projects rather than fabricated quotes |
| HTML content access | Service copy, project stories and articles are in static HTML. Case dialogs enhance direct, linked case-study URLs; article contents are not dependent on JavaScript generation |
| Language / mobile setup | English document language and viewport present. No unnecessary hreflang for a single-language site |
| Missing URL behavior | **Unverified publicly:** authentication returns 401 before the missing-path response can be examined. Confirm genuine 404s after launch |
| Browser performance | Prior animation measurements are in browser-validation.md. They are not Lighthouse scores or field LCP/INP/CLS measurements |

Per-page evidence: [CSV inventory](seo-page-inventory.csv), [JSON inventory and internal graph](seo-source-inventory.json), [anonymous HTTP samples](seo-public-http-check.json). Counts exclude template contents where appropriate; word counts include ordinary navigation/contact copy and are not ranking targets.

## Page and search-intent assessment

| Page | Current strength | Next useful improvement |
| --- | --- | --- |
| Home | States custom software, workflows and SEO/GEO; four explicit services | Explain typical engagement, discovery, delivery and maintenance using real operating details. Link the strongest relevant case directly from its service text when that copy is expanded |
| Case gallery | Five individually named projects with readable links and concise descriptions | Preserve the premium carousel and direct story URLs. Use proof from the project stories, not unsupported performance badges |
| Surprise Bro’s | Concrete billing, events, attendance and salary workflow; source documentation exists | Add a client-approved before/after workflow and actual delivery dates if records support them. No invented turnaround or admin-hours claims |
| Ayini Boutique | Specific local service-page and search-foundation work; AI roadmap distinguished from completed work | Publish consented baseline/retest evidence before claiming rankings or AI visibility gains. Clearly label editorial textile imagery as existing copy already does |
| Sigaram Physio | Clear clinic-website deliverables and historical ₹2,500 fee | Add client-approved launch date and maintained scope. Do not imply medical outcomes from a website build |
| PK TEX | Product catalogue and product-specific WhatsApp handoff; historical ₹4,000 fee | Show a real enquiry handoff and catalogue upkeep process, with permission |
| PS4 Gaming Lounge | Venue information and booking route; historical ₹4,000 fee | Add a substantiated implementation constraint or booking-flow example |
| Blog index | Two authored posts, stable links and clear summaries | Add a concise real author profile when supplied; publish selectively around actual client questions |
| AI-native SEO/GEO article | Original first-person analogy and a proposed verification method; primary Google links | Retain the distinction between a method and measured results. Add a worked, evidenced audit when one is available |
| Supermarket analogy article | Distinctive founder opinion and service-business positioning | Treat it as thought leadership, not the main landing page for commercial workflow or SEO searches |

The case-study fees are historical project prices supplied by the owner. They are not agency-wide starting prices. SEO copy and schema do not turn them into a general offer.

## GEO and answer-engine assessment

GEO readiness here means that useful, accurate source material is accessible, attributable and easy to reference. It does not mean inserting hidden prompts, adding unverified credentials or manufacturing citations.

Google says supporting pages in AI Overviews/AI Mode must be indexed and snippet-eligible. Existing SEO practices apply; there is no special AI schema requirement. Its guidance also says Google does not use llms.txt as a special visibility mechanism. We did not add an unnecessary AI file or FAQ rich-result promise. [Google AI features](https://developers.google.com/search/docs/appearance/ai-features), [Google generative AI optimization guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide).

The source's general Allow rule does not explicitly block Googlebot, Bingbot or OAI-SearchBot. Actual bot access still fails at the authentication gate. OpenAI documents OAI-SearchBot for search separately from GPTBot for training; neither setting substitutes for public HTTP access. No training preference was changed. [OpenAI crawler documentation](https://developers.openai.com/api/docs/bots).

The most valuable content improvement is stronger first-party evidence: actual interfaces, documented workflows, specific constraints, dated delivery facts and consented client observations. Current case copy is a better citation candidate than vague claims, but we have not demonstrated that any engine cites it.

A spot check for the exact brand and a site-restricted query did not surface a clear result for this origin in the available search results. That is a limited observation, not a complete index count, a penalty finding or a measured ranking baseline. No ChatGPT, Perplexity, Gemini or Google AI answer citation tests were represented as completed.

## Measurement and launch plan

1. Choose the public origin and explicitly authorise public access. Retest unauthenticated routes, HTTPS, www/non-www behavior, canonical alternatives, robots.txt, sitemap, assets and a deliberately missing URL. Confirm a missing URL returns 404 rather than the homepage.
2. Verify Search Console and Bing Webmaster Tools. Inspect representative URLs and submit the final sitemap. Review the search/AI reporting available in those accounts; do not infer indexing from sitemap submission alone.
3. Use the proposed query file below as a starting list. Validate intent against customer conversations and real query data. No search-volume or difficulty estimates are fabricated.
4. Capture a baseline using a fixed platform, date, location/language and account/search mode. Record a mention separately from an exact cited URL. Repeat each query three times where feasible and monthly thereafter; keep screenshots or exported responses.
5. Track impressions, clicks, enquiries and booked work separately. If available, Bing AI Performance can add citation observations, but citation counts are not clicks or leads and changing counts do not prove a particular edit caused the change. [Bing AI Performance](https://www.bing.com/webmasters/help/ai-performance-9f8e7d6c).
6. Measure public pages with PageSpeed Insights and a physical phone pass. Review field LCP, INP and CLS when sufficient field data exists; no scores were invented in this audit.

[Proposed query list and empty tracking fields](seo-geo-query-baseline.csv). Blank fields mean unmeasured, not zero. No paid tool subscription is necessary to begin these specific checks; broader backlink/competitive analysis remains outside the evidence currently available.

## Validation and boundaries

Run `python3 scripts/build_site.py`, `python3 scripts/check_seo.py`, `python3 scripts/check_case_studies.py`, `python3 scripts/audit_seo.py` and the relevant scroll/modal regressions. Source fixes are delivered with the same private audience. Contact delivery, final public domain, index status, local listing eligibility/ownership, backlink profile, real search demand, physical-device performance and actual AI citations remain explicitly open. This report completes the audit of the available site and records the checks that require additional access or owner facts.
