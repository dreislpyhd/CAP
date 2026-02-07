import { useState, useEffect } from "react";
import { MapPin, Search } from "lucide-react";
import { API_BASE_URL } from '../../../config';

export default function EvacuationResidentsAdmin() {
  const [search, setSearch] = useState("");
  const [activeRegion, setActiveRegion] = useState("All");
  const [statusFilter, setStatusFilter] = useState('All');
  const [residents, setResidents] = useState([]);
  const [filteredResidents, setFilteredResidents] = useState([]);
  const [viewResident, setViewResident] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ show: false, action: '', resident: null });
  const [successModal, setSuccessModal] = useState({ show: false, message: '' });

  // List of all 188 barangays for the dropdown
  const barangays = Array.from({ length: 188 }, (_, i) => `Barangay ${i + 1}`);

  const [newResident, setNewResident] = useState({
    evacuation_id: 1,
    name: '',
    age: '',
    gender: 'Male',
    contact: '',
    contact_number: '',
    address: '',
    barangay: '',
    family_members: 1,
    family_size: 1,
    zone: 'South Caloocan',
    status: 'Pending',
    date_admitted: new Date().toISOString().split('T')[0]
  });

  // Filter residents based on search, region, and status
  useEffect(() => {
    let result = [...residents];

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(resident =>
        (resident.name && resident.name.toLowerCase().includes(searchLower)) ||
        (resident.address && resident.address.toLowerCase().includes(searchLower)) ||
        (resident.contact && resident.contact.includes(search))
      );
    }

    // Apply region filter
    if (activeRegion !== 'All') {
      result = result.filter(resident =>
        resident.zone === activeRegion
      );
    }

    // Apply status filter
    if (statusFilter !== 'All') {
      result = result.filter(resident =>
        resident.status === statusFilter
      );
    }

    setFilteredResidents(result);
  }, [search, activeRegion, statusFilter, residents]);

  // Fetch residents on component mount
  useEffect(() => {
    fetchResidents();
  }, []);


  // Function to fetch residents
  const fetchResidents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Use full URL to match the backend endpoint
      const apiUrl = `${API_BASE_URL}/api/rgd/evacuees.php`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      // First, get the response text to handle potential non-JSON responses
      const responseText = await response.text();

      let data = {};

      try {
        // Try to parse as JSON
        data = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        console.error('Failed to parse response as JSON. Status:', response.status, 'Status Text:', response.statusText);
        console.error('Response headers:', Object.fromEntries(response.headers.entries()));
        console.error('Response text:', responseText);
        throw new Error(`Server returned an invalid response (${response.status} ${response.statusText}). Please check the server logs.`);
      }

      if (!response.ok) {
        const errorMessage = data.message ||
          (response.statusText || 'Unknown error') +
          (responseText ? ` (${responseText})` : '');
        throw new Error(`Server error (${response.status}): ${errorMessage}`);
      }

      if (!data || typeof data !== 'object') {
        throw new Error('Invalid server response format');
      }

      if (data.success) {
        const residentsData = data.data || [];
        setResidents(residentsData);
        setFilteredResidents(residentsData);
        return residentsData; // Return the data for use in other functions
      } else {
        throw new Error(data.message || 'Failed to load evacuee data: Server returned unsuccessful response');
      }
    } catch (error) {
      console.error('Error fetching evacuees:', error);
      setError('Failed to connect to the server');
      setResidents([]);
      setFilteredResidents([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Add new resident via API
  const addNewResident = async () => {
    // Validate required fields
    if (!newResident.name) {
      alert('Please fill in Name (required field)');
      return;
    }

    // Validate contact number
    if (!newResident.contact_number || newResident.contact_number.length !== 11 || !/^\d+$/.test(newResident.contact_number)) {
      alert('Please enter a valid 11-digit contact number');
      return;
    }

    try {
      // Create a copy of newResident to avoid modifying the state directly
      const residentData = { ...newResident };

      // Ensure we're using the correct field names for the API
      if (residentData.family_size) {
        residentData.family_members = residentData.family_size;
        delete residentData.family_size;
      }

      if (residentData.contact_number) {
        residentData.contact = residentData.contact_number;
        delete residentData.contact_number;
      }

      console.log('Sending request to API with data:', residentData);

      // Use full URL to match the backend endpoint
      const apiUrl = `${API_BASE_URL}/api/rgd/evacuees.php`;
      console.log('Sending request to:', apiUrl);
      console.log('Expected backend URL:', `${API_BASE_URL}/api/rgd/evacuees.php`);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(residentData)
      });

      // First, get the response text to handle potential non-JSON responses
      const responseText = await response.text().catch(() => 'Failed to read response text');
      let data = {};

      try {
        // Only try to parse as JSON if there's content
        data = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        console.error('Failed to parse response as JSON. Response:', responseText);
        // If we can't parse as JSON, include the raw response in the error
        throw new Error(`Server returned an invalid response: ${response.status} ${response.statusText}\n${responseText}`);
      }

      // Log the full response for debugging
      console.log('Server response:', { status: response.status, statusText: response.statusText, data });

      if (!response.ok) {
        const errorMessage = data.message ||
          data.error ||
          (response.statusText || 'Unknown error') +
          (responseText ? ` (${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''})` : '');
        throw new Error(`Server error (${response.status}): ${errorMessage}`);
      }

      if (!data || typeof data !== 'object') {
        throw new Error(`Invalid server response format. Received: ${typeof data}`);
      }

      if (data.success === false) {
        throw new Error(data.message || data.error || 'Failed to add resident: Server returned unsuccessful response');
      }

      console.log('Resident added:', data);

      // Reset form
      setNewResident({
        evacuation_id: 1,
        name: '',
        age: '',
        gender: 'Male',
        contact: '',
        address: '',
        family_members: 1,
        family_size: 1, // Keep both for now to ensure UI consistency
        medical_needs: '',
        zone: 'South Caloocan',
        status: 'Pending',
      });

      // Close the modal
      setShowAddModal(false);

      // Refresh the list
      await fetchResidents();
      alert('Resident added successfully!');
    } catch (error) {
      console.error('Error adding resident:', error);
      if (error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError') ||
        error.message.includes('Network request failed')) {
        alert('Network Error: Unable to connect to the server. Please make sure your PHP server is running (XAMPP/WAMP) and the backend path is correct.');
      } else {
        alert(`Error: ${error.message}`);
      }
    }
  };

  // Update resident status via API
  const updateStatus = async (id, status) => {
    try {
      const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
      console.log(`Updating status for resident ${id} to: ${normalizedStatus}`);

      // Use full URL for status update
      const apiUrl = `${API_BASE_URL}/api/rgd/evacuees.php?id=${id}`;
      console.log('Sending status update to:', apiUrl);

      // Get the resident data before updating
      const residentToUpdate = residents.find(r => r.id === id);
      if (!residentToUpdate) {
        throw new Error('Resident not found');
      }

      // Prepare the update data with all required fields
      const updateData = {
        status: normalizedStatus
      };

      // Include all required fields from the resident data
      const requiredFields = ['name', 'address', 'zone', 'contact', 'family_members'];
      requiredFields.forEach(field => {
        if (residentToUpdate[field] !== undefined) {
          updateData[field] = residentToUpdate[field];
        }
      });

      // Update the status in the backend
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(updateData)
      });

      const responseText = await response.text();
      let data;

      try {
        data = responseText ? JSON.parse(responseText) : {};
        console.log('Status update response:', data);
      } catch (e) {
        console.error('Failed to parse response as JSON:', responseText);
        throw new Error('Server returned an invalid response.');
      }

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      if (!data.success) {
        throw new Error(data.message || 'Failed to update status');
      }

      // Refresh the residents list to ensure we have the latest data
      await fetchResidents();

      return true;

    } catch (error) {
      console.error('Error updating resident status:', error);
      if (error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError') ||
        error.message.includes('Network request failed')) {
        alert('Network Error: Unable to connect to the server. Please make sure your PHP server is running.');
      } else {
        alert(`Error: ${error.message}`);
      }
      return false;
    }
  };

  // Function to get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Declined':
        return 'bg-red-100 text-red-800';
      case 'Pending':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  // Helper function to normalize status for comparison
  const normalizeStatus = (status) => {
    if (!status) return 'pending';
    const normalized = status.toString().trim().toLowerCase();
    if (['decline', 'declined', 'rejected', 'denied'].includes(normalized)) return 'declined';
    if (['approve', 'approved', 'accept', 'accepted'].includes(normalized)) return 'approved';
    if (['pending', 'waiting', 'new'].includes(normalized)) return 'pending';
    return 'pending'; // default
  };

  // Separate residents by status using normalized comparison
  const pendingList = filteredResidents.filter((r) => normalizeStatus(r.status) === 'pending');
  const approvedList = filteredResidents.filter((r) => normalizeStatus(r.status) === 'approved');
  const declinedList = filteredResidents.filter((r) => normalizeStatus(r.status) === 'declined');

  return (
    <div className="p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MapPin className="text-blue-600" /> Evacuation Residents – Admin Panel
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Add New Resident
        </button>
      </div>

      {/* Search + Region Filter */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 w-full md:w-2/3">
          <Search className="text-gray-500 dark:text-gray-300" />
          <input
            type="text"
            placeholder="Search resident, barangay or center..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto justify-center">
          {["All", "South Caloocan", "North Caloocan"].map((region) => (
            <button
              key={region}
              onClick={() => setActiveRegion(region)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeRegion === region
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
            >
              {region}
            </button>
          ))}
        </div>
      </div>

      {/* Loading and Error States */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="text-blue-600">Loading evacuee data...</div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Pending Residents Table */}
      <h2 className="text-xl font-semibold mb-2">Pending Residents</h2>
      <div className="overflow-x-auto mb-6">
        <table className="min-w-full bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
          <thead className="bg-blue-100 dark:bg-blue-900">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Age</th>
              <th className="px-4 py-2 text-left">Family Size</th>
              <th className="px-4 py-2 text-left">Address</th>
              <th className="px-4 py-2 text-left">Zone</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {pendingList.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-8 text-gray-500">
                  No pending residents found
                </td>
              </tr>
            ) : (
              pendingList.map((r) => (
                <tr key={r.id} className="border-b dark:border-gray-700">
                  <td className="px-4 py-2">{r.name}</td>
                  <td className="px-4 py-2">{r.age || 'N/A'}</td>
                  <td className="px-4 py-2">{r.family_members || 1}</td>
                  <td className="px-4 py-2">{r.address || 'N/A'}</td>
                  <td className="px-4 py-2">{r.zone || 'N/A'}</td>
                  <td className="px-4 py-2 text-yellow-600 font-medium">{r.status}</td>
                  <td className="px-4 py-2 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmModal({ show: true, action: 'approved', resident: r });
                      }}
                      className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmModal({ show: true, action: 'declined', resident: r });
                      }}
                      className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => setViewResident(r)}
                      className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                    >
                      View
                    </button>
                  </td>
                </tr>
              )))}
          </tbody>
        </table>
      </div>

      {/* Approved Residents Table */}
      <h2 className="text-xl font-semibold mb-2">Approved Residents</h2>
      <div className="overflow-x-auto mb-6">
        <table className="min-w-full bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
          <thead className="bg-green-100 dark:bg-green-900">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Age</th>
              <th className="px-4 py-2 text-left">Family Size</th>
              <th className="px-4 py-2 text-left">Address</th>
              <th className="px-4 py-2 text-left">Zone</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {approvedList.map((r) => (
              <tr key={r.id} className="border-b dark:border-gray-700">
                <td className="px-4 py-2">{r.name}</td>
                <td className="px-4 py-2">{r.age || 'N/A'}</td>
                <td className="px-4 py-2">{r.family_members || 1}</td>
                <td className="px-4 py-2">{r.address || 'N/A'}</td>
                <td className="px-4 py-2">{r.zone || 'N/A'}</td>
                <td className="px-4 py-2 text-green-600 font-medium">{r.status}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => setViewResident(r)}
                    className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Declined Residents Table */}
      <h2 className="text-xl font-semibold mb-2">Declined Residents</h2>
      <div className="overflow-x-auto mb-6">
        <table className="min-w-full bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
          <thead className="bg-red-100 dark:bg-red-900">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Age</th>
              <th className="px-4 py-2 text-left">Family Size</th>
              <th className="px-4 py-2 text-left">Address</th>
              <th className="px-4 py-2 text-left">Zone</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {declinedList.map((r) => (
              <tr key={r.id} className="border-b dark:border-gray-700">
                <td className="px-4 py-2">{r.name}</td>
                <td className="px-4 py-2">{r.age || 'N/A'}</td>
                <td className="px-4 py-2">{r.family_members || 1}</td>
                <td className="px-4 py-2">{r.address || 'N/A'}</td>
                <td className="px-4 py-2">{r.zone || 'N/A'}</td>
                <td className="px-4 py-2 text-red-600 font-medium">{r.status}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => setViewResident(r)}
                    className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View Resident Modal */}
      {viewResident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6 relative">
            <h3 className="text-lg font-semibold mb-4">{viewResident.name} - Details</h3>
            <button
              onClick={() => setViewResident(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              ✖
            </button>
            <div className="grid grid-cols-1 gap-4 mt-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3 border-b pb-2">Personal Information</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Full Name:</span>
                    <span className="font-medium">{viewResident.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Age:</span>
                    <span className="font-medium">{viewResident.age || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Gender:</span>
                    <span className="font-medium">{viewResident.gender || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Contact:</span>
                    <span className="font-medium">{viewResident.contact || viewResident.contact_number || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3 border-b pb-2">Location Details</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Address:</span>
                    <span className="font-medium text-right">{viewResident.address || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Barangay:</span>
                    <span className="font-medium">{viewResident.barangay || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Zone:</span>
                    <span className="font-medium">{viewResident.zone || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3 border-b pb-2">Household Information</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Family Members:</span>
                    <span className="font-medium">{viewResident.family_members || viewResident.family_size || '1'}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-600 dark:text-gray-300">Status:</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${viewResident.status === 'Approved' || viewResident.status === 'approved'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : viewResident.status === 'Declined' || viewResident.status === 'declined'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}
                    >
                      {viewResident.status || 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Resident Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md my-8 relative shadow-xl">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Add New Resident</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Fill in the resident's details below</p>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Form */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Personal Information */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Personal Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={newResident.name}
                      onChange={(e) => setNewResident({ ...newResident, name: e.target.value })}
                      className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-300 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Age</label>
                    <input
                      type="number"
                      min="0"
                      value={newResident.age}
                      onChange={(e) => setNewResident({ ...newResident, age: e.target.value })}
                      className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-300 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>
                    <select
                      value={newResident.gender || 'Other'}
                      onChange={(e) => setNewResident({ ...newResident, gender: e.target.value })}
                      className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-300 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Family Size</label>
                    <input
                      type="number"
                      min="1"
                      value={newResident.family_size}
                      onChange={(e) => setNewResident({ ...newResident, family_size: e.target.value })}
                      className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-300 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4 pt-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Contact Information</h4>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contact Number <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={newResident.contact_number}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 11);
                          setNewResident({ ...newResident, contact_number: value });
                        }}
                        maxLength={11}
                        className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-300 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                        placeholder="09171234567"
                        required
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {newResident.contact_number ? (
                          <span className={`text-xs font-medium ${newResident.contact_number.length === 11 ? 'text-green-600' : 'text-yellow-600'}`}>
                            {newResident.contact_number.length}/11
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {!newResident.contact_number && 'Enter 11-digit mobile number'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4 pt-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Address Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Complete Address</label>
                    <input
                      type="text"
                      value={newResident.address}
                      onChange={(e) => setNewResident({ ...newResident, address: e.target.value })}
                      className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-300 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                      placeholder="House #, Street, Subdivision"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Barangay <span className="text-red-500">*</span></label>
                    <select
                      value={newResident.barangay || ''}
                      onChange={(e) => setNewResident({ ...newResident, barangay: e.target.value })}
                      className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-300 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                      required
                    >
                      <option value="">Select Barangay</option>
                      {barangays.map((barangay) => (
                        <option key={barangay} value={barangay}>
                          {barangay}
                        </option>
                      ))}
                    </select>
                  </div>

                </div>
              </div>

              {/* Zone Selection */}
              <div className="space-y-4 pt-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Zone Information</h4>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Zone <span className="text-red-500">*</span></label>
                  <select
                    value={newResident.zone}
                    onChange={(e) => setNewResident({ ...newResident, zone: e.target.value })}
                    className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-300 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                    required
                  >
                    <option value="">Select Zone</option>
                    <option value="South Caloocan">South Caloocan</option>
                    <option value="North Caloocan">North Caloocan</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 rounded-b-lg border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addNewResident}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Save Resident
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6 relative">
            <div className="flex items-center mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${confirmModal.action === 'approved'
                  ? 'bg-green-100'
                  : 'bg-red-100'
                }`}>
                {confirmModal.action === 'approved' ? (
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {confirmModal.action === 'approved' ? 'Approve Resident' : 'Decline Resident'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {confirmModal.resident?.name || 'This resident'}
                </p>
              </div>
            </div>

            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to {confirmModal.action} this resident?
              {confirmModal.action === 'approved'
                ? ' They will be added to the relief beneficiaries list.'
                : ' This action cannot be undone.'}
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmModal({ show: false, action: '', resident: null })}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const success = await updateStatus(confirmModal.resident.id, confirmModal.action);
                  if (success) {
                    setConfirmModal({ show: false, action: '', resident: null });
                    // Show success message
                    const message = confirmModal.action === 'approved'
                      ? 'Resident approved and added to relief beneficiaries list!'
                      : 'Resident status updated to declined.';
                    setSuccessModal({ show: true, message });
                  }
                }}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 ${confirmModal.action === 'approved'
                    ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                    : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                  }`}
              >
                {confirmModal.action === 'approved' ? 'Approve' : 'Decline'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6 relative">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mr-4 bg-green-100">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Success!
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Action completed successfully
                </p>
              </div>
            </div>

            <p className="text-gray-700 dark:text-gray-300 mb-6">
              {successModal.message}
            </p>

            <div className="flex justify-end">
              <button
                onClick={() => setSuccessModal({ show: false, message: '' })}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
