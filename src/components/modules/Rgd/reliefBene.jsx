import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../config';

function Reliefbeneficiary() {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [zoneFilter, setZoneFilter] = useState('All');
  const [selected, setSelected] = useState(null);

  // Fetch approved beneficiaries from the same evacuees API
  const fetchBeneficiaries = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = `${API_BASE_URL}/api/rgd/evacuees.php`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      const responseText = await response.text();
      let data = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        throw new Error('Invalid server response');
      }

      if (!response.ok) {
        throw new Error(data.message || `Server error (${response.status})`);
      }

      if (data.success) {
        // Filter only approved beneficiaries
        const approvedBeneficiaries = (data.data || []).filter(person =>
          person.status === 'Approved' || person.status === 'approved'
        );
        setBeneficiaries(approvedBeneficiaries);
      } else {
        throw new Error(data.message || 'Failed to load beneficiaries');
      }
    } catch (error) {
      console.error('Error fetching beneficiaries:', error);
      setError('Failed to load beneficiaries');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount and add refresh function
  useEffect(() => {
    fetchBeneficiaries();
  }, []);

  // Add a refresh function that can be called manually
  const refreshBeneficiaries = () => {
    fetchBeneficiaries();
  };

  // Format date function
  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';

    try {
      // If it's already a Date object, use it directly
      let date = dateValue instanceof Date ? dateValue : null;

      // If it's a string, try to parse it
      if (!date && typeof dateValue === 'string') {
        // Try parsing as ISO string first
        date = new Date(dateValue);

        // If that fails, try parsing as timestamp
        if (isNaN(date.getTime())) {
          const timestamp = parseInt(dateValue);
          if (!isNaN(timestamp)) {
            date = new Date(timestamp);
          }
        }
      }

      // If we still don't have a valid date, return 'N/A'
      if (!date || isNaN(date.getTime())) {
        return 'N/A';
      }

      // Format the date
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error, 'Value:', dateValue);
      return 'N/A';
    }
  };

  // Filter beneficiaries based on search and zone
  const filteredBeneficiaries = beneficiaries.filter(beneficiary => {
    const matchesSearch = beneficiary.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      beneficiary.address?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesZone = zoneFilter === 'All' ||
      (beneficiary.zone && beneficiary.zone.toLowerCase().includes(zoneFilter.toLowerCase()));
    return matchesSearch && matchesZone;
  });

  // Get unique zones for filter
  const zones = ['All', ...new Set(
    (beneficiaries || [])
      .map(b => b.zone)
      .filter(zone => zone && typeof zone === 'string')
      .map(zone => zone.includes('North') ? 'North Caloocan' : 'South Caloocan')
  )];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  return (
    <div className='p-4 md:p-6 lg:p-8 dark:bg-slate-900 bg-white dark:text-slate-300 min-h-screen'>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">Relief Beneficiary Monitoring</h1>
            <button
              onClick={refreshBeneficiaries}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 transition-colors"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
            Monitor and review beneficiaries receiving relief goods and services.
          </p>
        </div>

        {/* Search & Zone Filter */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by name or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 w-full text-sm md:text-base transition-all duration-200"
              />
            </div>
            <div className="w-full md:w-48">
              <select
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 text-sm md:text-base transition-all duration-200"
              >
                <option value="All">All Zones</option>
                <option value="North">North Caloocan</option>
                <option value="South">South Caloocan</option>
              </select>
            </div>
          </div>
        </div>

        {/* Beneficiaries Table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Zone</th>
                  <th className="px-4 py-3.5 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Family</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Contact</th>
                  <th className="px-4 py-3.5 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-100 dark:divide-gray-700">
                {filteredBeneficiaries.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center">
                        <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <p className="text-lg font-medium mb-1">No Approved Beneficiaries</p>
                        <p className="text-sm">Approved evacuees will appear here once they are processed.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  (filteredBeneficiaries || []).map((beneficiary) => (
                    <tr
                      key={beneficiary.id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {typeof beneficiary.name === 'object' ? 'N/A' : (beneficiary.name || 'N/A')}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          {formatDate(
                            (beneficiary.date_received && typeof beneficiary.date_received !== 'object') ? beneficiary.date_received :
                              (beneficiary.date && typeof beneficiary.date !== 'object') ? beneficiary.date :
                                (beneficiary.created_at && typeof beneficiary.created_at !== 'object') ? beneficiary.created_at :
                                  null
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${(beneficiary.zone && typeof beneficiary.zone === 'string' && beneficiary.zone.includes('North')) ||
                            (beneficiary.address && typeof beneficiary.address === 'string' && beneficiary.address.toLowerCase().includes('north'))
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          }`}>
                          {typeof beneficiary.zone === 'string' ?
                            beneficiary.zone :
                            (beneficiary.address && typeof beneficiary.address === 'string' && beneficiary.address.toLowerCase().includes('north') ?
                              'North Caloocan' : 'South Caloocan')}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                          {typeof beneficiary.family_members === 'object' ? '0' : (beneficiary.family_members || '0')}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          {typeof beneficiary.contact === 'object' ? 'N/A' : (beneficiary.contact || 'N/A')}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-center">
                        <button
                          onClick={() => setSelected(beneficiary)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 font-medium rounded-lg px-3 py-1.5 text-sm bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors duration-200"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  )))}
              </tbody>
            </table>
          </div>
        </div>

        {/* View Modal */}
        {selected && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" onClick={() => setSelected(null)}>
                <div className="absolute inset-0 bg-black/20 dark:bg-black/40"></div>
              </div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block w-full max-w-2xl px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-2xl dark:bg-slate-600 sm:my-8 sm:align-middle sm:p-6 sm:w-full border border-gray-100 dark:border-slate-500/30">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold leading-6 text-gray-900 dark:text-white">
                      Beneficiary Details
                    </h3>
                    <button
                      onClick={() => setSelected(null)}
                      className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                    >
                      <span className="sr-only">Close</span>
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="mt-6">
                    <div className="bg-white dark:bg-slate-600/30 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</h4>
                            <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selected.name || 'N/A'}</p>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Age</h4>
                            <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selected.age || 'N/A'}</p>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Gender</h4>
                            <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                              {selected.gender ?
                                selected.gender.charAt(0).toUpperCase() + selected.gender.slice(1) : 'N/A'}
                            </p>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Family Size</h4>
                            <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                              {selected.family_members || selected.family_size || '1'}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Contact Number</h4>
                            <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                              {selected.contact || selected.contact_number || 'N/A'}
                            </p>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Zone</h4>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(selected.zone && selected.zone.includes('North')) ||
                                (selected.address && selected.address.toLowerCase().includes('north'))
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              }`}>
                              {selected.zone || (selected.address && selected.address.toLowerCase().includes('north') ? 'North Caloocan' : 'South Caloocan')}
                            </span>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</h4>
                            <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                              {selected.address || 'N/A'}
                            </p>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</h4>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(selected.status === 'Approved' || selected.status === 'Active')
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                              }`}>
                              {selected.status || 'Pending'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {selected.date_received && (
                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Relief Received</h4>
                          <p className="mt-1 text-sm text-gray-900 dark:text-white">
                            {new Date(selected.date_received).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5 sm:mt-6">
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default Reliefbeneficiary;
