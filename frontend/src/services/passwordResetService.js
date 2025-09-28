import apiService from './api';

class PasswordResetService {
  /**
   * Request password reset
   * @param {string} email - User's email address
   * @returns {Promise<Object>} API response
   */
  async requestPasswordReset(email) {
    try {
      const response = await apiService.post('/auth/forgot-password', { email });
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} password - New password
   * @returns {Promise<Object>} API response
   */
  async resetPassword(token, password) {
    try {
      const response = await apiService.post('/auth/reset-password', { token, password });
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify reset token
   * @param {string} token - Reset token
   * @returns {Promise<Object>} API response
   */
  async verifyResetToken(token) {
    try {
      const response = await apiService.post('/auth/verify-reset-token', { token });
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default new PasswordResetService();











