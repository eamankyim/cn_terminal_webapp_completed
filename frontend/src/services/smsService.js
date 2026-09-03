import api from './api';

const smsService = {
  async sendTestSms({ phone, message } = {}) {
    return api.post('/sms/test', { phone, message });
  },

  async getStats(params = {}) {
    return api.get('/sms/stats', { params });
  }
};

export default smsService;
