const permissionService = require('../services/permissionService');
const dataIsolationService = require('../services/dataIsolationService');

function createPermissionMiddleware(requiredPermissions, options = {}) {
  const { requireAll = false, allowSelf = true } = options;

  return (req, res, next) => {
    if (!req.employee) {
      return res.status(401).json({
        success: false,
        message: '未认证'
      });
    }

    const employee = req.employee;

    if (allowSelf && req.params.id === employee.id) {
      return next();
    }

    let hasPermission;

    if (requireAll) {
      hasPermission = permissionService.hasAllPermissions(
        employee.permissions,
        requiredPermissions
      );
    } else {
      hasPermission = permissionService.hasAnyPermission(
        employee.permissions,
        requiredPermissions
      );
    }

    if (!hasPermission) {
      const missingPermissions = permissionService.getMissingPermissions(
        employee.permissions,
        requiredPermissions
      );

      return res.status(403).json({
        success: false,
        message: '没有权限执行此操作',
        missingPermissions
      });
    }

    next();
  };
}

function requirePermission(...permissions) {
  return createPermissionMiddleware(permissions, { requireAll: false });
}

function requireAllPermissions(...permissions) {
  return createPermissionMiddleware(permissions, { requireAll: true });
}

function requireManager(req, res, next) {
  if (!req.employee) {
    return res.status(401).json({
      success: false,
      message: '未认证'
    });
  }

  if (req.employee.role !== 'manager') {
    return res.status(403).json({
      success: false,
      message: '需要管理员权限'
    });
  }

  next();
}

function requireEmployeeViewPermission(req, res, next) {
  if (!req.employee) {
    return res.status(401).json({
      success: false,
      message: '未认证'
    });
  }

  const employee = req.employee;

  if (employee.role === 'manager') {
    return next();
  }

  if (permissionService.hasPermission(employee.permissions, 'employee_view')) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: '没有查看员工的权限'
  });
}

function requireEmployeeManagePermission(req, res, next) {
  if (!req.employee) {
    return res.status(401).json({
      success: false,
      message: '未认证'
    });
  }

  const employee = req.employee;

  if (employee.role !== 'manager') {
    return res.status(403).json({
      success: false,
      message: '需要管理员权限'
    });
  }

  next();
}

function requireTaskPermission(req, res, next) {
  if (!req.employee) {
    return res.status(401).json({
      success: false,
      message: '未认证'
    });
  }

  next();
}

function requireReportPermission(req, res, next) {
  if (!req.employee) {
    return res.status(401).json({
      success: false,
      message: '未认证'
    });
  }

  const employee = req.employee;

  if (employee.role === 'manager') {
    return next();
  }

  if (permissionService.hasPermission(employee.permissions, 'report_view')) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: '没有查看报表的权限'
  });
}

function requireReportExportPermission(req, res, next) {
  if (!req.employee) {
    return res.status(401).json({
      success: false,
      message: '未认证'
    });
  }

  const employee = req.employee;

  if (employee.role === 'manager') {
    return next();
  }

  if (permissionService.hasPermission(employee.permissions, 'report_export')) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: '没有导出报表的权限'
  });
}

function requireSettingsPermission(req, res, next) {
  if (!req.employee) {
    return res.status(401).json({
      success: false,
      message: '未认证'
    });
  }

  const employee = req.employee;

  if (employee.role === 'manager') {
    return next();
  }

  if (permissionService.hasPermission(employee.permissions, 'settings_view') ||
      permissionService.hasPermission(employee.permissions, 'settings_manage')) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: '没有访问设置的权限'
  });
}

function validateStoreAccess(req, res, next) {
  if (!req.employee) {
    return res.status(401).json({
      success: false,
      message: '未认证'
    });
  }

  const storeId = req.query.storeId || req.body.storeId || req.params.storeId;

  if (storeId && storeId !== req.employee.storeId) {
    return res.status(403).json({
      success: false,
      message: '无权访问该门店的数据'
    });
  }

  next();
}

function validateDataAccess(req, res, next) {
  if (!req.employee) {
    return res.status(401).json({
      success: false,
      message: '未认证'
    });
  }

  if (req.params.id) {
    req.targetResource = { id: req.params.id };
  }

  next();
}

module.exports = {
  createPermissionMiddleware,
  requirePermission,
  requireAllPermissions,
  requireManager,
  requireEmployeeViewPermission,
  requireEmployeeManagePermission,
  requireTaskPermission,
  requireReportPermission,
  requireReportExportPermission,
  requireSettingsPermission,
  validateStoreAccess,
  validateDataAccess,
  permissionService,
  dataIsolationService
};
