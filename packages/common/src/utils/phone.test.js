'use strict';

const {
  formatPhone,
  validatePhone,
  validateInternationalPhone,
  maskPhone,
  parsePhoneNumber,
  getDisplayFormat,
} = require('./phone');

describe('phone utils', () => {
  it('formats Indian phone to +91XXXXXXXXXX', () => {
    expect(formatPhone('9876543210')).toBe('+919876543210');
    expect(formatPhone('+91 98765-43210')).toBe('+919876543210');
    expect(formatPhone('')).toBe('');
  });

  it('validates Indian phone numbers', () => {
    expect(validatePhone('9876543210')).toBe(true);
    expect(validatePhone('+919876543210')).toBe(true);
    expect(validatePhone('1234567890')).toBe(false);
    expect(validatePhone('')).toBe(false);
  });

  it('validates international phone numbers', () => {
    expect(validateInternationalPhone('+14155552671')).toBe(true);
    expect(validateInternationalPhone('14155552671')).toBe(true);
    expect(validateInternationalPhone('+00123')).toBe(false);
  });

  it('masks phone showing last 4 digits', () => {
    expect(maskPhone('+91 98765 43210')).toBe('********3210');
    expect(maskPhone('1234')).toBe('1234');
  });

  it('parses phone numbers with known country codes', () => {
    expect(parsePhoneNumber('+919876543210')).toEqual({ countryCode: '91', number: '9876543210' });
    expect(parsePhoneNumber('+14155552671')).toEqual({ countryCode: '1', number: '4155552671' });
    expect(parsePhoneNumber('919876543210')).toEqual({ countryCode: '91', number: '9876543210' });
    expect(parsePhoneNumber('9876543210')).toEqual({ countryCode: null, number: '9876543210' });
    expect(parsePhoneNumber(null)).toEqual({ countryCode: null, number: null });
  });

  it('returns display format for +91 numbers', () => {
    expect(getDisplayFormat('9876543210')).toBe('+91 98765 43210');
  });
});

