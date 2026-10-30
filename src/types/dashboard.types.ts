/**
 * Dashboard Enhancement - Type Definitions
 * 
 * This file contains all TypeScript interfaces and types for the Dashboard Enhancement feature.
 * These types support dashboard components for displaying inventory statistics, purchases/sales tables, and charts.
 * 
 * Requirements Coverage:
 * - 2.1: Statistics Module Display
 * - 3.1: Purchases Table Display
 * - 4.1: Sales Table Display  
 * - 7.1: Purchases Line Chart Visualization
 * - 8.1: Sales Line Chart Visualization
 * - 11.1: Reconciliation Status Indicator
 */

// ============================================================================
// Dashboard State Management
// ============================================================================

/**
 * Root state for the Dashboard page component
 * Manages all dashboard data, filters, and loading states
 */
export interface DashboardState {
  /** Current date range filter applied across all components */
  selectedDateRange: DateRange;
  /** Computed aggregate financial metrics */
  statistics: Statistics | null;
  /** Latest reconciliation status from external system */
  reconciliationStatus: ReconciliationStatus | null;
  /** Paginated purchase transaction data */
  purchases: PaginatedData<Purchase>;
  /** Paginated sale transaction data */
  sales: PaginatedData<Sale>;
  /** Time-series data for line charts */
  chartsData: {
    purchases: ChartDataPoint[];
    sales: ChartDataPoint[];
  };
  /** Global loading state for initial data fetch */
  isLoading: boolean;
  /** Error message if any operation fails */
  error: string | null;
}

// ============================================================================
// Date Filtering
// ============================================================================

/**
 * Date range filter applied to purchases and sales queries
 * Used by DateFilter component and propagated to all child components
 */
export interface DateRange {
  /** Start date of the filter range (inclusive) */
  startDate: Date;
  /** End date of the filter range (inclusive) */
  endDate: Date;
}

/**
 * Filter type enum for quick filter buttons
 */
export type FilterType = 'last7days' | 'last30days' | 'ytd' | 'custom';

/**
 * Custom date range input from user (string format for date pickers)
 */
export interface CustomDateRange {
  /** ISO date string for start date */
  startDate: string;
  /** ISO date string for end date */
  endDate: string;
}

// ============================================================================
// Financial Statistics
// ============================================================================

/**
 * Aggregate financial metrics displayed in Statistics Module
 * Requirement 2.1: Statistics Module Display
 */
export interface Statistics {
  /** Sum of inventory.total_amount across all records */
  totalInvested: number;
  /** Sum of inventory.total_amount where inventory_status='Available' AND event_utc_date >= NOW() */
  activeUnsold: number;
  /** Sum of sold_inventory.sale_total across all records */
  totalSales: number;
}

// ============================================================================
// Reconciliation Status
// ============================================================================

/**
 * Reconciliation status result from daily automated checks
 * Compares internal Active Unsold calculation with external Skybox API
 * Requirement 11.1: Reconciliation Status Indicator
 */
export interface ReconciliationStatus {
  /** Unique identifier for reconciliation log record */
  id: string;
  /** ISO timestamp when reconciliation was executed */
  executedAt: string;
  /** Internal calculated Active Unsold amount from inventory table */
  internalActiveUnsold: number;
  /** External Active Unsold amount from Skybox API report */
  skyboxActiveUnsold: number;
  /** Absolute percentage difference between internal and external values */
  percentageDifference: number;
  /** Status indicating if values match within tolerance (1%) */
  status: 'Matched' | 'Mismatched';
  /** Flag indicating if Active Unsold exceeds $10,000 threshold */
  thresholdExceeded: boolean;
}

// ============================================================================
// Pagination
// ============================================================================

/**
 * Generic paginated data wrapper for tables
 * Used by PurchasesTable and SalesTable components
 */
export interface PaginatedData<T> {
  /** Current page items */
  items: T[];
  /** Total count of matching records (for pagination controls) */
  totalCount: number;
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Number of records per page */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
}

// ============================================================================
// Purchase Transactions
// ============================================================================

/**
 * Purchase transaction record from inventory table
 * Requirement 3.1: Purchases Table Display
 */
export interface Purchase {
  /** Unique identifier for purchase record */
  id: string;
  /** Timestamp when purchase was created (created_at) */
  createdAt: string;
  /** External order reference (order_id) */
  orderId: string | null;
  /** Name of the event (event_name) */
  eventName: string;
  /** Name of the venue (venue_name) */
  venueName: string;
  /** Section identifier */
  section: string;
  /** Row identifier (nullable) */
  row: string | null;
  /** Number of tickets purchased */
  quantity: number;
  /** Cost per individual ticket (price_per) */
  pricePerTicket: number;
  /** Total cost of purchase (total_amount) */
  totalCost: number;
  /** Event date (event_utc_date) */
  eventDate: string;
  /** Current status of inventory (inventory_status) */
  status: string;
  /** Fulfillment status (fulfillment_status) */
  fulfillmentStatus: string | null;
}

