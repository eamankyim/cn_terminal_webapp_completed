import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const LineChart = ({ 
  data, 
  title, 
  xAxisKey = 'date', 
  yAxisKey = 'value',
  datasets = [],
  height = 300,
  showLegend = true,
  showGrid = true,
  fillArea = false
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
        borderColor: dataset.color || `hsl(${index * 60}, 70%, 50%)`,
        backgroundColor: fillArea 
          ? `${dataset.color || `hsl(${index * 60}, 70%, 50%)`}20` 
          : 'transparent',
        borderWidth: 2,
        fill: fillArea,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: dataset.color || `hsl(${index * 60}, 70%, 50%)`,
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }))
    };
  }

  const options = {
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
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#ddd',
        borderWidth: 1,
        cornerRadius: 6,
        displayColors: true,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: showGrid,
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          maxRotation: 45,
          minRotation: 0
        }
      },
      y: {
        display: true,
        grid: {
          display: showGrid,
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          callback: function(value) {
            return value.toLocaleString();
          }
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  return (
    <div style={{ height: height, width: '100%' }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default LineChart;
