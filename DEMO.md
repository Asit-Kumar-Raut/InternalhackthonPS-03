# SmartSignal AI — Live Demo Script 🚦🚑

This document walks a presenter through a complete end-to-end demonstration of SmartSignal AI. Follow the steps in order. Each section shows what to do, what to say, and what the audience should see.

> **Setup before demo:** Run `scripts\setup.bat` once, then `scripts\start-all.bat`. Allow 20 seconds for all services to initialise.

---

## Step 1 — Start All Services

**Action:**
```bat
cd D:\internalhackthon
scripts\start-all.bat
```

**Expected output (four terminal windows open):**
```
[AI Model Service]  Uvicorn running on http://0.0.0.0:8001
[Backend API]       Uvicorn running on http://0.0.0.0:8000
[Admin Dashboard]   VITE ready on http://localhost:5173
[Emergency App]     VITE ready on http://localhost:5174
```

**Say:** *"SmartSignal AI runs four services: the AI prediction model, a FastAPI backend, an admin dashboard, and a mobile emergency-vehicle app. All start with a single batch file."*

> 📸 **Screenshot placeholder:** Four terminal windows side by side, each showing "running on…" message.

---

## Step 2 — Open Admin Dashboard & Login

**Action:**
1. Open browser → http://localhost:5173
2. Enter credentials: `admin@demo.com` / `Admin@123`
3. Click **Login**

**Expected view:** Dashboard loads, showing the city map with 6 junctions (J1–J6) and their live signal states (coloured dots: 🟢🟡🔴).

**Say:** *"This is the admin's control centre. Every junction updates in real time over WebSocket. No page refreshes needed."*

> 📸 **Screenshot placeholder:** Admin dashboard map view with coloured junction markers and sidebar showing signal timers.

---

## Step 3 — Observe Live Traffic Simulation

**Action:** Watch the map for 30 seconds without touching anything.

**Expected behaviour:**
- Signal phases cycle automatically (green → yellow → red).
- Congestion level badges (LOW / MEDIUM / HIGH / CONGESTED) change as the simulator injects virtual traffic.
- The "Current Cycle Length" counter in the sidebar reflects Webster-computed values (varies 25–55 s based on simulated density).
- EMA-smoothed occupancy sparklines animate on each road card.

**Say:** *"The backend runs a full adaptive control loop: sensor readings feed an Exponential Moving Average smoother, then Webster's formula computes the optimal cycle length. Aging ensures no phase starves beyond 90 seconds."*

> 📸 **Screenshot placeholder:** Sidebar showing road congestion levels and Webster cycle counter updating live.

---

## Step 4 — Register a New Emergency Vehicle (Driver App)

**Action:**
1. Open new browser tab → http://localhost:5174
2. Click **Register Vehicle**
3. Fill in the form:
   - Vehicle number: `MH-01-EV-9999`
   - Vehicle type: `AMBULANCE`
   - Organisation: `City Hospital`
   - Driver name: `Test Driver`
   - Upload any placeholder image for each photo field
4. Click **Submit**

**Expected:** Success toast — *"Registration submitted. Awaiting admin approval."*

**Say:** *"Any driver can register a vehicle. The system stores documents securely via Cloudinary and flags the vehicle as PENDING until an admin reviews it."*

> 📸 **Screenshot placeholder:** Registration form with filled fields and success toast notification.

---

## Step 5 — Admin Approves the Vehicle

**Action (back in Admin Dashboard tab):**
1. Navigate to **Vehicles** in the sidebar
2. Find `MH-01-EV-9999` with status `PENDING`
3. Click **Approve**
4. Confirm the dialog

**Expected:** Vehicle status changes to `APPROVED` (green badge). An audit-log entry appears.

**Say:** *"Only an admin can approve. Rejected or suspended vehicles are blocked at the API level — the JWT check plus a vehicle-status gate are enforced server-side, not just in the UI."*

> 📸 **Screenshot placeholder:** Vehicles table with PENDING badge, then same row showing APPROVED badge after click.

---

## Step 6 — Driver Starts an Emergency Run J1 → J2 → J4

**Action (Emergency Vehicle App tab):**
1. Login as `ambulance@demo.com` / `Driver@123`
2. Click **Start Emergency Run**
3. Select route: **J1 → J2 → J4** (or type junction IDs manually)
4. Click **Activate**

**Expected:**
- App shows: *"Emergency run ACTIVE — Corridor clearing ahead"*
- Route path highlights on the driver map (pulsing green line)

**Say:** *"The backend runs Dijkstra's algorithm to validate route connectivity, then inserts the vehicle into the junction priority queue. ETA to each junction is computed from road length ÷ measured speed."*

> 📸 **Screenshot placeholder:** Emergency app showing active run status and highlighted route on minimap.

---

## Step 7 — Admin Watches the Green Corridor

**Action (Admin Dashboard tab):** Watch the map as the emergency vehicle progresses.

**Expected behaviour on the Admin map:**
- J1: immediately begins YELLOW (3 s) → ALL_RED (2 s) → GREEN (emergency phase, pulsing green)
- J2: pre-emption queued — starts clearing as vehicle ETA to J2 approaches
- J4: starts clearing after J2 clears
- Junctions not on route (J3, J5, J6) continue normal adaptive cycling

