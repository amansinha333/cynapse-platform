from sqlalchemy import Column, String, Integer, Float, Text, DateTime, JSON, ForeignKey
from sqlalchemy.sql import func
from database import Base


class Feature(Base):
    __tablename__ = "features"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, default="")
    region = Column(String, default="Global")
    industry = Column(String, default="General SaaS / AI")
    status = Column(String, default="Discovery")  # Discovery | Validation | Ready | Delivery

    # RICE scoring
    reach = Column(Integer, default=500)
    impact = Column(Integer, default=1)
    confidence = Column(Float, default=0.8)
    effort = Column(Integer, default=10)
    rice_score = Column(Float, default=0)

    # Compliance
    compliance_status = Column(String, default="Pending")  # Pending | Approved | Blocked | Approved (Node 1)

    # Meta
    assignee = Column(String, default="Unassigned")
    priority = Column(String, default="Medium")  # Low | Medium | High | Critical
    votes = Column(Integer, default=0)
    epic_id = Column(String, default="")
    prd_html = Column(Text, default="")

    # Dates
    start_date = Column(String, default="")
    end_date = Column(String, default="")

    # JSON fields for complex nested data
    comments = Column(JSON, default=list)
    dependencies = Column(JSON, default=list)
    history = Column(JSON, default=list)
    attachments = Column(JSON, default=list)
    attestation = Column(JSON, default=dict)
    audit_results = Column(JSON, default=dict)  # Stores node1/node2 results

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())


class Epic(Base):
    __tablename__ = "epics"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    color = Column(String, default="#6366f1")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, default="")
    status = Column(String, default="Pending Review")  # Approved | Pending Review
    risk = Column(String, default="Medium")  # Low | Medium | High
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    user = Column(String, default="System")
    role = Column(String, default="System")
    type = Column(String, default="view")  # login | create | update | delete | override | blocked | upload | automation | view
    message = Column(Text, default="")


class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True, index=True)
    key = Column(String, nullable=False, unique=True, index=True)
    description = Column(Text, default="")
    stripe_customer_id = Column(String, default="", index=True)
    stripe_subscription_id = Column(String, default="", index=True)
    plan_tier = Column(String, default="Seed")  # Seed | Growth | Enterprise
    subscription_status = Column(String, default="canceled")  # active | past_due | canceled
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, nullable=False, unique=True, index=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="Member")
    status = Column(String, default="active")
    avatar_url = Column(Text, default="")
    workspace_id = Column(String, ForeignKey("workspaces.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SecureSetting(Base):
    __tablename__ = "secure_settings"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    key_name = Column(String, nullable=False, index=True)
    encrypted_value = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())


class ComplianceDocument(Base):
    __tablename__ = "compliance_documents"

    id = Column(String, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    s3_key = Column(String, nullable=False, unique=True, index=True)
    uploaded_by = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    workspace_id = Column(String, ForeignKey("workspaces.id"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class BillingWebhookEvent(Base):
    __tablename__ = "billing_webhook_events"

    id = Column(String, primary_key=True, index=True)  # Stripe event id
    event_type = Column(String, nullable=False)
    processed_at = Column(DateTime(timezone=True), server_default=func.now())
