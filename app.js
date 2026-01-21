// Skunk Ape Adventures - App.js

let allTours = [];
let filteredTours = [];

// DOM Elements
const toursContainer = document.getElementById('tours-container');
const tourCount = document.getElementById('tour-count');
const activityFilter = document.getElementById('activity-filter');
const priceFilter = document.getElementById('price-filter');
const searchInput = document.getElementById('search-input');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadTours();
  setupFilters();
});

// Load tours from JSON
async function loadTours() {
  try {
    const response = await fetch('tours-data.json');
    allTours = await response.json();
    filteredTours = [...allTours];
    renderTours();
  } catch (error) {
    console.error('Error loading tours:', error);
    toursContainer.innerHTML = '<div class="no-results"><h3>Unable to load tours</h3><p>Please refresh the page.</p></div>';
  }
}

// Setup filter listeners
function setupFilters() {
  activityFilter.addEventListener('change', applyFilters);
  priceFilter.addEventListener('change', applyFilters);
  searchInput.addEventListener('input', debounce(applyFilters, 300));
}

// Apply all filters
function applyFilters() {
  const activity = activityFilter.value.toLowerCase();
  const priceRange = priceFilter.value;
  const search = searchInput.value.toLowerCase().trim();

  filteredTours = allTours.filter(tour => {
    // Activity filter
    if (activity && !matchesActivity(tour, activity)) return false;
    
    // Price filter
    if (priceRange && !matchesPrice(tour, priceRange)) return false;
    
    // Search filter
    if (search && !matchesSearch(tour, search)) return false;
    
    return true;
  });

  renderTours();
}

// Activity matching
function matchesActivity(tour, activity) {
  const tags = (tour.tags || []).map(t => t.toLowerCase()).join(' ');
  const name = (tour.name || '').toLowerCase();
  
  const activityMap = {
    'airboat': ['airboat'],
    'kayak': ['kayak', 'paddle', 'canoe'],
    'wildlife': ['wildlife', 'gator', 'alligator', 'animal', 'bird'],
    'fishing': ['fishing', 'fish'],
    'boat-tour': ['boat tour', 'boat ride'],
    'eco-tour': ['eco', 'nature', 'mangrove'],
    'night': ['night', 'sunset', 'evening'],
    'private': ['private', 'charter']
  };

  const keywords = activityMap[activity] || [activity];
  return keywords.some(kw => tags.includes(kw) || name.includes(kw));
}

// Price matching
function matchesPrice(tour, range) {
  const price = tour.price;
  if (!price) return range === ''; // Show no-price tours only when "Any Price"
  
  switch (range) {
    case '0-50': return price <= 50;
    case '50-100': return price > 50 && price <= 100;
    case '100-200': return price > 100 && price <= 200;
    case '200+': return price > 200;
    default: return true;
  }
}

// Search matching
function matchesSearch(tour, search) {
  const searchable = [
    tour.name,
    tour.company,
    tour.description,
    ...(tour.tags || [])
  ].join(' ').toLowerCase();
  
  return searchable.includes(search);
}

// Render tour cards
function renderTours() {
  tourCount.textContent = filteredTours.length;

  if (filteredTours.length === 0) {
    toursContainer.innerHTML = `
      <div class="no-results">
        <h3>No tours found</h3>
        <p>Try adjusting your filters or search terms.</p>
      </div>
    `;
    return;
  }

  // Sort by quality score descending
  const sorted = [...filteredTours].sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0));

  toursContainer.innerHTML = sorted.map(tour => createTourCard(tour)).join('');
}

// Create single tour card HTML
function createTourCard(tour) {
  const price = tour.price ? `$${tour.price}` : 'Check Price';
  const tag = tour.tags?.[0] || 'Tour';
  const duration = tour.durationText || '';
  const description = tour.description || 'Experience the Everglades with this local tour operator.';
  
  return `
    <article class="tour-card">
      <div class="tour-image">
        <img src="${tour.image}" alt="${tour.name}" loading="lazy">
        <span class="tour-price">${price}</span>
        <span class="tour-tag">${tag}</span>
      </div>
      <div class="tour-content">
        <h3 class="tour-name">${tour.name}</h3>
        <p class="tour-company">${tour.company}</p>
        <p class="tour-description">${truncate(description, 100)}</p>
        <div class="tour-meta">
          ${duration ? `<span>⏱ ${cleanDuration(duration)}</span>` : ''}
          ${tour.freeCancellation ? '<span>✓ Free cancellation</span>' : ''}
        </div>
        <a href="${tour.bookingLink}" 
           target="_blank" 
           rel="noopener" 
           class="tour-cta"
           onclick="trackBookingClick('${escapeJs(tour.name)}', '${tour.id}', ${tour.price || 0})">
          Check Availability
        </a>
      </div>
    </article>
  `;
}

// GA4 Tracking
function trackBookingClick(tourName, tourId, price) {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'booking_click', {
      'event_category': 'conversion',
      'event_label': tourName,
      'tour_id': tourId,
      'value': price,
      'currency': 'USD'
    });
  }
}

// Utility: Truncate text
function truncate(str, length) {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.substring(0, length).trim() + '...';
}

// Utility: Clean duration text
function cleanDuration(duration) {
  return duration.replace(/Duration\s*/gi, '').replace(/\n/g, ' ').trim();
}

// Utility: Escape JS string
function escapeJs(str) {
  return (str || '').replace(/'/g, "\\'").replace(/"/g, '\\"');
}

// Utility: Debounce
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
