import React, { useState, useEffect } from 'react';
import { X, Package, Tag, Calculator, FileText } from 'lucide-react';
import { useQuery } from 'react-query';
import { EstimateItem, CreateEstimateItemRequest } from '../types';
import { apiService } from '../services/api';
import { formatCurrency } from '../utils';

interface EstimateItemModalProps {
  isOpen: boolean;
  estimateId: number;
  item?: EstimateItem | null;
  onClose: () => void;
  onSubmit: (data: CreateEstimateItemRequest) => void;
  isLoading?: boolean;
}

const EstimateItemModal: React.FC<EstimateItemModalProps> = ({
  isOpen,
  estimateId,
  item,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<CreateEstimateItemRequest>({
    estimate_id: estimateId,
    description: '',
    category_id: 0,
    quantity: 0,
    unit: '',
    unit_price: 0,
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: categories } = useQuery(
    ['categories'],
    () => apiService.getCategories(),
    {
      enabled: isOpen,
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  useEffect(() => {
    if (item) {
      // Editing existing item
      setFormData({
        estimate_id: estimateId,
        description: item.description,
        category_id: item.category_id,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        notes: item.notes || '',
      });
    } else {
      // Creating new item
      setFormData({
        estimate_id: estimateId,
        description: '',
        category_id: 0,
        quantity: 0,
        unit: '',
        unit_price: 0,
        notes: '',
      });
    }
    setErrors({});
  }, [item, estimateId, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.category_id || formData.category_id === 0) {
      newErrors.category_id = 'Please select a category';
    }

    if (!formData.unit.trim()) {
      newErrors.unit = 'Unit is required';
    }

    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    if (!formData.unit_price || formData.unit_price <= 0) {
      newErrors.unit_price = 'Unit price must be greater than 0';
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

  const handleInputChange = (field: keyof CreateEstimateItemRequest, value: string | number) => {
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

  const getUnitsForCategory = (categoryId: number): string[] => {
    if (!categoryId || categoryId === 0) {
      return ['pcs', 'kg', 'm²', 'm³', 'm', 'hrs', 'days', 'bags', 'tons', 'loads', 'trips'];
    }

    // Find the selected category by ID
    const selectedCategory = categories?.find(cat => cat.category_id === categoryId);

    if (!selectedCategory) {
      return ['pcs', 'kg', 'm²', 'm³', 'm', 'hrs'];
    }

    // Map units based on category name instead of hardcoded IDs
    const categoryUnits: Record<string, string[]> = {
      // New construction-specific categories
      'Material': ['pcs', 'kg', 'tons', 'm³', 'm²', 'm', 'bags', 'sacks', 'loads'],
      'Labor': ['hrs', 'days', 'weeks', 'months', 'pcs'],
      'Masonry': ['m³', 'm²', 'm', 'pcs', 'bags', 'tons', 'kg'],
      'Steel Works': ['kg', 'tons', 'pcs', 'm', 'mm'],
      'Plumbing': ['pcs', 'm', 'sets', 'nos', 'lengths'],
      'Carpentry': ['m²', 'm³', 'm', 'pcs', 'sets', 'sqft'],
      'Electrical Works': ['pcs', 'm', 'nos', 'sets', 'points'],
      'Air Conditioning Works': ['pcs', 'sets', 'nos', 'units'],
      'Utilities': ['pcs', 'm', 'connections', 'nos'],
      'Glass Glazing': ['m²', 'pcs', 'sqft', 'panels'],
      'Metal Works': ['kg', 'pcs', 'm', 'sets', 'nos'],
      'POP/Aesthetics Works': ['m²', 'm', 'pcs', 'sqft', 'sets'],
      // Old basic categories (for backward compatibility)
      'Materials': ['pcs', 'kg', 'tons', 'm³', 'm²', 'm', 'bags', 'sacks', 'loads'],
      'Equipment': ['hrs', 'days', 'weeks', 'months', 'pcs'],
      'Transportation': ['km', 'trips', 'loads', 'hrs'],
      'Miscellaneous': ['pcs', 'lots', 'hrs', 'days'],
    };

    return categoryUnits[selectedCategory.name] || ['pcs', 'kg', 'm²', 'm³', 'm', 'hrs'];
  };

  const calculateTotal = () => {
    return (formData.quantity || 0) * (formData.unit_price || 0);
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
                  {item ? 'Edit Estimate Item' : 'Add New Item'}
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
                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    <Package className="h-4 w-4 inline mr-1" />
                    Description *
                  </label>
                  <input
                    type="text"
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className={`block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.description ? 'border-red-500' : ''
                    }`}
                    placeholder="e.g., Concrete blocks, Steel rebar, Paint"
                    disabled={isLoading}
                  />
                  {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                </div>

                {/* Category */}
                <div>
                  <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">
                    <Tag className="h-4 w-4 inline mr-1" />
                    Category *
                  </label>
                  <select
                    id="category_id"
                    value={formData.category_id}
                    onChange={(e) => handleInputChange('category_id', parseInt(e.target.value))}
                    className={`block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.category_id ? 'border-red-500' : ''
                    }`}
                    disabled={isLoading}
                  >
                    <option value={0}>Select a category...</option>
                    {categories?.map((category) => (
                      <option key={category.category_id} value={category.category_id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.category_id && <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>}
                </div>

                {/* Quantity and Unit */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                      <Calculator className="h-4 w-4 inline mr-1" />
                      Quantity *
                    </label>
                    <input
                      type="number"
                      id="quantity"
                      value={formData.quantity || ''}
                      onChange={(e) => handleInputChange('quantity', parseFloat(e.target.value) || 0)}
                      className={`block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.quantity ? 'border-red-500' : ''
                      }`}
                      placeholder="Enter quantity (e.g., 10, 2.5)"
                      min="0"
                      step="0.01"
                      disabled={isLoading}
                    />
                    {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>}
                  </div>

                  <div>
                    <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
                      Unit *
                    </label>
                    <select
                      id="unit"
                      value={formData.unit}
                      onChange={(e) => handleInputChange('unit', e.target.value)}
                      className={`block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.unit ? 'border-red-500' : ''
                      }`}
                      disabled={isLoading}
                    >
                      <option value="">Select unit...</option>
                      {getUnitsForCategory(formData.category_id).map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                    {errors.unit && <p className="mt-1 text-sm text-red-600">{errors.unit}</p>}
                  </div>
                </div>

                {/* Unit Price */}
                <div>
                  <label htmlFor="unit_price" className="block text-sm font-medium text-gray-700 mb-1">
                    <Calculator className="h-4 w-4 inline mr-1" />
                    Unit Price *
                  </label>
                  <input
                    type="number"
                    id="unit_price"
                    value={formData.unit_price || ''}
                    onChange={(e) => handleInputChange('unit_price', parseFloat(e.target.value) || 0)}
                    className={`block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.unit_price ? 'border-red-500' : ''
                    }`}
                    placeholder="Enter unit price (e.g., 25.50)"
                    min="0"
                    step="0.01"
                    disabled={isLoading}
                  />
                  {errors.unit_price && <p className="mt-1 text-sm text-red-600">{errors.unit_price}</p>}
                </div>

                {/* Total (calculated) */}
                <div className="bg-gray-50 rounded-md p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Total Estimated:</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(calculateTotal())}
                    </span>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    <FileText className="h-4 w-4 inline mr-1" />
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Additional notes or specifications (optional)"
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
                {isLoading ? 'Saving...' : item ? 'Update Item' : 'Add Item'}
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

export default EstimateItemModal;