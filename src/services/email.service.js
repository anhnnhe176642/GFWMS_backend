import { sendVerificationPin } from '../utils/mailer.js';

export const sendVerificationCodeEmail = async (email, pin, expiresInMinutes = 15) => {
  return await sendVerificationPin(email, pin, expiresInMinutes);
};
