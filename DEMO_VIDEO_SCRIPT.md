# CivicSignal — 2-minute Congressional App Challenge demo

## 0:00–0:15 — The local problem

Show the South Carolina map and the five district-focus counties.

Say:

“Local problems are often easy to notice but hard to follow. A resident may see flooding, a road problem, or a public-facility issue, but the next question is: who handles it, what evidence exists, and what happens after it is reported?”

If you have a real personal connection to a local issue, replace this with your own true experience. Do not invent a personal story.

## 0:15–0:35 — Real local data

Show CivicSignal homepage -> district focus -> Florence, Darlington, Dillon, Marion, and Marlboro cards.

Say:

“CivicSignal starts with real South Carolina data. The county cards are loaded through a Supabase Edge Function from the Census Bureau's 2024 American Community Survey. Population, median household income, and poverty are shown with the source identified.”

Open Community Explorer and select one county.

## 0:35–0:55 — The technical system

Show Community Explorer, then Issue Map.

Say:

“This is a JavaScript web application backed by Supabase Postgres with Row Level Security. The map combines Leaflet with public data from the National Weather Service, FEMA, NIFC/WFIGS, SCDOT, and OpenStreetMap.”

Click a live map feature and show its source.

## 0:55–1:20 — Real community report

Show Report an Issue.

Say:

“A community report is not treated as official evidence. A resident submits an observable issue and location. Supabase stores it as pending. An authorized reviewer must verify it before it appears on the public map.”

Submit a real demo report. Then show the review desk.

## 1:20–1:40 — From report to action

Show Filed Reports -> Policy Impact Tracker -> Civic Action Pathway.

Say:

“Once verified, the report can be followed through a civic pathway. CivicSignal separates a possible responsible agency or funding source from documented government action. Events such as an agency notification, public meeting, funding identification, work started, and resolution are tracked separately.”

Show the scorecard and one policy source.

## 1:40–1:55 — Local federal connection

Show the local evidence card and primary source.

Say:

“The district focus also connects local issues to documented federal programs and project records. For example, public project records for South Carolina's Seventh District include stormwater work in Dillon County and Crooked Creek improvements in Marlboro County. CivicSignal links back to the primary record instead of treating a generic federal program as proof that a local project was funded.”

## 1:55–2:00 — Close

Show the CivicSignal homepage.

Say:

“The goal is simple: find a local problem, follow the evidence, and make the public pathway easier to understand.”

## Before recording

- Use a real submitted report, not an invented sample.
- Make sure the report is verified before recording the public-map step.
- Show the live Census cards and source.
- Show at least one live map layer.
- Show the Supabase-backed report workflow.
- Replace the optional personal-connection section with your own true experience if you have one.
