import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plus, Edit, Trash2, MapPin, Calendar, DollarSign, Search, Filter } from 'lucide-react';
import { apiService } from '../services/api';
import { Site } from '../types';
import { formatCurrency, formatDate, getStatusColor } from '../utils';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const SitesPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: sitesData, isLoading } = useQuery(
    ['sites', currentPage, searchTerm, statusFilter],
    () => apiService.getSites({
      page: currentPage,
      limit: 9,
      search: searchTerm || undefined,
      status: statusFilter || undefined
    }),
    {
      refetchInterval: 30000,
      keepPreviousData: true
    }
  );

  const updateStatusMutation = useMutation(
    ({ id, status }: { id: number; status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled' }) =>
      apiService.updateSite(id, { status }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('sites');
        setStatusDropdownOpen(null);
        toast.success('Status updated successfully');
      },
    }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const sites = sitesData?.sites || [];

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => setStatusDropdownOpen(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleStatusChange = (siteId: number, newStatus: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled') => {
    updateStatusMutation.mutate({ id: siteId, status: newStatus });
  };

  const statusOptions: Array<{ value: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'; label: string; color: string }> = [
    { value: 'planning', label: 'Planning', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
    { value: 'on_hold', label: 'On Hold', color: 'bg-orange-100 text-orange-800' },
    { value: 'completed', label: 'Completed', color: 'bg-blue-100 text-blue-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  ];

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Construction Sites</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your construction projects and sites
          </p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search sites by name or location..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="block w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">All Statuses</option>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sites.map((site) => (
          <div key={site.site_id} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {site.name}
                </h3>
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setStatusDropdownOpen(
                        statusDropdownOpen === site.site_id ? null : site.site_id
                      );
                    }}
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(site.status)}`}
                  >
                    {site.status.replace('_', ' ')}
                    <svg className="ml-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {statusDropdownOpen === site.site_id && (
                    <div className="absolute top-full right-0 mt-1 w-32 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                      <div className="py-1">
                        {statusOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (option.value !== site.status) {
                                handleStatusChange(site.site_id, option.value);
                              } else {
                                setStatusDropdownOpen(null);
                              }
                            }}
                            disabled={updateStatusMutation.isLoading}
                            className={`block w-full text-left px-4 py-2 text-xs font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${
                              option.value === site.status
                                ? 'bg-gray-100 ' + option.color
                                : 'text-gray-700'
                            }`}
                          >
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 ${option.color}`}>
                              {option.label}
                            </span>
                            {option.value === site.status && (
                              <span className="ml-2 text-blue-600">✓</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-500">
                  <MapPin className="h-4 w-4 mr-2" />
                  {site.location || 'No location specified'}
                </div>

                {site.start_date && (
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    Started {formatDate(site.start_date)}
                  </div>
                )}

                {site.budget_limit && (
                  <div className="flex items-center text-sm text-gray-500">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Budget: {formatCurrency(site.budget_limit)}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {sites.length === 0 && (
          <div className="col-span-full text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <Plus className="h-12 w-12" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No sites</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new construction site.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SitesPage;