import React, { useState } from 'react';
import { User, Mail, Shield, Calendar, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, getStatusColor } from '../utils';

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    email: user?.email || '',
    full_name: user?.full_name || '',
  });

  const handleSave = async () => {
    // This would call the API to update the profile
    updateUser(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      email: user?.email || '',
      full_name: user?.full_name || '',
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="mt-2 text-sm text-gray-700">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center space-x-6">
            <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">
                {user?.full_name || user?.username}
              </h3>
              <p className="text-sm text-gray-500">@{user?.username}</p>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium mt-2 ${getStatusColor(user?.role || '')}`}>
                {user?.role}
              </span>
            </div>
            <div className="flex-shrink-0">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="inline-flex items-center rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Profile Information</h3>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                <User className="h-4 w-4 inline mr-2" />
                Username
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  value={user?.username}
                  disabled
                  className="block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm text-gray-500 sm:text-sm"
                  title="Username (read-only)"
                />
                <p className="mt-1 text-xs text-gray-500">Username cannot be changed</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                <Shield className="h-4 w-4 inline mr-2" />
                Role
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  value={user?.role}
                  disabled
                  className="block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm text-gray-500 sm:text-sm"
                  title="User role (read-only)"
                />
                <p className="mt-1 text-xs text-gray-500">Role is managed by administrators</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                <Mail className="h-4 w-4 inline mr-2" />
                Email
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isEditing}
                  className={`block w-full rounded-md border-gray-300 shadow-sm sm:text-sm ${
                    isEditing
                      ? 'focus:border-blue-500 focus:ring-blue-500'
                      : 'bg-gray-50 text-gray-500'
                  }`}
                  title="Email address"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                <User className="h-4 w-4 inline mr-2" />
                Full Name
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  disabled={!isEditing}
                  className={`block w-full rounded-md border-gray-300 shadow-sm sm:text-sm ${
                    isEditing
                      ? 'focus:border-blue-500 focus:ring-blue-500'
                      : 'bg-gray-50 text-gray-500'
                  }`}
                  title="Full name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                <Calendar className="h-4 w-4 inline mr-2" />
                Member Since
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  value={formatDate(user?.created_at || '')}
                  disabled
                  className="block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm text-gray-500 sm:text-sm"
                  title="Account creation date (read-only)"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <div className="mt-1">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium ${
                  user?.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {user?.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Security</h3>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Password</h4>
              <p className="text-sm text-gray-500">Last updated recently</p>
            </div>
            <button
              type="button"
              className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Change Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;