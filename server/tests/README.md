# 员工权限管理系统 - 单元测试

## 测试概述

本项目包含完整的单元测试，覆盖以下核心功能：

### 1. 员工新增功能测试 (`employeeCreate.test.js`)
- ✅ 成功创建新员工
- ✅ 手机号重复验证
- ✅ 员工密码加密
- ✅ 默认角色分配
- ✅ 创建审计日志

### 2. 员工审核功能测试 (`employeeAudit.test.js`)
- ✅ 成功审核通过员工
- ✅ 拒绝待审核员工
- ✅ 审核状态验证
- ✅ 审核记录时间戳
- ✅ 审核日志记录

### 3. 员工禁用功能测试 (`employeeDisable.test.js`)
- ✅ 禁用已审核员工
- ✅ 启用已禁用员工
- ✅ 重复禁用验证
- ✅ 禁用后登录验证
- ✅ 禁用状态计数

### 4. 权限修改功能测试 (`employeePermission.test.js`)
- ✅ 成功修改员工权限
- ✅ 无效权限过滤
- ✅ 权限验证方法
- ✅ 员工信息保护
- ✅ 权限更新日志

### 5. 登录校验功能测试 (`authLogin.test.js`)
- ✅ 员工登录状态验证
- ✅ JWT Token生成和验证
- ✅ Refresh Token刷新
- ✅ 登录失败审计
- ✅ 密码验证
- ✅ Token过期处理

## 运行测试

### 运行所有测试
```bash
cd server
npm test
```

### 运行特定测试文件
```bash
cd server
npx jest tests/employeeCreate.test.js
```

### 运行测试并监控变更
```bash
cd server
npm run test:watch
```

### 生成测试覆盖率报告
```bash
cd server
npm run test:coverage
```

## 测试覆盖率

当前测试套件覆盖了以下核心模块：
- `employeeService` - 员工管理服务
- `authService` - 认证服务
- `employeeModel` - 员工数据模型
- `permissionService` - 权限服务
- `auditService` - 审计服务

## 测试结果

```
Test Suites: 5 passed, 5 total
Tests:       61 passed, 61 total
```

## 注意事项

1. 测试使用内存存储，每次测试前会清空数据
2. 测试会自动生成审计日志用于验证
3. 所有异步操作都使用 async/await
4. 测试遵循 Arrange-Act-Assert 模式
