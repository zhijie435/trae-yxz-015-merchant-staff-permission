const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const employeeModel = require('../models/employee');
const permissionService = require('./permissionService');
const auditService = require('./auditService');

const ACCOUNT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ACTIVE: 'active',
  INACTIVE: 'inactive'
};

const ROLES = {
  MANAGER: 'manager',
  STAFF: 'staff'
};

class EmployeeService {
  async createEmployee(employeeData, createdBy = null) {
    const existingEmployee = employeeModel.findByPhone(employeeData.phone);
    if (existingEmployee) {
      throw new Error('该手机号已注册');
    }

    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(employeeData.password || '123456', 10);

    const permissions = this.getInitialPermissions(employeeData.role);

    const employee = {
      id,
      name: employeeData.name,
      phone: employeeData.phone,
      password: hashedPassword,
      role: employeeData.role || ROLES.STAFF,
      storeId: employeeData.storeId || 'store001',
      avatar: employeeData.avatar || '',
      idCardFront: employeeData.idCardFront || '',
      idCardBack: employeeData.idCardBack || '',
      permissions,
      status: ACCOUNT_STATUS.PENDING,
      accountStatus: ACCOUNT_STATUS.PENDING,
      approvalStatus: ACCOUNT_STATUS.PENDING,
      createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      approvedAt: null,
      approvedBy: null,
      rejectedAt: null,
      rejectedBy: null,
      rejectionReason: null
    };

    employeeModel.employees.set(id, employee);

    if (auditService) {
      auditService.log({
        action: 'EMPLOYEE_CREATED',
        employeeId: id,
        createdBy,
        data: { name: employeeData.name, phone: employeeData.phone, role: employeeData.role }
      });
    }

    return this.formatEmployee(employee);
  }

  getInitialPermissions(role) {
    return permissionService.getRoleDefaultPermissions(role);
  }

  findByStoreId(storeId, options = {}) {
    const { includePending = false, includeRejected = false } = options;
    const results = [];

    employeeModel.employees.forEach(emp => {
      if (emp.storeId !== storeId) {
        return;
      }

      if (emp.approvalStatus === ACCOUNT_STATUS.APPROVED || includePending) {
        if (includeRejected || emp.approvalStatus !== ACCOUNT_STATUS.REJECTED) {
          results.push(this.formatEmployee(emp));
        }
      }
    });

    return results;
  }

  findPendingByStoreId(storeId) {
    const results = [];

    employeeModel.employees.forEach(emp => {
      if (emp.storeId === storeId && emp.approvalStatus === ACCOUNT_STATUS.PENDING) {
        results.push(this.formatEmployee(emp));
      }
    });

    return results;
  }

  findApprovedByStoreId(storeId) {
    const results = [];

    employeeModel.employees.forEach(emp => {
      if (emp.storeId === storeId && emp.approvalStatus === ACCOUNT_STATUS.APPROVED) {
        results.push(this.formatEmployee(emp));
      }
    });

    return results;
  }

  findActiveByStoreId(storeId) {
    const results = [];

    employeeModel.employees.forEach(emp => {
      if (emp.storeId === storeId &&
          emp.approvalStatus === ACCOUNT_STATUS.APPROVED &&
          emp.status === ACCOUNT_STATUS.ACTIVE) {
        results.push(this.formatEmployee(emp));
      }
    });

    return results;
  }

  async approveEmployee(employeeId, approvedBy) {
    const emp = employeeModel.employees.get(employeeId);
    if (!emp) {
      throw new Error('员工不存在');
    }

    if (emp.approvalStatus !== ACCOUNT_STATUS.PENDING) {
      throw new Error('该员工不需要审核');
    }

    emp.approvalStatus = ACCOUNT_STATUS.APPROVED;
    emp.status = ACCOUNT_STATUS.ACTIVE;
    emp.accountStatus = ACCOUNT_STATUS.ACTIVE;
    emp.approvedAt = new Date().toISOString();
    emp.approvedBy = approvedBy;
    emp.updatedAt = new Date().toISOString();

    employeeModel.employees.set(employeeId, emp);

    if (auditService) {
      auditService.log({
        action: 'EMPLOYEE_APPROVED',
        employeeId,
        performedBy: approvedBy,
        data: { previousStatus: ACCOUNT_STATUS.PENDING }
      });
    }

    return this.formatEmployee(emp);
  }

  async rejectEmployee(employeeId, rejectedBy, reason = '') {
    const emp = employeeModel.employees.get(employeeId);
    if (!emp) {
      throw new Error('员工不存在');
    }

    if (emp.approvalStatus !== ACCOUNT_STATUS.PENDING) {
      throw new Error('该员工不需要审核');
    }

    emp.approvalStatus = ACCOUNT_STATUS.REJECTED;
    emp.accountStatus = ACCOUNT_STATUS.REJECTED;
    emp.rejectedAt = new Date().toISOString();
    emp.rejectedBy = rejectedBy;
    emp.rejectionReason = reason;
    emp.updatedAt = new Date().toISOString();

    employeeModel.employees.set(employeeId, emp);

    if (auditService) {
      auditService.log({
        action: 'EMPLOYEE_REJECTED',
        employeeId,
        performedBy: rejectedBy,
        data: { reason }
      });
    }

    return this.formatEmployee(emp);
  }

