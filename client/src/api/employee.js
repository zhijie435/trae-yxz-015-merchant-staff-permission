import apiClient from './index';

export default {
  getEmployees(storeId, includePending = false) {
    return apiClient.get(`/employees?storeId=${storeId}&includePending=${includePending}`);
  },

  getPendingEmployees(storeId) {
    return apiClient.get(`/employees/pending?storeId=${storeId}`);
  },

  getApprovedEmployees(storeId) {
    return apiClient.get(`/employees/approved?storeId=${storeId}`);
  },

  getEmployeeStats(storeId) {
    return apiClient.get(`/employees/stats?storeId=${storeId}`);
  },

  getEmployeeById(id) {
    return apiClient.get(`/employees/${id}`);
  },

  createEmployee(employeeData) {
    return apiClient.post('/employees', employeeData);
  },

  updateEmployee(id, updateData) {
    return apiClient.put(`/employees/${id}`, updateData);
  },

  updatePassword(id, newPassword, currentPassword = null) {
    return apiClient.put(`/employees/${id}/password`, { newPassword, currentPassword });
  },

  toggleEmployeeStatus(id) {
    return apiClient.patch(`/employees/${id}/status`);
  },

  activateEmployee(id) {
    return apiClient.patch(`/employees/${id}/activate`);
  },

  deactivateEmployee(id) {
    return apiClient.patch(`/employees/${id}/deactivate`);
  },

  approveEmployee(id) {
    return apiClient.patch(`/employees/${id}/approve`);
  },

  rejectEmployee(id, reason = '') {
    return apiClient.patch(`/employees/${id}/reject`, { reason });
  },

  deleteEmployee(id) {
    return apiClient.delete(`/employees/${id}`);
  },

  uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiClient.post('/upload/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  uploadIdCard(frontFile, backFile) {
    const formData = new FormData();
    if (frontFile) {
      formData.append('front', frontFile);
    }
    if (backFile) {
      formData.append('back', backFile);
    }
    return apiClient.post('/upload/idcard', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  updatePermissions(id, permissions) {
    return apiClient.put(`/employees/${id}/permissions`, { permissions });
  },

  getPermissions() {
    return apiClient.get('/employees/permissions');
  },

  getAuditLogs(params = {}) {
    return apiClient.get('/employees/audit-logs', { params });
  }
};
