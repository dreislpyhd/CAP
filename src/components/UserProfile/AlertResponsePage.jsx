import React, { useState, useEffect, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { API_BASE_URL } from '../../config';

const AlertResponsePage = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [previousAlertCount, setPreviousAlertCount] = useState(0);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const [receivedTimes, setReceivedTimes] = useState({}); // Track when alerts were received
  const [selectedAlert, setSelectedAlert] = useState(null); // For modal display

  useEffect(() => {
    // Get user from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserId(user.id);
    } else {
      setError('User not authenticated');
      setLoading(false);
    }
  }, []);

  // Set previousAlertCount after initial load
  useEffect(() => {
    if (alerts.length > 0 && previousAlertCount === 0) {
      setPreviousAlertCount(alerts.length);
    }
  }, [alerts]);

  const fetchUserAlerts = useCallback(async (manualRefresh = false) => {
    try {
      // Only show loading state for manual refresh or initial load
      if (manualRefresh) {
        setRefreshing(true);
      } else if (loading) {
        // Only set loading to false if it's currently true (initial load)
        setLoading(false);
      }

      const response = await fetch(`${API_BASE_URL}/api/alerts.php?user_id=${userId}`);
      const data = await response.json();

      if (data.success) {
        // Check for new alerts and track their received time
        const currentAlertCount = data.alerts.length;
        const newReceivedTimes = { ...receivedTimes };
        const currentTime = new Date().toISOString();

        // Track received time for new alerts
        data.alerts.forEach(alert => {
          if (!receivedTimes[alert.id]) {
            newReceivedTimes[alert.id] = currentTime;
          }
        });

        setReceivedTimes(newReceivedTimes);

        if (currentAlertCount > previousAlertCount && previousAlertCount > 0 && !manualRefresh) {
          console.log(`New alerts arrived! ${currentAlertCount - previousAlertCount} new alerts`);
        }

        setAlerts(data.alerts);
        setPreviousAlertCount(currentAlertCount);
        setError(null);
        setLastRefresh(new Date());

        // Ensure loading is set to false after successful fetch
        setLoading(false);

        // Only show debug info for manual refresh to reduce console spam
        if (manualRefresh && data.debug) {
          console.log('Debug Info:', data.debug);
        }
      } else {
        setError('Failed to fetch alerts');
        console.error('API Error:', data);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setError('Error fetching alerts');
      setLoading(false);
    } finally {
      // Only clear refreshing state for manual refresh
      if (manualRefresh) {
        setRefreshing(false);
      }
    }
  }, [userId, previousAlertCount, loading, receivedTimes]);

  // Initial fetch when userId is set
  useEffect(() => {
    if (userId) {
      fetchUserAlerts();
    }
  }, [userId, fetchUserAlerts]);

  // Real-time alerts checking - optimized to prevent flickering
  useEffect(() => {
    if (userId) {
      const interval = setInterval(() => {
        fetchUserAlerts(false); // Auto-refresh without loading state
      }, 15000); // Check every 15 seconds to reduce visual updates

      return () => clearInterval(interval);
    }
  }, [userId, fetchUserAlerts]); // Include fetchUserAlerts to prevent stale closures

  const markAsRead = async (alertId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/alert_status.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          alert_id: alertId
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state to mark alert as read
        setAlerts(prevAlerts =>
          prevAlerts.map(alert =>
            alert.id === alertId
              ? { ...alert, is_read: true, read_at: new Date().toISOString() }
              : alert
          )
        );
      }
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  // Filter alerts based on selected filter
  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'unread') {
      return !alert.is_read;
    } else if (filter === 'read') {
      return alert.is_read;
    }
    return true; // 'all' shows everything
  });

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <Bell className="h-6 w-6 mr-2 text-yellow-600" />
          Alert Response
        </h1>
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">Loading alerts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <Bell className="h-6 w-6 mr-2 text-yellow-600" />
          Alert Response
        </h1>
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-red-500">{error}</p>
          <button
            onClick={fetchUserAlerts}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <Bell className="h-6 w-6 mr-2 text-yellow-600" />
          Alert Response
        </h1>
        <div className="flex items-center gap-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="all">All Alerts ({alerts.length})</option>
            <option value="unread">Unread ({alerts.filter(a => !a.is_read).length})</option>
            <option value="read">Read ({alerts.filter(a => a.is_read).length})</option>
          </select>
          <span className="text-sm text-gray-500">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={() => fetchUserAlerts(true)}
            disabled={refreshing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {filteredAlerts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">
            {filter === 'all' ? 'No alerts available for your area.' :
              filter === 'unread' ? 'No unread alerts.' : 'No read alerts.'}
          </p>
          {filter !== 'all' && (
            <button
              onClick={() => setFilter('all')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Show All Alerts
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="divide-y divide-gray-200">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 hover:bg-gray-50 ${!alert.is_read ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <div className={`h-3 w-3 rounded-full ${!alert.is_read ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                  </div>
                  <div className="ml-3 flex-1">
                    <div
                      className="cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                      onClick={() => setSelectedAlert(alert)}
                    >
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${!alert.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                          Disaster Alert: {alert.name}
                        </p>
                        <div className="text-xs text-gray-500">
                          {formatTime(receivedTimes[alert.id] || alert.created_at)} • {formatDate(receivedTimes[alert.id] || alert.created_at)}
                        </div>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${alert.level === 'High'
                            ? 'bg-red-100 text-red-800'
                            : alert.level === 'Moderate'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                          {alert.level}
                        </span>
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {alert.type}
                        </span>
                      </div>
                      {alert.description && (
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                          {alert.description}
                        </p>
                      )}
                      {alert.barangays && alert.barangays.length > 0 && (
                        <p className="mt-1 text-xs text-gray-500">
                          Sent to: {alert.barangays.join(', ')}
                        </p>
                      )}
                    </div>
                    {!alert.is_read && (
                      <div className="mt-2">
                        <button
                          onClick={() => markAsRead(alert.id)}
                          className="text-xs font-medium text-blue-600 hover:text-blue-800"
                        >
                          Mark as read
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Safety Guidelines Section */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Safety Guidelines</h2>
        <div className="space-y-4">
          <div className="border-l-4 border-red-500 pl-4">
            <h3 className="font-semibold text-gray-900">Fire Safety</h3>
            <p className="text-gray-600">Stay low and crawl under smoke. Feel doors before opening - if hot, don't open. Use stairs, not elevators. Have fire extinguisher and know escape routes.</p>
          </div>
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold text-gray-900">Flood Safety</h3>
            <p className="text-gray-600">Move to higher ground immediately. Avoid walking in moving water. Turn off utilities at main switches. Don't drive through flooded areas.</p>
          </div>
          <div className="border-l-4 border-yellow-500 pl-4">
            <h3 className="font-semibold text-gray-900">Earthquake Safety</h3>
            <p className="text-gray-600">Drop, Cover, and Hold On. Stay away from windows and heavy objects. If outdoors, move away from buildings and power lines. Expect aftershocks.</p>
          </div>
        </div>
      </div>

      {/* Emergency Hotlines Section */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Emergency Hotlines</h2>

        {/* Mobile Contact Numbers */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">Mobile Contact Numbers (Rescue & DRRMO)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="border rounded-lg p-3 hover:bg-gray-50">
              <p className="text-sm font-medium text-gray-900">Rescue Hotline 1</p>
              <p className="text-lg font-bold text-blue-600">0916-797-6365</p>
            </div>
            <div className="border rounded-lg p-3 hover:bg-gray-50">
              <p className="text-sm font-medium text-gray-900">Rescue Hotline 2</p>
              <p className="text-lg font-bold text-blue-600">0947-796-4372</p>
            </div>
          </div>
        </div>

        {/* DRRMO Trunkline */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">Caloocan City DRRMO Rescue Trunkline</h3>
          <div className="border rounded-lg p-3 hover:bg-gray-50">
            <p className="text-sm font-medium text-gray-900">Main Hotline</p>
            <p className="text-lg font-bold text-blue-600">(02) 5310-7536 | Local 2287</p>
          </div>
        </div>

        {/* Other Useful Hotlines */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Other Useful Local Hotlines</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="border rounded-lg p-3 hover:bg-gray-50">
              <p className="text-sm font-medium text-gray-900">Caloocan City North Medical Center</p>
              <p className="text-lg font-bold text-blue-600">5310-1463 (Emergency Room)</p>
            </div>
            <div className="border rounded-lg p-3 hover:bg-gray-50">
              <p className="text-sm font-medium text-gray-900">City Hall Security / PNP Precinct</p>
              <p className="text-lg font-bold text-blue-600">(02) 8288-8811</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6">
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-bold text-gray-900">
                  Disaster Alert: {selectedAlert.name}
                </h2>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${selectedAlert.level === 'High'
                    ? 'bg-red-100 text-red-800'
                    : selectedAlert.level === 'Moderate'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                  {selectedAlert.level} Priority
                </span>
                <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                  {selectedAlert.type}
                </span>
                {!selectedAlert.is_read && (
                  <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-orange-100 text-orange-800">
                    Unread
                  </span>
                )}
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                <p className="text-gray-900 whitespace-pre-wrap">
                  {selectedAlert.description || 'No description available'}
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Timeline</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Created:</span>
                    <span className="text-sm text-gray-900">
                      {formatDate(selectedAlert.created_at)} at {formatTime(selectedAlert.created_at)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Received:</span>
                    <span className="text-sm text-gray-900">
                      {formatDate(receivedTimes[selectedAlert.id] || selectedAlert.created_at)} at {formatTime(receivedTimes[selectedAlert.id] || selectedAlert.created_at)}
                    </span>
                  </div>
                  {selectedAlert.read_at && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Read:</span>
                      <span className="text-sm text-gray-900">
                        {formatDate(selectedAlert.read_at)} at {formatTime(selectedAlert.read_at)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                {!selectedAlert.is_read && (
                  <button
                    onClick={() => {
                      markAsRead(selectedAlert.id);
                      setSelectedAlert(null);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Mark as Read
                  </button>
                )}
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertResponsePage;
