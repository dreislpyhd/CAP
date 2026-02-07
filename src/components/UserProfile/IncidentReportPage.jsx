import React, { useState, useEffect } from 'react';
import { AlertTriangle, Upload, X, Clock, MapPin, CheckCircle, RefreshCw, Search, Filter } from 'lucide-react';
import { API_BASE_URL } from '../../config';

const IncidentReportPage = () => {
  const [incidentType, setIncidentType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [files, setFiles] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false); // For agreement checkbox

  // AI Template states
  const [template, setTemplate] = useState('');
  const [templateTips, setTemplateTips] = useState('');
  const [showTemplate, setShowTemplate] = useState(false);
  const [language, setLanguage] = useState('tl'); // 'tl' for Tagalog, 'en' for English

  // AI Summary states
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState({});

  // States for incident table
  const [incidents, setIncidents] = useState([]);
  const [isLoadingIncidents, setIsLoadingIncidents] = useState(true);
  const [incidentsError, setIncidentsError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severity, setSeverity] = useState('');
  const [autoSeverity, setAutoSeverity] = useState(true);
  const [fieldErrors, setFieldErrors] = useState({
    incidentType: '',
    location: '',
    description: '',
    severity: '',
    files: ''
  });

  const computeSeverity = (type, desc, loc, fileList) => {
    const t = String(type || '').toLowerCase();
    const d = String(desc || '').toLowerCase();
    const l = String(loc || '').toLowerCase();
    let s = 0;
    if (t === 'fire') s += 8;
    else if (t === 'earthquake') s += 7;
    else if (t === 'flood') s += 6;
    else if (t === 'medical') s += 7;
    else if (t === 'security') s += 7;
    else if (t === 'environmental') s += 5;
    else if (t === 'wildlife') s += 3;
    const critical = ['explosion', 'collapsed', 'unconscious', 'not breathing', 'gunshot', 'weapon', 'armed', 'wildfire', 'flash flood', 'chemical', 'toxic', 'gas leak', 'landslide', 'mudslide', 'stampede', 'severe'];
    const high = ['injury', 'bleeding', 'heavy smoke', 'structure', 'bridge', 'highway', 'power outage', 'electrical', 'strong', 'major', 'violent', 'attack', 'assault', 'robbery', 'kidnapping', 'fire'];
    const moderate = ['minor', 'small', 'smoke', 'road blocked', 'traffic', 'property damage', 'tree down', 'overflow', 'rising water'];
    critical.forEach(k => { if (d.includes(k)) s += 6; });
    high.forEach(k => { if (d.includes(k)) s += 3; });
    moderate.forEach(k => { if (d.includes(k)) s += 2; });
    const sensitive = ['school', 'hospital', 'clinic', 'bridge', 'market', 'mall', 'church', 'residential', 'apartment', 'condominium', 'barangay hall'];
    sensitive.forEach(k => { if (l.includes(k)) s += 2; });
    const peopleWords = ['people', 'persons', 'families', 'houses', 'homes', 'students', 'patients', 'workers', 'crowd'];
    const nums = (d.match(/\d+/g) || []).map(n => parseInt(n, 10)).filter(n => !isNaN(n));
    const hasPeopleWord = peopleWords.some(w => d.includes(w));
    if (nums.length) {
      const maxN = Math.max(...nums);
      if (hasPeopleWord) {
        if (maxN >= 50) s += 5;
        else if (maxN >= 20) s += 3;
        else if (maxN >= 5) s += 2;
      } else {
        if (maxN >= 10) s += 2;
      }
    }
    const attachments = Array.isArray(fileList) ? fileList.length : 0;
    if (attachments >= 5) s += 3;
    else if (attachments >= 2) s += 1;
    const exclam = (desc || '').split('').filter(ch => ch === '!').length;
    if (exclam >= 3) s += 3;
    else if (exclam === 2) s += 2;
    else if (exclam === 1) s += 1;
    let capsCount = 0;
    (String(desc || '').match(/\b[A-Z]{3,}\b/g) || []).forEach(() => { capsCount += 1; });
    if (capsCount >= 3) s += 3;
    else if (capsCount === 2) s += 2;
    else if (capsCount === 1) s += 1;
    if (s >= 14) return 'Critical';
    if (s >= 10) return 'High';
    if (s >= 6) return 'Moderate';
    return 'Low';
  };

  const validateField = (name, value) => {
    const msg = !String(value || '').trim() ? 'Required' : '';
    setFieldErrors(prev => ({ ...prev, [name]: msg }));
    return !msg;
  };

  const validateForm = () => {
    const checks = { incidentType, location, description, severity };
    const nextErrors = {};
    let valid = true;
    Object.entries(checks).forEach(([n, v]) => {
      const msg = !String(v || '').trim() ? 'Required' : '';
      nextErrors[n] = msg;
      if (msg) valid = false;
    });
    if (!files.length) {
      nextErrors.files = 'Required';
      valid = false;
    } else {
      nextErrors.files = '';
    }
    setFieldErrors(prev => ({ ...prev, ...nextErrors }));
    if (!valid) setError('Please fill in all required fields');
    return valid;
  };

  const MIN_FILE_SIZE = 10 * 1024; // 10KB minimum file size
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB maximum file size

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setError('');

    // Check each file
    for (const file of selectedFiles) {
      if (file.size < MIN_FILE_SIZE) {
        setError(`File "${file.name}" is too small. Minimum size is 10KB.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(`File "${file.name}" is too large. Maximum size is 10MB.`);
        return;
      }
    }

    setFiles(prevFiles => [...prevFiles, ...selectedFiles]);
    e.target.value = ''; // Reset file input
  };

  const removeFile = (index) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (autoSeverity) {
      const s = computeSeverity(incidentType, description, location, files);
      setSeverity(s);
    }
  }, [incidentType, description, location, files, autoSeverity]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Debug: Log form values
    console.log('Form values:', {
      incidentType,
      location,
      description,
      severity,
      files: files.map(f => f.name)
    });

    if (!validateForm()) {
      const errorMsg = 'Please fill in all required fields';
      console.error('Validation error:', errorMsg);
      setError(errorMsg);
      return;
    }

    // Validate agreement checkbox
    if (!agreed) {
      const errorMsg = 'Please agree to the terms and conditions before submitting';
      console.error('Validation error:', errorMsg);
      setError(errorMsg);
      return;
    }

    const formData = new FormData();
    formData.append('incidentType', incidentType);
    formData.append('location', location);
    formData.append('description', description);
    formData.append('severity', severity);
    const statusToSubmit = severity === 'Critical' ? 'In Progress' : 'Pending';
    formData.append('status', statusToSubmit);

    // Append files
    files.forEach((file) => {
      formData.append('files[]', file);
    });

    // Debug: Log FormData contents
    for (let [key, value] of formData.entries()) {
      console.log(key, value);
    }

    try {
      setIsSubmitting(true);
      setError('');

      const response = await fetch(`${API_BASE_URL}/api/incidents.php`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - let the browser set it with the correct boundary
        headers: {
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || `Server responded with status ${response.status}`);
      }

      console.log('Server response:', responseData);

      // Reset form on success
      setIncidentType('');
      setDescription('');
      setLocation('');
      setFiles([]);
      setAgreed(false); // Reset agreement checkbox
      setIsSubmitted(true);

      setTimeout(() => {
        setIsSubmitted(false);
      }, 5000);

    } catch (err) {
      console.error('Error submitting incident:', {
        error: err,
        message: err.message,
        stack: err.stack
      });
      setError(err.message || 'Failed to submit incident report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch incidents from API
  const fetchIncidents = async () => {
    try {
      setIsLoadingIncidents(true);
      setIncidentsError('');

      const response = await fetch(`${API_BASE_URL}/api/incidents.php`, {
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
      setIncidentsError('Failed to load incidents. Please try again later.');
    } finally {
      setIsLoadingIncidents(false);
    }
  };

  // Initial fetch and refresh after submission
  useEffect(() => {
    fetchIncidents();
  }, []);

  useEffect(() => {
    if (isSubmitted) {
      fetchIncidents(); // Refresh incidents list after successful submission
    }
  }, [isSubmitted]);

  // Auto-refresh every 10 seconds to check for admin updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchIncidents();
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Filter incidents based on search and status
  const getFilteredIncidents = () => {
    let filtered = incidents;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(incident => incident.status === statusFilter);
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
      const tb = b.timestamp ? new Date(b.timestamp).getTime() : (b.created_at ? new Date(b.created_at).getTime() : 0);
      const ta = a.timestamp ? new Date(a.timestamp).getTime() : (a.created_at ? new Date(a.created_at).getTime() : 0);
      return tb - ta;
    });
  };

  const filteredIncidents = getFilteredIncidents();

  // Helper functions
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
            <Clock className="h-3 w-3 mr-1" />
            Unknown
          </span>
        );
    }
  };

  // AI Template handler
  const handleIncidentTypeChange = async (e) => {
    const type = e.target.value;
    setIncidentType(type);
    validateField('incidentType', type);

    if (type) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/templates.php?type=${type}`);
        const data = await res.json();
        setTemplate(data[`template_${language}`] || data.template || '');
        setTemplateTips(data[`tips_${language}`] || data.tips || '');
        setShowTemplate(true);
      } catch (err) {
        console.error('Failed to fetch template:', err);
      }
    } else {
      setTemplate('');
      setTemplateTips('');
      setShowTemplate(false);
    }
  };

  // Update template when language changes
  const handleLanguageChange = async (newLanguage) => {
    setLanguage(newLanguage);
    if (incidentType) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/templates.php?type=${incidentType}`);
        const data = await res.json();
        setTemplate(data[`template_${newLanguage}`] || data.template || '');
        setTemplateTips(data[`tips_${newLanguage}`] || data.tips || '');
      } catch (err) {
        console.error('Failed to update template:', err);
      }
    }
  };

  // AI Summary handler
  const getSummary = async () => {
    if (!files.length) {
      setFieldErrors(prev => ({ ...prev, files: 'Required' }));
      setError('Please upload at least one image');
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/confirm_summary.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentType,
          location,
          description,
          severity,
          fileCount: files.length
        })
      });
      const data = await res.json();
      setSummaryData({ ...data, severity });
      setShowSummary(true);
    } catch (err) {
      console.error('Failed to get summary:', err);
    }
  };

  // Actual submit function (called from summary modal)
  const performSubmit = async () => {
    // Close modal first
    setShowSummary(false);
    // Call handleSubmit directly
    await handleSubmit(new Event('submit', { cancelable: true }));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <AlertTriangle className="h-6 w-6 mr-2 text-red-600" />
        Incident Report
      </h1>

      {/* Incident Report Form */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        {isSubmitted ? (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <p className="font-medium mb-2">Your incident report has been submitted successfully!</p>
            <p className="text-sm">You can view your submission in the table below where it will appear with the uploaded photos.</p>
          </div>
        ) : (
          <form id="incident-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Existing form fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Incident Type</label>
              <select
                value={incidentType}
                onChange={handleIncidentTypeChange}
                className="w-full p-2 border rounded-md"
                required
              >
                <option value="">Select incident type</option>
                <option value="earthquake">Earthquake Incident</option>
                <option value="environmental">Environmental Incident</option>
                <option value="fire">Fire Incident</option>
                <option value="flood">Flood Incident</option>
                <option value="medical">Medical Emergency</option>
                <option value="security">Security Incident</option>
                <option value="wildlife">Wildlife Sighting</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity Level</label>
              <select
                value={severity}
                onChange={(e) => {
                  setSeverity(e.target.value);
                  setAutoSeverity(false);
                  validateField('severity', e.target.value);
                }}
                onBlur={(e) => validateField('severity', e.target.value)}
                className="w-full p-2 border rounded-md"
                required
              >
                <option value="">Select severity</option>
                <option value="Low">Low</option>
                <option value="Moderate">Moderate</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
              {fieldErrors.severity ? (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.severity}</p>
              ) : null}
            </div>

            {/* AI Template Helper */}
            {showTemplate && template && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-sm font-medium text-blue-800">Quick Description Template</h4>
                    <div className="flex gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => handleLanguageChange('tl')}
                        className={`text-xs px-2 py-1 rounded ${language === 'tl' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                      >
                        Tagalog
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLanguageChange('en')}
                        className={`text-xs px-2 py-1 rounded ${language === 'en' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                      >
                        English
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTemplate(false)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-blue-700 mb-2">
                  {severity ? `Severity: ${severity}\n` : ''}{template}
                </p>
                <button
                  type="button"
                  onClick={() => setDescription(`${severity ? `Severity: ${severity}\n` : ''}${template}`)}
                  className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                >
                  Use Template
                </button>
                {templateTips && (
                  <p className="text-xs text-blue-600 mt-2">💡 {templateTips}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  validateField('location', e.target.value);
                }}
                onBlur={(e) => validateField('location', e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="Enter incident location"
                required
              />
              {fieldErrors.location ? (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.location}</p>
              ) : null}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  validateField('description', e.target.value);
                }}
                onBlur={(e) => validateField('description', e.target.value)}
                className="w-full p-2 border rounded-md"
                rows="4"
                placeholder="Please provide details about the incident"
                required
              ></textarea>
              {fieldErrors.description ? (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.description}</p>
              ) : null}
            </div>

            {/* File Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload Photos
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-300 rounded-md">
                <div className="space-y-1 text-center">
                  <div className="flex justify-center">
                    <Upload className="h-12 w-12 text-gray-400" />
                  </div>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none"
                    >
                      <span>Upload files</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        multiple
                        accept="image/png, image/jpeg, image/gif"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF up to 10MB (minimum 10KB)
                  </p>
                </div>
              </div>
              {fieldErrors.files ? (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.files}</p>
              ) : null}
            </div>

            {/* Selected Files Preview */}
            {files.length > 0 && (
              <div className="mt-2">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Files:</h3>
                <div className="grid grid-cols-1 gap-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700 truncate max-w-xs">{file.name}</span>
                      <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700"
                        title="Remove file"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="text-red-500 text-sm mt-2">
                {error}
              </div>
            )}

            {/* Agreement Section */}
            <div className="pt-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="agreement-checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="h-4 w-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                  />
                  <label htmlFor="agreement-checkbox" className="ml-2 block text-sm text-gray-700">
                    I certify that the information provided is true and accurate to the best of my knowledge.
                    I understand that providing false information may result in legal consequences.
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={getSummary}
                className={`bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center justify-center min-w-32 ${isSubmitting || !agreed || !files.length ? 'opacity-75 cursor-not-allowed' : ''}`}
                disabled={isSubmitting || !agreed || !files.length}
                aria-disabled={isSubmitting || !agreed || !incidentType || !location || !description || !severity || !files.length}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* AI Summary Modal */}
      {showSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Confirm Your Report</h3>
              <div className="space-y-3 text-sm">
                <div><strong>Type:</strong> {summaryData.type}</div>
                <div><strong>Location:</strong> {summaryData.location}</div>
                <div><strong>Severity:</strong> {summaryData.severity}</div>
                <div><strong>Description:</strong> {summaryData.descriptionPreview}</div>
                <div><strong>Photos:</strong> {summaryData.fileCount} file(s)</div>
                {summaryData.warnings && summaryData.warnings.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                    <p className="text-yellow-800 text-xs font-medium">Please review:</p>
                    <ul className="text-yellow-700 text-xs list-disc list-inside">
                      {summaryData.warnings.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowSummary(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={performSubmit}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Confirm Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Your Incident Reports Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Incident Reports</h2>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by type, location, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {isLoadingIncidents ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading your incident reports...</span>
            </div>
          ) : incidentsError ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded m-4">
              {incidentsError}
            </div>
          ) : filteredIncidents.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' ? 'No incidents found matching your criteria.' : 'No incident reports found. Submit your first report above!'}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Incident Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Files
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredIncidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {incident.incidentType}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-1" />
                        {incident.location}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700 max-w-xs" title={incident.description || 'No description provided.'}>
                        {(incident.description || 'No description provided.').substring(0, 100)}
                        {(incident.description || '').length > 100 ? '...' : ''}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(incident.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(incident.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
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
          )}
        </div>
      </div>
    </div>
  );
};

export default IncidentReportPage;
