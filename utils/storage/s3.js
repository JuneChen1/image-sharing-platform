const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} = require('@aws-sdk/client-s3');

// S3 驅動：線上用。介面和 local.js 一樣（save、read、remove），呼叫端不知道底下是哪一個。
// 資料庫存的 file_key 是 <使用者 id>/<uuid>.webp（與驅動無關）；放進 S3 時前面加一層 prefix（預設 uploads/），
// 這樣 bucket 的權限與生命週期規則可以只針對 uploads/ 底下設定。
//
// 憑證不寫在程式或 .env：本機用 AWS CLI 的 profile（設 AWS_PROFILE，例如 aws login 之後），EC2 用 IAM Role，
// SDK 的預設憑證順序會自己找。

const isNotFound = (error) =>
  error.name === 'NoSuchKey' ||
  error.name === 'NotFound' ||
  error.$metadata?.httpStatusCode === 404;

// client 可以從外面傳進來（測試時用假的），不傳就依環境建立
function createS3Driver({ client, bucket, prefix = 'uploads/' }) {
  if (!bucket) throw new Error('S3 驅動需要 bucket 名稱（環境變數 S3_BUCKET）');
  const normalizedPrefix = prefix && !prefix.endsWith('/') ? `${prefix}/` : prefix;
  const objectKey = (key) => `${normalizedPrefix}${key}`;

  async function save(key, buffer, contentType) {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey(key),
        Body: buffer,
        ContentType: contentType,
        // 物件已存在就失敗（對應本機驅動的 wx），不會蓋掉別人的圖
        IfNoneMatch: '*'
      })
    );
  }

  // 找不到回傳 null；找到回傳 { stream, size }。
  // 注意：IAM 要有 s3:ListBucket，S3 才會對「不存在的物件」回 404（NoSuchKey）；沒有的話會回 403，
  // 403 不當成「找不到」，會往上丟，這樣權限設錯時看得出來，不會默默回 404
  async function read(key) {
    try {
      const result = await client.send(
        new GetObjectCommand({ Bucket: bucket, Key: objectKey(key) })
      );
      return { stream: result.Body, size: result.ContentLength };
    } catch (error) {
      if (isNotFound(error)) return null;
      throw error;
    }
  }

  // S3 的刪除是冪等的：物件不存在也回成功，所以無法分辨「真的刪到」或「本來就沒有」，一律回傳 true
  async function remove(key) {
    await client.send(
      new DeleteObjectCommand({ Bucket: bucket, Key: objectKey(key) })
    );
    return true;
  }

  return { save, read, remove };
}

// 依環境變數建立：S3_BUCKET（必填）、S3_REGION（選填，預設 ap-northeast-1）、S3_KEY_PREFIX（選填，預設 uploads/）
function createS3DriverFromEnv() {
  const client = new S3Client({
    region: process.env.S3_REGION || process.env.AWS_REGION || 'ap-northeast-1'
  });
  return createS3Driver({
    client,
    bucket: process.env.S3_BUCKET,
    prefix: process.env.S3_KEY_PREFIX || 'uploads/'
  });
}

module.exports = { createS3Driver, createS3DriverFromEnv };
