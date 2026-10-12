import * as React from "react";
import {
  Box,
  ClickAwayListener,
  IconButton,
  Link,
  Paper,
  Popper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

interface TicketUrlsCellProps {
  /** inventory.transfer_urls — text[] (may also arrive as a JSON string) */
  transferUrls: string[] | string | null | undefined;
  /** inventory.download_urls — text[] (may also arrive as a JSON string) */
  downloadUrls: string[] | string | null | undefined;
}

/**
 * Single-column ticket URLs cell. Shows an external-link icon with a total count badge.
 * Clicking opens a Popper grouping Transfer and Download URLs — each section is
 * only rendered when it has entries. Each URL opens in a new tab.
 *
 * The underlying columns store text[] (e.g. ["https://..."]), which may also
 * arrive as a JSON string literal — both shapes are normalized here.
 */
function normalizeUrls(urls: string[] | string | null | undefined): string[] {
  if (!urls) return [];
  if (Array.isArray(urls)) return urls.filter((u) => typeof u === "string" && u.trim() !== "");
  if (typeof urls === "string") {
    const trimmed = urls.trim();
    if (trimmed === "" || trimmed === "[]") return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed))
        return parsed.filter((u) => typeof u === "string" && u.trim() !== "");
    } catch {
      // Not JSON — treat the whole string as a single URL
    }
    return [trimmed];
  }
  return [];
}

function UrlSection({
  title,
  urls,
}: {
  title: string;
  urls: string[];
}) {
  if (urls.length === 0) return null;
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
        {title} ({urls.length})
      </Typography>
      <Stack spacing={0.5} sx={{ pl: 0.5 }}>
        {urls.map((url, idx) => (
          <Stack
            key={`${url}-${idx}`}
            direction="row"
            alignItems="center"
            spacing={0.5}
            sx={{ maxWidth: 400 }}
          >
            <Link
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              variant="body2"
              sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            >
              {url}
            </Link>
            <Tooltip title="Open in new tab">
              <IconButton
                size="small"
                component="a"
                href={url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <OpenInNewIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

export default function TicketUrlsCell({ transferUrls, downloadUrls }: TicketUrlsCellProps) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const transfers = React.useMemo(() => normalizeUrls(transferUrls), [transferUrls]);
  const downloads = React.useMemo(() => normalizeUrls(downloadUrls), [downloadUrls]);
  const total = transfers.length + downloads.length;
  const open = Boolean(anchorEl);

  if (total === 0) {
    return (
      <Typography variant="body2" color="text.disabled">
        —
      </Typography>
    );
  }

  const handleToggle = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl((prev) => (prev ? null : e.currentTarget));
  };

  return (
    <>
      <Box
        onClick={handleToggle}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          cursor: "pointer",
          px: 1,
          py: 0.25,
          borderRadius: 1,
          color: "primary.main",
          "&:hover": { bgcolor: "action.hover" },
        }}
      >
        <OpenInNewIcon fontSize="small" />
        <Typography variant="body2" fontWeight={600}>
          {total}
        </Typography>
      </Box>

      <Popper open={open} anchorEl={anchorEl} placement="bottom-start" sx={{ zIndex: 1300 }}>
        <ClickAwayListener onClickAway={() => setAnchorEl(null)}>
          <Paper
            elevation={6}
            sx={{ p: 1.5, maxWidth: 440, maxHeight: 360, overflow: "auto" }}
          >
            <Stack spacing={1.5}>
              <UrlSection title="Transfer URLs" urls={transfers} />
              <UrlSection title="Download URLs" urls={downloads} />
            </Stack>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </>
  );
}
