'use strict';

const {
  formatDate,
  parseDate,
  isExpired,
  isFuture,
  addDays,
  diffInDays,
  startOfDay,
  endOfDay,
  timeAgo,
} = require('./date');

describe('date utils', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-10T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('formats and parses dates', () => {
    expect(formatDate('2024-01-01T00:00:00.000Z')).toBe('2024-01-01T00:00:00.000Z');
    expect(formatDate(null)).toBe(null);
    expect(parseDate('invalid')).toBe(null);
    expect(parseDate(null)).toBe(null);
    const d = new Date('2024-01-01T00:00:00.000Z');
    expect(parseDate(d)).toBe(d);
  });

  it('detects expired vs future relative to Date.now()', () => {
    expect(isExpired('2024-01-09T12:00:00.000Z')).toBe(true);
    expect(isExpired('2024-01-11T12:00:00.000Z')).toBe(false);
    expect(isExpired(null)).toBe(true);

    expect(isFuture('2024-01-11T12:00:00.000Z')).toBe(true);
    expect(isFuture('2024-01-09T12:00:00.000Z')).toBe(false);
    expect(isFuture(null)).toBe(false);
  });

  it('adds days and calculates day diff', () => {
    const d = addDays('2024-01-01T00:00:00.000Z', 10);
    expect(d.toISOString()).toBe('2024-01-11T00:00:00.000Z');
    expect(diffInDays('2024-01-01', '2024-01-11')).toBe(10);
  });

  it('computes start/end of day boundaries', () => {
    const base = new Date(2024, 0, 10, 12, 34, 56, 0);
    const s = startOfDay(base);
    const e = endOfDay(base);
    expect(s.getFullYear()).toBe(2024);
    expect(s.getMonth()).toBe(0);
    expect(s.getDate()).toBe(10);
    expect(s.getHours()).toBe(0);
    expect(s.getMinutes()).toBe(0);
    expect(s.getSeconds()).toBe(0);
    expect(s.getMilliseconds()).toBe(0);

    expect(e.getFullYear()).toBe(2024);
    expect(e.getMonth()).toBe(0);
    expect(e.getDate()).toBe(10);
    expect(e.getHours()).toBe(23);
    expect(e.getMinutes()).toBe(59);
    expect(e.getSeconds()).toBe(59);
    expect(e.getMilliseconds()).toBe(999);
  });

  it('formats relative time', () => {
    expect(timeAgo('2024-01-10T11:59:30.000Z')).toBe('just now');
    expect(timeAgo('2024-01-10T11:00:00.000Z')).toBe('1 hour ago');
    expect(timeAgo('2024-01-09T12:00:00.000Z')).toBe('1 day ago');
  });
});

