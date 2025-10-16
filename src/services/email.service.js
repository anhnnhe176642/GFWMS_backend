import { sendVerificationPin } from '../utils/mailer.js';

export const sendVerificationCodeEmail = async (email, pin, expiresInMinutes = 15) => {
  // Keep service thin — return transporter result so callers can handle errors
  return await sendVerificationPin(email, pin, expiresInMinutes);
};
