// ===== 1. MOBILE MENU (Week 02) =====
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('nav');

if (menuToggle && nav) {
  menuToggle.addEventListener('click', function () {
    nav.classList.toggle('open');
    const isOpen = nav.classList.contains('open');
    menuToggle.setAttribute('aria-expanded', isOpen);
  });
}
// ===== 1b. DARK MODE =====
const THEME_KEY = 'lankaExplorerTheme';
const themeToggle = document.querySelector('.theme-toggle');

function applyTheme(theme) {  
  if (theme === 'dark') {    
    document.body.classList.add('dark');    
    themeToggle.textContent = 'Light mode';  
  } else {    
    document.body.classList.remove('dark');    
    themeToggle.textContent = 'Dark mode';  
  }
}

themeToggle.addEventListener('click', function () {  
  const newTheme = document.body.classList.contains('dark') ? 'light' : 'dark';  
  localStorage.setItem(THEME_KEY, newTheme);  
  applyTheme(newTheme);
});

applyTheme(localStorage.getItem(THEME_KEY) || 'light');
// ===== 2. LOAD DATA =====
async function loadDestinations() {
  const response = await fetch('data/destinations.json');
  if (!response.ok) {
    throw new Error('Could not load destinations (status ' + response.status + ')');
  }
  const destinations = await response.json();
  return destinations;
}

// ===== 3. HELPER FUNCTIONS (Loading, Errors & Formatting) =====
function showLoading(element, text) {  
  element.innerHTML = `    
    <div class="loading">      
      <span class="spinner"></span>      
      <span>${text}</span>    
    </div>  `;
}

function showError(element, text) {  
  element.innerHTML = `<p class="error">${text}</p>`;
}

function formatFee(fee) {
  if (fee === 0) {
    return 'Free';
  } else {
    return 'USD ' + fee;
  }
}

function getPriceLabel(fee) {
  if (fee === 0) {
    return 'Free';
  } else if (fee <= 15) {
    return 'Budget';
  } else {
    return 'Premium';
  }
}

function getCategoryClass(category) {
  switch (category) {
    case 'Heritage':
      return 'badge-heritage';
    case 'Beach':
      return 'badge-beach';
    case 'Nature':
      return 'badge-nature';
    case 'Wildlife':
      return 'badge-wildlife';
    default:
      return 'badge-other';
  }
}

function createCard(place) {
  const card = document.createElement('article');
  card.className = 'card';
  card.innerHTML = `
    <img src="${place.image}" alt="${place.name}">
    <h3>${place.name}</h3>
    <p class="meta">
      <span class="badge ${getCategoryClass(place.category)}">${place.category}</span>
      ${place.district} District
    </p>
    <p>${place.description}</p>
    <p class="fee">Entry: ${formatFee(place.entryFeeUSD)} · ${getPriceLabel(place.entryFeeUSD)}</p>
    <a href="details.html?id=${place.id}">View details</a>
  `;
  return card;
}

// ===== 4. HOME PAGE =====
async function initHomePage() {
  const featuredSection = document.querySelector('#featured');
  if (!featuredSection) return;
  try {
    const destinations = await loadDestinations();
    const featured = destinations.filter(place => place.featured === true);
    for (const place of featured) {
      featuredSection.appendChild(createCard(place));
    }
  } catch (error) {
    featuredSection.insertAdjacentHTML('beforeend',
      `<p class="error">Featured destinations could not be loaded.</p>`);
    console.error(error);
  }
}

// ===== 5. DESTINATIONS PAGE & MAP =====
async function initDestinationsPage() {
  const list = document.querySelector('#destination-list');
  if (!list) return;
  const searchInput = document.querySelector('#search');
  const categorySelect = document.querySelector('#category');
  const sortSelect = document.querySelector('#sort');
  const resultCount = document.querySelector('#result-count');
  
  showLoading(list, 'Loading destinations...');
  
  let allDestinations = [];
  try {
    allDestinations = await loadDestinations();
  } catch (error) {
    showError(list, 'Sorry, destinations could not be loaded. Please try again later.');
    console.error(error);
    return;
  }

  // Show all destinations map
  showAllDestinationsMap(allDestinations);

  function updateList() {
    const searchText = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const category = categorySelect ? categorySelect.value : 'all';
    const sortBy = sortSelect ? sortSelect.value : 'name';
    
    const results = allDestinations.filter(function (place) {
      const matchesSearch =
        place.name.toLowerCase().includes(searchText) ||
        place.district.toLowerCase().includes(searchText);
      const matchesCategory = category === 'all' || place.category === category;
      return matchesSearch && matchesCategory;
    });
    
    if (sortBy === 'name') {
      results.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'fee-low') {
      results.sort((a, b) => a.entryFeeUSD - b.entryFeeUSD);
    } else if (sortBy === 'fee-high') {
      results.sort((a, b) => b.entryFeeUSD - a.entryFeeUSD);
    }
    
    list.innerHTML = '';
    if (results.length === 0) {
      list.innerHTML = '<p class="no-results">No destinations match your search.</p>';
    } else {
      for (const place of results) {
        list.appendChild(createCard(place));
      }
    }
    if (resultCount) {
      resultCount.textContent = `Showing ${results.length} of ${allDestinations.length} destinations`;
    }
  }
  
  if (searchInput) searchInput.addEventListener('input', updateList);
  if (categorySelect) categorySelect.addEventListener('change', updateList);
  if (sortSelect) sortSelect.addEventListener('change', updateList);
  updateList();
}

