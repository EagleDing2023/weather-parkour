// Weather lookup: city name -> coordinates -> current Weather -> Condition.
// Never falls back to Clear: any problem throws a WeatherError.

export const CONDITIONS = ['clear', 'rain', 'snow', 'thunderstorm'];

// WMO weather codes per Condition (see spec).
const CODE_TABLE = {
  clear: [0, 1, 2, 3, 45, 48],
  rain: [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82],
  snow: [71, 73, 75, 77, 85, 86],
  thunderstorm: [95, 96, 97, 99],
};
const CODE_TO_CONDITION = new Map(
  Object.entries(CODE_TABLE).flatMap(([cond, codes]) => codes.map((c) => [c, cond])),
);

// Pure. Returns a Condition name, or null for a code not in the table.
export function conditionFromCode(code) {
  return CODE_TO_CONDITION.get(code) ?? null;
}

// kind: 'bad-query' | 'not-found' | 'network' | 'bad-response' | 'unknown-code'
export class WeatherError extends Error {
  constructor(kind, message) {
    super(message);
    this.name = 'WeatherError';
    this.kind = kind;
  }
}

const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const TIMEOUT_MS = 8000;

// Fetch JSON; turn every failure into a WeatherError. fetchFn is injectable for tests.
async function getJson(url, fetchFn) {
  let res;
  try {
    res = await fetchFn(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch {
    throw new WeatherError('network', 'Could not reach the weather service. Check your connection.');
  }
  let body = null;
  try { body = await res.json(); } catch { /* handled below */ }
  if (!res.ok) {
    const reason = body?.reason ? ` (${body.reason})` : '';
    throw new WeatherError('network', `Weather service error ${res.status}${reason}.`);
  }
  if (body === null || typeof body !== 'object') {
    throw new WeatherError('bad-response', 'The weather service sent an unreadable reply.');
  }
  return body;
}

// Returns up to `count` matches: [{ name, admin1, country, latitude, longitude }].
// The first is the best match; the menu can let the player pick another.
export async function searchCity(query, { fetchFn = fetch, count = 5 } = {}) {
  const q = String(query ?? '').trim();
  if (!q) throw new WeatherError('bad-query', 'Type a city name first.');
  const url = `${GEOCODE_URL}?name=${encodeURIComponent(q)}&count=${count}`;
  const body = await getJson(url, fetchFn);
  // With no matches the API omits `results` entirely (checked against the live API).
  if (!Array.isArray(body.results) || body.results.length === 0) {
    throw new WeatherError('not-found', `No city found for "${q}".`);
  }
  return body.results.map((r) => ({
    name: r.name, admin1: r.admin1, country: r.country,
    latitude: r.latitude, longitude: r.longitude,
  }));
}

// Returns { condition, isDay, code } for the current Weather at a point.
export async function fetchWeather(latitude, longitude, { fetchFn = fetch } = {}) {
  const url = `${FORECAST_URL}?latitude=${latitude}&longitude=${longitude}&current=weather_code,is_day`;
  const body = await getJson(url, fetchFn);
  const cur = body.current;
  if (!cur || typeof cur.weather_code !== 'number' || (cur.is_day !== 0 && cur.is_day !== 1)) {
    throw new WeatherError('bad-response', 'The weather service reply was missing data.');
  }
  const condition = conditionFromCode(cur.weather_code);
  if (condition === null) {
    throw new WeatherError('unknown-code', `Unrecognised weather code ${cur.weather_code}.`);
  }
  return { condition, isDay: cur.is_day === 1, code: cur.weather_code };
}

// Convenience: city name -> { place, condition, isDay }. `index` picks among matches.
export async function lookupWeather(query, { fetchFn = fetch, index = 0 } = {}) {
  const places = await searchCity(query, { fetchFn });
  const place = places[index] ?? places[0];
  const w = await fetchWeather(place.latitude, place.longitude, { fetchFn });
  return { place, ...w };
}
