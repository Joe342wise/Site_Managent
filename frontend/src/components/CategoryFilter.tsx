import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from 'react-query';
import { Filter, X, Check } from 'lucide-react';
import { apiService } from '../services/api';
import { Category } from '../types';

interface CategoryFilterProps {
  selectedCategories: number[];
  onCategoryChange: (categoryIds: number[]) => void;
  multiple?: boolean;
  placeholder?: string;
  className?: string;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategories,
  onCategoryChange,
  multiple = true,
  placeholder = 'Filter by category',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: categories = [], isLoading, error } = useQuery<Category[]>(
    'categories',
    apiService.getCategories,
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      onSuccess: (data) => {
        console.log('Categories loaded successfully:', data?.length || 0, 'categories');
      },
      onError: (err) => {
        console.error('Failed to load categories:', err);
      }
    }
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCategoryToggle = (categoryId: number) => {
    if (multiple) {
      if (selectedCategories.includes(categoryId)) {
        onCategoryChange(selectedCategories.filter(id => id !== categoryId));
      } else {
        onCategoryChange([...selectedCategories, categoryId]);
      }
    } else {
      if (selectedCategories.includes(categoryId)) {
        onCategoryChange([]);
      } else {
        onCategoryChange([categoryId]);
        setIsOpen(false);
      }
    }
  };

  const clearAll = () => {
    onCategoryChange([]);
  };

  const getSelectedCategoryNames = () => {
    if (selectedCategories.length === 0) return placeholder;
    if (selectedCategories.length === 1) {
      const category = categories.find(c => c.category_id === selectedCategories[0]);
      return category?.name || placeholder;
    }
    return `${selectedCategories.length} categories selected`;
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold
          ${selectedCategories.length > 0
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
          }
          shadow-sm transition-colors
        `}
      >
        <Filter className="h-4 w-4" />
        <span>{getSelectedCategoryNames()}</span>
        {selectedCategories.length > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              clearAll();
            }}
            className="ml-1 hover:bg-blue-800 rounded-full p-0.5"
            title="Clear all selected categories"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 z-50 mt-2 w-80 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 overflow-visible">
          <div className="p-2">
            {/* Search input */}
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
              autoFocus
            />
          </div>

          <div className="max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                Loading categories...
              </div>
            ) : error ? (
              <div className="px-4 py-3 text-sm text-red-500 text-center">
                Failed to load categories. Please refresh.
              </div>
            ) : categories.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No categories available in the system
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No categories match "{searchTerm}"
              </div>
            ) : (
              <div className="py-1">
                {filteredCategories.map((category) => {
                  const isSelected = selectedCategories.includes(category.category_id);
                  return (
                    <button
                      key={category.category_id}
                      onClick={() => handleCategoryToggle(category.category_id)}
                      className={`
                        w-full text-left px-4 py-2 text-sm flex items-center justify-between
                        ${isSelected
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50'
                        }
                        transition-colors
                      `}
                    >
                      <div className="flex-1">
                        <div className="font-medium">{category.name}</div>
                        {category.description && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {category.description}
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 text-blue-600 ml-2 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {multiple && selectedCategories.length > 0 && (
            <div className="border-t border-gray-200 px-4 py-2 flex justify-between items-center">
              <span className="text-xs text-gray-600">
                {selectedCategories.length} selected
              </span>
              <button
                onClick={clearAll}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CategoryFilter;
