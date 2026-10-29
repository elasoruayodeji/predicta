// ============================================================
// CSV Parser Utility
// ============================================================
import { PriceRecord } from '../types';

interface ParsedCSV {
  records: PriceRecord[];
  headers: string[];
  errors: string[];
}

/**
 * Parse a CSV file containing stock price data.
 * Supports common formats: Date, Open, High, Low, Close, Volume, Adj Close
 */
export function parseCSV(content: string): ParsedCSV {
  const errors: string[] = [];
  const lines = content.trim().split(/\r?\n/);
  
  if (lines.length < 2) {
    return { records: [], headers: [], errors: ['CSV file must have a header row and at least one data row'] };
  }

  // Parse headers
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
  
  // Map column indices
  const dateIdx = findColumn(headers, ['date', 'datetime', 'timestamp', 'time', 'day']);
  const openIdx = findColumn(headers, ['open', 'open_price', 'open price']);
  const highIdx = findColumn(headers, ['high', 'high_price', 'high price']);
  const lowIdx = findColumn(headers, ['low', 'low_price', 'low price']);
  const closeIdx = findColumn(headers, ['close', 'close_price', 'close price', 'last', 'last_price']);
  const volumeIdx = findColumn(headers, ['volume', 'vol', 'shares']);
  const adjCloseIdx = findColumn(headers, ['adj close', 'adj_close', 'adjusted_close', 'adjusted close', 'adjclose']);

  if (dateIdx === -1) errors.push('Could not find date column. Expected: Date, DateTime, or Timestamp');
  if (closeIdx === -1) errors.push('Could not find close price column. Expected: Close or Last');
  if (openIdx === -1) errors.push('Could not find open price column');
  if (highIdx === -1) errors.push('Could not find high price column');
  if (lowIdx === -1) errors.push('Could not find low price column');

  if (errors.length > 0) {
    return { records: [], headers, errors };
  }

  const records: PriceRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = parseCSVLine(line);
    
    try {
      const dateStr = cols[dateIdx]?.trim();
      if (!dateStr) continue;

      // Parse date
      const date = normalizeDate(dateStr);
      if (!date) {
        errors.push(`Row ${i + 1}: Invalid date "${dateStr}"`);
        continue;
      }

      const open = parseFloat(cols[openIdx]?.replace(/,/g, '') || '0');
      const high = parseFloat(cols[highIdx]?.replace(/,/g, '') || '0');
      const low = parseFloat(cols[lowIdx]?.replace(/,/g, '') || '0');
      const close = parseFloat(cols[closeIdx]?.replace(/,/g, '') || '0');
      const volume = volumeIdx >= 0 ? parseInt(cols[volumeIdx]?.replace(/,/g, '') || '0', 10) : 0;
      const adjClose = adjCloseIdx >= 0 ? parseFloat(cols[adjCloseIdx]?.replace(/,/g, '') || '0') : undefined;

      if (isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) {
        errors.push(`Row ${i + 1}: Non-numeric price values`);
        continue;
      }

      records.push({
        date,
        open,
        high,
        low,
        close,
        volume: isNaN(volume) ? 0 : Math.max(0, volume),
        adjustedClose: adjClose && !isNaN(adjClose) ? adjClose : undefined,
      });
    } catch (e) {
      errors.push(`Row ${i + 1}: Parse error`);
    }
  }

  return { records, headers, errors };
}

function findColumn(headers: string[], candidates: string[]): number {
  for (const candidate of candidates) {
    const idx = headers.indexOf(candidate);
    if (idx >= 0) return idx;
  }
  // Try partial match
  for (const candidate of candidates) {
    const idx = headers.findIndex(h => h.includes(candidate));
    if (idx >= 0) return idx;
  }
  return -1;
}

function normalizeDate(dateStr: string): string | null {
  // Try various date formats
  const formats = [
    // YYYY-MM-DD
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    // DD/MM/YYYY or MM/DD/YYYY (we'll try to detect)
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/,
    // YYYY/MM/DD
    /^(\d{4})[\/](\d{1,2})[\/](\d{1,2})$/,
  ];

  // Try ISO format first
  const isoMatch = dateStr.match(formats[0]);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Try YYYY/MM/DD
  const ymdMatch = dateStr.match(formats[2]);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Try DD/MM/YYYY or MM/DD/YYYY
  const dmyMatch = dateStr.match(formats[1]);
  if (dmyMatch) {
    const [, a, b, y] = dmyMatch;
    // Assume MM/DD/YYYY if first number <= 12, otherwise DD/MM/YYYY
    const month = parseInt(a) <= 12 ? a : b;
    const day = parseInt(a) <= 12 ? b : a;
    return `${y}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Try Date.parse as fallback
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return null;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}

/**
 * Generate a sample CSV for demonstration purposes
 */
export function generateSampleCSV(): string {
  const headers = 'Date,Open,High,Low,Close,Volume';
  const lines = [headers];
  
  // Generate realistic-looking sample data (clearly synthetic)
  let price = 150;
  const startDate = new Date('2020-01-02');
  
  for (let i = 0; i < 500; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    
    const change = (Math.random() - 0.48) * 3; // Slight upward bias
    const open = price;
    const close = Math.max(1, price + change);
    const high = Math.max(open, close) + Math.random() * 2;
    const low = Math.min(open, close) - Math.random() * 2;
    const volume = Math.floor(500000 + Math.random() * 2000000);
    
    lines.push(`${date.toISOString().split('T')[0]},${open.toFixed(2)},${high.toFixed(2)},${low.toFixed(2)},${close.toFixed(2)},${volume}`);
    price = close;
  }
  
  return lines.join('\n');
}
