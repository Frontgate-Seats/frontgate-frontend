// ─── Trade comment shape ──────────────────────────────────────────────────────

export interface TradeHumanComment {
  text?: string;
  comment?: string;
  [key: string]: unknown;
}

export interface TradeAiComment {
  text?: string;
  comment?: string;
  [key: string]: unknown;
}

export interface LlmResultComment {
  human_comment: TradeHumanComment;
  ai_comment: TradeAiComment;
}

// ─── Trade row (flattened from event_buy_listings_logs + joins) ───────────────

export interface Trade {
  id: number | string;
  event_analysis_log_id: number | string | null;
  event_id: number | string | null;
  listing_id: string | null;
  vs_section: string | null;
  row: string | null;
  quantity: number | null;
  max_buy_price: number | null;
  projected_sell_price: number | null;
  estimated_margin_percent: number | null;
  confidence_level: "BUY" | "STRONG_BUY" | "CONVICTION_BUY" | null;
  created_at: string | null;
  llm_result_comment: LlmResultComment | null;
  // Flattened from event_analysis_logs join
  event_name: string;
  utc_date: string | null;
  venue_name: string;
  primary_performer_name: string;
  llm_result: Record<string, unknown> | null;
  // Flattened from events join
  vs_web_path: string | null;
}
