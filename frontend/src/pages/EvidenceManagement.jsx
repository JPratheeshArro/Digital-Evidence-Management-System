import React, { useState, useEffect } from 'react';

const EvidenceManagement = () => {
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analyzingId, setAnalyzingId] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  useEffect(() => {
    fetchEvidence();
  }, []);

  const fetchEvidence = async () => {
    try {
      // Mock data - no API call
      setTimeout(() => {
        const mockEvidence = [
          {
            id: 1,
            name: 'Forensic_Image_001.jpg',
            type: 'Image',
            status: 'verified',
            size: '2.4 MB',
            uploadedBy: 'John Smith',
            uploadDate: '2024-03-23T10:30:00Z'
          },
          {
            id: 2,
            name: 'Video_Evidence_002.mp4',
            type: 'Video',
            status: 'pending',
            size: '156.7 MB',
            uploadedBy: 'Sarah Johnson',
            uploadDate: '2024-03-23T09:15:00Z'
          },
          {
            id: 3,
            name: 'Document_003.pdf',
            type: 'Document',
            status: 'verified',
            size: '1.2 MB',
            uploadedBy: 'Michael Chen',
            uploadDate: '2024-03-23T08:45:00Z'
          },
          {
            id: 4,
            name: 'Audio_Recording_004.wav',
            type: 'Audio',
            status: 'pending',
            size: '45.3 MB',
            uploadedBy: 'Emily Davis',
            uploadDate: '2024-03-23T07:30:00Z'
          },
          {
            id: 5,
            name: 'System_Log_005.txt',
            type: 'Log File',
            status: 'verified',
            size: '0.8 MB',
            uploadedBy: 'Robert Wilson',
            uploadDate: '2024-03-23T06:45:00Z'
          },
          {
            id: 6,
            name: 'Email_Evidence_006.eml',
            type: 'Email',
            status: 'verified',
            size: '0.3 MB',
            uploadedBy: 'Lisa Anderson',
            uploadDate: '2024-03-23T05:20:00Z'
          },
          {
            id: 7,
            name: 'Screenshot_007.png',
            type: 'Image',
            status: 'pending',
            size: '1.8 MB',
            uploadedBy: 'John Smith',
            uploadDate: '2024-03-23T04:15:00Z'
          },
          {
            id: 8,
            name: 'Database_Dump_008.sql',
            type: 'Database',
            status: 'verified',
            size: '12.5 MB',
            uploadedBy: 'Sarah Johnson',
            uploadDate: '2024-03-23T03:30:00Z'
          }
        ];
        setEvidence(mockEvidence);
        setLoading(false);
      }, 500);
    } catch (err) {
      setError('Error loading evidence data');
      setLoading(false);
    }
  };

  const handleAnalyzeEvidence = async (evidenceId) => {
    setAnalyzingId(evidenceId);
    setAnalysisResult(null);
    
    // Simulate AI analysis delay
    setTimeout(() => {
      setAnalysisResult({
        evidenceId,
        message: "AI Analysis: Potential anomaly detected in metadata. Further investigation recommended.",
        severity: 'warning',
        timestamp: new Date().toISOString()
      });
      setAnalyzingId(null);
    }, 2000);
  };

  const clearAnalysisResult = () => {
    setAnalysisResult(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading evidence...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-200">Evidence Management</h1>
          <p className="text-gray-400 mt-1">Manage and track digital evidence</p>
        </div>
        <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors">
          Add Evidence
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-900 border border-red-800 text-red-200 rounded-lg">
          {error}
        </div>
      )}

      {/* AI Analysis Result Alert */}
      {analysisResult && (
        <div className="p-4 bg-emerald-900 border border-emerald-700 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-emerald-500 bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-emerald-400 text-sm font-bold">AI</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-emerald-200 mb-1">
                  Analysis Complete
                </h3>
                <p className="text-sm text-emerald-100">
                  {analysisResult.message}
                </p>
                <p className="text-xs text-emerald-300 mt-2">
                  Analyzed at {new Date(analysisResult.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
            <button
              onClick={clearAnalysisResult}
              className="flex-shrink-0 text-emerald-300 hover:text-emerald-200 transition-colors"
              title="Dismiss analysis"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Uploaded By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-800">
              {evidence.map((item) => (
                <tr key={item.id} className="hover:bg-gray-800 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {item.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {item.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      item.status === 'verified' 
                        ? 'bg-emerald-500 text-emerald-100' 
                        : 'bg-yellow-500 text-yellow-100'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {item.size}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {item.uploadedBy}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    <div className="flex items-center space-x-2">
                      <button className="text-emerald-400 hover:text-emerald-300 mr-3">
                        View
                      </button>
                      <button className="text-gray-400 hover:text-gray-300">
                        Download
                      </button>
                      <button
                        onClick={() => handleAnalyzeEvidence(item.id)}
                        disabled={analyzingId === item.id}
                        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                          analyzingId === item.id
                            ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                            : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        }`}
                      >
                        {analyzingId === item.id ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 border border-emerald-300 border-t-transparent rounded-full animate-spin"></div>
                            Analyzing...
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l.5 5.436M21 12h-5.5M2.705 5.705l1.586 1.414M9.5 7.5v-6.364M9.5 15.5v-6.364" />
                            </svg>
                            Analyze Evidence
                          </div>
                        )}
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
              <p className="text-sm font-medium text-gray-400">Total Evidence</p>
              <p className="text-2xl font-bold text-gray-200 mt-1">{evidence.length}</p>
            </div>
            <div className="p-3 bg-emerald-500 bg-opacity-10 rounded-lg">
              <span className="text-2xl">📁</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Verified</p>
              <p className="text-2xl font-bold text-gray-200 mt-1">
                {evidence.filter(e => e.status === 'verified').length}
              </p>
            </div>
            <div className="p-3 bg-emerald-500 bg-opacity-10 rounded-lg">
              <span className="text-2xl">✓</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-gray-200 mt-1">
                {evidence.filter(e => e.status === 'pending').length}
              </p>
            </div>
            <div className="p-3 bg-yellow-500 bg-opacity-10 rounded-lg">
              <span className="text-2xl">⏳</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvidenceManagement;
