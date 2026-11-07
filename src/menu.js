// Start menu (HTML overlay): live city weather or a Preset.
// Calls onStart({ condition, isDay }) when the player starts a run.
import { searchCity, fetchWeather, WeatherError } from './weather.js';
import { PRESETS, label } from './presets.js';
import { CONDITIONS } from './weather.js';

const $ = (id) => document.getElementById(id);

export function createMenu({ onStart }) {
  const screen = $('menu-screen');
  const form = $('city-form');
  const input = $('city');
  const select = $('city-matches');
  const status = $('menu-status');
  const errorBox = $('menu-error');
  const resultBox = $('city-result');
  const summary = $('city-summary');

  let token = 0;      // newer lookups cancel older ones that are still in flight
  let matches = [];
  let pending = null; // { condition, isDay } waiting for the Start button

  const showError = (e) => {
    errorBox.textContent = (e instanceof WeatherError ? e.message : 'Something went wrong.')
      + ' You can still pick a Preset below.';
    errorBox.hidden = false;
  };
  const clearMessages = () => { errorBox.hidden = true; status.textContent = ''; };

  async function showWeatherFor(index) {
    const my = ++token;
    const m = matches[index];
    pending = null;
    resultBox.hidden = true;
    status.textContent = 'Looking up the weather…';
    try {
      const w = await fetchWeather(m.latitude, m.longitude);
      if (my !== token) return;
      pending = { condition: w.condition, isDay: w.isDay };
      const where = [m.name, m.admin1, m.country].filter(Boolean).join(', ');
      summary.textContent = `${where}: ${label(w.condition)}, ${w.isDay ? 'day' : 'night'}`;
      resultBox.hidden = false;
      status.textContent = '';
    } catch (e) {
      if (my !== token) return;
      status.textContent = '';
      showError(e);
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const my = ++token;
    clearMessages();
    resultBox.hidden = true;
    select.hidden = true;
    pending = null;
    status.textContent = 'Searching…';
    try {
      matches = await searchCity(input.value);
      if (my !== token) return;
      select.replaceChildren(...matches.map((m, i) => {
        const o = document.createElement('option');
        o.value = String(i);
        o.textContent = [m.name, m.admin1, m.country].filter(Boolean).join(', ');
        return o;
      }));
      select.hidden = matches.length < 2;
      await showWeatherFor(0);
    } catch (err) {
      if (my !== token) return;
      status.textContent = '';
      showError(err);
    }
  });

  select.addEventListener('change', () => { clearMessages(); showWeatherFor(Number(select.value)); });
  $('city-start').addEventListener('click', () => { if (pending) onStart(pending); });

  // Presets: no network, start instantly.
  const presets = $('presets');
  for (const c of CONDITIONS) {
    const row = document.createElement('div');
    const name = document.createElement('span');
    name.textContent = label(c);
    row.append(name);
    for (const p of PRESETS.filter((x) => x.condition === c)) {
      const b = document.createElement('button');
      b.textContent = p.isDay ? 'Day' : 'Night';
      b.addEventListener('click', () => onStart({ condition: p.condition, isDay: p.isDay }));
      row.append(b);
    }
    presets.append(row);
  }

  return {
    show() { clearMessages(); screen.hidden = false; input.focus(); },
    hide() { screen.hidden = true; },
  };
}
