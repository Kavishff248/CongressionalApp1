# CivicSignal technical implementation

CivicSignal is a working web application, not a static HTML mockup.

## Stack

- HTML5 for the application shell
- CSS3 for the responsive interface and dark mode
- JavaScript for routing, state, API calls, maps, calculations, and event handling
- Supabase Postgres for persistent community reports and civic-event data
- Supabase Row Level Security for public/private access rules
- Supabase Edge Functions for server-side Census access, AI explanation, Congress data, and report review
- Leaflet + OpenStreetMap for interactive mapping
- Census Bureau 2024 ACS 5-year data for county measures
- National Weather Service, FEMA, NIFC/WFIGS, and SCDOT for map layers
- GitHub Pages for the public deployment

## Report flow

1. A resident submits an observable issue.
2. The browser sends the report to Supabase.
3. The report is stored with pending status.
4. An authenticated reviewer can verify or reject it.
5. Only verified reports are returned to the public application.
6. Verified reports can carry policy trackers and documented event history.
7. The Civic Action Pathway shows which stages have actual evidence.

The public client never receives a service-role key.

## Census flow

The browser calls the census-data Edge Function. The Census API key stays in Supabase secrets instead of config.js.

For county selection, the function requests 2024 ACS 5-year variables and returns the county data plus the South Carolina state data used for context.

## Evidence model

CivicSignal separates:

- primary-source data
- values calculated from primary-source variables
- generated AI explanations
- general civic pathway guidance
- community observations

This keeps a generated explanation from being presented as if it were an official source.

## Why the district focus is real

The homepage focuses on five counties in the current South Carolina 7th District footprint: Florence, Darlington, Dillon, Marion, and Marlboro. Florence County is only partly in the district.

The district source page identifies Chesterfield, Darlington, Dillon, Georgetown, Horry, Marion, and Marlboro Counties plus parts of Florence County as the district footprint. The app does not claim that the five displayed counties are the entire district.

## Demo readiness

The public report system should be demonstrated with a real submission:

submit -> pending -> admin review -> verified -> map -> policy pathway

If there are no verified reports, CivicSignal displays an honest empty state instead of inventing sample reports.
