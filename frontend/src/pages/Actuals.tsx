import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Building,
  FileText,
  Calendar,
  DollarSign,
  User,
  ShoppingCart
} from 'lucide-react';
import { apiService } from '../services/api';
import { Estimate } from '../types';
import { formatCurrency, formatDate, getStatusColor } from '../utils';
import LoadingSpinner from '../components/LoadingSpinner';

const ActualsPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [siteFilter, setSiteFilter] = useState('');

  // Fetch estimates (these will be our "actuals" cards to work with)
  const { data: estimatesData, isLoading } = useQuery(
    ['estimates-for-actuals', currentPage, searchTerm, statusFilter, siteFilter],
    () => apiService.getEstimates({
      page: currentPage,
      limit: 12,
      search: searchTerm || undefined,
      status: statusFilter || undefined,
      site_id: siteFilter ? parseInt(siteFilter) : undefined
    }),
    {
      refetchInterval: 3 * 60 * 1000, // 3 minutes
      staleTime: 2 * 60 * 1000, // 2 minutes
      keepPreviousData: true,
      refetchOnWindowFocus: false
    }
  );

  // Fetch sites for filter
  const { data: sitesData } = useQuery(
    ['sites-for-filter'],
    () => apiService.getSites({ limit: 100 }),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const estimates = estimatesData?.estimates || [];
  const sites = sitesData?.sites || [];

  // Navigate to actual purchase entry for the selected estimate
  const handleActualEntry = (estimate: Estimate) => {
    navigate(`/actuals/${estimate.estimate_id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Purchase Entry</h1>
          <p className="mt-2 text-sm text-gray-700">
            Record actual purchases against approved project estimates
          </p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search estimates by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div className="relative">
          <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="block w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            title="Filter estimates by status"
          >
            <option value="">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="submitted">Submitted</option>
            <option value="draft">Draft</option>
          </select>
        </div>
        <div className="relative">
          <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <select
            value={siteFilter}
            onChange={(e) => {
              setSiteFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="block w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            title="Filter estimates by site"
          >
            <option value="">All Sites</option>
            {sites.map((site) => (
              <option key={site.site_id} value={site.site_id}>
                {site.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Estimates Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {estimates.map((estimate) => (
          <div
            key={estimate.estimate_id}
            className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleActualEntry(estimate)}
          >
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {estimate.title}
                </h3>
                <div className="flex items-center space-x-2">
                  <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(estimate.status)}`}>
                    {estimate.status}
                  </div>
                  <span title="Click to enter purchases">
                    <ShoppingCart className="h-5 w-5 text-blue-600" />
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-500">
                  <Building className="h-4 w-4 mr-2" />
                  {estimate.site_name || 'Unknown Site'}
                </div>

                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-2" />
                  Created {formatDate(estimate.date_created)}
                </div>

                <div className="flex items-center text-sm text-gray-500">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Approved Budget: {formatCurrency(estimate.total_estimated || 0)}
                </div>

                {estimate.created_by_username && (
                  <div className="flex items-center text-sm text-gray-500">
                    <User className="h-4 w-4 mr-2" />
                    By {estimate.created_by_username}
                  </div>
                )}

                <dl className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Version</dt>
                    <dd className="text-sm text-gray-900">{estimate.version}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Items</dt>
                    <dd className="text-sm text-gray-900">{estimate.item_count || 0}</dd>
                  </div>
                </dl>
              </div>

              <div className="mt-5">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <ShoppingCart className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-blue-900">Click to Enter Purchases</p>
                  <p className="text-xs text-blue-700">Record actual quantities and prices</p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {estimates.length === 0 && (
          <div className="col-span-full text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <FileText className="h-12 w-12" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No estimates found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter || siteFilter
                ? 'Try adjusting your filters or search term.'
                : 'Create project estimates first to record purchases against them.'}
            </p>
          </div>
        )}
      </div>

      {/* TODO: Add pagination component when needed */}
    </div>
  );
};

export default ActualsPage;