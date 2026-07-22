import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { useMemo } from 'react'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function NDVIChart({ data = [] }) {
  const chartData = useMemo(() => ({
    labels: data.map(d => new Date(d.timestamp).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'NDVI Mean',
        data: data.map(d => d.ndvi_mean?.toFixed(3)),
        backgroundColor: data.map(d => {
          const v = d.ndvi_mean
          if (v >= 0.5) return '#16A34A'
          if (v >= 0.3) return '#F59E0B'
          return '#DC2626'
        }),
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  }), [data])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#94A3B8',
        bodyColor: '#F1F5F9',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => `NDVI: ${ctx.parsed.y}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94A3B8', font: { size: 11, family: 'Inter' } },
        border: { display: false },
      },
      y: {
        min: 0,
        max: 1,
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
        ticks: { color: '#94A3B8', font: { size: 11, family: 'Inter' }, stepSize: 0.2 },
        border: { display: false },
      },
    },
  }

  return (
    <div style={{ height: 220 }}>
      <Bar data={chartData} options={options} />
    </div>
  )
}
