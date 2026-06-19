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

  refreshToken(refreshToken) {
    return apiClient.post('/auth/refresh', { refreshToken });
  },

  verifyToken() {
    return apiClient.get('/auth/verify');
  },

  logout() {
    return apiClient.post('/auth/logout');
  }
};
