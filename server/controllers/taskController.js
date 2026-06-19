const taskModel = require('../models/task');
const employeeModel = require('../models/employee');

class TaskController {
  async getTasks(req, res) {
    try {
      const { storeId, employeeId, isManager } = req.query;
      
      if (!storeId) {
        return res.status(400).json({ 
          success: false, 
          message: '门店ID不能为空' 
        });
      }

      const tasks = taskModel.findByStoreId(
        storeId, 
        employeeId || null, 
        isManager === 'true'
      );
      
      const tasksWithEmployeeInfo = await Promise.all(
        tasks.map(async (task) => {
          const taskData = { ...task };
          
          if (task.assigneeId) {
            const assignee = employeeModel.findById(task.assigneeId);
            if (assignee) {
              taskData.assigneeName = assignee.name;
              taskData.assigneeRole = assignee.role;
            }
          }
          
          if (task.creatorId) {
            const creator = employeeModel.findById(task.creatorId);
            if (creator) {
              taskData.creatorName = creator.name;
            }
          }
          
          return taskData;
        })
      );

      res.json({
        success: true,
        data: tasksWithEmployeeInfo,
        total: tasksWithEmployeeInfo.length
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: '获取任务列表失败', 
        error: error.message 
      });
    }
  }

  async getTaskStats(req, res) {
    try {
      const { storeId, employeeId, isManager } = req.query;
      
      if (!storeId) {
        return res.status(400).json({ 
          success: false, 
          message: '门店ID不能为空' 
        });
      }

      const stats = taskModel.getStats(
        storeId, 
        employeeId || null, 
        isManager === 'true'
      );

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: '获取任务统计失败', 
        error: error.message 
      });
    }
  }

  async getTaskById(req, res) {
    try {
      const { id } = req.params;
      const { employeeId, isManager } = req.query;
      const task = taskModel.findById(id);

      if (!task) {
        return res.status(404).json({ 
          success: false, 
          message: '任务不存在' 
        });
      }

      if (isManager !== 'true' && employeeId && task.assigneeId !== employeeId) {
        return res.status(403).json({ 
          success: false, 
          message: '无权限访问此任务' 
        });
      }

      const taskData = { ...task };
      
      if (task.assigneeId) {
        const assignee = employeeModel.findById(task.assigneeId);
        if (assignee) {
          taskData.assigneeName = assignee.name;
          taskData.assigneeRole = assignee.role;
        }
      }

      res.json({
        success: true,
        data: taskData
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: '获取任务详情失败', 
        error: error.message 
      });
    }
  }

  async createTask(req, res) {
    try {
      const { title, description, storeId, assigneeId, priority, dueDate, creatorId } = req.body;

      if (!title || !storeId) {
        return res.status(400).json({ 
          success: false, 
          message: '任务标题和门店ID不能为空' 
        });
      }

      if (assigneeId) {
        const employee = employeeModel.findById(assigneeId);
        if (!employee) {
          return res.status(400).json({ 
            success: false, 
            message: '指定的员工不存在' 
          });
        }
        
        if (employee.approvalStatus !== 'approved') {
          return res.status(400).json({ 
            success: false, 
            message: '只能指派给已审核通过的员工' 
          });
        }
      }

      const task = taskModel.create({ 
        title, 
        description, 
        storeId, 
        assigneeId,
        creatorId,
        priority, 
        dueDate 
      });

      res.status(201).json({
        success: true,
        message: '任务创建成功',
        data: task
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: '创建任务失败', 
        error: error.message 
      });
    }
  }

  async updateTask(req, res) {
    try {
      const { id } = req.params;
      const { employeeId, isManager } = req.query;
      const updateData = req.body;

      const existingTask = taskModel.findById(id);
      if (!existingTask) {
        return res.status(404).json({ 
          success: false, 
          message: '任务不存在' 
        });
      }

      if (isManager !== 'true' && employeeId) {
        if (existingTask.assigneeId !== employeeId) {
          return res.status(403).json({ 
            success: false, 
            message: '只能更新被指派给您的任务' 
          });
        }

        if (updateData.assigneeId && updateData.assigneeId !== employeeId) {
          return res.status(403).json({ 
            success: false, 
            message: '普通员工不能将任务指派给他人' 
          });
        }
      }

      if (updateData.assigneeId) {
        const employee = employeeModel.findById(updateData.assigneeId);
        if (!employee) {
          return res.status(400).json({ 
            success: false, 
            message: '指定的员工不存在' 
          });
        }
        
        if (employee.approvalStatus !== 'approved') {
          return res.status(400).json({ 
            success: false, 
            message: '只能指派给已审核通过的员工' 
          });
        }
      }

      const task = taskModel.update(id, updateData);

      res.json({
        success: true,
        message: '任务更新成功',
        data: task
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: '更新任务失败', 
        error: error.message 
      });
    }
  }

  async deleteTask(req, res) {
    try {
      const { id } = req.params;

      const task = taskModel.findById(id);
      if (!task) {
        return res.status(404).json({ 
          success: false, 
          message: '任务不存在' 
        });
      }

      const deleted = taskModel.delete(id);

      res.json({
        success: true,
        message: '任务删除成功'
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: '删除任务失败', 
        error: error.message 
      });
    }
  }
}

module.exports = new TaskController();
