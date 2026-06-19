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
  }
};
