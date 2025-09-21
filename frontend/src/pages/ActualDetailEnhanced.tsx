import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Calculator,
  DollarSign,
  Package,
  Plus,
  X,
  Calendar,
  TrendingUp,
  TrendingDown,
  CheckCircle
} from 'lucide-react';
import { apiService } from '../services/api';
import type { AxiosError } from 'axios';
import { EstimateItem, CreateActualRequest, Actual } from '../types';
import { formatCurrency, formatDate } from '../utils';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

interface PurchaseEntry {
  actual_quantity: number;
  actual_unit_price: number;
  supplier?: string;
  date_recorded: string;
}

interface ItemPurchaseState {
  item_id: number;
  currentEntry: PurchaseEntry;
  purchaseHistory: Actual[];
  isAddingNew: boolean;
}

interface BatchVariance {
  batchIndex: number;
  estimatedUnitPrice: number;
  actualUnitPrice: number;
  quantity: number;
  varianceAmount: number;
  variancePercentage: number;
}

interface ItemVarianceAnalysis {
  totalEstimated: number;
  totalActual: number;
  totalQuantityPurchased: number;
  estimatedQuantity: number;
  remainingQuantity: number;
  totalVariance: number;
  totalVariancePercentage: number;
  batchVariances: BatchVariance[];
  weightedAverageActualPrice: number;
}

