import React, { useState, useEffect } from 'react';
import { X, Calculator, DollarSign, Calendar, FileText, Package } from 'lucide-react';
import { useQuery } from 'react-query';
import { Actual, CreateActualRequest, EstimateItem, Site } from '../types';
import { apiService } from '../services/api';
import { formatCurrency, formatDateForInput } from '../utils';

interface ActualModalProps {
  isOpen: boolean;
  actual?: Actual | null;
  onClose: () => void;
  onSubmit: (data: CreateActualRequest) => void;
  isLoading?: boolean;
}

const ActualModal: React.FC<ActualModalProps> = ({
  isOpen,
  actual,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<CreateActualRequest>({
    item_id: 0,
    actual_unit_price: 0,
    actual_quantity: undefined,
    date_recorded: formatDateForInput(new Date()),
    notes: '',
  });

  const [selectedSite, setSelectedSite] = useState<number | ''>('');
  const [selectedEstimate, setSelectedEstimate] = useState<number | ''>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch sites for site selection
  const { data: sitesData } = useQuery(
    ['sites-modal'],
    () => apiService.getSites({ limit: 100 }),
    {
      enabled: isOpen && !actual,
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  // Fetch estimates for selected site
  const { data: estimatesData } = useQuery(
    ['estimates-modal', selectedSite],
    () => selectedSite ? apiService.getEstimates({ site_id: selectedSite, limit: 100 }) : Promise.resolve({ data: [] }),
    {
      enabled: isOpen && !actual && !!selectedSite,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Fetch estimate items for selected estimate
  const { data: estimateItemsData } = useQuery(
    ['estimate-items-modal', selectedEstimate],
    () => selectedEstimate ? apiService.getEstimateItems(selectedEstimate) : Promise.resolve({ items: [] }),
    {
      enabled: isOpen && !actual && !!selectedEstimate,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Fetch item details if editing
  const { data: selectedItemData } = useQuery(
    ['estimate-item-detail', formData.item_id],
    () => formData.item_id ? apiService.getEstimateItemById(formData.item_id) : Promise.resolve(null),
    {
      enabled: isOpen && !!formData.item_id,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  useEffect(() => {
    if (actual) {
      // Editing existing actual
      setFormData({
        item_id: actual.item_id,
        actual_unit_price: actual.actual_unit_price,
        actual_quantity: actual.actual_quantity,
        date_recorded: formatDateForInput(actual.date_recorded),
        notes: actual.notes || '',
      });
    } else {
      // Creating new actual
      setFormData({
        item_id: 0,
        actual_unit_price: 0,
        actual_quantity: undefined,
        date_recorded: formatDateForInput(new Date()),
        notes: '',
      });
      setSelectedSite('');
      setSelectedEstimate('');
    }
    setErrors({});
  }, [actual, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.item_id || formData.item_id === 0) {
      newErrors.item_id = 'Please select an estimate item';
    }

    if (!formData.actual_unit_price || formData.actual_unit_price <= 0) {
      newErrors.actual_unit_price = 'Actual unit price must be greater than 0';
    }

    if (formData.actual_quantity !== undefined && formData.actual_quantity <= 0) {
      newErrors.actual_quantity = 'Actual quantity must be greater than 0';
    }

    if (!formData.date_recorded) {
      newErrors.date_recorded = 'Date recorded is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Clean up the form data before submission
    const cleanedFormData = {
      ...formData,
      actual_quantity: formData.actual_quantity || null,
      notes: formData.notes?.trim() || ''
    };

    onSubmit(cleanedFormData);
  };

  const handleInputChange = (field: keyof CreateActualRequest, value: string | number | undefined) => {
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

  const calculateTotal = () => {
    const quantity = formData.actual_quantity || (selectedItemData?.quantity || 1);
    return quantity * formData.actual_unit_price;
  };

  if (!isOpen) return null;

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
                  {actual ? 'Edit Actual Cost' : 'Record Actual Cost'}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Site Selection (only for new records) */}
                {!actual && (
                  <div>
                    <label htmlFor="site" className="block text-sm font-medium text-gray-700 mb-1">
                      Site *
                    </label>
                    <select
                      id="site"
                      value={selectedSite}
                      onChange={(e) => {
                        setSelectedSite(e.target.value ? parseInt(e.target.value) : '');
                        setSelectedEstimate('');
                        setFormData(prev => ({ ...prev, item_id: 0 }));
                      }}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      disabled={isLoading}
                    >
                      <option value="">Select a site...</option>
                      {sitesData?.data?.map((site: Site) => (
                        <option key={site.site_id} value={site.site_id}>
                          {site.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Estimate Selection (only for new records) */}
                {!actual && selectedSite && (
                  <div>
                    <label htmlFor="estimate" className="block text-sm font-medium text-gray-700 mb-1">
                      Estimate *
                    </label>
                    <select
                      id="estimate"
                      value={selectedEstimate}
                      onChange={(e) => {
                        setSelectedEstimate(e.target.value ? parseInt(e.target.value) : '');
                        setFormData(prev => ({ ...prev, item_id: 0 }));
                      }}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      disabled={isLoading}
                    >
                      <option value="">Select an estimate...</option>
                      {estimatesData?.data?.map((estimate: any) => (
                        <option key={estimate.estimate_id} value={estimate.estimate_id}>
                          {estimate.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Item Selection */}
                <div>
                  <label htmlFor="item_id" className="block text-sm font-medium text-gray-700 mb-1">
                    <Package className="h-4 w-4 inline mr-1" />
                    Estimate Item *
                  </label>
                  {actual ? (
                    <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-md">
                      {selectedItemData?.description || 'Loading...'}
                    </div>
                  ) : (
                    <select
                      id="item_id"
                      value={formData.item_id}
                      onChange={(e) => handleInputChange('item_id', parseInt(e.target.value))}
                      className={`block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.item_id ? 'border-red-500' : ''
                      }`}
                      disabled={isLoading || !selectedEstimate}
                    >
                      <option value={0}>Select an estimate item...</option>
                      {estimateItemsData?.items?.map((item: EstimateItem) => (
                        <option key={item.item_id} value={item.item_id}>
                          {item.description} - {formatCurrency(item.unit_price)}/{item.unit}
                        </option>
                      ))}
                    </select>
                  )}
                  {errors.item_id && <p className="mt-1 text-sm text-red-600">{errors.item_id}</p>}
                </div>

                {/* Show estimated details */}
                {selectedItemData && (
                  <div className="bg-blue-50 rounded-md p-3">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Estimated Details:</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <div>Quantity: {selectedItemData.quantity} {selectedItemData.unit}</div>
                      <div>Unit Price: {formatCurrency(selectedItemData.unit_price)}</div>
                      <div>Total Estimated: {formatCurrency(selectedItemData.total_estimated)}</div>
                    </div>
                  </div>
                )}

                {/* Actual Unit Price */}
                <div>
                  <label htmlFor="actual_unit_price" className="block text-sm font-medium text-gray-700 mb-1">
                    <DollarSign className="h-4 w-4 inline mr-1" />
                    Actual Unit Price *
                  </label>
                  <input
                    type="number"
                    id="actual_unit_price"
                    value={formData.actual_unit_price}
                    onChange={(e) => handleInputChange('actual_unit_price', parseFloat(e.target.value) || 0)}
                    className={`block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.actual_unit_price ? 'border-red-500' : ''
                    }`}
                    min="0"
                    step="0.01"
                    disabled={isLoading}
                  />
                  {errors.actual_unit_price && <p className="mt-1 text-sm text-red-600">{errors.actual_unit_price}</p>}
                </div>

                {/* Actual Quantity (optional) */}
                <div>
                  <label htmlFor="actual_quantity" className="block text-sm font-medium text-gray-700 mb-1">
                    <Calculator className="h-4 w-4 inline mr-1" />
                    Actual Quantity (optional)
                  </label>
                  <input
                    type="number"
                    id="actual_quantity"
                    value={formData.actual_quantity || ''}
                    onChange={(e) => handleInputChange('actual_quantity', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className={`block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.actual_quantity ? 'border-red-500' : ''
                    }`}
                    min="0"
                    step="0.001"
                    placeholder={`Default: ${selectedItemData?.quantity || '1'} ${selectedItemData?.unit || 'unit'}`}
                    disabled={isLoading}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Leave empty to use estimated quantity ({selectedItemData?.quantity || 1} {selectedItemData?.unit || 'unit'})
                  </p>
                  {errors.actual_quantity && <p className="mt-1 text-sm text-red-600">{errors.actual_quantity}</p>}
                </div>

                {/* Total (calculated) */}
                <div className="bg-gray-50 rounded-md p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Total Actual Cost:</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(calculateTotal())}
                    </span>
                  </div>
                </div>

                {/* Date Recorded */}
                <div>
                  <label htmlFor="date_recorded" className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Date Recorded *
                  </label>
                  <input
                    type="date"
                    id="date_recorded"
                    value={formData.date_recorded}
                    onChange={(e) => handleInputChange('date_recorded', e.target.value)}
                    className={`block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.date_recorded ? 'border-red-500' : ''
                    }`}
                    disabled={isLoading}
                  />
                  {errors.date_recorded && <p className="mt-1 text-sm text-red-600">{errors.date_recorded}</p>}
                </div>

                {/* Notes */}
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    <FileText className="h-4 w-4 inline mr-1" />
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Additional notes about this actual cost..."
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : actual ? 'Update Actual' : 'Record Actual'}
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

export default ActualModal;