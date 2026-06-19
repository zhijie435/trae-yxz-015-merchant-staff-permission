const permissionService = require('./permissionService');

class DataIsolationService {
  constructor() {
    this.resourceTypes = {
      TASK: 'task',
      EMPLOYEE: 'employee',
      REPORT: 'report',
      SETTINGS: 'settings',
      INVENTORY: 'inventory',
      PRODUCT: 'product',
      CUSTOMER: 'customer'
    };
  }

  canAccessEmployee(requester, targetEmployee) {
    if (requester.role === 'manager' && requester.storeId === targetEmployee.storeId) {
      return true;
    }

    if (requester.id === targetEmployee.id) {
      return true;
    }

    if (permissionService.hasPermission(requester.permissions, 'employee_view')) {
      if (requester.storeId === targetEmployee.storeId) {
        return true;
      }
    }

    return false;
  }

  canAccessTask(requester, task) {
    if (requester.storeId !== task.storeId) {
      return false;
    }

    if (requester.role === 'manager') {
      return true;
    }

    if (task.assigneeId === requester.id) {
      return true;
    }

    if (task.creatorId === requester.id) {
      return true;
    }

    return false;
  }

  canCreateTask(requester, taskData) {
    if (requester.storeId !== taskData.storeId) {
      return { allowed: false, reason: '不能在其他门店创建任务' };
    }

    if (requester.role !== 'manager') {
      return { allowed: false, reason: '只有管理员可以创建任务' };
    }

    return { allowed: true };
  }

  canUpdateTask(requester, task) {
    if (requester.storeId !== task.storeId) {
      return { allowed: false, reason: '不能操作其他门店的任务' };
    }

    if (requester.role === 'manager') {
      return { allowed: true };
    }

    if (task.assigneeId !== requester.id) {
      return { allowed: false, reason: '只能更新分配给自己的任务' };
    }

    return { allowed: true };
  }

  canDeleteTask(requester, task) {
    if (requester.storeId !== task.storeId) {
      return { allowed: false, reason: '不能删除其他门店的任务' };
    }

    if (requester.role === 'manager') {
      return { allowed: true };
    }

    return { allowed: false, reason: '只有管理员可以删除任务' };
  }

  canAssignTask(requester, task, targetEmployeeId) {
    if (requester.storeId !== task.storeId) {
      return { allowed: false, reason: '不能跨门店指派任务' };
    }

    if (requester.role !== 'manager') {
      return { allowed: false, reason: '只有管理员可以指派任务' };
    }

    return { allowed: true };
  }

  canAccessReport(requester, reportStoreId) {
    if (requester.storeId !== reportStoreId) {
      return { allowed: false, reason: '不能访问其他门店的报表' };
    }

    if (permissionService.hasPermission(requester.permissions, 'report_view')) {
      return { allowed: true };
    }

    return { allowed: false, reason: '没有查看报表的权限' };
  }

  canExportReport(requester, reportStoreId) {
    if (requester.storeId !== reportStoreId) {
      return { allowed: false, reason: '不能导出其他门店的报表' };
    }

    if (permissionService.hasPermission(requester.permissions, 'report_export')) {
      return { allowed: true };
    }

    return { allowed: false, reason: '没有导出报表的权限' };
  }

  canManageEmployee(requester, targetEmployeeId, targetEmployee) {
    if (requester.storeId !== targetEmployee.storeId) {
      return { allowed: false, reason: '不能管理其他门店的员工' };
    }

    if (requester.role !== 'manager') {
      return { allowed: false, reason: '只有管理员可以管理员工' };
    }

    if (requester.id === targetEmployeeId) {
      return { allowed: false, reason: '不能管理自己的账号' };
    }

    return { allowed: true };
  }

  canApproveEmployee(requester, targetEmployee) {
    if (requester.storeId !== targetEmployee.storeId) {
      return { allowed: false, reason: '不能审核其他门店的员工' };
    }

    if (requester.role !== 'manager') {
      return { allowed: false, reason: '只有管理员可以审核员工' };
    }

    if (targetEmployee.approvalStatus !== 'pending') {
      return { allowed: false, reason: '该员工不需要审核' };
    }

    return { allowed: true };
  }

  canAccessSettings(requester, settingsStoreId) {
    if (requester.storeId !== settingsStoreId) {
      return { allowed: false, reason: '不能访问其他门店的设置' };
    }

    if (permissionService.hasPermission(requester.permissions, 'settings_view') ||
        permissionService.hasPermission(requester.permissions, 'settings_manage')) {
      return { allowed: true };
    }

    return { allowed: false, reason: '没有访问设置的权限' };
  }

  canManageSettings(requester, settingsStoreId) {
    if (requester.storeId !== settingsStoreId) {
      return { allowed: false, reason: '不能管理其他门店的设置' };
    }

    if (permissionService.hasPermission(requester.permissions, 'settings_manage')) {
      return { allowed: true };
    }

    return { allowed: false, reason: '没有管理设置的权限' };
  }

  filterEmployeeList(requester, employees) {
    return employees.filter(emp => {
      if (requester.role === 'manager' && requester.storeId === emp.storeId) {
        return true;
      }

      if (requester.id === emp.id) {
        return true;
      }

      return false;
    });
  }

  filterTaskList(requester, tasks) {
    return tasks.filter(task => {
      if (requester.storeId !== task.storeId) {
        return false;
      }

      if (requester.role === 'manager') {
        return true;
      }

      if (task.assigneeId === requester.id || task.creatorId === requester.id) {
        return true;
      }

      return false;
    });
  }

  addStoreFilter(query, storeId) {
    return { ...query, storeId };
  }

  validateStoreAccess(requester, targetStoreId) {
    if (requester.storeId !== targetStoreId) {
      return {
        valid: false,
        message: '无权访问该门店的数据'
      };
    }
    return { valid: true };
  }
}

module.exports = new DataIsolationService();
