# Construction Site Manager - Frontend

A modern React frontend for the Construction Site Manager API built with TypeScript, Vite, and Tailwind CSS.

## Features

- 🔐 **Authentication** - JWT-based login with role management
- 📊 **Dashboard** - Overview of projects, finances, and alerts
- 🏗️ **Site Management** - Create and manage construction sites
- 📋 **Estimates** - Detailed project estimation with categories
- 💰 **Cost Tracking** - Record actual costs vs estimates
- 📈 **Variance Analysis** - Budget performance analytics
- 📄 **Reports** - Professional PDF report generation
- 👤 **Profile Management** - User settings and preferences

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Query** for data fetching and caching
- **React Hook Form** with Zod validation
- **Lucide React** for icons
- **Axios** for API communication
- **React Hot Toast** for notifications

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Backend API running on port 3000

### Installation

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Open your browser**
   - Frontend: http://localhost:3001
   - API Proxy: Automatically forwards `/api/*` to backend

### Default Login

- **Username**: `admin`
- **Password**: `admin123`

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.tsx      # Main layout with sidebar
│   └── LoadingSpinner.tsx
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication state
├── pages/             # Page components
│   ├── Dashboard.tsx  # Main dashboard
│   ├── Sites.tsx      # Site management
│   ├── Estimates.tsx  # Estimate management
│   ├── Actuals.tsx    # Cost tracking
│   ├── Variance.tsx   # Analytics
│   ├── Reports.tsx    # PDF reports
│   ├── Profile.tsx    # User profile
│   └── Login.tsx      # Authentication
├── services/          # API services
│   └── api.ts         # Axios API client
├── types/             # TypeScript definitions
│   └── index.ts       # All type definitions
├── utils/             # Utility functions
│   └── index.ts       # Helper functions
├── App.tsx            # Main app component
└── main.tsx           # Entry point
```

## Key Features Implemented

### 🔐 Authentication System
- JWT token management
- Automatic token refresh
- Role-based access control
- Protected routes

### 📱 Responsive Design
- Mobile-first approach
- Collapsible sidebar
- Touch-friendly interface
- Responsive tables and grids

### 🎨 Modern UI/UX
- Clean, professional design
- Consistent color scheme
- Interactive components
- Loading states and animations

### 📊 Dashboard Analytics
- Real-time statistics
- Budget variance alerts
- Recent activity feed
- Quick action buttons

### 🏗️ Site Management
- Create, edit, delete sites
- Site status tracking
- Budget management
- Location and date tracking

### 📋 Data Management
- Pagination support
- Search and filtering
- Real-time updates
- Error handling

## API Integration

The frontend seamlessly integrates with the backend API:

- **Base URL**: `/api` (proxied to `http://localhost:3000`)
- **Authentication**: Bearer token in headers
- **Error Handling**: Automatic error notifications
- **Caching**: React Query for optimized data fetching

## Environment Configuration

The app uses Vite's proxy configuration to forward API calls:

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
```

## Building for Production

```bash
# Build the app
npm run build

# Preview the build
npm run preview
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Follow the existing code style
2. Use TypeScript for type safety
3. Add proper error handling
4. Test on different screen sizes
5. Update documentation as needed

## Future Enhancements

- [ ] Complete all CRUD interfaces
- [ ] Advanced filtering and search
- [ ] Data visualization charts
- [ ] Offline support
- [ ] Mobile app (React Native)
- [ ] Real-time notifications
- [ ] Advanced reporting features
- [ ] Bulk operations
- [ ] Export/Import functionality
- [ ] Theme customization

## Support

For support or questions:
- Check the backend API documentation
- Review the component documentation
- Contact: De'Aion Contractors

---

**Built with ❤️ for De'Aion Contractors**