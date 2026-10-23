const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('AccessLens/index.html', 'utf8');

console.log('--- RUNNING ACCESSLENS TEST SUITE ---');

// 1. Verify required DOM elements
const requiredIds = [
  'mainContent',
  // Header
  'btnOpenAddPlace', 'btnOpenDataModal', 'btnThemeToggle',
  // Metrics
  'metricTotalPlaces', 'metricUnknownCount', 'metricStaleCount', 'metricFirstHandCount',
  // Filters & Search
  'filterSearch', 'filterType', 'filterStepFree', 'filterToilet', 'filterSeating', 'btnResetFilters',
  'shortcutNeedsSurvey', 'shortcutStale', 'shortcutFirstHand', 'shortcutAllPresent',
  // Directory & Cards
  'directoryHeading', 'directoryResultsCount', 'placesGrid', 'emptyStateBox', 'btnEmptyAdd',
  // Modal 1: Place Form
  'modalPlaceForm', 'modalPlaceTitle', 'btnClosePlaceModal', 'btnCancelPlaceForm', 'formPlace',
  'placeEditId', 'placeFormErrors', 'placeName', 'placeType', 'placeAddress',
  'stepFreeDetails', 'toiletDetails', 'seatingDetails', 'placeNotes',
  'placeSource', 'placeLastChecked', 'btnSetDateToday', 'placeSourceDetail',
  // Modal 2: Data Storage
  'modalDataStorage', 'modalDataTitle', 'btnCloseDataModal', 'btnCloseDataFooter',
  'btnResetDemoData', 'btnExportJson', 'inputImportJson', 'btnClearAllRecords'
];

let missing = [];
requiredIds.forEach(id => {
  if (!html.includes('id="' + id + '"')) {
    missing.push(id);
  }
});

if (missing.length > 0) {
  console.error('FAIL: Missing HTML elements:', missing);
  process.exit(1);
} else {
  console.log(`PASS: All ${requiredIds.length} required UI element IDs verified in index.html.`);
}

// 2. Extract script and evaluate logic in sandbox
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error('FAIL: No script block found in index.html');
  process.exit(1);
}

const mockStorage = {};
const mockElements = {};

function createMockElement(id) {
  return {
    id,
    classList: {
      _classes: new Set(),
      add: function(c) { this._classes.add(c); },
      remove: function(c) { this._classes.delete(c); },
      toggle: function(c, force) {
        if (force === undefined) {
          if (this._classes.has(c)) this._classes.delete(c); else this._classes.add(c);
        } else if (force) {
          this._classes.add(c);
        } else {
          this._classes.delete(c);
        }
      },
      contains: function(c) { return this._classes.has(c); }
    },
    setAttribute: function(k, v) { this[k] = v; },
    getAttribute: function(k) { return this[k]; },
    addEventListener: function() {},
    querySelectorAll: function() { return []; },
    querySelector: function() { return null; },
    style: {},
    innerHTML: '',
    textContent: '',
    value: '',
    reset: function() { this.value = ''; }
  };
}

requiredIds.forEach(id => {
  mockElements[id] = createMockElement(id);
});

const sandbox = {
  window: {},
  document: {
    readyState: 'complete',
    documentElement: {
      setAttribute: () => {},
      getAttribute: () => 'light'
    },
    body: { style: {} },
    getElementById: (id) => mockElements[id] || createMockElement(id),
    getElementsByName: () => [],
    querySelectorAll: () => [],
    addEventListener: () => {}
  },
  localStorage: {
    getItem: k => mockStorage[k] || null,
    setItem: (k, v) => { mockStorage[k] = String(v); },
    removeItem: k => { delete mockStorage[k]; }
  },
  console,
  Date,
  Math,
  Set,
  Array,
  Object,
  JSON,
  Number,
  String,
  Infinity,
  Boolean,
  confirm: () => true,
  alert: console.log
};

vm.createContext(sandbox);
vm.runInContext(scriptMatch[1], sandbox);

const testApi = sandbox.window.__ACCESSLENS_TEST_API__;
if (!testApi) {
  console.error('FAIL: __ACCESSLENS_TEST_API__ not attached to window');
  process.exit(1);
}

console.log('PASS: AccessLens script loaded and initialized test API.');

// 3. Test Initial Seed Demo Data
const places = testApi.getState().places;
console.log(`Checking initial places: count = ${places.length}`);
if (places.length !== 4) {
  console.error(`FAIL: Expected 4 initial demo records, got ${places.length}`);
  process.exit(1);
}

