-- Postgres row-level security for workspace isolation (run as a DB superuser or owner).
-- This repo uses FastAPI + JWT in the application layer; RLS adds defense-in-depth at the database.
--
-- Supabase: replace current_setting(...) policies with auth.jwt()->>'workspace_id' or your JWT helper,
-- and ensure the API role is not the service role that bypasses RLS unless you intend that.
--
-- Self-hosted Postgres + SQLAlchemy: you must set the workspace for each DB session, e.g.:
--   SET LOCAL app.workspace_id = '<uuid>';
-- (typically from middleware using the JWT after authentication). Until that exists, do not enable
-- these policies or connections without the GUC will see no rows.

-- Example for tables that expose workspace_id (adjust table/column names to match your schema):

-- ALTER TABLE features ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE epics ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY workspace_isolation_features ON features
--   FOR ALL
--   USING (
--     workspace_id IS NOT NULL
--     AND workspace_id = current_setting('app.workspace_id', true)
--   );

-- CREATE POLICY workspace_isolation_epics ON epics
--   FOR ALL
--   USING (
--     workspace_id IS NOT NULL
--     AND workspace_id = current_setting('app.workspace_id', true)
--   );

-- CREATE POLICY workspace_isolation_vendors ON vendors
--   FOR ALL
--   USING (
--     workspace_id IS NOT NULL
--     AND workspace_id = current_setting('app.workspace_id', true)
--   );

-- Supabase-oriented variant (only if you use Supabase Auth JWT claims):
-- CREATE POLICY "Isolate Workspace Features" ON features
--   FOR ALL
--   USING (workspace_id = (auth.jwt()->>'workspace_id'));
