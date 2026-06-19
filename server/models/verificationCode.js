const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

class VerificationCodeModel {
  constructor() {
    this.codes = new Map();
    this.verificationLogs = [];
  }

  generateCode(phone) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const id = uuidv4();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    this.codes.set(id, {
      id,
      phone,
      code,
      expiresAt,
      used: false,
      createdAt: new Date().toISOString()
    });

    this.verificationLogs.push({
      phone,
      code,
      type: 'generated',
      timestamp: new Date().toISOString()
    });

    console.log(`验证码已生成: ${code} (5分钟内有效)`);
    return { id, code, expiresAt };
  }

  verifyCode(phone, code) {
    let validCode = null;

    this.codes.forEach((codeData, id) => {
      if (codeData.phone === phone && 
          codeData.code === code && 
          !codeData.used &&
          new Date(codeData.expiresAt) > new Date()) {
        validCode = codeData;
      }
    });

    if (validCode) {
      validCode.used = true;
      this.verificationLogs.push({
        phone,
        code,
        type: 'verified',
        timestamp: new Date().toISOString()
      });
      return true;
    }

    this.verificationLogs.push({
      phone,
      code,
      type: 'failed',
      timestamp: new Date().toISOString()
    });
    return false;
  }

  getActiveCode(phone) {
    let activeCode = null;
    this.codes.forEach((codeData) => {
      if (codeData.phone === phone && 
          !codeData.used &&
          new Date(codeData.expiresAt) > new Date()) {
        activeCode = codeData;
      }
    });
    return activeCode;
  }

  cleanup() {
    const now = new Date();
    let count = 0;
    this.codes.forEach((codeData, id) => {
      if (new Date(codeData.expiresAt) < now || codeData.used) {
        this.codes.delete(id);
        count++;
      }
    });
    if (count > 0) {
      console.log(`清理了 ${count} 个过期验证码`);
    }
  }
}

module.exports = new VerificationCodeModel();
