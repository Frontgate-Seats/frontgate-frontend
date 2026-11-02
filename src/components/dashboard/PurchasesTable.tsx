/**
 * PurchasesTable
 *
 * Server-side paginated / sorted table of inventory (purchase) records.
 * Uses CustomDataGrid with collapsible column groups:
 *
 *  ┌─ Event Info ──────────┐  ┌─ Ticket Details ───┐  ┌─ Financials ───────┐
 *  │ Event Name  │ Venue   │  │ Section │ Row │ Qty │  │ Price/Tkt│ Total  │
 *  └────────────────────────┘  └────────────────────┘  └────────────────────┘
 *
 * Each group header has a chevron that collapses the group to a single
 * summary column showing a condensed value.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IconButton, Tooltip, Typography, Box, Popover, Divider } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type {
  GridPaginationModel,
  GridSortModel,
  GridFilterModel,
  GridColumnGroupingModel,
} from '@mui/x-data-grid';
import type { CustomGridColDef } from '../../shared/types/mui.type';
import type { Purchase, PurchasesTableProps } from '../../types/dashboard.types';
import type { AppDispatch, RootState } from '../../store';
import {
  getDashboardPurchases,
  getDashboardPurchasesSummary,
} from '../../store/slices/dashboard.slice';
import moment from 'moment';
import { DATE_TIME_FORMAT } from '../../shared/utils/dateTime.util';
import CustomDataGrid from '../common/datagrid/CustomDatagrid';

// ─── Group ids ────────────────────────────────────────────────────────────────
const G_EVENT    = 'g_event';
const G_PURCHASE = 'g_purchase';
const G_TICKET   = 'g_ticket';
const G_FINANCIAL = 'g_financial';
const G_STATUS   = 'g_status';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

// Profit / margin only make sense once (part of) the inventory has sold.
const isSold = (status: string | null | undefined) =>
  status === 'DEPLETED' || status === 'PARTIAL_SOLD';

// DEPLETED is the DB value for fully-sold inventory — show it as "SOLD".
const statusLabel = (status: string | null | undefined) =>
  status === 'DEPLETED' ? 'SOLD' : (status ?? '');

const FULFILLMENT_STATUS_OPTIONS = [
  { value: 'PENDING',   label: 'PENDING' },
  { value: 'COMPLETE',  label: 'COMPLETE' },
  { value: 'CANCELLED', label: 'CANCELLED' },
];

// Inventory status filter options — DB value + display label (DEPLETED => SOLD).
const INVENTORY_STATUS_OPTIONS = [
  { value: 'AVAILABLE',    label: 'AVAILABLE' },
  { value: 'ON_HOLD',      label: 'ON_HOLD' },
  { value: 'DEPLETED',     label: 'SOLD' },
  { value: 'PARTIAL_SOLD', label: 'PARTIAL_SOLD' },
  { value: 'UNSOLD',       label: 'UNSOLD' },
];

// ─── Group header with collapse toggle ───────────────────────────────────────
function GroupHeader({
  label,
  groupId,
  collapsed,
  onToggle,
}: {
  label: string;
  groupId: string;
  collapsed: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <Box display="flex" alignItems="center" gap={0.5} px={0.5} width="100%">
      <Typography variant="body2" fontWeight={700} noWrap sx={{ flex: 1 }}>
        {label}
      </Typography>
      <Tooltip title={collapsed ? 'Expand group' : 'Collapse group'}>
        <IconButton size="small" onClick={() => onToggle(groupId)} sx={{ p: 0.25 }}>
          {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
        </IconButton>
      </Tooltip>
    </Box>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function PurchasesTable({
  dateRange,
  pageSize = 25,
}: PurchasesTableProps) {
  const dispatch = useDispatch<AppDispatch>();
  const {
    purchases: { data: purchases, total: totalCount },
    purchasesLoading: isLoading,
    purchasesSummary: summary,
    error,
  } = useSelector((state: RootState) => state.dashboard);

  // Groups start collapsed (compact stacked summary); users expand via chevron.
  const [collapsedGroups, setCollapsed]   = useState<Set<string>>(
    new Set([G_PURCHASE, G_EVENT, G_TICKET, G_FINANCIAL, G_STATUS]),
  );

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize,
  });
  const [sortingModel, setSortingModel] = useState<GridSortModel>([
    { field: 'createdAt', sort: 'desc' },
  ]);
  const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [] });

  const toggleGroup = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // ── Columns ──────────────────────────────────────────────────────────────
  const columns = useMemo((): CustomGridColDef[] => {
    const eventCollapsed    = collapsedGroups.has(G_EVENT);
    const purchaseCollapsed = collapsedGroups.has(G_PURCHASE);
    const ticketCollapsed   = collapsedGroups.has(G_TICKET);
    const finCollapsed      = collapsedGroups.has(G_FINANCIAL);
    const statusCollapsed   = collapsedGroups.has(G_STATUS);

    return [
      // ── Purchase Info group — FIRST ──
      ...(purchaseCollapsed
        ? [
            {
              field: '__purchase_summary',
              headerName: '',
              width: 200,
              sortable: false,
              filterable: false,
              renderCell: ({ row }: { row: Purchase }) => (
                <Box display="flex" flexDirection="column" justifyContent="center" py={0.5} gap={0.25}>
                  <Typography variant="body2" noWrap>
                    <b>PO ID:</b>{' '}
                    {row.purchaseId ? (
                      <Box
                        component="span"
                        sx={{ color: 'primary.main', fontWeight: 400, cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={(e) => { e.stopPropagation(); window.open(`https://skybox.vividseats.com/purchases/${row.purchaseId}`, '_blank'); }}
                      >
                        {row.purchaseId}
                      </Box>
                    ) : '—'}
                  </Typography>
                  <Typography variant="body2" noWrap><b>Ext Ref:</b> {row.orderId ?? ''}</Typography>
                  <Typography variant="body2" noWrap><b>Inventory ID:</b> {row.inventoryId ?? ''}</Typography>
                  <Typography variant="body2" noWrap><b>Purchase Date:</b> {row.createdAt ? moment(row.createdAt).format(DATE_TIME_FORMAT) : ''}</Typography>
                </Box>
              ),
            } as CustomGridColDef,
          ]
        : [
            {
              field: 'purchaseId',
              headerName: 'PO ID',
              width: 110,
              type: 'string',
              sortable: false,
              renderCell: ({ row }: { row: Purchase }) =>
                row.purchaseId ? (
                  <Typography
                    variant="body2"
                    color="primary"
                    noWrap
                    sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={(e) => { e.stopPropagation(); window.open(`https://skybox.vividseats.com/purchases/${row.purchaseId}`, '_blank'); }}
                  >
                    {row.purchaseId}
                  </Typography>
                ) : null,
            } as CustomGridColDef,
            {
              field: 'orderId',
              headerName: 'Ext Ref',
              width: 130,
              type: 'string',
              valueFormatter: (v: string | null) => v ?? '',
            } as CustomGridColDef,
            {
              field: 'inventoryId',
              headerName: 'Inventory ID',
              width: 120,
              type: 'string',
              valueFormatter: (v: string | null) => v ?? '',
            } as CustomGridColDef,
            {
              field: 'createdAt',
              headerName: 'Purchase Date',
              width: 175,
              type: 'dateTime',
              valueFormatter: (v: string) => v ? moment(v).format(DATE_TIME_FORMAT) : '',
            } as CustomGridColDef,
          ]),

      // ── Event Info group — SECOND ──
      ...(eventCollapsed
        ? [
            {
              field: '__event_summary',
              headerName: '',
              width: 260,
              sortable: false,
              filterable: false,
              renderCell: ({ row }: { row: Purchase }) => (
                <Box display="flex" flexDirection="column" justifyContent="center" py={0.5} gap={0.25}>
                  <Typography variant="body2" noWrap>
                    <b>Event ID:</b>{' '}
                    {row.eventId ? (
                      <Box
                        component="span"
                        sx={{ color: 'primary.main', fontWeight: 400, cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={(e) => { e.stopPropagation(); window.open(`https://www.vividseats.com/curling-canada-tickets-scotiabank-centre-11-25-2025--sports-other-sports/production/${row.eventId}`, '_blank'); }}
                      >
                        {row.eventId}
                      </Box>
                    ) : ''}
                  </Typography>
                  <Typography variant="body2" noWrap><b>Event Name:</b> {row.eventName}</Typography>
                  <Typography variant="body2" noWrap><b>Venue:</b> {row.venueName}</Typography>
                  <Typography variant="body2" noWrap><b>Event Date:</b> {row.eventDate ? moment(row.eventDate).format(DATE_TIME_FORMAT) : ''}</Typography>
                </Box>
              ),
            } as CustomGridColDef,
          ]
        : [
            {
              field: 'eventId',
              headerName: 'Event ID',
              width: 100,
              type: 'number',
              sortable: false,
              renderCell: ({ row }: { row: Purchase }) =>
                row.eventId ? (
                  <Typography
                    variant="body2"
                    color="primary"
                    noWrap
                    sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={(e) => { e.stopPropagation(); window.open(`https://www.vividseats.com/curling-canada-tickets-scotiabank-centre-11-25-2025--sports-other-sports/production/${row.eventId}`, '_blank'); }}
                  >
                    {row.eventId}
                  </Typography>
                ) : null,
            } as CustomGridColDef,
            {
              field: 'eventName',
              headerName: 'Event Name',
              width: 220,
              flex: 1,
              type: 'string',
            } as CustomGridColDef,
            {
              field: 'venueName',
              headerName: 'Venue',
              width: 180,
              type: 'string',
            } as CustomGridColDef,
            {
              field: 'eventDate',
              headerName: 'Event Date',
              width: 165,
              type: 'dateTime',
              valueFormatter: (v: string) => v ? moment(v).format(DATE_TIME_FORMAT) : '',
            } as CustomGridColDef,
          ]),

      // ── Ticket Details group ──
      ...(ticketCollapsed
        ? [
            {
              field: '__ticket_summary',
              headerName: '',
              width: 170,
              sortable: false,
              filterable: false,
              renderCell: ({ row }: { row: Purchase }) => (
                <Box display="flex" flexDirection="column" justifyContent="center" py={0.5} gap={0.25}>
                  <Typography variant="body2"><b>Section:</b> {row.section}</Typography>
                  <Typography variant="body2"><b>Row:</b> {row.row ?? ''}</Typography>
                  <Typography variant="body2"><b>Qty:</b> {row.quantity}</Typography>
                </Box>
              ),
            } as CustomGridColDef,
          ]
        : [
            {
              field: 'section',
              headerName: 'Section',
              width: 90,
              type: 'string',
            } as CustomGridColDef,
            {
              field: 'row',
              headerName: 'Row',
              width: 70,
              type: 'string',
              valueFormatter: (v: string | null) => v ?? '',
            } as CustomGridColDef,
            {
              field: 'quantity',
              headerName: 'Qty',
              width: 70,
              type: 'number',
              align: 'right',
              headerAlign: 'right',
            } as CustomGridColDef,
          ]),

      // ── Financials group ──
      ...(finCollapsed
        ? [
            {
              field: '__fin_summary',
              headerName: '',
              width: 190,
              sortable: false,
              filterable: false,
              renderCell: ({ row }: { row: Purchase }) => {
                const sold = isSold(row.status);
                const margin = sold && row.soldPrice > 0 ? (row.profit / row.soldPrice) * 100 : null;
                const pColor = row.profit < 0 ? '#d32f2f' : '#2e7d32';
                // Total Sale: green when it beats cost, red when below cost.
                const saleColor = row.soldPrice >= row.totalCost ? '#2e7d32' : '#d32f2f';
                return (
                  <Box display="flex" flexDirection="column" justifyContent="center" py={0.5} gap={0.25}>
                    <Typography variant="body2"><b>Unit Cost:</b> {fmt(row.pricePerTicket)}</Typography>
                    <Typography variant="body2"><b>Total Cost:</b> {fmt(row.totalCost)}</Typography>
                    {sold && (
                      <>
                        <Typography variant="body2"><b>Total Sale:</b> <span style={{ color: saleColor }}>{fmt(row.soldPrice)}</span></Typography>
                        <Typography variant="body2"><b>Profit:</b> <span style={{ color: pColor }}>{fmt(row.profit)}</span></Typography>
                        <Typography variant="body2"><b>Margin:</b> <span style={{ color: pColor }}>{margin != null ? `${margin.toFixed(1)}%` : '—'}</span></Typography>
                      </>
                    )}
                  </Box>
                );
              },
            } as CustomGridColDef,
          ]
        : [
            {
              field: 'pricePerTicket',
              headerName: 'Unit Cost',
              width: 120,
              type: 'number',
              align: 'right',
              headerAlign: 'right',
              valueFormatter: (v: number) => fmt(v),
            } as CustomGridColDef,
            {
              field: 'totalCost',
              headerName: 'Total Cost',
              width: 120,
              type: 'number',
              align: 'right',
              headerAlign: 'right',
              valueFormatter: (v: number) => fmt(v),
            } as CustomGridColDef,
            {
              field: 'soldPrice',
              headerName: 'Total Sale',
              width: 120,
              type: 'number',
              align: 'right',
              headerAlign: 'right',
              renderCell: (params) =>
                isSold(params.row.status) ? (
                  <span
                    style={{
                      color: params.value >= params.row.totalCost ? '#2e7d32' : '#d32f2f',
                      fontWeight: 600,
                    }}
                  >
                    {fmt(params.value)}
                  </span>
                ) : (
                  '—'
                ),
            } as CustomGridColDef,
            {
              field: 'profit',
              headerName: 'Profit',
              width: 110,
              type: 'number',
              align: 'right',
              headerAlign: 'right',
              renderCell: (params) =>
                isSold(params.row.status) ? (
                  <span style={{ color: params.value < 0 ? '#d32f2f' : '#2e7d32', fontWeight: 600 }}>
                    {fmt(params.value)}
                  </span>
                ) : (
                  '—'
                ),
            } as CustomGridColDef,
            {
              field: 'margin',
              headerName: 'Margin',
              width: 90,
              type: 'number',
              align: 'right',
              headerAlign: 'right',
              sortable: false,
              filterable: false,
              valueGetter: (_: unknown, row: Purchase) =>
                isSold(row.status) && row.soldPrice > 0 ? (row.profit / row.soldPrice) * 100 : null,
              renderCell: (params) =>
                params.value == null ? (
                  '—'
                ) : (
                  <span style={{ color: params.value < 0 ? '#d32f2f' : '#2e7d32', fontWeight: 600 }}>
                    {`${Number(params.value).toFixed(1)}%`}
                  </span>
                ),
            } as CustomGridColDef,
          ]),

      // ── Status group ──
      ...(statusCollapsed
        ? [
            {
              field: '__status_summary',
              headerName: '',
              width: 230,
              sortable: false,
              filterable: false,
              renderCell: ({ row }: { row: Purchase }) => (
                <Box display="flex" flexDirection="column" justifyContent="center" py={0.5} gap={0.25}>
                  <Typography variant="body2"><b>Inventory Status:</b> {statusLabel(row.status)}</Typography>
                  <Typography variant="body2"><b>Fulfillment Status:</b> {row.fulfillmentStatus ?? ''}</Typography>
                </Box>
              ),
            } as CustomGridColDef,
          ]
        : [
            {
              field: 'status',
              headerName: 'Inventory Status',
              width: 140,
              type: 'singleSelect',
              valueOptions: INVENTORY_STATUS_OPTIONS,
              valueFormatter: (v: string | null) => statusLabel(v),
            } as CustomGridColDef,
            {
              field: 'fulfillmentStatus',
              headerName: 'Fulfillment Status',
              width: 150,
              type: 'singleSelect',
              valueOptions: FULFILLMENT_STATUS_OPTIONS,
              valueFormatter: (v: string | null) => v ?? '',
            } as CustomGridColDef,
          ]),
    ];
  }, [collapsedGroups]);

  const columnGroupingModel = useMemo((): GridColumnGroupingModel => {
    const eventCollapsed    = collapsedGroups.has(G_EVENT);
    const purchaseCollapsed = collapsedGroups.has(G_PURCHASE);
    const ticketCollapsed   = collapsedGroups.has(G_TICKET);
    const finCollapsed      = collapsedGroups.has(G_FINANCIAL);
    const statusCollapsed   = collapsedGroups.has(G_STATUS);

    return [
      {
        groupId: G_PURCHASE,
        renderHeaderGroup: () => (
          <GroupHeader label="Purchase Info" groupId={G_PURCHASE} collapsed={purchaseCollapsed} onToggle={toggleGroup} />
        ),
        children: purchaseCollapsed
          ? [{ field: '__purchase_summary' }]
          : [{ field: 'purchaseId' }, { field: 'orderId' }, { field: 'inventoryId' }, { field: 'createdAt' }],
      },
      {
        groupId: G_EVENT,
        renderHeaderGroup: () => (
          <GroupHeader label="Event Info" groupId={G_EVENT} collapsed={eventCollapsed} onToggle={toggleGroup} />
        ),
        children: eventCollapsed
          ? [{ field: '__event_summary' }]
          : [{ field: 'eventId' }, { field: 'eventName' }, { field: 'venueName' }, { field: 'eventDate' }],
      },
      {
        groupId: G_TICKET,
        renderHeaderGroup: () => (
          <GroupHeader label="Ticket Details" groupId={G_TICKET} collapsed={ticketCollapsed} onToggle={toggleGroup} />
        ),
        children: ticketCollapsed
          ? [{ field: '__ticket_summary' }]
          : [{ field: 'section' }, { field: 'row' }, { field: 'quantity' }],
      },
      {
        groupId: G_FINANCIAL,
        renderHeaderGroup: () => (
          <GroupHeader label="Financials" groupId={G_FINANCIAL} collapsed={finCollapsed} onToggle={toggleGroup} />
        ),
        children: finCollapsed
          ? [{ field: '__fin_summary' }]
          : [{ field: 'pricePerTicket' }, { field: 'totalCost' }, { field: 'soldPrice' }, { field: 'profit' }, { field: 'margin' }],
      },
      {
        groupId: G_STATUS,
        renderHeaderGroup: () => (
          <GroupHeader label="Status" groupId={G_STATUS} collapsed={statusCollapsed} onToggle={toggleGroup} />
        ),
        children: statusCollapsed
          ? [{ field: '__status_summary' }]
          : [{ field: 'status' }, { field: 'fulfillmentStatus' }],
      },
    ];
  }, [collapsedGroups, toggleGroup]);

  // ── Data fetching (via dashboard slice) ────────────────────────────────────
  const fetchPurchases = useCallback(() => {
    const options = {
      page: paginationModel.page,
      pageSize: paginationModel.pageSize,
      sortFields: sortingModel,
      filters: filterModel,
    };
    dispatch(getDashboardPurchases({ dateRange, options }));
    dispatch(getDashboardPurchasesSummary({ dateRange, options }));
  }, [dispatch, dateRange, paginationModel, sortingModel, filterModel]);

  useEffect(() => { fetchPurchases(); }, [fetchPurchases]);

  // Reset page on date or filter change
  useEffect(() => {
    setPaginationModel((p) => ({ ...p, page: 0 }));
  }, [dateRange, filterModel]);

  // Row height: each collapsed group stacks its values vertically.
  // Event=3 lines, Purchase=3 lines, Ticket=3 lines, Financials=2 lines.
  const LINE_H = 28; // px per stacked line (body2 font size)
  const PADDING = 12; // top+bottom cell padding
  const collapsedLineCount = useMemo(() => {
    let max = 0;
    if (collapsedGroups.has(G_EVENT))     max = Math.max(max, 3);
    if (collapsedGroups.has(G_PURCHASE))  max = Math.max(max, 3);
    if (collapsedGroups.has(G_TICKET))    max = Math.max(max, 3);
    if (collapsedGroups.has(G_FINANCIAL)) max = Math.max(max, 5);
    if (collapsedGroups.has(G_STATUS))    max = Math.max(max, 2);
    return max;
  }, [collapsedGroups]);

  const anyCollapsed = collapsedLineCount > 0;

  const footerSummary = (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="flex-end"
      flexWrap="wrap"
      gap={1.5}
      px={1}
      py={0.75}
    >
      <Typography variant="body2" color="text.secondary">
        Purchases: <b>{totalCount.toLocaleString()}</b>
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Qty: <b>{(summary?.totalQty ?? 0).toLocaleString()}</b>
      </Typography>
      <Box display="flex" alignItems="center" gap={0.25}>
        <Typography variant="body2" color="text.secondary">
          Cost: <b style={{ color: '#1565c0' }}>{fmt(summary?.totalCost ?? 0)}</b>
        </Typography>
        <Tooltip title="Total amount spent buying tickets in this date range.">
          <IconButton size="small" sx={{ p: 0.25 }}>
            <InfoOutlinedIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
          </IconButton>
        </Tooltip>
      </Box>
      <Box display="flex" alignItems="center" gap={0.25}>
        <Typography variant="body2" color="text.secondary">
          Sale: <b style={{ color: '#2e7d32' }}>{fmt(summary?.totalSale ?? 0)}</b>
        </Typography>
        <Tooltip title="Revenue from tickets bought in this date range that have sold so far (any sale date).">
          <IconButton size="small" sx={{ p: 0.25 }}>
            <InfoOutlinedIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
          </IconButton>
        </Tooltip>
      </Box>
      <Box display="flex" alignItems="center" gap={0.25}>
        <Typography variant="body2" color="text.secondary">
          Profit:{' '}
          <b style={{ color: (summary?.totalProfit ?? 0) < 0 ? '#d32f2f' : '#2e7d32' }}>
            {fmt(summary?.totalProfit ?? 0)}
          </b>
        </Typography>
        <Tooltip title="Sale minus Cost for tickets PURCHASED in this date range (sold items only). Differs from Sales Profit, which is based on tickets SOLD in this date range.">
          <IconButton size="small" sx={{ p: 0.25 }}>
            <InfoOutlinedIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
          </IconButton>
        </Tooltip>
      </Box>
      <Box display="flex" alignItems="center" gap={0.25}>
        <Typography variant="body2" color="text.secondary">
          Margin:{' '}
          <b style={{ color: (summary?.totalProfit ?? 0) < 0 ? '#d32f2f' : '#2e7d32' }}>
            {summary && summary.totalSale > 0
              ? `${((summary.totalProfit / summary.totalSale) * 100).toFixed(1)}%`
              : '—'}
          </b>
        </Typography>
        <Tooltip title="Profit ÷ Sale × 100 (SkyBox calculation).">
          <IconButton size="small" sx={{ p: 0.25 }}>
            <InfoOutlinedIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <CustomDataGrid
      title="Purchases"
      rows={purchases}
      rowCount={totalCount}
      columns={columns}
      columnGroupingModel={columnGroupingModel}
      onRefresh={fetchPurchases}
      isLoading={isLoading}
      error={error ? new Error(error) : null}
      paginationModel={paginationModel}
      setPaginationModel={setPaginationModel}
      sortingModel={sortingModel}
      setSortingModel={setSortingModel}
      filterModel={filterModel}
      setFilterModel={setFilterModel}
      paginationMode="server"
      sortingMode="server"
      height={600}
      initialShowFilters={false}
      defaultFilterType="header"
      footerSummary={footerSummary}
      {...(anyCollapsed ? { getRowHeight: () => collapsedLineCount * LINE_H + PADDING } : {})}
    />
  );
}
