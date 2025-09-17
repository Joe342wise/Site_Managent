import React from 'react';
import { FileBarChart, Download, FileText } from 'lucide-react';

const ReportsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="mt-2 text-sm text-gray-700">
          Generate and download professional PDF reports
        </p>
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
                  Generate detailed PDF reports for project estimates
                </p>
              </div>
            </div>
            <div className="mt-5">
              <button
                type="button"
                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
              >
                <Download className="h-4 w-4 mr-2" />
                Generate
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
                  Generate variance analysis reports for sites
                </p>
              </div>
            </div>
            <div className="mt-5">
              <button
                type="button"
                className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
              >
                <Download className="h-4 w-4 mr-2" />
                Generate
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <h3 className="text-lg font-medium text-gray-900">Site Reports</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Generate comprehensive site summary reports
                </p>
              </div>
            </div>
            <div className="mt-5">
              <button
                type="button"
                className="inline-flex items-center rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-500"
              >
                <Download className="h-4 w-4 mr-2" />
                Generate
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Placeholder Content */}
      <div className="text-center py-12">
        <FileBarChart className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">PDF Report Generation</h3>
        <p className="mt-1 text-sm text-gray-500">
          This page will contain the report generation interface including:
        </p>
        <ul className="mt-4 text-sm text-gray-500 space-y-1">
          <li>• Estimate reports with company branding</li>
          <li>• Variance analysis reports</li>
          <li>• Site summary reports</li>
          <li>• Custom report filters</li>
          <li>• Report history and downloads</li>
        </ul>
      </div>
    </div>
  );
};

export default ReportsPage;