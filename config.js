/*
  Runtime configuration.
  Keep this file free of private secrets.
  Supabase anon keys are designed for browser use when RLS is correctly configured.
  For live Congress.gov data, set CONGRESS_API_KEY. The app remains usable in demo mode
  when the key is blank.
*/
window.APP_CONFIG = {
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",
  CONGRESS_API_KEY: "",
  DATA_MODE: "auto"
};
