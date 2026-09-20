require('dotenv').config();

const bcrypt = require('bcrypt');
const { dataSource } = require('../data-source');
const {
  isValidString,
  isValidPassword,
  isValidEmail
} = require('../../utils/validUtils');

async function seedAdmin() {
  const name = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  const email = process.env.ADMIN_EMAIL;

  if (
    !isValidString(name) ||
    !isValidPassword(password) ||
    !isValidEmail(email)
  ) {
    throw new Error(
      '請設定環境變數 ADMIN_USERNAME、ADMIN_PASSWORD、ADMIN_EMAIL（密碼需至少 8 碼且包含英文字母與數字，Email 需符合格式）'
    );
  }

  await dataSource.initialize();

  try {
    const userRepo = dataSource.getRepository('Users');
    const user = await userRepo.findOneBy({
      email: email.trim().toLowerCase()
    });

    if (user) {
      await userRepo.save({ ...user, name, role: 'ADMIN' });
      console.log(`已將既有帳號「${email}」的權限設為 ADMIN（密碼未變更）`);
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      await userRepo.save({
        name: name.trim(),
        password: hashedPassword,
        email: email.trim().toLowerCase(),
        role: 'ADMIN'
      });
      console.log(`已建立管理者帳號「${email}」`);
    }
  } finally {
    await dataSource.destroy();
  }
}

seedAdmin().catch((error) => {
  console.error('管理者帳號 seed 失敗：', error);
  process.exit(1);
});
