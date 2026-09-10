#!/usr/bin/env python3
"""
Quality Tools Test Suite
========================
Tests all tool pages, APIs, and services.
Run: python3 test_quality_tools.py
"""
import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost"
FRONTEND_URL = f"{BASE_URL}:3000"
BACKEND_URL = f"{BASE_URL}:8000"
NGINX_URL = f"{BASE_URL}:8080"
SPC_URL = f"{BASE_URL}:8050"
MSA_URL = f"{BASE_URL}:8052"

results = []
total_pass = 0
total_fail = 0
total_skip = 0


def test(name, url, expected_status=200, method="GET", data=None, headers=None, timeout=10):
    """Run a single test."""
    global total_pass, total_fail
    try:
        if method == "GET":
            r = requests.get(url, headers=headers, timeout=timeout, allow_redirects=True)
        elif method == "POST":
            r = requests.post(url, json=data, headers=headers, timeout=timeout)
        
        status = r.status_code
        passed = status == expected_status
        
        if passed:
            total_pass += 1
            icon = "PASS"
        else:
            total_fail += 1
            icon = "FAIL"
        
        result = {"name": name, "url": url, "status": status, "expected": expected_status, "result": icon}
        results.append(result)
        print(f"  [{icon}] {name} -> HTTP {status}")
        return r
        
    except requests.exceptions.ConnectionError:
        total_fail += 1
        result = {"name": name, "url": url, "status": "CONNECTION_ERROR", "expected": expected_status, "result": "FAIL"}
        results.append(result)
        print(f"  [FAIL] {name} -> CONNECTION_ERROR")
        return None
    except requests.exceptions.Timeout:
        total_fail += 1
        result = {"name": name, "url": url, "status": "TIMEOUT", "expected": expected_status, "result": "FAIL"}
        results.append(result)
        print(f"  [FAIL] {name} -> TIMEOUT")
        return None
    except Exception as e:
        total_fail += 1
        result = {"name": name, "url": url, "status": str(e)[:50], "expected": expected_status, "result": "FAIL"}
        results.append(result)
        print(f"  [FAIL] {name} -> {str(e)[:50]}")
        return None


def test_api(name, url, method="POST", data=None, headers=None, check_fn=None):
    """Test an API endpoint with optional response validation."""
    global total_pass, total_fail
    try:
        if method == "GET":
            r = requests.get(url, headers=headers, timeout=15)
        else:
            r = requests.post(url, json=data, headers=headers, timeout=15)
        
        status = r.status_code
        body = None
        try:
            body = r.json()
        except:
            pass
        
        passed = status == 200
        if passed and check_fn and body:
            passed = check_fn(body)
        
        icon = "PASS" if passed else "FAIL"
        if passed:
            total_pass += 1
        else:
            total_fail += 1
        
        detail = ""
        if not passed and body:
            detail = f" | {json.dumps(body, ensure_ascii=False)[:100]}"
        
        result = {"name": name, "url": url, "status": status, "result": icon, "detail": detail}
        results.append(result)
        print(f"  [{icon}] {name} -> HTTP {status}{detail}")
        return r
        
    except Exception as e:
        total_fail += 1
        results.append({"name": name, "url": url, "status": str(e)[:50], "result": "FAIL"})
        print(f"  [FAIL] {name} -> {str(e)[:50]}")
        return None


print("=" * 70)
print(f"  Quality Tools Test Suite")
print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("=" * 70)

# ============================================================
# 1. Service Health Checks
# ============================================================
print("\n--- 1. Service Health Checks ---")
test("Backend Health", f"{BACKEND_URL}/health")
test("Frontend Root", f"{FRONTEND_URL}/")
test("Nginx Root", f"{NGINX_URL}/")
test("SPC Service", f"{SPC_URL}/tools/ai-spc/app/")
test("MSA Service", f"{MSA_URL}/")

# ============================================================
# 2. Auth API Tests
# ============================================================
print("\n--- 2. Auth API ---")
# Login to get token
r = test_api("Login", f"{BACKEND_URL}/api/v1/auth/login", data={"email": "admin@aidmaic.top", "password": "admin123"})
token = None
if r and r.status_code == 200:
    token = r.json().get("access_token")
    print(f"  Token acquired: {token[:20]}...")

