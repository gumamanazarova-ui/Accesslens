# AccessLens — Local-Place Accessibility Information Directory

> **Neighborhood Hacks Hackathon MVP** &bull; Local-First, Zero-Dependency Community Accessibility Directory.
> **Core Principle:** *UNKNOWN is strictly different from NO (Not Present).*

AccessLens is a local-place accessibility information directory built to solve a critical barrier in physical accessibility data: generic statements like *"this venue is accessible"* frequently hide deal-breaking barriers, while missing data is often mistakenly assumed to mean inaccessible or vice versa. AccessLens tracks individual physical access features, whether each feature was verified, where the information originated, and how recently it was checked.

---

## 1. The Problem

Commercial maps and review websites typically reduce accessibility to a single binary checkmark: `Wheelchair Accessible: Yes / No`. This simplistic approach harms people with diverse access needs in three distinct ways:

1. **The "Single Score" Fallacy:** A restaurant might feature a beautiful zero-threshold ramp at the front door, but have its restroom situated down a narrow flight of stairs in the basement (or vice versa). Labeling the venue simply as "Accessible" leads people with mobility devices into stranded situations.
2. **Conflating "Unknown" with "Not Present":** If a survey volunteer did not inspect the restroom, marking it "Not Present" unfairly penalizes the venue and misinforms visitors. Conversely, leaving it blank without an explicit status encourages visitors to make dangerous assumptions.
3. **Information Rot (Staleness):** Temporary construction, renovation, seasonal threshold ramps, or rearranged heavy furniture can invalidate old reports. Without a prominent check date and freshness indicator, stale data masquerades as current fact.

### How AccessLens Solves This
- **Feature-Level Fact Tracking:** Instead of an overall score, AccessLens tracks three essential, objective physical features:
  - **🚪 Step-Free Entrance:** Level thresholds, ramps, elevators, and doorway clearances.
  - **🚻 Accessible Toilet:** Grab bars, turning radius, and floor level.
  - **🪑 Accessible Seating:** Wheelchair-height tables, removable chairs, and aisle clearance.
- **Strict Distinction:** Every feature is explicitly marked as **✓ Present**, **✕ Not Present**, or **? Unknown**.
- **Evidence & Source Tracking:** Every place record explicitly records its information source (`First-hand observation`, `Staff-reported`, or `Unverified`) with optional observer notes.
- **Transparent Staleness Rule:** Any record last checked more than **180 days ago** (6 months) is visually flagged with a `⚠️ Stale Check (>180d)` badge to prompt a fresh re-survey.

---

## 2. Feature Definitions & Status Conventions

| Status | Visual Label | Meaning |
| :--- | :--- | :--- |
| **Present** | `[✓ PRESENT]` | A surveyor or staff member specifically confirmed that this physical access feature exists and meets functional criteria. |
| **Not Present** | `[✕ NOT PRESENT]` | Specifically verified that a barrier exists (e.g., stairs without a ramp, narrow stall, high-counter only). |
| **Unknown** | `[? UNKNOWN]` | **No verification has occurred.** The feature was locked, uninspected, or unconfirmed. It must never be assumed to be present or absent. |

### Information Sources
- **👁️ First-Hand Observation:** Personally inspected on-site by a community volunteer or visitor with lived experience.
- **📞 Staff-Reported:** Reported by venue management or employees (subject to verification).
- **❓ Unverified:** Submitted via informal community notes or public drop-in feedback; prioritized for volunteer audit.

---

## 3. Technology Stack & Design Identity

