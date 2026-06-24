import { Box, Chip, Stack, Typography } from "@mui/material";
import type { MapGroup, MapSection } from "../../store/slices/listingsMapView.slice";

interface ZoneLegendProps {
  groups: MapGroup[];
  sections?: MapSection[];
  highlightedGroup: Set<number>;
  onGroupClick: (groupId: number | null) => void;
  /** Set of section IDs that have available listings */
  availableSectionIds?: Set<number>;
}

/**
 * Convert VividSeats hex color format (0xRRGGBB) to CSS hex (#RRGGBB)
 */
function normalizeColor(color: string | undefined): string {
  if (!color) return "#bbdefb";
  if (color.startsWith("0x") || color.startsWith("0X")) {
    return "#" + color.slice(2);
  }
  if (!color.startsWith("#") && /^[0-9a-fA-F]{6}$/.test(color)) {
    return "#" + color;
  }
  return color;
}

export default function ZoneLegend({
  groups,
  sections,
  highlightedGroup,
  onGroupClick,
  availableSectionIds,
}: ZoneLegendProps) {
  // Only show zones that have available listings
  const activeGroups = groups.filter((g) => {
    if (availableSectionIds && sections) {
      // Zone has availability if any of its sections have listings
      return sections.some(
        (s) => s.groupId === g.id && availableSectionIds.has(s.id),
      );
    }
    return g.hasTickets || g.isActive;
  });

  if (activeGroups.length === 0) return null;

  return (
    <Box sx={{ p: 1.5, width: "100%" }}>
      <Typography
        variant="caption"
        fontWeight={600}
        color="text.secondary"
        gutterBottom
        display="block"
      >
        Zones
      </Typography>
      <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ width: "100%" }}>
        {activeGroups.map((group) => (
          <Chip
            key={group.id}
            label={
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    bgcolor: normalizeColor(group.color),
                    border: "1px solid rgba(0,0,0,0.2)",
                  }}
                />
                <span>{group.zone?.name || group.name}</span>
              </Stack>
            }
            size="small"
            variant={highlightedGroup.has(group.id) ? "filled" : "outlined"}
            color={highlightedGroup.has(group.id) ? "primary" : "default"}
            onClick={() => onGroupClick(group.id)}
            sx={{ cursor: "pointer" }}
          />
        ))}
      </Stack>
    </Box>
  );
}
