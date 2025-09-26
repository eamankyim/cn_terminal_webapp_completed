import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const BarChart = ({ 
  data, 
  title, 
  xAxisKey = 'label', 
  yAxisKey = 'value',
  datasets = [],
  height = 300,
  showLegend = true,
  showGrid = true,
  horizontal = false,
  stacked = false
}) => {
  // Handle both Chart.js format and simple array format
  let chartData;
  if (data && data.labels && data.datasets) {
    // Chart.js format
    chartData = data;
  } else {
    // Simple array format
    const safeData = data || [];
    chartData = {
      labels: safeData.map(item => item[xAxisKey]),
      datasets: datasets.map((dataset, index) => ({
        label: dataset.label,
        data: safeData.map(item => item[dataset.key]),
        backgroundColor: dataset.colors || `hsl(${index * 60}, 70%, 50%)`,
        borderColor: dataset.borderColors || `hsl(${index * 60}, 70%, 40%)`,
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      }))
    };
  }

  const options = {
    indexAxis: horizontal ? 'y' : 'x',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'top',
      },
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#ddd',
        borderWidth: 1,
        cornerRadius: 6,
        displayColors: true,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed[horizontal ? 'x' : 'y'].toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      x: {
        display: !horizontal,
        grid: {
          display: showGrid && !horizontal,
          color: 'rgba(0, 0, 0, 0.1)'
        },
        stacked: stacked,
        ticks: {
          callback: function(value) {
            return value.toLocaleString();
          }
        }
      },
      y: {
        display: horizontal,
        grid: {
          display: showGrid && horizontal,
          color: 'rgba(0, 0, 0, 0.1)'
        },
        stacked: stacked,
        ticks: {
          callback: function(value) {
            return value.toLocaleString();
          }
        }
      }
    }
  };

  return (
    <div style={{ height: height, width: '100%' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default BarChart;
