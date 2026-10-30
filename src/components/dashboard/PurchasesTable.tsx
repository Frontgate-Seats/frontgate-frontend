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
import type { Purchase, PurchasesTableProps } from '../../types/dashboard.types';
import supabaseClient from '../../clients/supabase.client';
import moment from 'moment';
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
  pageSize = 50,
}: PurchasesTableProps) {
  const [purchases, setPurchases]         = useState<Purchase[]>([]);
  const [totalCount, setTotalCount]       = useState(0);
  const [isLoading, setIsLoading]         = useState(false);
  const [error, setError]                 = useState<Error | null>(null);
  const [collapsedGroups, setCollapsed]   = useState<Set<string>>(new Set([G_EVENT, G_PURCHASE, G_TICKET, G_FINANCIAL, G_STATUS]));

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
      // ── Event Info group ──
      ...(eventCollapsed
        ? [
            {
              field: '__event_summary',
              headerName: 'Event',
              width: 220,
              sortable: false,
              filterable: false,
              renderCell: ({ row }: { row: Purchase }) => (
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

      // ── Purchase Info group ──
      ...(purchaseCollapsed
        ? [
            {
              field: '__purchase_summary',
              headerName: 'Purchase',
              width: 160,
              sortable: false,
              filterable: false,
              renderCell: ({ row }: { row: Purchase }) => (
                <Box display="flex" flexDirection="column" justifyContent="center" py={0.5} gap={0.25}>
                  <Typography variant="body2"><b>ID:</b> {row.id}</Typography>
                  <Typography variant="body2"><b>Ref:</b> {row.orderId ?? '-'}</Typography>
                  <Typography variant="body2"><b>Date:</b> {moment(row.createdAt).format('MMM DD, YYYY')}</Typography>
                </Box>
              ),
            } as CustomGridColDef,
          ]
        : [
            {
              field: 'id',
              headerName: 'Purchase ID',
              width: 110,
            } as CustomGridColDef,
            {
              field: 'orderId',
              headerName: 'External Ref',
              width: 130,
              valueFormatter: (v: string | null) => v ?? '-',
            } as CustomGridColDef,
            {
              field: 'createdAt',
              headerName: 'Purchase Date',
              width: 175,
              valueFormatter: (v: string) => moment(v).format('MMM DD, YYYY HH:mm'),
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
              renderCell: ({ row }: { row: Purchase }) => (
                <Box display="flex" flexDirection="column" justifyContent="center" py={0.5} gap={0.25}>
                  <Typography variant="body2"><b>Sec:</b> {row.section}</Typography>
                  <Typography variant="body2"><b>Row:</b> {row.row ?? '-'}</Typography>
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
            } as CustomGridColDef,
            {
              field: 'row',
              headerName: 'Row',
              width: 70,
              valueFormatter: (v: string | null) => v ?? '-',
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
              headerName: 'Financials',
              width: 140,
              sortable: false,
              filterable: false,
              renderCell: ({ row }: { row: Purchase }) => (
                <Box display="flex" flexDirection="column" justifyContent="center" py={0.5} gap={0.25}>
                  <Typography variant="body2"><b>Cost/Tkt:</b> {fmt(row.pricePerTicket)}</Typography>
                  <Typography variant="body2"><b>Total:</b> {fmt(row.totalCost)}</Typography>
                </Box>
              ),
            } as CustomGridColDef,
          ]
        : [
            {
              field: 'pricePerTicket',
              headerName: 'Cost/Ticket',
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
          ]),

      // ── Status group ──
      ...(statusCollapsed
        ? [
            {
              field: '__status_summary',
              headerName: 'Status',
              width: 150,
              sortable: false,
              filterable: false,
              renderCell: ({ row }: { row: Purchase }) => (
                <Box display="flex" flexDirection="column" justifyContent="center" py={0.5} gap={0.25}>
                  <Typography variant="body2"><b>Inv:</b> {row.status ?? '-'}</Typography>
                  <Typography variant="body2"><b>Fulfil:</b> {row.fulfillmentStatus ?? 'Pending'}</Typography>
                </Box>
              ),
            } as CustomGridColDef,
          ]
        : [
            {
              field: 'status',
              headerName: 'Inventory Status',
              width: 140,
            } as CustomGridColDef,
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
    const eventCollapsed    = collapsedGroups.has(G_EVENT);
    const purchaseCollapsed = collapsedGroups.has(G_PURCHASE);
    const ticketCollapsed   = collapsedGroups.has(G_TICKET);
    const finCollapsed      = collapsedGroups.has(G_FINANCIAL);
    const statusCollapsed   = collapsedGroups.has(G_STATUS);

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
        groupId: G_PURCHASE,
        renderHeaderGroup: () => (
          <GroupHeader label="Purchase Info" groupId={G_PURCHASE} collapsed={purchaseCollapsed} onToggle={toggleGroup} />
        ),
        children: purchaseCollapsed
          ? [{ field: '__purchase_summary' }]
          : [{ field: 'id' }, { field: 'orderId' }, { field: 'createdAt' }],
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
          : [{ field: 'pricePerTicket' }, { field: 'totalCost' }],
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

  // ── Data fetching ─────────────────────────────────────────────────────────
  const fetchPurchases = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const offset    = paginationModel.page * paginationModel.pageSize;
      const sortField = sortingModel[0]?.field ?? 'createdAt';
      const ascending = sortingModel[0]?.sort === 'asc';

      const fieldMap: Record<string, string> = {
        createdAt:      'created_at',
        orderId:        'order_id',
        eventName:      'event_name',
        venueName:      'venue_name',
        eventDate:      'event_utc_date',
        section:        'section',
        row:            'row',
        quantity:       'quantity',
        pricePerTicket: 'price_per',
        totalCost:      'total_amount',
        status:         'inventory_status',
        fulfillmentStatus: 'fulfillment_status',
      };

      const { data, error: qErr, count } = await supabaseClient
        .from('inventory')
        .select(
          `id, created_at, order_id, event_name, venue_name, section, row,
           quantity, price_per, total_amount, event_utc_date, inventory_status,
           fulfillment_status`,
          { count: 'exact' },
        )
        .gte('created_at', dateRange.startDate.toISOString())
        .lte('created_at', dateRange.endDate.toISOString())
        .order(fieldMap[sortField] ?? 'created_at', { ascending })
        .range(offset, offset + paginationModel.pageSize - 1);

      if (qErr) throw qErr;

      const mapped: Purchase[] = (data ?? []).map((r) => ({
        id:             r.id,
        createdAt:      r.created_at,
        orderId:        r.order_id ?? null,
        eventName:      r.event_name,
        venueName:      r.venue_name,
        section:        r.section,
        row:            r.row,
        quantity:       r.quantity,
        pricePerTicket: parseFloat(r.price_per),
        totalCost:      parseFloat(r.total_amount),
        eventDate:      r.event_utc_date,
        status:         r.inventory_status,
        fulfillmentStatus: r.fulfillment_status ?? null,
      }));

      setPurchases(mapped);
      setTotalCount(count ?? 0);
    } catch (err) {
      console.error('PurchasesTable fetch error:', err);
      setError(err as Error);
      setPurchases([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, paginationModel, sortingModel]);

  useEffect(() => { fetchPurchases(); }, [fetchPurchases]);

  // Reset page on date change
  useEffect(() => {
    setPaginationModel((p) => ({ ...p, page: 0 }));
  }, [dateRange]);

  // Row height: each collapsed group stacks its values vertically.
  // Event=3 lines, Purchase=3 lines, Ticket=3 lines, Financials=2 lines.
  const LINE_H = 28; // px per stacked line (body2 font size)
  const PADDING = 12; // top+bottom cell padding
  const collapsedLineCount = useMemo(() => {
    let max = 0;
    if (collapsedGroups.has(G_EVENT))     max = Math.max(max, 3);
    if (collapsedGroups.has(G_PURCHASE))  max = Math.max(max, 3);
    if (collapsedGroups.has(G_TICKET))    max = Math.max(max, 3);
    if (collapsedGroups.has(G_FINANCIAL)) max = Math.max(max, 2);
    if (collapsedGroups.has(G_STATUS))    max = Math.max(max, 2);
    return max;
  }, [collapsedGroups]);

  const anyCollapsed = collapsedLineCount > 0;

  return (
    <CustomDataGrid
      title="Purchases"
      rows={purchases}
      rowCount={totalCount}
      columns={columns}
      columnGroupingModel={columnGroupingModel}
      onRefresh={fetchPurchases}
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
