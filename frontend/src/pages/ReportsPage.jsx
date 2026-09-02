import React, { useState, useEffect, useRef } from 'react';
import { 
  Card,
  Row, 
  Col, 
  Button, 
  DatePicker,
  Select,
  Space,
  Typography,
  Statistic,
  Table,
  Tag,
  Progress,
  Divider,
  Tabs,
  message,
  Spin,
  Empty,
  Tooltip,
  List,
  Avatar,
  Modal,
  Checkbox,
  Form,
  Alert
} from 'antd';
import { useAuth } from '../contexts/AuthContext';
import { 
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  DownloadOutlined,
  ReloadOutlined,
  CalendarOutlined,
  UserOutlined,
  DollarOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  TeamOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import reportService from '../services/reportService';
import apiService from '../services/api';
import DashboardWidgets from '../components/analytics/DashboardWidgets';
import RealTimeAnalytics from '../components/analytics/RealTimeAnalytics';
import { getJobStatusColor, getJobStatusHexColor, getInvoiceStatusColor, formatJobStatusLabel } from '../utils/statusUtils';
import { getRoleInfo } from '../utils/permissions';
import ResponsiveTable from '../components/common/ResponsiveTable';
import useResponsive from '../hooks/useResponsive';

// Chart Components
import ChartContainer from '../components/charts/ChartContainer';
import LineChart from '../components/charts/LineChart';
import BarChart from '../components/charts/BarChart';
import PieChart from '../components/charts/PieChart';
import DoughnutChart from '../components/charts/DoughnutChart';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;

const ReportsPage = () => {
  const { currentUser } = useAuth();
  const { isMobile } = useResponsive();
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, 'days'),
    dayjs()
  ]);
  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  const [activeTab, setActiveTab] = useState('overview');
  const [assigneeId, setAssigneeId] = useState(undefined);
  const [assigneeOptions, setAssigneeOptions] = useState([]);
  const skipInitialTeamWorkLoad = useRef(true);
  
  // Check if user should see revenue data
  const employeeRoles = ['ENQUIRY_OFFICER', 'ENTRY_OFFICER', 'TRANSPORT_COORDINATOR', 'RELEASE_OFFICER', 'PREINVOICE_OFFICER', 'INVOICE_OFFICER', 'SUPERVISOR', 'REVIEW_OFFICER', 'VETTING_OFFICER', 'CLEARING_OFFICER', 'STAFF', 'DRIVER', 'WAREHOUSE'];
  const shouldHideRevenue = employeeRoles.includes(currentUser?.role);
  
  // Export functionality
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [selectedReports, setSelectedReports] = useState({
    overview: true,
    dailyActivity: true,
    invoices: true,
    customers: true,
    realTimeAnalytics: true
  });
  const [exportFormat, setExportFormat] = useState('pdf');

  // State for different reports
  const [jobStatusData, setJobStatusData] = useState([]);
  const [dailyActivityData, setDailyActivityData] = useState([]);
  const [revenueData, setRevenueData] = useState({});
  const [invoiceData, setInvoiceData] = useState([]);
  const [customerData, setCustomerData] = useState([]);
  const [processingTimeData, setProcessingTimeData] = useState([]);
  const [monthlyTrendsData, setMonthlyTrendsData] = useState([]);
  const [assigneeWorkData, setAssigneeWorkData] = useState([]);
  const [stageTimesData, setStageTimesData] = useState([]);
  const [teamWorkLoading, setTeamWorkLoading] = useState(false);
  
  // Financial reports state
  const [financialData, setFinancialData] = useState({
    expenses: [],
    payouts: [],
    cashflow: []
  });

  // Summary statistics
  const [summaryStats, setSummaryStats] = useState({
    totalJobs: 0,
    completedJobs: 0,
    pendingJobs: 0,
    totalRevenue: 0,
    activeCustomers: 0,
    avgProcessingTime: 0
  });

  useEffect(() => {
    loadAllReports();
  }, [dateRange, selectedPeriod]);

  useEffect(() => {
    if (skipInitialTeamWorkLoad.current) {
      skipInitialTeamWorkLoad.current = false;
      return;
    }
    loadTeamWork();
  }, [assigneeId]);

  const applyTeamWorkResults = (assigneeWork, stageTimes) => {
    const people = Array.isArray(assigneeWork?.people) ? assigneeWork.people : [];
    setAssigneeWorkData(people);
    if (!assigneeId) {
      setAssigneeOptions(people.map((person) => ({ userId: person.userId, name: person.name })));
    }
    setStageTimesData(Array.isArray(stageTimes?.pairs) ? stageTimes.pairs : []);
  };

  const loadTeamWork = async () => {
    setTeamWorkLoading(true);
    try {
      const [assigneeWork, stageTimes] = await Promise.all([
        reportService.getAssigneeWork(dateRange[0], dateRange[1], assigneeId),
        reportService.getStageTimes(dateRange[0], dateRange[1], assigneeId)
      ]);
      applyTeamWorkResults(assigneeWork, stageTimes);
    } catch (error) {
      message.error('Failed to load team work report');
    } finally {
      setTeamWorkLoading(false);
    }
  };

  const loadAllReports = async () => {
    setLoading(true);
    try {
      const [summaryStats, jobStatus, dailyActivity, revenue, invoices, customers, processingTime, monthlyTrends, assigneeWork, stageTimes] = await Promise.all([
        reportService.getSummaryStats(dateRange[0], dateRange[1]),
        reportService.getJobStatusSummary(dateRange[0], dateRange[1]),
        reportService.getDailyActivity(dateRange[0], dateRange[1]),
        reportService.getRevenueSummary(dateRange[0], dateRange[1]),
        reportService.getInvoiceReports(dateRange[0], dateRange[1]),
        reportService.getCustomerActivity(dateRange[0], dateRange[1]),
        reportService.getProcessingTimeReport(dateRange[0], dateRange[1]),
        reportService.getMonthlyTrendsReport(dateRange[0], dateRange[1]),
        reportService.getAssigneeWork(dateRange[0], dateRange[1], assigneeId),
        reportService.getStageTimes(dateRange[0], dateRange[1], assigneeId)
      ]);

    // Load financial data for accountants and IT consultants
    if (currentUser?.role === 'ACCOUNTANT' || currentUser?.role === 'IT_CONSULTANT') {
      await loadFinancialData();
    }

      setSummaryStats(summaryStats);
      setJobStatusData(jobStatus);
      setDailyActivityData(dailyActivity);
      setRevenueData(revenue);
      setInvoiceData(invoices);
      setCustomerData(customers);
      setProcessingTimeData(processingTime);
      setMonthlyTrendsData(monthlyTrends);
      applyTeamWorkResults(assigneeWork, stageTimes);
    } catch (error) {

      message.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const loadJobStatusSummary = async () => {
    try {
      const data = await reportService.getJobStatusSummary(dateRange[0], dateRange[1]);
      setJobStatusData(data);
    } catch (error) {

      message.error('Failed to load job status summary');
    }
  };

  const loadDailyActivity = async () => {
    try {
      const data = await reportService.getDailyActivity(dateRange[0], dateRange[1]);
      setDailyActivityData(data);
    } catch (error) {

      message.error('Failed to load daily activity');
    }
  };

  const loadRevenueSummary = async () => {
    try {
      const data = await reportService.getRevenueSummary(dateRange[0], dateRange[1]);
      setRevenueData(data);
    } catch (error) {

      message.error('Failed to load revenue summary');
    }
  };

  const loadInvoiceReports = async () => {
    try {
      const data = await reportService.getInvoiceReports(dateRange[0], dateRange[1]);
      setInvoiceData(data);
    } catch (error) {

      message.error('Failed to load invoice reports');
    }
  };

  const loadCustomerActivity = async () => {
    try {
      const data = await reportService.getCustomerActivity(dateRange[0], dateRange[1]);
      setCustomerData(data);
    } catch (error) {

      message.error('Failed to load customer activity');
    }
  };

  const loadFinancialData = async () => {
    try {
      // Expenses / payouts / cashflow endpoints live on their own routes and
      // return { <resource>, pagination } envelopes via apiService.
      const params = {
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD')
      };
      const [expensesResponse, payoutsResponse, cashflowResponse] = await Promise.all([
        apiService.get('/expenses', { params }),
        apiService.get('/payouts', { params }),
        apiService.get('/cashflow/transactions', { params })
      ]);

      const expenses = expensesResponse?.expenses || [];
      const payouts = payoutsResponse?.payouts || [];
      const cashflow = cashflowResponse?.transactions || [];

      setFinancialData({
        expenses,
        payouts,
        cashflow
      });
    } catch (error) {

      message.error('Failed to load financial data');
    }
  };

  // Using centralized status color utilities

  // Chart data preparation functions
  const prepareJobStatusChartData = () => {
    const data = Array.isArray(jobStatusData) ? jobStatusData : [];
    return {
      labels: data.map(item => formatJobStatusLabel(item.status)),
      datasets: [{
        label: 'Job Count',
        data: data.map(item => item.count),
        backgroundColor: data.map((item, i) => getJobStatusHexColor(item.status, i)),
        borderColor: data.map((item, i) => getJobStatusHexColor(item.status, i)),
        borderWidth: 2
      }]
    };
  };

  const prepareDailyActivityChartData = () => {
    const data = Array.isArray(dailyActivityData) ? dailyActivityData : [];
    const labels = data.map(item => dayjs(item.date).format('MMM DD'));
    return {
      labels,
      datasets: [
        {
          label: 'New Jobs',
          data: data.map(item => item.newJobs),
          borderColor: '#1890ff',
          backgroundColor: 'rgba(24, 144, 255, 0.1)',
          tension: 0.4
        },
        {
          label: 'Completed Jobs',
          data: data.map(item => item.completedJobs),
          borderColor: '#52c41a',
          backgroundColor: 'rgba(82, 196, 26, 0.1)',
          tension: 0.4
        }
      ]
    };
  };

  const prepareRevenueChartData = () => {
    const data = Array.isArray(dailyActivityData) ? dailyActivityData : [];
    const labels = data.map(item => dayjs(item.date).format('MMM DD'));
    return {
      labels,
      datasets: [{
        label: 'Daily Revenue (GHS)',
        data: data.map(item => item.revenue),
        borderColor: '#722ed1',
        backgroundColor: 'rgba(114, 46, 209, 0.1)',
        tension: 0.4,
        fill: true
      }]
    };
  };

  const prepareCustomerRevenueData = () => {
    const data = Array.isArray(customerData) ? customerData : [];
    return {
      labels: data.slice(0, 10).map(item => item.name),
      datasets: [{
        label: 'Revenue (GHS)',
        data: data.slice(0, 10).map(item => item.revenue),
        backgroundColor: [
          '#ff7875', '#40a9ff', '#73d13d', '#ffa940', '#9254de',
          '#13c2c2', '#eb2f96', '#fa8c16', '#52c41a', '#1890ff'
        ]
      }]
    };
  };

  const prepareProcessingTimeData = () => {
    if (!processingTimeData || !Array.isArray(processingTimeData) || processingTimeData.length === 0) {
      return {
        labels: ['0-2 days', '3-5 days', '6-10 days', '11-15 days', '15+ days'],
        datasets: [{
          label: 'Jobs',
          data: [0, 0, 0, 0, 0],
          backgroundColor: [
            '#52c41a', '#73d13d', '#faad14', '#ff7875', '#ff4d4f'
          ]
        }]
      };
    }

    const timeRanges = processingTimeData.map(item => item.range);
    const data = processingTimeData.map(item => item.count);
    
    return {
      labels: timeRanges,
      datasets: [{
        label: 'Jobs',
        data: data,
        backgroundColor: [
          '#52c41a', '#73d13d', '#faad14', '#ff7875', '#ff4d4f'
        ]
      }]
    };
  };

  const prepareMonthlyTrendData = () => {
    if (!monthlyTrendsData || !Array.isArray(monthlyTrendsData) || monthlyTrendsData.length === 0) {
      return {
        labels: [],
        datasets: [
          {
            label: 'Jobs',
            data: [],
            borderColor: '#1890ff',
            backgroundColor: 'rgba(24, 144, 255, 0.1)',
            yAxisID: 'y'
          },
          {
            label: 'Revenue (GHS)',
            data: [],
            borderColor: '#722ed1',
            backgroundColor: 'rgba(114, 46, 209, 0.1)',
            yAxisID: 'y1'
          }
        ]
      };
    }

    const months = monthlyTrendsData.map(item => item.month);
    const jobsData = monthlyTrendsData.map(item => item.jobs);
    const revenueData = monthlyTrendsData.map(item => item.revenue);
    
    return {
      labels: months,
      datasets: [
        {
          label: 'Jobs',
          data: jobsData,
          borderColor: '#1890ff',
          backgroundColor: 'rgba(24, 144, 255, 0.1)',
          yAxisID: 'y'
        },
        {
          label: 'Revenue (GHS)',
          data: revenueData,
          borderColor: '#722ed1',
          backgroundColor: 'rgba(114, 46, 209, 0.1)',
          yAxisID: 'y1'
        }
      ]
    };
  };

  const exportToExcel = (data, filename) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `${filename}.xlsx`);
    message.success('Report exported successfully');
  };

  const exportToCSV = (data, filename) => {
    const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(data));
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    message.success('Report exported successfully');
  };

  // Export modal handlers
  const showExportModal = () => {
    setExportModalVisible(true);
  };

  const handleExportCancel = () => {
    setExportModalVisible(false);
  };

  const handleReportSelectionChange = (reportType, checked) => {
    setSelectedReports(prev => ({
      ...prev,
      [reportType]: checked
    }));
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const periodLabel = selectedPeriod === 'custom' 
        ? `${dayjs(dateRange[0]).format('MMM DD, YYYY')} - ${dayjs(dateRange[1]).format('MMM DD, YYYY')}`
        : periodOptions.find(opt => opt.value === selectedPeriod)?.label || 'Custom Period';
      
      const filename = `Terminal_Reports_${periodLabel.replace(/[^a-zA-Z0-9]/g, '_')}`;
      
      await exportToPDF(filename);
      
      setExportModalVisible(false);
    } catch (error) {

      message.error('Failed to export reports');
    } finally {
      setExportLoading(false);
    }
  };

  const exportMultipleToExcel = async (filename) => {
    const wb = XLSX.utils.book_new();
    
    // Summary Statistics
    if (selectedReports.summary) {
      const summaryData = {
        'Total Jobs': summaryStats.totalJobs,
        'Completed Jobs': summaryStats.completedJobs,
        'Completion Rate (%)': summaryStats.totalJobs > 0 ? ((summaryStats.completedJobs / summaryStats.totalJobs) * 100).toFixed(1) : 0,
        'Average Processing Time (Days)': summaryStats.avgProcessingTime || 0,
        'Active Customers': summaryStats.activeCustomers
      };
      // Only include revenue if user should see it
      if (!shouldHideRevenue) {
        summaryData['Total Revenue (GHS)'] = revenueData?.totalRevenue || 0;
        summaryData['Revenue per Job (GHS)'] = summaryStats.totalJobs > 0 ? ((revenueData?.totalRevenue || 0) / summaryStats.totalJobs).toFixed(0) : 0;
      }
      const ws1 = XLSX.utils.json_to_sheet([summaryData]);
      XLSX.utils.book_append_sheet(wb, ws1, 'Summary Statistics');
    }

    // Job Status Summary
    if (selectedReports.jobStatus) {
      const jobStatusExport = jobStatusData.map(item => ({
        'Status': item.status,
        'Count': item.count,
        'Percentage (%)': item.percentage
      }));
      const ws2 = XLSX.utils.json_to_sheet(jobStatusExport);
      XLSX.utils.book_append_sheet(wb, ws2, 'Job Status Summary');
    }

    // Daily Activity
    if (selectedReports.dailyActivity) {
      const dailyActivityExport = dailyActivityData.map(item => {
        const data = {
          'Date': dayjs(item.date).format('MMM DD, YYYY'),
          'New Jobs': item.newJobs,
          'Completed Jobs': item.completedJobs
        };
        // Only include revenue if user should see it
        if (!shouldHideRevenue) {
          data['Revenue (GHS)'] = item.revenue;
        }
        return data;
      });
      const ws3 = XLSX.utils.json_to_sheet(dailyActivityExport);
      XLSX.utils.book_append_sheet(wb, ws3, 'Daily Activity');
    }

    // Invoices (only if user should see revenue)
    if (selectedReports.invoices && !shouldHideRevenue) {
      const invoiceExport = invoiceData.map(item => ({
        'Invoice ID': item.id,
        'Customer': item.customer,
        'Amount (GHS)': item.amount,
        'Status': item.status,
        'Date': dayjs(item.date).format('MMM DD, YYYY')
      }));
      const ws4 = XLSX.utils.json_to_sheet(invoiceExport);
      XLSX.utils.book_append_sheet(wb, ws4, 'Invoices');
    }

    // Customers
    if (selectedReports.customers) {
      const customerExport = customerData.map(item => {
        const data = {
          'Customer Name': item.name,
          'Total Jobs': item.jobs,
          'Last Activity': dayjs(item.lastActivity).format('MMM DD, YYYY')
        };
        // Only include revenue if user should see it
        if (!shouldHideRevenue) {
          data['Total Revenue (GHS)'] = item.revenue;
        }
        return data;
      });
      const ws5 = XLSX.utils.json_to_sheet(customerExport);
      XLSX.utils.book_append_sheet(wb, ws5, 'Customers');
    }

    XLSX.writeFile(wb, `${filename}.xlsx`);
    message.success('Reports exported successfully');
  };

  const exportMultipleToCSV = async (filename) => {
    const reports = [];
    
    if (selectedReports.summary) {
      const summaryData = {
        'Total Jobs': summaryStats.totalJobs,
        'Completed Jobs': summaryStats.completedJobs,
        'Completion Rate (%)': summaryStats.totalJobs > 0 ? ((summaryStats.completedJobs / summaryStats.totalJobs) * 100).toFixed(1) : 0,
        'Average Processing Time (Days)': summaryStats.avgProcessingTime || 0,
        'Active Customers': summaryStats.activeCustomers
      };
      // Only include revenue if user should see it
      if (!shouldHideRevenue) {
        summaryData['Total Revenue (GHS)'] = revenueData?.totalRevenue || 0;
        summaryData['Revenue per Job (GHS)'] = summaryStats.totalJobs > 0 ? ((revenueData?.totalRevenue || 0) / summaryStats.totalJobs).toFixed(0) : 0;
      }
      reports.push({
        name: 'Summary Statistics',
        data: [summaryData]
      });
    }

    if (selectedReports.jobStatus) {
      reports.push({
        name: 'Job Status Summary',
        data: jobStatusData.map(item => ({
          'Status': item.status,
          'Count': item.count,
          'Percentage (%)': item.percentage
        }))
      });
    }

    if (selectedReports.dailyActivity) {
      reports.push({
        name: 'Daily Activity',
        data: dailyActivityData.map(item => {
          const data = {
            'Date': dayjs(item.date).format('MMM DD, YYYY'),
            'New Jobs': item.newJobs,
            'Completed Jobs': item.completedJobs
          };
          if (!shouldHideRevenue) {
            data['Revenue (GHS)'] = item.revenue;
          }
          return data;
        })
      });
    }

    if (selectedReports.invoices && !shouldHideRevenue) {
      reports.push({
        name: 'Invoices',
        data: invoiceData.map(item => ({
          'Invoice ID': item.id,
          'Customer': item.customer,
          'Amount (GHS)': item.amount,
          'Status': item.status,
          'Date': dayjs(item.date).format('MMM DD, YYYY')
        }))
      });
    }

    if (selectedReports.customers) {
      reports.push({
        name: 'Customers',
        data: customerData.map(item => {
          const data = {
            'Customer Name': item.name,
            'Total Jobs': item.jobs,
            'Last Activity': dayjs(item.lastActivity).format('MMM DD, YYYY')
          };
          if (!shouldHideRevenue) {
            data['Total Revenue (GHS)'] = item.revenue;
          }
          return data;
        })
      });
    }

    // Create a zip file with multiple CSV files
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    
    reports.forEach(report => {
      const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(report.data));
      zip.file(`${report.name}.csv`, csv);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = window.URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.zip`;
    a.click();
    window.URL.revokeObjectURL(url);
    message.success('Reports exported successfully');
  };

  const exportToPDF = async (filename) => {
    // Create a new window for PDF generation
    const printWindow = window.open('', '_blank');
    
    const periodLabel = selectedPeriod === 'custom' 
      ? `${dayjs(dateRange[0]).format('MMM DD, YYYY')} - ${dayjs(dateRange[1]).format('MMM DD, YYYY')}`
      : periodOptions.find(opt => opt.value === selectedPeriod)?.label || 'Custom Period';

    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Terminal Reports - ${periodLabel}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .section { margin-bottom: 30px; page-break-inside: avoid; }
          .section-title { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 15px; border-bottom: 1px solid #666; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          th, td { border: 1px solid #666; padding: 8px; text-align: left; }
          th { background-color: #f0f0f0; font-weight: bold; color: #333; }
          .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
          .summary-item { border: 1px solid #666; padding: 15px; text-align: center; }
          .summary-value { font-size: 24px; font-weight: bold; color: #333; }
          .summary-label { font-size: 12px; color: #666; margin-top: 5px; }
          .no-data { text-align: center; color: #999; font-style: italic; padding: 20px; }
          @media print { 
            body { margin: 0; color: #000; } 
            .section { page-break-inside: avoid; }
            .header { border-bottom-color: #000; }
            .section-title { color: #000; border-bottom-color: #000; }
            .summary-value { color: #000; }
            .summary-item { border-color: #000; }
            th, td { border-color: #000; }
            th { background-color: #f5f5f5; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Terminal Reports</h1>
          <p>Period: ${periodLabel}</p>
          <p>Generated on: ${dayjs().format('MMM DD, YYYY HH:mm')}</p>
        </div>
    `;

    // Overview Section - Summary Statistics
    if (selectedReports.overview) {
      htmlContent += `
        <div class="section">
          <div class="section-title">Overview - Summary Statistics</div>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-value">${summaryStats.totalJobs}</div>
              <div class="summary-label">Total Jobs</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${summaryStats.completedJobs}</div>
              <div class="summary-label">Completed Jobs</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${summaryStats.totalJobs > 0 ? ((summaryStats.completedJobs / summaryStats.totalJobs) * 100).toFixed(1) : 0}%</div>
              <div class="summary-label">Completion Rate</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${summaryStats.avgProcessingTime || 0}</div>
              <div class="summary-label">Avg Processing Time (Days)</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">₵${(revenueData?.totalRevenue || 0).toLocaleString()}</div>
              <div class="summary-label">Total Revenue</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${summaryStats.activeCustomers}</div>
              <div class="summary-label">Active Customers</div>
            </div>
          </div>
        </div>
      `;

      // Job Status Summary from Overview
      htmlContent += `
        <div class="section">
          <div class="section-title">Overview - Job Status Summary</div>
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Count</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      if (jobStatusData.length > 0) {
        jobStatusData.forEach(item => {
          htmlContent += `
            <tr>
              <td>${item.status}</td>
              <td>${item.count}</td>
              <td>${item.percentage}%</td>
            </tr>
          `;
        });
      } else {
        htmlContent += '<tr><td colspan="3" class="no-data">No data available</td></tr>';
      }
      
      htmlContent += `
            </tbody>
          </table>
        </div>
      `;

      // Revenue by Status from Overview
      if (revenueData?.revenueByStatus && revenueData.revenueByStatus.length > 0) {
        htmlContent += `
          <div class="section">
            <div class="section-title">Overview - Revenue by Status</div>
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Amount (GHS)</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
        `;
        
        revenueData.revenueByStatus.forEach(item => {
          htmlContent += `
            <tr>
              <td>${item.status}</td>
              <td>₵${(item.amount || 0).toLocaleString()}</td>
              <td>${item.percentage || 0}%</td>
            </tr>
          `;
        });
        
        htmlContent += `
              </tbody>
            </table>
          </div>
        `;
      }
    }

    // Daily Activity Tab
    if (selectedReports.dailyActivity) {
      htmlContent += `
        <div class="section">
          <div class="section-title">Daily Activity Tab - Activity Report</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>New Jobs</th>
                <th>Completed Jobs</th>
                <th>Revenue (GHS)</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      if (dailyActivityData.length > 0) {
        dailyActivityData.forEach(item => {
          htmlContent += `
            <tr>
              <td>${dayjs(item.date).format('MMM DD, YYYY')}</td>
              <td>${item.newJobs}</td>
              <td>${item.completedJobs}</td>
              <td>₵${(item.revenue || 0).toLocaleString()}</td>
            </tr>
          `;
        });
      } else {
        htmlContent += '<tr><td colspan="4" class="no-data">No data available</td></tr>';
      }
      
      htmlContent += `
            </tbody>
          </table>
                </div>
      `;
    }

    // Invoices Tab
    if (selectedReports.invoices) {
      htmlContent += `
        <div class="section">
          <div class="section-title">Invoices Tab - Invoice Reports</div>
          <table>
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Customer</th>
                <th>Amount (GHS)</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      if (invoiceData.length > 0) {
        invoiceData.forEach(item => {
          htmlContent += `
            <tr>
              <td>${item.id}</td>
              <td>${item.customer}</td>
              <td>₵${(item.amount || 0).toLocaleString()}</td>
              <td>${item.status}</td>
              <td>${dayjs(item.date).format('MMM DD, YYYY')}</td>
            </tr>
          `;
        });
      } else {
        htmlContent += '<tr><td colspan="5" class="no-data">No data available</td></tr>';
      }
      
      htmlContent += `
            </tbody>
          </table>
                </div>
      `;
    }

    // Customers Tab
    if (selectedReports.customers) {
      htmlContent += `
        <div class="section">
          <div class="section-title">Customers Tab - Customer Activity Report</div>
          <table>
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Total Jobs</th>
                <th>Total Revenue (GHS)</th>
                <th>Last Activity</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      if (customerData.length > 0) {
        customerData.forEach(item => {
          htmlContent += `
            <tr>
              <td>${item.name}</td>
              <td>${item.jobs}</td>
              <td>₵${(item.revenue || 0).toLocaleString()}</td>
              <td>${dayjs(item.lastActivity).format('MMM DD, YYYY')}</td>
            </tr>
          `;
        });
      } else {
        htmlContent += '<tr><td colspan="4" class="no-data">No data available</td></tr>';
      }
      
      htmlContent += `
            </tbody>
          </table>
        </div>
      `;
    }

    // Real-Time Analytics Tab
    if (selectedReports.realTimeAnalytics) {
      htmlContent += `
        <div class="section">
          <div class="section-title">Real-Time Analytics Tab - Live Performance Metrics</div>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-value">${dailyActivityData.length > 0 ? dailyActivityData.reduce((sum, day) => sum + day.newJobs, 0) : 0}</div>
              <div class="summary-label">Total New Jobs (Period)</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${dailyActivityData.length > 0 ? dailyActivityData.reduce((sum, day) => sum + day.completedJobs, 0) : 0}</div>
              <div class="summary-label">Total Completed (Period)</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">₵${dailyActivityData.length > 0 ? dailyActivityData.reduce((sum, day) => sum + (day.revenue || 0), 0).toLocaleString() : '0'}</div>
              <div class="summary-label">Total Revenue (Period)</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${dailyActivityData.length > 0 ? (dailyActivityData.reduce((sum, day) => sum + day.newJobs, 0) / dailyActivityData.length).toFixed(1) : 0}</div>
              <div class="summary-label">Avg Jobs per Day</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">₵${dailyActivityData.length > 0 ? (dailyActivityData.reduce((sum, day) => sum + (day.revenue || 0), 0) / dailyActivityData.length).toFixed(0) : '0'}</div>
              <div class="summary-label">Avg Revenue per Day</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${summaryStats.totalJobs > 0 ? ((summaryStats.completedJobs / summaryStats.totalJobs) * 100).toFixed(1) : 0}%</div>
              <div class="summary-label">Overall Efficiency</div>
            </div>
          </div>
        </div>
      `;
    }

    htmlContent += `
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load, then trigger print
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 500);

    message.success('PDF export initiated - please use your browser\'s print dialog to save as PDF');
  };

  const periodOptions = [
    { value: '7days', label: 'Last 7 Days' },
    { value: '30days', label: 'Last 30 Days' },
    { value: '90days', label: 'Last 90 Days' },
    { value: '1year', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const handlePeriodChange = (value) => {
    setSelectedPeriod(value);
    if (value !== 'custom') {
      const days = value === '7days' ? 7 : value === '30days' ? 30 : value === '90days' ? 90 : 365;
      setDateRange([dayjs().subtract(days, 'days'), dayjs()]);
    }
  };

  const jobStatusColumns = [
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={getJobStatusColor(status)}>{formatJobStatusLabel(status)}</Tag>
    },
    {
      title: 'Count',
      dataIndex: 'count',
      key: 'count',
      render: (count) => <Text strong>{count}</Text>
    },
    {
      title: 'Percentage',
      dataIndex: 'percentage',
      key: 'percentage',
      render: (percentage) => (
        <div>
          <Progress percent={percentage} size="small" />
          <Text type="secondary">{percentage}%</Text>
          </div>
      )
    }
  ];

  const dailyActivityColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => dayjs(date).format('MMM DD, YYYY')
    },
    {
      title: 'New Jobs',
      dataIndex: 'newJobs',
      key: 'newJobs',
      render: (count) => <Tag color="blue">{count}</Tag>
    },
    {
      title: 'Completed Jobs',
      dataIndex: 'completedJobs',
      key: 'completedJobs',
      render: (count) => <Tag color="green">{count}</Tag>
    },
    ...(!shouldHideRevenue ? [{
      title: 'Revenue (GHS)',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (amount) => <Text strong>₵{amount.toLocaleString()}</Text>
    }] : [])
  ];

  // Friendly labels for invoice statuses (reports table + exports)
  const INVOICE_STATUS_LABELS = {
    'PENDING': 'Pending',
    'PARTIALLY_PAID': 'Partially Paid',
    'PAID': 'Paid',
    'OVERDUE': 'Overdue',
    'CANCELLED': 'Cancelled',
    'DRAFT': 'Draft'
  };
  const formatInvoiceStatusLabel = (status) =>
    INVOICE_STATUS_LABELS[status]
    || String(status || '').toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const invoiceColumns = [
    {
      title: 'Invoice ID',
      dataIndex: 'id',
      key: 'id',
      render: (id) => <Text code>{id}</Text>
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer'
    },
    {
      title: 'Amount (GHS)',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => <Text strong>₵{amount.toLocaleString()}</Text>
              },
              {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
      render: (status) => <Tag color={getInvoiceStatusColor(status)}>{formatInvoiceStatusLabel(status)}</Tag>
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => dayjs(date).format('MMM DD, YYYY')
    }
  ];

  const customerColumns = [
    {
      title: 'Customer Name',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Total Jobs',
      dataIndex: 'jobs',
      key: 'jobs',
      render: (count) => <Tag color="blue">{count}</Tag>
    },
    ...(!shouldHideRevenue ? [{
      title: 'Total Revenue (GHS)',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (amount) => <Text strong>₵{amount.toLocaleString()}</Text>
    }] : []),
    {
      title: 'Last Activity',
      dataIndex: 'lastActivity',
      key: 'lastActivity',
      render: (date) => dayjs(date).format('MMM DD, YYYY')
    }
  ];

  const formatHours = (value) => {
    if (value == null || Number.isNaN(Number(value))) return '—';
    return `${Number(value).toFixed(1)}h`;
  };

  const renderStatusCounts = (counts) => {
    const entries = Object.entries(counts || {});
    if (entries.length === 0) {
      return <Text type="secondary">None</Text>;
    }
    return (
      <Space wrap size={[4, 4]}>
        {entries
          .sort((a, b) => b[1] - a[1])
          .map(([status, count]) => (
            <Tag key={status} color={getJobStatusColor(status)}>
              {formatJobStatusLabel(status)}: {count}
            </Tag>
          ))}
      </Space>
    );
  };

  const assigneeWorkColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <div>
          <Text strong>{name}</Text>
          {record.role ? (
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {getRoleInfo(record.role).name}
              </Text>
            </div>
          ) : null}
        </div>
      )
    },
    {
      title: 'Moves',
      dataIndex: 'moves',
      key: 'moves',
      defaultSortOrder: 'descend',
      sorter: (a, b) => a.moves - b.moves,
      render: (count) => <Tag color="blue">{count}</Tag>
    },
    {
      title: 'Jobs touched',
      dataIndex: 'jobsTouched',
      key: 'jobsTouched',
      render: (count) => <Text strong>{count}</Text>
    },
    {
      title: 'Completed',
      dataIndex: 'completed',
      key: 'completed',
      render: (count) => <Tag color="green">{count}</Tag>
    },
    {
      title: 'By status',
      key: 'movesByStatus',
      dataIndex: 'movesByStatus',
      render: (counts) => renderStatusCounts(counts)
    },
    {
      title: 'Assigned now',
      key: 'currentlyAssigned',
      dataIndex: ['currentlyAssigned', 'total'],
      render: (total) => <Text>{total || 0}</Text>
    }
  ];

  const stageTimesColumns = [
    {
      title: 'From',
      dataIndex: 'from',
      key: 'from',
      render: (status) => <Tag color={getJobStatusColor(status)}>{formatJobStatusLabel(status)}</Tag>
    },
    {
      title: 'To',
      dataIndex: 'to',
      key: 'to',
      render: (status) => <Tag color={getJobStatusColor(status)}>{formatJobStatusLabel(status)}</Tag>
    },
    {
      title: 'Avg',
      dataIndex: 'avgHours',
      key: 'avgHours',
      render: formatHours
    },
    {
      title: 'Median',
      dataIndex: 'medianHours',
      key: 'medianHours',
      render: formatHours
    },
    {
      title: 'Min',
      dataIndex: 'minHours',
      key: 'minHours',
      render: formatHours
    },
    {
      title: 'Max',
      dataIndex: 'maxHours',
      key: 'maxHours',
      render: formatHours
    },
    {
      title: 'Sample size',
      dataIndex: 'sampleCount',
      key: 'sampleCount',
      render: (count) => <Text strong>{count}</Text>
    }
  ];

    return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
          <BarChartOutlined style={{ marginRight: '12px', color: '#1890ff' }} />
          Reports & Analytics
        </Title>
        <Text type="secondary">Comprehensive insights into your terminal operations</Text>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Text strong>Period:</Text>
            <Select
              value={selectedPeriod}
              onChange={handlePeriodChange}
              style={{ width: '100%', marginTop: '8px' }}
            >
              {periodOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Text strong>Date Range:</Text>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              style={{ width: '100%', marginTop: '8px' }}
              disabled={selectedPeriod !== 'custom'}
            />
          </Col>
          <Col xs={24} sm={24} md={8} style={{ textAlign: 'right' }}>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadAllReports}
                loading={loading}
              >
                Refresh
              </Button>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={showExportModal}
              >
                Export PDF
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Reports Tabs */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Overview" key="overview">
            {/* Main KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={12} lg={6}>
          <Card>
            <Statistic
                    title="Total Jobs"
                    value={summaryStats.totalJobs}
                    prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
                  <Progress
                    percent={summaryStats.totalJobs > 0 ? (summaryStats.completedJobs / summaryStats.totalJobs) * 100 : 0}
                    size="small"
                    status={summaryStats.totalJobs > 0 && (summaryStats.completedJobs / summaryStats.totalJobs) > 0.8 ? 'success' : 'normal'}
                    style={{ marginTop: '8px' }}
                  />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {summaryStats.totalJobs > 0 ? ((summaryStats.completedJobs / summaryStats.totalJobs) * 100).toFixed(1) : 0}% completion rate
                  </Text>
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card>
            <Statistic
                    title="Avg Processing Time"
                    value={summaryStats.avgProcessingTime || 0}
                    prefix={<ClockCircleOutlined />}
                    suffix="days"
                    precision={1}
                    valueStyle={{ 
                      color: (summaryStats.avgProcessingTime || 0) > 7 ? '#f5222d' : '#52c41a' 
                    }}
                  />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {(summaryStats.avgProcessingTime || 0) > 7 ? 'Above target' : 'Within target'}
                  </Text>
          </Card>
        </Col>
        {!shouldHideRevenue && (
          <Col xs={12} sm={12} lg={6}>
            <Card>
              <Statistic
                      title="Total Revenue"
                      value={revenueData?.totalRevenue || 0}
                      prefix={<DollarOutlined />}
                      suffix="GHS"
                valueStyle={{ color: '#722ed1' }}
              />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      ₵{summaryStats.totalJobs > 0 ? ((revenueData?.totalRevenue || 0) / summaryStats.totalJobs).toFixed(0) : 0} per job
                    </Text>
            </Card>
          </Col>
        )}
        <Col xs={12} sm={12} lg={6}>
          <Card>
            <Statistic
                    title="Active Customers"
                    value={summaryStats.activeCustomers}
                    prefix={<UserOutlined />}
                    valueStyle={{ color: '#fa8c16' }}
                  />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {dailyActivityData.length > 0 ? (dailyActivityData.reduce((sum, day) => sum + day.newJobs, 0) / dailyActivityData.length).toFixed(1) : 0} jobs/day avg
                  </Text>
                </Card>
              </Col>
            </Row>

            {/* Mobile Alert - Show only key stats on mobile */}
            {isMobile && (
              <Alert
                message="Mobile View: Key Statistics Only"
                description="For detailed charts, tables, and analytics, please view this page on a desktop or tablet."
                type="info"
                showIcon
                style={{ marginBottom: '24px' }}
              />
            )}

            {loading ? (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" />
                <div style={{ marginTop: '16px' }}>
                  <Text>Loading charts and analytics...</Text>
                </div>
              </div>
            ) : (
              <>
                {/* Main Charts Row - Hide on mobile */}
                {!isMobile && (
                <>
                <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
                  <Col xs={24} lg={12}>
                    <Card title="Job Status Distribution" size="small">
                      <ChartContainer height={300}>
                        <PieChart 
                          data={prepareJobStatusChartData()}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'bottom'
                              }
                            }
                          }}
                        />
                      </ChartContainer>
                    </Card>
                  </Col>
              <Col xs={24} lg={12}>
                <Card title="Daily Activity Trends" size="small">
                  <ChartContainer height={300}>
                    <LineChart 
                      data={prepareDailyActivityChartData()}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true
                          }
                        },
                        plugins: {
                          legend: {
                            position: 'top'
                          }
                        }
                      }}
                    />
                  </ChartContainer>
                </Card>
              </Col>
            </Row>

            {/* Revenue and Performance Charts */}
            <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
              <Col xs={24} lg={12}>
                <Card title="Daily Revenue Trend" size="small">
                  <ChartContainer height={300}>
                    <LineChart 
                      data={prepareRevenueChartData()}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              callback: function(value) {
                                return '₵' + value.toLocaleString();
                              }
                            }
                          }
                        },
                        plugins: {
                          legend: {
                            display: false
                          }
                        }
                      }}
                    />
                  </ChartContainer>
          </Card>
        </Col>
              <Col xs={24} lg={12}>
                <Card title="Processing Time Distribution" size="small">
                  <ChartContainer height={300}>
                    <DoughnutChart 
                      data={prepareProcessingTimeData()}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom'
                          }
                        }
                      }}
                    />
                  </ChartContainer>
          </Card>
        </Col>
            </Row>

            {/* Customer and Monthly Trends */}
            <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
              <Col xs={24} lg={12}>
                <Card title="Top Customers by Revenue" size="small">
                  <ChartContainer height={300}>
                    <BarChart 
                      data={prepareCustomerRevenueData()}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              callback: function(value) {
                                return '₵' + value.toLocaleString();
                              }
                            }
                          }
                        },
                        plugins: {
                          legend: {
                            display: false
                          }
                        }
                      }}
                    />
                  </ChartContainer>
          </Card>
        </Col>
              <Col xs={24} lg={12}>
                <Card title="Monthly Trends (Jobs vs Revenue)" size="small">
                  <ChartContainer height={300}>
                    <LineChart 
                      data={prepareMonthlyTrendData()}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: {
                              display: true,
                              text: 'Jobs'
                            }
                          },
                          y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: {
                              display: true,
                              text: 'Revenue (GHS)'
                            },
                            grid: {
                              drawOnChartArea: false,
                            },
                            ticks: {
                              callback: function(value) {
                                return '₵' + value.toLocaleString();
                              }
                            }
                          }
                        },
                        plugins: {
                          legend: {
                            position: 'top'
                          }
                        }
                      }}
                    />
                  </ChartContainer>
          </Card>
        </Col>
      </Row>

            {/* Data Tables */}
            <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
              <Col xs={24} lg={12}>
                <Card title="Job Status Summary" size="small">
                  <ResponsiveTable
                    dataSource={jobStatusData}
                    columns={jobStatusColumns}
                    pagination={false}
                    mobileConfig={{
                      primaryFields: ['status'],
                      secondaryFields: ['count', 'percentage']
                    }}
                  />
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title="Revenue by Status" size="small">
                  {(revenueData?.revenueByStatus || []).map((item, index) => (
                    <div key={index} style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <Text>{item.status}</Text>
                        <Text strong>₵{(item.amount || 0).toLocaleString()}</Text>
                      </div>
                      <Progress percent={item.percentage || 0} size="small" />
                    </div>
                  ))}
                </Card>
              </Col>
            </Row>
                </>)}
              </>
            )}
          </TabPane>

          <TabPane tab="Daily Activity" key="daily">
            <Card title="Daily Activity Report" size="small">
              <ResponsiveTable
                dataSource={dailyActivityData}
                columns={dailyActivityColumns}
                pagination={false}
                mobileConfig={{
                  primaryFields: ['date'],
                  secondaryFields: ['jobsCreated', 'invoicesCreated']
                }}
              />
            </Card>
          </TabPane>

          {!shouldHideRevenue && (
            <TabPane tab="Invoices" key="invoices">
              <Card title="Invoice Reports" size="small">
                <ResponsiveTable
                  dataSource={invoiceData}
                  columns={invoiceColumns}
                  pagination={false}
                  mobileConfig={{
                    primaryFields: ['invoiceNumber'],
                    secondaryFields: ['amount', 'status']
                  }}
                />
              </Card>
            </TabPane>
          )}

          <TabPane tab="Customers" key="customers">
            <Card title="Customer Activity" size="small">
              <ResponsiveTable
                dataSource={customerData}
                columns={customerColumns}
                pagination={false}
                mobileConfig={{
                  primaryFields: ['customerName'],
                  secondaryFields: ['totalJobs', 'totalRevenue']
                }}
              />
            </Card>
          </TabPane>

          <TabPane tab="Team Work" key="teamwork">
            <Space style={{ marginBottom: 16 }} wrap>
              <TeamOutlined />
              <Text strong>Assignee:</Text>
              <Select
                showSearch
                optionFilterProp="label"
                value={assigneeId || 'ALL'}
                onChange={(value) => setAssigneeId(value === 'ALL' ? undefined : value)}
                style={{ minWidth: 220 }}
              >
                <Option value="ALL" label="All">All</Option>
                {assigneeOptions.map((person) => (
                  <Option key={person.userId} value={person.userId} label={person.name}>
                    {person.name}
                  </Option>
                ))}
              </Select>
            </Space>
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
              message="Completed = jobs this person moved to Cleared or Delivered. Current assignment can change and is shown separately."
            />
            <Card title="Work by person" size="small" style={{ marginBottom: 16 }}>
              <ResponsiveTable
                dataSource={assigneeWorkData}
                columns={assigneeWorkColumns}
                rowKey="userId"
                pagination={false}
                loading={loading || teamWorkLoading}
                expandable={{
                  expandedRowRender: (record) => (
                    <div>
                      <div style={{ marginBottom: 8 }}>
                        <Text strong>Moves by status: </Text>
                        {renderStatusCounts(record.movesByStatus)}
                      </div>
                      <div>
                        <Text strong>Currently assigned: </Text>
                        {renderStatusCounts(record.currentlyAssigned?.byStatus)}
                      </div>
                    </div>
                  )
                }}
                locale={{
                  emptyText: <Empty description="No status moves in this period" />
                }}
                mobileConfig={{
                  primaryFields: ['name', 'moves', 'jobsTouched', 'completed', 'movesByStatus']
                }}
              />
            </Card>
            <Card title="Time between stages" size="small">
              <ResponsiveTable
                dataSource={stageTimesData}
                columns={stageTimesColumns}
                rowKey={(record) => `${record.from}-${record.to}`}
                pagination={false}
                loading={loading || teamWorkLoading}
                locale={{
                  emptyText: <Empty description="No transitions in this period" />
                }}
                mobileConfig={{
                  primaryFields: ['from', 'to', 'avgHours', 'sampleCount']
                }}
              />
            </Card>
          </TabPane>

          <TabPane tab="Real-Time Analytics" key="realtime">
            <RealTimeAnalytics 
              dateRange={dateRange}
            />
          </TabPane>

          {/* Financial Reports Tab - For Accountants and IT Consultants */}
          {(currentUser?.role === 'ACCOUNTANT' || currentUser?.role === 'IT_CONSULTANT') && (
            <TabPane tab="Financial Reports" key="financial">
              <Row gutter={[16, 16]}>
                {/* Financial Summary Cards */}
                <Col xs={24} sm={8}>
                  <Card>
                    <Statistic
                      title="Total Expenses"
                      value={financialData.expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)}
                      prefix={<DollarOutlined />}
                      suffix="GHS"
                      valueStyle={{ color: '#cf1322' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card>
                    <Statistic
                      title="Total Payouts"
                      value={financialData.payouts.reduce((sum, payout) => sum + (payout.amount || 0), 0)}
                      prefix={<DollarOutlined />}
                      suffix="GHS"
                      valueStyle={{ color: '#389e0d' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card>
                    <Statistic
                      title="Net Profit"
                      value={financialData.payouts.reduce((sum, payout) => sum + (payout.amount || 0), 0) - financialData.expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)}
                      prefix={<DollarOutlined />}
                      suffix="GHS"
                      valueStyle={{ 
                        color: (financialData.payouts.reduce((sum, payout) => sum + (payout.amount || 0), 0) - financialData.expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)) >= 0 ? '#389e0d' : '#cf1322' 
                      }}
                    />
                  </Card>
                </Col>
              </Row>

              <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                {/* Recent Expenses */}
                <Col xs={24} lg={12}>
                  <Card title="Recent Expenses" size="small">
                    <ResponsiveTable
                      dataSource={financialData.expenses.slice(0, 10)}
                      columns={[
                        {
                          title: 'Description',
                          dataIndex: 'description',
                          key: 'description',
                        },
                        {
                          title: 'Amount',
                          dataIndex: 'amount',
                          key: 'amount',
                          render: (amount) => `GHS ${amount?.toLocaleString()}`,
                        },
                        {
                          title: 'Status',
                          dataIndex: 'status',
                          key: 'status',
                          render: (status) => (
                            <Tag color={status === 'APPROVED' ? 'green' : status === 'PENDING' ? 'orange' : 'red'}>
                              {status}
                            </Tag>
                          ),
                        },
                        {
                          title: 'Date',
                          dataIndex: 'createdAt',
                          key: 'createdAt',
                          render: (date) => new Date(date).toLocaleDateString(),
                        },
                      ]}
                      pagination={false}
                      mobileConfig={{
                        primaryFields: ['description', 'amount'],
                        secondaryFields: ['status', 'createdAt']
                      }}
                      locale={{
                        emptyText: <Empty description="No expenses found" />
                      }}
                    />
                  </Card>
                </Col>

                {/* Recent Payouts */}
                <Col xs={24} lg={12}>
                  <Card title="Recent Payouts" size="small">
                    <ResponsiveTable
                      dataSource={financialData.payouts.slice(0, 10)}
                      columns={[
                        {
                          title: 'Description',
                          dataIndex: 'description',
                          key: 'description',
                        },
                        {
                          title: 'Amount',
                          dataIndex: 'amount',
                          key: 'amount',
                          render: (amount) => `GHS ${amount?.toLocaleString()}`,
                        },
                        {
                          title: 'Type',
                          dataIndex: 'type',
                          key: 'type',
                          render: (type) => <Tag color="blue">{type}</Tag>,
                        },
                        {
                          title: 'Status',
                          dataIndex: 'status',
                          key: 'status',
                          render: (status) => (
                            <Tag color={status === 'PROCESSED' ? 'green' : status === 'PENDING' ? 'orange' : 'red'}>
                              {status}
                            </Tag>
                          ),
                        },
                        {
                          title: 'Date',
                          dataIndex: 'createdAt',
                          key: 'createdAt',
                          render: (date) => new Date(date).toLocaleDateString(),
                        },
                      ]}
                      pagination={false}
                      mobileConfig={{
                        primaryFields: ['description', 'amount'],
                        secondaryFields: ['type', 'status', 'createdAt']
                      }}
                      locale={{
                        emptyText: <Empty description="No payouts found" />
                      }}
                    />
                  </Card>
                </Col>
              </Row>

            </TabPane>
          )}
        </Tabs>
      </Card>

      {/* Export Modal */}
      <Modal
        title="Export PDF Report"
        open={exportModalVisible}
        onCancel={handleExportCancel}
        footer={[
          <Button key="cancel" onClick={handleExportCancel}>
            Cancel
          </Button>,
          <Button
            key="export"
            type="primary"
            loading={exportLoading}
            onClick={handleExport}
            disabled={!Object.values(selectedReports).some(Boolean)}
          >
            Export PDF Report
          </Button>
        ]}
        width={600}
      >
        <div style={{ marginBottom: '16px' }}>
          <Text strong>Export Period: </Text>
          <Text>
            {selectedPeriod === 'custom' 
              ? `${dayjs(dateRange[0]).format('MMM DD, YYYY')} - ${dayjs(dateRange[1]).format('MMM DD, YYYY')}`
              : periodOptions.find(opt => opt.value === selectedPeriod)?.label || 'Custom Period'
            }
          </Text>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <Text strong>Select Tabs to Include in PDF:</Text>
          <div style={{ marginTop: '12px' }}>
            <Checkbox
              checked={selectedReports.overview}
              onChange={(e) => handleReportSelectionChange('overview', e.target.checked)}
            >
              Overview Tab - Summary Statistics, Job Status, Revenue Analysis
            </Checkbox>
            <br />
            <Checkbox
              checked={selectedReports.dailyActivity}
              onChange={(e) => handleReportSelectionChange('dailyActivity', e.target.checked)}
            >
              Daily Activity Tab - Daily Activity Report
            </Checkbox>
            <br />
            {!shouldHideRevenue && (
              <>
                <Checkbox
                  checked={selectedReports.invoices}
                  onChange={(e) => handleReportSelectionChange('invoices', e.target.checked)}
                >
                  Invoices Tab - Invoice Reports
                </Checkbox>
                <br />
              </>
            )}
            <Checkbox
              checked={selectedReports.customers}
              onChange={(e) => handleReportSelectionChange('customers', e.target.checked)}
            >
              Customers Tab - Customer Activity Report
            </Checkbox>
            <br />
            <Checkbox
              checked={selectedReports.realTimeAnalytics}
              onChange={(e) => handleReportSelectionChange('realTimeAnalytics', e.target.checked)}
            >
              Real-Time Analytics Tab - Live Performance Metrics
            </Checkbox>
          </div>
        </div>

        <div style={{ 
          padding: '12px', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '4px',
          marginTop: '16px'
        }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            <strong>Note:</strong> The export will include data for the currently selected period and filters. 
            PDF format will open a print dialog where you can save as PDF.
          </Text>
        </div>
      </Modal>
    </div>
  );
};

export default ReportsPage;