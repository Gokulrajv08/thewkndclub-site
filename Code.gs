/**
 * The Wknd Club — form automation
 * ================================
 * Lives inside the Google Sheet that collects your form responses.
 * (In the Sheet: Extensions → Apps Script → paste this file → save.)
 *
 * What it does:
 *  1. onFormSubmitHandler  — instantly emails "we got your application" to every applicant.
 *  2. onEditHandler        — when you set the Status column to "Approved" (or "Rejected"),
 *                            it emails the applicant automatically.
 *
 * ⚠️ SETUP CHECKLIST (details in README.md):
 *  - In the Google Form: Settings → Responses → turn ON "Collect email addresses"
 *    (choose "Responder input" or "Verified"). This creates the "Email address" column.
 *  - In the response Sheet: add a column named exactly  Status  (see CONFIG below),
 *    ideally with a dropdown: Pending / Approved / Rejected
 *    (select the column → Insert → Dropdown).
 *  - Add the two installable triggers (see README step 5). The functions below will
 *    NOT run by themselves without triggers.
 */

/* ============================== CONFIG ============================== */

const CONFIG = {
  // Must match your sheet's tab name (bottom tab, usually "Form Responses 1")
  SHEET_NAME: 'Form Responses 1',

  // Must match the header text of these columns EXACTLY (row 1)
  EMAIL_COLUMN_HEADER: 'Email address', // created automatically by "Collect email addresses"
  NAME_COLUMN_HEADER: 'Name',           // change to your form's name question, e.g. "Your full name"
  STATUS_COLUMN_HEADER: 'Status',       // the column YOU add for the approval flow

  // Status values that fire emails
  APPROVED_VALUE: 'Approved',
  REJECTED_VALUE: 'Rejected',

  // Your community links — sent in the approval email
  WHATSAPP_LINK: 'https://chat.whatsapp.com/YOUR_INVITE_CODE',
  INSTAGRAM_LINK: 'https://www.instagram.com/thewkndclub_/',

  CLUB_NAME: 'The Wknd Club',
  REPLY_TO: '', // optional, e.g. 'hello@thewkndclub.in' — leave '' to skip
};

/* ========================= 1. AUTO-REPLY ============================ */
/** Trigger: From spreadsheet → On form submit (installable). */
function onFormSubmitHandler(e) {
  const row = e.range.getRow();
  const sheet = e.range.getSheet();
  const data = getRowData_(sheet, row);

  const email = data[CONFIG.EMAIL_COLUMN_HEADER];
  if (!email) {
    console.warn('No email found on row ' + row + '. Is "Collect email addresses" on?');
    return;
  }
  const name = firstName_(data[CONFIG.NAME_COLUMN_HEADER]);

  sendEmail_(
    email,
    `We got your application — ${CONFIG.CLUB_NAME}`,
    `Hey ${name}!\n\n` +
    `Thanks for applying to join ${CONFIG.CLUB_NAME}. A real human reads every ` +
    `application, so give us a few days.\n\n` +
    `Once you're approved, you'll get another email with the community link and ` +
    `details for the next event.\n\n` +
    `Meanwhile, we're on Instagram: ${CONFIG.INSTAGRAM_LINK}\n\n` +
    `— ${CONFIG.CLUB_NAME}`
  );

  // Pre-fill the Status column with "Pending" so nothing slips through
  const statusCol = getColumnByHeader_(sheet, CONFIG.STATUS_COLUMN_HEADER);
  if (statusCol && !sheet.getRange(row, statusCol).getValue()) {
    sheet.getRange(row, statusCol).setValue('Pending');
  }
}

/* ==================== 2. APPROVAL / REJECTION ======================= */
/** Trigger: From spreadsheet → On edit (installable). */
function onEditHandler(e) {
  const sheet = e.range.getSheet();
  if (sheet.getName() !== CONFIG.SHEET_NAME) return;
  if (e.range.getNumRows() > 1 || e.range.getNumColumns() > 1) return; // single-cell edits only

  const statusCol = getColumnByHeader_(sheet, CONFIG.STATUS_COLUMN_HEADER);
  if (!statusCol || e.range.getColumn() !== statusCol) return;

  const row = e.range.getRow();
  if (row === 1) return; // header row

  const newValue = String(e.value || '').trim();
  const data = getRowData_(sheet, row);
  const email = data[CONFIG.EMAIL_COLUMN_HEADER];
  if (!email) return;
  const name = firstName_(data[CONFIG.NAME_COLUMN_HEADER]);

  if (newValue === CONFIG.APPROVED_VALUE) {
    sendEmail_(
      email,
      `You're in! Welcome to ${CONFIG.CLUB_NAME} 🎉`,
      `Hey ${name}!\n\n` +
      `Good news — you're officially part of ${CONFIG.CLUB_NAME}.\n\n` +
      `Join the community group here (don't share this link around):\n` +
      `${CONFIG.WHATSAPP_LINK}\n\n` +
      `Event details always land in the group first. See you at the next one!\n\n` +
      `— ${CONFIG.CLUB_NAME}`
    );
  } else if (newValue === CONFIG.REJECTED_VALUE) {
    sendEmail_(
      email,
      `About your ${CONFIG.CLUB_NAME} application`,
      `Hey ${name},\n\n` +
      `Thanks so much for applying to ${CONFIG.CLUB_NAME}. We're keeping the group ` +
      `very small right now, so we can't bring everyone in just yet — but we'd love ` +
      `to have you apply again as we grow.\n\n` +
      `Follow along on Instagram so you don't miss the next open round:\n` +
      `${CONFIG.INSTAGRAM_LINK}\n\n` +
      `— ${CONFIG.CLUB_NAME}`
    );
  }
}

/* ============================ HELPERS =============================== */

function getRowData_(sheet, row) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const values = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
  const data = {};
  headers.forEach((h, i) => (data[String(h).trim()] = values[i]));
  return data;
}

function getColumnByHeader_(sheet, header) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const idx = headers.findIndex((h) => String(h).trim() === header);
  return idx === -1 ? null : idx + 1;
}

function firstName_(fullName) {
  return String(fullName || 'there').trim().split(/\s+/)[0];
}

function sendEmail_(to, subject, body) {
  const options = { name: CONFIG.CLUB_NAME };
  if (CONFIG.REPLY_TO) options.replyTo = CONFIG.REPLY_TO;
  MailApp.sendEmail(to, subject, body, options);
}

/** Run this once manually (Run ▶) to trigger the authorization popup safely. */
function authorizeOnce() {
  console.log('Remaining daily email quota: ' + MailApp.getRemainingDailyQuota());
}