- **Single Self-Contained Application:** Entire interface lives in [AccessLens/index.html](file:///c:/Users/bekam/Documents/NHProjects/AccessLens/index.html).
- **Core Technologies:** Semantic HTML5, Vanilla CSS with custom properties, and Vanilla JavaScript (ES6+).
- **Zero External Dependencies:** No frameworks (`React`, `Vue`), no build systems (`Vite`, `Webpack`), no package managers (`npm`), no remote CDNs, no external fonts, and no third-party images.
- **Persistence:** Local browser storage (`localStorage` key: `accesslens_places_v1`).
- **Visual Design Identity:**
  - Industrial minimalist inspection utility styling with Swiss technical layout principles.
  - Crisp high-contrast surfaces (`#ffffff`, `#f6f8fa`, crisp borders `#d0d7de`, dark mode `#0d1117` / `#161b22`).
  - High-density **3-column feature matrix bar** on place cards, placing Entrance, Toilet, and Seating side-by-side with concise visual badges.
  - Monospaced telemetry stat strip, clean presets, and zero verbose lecture paragraphs.
  - High-contrast visual badges for Present (`[✓ Present]`), Not Present (`[✕ Not Present]`), and Unknown (`[? Unknown]`).
  - Full keyboard accessibility with `:focus-visible` indicators and `Escape` key dialog closing.

---

## 4. Setup & Running Locally

### Direct File Execution
Double-click [AccessLens/index.html](file:///c:/Users/bekam/Documents/NHProjects/AccessLens/index.html) or open it directly in Chrome, Firefox, Edge, or Safari.

### Local HTTP Server (PowerShell)
```powershell
python -m http.server 8000
```
Then visit:
```
http://localhost:8000/AccessLens/index.html
```

---

## 5. Testing & Verification

### Automated Verification Suite
Run the test runner using Node.js:
```powershell
node AccessLens/test-runner.js
```
The test suite verifies:
- All 49 UI element IDs in `index.html`.
- Initial demo dataset with 4 illustrative places across distinct venue types.
- The core principle that **UNKNOWN** is strictly distinct from **NOT PRESENT**.
- Staleness calculation (records older than 180 days flagged as stale).
- Metrics calculation (Total places, Has Unknowns, Needs Fresh Check, First-hand verified).
- Search and filtering by place type, feature status, and quick survey shortcuts.
- Add/Edit place workflows, input validation, and persistence into `localStorage`.
- Recovery from corrupted or non-array data in `localStorage`.
- Reset demo dataset functionality.

### Manual Walkthrough Checklist
1. **Initial Load & Overview:**
   - Open `AccessLens/index.html`.
   - Confirm 4 initial demo records are displayed: Library, Cafe, Health Clinic, Cinema.
   - Verify top metrics: `Total Places: 4`, `Has Unknowns: 2`, `Needs Fresh Check: 1`, `First-Hand: 2`.
2. **Verify UNKNOWN vs NOT PRESENT:**
   - Note that *Demo Maple Cafe* has Entrance `Present`, Toilet `Not Present` (in basement), and Seating `Present`.
   - Note that *Demo Northside Health Clinic* has Toilet `Unknown` and Seating `Unknown`, clearly badged in amber text with a note that it requires a volunteer check.
   - Note that *Demo Historic Beacon Cinema* has Entrance `Not Present` (5 steps, no ramp) and Toilet `Unknown` (observer could not enter lobby).
3. **Search & Real-Time Filtering:**
   - Type `"basement"` in search &rarr; confirms only the Cafe appears.
   - Filter **Place Type: Health Clinic** &rarr; confirms only the clinic appears.
   - Filter **Accessible Toilet: Not Present** &rarr; confirms only the Cafe appears.
   - Click **Reset Filters** &rarr; restores all records.
4. **Quick Survey Shortcuts:**
   - Click `🔍 Needs Survey (Has Unknowns)` &rarr; confirms the Clinic and Cinema appear.
   - Click `⏳ Stale Check (>180 days)` &rarr; confirms only the Clinic appears (checked 210 days ago).
   - Click `👁️ First-Hand Verified Only` &rarr; confirms Library and Cinema appear.
5. **Record a New Place:**
   - Click `➕ Record a Place` in the top header.
   - Enter:
     - Name: `Demo Downtown Community Market`
     - Type: `Grocery & Market`
     - Address: `210 Market St`
     - Step-Free Entrance: `✓ Present` (Automatic sliding doors)
     - Accessible Toilet: `? Unknown`
     - Accessible Seating: `✕ Not Present` (No public seating area)
     - Source: `First-hand observation`
     - Last-Checked Date: Select Today's date.
   - Click `💾 Save Place Record`.
   - Confirm the new place card renders immediately at the top of the directory with no demo badge.
6. **Edit / Re-Check a Record:**
   - Click `✏️ Edit / Re-check` on *Demo Northside Health Clinic*.
   - Update Last-Checked Date using the `Today` button.
   - Change Accessible Toilet from `Unknown` to `Present` with note: *"Inspected newly installed accessible restroom in Suite 200 with grab bars"*.
   - Change Source to `First-hand observation`.
   - Save the record &rarr; confirm the stale warning disappears, the unknown count decrements, and the toilet badge changes to `✓ Present`.
7. **Persistence:**
   - Reload the page (`F5`) &rarr; confirm all updates remain intact in `localStorage`.
8. **Reset Demo Data:**
   - Click `💾 Data & Reset` &rarr; click `🔄 Reset to Standard Demo Dataset` and confirm &rarr; verify the directory resets cleanly to the 4 initial demo records.

---

## 6. Local Accessibility Case Study & Context

> *This section documents the actual neighborhood accessibility barrier that motivated the project design and how its facts were validated.*

### Background Motivation
In our local historic commercial corridor, several cafes and restaurants display generic wheelchair stickers on their entrance doors because they installed a street-level ramp. However, three of these venues have their only customer restrooms located either down basement stairwells or up half-flight landings in buildings dating back to the 1920s. 

Wheelchair users and individuals with mobility impairments who planned visits based on the generic "wheelchair accessible" stickers found themselves stranded without usable sanitary facilities.

### Methodology for Fact-Checking
1. **Never Assume from Entrance Alone:** A ramp at the front entrance only proves step-free entry; it tells nothing about internal doorway widths, thresholds to patios, or restroom access.
2. **Explicit Observation Checklist:** Every check must verify three separate components:
   - Door threshold height and width (minimum 32-inch clear opening).
   - Route to restroom and presence of grab bars/turning clearance.
   - Table clearances (knee space at tables vs. fixed booth barriers).
3. **The Importance of "Unknown":** If a venue is visited during peak hours and the restroom is occupied or locked, surveyors are trained to mark the toilet as **Unknown** rather than guessing.

---

## 7. Known Limitations & Roadmap

- **Browser Storage Scope:** Records are stored strictly in the user's local browser storage. They do not automatically sync across multiple physical devices without exporting and importing JSON.
- **Self-Reported Limitations:** In this standalone hackathon prototype, verification relies on user integrity. In a multi-tenant production system:
  - Role-based accounts would distinguish community contributors from certified accessibility auditors.
  - Photo attachments with alt-text could provide visual evidence of door thresholds and grab bar placements.
  - Geo-proximity filtering could display places near the user's current neighborhood.
