const verificationCodeModel = require('../models/verificationCode');
const employeeModel = require('../models/employee');
const authService = require('../services/authService');
const employeeService = require('../services/employeeService');
const auditService = require('../services/auditService');

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

      const loginCheck = employeeService.canEmployeeLogin(employee);
      if (!loginCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: loginCheck.reason
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

      try {
        const result = await authService.authenticate(phone, null, code, verificationCodeModel);

        res.json({
          success: true,
          message: '登录成功',
          data: result
        });
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: error.message
        });
      }
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

      try {
        const result = await authService.authenticate(phone, password, null, null);

        res.json({
          success: true,
          message: '登录成功',
          data: result
        });
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: error.message
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '登录失败',
        error: error.message
      });
    }
  }

  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: '刷新令牌不能为空'
        });
      }

      try {
        const result = await authService.refreshTokens(refreshToken);

        res.json({
          success: true,
          message: '令牌刷新成功',
          data: result
        });
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: error.message
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '令牌刷新失败',
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
      const tokenData = authService.verifyToken(token);

      if (!tokenData) {
        return res.status(401).json({
          success: false,
          message: '令牌无效或已过期'
        });
      }

      const employee = employeeService.findById(tokenData.employeeId);
      if (!employee) {
        return res.status(401).json({
          success: false,
          message: '用户不存在'
        });
      }

      const loginCheck = employeeService.canEmployeeLogin(employee);
      if (!loginCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: loginCheck.reason
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
          },
          expiresAt: tokenData.expiresAt
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

  async logout(req, res) {
    try {
      if (req.employee) {
        auditService.log({
          action: 'LOGOUT',
          employeeId: req.employee.id,
          data: { timestamp: new Date().toISOString() }
        });
      }

      res.json({
        success: true,
        message: '登出成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '登出失败',
        error: error.message
      });
    }
  }
}

module.exports = new AuthController();
