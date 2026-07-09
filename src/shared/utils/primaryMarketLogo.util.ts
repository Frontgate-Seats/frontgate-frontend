/**
 * Maps primary market type to the appropriate logo.
 * All providers have local icons in public/pm-{type}.png.
 */

// Market type → local logo path
const PRIMARY_MARKET_LOGOS: Record<string, string> = {
  TM: "/pm-tm.png",
  broadwayDirect: "/pm-broadwaydirect.png",
  eVenue: "/pm-eVenue.png",
  attPAC: "/pm-attPAC.png",
  metopera: "/pm-metopera.png",
  nycballet: "/pm-nycballet.png",
  nycitycenter: "/pm-nycitycenter.png",
  sight_and_sound: "/pm-sight_and_sound.png",
  marriott_theatre: "/pm-marriott_theatre.png",
  HCT: "/pm-HCT.png",
  denver_center: "/pm-denver_center.png",
  ohio_theatre: "/pm-ohio_theatre.png",
  mlb: "/pm-mlb.png",
  phonix_theatre: "/pm-phonix_theatre.png",
  hawaii_theatre: "/pm-hawaii_theatre.png",
  sf_playhouse: "/pm-sf_playhouse.png",
  seacoast_rep_theatre: "/pm-seacoast_rep_theatre.png",
  symphony_center: "/pm-symphony_center.png",
  guthrie_theater: "/pm-guthrie_theater.png",
  shubert_theater: "/pm-shubert_theater.png",
  BSO: "/pm-BSO.png",
  chicago_symphony_center: "/pm-chicago_symphony_center.png",
  westmoreland_trust: "/pm-westmoreland_trust.png",
  ensemblearts_philly: "/pm-ensemblearts_philly.png",
  CAC: "/pm-CAC.png",
  playhouse_square: "/pm-playhouse_square.png",
  minnesota_orchestra: "/pm-minnesota_orchestra.png",
  kauffman_center: "/pm-kauffman_center.png",
  davidhkochtheater: "/pm-davidhkochtheater.png",
  engeman_theatre: "/pm-engeman_theatre.png",
  portland_center: "/pm-portland_center.png",
  act_sf: "/pm-act_sf.png",
  salt_lake_county: "/pm-salt_lake_county.png",
  second_stage_theatre: "/pm-second_stage_theatre.png",
  roundabout_theatre: "/pm-roundabout_theatre.png",
  nyphil: "/pm-nyphil.png",
  criterion: "/pm-criterion.png",
  new_jersey_symphony: "/pm-new_jersey_symphony.png",
  la_phil: "/pm-la_phil.png",
  atg_tickets: "/pm-atg_tickets.png",
  cirque_du_soleil: "/pm-cirque_du_soleil.png",
  etix: "/pm-etix.png",
  mgm_resorts: "/pm-mgm.png",
};

/**
 * Get the logo URL for a given primary market type.
 * Returns local path for known providers, falls back to TJ logo.
 */
export function getPrimaryMarketLogo(marketType: string | undefined | null): string {
  if (!marketType) return "/tj-logo.ico";
  return PRIMARY_MARKET_LOGOS[marketType] || "/tj-logo.ico";
}

/**
 * Get the display label for a primary market type.
 */
export function getPrimaryMarketLabel(marketType: string | undefined | null): string {
  if (!marketType) return "Primary";
  return `Primary (${marketType})`;
}
