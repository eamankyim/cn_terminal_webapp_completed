import api from './api';

const smsService = {
  async sendTestSms({ phone, message } = {}) {
    return api.post('/sms/test', { phone, message });
  },

  async getStats(params = {}) {
    return api.get('/sms/stats', { params });
  },

  async getSafety() {
    return api.get('/sms/safety');
  },

  /**
   * Emergency stop. enabled=true blocks every outbound SMS, including tests.
   * alsoDisableMaster keeps the master switch off so nothing resumes silently.
   */
  async setKillSwitch({ enabled, alsoDisableMaster = true }) {
    return api.post('/sms/kill-switch', { enabled, alsoDisableMaster });
  }
};

export default smsService;
