import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Package,
  Calculator,
  Building,
  User,
  Calendar,
  FileText,
  Tag
} from 'lucide-react';
import { apiService } from '../services/api';
import { Estimate, EstimateItem, CreateEstimateItemRequest, Category } from '../types';
import { formatCurrency, formatDate, getStatusColor } from '../utils';
import LoadingSpinner from '../components/LoadingSpinner';
import EstimateItemModal from '../components/EstimateItemModal';
import toast from 'react-hot-toast';

const EstimateDetails: React.FC = () => {
  const { estimateId } = useParams<{ estimateId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<EstimateItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const { data: estimate, isLoading: estimateLoading } = useQuery(
    ['estimate', estimateId],
    () => apiService.getEstimateById(parseInt(estimateId!)),
    {
      enabled: !!estimateId,
    }
  );

  const { data: itemsData, isLoading: itemsLoading } = useQuery(
    ['estimate-items', estimateId, selectedCategory],
    () => apiService.getEstimateItems(parseInt(estimateId!), {
      category_id: selectedCategory ? parseInt(selectedCategory) : undefined
    }),
    {
      enabled: !!estimateId,
      refetchInterval: 30000,
    }
  );

  const { data: categories } = useQuery(
    ['categories'],
    () => apiService.getCategories(),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  const createItemMutation = useMutation(
    (data: CreateEstimateItemRequest) => apiService.createEstimateItem(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['estimate-items', estimateId]);
        queryClient.invalidateQueries(['estimate', estimateId]);
        setShowAddItemModal(false);
        toast.success('Item added successfully');
      },
      onError: () => {
        toast.error('Failed to add item');
      },
    }
  );

  const updateItemMutation = useMutation(
    ({ id, data }: { id: number; data: Partial<CreateEstimateItemRequest> }) =>
      apiService.updateEstimateItem(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['estimate-items', estimateId]);
        queryClient.invalidateQueries(['estimate', estimateId]);
        setEditingItem(null);
        toast.success('Item updated successfully');
      },
      onError: () => {
        toast.error('Failed to update item');
      },
    }
  );

  const deleteItemMutation = useMutation(
    (id: number) => apiService.deleteEstimateItem(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['estimate-items', estimateId]);
        queryClient.invalidateQueries(['estimate', estimateId]);
        toast.success('Item deleted successfully');
      },
      onError: () => {
        toast.error('Failed to delete item');
      },
    }
  );

  if (estimateLoading || itemsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Estimate not found</h2>
          <button
            onClick={() => navigate('/estimates')}
            className="mt-4 text-blue-600 hover:text-blue-500"
          >
            ← Back to Estimates
          </button>
        </div>
      </div>
    );
  }

  const items = itemsData?.items || [];
  const summary = itemsData?.summary || {};

  const handleDeleteItem = (item: EstimateItem) => {
    if (confirm(`Are you sure you want to delete "${item.description}"?`)) {
      deleteItemMutation.mutate(item.item_id);
    }
  };

  const groupedCategories = categories?.reduce((acc: Record<number, string>, cat: Category) => {
    acc[cat.category_id] = cat.name;
    return acc;
  }, {}) || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/estimates')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to Estimates
          </button>
        </div>
      </div>

      {/* Estimate Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{estimate.title}</h1>
              <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Building className="h-4 w-4 mr-1" />
                  {estimate.site_name}
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Created {formatDate(estimate.date_created)}
                </div>
                {estimate.created_by_username && (
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    By {estimate.created_by_username}
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(estimate.status)}`}>
                {estimate.status}
              </div>
              <div className="mt-2 text-right">
                <div className="text-sm text-gray-500">Version {estimate.version}</div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(estimate.total_estimated || 0)}
                </div>
              </div>
            </div>
          </div>
          {estimate.description && (
            <div className="mt-4">
              <p className="text-gray-600">{estimate.description}</p>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Total Items</dt>
              <dd className="text-lg font-semibold text-gray-900">{summary.total_items || 0}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Categories</dt>
              <dd className="text-lg font-semibold text-gray-900">{summary.categories_used || 0}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Items with Actuals</dt>
              <dd className="text-lg font-semibold text-gray-900">{summary.items_with_actuals || 0}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Total Estimated</dt>
              <dd className="text-lg font-semibold text-gray-900">{formatCurrency(summary.total_estimated || 0)}</dd>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex items-center space-x-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="block rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">All Categories</option>
            {categories?.map((category) => (
              <option key={category.category_id} value={category.category_id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setShowAddItemModal(true)}
          className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </button>
      </div>

      {/* Items List */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No items yet</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding your first estimate item.</p>
            <div className="mt-6">
              <button
                onClick={() => setShowAddItemModal(true)}
                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Item
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Price
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
                {items.map((item) => (
                  <tr key={item.item_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{item.description}</div>
                      {item.notes && <div className="text-sm text-gray-500">{item.notes}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">
                        <Tag className="h-3 w-3 mr-1" />
                        {item.category_name || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatCurrency(item.unit_price)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatCurrency(item.total_estimated)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit item"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item)}
                          disabled={deleteItemMutation.isLoading}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          title="Delete item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Estimate Item Modal */}
      {(showAddItemModal || editingItem) && (
        <EstimateItemModal
          isOpen={showAddItemModal || !!editingItem}
          estimateId={parseInt(estimateId!)}
          item={editingItem}
          onClose={() => {
            setShowAddItemModal(false);
            setEditingItem(null);
          }}
          onSubmit={(data) => {
            if (editingItem) {
              updateItemMutation.mutate({ id: editingItem.item_id, data });
            } else {
              createItemMutation.mutate(data);
            }
          }}
          isLoading={editingItem ? updateItemMutation.isLoading : createItemMutation.isLoading}
        />
      )}
    </div>
  );
};

export default EstimateDetails;