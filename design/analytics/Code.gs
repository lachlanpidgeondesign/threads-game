/**
 * Threads — analytics receiver (Google Apps Script Web App)
 * ---------------------------------------------------------
 * Appends one row per event posted from threads.html's track() function to a
 * Google Sheet. Stable columns are given their own column; anything extra is
 * kept as JSON in `props` so you never lose data when new events are added.
 *
 * SETUP
 * 1. Create a Google Sheet. Extensions → Apps Script.
 * 2. Replace the default Code.gs with this file. Save.
 * 3. Run `setup` once (Run menu) and grant permissions — this writes the
 *    header row to the sheet.
 * 4. Deploy → New deployment → type "Web app".
 *       Execute as: Me
 *       Who has access: Anyone
 *    Deploy, then copy the Web App URL (ends in /exec).
 * 5. Paste that URL into TRACK_URL in threads.html.
 *
 * Notes
 * - The client sends via navigator.sendBeacon with a text/plain body, so there
 *   is no CORS preflight (Apps Script can't answer one). doPost reads the raw
 *   body from e.postData.contents.
 * - Re-deploy (Manage deployments → edit → new version) after editing this file.
 */

var SHEET_NAME = 'Threads Events';

// Columns promoted to their own cells; all other keys are folded into `props`.
var COLUMNS = [
  'ts', 'event', 'anonId', 'sessionId', 'build', 'level', 'levelLabel',
  'source', 'step', 'elapsedMs', 'durationSec', 'secondsIn',
  'hintsUsed', 'hintNumber', 'wrongGuesses', 'selectionLen', 'attempt',
  'wordOrder', 'themeWord', 'themePos', 'foundSoFar', 'returning',
  'seenTutorial', 'reason', 'fromLevel', 'toLevel', 'won',
  'scheme', 'dark', 'reducedMotion', 'ua', 'vw', 'vh', 'receivedTs', 'props'
];

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(COLUMNS);
    sh.setFrozenRows(1);
  }
  return sh;
}

// Run this once from the editor to create the sheet + header row.
function setup() {
  sheet_();
}

function doPost(e) {
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }
    var sh = sheet_();

    var known = {};
    var row = COLUMNS.map(function (col) {
      if (col === 'receivedTs') { return new Date().toISOString(); }
      if (col === 'props') { return ''; } // filled below
      known[col] = true;
      var v = data[col];
      if (v === undefined || v === null) { return ''; }
      if (Array.isArray(v) || typeof v === 'object') { return JSON.stringify(v); }
      return v;
    });

    // anything not promoted to a column → props JSON
    var extra = {};
    Object.keys(data).forEach(function (k) {
      if (!known[k]) { extra[k] = data[k]; }
    });
    row[COLUMNS.indexOf('props')] = Object.keys(extra).length ? JSON.stringify(extra) : '';

    sh.appendRow(row);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

// Simple health check in the browser.
function doGet() {
  return json_({ ok: true, service: 'threads-analytics' });
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
