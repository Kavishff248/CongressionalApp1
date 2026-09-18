# CongressionalApp

A nonpartisan congressional research dashboard built for students, researchers, and civic education.

## Included

- Responsive desktop/mobile interface
- Member directory with search
- Legislation tracker
- District finder
- Side-by-side member comparison
- Personal watchlist
- Optional Supabase persistence
- Row Level Security policies
- Demo dataset so the interface works before live data is connected
- GitHub Pages deployment workflow
- Loading, empty, and responsive states

## Data architecture

The app is designed around two layers:

1. Primary-source data — Congress.gov API can provide current congressional members, bills, actions, committees, and other legislative collections.
2. Supabase application data — Supabase stores normalized application records and per-user watchlists.

The browser must never contain a Supabase service-role key. Only a public anon key belongs in config.js, with RLS enabled.

## Supabase

Run supabase/schema.sql in the Supabase SQL Editor.

Then set these public browser values in config.js:

    window.APP_CONFIG = {
      SUPABASE_URL: "https://YOUR_PROJECT.supabase.co",
      SUPABASE_ANON_KEY: "YOUR_PUBLIC_ANON_KEY",
      CONGRESS_API_KEY: "",
      DATA_MODE: "auto"
    };

Never put a Supabase service-role key in this repository.

## Congress.gov live data

The Congress.gov API is the intended primary source for live federal legislative records. It requires an API key. The current UI therefore uses a clearly labeled demo fallback instead of pretending that sample records are live.

For production, the Congress.gov key should be used by a server-side data layer rather than shipped to every browser.

## Deployment

The repository includes .github/workflows/pages.yml for GitHub Pages. Set GitHub Pages to use GitHub Actions as its source.

## Competition focus

The project is intentionally nonpartisan. It focuses on primary-source civic data, transparent descriptions, clear source/date labeling, useful search and comparison tools, accessibility, responsive design, secure user data, reproducible deployment, and clear documentation.

It does not tell users which candidate, party, member, or policy to support.

## Important

The records embedded in app.js are demonstration records. They should not be presented as current congressional facts. A live deployment should populate the database from verified primary-source records.