// ===== 5b. API: WEATHER (Open-Meteo) =====
function describeWeather(code) {  
  if (code === 0) {    
    return 'Clear sky';  
  } else if (code <= 3) {    
    return 'Partly cloudy';  
  } else if (code === 45 || code === 48) {    
    return 'Foggy';  
  } else if (code >= 51 && code <= 57) {    
    return 'Drizzle';  
  } else if (code >= 61 && code <= 67) {    
    return 'Rain';  
  } else if (code >= 80 && code <= 82) {    
    return 'Rain showers';  
  } else if (code >= 95) {    
    return 'Thunderstorm';  
  } else {    
    return 'Mixed conditions';  
  }
}

async function showWeather(place) {  
  const box = document.querySelector('#weather');  
  if (!box) return;  
  showLoading(box, 'Loading weather...');
  const url = 'https://api.open-meteo.com/v1/forecast'    
    + `?latitude=${place.lat}&longitude=${place.lng}`    
    + '&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code'    
    + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max'    
    + '&timezone=Asia%2FColombo&forecast_days=3';  
  try {    
    const response = await fetch(url);    
    if (!response.ok) {      
      throw new Error('Weather API error (status ' + response.status + ')');    
    }    
    const data = await response.json();    
    const current = data.current;    
    const daily = data.daily;    
    
    let forecastHtml = '';    
    for (let i = 0; i < daily.time.length; i++) {      
      const dayName = new Date(daily.time[i]).toLocaleDateString('en-GB', {        
        weekday: 'short', day: 'numeric', month: 'short'      
      });      
      forecastHtml += `        
        <div class="forecast-day">          
          <strong>${dayName}</strong>          
          <p>${describeWeather(daily.weather_code[i])}</p>          
          <p>${Math.round(daily.temperature_2m_max[i])}° / ${Math.round(daily.temperature_2m_min[i])}°C</p>          
          <p>Rain: ${daily.precipitation_probability_max[i]}%</p>        
        </div>      `;    
    }    
    box.innerHTML = `      
      <div class="weather-now">        
        <p class="temp">${Math.round(current.temperature_2m)}°C</p>        
        <p>${describeWeather(current.weather_code)}</p>        
        <p>Humidity ${current.relative_humidity_2m}% · Wind ${current.wind_speed_10m} km/h</p>      
      </div>      
      <div class="forecast">${forecastHtml}</div>    `;  
  } catch (error) {    
    showError(box, 'Weather is unavailable right now. Please try again later.'); 
    console.error(error);  
  }
}

// ===== 5c. API: CURRENCY (Frankfurter) =====
let usdToLkrRate = null;   

async function getUsdToLkrRate() {  
  if (usdToLkrRate !== null) {    
    return usdToLkrRate;   
  }  
  const response = await fetch('https://api.frankfurter.dev/v2/rate/usd/lkr');  
  if (!response.ok) {    
    throw new Error('Currency API error (status ' + response.status + ')');  
  }  
  const data = await response.json();  
  usdToLkrRate = data.rate;  
  return usdToLkrRate;
}

function formatLkr(amount) {  
  return 'Rs. ' + Math.round(amount).toLocaleString('en-LK');
}

async function showFeeInLkr(place) {  
  const feeBox = document.querySelector('#fee-lkr');  
  if (!feeBox || place.entryFeeUSD === 0) return;   
  try {    
    const rate = await getUsdToLkrRate();    
    feeBox.textContent = ` ≈ ${formatLkr(place.entryFeeUSD * rate)}`;  
  } catch (error) {    
    feeBox.textContent = '';   
    console.error(error);  
  }
}

// ===== 5d. API: MAPS (Leaflet + OpenStreetMap) =====
function addBaseLayer(map) {  
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {    
    maxZoom: 19,    
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'  
  }).addTo(map);
}

