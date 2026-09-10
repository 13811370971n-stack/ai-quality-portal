#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""P1 API end-to-end test."""
import requests, json

BE = "http://localhost:8000/api/v1"

# Login
r = requests.post(BE + "/auth/login", json={"email": "admin@aidmaic.top", "password": "admin123"}, timeout=15)
token = r.json()["access_token"]
H = {"Authorization": "Bearer " + token}
print("[1] Login: OK")

# Create test case
r = requests.post(BE + "/cases/", json={"case_type": "process", "description": "P1 test: dimension out of tolerance"}, headers=H, timeout=15)
cid = r.json()["id"]
print("[2] Create case: id=" + str(cid))

# --- Multi root cause ---
rcs = []
for desc, cat, status in [
    ("Fixture clamping force insufficient", "machine", "confirmed"),
    ("Operator did not follow SOP torque spec", "man", "high_probability"),
    ("Measurement system R&R too high", "measurement", "rejected"),
]:
    r = requests.post(BE + "/cases/" + str(cid) + "/root-causes",
                      json={"description": desc, "category": cat, "status": status,
                            "cause_chain": ["Why1", "Why2", "Why3"], "confidence": 0.8},
                      headers=H, timeout=15)
    rcs.append(r.json())
print("[3] Added " + str(len(rcs)) + " root causes")

r = requests.get(BE + "/cases/" + str(cid) + "/root-causes", headers=H, timeout=15)
listed = r.json()
print("    List returns " + str(len(listed)) + " | statuses: " + ", ".join(x["status"] for x in listed))

# Confirm the second one
r = requests.put(BE + "/cases/" + str(cid) + "/root-causes/" + str(rcs[1]["id"]),
                 json={"status": "confirmed"}, headers=H, timeout=15)
print("[4] Confirmed RC#2: status=" + r.json()["status"] + ", verified_by=" + str(r.json()["verified_by"]))

# --- Coverage check BEFORE actions ---
r = requests.get(BE + "/cases/" + str(cid) + "/action-coverage", headers=H, timeout=15)
cov = r.json()
print("[5] Coverage (no actions): confirmed=" + str(cov["confirmed_root_causes"]) +
      ", gaps=" + str(len(cov["gaps"])) + ", warnings=" + str(len(cov["warnings"])))
for w in cov["warnings"]:
    print("      WARN: " + w)

# --- Add actions ---
requests.post(BE + "/cases/" + str(cid) + "/actions",
              json={"action_type": "containment", "description": "100% inspection of stock", "owner": "QE"},
              headers=H, timeout=15)
requests.post(BE + "/cases/" + str(cid) + "/actions",
              json={"action_type": "corrective", "description": "Redesign fixture with spring-loaded clamp",
                    "related_root_cause_id": rcs[0]["id"], "owner": "ME"},
              headers=H, timeout=15)
# Orphan corrective (not linked)
requests.post(BE + "/cases/" + str(cid) + "/actions",
              json={"action_type": "corrective", "description": "Add final inspection step"},
              headers=H, timeout=15)
requests.post(BE + "/cases/" + str(cid) + "/actions",
              json={"action_type": "preventive", "description": "Update PFMEA and control plan", "owner": "QE"},
              headers=H, timeout=15)
print("[6] Added 4 actions (1 containment, 2 corrective, 1 preventive)")

r = requests.get(BE + "/cases/" + str(cid) + "/actions", headers=H, timeout=15)
acts = r.json()
print("    Actions: " + ", ".join(a["action_type_label"] + ("->RC" if a["related_root_cause_id"] else "->none") for a in acts))

# --- Coverage check AFTER actions ---
r = requests.get(BE + "/cases/" + str(cid) + "/action-coverage", headers=H, timeout=15)
cov = r.json()
print("[7] Coverage after: rate=" + str(cov["coverage_rate"]) + "%, gaps=" + str(len(cov["gaps"])) +
      ", orphans=" + str(len(cov["orphan_actions"])) + ", complete=" + str(cov["is_complete"]))
