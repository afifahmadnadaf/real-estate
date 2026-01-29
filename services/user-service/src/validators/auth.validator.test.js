'use strict';

const {
  requestOtpSchema,
  verifyOtpSchema,
  passwordLoginSchema,
  refreshTokenSchema,
} = require('./auth.validator');

describe('auth.validator schemas', () => {
  it('applies defaults for requestOtpSchema', () => {
    const { value, error } = requestOtpSchema.validate({
      identifier: 'user@example.com',
      identifierType: 'EMAIL',
    });
    expect(error).toBeUndefined();
    expect(value.purpose).toBe('LOGIN');
  });

  it('rejects invalid identifierType', () => {
    const { error } = requestOtpSchema.validate({
      identifier: 'user@example.com',
      identifierType: 'OTHER',
    });
    expect(error).toBeTruthy();
  });

  it('enforces OTP numeric 6 digits', () => {
    expect(
      verifyOtpSchema.validate({
        identifier: 'user@example.com',
        identifierType: 'EMAIL',
        otp: '12345',
      }).error
    ).toBeTruthy();

    expect(
      verifyOtpSchema.validate({
        identifier: 'user@example.com',
        identifierType: 'EMAIL',
        otp: '12ab56',
      }).error
    ).toBeTruthy();

    expect(
      verifyOtpSchema.validate({
        identifier: 'user@example.com',
        identifierType: 'EMAIL',
        otp: '123456',
      }).error
    ).toBeUndefined();
  });

  it('enforces password min length', () => {
    expect(passwordLoginSchema.validate({ identifier: 'x', password: '12345' }).error).toBeTruthy();
    expect(passwordLoginSchema.validate({ identifier: 'x', password: '123456' }).error).toBeUndefined();
  });

  it('requires refreshToken', () => {
    expect(refreshTokenSchema.validate({}).error).toBeTruthy();
    expect(refreshTokenSchema.validate({ refreshToken: 't' }).error).toBeUndefined();
  });
});

