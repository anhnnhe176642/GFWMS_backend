import crypto from 'crypto';

export const hashPin = (pin) => {
  return crypto.createHash('sha256').update(String(pin)).digest('hex');
};

export const generateNumericPin = (digits = 6) => {
  const max = 10 ** digits;
  const n = crypto.randomInt(0, max);
  return String(n).padStart(digits, '0');
};
