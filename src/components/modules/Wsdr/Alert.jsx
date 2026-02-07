import React, { useState, useEffect } from 'react';

function DisasterAlertAdmin() {
  const [alerts, setAlerts] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
    level: '',
  });
  const [editIndex, setEditIndex] = useState(null);
  const [selectedAlertIndex, setSelectedAlertIndex] = useState(null);
  const [selectedBarangays, setSelectedBarangays] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [modalFormData, setModalFormData] = useState({
    name: '',
    description: '',
    type: '',
    level: '',
  });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stackHistory, setStackHistory] = useState(true); // Toggle for stacking alerts
  const [notification, setNotification] = useState(null); // For custom notifications

  
  // Fetch alerts and barangays from backend
  useEffect(() => {
    fetchAlerts();
    fetchBarangays();
    loadHistoryFromStorage(); // Load persisted history
  }, []);

  // Load history from localStorage
  const loadHistoryFromStorage = () => {
    try {
      const savedHistory = localStorage.getItem('alertHistory');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error('Error loading history from storage:', error);
    }
  };

  // Save history to localStorage
  const saveHistoryToStorage = (newHistory) => {
    try {
      localStorage.setItem('alertHistory', JSON.stringify(newHistory));
    } catch (error) {
      console.error('Error saving history to storage:', error);
    }
  };

  // Show custom notification function
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const fetchBarangays = async () => {
    try {
      const response = await fetch('http://localhost/gsm/backend/api/barangays.php');
      
      if (!response.ok) {
        console.error('HTTP error:', response.status);
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        setBarangays(data.barangays);
      } else {
        console.error('API error:', data.error);
      }
    } catch (error) {
      console.error('Error fetching barangays:', error);
      // Set empty array as fallback
      setBarangays([]);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await fetch('http://localhost/gsm/backend/api/alerts.php');
      const data = await response.json();
      if (data.success) {
        setAlerts(data.alerts);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  // Auto-generate description based on alert type and level
  const generateDescription = (type, level) => {
    const descriptions = {
      'Flood': {
        'Low': 'Low-level flood warning. Residents in low-lying areas should monitor water levels and be prepared to move to higher ground if conditions worsen.',
        'Moderate': 'Moderate flood warning expected. Residents near rivers and low-lying areas should prepare for possible evacuation. Secure important documents and belongings.',
        'High': 'Severe flood warning imminent. Immediate evacuation recommended for affected areas. Move to designated evacuation centers immediately.'
      },
      'Earthquake': {
        'Low': 'Minor earthquake detected. No major damage expected. Monitor for aftershocks and check building integrity.',
        'Moderate': 'Moderate earthquake felt. Check for injuries and structural damage. Be prepared for aftershocks. Avoid damaged buildings.',
        'High': 'Major earthquake detected. Significant damage possible. Evacuate if necessary. Follow emergency protocols and seek safe shelter.'
      },
      'Typhoon': {
        'Low': 'Tropical disturbance approaching. Monitor weather updates and prepare emergency supplies.',
        'Moderate': 'Tropical storm warning. Secure outdoor items, prepare emergency kit, and consider evacuation if in low-lying areas.',
        'High': 'Typhoon warning. Mandatory evacuation in affected areas. Seek shelter immediately in designated evacuation centers.'
      },
      'Fire': {
        'Low': 'Fire reported in area. Residents should stay alert and follow emergency services instructions.',
        'Moderate': 'Active fire spreading. Prepare for possible evacuation. Gather important documents and emergency supplies.',
        'High': 'Major fire out of control. Immediate evacuation required. Follow designated escape routes and proceed to safe zones.'
      },
      'Volcanic Eruption': {
        'Low': 'Volcanic activity increased. Monitor ash fall and avoid outdoor activities in affected areas.',
        'Moderate': 'Volcanic eruption ongoing. Wear protective masks, avoid ash exposure, and prepare for evacuation.',
        'High': 'Major volcanic eruption. Immediate evacuation mandatory. Avoid all contact with volcanic ash and gases.'
      },
      'Power Outage': {
        'Low': 'Power interruption expected. Charge devices and prepare alternative lighting sources.',
        'Moderate': 'Extended power outage likely. Stock up on supplies and use generators safely if available.',
        'High': 'Widespread power failure expected. Prepare for extended outage and conserve emergency resources.'
      }
    };

    return descriptions[type]?.[level] || 'Please follow emergency protocols and stay tuned for updates.';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Auto-generate description when type or level changes
    if (name === 'type' || name === 'level') {
      const newType = name === 'type' ? value : formData.type;
      const newLevel = name === 'level' ? value : formData.level;
      
      if (newType && newLevel) {
        const autoDescription = generateDescription(newType, newLevel);
        setFormData(prev => ({ ...prev, [name]: value, description: autoDescription }));
      }
    }
  };

  const handleAddOrUpdateAlert = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.type || !formData.level) {
      showNotification('Please fill in all required fields.', 'error');
      return;
    }

    setLoading(true);
    
    try {
      const url = editIndex !== null ? 'http://localhost/gsm/backend/api/alerts.php' : 'http://localhost/gsm/backend/api/alerts.php';
      const method = editIndex !== null ? 'PUT' : 'POST';
      
      const payload = { ...formData };
      if (editIndex !== null) {
        payload.id = alerts[editIndex].id;
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchAlerts();
        setFormData({ name: '', description: '', type: '', level: '' });
        setEditIndex(null);
        showNotification(data.message || 'Alert saved successfully!', 'success');
      } else {
        showNotification(data.error || 'Error saving alert', 'error');
      }
    } catch (error) {
      console.error('Error saving alert:', error);
      showNotification('Error saving alert. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openAlertModal = (idx) => {
    setSelectedAlertIndex(idx);
    setModalFormData(alerts[idx]);
    setSelectedBarangays([]);
  };

  const closeAlertModal = () => {
    setSelectedAlertIndex(null);
  };

  const handleModalChange = (e) => {
    const { name, value } = e.target;
    setModalFormData({ ...modalFormData, [name]: value });
    
    // Auto-generate description when type or level changes in modal
    if (name === 'type' || name === 'level') {
      const newType = name === 'type' ? value : modalFormData.type;
      const newLevel = name === 'level' ? value : modalFormData.level;
      
      if (newType && newLevel) {
        const autoDescription = generateDescription(newType, newLevel);
        setModalFormData(prev => ({ ...prev, [name]: value, description: autoDescription }));
      }
    }
  };

  const saveAlertChanges = async () => {
    if (!modalFormData.name || !modalFormData.type || !modalFormData.level) {
      alert('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    
    try {
      const payload = { 
        ...modalFormData, 
        id: alerts[selectedAlertIndex].id,
        barangays: selectedBarangays.length > 0 ? selectedBarangays : alerts[selectedAlertIndex].barangays
      };

      const response = await fetch('http://localhost/gsm/backend/api/alerts.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchAlerts();
        closeAlertModal();
        showNotification(data.message || 'Alert updated successfully!', 'success');
      } else {
        showNotification(data.error || 'Error updating alert', 'error');
      }
    } catch (error) {
      console.error('Error updating alert:', error);
      showNotification('Error updating alert. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteAlert = async () => {
    if (!confirm('Are you sure you want to delete this alert?')) {
      return;
    }

    setLoading(true);
    
    try {
      const alertId = alerts[selectedAlertIndex].id;
      
      const response = await fetch(`http://localhost/gsm/backend/api/alerts.php?id=${alertId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchAlerts();
        closeAlertModal();
        showNotification(data.message || 'Alert deleted successfully!', 'success');
      } else {
        showNotification(data.error || 'Error deleting alert', 'error');
      }
    } catch (error) {
      console.error('Error deleting alert:', error);
      showNotification('Error deleting alert. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleBarangay = (barangay) => {
    setSelectedBarangays((prev) =>
      prev.includes(barangay)
        ? prev.filter((b) => b !== barangay)
        : [...prev, barangay]
    );
  };

  const sendAlert = async () => {
    if (selectedBarangays.length === 0) {
      showNotification('Select at least one barangay to send the alert.', 'error');
      return;
    }

    setLoading(true);
    
    try {
      const payload = {
        ...modalFormData,
        id: alerts[selectedAlertIndex].id,
        barangays: selectedBarangays,
        status: 'sent'
      };

      const response = await fetch('http://localhost/gsm/backend/api/alerts.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (data.success) {
        const newHistoryItem = {
          ...modalFormData,
          sentTo: [...selectedBarangays],
          timestamp: new Date().toLocaleString(),
        };
        
        const newHistory = [newHistoryItem, ...history];
        setHistory(newHistory);
        saveHistoryToStorage(newHistory); // Persist to localStorage

        showNotification(`Alert "${modalFormData.name}" sent to: ${selectedBarangays.join(", ")}`, 'success');
        closeAlertModal();
        await fetchAlerts();
      } else {
        showNotification(data.error || 'Error sending alert', 'error');
      }
    } catch (error) {
      console.error('Error sending alert:', error);
      showNotification('Error sending alert. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const sendAllAlert = async () => {
    if (!modalFormData.name || !modalFormData.type || !modalFormData.level) {
      showNotification('Please fill in all required fields.', 'error');
      return;
    }

    setLoading(true);
    
    try {
      const payload = {
        ...modalFormData,
        id: alerts[selectedAlertIndex].id,
        barangays: barangays,
        status: 'sent'
      };

      const response = await fetch('http://localhost/gsm/backend/api/alerts.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (data.success) {
        const newHistoryItem = {
          ...modalFormData,
          sentTo: [...barangays],
          timestamp: new Date().toLocaleString(),
        };
        
        const newHistory = [newHistoryItem, ...history];
        setHistory(newHistory);
        saveHistoryToStorage(newHistory); // Persist to localStorage

        showNotification(`Alert "${modalFormData.name}" sent to ALL barangays: ${barangays.join(", ")}`, 'success');
        closeAlertModal();
        await fetchAlerts();
      } else {
        showNotification(data.error || 'Error sending alert to all', 'error');
      }
    } catch (error) {
      console.error('Error sending alert to all:', error);
      showNotification('Error sending alert to all. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='mx-1 mt-1 p-6 dark:bg-slate-900 bg-white dark:text-slate-300 rounded-lg h-full overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800'>
      <h1 className="text-2xl font-bold mb-4">Disaster Alert Admin Panel</h1>

      <div className="lg:flex gap-6">
        {/* LEFT SIDE: Form + Existing Alerts */}
        <div className="flex-1 space-y-6">
          {/* Add/Edit Alert Form */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">{editIndex !== null ? "Edit Alert" : "Add Alert"}</h2>
            <form onSubmit={handleAddOrUpdateAlert} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Alert Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="e.g., Heavy Flood Warning"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Alert Type *</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Select Type</option>
                    <option value="Flood">Flood</option>
                    <option value="Earthquake">Earthquake</option>
                    <option value="Typhoon">Typhoon</option>
                    <option value="Fire">Fire</option>
                    <option value="Volcanic Eruption">Volcanic Eruption</option>
                    <option value="Power Outage">Power Outage</option>
                  </select>
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Alert Level *</label>
                  <select
                    name="level"
                    value={formData.level}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Select Level</option>
                    <option value="Low">Low</option>
                    <option value="Moderate">Moderate</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Alert Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Detailed information about the alert (auto-generated based on type and level)"
                  rows="4"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 rounded-lg text-white ${editIndex !== null ? "bg-yellow-600 hover:bg-yellow-700" : "bg-blue-600 hover:bg-blue-700"} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Processing...' : (editIndex !== null ? "Update Alert" : "Add Alert")}
              </button>
            </form>
          </div>

          {/* Existing Alerts Table */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Existing Alerts</h2>
            {alerts.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No alerts added yet.</p>
            ) : (
              <div className="w-full overflow-hidden">
                <table className="w-full table-auto text-base border-collapse">
                  <thead className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left">Name</th>
                      <th className="px-4 py-3 text-left">Description</th>
                      <th className="px-4 py-3 text-left">Type</th>
                      <th className="px-4 py-3 text-left">Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.map((alert, idx) => {
                      const levelColor =
                        alert.level === "High"
                          ? "text-red-600 font-semibold"
                          : alert.level === "Moderate"
                          ? "text-yellow-600 font-semibold"
                          : "text-green-600 font-semibold";
                      return (
                        <tr
                          key={idx}
                          className={`cursor-pointer transition duration-150
                          ${selectedAlertIndex === idx ? 'bg-yellow-100 dark:bg-yellow-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                          onClick={() => openAlertModal(idx)}
                        >
                          <td className="border-t px-4 py-3 font-medium break-words">Disaster Alert: {alert.name}</td>
                          <td className="border-t px-4 py-3 break-words truncate max-w-xs" title={alert.description || ''}>{alert.description || '-'}</td>
                          <td className="border-t px-4 py-3 break-words">{alert.type || '-'}</td>
                          <td className={`border-t px-4 py-3 break-words ${levelColor}`}>{alert.level || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDE: Alert History */}
        <div className="w-80 flex-shrink-0">
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Alert History</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStackHistory(!stackHistory)}
                  className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                    stackHistory 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                  }`}
                >
                  {stackHistory ? 'Stacked' : 'Expanded'}
                </button>
                {history.length > 0 && (
                  <button
                    onClick={() => {
                      setHistory([]);
                      saveHistoryToStorage([]);
                    }}
                    className="px-3 py-1 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            {history.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No alerts sent yet.</p>
            ) : (
              <ul className={`space-y-3 ${stackHistory ? 'max-h-96 overflow-y-auto' : ''}`}>
                {history.map((h, idx) => {
                  const levelColor =
                    h.level === "High"
                      ? "bg-red-600 text-white"
                      : h.level === "Moderate"
                      ? "bg-yellow-500 text-black"
                      : "bg-green-500 text-white";

                  return (
                    <li
                      key={idx}
                      className={`p-3 border rounded-lg bg-white dark:bg-gray-700 hover:shadow-lg transition-shadow cursor-pointer ${
                        stackHistory ? 'hover:scale-105 transform' : ''
                      }`}
                      title={h.description}
                    >
                      <div className="flex justify-between items-start">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${levelColor}`}>
                          {h.level}
                        </span>
                        <span className="text-gray-400 dark:text-gray-300 text-xs">{h.timestamp}</span>
                      </div>
                      <h3 className={`font-semibold mt-1 ${stackHistory ? 'text-sm truncate' : ''}`}>
                        Disaster Alert: {h.name}
                      </h3>
                      {h.description && (
                        <p
                          className={`text-sm text-gray-600 dark:text-gray-300 ${
                            stackHistory ? 'truncate' : ''
                          }`}
                          title={h.description}
                        >
                          {h.description}
                        </p>
                      )}
                      <p className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${
                        stackHistory ? 'truncate' : ''
                      }`}>
                        Sent to: {h.sentTo.join(", ")}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedAlertIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Disaster Alert: {modalFormData.name}</h3>
              <button
                onClick={closeAlertModal}
                className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                Close
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Alert Name *</label>
                <input
                  type="text"
                  name="name"
                  value={modalFormData.name}
                  onChange={handleModalChange}
                  className="w-full p-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Alert Type *</label>
                  <select
                    name="type"
                    value={modalFormData.type}
                    onChange={handleModalChange}
                    className="w-full p-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Select Type</option>
                    <option value="Flood">Flood</option>
                    <option value="Earthquake">Earthquake</option>
                    <option value="Typhoon">Typhoon</option>
                    <option value="Fire">Fire</option>
                    <option value="Volcanic Eruption">Volcanic Eruption</option>
                    <option value="Power Outage">Power Outage</option>
                  </select>
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Alert Level *</label>
                  <select
                    name="level"
                    value={modalFormData.level}
                    onChange={handleModalChange}
                    className="w-full p-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Select Level</option>
                    <option value="Low">Low</option>
                    <option value="Moderate">Moderate</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Alert Description</label>
                <textarea
                  name="description"
                  value={modalFormData.description}
                  onChange={handleModalChange}
                  className="w-full p-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  rows="4"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Select Barangays to send alert</label>
                {barangays.length > 0 ? (
                  <div className="flex flex-col max-h-40 overflow-y-auto border rounded p-2 bg-white dark:bg-gray-700">
                    {barangays.map((b) => (
                      <label key={b} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedBarangays.includes(b)}
                          onChange={() => toggleBarangay(b)}
                          className="w-4 h-4"
                        />
                        {b}
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 border rounded bg-gray-100 dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-400">
                    No barangays available. Please check if users have registered with barangay information.
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-3">
                <button
                  onClick={saveAlertChanges}
                  disabled={loading}
                  className={`px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={sendAlert}
                  disabled={loading}
                  className={`px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Sending...' : 'Send Alert'}
                </button>
                <button
                  onClick={sendAllAlert}
                  disabled={loading}
                  className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Sending...' : 'Send All'}
                </button>
                <button
                  onClick={deleteAlert}
                  disabled={loading}
                  className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Deleting...' : 'Delete Alert'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Notification Toast */}
      {notification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className={`animate-in zoom-in-95 duration-300 ${
            notification.type === 'success' 
              ? 'bg-green-500 border-green-600' 
              : 'bg-red-500 border-red-600'
          } text-white px-8 py-6 rounded-xl shadow-2xl border-2 flex items-center gap-4 backdrop-blur-sm pointer-events-auto max-w-md`}>
            <div className="flex-shrink-0">
              {notification.type === 'success' ? (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-base">{notification.message}</p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="flex-shrink-0 text-white/80 hover:text-white transition-colors p-2 rounded-full hover:bg-white/20"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DisasterAlertAdmin;
