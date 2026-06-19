const verificationCodeModel = require('../models/verificationCode');
const employeeModel = require('../models/employee');
const bcrypt = require('bcryptjs');

class AuthController {
  async sendVerificationCode(req, res) {
    try {
      const { phone } = req.body;

      if (!phone) {
        return res.status(400).json({
          success: false,
          message: '手机号不能为空'
        });
      }

      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          success: false,
          message: '请输入正确的手机号'
        });
      }

      const employee = employeeModel.findByPhone(phone);
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: '该手机号未注册'
        });
      }

      if (employee.approvalStatus !== 'approved') {
        return res.status(403).json({
          success: false,
          message: '账号尚未审核通过,请等待管理员审核'
        });
      }

      if (employee.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: '账号已被禁用,请联系管理员'
        });
      }

      const activeCode = verificationCodeModel.getActiveCode(phone);
      if (activeCode) {
        const remainingTime = Math.ceil((new Date(activeCode.expiresAt) - new Date()) / 1000);
        return res.status(429).json({
          success: false,
          message: `验证码已发送,请 ${remainingTime} 秒后再试`
        });
      }

      const result = verificationCodeModel.generateCode(phone);

      setTimeout(() => {
        verificationCodeModel.cleanup();
      }, 5 * 60 * 1000);

      res.json({
        success: true,
        message: '验证码发送成功',
        data: {
          expiresIn: 300,
          expiresAt: result.expiresAt
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '发送验证码失败',
        error: error.message
      });
    }
  }

  async loginWithCode(req, res) {
    try {
      const { phone, code } = req.body;

      if (!phone || !code) {
        return res.status(400).json({
          success: false,
          message: '手机号和验证码不能为空'
        });
      }

      const employee = employeeModel.findByPhone(phone);
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: '该手机号未注册'
        });
      }

      if (employee.approvalStatus !== 'approved') {
        return res.status(403).json({
          success: false,
          message: '账号尚未审核通过'
        });
      }

      if (employee.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: '账号已被禁用'
        });
      }

      if (!verificationCodeModel.verifyCode(phone, code)) {
        return res.status(401).json({
          success: false,
          message: '验证码错误或已过期'
        });
      }

      const token = this.generateToken(employee);

      res.json({
        success: true,
        message: '登录成功',
        data: {
          token,
          employee: {
            id: employee.id,
            name: employee.name,
            phone: employee.phone,
            role: employee.role,
            storeId: employee.storeId,
            avatar: employee.avatar,
            permissions: employee.permissions
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '登录失败',
        error: error.message
      });
    }
  }

  async loginWithPassword(req, res) {
    try {
      const { phone, password } = req.body;

      if (!phone || !password) {
        return res.status(400).json({
          success: false,
          message: '手机号和密码不能为空'
        });
      }

      const employee = employeeModel.findByPhone(phone);
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: '该手机号未注册'
        });
      }

      if (employee.approvalStatus !== 'approved') {
        return res.status(403).json({
          success: false,
          message: '账号尚未审核通过'
        });
      }

      if (employee.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: '账号已被禁用'
        });
      }

      const isPasswordValid = await bcrypt.compare(password, employee.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: '密码错误'
        });
      }

      const token = this.generateToken(employee);

      res.json({
        success: true,
        message: '登录成功',
        data: {
          token,
          employee: {
            id: employee.id,
            name: employee.name,
            phone: employee.phone,
            role: employee.role,
            storeId: employee.storeId,
            avatar: employee.avatar,
            permissions: employee.permissions
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '登录失败',
        error: error.message
      });
    }
  }

  async verifyToken(req, res) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: '未提供认证令牌'
        });
      }

      const token = authHeader.substring(7);
      const tokenData = this.verifyToken(token);

      if (!tokenData) {
        return res.status(401).json({
          success: false,
          message: '令牌无效或已过期'
        });
      }

      const employee = employeeModel.findById(tokenData.employeeId);
      if (!employee) {
        return res.status(401).json({
          success: false,
          message: '用户不存在'
        });
      }

      if (employee.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: '账号已被禁用，请联系管理员'
        });
      }

      res.json({
        success: true,
        data: {
          employee: {
            id: employee.id,
            name: employee.name,
            phone: employee.phone,
            role: employee.role,
            storeId: employee.storeId,
            avatar: employee.avatar,
            permissions: employee.permissions
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '验证失败',
        error: error.message
      });
    }
  }

  generateToken(employee) {
    const payload = {
      employeeId: employee.id,
      phone: employee.phone,
      role: employee.role,
      timestamp: Date.now()
    };
    
    const jsonString = JSON.stringify(payload);
    const base64 = Buffer.from(jsonString).toString('base64');
    return base64;
  }

  verifyToken(token) {
    try {
      const jsonString = Buffer.from(token, 'base64').toString('utf-8');
      const payload = JSON.parse(jsonString);
      
      const expiryTime = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - payload.timestamp > expiryTime) {
        return null;
      }
      
      return payload;
    } catch (error) {
      return null;
    }
  }
}

module.exports = new AuthController();
