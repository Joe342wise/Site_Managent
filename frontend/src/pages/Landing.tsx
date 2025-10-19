import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  Phone,
  ArrowRight,
  FileText,
  DollarSign,
  BarChart3,
  Hammer,
  Wrench,
  Zap,
  Droplet,
  Wind,
  LayoutGrid
} from 'lucide-react';
import logo from '../assets/logo.jpg';

const Landing: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <FileText className="w-8 h-8 text-blue-600" />,
      title: 'Detailed Estimates',
      description: 'Create comprehensive project estimates with itemized costs across all construction categories. Track quantities, unit prices, and total estimated values.'
    },
    {
      icon: <DollarSign className="w-8 h-8 text-blue-600" />,
      title: 'Actual Cost Tracking',
      description: 'Record real-time purchases and expenses as they occur. Monitor actual quantities and prices against your estimates for complete financial transparency.'
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-blue-600" />,
      title: 'Variance Analysis',
      description: 'Instantly compare estimated vs actual costs. Identify overruns, savings, and trends with automatic variance calculations and detailed breakdowns.'
    }
  ];

  const categories = [
    { icon: <Building2 className="w-5 h-5" />, name: 'Material' },
    { icon: <Hammer className="w-5 h-5" />, name: 'Labor' },
    { icon: <Building2 className="w-5 h-5" />, name: 'Masonry' },
    { icon: <Wrench className="w-5 h-5" />, name: 'Steel Works' },
    { icon: <Droplet className="w-5 h-5" />, name: 'Plumbing' },
    { icon: <Hammer className="w-5 h-5" />, name: 'Carpentry' },
    { icon: <Zap className="w-5 h-5" />, name: 'Electrical Works' },
    { icon: <Wind className="w-5 h-5" />, name: 'Air Conditioning' },
    { icon: <Droplet className="w-5 h-5" />, name: 'Utilities' },
    { icon: <LayoutGrid className="w-5 h-5" />, name: 'Glass Glazing' },
    { icon: <Wrench className="w-5 h-5" />, name: 'Metal Works' },
    { icon: <Building2 className="w-5 h-5" />, name: 'POP/Aesthetics' }
  ];

  const benefits = [
    'Real-time cost monitoring across all project sites',
    'Categorized tracking for 12+ construction specialties',
    'Automated variance calculations and alerts',
    'Multi-site management from a single dashboard',
    'Comprehensive reporting and export capabilities',
    'Secure user authentication and role-based access'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src={logo} alt="De'Aion Contractors Logo" className="w-12 h-12 rounded-full" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">De'Aion Contractors</h1>
                <p className="text-xs text-gray-600">Construction Site Management</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Login
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h2 className="text-5xl font-extrabold text-gray-900 mb-6">
            Master Your Construction Costs
          </h2>
          <p className="text-xl text-gray-600 mb-4 max-w-3xl mx-auto">
            Professional cost management system designed for construction excellence.
            Track estimates, monitor actual expenses, and analyze variances in real-time.
          </p>
          <p className="text-lg text-blue-600 font-semibold mb-8">
            Built for Construction Excellence
          </p>
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
          >
            Get Started
            <ArrowRight className="ml-2 w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Complete Cost Management Solution
        </h3>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-lg p-8 shadow-md hover:shadow-xl transition-shadow"
            >
              <div className="mb-4">{feature.icon}</div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h4>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-white/50 rounded-2xl my-8">
        <h3 className="text-3xl font-bold text-center text-gray-900 mb-4">
          Track 12+ Construction Categories
        </h3>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          Organize your project costs across all major construction specialties with detailed tracking and analysis.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((category, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-blue-600">{category.icon}</div>
              <span className="text-gray-700 font-medium">{category.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-blue-600 rounded-2xl p-12 text-white">
          <h3 className="text-3xl font-bold mb-8 text-center">
            Why Choose Our System?
          </h3>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start space-x-3">
                <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <span className="text-lg">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h3 className="text-3xl font-bold text-gray-900 mb-4">
          Ready to Take Control of Your Construction Costs?
        </h3>
        <p className="text-xl text-gray-600 mb-8">
          Join construction professionals who trust our system for accurate cost management.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="inline-flex items-center px-10 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
        >
          Login to Get Started
          <ArrowRight className="ml-2 w-5 h-5" />
        </button>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <img src={logo} alt="De'Aion Contractors Logo" className="w-8 h-8 rounded-full" />
                <h4 className="text-lg font-bold">De'Aion Contractors</h4>
              </div>
              <p className="text-gray-400">
                Professional construction site management and cost tracking solution.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">Features</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Project Estimates</li>
                <li>Cost Tracking</li>
                <li>Variance Analysis</li>
                <li>Multi-Site Management</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">Contact</h4>
              <div className="space-y-2 text-gray-400">
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>0242838007</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>0208936345</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} De'Aion Contractors. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
