import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="max-w-4xl mx-auto text-center px-4">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-gray-200 mb-4">
            Digital Evidence Management System
          </h1>
          <p className="text-xl text-gray-400">
            Secure forensic evidence collection and analysis platform
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Link 
            to="/dashboard" 
            className="bg-gray-900 border border-gray-800 p-8 rounded-lg hover:bg-gray-800 transition-all hover:border-emerald-500 group"
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📊</div>
            <h2 className="text-xl font-semibold text-gray-200 mb-2">Dashboard</h2>
            <p className="text-gray-400">View system overview and statistics</p>
          </Link>
          
          <Link 
            to="/evidence" 
            className="bg-gray-900 border border-gray-800 p-8 rounded-lg hover:bg-gray-800 transition-all hover:border-emerald-500 group"
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📁</div>
            <h2 className="text-xl font-semibold text-gray-200 mb-2">Evidence</h2>
            <p className="text-gray-400">Manage digital evidence and files</p>
          </Link>
          
          <Link 
            to="/cases" 
            className="bg-gray-900 border border-gray-800 p-8 rounded-lg hover:bg-gray-800 transition-all hover:border-emerald-500 group"
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📋</div>
            <h2 className="text-xl font-semibold text-gray-200 mb-2">Cases</h2>
            <p className="text-gray-400">View and manage forensic cases</p>
          </Link>
          
          <Link 
            to="/admin/users" 
            className="bg-gray-900 border border-gray-800 p-8 rounded-lg hover:bg-gray-800 transition-all hover:border-emerald-500 group"
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">👥</div>
            <h2 className="text-xl font-semibold text-gray-200 mb-2">User Management</h2>
            <p className="text-gray-400">Manage system users and permissions</p>
          </Link>
        </div>
        
        <div className="space-y-4">
          <Link 
            to="/login" 
            className="inline-block px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white text-lg font-medium rounded-lg transition-colors"
          >
            Sign In to System
          </Link>
          <div className="text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-medium">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
