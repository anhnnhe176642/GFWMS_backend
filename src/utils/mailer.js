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

export const sendYoloModelUploadNotification = async (to, modelName, version) => {
  const subject = 'YOLO Model Upload Thành Công - Warehouse Fabric System';
  const text = `Mô hình YOLO "${modelName}" (phiên bản ${version}) của bạn đã được tải lên thành công.`;
  const html = `
    <div style="font-family: sans-serif; line-height:1.6">
      <p>Xin chào,</p>
      <p>Mô hình YOLO của bạn đã được tải lên thành công!</p>
      <ul style="line-height: 2;">
        <li><strong>Tên mô hình:</strong> ${modelName}</li>
        <li><strong>Phiên bản:</strong> ${version}</li>
        <li><strong>Thời gian upload:</strong> ${new Date().toLocaleString('vi-VN')}</li>
      </ul>
      <p>Mô hình của bạn đã sẵn sàng để sử dụng trong hệ thống phát hiện.</p>
      <p>Trân trọng,<br/>Warehouse Fabric System</p>
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

export const sendInvoiceOverdueReminder = async (to, creditId, overdueDays) => {
  const subject = `Nhắc nhở khoản tín dụng quá hạn - Warehouse Fabric System`;

  const text = `Khoản tín dụng (ID: ${creditId}) của bạn đã quá hạn ${overdueDays} ngày. 
Vui lòng thanh toán sớm để tránh bị khóa hạn mức tín dụng.`;

  const html = `
    <div style="font-family: sans-serif; line-height:1.6">
      <p>Xin chào,</p>
      <p>Khoản tín dụng của bạn (ID: <strong>${creditId}</strong>) đã <strong>quá hạn ${overdueDays} ngày</strong>.</p>
      <p>Khoản tín dụng này phát sinh từ các hóa đơn chưa được thanh toán.</p>

      <p>Vui lòng thanh toán số dư còn lại để tránh việc 
        <strong style="color:red">khóa hạn mức tín dụng</strong>.
      </p>

      <p>Trân trọng,<br/>Warehouse Fabric System</p>
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



export const sendCreditLockedNotification = async (to, creditId, overdueDays) => {
  const subject = `Tài khoản tín dụng đã bị khóa - Warehouse Fabric System`;

  const text = `Tài khoản tín dụng (ID: ${creditId}) đã bị khóa do quá hạn ${overdueDays} ngày. 
Vui lòng liên hệ để được hỗ trợ.`;

  const html = `
    <div style="font-family:sans-serif; line-height:1.6">
      <p>Xin chào,</p>
      <p>Tài khoản tín dụng của bạn (ID: <strong>${creditId}</strong>) đã bị 
        <strong style="color:red">KHÓA</strong>.
      </p>
      <p>Lý do: Khoản tín dụng của bạn đã quá hạn <strong>${overdueDays} ngày</strong>.</p>

      <p>Vui lòng liên hệ bộ phận quản lý để được hỗ trợ mở khóa 
        và tiếp tục sử dụng dịch vụ.
      </p>

      <p>Trân trọng,<br/>Warehouse Fabric System</p>
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

