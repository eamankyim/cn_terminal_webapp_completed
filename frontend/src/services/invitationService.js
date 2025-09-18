// Invitation service for managing user invitations
import apiService from './api';

class InvitationService {
  // Get all pending invitations
  async getPendingInvitations() {
    try {
      const response = await apiService.get('/invitations');
      return response;
    } catch (error) {
      console.error('Failed to fetch pending invitations:', error);
      throw error;
    }
  }

  // Send invitation to new user
  async sendInvitation(inviteData) {
    try {
      const response = await apiService.post('/invitations', inviteData);
      return response;
    } catch (error) {
      console.error('Failed to send invitation:', error);
      throw error;
    }
  }

  // Cancel/delete invitation
  async cancelInvitation(invitationId) {
    try {
      const response = await apiService.delete(`/invitations/${invitationId}`);
      return response;
    } catch (error) {
      console.error('Failed to cancel invitation:', error);
      throw error;
    }
  }

  // Resend invitation
  async resendInvitation(invitationId) {
    try {
      const response = await apiService.post(`/invitations/${invitationId}/resend`);
      return response;
    } catch (error) {
      console.error('Failed to resend invitation:', error);
      throw error;
    }
  }

  // Get invitation by ID (for accepting)
  async getInvitation(invitationId) {
    try {
      const response = await apiService.get(`/invitations/${invitationId}`);
      return response;
    } catch (error) {
      console.error('Failed to get invitation:', error);
      throw error;
    }
  }

  // Validate invitation (check if it exists and is valid)
  async validateInvitation(invitationId) {
    try {
      const response = await apiService.get(`/invitations/${invitationId}/validate`);
      return response;
    } catch (error) {
      console.error('Failed to validate invitation:', error);
      throw error;
    }
  }

  // Accept invitation and create user account
  async acceptInvitation(invitationId, userData) {
    try {
      const response = await apiService.post(`/invitations/${invitationId}/accept`, userData);
      return response;
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      throw error;
    }
  }

  // Get invitation statistics
  async getInvitationStats() {
    try {
      const response = await apiService.get('/invitations/stats');
      return response;
    } catch (error) {
      console.error('Failed to get invitation stats:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const invitationService = new InvitationService();
export default invitationService;
