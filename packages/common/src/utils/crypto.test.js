'use strict';

const {
  hashToken,
  generateSecureToken,
  generateOTP,
  generateShortId,
  encrypt,
  decrypt,
} = require('./crypto');

describe('crypto utils', () => {
  it('hashes tokens deterministically (sha256)', () => {
    expect(hashToken('token')).toBe(
      '3c469e9d6c5875d37a43f353d4f88e61fcf812c66eee3457465a40b0da4153e0'
    );
  });

  it('generates secure token hex of expected size', () => {
    const t = generateSecureToken(16);
    expect(t).toMatch(/^[a-f0-9]+$/);
    expect(t).toHaveLength(32);
  });

  it('generates numeric OTP of expected length', () => {
    const otp = generateOTP(6);
    expect(otp).toMatch(/^\d{6}$/);
  });

  it('generates URL-safe short IDs of expected length', () => {
    const id = generateShortId(12);
    expect(id).toHaveLength(12);
    expect(id).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('encrypts and decrypts data with AES-256-GCM', () => {
    const key = 'a'.repeat(64);
    const plaintext = 'hello-world';
    const encrypted = encrypt(plaintext, key);
    expect(encrypted.split(':')).toHaveLength(3);
    expect(decrypt(encrypted, key)).toBe(plaintext);
  });
});

