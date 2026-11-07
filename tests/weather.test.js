import test from 'node:test';
import assert from 'node:assert/strict';
import { conditionFromCode, searchCity, fetchWeather, lookupWeather, WeatherError } from '../src/weather.js';

const TABLE = {
  clear: [0, 1, 2, 3, 45, 48],
  rain: [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82],
  snow: [71, 73, 75, 77, 85, 86],
  thunderstorm: [95, 96, 97, 99],
};

test('every code in the spec table maps to its Condition', () => {
  for (const [cond, codes] of Object.entries(TABLE)) {
    for (const c of codes) assert.equal(conditionFromCode(c), cond, `code ${c}`);
  }
});

test('unknown codes map to null, never Clear', () => {
  for (const c of [4, 100, -1, 60, 999, NaN, undefined, '3']) assert.equal(conditionFromCode(c), null);
});

// Fake fetch: returns canned JSON per URL substring.
const fake = (routes) => async (url) => {
  for (const [needle, reply] of Object.entries(routes)) {
    if (url.includes(needle)) {
      if (reply instanceof Error) throw reply;
      return { ok: reply.status === undefined || reply.status < 400, status: reply.status ?? 200, json: async () => reply.body };
    }
  }
  throw new Error('unexpected url ' + url);
};
const rejects = (p, kind) => assert.rejects(p, (e) => e instanceof WeatherError && e.kind === kind);

const geo = { body: { results: [{ name: 'Berlin', admin1: 'Berlin', country: 'Germany', latitude: 52.5, longitude: 13.4, extra: 1 }] } };
const wx = (code, day) => ({ body: { current: { weather_code: code, is_day: day } } });

test('searchCity returns coordinates and uses the geocoding URL', async () => {
  let seen;
  const f = async (u, o) => { seen = u; return fake({ geocoding: geo })(u, o); };
  const r = await searchCity('New York', { fetchFn: f });
  assert.deepEqual(r[0], { name: 'Berlin', admin1: 'Berlin', country: 'Germany', latitude: 52.5, longitude: 13.4 });
  assert.ok(seen.startsWith('https://geocoding-api.open-meteo.com/v1/search?name=New%20York'));
});

test('city not found: no results key, empty list, blank query', async () => {
  await rejects(searchCity('zzz', { fetchFn: fake({ geocoding: { body: { generationtime_ms: 1 } } }) }), 'not-found');
  await rejects(searchCity('zzz', { fetchFn: fake({ geocoding: { body: { results: [] } } }) }), 'not-found');
  await rejects(searchCity('   ', { fetchFn: fake({}) }), 'bad-query');
});

test('network failure and HTTP errors become WeatherErrors', async () => {
  await rejects(searchCity('x', { fetchFn: fake({ geocoding: new Error('offline') }) }), 'network');
  await rejects(fetchWeather(1, 2, { fetchFn: fake({ forecast: { status: 400, body: { error: true, reason: 'bad' } } }) }), 'network');
});

test('fetchWeather: condition and day/night from is_day', async () => {
  assert.deepEqual(await fetchWeather(1, 2, { fetchFn: fake({ forecast: wx(63, 1) }) }), { condition: 'rain', isDay: true, code: 63 });
  assert.equal((await fetchWeather(1, 2, { fetchFn: fake({ forecast: wx(0, 0) }) })).isDay, false);
});

test('fetchWeather rejects unknown codes and missing or odd fields', async () => {
  await rejects(fetchWeather(1, 2, { fetchFn: fake({ forecast: wx(4, 1) }) }), 'unknown-code');
  await rejects(fetchWeather(1, 2, { fetchFn: fake({ forecast: { body: { current: { weather_code: 1 } } } }) }), 'bad-response');
  await rejects(fetchWeather(1, 2, { fetchFn: fake({ forecast: wx(1, 2) }) }), 'bad-response');
  await rejects(fetchWeather(1, 2, { fetchFn: fake({ forecast: { body: {} } }) }), 'bad-response');
});

test('lookupWeather chains search and fetch', async () => {
  const r = await lookupWeather('Berlin', { fetchFn: fake({ geocoding: geo, forecast: wx(75, 0) }) });
  assert.equal(r.condition, 'snow');
  assert.equal(r.isDay, false);
  assert.equal(r.place.name, 'Berlin');
});
