import React from 'react';
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
  XCircle
} from 'lucide-react';
import { apiService } from '../services/api';
import { VarianceAnalysis } from '../types';
import { formatCurrency, formatDate } from '../utils';
import LoadingSpinner from '../components/LoadingSpinner';

interface VarianceItemProps {
  item: VarianceAnalysis;
  onEnterPurchases: () => void;
}

const VarianceItem: React.FC<VarianceItemProps> = ({ item, onEnterPurchases }) => {
  const estimated = parseFloat(String(item.total_estimated || 0));
  const actual = parseFloat(String(item.total_actual || 0));
  const variance = actual - estimated;
  const variancePercentage = estimated > 0 ? (variance / estimated) * 100 : 0;
  const hasActual = item.variance_status !== 'no_actual';

  const getVarianceColor = () => {
    if (!hasActual) return 'text-gray-600';
    if (Math.abs(variancePercentage) < 1) return 'text-gray-600';
    return variance > 0 ? 'text-red-600' : 'text-green-600';
  };

  const getVarianceIcon = () => {
    if (!hasActual) return <Package className="h-4 w-4" />;
    if (Math.abs(variancePercentage) < 1) return <CheckCircle className="h-4 w-4" />;
    return variance > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
  };

  const getStatusBadge = () => {
    if (!hasActual) {
      return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800">
          <XCircle className="h-3 w-3 mr-1" />
          No Purchase Data
        </span>
      );
    }

    if (Math.abs(variancePercentage) < 1) {
      return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          On Budget
        </span>
      );
    }

    if (variance > 0) {
      return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800">
          <TrendingUp className="h-3 w-3 mr-1" />
          Over Budget
        </span>
      );
    }

    return (
      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
        <TrendingDown className="h-3 w-3 mr-1" />
        Under Budget
      </span>
    );
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h4 className="text-lg font-medium text-gray-900">
              {item.item_description}
            </h4>
            <p className="text-sm text-gray-500 mt-1">{item.category_name}</p>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge()}
            {!hasActual && (
              <button
                onClick={onEnterPurchases}
                className="inline-flex items-center rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700"
              >
                <ShoppingCart className="h-3 w-3 mr-1" />
                Enter Purchase
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Estimated */}
          <div>
            <div className="text-sm font-medium text-gray-500">Estimated</div>
            <div className="text-lg font-semibold text-gray-900">
              {formatCurrency(estimated)}
            </div>
            <div className="text-sm text-gray-500">
              {item.estimated_quantity} {item.unit} @ {formatCurrency(item.estimated_unit_price)}
            </div>
          </div>

          {/* Actual */}
          <div>
            <div className="text-sm font-medium text-gray-500">Actual</div>
            <div className="text-lg font-semibold text-gray-900">
              {hasActual ? formatCurrency(actual) : '—'}
            </div>
            {hasActual && (
              <div className="text-sm text-gray-500">
                {item.actual_quantity} {item.unit} @ {formatCurrency(item.actual_unit_price)}
              </div>
            )}
            {!hasActual && (
              <div className="text-sm text-gray-500">No purchase recorded</div>
            )}
          </div>

          {/* Variance */}
          <div>
            <div className="text-sm font-medium text-gray-500">Variance</div>
            <div className={`text-lg font-semibold flex items-center ${getVarianceColor()}`}>
              {getVarianceIcon()}
              <span className="ml-1">
                {hasActual ? formatCurrency(Math.abs(variance)) : '—'}
              </span>
            </div>
            {hasActual && (
              <div className={`text-sm ${getVarianceColor()}`}>
                {variance >= 0 ? '+' : ''}{variancePercentage.toFixed(1)}%
              </div>
            )}
          </div>

          {/* Date Recorded */}
          <div>
            <div className="text-sm font-medium text-gray-500">Date Recorded</div>
            <div className="text-sm text-gray-900">
              {item.date_recorded ? formatDate(item.date_recorded) : '—'}
            </div>
            {hasActual && (
              <div className="text-xs text-gray-500">Purchase entered</div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {hasActual && estimated > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-500">Actual vs Estimated</span>
              <span className={getVarianceColor()}>
                {((actual / estimated) * 100).toFixed(1)}% of budget
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full w-[${Math.min((actual / estimated) * 100, 100)}%] ${
                  variance > 0 ? 'bg-red-500' : variance < 0 ? 'bg-green-500' : 'bg-gray-500'
                }`}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const VarianceDetailPage: React.FC = () => {
  const { estimateId } = useParams<{ estimateId: string }>();
  const navigate = useNavigate();

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

  // Fetch variance analysis for this estimate
  const { data: varianceData, isLoading: varianceLoading } = useQuery(
    ['variance-analysis', estimateId],
    () => estimateId ? apiService.getVarianceAnalysis({ estimate_id: parseInt(estimateId) }) : null,
    {
      enabled: !!estimateId,
      refetchInterval: 5 * 60 * 1000, // 5 minutes
      staleTime: 3 * 60 * 1000, // 3 minutes
      refetchOnWindowFocus: false
    }
  );

  const isLoading = estimateLoading || varianceLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!estimateData || !varianceData) {
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
              onClick={() => navigate('/variance')}
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

  const estimate = estimateData; // getEstimateById returns the estimate directly
  const items = varianceData?.variance_analysis || [];
  const summary = varianceData?.summary || {};

  const handleEnterPurchases = () => {
    navigate(`/actuals/${estimateId}`);
  };

  const handleBackToVariance = () => {
    navigate('/variance');
  };

  const totalVariance = summary.total_actual - summary.total_estimated;
  const overallPercentage = summary.total_estimated > 0 ? (totalVariance / summary.total_estimated) * 100 : 0;

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
            Detailed comparison of estimated vs actual costs for each item
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
                  {formatCurrency(summary.total_estimated || 0)}
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
                  {formatCurrency(summary.total_actual || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <TrendingUp className={`h-6 w-6 ${totalVariance > 0 ? 'text-red-600' : 'text-green-600'}`} />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Variance</p>
                <p className={`text-lg font-semibold ${totalVariance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(Math.abs(totalVariance))} ({Math.abs(overallPercentage).toFixed(1)}%)
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
                <p className="text-sm font-medium text-gray-500">Progress</p>
                <p className="text-lg font-semibold text-gray-900">
                  {summary.items_with_actuals || 0}/{summary.total_items || 0} items
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Item-by-Item Analysis</h3>
        {items.length > 0 ? (
          <div className="space-y-4">
            {items.map((item: VarianceAnalysis, index: number) => (
              <VarianceItem
                key={`${item.item_id}-${index}`}
                item={item}
                onEnterPurchases={handleEnterPurchases}
              />
            ))}
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