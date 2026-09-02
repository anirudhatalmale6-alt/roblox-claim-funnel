/**
 * Roblox Claim Advocate — lead handler
 *
 * Receives a submission from the funnel, appends it to a "Leads" sheet,
 * and emails a notification.
 *
 * SETUP
 *  1. sheets.new  →  Extensions  →  Apps Script
 *  2. Paste this whole file in, replacing whatever is there.
 *  3. Set NOTIFY_EMAIL below to where the alerts should go.
 *  4. Deploy → New deployment → Web app
 *       Execute as:      Me
 *       Who has access:  Anyone
 *  5. Copy the /exec URL and paste it into  var ENDPOINT = ''  in index.html.
 *
 * Authorise the Gmail permission when Google prompts — without it the sheet
 * still fills but no email goes out.
 */

var NOTIFY_EMAIL = 'CHANGE_ME@example.com';
var SHEET_NAME   = 'Leads';

/* Column order in the sheet. Adding a field here is all it takes. */
var FIELDS = [
  'first_name','last_name','phone','email','best_time',
  'relationship','state',
  'was_minor','met_on_roblox','what_happened','roblox_comms',
  'diagnosis','doctor_name',
  'account_owner','roblox_username','account_access',
  'evidence','has_attorney','is_living','passing_cause',
  'incident_year','birth_year','age_at_incident',
  'sol_status','sol_note','review_flags',
  'notes','consent_timestamp','consent_text','page_url'
];

function doPost(e) {
  try {
    var p = (e && e.parameter) ? e.parameter : {};
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(SHEET_NAME);

    if (!sh) {
      sh = ss.insertSheet(SHEET_NAME);
    }
    if (sh.getLastRow() === 0) {
      var head = ['Received'].concat(FIELDS);
      sh.appendRow(head);
      sh.getRange(1, 1, 1, head.length).setFontWeight('bold');
      sh.setFrozenRows(1);
    }

    var row = [new Date()];
    for (var i = 0; i < FIELDS.length; i++) {
      row.push(p[FIELDS[i]] || '');
    }
    sh.appendRow(row);

    notify_(p);

    return ContentService
      .createTextOutput(JSON.stringify({ok: true}))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ok: false, error: String(err)}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/* A GET is handy for checking the deployment is alive in a browser. */
function doGet() {
  return ContentService
    .createTextOutput('Roblox Claim Advocate lead handler is running.')
    .setMimeType(ContentService.MimeType.TEXT);
}

function notify_(p) {
  if (!NOTIFY_EMAIL || NOTIFY_EMAIL.indexOf('CHANGE_ME') === 0) return;

  var name  = ((p.first_name || '') + ' ' + (p.last_name || '')).trim() || 'Unnamed';
  var flag  = (p.sol_status && p.sol_status !== 'OK') ? ' [' + p.sol_status + ']' : '';
  var subj  = 'New Roblox claim lead: ' + name + ' (' + (p.state || '?') + ')' + flag;

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
    'CONSENT RECORD',
    '  Timestamp: ' + (p.consent_timestamp || ''),
    '  Page:      ' + (p.page_url || ''),
    '  Wording:   ' + (p.consent_text || ''),
    '',
    'This message contains sensitive information about a minor. Handle it accordingly.'
  ];

  MailApp.sendEmail(NOTIFY_EMAIL, subj, lines.join('\n'));
}
