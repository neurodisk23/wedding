/**
 * RSVP + wishes backend for the Harshal & Pooja wedding invite.
 *
 * Lives inside a Google Sheet (Extensions > Apps Script). Setup is in
 * README.md, step 3. In short:
 *   1. Paste this file, press Run on `setup` once, allow access.
 *   2. Deploy > New deployment > Web app,
 *      Execute as: Me, Who has access: Anyone.
 *   3. Copy the web app URL into config.js > rsvpEndpoint.
 *
 * After editing this file, publish the change with
 * Deploy > Manage deployments > (pencil) > Version: New version > Deploy.
 * The URL stays the same.
 */

// Must match the event `name`s in config.js exactly.
const EVENTS = ['Engagement', 'Haldi', 'Sangeet', 'Barat', 'Phere'];

// Optional: get an email for every RSVP. Leave '' to turn off.
const NOTIFY_EMAIL = '';

const SHEET = 'RSVPs';
const SUMMARY = 'Summary';
const HEADERS = ['Timestamp', 'Name', 'Phone', 'Attending', 'People', 'Functions', 'Side', 'Wish', 'Show on wall'];
const COL = { phone: 3, show: 9 };

/** Run once from the editor to create the sheets and headcount formulas. */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET) || ss.insertSheet(SHEET, 0);
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
  sh.setFrozenRows(1);
  sh.getRange('C2:C').setNumberFormat('@');
  // Tick or untick "Show on wall" to approve or hide a wish on the site.
  sh.getRange(2, COL.show, sh.getMaxRows() - 1, 1)
    .setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build());
  sh.setColumnWidth(8, 320);

  const sum = ss.getSheetByName(SUMMARY) || ss.insertSheet(SUMMARY);
  sum.clear();
  const R = SHEET + '!';
  const rows = [['Function', 'Families coming', 'People coming']];
  EVENTS.forEach(function (ev) {
    rows.push([
      ev,
      '=COUNTIFS(' + R + 'D:D,"Yes",' + R + 'F:F,"*' + ev + '*")',
      '=SUMIFS(' + R + 'E:E,' + R + 'D:D,"Yes",' + R + 'F:F,"*' + ev + '*")',
    ]);
  });
  rows.push(['', '', '']);
  rows.push(['Total responses', '=COUNTA(' + R + 'B2:B)', '']);
  rows.push(['Coming', '=COUNTIF(' + R + 'D2:D,"Yes")', '=SUMIF(' + R + 'D2:D,"Yes",' + R + 'E2:E)']);
  rows.push(['Not coming', '=COUNTIF(' + R + 'D2:D,"No")', '']);
  rows.push(["Groom's side", '=COUNTIF(' + R + 'G2:G,"Groom")', '']);
  rows.push(["Bride's side", '=COUNTIF(' + R + 'G2:G,"Bride")', '']);
  rows.push(['Both sides', '=COUNTIF(' + R + 'G2:G,"Both")', '']);
  sum.getRange(1, 1, rows.length, 3).setValues(rows);
  sum.getRange('A1:C1').setFontWeight('bold');
  sum.setColumnWidth(1, 160);
}

/** Receives an RSVP from the site. Same phone number = update that row. */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (d.company) return json_({ ok: true }); // spam trap filled in: drop silently

    const name = clean_(d.name, 80);
    const phone = String(d.phone || '').replace(/\D/g, '').slice(-10);
    if (!name || !/^[6-9]\d{9}$/.test(phone)) {
      return json_({ ok: false, error: 'Name and a 10-digit mobile number are required.' });
    }
    const attending = d.attending === 'Yes' ? 'Yes' : 'No';
    const people = attending === 'Yes' ? Math.min(Math.max(parseInt(d.guests, 10) || 1, 1), 15) : 0;
    const functions = attending === 'Yes' && Array.isArray(d.events)
      ? d.events.filter(function (ev) { return EVENTS.indexOf(ev) !== -1; }).join(', ')
      : '';
    const side = ['Groom', 'Bride', 'Both'].indexOf(d.side) !== -1 ? d.side : '';
    const wish = clean_(d.wish, 500);
    const row = [new Date(), name, phone, attending, people, functions, side, wish, !!(d.showWish && wish)];

    const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET);
    if (!sh) throw new Error('Run setup() first.');
    const last = lastRsvpRow_(sh);
    let target = 0;
    if (last > 1) {
      const phones = sh.getRange(2, COL.phone, last - 1, 1).getDisplayValues();
      for (let i = phones.length - 1; i >= 0; i--) {
        if (phones[i][0] === phone) { target = i + 2; break; }
      }
    }
    sh.getRange(target || last + 1, 1, 1, row.length).setValues([row]);
    CacheService.getScriptCache().remove('wishes');

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail(NOTIFY_EMAIL,
        (target ? 'RSVP updated: ' : 'New RSVP: ') + name + ' (' + attending + ')',
        [name, '+91 ' + phone, 'Attending: ' + attending, 'People: ' + people,
         'Functions: ' + (functions || '-'), 'Side: ' + side, 'Wish: ' + (wish || '-')].join('\n'));
    }
    return json_({ ok: true, updated: !!target });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'Could not save the RSVP.' });
  } finally {
    lock.releaseLock();
  }
}

/** ?action=wishes returns approved wishes (name + text only, never phone numbers). */
function doGet(e) {
  if (!e || !e.parameter || e.parameter.action !== 'wishes') {
    return json_({ ok: true, message: 'RSVP endpoint is running.' });
  }
  const cache = CacheService.getScriptCache();
  const hit = cache.get('wishes');
  if (hit) return ContentService.createTextOutput(hit).setMimeType(ContentService.MimeType.JSON);

  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET);
  const last = sh ? lastRsvpRow_(sh) : 0;
  let wishes = [];
  if (last > 1) {
    wishes = sh.getRange(2, 1, last - 1, HEADERS.length).getValues()
      .filter(function (r) { return r[COL.show - 1] === true && String(r[7]).trim(); })
      .map(function (r) { return { name: String(r[1]), wish: String(r[7]) }; })
      .reverse()
      .slice(0, 200);
  }
  const body = JSON.stringify({ ok: true, wishes: wishes });
  cache.put('wishes', body, 60); // refresh at most once a minute
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}

/**
 * The last row that holds an RSVP. Not sh.getLastRow(): the "Show on wall"
 * tick boxes fill the whole column, so getLastRow() would point at the very
 * bottom of the sheet and new RSVPs would be added below row 1000.
 */
function lastRsvpRow_(sh) {
  const max = sh.getLastRow();
  if (max < 2) return 1;
  const stamps = sh.getRange(1, 1, max, 1).getValues();
  for (let i = stamps.length - 1; i >= 1; i--) {
    if (stamps[i][0] !== '' && stamps[i][0] !== null) return i + 1;
  }
  return 1;
}

function clean_(v, max) {
  let s = String(v || '').replace(/\s+/g, ' ').trim().slice(0, max);
  // Stop Sheets treating text like "=SUM(...)" as a formula.
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
