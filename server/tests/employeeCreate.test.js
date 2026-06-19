const bcrypt = require('bcryptjs');
const employeeModel = require('../models/employee');
const employeeService = require('../services/employeeService');
const permissionService = require('../services/permissionService');
const auditService = require('../services/auditService');

describe('员工新增功能测试', () => {
  beforeEach(() => {
    employeeModel.employees.clear();
    auditService.clearLogs();
  });

  test('成功创建新员工', async () => {
    const employeeData = {
      name: '测试员工',
      phone: '13900000001',
      role: 'staff',
      storeId: 'store001',
      password: 'password123'
    };

    const result = await employeeService.createEmployee(employeeData, 'creator-id');

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.name).toBe('测试员工');
    expect(result.phone).toBe('13900000001');
    expect(result.role).toBe('staff');
    expect(result.status).toBe('pending');
    expect(result.approvalStatus).toBe('pending');
    expect(result.password).toBeUndefined();
  });

  test('创建员工时手机号已存在应抛出错误', async () => {
    const employeeData1 = {
      name: '员工1',
      phone: '13900000002',
      role: 'staff'
    };
    await employeeService.createEmployee(employeeData1);

    const employeeData2 = {
      name: '员工2',
      phone: '13900000002',
      role: 'staff'
    };

    await expect(employeeService.createEmployee(employeeData2))
      .rejects.toThrow('该手机号已注册');
  });

  test('创建员工时应设置默认密码', async () => {
    const employeeData = {
      name: '测试员工',
      phone: '13900000003',
      role: 'staff'
    };

    const result = await employeeService.createEmployee(employeeData);
    const storedEmployee = employeeModel.employees.get(result.id);

    expect(storedEmployee.password).toBeDefined();
    const isDefaultPassword = await bcrypt.compare('123456', storedEmployee.password);
    expect(isDefaultPassword).toBe(true);
  });

  test('创建员工时应分配默认权限', async () => {
    const employeeData = {
      name: '测试员工',
      phone: '13900000004',
      role: 'staff'
    };

    const result = await employeeService.createEmployee(employeeData);
    expect(result.permissions).toEqual(permissionService.getDefaultPermissions());
  });

  test('创建经理角色员工应分配全部权限', async () => {
    const employeeData = {
      name: '测试经理',
      phone: '13900000005',
      role: 'manager'
    };

    const result = await employeeService.createEmployee(employeeData);
    expect(result.permissions).toEqual(permissionService.getAllPermissions());
  });

  test('创建员工时应记录审计日志', async () => {
    const employeeData = {
      name: '测试员工',
      phone: '13900000006',
      role: 'staff'
    };

    await employeeService.createEmployee(employeeData, 'creator-id');

    const logs = auditService.getLogs({ action: 'EMPLOYEE_CREATED' });
    expect(logs.length).toBe(1);
    expect(logs[0].action).toBe('EMPLOYEE_CREATED');
    expect(logs[0].performedBy).toBe('creator-id');
  });
});