auth_headers = {"Authorization": f"Bearer {token}"} if token else {}

test_api("Get Me (authenticated)", f"{BACKEND_URL}/api/v1/auth/me", method="GET", headers=auth_headers,
         check_fn=lambda b: b.get("role") == "admin")
test_api("Get Me (no auth)", f"{BACKEND_URL}/api/v1/auth/me", method="GET")

# ============================================================
# 3. AI Tool Pages (via Nginx)
# ============================================================
print("\n--- 3. AI Tool Pages ---")
ai_tool_pages = [
    ("AI-SPC Page", "/tools/ai-spc"),
    ("AI-DFMEA Page", "/tools/ai-dfmea"),
    ("AI-PFMEA Page", "/tools/ai-pfmea"),
    ("AI-MSA (via nginx)", "/ai-msa/"),
]
for name, path in ai_tool_pages:
    test(name, f"{NGINX_URL}{path}")

# ============================================================
# 4. Interactive Workshop Tools (18 tools)
# ============================================================
print("\n--- 4. Interactive Workshop Tools ---")
workshop_tools = [
    "fishbone", "five-whys", "pareto", "checksheet", "histogram",
    "scatter", "controlchart", "flowchart", "sipoc", "fmea",
    "process-capability", "normal-plot", "hypothesis-test", "regression",
    "anova", "box-plot", "run-chart", "multi-vari",
]
for tool in workshop_tools:
    test(f"Workshop: {tool}", f"{NGINX_URL}/tools/quality-toolbox/workshop/{tool}")

# ============================================================
# 5. Quality Toolbox Sub-pages
# ============================================================
print("\n--- 5. Quality Toolbox Pages ---")
toolbox_pages = [
    ("Toolbox Home", "/tools/quality-toolbox"),
    ("Knowledge Graph", "/tools/quality-toolbox/graph"),
    ("Learning Path", "/tools/quality-toolbox/learn"),
    ("Smart Recommend", "/tools/quality-toolbox/recommend"),
    ("Workshop Index", "/tools/quality-toolbox/workshop"),
]
for name, path in toolbox_pages:
    test(name, f"{NGINX_URL}{path}")

# ============================================================
# 6. AI Backend APIs
# ============================================================
print("\n--- 6. AI Backend APIs ---")

# AI Health
test_api("AI Health", f"{BACKEND_URL}/api/v1/ai/health", method="GET")

# Fishbone
test_api("Fishbone Generate", f"{BACKEND_URL}/api/v1/ai/fishbone/generate",
         data={"problem": "Product leaking after assembly", "language": "zh"},
         check_fn=lambda b: "categories" in b or "branches" in b or "error" not in str(b).lower())

test_api("Fishbone Expand", f"{BACKEND_URL}/api/v1/ai/fishbone/expand",
         data={"problem": "Product leaking", "category": "Machine", "cause": "Equipment wear", "language": "zh"})

# 5 Whys
test_api("5Whys Suggest", f"{BACKEND_URL}/api/v1/ai/five-whys/suggest",
         data={"problem": "Product leaking after assembly", "current_whys": [], "language": "zh"})

test_api("5Whys Validate", f"{BACKEND_URL}/api/v1/ai/five-whys/validate",
         data={"problem": "Leaking", "whys": ["Seal damaged", "Excessive force", "Wrong tool", "No SOP", "Training gap"], "language": "zh"})

# Pareto
test_api("Pareto Analyze", f"{BACKEND_URL}/api/v1/ai/pareto/analyze",
         data={"items": [{"name": "Scratch", "count": 45}, {"name": "Dent", "count": 30}, {"name": "Crack", "count": 15}], "language": "zh"})

test_api("Pareto Chat", f"{BACKEND_URL}/api/v1/ai/pareto/chat",
         data={"question": "What should we focus on first?", "context": "Top defect: Scratch 45%", "language": "zh"})

# FMEA
test_api("FMEA AP", f"{BACKEND_URL}/api/v1/ai/fmea/ap",
         data={"fmea_type": "DFMEA", "product_name": "Seal Ring", "function": "Prevent leaking"})