function showMap(place) {  
  const mapBox = document.querySelector('#map');  
  if (!mapBox) return;  
  if (typeof L === 'undefined') {   
    mapBox.textContent = 'The map could not be loaded.';    
    return;  
  }  
  mapBox.textContent = '';   
  const map = L.map('map').setView([place.lat, place.lng], 13);  
  addBaseLayer(map);  
  L.marker([place.lat, place.lng])    
    .addTo(map)    
    .bindPopup(`<strong>${place.name}</strong><br>${place.district} District`)    
    .openPopup();
}

function showAllDestinationsMap(destinations) {  
  const mapBox = document.querySelector('#all-map');  
  if (!mapBox) return;  
  if (typeof L === 'undefined') {    
    mapBox.textContent = 'The map could not be loaded.';    
    return;  
  }  
  const map = L.map('all-map');  
  addBaseLayer(map);  
  const points = [];  
  for (const place of destinations) {    
    L.marker([place.lat, place.lng])      
      .addTo(map)      
      .bindPopup(`        
        <strong>${place.name}</strong><br>        
        ${place.category}<br>        
        <a href="details.html?id=${place.id}">View details</a>      
      `);    
    points.push([place.lat, place.lng]);  
  }  
  if (points.length > 0) {
    map.fitBounds(points, { padding: [30, 30] });   
  }
}
// ===== 5e. MY TRIP STORAGE (localStorage) =====
const TRIP_KEY = 'lankaExplorerTrip';
const TRAVELLERS_KEY = 'lankaExplorerTravellers';

function getTrip() {  
  const saved = localStorage.getItem(TRIP_KEY);  
  if (saved === null) {    
    return [];  
  }  
  return JSON.parse(saved);
}

function saveTrip(trip) {  
  localStorage.setItem(TRIP_KEY, JSON.stringify(trip));  
  updateTripCount();
}

function isInTrip(id) {  
  return getTrip().includes(id);
}

function addToTrip(id) {  
  const trip = getTrip();  
  if (!trip.includes(id)) {    
    trip.push(id);    
    saveTrip(trip);  
  }
}

function removeFromTrip(id) {  
  const trip = getTrip().filter(tripId => tripId !== id);  
  saveTrip(trip);
}

