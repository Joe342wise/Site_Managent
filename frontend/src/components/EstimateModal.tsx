import React, { useState, useEffect } from 'react';
import { X, Calendar, FileText, Building, User } from 'lucide-react';
import { useQuery } from 'react-query';
import { Estimate, CreateEstimateRequest } from '../types';
import { apiService } from '../services/api';

interface EstimateModalProps {
  isOpen: boolean;
  estimate?: Estimate | null;
  onClose: () => void;
  onSubmit: (data: CreateEstimateRequest) => void;
  isLoading?: boolean;
}

const EstimateModal: React.FC<EstimateModalProps> = ({
  isOpen,
  estimate,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<CreateEstimateRequest>({
    site_id: 0,
    title: '',
    description: '',
    date_created: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: sitesData } = useQuery(
    ['sites-for-estimate'],
    () => apiService.getSites({ limit: 100 }),
    {
      enabled: isOpen,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  useEffect(() => {
    if (estimate) {
      // Editing existing estimate
      setFormData({
        site_id: estimate.site_id,
        title: estimate.title,
        description: estimate.description || '',
        date_created: estimate.date_created ? estimate.date_created.split('T')[0] : '',
      });
    } else {
      // Creating new estimate
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        site_id: 0,
        title: '',
        description: '',
        date_created: today,
      });
    }
    setErrors({});
  }, [estimate, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Estimate title is required';
    }

    if (!formData.site_id || formData.site_id === 0) {
      newErrors.site_id = 'Please select a site';
    }

    if (!formData.date_created) {
      newErrors.date_created = 'Date created is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
  };

  const handleInputChange = (field: keyof CreateEstimateRequest, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  if (!isOpen) return null;

  const sites = sitesData?.sites || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {estimate ? 'Edit Estimate' : 'Create New Estimate'}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                  title="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Site Selection */}
                <div>
                  <label htmlFor="site_id" className="block text-sm font-medium text-gray-700 mb-1">
                    <Building className="h-4 w-4 inline mr-1" />
                    Site *
                  </label>
                  <select
                    id="site_id"
                    value={formData.site_id}
                    onChange={(e) => handleInputChange('site_id', parseInt(e.target.value))}
                    className={`block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.site_id ? 'border-red-500' : ''
                    }`}
                    disabled={isLoading || !!estimate} // Disable site selection when editing
                  >
                    <option value={0}>Select a site...</option>
                    {sites.map((site) => (
                      <option key={site.site_id} value={site.site_id}>
                        {site.name} {site.location && `- ${site.location}`}
                      </option>
                    ))}
                  </select>
                  {errors.site_id && <p className="mt-1 text-sm text-red-600">{errors.site_id}</p>}
                </div>

                {/* Estimate Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    <FileText className="h-4 w-4 inline mr-1" />
                    Estimate Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className={`block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.title ? 'border-red-500' : ''
                    }`}
                    placeholder="Enter estimate title"
                    disabled={isLoading}
                  />
                  {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                </div>

                {/* Date Created */}
                <div>
                  <label htmlFor="date_created" className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Date Created *
                  </label>
                  <input
                    type="date"
                    id="date_created"
                    value={formData.date_created}
                    onChange={(e) => handleInputChange('date_created', e.target.value)}
                    className={`block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.date_created ? 'border-red-500' : ''
                    }`}
                    disabled={isLoading}
                  />
                  {errors.date_created && <p className="mt-1 text-sm text-red-600">{errors.date_created}</p>}
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    <FileText className="h-4 w-4 inline mr-1" />
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter estimate description (optional)"
                    disabled={isLoading}
                  />
                </div>

                {/* Info note for new estimates */}
                {!estimate && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <User className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">
                          New Estimate
                        </h3>
                        <p className="mt-1 text-sm text-blue-700">
                          The estimate will be created with 'draft' status. You can add items and modify details after creation.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : estimate ? 'Update Estimate' : 'Create Estimate'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EstimateModal;