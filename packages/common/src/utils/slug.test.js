'use strict';

jest.mock('nanoid', () => ({
  nanoid: (len = 21) => 'Z'.repeat(len),
}));

const {
  generateSlug,
  generateUniqueSlug,
  generatePropertySlug,
  generateProjectSlug,
  isValidSlug,
} = require('./slug');

describe('slug utils', () => {
  describe('generateSlug', () => {
    it('returns empty string for falsy input', () => {
      expect(generateSlug('')).toBe('');
      expect(generateSlug(null)).toBe('');
      expect(generateSlug(undefined)).toBe('');
    });

    it('slugifies text with defaults (lower + strict)', () => {
      expect(generateSlug('Hello World')).toBe('hello-world');
      expect(generateSlug('  Hello   World  ')).toBe('hello-world');
      expect(generateSlug('Hello, World!')).toBe('hello-world');
    });
  });

  describe('generateUniqueSlug', () => {
    it('appends a deterministic lowercase suffix', () => {
      expect(generateUniqueSlug('Hello World', 6)).toBe('hello-world-zzzzzz');
    });
  });

  describe('generatePropertySlug', () => {
    it('includes type/title/locality/city and ends with an 8-char suffix', () => {
      const slug = generatePropertySlug({
        type: 'RENT',
        title: '2 BHK Luxury Apartment',
        locality: 'Indiranagar',
        city: 'Bengaluru',
      });
      expect(slug).toBe('rent-2-bhk-luxury-apartment-indiranagar-bengaluru-zzzzzzzz');
    });
  });

  describe('generateProjectSlug', () => {
    it('includes name/builder/city and ends with a 6-char suffix', () => {
      const slug = generateProjectSlug({
        name: 'Skyline Towers',
        builder: 'Acme Builders',
        city: 'Pune',
      });
      expect(slug).toBe('skyline-towers-acme-builders-pune-zzzzzz');
    });
  });

  describe('isValidSlug', () => {
    it('accepts valid slugs', () => {
      expect(isValidSlug('hello-world')).toBe(true);
      expect(isValidSlug('a')).toBe(true);
      expect(isValidSlug('a1-b2-c3')).toBe(true);
    });

    it('rejects invalid slugs', () => {
      expect(isValidSlug('Hello-World')).toBe(false);
      expect(isValidSlug('hello_world')).toBe(false);
      expect(isValidSlug('hello--world')).toBe(false);
      expect(isValidSlug('-hello')).toBe(false);
      expect(isValidSlug('hello-')).toBe(false);
      expect(isValidSlug('')).toBe(false);
      expect(isValidSlug(null)).toBe(false);
    });
  });
});