const ActualDetailEnhanced: React.FC = () => {
  const { estimateId } = useParams<{ estimateId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [itemStates, setItemStates] = useState<Record<number, ItemPurchaseState>>({});
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

  // Populate local state with existing actuals grouped by item
  useEffect(() => {
    if (existingActualsData?.data && itemsData?.items) {
      const newItemStates: Record<number, ItemPurchaseState> = {};

      // Group existing actuals by item_id
      const actualsByItem = existingActualsData.data.reduce((acc: Record<number, Actual[]>, actual: Actual) => {
        if (!acc[actual.item_id]) acc[actual.item_id] = [];
        acc[actual.item_id].push(actual);
        return acc;
      }, {});

      // Initialize state for each item
      itemsData.items.forEach((item: EstimateItem) => {
        newItemStates[item.item_id] = {
          item_id: item.item_id,
          currentEntry: {
            actual_quantity: 0,
            actual_unit_price: 0,
            supplier: '',
            date_recorded: new Date().toISOString().split('T')[0]
          },
          purchaseHistory: actualsByItem[item.item_id] || [],
          isAddingNew: false
        };
      });

      setItemStates(newItemStates);
    }
  }, [existingActualsData, itemsData]);

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

  const handleCurrentEntryChange = (itemId: number, field: keyof PurchaseEntry, value: string | number) => {
    setItemStates(prev => {
      const currentState = prev[itemId];
      if (!currentState) return prev;

      return {
        ...prev,
        [itemId]: {
          ...currentState,
          currentEntry: {
            ...currentState.currentEntry,
            [field]: value
          }
        }
      };
    });
  };

  const toggleAddingNew = (itemId: number) => {
    setItemStates(prev => {
      const currentState = prev[itemId];
      if (!currentState) return prev;

      return {
        ...prev,
        [itemId]: {
          ...currentState,
          isAddingNew: !currentState.isAddingNew,
          currentEntry: {
            actual_quantity: 0,
            actual_unit_price: 0,
            supplier: '',
            date_recorded: new Date().toISOString().split('T')[0]
          }
        }
      };
    });
  };

  const handleSavePurchase = async (itemId: number) => {
    const itemState = itemStates[itemId];
    if (!itemState || !itemState.currentEntry) {
      toast.error('Invalid item state');
      return;
    }

    const { currentEntry } = itemState;
    if (currentEntry.actual_quantity <= 0 || currentEntry.actual_unit_price <= 0) {
      toast.error('Please enter valid quantity and unit price');
      return;
    }

    try {
      await createActualMutation.mutateAsync({
        item_id: itemId,
        actual_unit_price: currentEntry.actual_unit_price,
        actual_quantity: currentEntry.actual_quantity,
        date_recorded: currentEntry.date_recorded,
        supplier: currentEntry.supplier || undefined
      });

      // Reset current entry and hide the add form
      setItemStates(prev => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          isAddingNew: false,
          currentEntry: {
            actual_quantity: 0,
            actual_unit_price: 0,
            supplier: '',
            date_recorded: new Date().toISOString().split('T')[0]
          }
        }
      }));

      // Refetch data to update purchase history
      queryClient.invalidateQueries(['existing-actuals']);
    } catch {
      // Error handled by mutation
    }
  };

  const handleSaveAllPurchases = async () => {
    const itemsToSave = Object.values(itemStates).filter(
      state => state.isAddingNew &&
               state.currentEntry.actual_quantity > 0 &&
               state.currentEntry.actual_unit_price > 0
    );

    if (itemsToSave.length === 0) {
      toast.error('No valid entries to save');
      return;
    }

    setIsSaving(true);
    try {
      for (const itemState of itemsToSave) {
        await createActualMutation.mutateAsync({
          item_id: itemState.item_id,
          actual_unit_price: itemState.currentEntry.actual_unit_price,
          actual_quantity: itemState.currentEntry.actual_quantity,
          date_recorded: itemState.currentEntry.date_recorded,
          supplier: itemState.currentEntry.supplier || undefined
        });
      }

      // Reset all current entries and hide add forms
      setItemStates(prev => {
        const updated = { ...prev };
        itemsToSave.forEach(itemState => {
          updated[itemState.item_id] = {
            ...updated[itemState.item_id],
            isAddingNew: false,
            currentEntry: {
              actual_quantity: 0,
              actual_unit_price: 0,
              supplier: '',
              date_recorded: new Date().toISOString().split('T')[0]
            }
          };
        });
        return updated;
      });

      // Refetch data to update purchase history
      queryClient.invalidateQueries(['existing-actuals']);
      toast.success(`Saved ${itemsToSave.length} purchase${itemsToSave.length > 1 ? 's' : ''}`);
    } catch (error) {
      toast.error('Failed to save some purchases');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate variance analysis for an item
  const getItemVarianceAnalysis = (item: EstimateItem, purchases: Actual[]): ItemVarianceAnalysis => {
    const estimatedQuantity = parseFloat(item.quantity?.toString() || '0') || 0;
    const estimatedUnitPrice = parseFloat(item.unit_price?.toString() || '0') || 0;
    const totalEstimated = estimatedQuantity * estimatedUnitPrice;

    if (purchases.length === 0) {
      return {
        totalEstimated,
        totalActual: 0,
        totalQuantityPurchased: 0,
        estimatedQuantity,
        remainingQuantity: estimatedQuantity,
        totalVariance: 0,
        totalVariancePercentage: 0,
        batchVariances: [],
        weightedAverageActualPrice: 0
      };
    }

    const totalQuantityPurchased = purchases.reduce((sum, p) => sum + (parseFloat(p.actual_quantity?.toString() || '0') || 0), 0);
    const totalActual = purchases.reduce((sum, p) => sum + (parseFloat(p.total_actual?.toString() || '0') || 0), 0);
    const remainingQuantity = Math.max(0, estimatedQuantity - totalQuantityPurchased);
    const totalVariance = totalActual - (totalQuantityPurchased * estimatedUnitPrice);
    const totalVariancePercentage = totalQuantityPurchased > 0 && estimatedUnitPrice > 0 ? (totalVariance / (totalQuantityPurchased * estimatedUnitPrice)) * 100 : 0;
    const weightedAverageActualPrice = totalQuantityPurchased > 0 ? totalActual / totalQuantityPurchased : 0;

    const batchVariances: BatchVariance[] = purchases.map((purchase, index) => {
      const quantity = parseFloat(purchase.actual_quantity?.toString() || '0') || 0;
      const actualUnitPrice = parseFloat(purchase.actual_unit_price?.toString() || '0') || 0;
      const varianceAmount = (actualUnitPrice - estimatedUnitPrice) * quantity;
      const variancePercentage = estimatedUnitPrice > 0 ? ((actualUnitPrice - estimatedUnitPrice) / estimatedUnitPrice) * 100 : 0;

      return {
        batchIndex: index + 1,
        estimatedUnitPrice,
        actualUnitPrice,
        quantity,
        varianceAmount,
        variancePercentage
      };
    });

    return {
      totalEstimated,
      totalActual,
      totalQuantityPurchased,
      estimatedQuantity,
      remainingQuantity,
      totalVariance,
      totalVariancePercentage,
      batchVariances,
      weightedAverageActualPrice
    };
  };

  // Calculate total project totals
  const getTotalPurchaseAmount = () => {
    return Object.values(itemStates).reduce((sum, itemState) => {
      return sum + itemState.purchaseHistory.reduce((itemSum, purchase) => {
        return itemSum + (parseFloat(purchase.total_actual?.toString() || '0') || 0);
      }, 0);
    }, 0);
  };

  const getVariance = (estimated: number, actual: number) => {
    const variance = actual - estimated;
    const percentage = estimated > 0 ? (variance / estimated) * 100 : 0;
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

  const hasUnsavedPurchases = Object.values(itemStates).some(
    state => state.isAddingNew &&
             state.currentEntry.actual_quantity > 0 &&
             state.currentEntry.actual_unit_price > 0
  );

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
              {hasUnsavedPurchases && (
                <button
                  onClick={handleSaveAllPurchases}
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

      {/* Items List with Purchase History */}
      <div className="space-y-6">
        {items.map((item: EstimateItem) => {
          const itemState = itemStates[item.item_id];
          const varianceAnalysis = getItemVarianceAnalysis(item, itemState?.purchaseHistory || []);

          return (
            <div key={item.item_id} className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{item.description}</h3>
                    <p className="text-sm text-gray-500">{item.category_name}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-500">Estimated</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {item.quantity} {item.unit} × {formatCurrency(item.unit_price)} = {formatCurrency(varianceAnalysis.totalEstimated)}
                      </p>
                    </div>
                    {!itemState?.isAddingNew && (
                      <button
                        onClick={() => toggleAddingNew(item.item_id)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Purchase
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4">
                {/* Purchase History */}
                {varianceAnalysis.batchVariances.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Purchase History</h4>
                    <div className="space-y-3">
                      {itemState?.purchaseHistory.map((purchase, index) => {
                        const batchVariance = varianceAnalysis.batchVariances[index];
                        return (
                          <div key={purchase.actual_id} className="bg-gray-50 rounded-lg p-4">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                              <div>
                                <p className="text-xs text-gray-500">Batch #{batchVariance.batchIndex}</p>
                                <p className="text-sm font-medium">{formatDate(purchase.date_recorded)}</p>
                                {purchase.supplier && (
                                  <p className="text-xs text-gray-500">{purchase.supplier}</p>
                                )}
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Quantity</p>
                                <p className="text-sm font-medium">{purchase.actual_quantity} {item.unit}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Unit Price</p>
                                <p className="text-sm font-medium">{formatCurrency(purchase.actual_unit_price)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Total</p>
                                <p className="text-sm font-medium">{formatCurrency(purchase.total_actual)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Batch Variance</p>
                                <div className={`flex items-center text-sm font-medium ${
                                  batchVariance.varianceAmount > 0 ? 'text-red-600' :
                                  batchVariance.varianceAmount < 0 ? 'text-green-600' : 'text-gray-600'
                                }`}>
                                  {batchVariance.varianceAmount > 0 ? (
                                    <TrendingUp className="h-4 w-4 mr-1" />
                                  ) : batchVariance.varianceAmount < 0 ? (
                                    <TrendingDown className="h-4 w-4 mr-1" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                  )}
                                  {formatCurrency(Math.abs(batchVariance.varianceAmount))} ({Math.abs(batchVariance.variancePercentage).toFixed(1)}%)
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Add New Purchase Form */}
                {itemState?.isAddingNew && (
                  <div className="bg-blue-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-md font-medium text-gray-900">Add New Purchase</h4>
                      <button
                        onClick={() => toggleAddingNew(item.item_id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <input
                          type="date"
                          value={itemState.currentEntry.date_recorded}
                          onChange={(e) => handleCurrentEntryChange(item.item_id, 'date_recorded', e.target.value)}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                        <input
                          type="number"
                          value={itemState.currentEntry.actual_quantity || ''}
                          onChange={(e) => handleCurrentEntryChange(item.item_id, 'actual_quantity', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
                        <input
                          type="number"
                          step="0.01"
                          value={itemState.currentEntry.actual_unit_price || ''}
                          onChange={(e) => handleCurrentEntryChange(item.item_id, 'actual_unit_price', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Supplier (Optional)</label>
                        <input
                          type="text"
                          value={itemState.currentEntry.supplier || ''}
                          onChange={(e) => handleCurrentEntryChange(item.item_id, 'supplier', e.target.value)}
                          placeholder="Supplier name"
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={() => handleSavePurchase(item.item_id)}
                          disabled={!itemState.currentEntry.actual_quantity || !itemState.currentEntry.actual_unit_price}
                          className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save Purchase
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      Total: {formatCurrency((itemState.currentEntry.actual_quantity || 0) * (itemState.currentEntry.actual_unit_price || 0))}
                    </div>
                  </div>
                )}

                {/* Item Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Total Purchased</p>
                    <p className="text-sm font-medium">{varianceAnalysis.totalQuantityPurchased} / {varianceAnalysis.estimatedQuantity} {item.unit}</p>
                    <p className="text-lg font-semibold text-gray-900">{formatCurrency(varianceAnalysis.totalActual)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Remaining Quantity</p>
                    <p className="text-sm font-medium">{varianceAnalysis.remainingQuantity} {item.unit}</p>
                    <p className="text-lg font-semibold text-gray-900">{formatCurrency(varianceAnalysis.remainingQuantity * item.unit_price)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Avg. Actual Price</p>
                    <p className="text-sm font-medium">vs {formatCurrency(item.unit_price)} est.</p>
                    <p className="text-lg font-semibold text-gray-900">{formatCurrency(varianceAnalysis.weightedAverageActualPrice)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Total Variance</p>
                    <div className={`flex items-center text-lg font-semibold ${
                      varianceAnalysis.totalVariance > 0 ? 'text-red-600' :
                      varianceAnalysis.totalVariance < 0 ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {varianceAnalysis.totalVariance > 0 ? (
                        <TrendingUp className="h-5 w-5 mr-1" />
                      ) : varianceAnalysis.totalVariance < 0 ? (
                        <TrendingDown className="h-5 w-5 mr-1" />
                      ) : (
                        <CheckCircle className="h-5 w-5 mr-1" />
                      )}
                      {formatCurrency(Math.abs(varianceAnalysis.totalVariance))} ({Math.abs(varianceAnalysis.totalVariancePercentage).toFixed(1)}%)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActualDetailEnhanced;