import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Calculator,
  DollarSign,
  Package
} from 'lucide-react';
import { apiService } from '../services/api';
import type { AxiosError } from 'axios';
import { EstimateItem, CreateActualRequest, Actual } from '../types';
import { formatCurrency, formatDate } from '../utils';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

interface ActualEntry {
  item_id: number;
  actual_quantity: number;
  actual_unit_price: number;
  total_actual: number;
  is_saved?: boolean;
}

const ActualDetailPage: React.FC = () => {
  const { estimateId } = useParams<{ estimateId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [actualEntries, setActualEntries] = useState<Record<number, ActualEntry>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Fetch estimate details
  const { data: estimateData, isLoading: isLoadingEstimate } = useQuery(
    ['estimate-for-actual', estimateId],
    () => apiService.getEstimateById(parseInt(estimateId!)),
    {
      enabled: !!estimateId,
    }
  );

  // Fetch estimate items
  const { data: itemsData, isLoading: isLoadingItems } = useQuery(
    ['estimate-items-for-actual', estimateId],
    () => apiService.getEstimateItems(parseInt(estimateId!)),
    {
      enabled: !!estimateId,
    }
  );

  // Fetch existing actuals for this estimate
  const { data: existingActualsData, isLoading: isLoadingActuals } = useQuery(
    ['existing-actuals', estimateId],
    () => apiService.getActuals({ estimate_id: parseInt(estimateId!) }),
    {
      enabled: !!estimateId,
    }
  );

  // Populate local state with existing actuals
  useEffect(() => {
    if (existingActualsData?.data) {
      const existingEntries: Record<number, ActualEntry> = {};

      existingActualsData.data.forEach((actual: Actual) => {
        existingEntries[actual.item_id] = {
          item_id: actual.item_id,
          actual_quantity: actual.actual_quantity || 0,
          actual_unit_price: actual.actual_unit_price || 0,
          total_actual: actual.total_actual || 0,
          is_saved: true // Mark as saved since these come from database
        };
      });

      setActualEntries(existingEntries);
    }
  }, [existingActualsData]);

  // Create actual mutation
  const createActualMutation = useMutation(
    (data: CreateActualRequest) => apiService.createActual(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['dashboard']);
        queryClient.invalidateQueries(['estimates']);
        queryClient.invalidateQueries(['actuals']);
        queryClient.invalidateQueries(['existing-actuals']);
        toast.success('Purchase recorded successfully');
      },
      onError: (error: AxiosError<{ message?: string }>) => {
        toast.error(error.response?.data?.message || 'Failed to record purchase');
      }
    }
  );

  const handleActualChange = (itemId: number, field: keyof ActualEntry, value: string | number) => {
    setActualEntries(prev => {
      const entry = prev[itemId] || {
        item_id: itemId,
        actual_quantity: 0,
        actual_unit_price: 0,
        total_actual: 0,
        is_saved: false
      };

      const updatedEntry = { ...entry, [field]: value };

      // Auto-calculate total when quantity or price changes
      if (field === 'actual_quantity' || field === 'actual_unit_price') {
        const quantity = parseFloat(updatedEntry.actual_quantity?.toString() || '0') || 0;
        const price = parseFloat(updatedEntry.actual_unit_price?.toString() || '0') || 0;
        updatedEntry.total_actual = quantity * price;
      }

      // Mark as unsaved when values change
      if (field !== 'is_saved') {
        updatedEntry.is_saved = false;
      }

      return {
        ...prev,
        [itemId]: updatedEntry
      };
    });
  };

  const handleSaveActual = async (itemId: number) => {
    const entry = actualEntries[itemId];
    if (!entry || entry.actual_quantity <= 0 || entry.actual_unit_price <= 0) {
      toast.error('Please enter valid quantity and unit price');
      return;
    }

    try {
      await createActualMutation.mutateAsync({
        item_id: itemId,
        actual_unit_price: entry.actual_unit_price,
        actual_quantity: entry.actual_quantity,
        date_recorded: new Date().toISOString().split('T')[0]
      });

      // Mark as saved but keep the values in the form
      setActualEntries(prev => ({
        ...prev,
        [itemId]: { ...prev[itemId], is_saved: true }
      }));
    } catch {
      // Error handled by mutation
    }
  };

  const handleSaveAllActuals = async () => {
    const unsavedEntries = Object.values(actualEntries).filter(
      entry => entry.actual_quantity > 0 && entry.actual_unit_price > 0 && !entry.is_saved
    );

    if (unsavedEntries.length === 0) {
      toast.error('No unsaved purchase records to save');
      return;
    }

    setIsSaving(true);
    try {
      for (const entry of unsavedEntries) {
        await createActualMutation.mutateAsync({
          item_id: entry.item_id,
          actual_unit_price: entry.actual_unit_price,
          actual_quantity: entry.actual_quantity,
          date_recorded: new Date().toISOString().split('T')[0]
        });
      }

      // Mark all as saved but keep the values
      setActualEntries(prev => {
        const updated = { ...prev };
        unsavedEntries.forEach(entry => {
          updated[entry.item_id] = { ...updated[entry.item_id], is_saved: true };
        });
        return updated;
      });

      toast.success(`Saved ${unsavedEntries.length} purchase records`);
    } catch {
      // Individual errors handled by mutation
    } finally {
      setIsSaving(false);
    }
  };

  const getTotalPurchaseAmount = () => {
    return Object.values(actualEntries).reduce((sum, entry) => {
      const total = parseFloat(entry.total_actual?.toString() || '0') || 0;
      return sum + total;
    }, 0);
  };

  const getVariance = (estimated: number, actual: number) => {
    const estimatedAmount = parseFloat(estimated?.toString() || '0') || 0;
    const actualAmount = parseFloat(actual?.toString() || '0') || 0;
    const variance = actualAmount - estimatedAmount;
    const percentage = estimatedAmount > 0 ? (variance / estimatedAmount) * 100 : 0;
    return { amount: variance, percentage };
  };

  if (isLoadingEstimate || isLoadingItems || isLoadingActuals) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!estimateData || !itemsData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Estimate not found</h3>
          <p className="text-sm text-gray-500 mt-1">The estimate you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/actuals')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Actuals
          </button>
        </div>
      </div>
    );
  }

  const estimate = estimateData;
  const items = itemsData.items || [];
  const totalPurchaseAmount = getTotalPurchaseAmount();
  const totalEstimated = estimate.total_estimated || 0;
  const variance = getVariance(totalEstimated, totalPurchaseAmount);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/actuals')}
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Purchase Entry
              </button>
            </div>
            <div className="flex items-center space-x-3">
              {Object.values(actualEntries).some(entry => entry.actual_quantity > 0 && entry.actual_unit_price > 0 && !entry.is_saved) && (
                <button
                  onClick={handleSaveAllActuals}
                  disabled={isSaving}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save All Purchases'}
                </button>
              )}
            </div>
          </div>

          <div className="mt-4">
            <h1 className="text-2xl font-bold text-gray-900">{estimate.title}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Purchase Entry for {estimate.site_name} • Created {formatDate(estimate.date_created)}
            </p>
          </div>

          {/* Summary Stats */}
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <Calculator className="h-5 w-5 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Approved Budget</p>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(totalEstimated)}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Purchase Amount</p>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(totalPurchaseAmount)}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <Package className={`h-5 w-5 ${variance.amount > 0 ? 'text-red-600' : variance.amount < 0 ? 'text-green-600' : 'text-gray-600'}`} />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Variance</p>
                  <p className={`text-lg font-semibold ${variance.amount > 0 ? 'text-red-600' : variance.amount < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                    {formatCurrency(Math.abs(variance.amount))} ({Math.abs(variance.percentage).toFixed(1)}%)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Enter Purchase Details
          </h3>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Est. Qty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Est. Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actual Qty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actual Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item: EstimateItem) => {
                  const entry = actualEntries[item.item_id];
                  const isSaved = entry?.is_saved || false;
                  const hasUnsavedChanges = entry && entry.actual_quantity > 0 && entry.actual_unit_price > 0 && !isSaved;

                  return (
                    <tr key={item.item_id} className={isSaved ? 'bg-green-50' : hasUnsavedChanges ? 'bg-yellow-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.description}</div>
                            <div className="text-sm text-gray-500">{item.category_name}</div>
                          </div>
                          {isSaved && (
                            <div className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✓ Saved
                            </div>
                          )}
                          {hasUnsavedChanges && (
                            <div className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              • Unsaved
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={entry?.actual_quantity || ''}
                          onChange={(e) => handleActualChange(item.item_id, 'actual_quantity', parseFloat(e.target.value) || 0)}
                          className="block w-20 rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={entry?.actual_unit_price || ''}
                          onChange={(e) => handleActualChange(item.item_id, 'actual_unit_price', parseFloat(e.target.value) || 0)}
                          className="block w-24 rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(entry?.total_actual || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {isSaved ? (
                          <div className="text-green-600 flex items-center">
                            <span className="text-xs">✓ Saved</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleSaveActual(item.item_id)}
                            disabled={!entry || entry.actual_quantity <= 0 || entry.actual_unit_price <= 0 || createActualMutation.isLoading}
                            className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Save this purchase record"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActualDetailPage;