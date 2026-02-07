import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  MapPin, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  FileText, 
  Search,
  Filter,
  Download,
  Eye,
  Clock,
  Award,
  Shield,
  Activity,
  UserPlus,
  Mail,
  Phone,
  ClipboardList,
  CheckCircle,
  Target,
  Bell
} from 'lucide-react';

const History = () => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('registrations');
  const [incidentTypeFilter, setIncidentTypeFilter] = useState('all');
  const [userRegistrations, setUserRegistrations] = useState([]);
  const [reliefSubmissions, setReliefSubmissions] = useState([]);
  const [incidentReports, setIncidentReports] = useState([]);
  const [trainingEvents, setTrainingEvents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingRelief, setLoadingRelief] = useState(true);
  const [loadingIncidents, setLoadingIncidents] = useState(true);
  const [loadingTraining, setLoadingTraining] = useState(true);
  const [loadingAlerts, setLoadingAlerts] = useState(true);

  // Comprehensive DRRM history data
  const historyData = [
    {
      id: 1,
      year: 1990,
      date: '1990-06-15',
      title: 'Establishment of Barangay DRRM Council',
      category: 'Organization',
      location: 'Barangay Hall',
      description: 'Formal establishment of the Barangay Disaster Risk Reduction and Management Council as mandated by Republic Act 10121.',
      impact: 'High',
      participants: 25,
      documents: ['DRRM_Council_Establishment.pdf', 'RA_10121_Compliance.pdf'],
      lessons: [
        'Importance of community-based disaster management',
        'Need for regular training and capacity building',
        'Establishment of early warning systems'
      ],
      status: 'Completed'
    },
    {
      id: 2,
      year: 1995,
      date: '1995-11-08',
      title: 'First Community Disaster Drill',
      category: 'Training',
      location: 'Barangay Plaza',
      description: 'Conducted the first comprehensive disaster preparedness drill involving evacuation procedures and emergency response protocols.',
      impact: 'Medium',
      participants: 150,
      documents: ['First_Drill_Report.pdf', 'Evacuation_Procedures.pdf'],
      lessons: [
        'Community engagement is crucial for effective drills',
        'Regular practice improves response time',
        'Clear communication channels are essential'
      ],
      status: 'Completed'
    },
    {
      id: 3,
      year: 2000,
      date: '2000-09-20',
      title: 'Typhoon Response Operation',
      category: 'Emergency Response',
      location: 'Entire Barangay',
      description: 'Major typhoon response operation that successfully evacuated 500 families and provided emergency relief to affected residents.',
      impact: 'High',
      participants: 300,
      documents: ['Typhoon_Response_Report.pdf', 'Evacuation_Records.pdf', 'Relief_Distribution_Log.pdf'],
      lessons: [
        'Early evacuation saves lives',
        'Coordination with neighboring barangays is vital',
        'Proper relief distribution systems are necessary'
      ],
      status: 'Completed'
    },
    {
      id: 4,
      year: 2005,
      date: '2005-03-15',
      title: 'Installation of Early Warning System',
      category: 'Infrastructure',
      location: 'Strategic locations in barangay',
      description: 'Installation of modern early warning system including sirens, weather monitoring equipment, and communication devices.',
      impact: 'High',
      participants: 50,
      documents: ['EWS_Installation_Report.pdf', 'Equipment_Specifications.pdf', 'Maintenance_Manual.pdf'],
      lessons: [
        'Technology enhances disaster preparedness',
        'Regular maintenance is crucial',
        'Community training on system usage is essential'
      ],
      status: 'Completed'
    },
    {
      id: 5,
      year: 2010,
      date: '2010-07-22',
      title: 'Flood Mitigation Project',
      category: 'Infrastructure',
      location: 'Low-lying areas',
      description: 'Implementation of flood mitigation measures including drainage improvements and flood barriers.',
      impact: 'High',
      participants: 200,
      documents: ['Flood_Mitigation_Plan.pdf', 'Construction_Reports.pdf', 'Effectiveness_Study.pdf'],
      lessons: [
        'Prevention is better than response',
        'Infrastructure projects require community support',
        'Regular monitoring and maintenance are needed'
      ],
      status: 'Completed'
    },
    {
      id: 6,
      year: 2015,
      date: '2015-12-10',
      title: 'DRRM Training Center Establishment',
      category: 'Organization',
      location: 'Barangay Training Center',
      description: 'Establishment of a dedicated training center for disaster preparedness and response training.',
      impact: 'Medium',
      participants: 75,
      documents: ['Training_Center_Proposal.pdf', 'Construction_Reports.pdf', 'Training_Programs.pdf'],
      lessons: [
        'Dedicated facilities improve training quality',
        'Regular training programs build community resilience',
        'Partnerships with experts enhance learning'
      ],
      status: 'Completed'
    },
    {
      id: 7,
      year: 2020,
      date: '2020-03-15',
      title: 'COVID-19 Emergency Response',
      category: 'Emergency Response',
      location: 'Entire Barangay',
      description: 'Comprehensive response to COVID-19 pandemic including health protocols, relief distribution, and community support.',
      impact: 'High',
      participants: 400,
      documents: ['COVID_Response_Plan.pdf', 'Health_Protocols.pdf', 'Relief_Distribution_Records.pdf'],
      lessons: [
        'Health emergencies require different approaches',
        'Digital tools are essential for modern response',
        'Community solidarity is crucial during crises'
      ],
      status: 'Completed'
    },
    {
      id: 8,
      year: 2023,
      date: '2023-08-30',
      title: 'Digital DRRM System Implementation',
      category: 'Technology',
      location: 'Barangay Operations Center',
      description: 'Implementation of digital DRRM management system for improved coordination and data management.',
      impact: 'High',
      participants: 30,
      documents: ['Digital_System_Proposal.pdf', 'Implementation_Report.pdf', 'User_Manual.pdf'],
      lessons: [
        'Digital transformation improves efficiency',
        'User training is essential for adoption',
        'Data security and privacy must be prioritized'
      ],
      status: 'Ongoing'
    }
  ];

  // Fetch data
  useEffect(() => {
    fetchUserRegistrations();
    fetchReliefSubmissions();
    fetchIncidentReports();
    fetchTrainingEvents();
    fetchAlerts();
  }, []);

  const fetchUserRegistrations = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch('http://localhost/gsm/backend/api/users.php', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        setUserRegistrations(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching user registrations:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchReliefSubmissions = async () => {
    setLoadingRelief(true);
    try {
      const response = await fetch('http://localhost/gsm/backend/api/rgd/evacuees.php', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setReliefSubmissions(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching relief submissions:', error);
    } finally {
      setLoadingRelief(false);
    }
  };

  const fetchIncidentReports = async () => {
    setLoadingIncidents(true);
    try {
      const response = await fetch('http://localhost/gsm/backend/api/incidents.php', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setIncidentReports(data || []);
    } catch (error) {
      console.error('Error fetching incident reports:', error);
    } finally {
      setLoadingIncidents(false);
    }
  };

  const fetchTrainingEvents = async () => {
    setLoadingTraining(true);
    try {
      const response = await fetch('http://localhost/gsm/backend/api/coordination/training.php', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setTrainingEvents(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching training events:', error);
    } finally {
      setLoadingTraining(false);
    }
  };

  const fetchAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const response = await fetch('http://localhost/gsm/backend/api/alerts.php', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoadingAlerts(false);
    }
  };

  // Filter user registrations
  const filteredUsers = userRegistrations
    .filter(user => {
      const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.barangay.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Filter relief submissions
  const filteredRelief = reliefSubmissions
    .filter(submission => {
      const matchesSearch = submission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           submission.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           submission.barangay.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           submission.status.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Filter incident reports
  const filteredIncidents = incidentReports
    .filter(incident => {
      const matchesSearch = incident.incidentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           incident.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           incident.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           incident.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (incident.reporter_name && incident.reporter_name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesType = incidentTypeFilter === 'all' || incident.incidentType === incidentTypeFilter;
      
      return matchesSearch && matchesType;
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Filter training events
  const filteredTraining = trainingEvents
    .filter(event => {
      const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.date.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Filter alerts
  const filteredAlerts = alerts
    .filter(alert => {
      const matchesSearch = alert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           alert.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           alert.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           alert.level.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (alert.barangays && alert.barangays.some(barangay => 
                             barangay.toLowerCase().includes(searchTerm.toLowerCase())
                           ));
      return matchesSearch;
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <div className="mx-1 mt-1 p-4 sm:p-6 dark:bg-slate-900 bg-white dark:text-slate-300 rounded-lg shadow-lg h-full overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-2">
              <Activity className="text-blue-600 dark:text-blue-400" />
              System History
            </h1>
            <p className="text-gray-600 dark:text-slate-400">
              View and track all user registrations, relief form submissions, and incident reports in the system.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('registrations')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
              activeTab === 'registrations'
                ? 'bg-blue-500 text-white border-b-2 border-blue-500'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <UserPlus className="w-4 h-4 inline mr-2" />
            User Registrations
          </button>
          <button
            onClick={() => setActiveTab('relief')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
              activeTab === 'relief'
                ? 'bg-blue-500 text-white border-b-2 border-blue-500'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <ClipboardList className="w-4 h-4 inline mr-2" />
            Relief Form Submissions
          </button>
          <button
            onClick={() => setActiveTab('incidents')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
              activeTab === 'incidents'
                ? 'bg-blue-500 text-white border-b-2 border-blue-500'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            Incident Reports
          </button>
          <button
            onClick={() => setActiveTab('training')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
              activeTab === 'training'
                ? 'bg-blue-500 text-white border-b-2 border-blue-500'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Target className="w-4 h-4 inline mr-2" />
            Training & Drill Events
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
              activeTab === 'alerts'
                ? 'bg-blue-500 text-white border-b-2 border-blue-500'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Bell className="w-4 h-4 inline mr-2" />
            Disaster Alerts
          </button>
        </div>

                {/* Search */}
        <div className="mb-6 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={activeTab === 'registrations' ? "Search users..." : activeTab === 'relief' ? "Search relief submissions..." : activeTab === 'incidents' ? "Search incident reports..." : activeTab === 'training' ? "Search training events..." : "Search disaster alerts..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-3 py-2 border rounded-lg dark:bg-slate-700 dark:text-slate-200 text-sm w-full"
              />
            </div>
            {activeTab === 'incidents' && (
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={incidentTypeFilter}
                  onChange={(e) => setIncidentTypeFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-200"
                >
                  <option value="all">All Types</option>
                  <option value="earthquake">Earthquake</option>
                  <option value="environmental">Environmental</option>
                  <option value="fire">Fire</option>
                  <option value="flood">Flood</option>
                  <option value="medical">Medical Emergency</option>
                  <option value="security">Security</option>
                  <option value="wildlife">Wildlife</option>
                </select>
              </div>
            )}
          </div>
          <div className="text-sm text-gray-600 dark:text-slate-400">
            {activeTab === 'registrations' 
              ? `${filteredUsers.length} of ${userRegistrations.length} users`
              : activeTab === 'relief' 
                ? `${filteredRelief.length} of ${reliefSubmissions.length} submissions`
                : activeTab === 'incidents'
                  ? `${filteredIncidents.length} of ${incidentReports.length} incidents`
                  : activeTab === 'training'
                    ? `${filteredTraining.length} of ${trainingEvents.length} training events`
                    : `${filteredAlerts.length} of ${alerts.length} disaster alerts`
            }
          </div>
        </div>

        {/* Content */}
        {activeTab === 'registrations' ? (
          <div className="space-y-4">
            {loadingUsers ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading user registrations...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  {searchTerm ? 'No users found matching your search.' : 'No user registrations found.'}
                </p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div key={user.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200 dark:border-slate-700">
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
                            <UserPlus className="w-5 h-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-slate-200">
                              {user.full_name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-slate-400 flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {user.barangay}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded text-xs font-medium">
                            Registered
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600 dark:text-slate-400">Email:</span>
                          <span className="font-medium">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600 dark:text-slate-400">Contact:</span>
                          <span className="font-medium">{user.contact_number}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600 dark:text-slate-400">Registered:</span>
                          <span className="font-medium">{new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 dark:text-slate-300 mb-4">
                        <strong>Address:</strong> {user.address}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : activeTab === 'relief' ? (
          <div className="space-y-4">
            {loadingRelief ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading relief submissions...</span>
              </div>
            ) : filteredRelief.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  {searchTerm ? 'No submissions found matching your search.' : 'No relief form submissions found.'}
                </p>
              </div>
            ) : (
              filteredRelief.map((submission) => (
                <div key={submission.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200 dark:border-slate-700">
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                            <ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-slate-200">
                              {submission.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-slate-400 flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {submission.barangay}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            submission.status === 'Pending' 
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}>
                            {submission.status}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600 dark:text-slate-400">Contact:</span>
                          <span className="font-medium">{submission.contact}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600 dark:text-slate-400">Family Size:</span>
                          <span className="font-medium">{submission.family_members || 1}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600 dark:text-slate-400">Submitted:</span>
                          <span className="font-medium">{new Date(submission.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 dark:text-slate-300 mb-4">
                        <strong>Address:</strong> {submission.address}
                      </p>

                      {submission.age && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div><strong>Age:</strong> {submission.age}</div>
                          <div><strong>Gender:</strong> {submission.gender}</div>
                          <div><strong>Zone:</strong> {submission.zone}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : activeTab === 'incidents' ? (
          <div className="space-y-4">
            {loadingIncidents ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading incident reports...</span>
              </div>
            ) : filteredIncidents.length === 0 ? (
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  {searchTerm ? 'No incidents found matching your search.' : 'No incident reports found.'}
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-slate-200">Incident Reports History</h3>
                <div className="space-y-4">
                  {filteredIncidents.map((incident, index) => (
                    <div key={incident.id} className="border-l-4 border-red-500 pl-4 py-2">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="font-medium text-gray-900 dark:text-slate-200">
                            {new Date(incident.timestamp).toLocaleDateString()} - {incident.incidentType}
                          </span>
                          <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                            incident.status === 'Pending' 
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : incident.status === 'In Progress'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}>
                            {incident.status}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-slate-300 mb-2">
                        <strong>Location:</strong> {incident.location}
                      </p>
                      <p className="text-sm text-gray-700 dark:text-slate-300 mb-2">
                        <strong>Description:</strong> {incident.description}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-slate-400">
                        <strong>Reported by:</strong> {incident.reporter_name || 'Unknown User'}
                        {incident.files && incident.files.length > 0 && (
                          <span className="ml-2">• {incident.files.length} file(s) attached</span>
                        )}
                      </p>
                      {index < filteredIncidents.length - 1 && (
                        <hr className="mt-4 border-gray-200 dark:border-gray-600" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'training' ? (
          <div className="space-y-4">
            {loadingTraining ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading training events...</span>
              </div>
            ) : filteredTraining.length === 0 ? (
              <div className="text-center py-12">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  {searchTerm ? 'No training events found matching your search.' : 'No training events found.'}
                </p>
              </div>
            ) : (
              filteredTraining.map((event) => (
                <div key={event.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200 dark:border-slate-700">
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg">
                            <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-slate-200">
                              {event.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-slate-400 flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {event.location}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            event.status === 'Scheduled' 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : event.status === 'Completed'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                          }`}>
                            {event.status}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600 dark:text-slate-400">Date:</span>
                          <span className="font-medium">{new Date(event.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600 dark:text-slate-400">Time:</span>
                          <span className="font-medium">{event.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600 dark:text-slate-400">Duration:</span>
                          <span className="font-medium">{event.duration}</span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 dark:text-slate-300 mb-4">
                        <strong>Description:</strong> {event.description}
                      </p>

                      <div className="text-xs text-gray-500 dark:text-slate-400">
                        Created: {new Date(event.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : activeTab === 'alerts' ? (
          <div className="space-y-4">
            {loadingAlerts ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading disaster alerts...</span>
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  {searchTerm ? 'No disaster alerts found matching your search.' : 'No disaster alerts found.'}
                </p>
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <div key={alert.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200 dark:border-slate-700">
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            alert.level === 'critical' ? 'bg-red-100 dark:bg-red-900' :
                            alert.level === 'high' ? 'bg-orange-100 dark:bg-orange-900' :
                            alert.level === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900' :
                            'bg-blue-100 dark:bg-blue-900'
                          }`}>
                            <Bell className={`w-5 h-5 ${
                              alert.level === 'critical' ? 'text-red-600 dark:text-red-400' :
                              alert.level === 'high' ? 'text-orange-600 dark:text-orange-400' :
                              alert.level === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                              'text-blue-600 dark:text-blue-400'
                            }`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-slate-200">
                              {alert.name}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                alert.level === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                alert.level === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                                alert.level === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              }`}>
                                {alert.level.toUpperCase()}
                              </span>
                              <span>•</span>
                              <span>{alert.type}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            alert.status === 'active' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : alert.status === 'resolved'
                                ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}>
                            {alert.status || 'draft'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600 dark:text-slate-400">Created:</span>
                          <span className="font-medium">{new Date(alert.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600 dark:text-slate-400">Affected Areas:</span>
                          <span className="font-medium">
                            {alert.barangays && alert.barangays.length > 0 
                              ? alert.barangays.join(', ') 
                              : 'All areas'
                            }
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 dark:text-slate-300 mb-4">
                        <strong>Description:</strong> {alert.description || 'No description provided'}
                      </p>

                      <div className="text-xs text-gray-500 dark:text-slate-400">
                        {alert.updated_at && alert.updated_at !== alert.created_at && (
                          <span>Updated: {new Date(alert.updated_at).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default History;