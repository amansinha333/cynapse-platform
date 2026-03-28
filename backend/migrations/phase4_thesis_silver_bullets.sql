ALTER TABLE audit_intelligence
ADD COLUMN IF NOT EXISTS decision_hash VARCHAR NOT NULL DEFAULT 'genesis',
ADD COLUMN IF NOT EXISTS previous_hash VARCHAR NOT NULL DEFAULT 'genesis';

CREATE TABLE IF NOT EXISTS policy_conflicts (
    id VARCHAR PRIMARY KEY,
    workspace_id VARCHAR NOT NULL REFERENCES workspaces(id),
    new_document_id VARCHAR NOT NULL REFERENCES compliance_documents(id),
    existing_document_id VARCHAR NOT NULL REFERENCES compliance_documents(id),
    conflict_summary TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_policy_conflicts_workspace_id ON policy_conflicts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_policy_conflicts_new_document_id ON policy_conflicts(new_document_id);
CREATE INDEX IF NOT EXISTS idx_policy_conflicts_existing_document_id ON policy_conflicts(existing_document_id);
