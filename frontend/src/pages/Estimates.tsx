import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Copy,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Building,
  User
} from 'lucide-react';
import { apiService } from '../services/api';
import { Estimate, CreateEstimateRequest } from '../types';
import { formatCurrency, formatDate, getStatusColor } from '../utils';
import LoadingSpinner from '../components/LoadingSpinner';
import EstimateModal from '../components/EstimateModal';
import toast from 'react-hot-toast';

const EstimatesPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [siteFilter, setSiteFilter] = useState('');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEstimate, setEditingEstimate] = useState<Estimate | null>(null);
  const queryClient = useQueryClient();

  const { data: estimatesData, isLoading } = useQuery(
    ['estimates', currentPage, searchTerm, statusFilter, siteFilter],
    () => apiService.getEstimates({
      page: currentPage,
      limit: 12,
      search: searchTerm || undefined,
      status: statusFilter || undefined,
      site_id: siteFilter ? parseInt(siteFilter) : undefined
    }),
    {
      refetchInterval: 30000,
      keepPreviousData: true
    }
  );

  const { data: sitesData } = useQuery(
    ['sites-for-filter'],
    () => apiService.getSites({ limit: 100 }),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const updateStatusMutation = useMutation(
    ({ id, status }: { id: number; status: Estimate['status'] }) =>
      apiService.updateEstimate(id, { status }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('estimates');
        setStatusDropdownOpen(null);
        toast.success('Status updated successfully');
      },
      onError: () => {
        toast.error('Failed to update status');
      },
    }
  );

  const duplicateEstimateMutation = useMutation(
    ({ id, title }: { id: number; title: string }) =>
      apiService.duplicateEstimate(id, title),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('estimates');
        toast.success('Estimate duplicated successfully');
      },
      onError: () => {
        toast.error('Failed to duplicate estimate');
      },
    }
  );

  const createEstimateMutation = useMutation(
    (data: CreateEstimateRequest) => apiService.createEstimate(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('estimates');
        setShowCreateModal(false);
        toast.success('Estimate created successfully');
      },
      onError: () => {
        toast.error('Failed to create estimate');
      },
    }
  );

  const updateEstimateMutation = useMutation(
    ({ id, data }: { id: number; data: Partial<CreateEstimateRequest> }) =>
      apiService.updateEstimate(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('estimates');
        setEditingEstimate(null);
        toast.success('Estimate updated successfully');
      },
      onError: () => {
        toast.error('Failed to update estimate');
      },
    }
  );

  const deleteEstimateMutation = useMutation(
    (id: number) => apiService.deleteEstimate(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('estimates');
        toast.success('Estimate deleted successfully');
      },
      onError: () => {
        toast.error('Failed to delete estimate');
      },
    }
  );

  // Close dropdown when clicking outside
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

  const estimates = estimatesData?.estimates || [];
  const sites = sitesData?.sites || [];

  const handleStatusChange = (estimateId: number, newStatus: Estimate['status']) => {
    updateStatusMutation.mutate({ id: estimateId, status: newStatus });
  };

  const handleDuplicate = (estimate: Estimate) => {
    const newTitle = `${estimate.title} (Copy)`;
    duplicateEstimateMutation.mutate({ id: estimate.estimate_id, title: newTitle });
  };

  const handleDelete = (estimate: Estimate) => {
    if (confirm(`Are you sure you want to delete the estimate "${estimate.title}"? This action cannot be undone.`)) {
      deleteEstimateMutation.mutate(estimate.estimate_id);
    }
  };

  const statusOptions: Array<{ value: Estimate['status']; label: string; color: string }> = [
    { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
    { value: 'submitted', label: 'Submitted', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'approved', label: 'Approved', color: 'bg-green-100 text-green-800' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
    { value: 'archived', label: 'Archived', color: 'bg-purple-100 text-purple-800' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Project Estimates</h1>
          <p className="mt-2 text-sm text-gray-700">
            Create and manage detailed project estimates
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="block rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <Plus className="h-4 w-4 inline mr-2" />
            New Estimate
          </button>
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
            title="Filter estimates by status"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="archived">Archived</option>
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
            onClick={() => navigate(`/estimates/${estimate.estimate_id}`)}
          >
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {estimate.title}
                </h3>
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setStatusDropdownOpen(
                        statusDropdownOpen === estimate.estimate_id ? null : estimate.estimate_id
                      );
                    }}
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(estimate.status)}`}
                  >
                    {estimate.status}
                    <svg className="ml-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {statusDropdownOpen === estimate.estimate_id && (
                    <div className="absolute top-full right-0 mt-1 w-32 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                      <div className="py-1">
                        {statusOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (option.value !== estimate.status) {
                                handleStatusChange(estimate.estimate_id, option.value);
                              } else {
                                setStatusDropdownOpen(null);
                              }
                            }}
                            disabled={updateStatusMutation.isLoading}
                            className={`block w-full text-left px-4 py-2 text-xs font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${
                              option.value === estimate.status
                                ? 'bg-gray-100 ' + option.color
                                : 'text-gray-700'
                            }`}
                          >
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 ${option.color}`}>
                              {option.label}
                            </span>
                            {option.value === estimate.status && (
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
                  <Building className="h-4 w-4 mr-2" />
                  {estimate.site_name || 'Unknown Site'}
                </div>

                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-2" />
                  Created {formatDate(estimate.date_created)}
                </div>

                <div className="flex items-center text-sm text-gray-500">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Total: {formatCurrency(estimate.total_estimated || 0)}
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

              <div className="mt-5 flex justify-end space-x-2">
                <button
                  onClick={() => handleDuplicate(estimate)}
                  disabled={duplicateEstimateMutation.isLoading}
                  className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                  title="Duplicate estimate"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setEditingEstimate(estimate)}
                  className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  title="Edit estimate details"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(estimate)}
                  disabled={deleteEstimateMutation.isLoading}
                  className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                  title="Delete estimate"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {estimates.length === 0 && (
          <div className="col-span-full text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <FileText className="h-12 w-12" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No estimates</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new project estimate.</p>
          </div>
        )}
      </div>

      {/* TODO: Add pagination component */}

      {/* Estimate Modal */}
      {(showCreateModal || editingEstimate) && (
        <EstimateModal
          isOpen={showCreateModal || !!editingEstimate}
          estimate={editingEstimate}
          onClose={() => {
            setShowCreateModal(false);
            setEditingEstimate(null);
          }}
          onSubmit={(data) => {
            if (editingEstimate) {
              updateEstimateMutation.mutate({ id: editingEstimate.estimate_id, data });
            } else {
              createEstimateMutation.mutate(data);
            }
          }}
          isLoading={editingEstimate ? updateEstimateMutation.isLoading : createEstimateMutation.isLoading}
        />
      )}
    </div>
  );
};

export default EstimatesPage;