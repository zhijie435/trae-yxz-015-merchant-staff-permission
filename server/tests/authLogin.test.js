const bcrypt = require('bcryptjs');
const employeeModel = require('../models/employee');
const employeeService = require('../services/employeeService');
const authService = require('../services/authService');
const auditService = require('../services/auditService');

describe('登录校验功能测试', () => {
  let testEmployeeId;
  const testPassword = 'testPassword123';

  beforeEach(async () => {
    employeeModel.employees.clear();
    auditService.clearLogs();

    const employeeData = {
      name: '测试员工',
      phone: '13900000401',
      role: 'staff',
      password: testPassword
    };
    const result = await employeeService.createEmployee(employeeData);
    testEmployeeId = result.id;
  });

  test('已审核且活跃的员工可以登录', async () => {
    await employeeService.approveEmployee(testEmployeeId, 'approver-id');
    const employee = employeeService.findById(testEmployeeId);

    const loginCheck = employeeService.canEmployeeLogin(employee);
    expect(loginCheck.allowed).toBe(true);
  });

  test('待审核员工不能登录', async () => {
    const employee = employeeService.findById(testEmployeeId);

    const loginCheck = employeeService.canEmployeeLogin(employee);
    expect(loginCheck.allowed).toBe(false);
    expect(loginCheck.reason).toBe('账号尚未审核通过，请等待管理员审核');
  });

  test('被拒绝的员工不能登录', async () => {
    await employeeService.rejectEmployee(testEmployeeId, 'rejector-id', '资料不全');
    const employee = employeeService.findById(testEmployeeId);

    const loginCheck = employeeService.canEmployeeLogin(employee);
    expect(loginCheck.allowed).toBe(false);
    expect(loginCheck.reason).toBe('账号审核未通过');
  });

  test('已禁用的员工不能登录', async () => {
    await employeeService.approveEmployee(testEmployeeId, 'approver-id');
    await employeeService.deactivateEmployee(testEmployeeId, 'deactivator-id');
    const employee = employeeService.findById(testEmployeeId);

    const loginCheck = employeeService.canEmployeeLogin(employee);
    expect(loginCheck.allowed).toBe(false);
    expect(loginCheck.reason).toBe('账号已被禁用，请联系管理员');
  });

  test('不存在的员工不能登录', () => {
    const loginCheck = employeeService.canEmployeeLogin(null);
    expect(loginCheck.allowed).toBe(false);
    expect(loginCheck.reason).toBe('员工不存在');
  });

  test('正确的密码可以登录', async () => {
    await employeeService.approveEmployee(testEmployeeId, 'approver-id');

    const result = await authService.authenticate('13900000401', testPassword);
    expect(result).toBeDefined();
    expect(result.token).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(result.employee).toBeDefined();
    expect(result.employee.id).toBe(testEmployeeId);
  });

  test('错误的密码不能登录', async () => {
    await employeeService.approveEmployee(testEmployeeId, 'approver-id');

    await expect(authService.authenticate('13900000401', 'wrongpassword'))
      .rejects.toThrow('密码错误');
  });

  test('登录失败应记录审计日志', async () => {
    await employeeService.approveEmployee(testEmployeeId, 'approver-id');

    try {
      await authService.authenticate('13900000401', 'wrongpassword');
    } catch (error) {
    }

    const logs = auditService.getLogs({ action: 'LOGIN_FAILED' });
    expect(logs.length).toBe(1);
    expect(logs[0].data.reason).toBe('invalid_password');
  });

  test('登录成功应记录审计日志', async () => {
    await employeeService.approveEmployee(testEmployeeId, 'approver-id');

    await authService.authenticate('13900000401', testPassword);

    const logs = auditService.getLogs({ action: 'LOGIN_SUCCESS' });
    expect(logs.length).toBe(1);
    expect(logs[0].data.method).toBe('password');
  });

  test('未注册的手机号不能登录', async () => {
    await expect(authService.authenticate('13900000999', 'password'))
      .rejects.toThrow('该手机号未注册');
  });

  test('登录返回的员工信息不包含密码', async () => {
    await employeeService.approveEmployee(testEmployeeId, 'approver-id');

    const result = await authService.authenticate('13900000401', testPassword);
    expect(result.employee.password).toBeUndefined();
  });

  test('登录返回的员工信息包含必要字段', async () => {
    await employeeService.approveEmployee(testEmployeeId, 'approver-id');

    const result = await authService.authenticate('13900000401', testPassword);
    expect(result.employee.id).toBeDefined();
    expect(result.employee.name).toBe('测试员工');
    expect(result.employee.phone).toBe('13900000401');
    expect(result.employee.role).toBe('staff');
    expect(result.employee.storeId).toBeDefined();
    expect(result.employee.permissions).toBeDefined();
  });

  test('Token应该包含正确的载荷', async () => {
    await employeeService.approveEmployee(testEmployeeId, 'approver-id');

    const result = await authService.authenticate('13900000401', testPassword);
    const tokenData = authService.verifyToken(result.token);

    expect(tokenData).toBeDefined();
    expect(tokenData.employeeId).toBe(testEmployeeId);
    expect(tokenData.phone).toBe('13900000401');
    expect(tokenData.role).toBe('staff');
    expect(tokenData.storeId).toBeDefined();
    expect(tokenData.permissions).toBeDefined();
  });

  test('可以验证Token签名', async () => {
    await employeeService.approveEmployee(testEmployeeId, 'approver-id');

    const result = await authService.authenticate('13900000401', testPassword);
    const tokenData = authService.verifyToken(result.token);

    expect(tokenData).not.toBeNull();
  });

  test('无效的Token验证返回null', () => {
    const tokenData = authService.verifyToken('invalid.token.here');
    expect(tokenData).toBeNull();
  });

  test('过期的Token验证返回null', async () => {
    const originalExpiry = 7 * 24 * 60 * 60 * 1000;
    const shortExpiry = -1;

    const employee = employeeService.findById(testEmployeeId);
    const payload = {
      employeeId: employee.id,
      phone: employee.phone,
      role: employee.role,
      storeId: employee.storeId,
      permissions: employee.permissions,
      iat: Date.now(),
      exp: Date.now() + shortExpiry
    };

    const header = { alg: 'HS256', typ: 'JWT' };
    const headerBase64 = authService.base64UrlEncode(JSON.stringify(header));
    const payloadBase64 = authService.base64UrlEncode(JSON.stringify(payload));
    const signature = authService.generateSignature(`${headerBase64}.${payloadBase64}`);
    const expiredToken = `${headerBase64}.${payloadBase64}.${signature}`;

    const tokenData = authService.verifyToken(expiredToken);
    expect(tokenData).toBeNull();
  });

  test('RefreshToken应该可以验证', async () => {
    await employeeService.approveEmployee(testEmployeeId, 'approver-id');

    const result = await authService.authenticate('13900000401', testPassword);
    const refreshTokenData = authService.verifyRefreshToken(result.refreshToken);

    expect(refreshTokenData).toBeDefined();
    expect(refreshTokenData.employeeId).toBe(testEmployeeId);
    expect(refreshTokenData.type).toBe('refresh');
  });

  test('可以使用RefreshToken刷新访问Token', async () => {
    await employeeService.approveEmployee(testEmployeeId, 'approver-id');

    const authResult = await authService.authenticate('13900000401', testPassword);
    const refreshResult = await authService.refreshTokens(authResult.refreshToken);

    expect(refreshResult).toBeDefined();
    expect(refreshResult.token).toBeDefined();
    expect(refreshResult.refreshToken).toBeDefined();
  });

  test('无效的RefreshToken不能刷新Token', async () => {
    await expect(authService.refreshTokens('invalid.refresh.token'))
      .rejects.toThrow('Refresh token无效或已过期');
  });

  test('登录后可以获取员工信息', async () => {
    await employeeService.approveEmployee(testEmployeeId, 'approver-id');

    const result = await authService.authenticate('13900000401', testPassword);
    const employee = authService.getEmployeeFromToken(result.token);

    expect(employee).toBeDefined();
    expect(employee.id).toBe(testEmployeeId);
    expect(employee.name).toBe('测试员工');
  });

  test('无效Token获取员工信息返回null', () => {
    const employee = authService.getEmployeeFromToken('invalid.token');
    expect(employee).toBeNull();
  });
});
