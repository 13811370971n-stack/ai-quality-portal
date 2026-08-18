"""
Evidence and Investigation models for Quality Cases.
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from app.database.session import Base


class CaseEvidence(Base):
    __tablename__ = "case_evidences"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("quality_cases.id"), nullable=False)
    evidence_type = Column(String(50), nullable=False)  # document, image, excel, measurement, ai_inference, user_input
    source = Column(String(50), nullable=False)  # user_provided, ai_analysis, historical_case, system
    title = Column(String(500), nullable=True)
    content = Column(Text, nullable=True)  # extracted text or description
    file_path = Column(String(1000), nullable=True)  # local file path if uploaded
    confidence = Column(Float, nullable=True)  # 0.0 - 1.0
    verification_status = Column(String(30), default="unverified")  # unverified, verified, rejected, conflicting
    related_step = Column(String(50), nullable=True)  # which step this evidence relates to
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_by = Column(String(50), nullable=True)  # "user" or "ai"

    case = relationship("QualityCase", backref="evidences")


class CaseInvestigation(Base):
    __tablename__ = "case_investigations"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("quality_cases.id"), nullable=False)
    question = Column(Text, nullable=False)  # what are we investigating
    hypothesis = Column(Text, nullable=True)  # proposed explanation
    method = Column(Text, nullable=True)  # how to verify
    result = Column(Text, nullable=True)  # what we found
    conclusion = Column(Text, nullable=True)  # what it means
    confidence = Column(Float, nullable=True)  # 0.0 - 1.0
    status = Column(String(30), default="open")  # open, confirmed, rejected, insufficient
    evidence_ids = Column(Text, nullable=True)  # JSON array of evidence IDs
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    case = relationship("QualityCase", backref="investigations")


class CaseRootCause(Base):
    __tablename__ = "case_root_causes"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("quality_cases.id"), nullable=False)
    category = Column(String(50), nullable=True)  # material, machine, method, man, measurement, environment
    description = Column(Text, nullable=False)
    cause_chain = Column(Text, nullable=True)  # 5Why chain as JSON
    confidence = Column(Float, nullable=True)
    status = Column(String(30), default="hypothesis")  # hypothesis, high_probability, confirmed, rejected
    evidence_ids = Column(Text, nullable=True)  # JSON array
    verified_by = Column(String(100), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    case = relationship("QualityCase", backref="root_causes")


class CaseAction(Base):
    __tablename__ = "case_actions"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("quality_cases.id"), nullable=False)
    action_type = Column(String(30), nullable=False)  # containment, corrective, preventive
    description = Column(Text, nullable=False)
    related_root_cause_id = Column(Integer, nullable=True)  # links to CaseRootCause
    owner = Column(String(100), nullable=True)
    due_date = Column(DateTime, nullable=True)
    status = Column(String(30), default="planned")  # planned, in_progress, completed, verified
    effectiveness_check = Column(Text, nullable=True)  # AI's assessment
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    case = relationship("QualityCase", backref="actions")


class CaseTimeline(Base):
    __tablename__ = "case_timeline"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("quality_cases.id"), nullable=False)
    event_type = Column(String(50), nullable=False)  # created, step_changed, evidence_added, confirmed, ai_recommendation, etc.
    description = Column(Text, nullable=False)
    actor = Column(String(50), nullable=True)  # "user", "ai", "system"
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    case = relationship("QualityCase", backref="timeline_events")
