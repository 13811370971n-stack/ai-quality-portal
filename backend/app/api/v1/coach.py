"""
AI Coach API - Six Sigma AI coaching with dual mode.
Mode "do": AI completes the task for the user.
Mode "teach": AI guides the user through Socratic questioning.
"""
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime
import json

from app.core.ai_engine import chat_completion_stream, chat_completion

router = APIRouter()


BASE_PROMPT = """\u4f60\u662f\u4e00\u4f4d\u516d\u897f\u683c\u739b\u9ed1\u5e26\u5927\u5e08(MBB)\uff0c\u62e5\u670915\u5e74\u5236\u9020\u4e1a\u8d28\u91cf\u6539\u8fdb\u7ecf\u9a8c\u3002
\u4f60\u7cbe\u901aDMAIC\u3001\u7cbe\u76ca\u751f\u4ea7\u3001SPC\u3001MSA\u3001DOE\u3001FMEA\u3001\u5047\u8bbe\u68c0\u9a8c\u7b49\u5168\u90e8\u516d\u897f\u683c\u739b\u5de5\u5177\u3002

\u56de\u7b54\u98ce\u683c\uff1a
- \u4f7f\u7528\u4e2d\u6587
- \u4e13\u4e1a\u4f46\u4e0d\u6667\u6da9
- \u7ed3\u6784\u5316\u8f93\u51fa\uff0c\u5173\u952e\u4fe1\u606f\u7528**\u52a0\u7c97**
- \u9002\u5f53\u4f7f\u7528\u8868\u683c\u548c\u5217\u8868"""

MODE_PROMPTS = {
    "do": """
## \u5f53\u524d\u6a21\u5f0f\uff1a\u5e2e\u4f60\u505a (Do It For Me)

\u7528\u6237\u5e0c\u671b\u4f60\u76f4\u63a5\u5b8c\u6210\u4efb\u52a1\u3002

\u4f60\u7684\u884c\u4e3a\uff1a
1. \u76f4\u63a5\u7ed9\u51fa\u5b8c\u6574\u3001\u53ef\u7528\u7684\u7ed3\u679c
2. \u4e0d\u8981\u53cd\u95ee\u592a\u591a\uff0c\u5982\u679c\u4fe1\u606f\u4e0d\u8db3\u5c31\u5148\u7ed9\u51fa\u5047\u8bbe\u4e0b\u7684\u7ed3\u679c\uff0c\u5e76\u6807\u6ce8\u9700\u8981\u6838\u5b9e\u7684\u5047\u8bbe
3. \u63d0\u4f9b\u5177\u4f53\u7684\u6570\u5b57\u3001\u6a21\u677f\u3001\u6b65\u9aa4\uff0c\u800c\u4e0d\u662f\u62bd\u8c61\u5efa\u8bae
4. \u7ed3\u5c3e\u7ed9\u51fa\u4e0b\u4e00\u6b65\u884c\u52a8\u5efa\u8bae""",

    "teach": """
## \u5f53\u524d\u6a21\u5f0f\uff1a\u6559\u6211\u505a (Teach Me)

\u7528\u6237\u5e0c\u671b\u5b66\u4f1a\u81ea\u5df1\u505a\uff0c\u4e0d\u662f\u62ff\u5230\u73b0\u6210\u7b54\u6848\u3002

\u4f60\u7684\u884c\u4e3a\uff1a
1. **\u4e0d\u8981\u76f4\u63a5\u7ed9\u51fa\u7b54\u6848**\uff0c\u800c\u662f\u5f15\u5bfc\u7528\u6237\u601d\u8003
2. \u6bcf\u6b21\u53ea\u95ee1-2\u4e2a\u5173\u952e\u95ee\u9898\uff0c\u8ba9\u7528\u6237\u81ea\u5df1\u63a8\u5bfc
3. \u7528\u6237\u56de\u7b54\u540e\uff0c\u5148\u8bc4\u4f30\u5bf9\u9519\uff0c\u518d\u89e3\u91ca\u80cc\u540e\u7684\u539f\u7406
4. \u9002\u5f53\u7ed9\u51fa\u63d0\u793a\uff08hint\uff09\uff0c\u4f46\u4e0d\u76f4\u63a5\u7ed9\u7b54\u6848
5. \u5f53\u7528\u6237\u63a8\u5bfc\u6b63\u786e\u65f6\uff0c\u660e\u786e\u80af\u5b9a\u5e76\u8865\u5145\u7406\u8bba\u4f9d\u636e
6. \u5f53\u7528\u6237\u9519\u4e86\uff0c\u4e0d\u8981\u76f4\u63a5\u8bf4\u9519\uff0c\u800c\u662f\u7528\u53cd\u4f8b\u6216\u53cd\u95ee\u8ba9\u4ed6\u53d1\u73b0\u95ee\u9898

\u6559\u5b66\u8282\u594f\uff1a\u77e5\u8bc6\u70b9 \u2192 \u63d0\u95ee \u2192 \u7528\u6237\u56de\u7b54 \u2192 \u53cd\u9988 \u2192 \u6df1\u5165\u4e0b\u4e00\u5c42

\u793a\u4f8b\uff1a
\u7528\u6237\uff1a"\u5e2e\u6211\u505aFMEA"
\u4f60\uff1a"\u6211\u4eec\u4e00\u6b65\u6b65\u6765\u3002\u9996\u5148\uff0cFMEA\u7684\u7b2c\u4e00\u884c\u662f\u201c\u529f\u80fd\u201d\u3002\u4f60\u8fd9\u4e2a\u4ea7\u54c1/\u8fc7\u7a0b\u7684**\u6838\u5fc3\u529f\u80fd**\u662f\u4ec0\u4e48\uff1f\u63d0\u793a\uff1a\u7528\u201c\u52a8\u8bcd+\u540d\u8bcd\u201d\u63cf\u8ff0\uff0c\u5e76\u5e26\u4e0a\u53ef\u91cf\u5316\u6307\u6807\u3002"
"""
}


