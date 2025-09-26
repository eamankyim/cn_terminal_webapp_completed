const { prisma } = require('../config/database');

class ReportService {
  // Job Status Summary Report
  async getJobStatusSummary(startDate, endDate) {
    try {
      const jobs = await prisma.job.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          status: true
        }
      });

      const statusCounts = jobs.reduce((acc, job) => {
        acc[job.status] = (acc[job.status] || 0) + 1;
        return acc;
      }, {});

      const totalJobs = jobs.length;
      const statusSummary = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
        percentage: totalJobs > 0 ? Math.round((count / totalJobs) * 100 * 10) / 10 : 0
      }));

      return statusSummary;
    } catch (error) {
      console.error('Error getting job status summary:', error);
      throw error;
    }
  }

  // Daily Activity Report
  async getDailyActivity(startDate, endDate) {
    try {
      const jobs = await prisma.job.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          createdAt: true,
          status: true,
          submittedDate: true
        }
      });

      // Group by date
      const dailyData = {};
      jobs.forEach(job => {
        const date = job.createdAt.toISOString().split('T')[0];
        if (!dailyData[date]) {
          dailyData[date] = {
            date,
            newJobs: 0,
            completedJobs: 0,
            revenue: 0
          };
        }
        dailyData[date].newJobs++;
        
        if (job.status === 'DELIVERED') {
          dailyData[date].completedJobs++;
        }
      });

      // Get revenue data from invoices
      const invoices = await prisma.invoice.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          createdAt: true,
          amount: true
        }
      });

      invoices.forEach(invoice => {
        const date = invoice.createdAt.toISOString().split('T')[0];
        if (dailyData[date]) {
          dailyData[date].revenue += invoice.amount;
        }
      });

      return Object.values(dailyData).sort((a, b) => new Date(a.date) - new Date(b.date));
    } catch (error) {
      console.error('Error getting daily activity:', error);
      throw error;
    }
  }

  // Revenue Summary Report
  async getRevenueSummary(startDate, endDate) {
    try {
      const invoices = await prisma.invoice.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          amount: true,
          status: true,
          job: {
            select: {
              status: true
            }
          }
        }
      });

      const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
      const paidRevenue = invoices
        .filter(invoice => invoice.status === 'PAID')
        .reduce((sum, invoice) => sum + invoice.amount, 0);
      const pendingRevenue = totalRevenue - paidRevenue;

      // Revenue by job status
      const revenueByStatus = {};
      invoices.forEach(invoice => {
        const status = invoice.job.status;
        if (!revenueByStatus[status]) {
          revenueByStatus[status] = 0;
        }
        revenueByStatus[status] += invoice.amount;
      });

      const revenueByStatusArray = Object.entries(revenueByStatus).map(([status, amount]) => ({
        status,
        amount,
        percentage: totalRevenue > 0 ? Math.round((amount / totalRevenue) * 100 * 10) / 10 : 0
      }));

      return {
        totalRevenue,
        paidRevenue,
        pendingRevenue,
        revenueByStatus: revenueByStatusArray
      };
    } catch (error) {
      console.error('Error getting revenue summary:', error);
      throw error;
    }
  }

  // Invoice Reports
  async getInvoiceReports(startDate, endDate) {
    try {
      const invoices = await prisma.invoice.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          id: true,
          invoiceNumber: true,
          amount: true,
          status: true,
          createdAt: true,
          customer: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return invoices.map(invoice => ({
        id: invoice.invoiceNumber,
        customer: invoice.customer.name,
        amount: invoice.amount,
        status: invoice.status,
        date: invoice.createdAt.toISOString().split('T')[0]
      }));
    } catch (error) {
      console.error('Error getting invoice reports:', error);
      throw error;
    }
  }

  // Customer Activity Report
  async getCustomerActivity(startDate, endDate) {
    try {
      const customers = await prisma.customer.findMany({
        where: {
          jobs: {
            some: {
              createdAt: {
                gte: startDate,
                lte: endDate
              }
            }
          }
        },
        select: {
          name: true,
          jobs: {
            where: {
              createdAt: {
                gte: startDate,
                lte: endDate
              }
            },
            select: {
              id: true,
              createdAt: true,
              invoices: {
                select: {
                  amount: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      });

      return customers.map(customer => {
        const jobs = customer.jobs;
        const totalRevenue = jobs.reduce((sum, job) => {
          return sum + job.invoices.reduce((invoiceSum, invoice) => invoiceSum + invoice.amount, 0);
        }, 0);
        
        const lastActivity = jobs.length > 0 ? jobs[0].createdAt : null;

        return {
          name: customer.name,
          jobs: jobs.length,
          revenue: totalRevenue,
          lastActivity: lastActivity ? lastActivity.toISOString().split('T')[0] : null
        };
      }).sort((a, b) => b.revenue - a.revenue);
    } catch (error) {
      console.error('Error getting customer activity:', error);
      throw error;
    }
  }

  // Summary Statistics
  async getSummaryStats(startDate, endDate) {
    try {
      console.log('\n' + '='.repeat(60));
      console.log('📊 REPORT SERVICE - getSummaryStats');
      console.log('='.repeat(60));
      console.log('📅 startDate:', startDate.toISOString());
      console.log('📅 endDate:', endDate.toISOString());
      
      // First, let's check what jobs exist in the database
      const allJobs = await prisma.job.findMany({
        select: {
          id: true,
          trackingId: true,
          status: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      console.log('🗂️ All jobs in database:', allJobs.length);
      allJobs.forEach(job => {
        console.log(`  - ${job.trackingId}: ${job.status} (created: ${job.createdAt.toISOString()})`);
      });
      
      // Check if any jobs fall within our date range
      const jobsInRange = allJobs.filter(job => {
        return job.createdAt >= startDate && job.createdAt <= endDate;
      });
      
      console.log('📊 Jobs in date range:', jobsInRange.length);
      jobsInRange.forEach(job => {
        console.log(`  ✅ ${job.trackingId}: ${job.status} (created: ${job.createdAt.toISOString()})`);
      });

      const [totalJobs, completedJobs, totalRevenue, activeCustomers] = await Promise.all([
        prisma.job.count({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }),
        prisma.job.count({
          where: {
            status: 'DELIVERED',
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }),
        prisma.invoice.aggregate({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          },
          _sum: {
            amount: true
          }
        }),
        prisma.customer.count({
          where: {
            jobs: {
              some: {
                createdAt: {
                  gte: startDate,
                  lte: endDate
                }
              }
            }
          }
        })
      ]);

      console.log('📈 Query results:');
      console.log('  - totalJobs:', totalJobs);
      console.log('  - completedJobs:', completedJobs);
      console.log('  - totalRevenue:', totalRevenue._sum.amount || 0);
      console.log('  - activeCustomers:', activeCustomers);

      // Calculate average processing time
      const jobsWithDates = await prisma.job.findMany({
        where: {
          status: 'DELIVERED',
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          createdAt: true,
          updatedAt: true
        }
      });

      const avgProcessingTime = jobsWithDates.length > 0 
        ? jobsWithDates.reduce((sum, job) => {
            const processingTime = (job.updatedAt - job.createdAt) / (1000 * 60 * 60 * 24); // days
            return sum + processingTime;
          }, 0) / jobsWithDates.length
        : 0;

      const result = {
        totalJobs,
        completedJobs,
        pendingJobs: totalJobs - completedJobs,
        totalRevenue: totalRevenue._sum.amount || 0,
        activeCustomers,
        avgProcessingTime: Math.round(avgProcessingTime * 10) / 10
      };

      console.log('📊 Final result:', JSON.stringify(result, null, 2));
      console.log('='.repeat(60));
      console.log('✅ REPORT SERVICE SUCCESS');
      console.log('='.repeat(60) + '\n');

      return result;
    } catch (error) {
      console.error('❌ Error getting summary stats:', error);
      console.log('='.repeat(60) + '\n');
      throw error;
    }
  }

  // Processing Time Report
  async getProcessingTimeReport(startDate, endDate) {
    try {
      const jobs = await prisma.job.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          },
          status: 'DELIVERED'
        },
        select: {
          createdAt: true,
          updatedAt: true,
          status: true
        }
      });

      // Calculate processing time for each job
      const processingTimes = jobs.map(job => {
        const created = new Date(job.createdAt);
        const updated = new Date(job.updatedAt);
        const daysDiff = Math.ceil((updated - created) / (1000 * 60 * 60 * 24));
        return daysDiff;
      });

      // Categorize by time ranges
      const ranges = {
        '0-2 days': 0,
        '3-5 days': 0,
        '6-10 days': 0,
        '11-15 days': 0,
        '15+ days': 0
      };

      processingTimes.forEach(days => {
        if (days <= 2) ranges['0-2 days']++;
        else if (days <= 5) ranges['3-5 days']++;
        else if (days <= 10) ranges['6-10 days']++;
        else if (days <= 15) ranges['11-15 days']++;
        else ranges['15+ days']++;
      });

      return Object.entries(ranges).map(([range, count]) => ({
        range,
        count,
        percentage: processingTimes.length > 0 ? Math.round((count / processingTimes.length) * 100 * 10) / 10 : 0
      }));
    } catch (error) {
      console.error('Error getting processing time report:', error);
      throw error;
    }
  }

  // Monthly Trends Report
  async getMonthlyTrendsReport(startDate, endDate) {
    try {
      // Get jobs by month
      const jobs = await prisma.job.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          createdAt: true
        }
      });

      // Get revenue by month from invoices
      const invoices = await prisma.invoice.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          createdAt: true,
          amount: true
        }
      });

      // Group by month
      const monthlyData = {};
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      // Initialize all months in range
      const start = new Date(startDate);
      const end = new Date(endDate);
      for (let d = new Date(start.getFullYear(), start.getMonth(), 1); d <= end; d.setMonth(d.getMonth() + 1)) {
        const monthKey = `${months[d.getMonth()]} ${d.getFullYear()}`;
        monthlyData[monthKey] = { month: monthKey, jobs: 0, revenue: 0 };
      }

      // Count jobs by month
      jobs.forEach(job => {
        const date = new Date(job.createdAt);
        const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].jobs++;
        }
      });

      // Sum revenue by month
      invoices.forEach(invoice => {
        const date = new Date(invoice.createdAt);
        const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].revenue += invoice.amount;
        }
      });

      return Object.values(monthlyData).sort((a, b) => {
        const aDate = new Date(a.month);
        const bDate = new Date(b.month);
        return aDate - bDate;
      });
    } catch (error) {
      console.error('Error getting monthly trends report:', error);
      throw error;
    }
  }
}

module.exports = new ReportService();