  async activateEmployee(employeeId, activatedBy) {
    const emp = employeeModel.employees.get(employeeId);
    if (!emp) {
      throw new Error('员工不存在');
    }

    if (emp.approvalStatus !== ACCOUNT_STATUS.APPROVED) {
      throw new Error('只能启用已审核通过的员工');
    }

    emp.status = ACCOUNT_STATUS.ACTIVE;
    emp.accountStatus = ACCOUNT_STATUS.ACTIVE;
    emp.updatedAt = new Date().toISOString();

    employeeModel.employees.set(employeeId, emp);

    if (auditService) {
      auditService.log({
        action: 'EMPLOYEE_ACTIVATED',
        employeeId,
        performedBy: activatedBy
      });
    }

    return this.formatEmployee(emp);
  }

  async deactivateEmployee(employeeId, deactivatedBy) {
    const emp = employeeModel.employees.get(employeeId);
    if (!emp) {
      throw new Error('员工不存在');
    }

    if (emp.status === ACCOUNT_STATUS.INACTIVE) {
      throw new Error('该员工已经是禁用状态');
    }

    emp.status = ACCOUNT_STATUS.INACTIVE;
    emp.accountStatus = ACCOUNT_STATUS.INACTIVE;
    emp.updatedAt = new Date().toISOString();

    employeeModel.employees.set(employeeId, emp);

    if (auditService) {
      auditService.log({
        action: 'EMPLOYEE_DEACTIVATED',
        employeeId,
        performedBy: deactivatedBy
      });
    }

    return this.formatEmployee(emp);
  }

  async updatePermissions(employeeId, permissions, updatedBy) {
    const emp = employeeModel.employees.get(employeeId);
    if (!emp) {
      throw new Error('员工不存在');
    }

    const validPermissions = permissionService.validatePermissions(permissions);
    const previousPermissions = [...emp.permissions];

    emp.permissions = validPermissions;
    emp.updatedAt = new Date().toISOString();

    employeeModel.employees.set(employeeId, emp);

    if (auditService) {
      auditService.log({
        action: 'EMPLOYEE_PERMISSIONS_UPDATED',
        employeeId,
        performedBy: updatedBy,
        data: {
          previous: previousPermissions,
          current: validPermissions
        }
      });
    }

    return this.formatEmployee(emp);
  }

  async updateEmployee(employeeId, updateData, updatedBy) {
    const emp = employeeModel.employees.get(employeeId);
    if (!emp) {
      throw new Error('员工不存在');
    }

    if (updateData.name) emp.name = updateData.name;
    if (updateData.phone) emp.phone = updateData.phone;
    if (updateData.role) emp.role = updateData.role;
    if (updateData.avatar !== undefined) emp.avatar = updateData.avatar;
    if (updateData.idCardFront !== undefined) emp.idCardFront = updateData.idCardFront;
    if (updateData.idCardBack !== undefined) emp.idCardBack = updateData.idCardBack;

    emp.updatedAt = new Date().toISOString();

    employeeModel.employees.set(employeeId, emp);

    if (auditService) {
      auditService.log({
        action: 'EMPLOYEE_UPDATED',
        employeeId,
        performedBy: updatedBy,
        data: updateData
      });
    }

    return this.formatEmployee(emp);
  }

  async updatePassword(employeeId, newPassword, updatedBy) {
    const emp = employeeModel.employees.get(employeeId);
    if (!emp) {
      throw new Error('员工不存在');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    emp.password = hashedPassword;
    emp.updatedAt = new Date().toISOString();

    employeeModel.employees.set(employeeId, emp);

    if (auditService) {
      auditService.log({
        action: 'EMPLOYEE_PASSWORD_UPDATED',
        employeeId,
        performedBy: updatedBy
      });
    }

    return { id: emp.id, message: '密码更新成功' };
  }

  async deleteEmployee(employeeId, deletedBy) {
    const emp = employeeModel.employees.get(employeeId);
    if (!emp) {
      throw new Error('员工不存在');
    }

    employeeModel.employees.delete(employeeId);

    if (auditService) {
      auditService.log({
        action: 'EMPLOYEE_DELETED',
        employeeId,
        performedBy: deletedBy,
        data: { name: emp.name, phone: emp.phone }
      });
    }

    return { success: true };
  }

  findById(id) {
    const emp = employeeModel.employees.get(id);
    return emp ? this.formatEmployee(emp) : null;
  }

  findByPhone(phone) {
    let found = null;
    employeeModel.employees.forEach(emp => {
      if (emp.phone === phone) {
        found = emp;
      }
    });
    return found ? this.formatEmployee(found) : null;
  }

  canEmployeeLogin(employee) {
    if (!employee) {
      return { allowed: false, reason: '员工不存在' };
    }

    if (employee.approvalStatus !== ACCOUNT_STATUS.APPROVED) {
      return {
        allowed: false,
        reason: employee.approvalStatus === ACCOUNT_STATUS.PENDING
          ? '账号尚未审核通过，请等待管理员审核'
          : '账号审核未通过'
      };
    }

    if (employee.status !== ACCOUNT_STATUS.ACTIVE) {
      return { allowed: false, reason: '账号已被禁用，请联系管理员' };
    }

    return { allowed: true };
  }

  formatEmployee(emp) {
    const { password, ...formatted } = emp;
    return formatted;
  }

  getAccountStatusCounts(storeId) {
    const counts = {
      pending: 0,
      approved: 0,
      rejected: 0,
      active: 0,
      inactive: 0,
      total: 0
    };

    employeeModel.employees.forEach(emp => {
      if (emp.storeId !== storeId) {
        return;
      }

      counts.total++;
      counts[emp.approvalStatus]++;
      if (emp.approvalStatus === ACCOUNT_STATUS.APPROVED) {
        counts[emp.status]++;
      }
    });

    return counts;
  }
}

module.exports = new EmployeeService();
module.exports.ACCOUNT_STATUS = ACCOUNT_STATUS;
module.exports.ROLES = ROLES;
