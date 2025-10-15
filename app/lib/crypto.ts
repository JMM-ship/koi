import crypto from 'crypto';

/**
 * 解密 API 密钥
 * @param encryptedPayload 加密的负载，格式为 "v1:iv:ciphertext:tag"
 * @param aad 附加认证数据（通常是 API key ID）
 * @returns 解密后的明文 API 密钥
 */
export function decryptApiKey(encryptedPayload: string, aad: string = ''): string {
  const key = getEncryptionKey();
  const [ver, ivB64, ctB64, tagB64] = String(encryptedPayload).split(':');

  if (ver !== 'v1') {
    throw new Error('unsupported envelope version');
  }

  const iv = Buffer.from(ivB64, 'base64');
  const ct = Buffer.from(ctB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  if (aad) decipher.setAAD(Buffer.from(aad));
  decipher.setAuthTag(tag);

  const p1 = decipher.update(ct);
  const p2 = decipher.final();

  return Buffer.concat([p1, p2]).toString('utf8');
}

/**
 * 从环境变量获取加密密钥
 * 优先使用 API_KEYS_ATREST_KEY，回退到 ENCRYPTION_KEY（通过 scrypt 派生）
 * @returns 32 字节的加密密钥
 */
function getEncryptionKey(): Buffer {
  // 优先使用专用的 API keys 加密密钥
  const apiKeysKey = process.env.API_KEYS_ATREST_KEY;
  if (apiKeysKey) {
    try {
      const key = Buffer.from(apiKeysKey, 'base64');
      if (key.length !== 32) {
        throw new Error(`API_KEYS_ATREST_KEY must be 32 bytes (got ${key.length} bytes)`);
      }
      return key;
    } catch (error) {
      throw new Error(`Invalid API_KEYS_ATREST_KEY: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 回退：使用 ENCRYPTION_KEY 通过 scrypt 派生
  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (encryptionKey) {
    // 使用 scrypt 派生 32 字节密钥
    // 注意：这里使用固定盐值，实际生产环境应该使用更安全的方式
    const salt = 'api-keys-at-rest'; // 与原始脚本保持一致
    try {
      return crypto.scryptSync(encryptionKey, salt, 32);
    } catch (error) {
      throw new Error(`Failed to derive key from ENCRYPTION_KEY: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  throw new Error('Missing encryption key: API_KEYS_ATREST_KEY or ENCRYPTION_KEY must be set in environment variables');
}

/**
 * 加密 API 密钥（可选功能，用于生成加密的 key）
 * @param plaintext 明文 API 密钥
 * @param aad 附加认证数据（通常是 API key ID）
 * @returns 加密后的负载，格式为 "v1:iv:ciphertext:tag"
 */
export function encryptApiKey(plaintext: string, aad: string): string {
  const encryptionKey = getEncryptionKey();

  // 生成随机 IV（初始化向量）
  const iv = crypto.randomBytes(12); // GCM 推荐 12 字节 IV

  try {
    // 创建加密器（AES-256-GCM）
    const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv);

    // 设置附加认证数据（AAD）
    cipher.setAAD(Buffer.from(aad, 'utf8'));

    // 加密
    let ciphertext = cipher.update(plaintext, 'utf8');
    ciphertext = Buffer.concat([ciphertext, cipher.final()]);

    // 获取认证标签
    const tag = cipher.getAuthTag();

    // 返回格式化的加密负载（使用 Base64 编码）
    return `v1:${iv.toString('base64')}:${ciphertext.toString('base64')}:${tag.toString('base64')}`;
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
