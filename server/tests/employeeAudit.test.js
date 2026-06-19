const employeeModel = require('../models/employee');
const employeeService = require('../services/employeeService');
const auditService = require('../services/auditService');

describe('员工审核功能测试', () => {
  let testEmployeeId;

  beforeEach(async () => {
    employeeModel.employees.clear();
    auditService.clearLogs();

    const employeeData = {
      name: '待审核员工',
      phone: '13900000101',
      role: 'staff'
    };
    const result = await employeeService.createEmployee(employeeData);
    testEmployeeId = result.id;
  });

  test('成功审核通过员工', async () => {
    const result = await employeeService.approveEmployee(testEmployeeId, 'approver-id');

    expect(result).toBeDefined();
    expect(result.id).toBe(testEmployeeId);
    expect(result.approvalStatus).toBe('approved');
    expect(result.status).toBe('active');
    expect(result.accountStatus).toBe('active');
    expect(result.approvedAt).toBeDefined();
    expect(result.approvedBy).toBe('approver-id');
  });

  test('审核通过时应记录审计日志', async () => {
    await employeeService.approveEmployee(testEmployeeId, 'approver-id');

    const logs = auditService.getLogs({ action: 'EMPLOYEE_APPROVED' });
    expect(logs.length).toBe(1);
    expect(logs[0].action).toBe('EMPLOYEE_APPROVED');
    expect(logs[0].performedBy).toBe('approver-id');
    expect(logs[0].employeeId).toBe(testEmployeeId);
  });

  test('审核不存在的员工应抛出错误', async () => {
    await expect(employeeService.approveEmployee('non-existent-id', 'approver-id'))
      .rejects.toThrow('员工不存在');
  });

  test('审核已审核的员工应抛出错误', async () => {
    await employeeService.approveEmployee(testEmployeeId, 'approver-id');

    await expect(employeeService.approveEmployee(testEmployeeId, 'approver-id-2'))
      .rejects.toThrow('该员工不需要审核');
  });

  test('成功拒绝员工申请', async () => {
    const result = await employeeService.rejectEmployee(testEmployeeId, 'rejector-id', '资料不全');

    expect(result).toBeDefined();
    expect(result.id).toBe(testEmployeeId);
    expect(result.approvalStatus).toBe('rejected');
    expect(result.accountStatus).toBe('rejected');
    expect(result.rejectedAt).toBeDefined();
    expect(result.rejectedBy).toBe('rejector-id');
    expect(result.rejectionReason).toBe('资料不全');
  });

  test('拒绝员工时应记录审计日志', async () => {
    await employeeService.rejectEmployee(testEmployeeId, 'rejector-id', '资料不全');

    const logs = auditService.getLogs({ action: 'EMPLOYEE_REJECTED' });
    expect(logs.length).toBe(1);
    expect(logs[0].action).toBe('EMPLOYEE_REJECTED');
    expect(logs[0].performedBy).toBe('rejector-id');
    expect(logs[0].data.reason).toBe('资料不全');
  });

  test('拒绝不存在的员工应抛出错误', async () => {
    await expect(employeeService.rejectEmployee('non-existent-id', 'rejector-id'))
      .rejects.toThrow('员工不存在');
  });

  test('拒绝已审核的员工应抛出错误', async () => {
    await employeeService.approveEmployee(testEmployeeId, 'approver-id');

    await expect(employeeService.rejectEmployee(testEmployeeId, 'rejector-id'))
      .rejects.toThrow('该员工不需要审核');
  });

  test('获取门店待审核员工列表', async () => {
    await employeeService.createEmployee({
      name: '待审核员工2',
      phone: '13900000102',
      role: 'staff'
    });

    const pendingEmployees = employeeService.findPendingByStoreId('store001');
    expect(pendingEmployees.length).toBe(2);
    expect(pendingEmployees.every(e => e.approvalStatus === 'pending')).toBe(true);
  });

  test('获取门店已审核员工列表', async () => {
    await employeeService.approveEmployee(testEmployeeId, 'approver-id');

    const approvedEmployees = employeeService.findApprovedByStoreId('store001');
    expect(approvedEmployees.length).toBe(1);
    expect(approvedEmployees[0].approvalStatus).toBe('approved');
  });

  test('审核后员工应能登录', async () => {
    await employeeService.approveEmployee(testEmployeeId, 'approver-id');
    const employee = employeeService.findById(testEmployeeId);

    const loginCheck = employeeService.canEmployeeLogin(employee);
    expect(loginCheck.allowed).toBe(true);
  });
});
