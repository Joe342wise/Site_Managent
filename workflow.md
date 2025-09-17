# Construction Site Manager - Workflow Documentation

## Application Workflow Overview

This document outlines the complete workflow for using the Construction Site Manager, including current functionality and the integrated approach that addresses the client's core business needs.

## Current Workflow (Phase 1 Implementation)

### 1. Application Startup & Authentication

#### Login Process
1. **Launch Application**: Run `Site_Manager.py`
2. **Login Screen**: Enter credentials
   - Default: `admin` / `admin123`
   - System validates against Users database table
3. **Access Control**: Only authenticated users can proceed
4. **Main Interface**: Upon successful login, user lands on Sites page

### 2. Site Management Workflow

#### Creating a New Site
1. **Navigate**: Ensure you're on the Sites tab (default after login)
2. **Add Site**: Click "Add Site" button
3. **Fill Details**:
   - Site Name (required)
   - Location (optional)
   - Start Date (optional)
4. **Save**: Confirm to create new site record

#### Managing Existing Sites
1. **View Sites**: Browse all sites in tree view format
2. **Edit Site**: Select site → "Edit Selected" → modify details
3. **Delete Site**: Select site → "Delete Selected" → confirm removal
   - **Warning**: Deletes all associated estimates and actuals
4. **Select Site**: Click on site to work with its estimates

### 3. Estimates Management Workflow

#### Prerequisites
- Must have a site selected from Sites tab
- Navigate to Estimates tab

#### Creating Estimates
1. **New Estimate**: Click "New Estimate" button
2. **Enter Title**: Provide estimate description/title
3. **Auto-Generation**: System creates estimate with current date
4. **Estimate List**: New estimate appears in left panel

#### Adding Estimate Items
1. **Select Estimate**: Click estimate from list (left panel)
2. **Add Item**: Click "Add Item" button
3. **Item Details**:
   - Description (required)
   - Category (select from 12 options)
   - Quantity (default: 1)
   - Unit (e.g., bags, pieces, hours)
   - Unit Price (estimated cost)
4. **Save**: Item appears in items tree view with calculated totals

#### Item Categories Available
- **Material**: Basic construction materials
- **Labor**: Worker payments and contractor fees
- **Masonry**: Brick work, concrete, foundations
- **Steel Works**: Reinforcement, structural steel
- **Plumbing**: Pipes, fixtures, installation
- **Carpentry**: Wood work, formwork, finishing
- **Electrical Works**: Wiring, fixtures, installations
- **Air Conditioning Works**: HVAC systems
- **Utilities**: Water, electricity connections
- **Glass Glazing**: Windows, glass installations
- **Metal Works**: Gates, railings, metal fixtures
- **POP/Aesthetics Works**: Finishing, decorative elements

#### Managing Estimate Items
1. **Edit Item**: Select item → "Edit Item" → modify details
2. **Delete Item**: Select item → "Delete Item" → confirm removal
3. **View Totals**: Automatic calculation of estimated totals
4. **Refresh**: Update item list with latest data

### 4. Actual Costs Tracking Workflow

#### Recording Actual Costs
1. **Select Item**: From estimates items tree view
2. **Record Actual**: Click "Record Actual" button
3. **Enter Actual Unit Price**: Input real cost paid
4. **Save**: System calculates:
   - Actual total cost (quantity × actual unit price)
   - Variance (actual - estimated)
   - Percentage difference

#### Variance Analysis
1. **Visual Indicators**: Items automatically color-coded
   - **Red Background**: Over budget (actual > estimated)
   - **Green Background**: Under budget (actual < estimated)
   - **White Background**: No actual recorded
2. **Actuals Tab**: Comprehensive view of all variances across projects

### 5. Reporting Workflow

#### PDF Export Methods

##### Method 1: From Estimates Tab
1. **Select Estimate**: Choose estimate from left panel
2. **Export Button**: Click "Export Selected to PDF"
3. **Choose Folder**: Select save location via file dialog
4. **Generate**: System creates professional PDF report

##### Method 2: From Reports Tab
1. **Navigate**: Go to Reports tab
2. **Load Estimates**: Click "Load Estimates" to populate dropdown
3. **Select Estimate**: Choose from all available estimates
4. **Generate PDF**: Click "Generate PDF" → choose folder → create report

