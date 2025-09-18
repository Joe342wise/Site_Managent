import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plus, Edit, Trash2, MapPin, Calendar, DollarSign, Search, Filter } from 'lucide-react';
import { apiService } from '../services/api';
import { Site, CreateSiteRequest } from '../types';
import { formatCurrency, formatDate, getStatusColor } from '../utils';
import LoadingSpinner from '../components/LoadingSpinner';
import SiteEditModal from '../components/SiteEditModal';
import toast from 'react-hot-toast';

const SitesPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
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

  const updateSiteMutation = useMutation(
    ({ id, data }: { id: number; data: Partial<CreateSiteRequest> }) =>
      apiService.updateSite(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('sites');
        setEditingSite(null);
        toast.success('Site updated successfully');
      },
      onError: (error) => {
        toast.error('Failed to update site');
        console.error('Update error:', error);
      },
    }
  );

  const createSiteMutation = useMutation(
    (data: CreateSiteRequest) => apiService.createSite(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('sites');
        setShowCreateModal(false);
        toast.success('Site created successfully');
      },
      onError: (error) => {
        toast.error('Failed to create site');
        console.error('Create error:', error);
      },
    }
  );

  // Close dropdown when clicking outside - MUST be before any early returns
  React.useEffect(() => {
    const handleClickOutside = () => setStatusDropdownOpen(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const sites = sitesData?.sites || [];

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
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="block rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <Plus className="h-4 w-4 inline mr-2" />
            Add Site
          </button>
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
            title="Filter sites by status"
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

                <dl className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Estimates</dt>
                    <dd className="text-sm text-gray-900">{site.estimate_count || 0}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Total Value</dt>
                    <dd className="text-sm text-gray-900">
                      {formatCurrency(site.total_estimated_amount || 0)}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="mt-5 flex justify-end space-x-2">
                <button
                  onClick={() => setEditingSite(site)}
                  className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  title="Edit details (name, location, dates, budget)"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this site?')) {
                      alert('Delete functionality - Coming soon!');
                    }
                  }}
                  className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  title="Delete site"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
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

      {/* Edit Site Modal */}
      {(showCreateModal || editingSite) && (
        <SiteEditModal
          isOpen={showCreateModal || !!editingSite}
          site={editingSite}
          onClose={() => {
            setShowCreateModal(false);
            setEditingSite(null);
          }}
          onSubmit={(data) => {
            if (editingSite) {
              updateSiteMutation.mutate({ id: editingSite.site_id, data });
            } else {
              // Set default status to 'planning' for new sites
              const createData = { ...data, status: 'planning' as const };
              createSiteMutation.mutate(createData);
            }
          }}
          isLoading={editingSite ? updateSiteMutation.isLoading : createSiteMutation.isLoading}
        />
      )}
    </div>
  );
};

export default SitesPage;