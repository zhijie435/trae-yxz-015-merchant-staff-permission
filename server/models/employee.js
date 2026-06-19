const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

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
        status: 'active',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        name: '李四',
        phone: '13800138002',
        role: 'staff',
        storeId: 'store001',
        status: 'active',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        name: '王五',
        phone: '13800138003',
        role: 'staff',
        storeId: 'store001',
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
      role: employeeData.role || 'staff',
      storeId: employeeData.storeId || 'store001',
      password: hashedPassword,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    this.employees.set(id, employee);
    return this.formatEmployee(employee);
  }

  findByStoreId(storeId) {
    const results = [];
    this.employees.forEach(emp => {
      if (emp.storeId === storeId) {
        results.push(this.formatEmployee(emp));
      }
    });
    return results;
  }

  findById(id) {
    const emp = this.employees.get(id);
    return emp ? this.formatEmployee(emp) : null;
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
