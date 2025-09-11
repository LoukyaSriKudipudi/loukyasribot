const crypto = require("crypto");

function scryptKey(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 32, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

async function encryptText(password, value) {
  const iv = crypto.randomBytes(12);
  const salt = crypto.randomBytes(16);
  const key = await scryptKey(password, salt);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encryptedText = Buffer.concat([cipher.update(value), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const encryptedPackage = Buffer.concat([iv, salt, encryptedText, authTag]);
  return encryptedPackage.toString("base64");
}

async function decryptText(password, value) {
  const buffer = Buffer.from(value, "base64");

  const iv = buffer.subarray(0, 12);
  const salt = buffer.subarray(12, 28);
  const encryptedText = buffer.subarray(28, buffer.length - 16);
  const authTag = buffer.subarray(buffer.length - 16);
  const key = await scryptKey(password, salt);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  const decryptedText = Buffer.concat([
    decipher.update(encryptedText),
    decipher.final(),
  ]);

  return decryptedText.toString("utf8");
}

module.exports = { encryptText, decryptText };
