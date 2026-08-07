"""
AI Quality Portal - 集成测试
验证后端API所有端点正常工作。
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)

PASSED = 0
FAILED = 0


def test(name, condition, detail=""):
    global PASSED, FAILED
    if condition:
        PASSED += 1
        print(f"  PASS  {name}")
    else:
        FAILED += 1
        print(f"  FAIL  {name} -- {detail}")


print("=" * 60)
print("  AI Quality Portal - Integration Tests")
print("=" * 60)
print()

# --- Health Check ---
print("[Health]")
r = client.get("/health")
test("GET /health returns 200", r.status_code == 200)
test("Health response has status", r.json().get("status") == "healthy")
print()

# --- Tools API ---
print("[Tools API]")
r = client.get("/api/v1/tools/")
test("GET /tools/ returns 200", r.status_code == 200)
tools = r.json()
test("Returns list of tools", isinstance(tools, list))
test("Has 5 tools", len(tools) == 5)
test("First tool has id field", "id" in tools[0])
test("First tool has name_zh field", "name_zh" in tools[0])
test("AI-SPC tool exists", any(t["id"] == "ai-spc" for t in tools))
test("AI-MSA tool exists", any(t["id"] == "ai-msa" for t in tools))

r2 = client.get("/api/v1/tools/ai-spc")
test("GET /tools/ai-spc returns 200", r2.status_code == 200)
test("AI-SPC has correct name", r2.json()["name"] == "AI-SPC")

r3 = client.get("/api/v1/tools/nonexistent")
test("GET /tools/nonexistent returns 404", r3.status_code == 404)
print()

# --- Coach API ---
print("[Coach API]")
r = client.post("/api/v1/coach/chat", json={"message": "What is DMAIC?"})
test("POST /coach/chat returns 200", r.status_code == 200)
data = r.json()
test("Response has reply field", "reply" in data)
test("Response has conversation_id", "conversation_id" in data)
test("Response has suggestions", "suggestions" in data)

r2 = client.get("/api/v1/coach/capabilities")
test("GET /coach/capabilities returns 200", r2.status_code == 200)
caps = r2.json()
test("Has capabilities list", "capabilities" in caps)
test("Has 4 capabilities", len(caps["capabilities"]) == 4)
print()

# --- Methodology API ---
print("[Methodology API]")
r = client.get("/api/v1/methodology/dmaic")
test("GET /methodology/dmaic returns 200", r.status_code == 200)
phases = r.json()
test("Returns list of phases", isinstance(phases, list))
test("Has 5 DMAIC phases", len(phases) == 5)
test("First phase is Define", phases[0]["id"] == "define")
test("Last phase is Control", phases[4]["id"] == "control")
test("Each phase has ai_enhancements", all("ai_enhancements" in p for p in phases))
test("Each phase has key_activities_zh", all("key_activities_zh" in p for p in phases))

r2 = client.get("/api/v1/methodology/dmaic/analyze")
test("GET /methodology/dmaic/analyze returns 200", r2.status_code == 200)
test("Analyze phase has correct name", r2.json()["name"] == "Analyze")

r3 = client.get("/api/v1/methodology/dmaic/invalid")
test("GET /methodology/dmaic/invalid returns 404", r3.status_code == 404)
print()

# --- Summary ---
print("=" * 60)
total = PASSED + FAILED
print(f"  Results: {PASSED}/{total} passed", end="")
if FAILED:
    print(f", {FAILED} FAILED")
else:
    print(" -- ALL PASSED!")
print("=" * 60)

sys.exit(0 if FAILED == 0 else 1)
