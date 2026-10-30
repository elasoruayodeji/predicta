import { describe, it, expect } from 'vitest';
import {
  isWeekend,
  isNGXHoliday,
  isTradingDay,
  getTradingDayInfo,
  getTradingDays,
  countTradingDays,
  getNextTradingDay,
  getPreviousTradingDay,
  addTradingDays,
  subtractTradingDays,
  getHolidaysForYear,
  isMarketOpen,
  getMarketSessionStatus,
  validateTradingDayCoverage,
} from '../engine/tradingCalendar';

describe('NGX Trading Calendar', () => {
  describe('isWeekend', () => {
    it('should identify Saturday as weekend', () => {
      const saturday = new Date('2024-01-06'); // Saturday
      expect(isWeekend(saturday)).toBe(true);
    });

    it('should identify Sunday as weekend', () => {
      const sunday = new Date('2024-01-07'); // Sunday
      expect(isWeekend(sunday)).toBe(true);
    });

    it('should identify weekday as not weekend', () => {
      const monday = new Date('2024-01-08'); // Monday
      expect(isWeekend(monday)).toBe(false);
    });

    it('should accept string dates', () => {
      expect(isWeekend('2024-01-06')).toBe(true); // Saturday
      expect(isWeekend('2024-01-08')).toBe(false); // Monday
    });
  });

  describe('isNGXHoliday', () => {
    it('should identify New Year as holiday', () => {
      expect(isNGXHoliday('2024-01-01')).toBe(true);
    });

    it('should identify Christmas as holiday', () => {
      expect(isNGXHoliday('2024-12-25')).toBe(true);
    });

    it('should identify Independence Day as holiday', () => {
      expect(isNGXHoliday('2024-10-01')).toBe(true);
    });

    it('should identify regular weekday as not holiday', () => {
      expect(isNGXHoliday('2024-01-08')).toBe(false); // Monday
    });
  });

  describe('isTradingDay', () => {
    it('should identify regular weekday as trading day', () => {
      expect(isTradingDay('2024-01-08')).toBe(true); // Monday
    });

    it('should identify weekend as not trading day', () => {
      expect(isTradingDay('2024-01-06')).toBe(false); // Saturday
    });

    it('should identify holiday as not trading day', () => {
      expect(isTradingDay('2024-01-01')).toBe(false); // New Year
    });

    it('should identify holiday on weekday as not trading day', () => {
      expect(isTradingDay('2024-12-25')).toBe(false); // Christmas (Wednesday in 2024)
    });
  });

  describe('getTradingDayInfo', () => {
    it('should return info for trading day', () => {
      const info = getTradingDayInfo('2024-01-08');
      expect(info.date).toBe('2024-01-08');
      expect(info.isTradingDay).toBe(true);
      expect(info.isHoliday).toBe(false);
      expect(info.holidayName).toBeUndefined();
    });

    it('should return info for holiday', () => {
      const info = getTradingDayInfo('2024-01-01');
      expect(info.date).toBe('2024-01-01');
      expect(info.isTradingDay).toBe(false);
      expect(info.isHoliday).toBe(true);
      expect(info.holidayName).toBe('New Year\'s Day');
    });

    it('should return info for weekend', () => {
      const info = getTradingDayInfo('2024-01-06');
      expect(info.date).toBe('2024-01-06');
      expect(info.isTradingDay).toBe(false);
      expect(info.isHoliday).toBe(false);
    });
  });

  describe('getTradingDays', () => {
    it('should return all trading days in range', () => {
      const tradingDays = getTradingDays('2024-01-01', '2024-01-07');
      // Jan 1 is holiday, Jan 6-7 are weekend
      // Should only include Jan 2, 3, 4, 5
      expect(tradingDays.length).toBe(4);
      expect(tradingDays).toContain('2024-01-02');
      expect(tradingDays).toContain('2024-01-03');
      expect(tradingDays).toContain('2024-01-04');
      expect(tradingDays).toContain('2024-01-05');
    });

    it('should exclude holidays', () => {
      const tradingDays = getTradingDays('2024-12-24', '2024-12-26');
      // Dec 25 is Christmas
      expect(tradingDays).not.toContain('2024-12-25');
    });

    it('should exclude weekends', () => {
      const tradingDays = getTradingDays('2024-01-05', '2024-01-08');
      // Jan 6-7 are weekend
      expect(tradingDays).not.toContain('2024-01-06');
      expect(tradingDays).not.toContain('2024-01-07');
    });
  });

  describe('countTradingDays', () => {
    it('should count trading days correctly', () => {
      const count = countTradingDays('2024-01-01', '2024-01-07');
      expect(count).toBe(4); // Jan 2, 3, 4, 5
    });

    it('should count full year trading days', () => {
      const count = countTradingDays('2024-01-01', '2024-12-31');
      // Should be approximately 250 trading days (accounting for weekends and holidays)
      expect(count).toBeGreaterThan(240);
      expect(count).toBeLessThan(260);
    });
  });

  describe('getNextTradingDay', () => {
    it('should return next trading day from weekday', () => {
      const next = getNextTradingDay('2024-01-08'); // Monday
      expect(next).toBe('2024-01-09'); // Tuesday
    });

    it('should skip weekend', () => {
      const next = getNextTradingDay('2024-01-05'); // Friday
      expect(next).toBe('2024-01-08'); // Monday
    });

    it('should skip holiday', () => {
      const next = getNextTradingDay('2023-12-31'); // Sunday before New Year
      expect(next).toBe('2024-01-02'); // Skip Jan 1 holiday
    });
  });

  describe('getPreviousTradingDay', () => {
    it('should return previous trading day from weekday', () => {
      const prev = getPreviousTradingDay('2024-01-09'); // Tuesday
      expect(prev).toBe('2024-01-08'); // Monday
    });

    it('should skip weekend', () => {
      const prev = getPreviousTradingDay('2024-01-08'); // Monday
      expect(prev).toBe('2024-01-05'); // Friday
    });

    it('should skip holiday', () => {
      const prev = getPreviousTradingDay('2024-01-02'); // Day after New Year
      expect(prev).toBe('2023-12-29'); // Skip Jan 1 holiday
    });
  });

  describe('addTradingDays', () => {
    it('should add trading days', () => {
      const result = addTradingDays('2024-01-08', 5); // Monday + 5 trading days
      expect(result).toBe('2024-01-15'); // Next Monday
    });

    it('should skip weekends when adding', () => {
      const result = addTradingDays('2024-01-05', 1); // Friday + 1 trading day
      expect(result).toBe('2024-01-08'); // Monday
    });

    it('should skip holidays when adding', () => {
      const result = addTradingDays('2023-12-29', 1); // Day before New Year
      expect(result).toBe('2024-01-02'); // Skip weekend and holiday
    });
  });

  describe('subtractTradingDays', () => {
    it('should subtract trading days', () => {
      const result = subtractTradingDays('2024-01-15', 5); // Monday - 5 trading days
      expect(result).toBe('2024-01-08'); // Previous Monday
    });

    it('should skip weekends when subtracting', () => {
      const result = subtractTradingDays('2024-01-08', 1); // Monday - 1 trading day
      expect(result).toBe('2024-01-05'); // Friday
    });
  });

  describe('getHolidaysForYear', () => {
    it('should return all holidays for 2024', () => {
      const holidays = getHolidaysForYear(2024);
      expect(holidays.length).toBeGreaterThan(10);
      expect(holidays.find(h => h.name === 'New Year\'s Day')).toBeDefined();
      expect(holidays.find(h => h.name === 'Christmas Day')).toBeDefined();
    });

    it('should return empty array for year with no holidays', () => {
      const holidays = getHolidaysForYear(2020); // No holidays defined for 2020
      expect(holidays.length).toBe(0);
    });
  });

  describe('isMarketOpen', () => {
    it('should return false for weekend', () => {
      const saturday = new Date('2024-01-06T12:00:00Z'); // Saturday noon
      expect(isMarketOpen(saturday)).toBe(false);
    });

    it('should return false for holiday', () => {
      const newYear = new Date('2024-01-01T12:00:00Z'); // New Year noon
      expect(isMarketOpen(newYear)).toBe(false);
    });
  });

  describe('getMarketSessionStatus', () => {
    it('should return closed for weekend', () => {
      const saturday = new Date('2024-01-06T12:00:00Z');
      const status = getMarketSessionStatus(saturday);
      expect(status.isOpen).toBe(false);
      expect(status.session).toBe('closed');
    });

    it('should return closed for holiday', () => {
      const newYear = new Date('2024-01-01T12:00:00Z');
      const status = getMarketSessionStatus(newYear);
      expect(status.isOpen).toBe(false);
      expect(status.session).toBe('closed');
    });
  });

  describe('validateTradingDayCoverage', () => {
    it('should validate sufficient trading days', () => {
      const result = validateTradingDayCoverage('2024-01-01', '2024-12-31', 20);
      expect(result.isValid).toBe(true);
      expect(result.tradingDays).toBeGreaterThan(20);
    });

    it('should reject insufficient trading days', () => {
      const result = validateTradingDayCoverage('2024-01-01', '2024-01-07', 10);
      expect(result.isValid).toBe(false);
      expect(result.tradingDays).toBeLessThan(10);
      expect(result.message).toContain('Insufficient trading days');
    });

    it('should return calendar days count', () => {
      const result = validateTradingDayCoverage('2024-01-01', '2024-01-07', 1);
      expect(result.calendarDays).toBe(7);
    });
  });
});
