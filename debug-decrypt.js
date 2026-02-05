
const crypto = require('crypto');

const keyStr = "fallback-encryption-key-STABLE-DO-NOT-CHANGE";
const key = crypto.createHash("sha256").update(keyStr).digest().slice(0, 32);
const ciphertext = "555cb20f3f5f129eaf009a5ed71fa389:972f9ac4f13bf6f23f112b5399b5683f:b2d9cd22832983489d41b68dd913b5e5d23501e59ec539e0c818ad8561adfef313ce3bcb24d01b20c961fcebe9789e03bc5e4a646d25f45df154a487ae7287eb5ea4a46e3e9c08fd2879f0028c9638658520c8bc88dcdb87bd4766b7a12a99fc543211720e28a49d5cb604ced998acc70db8331bc448a45b9c709a3ed1cfc23ac6feaf3e9611069e074429ccd2e843fba9407c25b1e71d21b1194aac0eeefaa0e14b44cfa38384aced9fbc46d59d940aaec69553e49bd51293f4f8968eb5a22ec2df67d325d292a1f8e0d9a2eb";

function decrypt(text) {
  try {
    const parts = text.split(":");
    const iv = Buffer.from(parts[0], "hex");
    const authTag = Buffer.from(parts[1], "hex");
    const encrypted = parts[2];
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (e) {
    console.error("Decryption failed:", e.message);
    return null;
  }
}

console.log(decrypt(ciphertext));
