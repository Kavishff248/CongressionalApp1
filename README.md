# CivicSignal

> Know what is happening in your community before it becomes a problem.

CivicSignal is a nonpartisan civic-data web app built around:

Problem → Evidence → Explain → Government pathway → Action

## Implemented

- Community Explorer using the 2024 Census ACS 5-year API
- Transparent county/state comparisons for population, poverty, unemployment, and median household income
- Interactive OpenStreetMap/Leaflet issue map
- Issue categories for roads, flooding, transit, schools, environment, development, facilities, and safety
- Community issue reporting with pending-review workflow
- Map pinning for issue reports
- Supabase persistence with Row Level Security
- Saved community signals
- Evidence Explainer with a verified rule-based fallback
- Secure Supabase Edge Function for optional AI explanations
- Authorized report-review desk with verify/reject workflow
- Supabase Auth sign-in for account-only features
- Source library linking to primary government sources
- Responsive desktop/mobile UI
- GitHub Pages deployment and JavaScript validation

## Evidence model

CivicSignal distinguishes:

1. Verified evidence — data returned by primary public sources.
2. Calculated values — rates derived from documented source variables.
3. Generated explanations — text produced by the AI service when configured.
4. Civic pathways — general jurisdiction guidance that users are told to verify.

The app does not recommend candidates, parties, or policy positions.

Community reports are inserted as pending and are only shown on the public map after an administrator marks them verified.

## Supabase

Application tables include reports, report_photos, comments, community_priorities, notification_queue, civic_saved_signals, congress_members, congress_bills, and congress_saved_items.

RLS is enabled on the exposed application tables.

Edge Functions:

- congress-data
- civic-explain
- review-report

The browser contains only the Supabase publishable key. Secret/service-role credentials are never placed in the repository.

## AI explanation

The civic-explain Edge Function is deployed and requires the Supabase project secret OPENAI_API_KEY. Without that secret, CivicSignal safely keeps the source-backed fallback explanation instead of pretending an AI response was generated.

Configure the secret in Supabase Edge Function Secrets Management. Never commit it to GitHub.

## Deployment

.github/workflows/pages.yml deploys the static site to GitHub Pages after JavaScript validation.

## Primary sources

- U.S. Census Bureau: https://www.census.gov/
- Census data: https://data.census.gov/
- USA.gov: https://www.usa.gov/
- Congress.gov: https://www.congress.gov/
- U.S. Department of Transportation: https://www.transportation.gov/
- OpenStreetMap: https://www.openstreetmap.org/

## Important

CivicSignal is an educational civic-information tool. A measured difference is not proof of a cause, and a generated explanation does not replace the underlying primary source.

## Production notes

- The browser uses a Supabase publishable key only. No service-role or secret key is committed.
- Community reports are never published directly: public submissions enter `pending`, and an authorized reviewer must mark them `verified` before they appear on the map.
- Supabase Data API grants are explicit in `supabase/schema.sql`; private tables are not exposed to browser roles.
- The 2024 ACS explorer uses the Census Data API. Census now requires API keys for its Data API, so a production-wide deployment should keep the Census key server-side in Supabase rather than putting it in the browser. The current app retains a South Carolina county fallback so the interface does not silently invent data.
- GitHub Pages uses one deployment workflow: `.github/workflows/pages.yml`. JavaScript syntax is checked before deployment.
