import { Button, Typography, Chip, Box } from "@mui/material";
import type { CustomGridColDef } from "../shared/types/mui.type";
import { formatDateTime } from "../shared/utils/dateTime.util";
import TradeInfoButton from "../components/trades/TradeInfoButton";
import type { Trade } from "../shared/types/trade.types";

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
// ── Merged columns: combines listings + recommendations with buy price, sell price, projection price, recommendation date ─
export function getMergedColumns(onBuyClick: (row: any) => void): CustomGridColDef[] {
  return [
    // Info button for recommendations (with bulb icon for reasoning)
    {
      field: "__info",
      headerName: "",
      width: 50,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params: any) => {
        if (!params.row.isRecommendation || !params.row._trade) return null;
        return <TradeInfoButton trade={params.row._trade as Trade} />;
      },
    },
    {
      field: "section_name",
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
    // Buy Price - only populated for recommendations
    {
      field: "max_buy_price",
      headerName: "Buy Price",
      type: "number",
      width: 90,
      min: 0,
      max: 10000,
      valueGetter: (value: any, row: any) => row.price || row.max_buy_price || null,
      renderCell: (params: any) => {
        if (params.value == null) return "-";
        return (
          <Typography fontWeight={600} color="text.primary" variant="body2">
            ${Number(params.value).toFixed(2)}
          </Typography>
        );
      },
    },
    // Projected Sell Price - only for recommendations
    {
      field: "projected_sell_price",
      headerName: "Proj. Sell",
      type: "number",
      width: 90,
      min: 0,
      max: 10000,
      renderCell: (params: any) => {
        if (params.value == null) return "-";
        return (
          <Typography color="text.secondary" variant="body2">
            ${Number(params.value).toFixed(2)}
          </Typography>
        );
      },
    },
    // Margin % - only for recommendations
    {
      field: "estimated_margin_percent",
      headerName: "Margin %",
      type: "number",
      width: 80,
      renderCell: (params: any) => {
        if (params.value == null) return "-";
        const margin = params.value;
        return (
          <Typography fontWeight={600} color={margin > 0 ? "success.main" : "error.main"} variant="body2">
            {Number(margin).toFixed(1)}%
          </Typography>
        );
      },
    },
    // Confidence/Signal - only for recommendations
    {
      field: "confidence_level",
      headerName: "Signal",
      type: "singleSelect",
      valueOptions: ["BUY", "STRONG_BUY", "CONVICTION_BUY"],
      width: 110,
      renderCell: (params: any) => {
        if (!params.value) return "-";
        const confidence = params.value;
        const color =
          confidence === "CONVICTION_BUY"
            ? "success.main"
            : confidence === "STRONG_BUY"
              ? "warning.main"
              : "error.main";
        return (
          <Typography variant="body2" fontWeight={600} color={color}>
            {confidence}
          </Typography>
        );
      },
    },
    // Recommendation Date - only for recommendations
    {
      field: "recommendation_date",
      headerName: "Rec. Date",
      type: "dateTime",
      width: 130,
      valueGetter: (value: any, row: any) => {
        if (value) return new Date(value);
        if (row._trade?.created_at) return new Date(row._trade.created_at);
        return null;
      },
      valueFormatter: (value: any) => (value ? formatDateTime(value) : "-"),
    },
    // Current listing price (for all rows)
    {
      field: "price",
      headerName: "Price",
      type: "number",
      width: 80,
      min: 0,
      max: 10000,
      renderCell: (params: any) => {
        if (params.value == null) return "-";
        return `$${params.value}`;
      },
    },
    // Buy action button
    {
      field: "actions",
      type: "actions",
      headerName: "",
      width: 100,
      sortable: false,
      filterable: false,
      getActions: (params: any) => {
        const isRecommendation = params.row.isRecommendation;
        const isAvailable = params.row.isListingAvailable !== false;
        
        // If recommendation listing is not in current listings, show "Not Available"
        if (isRecommendation && !isAvailable) {
          return [
            <Typography
              key={params.row.id}
              variant="caption"
              color="error"
              fontWeight={600}
              sx={{ fontSize: "0.65rem" }}
            >
              Not Available
            </Typography>,
          ];
        }

        // Hide button entirely if no real listing ID
        if (!params.row.listingId) return [];

        return [
          <Button
            key={params.row.id}
            size="small"
            variant={isRecommendation ? "contained" : "outlined"}
            onClick={() => onBuyClick(params.row)}
            sx={{ 
              textTransform: "none", 
              borderRadius: 2, 
              fontSize: "0.7rem",
            }}
            color="primary"
          >
            Buy
          </Button>,
        ];
      },
    },
  ];
}