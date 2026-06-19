const employeeModel = require('../models/employee');

class EmployeeController {
  async getEmployees(req, res) {
    try {
      const { storeId, includePending } = req.query;
      
      if (!storeId) {
        return res.status(400).json({ 
          success: false, 
          message: '门店ID不能为空' 
        });
      }

      const employees = employeeModel.findByStoreId(storeId, includePending === 'true');
      res.json({
        success: true,
        data: employees,
        total: employees.length
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: '获取员工列表失败', 
        error: error.message 
      });
    }
  }

  async getPendingEmployees(req, res) {
    try {
      const { storeId } = req.query;
      
      if (!storeId) {
        return res.status(400).json({ 
          success: false, 
          message: '门店ID不能为空' 
        });
      }

      const employees = employeeModel.findPendingByStoreId(storeId);
      res.json({
        success: true,
        data: employees,
        total: employees.length
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: '获取待审核员工列表失败', 
        error: error.message 
      });
    }
  }

  async approveEmployee(req, res) {
    try {
      const { id } = req.params;

      const employee = employeeModel.approve(id);

      if (!employee) {
        return res.status(404).json({ 
          success: false, 
          message: '员工不存在' 
        });
      }

      res.json({
        success: true,
        message: '员工审核已通过',
        data: employee
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: '审核通过操作失败', 
        error: error.message 
      });
    }
  }

  async rejectEmployee(req, res) {
    try {
      const { id } = req.params;

      const employee = employeeModel.reject(id);

      if (!employee) {
        return res.status(404).json({ 
          success: false, 
          message: '员工不存在' 
        });
      }

      res.json({
        success: true,
        message: '员工审核已拒绝',
        data: employee
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: '审核拒绝操作失败', 
        error: error.message 
      });
    }
  }

  async getEmployeeById(req, res) {
    try {
      const { id } = req.params;
      const employee = employeeModel.findById(id);

      if (!employee) {
        return res.status(404).json({ 
          success: false, 
          message: '员工不存在' 
        });
      }

      res.json({
        success: true,
        data: employee
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: '获取员工信息失败', 
        error: error.message 
      });
    }
  }

  async createEmployee(req, res) {
    try {
      const { name, phone, role, password, storeId } = req.body;

      if (!name || !phone || !storeId) {
        return res.status(400).json({ 
          success: false, 
          message: '姓名、手机号和门店ID不能为空' 
        });
      }

      const employee = await employeeModel.create({ 
        name, 
        phone, 
        role, 
        password,
        storeId 
      });

      res.status(201).json({
        success: true,
        message: '员工创建成功',
        data: employee
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: '创建员工失败', 
        error: error.message 
      });
    }
  }

  async updateEmployee(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const employee = await employeeModel.update(id, updateData);

      if (!employee) {
        return res.status(404).json({ 
          success: false, 
          message: '员工不存在' 
        });
      }

      res.json({
        success: true,
        message: '员工信息更新成功',
        data: employee
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: '更新员工信息失败', 
        error: error.message 
      });
    }
  }

  async updatePassword(req, res) {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword) {
        return res.status(400).json({ 
          success: false, 
          message: '新密码不能为空' 
        });
      }

      const result = await employeeModel.updatePassword(id, newPassword);

      if (!result) {
        return res.status(404).json({ 
          success: false, 
          message: '员工不存在' 
        });
      }

      res.json({
        success: true,
        message: '密码更新成功',
        data: result
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: '更新密码失败', 
        error: error.message 
      });
    }
  }

  async toggleEmployeeStatus(req, res) {
    try {
      const { id } = req.params;

      const employee = employeeModel.toggleStatus(id);

      if (!employee) {
        return res.status(404).json({ 
          success: false, 
          message: '员工不存在' 
        });
      }

      const action = employee.status === 'active' ? '启用' : '禁用';
      res.json({
        success: true,
        message: `员工账号已${action}`,
        data: employee
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: '更新员工状态失败', 
        error: error.message 
      });
    }
  }

  async deleteEmployee(req, res) {
    try {
      const { id } = req.params;
      const deleted = employeeModel.delete(id);

      if (!deleted) {
        return res.status(404).json({ 
          success: false, 
          message: '员工不存在' 
        });
      }

      res.json({
        success: true,
        message: '员工删除成功'
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: '删除员工失败', 
        error: error.message 
      });
    }
  }

  async updatePermissions(req, res) {
    try {
      const { id } = req.params;
      const { permissions } = req.body;

      if (!Array.isArray(permissions)) {
        return res.status(400).json({ 
          success: false, 
          message: '权限必须是数组格式' 
        });
      }

      const employee = await employeeModel.updatePermissions(id, permissions);

      if (!employee) {
        return res.status(404).json({ 
          success: false, 
          message: '员工不存在' 
        });
      }

      res.json({
        success: true,
        message: '员工权限更新成功',
        data: employee
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: '更新员工权限失败', 
        error: error.message 
      });
    }
  }
}

module.exports = new EmployeeController();
