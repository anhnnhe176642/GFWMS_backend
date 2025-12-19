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
  const subject = 'Mã xác thực email của bạn Garment Fabric Warehouse Management System';
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
  const subject = 'Mã đặt lại mật khẩu của bạn Garment Fabric Warehouse Management System';
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
  const subject = 'YOLO Model Upload Thành Công - Garment Fabric Warehouse Management System';
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
      <p>Trân trọng,<br/>Garment Fabric Warehouse Management System</p>
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

export const sendInvoiceOverdueReminder = async (
  to,
  creditId,
  minutesBeforeDue
) => {
  const subject =
    'Nhắc nhở sắp đến hạn thanh toán khoản ghi nợ - Garment Fabric Warehouse Management System';

  const text = `
Hóa đơn mua hàng ghi nợ của bạn (ID: ${creditId}) sẽ đến hạn thanh toán trong ${minutesBeforeDue} phút.

Vui lòng thanh toán đúng hạn để tránh phát sinh phí hoặc bị khóa tài khoản ghi nợ.
`;

  const html = `
    <div style="font-family: sans-serif; line-height:1.6">
      <p>Xin chào,</p>

      <p>
        Hóa đơn mua hàng ghi nợ của bạn 
        (Credit ID: <strong>${creditId}</strong>) 
        <strong>sẽ đến hạn thanh toán trong ${minutesBeforeDue} ngày</strong>.
      </p>

      <p>
        Vui lòng thanh toán đúng hạn để tránh các rủi ro như:
      </p>

      <ul>
        <li>Phát sinh trạng thái quá hạn</li>
        <li>Bị <strong style="color:red">khóa tài khoản ghi nợ</strong></li>
      </ul>

      <p>
        Nếu bạn đã thanh toán, vui lòng bỏ qua thông báo này.
      </p>

      <p>
        Trân trọng,<br/>
        <strong>Garment Fabric Warehouse Management System</strong>
      </p>
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
  const subject = `Tài khoản ghi nợ đã bị khóa - Garment Fabric Warehouse Management System`;

  const text = `
    Tài khoản ghi nợ của bạn (ID: ${creditId}) đã bị KHÓA.

    Lý do: Có hóa đơn ghi nợ quá hạn ${overdueDays} ngày kể từ ngày đến hạn thanh toán.

    Vui lòng thanh toán các khoản nợ quá hạn và liên hệ bộ phận quản lý
    để được hỗ trợ mở khóa và tiếp tục sử dụng dịch vụ.

    Trân trọng,
    Garment Fabric Warehouse Management System
  `.trim();

  const html = `
    <div style="font-family: sans-serif; line-height:1.6">
      <p>Xin chào,</p>

      <p>
        Tài khoản ghi nợ của bạn 
        <strong style="color:red">đã bị KHÓA</strong>.
      </p>

      <p>
        <strong>Lý do:</strong> Có hóa đơn ghi nợ quá hạn 
        <strong>${overdueDays} ngày</strong> kể từ ngày đến hạn thanh toán.
      </p>

      <p>
        Vui lòng thanh toán các khoản nợ quá hạn và liên hệ bộ phận quản lý
        để được hỗ trợ .
      </p>

      <p>
        Trân trọng,<br/>
        <strong>Garment Fabric Warehouse Management System</strong>
      </p>
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


