import React, { useState, useEffect } from 'react';

const CasesManagement = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      // Mock data - no API call
      setTimeout(() => {
        const mockCases = [
          {
            id: 'CASE-001',
            title: 'Digital Forensics Investigation - Corporate Network Breach',
            status: 'open',
            priority: 'high',
            assignedTo: 'John Smith',
            createdDate: '2024-03-23T10:30:00Z',
            lastUpdated: '2024-03-23T14:20:00Z',
            evidenceCount: 12
          },
          {
            id: 'CASE-002',
            title: 'Email Phishing Attack Analysis',
            status: 'closed',
            priority: 'medium',
            assignedTo: 'Sarah Johnson',
            createdDate: '2024-03-22T09:15:00Z',
            lastUpdated: '2024-03-22T16:45:00Z',
            evidenceCount: 8
          },
          {
            id: 'CASE-003',
            title: 'Mobile Device Forensics - Employee Theft',
            status: 'open',
            priority: 'high',
            assignedTo: 'Michael Chen',
            createdDate: '2024-03-21T08:45:00Z',
            lastUpdated: '2024-03-23T11:30:00Z',
            evidenceCount: 15
          },
          {
            id: 'CASE-004',
            title: 'Data Recovery - Server Crash Investigation',
            status: 'pending',
            priority: 'low',
            assignedTo: 'Emily Davis',
            createdDate: '2024-03-20T07:30:00Z',
            lastUpdated: '2024-03-20T12:15:00Z',
            evidenceCount: 6
          },
          {
            id: 'CASE-005',
            title: 'Social Media Account Compromise',
            status: 'closed',
            priority: 'medium',
            assignedTo: 'Robert Wilson',
            createdDate: '2024-03-19T06:45:00Z',
            lastUpdated: '2024-03-21T09:20:00Z',
            evidenceCount: 9
          },
          {
            id: 'CASE-006',
            title: 'Ransomware Attack Response',
            status: 'open',
            priority: 'critical',
            assignedTo: 'Lisa Anderson',
            createdDate: '2024-03-18T05:20:00Z',
            lastUpdated: '2024-03-23T15:45:00Z',
            evidenceCount: 24
          }
        ];
        setCases(mockCases);
        setLoading(false);
      }, 600);
    } catch (err) {
      setError('Error loading cases data');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading cases...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-200">Cases Management</h1>
          <p className="text-gray-400 mt-1">Manage forensic cases and investigations</p>
        </div>
        <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors">
          New Case
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-900 border border-red-800 text-red-200 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Case Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Created Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-800">
              {cases.map((case_) => (
                <tr key={case_.id} className="hover:bg-gray-800 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {case_.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-200">{case_.title}</div>
                      <div className="text-xs text-gray-400">{case_.evidenceCount} evidence items</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      case_.status === 'open' 
                        ? 'bg-blue-500 text-blue-100' 
                        : case_.status === 'closed'
                        ? 'bg-emerald-500 text-emerald-100'
                        : 'bg-yellow-500 text-yellow-100'
                    }`}>
                      {case_.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      case_.priority === 'critical'
                        ? 'bg-red-500 text-red-100'
                        : case_.priority === 'high'
                        ? 'bg-orange-500 text-orange-100'
                        : case_.priority === 'medium'
                        ? 'bg-yellow-500 text-yellow-100'
                        : 'bg-gray-500 text-gray-100'
                    }`}>
                      {case_.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {case_.assignedTo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {new Date(case_.createdDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    <div className="flex items-center space-x-2">
                      <button className="text-emerald-400 hover:text-emerald-300 mr-3">
                        View
                      </button>
                      <button className="text-gray-400 hover:text-gray-300">
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Cases</p>
              <p className="text-2xl font-bold text-gray-200 mt-1">{cases.length}</p>
            </div>
            <div className="p-3 bg-emerald-500 bg-opacity-10 rounded-lg">
              <span className="text-2xl">📋</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Open Cases</p>
              <p className="text-2xl font-bold text-gray-200 mt-1">
                {cases.filter(c => c.status === 'open').length}
              </p>
            </div>
            <div className="p-3 bg-blue-500 bg-opacity-10 rounded-lg">
              <span className="text-2xl">🔍</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Closed Cases</p>
              <p className="text-2xl font-bold text-gray-200 mt-1">
                {cases.filter(c => c.status === 'closed').length}
              </p>
            </div>
            <div className="p-3 bg-emerald-500 bg-opacity-10 rounded-lg">
              <span className="text-2xl">✓</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CasesManagement;
