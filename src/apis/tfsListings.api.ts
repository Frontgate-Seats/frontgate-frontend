export interface HermesListing {
  id: string;
  listingId: string;
  section_name: string;
  row: string;
  quantity: number;
  price: number;
  dealScore: number;
  source: "hermes";
}

/**
 * Fetch Hermes listings directly from VividSeats public API.
 * This runs in the browser so it passes Cloudflare bot checks.
 */
export const fetchHermesListings = async (productionId: string): Promise<HermesListing[]> => {
  try {
    const url = `https://www.vividseats.com/hermes/api/v1/listings?productionId=${productionId}&includeIpAddress=true&currency=USD`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "accept": "application/json",
      },
    });

    if (!response.ok) return [];

    const data = await response.json();

    if (!data.tickets || !Array.isArray(data.tickets)) return [];

    return data.tickets.map((t: any) => ({
      id: `hermes-${t.i}`,
      listingId: t.i,
      section_name: t.sectionName || "—",
      row: t.row || t.r || "—",
      quantity: parseInt(t.quantity || t.q) || 1,
      price: parseFloat(t.allInPricePerTicket || t.p) || 0,
      dealScore: parseFloat(t.dealScore || t.d) || 0,
      source: "hermes" as const,
    }));
  } catch (err) {
    console.warn("[Hermes] Failed to fetch:", err);
    return [];
  }
};

const hermesListingsApi = { fetchHermesListings };
export default hermesListingsApi;