const library = places.find(p => p.id === 'AL-101');
if (!library || library.type !== 'Library' || library.features.stepFreeEntrance.status !== 'present') {
  console.error('FAIL: AL-101 Library record mismatch:', library);
  process.exit(1);
}
console.log('PASS: Initial 4 demo places loaded with distinct types (Library, Cafe, Clinic, Cinema).');

// 4. Test Core Principle: UNKNOWN is strictly different from NOT PRESENT
const clinic = places.find(p => p.id === 'AL-103');
const cinema = places.find(p => p.id === 'AL-104');
const cafe = places.find(p => p.id === 'AL-102');

// In Clinic, toilet and seating are unknown
if (clinic.features.accessibleToilet.status !== 'unknown' || clinic.features.accessibleSeating.status !== 'unknown') {
  console.error('FAIL: Clinic toilet and seating must be "unknown", got:', clinic.features);
  process.exit(1);
}

// In Cinema, entrance is not_present, toilet is unknown, seating is not_present
if (cinema.features.stepFreeEntrance.status !== 'not_present') {
  console.error('FAIL: Cinema entrance must be "not_present"');
  process.exit(1);
}
if (cinema.features.accessibleToilet.status !== 'unknown') {
  console.error('FAIL: Cinema toilet must be "unknown" (cannot enter to check)');
  process.exit(1);
}

// In Cafe, toilet is not_present (in basement)
if (cafe.features.accessibleToilet.status !== 'not_present') {
  console.error('FAIL: Cafe toilet must be "not_present"');
  process.exit(1);
}

console.log('PASS: Verified core principle: UNKNOWN is strictly distinct from NOT PRESENT across demo records.');

// 5. Test Staleness Calculation
// Stale threshold is 180 days
const isClinicStale = testApi.isRecordStale(clinic); // 210 days ago
const isLibraryStale = testApi.isRecordStale(library); // 25 days ago

if (!isClinicStale) {
  console.error('FAIL: Clinic checked 210 days ago must be marked stale (>180 days)');
  process.exit(1);
}
if (isLibraryStale) {
  console.error('FAIL: Library checked 25 days ago must NOT be marked stale');
  process.exit(1);
}
console.log('PASS: Staleness calculation correctly flags checks older than 180 days as stale.');

// 6. Test Overview Metrics
testApi.updateMetrics();
const totalPlaces = mockElements.metricTotalPlaces.textContent;
const unknownCount = mockElements.metricUnknownCount.textContent;
const staleCount = mockElements.metricStaleCount.textContent;
const firstHandCount = mockElements.metricFirstHandCount.textContent;

console.log(`PASS: Metrics computed -> Total: ${totalPlaces}, Has Unknowns: ${unknownCount}, Stale: ${staleCount}, FirstHand: ${firstHandCount}`);

// AL-103 (clinic) and AL-104 (cinema) have unknowns -> 2
// AL-103 is stale (>180d) -> 1
// AL-101 and AL-104 are First-hand -> 2
if (totalPlaces !== 4 || unknownCount !== 2 || staleCount !== 1 || firstHandCount !== 2) {
  console.error('FAIL: Metrics mismatch. Expected Total=4, Unknown=2, Stale=1, FirstHand=2. Got:', { totalPlaces, unknownCount, staleCount, firstHandCount });
  process.exit(1);
}

// 7. Test Search and Filtering Logic
// Search by keyword "basement" (found in Cafe toilet details)
testApi.setState({
  filters: { search: 'basement', type: 'all', stepFree: 'all', toilet: 'all', seating: 'all', shortcut: null }
});
let filtered = testApi.getFilteredPlaces();
if (filtered.length !== 1 || filtered[0].id !== 'AL-102') {
  console.error('FAIL: Search for "basement" expected AL-102 (Cafe), got:', filtered);
  process.exit(1);
}
console.log('PASS: Search by feature detail ("basement") matched accurately.');

// Filter by Type: "Health Clinic"
testApi.setState({
  filters: { search: '', type: 'Health Clinic', stepFree: 'all', toilet: 'all', seating: 'all', shortcut: null }
});
filtered = testApi.getFilteredPlaces();
if (filtered.length !== 1 || filtered[0].id !== 'AL-103') {
  console.error('FAIL: Filter by type Health Clinic failed:', filtered);
  process.exit(1);
}
console.log('PASS: Filter by type returned expected place.');

// Filter by Feature State: Accessible Toilet = "not_present"
testApi.setState({
  filters: { search: '', type: 'all', stepFree: 'all', toilet: 'not_present', seating: 'all', shortcut: null }
});
filtered = testApi.getFilteredPlaces();
if (filtered.length !== 1 || filtered[0].id !== 'AL-102') {
  console.error('FAIL: Filter for toilet: not_present failed:', filtered);
  process.exit(1);
}
console.log('PASS: Filter for feature marked "not_present" returned Cafe.');

