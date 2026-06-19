import apiClient from './index';

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
