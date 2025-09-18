import React from 'react';
import { Building2, FileText, Calculator, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { useQuery } from 'react-query';
import { apiService } from '../services/api';
import { formatCurrency, formatPercentage, getVarianceColor } from '../utils';
import LoadingSpinner from '../components/LoadingSpinner';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  description?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, description }) => (
  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="p-5">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="text-lg font-medium text-gray-900">{value}</dd>
            {description && (
              <dd className="text-sm text-gray-500">{description}</dd>
            )}
          </dl>
        </div>
      </div>
    </div>
  </div>
);

const DashboardPage: React.FC = () => {
  const { data: dashboardStats, isLoading: statsLoading } = useQuery(
    'dashboardStats',
    () => apiService.getDashboardStats(),
    { refetchInterval: 30000 }
  );

  const { data: recentVariances, isLoading: variancesLoading } = useQuery(
    'recentVariances',
    () => apiService.getTopVariances({ limit: 5 }),
    { refetchInterval: 30000 }
  );

  const { data: alerts, isLoading: alertsLoading } = useQuery(
    'varianceAlerts',
    () => apiService.getVarianceAlerts({ threshold: 10 }),
    { refetchInterval: 30000 }
  );

  if (statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Sites',
      value: dashboardStats?.total_sites || 0,
      icon: Building2,
      color: 'text-blue-600',
      description: `${dashboardStats?.active_sites || 0} active`,
    },
    {
      title: 'Total Estimates',
      value: dashboardStats?.total_estimates || 0,
      icon: FileText,
      color: 'text-green-600',
      description: `${dashboardStats?.pending_estimates || 0} pending`,
    },
    {
      title: 'Estimated Value',
      value: formatCurrency(dashboardStats?.total_estimated_value || 0),
      icon: Calculator,
      color: 'text-purple-600',
    },
    {
      title: 'Purchased Value',
      value: formatCurrency(dashboardStats?.total_purchased_value || 0),
      icon: TrendingUp,
      color: 'text-orange-600',
      description: `vs ${formatCurrency(dashboardStats?.total_estimated_value || 0)} budgeted`,
    },
    {
      title: 'Budget Variance',
      value: formatPercentage(dashboardStats?.overall_variance_percentage || 0),
      icon: TrendingUp,
      color: dashboardStats?.overall_variance_percentage > 0 ? 'text-red-600' : 'text-green-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your construction projects and financial performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Alerts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Variance Alerts */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
              Budget Alerts
            </h3>
            <div className="mt-4">
              {alertsLoading ? (
                <LoadingSpinner />
              ) : alerts?.variance_alerts?.length > 0 ? (
                <div className="space-y-3">
                  {alerts.variance_alerts.slice(0, 5).map((alert: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-md">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {alert.item_description}
                        </p>
                        <p className="text-sm text-gray-500">
                          {alert.site_name} • {alert.category_name}
                        </p>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getVarianceColor(alert.variance_percentage)}`}>
                          {formatPercentage(alert.variance_percentage)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No alerts</h3>
                  <p className="mt-1 text-sm text-gray-500">All projects are within budget variance thresholds.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Variances */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
              <TrendingUp className="h-5 w-5 text-blue-500 mr-2" />
              Recent Variances
            </h3>
            <div className="mt-4">
              {variancesLoading ? (
                <LoadingSpinner />
              ) : recentVariances?.length > 0 ? (
                <div className="space-y-3">
                  {recentVariances.slice(0, 5).map((variance: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {variance.item_description}
                        </p>
                        <p className="text-sm text-gray-500">
                          {variance.site_name}
                        </p>
                      </div>
                      <div className="ml-4 flex-shrink-0 text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(variance.variance_amount)}
                        </p>
                        <p className={`text-sm ${variance.variance_amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatPercentage(variance.variance_percentage)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Calculator className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No variances</h3>
                  <p className="mt-1 text-sm text-gray-500">No actual costs have been recorded yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <a
              href="/sites"
              className="group block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
            >
              <Building2 className="h-8 w-8 text-blue-600 mb-2" />
              <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600">Manage Sites</h4>
              <p className="text-sm text-gray-500">Add or edit construction sites</p>
            </a>
            <a
              href="/estimates"
              className="group block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
            >
              <FileText className="h-8 w-8 text-green-600 mb-2" />
              <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600">Create Estimate</h4>
              <p className="text-sm text-gray-500">Create project estimates</p>
            </a>
            <a
              href="/actuals"
              className="group block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
            >
              <Calculator className="h-8 w-8 text-purple-600 mb-2" />
              <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600">Record Costs</h4>
              <p className="text-sm text-gray-500">Track actual expenses</p>
            </a>
            <a
              href="/reports"
              className="group block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
            >
              <FileText className="h-8 w-8 text-orange-600 mb-2" />
              <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600">Generate Reports</h4>
              <p className="text-sm text-gray-500">Create PDF reports</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;