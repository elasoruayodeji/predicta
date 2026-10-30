// ============================================================
// NGX Trading Calendar
// ============================================================
// Nigerian Exchange trading calendar with holidays and trading days
// Essential for accurate return calculations and liquidity metrics
// ============================================================

export interface TradingDay {
  date: string; // YYYY-MM-DD
  isTradingDay: boolean;
  isHoliday: boolean;
  holidayName?: string;
}

// NGX Holidays (updated annually)
// Source: Nigerian Exchange official calendar
const NGX_HOLIDAYS_2024: { date: string; name: string }[] = [
  { date: '2024-01-01', name: 'New Year\'s Day' },
  { date: '2024-03-29', name: 'Good Friday' },
  { date: '2024-04-01', name: 'Easter Monday' },
  { date: '2024-05-01', name: 'Workers\' Day' },
  { date: '2024-05-27', name: 'Children\'s Day' },
  { date: '2024-06-12', name: 'Democracy Day' },
  { date: '2024-06-17', name: 'Eid-el-Fitr' },
  { date: '2024-06-18', name: 'Eid-el-Fitr (Day 2)' },
  { date: '2024-08-19', name: 'Eid-el-Kabir' },
  { date: '2024-08-20', name: 'Eid-el-Kabir (Day 2)' },
  { date: '2024-10-01', name: 'Independence Day' },
  { date: '2024-12-25', name: 'Christmas Day' },
  { date: '2024-12-26', name: 'Boxing Day' },
];

const NGX_HOLIDAYS_2025: { date: string; name: string }[] = [
  { date: '2025-01-01', name: 'New Year\'s Day' },
  { date: '2025-04-18', name: 'Good Friday' },
  { date: '2025-04-21', name: 'Easter Monday' },
  { date: '2025-05-01', name: 'Workers\' Day' },
  { date: '2025-05-27', name: 'Children\'s Day' },
  { date: '2025-06-12', name: 'Democracy Day' },
  { date: '2025-06-06', name: 'Eid-el-Fitr' },
  { date: '2025-06-07', name: 'Eid-el-Fitr (Day 2)' },
  { date: '2025-08-08', name: 'Eid-el-Kabir' },
  { date: '2025-08-09', name: 'Eid-el-Kabir (Day 2)' },
  { date: '2025-10-01', name: 'Independence Day' },
  { date: '2025-12-25', name: 'Christmas Day' },
  { date: '2025-12-26', name: 'Boxing Day' },
];

// Combine all holidays
const ALL_HOLIDAYS = [...NGX_HOLIDAYS_2024, ...NGX_HOLIDAYS_2025];

