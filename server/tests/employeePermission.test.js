const employeeModel = require('../models/employee');
const employeeService = require('../services/employeeService');
const permissionService = require('../services/permissionService');
const auditService = require('../services/auditService');

describe('员工权限修改功能测试', () => {
  let testEmployeeId;
  const updaterId = 'updater-id';

  beforeEach(async () => {
    employeeModel.employees.clear();
    auditService.clearLogs();

    const employeeData = {
      name: '待修改权限员工',
      phone: '13900000301',
      role: 'staff'
    };
    const result = await employeeService.createEmployee(employeeData);
    testEmployeeId = result.id;
  });

  test('成功修改员工权限', async () => {
    const newPermissions = ['cashier', 'product_view', 'inventory_view'];
    const result = await employeeService.updatePermissions(testEmployeeId, newPermissions, updaterId);

    expect(result).toBeDefined();
    expect(result.id).toBe(testEmployeeId);
    expect(result.permissions).toEqual(newPermissions);
  });

  test('权限修改应记录审计日志', async () => {
    const newPermissions = ['cashier', 'product_view'];
    await employeeService.updatePermissions(testEmployeeId, newPermissions, updaterId);

    const logs = auditService.getLogs({ action: 'EMPLOYEE_PERMISSIONS_UPDATED' });
    expect(logs.length).toBe(1);
    expect(logs[0].action).toBe('EMPLOYEE_PERMISSIONS_UPDATED');
    expect(logs[0].performedBy).toBe(updaterId);
    expect(logs[0].data.current).toEqual(newPermissions);
  });

  test('审计日志应记录修改前的权限', async () => {
    const newPermissions = ['cashier'];
    await employeeService.updatePermissions(testEmployeeId, newPermissions, updaterId);

    const logs = auditService.getLogs({ action: 'EMPLOYEE_PERMISSIONS_UPDATED' });
    const originalPermissions = permissionService.getDefaultPermissions();
    expect(logs[0].data.previous).toEqual(originalPermissions);
  });

  test('修改不存在的员工权限应抛出错误', async () => {
    await expect(employeeService.updatePermissions('non-existent-id', ['cashier'], updaterId))
      .rejects.toThrow('员工不存在');
  });

  test('应过滤无效权限', async () => {
    const mixedPermissions = ['cashier', 'invalid_permission', 'product_view'];
    const result = await employeeService.updatePermissions(testEmployeeId, mixedPermissions, updaterId);

    expect(result.permissions).not.toContain('invalid_permission');
    expect(result.permissions).toContain('cashier');
    expect(result.permissions).toContain('product_view');
  });

  test('清空员工权限应成功', async () => {
    const result = await employeeService.updatePermissions(testEmployeeId, [], updaterId);

    expect(result.permissions).toEqual([]);
  });

  test('更新员工权限时不应修改其他字段', async () => {
    const newPermissions = ['cashier', 'inventory_view'];
    const result = await employeeService.updatePermissions(testEmployeeId, newPermissions, updaterId);

    const originalEmployee = await employeeService.createEmployee({
      name: '测试',
      phone: '13900000302'
    });
    expect(result.name).toBe('待修改权限员工');
    expect(result.phone).toBe('13900000301');
    expect(result.role).toBe('staff');
  });

  test('员工角色变更不会自动重新分配权限', async () => {
    const newPermissions = ['cashier', 'product_view'];
    await employeeService.updatePermissions(testEmployeeId, newPermissions, updaterId);

    const updateResult = await employeeService.updateEmployee(testEmployeeId, { role: 'manager' }, updaterId);

    expect(updateResult.role).toBe('manager');
    expect(updateResult.permissions).toEqual(newPermissions);
  });

  test('更新员工信息应记录审计日志', async () => {
    await employeeService.updateEmployee(testEmployeeId, { name: '新名称' }, updaterId);

    const logs = auditService.getLogs({ action: 'EMPLOYEE_UPDATED' });
    expect(logs.length).toBe(1);
    expect(logs[0].action).toBe('EMPLOYEE_UPDATED');
  });

  test('更新不存在的员工应抛出错误', async () => {
    await expect(employeeService.updateEmployee('non-existent-id', { name: '新名称' }, updaterId))
      .rejects.toThrow('员工不存在');
  });

  test('可以部分更新员工信息', async () => {
    const result = await employeeService.updateEmployee(testEmployeeId, { name: '新名称' }, updaterId);

    expect(result.name).toBe('新名称');
    expect(result.phone).toBe('13900000301');
    expect(result.role).toBe('staff');
  });

  test('可以同时更新多个字段', async () => {
    const result = await employeeService.updateEmployee(testEmployeeId, {
      name: '新名称',
      phone: '13999999999',
      role: 'manager'
    }, updaterId);

    expect(result.name).toBe('新名称');
    expect(result.phone).toBe('13999999999');
    expect(result.role).toBe('manager');
  });
});
