import apiClient from './index';

export default {
  getTasks(storeId, employeeId = null, isManager = false) {
    let url = `/tasks?storeId=${storeId}&isManager=${isManager}`;
    if (employeeId) {
      url += `&employeeId=${employeeId}`;
    }
    return apiClient.get(url);
  },
  
  getTaskStats(storeId, employeeId = null, isManager = false) {
    let url = `/tasks/stats?storeId=${storeId}&isManager=${isManager}`;
    if (employeeId) {
      url += `&employeeId=${employeeId}`;
    }
    return apiClient.get(url);
  },
  
  getTaskById(id, employeeId = null, isManager = false) {
    let url = `/tasks/${id}?isManager=${isManager}`;
    if (employeeId) {
      url += `&employeeId=${employeeId}`;
    }
    return apiClient.get(url);
  },
  
  createTask(taskData) {
    return apiClient.post('/tasks', taskData);
  },
  
  updateTask(id, updateData, employeeId = null, isManager = false) {
    let url = `/tasks/${id}?isManager=${isManager}`;
    if (employeeId) {
      url += `&employeeId=${employeeId}`;
    }
    return apiClient.put(url, updateData);
  },
  
  deleteTask(id) {
    return apiClient.delete(`/tasks/${id}`);
  }
};
