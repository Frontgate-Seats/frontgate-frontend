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
import { IconButton, Tooltip, Typography, Box } from '@mui/material';
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
import supabaseClient from '../../clients/supabase.client';
import moment from 'moment';
import CustomDataGrid from '../common/datagrid/CustomDatagrid';

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
  const [sales, setSales]               = useState<Sale[]>([]);
  const [totalCount, setTotalCount]     = useState(0);
  const [isLoading, setIsLoading]       = useState(false);
  const [error, setError]               = useState<Error | null>(null);
  const [collapsedGroups, setCollapsed] = useState<Set<string>>(new Set([G_EVENT, G_TICKET, G_FINANCIAL, G_STATUS]));

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
    const eventCollapsed  = collapsedGroups.has(G_EVENT);
    const ticketCollapsed = collapsedGroups.has(G_TICKET);
    const finCollapsed    = collapsedGroups.has(G_FINANCIAL);
    const statusCollapsed = collapsedGroups.has(G_STATUS);

    return [
      // ── always visible: Sale Date + Order ID only ──
      {
        field: 'saleDate',
        headerName: 'Sale Date',
        width: 175,
        valueFormatter: (v: string) => moment(v).format('MMM DD, YYYY HH:mm'),
      },
      {
        field: 'orderId',
        headerName: 'Order ID',
        width: 120,
      },

      // ── Event Info group ──
      ...(eventCollapsed
        ? [
            {
              field: '__event_summary',
              headerName: 'Event',
              width: 220,
              sortable: false,
              filterable: false,
              renderCell: ({ row }: { row: Sale }) => (
                <Box display="flex" flexDirection="column" justifyContent="center" py={0.5} gap={0.25}>
                  <Typography variant="body2" fontWeight={600} noWrap>{row.eventName}</Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>{row.venueName}</Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {moment(row.eventDate).format('MMM DD, YYYY')}
                  </Typography>
                </Box>
              ),
            } as CustomGridColDef,
          ]
        : [
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
              width: 130,
              valueFormatter: (v: string) => moment(v).format('MMM DD, YYYY'),
            } as CustomGridColDef,
          ]),

      // ── Ticket Details group ──
      ...(ticketCollapsed
        ? [
            {
              field: '__ticket_summary',
              headerName: 'Tickets',
              width: 130,
              sortable: false,
              filterable: false,
              renderCell: ({ row }: { row: Sale }) => (
                <Box display="flex" flexDirection="column" justifyContent="center" py={0.5} gap={0.25}>
                  <Typography variant="body2"><b>Sec:</b> {row.section}</Typography>
                  <Typography variant="body2"><b>Row:</b> {row.row ?? '-'}</Typography>
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
              valueFormatter: (v: string | null) => v ?? '-',
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
              headerName: 'Financials',
              width: 160,
              sortable: false,
              filterable: false,
              renderCell: ({ row }: { row: Sale }) => (
                <Box display="flex" flexDirection="column" justifyContent="center" py={0.5} gap={0.25}>
                  <Typography variant="body2"><b>Sale/Tkt:</b> {fmt(row.salePricePerTicket)}</Typography>
                  <Typography variant="body2"><b>Total:</b> {fmt(row.totalSaleValue)}</Typography>
                  <Typography variant="body2" sx={{ color: row.profitLoss < 0 ? '#d32f2f' : '#2e7d32', fontWeight: 600 }}>
                    <b>P&L:</b> {fmt(row.profitLoss)}
                  </Typography>
                </Box>
              ),
            } as CustomGridColDef,
          ]
        : [
            {
              field: 'salePricePerTicket',
              headerName: 'Sale/Ticket',
              width: 120,
              type: 'number',
              align: 'right',
              headerAlign: 'right',
              valueFormatter: (v: number) => fmt(v),
            } as CustomGridColDef,
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
              headerName: 'Status',
              width: 160,
              sortable: false,
              filterable: false,
              renderCell: ({ row }: { row: Sale }) => (
                <Box display="flex" flexDirection="column" justifyContent="center" py={0.5} gap={0.25}>
                  <Typography variant="body2">{row.fulfillmentStatus ?? '-'}</Typography>
                </Box>
              ),
            } as CustomGridColDef,
          ]
        : [
            {
              field: 'fulfillmentStatus',
              headerName: 'Fulfillment Status',
              width: 150,
              valueFormatter: (v: string | null) => v ?? '-',
            } as CustomGridColDef,
          ]),
    ];
  }, [collapsedGroups]);

  const columnGroupingModel = useMemo((): GridColumnGroupingModel => {
    const eventCollapsed  = collapsedGroups.has(G_EVENT);
    const ticketCollapsed = collapsedGroups.has(G_TICKET);
    const finCollapsed    = collapsedGroups.has(G_FINANCIAL);
    const statusCollapsed = collapsedGroups.has(G_STATUS);

    return [
      {
        groupId: G_EVENT,
        renderHeaderGroup: () => (
          <GroupHeader label="Event Info" groupId={G_EVENT} collapsed={eventCollapsed} onToggle={toggleGroup} />
        ),
        children: eventCollapsed
          ? [{ field: '__event_summary' }]
          : [{ field: 'eventName' }, { field: 'venueName' }, { field: 'eventDate' }],
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
          : [{ field: 'salePricePerTicket' }, { field: 'totalSaleValue' }, { field: 'profitLoss' }],
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

  // ── Data fetching ─────────────────────────────────────────────────────────
  const fetchSales = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const offset    = paginationModel.page * paginationModel.pageSize;
      const sortField = sortingModel[0]?.field ?? 'saleDate';
      const ascending = sortingModel[0]?.sort === 'asc';

      const fieldMap: Record<string, string> = {
        saleDate:           'invoice_date',
        orderId:            'order_id',
        eventName:          'event_name',
        venueName:          'venue_name',
        eventDate:          'event_utc_date',
        section:            'section',
        row:                'row',
        quantitySold:       'quantity_sold',
        salePricePerTicket: 'sale_total',
        totalSaleValue:     'sale_total',
        profitLoss:         'profit',
        fulfillmentStatus:  'fulfillment_status',
      };

      const { data, error: qErr, count } = await supabaseClient
        .from('sold_inventory')
        .select(
          `id, invoice_date, order_id, event_name, venue_name, section, row,
           quantity_sold, sale_total, profit, event_utc_date,
           fulfillment_status`,
          { count: 'exact' },
        )
        .gte('invoice_date', dateRange.startDate.toISOString())
        .lte('invoice_date', dateRange.endDate.toISOString())
        .order(fieldMap[sortField] ?? 'invoice_date', { ascending })
        .range(offset, offset + paginationModel.pageSize - 1);

      if (qErr) throw qErr;

      const mapped: Sale[] = (data ?? []).map((r) => ({
        id:                r.id,
        saleDate:          r.invoice_date,
        orderId:           r.order_id,
        eventName:         r.event_name,
        venueName:         r.venue_name,
        section:           r.section,
        row:               r.row,
        quantitySold:      r.quantity_sold,
        salePricePerTicket:
          r.quantity_sold > 0
            ? parseFloat(r.sale_total) / r.quantity_sold
            : 0,
        totalSaleValue:    parseFloat(r.sale_total),
        profitLoss:        parseFloat(r.profit),
        eventDate:         r.event_utc_date,
        fulfillmentStatus: r.fulfillment_status ?? null,
      }));

      setSales(mapped);
      setTotalCount(count ?? 0);
    } catch (err) {
      console.error('SalesTable fetch error:', err);
      setError(err as Error);
      setSales([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, paginationModel, sortingModel]);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  useEffect(() => {
    setPaginationModel((p) => ({ ...p, page: 0 }));
  }, [dateRange]);

  // Row height: each collapsed group stacks its values vertically.
  // Event=2 lines, Ticket=3 lines, Financials=3 lines. Use the max across
  // all collapsed groups (all groups share one row height).
  const LINE_H = 28; // px per stacked line (body2 font size)
  const PADDING = 12; // top+bottom cell padding
  const collapsedLineCount = useMemo(() => {
    let max = 0;
    if (collapsedGroups.has(G_EVENT))     max = Math.max(max, 3);
    if (collapsedGroups.has(G_TICKET))    max = Math.max(max, 3);
    if (collapsedGroups.has(G_FINANCIAL)) max = Math.max(max, 3);
    if (collapsedGroups.has(G_STATUS))    max = Math.max(max, 1);
    return max;
  }, [collapsedGroups]);

  const anyCollapsed = collapsedLineCount > 0;

  return (
    <CustomDataGrid
      title="Sales"
      rows={sales}
      rowCount={totalCount}
      columns={columns}
      columnGroupingModel={columnGroupingModel}
      onRefresh={fetchSales}
      isLoading={isLoading}
      error={error}
      paginationModel={paginationModel}
      setPaginationModel={setPaginationModel}
      sortingModel={sortingModel}
      setSortingModel={setSortingModel}
      filterModel={filterModel}
      setFilterModel={setFilterModel}
      paginationMode="server"
      sortingMode="server"
      height={600}
      defaultFilterType="header"
      initialShowFilters={false}
      {...(anyCollapsed ? { getRowHeight: () => collapsedLineCount * LINE_H + PADDING } : {})}
    />
  );
}
