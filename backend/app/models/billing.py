"""
Billing and feedback models (P3).
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from app.database.session import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String(64), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plan_id = Column(String(30), nullable=False)          # pro | pro_plus
    billing_cycle = Column(String(20), default="monthly")  # monthly | annual
    amount = Column(Float, nullable=False)                 # CNY
    currency = Column(String(10), default="CNY")
    provider = Column(String(20), nullable=True)           # alipay | wechat | mock
    provider_txn_id = Column(String(128), nullable=True)
    status = Column(String(20), default="pending")          # pending | paid | failed | cancelled | refunded
    pay_url = Column(Text, nullable=True)                   # QR content or redirect URL
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    paid_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)

    user = relationship("User", backref="orders")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plan_id = Column(String(30), nullable=False)
    billing_cycle = Column(String(20), default="monthly")
    status = Column(String(20), default="active")   # active | expired | cancelled
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime, nullable=True)
    order_id = Column(Integer, nullable=True)
    auto_renew = Column(Boolean, default=False)

    user = relationship("User", backref="subscriptions")


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # null = anonymous
    category = Column(String(30), nullable=False)   # bug | feature | usability | content | other
    page_url = Column(String(500), nullable=True)
    rating = Column(Integer, nullable=True)          # 1-5
    content = Column(Text, nullable=False)
    contact = Column(String(200), nullable=True)
    user_agent = Column(String(500), nullable=True)
    status = Column(String(20), default="new")       # new | reviewing | resolved | wontfix
    admin_note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", backref="feedback_items")
