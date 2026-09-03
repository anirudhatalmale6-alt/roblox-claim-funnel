/**
 * Roblox Claim Advocate — lead handler
 *
 * What it does, in order:
 *   1. Writes every submission to a "Leads" sheet   (always, first, no matter what)
 *   2. Emails you a readable copy                   (optional)
 *   3. Forwards it to the law firm's endpoint       (optional, once you have one)
 *
 * The order matters. The lead is banked in your sheet BEFORE anything is
 * attempted over the network, so a firm's API being down can never lose you a
 * lead — it just leaves the row marked NOT SENT, and you can push it later with
 * retryUnforwarded().
 *
 * ---------------------------------------------------------------------------
 * SETUP
 *   1. sheets.new  →  Extensions  →  Apps Script
 *   2. Paste this whole file in, replacing whatever is there.
 *   3. Fill in NOTIFY_EMAIL below.
 *   4. Deploy → New deployment → Web app
 *        Execute as:      Me
 *        Who has access:  Anyone
 *   5. Copy the /exec URL and paste it into  var ENDPOINT = ''  in index.html.
 *
 * Google will ask you to authorise Gmail and external requests. Without the
 * Gmail permission the sheet still fills but no email goes out.
 *
 * IMPORTANT: after ANY edit to this file you must Deploy → Manage deployments
 * → edit → Version: New version. Saving alone does not update the live URL.
 * ---------------------------------------------------------------------------
 */

/* ========================= 1. YOUR SETTINGS ========================= */

var NOTIFY_EMAIL = 'CHANGE_ME@example.com';   // where the alert email goes
var SHEET_NAME   = 'Leads';

/* ========================= 2. FIRM FORWARDING =========================
   Leave FIRM_ENDPOINT empty until the firm gives you a URL. Everything
   still works — leads just sit in your sheet marked NOT SENT.

   FIRM_FORMAT:
     'json' — sends a JSON body.            Most modern APIs want this.
     'form' — sends normal form fields.     Older intake systems want this.

   FIRM_HEADERS: whatever they tell you to send, e.g.
     { 'Authorization': 'Bearer abc123' }
     { 'x-api-key': 'abc123' }

   FIELD_MAP: only needed if the firm wants different field names to ours.
     { 'first_name': 'FirstName', 'phone': 'PrimaryPhone' }
   Anything not listed keeps our name. Map a field to '' to leave it out.
   ===================================================================== */

var FIRM_ENDPOINT = '';
var FIRM_FORMAT   = 'json';
var FIRM_HEADERS  = {};
var FIELD_MAP     = {};

/* Don't forward a lead the SOL calculator flagged. Off by default — you
   decide those by hand rather than having a script bin them. */
var SKIP_FORWARD_IF_SOL_BAD = false;

/* ========================= 3. THE FIELDS ========================= */

var FIELDS = [
  'first_name','last_name','phone','email','best_time',
  'relationship','state',
  'was_minor','met_on_roblox','what_happened','roblox_comms',
  'diagnosis','doctor_name',
  'account_owner','roblox_username','account_access',
  'evidence','has_attorney','is_living','passing_cause',
  'incident_year','birth_year','age_at_incident',
  'sol_status','sol_note','review_flags',
  'notes','consent_timestamp','consent_text','page_url',
  /* ad attribution — which ad, which campaign, which click */
  'utm_source','utm_medium','utm_campaign','utm_content','utm_term',
  'fbclid','gclid','ttclid','msclkid','referrer','landing_url'
];

/* Two bookkeeping columns after the answers. */
var COL_STATUS = FIELDS.length + 2;   // 'Sent to firm'
var COL_RESULT = FIELDS.length + 3;   // 'Firm response'

/* ========================= 4. RECEIVING ========================= */

function doPost(e) {
  var p = (e && e.parameter) ? e.parameter : {};
  var rowNum = null;

  // Bank it first. If this throws there is nothing sensible left to do.
  try {
    rowNum = storeLead_(p);
  } catch (err) {
    return json_({ok: false, stage: 'store', error: String(err)});
  }

  // Everything after this point is best-effort. A failure here must not
  // make the visitor think their submission failed — it is already saved.
  var emailed = tryQuietly_(function(){ notify_(p); });
  var fwd     = {attempted: false};
  if (FIRM_ENDPOINT) {
    fwd = forwardLead_(p, rowNum);
  } else {
    markRow_(rowNum, 'NOT SENT', 'No firm endpoint configured yet');
  }

  return json_({ok: true, row: rowNum, emailed: emailed, forwarded: fwd});
}

