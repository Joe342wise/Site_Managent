import React from 'react';
import { Calculator, Plus } from 'lucide-react';

const ActualsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Actual Costs</h1>
          <p className="mt-2 text-sm text-gray-700">
            Track and record actual expenses against estimates
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            className="block rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            <Plus className="h-4 w-4 inline mr-2" />
            Record Actual
          </button>
        </div>
      </div>

      {/* Placeholder Content */}
      <div className="text-center py-12">
        <Calculator className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Actual Cost Tracking</h3>
        <p className="mt-1 text-sm text-gray-500">
          This page will contain the actual cost tracking interface including:
        </p>
        <ul className="mt-4 text-sm text-gray-500 space-y-1">
          <li>• List of all recorded actual costs</li>
          <li>• Record new actual expenses</li>
          <li>• Edit existing actual costs</li>
          <li>• Compare actuals vs estimates</li>
          <li>• Variance calculations</li>
        </ul>
      </div>
    </div>
  );
};

export default ActualsPage;