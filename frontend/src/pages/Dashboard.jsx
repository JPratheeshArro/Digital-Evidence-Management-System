import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import dashboardService from '../services/dashboardService';

const Dashboard = () => {
  // URL query params
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [allCases, setAllCases] = useState([]);
  
  // Get initial values from URL params
  const initialSearch = searchParams.get('search') || '';
  const initialStatus = searchParams.get('status') || 'all';
  
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState(initialStatus);

  // Memoized filtered cases
  const filteredCases = useMemo(() => {
    return dashboardService.filterCases(allCases, searchTerm, statusFilter);
  }, [allCases, searchTerm, statusFilter]);

  // Memoized metrics
  const metrics = useMemo(() => {
    return dashboardService.calculateMetrics(filteredCases);
  }, [filteredCases]);

  // Memoized chart data
  const statusData = useMemo(() => {
    return dashboardService.getStatusChartData(metrics);
  }, [metrics]);

  const priorityData = useMemo(() => {
    return dashboardService.getPriorityChartData(filteredCases);
  }, [filteredCases]);

  // Memoized insights
  const insight = useMemo(() => {
    return dashboardService.generateInsight(metrics);
  }, [metrics]);

  // Memoized alert banner
  const alertBanner = useMemo(() => {
    return dashboardService.getAlertBannerData(metrics);
  }, [metrics]);

  // Memoized status options
  const statusOptions = useMemo(() => {
    return dashboardService.getStatusOptions();
  }, []);

  // AI-style insights generation
  const aiInsights = useMemo(() => {
    if (!filteredCases || filteredCases.length === 0) {
      return {
        summary: "No case data available for analysis.",
        recommendations: ["Add cases to enable AI-powered insights."],
        trends: "No trends to analyze.",
        predictions: "Unable to generate predictions without data."
      };
    }

    const { totalCases, openCases, closedCases, highPriorityCases } = metrics;
    const resolutionRate = totalCases > 0 ? (closedCases / totalCases * 100).toFixed(1) : 0;
    const priorityRatio = totalCases > 0 ? (highPriorityCases / totalCases * 100).toFixed(1) : 0;

    return {
      summary: `Current portfolio contains ${totalCases} cases with ${resolutionRate}% resolution rate. ${highPriorityCases} cases (${priorityRatio}%) require immediate attention.`,
      recommendations: [
        resolutionRate < 50 ? "Focus on case resolution strategies to improve workflow efficiency." : "Maintain current resolution practices.",
        priorityRatio > 30 ? "Consider reallocating resources to address high priority case backlog." : "Priority distribution appears balanced.",
        openCases > closedCases ? "Implement proactive case management to reduce open case accumulation." : "Case closure rate is healthy."
      ].filter(Boolean),
      trends: `Case status distribution shows ${openCases} open cases (${(openCases/totalCases*100).toFixed(1)}%) and ${closedCases} closed cases (${(closedCases/totalCases*100).toFixed(1)}%).`,
      predictions: `Based on current trends, projected case resolution for next month: ${Math.max(0, closedCases - openCases)} additional cases expected to close.`
    };
  }, [filteredCases, metrics]);

  // Load initial data
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Sync URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    
    setSearchParams(params, { replace: true });
  }, [searchTerm, statusFilter, setSearchParams]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardService.fetchDashboardData();
      
      if (response.success) {
        setAllCases(response.cases);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleStatusFilterChange = useCallback((e) => {
    setStatusFilter(e.target.value);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('all');
  }, []);

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-700 p-3 rounded-lg shadow-lg">
          <p className="text-gray-200 font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-200 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-400">Loading dashboard data...</p>
        </div>
        
        {/* Loading skeleton for KPI cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg p-6" role="status" aria-label={`Loading metric ${i}`}>
              <div className="animate-pulse">
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-8 bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-700 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold text-gray-200 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-400">Case Management Overview & Insights</p>
      </header>

      {/* Alert Banner */}
      {alertBanner && (
        <section 
          className={`border rounded-lg p-4 ${
            alertBanner.type === 'warning' 
              ? 'bg-yellow-900 border-yellow-700 text-yellow-200'
              : 'bg-blue-900 border-blue-700 text-blue-200'
          }`}
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl" aria-hidden="true">{'\u26a0\ufe0f'}</span>
              <div>
                <h3 className="font-semibold">{alertBanner.title}</h3>
                <p className="text-sm">{alertBanner.message}</p>
              </div>
            </div>
            <button 
              className="px-3 py-1 bg-yellow-700 hover:bg-yellow-600 text-white rounded text-sm transition-colors"
              aria-label={alertBanner.actionText}
            >
              {alertBanner.actionText}
            </button>
          </div>
        </section>
      )}

      {/* Filters Section */}
      <section className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-200 mb-4">Filters</h2>
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <label htmlFor="search-input" className="sr-only">Search cases by title</label>
            <div className="relative">
              <input
                id="search-input"
                type="text"
                placeholder="Search cases by title..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                aria-label="Search cases by title"
              />
              <span className="absolute left-3 top-2.5 text-gray-400" aria-hidden="true">
                {'\ud83d\udd0d'}
              </span>
            </div>
          </div>

          {/* Status Filter Dropdown */}
          <div className="w-full md:w-48">
            <label htmlFor="status-filter" className="sr-only">Filter by status</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={handleStatusFilterChange}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              aria-label="Filter by status"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          {(searchTerm || statusFilter !== 'all') && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded-lg transition-colors"
              aria-label="Clear all filters"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Active Filters Display */}
        {(searchTerm || statusFilter !== 'all') && (
          <div className="mt-4 flex flex-wrap gap-2" role="status" aria-live="polite">
            {searchTerm && (
              <span className="px-3 py-1 bg-emerald-500 bg-opacity-20 text-emerald-400 rounded-full text-sm">
                Search: "{searchTerm}"
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="px-3 py-1 bg-emerald-500 bg-opacity-20 text-emerald-400 rounded-full text-sm">
                Status: {statusOptions.find(opt => opt.value === statusFilter)?.label}
              </span>
            )}
            <span className="px-3 py-1 bg-gray-700 text-gray-400 rounded-full text-sm">
              {filteredCases.length} results
            </span>
          </div>
        )}
      </section>

      {/* KPI Section */}
      <section>
        <h2 className="text-xl font-semibold text-gray-200 mb-4">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Cases */}
          <article className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Cases</p>
                <p className="text-3xl font-bold text-gray-200 mt-2" aria-label={`Total cases: ${metrics.totalCases}`}>
                  {metrics.totalCases}
                </p>
                <p className="text-xs text-gray-500 mt-1">All cases in system</p>
              </div>
              <div className="p-3 bg-emerald-500 bg-opacity-10 rounded-lg" aria-hidden="true">
                <span className="text-2xl">{'\ud83d\udccb'}</span>
              </div>
            </div>
          </article>

          {/* Open Cases */}
          <article className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Open Cases</p>
                <p className="text-3xl font-bold text-blue-400 mt-2" aria-label={`Open cases: ${metrics.openCases}`}>
                  {metrics.openCases}
                </p>
                <p className="text-xs text-gray-500 mt-1">Currently active</p>
              </div>
              <div className="p-3 bg-blue-500 bg-opacity-10 rounded-lg" aria-hidden="true">
                <span className="text-2xl">{'\ud83d\udd0d'}</span>
              </div>
            </div>
          </article>

          {/* Closed Cases */}
          <article className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Closed Cases</p>
                <p className="text-3xl font-bold text-emerald-400 mt-2" aria-label={`Closed cases: ${metrics.closedCases}`}>
                  {metrics.closedCases}
                </p>
                <p className="text-xs text-gray-500 mt-1">Successfully resolved</p>
              </div>
              <div className="p-3 bg-emerald-500 bg-opacity-10 rounded-lg" aria-hidden="true">
                <span className="text-2xl">{'\u2705'}</span>
              </div>
            </div>
          </article>

          {/* High Priority Cases */}
          <article className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">High Priority</p>
                <p className="text-3xl font-bold text-red-400 mt-2" aria-label={`High priority cases: ${metrics.highPriorityCases}`}>
                  {metrics.highPriorityCases}
                </p>
                <p className="text-xs text-gray-500 mt-1">Requires attention</p>
              </div>
              <div className="p-3 bg-red-500 bg-opacity-10 rounded-lg" aria-hidden="true">
                <span className="text-2xl">{'\u26a0\ufe0f'}</span>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* Charts Section */}
      <section>
        <h2 className="text-xl font-semibold text-gray-200 mb-4">Analytics</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution Pie Chart */}
          <article className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-200 mb-4">Case Status Distribution</h3>
            {metrics.totalCases > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percentage }) => `${name}: ${value} (${percentage}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={800}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ color: '#e5e7eb' }}
                    verticalAlign="bottom"
                    height={36}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <span className="text-4xl mb-2 block" aria-hidden="true">{'\ud83d\udcca'}</span>
                  <p>No data available</p>
                </div>
              </div>
            )}
          </article>

          {/* Priority Breakdown Bar Chart */}
          <article className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-200 mb-4">Priority Breakdown</h3>
            {metrics.totalCases > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={priorityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="priority" 
                    stroke="#9ca3af"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#9ca3af"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ color: '#e5e7eb' }}
                    verticalAlign="bottom"
                    height={36}
                  />
                  <Bar 
                    dataKey="count" 
                    radius={[8, 8, 0, 0]}
                    animationBegin={0}
                    animationDuration={800}
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <span className="text-4xl mb-2 block" aria-hidden="true">{'\ud83d\udcca'}</span>
                  <p>No data available</p>
                </div>
              </div>
            )}
          </article>
        </div>
      </section>

      {/* AI-Style Insights Panel */}
      <section className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-200 mb-6">AI-Powered Insights</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Summary */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-emerald-400">Executive Summary</h4>
            <p className="text-gray-300 text-sm leading-relaxed">{aiInsights.summary}</p>
          </div>
          
          {/* Recommendations */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-emerald-400">Strategic Recommendations</h4>
            <ul className="space-y-2">
              {aiInsights.recommendations.map((rec, index) => (
                <li key={index} className="text-gray-300 text-sm flex items-start">
                  <span className="text-emerald-400 mr-2" aria-hidden="true">{'\u2022'}</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
          
          {/* Trends */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-emerald-400">Trend Analysis</h4>
            <p className="text-gray-300 text-sm leading-relaxed">{aiInsights.trends}</p>
          </div>
          
          {/* Predictions */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-emerald-400">Predictive Analytics</h4>
            <p className="text-gray-300 text-sm leading-relaxed">{aiInsights.predictions}</p>
          </div>
        </div>
      </section>

      {/* Traditional Insight Box */}
      <section className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-200 mb-3">Key Insights</h3>
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${
            insight.type === 'warning' ? 'bg-yellow-500 bg-opacity-10' :
            insight.type === 'success' ? 'bg-emerald-500 bg-opacity-10' :
            insight.type === 'alert' ? 'bg-red-500 bg-opacity-10' :
            'bg-blue-500 bg-opacity-10'
          }`} aria-hidden="true">
            <span className="text-xl">{insight.icon}</span>
          </div>
          <p className="text-gray-300">{insight.message}</p>
        </div>
      </section>

      {/* Filtered Cases List */}
      <section>
        <h2 className="text-xl font-semibold text-gray-200 mb-4">
          Recent Cases {filteredCases.length !== allCases.length && `(${filteredCases.length} of ${allCases.length})`}
        </h2>
        <div className="bg-gray-900 border border-gray-800 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-800">
            <p className="text-lg font-medium text-gray-200">Case Details</p>
          </div>
          <div className="p-6">
            {filteredCases?.length > 0 ? (
              filteredCases.map((case_) => (
                <article key={case_?.id} className="mb-4 p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-200 mb-1">{case_?.title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span>ID: {case_?.id}</span>
                        <span>Assigned to: {case_?.assignedTo}</span>
                        <span>Created: {case_?.createdDate ? new Date(case_.createdDate).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        case_?.status === 'open' 
                          ? 'bg-blue-500 text-blue-100' 
                          : case_?.status === 'closed'
                          ? 'bg-emerald-500 text-emerald-100'
                          : 'bg-yellow-500 text-yellow-100'
                      }`}>
                        {case_?.status?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="text-center text-gray-400 py-8">
                <span className="text-4xl mb-2 block" aria-hidden="true">{'\ud83d\udccb'}</span>
                <p>
                  {searchTerm || statusFilter !== 'all' 
                    ? 'No cases match your filters' 
                    : 'No cases available'
                  }
                </p>
                {(searchTerm || statusFilter !== 'all') && (
                  <button 
                    onClick={clearFilters}
                    className="mt-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
                    aria-label="Clear filters to show all cases"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
