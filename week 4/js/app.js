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

// ===== 2. LOAD DATA =====
async function loadDestinations() {
  const response = await fetch('data/destinations.json');
  if (!response.ok) {
    throw new Error('Could not load destinations (status ' + response.status + ')');
  }
  const destinations = await response.json();
  return destinations;
}

// ===== 3. HELPER FUNCTIONS =====
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

// ===== 5. DESTINATIONS PAGE =====
async function initDestinationsPage() {
  const list = document.querySelector('#destination-list');
  if (!list) return;
  const searchInput = document.querySelector('#search');
  const categorySelect = document.querySelector('#category');
  const sortSelect = document.querySelector('#sort');
  const resultCount = document.querySelector('#result-count');
  let allDestinations = [];
  try {
    allDestinations = await loadDestinations();
  } catch (error) {
    list.innerHTML = '<p class="error">Sorry, destinations could not be loaded. Please try again later.</p>';
    console.error(error);
    return;
  }
  function updateList() {
    const searchText = searchInput.value.trim().toLowerCase();
    const category = categorySelect.value;
    const sortBy = sortSelect.value;
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

// ===== 6. DETAILS PAGE =====
async function initDetailsPage() {
  const container = document.querySelector('#destination');
  if (!container) return;
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
        <li><strong>Entry fee:</strong> ${formatFee(place.entryFeeUSD)} (${getPriceLabel(place.entryFeeUSD)})</li>
        <li><strong>Coordinates:</strong> ${place.lat}, ${place.lng}</li>
      </ul>
    `;
  } catch (error) {
    container.innerHTML = '<p class="error">Sorry, this destination could not be loaded.</p>';
    console.error(error);
  }
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

initHomePage();
initDestinationsPage();
initDetailsPage();
initEnquiryForm();