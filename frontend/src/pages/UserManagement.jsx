import React, { useState, useEffect } from 'react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Mock data - no API call
      setTimeout(() => {
        const mockUsers = [
          {
            id: 1,
            name: 'John Smith',
            email: 'john.smith@dems.gov',
            role: 'admin',
            status: 'active',
            lastLogin: '2024-03-23T10:30:00Z',
            createdAt: '2024-01-15T09:00:00Z'
          },
          {
            id: 2,
            name: 'Sarah Johnson',
            email: 'sarah.johnson@dems.gov',
            role: 'officer',
            status: 'active',
            lastLogin: '2024-03-23T09:15:00Z',
            createdAt: '2024-02-01T14:30:00Z'
          },
          {
            id: 3,
            name: 'Michael Chen',
            email: 'michael.chen@dems.gov',
            role: 'forensic',
            status: 'active',
            lastLogin: '2024-03-23T08:45:00Z',
            createdAt: '2024-01-20T11:15:00Z'
          },
          {
            id: 4,
            name: 'Emily Davis',
            email: 'emily.davis@dems.gov',
            role: 'officer',
            status: 'inactive',
            lastLogin: '2024-03-20T16:20:00Z',
            createdAt: '2024-03-01T10:00:00Z'
          },
          {
            id: 5,
            name: 'Robert Wilson',
            email: 'robert.wilson@dems.gov',
            role: 'forensic',
            status: 'active',
            lastLogin: '2024-03-23T07:30:00Z',
            createdAt: '2024-02-15T13:45:00Z'
          },
          {
            id: 6,
            name: 'Lisa Anderson',
            email: 'lisa.anderson@dems.gov',
            role: 'admin',
            status: 'active',
            lastLogin: '2024-03-23T06:45:00Z',
            createdAt: '2023-12-01T09:30:00Z'
          },
          {
            id: 7,
            name: 'David Martinez',
            email: 'david.martinez@dems.gov',
            role: 'officer',
            status: 'active',
            lastLogin: '2024-03-22T18:30:00Z',
            createdAt: '2024-01-10T08:15:00Z'
          },
          {
            id: 8,
            name: 'Jennifer Taylor',
            email: 'jennifer.taylor@dems.gov',
            role: 'forensic',
            status: 'inactive',
            lastLogin: '2024-03-18T14:20:00Z',
            createdAt: '2024-02-20T11:30:00Z'
          }
        ];
        setUsers(mockUsers);
        setLoading(false);
      }, 700);
    } catch (err) {
      setError('Error loading users data');
      setLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-500 text-purple-100';
      case 'officer':
        return 'bg-blue-500 text-blue-100';
      case 'forensic':
        return 'bg-emerald-500 text-emerald-100';
      default:
        return 'bg-gray-500 text-gray-100';
    }
  };

  const getStatusBadge = (status) => {
    return status === 'active' 
      ? 'bg-emerald-500 text-emerald-100'
      : 'bg-gray-600 text-gray-200';
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleEditUser = (userId) => {
    console.log('Edit user:', userId);
    // TODO: Implement edit functionality
  };

  const handleDeleteUser = (userId) => {
    console.log('Delete user:', userId);
    // TODO: Implement delete functionality
  };

  const handleToggleStatus = (userId) => {
    console.log('Toggle status:', userId);
    // TODO: Implement status toggle
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-200">User Management</h1>
          <p className="text-gray-400 mt-1">Manage system users and permissions</p>
        </div>
        <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors">
          Add User
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-900 border border-red-800 text-red-200 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-300 mb-2">
              Search Users
            </label>
            <input
              id="search"
              type="text"
              placeholder="Search by name or email..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="role-filter" className="block text-sm font-medium text-gray-300 mb-2">
              Filter by Role
            </label>
            <select
              id="role-filter"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="officer">Officer</option>
              <option value="forensic">Forensic</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-300 mb-2">
              Filter by Status
            </label>
            <select
              id="status-filter"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex items-end">
            <div className="text-sm text-gray-400">
              Showing {filteredUsers.length} of {users.length} users
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    className="rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-800">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-800 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-emerald-500 bg-opacity-20 flex items-center justify-center mr-3">
                        <span className="text-emerald-400 text-sm font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-200">{user.name}</div>
                        <div className="text-xs text-gray-400">ID: {user.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getRoleBadge(user.role)}`}>
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(user.status)}`}>
                      {user.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">
                      {new Date(user.lastLogin).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(user.lastLogin).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditUser(user.id)}
                        className="text-emerald-400 hover:text-emerald-300 transition-colors"
                        title="Edit User"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 0L15 7m-3 3l-3-3m0 6l3-3" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user.id)}
                        className={`transition-colors ${
                          user.status === 'active' 
                            ? 'text-yellow-400 hover:text-yellow-300' 
                            : 'text-emerald-400 hover:text-emerald-300'
                        }`}
                        title={user.status === 'active' ? 'Deactivate User' : 'Activate User'}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 0A9 9 0 0018.364 5.636m-9 9h.01M12 12h.01M16 12h.01M8 12h.01" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                        title="Delete User"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m0-6v6m0-6V3a2 2 0 012-2h6a2 2 0 012 2v6" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && !loading && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 016-6h6a6 6 0 016 6v1a6 6 0 01-6 6H3a6 6 0 01-6-6v-1a6 6 0 016-6h6a6 6 0 016 6v1a6 6 0 01-6 6H3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-200 mb-2">No users found</h3>
          <p className="text-gray-400">
            {searchTerm || filterRole !== 'all' || filterStatus !== 'all' 
              ? 'Try adjusting your filters or search terms'
              : 'No users have been added yet'
            }
          </p>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-gray-200 mt-1">{users.length}</p>
            </div>
            <div className="p-3 bg-emerald-500 bg-opacity-10 rounded-lg">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Active Users</p>
              <p className="text-2xl font-bold text-gray-200 mt-1">
                {users.filter(u => u.status === 'active').length}
              </p>
            </div>
            <div className="p-3 bg-emerald-500 bg-opacity-10 rounded-lg">
              <span className="text-2xl">🟢</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Admin Users</p>
              <p className="text-2xl font-bold text-gray-200 mt-1">
                {users.filter(u => u.role === 'admin').length}
              </p>
            </div>
            <div className="p-3 bg-purple-500 bg-opacity-10 rounded-lg">
              <span className="text-2xl">👑</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
