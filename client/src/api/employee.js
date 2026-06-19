import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default {
  getEmployees(storeId) {
    return apiClient.get(`/employees?storeId=${storeId}`);
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
  
  updatePassword(id, newPassword) {
    return apiClient.put(`/employees/${id}/password`, { newPassword });
  },
  
  toggleEmployeeStatus(id) {
    return apiClient.patch(`/employees/${id}/status`);
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
  }
};