// Filter by Feature State: Accessible Toilet = "unknown"
testApi.setState({
  filters: { search: '', type: 'all', stepFree: 'all', toilet: 'unknown', seating: 'all', shortcut: null }
});
filtered = testApi.getFilteredPlaces();
if (filtered.length !== 2) { // Clinic and Cinema
  console.error('FAIL: Filter for toilet: unknown expected 2 places, got:', filtered.length);
  process.exit(1);
}
console.log('PASS: Filter for feature marked "unknown" returned places where information is missing.');

// Filter by Quick Shortcut: "needsSurvey" (has unknown features)
testApi.setState({
  filters: { search: '', type: 'all', stepFree: 'all', toilet: 'all', seating: 'all', shortcut: 'needsSurvey' }
});
filtered = testApi.getFilteredPlaces();
if (filtered.length !== 2) {
  console.error('FAIL: Shortcut needsSurvey expected 2 places, got:', filtered.length);
  process.exit(1);
}
console.log('PASS: Shortcut "needsSurvey" accurately isolated places with unknown features.');

// Filter by Quick Shortcut: "stale"
testApi.setState({
  filters: { search: '', type: 'all', stepFree: 'all', toilet: 'all', seating: 'all', shortcut: 'stale' }
});
filtered = testApi.getFilteredPlaces();
if (filtered.length !== 1 || filtered[0].id !== 'AL-103') {
  console.error('FAIL: Shortcut stale expected AL-103, got:', filtered);
  process.exit(1);
}
console.log('PASS: Shortcut "stale" identified records needing a fresh re-check.');

// Reset filters
testApi.setState({
  filters: { search: '', type: 'all', stepFree: 'all', toilet: 'all', seating: 'all', shortcut: null }
});

// 8. Test Add / Edit Places & LocalStorage Persistence
const newPlace = {
  id: 'AL-999',
  isDemo: false,
  name: 'Demo Community Pharmacy',
  type: 'Health Clinic',
  address: '500 Main St',
  features: {
    stepFreeEntrance: { status: 'present', details: 'Automatic sliding entrance, zero threshold' },
    accessibleToilet: { status: 'unknown', details: 'Staff only, public access unknown' },
    accessibleSeating: { status: 'not_present', details: 'Counter service only with standing queue' }
  },
  notes: 'Prescription pickup counter has lowered section for wheelchair users.',
  lastCheckedDate: '2026-10-22',
  source: 'First-hand observation',
  sourceDetail: 'Checked by volunteer Alex',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

places.unshift(newPlace);
testApi.savePlaces(places);

const savedRaw = mockStorage[testApi.CONFIG.storageKey];
if (!savedRaw) {
  console.error('FAIL: Data not written to localStorage key:', testApi.CONFIG.storageKey);
  process.exit(1);
}
const parsedSaved = JSON.parse(savedRaw);
const savedPharmacy = parsedSaved.find(p => p.id === 'AL-999');
if (!savedPharmacy || savedPharmacy.name !== 'Demo Community Pharmacy') {
  console.error('FAIL: Saved pharmacy mismatch in localStorage:', savedPharmacy);
  process.exit(1);
}
console.log('PASS: Newly added place persisted cleanly into localStorage.');

// 9. Test Corrupted / Malformed Storage Recovery
mockStorage[testApi.CONFIG.storageKey] = 'corrupted JSON string !!';
const recoveredFromCorrupted = testApi.loadPlaces();
if (!Array.isArray(recoveredFromCorrupted) || recoveredFromCorrupted.length !== 4) {
  console.error('FAIL: Failed to recover from corrupted JSON string in localStorage');
  process.exit(1);
}
console.log('PASS: Gracefully recovered from corrupted localStorage string and restored demo dataset.');

mockStorage[testApi.CONFIG.storageKey] = '{"notAnArray": true}';
const recoveredFromNonArray = testApi.loadPlaces();
if (!Array.isArray(recoveredFromNonArray) || recoveredFromNonArray.length !== 4) {
  console.error('FAIL: Failed to recover from non-array localStorage data');
  process.exit(1);
}
console.log('PASS: Gracefully recovered from non-array object in localStorage.');

// 10. Test Reset Demo Data
testApi.resetDemoData();
const resetPlaces = testApi.getState().places;
if (resetPlaces.length !== 4 || resetPlaces.some(p => p.id === 'AL-999')) {
  console.error('FAIL: Reset demo data did not restore clean initial dataset');
  process.exit(1);
}
console.log('PASS: Reset Demo Data restored clean initial demo dataset.');

console.log('--- ALL ACCESSLENS TESTS PASSED CLEANLY ---');
