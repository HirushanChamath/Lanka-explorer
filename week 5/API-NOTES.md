# API Notes - Lanka Explorer (Week 04)

## 1. Open-Meteo API (Weather)
- **Endpoint:** `https://api.open-meteo.com/v1/forecast`
- **Purpose:** Get current weather conditions and a 3-day forecast based on destination latitude and longitude.
- **Learnings:** Learned how to parse nested JSON objects and use parallel arrays (like daily time, temperatures, and weather codes) to display structured weather information.

## 2. Frankfurter API (Currency Conversion)
- **Endpoint:** `https://api.frankfurter.dev/v2/rate/usd/lkr`
- **Purpose:** Fetch the daily exchange rate to convert destination entry fees from US Dollars (USD) to Sri Lankan Rupees (LKR).
- **Learnings:** Learned the importance of caching API responses (saving the rate in a variable) to prevent repeated unnecessary requests and respect rate limits.

## 3. Leaflet + OpenStreetMap (Interactive Maps)
- **Endpoint:** `https://tile.openstreetmap.org/{z}/{x}/{y}.png`
- **Purpose:** Render interactive maps with markers and popups for individual destinations and all destinations combined.
- **Learnings:** Learned how to integrate a third-party JavaScript library (Leaflet) into a static site, handle base map tiles, and dynamically fit map bounds to multiple coordinates.