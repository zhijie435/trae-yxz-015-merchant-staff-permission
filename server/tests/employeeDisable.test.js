const employeeModel = require('../models/employee');
const employeeService = require('../services/employeeService');
const auditService = require('../services/auditService');

describe('员工禁用功能测试', () => {
  let approvedEmployeeId;
  let deactivatorId = 'deactivator-id';

  beforeEach(async () => {
    employeeModel.employees.clear();
    auditService.clearLogs();

    const employeeData = {
      name: '待禁用员工',
      phone: '13900000201',
      role: 'staff'
    };
    const result = await employeeService.createEmployee(employeeData);
    approvedEmployeeId = result.id;
    await employeeService.approveEmployee(approvedEmployeeId, 'approver-id');
  });

  test('成功禁用已审核员工', async () => {
    const result = await employeeService.deactivateEmployee(approvedEmployeeId, deactivatorId);

    expect(result).toBeDefined();
    expect(result.id).toBe(approvedEmployeeId);
    expect(result.status).toBe('inactive');
    expect(result.accountStatus).toBe('inactive');
  });

  test('禁用员工时应记录审计日志', async () => {
    await employeeService.deactivateEmployee(approvedEmployeeId, deactivatorId);

    const logs = auditService.getLogs({ action: 'EMPLOYEE_DEACTIVATED' });
    expect(logs.length).toBe(1);
    expect(logs[0].action).toBe('EMPLOYEE_DEACTIVATED');
    expect(logs[0].performedBy).toBe(deactivatorId);
    expect(logs[0].employeeId).toBe(approvedEmployeeId);
  });

  test('禁用不存在的员工应抛出错误', async () => {
    await expect(employeeService.deactivateEmployee('non-existent-id', deactivatorId))
      .rejects.toThrow('员工不存在');
  });

  test('禁用已禁用的员工应抛出错误', async () => {
    await employeeService.deactivateEmployee(approvedEmployeeId, deactivatorId);

    await expect(employeeService.deactivateEmployee(approvedEmployeeId, deactivatorId))
      .rejects.toThrow('该员工已经是禁用状态');
  });

  test('禁用后员工不能登录', async () => {
    await employeeService.deactivateEmployee(approvedEmployeeId, deactivatorId);
    const employee = employeeService.findById(approvedEmployeeId);

    const loginCheck = employeeService.canEmployeeLogin(employee);
    expect(loginCheck.allowed).toBe(false);
    expect(loginCheck.reason).toBe('账号已被禁用，请联系管理员');
  });

  test('可以禁用未审核的员工', async () => {
    const pendingEmployeeData = {
      name: '待审核员工',
      phone: '13900000202',
      role: 'staff'
    };
    const pendingEmployee = await employeeService.createEmployee(pendingEmployeeData);

    const result = await employeeService.deactivateEmployee(pendingEmployee.id, deactivatorId);
    expect(result.status).toBe('inactive');
  });

  test('成功启用已禁用员工', async () => {
    await employeeService.deactivateEmployee(approvedEmployeeId, deactivatorId);

    const result = await employeeService.activateEmployee(approvedEmployeeId, 'activator-id');

    expect(result).toBeDefined();
    expect(result.id).toBe(approvedEmployeeId);
    expect(result.status).toBe('active');
    expect(result.accountStatus).toBe('active');
  });

  test('启用员工时应记录审计日志', async () => {
    await employeeService.deactivateEmployee(approvedEmployeeId, deactivatorId);
    await employeeService.activateEmployee(approvedEmployeeId, 'activator-id');

    const logs = auditService.getLogs({ action: 'EMPLOYEE_ACTIVATED' });
    expect(logs.length).toBe(1);
    expect(logs[0].action).toBe('EMPLOYEE_ACTIVATED');
  });

  test('启用后员工可以登录', async () => {
    await employeeService.deactivateEmployee(approvedEmployeeId, deactivatorId);
    await employeeService.activateEmployee(approvedEmployeeId, 'activator-id');
    const employee = employeeService.findById(approvedEmployeeId);

    const loginCheck = employeeService.canEmployeeLogin(employee);
    expect(loginCheck.allowed).toBe(true);
  });

  test('获取门店活跃员工列表应排除禁用员工', async () => {
    await employeeService.deactivateEmployee(approvedEmployeeId, deactivatorId);

    const activeEmployees = employeeService.findActiveByStoreId('store001');
    expect(activeEmployees.length).toBe(0);
  });

  test('禁用操作不应影响其他员工', async () => {
    const employee2Data = {
      name: '员工2',
      phone: '13900000203',
      role: 'staff'
    };
    const employee2 = await employeeService.createEmployee(employee2Data);
    await employeeService.approveEmployee(employee2.id, 'approver-id');

    await employeeService.deactivateEmployee(approvedEmployeeId, deactivatorId);

    const activeEmployees = employeeService.findActiveByStoreId('store001');
    expect(activeEmployees.length).toBe(1);
    expect(activeEmployees[0].id).toBe(employee2.id);
  });
});