/* A GET is handy for checking the deployment is alive from a browser. */
function doGet() {
  var msg = 'Roblox Claim Advocate lead handler is running.\n' +
            'Firm forwarding: ' + (FIRM_ENDPOINT ? 'configured' : 'not configured yet');
  return ContentService.createTextOutput(msg).setMimeType(ContentService.MimeType.TEXT);
}

function storeLead_(p) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

  var head = ['Received'].concat(FIELDS).concat(['Sent to firm', 'Firm response']);

  if (sh.getLastRow() === 0) {
    sh.appendRow(head);
    sh.getRange(1, 1, 1, head.length).setFontWeight('bold');
    sh.setFrozenRows(1);
  } else {
    // A sheet built by an earlier version has fewer answer columns. Insert the
    // missing ones in front of the two bookkeeping columns so the rows already
    // in the sheet keep their meaning — never just relabel the header.
    var old = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    var missing = head.length - old.length;
    if (missing > 0 && old[old.length - 2] === 'Sent to firm') {
      sh.insertColumnsBefore(old.length - 1, missing);
      sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold');
    }
  }

  var row = [new Date()];
  for (var i = 0; i < FIELDS.length; i++) {
    row.push(p[FIELDS[i]] || '');
  }
  row.push('');   // Sent to firm
  row.push('');   // Firm response
  sh.appendRow(row);
  return sh.getLastRow();
}

function markRow_(rowNum, status, result) {
  if (!rowNum) return;
  try {
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    sh.getRange(rowNum, COL_STATUS).setValue(status);
    sh.getRange(rowNum, COL_RESULT).setValue(String(result).substring(0, 400));
  } catch (err) { /* bookkeeping must never break the main path */ }
}

/* ========================= 5. FORWARDING ========================= */

function forwardLead_(p, rowNum) {
  if (!FIRM_ENDPOINT) {
    markRow_(rowNum, 'NOT SENT', 'No firm endpoint configured yet');
    return {attempted: false, reason: 'no endpoint'};
  }
  if (SKIP_FORWARD_IF_SOL_BAD && p.sol_status && p.sol_status !== 'OK') {
    markRow_(rowNum, 'HELD', 'Held for review: SOL ' + p.sol_status);
    return {attempted: false, reason: 'sol ' + p.sol_status};
  }

  var payload = {};
  for (var i = 0; i < FIELDS.length; i++) {
    var ours = FIELDS[i];
    var theirs = FIELD_MAP.hasOwnProperty(ours) ? FIELD_MAP[ours] : ours;
    if (theirs === '') continue;              // explicitly dropped
    payload[theirs] = p[ours] || '';
  }

  var opts = {
    method: 'post',
    muteHttpExceptions: true,                 // read the error instead of throwing
    headers: FIRM_HEADERS
  };
  if (FIRM_FORMAT === 'json') {
    opts.contentType = 'application/json';
    opts.payload = JSON.stringify(payload);
  } else {
    opts.payload = payload;                   // classic form post
  }

  try {
    var res  = UrlFetchApp.fetch(FIRM_ENDPOINT, opts);
    var code = res.getResponseCode();
    var body = res.getContentText();
    var ok   = (code >= 200 && code < 300);
    markRow_(rowNum, ok ? 'SENT' : 'FAILED ' + code, body);
    return {attempted: true, ok: ok, code: code};
  } catch (err) {
    markRow_(rowNum, 'FAILED', String(err));
    return {attempted: true, ok: false, error: String(err)};
  }
}

/**
 * Push any lead that never made it to the firm.
 *
 * Run this by hand from the Apps Script editor (pick retryUnforwarded from the
 * function dropdown, press Run) after the firm's API has been down, or the
 * first time you fill in FIRM_ENDPOINT and want to send the backlog.
 * Rows already marked SENT are left alone.
 */
