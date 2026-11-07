# 05: Weather fetch, geocoding and Condition mapping

Status: resolved
Blocked by: none

## What to build

Given a city name, resolve it to coordinates, fetch current Weather from Open-Meteo, and return a Condition plus a day or night flag. Weather is read once per run.

## Acceptance criteria

- [ ] City search calls `https://geocoding-api.open-meteo.com/v1/search?name=<query>` and uses `latitude` and `longitude` from the first result (or lets the player choose among results).
- [ ] Current weather is fetched from Open-Meteo's forecast endpoint using `weather_code`.
- [ ] A pure function maps WMO weather codes to Conditions per the table in the spec. Unit tests cover every code in the table, plus an unknown code.
- [ ] Day or night comes from `is_day`.
- [ ] If the city is not found or a request fails, return a clear error; never silently fall back to Clear.

## Notes

Confirm in the Open-Meteo docs (Context7) that `is_day` is available with the `current=` parameter before relying on it; so far it is only seen documented as hourly. If it is not, fall back to the hourly value for the current hour and tell the user. Do not invent field names.

## Comments

- Built in `8402ae6`. Tested with a fake network and one live call. `is_day` confirmed to work with `current=` against the live API.
