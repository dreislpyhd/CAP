import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../config';

function ToolResource() {
  const [requestForm, setRequestForm] = useState({
    barangay: '',
    location: '',
    disaster_type: '',
    quantity: ''
  });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch requests on component mount
  useEffect(() => {
    fetchRequests();
  }, []);

  // Fetch all requests
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/coordination/resource_requests.php`);
      if (response.data.success) {
        setRequests(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle request form changes
  const handleRequestChange = (e) => {
    const { name, value } = e.target;
    setRequestForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle request form submit
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    try {
      // Send data to local API
      const response = await axios.post(`${API_BASE_URL}/api/coordination/resource_requests.php`, {
        barangay: requestForm.barangay,
        location: requestForm.location,
        disaster_type: requestForm.disaster_type,
        quantity: requestForm.quantity
      });

      if (response.data.success) {
        alert('Request submitted successfully!');
        setRequestForm({
          barangay: '',
          location: '',
          disaster_type: '',
          quantity: ''
        });
        // Refresh requests list
        fetchRequests();
      } else {
        alert('Failed to submit request: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Failed to submit request. Please try again.');
    }
  };






  return (
    <div className="h-full w-full overflow-y-auto overflow-x-hidden mx-1 mt-1 p-2 sm:p-4 lg:p-6 dark:bg-slate-900 bg-white dark:text-slate-300 rounded-lg shadow-lg scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
      <div className="max-w-6xl mx-auto pb-8 min-h-full">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Emergency Resources Assistance</h1>
        </div>

        {/* Request Form Section */}
        <div className="mb-8 bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-slate-200">Emergency Request Form</h3>
          <form onSubmit={handleRequestSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-slate-300">Barangay</label>
              <input
                type="text"
                name="barangay"
                value={requestForm.barangay}
                onChange={handleRequestChange}
                placeholder="Enter barangay name"
                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:text-slate-200"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-slate-300">Location</label>
              <input
                type="text"
                name="location"
                value={requestForm.location}
                onChange={handleRequestChange}
                placeholder="Enter specific location"
                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:text-slate-200"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-slate-300">Types of Disaster</label>
              <input
                type="text"
                name="disaster_type"
                value={requestForm.disaster_type}
                onChange={handleRequestChange}
                placeholder="Enter disaster type"
                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:text-slate-200"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-slate-300">Quantity</label>
              <input
                type="number"
                name="quantity"
                value={requestForm.quantity}
                onChange={handleRequestChange}
                placeholder="Enter quantity needed"
                min="1"
                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:text-slate-200"
                required
              />
            </div>
            <div className="lg:col-span-4">
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
              >
                Submit Request
              </button>
            </div>
          </form>
        </div>

        {/* Requests List Section */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-slate-200">Submitted Requests</h3>

          {loading ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">Loading requests...</p>
          ) : requests.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No requests submitted yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-700">
                    <th className="text-left py-2 px-2 font-medium text-gray-700 dark:text-slate-300">Barangay</th>
                    <th className="text-left py-2 px-2 font-medium text-gray-700 dark:text-slate-300">Location</th>
                    <th className="text-left py-2 px-2 font-medium text-gray-700 dark:text-slate-300">Disaster Type</th>
                    <th className="text-left py-2 px-2 font-medium text-gray-700 dark:text-slate-300">Quantity</th>
                    <th className="text-left py-2 px-2 font-medium text-gray-700 dark:text-slate-300">Status</th>
                    <th className="text-left py-2 px-2 font-medium text-gray-700 dark:text-slate-300">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id} className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700">
                      <td className="py-2 px-2 text-gray-900 dark:text-slate-200">{request.barangay}</td>
                      <td className="py-2 px-2 text-gray-900 dark:text-slate-200">{request.location}</td>
                      <td className="py-2 px-2 text-gray-900 dark:text-slate-200">{request.disaster_type}</td>
                      <td className="py-2 px-2 text-gray-900 dark:text-slate-200">{request.quantity}</td>
                      <td className="py-2 px-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${request.status === 'Pending'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : request.status === 'Approved'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-gray-900 dark:text-slate-200">
                        {new Date(request.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default ToolResource;