function updateTripCount() {  
  const link = document.querySelector('nav a[href="trip.html"]');  
  if (!link) return;  
  const count = getTrip().length;  
  if (count > 0) {    
    link.textContent = `My Trip (${count})`;  
  } else {    
    link.textContent = 'My Trip';  }
}
function setupTripButton(place) {  
  const button = document.querySelector('#add-to-trip');  
  if (!button) return;  
  
  function refreshButton() {    
    if (isInTrip(place.id)) {      
      button.textContent = '✓ In My Trip (click to remove)';      
      button.classList.add('added');    
    } else {      
      button.textContent = 'Add to My Trip';      
      button.classList.remove('added');    }  
  }  
  
  button.addEventListener('click', function () {    
    if (isInTrip(place.id)) {      
      removeFromTrip(place.id);    } else {      
      addToTrip(place.id);    }    
    refreshButton();  
  });  
  
  refreshButton();
}
// ===== 6. DETAILS PAGE =====
async function initDetailsPage() {
  const container = document.querySelector('#destination');
  if (!container) return;
  
  showLoading(container, 'Loading destination...');
  
  const params = new URLSearchParams(window.location.search);
  const id = Number(params.get('id'));
  try {
    const destinations = await loadDestinations();
    const place = destinations.find(p => p.id === id);
    if (!place) {
      container.innerHTML = `
        <h1>Destination not found</h1>
        <p><a href="destinations.html">Back to all destinations</a></p>
      `;
      return;
    }
    document.title = `${place.name} | Lanka Explorer`;
    container.innerHTML = `
      <img src="${place.image}" alt="${place.name}">
      <h1>${place.name}</h1>
      <p class="meta">
        <span class="badge ${getCategoryClass(place.category)}">${place.category}</span>
        ${place.district} District
      </p>
      <p>${place.description}</p>
      <h2>Quick Facts</h2>
      <ul>
        <li><strong>Best time to visit:</strong> ${place.bestTime}</li>
        <li><strong>Entry fee:</strong> ${formatFee(place.entryFeeUSD)}<span id="fee-lkr"></span> (${getPriceLabel(place.entryFeeUSD)})</li>
        <li><strong>Coordinates:</strong> ${place.lat}, ${place.lng}</li>
      </ul>
    `;
    
    // Call Week 04 API functions
    showWeather(place);
    showFeeInLkr(place);
    showMap(place);
    
    setupTripButton(place);

  } catch (error) {
    showError(container, 'Sorry, this destination could not be loaded.');
    console.error(error);
  }
}
// ===== 6b. MY TRIP PAGE =====
async function initTripPage() {  
  const tableBody = document.querySelector('#trip-table tbody');  
  if (!tableBody) return;   
  
  const summary = document.querySelector('#trip-summary');  
  const travellersInput = document.querySelector('#travellers');  
  const totalUsdCell = document.querySelector('#total-usd');  
  const totalLkrCell = document.querySelector('#total-lkr');  
  const clearButton = document.querySelector('#clear-trip');  
  
  showLoading(summary, 'Loading your trip...');  
  
  let allDestinations = [];  
  try {    
    allDestinations = await loadDestinations();  
  } catch (error) {    
    showError(summary, 'Sorry, your trip could not be loaded.');    
    console.error(error);    
    return;  }  
  
  let rate = null;  
  try {    
    rate = await getUsdToLkrRate();  
  } catch (error) {    
    console.error(error);  
  }  
  
  travellersInput.value = localStorage.getItem(TRAVELLERS_KEY) || 1;  
  
  function renderTrip() {    
    const tripIds = getTrip();    
    const places = allDestinations.filter(place => tripIds.includes(place.id));    
    const travellers = Math.max(1, Number(travellersInput.value) || 1);    
    
    tableBody.innerHTML = '';    
    if (places.length === 0) {      
      tableBody.innerHTML = `        
        <tr>          
          <td colspan="5" class="no-results">            
            Your trip is empty. <a href="destinations.html">Browse destinations</a> to add some.          
          </td>        
        </tr>      `;    
    }    
    
    let totalPerPerson = 0;    
    for (const place of places) {      
      totalPerPerson += place.entryFeeUSD;      
      const row = document.createElement('tr');      
      row.innerHTML = `        
        <td><a href="details.html?id=${place.id}">${place.name}</a></td>        
        <td><span class="badge ${getCategoryClass(place.category)}">${place.category}</span></td>        
        <td>${formatFee(place.entryFeeUSD)}</td>        
        <td>${rate ? formatLkr(place.entryFeeUSD * rate) : '–'}</td>        
        <td><button type="button" class="remove-btn" data-id="${place.id}">Remove</button></td>      
      `;      
      tableBody.appendChild(row);    
    }    
    
    const groupTotal = totalPerPerson * travellers;    
    totalUsdCell.textContent = 'USD ' + groupTotal;    
    totalLkrCell.textContent = rate ? formatLkr(groupTotal * rate) : 'Unavailable';    
    summary.textContent = `${places.length} destination(s) for ${travellers} traveller(s).`;    
    
    if (rate) {      
      summary.textContent += ` Exchange rate used: 1 USD = Rs. ${rate.toFixed(2)}.`;    
    }    
    clearButton.hidden = places.length === 0;  
  }  
  
  tableBody.addEventListener('click', function (event) {    
    if (event.target.classList.contains('remove-btn')) {      
      const id = Number(event.target.dataset.id);      
      removeFromTrip(id);      
      renderTrip();    }  });  
  
  travellersInput.addEventListener('input', function () {    
    localStorage.setItem(TRAVELLERS_KEY, travellersInput.value);    
    renderTrip();  });  
  
  clearButton.addEventListener('click', function () {    
    if (confirm('Remove every destination from your trip?')) {      
      saveTrip([]);      
      renderTrip();    }  });  
  
  renderTrip();
}
// ===== 7. ENQUIRY FORM =====
function initEnquiryForm() {
  const form = document.querySelector('#enquiry-form');
  if (!form) return;
  const message = document.querySelector('#form-message');
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    const name = document.querySelector('#name').value.trim();
    const email = document.querySelector('#email').value.trim();
    const date = document.querySelector('#date').value;
    const people = Number(document.querySelector('#people').value);
    const interests = form.querySelectorAll('input[name="interest"]:checked');
    const errors = [];
    if (name.length < 3) {
      errors.push('Please enter your full name (at least 3 characters).');
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      errors.push('Please enter a valid email address.');
    }
    if (date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(date) < today) {
        errors.push('The travel date cannot be in the past.');
      }
    }
    if (people < 1 || people > 20) {
      errors.push('Number of travellers must be between 1 and 20.');
    }
    if (interests.length === 0) {
      errors.push('Please choose at least one interest.');
    }
    if (errors.length > 0) {
      message.className = 'form-error';
      message.innerHTML = '<ul>' + errors.map(e => `<li>${e}</li>`).join('') + '</ul>';
    } else {
      message.className = 'form-success';
      message.textContent = `Thank you, ${name}! We will contact you at ${email} within 24 hours.`;
      form.reset();
    }
  });
}

// ===== 8. START THE APP =====
initHomePage();
initDestinationsPage();
initDetailsPage();
initEnquiryForm();
updateTripCount();
initTripPage();
