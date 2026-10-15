-- Reduce browser-role privileges on exposed tables. RLS policies remain the row-level authorization boundary.
REVOKE ALL PRIVILEGES ON TABLE
  public.admin_users,
  public.reports,
  public.report_photos,
  public.comments,
  public.community_priorities,
  public.notification_queue,
  public.congress_members,
  public.congress_bills,
  public.congress_saved_items,
  public.report_events,
  public.policy_trackers,
  public.tetris_scores
FROM PUBLIC, anon, authenticated;

-- Admin identity: authenticated users may read only their own record through RLS.
GRANT SELECT ON TABLE public.admin_users TO authenticated;

-- Reports: public users submit and read; RLS limits public reads to verified rows and submissions to pending rows.
GRANT SELECT, INSERT ON TABLE public.reports TO anon, authenticated;
GRANT UPDATE ON TABLE public.reports TO authenticated;

-- Comments: public reads/inserts are restricted by existing RLS policies; management remains admin-only.
GRANT SELECT, INSERT ON TABLE public.comments TO anon, authenticated;
GRANT UPDATE, DELETE ON TABLE public.comments TO authenticated;

-- Photo metadata: public insert and verified-only read are restricted by RLS.
GRANT SELECT, INSERT ON TABLE public.report_photos TO anon, authenticated;

-- Public read; writes require authenticated admin RLS policy.
GRANT SELECT ON TABLE public.community_priorities TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.community_priorities TO authenticated;

-- Admin-only notification queue, enforced by RLS.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.notification_queue TO authenticated;

-- Public source data is read-only from browser clients.
GRANT SELECT ON TABLE public.congress_members, public.congress_bills TO anon, authenticated;

-- Users can manage only their own saved items under ownership RLS policies.
GRANT SELECT, INSERT, DELETE ON TABLE public.congress_saved_items TO authenticated;

-- Timeline and policy tracker data are read-only to clients; RLS limits rows to verified reports.
GRANT SELECT ON TABLE public.report_events, public.policy_trackers TO anon, authenticated;

-- Public leaderboard supports score submissions and reads, not client-side edits or deletes.
GRANT SELECT, INSERT ON TABLE public.tetris_scores TO anon, authenticated;
