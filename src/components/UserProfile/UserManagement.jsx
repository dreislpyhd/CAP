import React, { useState, useEffect } from 'react';
import { UserCog, Mail, Phone, MapPin, Calendar, Search, Filter, RefreshCw, Trash2, AlertTriangle } from 'lucide-react';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [deleteModal, setDeleteModal] = useState({ show: false, user: null });

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        // Filter users based on search term
        if (searchTerm.trim() === '') {
            setFilteredUsers(users);
        } else {
            const filtered = users.filter(user => 
                user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.contact_number.includes(searchTerm) ||
                user.barangay.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredUsers(filtered);
        }
    }, [searchTerm, users]);

    const fetchUsers = async () => {
        setLoading(true);
        setError('');
        
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

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                throw new Error('Server returned an invalid response');
            }

            const data = await response.json();
            
            if (data.status === 'success') {
                setUsers(data.data || []);
                setFilteredUsers(data.data || []);
            } else {
                setError(data.message || 'Failed to fetch users');
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            setError(error.message || 'Failed to fetch users. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleDeleteUser = async (userId) => {
        try {
            const response = await fetch(`http://localhost/gsm/backend/api/users.php?id=${userId}`, {
                method: 'DELETE',
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
                // Remove user from state
                setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
                setDeleteModal({ show: false, user: null });
                setError('');
            } else {
                setError(data.message || 'Failed to delete user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            setError(error.message || 'Failed to delete user. Please try again.');
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <UserCog className="h-6 w-6 mr-2 text-blue-600 dark:text-blue-400" />
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">User Management</h1>
                </div>
                <button
                    onClick={fetchUsers}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    disabled={loading}
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                    {error}
                </div>
            )}

            {/* Search and Filter */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
                <div className="flex items-center space-x-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email, contact, or barangay..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center text-sm text-gray-700 dark:text-gray-200">
                        <Filter className="h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" />
                        {filteredUsers.length} of {users.length} users
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <RefreshCw className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400 mr-2" />
                        <span className="text-gray-700 dark:text-gray-200">Loading users...</span>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-12">
                        <UserCog className="h-12 w-12 text-gray-400 dark:text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-700 dark:text-gray-200">
                            {searchTerm ? 'No users found matching your search.' : 'No registered users found.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        User Information
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Contact
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Location
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Registration Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <UserCog className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                        {user.full_name}
                                                    </div>
                                                    <div className="text-sm text-gray-600 dark:text-gray-300">ID: {user.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-gray-100 flex items-center mb-1">
                                                <Mail className="h-3 w-3 mr-1 text-gray-500 dark:text-gray-400" />
                                                {user.email}
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center">
                                                <Phone className="h-3 w-3 mr-1 text-gray-500 dark:text-gray-400" />
                                                {user.contact_number}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 dark:text-gray-100 flex items-center mb-1">
                                                <MapPin className="h-3 w-3 mr-1 text-gray-500 dark:text-gray-400" />
                                                {user.barangay}
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-xs">
                                                {user.address}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-gray-100 flex items-center">
                                                <Calendar className="h-3 w-3 mr-1 text-gray-500 dark:text-gray-400" />
                                                {formatDate(user.created_at)}
                                            </div>
                                            {user.updated_at !== user.created_at && (
                                                <div className="text-xs text-gray-600 dark:text-gray-300">
                                                    Updated: {formatDate(user.updated_at)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {user.email !== 'drrma36@gmail.com' && user.email !== 'admin@example.com' && (
                                                <button
                                                    onClick={() => setDeleteModal({ show: true, user })}
                                                    className="flex items-center px-3 py-1.5 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                                                    title="Delete user"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-1" />
                                                    Delete
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Summary Stats */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <UserCog className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-700 dark:text-gray-200">Total Users</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{users.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Calendar className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-700 dark:text-gray-200">New This Month</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {users.filter(user => {
                                    const createdDate = new Date(user.created_at);
                                    const thisMonth = new Date();
                                    return createdDate.getMonth() === thisMonth.getMonth() && 
                                           createdDate.getFullYear() === thisMonth.getFullYear();
                                }).length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <MapPin className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-700 dark:text-gray-200">Unique Barangays</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {[...new Set(users.map(user => user.barangay))].length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6 relative">
                        <div className="flex items-center mb-4">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center mr-4 bg-red-100 dark:bg-red-900">
                                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Delete User
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    This action cannot be undone
                                </p>
                            </div>
                        </div>
                        
                        <p className="text-gray-700 dark:text-gray-300 mb-6">
                            Are you sure you want to delete <span className="font-semibold">{deleteModal.user?.full_name}</span>? 
                            This will permanently remove their account and all associated data.
                        </p>
                        
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setDeleteModal({ show: false, user: null })}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteUser(deleteModal.user.id)}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                Delete User
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
