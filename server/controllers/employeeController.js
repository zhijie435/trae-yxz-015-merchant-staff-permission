const employeeService = require('../services/employeeService');
const permissionService = require('../services/permissionService');
const dataIsolationService = require('../services/dataIsolationService');
const auditService = require('../services/auditService');

class EmployeeController {
  async getEmployees(req, res) {
    try {
      const { storeId, includePending, includeRejected } = req.query;

      if (!storeId) {
        return res.status(400).json({
          success: false,
          message: '门店ID不能为空'
        });
      }

      const storeAccess = dataIsolationService.validateStoreAccess(req.employee, storeId);
      if (!storeAccess.valid) {
        return res.status(403).json({
          success: false,
          message: storeAccess.message
        });
      }

      const employees = employeeService.findByStoreId(storeId, {
        includePending: includePending === 'true',
        includeRejected: includeRejected === 'true'
      });

      const filteredEmployees = req.isManager
        ? employees
        : employees.filter(emp => emp.id === req.employeeId);

      res.json({
        success: true,
        data: filteredEmployees,
        total: filteredEmployees.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取员工列表失败',
        error: error.message
      });
    }
  }

  async getPendingEmployees(req, res) {
    try {
      const { storeId } = req.query;

      if (!storeId) {
        return res.status(400).json({
          success: false,
          message: '门店ID不能为空'
        });
      }

      if (!req.isManager) {
        return res.status(403).json({
          success: false,
          message: '只有管理员可以查看待审核员工'
        });
      }

      const storeAccess = dataIsolationService.validateStoreAccess(req.employee, storeId);
      if (!storeAccess.valid) {
        return res.status(403).json({
          success: false,
          message: storeAccess.message
        });
      }

      const employees = employeeService.findPendingByStoreId(storeId);

      res.json({
        success: true,
        data: employees,
        total: employees.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取待审核员工列表失败',
        error: error.message
      });
    }
  }

  async getApprovedEmployees(req, res) {
    try {
      const { storeId } = req.query;

      if (!storeId) {
        return res.status(400).json({
          success: false,
          message: '门店ID不能为空'
        });
      }

      const storeAccess = dataIsolationService.validateStoreAccess(req.employee, storeId);
      if (!storeAccess.valid) {
        return res.status(403).json({
          success: false,
          message: storeAccess.message
        });
      }

      const employees = employeeService.findApprovedByStoreId(storeId);

      res.json({
        success: true,
        data: employees,
        total: employees.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取已审核员工列表失败',
        error: error.message
      });
    }
  }

