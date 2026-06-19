const authService = require('../services/authService');
const employeeService = require('../services/employeeService');

function authMiddleware(req, res, next) {
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

    req.employee = employee;
    req.employeeId = employee.id;
    req.isManager = employee.role === 'manager';
    req.employeePermissions = employee.permissions;
    req.employeeStoreId = employee.storeId;

    next();
  } catch (error) {
    console.error('认证中间件错误:', error);
    return res.status(500).json({
      success: false,
      message: '认证失败',
      error: error.message
    });
  }
}

function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const tokenData = authService.verifyToken(token);

    if (!tokenData) {
      return next();
    }

    const employee = employeeService.findById(tokenData.employeeId);

    if (employee) {
      req.employee = employee;
      req.employeeId = employee.id;
      req.isManager = employee.role === 'manager';
      req.employeePermissions = employee.permissions;
      req.employeeStoreId = employee.storeId;
    }

    next();
  } catch (error) {
    next();
  }
}

function requireRefreshToken(req, res, next) {
  const refreshToken = req.body.refreshToken || req.query.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: '未提供刷新令牌'
    });
  }

  req.refreshToken = refreshToken;
  next();
}

module.exports = {
  authMiddleware,
  optionalAuth,
  requireRefreshToken,
  authService
};
