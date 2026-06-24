import { Button, Typography } from "@mui/material";

import type { CustomGridColDef } from "../shared/types/mui.type";
import { formatDateTime } from "../shared/utils/dateTime.util";
import TradeInfoButton from "../components/trades/TradeInfoButton";

// ── Listings columns ──────────────────────────────────────────────────────────
export function getListingColumns(
  onBuyClick: (row: any) => void,
): CustomGridColDef[] {
  return [
    {
      field: "zone_name",
      headerName: "Zone",
      type: "string",
      width: 120,
    },
    {
      field: "section_name",
      headerName: "Section",
      type: "string",
      flex: 1,
      minWidth: 120,
    },
    {
      field: "row",
      headerName: "Row",
      type: "string",
      width: 80,
    },
    {
      field: "quantity",
      headerName: "Qty",
      type: "number",
      width: 60,
      min: 1,
      max: 60,
    },
    {
      field: "price",
      headerName: "Price",
      type: "number",
      width: 80,
      min: 0,
      max: 10000,
      valueFormatter: (value: any) => (value ? `$${value}` : "-"),
    },
    {
      field: "actions",
      type: "actions",
      headerName: "",
      width: 80,
      sortable: false,
      filterable: false,
      getActions: (params: any) => [
        <Button
          key={params.row.id}
          size="small"
          variant="contained"
          onClick={() => onBuyClick(params.row)}
          sx={{ textTransform: "none", borderRadius: 2, fontSize: "0.75rem" }}
        >
          Buy
        </Button>,
      ],
    },
  ];
}

// ── Trade recommendation columns ──────────────────────────────────────────────
export function getTradeColumns(onBuyClick: (row: any) => void): CustomGridColDef[] {
  return [
    {
      field: "__info",
      headerName: "",
      width: 60,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params: any) => <TradeInfoButton trade={params.row} />,
    },
    {
      field: "vs_section",
      headerName: "Section",
      type: "string",
      flex: 1,
      minWidth: 100,
    },
    {
      field: "row",
      headerName: "Row",
      type: "string",
      width: 60,
    },
    {
      field: "quantity",
      headerName: "Qty",
      type: "number",
      width: 50,
      min: 1,
      max: 60,
    },
    {
      field: "confidence_level",
      headerName: "Signal",
      type: "singleSelect",
      valueOptions: ["BUY", "STRONG_BUY", "CONVICTION_BUY"],
      width: 130,
      renderCell: (params: any) => {
        const confidence = params.value;
        const color =
          confidence === "CONVICTION_BUY"
            ? "success.main"
            : confidence === "STRONG_BUY"
              ? "warning.main"
              : "error.main";
        return (
          <Typography variant="body2" fontWeight={600} color={color}>
            {confidence ?? "-"}
          </Typography>
        );
      },
    },
    {
      field: "created_at",
      headerName: "Date",
      type: "dateTime",
      width: 140,
      valueGetter: (value: any) => (value ? new Date(value) : null),
      valueFormatter: (value: any) => (value ? formatDateTime(value) : "-"),
    },
    {
      field: "actions",
      headerName: "",
      type: "actions",
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params: any) => {
        const trade = params.row;
        if (!trade.event_id || !trade.listing_id) return null;
        return (
          <Button
            variant="contained"
            size="small"
            onClick={(e: any) => {
              e.stopPropagation();
              onBuyClick(trade);
            }}
            sx={{ textTransform: "none", borderRadius: 2, fontSize: "0.75rem" }}
          >
            Buy
          </Button>
        );
      },
    },
  ];
}