  async getEmployeeStats(req, res) {
    try {
      const { storeId } = req.query;

      if (!storeId) {
        return res.status(400).json({
          success: false,
          message: '门店ID不能为空'
        });
      }

      if (!req.isManager) {
        return res.status(403).json({
          success: false,
          message: '只有管理员可以查看员工统计'
        });
      }

      const storeAccess = dataIsolationService.validateStoreAccess(req.employee, storeId);
      if (!storeAccess.valid) {
        return res.status(403).json({
          success: false,
          message: storeAccess.message
        });
      }

      const stats = employeeService.getAccountStatusCounts(storeId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取员工统计失败',
        error: error.message
      });
    }
  }

  async getEmployeeById(req, res) {
    try {
      const { id } = req.params;
      const employee = employeeService.findById(id);

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: '员工不存在'
        });
      }

      const accessCheck = dataIsolationService.canAccessEmployee(req.employee, employee);
      if (!accessCheck) {
        return res.status(403).json({
          success: false,
          message: '无权限访问此员工信息'
        });
      }

      res.json({
        success: true,
        data: employee
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取员工信息失败',
        error: error.message
      });
    }
  }

  async createEmployee(req, res) {
    try {
      const { name, phone, role, password, storeId, idCardFront, idCardBack } = req.body;

      if (!name || !phone || !storeId) {
        return res.status(400).json({
          success: false,
          message: '姓名、手机号和门店ID不能为空'
        });
      }

      if (!req.isManager) {
        return res.status(403).json({
          success: false,
          message: '只有管理员可以创建员工'
        });
      }

      const storeAccess = dataIsolationService.validateStoreAccess(req.employee, storeId);
      if (!storeAccess.valid) {
        return res.status(403).json({
          success: false,
          message: '不能在其他门店创建员工'
        });
      }

      if (!idCardFront || !idCardBack) {
        return res.status(400).json({
          success: false,
          message: '身份证照片正反面都必须上传'
        });
      }

      const employee = await employeeService.createEmployee(
        { name, phone, role, password, storeId, idCardFront, idCardBack },
        req.employeeId
      );

      res.status(201).json({
        success: true,
        message: '员工创建成功，等待审核',
        data: employee
      });
    } catch (error) {
      if (error.message === '该手机号已注册') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: '创建员工失败',
        error: error.message
      });
    }
  }

  async updateEmployee(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const targetEmployee = employeeService.findById(id);
      if (!targetEmployee) {
        return res.status(404).json({
          success: false,
          message: '员工不存在'
        });
      }

      if (id === req.employeeId) {
        return res.status(403).json({
          success: false,
          message: '不能修改自己的账号信息'
        });
      }

      const manageCheck = dataIsolationService.canManageEmployee(
        req.employee,
        id,
        targetEmployee
      );

      if (!manageCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: manageCheck.reason
        });
      }

      if (updateData.role && updateData.role !== targetEmployee.role) {
        if (!req.isManager) {
          return res.status(403).json({
            success: false,
            message: '只有管理员可以修改员工角色'
          });
        }
      }

      const employee = await employeeService.updateEmployee(id, updateData, req.employeeId);

      res.json({
        success: true,
        message: '员工信息更新成功',
        data: employee
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '更新员工信息失败',
        error: error.message
      });
    }
  }

  async updatePassword(req, res) {
    try {
      const { id } = req.params;
      const { newPassword, currentPassword } = req.body;

      if (!newPassword) {
        return res.status(400).json({
          success: false,
          message: '新密码不能为空'
        });
      }

      if (id === req.employeeId) {
        if (!currentPassword) {
          return res.status(400).json({
            success: false,
            message: '修改自己的密码需要提供当前密码'
          });
        }
      }

      const result = await employeeService.updatePassword(id, newPassword, req.employeeId);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: '员工不存在'
        });
      }

      res.json({
        success: true,
        message: '密码更新成功',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '更新密码失败',
        error: error.message
      });
    }
  }

  async approveEmployee(req, res) {
    try {
      const { id } = req.params;

      const employee = employeeService.findById(id);
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: '员工不存在'
        });
      }

      const approveCheck = dataIsolationService.canApproveEmployee(req.employee, employee);
      if (!approveCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: approveCheck.reason
        });
      }

      const approvedEmployee = await employeeService.approveEmployee(id, req.employeeId);

      res.json({
        success: true,
        message: '员工审核已通过',
        data: approvedEmployee
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '审核通过操作失败',
        error: error.message
      });
    }
  }

  async rejectEmployee(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const employee = employeeService.findById(id);
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: '员工不存在'
        });
      }

      const approveCheck = dataIsolationService.canApproveEmployee(req.employee, employee);
      if (!approveCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: approveCheck.reason
        });
      }

      const rejectedEmployee = await employeeService.rejectEmployee(
        id,
        req.employeeId,
        reason || ''
      );

      res.json({
        success: true,
        message: '员工审核已拒绝',
        data: rejectedEmployee
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '审核拒绝操作失败',
        error: error.message
      });
    }
  }

  async activateEmployee(req, res) {
    try {
      const { id } = req.params;

      const employee = employeeService.findById(id);
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: '员工不存在'
        });
      }

      const manageCheck = dataIsolationService.canManageEmployee(
        req.employee,
        id,
        employee
      );

      if (!manageCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: manageCheck.reason
        });
      }

      const activatedEmployee = await employeeService.activateEmployee(id, req.employeeId);

      res.json({
        success: true,
        message: '员工账号已启用',
        data: activatedEmployee
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '启用员工失败',
        error: error.message
      });
    }
  }

  async deactivateEmployee(req, res) {
    try {
      const { id } = req.params;

      const employee = employeeService.findById(id);
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: '员工不存在'
        });
      }

      const manageCheck = dataIsolationService.canManageEmployee(
        req.employee,
        id,
        employee
      );

      if (!manageCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: manageCheck.reason
        });
      }

      const deactivatedEmployee = await employeeService.deactivateEmployee(id, req.employeeId);

      res.json({
        success: true,
        message: '员工账号已禁用',
        data: deactivatedEmployee
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '禁用员工失败',
        error: error.message
      });
    }
  }

  async toggleEmployeeStatus(req, res) {
    try {
      const { id } = req.params;

      const employee = employeeService.findById(id);
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: '员工不存在'
        });
      }

      const manageCheck = dataIsolationService.canManageEmployee(
        req.employee,
        id,
        employee
      );

      if (!manageCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: manageCheck.reason
        });
      }

      let result;
      if (employee.status === 'active') {
        result = await employeeService.deactivateEmployee(id, req.employeeId);
      } else {
        result = await employeeService.activateEmployee(id, req.employeeId);
      }

      const action = result.status === 'active' ? '启用' : '禁用';
      res.json({
        success: true,
        message: `员工账号已${action}`,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '更新员工状态失败',
        error: error.message
      });
    }
  }

  async deleteEmployee(req, res) {
    try {
      const { id } = req.params;

      const employee = employeeService.findById(id);
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: '员工不存在'
        });
      }

      const manageCheck = dataIsolationService.canManageEmployee(
        req.employee,
        id,
        employee
      );

      if (!manageCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: manageCheck.reason
        });
      }

      await employeeService.deleteEmployee(id, req.employeeId);

      res.json({
        success: true,
        message: '员工删除成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '删除员工失败',
        error: error.message
      });
    }
  }

  async updatePermissions(req, res) {
    try {
      const { id } = req.params;
      const { permissions } = req.body;

      if (!Array.isArray(permissions)) {
        return res.status(400).json({
          success: false,
          message: '权限必须是数组格式'
        });
      }

      const targetEmployee = employeeService.findById(id);
      if (!targetEmployee) {
        return res.status(404).json({
          success: false,
          message: '员工不存在'
        });
      }

      const manageCheck = dataIsolationService.canManageEmployee(
        req.employee,
        id,
        targetEmployee
      );

      if (!manageCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: manageCheck.reason
        });
      }

      const employee = await employeeService.updatePermissions(
        id,
        permissions,
        req.employeeId
      );

      res.json({
        success: true,
        message: '员工权限更新成功',
        data: employee
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '更新员工权限失败',
        error: error.message
      });
    }
  }

  async getPermissions(req, res) {
    try {
      const allPermissions = permissionService.getAllPermissions();
      const permissionGroups = permissionService.getPermissionGroups();
      const permissionDetails = permissionService.getAllPermissionDetails();

      res.json({
        success: true,
        data: {
          all: allPermissions,
          groups: permissionGroups,
          details: permissionDetails
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取权限列表失败',
        error: error.message
      });
    }
  }

  async getAuditLogs(req, res) {
    try {
      if (!req.isManager) {
        return res.status(403).json({
          success: false,
          message: '只有管理员可以查看审计日志'
        });
      }

      const { employeeId, action, limit } = req.query;

      const logs = auditService.getLogs({
        employeeId,
        action,
        limit: limit ? parseInt(limit) : 100
      });

      res.json({
        success: true,
        data: logs,
        total: logs.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取审计日志失败',
        error: error.message
      });
    }
  }
}

module.exports = new EmployeeController();
