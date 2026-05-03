import { mockCases } from '../mock/data';

// Configuration
const HIGH_PRIORITY_THRESHOLD = 2;
const LOADING_DELAY = 800; // Simulate API loading

// Service functions for dashboard data processing
export const dashboardService = {
  /**
   * Fetch dashboard data with loading simulation
   */
  async fetchDashboardData() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          cases: mockCases || [],
          success: true
        });
      }, LOADING_DELAY);
    });
  },

  /**
   * Filter cases based on search term and status
   */
  filterCases(cases, searchTerm = '', statusFilter = 'all') {
    if (!cases || !Array.isArray(cases)) return [];

    return cases.filter(case_ => {
      const matchesSearch = !searchTerm || 
        case_?.title?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
        case_?.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  },

  /**
   * Calculate dashboard metrics from filtered cases
   */
  calculateMetrics(cases) {
    if (!cases || !Array.isArray(cases)) {
      return {
        totalCases: 0,
        openCases: 0,
        closedCases: 0,
        highPriorityCases: 0,
        pendingCases: 0
      };
    }

    return {
      totalCases: cases.length,
      openCases: cases.filter(c => c?.status === 'open').length,
      closedCases: cases.filter(c => c?.status === 'closed').length,
      highPriorityCases: cases.filter(c => c?.priority === 'high').length,
      pendingCases: cases.filter(c => c?.status === 'pending').length
    };
  },

  /**
   * Prepare chart data for status distribution
   */
  getStatusChartData(metrics) {
    return [
      { 
        name: 'Open', 
        value: metrics.openCases, 
        color: '#3b82f6',
        percentage: metrics.totalCases > 0 ? (metrics.openCases / metrics.totalCases * 100).toFixed(1) : 0
      },
      { 
        name: 'Closed', 
        value: metrics.closedCases, 
        color: '#10b981',
        percentage: metrics.totalCases > 0 ? (metrics.closedCases / metrics.totalCases * 100).toFixed(1) : 0
      },
      { 
        name: 'Pending', 
        value: metrics.pendingCases, 
        color: '#f59e0b',
        percentage: metrics.totalCases > 0 ? (metrics.pendingCases / metrics.totalCases * 100).toFixed(1) : 0
      }
    ];
  },

  /**
   * Prepare chart data for priority breakdown
   */
  getPriorityChartData(cases) {
    if (!cases || !Array.isArray(cases)) {
      return [
        { priority: 'High', count: 0, color: '#ef4444' },
        { priority: 'Medium', count: 0, color: '#f59e0b' },
        { priority: 'Low', count: 0, color: '#10b981' }
      ];
    }

    return [
      { 
        priority: 'High', 
        count: cases.filter(c => c?.priority === 'high').length, 
        color: '#ef4444' 
      },
      { 
        priority: 'Medium', 
        count: cases.filter(c => c?.priority === 'medium').length, 
        color: '#f59e0b' 
      },
      { 
        priority: 'Low', 
        count: cases.filter(c => c?.priority === 'low').length, 
        color: '#10b981' 
      }
    ];
  },

  /**
   * Generate insights based on metrics
   */
  generateInsight(metrics) {
    const { totalCases, openCases, closedCases, highPriorityCases } = metrics;

    if (totalCases === 0) {
      return {
        type: 'info',
        message: 'No cases available for analysis',
        icon: 'ð'
      };
    }

    if (highPriorityCases > HIGH_PRIORITY_THRESHOLD) {
      return {
        type: 'warning',
        message: `${highPriorityCases} high priority cases require immediate attention - consider reallocating resources`,
        icon: 'â'
      };
    }

    if (openCases > closedCases) {
      const difference = openCases - closedCases;
      return {
        type: 'alert',
        message: `${difference} more cases are open than closed - focus on case resolution to improve workflow`,
        icon: 'â'
      };
    }

    if (closedCases > openCases) {
      return {
        type: 'success',
        message: `Case resolution rate is healthy - ${closedCases} cases closed successfully`,
        icon: 'â'
      };
    }

    return {
      type: 'info',
      message: 'Case management is balanced - equal open and closed cases',
      icon: 'ð'
    };
  },

  /**
   * Check if alert banner should be shown
   */
  shouldShowAlertBanner(metrics) {
    return metrics.highPriorityCases > HIGH_PRIORITY_THRESHOLD;
  },

  /**
   * Get alert banner data
   */
  getAlertBannerData(metrics) {
    if (!this.shouldShowAlertBanner(metrics)) {
      return null;
    }

    return {
      type: 'warning',
      title: 'High Priority Alert',
      message: `${metrics.highPriorityCases} high priority cases exceed the threshold of ${HIGH_PRIORITY_THRESHOLD}. Immediate attention required.`,
      actionText: 'View High Priority Cases'
    };
  },

  /**
   * Get available status options for filter dropdown
   */
  getStatusOptions() {
    return [
      { value: 'all', label: 'All Status' },
      { value: 'open', label: 'Open' },
      { value: 'closed', label: 'Closed' },
      { value: 'pending', label: 'Pending' }
    ];
  }
};

export default dashboardService;