#### PDF Report Contents
- **Header**: Company branding (De'Aion Contractors)
- **Meta Information**: Estimate ID, title, date, site details
- **Contact Information**: Company phone numbers
- **Categorized Items**: Grouped by construction categories
- **Cost Analysis**: Estimated vs actual costs with variances
- **Professional Styling**: Borders, tables, consistent formatting

### 6. Data Management Workflow

#### Database Operations
- **Automatic Saves**: All changes saved immediately to SQLite
- **Data Relationships**: Maintains referential integrity
- **Cascade Deletes**: Removing sites deletes associated data
- **Data Validation**: Input validation prevents corrupted data

#### Backup Considerations
- **Database File**: `construction_manager.db` (auto-created)
- **Manual Backup**: Copy database file for backup
- **Recovery**: Replace database file to restore data

## Integrated Workflow Vision (Phase 2)

### Enhanced Business Process Flow

#### 1. Contract Setup & Budgeting
```
New Contract → Set Budget → Create Site → Prepare Estimates
     ↓
Check Inventory → Identify Gaps → Plan Procurement
```

#### 2. Procurement Decision Flow
```
Need Item → Check Inventory Available?
    ↓                    ↓
   YES: Allocate        NO: Purchase
    ↓                    ↓
Update Inventory → Charge to Contract Budget
```

#### 3. Financial Tracking Flow
```
Contract A Budget ←→ Shared Inventory ←→ Contract B Budget
     ↓                      ↓                    ↓
Track Spending         Track Usage        Track Spending
     ↓                      ↓                    ↓
Generate Reports      Update Stock       Generate Reports
```

### Enhanced Workflow Components (Future)

#### Inventory Management
1. **Central Inventory**: Master list of owned tools/materials
2. **Stock Levels**: Track quantities available
3. **Allocation Tracking**: Record which contract uses what
4. **Reorder Points**: Alert when stock runs low

#### Contract Financial Control
1. **Budget Assignment**: Set spending limits per contract
2. **Spending Alerts**: Warn when approaching budget limits
3. **Cross-Contract Prevention**: Block unauthorized transfers
4. **Financial Reporting**: Profit/loss per contract

#### Procurement Planning
1. **Need Analysis**: Compare requirements vs inventory
2. **Purchase Orders**: Generate orders for missing items
3. **Vendor Management**: Track suppliers and prices
4. **Delivery Tracking**: Monitor incoming materials

## User Roles & Permissions (Current)

### Current User System
- **Single User**: Admin access to all features
- **No Role Restrictions**: Full CRUD access across all modules
- **Session Management**: Login required for application access

### Future User Roles (Planned)
- **Owner/Manager**: Full system access
- **Site Supervisor**: Site-specific access
- **Accountant**: Financial reporting access
- **Inventory Manager**: Stock management access

## Best Practices & Tips

### Data Entry Guidelines
1. **Consistent Naming**: Use standard site naming conventions
2. **Complete Information**: Fill all relevant fields for better reporting
3. **Regular Updates**: Record actuals promptly for accurate tracking
4. **Category Selection**: Choose appropriate categories for better analysis

### Performance Optimization
1. **Regular Exports**: Generate PDF reports regularly for records
2. **Data Cleanup**: Remove unnecessary old records periodically
3. **Backup Routine**: Regular database backups recommended

### Error Prevention
1. **Double-Check Entries**: Verify numbers before saving
2. **Meaningful Descriptions**: Use clear, descriptive item names
3. **Proper Categories**: Select appropriate categories for items
4. **Regular Validation**: Cross-check totals and calculations

## Troubleshooting Common Issues

### Login Problems
- **Verify Credentials**: Check username/password spelling
- **Database Access**: Ensure database file is accessible
- **Fresh Start**: Restart application if login fails

### Data Entry Issues
- **Required Fields**: Ensure all required fields are completed
- **Number Format**: Use proper decimal format for prices
- **Category Selection**: Select category from dropdown list

### Export Problems
- **File Permissions**: Ensure write access to selected folder
- **Disk Space**: Verify sufficient space for PDF files
- **Estimate Selection**: Confirm estimate is selected before export

## Integration Points for Future Development

### External System Connections
- **Accounting Software**: QuickBooks, Sage integration
- **Banking Systems**: Automatic transaction import
- **Supplier Portals**: Direct ordering capabilities
- **Mobile Apps**: Field data entry and updates

### Data Import/Export
- **Excel Integration**: Import/export estimate data
- **CSV Support**: Bulk data operations
- **API Development**: Third-party integrations
- **Cloud Sync**: Multi-device access

---

*This workflow documentation provides comprehensive guidance for current users while outlining the vision for enhanced functionality that will fully address the client's business requirements.*