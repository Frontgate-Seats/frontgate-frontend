import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import {
  Box,
  CircularProgress,
  Typography,
  Tooltip,
  IconButton,
  Stack,
  useTheme,
} from "@mui/material";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import type {
  MapGroup,
  MapSection,
  VenueMapData,
} from "../../store/slices/listingsMapView.slice";

interface VenueMapProps {
  mapData: VenueMapData;
  /** Set of selected section names (lowercase) for multi-select */
  selectedSections: Set<string>;
  onSectionClick: (sectionName: string, sectionId: number) => void;
  highlightedGroup?: Set<number>;
  /** Set of section IDs that have available listings */
  availableSectionIds?: Set<number>;
}

// Raw element from VividSeats JSON map
interface MapElement {
  type: "path" | "text";
  id?: string | number;
  path?: string;
  d?: string;
  fill?: string;
  stroke?: string;
  "stroke-miterlimit"?: string;
  // Text element fields
  text?: string;
  transform?: string;
  "font-family"?: string;
  "font-size"?: string;
  "font-weight"?: string;
  "text-anchor"?: string;
  // Legacy formats
  name?: string;
  sectionName?: string;
  sectionId?: string | number;
  groupId?: number;
  dataGenMap?: string;
}

// Parsed section ready for rendering
interface ParsedSection {
  id: number;
  path: string;
  name: string;
  groupId?: number;
}

// Parsed text label for rendering
interface ParsedLabel {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontWeight: string;
  anchor: string;
  svgTransform?: string;
}

// Decorative path (no id, not interactive)
interface DecorativePath {
  path: string;
  fill: string;
  stroke: string;
}

/**
 * Convert VividSeats hex color format (0xRRGGBB) to CSS hex (#RRGGBB)
 */
function normalizeColor(color: string | undefined): string | undefined {
  if (!color) return undefined;
  if (color.startsWith("0x") || color.startsWith("0X")) {
    return "#" + color.slice(2);
  }
  if (!color.startsWith("#") && /^[0-9a-fA-F]{6}$/.test(color)) {
    return "#" + color;
  }
  return color;
}

/**
 * Parse the transform attribute from text elements to extract x,y position.
 * Handles all VividSeats matrix formats:
 *   "m1,0,0,1,tx,ty"  "m(1,0,0,1,tx,ty)"  "m 1 0 0 1 tx ty"  mixed separators
 * Extracts all numbers and uses index 4=tx, 5=ty (standard matrix [a,b,c,d,tx,ty]).
 * NOTE: VS JSON v2 format stores position in el.x/el.y, not the transform.
 * This function is kept for legacy format fallback only.
 */