**Say:** *"The green corridor is built junction by junction. No junction skips yellow or all-red — that's enforced by the Safety FSM. Emergency vehicles must wait for the transition to complete, just like in real ITE-compliant controllers."*

> 📸 **Screenshot placeholder:** Admin map showing J1 pulsing green, J2 in yellow phase, J3-J6 normal cycling.

---

## Step 8 — Each Junction Clears (Yellow → All-Red → Green)

**Action:** Observe the junction detail panel (click any active junction on map).

**Expected detail panel sequence:**
```
Phase: NS_GREEN  → (demand timer)
Phase: NS_YELLOW → 3 s countdown
Phase: ALL_RED   → 2 s countdown  ← cannot be skipped
Phase: EW_GREEN  → emergency hold (camera confirmation pending)
```

**Say:** *"The FSM rejects any attempt to jump directly from green to green, or to skip all-red. The emergency logic hooks into the FSM scheduler — it requests a phase, but the FSM decides when it is safe to grant it."*

> 📸 **Screenshot placeholder:** Junction detail modal showing phase countdown and FSM state labels.

---

## Step 9 — Demo: Fake / Rejected Vehicle Attempt

**Action (Emergency Vehicle App — open incognito):**
1. Register a new vehicle `MH-99-XX-0000` but **do not approve it**
2. Login as the new driver
3. Try to start an emergency run

**Expected:** API returns `403 Forbidden` — *"Vehicle is not approved for emergency operations."*  
The admin dashboard shows no corridor activation. An `UNAUTHORIZED_EMERGENCY_ATTEMPT` event appears in the Events log.

**Say:** *"The system has three guards: JWT authentication (you must be a DRIVER), vehicle status check (must be APPROVED), and trust score (must be ≥ 20). All three are enforced server-side. Bypassing the UI does nothing."*

> 📸 **Screenshot placeholder:** Error toast in driver app and Events log showing UNAUTHORIZED_EMERGENCY_ATTEMPT.

---

## Step 10 — Demo: Sensor Fault

**Action (Admin Dashboard):**
1. Navigate to **Sensors**
2. Click **Simulate Fault** on any camera sensor
3. Wait 15 seconds

**Expected:**
- Sensor status badge changes to `FAULT` (red)
- Backend emits `SENSOR_FAULT` event (visible in Events log)
- Affected road switches from "Actuated" to "Fixed-time fallback" (badge changes in road card)
- Signal timing continues — no outage, just conservative fixed timing

**Say:** *"If a sensor goes silent for 15 seconds, the system marks it faulty and falls back to fixed-time Webster using the last known density. The junction never stops; it degrades gracefully."*

> 📸 **Screenshot placeholder:** Sensor panel showing FAULT badge, and road card showing "Fixed-time fallback" mode.

---

## Step 11 — Demo: AI Service Toggle

**Action:**
1. Close / kill the AI Model Service terminal window (simulates AI service crash)
2. Watch the Admin Dashboard for 10–15 seconds

**Expected:**
- Dashboard header shows **"AI Offline"** badge (amber)
- Signal timing continues without interruption
- Backend logs show `AI_SERVICE_UNAVAILABLE` events at each cycle
- Webster runs with `α = 1.0` (pure current sensor data, no AI blend)

**Action (restore):**
3. Re-run: `cd D:\internalhackthon\ai-model && venv\Scripts\activate && uvicorn app.main:app --port 8001`
4. Within one cycle: "AI Offline" badge disappears, AI blend resumes

**Say:** *"The backend calls the AI service with a 3-second timeout. Any failure — connection refused, timeout, or 5xx — is caught silently. Traffic control continues transparently. The dashboard badge is the only user-visible indication. When the service recovers, the blend automatically resumes."*

> 📸 **Screenshot placeholder:** Dashboard showing "AI Offline" amber badge in header, then same view with badge gone after service recovery.

---

## Demo Complete ✅

**Summary of capabilities demonstrated:**

| Feature | Demonstrated |
|---------|-------------|
| Adaptive signal control (Webster + EMA + Aging) | ✅ Step 3 |
| Emergency vehicle green corridor | ✅ Steps 6–8 |
| Safety FSM (yellow/all-red non-skippable) | ✅ Step 8 |
| Access control (rejected vehicle blocked) | ✅ Step 9 |
| Sensor fault graceful fallback | ✅ Step 10 |
| AI service failure transparent | ✅ Step 11 |

---

## Useful Commands During Demo

```bat
:: Re-seed demo data if anything looks wrong
scripts\seed-demo.bat

:: Check backend logs live
cd D:\internalhackthon\backend && venv\Scripts\activate && uvicorn app.main:app --port 8000 --reload --log-level debug

:: Curl test: check AI service health
curl http://localhost:8001/health

:: Curl test: login and get JWT
curl -X POST http://localhost:8000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@demo.com\",\"password\":\"Admin@123\"}"
```

---

*SmartSignal AI — Hackathon Demo Guide | November 2026*
