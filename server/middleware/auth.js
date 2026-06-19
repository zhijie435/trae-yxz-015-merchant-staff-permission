const employeeModel = require('../models/employee');
const authController = require('../controllers/authController');

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
    const tokenData = authController.verifyToken(token);

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

    req.employee = employee;
    req.employeeId = employee.id;
    req.isManager = employee.role === 'manager';
    
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

module.exports = authMiddleware;
