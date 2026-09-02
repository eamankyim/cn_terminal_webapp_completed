const { prisma } = require('../config/database');

const LIVE_PIPELINE = [
  'NEW',
  'PREINVOICED',
  'INVOICED',
  'ENTRY_COMPLETED',
  'DUTY_PAID',
  'READY_FOR_RELEASE',
  'RELEASED',
  'CLEARED',
  'DELIVERED'
];

const COMPLETED_STATUSES = new Set(['CLEARED', 'DELIVERED']);
const JOB_ID_CHUNK = 1000;

function roundHours(value) {
  return Math.round(value * 10) / 10;
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function chunkIds(ids, size = JOB_ID_CHUNK) {
  const chunks = [];
  for (let i = 0; i < ids.length; i += size) {
    chunks.push(ids.slice(i, i + size));
  }
  return chunks;
}

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

      throw error;
    }
  }

  // Summary Statistics
  async getSummaryStats(startDate, endDate) {
    try {

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

      allJobs.forEach(job => {

      });
      
      // Check if any jobs fall within our date range
      const jobsInRange = allJobs.filter(job => {
        return job.createdAt >= startDate && job.createdAt <= endDate;
      });

      jobsInRange.forEach(job => {

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

      return result;
    } catch (error) {

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

      throw error;
    }
  }

  // Work by person: status moves in range. Completed = they moved the job to
  // Cleared or Delivered (not whoever is currently assigned).
  async getAssigneeWork(startDate, endDate, assigneeId) {
    try {
      const historyWhere = {
        date: {
          gte: startDate,
          lte: endDate
        },
        job: {
          isDraft: false
        }
      };
      if (assigneeId) {
        historyWhere.updatedById = assigneeId;
      }

      const history = await prisma.jobStatusHistory.findMany({
        where: historyWhere,
        select: {
          jobId: true,
          status: true,
          updatedById: true
        }
      });

      if (history.length === 0) {
        return { people: [] };
      }

      const byUser = new Map();
      history.forEach((row) => {
        let person = byUser.get(row.updatedById);
        if (!person) {
          person = {
            moves: 0,
            jobIds: new Set(),
            completedJobIds: new Set(),
            movesByStatus: {}
          };
          byUser.set(row.updatedById, person);
        }
        person.moves += 1;
        person.jobIds.add(row.jobId);
        person.movesByStatus[row.status] = (person.movesByStatus[row.status] || 0) + 1;
        if (COMPLETED_STATUSES.has(row.status)) {
          person.completedJobIds.add(row.jobId);
        }
      });

      const userIds = [...byUser.keys()];
      const [users, assignedCounts] = await Promise.all([
        prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, role: true }
        }),
        prisma.job.groupBy({
          by: ['assignedToId', 'status'],
          where: {
            isDraft: false,
            assignedToId: { in: userIds }
          },
          _count: { status: true }
        })
      ]);

      const usersById = new Map(users.map((user) => [user.id, user]));
      const assignedByUser = new Map();
      assignedCounts.forEach((row) => {
        let snapshot = assignedByUser.get(row.assignedToId);
        if (!snapshot) {
          snapshot = { total: 0, byStatus: {} };
          assignedByUser.set(row.assignedToId, snapshot);
        }
        snapshot.byStatus[row.status] = row._count.status;
        snapshot.total += row._count.status;
      });

      const people = userIds.map((userId) => {
        const stats = byUser.get(userId);
        const user = usersById.get(userId);
        return {
          userId,
          name: user?.name || 'Unknown',
          role: user?.role || null,
          moves: stats.moves,
          jobsTouched: stats.jobIds.size,
          completed: stats.completedJobIds.size,
          movesByStatus: stats.movesByStatus,
          currentlyAssigned: assignedByUser.get(userId) || { total: 0, byStatus: {} }
        };
      }).sort((a, b) => {
        if (b.moves !== a.moves) return b.moves - a.moves;
        return a.name.localeCompare(b.name);
      });

      return { people };
    } catch (error) {
      throw error;
    }
  }

  // Time between first arrivals at live pipeline stages. A pair is included
  // when arrival at `to` falls in the date range. assigneeId filters to jobs
  // that person first moved into `to`. Skip pairs are included when they happen.
  async getStageTimes(startDate, endDate, assigneeId) {
    try {
      const startMs = startDate.getTime();
      const endMs = endDate.getTime();

      const bWhere = {
        date: {
          gte: startDate,
          lte: endDate
        },
        status: { in: LIVE_PIPELINE },
        job: { isDraft: false }
      };
      if (assigneeId) {
        bWhere.updatedById = assigneeId;
      }

      const candidateRows = await prisma.jobStatusHistory.findMany({
        where: bWhere,
        select: { jobId: true },
        distinct: ['jobId']
      });

      const jobIds = [...new Set(candidateRows.map((row) => row.jobId))];
      if (jobIds.length === 0) {
        return { pipeline: LIVE_PIPELINE, pairs: [] };
      }

      const history = [];
      for (const ids of chunkIds(jobIds)) {
        const rows = await prisma.jobStatusHistory.findMany({
          where: {
            jobId: { in: ids },
            status: { in: LIVE_PIPELINE },
            job: { isDraft: false }
          },
          select: {
            jobId: true,
            status: true,
            date: true,
            updatedById: true
          },
          orderBy: [{ date: 'asc' }, { id: 'asc' }]
        });
        history.push(...rows);
      }

      const firstArrivalsByJob = new Map();
      history.forEach((row) => {
        let arrivals = firstArrivalsByJob.get(row.jobId);
        if (!arrivals) {
          arrivals = new Map();
          firstArrivalsByJob.set(row.jobId, arrivals);
        }
        if (!arrivals.has(row.status)) {
          arrivals.set(row.status, {
            date: row.date,
            updatedById: row.updatedById
          });
        }
      });

      const pairHours = new Map();
      firstArrivalsByJob.forEach((arrivals) => {
        const ordered = LIVE_PIPELINE
          .filter((status) => arrivals.has(status))
          .map((status) => ({ status, ...arrivals.get(status) }));

        for (let i = 0; i < ordered.length - 1; i++) {
          const from = ordered[i];
          const to = ordered[i + 1];
          const toMs = to.date.getTime();
          if (toMs < startMs || toMs > endMs) continue;
          if (assigneeId && to.updatedById !== assigneeId) continue;
          const hours = (toMs - from.date.getTime()) / (1000 * 60 * 60);
          if (hours < 0) continue;
          const key = `${from.status}|${to.status}`;
          if (!pairHours.has(key)) pairHours.set(key, []);
          pairHours.get(key).push(hours);
        }
      });

      const pairs = [...pairHours.entries()].map(([key, hours]) => {
        const [from, to] = key.split('|');
        return {
          from,
          to,
          sampleCount: hours.length,
          avgHours: roundHours(hours.reduce((sum, value) => sum + value, 0) / hours.length),
          medianHours: roundHours(median(hours)),
          minHours: roundHours(Math.min(...hours)),
          maxHours: roundHours(Math.max(...hours))
        };
      }).sort((a, b) => {
        const fromDiff = LIVE_PIPELINE.indexOf(a.from) - LIVE_PIPELINE.indexOf(b.from);
        if (fromDiff !== 0) return fromDiff;
        return LIVE_PIPELINE.indexOf(a.to) - LIVE_PIPELINE.indexOf(b.to);
      });

      return { pipeline: LIVE_PIPELINE, pairs };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ReportService();

