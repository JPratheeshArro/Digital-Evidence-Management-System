// Feature flag for mock data
export const USE_MOCK = true;

// Mock user data
export const mockUser = {
  id: 1,
  name: 'Demo User',
  email: 'demo@dems.gov',
  role: 'admin'
};

// Mock cases data
export const mockCases = [
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
  }
];
