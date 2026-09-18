const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT) || 587,
  secure: Number(process.env.MAIL_PORT) === 465,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

async function sendResetPasswordEmail(to, resetUrl) {
  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to,
    subject: '重設密碼 - 圖個方便 | PicShare',
    html: `
      <p>您好，</p>
      <p>我們收到您重設密碼的請求，請點擊以下連結重設密碼（15 分鐘內有效）：</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>若您並未申請重設密碼，請忽略此信件，您的密碼不會有任何變動。</p>
    `
  });
}

module.exports = { sendResetPasswordEmail };