function retryUnforwarded() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sh || sh.getLastRow() < 2) { Logger.log('Nothing to do.'); return; }

  var lastCol = FIELDS.length + 3;
  var rows = sh.getRange(2, 1, sh.getLastRow() - 1, lastCol).getValues();
  var sent = 0, skipped = 0, failed = 0;

  for (var r = 0; r < rows.length; r++) {
    var status = String(rows[r][COL_STATUS - 1] || '');
    if (status.indexOf('SENT') === 0) { skipped++; continue; }

    var p = {};
    for (var i = 0; i < FIELDS.length; i++) {
      p[FIELDS[i]] = rows[r][i + 1];
    }
    var out = forwardLead_(p, r + 2);
    if (out.ok) { sent++; } else { failed++; }
    Utilities.sleep(300);                     // be polite to their API
  }
  Logger.log('Retry finished. Sent ' + sent + ', already sent ' + skipped + ', still failing ' + failed + '.');
}

/**
 * Send one fake lead to the firm's endpoint so you can prove the connection
 * works before real people start filling the form in. Nothing is written to
 * the sheet. Run it from the editor and read the log.
 */
function testFirmConnection() {
  if (!FIRM_ENDPOINT) { Logger.log('FIRM_ENDPOINT is empty — nothing to test.'); return; }
  var fake = {
    first_name: 'Test', last_name: 'Lead', phone: '5555550000',
    email: 'test@example.com', state: 'New Jersey',
    relationship: 'Parent or legal guardian', roblox_username: 'TEST_ONLY',
    sol_status: 'OK', notes: 'Connection test, please ignore.'
  };
  var out = forwardLead_(fake, null);
  Logger.log(JSON.stringify(out));
}

/* ========================= 6. EMAIL ========================= */

function notify_(p) {
  if (!NOTIFY_EMAIL || NOTIFY_EMAIL.indexOf('CHANGE_ME') === 0) return;

  var name = ((p.first_name || '') + ' ' + (p.last_name || '')).trim() || 'Unnamed';
  var flag = (p.sol_status && p.sol_status !== 'OK') ? ' [' + p.sol_status + ']' : '';
  var subj = 'New Roblox claim lead: ' + name + ' (' + (p.state || '?') + ')' + flag;

  var lines = [
    'A new case review request has come in.',
    '',
    'CONTACT',
    '  Name:          ' + name,
    '  Phone:         ' + (p.phone || ''),
    '  Email:         ' + (p.email || ''),
    '  Best time:     ' + (p.best_time || ''),
    '  Relationship:  ' + (p.relationship || ''),
    '  State:         ' + (p.state || ''),
    '',
    'THE CLAIM',
    '  Minor at time:   ' + (p.was_minor || ''),
    '  Met on Roblox:   ' + (p.met_on_roblox || ''),
    '  What happened:   ' + (p.what_happened || ''),
    '  Roblox contact:  ' + (p.roblox_comms || ''),
    '  Diagnosis:       ' + (p.diagnosis || '—'),
    '  Doctor:          ' + (p.doctor_name || '—'),
    '  Account owner:   ' + (p.account_owner || ''),
    '  Roblox username: ' + (p.roblox_username || ''),
    '  Account access:  ' + (p.account_access || ''),
    '  Evidence:        ' + (p.evidence || ''),
    '  Has attorney:    ' + (p.has_attorney || ''),
    '  Still living:    ' + (p.is_living || ''),
    '  If deceased:     ' + (p.passing_cause || '—'),
    '',
    'TIMING',
    '  Incident year:   ' + (p.incident_year || ''),
    '  Year of birth:   ' + (p.birth_year || ''),
    '  Age at incident: ' + (p.age_at_incident || ''),
    '  SOL status:      ' + (p.sol_status || ''),
    '  SOL note:        ' + (p.sol_note || ''),
    '',
    'NEEDS A HUMAN LOOK',
    '  ' + (p.review_flags || 'Nothing flagged'),
    '',
    'NOTES FROM THE CLAIMANT',
    '  ' + (p.notes || '—'),
    '',
    'CONSENT RECORD  (keep this — it is your proof if a call is ever disputed)',
    '  Timestamp: ' + (p.consent_timestamp || ''),
    '  Page:      ' + (p.page_url || ''),
    '  Wording:   ' + (p.consent_text || ''),
    '',
    'This message contains sensitive information about a minor. Handle it accordingly.'
  ];

  MailApp.sendEmail(NOTIFY_EMAIL, subj, lines.join('\n'));
}

/* ========================= 7. SMALL HELPERS ========================= */

function tryQuietly_(fn) {
  try { fn(); return true; } catch (err) { return false; }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