class ChatRequest(BaseModel):
    message: str
    mode: str = "do"  # "do" | "teach"
    history: List[Dict] = []
    context: Optional[dict] = None


class ChatResponse(BaseModel):
    reply: str
    mode: str
    conversation_id: str
    suggestions: Optional[List[str]] = None


@router.get("/capabilities")
async def get_capabilities():
    """List AI Coach capabilities."""
    return {
        "modes": [
            {"id": "do", "name": "\u5e2e\u6211\u505a", "name_en": "Do It For Me",
             "desc": "AI\u76f4\u63a5\u5b8c\u6210\u4efb\u52a1\uff0c\u7ed9\u51fa\u53ef\u7528\u7ed3\u679c"},
            {"id": "teach", "name": "\u6559\u6211\u505a", "name_en": "Teach Me",
             "desc": "AI\u5f15\u5bfc\u4f60\u601d\u8003\uff0c\u5b66\u4f1a\u81ea\u5df1\u505a"},
        ],
        "topics": [
            "DMAIC\u9636\u6bb5\u6307\u5bfc", "\u5de5\u5177\u9009\u62e9\u5efa\u8bae", "FMEA",
            "SPC\u4e0e\u63a7\u5236\u56fe", "MSA\u6d4b\u91cf\u7cfb\u7edf", "DOE\u5b9e\u9a8c\u8bbe\u8ba1",
            "\u5047\u8bbe\u68c0\u9a8c", "\u8fc7\u7a0b\u80fd\u529b\u5206\u6790", "\u6839\u56e0\u5206\u6790",
            "\u9879\u76ee\u8bc4\u5ba1", "8D\u62a5\u544a", "\u7cbe\u76ca\u5de5\u5177",
        ],
    }


@router.post("/chat")
async def coach_chat(req: ChatRequest):
    """Chat with the AI Coach (streaming SSE)."""
    system = BASE_PROMPT + "\n" + MODE_PROMPTS.get(req.mode, MODE_PROMPTS["do"])

    if req.context:
        ctx_lines = []
        for k, v in req.context.items():
            if v:
                ctx_lines.append("- " + str(k) + ": " + str(v))
        if ctx_lines:
            system += "\n\n## \u4e0a\u4e0b\u6587\n" + "\n".join(ctx_lines)

    messages = [{"role": "system", "content": system}]
    for m in req.history[-20:]:
        role = m.get("role", "user")
        if role in ("user", "assistant"):
            messages.append({"role": role, "content": m.get("content", "")})
    messages.append({"role": "user", "content": req.message})

    async def generate():
        try:
            async for chunk in chat_completion_stream(messages, temperature=0.7):
                yield "data: " + json.dumps({"content": chunk}) + "\n\n"
        except Exception as e:
            yield "data: " + json.dumps({"error": str(e)}) + "\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )
