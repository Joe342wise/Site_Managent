import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plus, Edit, Trash2, MapPin, Calendar, DollarSign } from 'lucide-react';
import { apiService } from '../services/api';
import { Site, CreateSiteRequest } from '../types';
import { formatCurrency, formatDate, getStatusColor } from '../utils';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const SitesPage: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const queryClient = useQueryClient();

  const { data: sitesData, isLoading } = useQuery(
    'sites',
    () => apiService.getSites({ limit: 50 }),
    { refetchInterval: 30000 }
  );

  const createMutation = useMutation(apiService.createSite, {
    onSuccess: () => {
      queryClient.invalidateQueries('sites');
      setShowCreateModal(false);
      toast.success('Site created successfully');
    },
  });

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: Partial<CreateSiteRequest> }) =>
      apiService.updateSite(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('sites');
        setEditingSite(null);
        toast.success('Site updated successfully');
      },
    }
  );

  const deleteMutation = useMutation(apiService.deleteSite, {
    onSuccess: () => {
      queryClient.invalidateQueries('sites');
      toast.success('Site deleted successfully');
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const sites = sitesData?.sites || [];

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Sites Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sites.map((site) => (
          <div key={site.site_id} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {site.name}
                </h3>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(site.status)}`}>
                  {site.status.replace('_', ' ')}
                </span>
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

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200">
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
                </div>
              </div>

              <div className="mt-5 flex justify-end space-x-2">
                <button
                  onClick={() => setEditingSite(site)}
                  className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this site?')) {
                      deleteMutation.mutate(site.site_id);
                    }
                  }}
                  className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
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
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Site
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal would go here */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Create New Site</h3>
            <p className="text-sm text-gray-500 mb-4">Site creation form would be implemented here.</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SitesPage;