for g in cov["gaps"]:
    print("      GAP: RC#" + str(g["root_cause_id"]) + " " + g["description"][:45] + " -> " + g["issue"])
for o in cov["orphan_actions"]:
    print("      ORPHAN: " + o["description"][:45])

# --- Effect verification ---
r = requests.post(BE + "/cases/" + str(cid) + "/verify",
                  json={
                      "before_data": "12.5,13.1,12.8,13.4,12.9,13.2,12.7,13.0",
                      "after_data": "10.1,10.3,9.9,10.2,10.0,10.1,9.8,10.2",
                      "metric_name": "Dimension deviation (um)",
                      "usl": 11.0, "lsl": 9.0,
                      "lower_is_better": True,
                      "before_defects": 24, "before_total": 1000,
                      "after_defects": 2, "after_total": 1000,
                  }, headers=H, timeout=15)
if r.status_code == 200:
    v = r.json()
    print("[8] Verification:")
    print("      before mean=" + str(v["before"]["mean"]) + " std=" + str(v["before"]["std"]))
    print("      after  mean=" + str(v["after"]["mean"]) + " std=" + str(v["after"]["std"]))
    print("      mean shift=" + str(v["mean_shift"]) + " (" + str(v["mean_shift_pct"]) + "%)")
    print("      Cpk: " + str(v["cpk_before"]) + " -> " + str(v["cpk_after"]) + " (delta " + str(v["cpk_improvement"]) + ")")
    print("      p=" + str(v["p_value"]) + " significant=" + str(v["significant"]))
    if v.get("defect"):
        print("      defect rate: " + str(v["defect"]["before_rate"]) + "% -> " + str(v["defect"]["after_rate"]) +
              "% (reduced " + str(v["defect"]["reduction_pct"]) + "%)")
    print("      VERDICT: " + v["verdict"] + " | " + v["verdict_label"])
else:
    print("[8] Verification FAILED: " + str(r.status_code) + " " + r.text[:150])

r = requests.get(BE + "/cases/" + str(cid) + "/verifications", headers=H, timeout=15)
print("    Stored verifications: " + str(len(r.json())))

# --- AI effectiveness check on orphan action ---
orphan = [a for a in acts if a["action_type"] == "corrective" and not a["related_root_cause_id"]]
if orphan:
    r = requests.post(BE + "/cases/" + str(cid) + "/actions/" + str(orphan[0]["id"]) + "/check",
                      headers=H, timeout=45)
    ok = "content" in r.text
    print("[9] AI effectiveness check on orphan action: " + ("streaming OK" if ok else "FAIL " + r.text[:100]))

# --- Archive ---
r = requests.put(BE + "/cases/" + str(cid) + "/archive", json={"archived": True}, headers=H, timeout=15)
print("[10] Archive: " + r.json()["status"])

r = requests.get(BE + "/cases/", headers=H, timeout=15)
target = [c for c in r.json() if c["id"] == cid]
print("     Case list shows archived=" + str(target[0]["archived"] if target else "?"))

r = requests.put(BE + "/cases/" + str(cid) + "/archive", json={"archived": False}, headers=H, timeout=15)
print("     Unarchive: " + r.json()["status"])

# --- Delete root cause (should unlink action) ---
r = requests.delete(BE + "/cases/" + str(cid) + "/root-causes/" + str(rcs[0]["id"]), headers=H, timeout=15)
print("[11] Delete RC#1: " + r.json()["status"])
r = requests.get(BE + "/cases/" + str(cid) + "/actions", headers=H, timeout=15)
still_linked = [a for a in r.json() if a["related_root_cause_id"] == rcs[0]["id"]]
print("     Actions still linked to deleted RC: " + str(len(still_linked)) + " (expect 0)")

# --- Delete case (cleanup) ---
r = requests.delete(BE + "/cases/" + str(cid), headers=H, timeout=15)
print("[12] Delete case: " + r.json()["status"])
r = requests.get(BE + "/cases/" + str(cid), headers=H, timeout=15)
print("     Fetch after delete: HTTP " + str(r.status_code) + " (expect 404)")

print("\nP1 API TEST COMPLETE")
