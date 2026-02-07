import React, { useState, useEffect } from "react";
import { AlertTriangle, X, Image as ImageIcon, Download as DownloadIcon, Clock, MapPin, FileText, User, RefreshCw, CheckCircle, Search, Filter } from "lucide-react";

const AdminIncidentPanel = () => {
  const [incidents, setIncidents] = useState([]);
  const [selectedIncidentIndex, setSelectedIncidentIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedImage, setSelectedImage] = useState(null); // For image viewer modal

  // Fetch incidents from API
  const fetchIncidents = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost/gsm/backend/api/incidents.php', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch incidents');
      }

      const data = await response.json();
      setIncidents(data);
    } catch (err) {
      console.error('Error fetching incidents:', err);
      setError('Failed to load incidents. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchIncidents();
  }, []);

  // Filter incidents based on search, status, and type
  const getFilteredIncidents = () => {
    let filtered = incidents;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(incident => incident.status === statusFilter);
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(incident => incident.incidentType === typeFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(incident =>
        incident.incidentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const weight = (s) => {
      if (s === 'Critical') return 4;
      if (s === 'High') return 3;
      if (s === 'Moderate') return 2;
      if (s === 'Low') return 1;
      return 0;
    };
    return filtered.slice().sort((a, b) => {
      const wDiff = weight(b.severity) - weight(a.severity);
      if (wDiff !== 0) return wDiff;
      const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      return tb - ta;
    });
  };

  const filteredIncidents = getFilteredIncidents();

  // Handle status update
  const updateIncidentStatus = async (incidentId, newStatus) => {
    try {
      const response = await fetch(`http://localhost/gsm/backend/api/incidents.php?id=${incidentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update incident status');
      }

      // Refresh the incidents list
      fetchIncidents();
    } catch (err) {
      console.error('Error updating incident status:', err);
      setError('Failed to update incident status. Please try again.');
    }
  };

  const openIncidentModal = (idx) => setSelectedIncidentIndex(idx);
  const closeIncidentModal = () => setSelectedIncidentIndex(null);

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    };
    return new Date(dateString).toLocaleString(undefined, options);
  };

  const getStatusBadge = (status) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    
    switch (status) {
      case 'Pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'In Progress':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'Resolved':
        return `${baseClasses} bg-green-100 text-green-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getStatusBadgeWithIcon = (status) => {
    const baseClasses = 'px-3 py-1 rounded-full text-xs font-medium flex items-center w-fit';
    
    switch (status) {
      case 'Pending':
        return (
          <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </span>
        );
      case 'In Progress':
        return (
          <span className={`${baseClasses} bg-blue-100 text-blue-800`}>
            <RefreshCw className="h-3 w-3 mr-1" />
            In Progress
          </span>
        );
      case 'Resolved':
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800`}>
            <CheckCircle className="h-3 w-3 mr-1" />
            Resolved
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
            <X className="h-3 w-3 mr-1" />
            Unknown
          </span>
        );
    }
  };

  const getStatusCount = (status) => {
    return incidents.filter(incident => incident.status === status).length;
  };

  const generatePDFReport = () => {
    // Create a simple HTML report
    const reportContent = `
      <html>
        <head>
          <title>Incident Reports - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo-container { text-align: center; margin-bottom: 20px; }
            .logo { max-width: 150px; height: auto; }
            .header h1 { color: #dc2626; margin: 10px 0; }
            .summary { margin-bottom: 30px; }
            .summary table { border-collapse: collapse; width: 100%; }
            .summary th, .summary td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .summary th { background-color: #f2f2f2; }
            .incident-table { margin-top: 30px; }
            .incident-table table { border-collapse: collapse; width: 100%; }
            .incident-table th, .incident-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .incident-table th { background-color: #f8f9fa; }
            .status-pending { color: #d97706; }
            .status-progress { color: #2563eb; }
            .status-resolved { color: #16a34a; }
            .footer { margin-top: 30px; text-align: center; color: #666; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="logo-container">
            <img src="http://localhost/gsm/GSM_logo.png" alt="GSM Logo" class="logo" />
          </div>
          
          <div class="header">
            <h1>🚨 Incident Reports</h1>
            <p>Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            <p>Total Incidents: ${filteredIncidents.length}</p>
          </div>
          
          <div class="summary">
            <h2>📊 Summary</h2>
            <table>
              <tr>
                <th>Status</th>
                <th>Count</th>
                <th>Percentage</th>
              </tr>
              <tr>
                <td class="status-pending">⏳ Pending</td>
                <td>${getStatusCount('Pending')}</td>
                <td>${incidents.length > 0 ? ((getStatusCount('Pending') / incidents.length) * 100).toFixed(1) : 0}%</td>
              </tr>
              <tr>
                <td class="status-progress">🔄 In Progress</td>
                <td>${getStatusCount('In Progress')}</td>
                <td>${incidents.length > 0 ? ((getStatusCount('In Progress') / incidents.length) * 100).toFixed(1) : 0}%</td>
              </tr>
              <tr>
                <td class="status-resolved">✅ Resolved</td>
                <td>${getStatusCount('Resolved')}</td>
                <td>${incidents.length > 0 ? ((getStatusCount('Resolved') / incidents.length) * 100).toFixed(1) : 0}%</td>
              </tr>
            </table>
          </div>
          
          <div class="incident-table">
            <h2>📋 Detailed Incident Reports</h2>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Reporter</th>
                  <th>Files</th>
                </tr>
              </thead>
              <tbody>
                ${filteredIncidents.map((incident, index) => `
                  <tr>
                    <td>${new Date(incident.timestamp).toLocaleDateString()}</td>
                    <td>${incident.incidentType}</td>
                    <td>${incident.location}</td>
                    <td>${(incident.description || 'No description').substring(0, 100)}${(incident.description || '').length > 100 ? '...' : ''}</td>
                    <td class="status-${incident.status.toLowerCase().replace(' ', '-')}">${incident.status}</td>
                    <td>${incident.reporter_name || 'Unknown'}</td>
                    <td>${incident.files && incident.files.length > 0 ? incident.files.length + ' file(s)' : 'No files'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="footer">
            <p>📄 This report was generated from the GSM Incident Reporting System</p>
            <p>For more details, please contact the system administrator</p>
          </div>
        </body>
      </html>
    `;

    // Create a blob from the HTML content
    const blob = new Blob([reportContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `Incident_Reports_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
          <AlertTriangle className="h-6 w-6 mr-2 text-red-600" />
          Incident Reports
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={generatePDFReport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <FileText className="h-4 w-4" />
            Generate Report
          </button>
          <button
            onClick={fetchIncidents}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Reports</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{incidents.length}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{getStatusCount('Pending')}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">{getStatusCount('In Progress')}</p>
            </div>
            <RefreshCw className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Resolved</p>
              <p className="text-2xl font-bold text-green-600">{getStatusCount('Resolved')}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search incidents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white w-full"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
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
        </div>
      </div>

      {/* INCIDENTS LIST */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <span className="ml-2 text-gray-600">Loading incidents...</span>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : incidents.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No incident reports found.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Incident Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Reporter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Files
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredIncidents.map((incident) => (
                  <tr 
                    key={incident.id} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    onClick={() => {
                      const index = incidents.findIndex(i => i.id === incident.id);
                      if (index !== -1) openIncidentModal(index);
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {incident.incidentType}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <MapPin className="h-4 w-4 mr-1" />
                        {incident.location}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700 dark:text-gray-300 max-w-xs" title={incident.description || 'No description provided.'}>
                        {(incident.description || 'No description provided.').substring(0, 100)}
                        {(incident.description || '').length > 100 ? '...' : ''}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadgeWithIcon(incident.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(incident.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        <span className="truncate max-w-xs">{incident.reporter_name || 'Unknown User'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {incident.files && incident.files.length > 0 ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          {incident.files.length} file(s)
                        </span>
                      ) : (
                        <span className="text-gray-400">No files</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW INCIDENT MODAL */}
      {selectedIncidentIndex !== null && incidents[selectedIncidentIndex] && (
        <IncidentViewModal
          incident={incidents[selectedIncidentIndex]}
          onClose={closeIncidentModal}
          onStatusUpdate={updateIncidentStatus}
          onImageClick={setSelectedImage}
        />
      )}

      {/* IMAGE VIEWER MODAL */}
      <ImageViewerModal
        image={selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </div>
  );
};

// Modal for viewing incident details
const IncidentViewModal = ({ incident, onClose, onStatusUpdate, onImageClick }) => {
  const [currentStatus, setCurrentStatus] = useState(incident.status);

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    };
    return new Date(dateString).toLocaleString(undefined, options);
  };

  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    setCurrentStatus(newStatus);
    if (onStatusUpdate) {
      onStatusUpdate(incident.id, newStatus);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <AlertTriangle className="h-6 w-6 mr-2 text-red-600" />
              {incident.incidentType}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Reported on {formatDate(incident.timestamp)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Incident Details */}
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-blue-600" />
                  Incident Details
                </h3>
                <dl className="space-y-3">
                  <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Type</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200 sm:col-span-2">
                      {incident.incidentType}
                    </dd>
                  </div>
                  <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                    <dd className="mt-1 text-sm sm:col-span-2">
                      <select
                        value={currentStatus}
                        onChange={handleStatusChange}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-gray-700"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-green-600" />
                  Location
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {incident.location}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-purple-600" />
                  Description
                </h3>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                  {incident.description || 'No description provided.'}
                </p>
              </div>
            </div>

            {/* Attachments */}
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  Attachments
                </h3>
                {incident.files && incident.files.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {incident.files.map((file, fileIdx) => (
                      <div key={fileIdx} className="border rounded-lg overflow-hidden bg-white dark:bg-gray-600">
                        {file.type.startsWith('image/') ? (
                          <div className="relative group">
                            <div 
                              className="w-full h-40 overflow-hidden cursor-pointer"
                              onClick={() => onImageClick(file)}
                            >
                              <img
                                src={file.url}
                                alt={`Attachment ${fileIdx + 1}`}
                                className="w-full h-40 object-cover"
                                onError={(e) => {
                                  console.error('Image failed to load:', file.url);
                                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAxNkMxOC40IDE2IDE3IDE3LjQgMTcgMTlDMTcgMjAuNiAxOC40IDIyIDIwIDIyQzIxLjYgMjIgMjMgMjAuNiAyMyAxOUMyMyAxNy40IDIxLjYgMTYgMjAgMTZaTTIwIDI2QzE4LjkgMjYgMTggMjUuMSAxOCAyNEMxOCAyMi45IDE4LjkgMjIgMjAgMjJDMjEuMSAyMiAyMiAyMi45IDIyIDI0QzIyIDI1LjEgMjEuMSAyNiAyMCAyNloiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
                                }}
                              />
                            </div>
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                              <ImageIcon className="h-8 w-8 text-white" />
                            </div>
                            <a
                              href={file.url}
                              download={file.name}
                              className="absolute top-2 right-2 bg-white text-gray-800 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:opacity-100 z-10"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <DownloadIcon className="h-4 w-4" />
                            </a>
                          </div>
                        ) : (
                          <div className="p-4 flex items-center">
                            <div className="flex-shrink-0">
                              <FileIcon className="h-10 w-10 text-gray-400" />
                            </div>
                            <div className="ml-4 flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {file.name}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              <a
                                href={file.url}
                                download={file.name}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <DownloadIcon className="h-5 w-5" />
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No files attached to this incident.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// File icon component
const FileIcon = ({ className = "h-5 w-5" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

// Image Viewer Modal
const ImageViewerModal = ({ image, onClose }) => {
  if (!image) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4">
      <div className="relative max-w-6xl max-h-[90vh] w-full">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 rounded-full p-2 shadow-lg transition-all"
        >
          <X className="h-6 w-6" />
        </button>
        
        {/* Image Container */}
        <div className="flex items-center justify-center h-full">
          <img
            src={image.url}
            alt={image.name}
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onError={(e) => {
              console.error('Image failed to load in modal:', image.url);
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAxNkMxOC40IDE2IDE3IDE3LjQgMTcgMTlDMTcgMjAuNiAxOC40IDIyIDIwIDIyQzIxLjYgMjIgMjMgMjAuNiAyMyAxOUMyMyAxNy40IDIxLjYgMTYgMjAgMTZaTTIwIDI2QzE4LjkgMjYgMTggMjUuMSAxOCAyNEMxOCAyMi45IDE4LjkgMjIgMjAgMjJDMjEuMSAyMiAyMiAyMi45IDIyIDI0QzIyIDI1LjEgMjEuMSAyNiAyMCAyNloiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
            }}
          />
        </div>
        
        {/* Image Info */}
        <div className="absolute bottom-4 left-4 right-4 bg-white bg-opacity-90 rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-gray-800 truncate">{image.name}</p>
          <p className="text-xs text-gray-600">
            {(image.size / 1024).toFixed(1)} KB • {image.type}
          </p>
        </div>
        
        {/* Download Button */}
        <a
          href={image.url}
          download={image.name}
          className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 shadow-lg transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          <DownloadIcon className="h-5 w-5" />
        </a>
      </div>
    </div>
  );
};

export default AdminIncidentPanel;