/**
 * Footer totals for PurchasesTable
 */
export interface PurchasesFooterTotals {
  /** Total number of purchase records displayed */
  totalCount: number;
  /** Sum of quantity across displayed records */
  totalQuantity: number;
  /** Sum of total_amount across displayed records */
  totalAmount: number;
}

// ============================================================================
// Sale Transactions
// ============================================================================

/**
 * Sale transaction record from sold_inventory table
 * Requirement 4.1: Sales Table Display
 */
export interface Sale {
  /** Unique identifier for sale record */
  id: string;
  /** Timestamp when sale occurred (invoice_date) */
  saleDate: string;
  /** Order identifier (order_id) */
  orderId: string;
  /** Name of the event (event_name) */
  eventName: string;
  /** Name of the venue (venue_name) */
  venueName: string;
  /** Section identifier */
  section: string;
  /** Row identifier (nullable) */
  row: string | null;
  /** Number of tickets sold (quantity_sold) */
  quantitySold: number;
  /** Sale price per individual ticket (calculated: sale_total / quantity_sold) */
  salePricePerTicket: number;
  /** Total sale revenue (sale_total) */
  totalSaleValue: number;
  /** Profit or loss from sale (profit) */
  profitLoss: number;
  /** Event date (event_utc_date) */
  eventDate: string;
  /** Fulfillment status (fulfillment_status) */
  fulfillmentStatus: string | null;
}

/**
 * Footer totals for SalesTable
 */
export interface SalesFooterTotals {
  /** Total number of sale records displayed */
  totalCount: number;
  /** Sum of quantity_sold across displayed records */
  totalQuantitySold: number;
  /** Sum of sale_total across displayed records */
  totalSaleValue: number;
  /** Sum of profit across displayed records */
  totalProfit: number;
}

// ============================================================================
// Chart Visualization
// ============================================================================

/**
 * Single data point for time-series line charts
 * Requirements 7.1, 8.1: Line Chart Visualization
 */
export interface ChartDataPoint {
  /** Date string in YYYY-MM-DD format */
  date: string;
  /** Aggregated monetary value for the date */
  value: number;
}

// ============================================================================
// Query Results
// ============================================================================

/**
 * Result wrapper for purchases query operations
 */
export interface PurchasesResult {
  /** Array of purchase records */
  data: Purchase[];
  /** Total count for pagination */
  totalCount: number;
  /** Error message if query failed */
  error?: string;
}

/**
 * Result wrapper for sales query operations
 */
export interface SalesResult {
  /** Array of sale records */
  data: Sale[];
  /** Total count for pagination */
  totalCount: number;
  /** Error message if query failed */
  error?: string;
}

/**
 * Result wrapper for chart data query operations
 */
export interface ChartDataResult {
  /** Array of data points */
  data: ChartDataPoint[];
  /** Error message if query failed */
  error?: string;
}

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * Props for StatisticsModule component
 */
export interface StatisticsModuleProps {
  /** Current date range filter */
  dateRange: DateRange;
}

/**
 * Props for PurchasesTable component
 */
export interface PurchasesTableProps {
  /** Date filter applied to created_at */
  dateRange: DateRange;
  /** Records per page (default: 50) */
  pageSize?: number;
}

/**
 * Props for SalesTable component
 */
export interface SalesTableProps {
  /** Date filter applied to invoice_date */
  dateRange: DateRange;
  /** Records per page (default: 50) */
  pageSize?: number;
}

/**
 * Props for DateFilter component
 */
export interface DateFilterProps {
  /** Callback when filter changes */
  onDateRangeChange: (range: DateRange) => void;
  /** Initial filter type (default: 'last7days') */
  initialFilter?: FilterType;
}

/**
 * Props for ChartRenderer component
 */
export interface ChartRendererProps {
  /** Type of data to visualize */
  dataType: 'purchases' | 'sales';
  /** Date filter for data aggregation */
  dateRange: DateRange;
}

/**
 * Props for ReconciliationIndicator component
 */
export interface ReconciliationIndicatorProps {
  /** Optional: externally provided status (if not subscribing) */
  status?: ReconciliationStatus | null;
}

// ============================================================================
// Status Icon Types
// ============================================================================

/**
 * Visual status representation for ReconciliationIndicator
 */
export interface StatusIcon {
  /** Icon type/color: green (matched), yellow (warning), red (alert), gray (pending) */
  icon: 'green' | 'yellow' | 'red' | 'gray';
  /** Tooltip text explaining the status */
  tooltip: string;
}

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Result of custom date range validation
 */
export interface ValidationResult {
  /** Whether validation passed */
  isValid: boolean;
  /** Error message if validation failed */
  errorMessage?: string;
}
