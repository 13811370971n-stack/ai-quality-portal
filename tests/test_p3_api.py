#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import requests, json, time

BE = "http://localhost:8000/api/v1"

def login(email="admin@aidmaic.top", pw="admin123"):
    r = requests.post(BE + "/auth/login", json={"email": email, "password": pw}, timeout=15)
    return r.json()["access_token"]

TOKEN = login()
H = {"Authorization": "Bearer " + TOKEN}

print("=== SMS ===")
r = requests.get(BE + "/auth/sms/status", timeout=10)
print("[1] status: mode=" + r.json()["mode"] + " configured=" + str(r.json()["configured"]))

PHONE = "13900139001"
r = requests.post(BE + "/auth/sms/send", json={"phone": PHONE, "purpose": "register"}, timeout=15)
if r.status_code == 200:
    d = r.json()
    code = d.get("mock_code")
    print("[2] send: mode=" + d["mode"] + " ttl=" + str(d["expires_in"]) + "s code=" + str(code))
    r = requests.post(BE + "/auth/sms/verify", json={"phone": PHONE, "code": code}, timeout=15)
    if r.status_code == 200:
        u = r.json()["user"]
        print("[3] verify: user_id=" + str(u["id"]) + " phone=" + str(u["phone"]) + " is_new=" + str(u.get("is_new")))
        phone_token = r.json()["access_token"]
    else:
        print("[3] verify FAILED: " + r.text[:150])
        phone_token = None
else:
    print("[2] send FAILED: " + str(r.status_code) + " " + r.text[:150])
    phone_token = None

# Invalid phone
r = requests.post(BE + "/auth/sms/send", json={"phone": "12345"}, timeout=10)
print("[4] invalid phone -> HTTP " + str(r.status_code) + " (expect 400)")

print("\n=== Payment ===")
r = requests.get(BE + "/billing/payment-status", timeout=10)
ps = r.json()
print("[5] providers: " + ", ".join(p["name"] for p in ps["available_providers"]) + " | mode=" + ps["mode"])

# Use a fresh non-admin user for role upgrade test
test_email = "paytest" + str(int(time.time())) + "@test.local"
r = requests.post(BE + "/auth/register", json={"email": test_email, "password": "test1234", "nickname": "PayTest"}, timeout=15)
pay_token = r.json()["access_token"]
PH = {"Authorization": "Bearer " + pay_token}
r = requests.get(BE + "/auth/me", headers=PH, timeout=10)
print("[6] test user created: role=" + r.json()["role"])

r = requests.post(BE + "/billing/orders", json={"plan_id": "pro", "billing_cycle": "monthly", "provider": "mock"}, headers=PH, timeout=15)
if r.status_code == 200:
    o = r.json()
    print("[7] order: " + o["order_no"] + " amount=" + str(o["amount"]) + " provider=" + o["provider"] + " status=" + o["status"])
    order_no = o["order_no"]

    r = requests.get(BE + "/billing/orders/" + order_no, headers=PH, timeout=10)
    print("[8] poll: status=" + r.json()["status"])

    r = requests.post(BE + "/billing/orders/confirm-mock", json={"order_no": order_no}, headers=PH, timeout=15)
    if r.status_code == 200:
        d = r.json()
        print("[9] confirm: status=" + d["status"] + " new_role=" + d["new_role"] +
              " expires=" + str(d["subscription"]["expires_at"])[:10])
    else:
        print("[9] confirm FAILED: " + r.text[:150])

    r = requests.get(BE + "/billing/my-subscription", headers=PH, timeout=10)
    s = r.json()
    print("[10] subscription: has=" + str(s["has_subscription"]) + " plan=" + str(s.get("plan_name")) +
          " days_left=" + str(s.get("days_left")) + " role=" + str(s.get("role")))

    # Verify VIP unlocks unlimited cases
    r = requests.get(BE + "/subscription/usage", headers=PH, timeout=10)
    u = r.json()
    print("[11] usage after upgrade: plan=" + u["plan"] + " cases_limit=" + str(u["cases_limit"]) + " (-1 = unlimited)")

    # Annual order
    r = requests.post(BE + "/billing/orders", json={"plan_id": "pro_plus", "billing_cycle": "annual", "provider": "mock"}, headers=PH, timeout=15)
    print("[12] annual pro_plus order: amount=" + str(r.json()["amount"]) + " (expect 2999.0)")
else:
    print("[7] order FAILED: " + str(r.status_code) + " " + r.text[:200])

# Callback must reject unverified
r = requests.post(BE + "/billing/callback/alipay", json={"out_trade_no": "FAKE", "trade_status": "TRADE_SUCCESS"}, timeout=10)
print("[13] unverified callback -> HTTP " + str(r.status_code) + " (expect 400, must not trust)")

print("\n=== Feedback ===")
r = requests.post(BE + "/billing/feedback",
                  json={"category": "usability", "content": "The root cause panel is clear but I could not find where to link actions at first",
                        "page_url": "/cases/5", "rating": 4, "contact": "qe@example.com"},
                  headers=PH, timeout=15)
print("[14] submit (logged in): HTTP " + str(r.status_code) + " id=" + str(r.json().get("id")))

r = requests.post(BE + "/billing/feedback",
                  json={"category": "bug", "content": "Anonymous report: DOE CSV export had no BOM in older build", "rating": 3},
                  timeout=15)
print("[15] submit (anonymous): HTTP " + str(r.status_code))

r = requests.post(BE + "/billing/feedback", json={"category": "invalid_cat", "content": "x"}, timeout=10)
print("[16] invalid category -> HTTP " + str(r.status_code) + " (expect 400)")

r = requests.get(BE + "/billing/feedback", headers=H, timeout=10)
print("[17] admin list: " + str(len(r.json())) + " items")

r = requests.get(BE + "/billing/feedback/stats", headers=H, timeout=10)
st = r.json()
print("[18] stats: total=" + str(st["total"]) + " avg_rating=" + str(st["avg_rating"]) +
      " by_cat=" + json.dumps(st["by_category"], ensure_ascii=False))

r = requests.get(BE + "/billing/feedback", headers=PH, timeout=10)
print("[19] non-admin access to feedback list -> HTTP " + str(r.status_code) + " (expect 403)")

items = requests.get(BE + "/billing/feedback", headers=H, timeout=10).json()
if items:
    fid = items[0]["id"]
    r = requests.put(BE + "/billing/feedback/" + str(fid), json={"status": "reviewing", "admin_note": "Confirmed, will improve labels"}, headers=H, timeout=10)
    print("[20] triage feedback #" + str(fid) + ": " + r.json()["status"])

print("\nP3 BACKEND TEST COMPLETE")
