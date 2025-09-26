import apiService from './api';

class ReportService {
  // Get summary statistics
  async getSummaryStats(startDate, endDate) {
    try {
      const response = await apiService.get('/reports/summary', {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });
      return response;
    } catch (error) {
      console.error('Error fetching summary stats:', error);
      throw error;
    }
  }

  // Get job status summary
  async getJobStatusSummary(startDate, endDate) {
    try {
      const response = await apiService.get('/reports/job-status', {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });
      return response;
    } catch (error) {
      console.error('Error fetching job status summary:', error);
      throw error;
    }
  }

  // Get daily activity report
  async getDailyActivity(startDate, endDate) {
    try {
      const response = await apiService.get('/reports/daily-activity', {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });
      return response;
    } catch (error) {
      console.error('Error fetching daily activity:', error);
      throw error;
    }
  }

  // Get revenue summary
  async getRevenueSummary(startDate, endDate) {
    try {
      const response = await apiService.get('/reports/revenue', {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });
      return response;
    } catch (error) {
      console.error('Error fetching revenue summary:', error);
      throw error;
    }
  }

  // Get invoice reports
  async getInvoiceReports(startDate, endDate) {
    try {
      const response = await apiService.get('/reports/invoices', {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });
      return response;
    } catch (error) {
      console.error('Error fetching invoice reports:', error);
      throw error;
    }
  }

  // Get customer activity report
  async getCustomerActivity(startDate, endDate) {
    try {
      const response = await apiService.get('/reports/customers', {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });
      return response;
    } catch (error) {
      console.error('Error fetching customer activity:', error);
      throw error;
    }
  }

  // Get processing time report
  async getProcessingTimeReport(startDate, endDate) {
    try {
      const response = await apiService.get('/reports/processing-time', {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching processing time report:', error);
      throw error;
    }
  }

  // Get monthly trends report
  async getMonthlyTrendsReport(startDate, endDate) {
    try {
      const response = await apiService.get('/reports/monthly-trends', {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching monthly trends report:', error);
      throw error;
    }
  }
}

export default new ReportService();

