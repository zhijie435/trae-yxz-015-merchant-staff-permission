const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const permissionsConfig = require('../config/permissions');

class EmployeeModel {
  constructor() {
    this.employees = new Map();
    this.initializeData();
  }

  initializeData() {
    const initialEmployees = [
      {
        id: uuidv4(),
        name: '张三',
        phone: '13800138001',
        role: 'manager',
        storeId: 'store001',
        avatar: '',
        idCardFront: '',
        idCardBack: '',
        permissions: Object.values(permissionsConfig.PERMISSIONS),
        status: 'active',
        approvalStatus: 'approved',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        name: '李四',
        phone: '13800138002',
        role: 'staff',
        storeId: 'store001',
        avatar: '',
        idCardFront: '',
        idCardBack: '',
        permissions: permissionsConfig.DEFAULT_PERMISSIONS,
        status: 'active',
        approvalStatus: 'approved',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        name: '王五',
        phone: '13800138003',
        role: 'staff',
        storeId: 'store001',
        avatar: '',
        idCardFront: '',
        idCardBack: '',
        permissions: permissionsConfig.DEFAULT_PERMISSIONS,
        status: 'inactive',
        createdAt: new Date().toISOString()
      }
    ];

    initialEmployees.forEach(emp => {
      this.employees.set(emp.id, emp);
    });
  }

  async create(employeeData) {
    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(employeeData.password || '123456', 10);
    
    const employee = {
      id,
      name: employeeData.name,
      phone: employeeData.phone,
      password: hashedPassword,
      role: employeeData.role || 'staff',
      storeId: employeeData.storeId || 'store001',
      avatar: employeeData.avatar || '',
      idCardFront: employeeData.idCardFront || '',
      idCardBack: employeeData.idCardBack || '',
      permissions: employeeData.role === 'manager' 
        ? Object.values(permissionsConfig.PERMISSIONS) 
        : (employeeData.permissions || permissionsConfig.DEFAULT_PERMISSIONS),
      status: 'active',
      approvalStatus: 'pending',
      createdAt: new Date().toISOString()
    };

    this.employees.set(id, employee);
    return this.formatEmployee(employee);
  }

  findByStoreId(storeId, includePending = false) {
    const results = [];
    this.employees.forEach(emp => {
      if (emp.storeId === storeId) {
        if (includePending || emp.approvalStatus === 'approved') {
          results.push(this.formatEmployee(emp));
        }
      }
    });
    return results;
  }

  findPendingByStoreId(storeId) {
    const results = [];
    this.employees.forEach(emp => {
      if (emp.storeId === storeId && emp.approvalStatus === 'pending') {
        results.push(this.formatEmployee(emp));
      }
    });
    return results;
  }

  approve(id) {
    const emp = this.employees.get(id);
    if (!emp) {
      return null;
    }

    emp.approvalStatus = 'approved';
    this.employees.set(id, emp);
    return this.formatEmployee(emp);
  }

  reject(id) {
    const emp = this.employees.get(id);
    if (!emp) {
      return null;
    }

    emp.approvalStatus = 'rejected';
    this.employees.set(id, emp);
    return this.formatEmployee(emp);
  }

  findById(id) {
    const emp = this.employees.get(id);
    return emp ? this.formatEmployee(emp) : null;
  }

  findByPhone(phone) {
    let found = null;
    this.employees.forEach(emp => {
      if (emp.phone === phone) {
        found = emp;
      }
    });
    return found ? this.formatEmployee(found) : null;
  }

  async update(id, updateData) {
    const emp = this.employees.get(id);
    if (!emp) {
      return null;
    }

    if (updateData.name) emp.name = updateData.name;
    if (updateData.phone) emp.phone = updateData.phone;
    if (updateData.role) emp.role = updateData.role;
    if (updateData.status) emp.status = updateData.status;
    if (updateData.avatar !== undefined) emp.avatar = updateData.avatar;
    if (updateData.idCardFront !== undefined) emp.idCardFront = updateData.idCardFront;
    if (updateData.idCardBack !== undefined) emp.idCardBack = updateData.idCardBack;
    if (updateData.permissions !== undefined) emp.permissions = updateData.permissions;

    this.employees.set(id, emp);
    return this.formatEmployee(emp);
  }

  async updatePermissions(id, permissions) {
    const emp = this.employees.get(id);
    if (!emp) {
      return null;
    }

    const allPermissions = Object.values(permissionsConfig.PERMISSIONS);
    const validPermissions = permissions.filter(p => allPermissions.includes(p));

    emp.permissions = validPermissions;
    this.employees.set(id, emp);
    return this.formatEmployee(emp);
  }

  async updatePassword(id, newPassword) {
    const emp = this.employees.get(id);
    if (!emp) {
      return null;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    emp.password = hashedPassword;
    this.employees.set(id, emp);
    return { id: emp.id, message: '密码更新成功' };
  }

  toggleStatus(id) {
    const emp = this.employees.get(id);
    if (!emp) {
      return null;
    }

    emp.status = emp.status === 'active' ? 'inactive' : 'active';
    this.employees.set(id, emp);
    return this.formatEmployee(emp);
  }

  delete(id) {
    return this.employees.delete(id);
  }

  formatEmployee(emp) {
    const { password, ...formatted } = emp;
    return formatted;
  }
}

module.exports = new EmployeeModel();
