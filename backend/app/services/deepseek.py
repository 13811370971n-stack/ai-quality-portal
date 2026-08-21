"""
DeepSeek API Client
Provides a unified interface to call DeepSeek chat API with fallback handling.
"""
import os
import json
import httpx
from typing import Optional

DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"
DEEPSEEK_TOKEN = os.getenv("DEEPSEEK_API_KEY", "")
DEFAULT_MODEL = "deepseek-chat"
DEFAULT_TIMEOUT = 30.0


async def call_deepseek(
    system_prompt: str,
    user_message: str,
    model: str = DEFAULT_MODEL,
    temperature: float = 0.7,
    max_tokens: int = 2000,
    response_format: Optional[str] = None,
) -> dict:
    """
    Call DeepSeek API and return parsed response.
    
    Returns:
        {"success": True, "content": "...", "usage": {...}}
        or {"success": False, "error": "..."}
    """
    headers = {
        "Authorization": f"Bearer {DEEPSEEK_TOKEN}",
        "Content-Type": "application/json",
    }
    
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    
    if response_format == "json":
        payload["response_format"] = {"type": "json_object"}
    
    try:
        async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
            response = await client.post(DEEPSEEK_API_URL, headers=headers, json=payload)
            
            if response.status_code != 200:
                return {"success": False, "error": f"API returned {response.status_code}: {response.text[:200]}"}
            
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            usage = data.get("usage", {})
            
            return {"success": True, "content": content, "usage": usage}
    
    except httpx.TimeoutException:
        return {"success": False, "error": "DeepSeek API timeout"}
    except Exception as e:
        return {"success": False, "error": f"DeepSeek API error: {str(e)}"}


async def call_deepseek_json(
    system_prompt: str,
    user_message: str,
    **kwargs,
) -> dict:
    """
    Call DeepSeek API and parse response as JSON.
    Returns parsed dict on success, or fallback error dict.
    """
    result = await call_deepseek(
        system_prompt=system_prompt,
        user_message=user_message,
        response_format="json",
        **kwargs,
    )
    
    if not result["success"]:
        return result
    
    try:
        parsed = json.loads(result["content"])
        return {"success": True, "data": parsed, "usage": result.get("usage", {})}
    except json.JSONDecodeError:
        # Try to extract JSON from markdown code blocks
        content = result["content"]
        if "```json" in content:
            json_str = content.split("```json")[1].split("```")[0].strip()
            try:
                parsed = json.loads(json_str)
                return {"success": True, "data": parsed, "usage": result.get("usage", {})}
            except json.JSONDecodeError:
                pass
        return {"success": False, "error": "Failed to parse JSON from API response", "raw": content}
