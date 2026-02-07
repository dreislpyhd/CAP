import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Helper function to generate colors dynamically
const generateColors = (count, alpha = 0.8) => {
  const baseColors = [
    [239, 68, 68],   // red
    [245, 158, 11],  // amber
    [59, 130, 246],  // blue
    [34, 197, 94],   // green
    [168, 85, 247],  // purple
    [236, 72, 153],  // pink
    [251, 146, 60],  // orange
    [20, 184, 166],  // teal
    [100, 116, 139], // slate
    [107, 114, 128], // gray
  ];
  
  const colors = [];
  for (let i = 0; i < count; i++) {
    const color = baseColors[i % baseColors.length];
    colors.push(alpha === 1 ? `rgb(${color.join(',')})` : `rgba(${color.join(',')}, ${alpha})`);
  }
  return colors;
};

function DashboardOverview() {
  const [totals, setTotals] = useState({
    incidentReports: 0,
    reliefBeneficiaries: 0,
    totalEvents: 0,
    totalAlerts: 0
  });
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState({
    incidentTrends: { labels: [], data: [] },
    reliefDistribution: { labels: [], data: [] },
    alertLevels: { labels: [], data: [] },
    eventsStatus: { labels: [], data: [] }
  });

  useEffect(() => {
    fetchDashboardTotals();
  }, []);

  const fetchDashboardTotals = async () => {
    try {
      // Fetch incident reports
      const incidentsResponse = await axios.get('http://localhost/gsm/backend/api/incidents.php');
      const incidents = incidentsResponse.data || [];
      
      // Fetch relief beneficiaries from evacuees API (same as reliefBene.jsx)
      const reliefResponse = await fetch('http://localhost/gsm/backend/api/rgd/evacuees.php', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      const reliefDataText = await reliefResponse.text();
      let reliefData = {};
      
      try {
        reliefData = reliefDataText ? JSON.parse(reliefDataText) : {};
      } catch (e) {
        throw new Error('Invalid server response');
      }
      
      // Filter only approved beneficiaries (same logic as reliefBene.jsx)
      const approvedBeneficiaries = reliefData.success ? (reliefData.data || []).filter(person => 
        person.status === 'Approved' || person.status === 'approved'
      ) : [];
      
      // Fetch events from TDS.jsx API
      const eventsResponse = await axios.get('http://localhost/gsm/backend/api/coordination/training.php');
      const eventsData = eventsResponse.data.success ? (eventsResponse.data.data || []) : [];
      
      // Fetch alerts
      const alertsResponse = await axios.get('http://localhost/gsm/backend/api/alerts.php');
      console.log('Alerts API Response:', alertsResponse.data);
      
      let alerts = [];
      if (alertsResponse.data.success) {
        alerts = alertsResponse.data.alerts || [];
      } else {
        alerts = alertsResponse.data || [];
      }
      
      console.log('Processed alerts:', alerts);
      
      // Process data for charts
      processChartData(incidents, approvedBeneficiaries, eventsData, alerts);
      
      setTotals({
        incidentReports: incidents.length,
        reliefBeneficiaries: approvedBeneficiaries.length,
        totalEvents: eventsData.length,
        totalAlerts: alerts.length
      });
    } catch (error) {
      console.error('Error fetching dashboard totals:', error);
    } finally {
      setLoading(false);
    }
  };

  const processChartData = (incidents, beneficiaries, events, alerts) => {
    // Process incident trends (last 7 days)
    const incidentTrends = processIncidentTrends(incidents);
    
    // Process relief distribution by zone
    const reliefDistribution = processReliefDistribution(beneficiaries);
    
    // Process alert levels
    const alertLevels = processAlertLevels(alerts);
    
    // Process events status
    const eventsStatus = processEventsStatus(events);
    
    setChartData({
      incidentTrends,
      reliefDistribution,
      alertLevels,
      eventsStatus
    });
  };

  const processIncidentTrends = (incidents) => {
    const last7Days = [];
    const incidentCounts = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      last7Days.push(dateStr);
      
      const dayIncidents = incidents.filter(incident => {
        if (!incident.created_at) return false;
        const incidentDate = new Date(incident.created_at);
        return incidentDate.toDateString() === date.toDateString();
      });
      incidentCounts.push(dayIncidents.length);
    }
    
    return { labels: last7Days, data: incidentCounts };
  };

  const processReliefDistribution = (beneficiaries) => {
    const zoneCounts = {};
    
    beneficiaries.forEach(beneficiary => {
      const zone = beneficiary.zone || 'Unknown';
      zoneCounts[zone] = (zoneCounts[zone] || 0) + 1;
    });
    
    const labels = Object.keys(zoneCounts);
    const data = Object.values(zoneCounts);
    
    return { labels, data };
  };

  const processAlertLevels = (alerts) => {
    console.log('Processing alert levels for alerts:', alerts);
    
    const levelCounts = {};
    
    alerts.forEach(alert => {
      const level = (alert.level || 'unknown').toLowerCase().trim();
      console.log('Alert level:', level, 'for alert:', alert.name);
      
      levelCounts[level] = (levelCounts[level] || 0) + 1;
    });
    
    console.log('Final level counts:', levelCounts);
    
    // Convert to proper case for display
    const labels = Object.keys(levelCounts).map(level => 
      level.charAt(0).toUpperCase() + level.slice(1)
    );
    const data = Object.values(levelCounts);
    
    return { labels, data };
  };

  const processEventsStatus = (events) => {
    const statusCounts = {};
    
    events.forEach(event => {
      const status = event.status || 'Unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    const labels = Object.keys(statusCounts);
    const data = Object.values(statusCounts);
    
    return { labels, data };
  };

  

  if (loading) {
    return (
      <div className='mx-1 mt-1 p-6 dark:bg-slate-900 bg-white dark:text-slate-300 rounded-lg'>
        <div className="text-center py-20">
          <p className="text-gray-500 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Ensure totals are numbers before calling toLocaleString
  const safeTotals = {
    incidentReports: (totals.incidentReports || 0),
    reliefBeneficiaries: (totals.reliefBeneficiaries || 0),
    totalEvents: (totals.totalEvents || 0),
    totalAlerts: (totals.totalAlerts || 0)
  };

  

  if (loading) {
    return (
      <div className='mx-1 mt-1 p-6 dark:bg-slate-900 bg-white dark:text-slate-300 rounded-lg'>
        <div className="text-center py-20">
          <p className="text-gray-500 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='mx-1 mt-1 p-6 dark:bg-slate-900 bg-white dark:text-slate-300 rounded-lg'>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard Overview</h1>
        <p className="text-gray-600 dark:text-gray-400">System statistics and totals</p>
      </div>
      
      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Incident Reports */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Incident Reports</p>
              <p className="text-3xl font-bold">{safeTotals.incidentReports.toLocaleString()}</p>
              <p className="text-red-200 text-xs mt-1">Total reported incidents</p>
            </div>
            <div className="bg-red-700 p-3 rounded-lg">
              <svg className="w-6 h-6 text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Relief Beneficiaries */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Relief Beneficiaries</p>
              <p className="text-3xl font-bold">{safeTotals.reliefBeneficiaries.toLocaleString()}</p>
              <p className="text-green-200 text-xs mt-1">Approved beneficiaries</p>
            </div>
            <div className="bg-green-700 p-3 rounded-lg">
              <svg className="w-6 h-6 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Events */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Events</p>
              <p className="text-3xl font-bold">{safeTotals.totalEvents.toLocaleString()}</p>
              <p className="text-blue-200 text-xs mt-1">Training & events</p>
            </div>
            <div className="bg-blue-700 p-3 rounded-lg">
              <svg className="w-6 h-6 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Alerts */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Total Alerts</p>
              <p className="text-3xl font-bold">{safeTotals.totalAlerts.toLocaleString()}</p>
              <p className="text-orange-200 text-xs mt-1">System alerts</p>
            </div>
            <div className="bg-orange-700 p-3 rounded-lg">
              <svg className="w-6 h-6 text-orange-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Incident Trends Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Incident Trends (Last 7 Days)</h3>
          <div className="h-64">
            <Line
              key="incident-trends-chart"
              data={{
                labels: chartData.incidentTrends.labels,
                datasets: [
                  {
                    label: 'Incidents',
                    data: chartData.incidentTrends.data,
                    borderColor: 'rgb(239, 68, 68)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.3,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: 'rgba(156, 163, 175, 0.2)',
                    },
                  },
                  x: {
                    grid: {
                      color: 'rgba(156, 163, 175, 0.2)',
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Relief Distribution Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Relief Distribution by Zone</h3>
          <div className="h-64">
            <Bar
              key="relief-distribution-chart"
              data={{
                labels: chartData.reliefDistribution.labels,
                datasets: [
                  {
                    label: 'Beneficiaries',
                    data: chartData.reliefDistribution.data,
                    backgroundColor: 'rgba(34, 197, 94, 0.8)',
                    borderColor: 'rgb(34, 197, 94)',
                    borderWidth: 1,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: 'rgba(156, 163, 175, 0.2)',
                    },
                  },
                  x: {
                    grid: {
                      color: 'rgba(156, 163, 175, 0.2)',
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Alert Levels Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Alert Levels Distribution</h3>
          <div className="h-64">
            <Doughnut
              key="alert-levels-chart"
              data={{
                labels: chartData.alertLevels.labels,
                datasets: [
                  {
                    data: chartData.alertLevels.data,
                    backgroundColor: generateColors(chartData.alertLevels.labels.length),
                    borderColor: generateColors(chartData.alertLevels.labels.length, 1),
                    borderWidth: 1,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Events Status Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Events Status Overview</h3>
          <div className="h-64">
            <Bar
              key="events-status-chart"
              data={{
                labels: chartData.eventsStatus.labels,
                datasets: [
                  {
                    label: 'Events',
                    data: chartData.eventsStatus.data,
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: 'rgb(59, 130, 246)',
                    borderWidth: 1,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: 'rgba(156, 163, 175, 0.2)',
                    },
                  },
                  x: {
                    grid: {
                      color: 'rgba(156, 163, 175, 0.2)',
                    },
                  },
                },
              }}
            />
          </div>
        </div>

      </div>

      
    </div>
  );
}

export default DashboardOverview;
