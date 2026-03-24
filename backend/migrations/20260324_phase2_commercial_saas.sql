-- Phase 2: Stripe billing and S3 vault schema updates.
ALTER TABLE workspaces ADD COLUMN stripe_customer_id VARCHAR DEFAULT '';
ALTER TABLE workspaces ADD COLUMN stripe_subscription_id VARCHAR DEFAULT '';
ALTER TABLE workspaces ADD COLUMN plan_tier VARCHAR DEFAULT 'Seed';
ALTER TABLE workspaces ADD COLUMN subscription_status VARCHAR DEFAULT 'canceled';

CREATE TABLE IF NOT EXISTS compliance_documents (
  id VARCHAR PRIMARY KEY,
  filename VARCHAR NOT NULL,
  s3_key VARCHAR NOT NULL UNIQUE,
  uploaded_by VARCHAR NOT NULL,
  workspace_id VARCHAR,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(uploaded_by) REFERENCES users(id),
  FOREIGN KEY(workspace_id) REFERENCES workspaces(id)
);

CREATE INDEX IF NOT EXISTS ix_compliance_documents_id ON compliance_documents(id);
CREATE INDEX IF NOT EXISTS ix_compliance_documents_s3_key ON compliance_documents(s3_key);
CREATE INDEX IF NOT EXISTS ix_compliance_documents_uploaded_by ON compliance_documents(uploaded_by);
CREATE INDEX IF NOT EXISTS ix_compliance_documents_workspace_id ON compliance_documents(workspace_id);

CREATE TABLE IF NOT EXISTS billing_webhook_events (
  id VARCHAR PRIMARY KEY,
  event_type VARCHAR NOT NULL,
  processed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
