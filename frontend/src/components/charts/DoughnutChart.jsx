import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const DoughnutChart = ({ 
  data, 
  title, 
  labelKey = 'label', 
  valueKey = 'value',
  height = 300,
  showLegend = true,
  showPercentage = true,
  centerText = null
}) => {
  const colors = [
    '#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1',
    '#13c2c2', '#eb2f96', '#fa8c16', '#2f54eb', '#52c41a'
  ];

  // Handle both Chart.js format and simple array format
  let chartData;
  if (data && data.labels && data.datasets) {
    // Chart.js format
    chartData = data;
  } else {
    // Simple array format
    const safeData = data || [];
    chartData = {
      labels: safeData.map(item => item[labelKey]),
      datasets: [{
        data: safeData.map(item => item[valueKey]),
        backgroundColor: colors.slice(0, safeData.length),
        borderColor: '#fff',
        borderWidth: 3,
        hoverOffset: 8,
        cutout: '60%'
      }]
    };
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'right',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
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
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            
            if (showPercentage) {
              return `${label}: ${value.toLocaleString()} (${percentage}%)`;
            }
            return `${label}: ${value.toLocaleString()}`;
          }
        }
      }
    }
  };

  return (
    <div style={{ height: height, width: '100%', position: 'relative' }}>
      <Doughnut data={chartData} options={options} />
      {centerText && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none'
        }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
            {centerText}
          </div>
        </div>
      )}
    </div>
  );
};

export default DoughnutChart;
