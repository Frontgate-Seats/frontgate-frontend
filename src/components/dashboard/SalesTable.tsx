/**
 * SalesTable
 *
 * Server-side paginated / sorted table of sold_inventory records.
 * Uses CustomDataGrid with collapsible column groups:
 *
 *  ┌─ Event Info ──────────┐  ┌─ Ticket Details ──────┐  ┌─ Financials ──────────────────┐
 *  │ Event Name  │ Venue   │  │ Section │ Row │ Qty   │  │ Sale/Tkt │ Total  │ P&L       │
 *  └────────────────────────┘  └────────────────────────┘  └───────────────────────────────┘
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IconButton, Tooltip, Typography, Box } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type {
  GridPaginationModel,
  GridSortModel,
  GridFilterModel,
  GridColumnGroupingModel,
} from '@mui/x-data-grid';
import type { CustomGridColDef } from '../../shared/types/mui.type';
import type { Sale, SalesTableProps } from '../../types/dashboard.types';
import type { AppDispatch, RootState } from '../../store';
import {
  getDashboardSales,
  getDashboardSalesSummary,
} from '../../store/slices/dashboard.slice';
import moment from 'moment';
import { DATE_TIME_FORMAT } from '../../shared/utils/dateTime.util';
import CustomDataGrid from '../common/datagrid/CustomDatagrid';

const G_SALE      = 'g_sale';
const G_EVENT     = 'g_event';
const G_TICKET    = 'g_ticket';
const G_FINANCIAL = 'g_financial';
const G_STATUS    = 'g_status';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

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

export default function SalesTable({
  dateRange,
  pageSize = 50,
}: SalesTableProps) {
  const dispatch = useDispatch<AppDispatch>();
  const {
    sales: { data: sales, total: totalCount },
    salesLoading: isLoading,
    salesSummary: summary,
    error,
  } = useSelector((state: RootState) => state.dashboard);

  // Groups start collapsed (compact stacked summary); users expand via chevron.
  const [collapsedGroups, setCollapsed] = useState<Set<string>>(
    new Set([G_SALE, G_EVENT, G_TICKET, G_FINANCIAL, G_STATUS]),
  );

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize,
  });
  const [sortingModel, setSortingModel] = useState<GridSortModel>([
    { field: 'saleDate', sort: 'desc' },
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
    const saleCollapsed   = collapsedGroups.has(G_SALE);
    const eventCollapsed  = collapsedGroups.has(G_EVENT);
    const ticketCollapsed = collapsedGroups.has(G_TICKET);
    const finCollapsed    = collapsedGroups.has(G_FINANCIAL);
    const statusCollapsed = collapsedGroups.has(G_STATUS);

    const poLink = (pid: string) => (
      <Box
        key={pid}
        component="span"
        sx={{ color: 'primary.main', cursor: 'pointer', textDecoration: 'underline' }}
        onClick={(e) => { e.stopPropagation(); window.open(`https://skybox.vividseats.com/purchases/${pid}`, '_blank'); }}
      >
        {pid}
      </Box>
    );

    return [
      // ── Sale Info group — FIRST ──
      ...(saleCollapsed
        ? [
            {
              field: '__sale_summary',
              headerName: '',
              width: 220,
              sortable: false,
              filterable: false,
              renderCell: ({ row }: { row: Sale }) => (
                <Box display="flex" flexDirection="column" justifyContent="center" py={0.5} gap={0.25}>
                  <Typography variant="body2" noWrap>
                    <b>PO ID:</b>{' '}
                    {row.purchaseIds.length
                      ? row.purchaseIds.map((p, i) => (
                          <span key={p}>{i > 0 ? ', ' : ''}{poLink(p)}</span>
                        ))
                      : '—'}
                  </Typography>
                  <Typography variant="body2" noWrap><b>Ext Ref:</b> {row.orderId ?? ''}</Typography>
                  <Typography variant="body2" noWrap><b>Inventory ID:</b> {row.inventoryId ?? ''}</Typography>
                  <Typography variant="body2" noWrap><b>Invoice Date:</b> {row.invoiceDate ? moment(row.invoiceDate).format(DATE_TIME_FORMAT) : ''}</Typography>
                  <Typography variant="body2" noWrap><b>Sale Date:</b> {row.saleDate ? moment(row.saleDate).format(DATE_TIME_FORMAT) : ''}</Typography>
                </Box>
              ),
            } as CustomGridColDef,
          ]
        : [
            {
              field: 'purchaseIds',
              headerName: 'PO ID',
              width: 120,
              sortable: false,
              renderCell: ({ row }: { row: Sale }) =>
                row.purchaseIds.length
                  ? row.purchaseIds.map((p, i) => (
                      <span key={p}>{i > 0 ? ', ' : ''}{poLink(p)}</span>
                    ))
                  : null,
            } as CustomGridColDef,
            {
              field: 'orderId',
              headerName: 'Ext Ref',
              width: 130,
            } as CustomGridColDef,
            {
              field: 'inventoryId',
              headerName: 'Inventory ID',
              width: 120,
              valueFormatter: (v: string | null) => v ?? '',
            } as CustomGridColDef,
            {
              field: 'invoiceDate',
              headerName: 'Invoice Date',
              width: 175,
              valueFormatter: (v: string) => v ? moment(v).format(DATE_TIME_FORMAT) : '',
            } as CustomGridColDef,
            {
              field: 'saleDate',
              headerName: 'Sale Date',
              width: 175,
              valueFormatter: (v: string) => v ? moment(v).format(DATE_TIME_FORMAT) : '',
            } as CustomGridColDef,
          ]),

      // ── Event Info group ──
      ...(eventCollapsed
        ? [
            {
              field: '__event_summary',
              headerName: '',
              width: 260,
              sortable: false,
              filterable: false,
              renderCell: ({ row }: { row: Sale }) => (
                <Box display="flex" flexDirection="column" justifyContent="center" py={0.5} gap={0.25}>
                  <Typography variant="body2" noWrap>
                    <b>Event ID:</b>{' '}
                    {row.eventId ? (
                      <Box
                        component="span"
                        sx={{ color: 'primary.main', fontWeight: 400, cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={(e) => { e.stopPropagation(); window.open(`https://www.vividseats.com/production/${row.eventId}`, '_blank'); }}
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
              sortable: false,
              renderCell: ({ row }: { row: Sale }) =>
                row.eventId ? (
                  <Box display="flex" alignItems="center" gap={0.25}>
                    <Typography variant="body2" noWrap>{row.eventId}</Typography>
                    <Tooltip title="Open on Vivid Seats">
                      <IconButton size="small" sx={{ p: 0.25 }} onClick={(e) => { e.stopPropagation(); window.open(`https://www.vividseats.com/production/${row.eventId}`, '_blank'); }}>
                        <OpenInNewIcon sx={{ fontSize: 13 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                ) : null,
            } as CustomGridColDef,
            {
              field: 'eventName',
              headerName: 'Event Name',
              width: 220,
              flex: 1,
            } as CustomGridColDef,
            {
              field: 'venueName',
              headerName: 'Venue',
              width: 180,
            } as CustomGridColDef,
            {
              field: 'eventDate',
              headerName: 'Event Date',
              width: 150,
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
              renderCell: ({ row }: { row: Sale }) => (
                <Box display="flex" flexDirection="column" justifyContent="center" py={0.5} gap={0.25}>
                  <Typography variant="body2"><b>Section:</b> {row.section}</Typography>
                  <Typography variant="body2"><b>Row:</b> {row.row ?? ''}</Typography>
                  <Typography variant="body2"><b>Qty:</b> {row.quantitySold}</Typography>
                </Box>
              ),
            } as CustomGridColDef,
          ]
        : [
            {
              field: 'section',
              headerName: 'Section',
              width: 90,
            } as CustomGridColDef,
            {
              field: 'row',
              headerName: 'Row',
              width: 70,
              valueFormatter: (v: string | null) => v ?? '',
            } as CustomGridColDef,
            {
              field: 'quantitySold',
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
              renderCell: ({ row }: { row: Sale }) => (
                <Box display="flex" flexDirection="column" justifyContent="center" py={0.5} gap={0.25}>
                  <Typography variant="body2"><b>Total Sale:</b> {fmt(row.totalSaleValue)}</Typography>
                  <Typography variant="body2" sx={{ color: row.profitLoss < 0 ? '#d32f2f' : '#2e7d32', fontWeight: 600 }}>
                    <b>P&L:</b> {fmt(row.profitLoss)}
                  </Typography>
                </Box>
              ),
            } as CustomGridColDef,
          ]
        : [
            {
              field: 'totalSaleValue',
              headerName: 'Total Sale',
              width: 120,
              type: 'number',
              align: 'right',
              headerAlign: 'right',
              valueFormatter: (v: number) => fmt(v),
            } as CustomGridColDef,
            {
              field: 'profitLoss',
              headerName: 'P&L',
              width: 120,
              type: 'number',
              align: 'right',
              headerAlign: 'right',
              renderCell: (params) => (
                <span
                  style={{
                    color:      params.value < 0 ? '#d32f2f' : '#2e7d32',
                    fontWeight: 'bold',
                  }}
                >
                  {fmt(params.value)}
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
              renderCell: ({ row }: { row: Sale }) => (
                <Box display="flex" flexDirection="column" justifyContent="center" py={0.5} gap={0.25}>
                  <Typography variant="body2"><b>Fulfillment Status:</b> {row.fulfillmentStatus ?? ''}</Typography>
                </Box>
              ),
            } as CustomGridColDef,
          ]
        : [
            {
              field: 'fulfillmentStatus',
              headerName: 'Fulfillment Status',
              width: 150,
              valueFormatter: (v: string | null) => v ?? '',
            } as CustomGridColDef,
          ]),
    ];
  }, [collapsedGroups]);

  const columnGroupingModel = useMemo((): GridColumnGroupingModel => {
    const saleCollapsed   = collapsedGroups.has(G_SALE);
    const eventCollapsed  = collapsedGroups.has(G_EVENT);
    const ticketCollapsed = collapsedGroups.has(G_TICKET);
    const finCollapsed    = collapsedGroups.has(G_FINANCIAL);
    const statusCollapsed = collapsedGroups.has(G_STATUS);

    return [
      {
        groupId: G_SALE,
        renderHeaderGroup: () => (
          <GroupHeader label="Sale Info" groupId={G_SALE} collapsed={saleCollapsed} onToggle={toggleGroup} />
        ),
        children: saleCollapsed
          ? [{ field: '__sale_summary' }]
          : [{ field: 'purchaseIds' }, { field: 'orderId' }, { field: 'inventoryId' }, { field: 'invoiceDate' }, { field: 'saleDate' }],
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
          : [{ field: 'section' }, { field: 'row' }, { field: 'quantitySold' }],
      },
      {
        groupId: G_FINANCIAL,
        renderHeaderGroup: () => (
          <GroupHeader label="Financials" groupId={G_FINANCIAL} collapsed={finCollapsed} onToggle={toggleGroup} />
        ),
        children: finCollapsed
          ? [{ field: '__fin_summary' }]
          : [{ field: 'totalSaleValue' }, { field: 'profitLoss' }],
      },
      {
        groupId: G_STATUS,
        renderHeaderGroup: () => (
          <GroupHeader label="Status" groupId={G_STATUS} collapsed={statusCollapsed} onToggle={toggleGroup} />
        ),
        children: statusCollapsed
          ? [{ field: '__status_summary' }]
          : [{ field: 'fulfillmentStatus' }],
      },
    ];
  }, [collapsedGroups, toggleGroup]);

  // ── Data fetching (via dashboard slice) ────────────────────────────────────
  const fetchSales = useCallback(() => {
    const options = {
      page: paginationModel.page,
      pageSize: paginationModel.pageSize,
      sortFields: sortingModel,
      filters: filterModel,
    };
    dispatch(getDashboardSales({ dateRange, options }));
    dispatch(getDashboardSalesSummary({ dateRange, options }));
  }, [dispatch, dateRange, paginationModel, sortingModel, filterModel]);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  // Reset page on date or filter change
  useEffect(() => {
    setPaginationModel((p) => ({ ...p, page: 0 }));
  }, [dateRange, filterModel]);

  // Row height: each collapsed group stacks its values vertically.
  // Event=2 lines, Ticket=3 lines, Financials=3 lines. Use the max across
  // all collapsed groups (all groups share one row height).
  const LINE_H = 28; // px per stacked line (body2 font size)
  const PADDING = 12; // top+bottom cell padding
  const collapsedLineCount = useMemo(() => {
    let max = 0;
    if (collapsedGroups.has(G_SALE))      max = Math.max(max, 5);
    if (collapsedGroups.has(G_EVENT))     max = Math.max(max, 4);
    if (collapsedGroups.has(G_TICKET))    max = Math.max(max, 3);
    if (collapsedGroups.has(G_FINANCIAL)) max = Math.max(max, 2);
    if (collapsedGroups.has(G_STATUS))    max = Math.max(max, 1);
    return max;
  }, [collapsedGroups]);

  const anyCollapsed = collapsedLineCount > 0;

  const footerSummary = (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="flex-end"
      flexWrap="wrap"
      gap={3}
      px={1}
      py={0.75}
    >
      <Typography variant="body2" color="text.secondary">
        Sales: <b>{totalCount.toLocaleString()}</b>
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Qty: <b>{(summary?.totalQty ?? 0).toLocaleString()}</b>
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Sale: <b style={{ color: '#2e7d32' }}>{fmt(summary?.totalSale ?? 0)}</b>
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Profit:{' '}
        <b style={{ color: (summary?.totalProfit ?? 0) < 0 ? '#d32f2f' : '#2e7d32' }}>
          {fmt(summary?.totalProfit ?? 0)}
        </b>
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Margin:{' '}
        <b style={{ color: (summary?.totalProfit ?? 0) < 0 ? '#d32f2f' : '#2e7d32' }}>
          {summary && summary.totalSale > 0
            ? `${((summary.totalProfit / summary.totalSale) * 100).toFixed(1)}%`
            : '—'}
        </b>
      </Typography>
    </Box>
  );

  return (
    <CustomDataGrid
      title="Sales"
      rows={sales}
      rowCount={totalCount}
      columns={columns}
      columnGroupingModel={columnGroupingModel}
      onRefresh={fetchSales}
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
      defaultFilterType="custom"
      footerSummary={footerSummary}
      {...(anyCollapsed ? { getRowHeight: () => collapsedLineCount * LINE_H + PADDING } : {})}
    />
  );
}