// Create a Set for fast lookup
const HOLIDAY_SET = new Set(ALL_HOLIDAYS.map(h => h.date));
const HOLIDAY_MAP = new Map(ALL_HOLIDAYS.map(h => [h.date, h.name]));

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
export function isWeekend(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = d.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

/**
 * Check if a date is an NGX holiday
 */
export function isNGXHoliday(date: Date | string): boolean {
  const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
  return HOLIDAY_SET.has(dateStr);
}

/**
 * Get holiday name if date is a holiday
 */
export function getHolidayName(date: Date | string): string | undefined {
  const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
  return HOLIDAY_MAP.get(dateStr);
}

/**
 * Check if a date is a trading day
 */
export function isTradingDay(date: Date | string): boolean {
  return !isWeekend(date) && !isNGXHoliday(date);
}

/**
 * Get trading day information for a specific date
 */
export function getTradingDayInfo(date: Date | string): TradingDay {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dateStr = d.toISOString().split('T')[0];
  const isHoliday = isNGXHoliday(d);
  const holidayName = getHolidayName(d);

  return {
    date: dateStr,
    isTradingDay: isTradingDay(d),
    isHoliday,
    holidayName,
  };
}

/**
 * Get all trading days between two dates (inclusive)
 */
export function getTradingDays(startDate: Date | string, endDate: Date | string): string[] {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  const tradingDays: string[] = [];
  const current = new Date(start);

  while (current <= end) {
    if (isTradingDay(current)) {
      tradingDays.push(current.toISOString().split('T')[0]);
    }
    current.setDate(current.getDate() + 1);
  }

  return tradingDays;
}

/**
 * Count trading days between two dates (inclusive)
 */
export function countTradingDays(startDate: Date | string, endDate: Date | string): number {
  return getTradingDays(startDate, endDate).length;
}

/**
 * Get the next trading day after a given date
 */
export function getNextTradingDay(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setDate(d.getDate() + 1);

  while (!isTradingDay(d)) {
    d.setDate(d.getDate() + 1);
  }

  return d.toISOString().split('T')[0];
}

/**
 * Get the previous trading day before a given date
 */
export function getPreviousTradingDay(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setDate(d.getDate() - 1);

  while (!isTradingDay(d)) {
    d.setDate(d.getDate() - 1);
  }

  return d.toISOString().split('T')[0];
}

/**
 * Add trading days to a date
 */
export function addTradingDays(date: Date | string, days: number): string {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  let added = 0;

  while (added < days) {
    d.setDate(d.getDate() + 1);
    if (isTradingDay(d)) {
      added++;
    }
  }

  return d.toISOString().split('T')[0];
}

/**
 * Subtract trading days from a date
 */
export function subtractTradingDays(date: Date | string, days: number): string {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  let subtracted = 0;

  while (subtracted < days) {
    d.setDate(d.getDate() - 1);
    if (isTradingDay(d)) {
      subtracted++;
    }
  }

  return d.toISOString().split('T')[0];
}

/**
 * Get all holidays for a specific year
 */
export function getHolidaysForYear(year: number): { date: string; name: string }[] {
  return ALL_HOLIDAYS.filter(h => h.date.startsWith(year.toString()));
}

/**
 * Check if market is currently open (simplified - doesn't account for actual trading hours)
 * NGX trading hours: 9:30 AM - 3:30 PM WAT (UTC+1)
 */
export function isMarketOpen(date: Date = new Date()): boolean {
  if (!isTradingDay(date)) return false;

  // Convert to WAT (UTC+1)
  const wat = new Date(date.getTime() + 60 * 60 * 1000);
  const hours = wat.getUTCHours();
  const minutes = wat.getUTCMinutes();
  const timeInMinutes = hours * 60 + minutes;

  // 9:30 AM = 570 minutes, 3:30 PM = 930 minutes
  return timeInMinutes >= 570 && timeInMinutes <= 930;
}

/**
 * Get market session status
 */
export function getMarketSessionStatus(date: Date = new Date()): {
  isOpen: boolean;
  session: 'pre-market' | 'trading' | 'post-market' | 'closed';
  nextOpen?: string;
  nextClose?: string;
} {
  if (!isTradingDay(date)) {
    return {
      isOpen: false,
      session: 'closed',
      nextOpen: getNextTradingDay(date),
    };
  }

  // Convert to WAT (UTC+1)
  const wat = new Date(date.getTime() + 60 * 60 * 1000);
  const hours = wat.getUTCHours();
  const minutes = wat.getUTCMinutes();
  const timeInMinutes = hours * 60 + minutes;

  if (timeInMinutes < 570) {
    // Before 9:30 AM
    return {
      isOpen: false,
      session: 'pre-market',
      nextClose: '15:30 WAT',
    };
  } else if (timeInMinutes <= 930) {
    // 9:30 AM - 3:30 PM
    return {
      isOpen: true,
      session: 'trading',
      nextClose: '15:30 WAT',
    };
  } else {
    // After 3:30 PM
    return {
      isOpen: false,
      session: 'post-market',
      nextOpen: getNextTradingDay(date),
    };
  }
}

/**
 * Validate that a date range contains sufficient trading days
 */
export function validateTradingDayCoverage(
  startDate: string,
  endDate: string,
  minTradingDays: number = 20
): {
  isValid: boolean;
  tradingDays: number;
  calendarDays: number;
  message?: string;
} {
  const tradingDays = countTradingDays(startDate, endDate);
  const start = new Date(startDate);
  const end = new Date(endDate);
  const calendarDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  if (tradingDays < minTradingDays) {
    return {
      isValid: false,
      tradingDays,
      calendarDays,
      message: `Insufficient trading days: ${tradingDays} (minimum ${minTradingDays} required)`,
    };
  }

  return {
    isValid: true,
    tradingDays,
    calendarDays,
  };
}
