const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';
const PREVIEW_ROW_CAP = 20;
export const SHEETS_IMPORT_ROW_CAP = 500;
export const SHEETS_IMPORT_ROW_HARD_CAP = 1000;

/** Accepts a full Sheets URL or a bare spreadsheet id. */
export function parseSpreadsheetId(urlOrId: string): string | null {
  const raw = urlOrId.trim();
  if (!raw) return null;

  const fromPath = raw.match(
    /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
  );
  if (fromPath?.[1]) return fromPath[1];

  // Bare id (Google sheet ids are typically 40+ chars of base64url-ish)
  if (/^[a-zA-Z0-9-_]{20,}$/.test(raw)) return raw;

  return null;
}

export interface SpreadsheetSummary {
  spreadsheetId: string;
  title: string;
  sheets: Array<{ title: string; sheetId: number }>;
}

export async function getSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
): Promise<SpreadsheetSummary> {
  const url = new URL(`${SHEETS_API}/${encodeURIComponent(spreadsheetId)}`);
  url.searchParams.set('fields', 'spreadsheetId,properties.title,sheets.properties');

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw googleSheetsError(res.status, await res.text());
  }

  const json = (await res.json()) as {
    spreadsheetId?: string;
    properties?: { title?: string };
    sheets?: Array<{ properties?: { title?: string; sheetId?: number } }>;
  };

  return {
    spreadsheetId: json.spreadsheetId ?? spreadsheetId,
    title: json.properties?.title ?? spreadsheetId,
    sheets: (json.sheets ?? [])
      .map((s) => ({
        title: s.properties?.title ?? '',
        sheetId: s.properties?.sheetId ?? 0,
      }))
      .filter((s) => s.title.length > 0),
  };
}

export async function getValues(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  opts?: { maxRows?: number },
): Promise<{ range: string; values: string[][] }> {
  const maxRows = Math.min(
    Math.max(opts?.maxRows ?? PREVIEW_ROW_CAP, 1),
    SHEETS_IMPORT_ROW_HARD_CAP,
  );
  const encodedRange = encodeURIComponent(range);
  const url = `${SHEETS_API}/${encodeURIComponent(spreadsheetId)}/values/${encodedRange}?majorDimension=ROWS`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw googleSheetsError(res.status, await res.text());
  }

  const json = (await res.json()) as {
    range?: string;
    values?: string[][];
  };
  const values = (json.values ?? []).slice(0, maxRows).map((row) =>
    row.map((cell) => String(cell ?? '')),
  );

  return {
    range: json.range ?? range,
    values,
  };
}

function quoteSheetTitle(sheetTitle: string): string {
  return sheetTitle.includes("'") || /[\s!]/.test(sheetTitle)
    ? `'${sheetTitle.replace(/'/g, "''")}'`
    : sheetTitle;
}

export function defaultSheetRange(sheetTitle: string, endRow: number): string {
  return `${quoteSheetTitle(sheetTitle)}!A1:Z${endRow}`;
}

export function defaultPreviewRange(sheetTitle: string): string {
  return defaultSheetRange(sheetTitle, PREVIEW_ROW_CAP);
}

export function defaultImportRange(
  sheetTitle: string,
  maxRows = SHEETS_IMPORT_ROW_CAP,
): string {
  const capped = Math.min(
    Math.max(maxRows, 1),
    SHEETS_IMPORT_ROW_HARD_CAP,
  );
  // +1 so header row is included in the fetch window
  return defaultSheetRange(sheetTitle, capped + 1);
}

function googleSheetsError(status: number, body: string): Error {
  if (status === 403 || status === 401) {
    return new Error(
      'אין גישה לגיליון זה עם חשבון Google המחובר. ודאו שהקובץ משותף עם החשבון.',
    );
  }
  if (status === 404) {
    return new Error('הגיליון לא נמצא. בדקו את הקישור או מזהה הקובץ.');
  }
  return new Error(`Google Sheets API error (${status}): ${body.slice(0, 200)}`);
}
