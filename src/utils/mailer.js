import nodemailer from 'nodemailer';
import process from 'process';

const transportOptions = {
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
};

const transporter = nodemailer.createTransport(transportOptions);

export const sendVerificationPin = async (to, pin, expiresInMinutes = 15) => {
  const subject = 'Mã xác thực email của bạn Warehouse Fabric System';
  const text = `Mã xác thực của bạn là: ${pin}\nMã sẽ hết hạn trong ${expiresInMinutes} phút. Nếu bạn không yêu cầu mã này, hãy bỏ qua.`;
  const html = `
    <div style="font-family: sans-serif; line-height:1.6">
      <p>Xin chào</p>
      <p>Mã xác thực của bạn là: <strong style="font-size:24px">${pin}</strong></p>
      <p>Mã sẽ hết hạn trong <strong>${expiresInMinutes} phút</strong>.</p>
      <p>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
    </div>
  `;

  return await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text,
    html
  });
};

export const sendPasswordResetPin = async (to, pin, expiresInMinutes = 15) => {
  const subject = 'Mã đặt lại mật khẩu của bạn Warehouse Fabric System';
  const text = `Mã đặt lại mật khẩu của bạn là: ${pin}\nMã sẽ hết hạn trong ${expiresInMinutes} phút. Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.`;
  const html = `
    <div style="font-family: sans-serif; line-height:1.6">
      <p>Xin chào</p>
      <p>Mã đặt lại mật khẩu của bạn là: <strong style="font-size:24px">${pin}</strong></p>
      <p>Mã sẽ hết hạn trong <strong>${expiresInMinutes} phút</strong>.</p>
      <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
    </div>
  `;

  return await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text,
    html
  });
};
