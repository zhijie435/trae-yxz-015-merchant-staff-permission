const { v4: uuidv4 } = require('uuid');

class TaskModel {
  constructor() {
    this.tasks = new Map();
    this.initializeData();
  }

  initializeData() {
    const initialTasks = [
      {
        id: uuidv4(),
        title: '整理商品库存',
        description: '对门店所有商品进行库存清点,更新库存数量',
        storeId: 'store001',
        assigneeId: null,
        creatorId: null,
        priority: 'high',
        status: 'pending',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null
      },
      {
        id: uuidv4(),
        title: '客户预约整理',
        description: '整理下周客户预约名单,确认预约时间',
        storeId: 'store001',
        assigneeId: null,
        creatorId: null,
        priority: 'medium',
        status: 'pending',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null
      }
    ];

    initialTasks.forEach(task => {
      this.tasks.set(task.id, task);
    });
  }

  create(taskData) {
    const id = uuidv4();
    
    const task = {
      id,
      title: taskData.title,
      description: taskData.description || '',
      storeId: taskData.storeId,
      assigneeId: taskData.assigneeId || null,
      creatorId: taskData.creatorId || null,
      priority: taskData.priority || 'medium',
      status: 'pending',
      dueDate: taskData.dueDate || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null
    };

    this.tasks.set(id, task);
    return this.formatTask(task);
  }

  findByStoreId(storeId, employeeId = null, isManager = false) {
    const results = [];
    this.tasks.forEach(task => {
      if (task.storeId === storeId) {
        if (isManager || !employeeId) {
          results.push(this.formatTask(task));
        } else if (task.assigneeId === employeeId) {
          results.push(this.formatTask(task));
        }
      }
    });
    return results;
  }

  findById(id) {
    const task = this.tasks.get(id);
    return task ? this.formatTask(task) : null;
  }

  update(id, updateData) {
    const task = this.tasks.get(id);
    if (!task) {
      return null;
    }

    if (updateData.title !== undefined) task.title = updateData.title;
    if (updateData.description !== undefined) task.description = updateData.description;
    if (updateData.assigneeId !== undefined) task.assigneeId = updateData.assigneeId;
    if (updateData.priority !== undefined) task.priority = updateData.priority;
    if (updateData.status !== undefined) {
      task.status = updateData.status;
      if (updateData.status === 'completed') {
        task.completedAt = new Date().toISOString();
      }
    }
    if (updateData.dueDate !== undefined) task.dueDate = updateData.dueDate;
    
    task.updatedAt = new Date().toISOString();
    this.tasks.set(id, task);
    
    return this.formatTask(task);
  }

  delete(id) {
    return this.tasks.delete(id);
  }

  getStats(storeId, employeeId = null, isManager = false) {
    let tasks = this.findByStoreId(storeId, employeeId, isManager);
    
    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      overdue: tasks.filter(t => {
        if (!t.dueDate || t.status === 'completed') return false;
        return new Date(t.dueDate) < new Date();
      }).length
    };
  }

  formatTask(task) {
    return { ...task };
  }
}

module.exports = new TaskModel();
