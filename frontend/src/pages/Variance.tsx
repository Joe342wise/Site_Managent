import React, { useState } from 'react';
import { useQuery } from 'react-query';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Calculator,
  Building2,
  Filter,
  Calendar,
  BarChart3
} from 'lucide-react';
import { apiService } from '../services/api';
import { formatCurrency, formatPercentage } from '../utils';
import LoadingSpinner from '../components/LoadingSpinner';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, description, trend }) => (
  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="p-5">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="flex items-center text-lg font-medium text-gray-900">
              {value}
              {trend && (
                <span className="ml-2">
                  {trend === 'up' && <TrendingUp className="h-4 w-4 text-red-500" />}
                  {trend === 'down' && <TrendingDown className="h-4 w-4 text-green-500" />}
                </span>
              )}
            </dd>
            {description && (
              <dd className="text-sm text-gray-500">{description}</dd>
            )}
          </dl>
        </div>
      </div>
    </div>
  </div>
);

const VariancePage: React.FC = () => {
  const [selectedSite, setSelectedSite] = useState<number | ''>('');
  const [selectedEstimate, setSelectedEstimate] = useState<number | ''>('');
  const [varianceThreshold, setVarianceThreshold] = useState(10);

  // Fetch variance analysis
  const { data: varianceData, isLoading: isLoadingVariance } = useQuery(
    ['variance-analysis', selectedSite, selectedEstimate, varianceThreshold],
    () => apiService.getVarianceAnalysis({
      site_id: selectedSite || undefined,
      estimate_id: selectedEstimate || undefined,
      variance_threshold: varianceThreshold
    }),
    {
      refetchInterval: 30000,
    }
  );

  // Fetch site variances
  const { data: siteVariances, isLoading: isLoadingSites } = useQuery(
    ['variance-by-site'],
    () => apiService.getVarianceBySite(),
    {
      refetchInterval: 30000,
    }
  );

  // Fetch category variances
  const { data: categoryVariances, isLoading: isLoadingCategories } = useQuery(
    ['variance-by-category', selectedSite, selectedEstimate],
    () => apiService.getVarianceByCategory({
      site_id: selectedSite || undefined,
      estimate_id: selectedEstimate || undefined
    }),
    {
      refetchInterval: 30000,
    }
  );

  // Fetch sites for filter
  const { data: sitesData } = useQuery(
    ['sites-filter'],
    () => apiService.getSites({ limit: 100 }),
    {
      staleTime: 10 * 60 * 1000,
    }
  );

  // Fetch estimates for selected site
  const { data: estimatesData } = useQuery(
    ['estimates-filter', selectedSite],
    () => selectedSite ? apiService.getEstimates({ site_id: selectedSite, limit: 100 }) : Promise.resolve({ data: [] }),
    {
      enabled: !!selectedSite,
      staleTime: 5 * 60 * 1000,
    }
  );

  if (isLoadingVariance || isLoadingSites || isLoadingCategories) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const summary = varianceData?.summary || {};

  const stats = [
    {
      title: 'Total Estimated Budget',
      value: formatCurrency(summary.total_estimated || 0),
      icon: Calculator,
      color: 'text-blue-600',
      description: `${summary.total_items || 0} budget items`,
    },
    {
      title: 'Total Amount Spent',
      value: formatCurrency(summary.total_actual || 0),
      icon: DollarSign,
      color: 'text-green-600',
      description: `${summary.items_with_actuals || 0} items purchased`,
    },
    {
      title: 'Budget Variance',
      value: formatCurrency(Math.abs(summary.total_variance || 0)),
      icon: TrendingUp,
      color: (summary.total_variance || 0) > 0 ? 'text-red-600' : 'text-green-600',
      description: `${formatPercentage(summary.overall_variance_percentage || 0)} ${(summary.total_variance || 0) > 0 ? 'over budget' : 'under budget'}`,
      trend: (summary.total_variance || 0) > 0 ? 'up' : 'down',
    },
    {
      title: 'Significant Variances',
      value: summary.significant_variances || 0,
      icon: AlertTriangle,
      color: 'text-orange-600',
      description: `>${varianceThreshold}% variance`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Budget vs Actual Analysis</h1>
        <p className="mt-2 text-sm text-gray-700">
          Compare estimated budgets against actual spending to identify variances and trends
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Site Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Building2 className="h-4 w-4 inline mr-1" />
              Site
            </label>
            <select
              value={selectedSite}
              onChange={(e) => {
                setSelectedSite(e.target.value ? parseInt(e.target.value) : '');
                setSelectedEstimate('');
              }}
              className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Sites</option>
              {sitesData?.data?.map((site: any) => (
                <option key={site.site_id} value={site.site_id}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>

          {/* Estimate Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <BarChart3 className="h-4 w-4 inline mr-1" />
              Estimate
            </label>
            <select
              value={selectedEstimate}
              onChange={(e) => setSelectedEstimate(e.target.value ? parseInt(e.target.value) : '')}
              className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              disabled={!selectedSite}
            >
              <option value="">All Estimates</option>
              {estimatesData?.data?.map((estimate: any) => (
                <option key={estimate.estimate_id} value={estimate.estimate_id}>
                  {estimate.title}
                </option>
              ))}
            </select>
          </div>

          {/* Variance Threshold */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Filter className="h-4 w-4 inline mr-1" />
              Variance Threshold (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={varianceThreshold}
              onChange={(e) => setVarianceThreshold(parseInt(e.target.value) || 0)}
              className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Variance by Site */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Variance by Site
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Site
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Budget
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Spent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {siteVariances?.map((site: any) => (
                  <tr key={site.site_id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{site.site_name}</div>
                      <div className="text-sm text-gray-500">{site.site_status}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(site.total_estimated)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(site.total_actual)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${site.variance_percentage > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(Math.abs(site.total_variance))}
                        ({formatPercentage(Math.abs(site.variance_percentage))})
                      </div>
                      <div className="text-xs text-gray-500">
                        {site.variance_percentage > 0 ? 'Over budget' : 'Under budget'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {site.items_with_actuals}/{site.total_items}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Variance by Category */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Variance by Category
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Budget
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Spent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categoryVariances?.map((category: any) => (
                  <tr key={category.category_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {category.category_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(category.total_estimated)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(category.total_actual)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${category.variance_percentage > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(Math.abs(category.total_variance))}
                        ({formatPercentage(Math.abs(category.variance_percentage))})
                      </div>
                      <div className="text-xs text-gray-500">
                        {category.variance_percentage > 0 ? 'Over budget' : 'Under budget'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category.items_with_actuals}/{category.total_items}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VariancePage;