test_api("FMEA Standards", f"{BACKEND_URL}/api/v1/ai/fmea/standards/DFMEA", method="GET")

# ============================================================
# 7. Quality Case APIs
# ============================================================
print("\n--- 7. Quality Case APIs ---")
if token:
    test_api("List Cases", f"{BACKEND_URL}/api/v1/cases/", method="GET", headers=auth_headers)
    
    # Create a test case
    r = test_api("Create Case", f"{BACKEND_URL}/api/v1/cases/",
                 data={"case_type": "process", "description": "Test case from test suite"},
                 headers=auth_headers,
                 check_fn=lambda b: "id" in b)
    
    if r and r.status_code == 200:
        case_id = r.json().get("id")
        test_api(f"Get Case {case_id}", f"{BACKEND_URL}/api/v1/cases/{case_id}", method="GET", headers=auth_headers)
        test_api(f"Get Timeline {case_id}", f"{BACKEND_URL}/api/v1/cases/{case_id}/timeline", method="GET", headers=auth_headers)
        test_api(f"Get Messages {case_id}", f"{BACKEND_URL}/api/v1/cases/{case_id}/messages", method="GET", headers=auth_headers)
        test_api(f"Generate 8D {case_id}", f"{BACKEND_URL}/api/v1/cases/{case_id}/generate-8d", method="POST", headers=auth_headers)
        test_api(f"Export 8D Word {case_id}", f"{BACKEND_URL}/api/v1/cases/{case_id}/export-8d", method="GET", headers=auth_headers)

# ============================================================
# 8. Data Analysis API
# ============================================================
print("\n--- 8. Data Analysis API ---")
# Note: upload requires multipart form, skip for now
test("Analysis Upload (no file, expect 422)", f"{BACKEND_URL}/api/v1/analysis/upload", expected_status=422)

# ============================================================
# 9. Subscription API
# ============================================================
print("\n--- 9. Subscription API ---")
test_api("Get Plans", f"{BACKEND_URL}/api/v1/subscription/plans", method="GET")
if token:
    test_api("Get Usage", f"{BACKEND_URL}/api/v1/subscription/usage", method="GET", headers=auth_headers)
    test_api("Check Limit", f"{BACKEND_URL}/api/v1/subscription/check-limit?action=case", method="GET", headers=auth_headers)

# ============================================================
# 10. Other Pages
# ============================================================
print("\n--- 10. Other Pages ---")
other_pages = [
    ("Homepage", "/"),
    ("Login", "/login"),
    ("Register", "/register"),
    ("Tools Index", "/tools"),
    ("Analysis", "/analysis"),
    ("Pricing", "/pricing"),
    ("About", "/about"),
    ("Cases", "/cases"),
    ("Cases New", "/cases/new"),
    ("Profile", "/profile"),
    ("Admin", "/admin"),
    ("Methodology", "/methodology"),
    ("Coach", "/coach"),
]
for name, path in other_pages:
    test(name, f"{NGINX_URL}{path}")

# ============================================================
# REPORT
# ============================================================
print("\n" + "=" * 70)
print(f"  TEST REPORT")
print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("=" * 70)
print(f"  Total: {len(results)}")
print(f"  PASS:  {total_pass}")
print(f"  FAIL:  {total_fail}")
print(f"  Rate:  {total_pass}/{len(results)} ({total_pass/len(results)*100:.0f}%)")
print("=" * 70)

if total_fail > 0:
    print("\n  FAILED TESTS:")
    for r in results:
        if r["result"] == "FAIL":
            detail = r.get("detail", "")
            print(f"    X {r['name']} -> {r['status']}{detail}")

# Save report
report = {
    "timestamp": datetime.now().isoformat(),
    "total": len(results),
    "pass": total_pass,
    "fail": total_fail,
    "rate": f"{total_pass/len(results)*100:.0f}%",
    "results": results,
}

with open("/root/Projects/ai-quality-portal/tests/test_report.json", "w") as f:
    json.dump(report, f, ensure_ascii=False, indent=2)
print(f"\n  Report saved to: tests/test_report.json")
