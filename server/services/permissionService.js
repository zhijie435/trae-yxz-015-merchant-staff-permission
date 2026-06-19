const permissionsConfig = require('./permissions');

class PermissionService {
  constructor() {
    this.permissions = permissionsConfig.PERMISSIONS;
    this.permissionGroups = permissionsConfig.PERMISSION_GROUPS;
    this.permissionDetails = permissionsConfig.PERMISSION_DETAILS;
    this.defaultPermissions = permissionsConfig.DEFAULT_PERMISSIONS;
  }

  getAllPermissions() {
    return Object.values(this.permissions);
  }

  getPermissionDetails(permissionKey) {
    return this.permissionDetails[permissionKey] || null;
  }

  getAllPermissionDetails() {
    return this.permissionDetails;
  }

  getPermissionGroups() {
    return this.permissionGroups;
  }

  getDefaultPermissions() {
    return this.defaultPermissions;
  }

  hasPermission(userPermissions, requiredPermission) {
    if (!Array.isArray(userPermissions)) {
      return false;
    }
    return userPermissions.includes(requiredPermission);
  }

  hasAnyPermission(userPermissions, requiredPermissions) {
    if (!Array.isArray(userPermissions) || !Array.isArray(requiredPermissions)) {
      return false;
    }
    return requiredPermissions.some(permission => userPermissions.includes(permission));
  }

  hasAllPermissions(userPermissions, requiredPermissions) {
    if (!Array.isArray(userPermissions) || !Array.isArray(requiredPermissions)) {
      return false;
    }
    return requiredPermissions.every(permission => userPermissions.includes(permission));
  }

  hasGroupPermission(userPermissions, groupKey) {
    const group = this.permissionGroups[groupKey];
    if (!group) {
      return false;
    }
    return this.hasAllPermissions(userPermissions, group.permissions);
  }

  getMissingPermissions(userPermissions, requiredPermissions) {
    if (!Array.isArray(userPermissions)) {
      userPermissions = [];
    }
    if (!Array.isArray(requiredPermissions)) {
      requiredPermissions = [];
    }
    return requiredPermissions.filter(p => !userPermissions.includes(p));
  }

  validatePermissions(permissions) {
    const allPermissions = this.getAllPermissions();
    return permissions.filter(p => allPermissions.includes(p));
  }

  getRoleDefaultPermissions(role) {
    if (role === 'manager') {
      return this.getAllPermissions();
    }
    return this.defaultPermissions;
  }

  canManageEmployee(managerPermissions, targetEmployee, currentEmployeeId) {
    if (targetEmployee.id === currentEmployeeId) {
      return false;
    }

    if (managerPermissions.includes(this.permissions.EMPLOYEE_MANAGE)) {
      return true;
    }

    return false;
  }

  canViewEmployee(userPermissions, userId, targetEmployeeId, targetStoreId, userStoreId) {
    if (userPermissions.includes(this.permissions.EMPLOYEE_VIEW)) {
      if (userStoreId === targetStoreId) {
        return true;
      }
    }
    return false;
  }

  canUpdateTask(userPermissions, userRole, task, userId) {
    if (userRole === 'manager') {
      return true;
    }

    if (task.assigneeId === userId) {
      return true;
    }

    return false;
  }

  canAssignTask(userPermissions, userRole) {
    if (userRole === 'manager') {
      return true;
    }

    return false;
  }

  canExportReport(userPermissions) {
    return userPermissions.includes(this.permissions.REPORT_EXPORT);
  }

  canViewReport(userPermissions) {
    return userPermissions.includes(this.permissions.REPORT_VIEW);
  }

  canManageSettings(userPermissions) {
    return userPermissions.includes(this.permissions.SETTINGS_MANAGE);
  }

  canViewSettings(userPermissions) {
    return userPermissions.includes(this.permissions.SETTINGS_VIEW) ||
           userPermissions.includes(this.permissions.SETTINGS_MANAGE);
  }
}

module.exports = new PermissionService();
