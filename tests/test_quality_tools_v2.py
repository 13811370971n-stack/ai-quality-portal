#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Quality Tools Comprehensive Test Suite v2
==========================================
Level 1: Service health
Level 2: Page accessibility
Level 3: Internal link crawling (extract all hrefs from pages, verify each)
Level 4: Full API parameter testing
Level 5: Interactive tool verification
"""
import requests
import json
import re
import time
from datetime import datetime
from html.parser import HTMLParser
from collections import defaultdict

BASE = "http://localhost"
FE = f"{BASE}:3000"
BE = f"{BASE}:8000"
NX = f"{BASE}:8080"

results = []
pass_count = 0
fail_count = 0
link_results = defaultdict(list)  # page -> [broken links]


class LinkExtractor(HTMLParser):
    """Extract all href values from HTML."""
    def __init__(self):
        super().__init__()
        self.links = set()
    def handle_starttag(self, tag, attrs):
        if tag == 'a':
            for attr, val in attrs:
                if attr == 'href' and val and val.startswith('/') and not val.startswith('//'):
                    self.links.add(val)


def test(name, url, expected=200, timeout=10):
    global pass_count, fail_count
    try:
        r = requests.get(url, timeout=timeout, allow_redirects=True)
        ok = r.status_code == expected
        if ok: pass_count += 1
        else: fail_count += 1
        results.append({"name": name, "url": url, "status": r.status_code, "expected": expected, "result": "PASS" if ok else "FAIL"})
        print(f"  [{'PASS' if ok else 'FAIL'}] {name} -> {r.status_code}")
        return r
    except Exception as e:
        fail_count += 1
        results.append({"name": name, "url": url, "status": str(e)[:40], "result": "FAIL"})
        print(f"  [FAIL] {name} -> {str(e)[:40]}")
        return None


def test_api(name, url, method="POST", data=None, headers=None, check_fn=None):
    global pass_count, fail_count
    try:
        if method == "GET":
            r = requests.get(url, headers=headers, timeout=15)
        else:
            r = requests.post(url, json=data, headers=headers, timeout=30)
        body = None
        try: body = r.json()
        except: pass
        ok = r.status_code == 200
        if ok and check_fn and body:
            ok = check_fn(body)
        if ok: pass_count += 1
        else: fail_count += 1
        detail = ""
        if not ok and body:
            detail = f" | {json.dumps(body, ensure_ascii=False)[:120]}"
        results.append({"name": name, "status": r.status_code, "result": "PASS" if ok else "FAIL", "detail": detail})
        print(f"  [{'PASS' if ok else 'FAIL'}] {name} -> {r.status_code}{detail}")
        return r
    except Exception as e:
        fail_count += 1
        results.append({"name": name, "status": str(e)[:40], "result": "FAIL"})
        print(f"  [FAIL] {name} -> {str(e)[:40]}")
        return None


def crawl_links(page_name, page_url):
    """Crawl a page, extract all internal links, test each one."""
    global pass_count, fail_count
    try:
        r = requests.get(page_url, timeout=10)
        if r.status_code != 200:
            return
        
        parser = LinkExtractor()
        parser.feed(r.text)
        
        # Filter relevant links (skip external, anchors, etc)
        internal_links = set()
        for link in parser.links:
            # Skip hash-only links, javascript, external
            if link == '#' or link.startswith('/#') or link.startswith('/api/'):
                continue
            # Normalize - remove trailing hash
            clean = link.split('#')[0]
            if clean and clean != '/':
                internal_links.add(clean)
        
        broken = []
        for link in sorted(internal_links):
            try:
                lr = requests.get(f"{FE}{link}", timeout=8, allow_redirects=True)
                if lr.status_code == 404:
                    broken.append(link)
                    fail_count += 1
                    results.append({"name": f"[LINK] {page_name} -> {link}", "status": 404, "result": "FAIL"})
                    print(f"    [BROKEN] {page_name} -> {link} (404)")
                else:
                    pass_count += 1
            except Exception as e:
                broken.append(link)
                fail_count += 1
                results.append({"name": f"[LINK] {page_name} -> {link}", "status": str(e)[:30], "result": "FAIL"})
                print(f"    [BROKEN] {page_name} -> {link} ({str(e)[:30]})")
        
        if not broken:
            print(f"    [OK] {page_name}: {len(internal_links)} links all valid")
        
        link_results[page_name] = broken
        
    except Exception as e:
        print(f"    [ERROR] Cannot crawl {page_name}: {e}")


print("=" * 70)
print(f"  Quality Tools Test Suite v2 - Comprehensive")
print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("=" * 70)

# ============================================================
# LEVEL 1: Service Health
# ============================================================
print("\n--- Level 1: Service Health ---")
test("Backend", f"{BE}/health")
test("Frontend", f"{FE}/")
test("Nginx", f"{NX}/")
test("SPC", f"{BASE}:8050/tools/ai-spc/app/")
test("MSA", f"{BASE}:8052/")

# ============================================================
# LEVEL 2: All Pages Accessible
# ============================================================
print("\n--- Level 2: Page Accessibility ---")

all_pages = [
    # Main pages
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
    ("404 Page", "/nonexistent-page-test"),
    
    # AI Tool pages
    ("AI-SPC", "/tools/ai-spc"),
    ("AI-DFMEA", "/tools/ai-dfmea"),
    ("AI-PFMEA", "/tools/ai-pfmea"),
    
    # Quality Toolbox
    ("Toolbox Home", "/tools/quality-toolbox"),
    ("Knowledge Graph", "/tools/quality-toolbox/graph"),
    ("Learning Path", "/tools/quality-toolbox/learn"),
    ("Smart Recommend", "/tools/quality-toolbox/recommend"),
    ("Workshop Index", "/tools/quality-toolbox/workshop"),
    
    # Workshop tools (18)
    ("WS: fishbone", "/tools/quality-toolbox/workshop/fishbone"),
    ("WS: five-whys", "/tools/quality-toolbox/workshop/five-whys"),
    ("WS: pareto", "/tools/quality-toolbox/workshop/pareto"),
    ("WS: checksheet", "/tools/quality-toolbox/workshop/checksheet"),
    ("WS: histogram", "/tools/quality-toolbox/workshop/histogram"),
    ("WS: scatter", "/tools/quality-toolbox/workshop/scatter"),
    ("WS: controlchart", "/tools/quality-toolbox/workshop/controlchart"),
    ("WS: flowchart", "/tools/quality-toolbox/workshop/flowchart"),
    ("WS: sipoc", "/tools/quality-toolbox/workshop/sipoc"),
    ("WS: fmea", "/tools/quality-toolbox/workshop/fmea"),
    ("WS: process-capability", "/tools/quality-toolbox/workshop/process-capability"),
    ("WS: normal-plot", "/tools/quality-toolbox/workshop/normal-plot"),
    ("WS: hypothesis-test", "/tools/quality-toolbox/workshop/hypothesis-test"),
    ("WS: regression", "/tools/quality-toolbox/workshop/regression"),
    ("WS: anova", "/tools/quality-toolbox/workshop/anova"),
    ("WS: box-plot", "/tools/quality-toolbox/workshop/box-plot"),
    ("WS: run-chart", "/tools/quality-toolbox/workshop/run-chart"),
    ("WS: multi-vari", "/tools/quality-toolbox/workshop/multi-vari"),
    
    # Tool detail pages (test a few known tool IDs from tools.ts)
    ("Detail: cause-effect-diagram", "/tools/quality-toolbox/cause-effect-diagram"),
    ("Detail: check-sheet", "/tools/quality-toolbox/check-sheet"),
    ("Detail: pareto-chart", "/tools/quality-toolbox/pareto-chart"),
    ("Detail: histogram", "/tools/quality-toolbox/histogram"),
    ("Detail: scatter-diagram", "/tools/quality-toolbox/scatter-diagram"),
    ("Detail: control-chart", "/tools/quality-toolbox/control-chart"),
    ("Detail: flowchart", "/tools/quality-toolbox/flowchart"),
    ("Detail: five-whys", "/tools/quality-toolbox/five-whys"),
    ("Detail: fmea", "/tools/quality-toolbox/fmea"),
    ("Detail: sipoc", "/tools/quality-toolbox/sipoc"),
    ("Detail: affinity-diagram", "/tools/quality-toolbox/affinity-diagram"),
    ("Detail: tree-diagram", "/tools/quality-toolbox/tree-diagram"),
    ("Detail: matrix-diagram", "/tools/quality-toolbox/matrix-diagram"),
    ("Detail: relations-diagram", "/tools/quality-toolbox/relations-diagram"),
    ("Detail: pdpc", "/tools/quality-toolbox/pdpc"),
    ("Detail: arrow-diagram", "/tools/quality-toolbox/arrow-diagram"),
    ("Detail: matrix-data-analysis", "/tools/quality-toolbox/matrix-data-analysis"),
]

for name, path in all_pages:
    expected = 200 if "nonexistent" not in path else 404
    test(name, f"{FE}{path}", expected=expected)

# ============================================================
# LEVEL 3: Internal Link Crawling
# ============================================================
print("\n--- Level 3: Internal Link Crawling ---")

# Crawl key pages that contain many links
pages_to_crawl = [
    ("Tools Index", f"{FE}/tools"),
    ("Toolbox Home", f"{FE}/tools/quality-toolbox"),
    ("Knowledge Graph", f"{FE}/tools/quality-toolbox/graph"),
    ("Workshop Index", f"{FE}/tools/quality-toolbox/workshop"),
    ("Learning Path", f"{FE}/tools/quality-toolbox/learn"),
    ("Homepage", f"{FE}/"),
    ("Methodology", f"{FE}/methodology"),
    ("About", f"{FE}/about"),
    ("Pricing", f"{FE}/pricing"),
]

for name, url in pages_to_crawl:
    print(f"  Crawling: {name}")
    crawl_links(name, url)

# Also crawl each tool detail page for "related tools" links
print("\n  Crawling tool detail pages for related links...")
# Get tool IDs from tools.ts
try:
    r = requests.get(f"{FE}/tools/quality-toolbox", timeout=10)
    # Extract links to tool detail pages
    parser = LinkExtractor()
    parser.feed(r.text)
    detail_links = [l for l in parser.links if l.startswith('/tools/quality-toolbox/') 
                    and '/workshop/' not in l and '/graph' not in l and '/learn' not in l 
                    and '/recommend' not in l and l != '/tools/quality-toolbox']
    for link in sorted(set(detail_links))[:20]:  # limit to 20
        page_name = f"Detail: {link.split('/')[-1]}"
        crawl_links(page_name, f"{FE}{link}")
except Exception as e:
    print(f"  [ERROR] Could not crawl detail pages: {e}")

# ============================================================
# LEVEL 4: Full API Parameter Testing
# ============================================================
print("\n--- Level 4: API Testing (Full Parameters) ---")

# Auth
r = test_api("Login", f"{BE}/api/v1/auth/login", data={"email": "admin@aidmaic.top", "password": "admin123"})
token = r.json().get("access_token") if r and r.status_code == 200 else None
auth = {"Authorization": f"Bearer {token}"} if token else {}

# AI Fishbone - full params
test_api("Fishbone Generate", f"{BE}/api/v1/ai/fishbone/generate",
         data={"problem": "Product surface scratches found during final inspection", "language": "zh"})

test_api("Fishbone Expand", f"{BE}/api/v1/ai/fishbone/expand",
         data={"problem": "Surface scratches", "category": "Machine", "cause": "Tool wear", "language": "zh"})

# AI 5Whys - check actual schema first
try:
    schema_r = requests.get(f"{BE}/openapi.json", timeout=10)
    schema = schema_r.json()
    five_why_schema = schema.get("components", {}).get("schemas", {})
    
    # Find the correct field names
    for name, s in five_why_schema.items():
        if "why" in name.lower() or "fivewhys" in name.lower():
            print(f"  [SCHEMA] {name}: {json.dumps(s.get('properties', {}), indent=2)[:200]}")
except:
    pass

# Try different param formats for 5Whys
test_api("5Whys Suggest (chain)", f"{BE}/api/v1/ai/five-whys/suggest",
         data={"problem": "Product scratches", "chain": [], "language": "zh"})

test_api("5Whys Suggest (current_whys)", f"{BE}/api/v1/ai/five-whys/suggest",
         data={"problem": "Product scratches", "current_whys": [], "language": "zh"})

# Pareto - with correct field name
test_api("Pareto Analyze", f"{BE}/api/v1/ai/pareto/analyze",
         data={"items": [{"category": "Scratch", "count": 45}, {"category": "Dent", "count": 30}, {"category": "Crack", "count": 15}]})

test_api("Pareto Chat", f"{BE}/api/v1/ai/pareto/chat",
         data={"items": [{"category": "Scratch", "count": 45}], "question": "What should we focus on?", "history": []})

test_api("Pareto Compare", f"{BE}/api/v1/ai/pareto/compare",
         data={"before": [{"category": "Scratch", "count": 45}], "after": [{"category": "Scratch", "count": 10}]})

# FMEA - check schema
try:
    for name, s in five_why_schema.items():
        if "fmea" in name.lower():
            print(f"  [SCHEMA] {name}: {json.dumps(s.get('properties', {}), indent=2)[:200]}")
except:
    pass

test_api("FMEA Standards DFMEA", f"{BE}/api/v1/ai/fmea/standards/DFMEA", method="GET")
test_api("FMEA Standards PFMEA", f"{BE}/api/v1/ai/fmea/standards/PFMEA", method="GET")

# Cases
if token:
    test_api("Cases List", f"{BE}/api/v1/cases/", method="GET", headers=auth)
    test_api("Subscription Plans", f"{BE}/api/v1/subscription/plans", method="GET")
    test_api("Usage", f"{BE}/api/v1/subscription/usage", method="GET", headers=auth)

# ============================================================
# REPORT
# ============================================================
print("\n" + "=" * 70)
print(f"  TEST REPORT v2")
print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("=" * 70)
print(f"  Total:  {len(results)}")
print(f"  PASS:   {pass_count}")
print(f"  FAIL:   {fail_count}")
print(f"  Rate:   {pass_count}/{len(results)} ({pass_count/max(len(results),1)*100:.0f}%)")
print("=" * 70)

if fail_count > 0:
    print("\n  FAILED TESTS:")
    for r in results:
        if r["result"] == "FAIL":
            detail = r.get("detail", "")
            print(f"    X {r['name']} -> {r.get('status','?')}{detail}")

# Broken links summary
broken_pages = {k: v for k, v in link_results.items() if v}
if broken_pages:
    print(f"\n  BROKEN LINKS SUMMARY ({sum(len(v) for v in broken_pages.values())} total):")
    for page, links in broken_pages.items():
        print(f"    {page}:")
        for link in links:
            print(f"      -> {link}")

# Save
report = {
    "timestamp": datetime.now().isoformat(),
    "total": len(results),
    "pass": pass_count,
    "fail": fail_count,
    "broken_links": {k: v for k, v in link_results.items() if v},
    "results": results,
}
with open("/root/Projects/ai-quality-portal/tests/test_report_v2.json", "w") as f:
    json.dump(report, f, ensure_ascii=False, indent=2)
print(f"\n  Report saved to: tests/test_report_v2.json")
