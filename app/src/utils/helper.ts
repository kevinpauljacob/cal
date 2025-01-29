import crypto from "crypto";

const generateIV = () => crypto.randomBytes(16); // 16 bytes for AES

export const encrypt = (text: string, encryptionKey: Buffer): string => {
  const iv = generateIV();

  const cipher = crypto.createCipheriv("aes-256-cbc", encryptionKey, iv);

  let encrypted = cipher.update(text, "utf8");
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
};

export const encryptData = (data: string, encryptionKey: Buffer) => {
  const iv = generateIV();

  const cipher = crypto.createCipheriv("aes-256-cbc", encryptionKey, iv);
  let encryptedData = cipher.update(data, "utf8", "hex");
  encryptedData += cipher.final("hex");

  return { encryptedData, iv: iv.toString("hex") };
};
