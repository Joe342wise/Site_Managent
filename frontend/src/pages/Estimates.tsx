import React from 'react';
import { FileText, Plus } from 'lucide-react';

const EstimatesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Project Estimates</h1>
          <p className="mt-2 text-sm text-gray-700">
            Create and manage detailed project estimates
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            className="block rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            <Plus className="h-4 w-4 inline mr-2" />
            New Estimate
          </button>
        </div>
      </div>

      {/* Placeholder Content */}
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Estimates Management</h3>
        <p className="mt-1 text-sm text-gray-500">
          This page will contain the estimates management interface including:
        </p>
        <ul className="mt-4 text-sm text-gray-500 space-y-1">
          <li>• List of all project estimates</li>
          <li>• Create new estimates for sites</li>
          <li>• Edit existing estimates</li>
          <li>• View estimate details and items</li>
          <li>• Estimate status management</li>
        </ul>
      </div>
    </div>
  );
};

export default EstimatesPage;