function parseTransform(transform: string): { x: number; y: number } {
  const nums: number[] = [];
  const rx = /[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?/g;
  let m: RegExpExecArray | null;
  while ((m = rx.exec(transform)) !== null) nums.push(parseFloat(m[0]));
  if (nums.length >= 6) return { x: nums[4], y: nums[5] };
  if (nums.length >= 2) return { x: nums[0], y: nums[1] };
  return { x: 0, y: 0 };
}

// Keep for legacy map format fallback usage
void parseTransform;

export default function VenueMap({
  mapData,
  selectedSections,
  onSectionClick,
  highlightedGroup,
  availableSectionIds,
}: VenueMapProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [parsedSections, setParsedSections] = useState<ParsedSection[]>([]);
  const [decorativePaths, setDecorativePaths] = useState<DecorativePath[]>([]);
  const [labels, setLabels] = useState<ParsedLabel[]>([]);
  const [viewBox, setViewBox] = useState("0 0 1000 800");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(0.8);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [hoveredSection, setHoveredSection] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build lookups from map data
  const sectionById = useMemo(() => {
    const m = new Map<number, MapSection>();
    mapData.sections.forEach((s) => m.set(s.id, s));
    return m;
  }, [mapData.sections]);

  const groupLookup = useMemo(() => {
    const m = new Map<number, MapGroup>();
    mapData.groups.forEach((g) => m.set(g.id, g));
    return m;
  }, [mapData.groups]);

  // Fetch and parse the JSON map
  useEffect(() => {
    if (!mapData.jsonMapUrl) return;

    setLoading(true);
    setError(null);

    fetch(mapData.jsonMapUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch map: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const sections: ParsedSection[] = [];
        const decorative: DecorativePath[] = [];
        const textLabels: ParsedLabel[] = [];

        // Format 1: VividSeats v2 format { height, width, elements: [...] }
        if (data.elements && Array.isArray(data.elements)) {
          const vb = `0 0 ${data.width || 1000} ${data.height || 800}`;
          setViewBox(vb);

          for (const el of data.elements as MapElement[]) {
            if (el.type === "path") {
              const pathD = el.path || el.d || "";
              if (!pathD) continue;

              if (el.id != null) {
                // Interactive section
                const numId = typeof el.id === "string" ? parseInt(el.id) : el.id;
                const mapSection = sectionById.get(numId);
                sections.push({
                  id: numId,
                  path: pathD,
                  name: mapSection?.name || el.name || el.sectionName || String(el.id),
                  groupId: mapSection?.groupId ?? el.groupId,
                });
              } else {
                // Decorative background path
                decorative.push({
                  path: pathD,
                  fill: el.fill || "#eee",
                  stroke: el.stroke || "none",
                });
              }
            } else if (el.type === "text" && el.text && el.transform) {
              // VS JSON stores position in el.x / el.y directly.
              // el.transform is a rotation matrix, NOT a translation.
              const x = parseFloat(String((el as any).x)) || 0;
              const y = parseFloat(String((el as any).y)) || 0;
              const fsRaw = el["font-size"] ?? (el as any).fontSize ?? "5";
              const fontSize = parseFloat(String(fsRaw)) || 5;
              // Build SVG transform: rotation from matrix + position from x/y
              // VS JSON: el.transform = rotation only (e.g. "m0,-1,1,0,0,0")
              //          el.x / el.y  = position in the ROTATED coordinate space
              // Correct SVG: matrix(a,b,c,d, a*x+c*y, b*x+d*y)
              // Old format: position baked into transform as m1,0,0,1,tx,ty with x/y=0
              const hasDirectPos = Math.abs(x) > 0.001 || Math.abs(y) > 0.001;
              let svgTransform: string | undefined;
              if (el.transform !== "m1,0,0,1,0,0") {
                const nums: number[] = [];
                const rx2 = /[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?/g;
                let m2: RegExpExecArray | null;
                while ((m2 = rx2.exec(el.transform)) !== null) nums.push(parseFloat(m2[0]));
                if (nums.length >= 4) {
                  const [a, b, c, d] = nums;
                  if (!hasDirectPos && nums.length >= 6) {
                    // Old format: full translation in transform
                    svgTransform = `matrix(${a},${b},${c},${d},${nums[4]},${nums[5]})`;
                  } else {
                    // New format: rotation only, position in el.x/el.y
                    const tx = a * x + c * y;
                    const ty = b * x + d * y;
                    svgTransform = `matrix(${a},${b},${c},${d},${tx},${ty})`;
                  }
                }
              }
              textLabels.push({
                text: el.text,
                x,
                y,
                fontSize,
                fontWeight: el["font-weight"] || "400",
                anchor: el["text-anchor"] || "start",
                svgTransform,
              });
            }
          }
        }
        // Format 2: { viewBox, sections: [...] }
        else if (data.sections && Array.isArray(data.sections)) {
          if (data.viewBox) setViewBox(data.viewBox);
          for (const s of data.sections) {
            sections.push({
              id: parseInt(s.id || s.sectionId || "0"),
              path: s.d || s.path || "",
              name: s.name || s.sectionName || "",
              groupId: s.groupId,
            });
          }
        }
        // Format 3: { svg: { viewBox, paths: [...] } }
        else if (data.svg?.paths && Array.isArray(data.svg.paths)) {
          if (data.svg.viewBox) setViewBox(data.svg.viewBox);
          for (const p of data.svg.paths) {
            sections.push({
              id: parseInt(p.id || "0"),
              path: p.d || "",
              name: p.name || p.label || "",
              groupId: p.groupId,
            });
          }
        }
        // Format 4: plain array
        else if (Array.isArray(data)) {
          for (const s of data) {
            sections.push({
              id: parseInt(s.id || s.sectionId || "0"),
              path: s.d || s.path || "",
              name: s.name || s.sectionName || "",
              groupId: s.groupId,
            });
          }
        }

        setParsedSections(sections);
        setDecorativePaths(decorative);

        // If no text labels came from the API, generate labels from section names
        if (textLabels.length === 0 && sections.length > 0) {
          const generatedLabels: ParsedLabel[] = sections
            .filter((s) => s.name && s.path)
            .map((s) => {
              // Compute centroid from the path bounding box using regex to extract coords
              const coords: number[] = [];
              const numRegex = /[-+]?[0-9]*\.?[0-9]+/g;
              let match: RegExpExecArray | null;
              while ((match = numRegex.exec(s.path)) !== null) {
                coords.push(parseFloat(match[0]));
              }
              let cx = 0, cy = 0;
              if (coords.length >= 2) {
                const xs = coords.filter((_, i) => i % 2 === 0);
                const ys = coords.filter((_, i) => i % 2 === 1);
                cx = xs.reduce((a, b) => a + b, 0) / xs.length;
                cy = ys.reduce((a, b) => a + b, 0) / ys.length;
              }
              return {
                text: s.name,
                x: cx,
                y: cy,
                fontSize: 3.5,
                fontWeight: "600",
                anchor: "middle",
              };
            });
          setLabels(generatedLabels);
        } else {
          setLabels(textLabels);
        }
      })
      .catch((err) => {
        console.error("Map fetch error:", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [mapData.jsonMapUrl, sectionById]);

  // Get fill color for a section
  const getSectionColor = useCallback(
    (section: ParsedSection): string => {
      const mapSection = sectionById.get(section.id);
      const groupId = mapSection?.groupId ?? section.groupId;
      const hasListings = availableSectionIds
        ? availableSectionIds.has(section.id)
        : mapSection?.isActive !== false;
      const isSelected = selectedSections.has(section.name.toLowerCase());

      // Unavailable — transparent/invisible
      if (!hasListings) return isDark ? "#2c2c2c" : "#f5f5f5";

      // Selected section — strong red
      if (isSelected) return "#c62828";

      // Hovered section
      if (hoveredSection === section.id) return "#ef5350";

      // Highlighted group/zone
      if (highlightedGroup && highlightedGroup.size > 0 && groupId != null && highlightedGroup.has(groupId)) {
        return "#ff9800";
      }

      // Group color
      if (groupId != null) {
        const group = groupLookup.get(groupId);
        const color = normalizeColor(group?.color);
        if (color) return color;
      }

      return isDark ? "#4a1010" : "#ffcdd2";
    },
    [selectedSections, hoveredSection, highlightedGroup, sectionById, groupLookup, availableSectionIds, isDark],
  );

  const getOpacity = useCallback(
    (section: ParsedSection): number => {
      const mapSection = sectionById.get(section.id);
      const groupId = mapSection?.groupId ?? section.groupId;
      const hasListings = availableSectionIds
        ? availableSectionIds.has(section.id)
        : mapSection?.isActive !== false;
      const isSelected = selectedSections.has(section.name.toLowerCase());

      // Unavailable — very faint
      if (!hasListings) return 0.4;

      // Sections are selected — highlight selected, blur rest
      if (selectedSections.size > 0) {
        if (isSelected) return 1;
        return 0.3;
      }

      // Zone highlighted
      if (highlightedGroup && highlightedGroup.size > 0) {
        if (groupId != null && highlightedGroup.has(groupId)) return 0.9;
        return 0.3;
      }

      // Hovered
      if (hoveredSection === section.id) return 0.95;

      return 0.75;
    },
    [selectedSections, hoveredSection, highlightedGroup, sectionById, availableSectionIds],
  );

  const getStroke = useCallback(
    (section: ParsedSection): { color: string; width: number } => {
      const hasListings = availableSectionIds
        ? availableSectionIds.has(section.id)
        : sectionById.get(section.id)?.isActive !== false;

      if (!hasListings) return { color: isDark ? "#444" : "#e0e0e0", width: 0.2 };

      if (selectedSections.has(section.name.toLowerCase())) {
        return { color: "#b71c1c", width: 2.5 };
      }
      if (hoveredSection === section.id) {
        return { color: "#c62828", width: 1.5 };
      }
      return { color: isDark ? "#666" : "#9e9e9e", width: 0.3 };
    },
    [selectedSections, hoveredSection, availableSectionIds, sectionById, isDark],
  );

  // Zoom handlers
  const handleZoomIn = () => setScale((s) => Math.min(s * 1.3, 5));
  const handleZoomOut = () => setScale((s) => Math.max(s / 1.3, 0.5));
  const handleReset = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  // Pan handlers — track if mouse moved (to distinguish click from drag)
  const dragDistance = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 0) {
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        dragDistance.current = 0;
      }
    },
    [pan],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        const dx = e.clientX - panStart.x - pan.x;
        const dy = e.clientY - panStart.y - pan.y;
        dragDistance.current += Math.abs(dx) + Math.abs(dy);
        setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      }
    },
    [isPanning, panStart, pan],
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Scroll to zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((s) => Math.min(Math.max(s * delta, 0.5), 5));
  }, []);

  // Section click handler (only fires if not dragging)
  const handleSectionClick = useCallback(
    (e: React.MouseEvent, section: ParsedSection) => {
      e.stopPropagation();
      // Don't trigger click if user was dragging
      if (dragDistance.current > 5) return;
      onSectionClick(section.name, section.id);
    },
    [onSectionClick],
  );

  // Build tooltip content
  const getTooltipContent = useCallback(
    (section: ParsedSection) => {
      const mapSection = sectionById.get(section.id);
      const groupId = mapSection?.groupId ?? section.groupId;
      const group = groupId != null ? groupLookup.get(groupId) : null;
      const hasListings = availableSectionIds
        ? availableSectionIds.has(section.id)
        : mapSection?.isActive !== false;

      if (!hasListings) return "";

      return (
        <Box sx={{ p: 0.5 }}>
          <Typography variant="subtitle2" fontWeight={700}>
            {section.name}
          </Typography>
          {group?.name && (
            <Typography variant="caption" display="block" color="grey.300">
              {group.zone?.name || group.name}
            </Typography>
          )}
          {mapSection?.minPrice != null && mapSection.minPrice > 0 && (
            <Typography variant="caption" display="block">
              From: ${mapSection.minPrice}
            </Typography>
          )}
          {mapSection?.quantity != null && mapSection.quantity > 0 && (
            <Typography variant="caption" display="block">
              {mapSection.quantity} ticket{mapSection.quantity !== 1 ? "s" : ""} available
            </Typography>
          )}
        </Box>
      );
    },
    [sectionById, groupLookup, availableSectionIds],
  );

  // If no JSON map URL, fall back to static image
  if (!mapData.jsonMapUrl && mapData.staticUrl) {
    return (
      <Box
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          borderRadius: 2,
          bgcolor: "transparent",
        }}
      >
        <img
          src={mapData.staticUrl}
          alt="Venue Map"
          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
        />
      </Box>
    );
  }

  if (loading) {
    return (
      <Box
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Stack alignItems="center" spacing={1}>
          <CircularProgress size={40} />
          <Typography variant="body2" color="text.secondary">
            Loading venue map...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (error) {
    if (mapData.staticUrl) {
      return (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            borderRadius: 2,
            bgcolor: "transparent",
          }}
        >
          <img
            src={mapData.staticUrl}
            alt="Venue Map"
            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
          />
        </Box>
      );
    }
    return (
      <Box sx={{ p: 2, textAlign: "center" }}>
        <Typography color="error">Failed to load venue map</Typography>
        <Typography variant="caption" color="text.secondary">
          {error}
        </Typography>
      </Box>
    );
  }

  if (parsedSections.length === 0 && mapData.staticUrl) {
    return (
      <Box
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          borderRadius: 2,
          bgcolor: "transparent",
        }}
      >
        <img
          src={mapData.staticUrl}
          alt="Venue Map"
          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Zoom controls */}
      <Stack
        direction="row"
        spacing={0.5}
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          zIndex: 10,
          bgcolor: "background.paper",
          borderRadius: 1,
          boxShadow: 1,
          p: 0.5,
        }}
      >
        <IconButton size="small" onClick={handleZoomIn} title="Zoom in">
          <ZoomInIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={handleZoomOut} title="Zoom out">
          <ZoomOutIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={handleReset} title="Reset view">
          <RestartAltIcon fontSize="small" />
        </IconButton>
      </Stack>

      {/* SVG Map Container */}
      <Box
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        sx={{
          width: "100%",
          height: "100%",
          cursor: isPanning ? "grabbing" : "grab",
          overflow: "hidden",
          borderRadius: 2,
          bgcolor: "transparent",
          userSelect: "none",
        }}
      >
        <svg
          viewBox={viewBox}
          style={{
            width: "100%",
            height: "100%",
            transform: `scale(${scale}) translate(${pan.x / scale}px, ${pan.y / scale}px)`,
            transformOrigin: "center center",
          }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Decorative background paths */}
          {decorativePaths.map((dp, i) => (
            <path
              key={`bg-${i}`}
              d={dp.path}
              fill={dp.fill}
              stroke={dp.stroke === "none" ? "none" : dp.stroke || (isDark ? "#444" : "#ddd")}
              strokeWidth={0.2}
              pointerEvents="none"
            />
          ))}

          {/* Interactive section paths */}
          {parsedSections.map((section) => {
            const stroke = getStroke(section);
            const hasListings = availableSectionIds
              ? availableSectionIds.has(section.id)
              : sectionById.get(section.id)?.isActive !== false;

            // Disabled sections: light fill, no interaction
            if (!hasListings) {
              return (
                <path
                  key={section.id}
                  d={section.path}
                  fill={isDark ? "#2c2c2c" : "#f5f5f5"}
                  stroke={isDark ? "#444" : "#e0e0e0"}
                  strokeWidth={0.2}
                  opacity={0.4}
                  pointerEvents="none"
                />
              );
            }

            return (
              <Tooltip
                key={section.id}
                title={getTooltipContent(section)}
                placement="top"
                arrow
                enterDelay={100}
                leaveDelay={0}
              >
                <path
                  d={section.path}
                  fill={getSectionColor(section)}
                  stroke={stroke.color}
                  strokeWidth={stroke.width}
                  opacity={getOpacity(section)}
                  style={{
                    cursor: "pointer",
                    transition:
                      "fill 0.15s ease, opacity 0.15s ease, stroke-width 0.15s ease",
                  }}
                  onMouseEnter={() => setHoveredSection(section.id)}
                  onMouseLeave={() => setHoveredSection(null)}
                  onClick={(e) => handleSectionClick(e, section)}
                />
              </Tooltip>
            );
          })}

          {/* Text labels */}
          {labels.map((label, i) => (
            <text
              key={`label-${i}`}
              {...(label.svgTransform
                ? { transform: label.svgTransform, x: 0, y: 0 }
                : { x: label.x, y: label.y }
              )}
              fontSize={label.fontSize}
              fontWeight={label.fontWeight}
              textAnchor={label.anchor as "start" | "middle" | "end"}
              fill={isDark ? "#e0e0e0" : "#333"}
              pointerEvents="none"
              style={{ userSelect: "none" }}
            >
              {label.text}
            </text>
          ))}
        </svg>
      </Box>
    </Box>
  );
}
