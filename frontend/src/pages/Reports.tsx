import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  FileBarChart,
  Download,
  FileText,
  Building2,
  BarChart3,
  Calendar,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  Loader
} from 'lucide-react';
import { apiService } from '../services/api';
import { formatBytes, formatDatetime } from '../utils';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-hot-toast';

interface ReportGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: 'estimate' | 'variance' | 'site';
  onGenerate: (data: any) => void;
  isLoading?: boolean;
}

const ReportGenerationModal: React.FC<ReportGenerationModalProps> = ({
  isOpen,
  onClose,
  reportType,
  onGenerate,
  isLoading = false,
}) => {
  const [selectedSite, setSelectedSite] = useState<number | ''>('');
  const [selectedEstimate, setSelectedEstimate] = useState<number | ''>('');
  const [filename, setFilename] = useState('');

  // Fetch sites for selection
  const { data: sitesData } = useQuery(
    ['sites-modal'],
    () => apiService.getSites({ limit: 100 }),
    {
      enabled: isOpen,
      staleTime: 10 * 60 * 1000,
    }
  );

  // Fetch estimates for selected site
  const { data: estimatesData } = useQuery(
    ['estimates-modal', selectedSite],
    () => selectedSite ? apiService.getEstimates({ site_id: selectedSite, limit: 100 }) : Promise.resolve({ data: [] }),
    {
      enabled: isOpen && !!selectedSite,
      staleTime: 5 * 60 * 1000,
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (reportType === 'estimate' && !selectedEstimate) {
      toast.error('Please select an estimate');
      return;
    }
    if ((reportType === 'variance' || reportType === 'site') && !selectedSite) {
      toast.error('Please select a site');
      return;
    }

    const data = {
      site_id: selectedSite || undefined,
      estimate_id: selectedEstimate || undefined,
      filename: filename.trim() || undefined
    };

    onGenerate(data);
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
                  Generate {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {/* Site Selection */}
                {(reportType === 'variance' || reportType === 'site' || reportType === 'estimate') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Building2 className="h-4 w-4 inline mr-1" />
                      Site *
                    </label>
                    <select
                      value={selectedSite}
                      onChange={(e) => {
                        setSelectedSite(e.target.value ? parseInt(e.target.value) : '');
                        if (reportType === 'estimate') setSelectedEstimate('');
                      }}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required={reportType === 'variance' || reportType === 'site'}
                      disabled={isLoading}
                    >
                      <option value="">Select a site...</option>
                      {sitesData?.data?.map((site: any) => (
                        <option key={site.site_id} value={site.site_id}>
                          {site.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Estimate Selection */}
                {reportType === 'estimate' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <BarChart3 className="h-4 w-4 inline mr-1" />
                      Estimate *
                    </label>
                    <select
                      value={selectedEstimate}
                      onChange={(e) => setSelectedEstimate(e.target.value ? parseInt(e.target.value) : '')}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                      disabled={isLoading || !selectedSite}
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

                {/* Custom Filename */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FileText className="h-4 w-4 inline mr-1" />
                    Custom Filename (optional)
                  </label>
                  <input
                    type="text"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Leave empty for auto-generated name"
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
                {isLoading ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Generate Report
                  </>
                )}
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

const ReportsPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [currentReportType, setCurrentReportType] = useState<'estimate' | 'variance' | 'site'>('estimate');
  const queryClient = useQueryClient();

  // Fetch report history
  const { data: reportsData, isLoading: isLoadingReports } = useQuery(
    ['reports-list'],
    () => apiService.getReportsList(),
    {
      refetchInterval: 30000,
    }
  );

  // Generate report mutations
  const generateEstimateReportMutation = useMutation(
    (data: any) => apiService.generateEstimateReport(data.estimate_id, {
      download: true,
      filename: data.filename
    }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['reports-list']);
        setShowModal(false);
        toast.success('Estimate report generated successfully');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to generate estimate report');
      }
    }
  );

  const generateVarianceReportMutation = useMutation(
    (data: any) => apiService.generateVarianceReport(data.site_id, {
      download: true,
      filename: data.filename
    }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['reports-list']);
        setShowModal(false);
        toast.success('Variance report generated successfully');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to generate variance report');
      }
    }
  );

  const generateSiteReportMutation = useMutation(
    (data: any) => apiService.generateSiteReport(data.site_id, {
      download: true,
      filename: data.filename
    }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['reports-list']);
        setShowModal(false);
        toast.success('Site report generated successfully');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to generate site report');
      }
    }
  );

  const cleanupReportsMutation = useMutation(
    () => apiService.cleanupReports(),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['reports-list']);
        toast.success('Old reports cleaned up successfully');
      },
      onError: (error: any) => {
        toast.error('Failed to cleanup reports');
      }
    }
  );

  const handleGenerateReport = (reportType: 'estimate' | 'variance' | 'site') => {
    setCurrentReportType(reportType);
    setShowModal(true);
  };

  const handleReportGeneration = (data: any) => {
    switch (currentReportType) {
      case 'estimate':
        generateEstimateReportMutation.mutate(data);
        break;
      case 'variance':
        generateVarianceReportMutation.mutate(data);
        break;
      case 'site':
        generateSiteReportMutation.mutate(data);
        break;
    }
  };

  const handleDownload = (filename: string) => {
    window.open(`/api/reports/download/${filename}`, '_blank');
  };

  const isGenerating = generateEstimateReportMutation.isLoading ||
                     generateVarianceReportMutation.isLoading ||
                     generateSiteReportMutation.isLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PDF Report Generation</h1>
          <p className="mt-2 text-sm text-gray-700">
            Generate and download professional PDF reports with company branding
          </p>
        </div>
        <button
          onClick={() => cleanupReportsMutation.mutate()}
          disabled={cleanupReportsMutation.isLoading}
          className="inline-flex items-center rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Cleanup Old Reports
        </button>
      </div>

      {/* Report Types Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <h3 className="text-lg font-medium text-gray-900">Estimate Reports</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Generate detailed PDF reports for project estimates with itemized breakdowns
                </p>
              </div>
            </div>
            <div className="mt-5">
              <button
                type="button"
                onClick={() => handleGenerateReport('estimate')}
                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
              >
                <Download className="h-4 w-4 mr-2" />
                Generate Estimate Report
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileBarChart className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <h3 className="text-lg font-medium text-gray-900">Variance Reports</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Generate budget vs actual variance analysis reports for sites
                </p>
              </div>
            </div>
            <div className="mt-5">
              <button
                type="button"
                onClick={() => handleGenerateReport('variance')}
                className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
              >
                <Download className="h-4 w-4 mr-2" />
                Generate Variance Report
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Building2 className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <h3 className="text-lg font-medium text-gray-900">Site Reports</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Generate comprehensive site summary reports with estimates and actuals
                </p>
              </div>
            </div>
            <div className="mt-5">
              <button
                type="button"
                onClick={() => handleGenerateReport('site')}
                className="inline-flex items-center rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-500"
              >
                <Download className="h-4 w-4 mr-2" />
                Generate Site Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report History */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recent Reports
          </h3>

          {isLoadingReports ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="md" />
            </div>
          ) : reportsData?.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No reports yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Generate your first report using the buttons above
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Report
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportsData?.map((report: any) => (
                    <tr key={report.filename}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-gray-400 mr-2" />
                          <div className="text-sm font-medium text-gray-900">
                            {report.filename}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatBytes(report.size)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDatetime(report.created)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDownload(report.filename)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Report Generation Modal */}
      <ReportGenerationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        reportType={currentReportType}
        onGenerate={handleReportGeneration}
        isLoading={isGenerating}
      />
    </div>
  );
};

export default ReportsPage;