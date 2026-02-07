import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  User, LogOut, Settings, Bell, Home, ChevronDown, Clock, 
  MapPin, Droplet, Wind, Thermometer, MessageSquare, 
  ClipboardList, Calendar, AlertTriangle, X, CheckCircle, 
  AlertCircle, FileText, Target
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

// Import module pages
import MapPage from './MapPage';
import CalendarPage from './CalendarPage';
import ReliefFormPage from './ReliefFormPage';
import IncidentReportPage from './IncidentReportPage';
import AlertResponsePage from './AlertResponsePage';
import ChatbotPage from './ChatbotPage';
import AccountSettingsPage from './AccountSettingsPage';

const Homepage = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeModule, setActiveModule] = useState(() => {
    const saved = localStorage.getItem('userActiveModule');
    if (saved) return saved;
    const path = location.pathname.split('/')[1] || 'profile';
    switch (path) {
      case 'profile': return 'home';
      case 'relief-form': return 'relief';
      case 'incident-report': return 'incident';
      case 'alert-response': return 'alert';
      case 'account-settings': return 'account-settings';
      case 'map': return 'map';
      case 'chatbot': return 'chatbot';
      case 'calendar': return 'calendar';
      default: return 'home';
    }
  });
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notificationRef = useRef(null);
  
  useEffect(() => {
    const path = location.pathname.split('/')[1] || 'profile';
    let moduleFromPath = 'home';
    switch (path) {
      case 'profile': moduleFromPath = 'home'; break;
      case 'relief-form': moduleFromPath = 'relief'; break;
      case 'incident-report': moduleFromPath = 'incident'; break;
      case 'alert-response': moduleFromPath = 'alert'; break;
      case 'account-settings': moduleFromPath = 'account-settings'; break;
      case 'map': moduleFromPath = 'map'; break;
      case 'chatbot': moduleFromPath = 'chatbot'; break;
      case 'calendar': moduleFromPath = 'calendar'; break;
      default: moduleFromPath = 'home';
    }
    if (moduleFromPath !== activeModule) {
      setActiveModule(moduleFromPath);
      localStorage.setItem('userActiveModule', moduleFromPath);
    }
  }, [location.pathname]);

  const setAndNavigate = (moduleId) => {
    setActiveModule(moduleId);
    localStorage.setItem('userActiveModule', moduleId);
    let route = 'profile';
    switch (moduleId) {
      case 'home': route = 'profile'; break;
      case 'relief': route = 'relief-form'; break;
      case 'incident': route = 'incident-report'; break;
      case 'alert': route = 'alert-response'; break;
      case 'account-settings': route = 'account-settings'; break;
      case 'map': route = 'map'; break;
      case 'chatbot': route = 'chatbot'; break;
      case 'calendar': route = 'calendar'; break;
      default: route = 'profile';
    }
    navigate(`/${route}`, { replace: true });
  };
  const renderModule = () => {
    switch(activeModule) {
      case 'home':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Dashboard Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Weather Card */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Weather Update</h3>
                <div className="flex items-center">
                  <div className="text-4xl mr-4">
                    {weather.main.temp}°C
                  </div>
                  <div>
                    <p className="text-gray-600">{weather.weather[0].main}</p>
                    <p className="text-sm text-gray-500">Humidity: {weather.main.humidity}%</p>
                    <p className="text-sm text-gray-500">Wind: {weather.wind.speed} m/s</p>
                  </div>
                </div>
              </div>

              {/* Time Card */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Current Time</h3>
                <div className="text-2xl font-mono">
                  {currentTime.toLocaleTimeString()}
                </div>
                <div className="text-gray-500 text-sm mt-1">
                  {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setAndNavigate('incident')}
                    className="bg-red-100 text-red-700 p-3 rounded-md hover:bg-red-200 transition-colors flex flex-col items-center"
                  >
                    <AlertTriangle className="h-6 w-6 mb-1" />
                    <span className="text-sm">Report Incident</span>
                  </button>
                  <button 
                    onClick={() => setAndNavigate('relief')}
                    className="bg-yellow-100 text-yellow-700 p-3 rounded-md hover:bg-yellow-200 transition-colors flex flex-col items-center"
                  >
                    <ClipboardList className="h-6 w-6 mb-1" />
                    <span className="text-sm">Request Relief</span>
                  </button>
                  <button 
                    onClick={() => setAndNavigate('alert')}
                    className="bg-blue-100 text-blue-700 p-3 rounded-md hover:bg-blue-200 transition-colors flex flex-col items-center"
                  >
                    <Bell className="h-6 w-6 mb-1" />
                    <span className="text-sm">View Alerts</span>
                  </button>
                  <button 
                    onClick={() => setAndNavigate('chatbot')}
                    className="bg-green-100 text-green-700 p-3 rounded-md hover:bg-green-200 transition-colors flex flex-col items-center"
                  >
                    <MessageSquare className="h-6 w-6 mb-1" />
                    <span className="text-sm">Chat Support</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Activity Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Welcome, {user.name || 'User'}</h3>
                <div className="text-sm text-gray-500">{user.role}</div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                <div className="flex items-start p-3 hover:bg-gray-50 rounded-md">
                  <div className="bg-blue-100 p-2 rounded-full mr-3">
                    <Bell className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">New alert received</p>
                    <p className="text-sm text-gray-500">Flood warning in your area. Stay safe.</p>
                    <p className="text-xs text-gray-400">10 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-start p-3 hover:bg-gray-50 rounded-md">
                  <div className="bg-green-100 p-2 rounded-full mr-3">
                    <ClipboardList className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Relief request submitted</p>
                    <p className="text-sm text-gray-500">Your request for food pack has been received.</p>
                    <p className="text-xs text-gray-400">2 hours ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'map':
        return <MapPage />;
      case 'calendar':
        return <CalendarPage />;
      case 'relief':
        return <ReliefFormPage />;
      case 'incident':
        return <IncidentReportPage />;
      case 'alert':
        return <AlertResponsePage />;
      case 'chatbot':
        return <ChatbotPage />;
      case 'account-settings':
        return <AccountSettingsPage />;
      default:
        return (
          <div className="p-6">
            <p className="text-gray-600">Select an option from the navigation menu to get started.</p>
          </div>
        );
    }
  };
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const dropdownRef = useRef(null);
  const [weather, setWeather] = useState({
    main: {
      temp: 28,
      humidity: 78,
    },
    weather: [{ main: 'Sunny' }],
    wind: {
      speed: 3.1
    }
  });

 // In Homepage.jsx, update the user state initialization:

const [user, setUser] = useState(() => {
  const savedUser = localStorage.getItem('user');
  return savedUser 
    ? JSON.parse(savedUser)
    : { name: 'Guest', email: '', role: 'guest' };
});

// And in the welcome message:
<h3 className="text-lg font-semibold text-gray-800">Welcome, {user.full_name || 'User'}</h3>

  // Load user data from localStorage on component mount
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (userData) {
      setUser(prev => ({
        ...prev,
        name: userData.full_name || 'User',
        email: userData.email || '',
        role: userData.role || 'User',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.full_name || 'User')}&background=4CAF50&color=fff`
      }));
    }
  }, []);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Fetch weather data
    const fetchWeather = async () => {
      try {
        // This is a mock weather data - in a real app, you would fetch this from a weather API
        const mockWeather = {
          main: {
            temp: 28,
            humidity: 78,
          },
          weather: [{ main: 'Sunny' }],
          wind: {
            speed: 3.1
          }
        };
        setWeather(mockWeather);
      } catch (error) {
        console.error('Error fetching weather:', error);
      }
    };

    fetchWeather();

    // Cleanup interval on component unmount
    return () => clearInterval(timer);
  }, []);

  // Mock weather data for initial render
  const weatherData = {
    main: {
      temp: 32,
      feels_like: 36,
      humidity: 70
    },
    weather: [{
      main: 'Sunny',
      description: 'clear sky',
      icon: '01d'
    }],
    wind: {
      speed: 5.14
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close notifications when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = userData.id;
      const userEmail = userData.email;
      const userContact = userData.contact_number;

      // Get saved read notification IDs
      const savedReadNotifications = localStorage.getItem('readNotifications');
      const readIds = savedReadNotifications ? JSON.parse(savedReadNotifications) : [];

      // Fetch all APIs with error handling
      const [reliefResponse, incidentResponse, alertsResponse] = await Promise.allSettled([
        fetch('http://localhost/gsm/backend/api/rgd/evacuees.php'),
        fetch('http://localhost/gsm/backend/api/incidents.php'),
        fetch(`http://localhost/gsm/backend/api/alerts.php?user_id=${userId}`)
      ]);

      let reliefData = { success: false, data: [] };
      let incidentData = [];
      let alertsData = { success: false, alerts: [] };

      // Process relief data
      if (reliefResponse.status === 'fulfilled') {
        try {
          reliefData = await reliefResponse.value.json();
        } catch (e) {
          console.error('Error parsing relief data:', e);
        }
      } else {
        console.error('Relief API error:', reliefResponse.reason);
      }

      // Process incident data
      if (incidentResponse.status === 'fulfilled') {
        try {
          incidentData = await incidentResponse.value.json();
        } catch (e) {
          console.error('Error parsing incident data:', e);
        }
      } else {
        console.error('Incident API error:', incidentResponse.reason);
      }

      // Process alerts data
      if (alertsResponse.status === 'fulfilled') {
        try {
          alertsData = await alertsResponse.value.json();
        } catch (e) {
          console.error('Error parsing alerts data:', e);
        }
      } else {
        console.error('Alerts API error:', alertsResponse.reason);
      }

      const allNotifications = [];

      // Process relief submissions - match by user_id, email, or contact
      if (reliefData.success && reliefData.data) {
        reliefData.data.forEach(submission => {
          // Match by user_id first, then fallback to email/contact matching
          const isUserSubmission = (submission.user_id == userId) ||
                                 (submission.email && submission.email === userEmail) ||
                                 (submission.contact && submission.contact === userContact);
          
          if (isUserSubmission) {
            const notificationId = `relief-${submission.id}`;
            // Check if this notification was already marked as read by user
            const wasManuallyRead = readIds.includes(notificationId);
            allNotifications.push({
              id: notificationId,
              type: 'relief',
              title: 'Relief Form Status',
              message: `Your relief form submission is ${submission.status}`,
              status: submission.status,
              timestamp: new Date(submission.created_at),
              read: wasManuallyRead // Respect user's manual read status
            });
          }
        });
      }

      // Process incident reports - match by user_id, email, or contact
      if (incidentData && Array.isArray(incidentData)) {
        incidentData.forEach(incident => {
          // Match by user_id first, then fallback to email/contact matching
          const isUserIncident = (incident.user_id == userId) ||
                               (incident.reporter_email && incident.reporter_email === userEmail) ||
                               (incident.reporter_contact && incident.reporter_contact === userContact);
          
          if (isUserIncident) {
            const notificationId = `incident-${incident.id}`;
            allNotifications.push({
              id: notificationId,
              type: 'incident',
              title: 'Incident Report Status',
              message: `Your incident report is ${incident.status}`,
              status: incident.status,
              timestamp: new Date(incident.timestamp),
              read: readIds.includes(notificationId) || incident.status !== 'Pending'
            });
          }
        });
      }

      // Process alerts
      if (alertsData.success && alertsData.alerts) {
        alertsData.alerts.forEach(alert => {
          const notificationId = `alert-${alert.id}`;
          allNotifications.push({
            id: notificationId,
            type: 'alert',
            title: 'Disaster Alert',
            message: alert.name,
            description: alert.description,
            level: alert.level,
            timestamp: new Date(alert.created_at),
            read: readIds.includes(notificationId) || (alert.is_read || false)
          });
        });
      }

      // Sort by timestamp (newest first) and remove duplicates
      const uniqueNotifications = allNotifications.filter((notification, index, self) =>
        index === self.findIndex((n) => n.id === notification.id)
      );
      uniqueNotifications.sort((a, b) => b.timestamp - a.timestamp);
      setNotifications(uniqueNotifications);

    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Fetch notifications on component mount and periodically
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Real-time notification checking (every 5 seconds for immediate updates)
  useEffect(() => {
    const quickCheckInterval = setInterval(() => {
      checkForNewNotifications();
    }, 5000); // Check every 5 seconds for immediate updates
    
    return () => clearInterval(quickCheckInterval);
  }, []);

  // Check for new notifications (lightweight check)
  const checkForNewNotifications = useCallback(async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = userData.id;
      const userEmail = userData.email;
      const userContact = userData.contact_number;

      // Get current notification IDs from state directly
      const currentIds = notifications.map(n => n.id);
      const savedReadNotifications = localStorage.getItem('readNotifications');
      const readIds = savedReadNotifications ? JSON.parse(savedReadNotifications) : [];

      // Quick fetch of latest data with error handling
      const [reliefResponse, incidentResponse, alertsResponse] = await Promise.allSettled([
        fetch('http://localhost/gsm/backend/api/rgd/evacuees.php'),
        fetch('http://localhost/gsm/backend/api/incidents.php'),
        fetch(`http://localhost/gsm/backend/api/alerts.php?user_id=${userId}`)
      ]);

      let reliefData = { success: false, data: [] };
      let incidentData = [];
      let alertsData = { success: false, alerts: [] };

      // Process relief data
      if (reliefResponse.status === 'fulfilled') {
        try {
          reliefData = await reliefResponse.value.json();
        } catch (e) {
          console.error('Error parsing relief data in quick check:', e);
        }
      }

      // Process incident data
      if (incidentResponse.status === 'fulfilled') {
        try {
          incidentData = await incidentResponse.value.json();
        } catch (e) {
          console.error('Error parsing incident data in quick check:', e);
        }
      }

      // Process alerts data
      if (alertsResponse.status === 'fulfilled') {
        try {
          alertsData = await alertsResponse.value.json();
        } catch (e) {
          console.error('Error parsing alerts data in quick check:', e);
        }
      }

      const newNotifications = [];

      // Check for new relief submissions or status changes
      if (reliefData.success && reliefData.data) {
        reliefData.data.forEach(submission => {
          const isUserSubmission = (submission.user_id == userId) ||
                                 (submission.email && submission.email === userEmail) ||
                                 (submission.contact && submission.contact === userContact);
          
          if (isUserSubmission) {
            const notificationId = `relief-${submission.id}`;
            const existingNotification = notifications.find(n => n.id === notificationId);
            
            // Check if this is a new notification OR a status change
            const isNewNotification = !currentIds.includes(notificationId);
            const hasStatusChanged = existingNotification && existingNotification.status !== submission.status;
            const wasManuallyRead = readIds.includes(notificationId);
            
            if (isNewNotification || hasStatusChanged) {
              // Show as unread for new notifications or status changes, unless it was already manually read
              const isRead = wasManuallyRead && !hasStatusChanged;
              newNotifications.push({
                id: notificationId,
                type: 'relief',
                title: 'Relief Form Status',
                message: `Your relief form submission is ${submission.status}`,
                status: submission.status,
                timestamp: new Date(submission.created_at),
                read: isRead
              });
            }
          }
        });
      }

      // Check for new incident reports
      if (incidentData && Array.isArray(incidentData)) {
        incidentData.forEach(incident => {
          const isUserIncident = (incident.user_id == userId) ||
                               (incident.reporter_email && incident.reporter_email === userEmail) ||
                               (incident.reporter_contact && incident.reporter_contact === userContact);
          
          if (isUserIncident) {
            const notificationId = `incident-${incident.id}`;
            if (!currentIds.includes(notificationId)) {
              newNotifications.push({
                id: notificationId,
                type: 'incident',
                title: 'Incident Report Status',
                message: `Your incident report is ${incident.status}`,
                status: incident.status,
                timestamp: new Date(incident.timestamp),
                read: readIds.includes(notificationId) || incident.status !== 'Pending'
              });
            }
          }
        });
      }

      // Check for new alerts
      if (alertsData.success && alertsData.alerts) {
        alertsData.alerts.forEach(alert => {
          const notificationId = `alert-${alert.id}`;
          if (!currentIds.includes(notificationId)) {
            newNotifications.push({
              id: notificationId,
              type: 'alert',
              title: 'Disaster Alert',
              message: alert.name,
              description: alert.description,
              level: alert.level,
              timestamp: new Date(alert.created_at),
              read: readIds.includes(notificationId) || (alert.is_read || false)
            });
          }
        });
      }

      // If new notifications found, add them to the top
      if (newNotifications.length > 0) {
        setNotifications(prev => {
          // Remove any existing notifications with the same IDs to prevent duplicates
          const existingIds = prev.map(n => n.id);
          const filteredNew = newNotifications.filter(n => !existingIds.includes(n.id));
          const updated = [...filteredNew, ...prev];
          return updated.sort((a, b) => b.timestamp - a.timestamp);
        });
      }

    } catch (error) {
      console.error('Error checking for new notifications:', error);
    }
  }, []); // Empty dependency array to prevent infinite loops

  // Load read notifications from localStorage
  useEffect(() => {
    const savedReadNotifications = localStorage.getItem('readNotifications');
    if (savedReadNotifications) {
      try {
        const readIds = JSON.parse(savedReadNotifications);
        setNotifications(prev => 
          prev.map(n => ({ 
            ...n, 
            read: readIds.includes(n.id) // Force read status from localStorage
          }))
        );
      } catch (e) {
        console.error('Error parsing saved read notifications:', e);
      }
    }
  }, []);

  // Save read notifications to localStorage when they change
  useEffect(() => {
    const readIds = notifications.filter(n => n.read).map(n => n.id);
    localStorage.setItem('readNotifications', JSON.stringify(readIds));
  }, [notifications]);

  // Get notification icon
  const getNotificationIcon = (notification) => {
    switch (notification.type) {
      case 'relief':
        return notification.status === 'Approved' 
          ? <CheckCircle className="w-5 h-5 text-green-500" />
          : notification.status === 'Declined'
            ? <X className="w-5 h-5 text-red-500" />
            : <Clock className="w-5 h-5 text-yellow-500" />;
      case 'incident':
        return notification.status === 'Resolved'
          ? <CheckCircle className="w-5 h-5 text-green-500" />
          : notification.status === 'In Progress'
            ? <AlertCircle className="w-5 h-5 text-blue-500" />
            : <Clock className="w-5 h-5 text-yellow-500" />;
      case 'alert':
        return notification.level === 'critical'
          ? <AlertCircle className="w-5 h-5 text-red-500" />
          : notification.level === 'high'
            ? <AlertCircle className="w-5 h-5 text-orange-500" />
            : <Bell className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  // Get notification styling
  const getNotificationStyles = (notification) => {
    if (notification.read) return 'bg-white hover:bg-gray-50';
    
    switch (notification.type) {
      case 'relief':
        return notification.status === 'Approved' 
          ? 'bg-green-50 hover:bg-green-100'
          : notification.status === 'Declined'
            ? 'bg-red-50 hover:bg-red-100'
            : 'bg-yellow-50 hover:bg-yellow-100';
      case 'incident':
        return notification.status === 'Resolved'
          ? 'bg-green-50 hover:bg-green-100'
          : notification.status === 'In Progress'
            ? 'bg-blue-50 hover:bg-blue-100'
            : 'bg-yellow-50 hover:bg-yellow-100';
      case 'alert':
        return notification.level === 'critical'
          ? 'bg-red-50 hover:bg-red-100'
          : notification.level === 'high'
            ? 'bg-orange-50 hover:bg-orange-100'
            : 'bg-blue-50 hover:bg-blue-100';
      default:
        return 'bg-gray-50 hover:bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-hidden">
      {/* Navbar */}
      <nav className="bg-gradient-to-r from-green-100 to-blue-100 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-green-800">User Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative" ref={notificationRef}>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-full text-green-700 hover:bg-green-200 focus:outline-none relative"
                >
                  <Bell className="h-6 w-6" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800">Notifications</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">
                            {notifications.filter(n => !n.read).length} unread
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                fetchNotifications();
                              }}
                              className="text-xs text-gray-600 hover:text-gray-800 font-medium"
                              title="Refresh notifications"
                            >
                              🔄
                            </button>
                            {notifications.length > 0 && (
                              <>
                                {notifications.filter(n => !n.read).length > 0 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Mark all as read and update localStorage
                                      const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
                                      setNotifications(updatedNotifications);
                                      
                                      // Update localStorage with all notification IDs
                                      const allNotificationIds = updatedNotifications.map(n => n.id);
                                      localStorage.setItem('readNotifications', JSON.stringify(allNotificationIds));
                                    }}
                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                  >
                                    Mark all as read
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Clear all notifications
                                    setNotifications([]);
                                  }}
                                  className="text-xs text-red-600 hover:text-red-800 font-medium"
                                >
                                  Clear all
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p>No notifications</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${getNotificationStyles(notification)}`}
                            onClick={() => {
                              // Mark as read
                              setNotifications(prev => 
                                prev.map(n => 
                                  n.id === notification.id ? { ...n, read: true } : n
                                )
                              );
                            }}
                          >
                            <div className="flex items-start">
                              <div className="flex-shrink-0 mr-3">
                                {getNotificationIcon(notification)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-sm font-medium text-gray-900">
                                    {notification.title}
                                  </p>
                                  <span className="text-xs text-gray-500">
                                    {new Date(notification.timestamp).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-1">
                                  {notification.message}
                                </p>
                                {notification.description && (
                                  <p className="text-xs text-gray-500">
                                    {notification.description}
                                  </p>
                                )}
                                <div className="flex items-center mt-2">
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    notification.type === 'relief' 
                                      ? notification.status === 'Approved'
                                        ? 'bg-green-100 text-green-800'
                                        : notification.status === 'Declined'
                                          ? 'bg-red-100 text-red-800'
                                          : 'bg-yellow-100 text-yellow-800'
                                      : notification.type === 'incident'
                                        ? notification.status === 'Resolved'
                                          ? 'bg-green-100 text-green-800'
                                          : notification.status === 'In Progress'
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                        : notification.type === 'alert'
                                          ? notification.level === 'critical'
                                            ? 'bg-red-100 text-red-800'
                                            : notification.level === 'high'
                                              ? 'bg-orange-100 text-orange-800'
                                              : 'bg-blue-100 text-blue-800'
                                          : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {notification.type === 'relief' && notification.status}
                                    {notification.type === 'incident' && notification.status}
                                    {notification.type === 'alert' && notification.level?.toUpperCase()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="relative" ref={dropdownRef}>
                <button 
                  type="button"
                  className="flex items-center space-x-2 focus:outline-none"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <img
                    className="h-8 w-8 rounded-full"
                    src={user.avatar}
                    alt={user.name}
                  />
                  <span className="text-green-800 font-medium hidden sm:inline">{user.name}</span>
                  <ChevronDown className={`h-4 w-4 text-green-800 transition-transform duration-200 ${isDropdownOpen ? 'transform rotate-180' : ''}`} />
                </button>

                {/* Dropdown menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <button
                      className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => {
                        setAndNavigate('account-settings');
                        setIsDropdownOpen(false);
                      }}
                    >
                      <Settings className="h-4 w-4 mr-2 text-gray-500" />
                      Account Settings
                    </button>
                    <button
                      onClick={() => {
                        setShowLogoutModal(true);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="h-4 w-4 mr-2 text-gray-500" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Secondary Navigation */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto py-2 hide-scrollbar">
            {[
              { 
                id: 'home',
                name: 'Home', 
                icon: <Home className="h-4 w-4 mr-1 inline" />
              },
              { 
                id: 'map',
                name: 'Map', 
                icon: <MapPin className="h-4 w-4 mr-1 inline" />
              },
              { 
                id: 'calendar',
                name: 'Calendar & Schedule', 
                icon: <Calendar className="h-4 w-4 mr-1 inline" />
              },
              { 
                id: 'relief',
                name: 'Relief Form', 
                icon: <ClipboardList className="h-4 w-4 mr-1 inline" />
              },
              { 
                id: 'incident',
                name: 'Incident Report', 
                icon: <AlertTriangle className="h-4 w-4 mr-1 inline" />
              },
              { 
                id: 'alert',
                name: 'Alert Response', 
                icon: <Bell className="h-4 w-4 mr-1 inline" />
              },
              { 
                id: 'chatbot',
                name: 'Chatbot', 
                icon: <MessageSquare className="h-4 w-4 mr-1 inline" />
              }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setAndNavigate(item.id)}
                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center ${
                  activeModule === item.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {item.icon}
                {item.name}
              </button>
            ))}
          
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="w-full px-2 py-4 sm:px-4">
        <div className="w-full py-2">
          {/* Render active module */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            {renderModule()}
          </div>
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6 relative">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mr-4 bg-red-100">
                <LogOut className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Sign Out
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Confirm logout action
                </p>
              </div>
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to sign out? You will need to login again to access the system.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onLogout();
                  setShowLogoutModal(false);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Homepage;
