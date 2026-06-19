const crypto = require('crypto');
const employeeService = require('./employeeService');
const auditService = require('./auditService');

const TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000;
const REFRESH_TOKEN_EXPIRY = 30 * 24 * 60 * 60 * 1000;

class AuthService {
  constructor() {
    this.secretKey = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  }

  generateToken(employee) {
    const payload = {
      employeeId: employee.id,
      phone: employee.phone,
      role: employee.role,
      storeId: employee.storeId,
      permissions: employee.permissions,
      iat: Date.now(),
      exp: Date.now() + TOKEN_EXPIRY
    };

    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const headerBase64 = this.base64UrlEncode(JSON.stringify(header));
    const payloadBase64 = this.base64UrlEncode(JSON.stringify(payload));

    const signature = this.generateSignature(`${headerBase64}.${payloadBase64}`);

    return `${headerBase64}.${payloadBase64}.${signature}`;
  }

  generateRefreshToken(employee) {
    const payload = {
      employeeId: employee.id,
      type: 'refresh',
      iat: Date.now(),
      exp: Date.now() + REFRESH_TOKEN_EXPIRY
    };

    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const headerBase64 = this.base64UrlEncode(JSON.stringify(header));
    const payloadBase64 = this.base64UrlEncode(JSON.stringify(payload));

    const signature = this.generateSignature(`${headerBase64}.${payloadBase64}`);

    return `${headerBase64}.${payloadBase64}.${signature}`;
  }

  verifyToken(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const [headerBase64, payloadBase64, signature] = parts;

      const expectedSignature = this.generateSignature(`${headerBase64}.${payloadBase64}`);
      if (signature !== expectedSignature) {
        console.error('Token signature verification failed');
        return null;
      }

      const payload = JSON.parse(this.base64UrlDecode(payloadBase64));

      if (Date.now() > payload.exp) {
        console.error('Token has expired');
        return null;
      }

      return {
        employeeId: payload.employeeId,
        phone: payload.phone,
        role: payload.role,
        storeId: payload.storeId,
        permissions: payload.permissions,
        issuedAt: payload.iat,
        expiresAt: payload.exp
      };
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }

  verifyRefreshToken(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const [headerBase64, payloadBase64, signature] = parts;

      const expectedSignature = this.generateSignature(`${headerBase64}.${payloadBase64}`);
      if (signature !== expectedSignature) {
        return null;
      }

      const payload = JSON.parse(this.base64UrlDecode(payloadBase64));

      if (Date.now() > payload.exp) {
        return null;
      }

      if (payload.type !== 'refresh') {
        return null;
      }

      return {
        employeeId: payload.employeeId,
        type: payload.type
      };
    } catch (error) {
      return null;
    }
  }

  generateSignature(data) {
    const hmac = crypto.createHmac('sha256', this.secretKey);
    hmac.update(data);
    return hmac.digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  base64UrlEncode(str) {
    return Buffer.from(str)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  base64UrlDecode(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
      str += '=';
    }
    return Buffer.from(str, 'base64').toString('utf-8');
  }

  async authenticate(phone, password = null, code = null, verificationService = null) {
    const employee = employeeService.findByPhone(phone);

    if (!employee) {
      throw new Error('该手机号未注册');
    }

    const loginCheck = employeeService.canEmployeeLogin(employee);
    if (!loginCheck.allowed) {
      throw new Error(loginCheck.reason);
    }

    if (password) {
      const bcrypt = require('bcryptjs');
      const emp = employeeService.findById(employee.id);
      const isPasswordValid = await bcrypt.compare(password, emp.password);
      if (!isPasswordValid) {
        auditService.log({
          action: 'LOGIN_FAILED',
          employeeId: employee.id,
          data: { reason: 'invalid_password' }
        });
        throw new Error('密码错误');
      }
    }

    if (code && verificationService) {
      if (!verificationService.verifyCode(phone, code)) {
        auditService.log({
          action: 'LOGIN_FAILED',
          employeeId: employee.id,
          data: { reason: 'invalid_code' }
        });
        throw new Error('验证码错误或已过期');
      }
    }

    const token = this.generateToken(employee);
    const refreshToken = this.generateRefreshToken(employee);

    auditService.log({
      action: 'LOGIN_SUCCESS',
      employeeId: employee.id,
      data: { method: password ? 'password' : 'code' }
    });

    return {
      token,
      refreshToken,
      expiresIn: TOKEN_EXPIRY,
      employee: {
        id: employee.id,
        name: employee.name,
        phone: employee.phone,
        role: employee.role,
        storeId: employee.storeId,
        avatar: employee.avatar,
        permissions: employee.permissions
      }
    };
  }

  async refreshTokens(refreshToken) {
    const tokenData = this.verifyRefreshToken(refreshToken);

    if (!tokenData) {
      throw new Error('Refresh token无效或已过期');
    }

    const employee = employeeService.findById(tokenData.employeeId);

    if (!employee) {
      throw new Error('用户不存在');
    }

    const loginCheck = employeeService.canEmployeeLogin(employee);
    if (!loginCheck.allowed) {
      throw new Error(loginCheck.reason);
    }

    const newToken = this.generateToken(employee);
    const newRefreshToken = this.generateRefreshToken(employee);

    return {
      token: newToken,
      refreshToken: newRefreshToken,
      expiresIn: TOKEN_EXPIRY
    };
  }

  getEmployeeFromToken(token) {
    const tokenData = this.verifyToken(token);

    if (!tokenData) {
      return null;
    }

    return employeeService.findById(tokenData.employeeId);
  }
}

module.exports = new AuthService();
