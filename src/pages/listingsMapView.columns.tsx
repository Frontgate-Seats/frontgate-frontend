import { Box, Button, Chip, Tooltip, Typography } from "@mui/material";
import type { CustomGridColDef } from "../shared/types/mui.type";
import { formatDateTime } from "../shared/utils/dateTime.util";
import TradeInfoButton from "../components/trades/TradeInfoButton";
import type { Trade } from "../shared/types/trade.types";

const VIVID_LOGO = "/vivid-logo.ico";

export function getMergedColumns(onBuyClick: (row: any) => void): CustomGridColDef[] {
  return [
    {
      field: "__info",
      headerName: "",
      width: 60,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params: any) => {
        if (!params.row.isRecommendation || !params.row._trade) return null;
        return <TradeInfoButton trade={params.row._trade as Trade} />;
      },
    },
    {
      field: "_source",
      headerName: "Source",
      type: "singleSelect",
      valueOptions: ["recommendations", "vivid", "tfs"],
      width: 75,
      renderCell: (params: any) => {
        const source = params.value || (params.row.isRecommendation ? "recommendations" : "vivid");
        if (source === "tfs") {
          return (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
              <Chip label="TFS" size="small" color="secondary" variant="filled" sx={{ fontSize: "0.65rem", height: 20, fontWeight: 600 }} />
            </Box>
          );
        }
        // Vivid and Recommendations both show Vivid logo
        return (
          <Tooltip title={source === "recommendations" ? "Recommendation (Vivid)" : "Vivid"}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
              <Box component="img" src={VIVID_LOGO} alt="Vivid" sx={{ width: 18, height: 18, objectFit: "contain" }} />
            </Box>
          </Tooltip>
        );
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
    {
      field: "price",
      headerName: "Price",
      type: "number",
      width: 80,
      min: 0,
      max: 10000,
      renderCell: (params: any) => {
        if (params.value == null) return "-";
        return (
          <Typography fontWeight={600} color="text.primary" variant="body2">
            ${Number(params.value).toFixed(2)}
          </Typography>
        );
      },
    },
    {
      field: "projected_sell_price",
      headerName: "Proj. Sell",
      type: "number",
      width: 90,
      min: 0,
      max: 10000,
      renderCell: (params: any) => {
        if (params.value == null) return "-";
        return <Typography color="text.secondary" variant="body2">${Number(params.value).toFixed(2)}</Typography>;
      },
    },
    {
      field: "estimated_margin_percent",
      headerName: "Margin %",
      type: "number",
      width: 80,
      renderCell: (params: any) => {
        if (params.value == null) return "-";
        return (
          <Typography fontWeight={600} color={params.value > 0 ? "success.main" : "error.main"} variant="body2">
            {Number(params.value).toFixed(1)}%
          </Typography>
        );
      },
    },
    {
      field: "confidence_level",
      headerName: "Signal",
      type: "singleSelect",
      valueOptions: ["BUY", "STRONG_BUY", "CONVICTION_BUY"],
      width: 110,
      renderCell: (params: any) => {
        if (!params.value) return "-";
        const color = params.value === "CONVICTION_BUY" ? "success.main" : params.value === "STRONG_BUY" ? "warning.main" : "error.main";
        return <Typography variant="body2" fontWeight={600} color={color}>{params.value}</Typography>;
      },
    },
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
    {
      field: "actions",
      type: "actions",
      headerName: "",
      width: 100,
      sortable: false,
      filterable: false,
      getActions: (params: any) => {
        // No buy button for TFS listings
        if (params.row._source === "tfs") return [];

        if (params.row.isRecommendation && params.row.isListingAvailable === false) {
          return [<Typography key={params.row.id} variant="caption" color="error" fontWeight={600} sx={{ fontSize: "0.65rem" }}>Not Available</Typography>];
        }
        if (!params.row.listingId) return [];
        return [
          <Button key={params.row.id} size="small" variant={"contained"} onClick={() => onBuyClick(params.row)} sx={{ textTransform: "none", borderRadius: 2, fontSize: "0.7rem" }} color="primary">
            Buy
          </Button>,
        ];
      },
    },
  ];
}
