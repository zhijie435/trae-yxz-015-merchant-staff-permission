const taskModel = require('../models/task');
const employeeModel = require('../models/employee');
const employeeService = require('../services/employeeService');
const dataIsolationService = require('../services/dataIsolationService');

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

      const storeAccess = dataIsolationService.validateStoreAccess(req.employee, storeId);
      if (!storeAccess.valid) {
        return res.status(403).json({
          success: false,
          message: storeAccess.message
        });
      }

      const tasks = taskModel.findByStoreId(
        storeId,
        req.employeeId,
        req.isManager
      );

      const tasksWithEmployeeInfo = await Promise.all(
        tasks.map(async (task) => {
          const taskData = { ...task };

          if (task.assigneeId) {
            const assignee = employeeService.findById(task.assigneeId);
            if (assignee) {
              taskData.assigneeName = assignee.name;
              taskData.assigneeRole = assignee.role;
            }
          }

          if (task.creatorId) {
            const creator = employeeService.findById(task.creatorId);
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
      const { storeId } = req.query;

      if (!storeId) {
        return res.status(400).json({
          success: false,
          message: '门店ID不能为空'
        });
      }

      const storeAccess = dataIsolationService.validateStoreAccess(req.employee, storeId);
      if (!storeAccess.valid) {
        return res.status(403).json({
          success: false,
          message: storeAccess.message
        });
      }

      const stats = taskModel.getStats(
        storeId,
        req.employeeId,
        req.isManager
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
      const task = taskModel.findById(id);

      if (!task) {
        return res.status(404).json({
          success: false,
          message: '任务不存在'
        });
      }

      const accessCheck = dataIsolationService.canAccessTask(req.employee, task);
      if (!accessCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: accessCheck.reason
        });
      }

      const taskData = { ...task };

      if (task.assigneeId) {
        const assignee = employeeService.findById(task.assigneeId);
        if (assignee) {
          taskData.assigneeName = assignee.name;
          taskData.assigneeRole = assignee.role;
        }
      }

      if (task.creatorId) {
        const creator = employeeService.findById(task.creatorId);
        if (creator) {
          taskData.creatorName = creator.name;
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
      const { title, description, storeId, assigneeId, priority, dueDate } = req.body;

      if (!title || !storeId) {
        return res.status(400).json({
          success: false,
          message: '任务标题和门店ID不能为空'
        });
      }

      const storeAccess = dataIsolationService.validateStoreAccess(req.employee, storeId);
      if (!storeAccess.valid) {
        return res.status(403).json({
          success: false,
          message: storeAccess.message
        });
      }

      if (!req.isManager) {
        return res.status(403).json({
          success: false,
          message: '只有管理员可以创建任务'
        });
      }

      if (assigneeId) {
        const employee = employeeService.findById(assigneeId);
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

        if (employee.storeId !== storeId) {
          return res.status(400).json({
            success: false,
            message: '只能指派给本门店的员工'
          });
        }
      }

      const task = taskModel.create({
        title,
        description,
        storeId,
        assigneeId,
        creatorId: req.employeeId,
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
      const updateData = req.body;

      const existingTask = taskModel.findById(id);
      if (!existingTask) {
        return res.status(404).json({
          success: false,
          message: '任务不存在'
        });
      }

      const accessCheck = dataIsolationService.canUpdateTask(req.employee, existingTask);
      if (!accessCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: accessCheck.reason
        });
      }

      if (updateData.assigneeId && updateData.assigneeId !== existingTask.assigneeId) {
        const assignCheck = dataIsolationService.canAssignTask(
          req.employee,
          existingTask,
          updateData.assigneeId
        );
        if (!assignCheck.allowed) {
          return res.status(403).json({
            success: false,
            message: assignCheck.reason
          });
        }
      }

      if (updateData.assigneeId) {
        const employee = employeeService.findById(updateData.assigneeId);
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

        if (employee.storeId !== existingTask.storeId) {
          return res.status(400).json({
            success: false,
            message: '只能指派给本门店的员工'
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

      const accessCheck = dataIsolationService.canDeleteTask(req.employee, task);
      if (!accessCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: accessCheck.reason
        });
      }

      taskModel.delete(id);

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
