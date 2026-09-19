# CivicSignal

> Know what is happening in your community before it becomes a problem.

CivicSignal is a nonpartisan civic-data web app built around:

**Problem → Evidence → Government pathway → Action**

## What is working

- South Carolina Community Explorer using Census Bureau 2024 ACS 5-year data
- District-focused homepage for South Carolina's 7th Congressional District footprint
- Live county cards for Florence, Darlington, Dillon, Marion, and Marlboro
- Interactive Leaflet/OpenStreetMap issue map
- Live public layers from National Weather Service, FEMA, NIFC/WFIGS, and SCDOT
- Real community issue submission form with map pinning and exact-address support
- Supabase persistence for reports
- Pending → human review → verified publication workflow
- Admin review desk with verify, reject, and remove controls
- Verified Filed Reports page
- Civic Action Pathway scorecard
- Policy Impact Tracker with responsible-agency guidance, funding pathways, public-meeting guidance, and documented event history
- Community signal clustering for nearby verified reports
- Community conditions snapshot with a transparent, non-official formula
- Rule-based trend checks using 2020–2024 ACS 5-year history
- Congressional and federal-program context linked to primary government sources
- Source library
- Responsive desktop/mobile interface and dark mode

## Real report workflow

Community reports are not fake demo records.

A submitted report is stored as 'pending'. It does not appear on the public map until an authorized reviewer verifies it. Verified reports can then appear in the map and Filed Reports page and can carry documented civic-event history.

If there are no verified reports, the public interface shows an honest empty state rather than inventing reports.

## Local focus

The current homepage focuses on five counties in the South Carolina 7th Congressional District footprint:

- Florence County — part of the county is in the district
- Darlington County
- Dillon County
- Marion County
- Marlboro County

The district also includes Chesterfield, Georgetown, and Horry Counties. The app does not claim that the five displayed counties are the whole district.

County statistics are fetched through the Supabase census-data Edge Function from the Census Bureau's 2024 ACS 5-year dataset.

The app also uses documented local federal project records as evidence links. These are presented as records and sources, not as endorsements or proof of a political position.

## Technical implementation

CivicSignal is not a static HTML mockup.

- **Frontend:** HTML, CSS, JavaScript
- **Database:** Supabase Postgres
- **Security:** Supabase Row Level Security
- **Server-side functions:** Supabase Edge Functions
- **Mapping:** Leaflet + OpenStreetMap
- **Public data:** Census Bureau, National Weather Service, FEMA, NIFC/WFIGS, SCDOT
- **Deployment:** GitHub Pages

The browser contains only the Supabase publishable key. Secret/service-role credentials are not committed to the repository. The Census API key stays in Supabase secrets.

See TECHNICAL.md for the architecture and data flow.

## Evidence model

CivicSignal distinguishes:

1. **Verified evidence** — data returned by a cited primary source.
2. **Calculated values** — rates or indexes derived from documented source variables.
4. **Civic pathways** — general jurisdiction guidance that users are told to verify.
5. **Community observations** — user-submitted reports that are separate from official data until reviewed.


## Demo

See DEMO_VIDEO_SCRIPT.md for the 2-minute demonstration plan.

The recommended demo flow is:

**Local problem → real county data → live map → submit report → human review → verified report → Civic Action Pathway**

## Primary sources

- U.S. Census Bureau: https://www.census.gov/
- Census data: https://data.census.gov/
- USA.gov: https://www.usa.gov/
- Congress.gov: https://www.congress.gov/
- U.S. Department of Transportation: https://www.transportation.gov/
- South Carolina Department of Transportation: https://www.scdot.org/
- National Weather Service: https://www.weather.gov/
- FEMA: https://www.fema.gov/
- National Interagency Fire Center: https://www.nifc.gov/
- OpenStreetMap: https://www.openstreetmap.org/

## Supabase

Application data includes community reports, report events, policy trackers, congressional data, and other civic application tables.

RLS is enabled on exposed application tables. Public report inserts are allowed only into the intended report workflow; review and civic-event management are protected.

Edge Functions include:

- census-data
- congress-data
- review-report

The census-data function retrieves Census data server-side so the Census API key does not need to be exposed in the browser.

## Important

CivicSignal is an educational civic-information tool. A measured difference is not proof of a cause, and a possible funding program is not proof that a local project received funding.

The app does not recommend candidates, parties, or policy positions.
