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
  sendVerificationCode(phone) {
    return apiClient.post('/auth/send-code', { phone });
  },
  
  loginWithCode(phone, code) {
    return apiClient.post('/auth/login-code', { phone, code });
  },
  
  loginWithPassword(phone, password) {
    return apiClient.post('/auth/login-password', { phone, password });
  },
  
  verifyToken() {
    return apiClient.get('/auth/verify');
  }
};
