import apiService from './api';

class ReportService {
  // Get summary statistics
  async getSummaryStats(startDate, endDate) {
    try {
      const response = await apiService.get('/reports/summary', {
        params: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        }
      });
      return response;
    } catch (error) {

      throw error;
    }
  }

  // Get job status summary
  async getJobStatusSummary(startDate, endDate) {
    try {
      const response = await apiService.get('/reports/job-status', {
        params: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        }
      });
      return response;
    } catch (error) {

      throw error;
    }
  }

  // Get daily activity report
  async getDailyActivity(startDate, endDate) {
    try {
      const response = await apiService.get('/reports/daily-activity', {
        params: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        }
      });
      return response;
    } catch (error) {

      throw error;
    }
  }

  // Get revenue summary
  async getRevenueSummary(startDate, endDate) {
    try {
      const response = await apiService.get('/reports/revenue', {
        params: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        }
      });
      return response;
    } catch (error) {

      throw error;
    }
  }

  // Get invoice reports
  async getInvoiceReports(startDate, endDate) {
    try {
      const response = await apiService.get('/reports/invoices', {
        params: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        }
      });
      return response;
    } catch (error) {

      throw error;
    }
  }

  // Get customer activity report
  async getCustomerActivity(startDate, endDate) {
    try {
      const response = await apiService.get('/reports/customers', {
        params: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        }
      });
      return response;
    } catch (error) {

      throw error;
    }
  }

  // Get processing time report
  async getProcessingTimeReport(startDate, endDate) {
    try {
      const response = await apiService.get('/reports/processing-time', {
        params: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        }
      });
      return response; // API service returns data directly, not wrapped in .data
    } catch (error) {

      throw error;
    }
  }

  // Get monthly trends report
  async getMonthlyTrendsReport(startDate, endDate) {
    try {
      const response = await apiService.get('/reports/monthly-trends', {
        params: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        }
      });
      return response; // API service returns data directly, not wrapped in .data
    } catch (error) {

      throw error;
    }
  }
}

export default new ReportService();

