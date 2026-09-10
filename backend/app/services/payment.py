"""
Payment provider abstraction.

Alipay and WeChat Pay require merchant credentials. Until those are supplied,
the mock provider lets the full order -> pay -> upgrade flow be exercised.

Required .env keys for Alipay:
    ALIPAY_APP_ID
    ALIPAY_PRIVATE_KEY        (app private key, PKCS8, no header/footer)
    ALIPAY_PUBLIC_KEY         (Alipay public key)
    ALIPAY_NOTIFY_URL

Required .env keys for WeChat Pay (Native/QR):
    WECHAT_APP_ID
    WECHAT_MCH_ID
    WECHAT_API_V3_KEY
    WECHAT_CERT_SERIAL_NO
    WECHAT_PRIVATE_KEY_PATH
    WECHAT_NOTIFY_URL
"""
import os
import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

ALIPAY_APP_ID = os.getenv("ALIPAY_APP_ID", "")
ALIPAY_PRIVATE_KEY = os.getenv("ALIPAY_PRIVATE_KEY", "")
ALIPAY_NOTIFY_URL = os.getenv("ALIPAY_NOTIFY_URL", "")

WECHAT_APP_ID = os.getenv("WECHAT_APP_ID", "")
WECHAT_MCH_ID = os.getenv("WECHAT_MCH_ID", "")
WECHAT_API_V3_KEY = os.getenv("WECHAT_API_V3_KEY", "")
WECHAT_NOTIFY_URL = os.getenv("WECHAT_NOTIFY_URL", "")

ORDER_TTL_MINUTES = 15


def alipay_configured() -> bool:
    return bool(ALIPAY_APP_ID and ALIPAY_PRIVATE_KEY)


def wechat_configured() -> bool:
    return bool(WECHAT_APP_ID and WECHAT_MCH_ID and WECHAT_API_V3_KEY)


def available_providers() -> list:
    """Providers usable right now."""
    out = []
    if alipay_configured():
        out.append({"id": "alipay", "name": "支付宝", "ready": True})
    if wechat_configured():
        out.append({"id": "wechat", "name": "微信支付", "ready": True})
    if not out:
        out.append({"id": "mock", "name": "测试支付（未配置真实支付）", "ready": True})
    return out


def generate_order_no() -> str:
    """Order number: AIQP + yyyymmddHHMMSS + 6 random hex."""
    return "AIQP" + datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S") + uuid.uuid4().hex[:6].upper()


async def create_payment(provider: str, order_no: str, amount: float, subject: str) -> dict:
    """
    Create a payment at the provider.
    Returns {"success": bool, "pay_url": str|None, "provider": str, "message": str}
    """
    if provider == "alipay" and alipay_configured():
        return await _create_alipay(order_no, amount, subject)
    if provider == "wechat" and wechat_configured():
        return await _create_wechat(order_no, amount, subject)

    # Mock: a pseudo pay URL the frontend can display; confirmation is manual
    return {
        "success": True,
        "provider": "mock",
        "pay_url": "MOCK_PAYMENT:" + order_no,
        "message": "Mock payment - no real charge. Use the confirm endpoint to simulate success.",
        "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=ORDER_TTL_MINUTES)).isoformat(),
    }


async def _create_alipay(order_no: str, amount: float, subject: str) -> dict:
    """
    Alipay precreate (QR code) - requires alipay-sdk-python.
    Left as a documented stub so the flow is ready the moment credentials land.
    """
    try:
        from alipay import AliPay  # type: ignore
    except ImportError:
        return {
            "success": False,
            "provider": "alipay",
            "pay_url": None,
            "message": "alipay-sdk-python not installed. Run: pip install python-alipay-sdk",
        }

    # Implementation outline once credentials are available:
    #   client = AliPay(appid=ALIPAY_APP_ID, app_notify_url=ALIPAY_NOTIFY_URL,
    #                   app_private_key_string=ALIPAY_PRIVATE_KEY,
    #                   alipay_public_key_string=ALIPAY_PUBLIC_KEY, sign_type="RSA2")
    #   result = client.api_alipay_trade_precreate(
    #       out_trade_no=order_no, total_amount=str(amount), subject=subject)
    #   return {"success": result["code"] == "10000", "pay_url": result.get("qr_code"), ...}
    return {
        "success": False,
        "provider": "alipay",
        "pay_url": None,
        "message": "Alipay integration pending credential configuration",
    }


async def _create_wechat(order_no: str, amount: float, subject: str) -> dict:
    """WeChat Pay Native (QR) - requires merchant cert. Documented stub."""
    return {
        "success": False,
        "provider": "wechat",
        "pay_url": None,
        "message": "WeChat Pay integration pending credential configuration",
    }


def verify_callback(provider: str, payload: dict, headers: dict = None) -> dict:
    """
    Verify an asynchronous payment notification.
    Returns {"valid": bool, "order_no": str|None, "txn_id": str|None, "paid": bool}
    """
    if provider == "alipay":
        # Real impl: client.verify(payload, signature)
        return {
            "valid": False, "order_no": payload.get("out_trade_no"),
            "txn_id": payload.get("trade_no"),
            "paid": payload.get("trade_status") in ("TRADE_SUCCESS", "TRADE_FINISHED"),
            "message": "Signature verification not configured",
        }
    if provider == "wechat":
        return {"valid": False, "order_no": None, "txn_id": None, "paid": False,
                "message": "Signature verification not configured"}

    return {"valid": False, "order_no": None, "txn_id": None, "paid": False,
            "message": "Unknown provider"}


def status() -> dict:
    """Config diagnostics (no secrets exposed)."""
    return {
        "alipay_configured": alipay_configured(),
        "wechat_configured": wechat_configured(),
        "mode": "live" if (alipay_configured() or wechat_configured()) else "mock",
        "available_providers": available_providers(),
        "order_ttl_minutes": ORDER_TTL_MINUTES,
    }
