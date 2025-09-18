import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Calculator,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Calendar,
  Building,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { apiService } from '../services/api';
import { Actual, CreateActualRequest, Site, Estimate } from '../types';
import { formatCurrency, formatDate, getVarianceColor, formatPercentage } from '../utils';
import LoadingSpinner from '../components/LoadingSpinner';
import ActualModal from '../components/ActualModal';
import toast from 'react-hot-toast';

const ActualsPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSite, setSelectedSite] = useState<number | ''>('');
  const [selectedEstimate, setSelectedEstimate] = useState<number | ''>('');
  const [showModal, setShowModal] = useState(false);
  const [editingActual, setEditingActual] = useState<Actual | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const queryClient = useQueryClient();

  // Fetch actuals with filters
  const { data: actualsData, isLoading: isLoadingActuals } = useQuery(
    ['actuals', currentPage, selectedSite, selectedEstimate, dateFrom, dateTo],
    () => apiService.getActuals({
      page: currentPage,
      limit: 10,
      site_id: selectedSite || undefined,
      estimate_id: selectedEstimate || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined
    }),
    {
      keepPreviousData: true,
      refetchInterval: 30000, // Auto-refresh every 30 seconds like other pages
    }
  );

  // Fetch sites for filter (parallel with actuals)
  const { data: sitesData } = useQuery(
    ['sites-filter'],
    () => apiService.getSites({ limit: 100 }),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
      refetchInterval: 30000, // Sync with actuals refresh
    }
  );

  // Fetch estimates for selected site (parallel when site selected)
  const { data: estimatesData } = useQuery(
    ['estimates-filter', selectedSite],
    () => selectedSite ? apiService.getEstimates({ site_id: selectedSite, limit: 100 }) : Promise.resolve({ data: [] }),
    {
      enabled: !!selectedSite,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchInterval: selectedSite ? 30000 : false, // Sync refresh when site selected
    }
  );

  // Create actual mutation
  const createActualMutation = useMutation(
    (data: CreateActualRequest) => apiService.createActual(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['actuals']);
        queryClient.invalidateQueries(['dashboard']);
        queryClient.invalidateQueries(['sites']);
        queryClient.invalidateQueries(['estimates']);
        setShowModal(false);
        toast.success('Purchase recorded successfully');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to record purchase');
      }
    }
  );

  // Update actual mutation
  const updateActualMutation = useMutation(
    ({ id, data }: { id: number; data: Partial<CreateActualRequest> }) =>
      apiService.updateActual(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['actuals']);
        queryClient.invalidateQueries(['dashboard']);
        queryClient.invalidateQueries(['sites']);
        queryClient.invalidateQueries(['estimates']);
        setShowModal(false);
        setEditingActual(null);
        toast.success('Purchase record updated successfully');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update purchase record');
      }
    }
  );

  // Delete actual mutation
  const deleteActualMutation = useMutation(
    (id: number) => apiService.deleteActual(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['actuals']);
        queryClient.invalidateQueries(['dashboard']);
        queryClient.invalidateQueries(['sites']);
        queryClient.invalidateQueries(['estimates']);
        toast.success('Purchase record deleted successfully');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to delete purchase record');
      }
    }
  );

  const handleCreateActual = (data: CreateActualRequest) => {
    createActualMutation.mutate(data);
  };

  const handleUpdateActual = (data: CreateActualRequest) => {
    if (editingActual) {
      updateActualMutation.mutate({ id: editingActual.actual_id, data });
    }
  };

  const handleEditActual = (actual: Actual) => {
    setEditingActual(actual);
    setShowModal(true);
  };

  const handleDeleteActual = (actual: Actual) => {
    if (confirm(`Are you sure you want to delete this purchase record?`)) {
      deleteActualMutation.mutate(actual.actual_id);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingActual(null);
  };

  const clearFilters = () => {
    setSelectedSite('');
    setSelectedEstimate('');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  const getVarianceIcon = (variancePercentage: number) => {
    if (variancePercentage > 0) return <TrendingUp className="h-4 w-4" />;
    if (variancePercentage < 0) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const filteredActuals = actualsData?.data?.filter((actual: any) =>
    actual.item_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    actual.site_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    actual.estimate_title?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoadingActuals) {
    return <LoadingSpinner size="lg" className="min-h-96" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Purchase Tracking</h1>
          <p className="mt-2 text-sm text-gray-700">
            Record actual purchases against approved estimates and track budget variance
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="block rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            <Plus className="h-4 w-4 inline mr-2" />
            Record Purchase
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search purchases..."
              />
            </div>
          </div>

          {/* Site Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Site
            </label>
            <select
              value={selectedSite}
              onChange={(e) => {
                setSelectedSite(e.target.value ? parseInt(e.target.value) : '');
                setSelectedEstimate('');
                setCurrentPage(1);
              }}
              className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Sites</option>
              {sitesData?.data?.map((site: Site) => (
                <option key={site.site_id} value={site.site_id}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>

          {/* Estimate Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estimate
            </label>
            <select
              value={selectedEstimate}
              onChange={(e) => {
                setSelectedEstimate(e.target.value ? parseInt(e.target.value) : '');
                setCurrentPage(1);
              }}
              className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              disabled={!selectedSite}
            >
              <option value="">All Estimates</option>
              {estimatesData?.data?.map((estimate: Estimate) => (
                <option key={estimate.estimate_id} value={estimate.estimate_id}>
                  {estimate.title}
                </option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setCurrentPage(1);
              }}
              className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date To
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setCurrentPage(1);
                }}
                className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <button
                type="button"
                onClick={clearFilters}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
                title="Clear filters"
              >
                <Filter className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {actualsData?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calculator className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Records
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {actualsData.pagination?.total || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Purchased
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatCurrency(actualsData.summary?.total_actual || 0)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Approved Budget
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatCurrency(actualsData.summary?.total_estimated || 0)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Avg Variance
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatPercentage(actualsData.summary?.avg_variance_percentage || 0)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actuals Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {filteredActuals.length === 0 ? (
          <div className="text-center py-12">
            <Calculator className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No purchases recorded</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedSite || selectedEstimate || dateFrom || dateTo
                ? 'Try adjusting your filters or search term.'
                : 'Start by recording your first purchase against an approved estimate.'}
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Record Purchase
              </button>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredActuals.map((actual: any) => (
              <li key={actual.actual_id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {actual.item_description}
                        </p>
                        <div className="flex items-center space-x-4 mt-1">
                          <div className="flex items-center text-sm text-gray-500">
                            <Building className="h-4 w-4 mr-1" />
                            {actual.site_name}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <FileText className="h-4 w-4 mr-1" />
                            {actual.estimate_title}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(actual.date_recorded)}
                          </div>
                        </div>
                        <div className="flex items-center space-x-6 mt-2">
                          <div className="text-sm">
                            <span className="text-gray-500">Approved Budget:</span>
                            <span className="ml-1 font-medium">{formatCurrency(actual.total_estimated)}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-500">Amount Purchased:</span>
                            <span className="ml-1 font-medium">{formatCurrency(actual.total_actual)}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-500">Variance:</span>
                            <span className={`ml-1 font-medium flex items-center ${
                              actual.variance_percentage > 0 ? 'text-red-600' :
                              actual.variance_percentage < 0 ? 'text-green-600' : 'text-gray-600'
                            }`}>
                              {getVarianceIcon(actual.variance_percentage)}
                              <span className="ml-1">
                                {formatCurrency(actual.variance_amount)} ({formatPercentage(actual.variance_percentage)})
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleEditActual(actual)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit actual"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteActual(actual)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete actual"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pagination */}
      {actualsData?.pagination && actualsData.pagination.total > actualsData.pagination.limit && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(actualsData.pagination.totalPages, currentPage + 1))}
              disabled={currentPage === actualsData.pagination.totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">
                  {(currentPage - 1) * actualsData.pagination.limit + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * actualsData.pagination.limit, actualsData.pagination.total)}
                </span>{' '}
                of{' '}
                <span className="font-medium">{actualsData.pagination.total}</span>{' '}
                results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(actualsData.pagination.totalPages, currentPage + 1))}
                  disabled={currentPage === actualsData.pagination.totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Actual Modal */}
      {showModal && (
        <ActualModal
          isOpen={showModal}
          actual={editingActual}
          onClose={handleCloseModal}
          onSubmit={editingActual ? handleUpdateActual : handleCreateActual}
          isLoading={createActualMutation.isLoading || updateActualMutation.isLoading}
        />
      )}
    </div>
  );
};

export default ActualsPage;