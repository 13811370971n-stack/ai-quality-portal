"""
Aliyun SMS service.
Implements the dysmsapi RPC signature directly with httpx (no SDK dependency).

Falls back to MOCK mode when credentials are absent: the code is logged
instead of sent, so the whole flow is testable before signature/template approval.

Required .env keys:
    ALIYUN_SMS_ACCESS_KEY_ID
    ALIYUN_SMS_ACCESS_KEY_SECRET
    ALIYUN_SMS_SIGN_NAME
    ALIYUN_SMS_TEMPLATE_CODE
"""
import os
import base64
import hmac
import hashlib
import uuid
import json
import logging
from datetime import datetime, timezone
from urllib.parse import quote

import httpx
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

ACCESS_KEY_ID = os.getenv("ALIYUN_SMS_ACCESS_KEY_ID", "")
ACCESS_KEY_SECRET = os.getenv("ALIYUN_SMS_ACCESS_KEY_SECRET", "")
SIGN_NAME = os.getenv("ALIYUN_SMS_SIGN_NAME", "")
TEMPLATE_CODE = os.getenv("ALIYUN_SMS_TEMPLATE_CODE", "")

ENDPOINT = "https://dysmsapi.aliyuncs.com/"
API_VERSION = "2017-05-25"
REGION = "cn-hangzhou"


def is_configured() -> bool:
    """True when all four credentials are present."""
    return bool(ACCESS_KEY_ID and ACCESS_KEY_SECRET and SIGN_NAME and TEMPLATE_CODE)


def _percent_encode(s: str) -> str:
    """Aliyun-flavoured percent encoding."""
    res = quote(str(s), safe="")
    res = res.replace("+", "%20").replace("*", "%2A").replace("%7E", "~")
    return res


def _sign(params: dict, secret: str) -> str:
    """Compute the HMAC-SHA1 signature for an Aliyun RPC request."""
    canonical = "&".join(
        _percent_encode(k) + "=" + _percent_encode(params[k])
        for k in sorted(params.keys())
    )
    string_to_sign = "GET&" + _percent_encode("/") + "&" + _percent_encode(canonical)
    digest = hmac.new(
        (secret + "&").encode("utf-8"),
        string_to_sign.encode("utf-8"),
        hashlib.sha1,
    ).digest()
    return base64.b64encode(digest).decode("utf-8")


async def send_verification_code(phone: str, code: str) -> dict:
    """
    Send an SMS verification code.
    Returns {"success": bool, "mode": "aliyun"|"mock", "message": str, "request_id": str|None}
    """
    if not is_configured():
        logger.warning("SMS not configured - MOCK mode. phone=%s code=%s", phone, code)
        return {
            "success": True,
            "mode": "mock",
            "message": "SMS service not configured; running in mock mode",
            "mock_code": code,
            "request_id": None,
        }

    params = {
        "AccessKeyId": ACCESS_KEY_ID,
        "Action": "SendSms",
        "Format": "JSON",
        "PhoneNumbers": phone,
        "RegionId": REGION,
        "SignName": SIGN_NAME,
        "SignatureMethod": "HMAC-SHA1",
        "SignatureNonce": str(uuid.uuid4()),
        "SignatureVersion": "1.0",
        "TemplateCode": TEMPLATE_CODE,
        "TemplateParam": json.dumps({"code": code}),
        "Timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "Version": API_VERSION,
    }
    params["Signature"] = _sign(params, ACCESS_KEY_SECRET)

    try:
        async with httpx.AsyncClient(timeout=15.0) as http:
            resp = await http.get(ENDPOINT, params=params)
            data = resp.json()
    except Exception as e:
        logger.error("SMS request failed: %s", e)
        return {"success": False, "mode": "aliyun", "message": "SMS request failed: " + str(e)[:120], "request_id": None}

    ok = data.get("Code") == "OK"
    if not ok:
        logger.error("SMS send failed: %s", data)

    return {
        "success": ok,
        "mode": "aliyun",
        "message": data.get("Message", ""),
        "aliyun_code": data.get("Code"),
        "request_id": data.get("RequestId"),
    }


def status() -> dict:
    """Configuration status for diagnostics (never exposes secrets)."""
    return {
        "configured": is_configured(),
        "mode": "aliyun" if is_configured() else "mock",
        "has_access_key": bool(ACCESS_KEY_ID),
        "has_secret": bool(ACCESS_KEY_SECRET),
        "sign_name": SIGN_NAME or None,
        "template_code": TEMPLATE_CODE or None,
    }
