import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { fail, ok } from "../utils/http.js";

export const placesRouter = Router();
placesRouter.use(requireAuth);

const NOMINATIM = "https://nominatim.openstreetmap.org";
const headers = {
  Accept: "application/json",
  "User-Agent": "Orbitly/1.0 (creator-marketing; contact: editcomediaofficial@gmail.com)",
};

type NominatimPlace = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: Record<string, string>;
};

function present(place: NominatimPlace) {
  const address = place.address || {};
  const city =
    address.city ||
    address.town ||
    address.village ||
    address.suburb ||
    address.hamlet ||
    address.county ||
    "";
  const region = address.state || address.region || "";
  const country = address.country || "";
  return {
    id: place.place_id,
    label: place.display_name,
    city,
    region,
    country,
    lat: Number(place.lat),
    lon: Number(place.lon),
  };
}

placesRouter.get("/", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (q.length < 2) return ok(res, { places: [] });
    const url = `${NOMINATIM}/search?format=jsonv2&addressdetails=1&limit=8&q=${encodeURIComponent(q)}`;
    const response = await fetch(url, { headers });
    if (!response.ok) return fail(res, new Error("Place search is unavailable"), 502);
    const data = (await response.json()) as NominatimPlace[];
    return ok(res, { places: data.map(present) });
  } catch (error) {
    return fail(res, error, 502);
  }
});

placesRouter.get("/reverse", async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return fail(res, new Error("A map position is required"));
    }
    const url = `${NOMINATIM}/reverse?format=jsonv2&addressdetails=1&lat=${lat}&lon=${lon}`;
    const response = await fetch(url, { headers });
    if (!response.ok) return fail(res, new Error("Could not read that location"), 502);
    const data = (await response.json()) as NominatimPlace;
    return ok(res, { place: present(data) });
  } catch (error) {
    return fail(res, error, 502);
  }
});
