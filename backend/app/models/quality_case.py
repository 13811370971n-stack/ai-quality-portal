"""
Quality Case and CaseMessage models.
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from app.database.session import Base


class QualityCase(Base):
    __tablename__ = "quality_cases"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(500), nullable=True)
    case_type = Column(String(50), nullable=False)  # complaint, incoming, process, failure, supplier, internal
    status = Column(String(50), default="draft")  # draft, analyzing, defining, rca, measures, verification, closed
    problem_statement = Column(Text, nullable=True)
    root_cause = Column(Text, nullable=True)
    measures = Column(Text, nullable=True)  # JSON string
    current_step = Column(String(50), default="describe")  # describe, define, rca, verify, measures, 8d
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    messages = relationship("CaseMessage", back_populates="case", cascade="all, delete-orphan", order_by="CaseMessage.created_at")
    user = relationship("User", backref="cases")


class CaseMessage(Base):
    __tablename__ = "case_messages"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("quality_cases.id"), nullable=False)
    role = Column(String(20), nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)
    step = Column(String(50), nullable=True)  # describe, define, rca, verify, measures, 8d
    metadata_json = Column(Text, nullable=True)  # JSON for extra data
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    case = relationship("QualityCase", back_populates="messages")
