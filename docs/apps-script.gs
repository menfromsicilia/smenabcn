/**
 * Google Apps Script для приёма заявок Smena.
 *
 * 1. Создайте таблицу с листами «Leads» и «Candidates».
 * 2. Расширения → Apps Script → вставьте этот код.
 * 3. Project Settings → Script properties → WEBHOOK_SECRET = то же значение, что SHEETS_WEBHOOK_SECRET.
 * 4. Deploy → New deployment → Web app: Execute as «Me», Who has access «Anyone».
 * 5. URL деплоя положите в SHEETS_WEBHOOK_URL.
 */

const COLUMNS = {
  Leads: ['received_at', 'lang', 'name', 'business', 'role', 'whatsapp', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'referrer', 'page_url', 'timestamp'],
  Candidates: ['received_at', 'lang', 'name', 'profession', 'whatsapp', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'referrer', 'page_url', 'timestamp'],
};

function doPost(e) {
  const data = JSON.parse(e.postData.contents || '{}');
  const secret = PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET') || '';
  if (secret && data.secret !== secret) {
    return respond({ ok: false, error: 'forbidden' });
  }

  const sheetName = data.sheet === 'Candidates' ? 'Candidates' : 'Leads';
  const columns = COLUMNS[sheetName];
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(columns);
    sheet.setFrozenRows(1);
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    sheet.appendRow(columns.map((key) => sanitize(data[key])));
  } finally {
    lock.releaseLock();
  }

  return respond({ ok: true });
}

function sanitize(value) {
  const text = value == null ? '' : String(value);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function respond(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}
