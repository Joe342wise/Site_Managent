import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
  ArrowLeft,
  Building,
  FileText,
  Calendar,
  User,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Package,
  BarChart3,
  ShoppingCart,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  History
} from 'lucide-react';
import { apiService } from '../services/api';
import { EstimateItem, Actual } from '../types';
import { formatCurrency, formatDate } from '../utils';
import LoadingSpinner from '../components/LoadingSpinner';
import CategoryFilter from '../components/CategoryFilter';

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
  hasActuals: boolean;
}

interface ItemState {
  item_id: number;
  purchaseHistory: Actual[];
  showHistory: boolean;
}

const VarianceDetailPage: React.FC = () => {
  const { estimateId } = useParams<{ estimateId: string }>();
  const navigate = useNavigate();
  const [itemStates, setItemStates] = useState<Record<number, ItemState>>({});
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);

  // Fetch estimate details
  const { data: estimateData, isLoading: estimateLoading } = useQuery(
    ['estimate-details', estimateId],
    () => estimateId ? apiService.getEstimateById(parseInt(estimateId)) : null,
    {
      enabled: !!estimateId,
      refetchInterval: 5 * 60 * 1000, // 5 minutes
      staleTime: 3 * 60 * 1000, // 3 minutes
      refetchOnWindowFocus: false
    }
  );

  // Fetch estimate items
  const { data: itemsData, isLoading: isLoadingItems } = useQuery(
    ['estimate-items-for-variance', estimateId],
    () => apiService.getEstimateItems(parseInt(estimateId!)),
    {
      enabled: !!estimateId,
    }
  );

  // Fetch existing actuals for this estimate
  const { data: existingActualsData, isLoading: isLoadingActuals } = useQuery(
    ['existing-actuals-variance', estimateId],
    () => apiService.getActuals({ estimate_id: parseInt(estimateId!) }),
    {
      enabled: !!estimateId,
    }
  );

  // Populate local state with existing actuals grouped by item
  useEffect(() => {
    if (existingActualsData?.data && itemsData?.items) {
      const newItemStates: Record<number, ItemState> = {};

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
          purchaseHistory: actualsByItem[item.item_id] || [],
          showHistory: false
        };
      });

      setItemStates(newItemStates);
    }
  }, [existingActualsData, itemsData]);

  const toggleHistoryVisibility = (itemId: number) => {
    setItemStates(prev => {
      const currentState = prev[itemId];
      if (!currentState) return prev;

      return {
        ...prev,
        [itemId]: {
          ...currentState,
          showHistory: !currentState.showHistory
        }
      };
    });
  };

  // Calculate variance analysis for an item (same logic as ActualDetail)
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
        weightedAverageActualPrice: 0,
        hasActuals: false
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
        batchIndex: index + 1, // Use array index as batch number
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
      weightedAverageActualPrice,
      hasActuals: true
    };
  };

  // Calculate project totals
  const getProjectTotals = () => {
    if (!itemsData?.items) return { totalEstimated: 0, totalActual: 0, totalVariance: 0, overallPercentage: 0 };

    const totals = itemsData.items.reduce((acc, item: EstimateItem) => {
      const itemState = itemStates[item.item_id];
      const analysis = getItemVarianceAnalysis(item, itemState?.purchaseHistory || []);

      return {
        totalEstimated: acc.totalEstimated + analysis.totalEstimated,
        totalActual: acc.totalActual + analysis.totalActual
      };
    }, { totalEstimated: 0, totalActual: 0 });

    const totalVariance = totals.totalActual - totals.totalEstimated;
    const overallPercentage = totals.totalEstimated > 0 ? (totalVariance / totals.totalEstimated) * 100 : 0;

    return { ...totals, totalVariance, overallPercentage };
  };

  const handleEnterPurchases = () => {
    navigate(`/actuals/${estimateId}`);
  };

  const handleBackToVariance = () => {
    navigate('/variance');
  };

  const isLoading = estimateLoading || isLoadingItems || isLoadingActuals;

  if (isLoading) {
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
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Estimate not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The estimate you're looking for doesn't exist or has been removed.
          </p>
          <div className="mt-6">
            <button
              onClick={handleBackToVariance}
              className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Variance Analysis
            </button>
          </div>
        </div>
      </div>
    );
  }

  const estimate = estimateData;
  const allItems = itemsData.items || [];

  // Filter items by selected categories (client-side)
  const items = selectedCategories.length > 0
    ? allItems.filter(item => selectedCategories.includes(item.category_id))
    : allItems;
  const projectTotals = getProjectTotals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:flex-auto">
          <div className="flex items-center space-x-2 mb-2">
            <button
              onClick={handleBackToVariance}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Variance Analysis
            </button>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Variance Analysis: {estimate.title}
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Detailed comparison of estimated vs actual costs for each item with batch-level tracking
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={handleEnterPurchases}
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Enter Purchases
          </button>
        </div>
      </div>

      {/* Estimate Overview */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Estimate Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center">
              <Building className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <div className="text-sm font-medium text-gray-500">Site</div>
                <div className="text-sm text-gray-900">{estimate.site_name}</div>
              </div>
            </div>
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <div className="text-sm font-medium text-gray-500">Created</div>
                <div className="text-sm text-gray-900">{formatDate(estimate.date_created)}</div>
              </div>
            </div>
            <div className="flex items-center">
              <User className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <div className="text-sm font-medium text-gray-500">Created By</div>
                <div className="text-sm text-gray-900">{estimate.created_by_username || 'Unknown'}</div>
              </div>
            </div>
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <div className="text-sm font-medium text-gray-500">Version</div>
                <div className="text-sm text-gray-900">{estimate.version}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <DollarSign className="h-6 w-6 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Estimated</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(projectTotals.totalEstimated)}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <DollarSign className="h-6 w-6 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Actual</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(projectTotals.totalActual)}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <TrendingUp className={`h-6 w-6 ${projectTotals.totalVariance > 0 ? 'text-red-600' : 'text-green-600'}`} />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Variance</p>
                <p className={`text-lg font-semibold ${projectTotals.totalVariance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(Math.abs(projectTotals.totalVariance))} ({Math.abs(projectTotals.overallPercentage).toFixed(1)}%)
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <Package className="h-6 w-6 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Items with Purchases</p>
                <p className="text-lg font-semibold text-gray-900">
                  {Object.values(itemStates).filter(state => state.purchaseHistory.length > 0).length}/{items.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white shadow px-4 py-3 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <CategoryFilter
              selectedCategories={selectedCategories}
              onCategoryChange={setSelectedCategories}
              multiple={true}
              placeholder="All Categories"
            />
            {selectedCategories.length > 0 && (
              <span className="text-sm text-gray-600">
                Showing {items.length} of {allItems.length} items
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Items List with Variance Analysis */}
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Item-by-Item Variance Analysis</h3>
        {items.length > 0 ? (
          <div className="space-y-8">
            {items.map((item: EstimateItem) => {
              const itemState = itemStates[item.item_id];
              const varianceAnalysis = getItemVarianceAnalysis(item, itemState?.purchaseHistory || []);

              return (
                <div key={item.item_id} className={`bg-white shadow-md rounded-lg border-l-4 hover:shadow-lg transition-shadow ${
                  item.category_name === 'Material' ? 'border-l-blue-500' :
                  item.category_name === 'Labor' ? 'border-l-green-500' :
                  item.category_name === 'Masonry' ? 'border-l-orange-500' :
                  item.category_name === 'Steel Works' ? 'border-l-gray-500' :
                  item.category_name === 'Roofing' ? 'border-l-red-500' :
                  item.category_name === 'Plumbing' ? 'border-l-indigo-500' :
                  item.category_name === 'Electrical' ? 'border-l-yellow-500' :
                  item.category_name === 'Flooring' ? 'border-l-purple-500' :
                  item.category_name === 'Painting' ? 'border-l-pink-500' :
                  item.category_name === 'Landscaping' ? 'border-l-emerald-500' :
                  item.category_name === 'HVAC' ? 'border-l-cyan-500' :
                  item.category_name === 'Miscellaneous' ? 'border-l-slate-500' :
                  'border-l-gray-400'
                }`}>
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {/* Category Icon Badge */}
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                          item.category_name === 'Material' ? 'bg-blue-500' :
                          item.category_name === 'Labor' ? 'bg-green-500' :
                          item.category_name === 'Masonry' ? 'bg-orange-500' :
                          item.category_name === 'Steel Works' ? 'bg-gray-500' :
                          item.category_name === 'Roofing' ? 'bg-red-500' :
                          item.category_name === 'Plumbing' ? 'bg-indigo-500' :
                          item.category_name === 'Electrical' ? 'bg-yellow-500' :
                          item.category_name === 'Flooring' ? 'bg-purple-500' :
                          item.category_name === 'Painting' ? 'bg-pink-500' :
                          item.category_name === 'Landscaping' ? 'bg-emerald-500' :
                          item.category_name === 'HVAC' ? 'bg-cyan-500' :
                          item.category_name === 'Miscellaneous' ? 'bg-slate-500' :
                          'bg-gray-400'
                        }`}>
                          {item.category_name?.charAt(0) || 'I'}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{item.description}</h3>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              item.category_name === 'Material' ? 'bg-blue-100 text-blue-800' :
                              item.category_name === 'Labor' ? 'bg-green-100 text-green-800' :
                              item.category_name === 'Masonry' ? 'bg-orange-100 text-orange-800' :
                              item.category_name === 'Steel Works' ? 'bg-gray-100 text-gray-800' :
                              item.category_name === 'Roofing' ? 'bg-red-100 text-red-800' :
                              item.category_name === 'Plumbing' ? 'bg-indigo-100 text-indigo-800' :
                              item.category_name === 'Electrical' ? 'bg-yellow-100 text-yellow-800' :
                              item.category_name === 'Flooring' ? 'bg-purple-100 text-purple-800' :
                              item.category_name === 'Painting' ? 'bg-pink-100 text-pink-800' :
                              item.category_name === 'Landscaping' ? 'bg-emerald-100 text-emerald-800' :
                              item.category_name === 'HVAC' ? 'bg-cyan-100 text-cyan-800' :
                              item.category_name === 'Miscellaneous' ? 'bg-slate-100 text-slate-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {item.category_name}
                            </span>
                            {/* Variance Status Badge */}
                            {varianceAnalysis.hasActuals ? (
                              <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                                varianceAnalysis.totalVariance > 0 ? 'bg-red-100 text-red-800' :
                                varianceAnalysis.totalVariance < 0 ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {varianceAnalysis.totalVariance > 0 ? (
                                  <TrendingUp className="w-3 h-3 mr-1" />
                                ) : varianceAnalysis.totalVariance < 0 ? (
                                  <TrendingDown className="w-3 h-3 mr-1" />
                                ) : (
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                )}
                                {varianceAnalysis.totalVariance > 0 ? 'Over Budget' :
                                 varianceAnalysis.totalVariance < 0 ? 'Under Budget' : 'On Budget'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                <XCircle className="w-3 h-3 mr-1" />
                                No Purchases
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-500">Estimated</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {item.quantity} {item.unit} × {formatCurrency(item.unit_price)} = {formatCurrency(varianceAnalysis.totalEstimated)}
                          </p>
                        </div>
                        {!varianceAnalysis.hasActuals && (
                          <button
                            onClick={handleEnterPurchases}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                          >
                            <ShoppingCart className="h-4 w-4 mr-1" />
                            Enter Purchases
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-4">
                    {/* Purchase History */}
                    {varianceAnalysis.batchVariances.length > 0 && (
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <History className="h-4 w-4 text-gray-500" />
                            <h4 className="text-md font-medium text-gray-900">
                              Purchase History ({varianceAnalysis.batchVariances.length} {varianceAnalysis.batchVariances.length === 1 ? 'batch' : 'batches'})
                            </h4>
                          </div>
                          <button
                            onClick={() => toggleHistoryVisibility(item.item_id)}
                            className="inline-flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
                          >
                            {itemState?.showHistory ? (
                              <>
                                <ChevronUp className="h-4 w-4 mr-1" />
                                Hide History
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-4 w-4 mr-1" />
                                Show History
                              </>
                            )}
                          </button>
                        </div>

                        {/* Collapsed Summary */}
                        {!itemState?.showHistory && (
                          <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-purple-500">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Total Batches:</span>
                                <span className="font-medium ml-2">{varianceAnalysis.batchVariances.length}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Avg. Price:</span>
                                <span className="font-medium ml-2">{formatCurrency(varianceAnalysis.weightedAverageActualPrice)}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Total Variance:</span>
                                <span className={`font-medium ml-2 ${
                                  varianceAnalysis.totalVariance > 0 ? 'text-red-600' :
                                  varianceAnalysis.totalVariance < 0 ? 'text-green-600' : 'text-gray-600'
                                }`}>
                                  {formatCurrency(Math.abs(varianceAnalysis.totalVariance))} ({Math.abs(varianceAnalysis.totalVariancePercentage).toFixed(1)}%)
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Expanded History */}
                        {itemState?.showHistory && (
                          <div className="space-y-3">
                            {itemState.purchaseHistory.map((purchase, index) => {
                              const batchVariance = varianceAnalysis.batchVariances[index];
                              return (
                                <div key={purchase.actual_id} className="bg-gray-50 rounded-lg p-4">
                                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                                    <div>
                                      <p className="text-xs text-gray-500">Batch #{batchVariance.batchIndex}</p>
                                      <p className="text-sm font-medium">{formatDate(purchase.date_recorded)}</p>
                                      {purchase.notes && (
                                        <p className="text-xs text-gray-500">Supplier: {purchase.notes}</p>
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
                        )}
                      </div>
                    )}

                    {/* No Purchases State */}
                    {!varianceAnalysis.hasActuals && (
                      <div className="text-center py-8 bg-yellow-50 rounded-lg border border-yellow-200">
                        <XCircle className="mx-auto h-12 w-12 text-yellow-500" />
                        <h3 className="mt-2 text-sm font-medium text-yellow-900">No Purchase Data</h3>
                        <p className="mt-1 text-sm text-yellow-700">
                          No purchases have been recorded for this item yet.
                        </p>
                        <div className="mt-4">
                          <button
                            onClick={handleEnterPurchases}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-yellow-900 bg-yellow-100 hover:bg-yellow-200"
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Enter Purchases
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Item Summary */}
                    {varianceAnalysis.hasActuals && (
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
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <BarChart3 className="h-12 w-12" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No items found</h3>
            <p className="mt-1 text-sm text-gray-500">
              This estimate doesn't have any items yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VarianceDetailPage;