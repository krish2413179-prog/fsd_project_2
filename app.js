/* ===========================
   LUXORA HOTELS — app.js
   =========================== */
const API_BASE = 'https://demohotelsapi.pythonanywhere.com/hotels/';
const PAGE_SIZE = 12;

const state = {
    hotels: [],
    displayedCount: 0,
    currentView: 'listing',
    selectedHotel: null,
    wishlist: JSON.parse(localStorage.getItem('luxora_wishlist')) || [],
    bookings: JSON.parse(localStorage.getItem('luxora_bookings')) || [],
    filters: { search: '', location: '', min_price: '', max_price: '', min_rating: '', order_by: '' },
    viewMode: 'grid',
    heroSlide: 0,
    heroTimer: null,
    isLoading: false,
};

const el = {
    listingPage: document.getElementById('listing-page'),
    detailsPage: document.getElementById('details-page'),
    wishlistPage: document.getElementById('wishlist-page'),
    bookingsPage: document.getElementById('bookings-page'),
    hotelsGrid: document.getElementById('hotels-grid'),
    shimmerContainer: document.getElementById('shimmer-container'),
    resultsCountText: document.getElementById('results-count-text'),
    resultsInfoBar: document.getElementById('results-info-bar'),
    loadMoreWrapper: document.getElementById('load-more-wrapper'),
    btnLoadMore: document.getElementById('btn-load-more'),
    hotelDetailsContent: document.getElementById('hotel-details-content'),
    wishlistGrid: document.getElementById('wishlist-grid'),
    bookingsList: document.getElementById('bookings-list'),
    searchInput: document.getElementById('search-input'),
    searchClearBtn: document.getElementById('search-clear-btn'),
    citySelect: document.getElementById('city-select'),
    minPrice: document.getElementById('min-price'),
    maxPrice: document.getElementById('max-price'),
    minRatingSelect: document.getElementById('min-rating-select'),
    sortSelect: document.getElementById('sort-select'),
    btnApplyFilters: document.getElementById('btn-apply-filters'),
    btnResetFilters: document.getElementById('btn-reset-filters'),
    btnGotoListing: document.getElementById('btn-goto-listing'),
    btnGotoWishlist: document.getElementById('btn-goto-wishlist'),
    btnGotoBookings: document.getElementById('btn-goto-bookings'),
    btnBackToListing: document.getElementById('btn-back-to-listing'),
    navLogo: document.getElementById('nav-logo'),
    wishlistBadge: document.getElementById('wishlist-badge-count'),
    bookingsBadge: document.getElementById('bookings-badge-count'),
    btnGridView: document.getElementById('btn-grid-view'),
    btnListView: document.getElementById('btn-list-view'),
    toastContainer: document.getElementById('toast-container'),
    heroBgSlider: document.getElementById('hero-bg-slider'),
    heroDots: document.getElementById('hero-dots'),
    heroSearchInput: document.getElementById('hero-search-input'),
    heroSearchBtn: document.getElementById('hero-search-btn'),
    heroCityPills: document.getElementById('hero-city-pills'),
    bookingModalOverlay: document.getElementById('booking-modal-overlay'),
    bookingModalBody: document.getElementById('booking-modal-body'),
    bookingModalCloseBtn: document.getElementById('booking-modal-close-btn'),
    appHeader: document.getElementById('app-header'),
    heroSection: document.getElementById('hero-section'),
};

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    updateBadges();
    startHeroSlider();
    navigate('listing');
    fetchHotels();
});

/* ── Event Listeners ── */
function setupEventListeners() {
    el.navLogo.addEventListener('click', e => { e.preventDefault(); navigate('listing'); });
    el.btnGotoListing.addEventListener('click', () => navigate('listing'));
    el.btnGotoWishlist.addEventListener('click', () => navigate('wishlist'));
    el.btnGotoBookings.addEventListener('click', () => navigate('bookings'));
    el.btnBackToListing.addEventListener('click', () => navigate('listing'));

    el.searchInput.addEventListener('input', e => {
        state.filters.search = e.target.value;
        el.searchClearBtn.classList.toggle('visible', !!e.target.value);
    });
    el.searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') applyFilters(); });
    el.searchClearBtn.addEventListener('click', () => {
        el.searchInput.value = '';
        state.filters.search = '';
        el.searchClearBtn.classList.remove('visible');
        applyFilters();
    });

    el.btnApplyFilters.addEventListener('click', applyFilters);
    el.btnResetFilters.addEventListener('click', resetFilters);
    el.btnLoadMore.addEventListener('click', loadMore);

    el.btnGridView.addEventListener('click', () => setViewMode('grid'));
    el.btnListView.addEventListener('click', () => setViewMode('list'));

    el.heroSearchBtn.addEventListener('click', () => {
        const q = el.heroSearchInput.value.trim();
        if (q) { state.filters.search = q; el.searchInput.value = q; }
        navigate('listing');
        applyFilters();
    });
    el.heroSearchInput.addEventListener('keydown', e => { if (e.key === 'Enter') el.heroSearchBtn.click(); });

    if (el.heroCityPills) {
        el.heroCityPills.querySelectorAll('.city-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                const city = pill.dataset.city;
                state.filters.location = city;
                el.citySelect.value = city;
                navigate('listing');
                applyFilters();
            });
        });
    }

    document.querySelectorAll('.hero-dot').forEach(dot => {
        dot.addEventListener('click', () => goToSlide(parseInt(dot.dataset.index)));
    });

    el.bookingModalCloseBtn.addEventListener('click', closeBookingModal);
    el.bookingModalOverlay.addEventListener('click', e => {
        if (e.target === el.bookingModalOverlay) closeBookingModal();
    });

    window.addEventListener('scroll', () => {
        el.appHeader.classList.toggle('scrolled', window.scrollY > 30);
    });
}

/* ── Hero Slider ── */
function startHeroSlider() {
    const slides = el.heroBgSlider.querySelectorAll('.hero-slide');
    const dots = el.heroDots.querySelectorAll('.hero-dot');
    state.heroTimer = setInterval(() => {
        goToSlide((state.heroSlide + 1) % slides.length);
    }, 5000);
}
function goToSlide(index) {
    const slides = el.heroBgSlider.querySelectorAll('.hero-slide');
    const dots = el.heroDots.querySelectorAll('.hero-dot');
    slides[state.heroSlide].classList.remove('active');
    dots[state.heroSlide].classList.remove('active');
    state.heroSlide = index;
    slides[index].classList.add('active');
    dots[index].classList.add('active');
}

/* ── Navigation ── */
function navigate(view) {
    state.currentView = view;
    [el.listingPage, el.detailsPage, el.wishlistPage, el.bookingsPage].forEach(p => p.classList.remove('active'));
    [el.btnGotoListing, el.btnGotoWishlist, el.btnGotoBookings].forEach(b => b.classList.remove('active'));

    const showHero = view === 'listing';
    if (el.heroSection) el.heroSection.style.display = showHero ? 'flex' : 'none';

    if (view === 'listing') {
        el.listingPage.classList.add('active');
        el.btnGotoListing.classList.add('active');
    } else if (view === 'details') {
        el.detailsPage.classList.add('active');
    } else if (view === 'wishlist') {
        el.wishlistPage.classList.add('active');
        el.btnGotoWishlist.classList.add('active');
        renderWishlist();
    } else if (view === 'bookings') {
        el.bookingsPage.classList.add('active');
        el.btnGotoBookings.classList.add('active');
        renderBookings();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    lucide.createIcons();
}

/* ── Fetch Hotels ── */
async function fetchHotels(params = {}) {
    if (state.isLoading) return;
    state.isLoading = true;
    showShimmer();

    const url = new URL(API_BASE);
    Object.entries(params).forEach(([k, v]) => { if (v !== '' && v !== null && v !== undefined) url.searchParams.set(k, v); });
    // Always fetch all for local pagination
    url.searchParams.delete('limit');
    url.searchParams.delete('skip');

    try {
        const res = await fetch(url.toString());
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        state.hotels = data.data || [];
        state.displayedCount = 0;
        renderHotels(false);
    } catch (err) {
        console.error(err);
        hideShimmer();
        el.hotelsGrid.innerHTML = `<div class="no-results"><svg data-lucide="wifi-off"></svg><h3>Failed to load hotels</h3><p>Please check your connection and try again.</p></div>`;
        lucide.createIcons();
        showToast('Could not load hotels. Try again.', 'error');
    } finally {
        state.isLoading = false;
    }
}

function showShimmer() {
    el.shimmerContainer.style.display = 'contents';
    el.loadMoreWrapper.style.display = 'none';
    el.resultsCountText.textContent = 'Loading hotels...';
}
function hideShimmer() {
    el.shimmerContainer.style.display = 'none';
}

function renderHotels(append = false) {
    hideShimmer();
    const total = state.hotels.length;
    const nextCount = Math.min(state.displayedCount + PAGE_SIZE, total);

    if (total === 0) {
        el.hotelsGrid.innerHTML = `<div class="no-results"><svg data-lucide="search-x"></svg><h3>No hotels found</h3><p>Try adjusting your filters or search terms.</p></div>`;
        el.resultsCountText.textContent = 'No results found';
        el.loadMoreWrapper.style.display = 'none';
        lucide.createIcons();
        return;
    }

    const slice = state.hotels.slice(state.displayedCount, nextCount);
    state.displayedCount = nextCount;

    const fragment = slice.map(h => hotelCardHTML(h)).join('');

    if (append) {
        el.hotelsGrid.innerHTML += fragment;
    } else {
        el.hotelsGrid.innerHTML = fragment;
    }

    el.resultsCountText.textContent = `Showing ${state.displayedCount} of ${total} hotel${total !== 1 ? 's' : ''}`;
    el.loadMoreWrapper.style.display = state.displayedCount < total ? 'block' : 'none';
    lucide.createIcons();
}

function loadMore() {
    renderHotels(true);
}

function hotelCardHTML(h) {
    const inWishlist = state.wishlist.some(w => w.id === h.id);
    const price = parseFloat(h.price).toFixed(0);
    return `
    <div class="hotel-card" data-id="${h.id}" onclick="viewHotelDetails(${h.id})">
        <div class="hotel-card-img-wrapper">
            <img src="${h.thumbnail}" alt="${h.name}" class="hotel-card-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=60'">
            <div class="hotel-location-badge">${h.location}</div>
            <button class="hotel-wishlist-btn ${inWishlist ? 'in-wishlist' : ''}" onclick="event.stopPropagation();toggleWishlist(${h.id})" title="${inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}">
                <i data-lucide="heart"></i>
            </button>
        </div>
        <div class="hotel-card-body">
            <div class="hotel-card-name">${h.name}</div>
            <div class="hotel-card-desc">${h.description}</div>
            <div class="hotel-rating-row">
                <div class="stars-row">${starsHTML(h.rating)}</div>
                <span class="rating-val">${parseFloat(h.rating).toFixed(1)}</span>
                <span class="rating-count">/ 5.0</span>
            </div>
            <div class="hotel-card-footer">
                <div>
                    <div class="price-label">Per night</div>
                    <div class="hotel-price">&#8377;${price} <span>/ night</span></div>
                </div>
                <button class="btn-book-now" onclick="event.stopPropagation();openBookingModal(${h.id})">Book Now</button>
            </div>
        </div>
    </div>`;
}

/* ── Stars ── */
function starsHTML(rating) {
    let html = '';
    const r = Math.round(parseFloat(rating));
    for (let i = 1; i <= 5; i++) {
        html += `<svg xmlns="http://www.w3.org/2000/svg" class="${i <= r ? '' : 'empty'}" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
    }
    return html;
}

/* ── Filters ── */
function applyFilters() {
    const params = {};
    const search = (state.filters.search || el.searchInput.value.trim());
    const location = el.citySelect.value;
    const minPrice = el.minPrice.value;
    const maxPrice = el.maxPrice.value;
    const minRating = el.minRatingSelect.value;
    const orderBy = el.sortSelect.value;
    if (search) params.search = search;
    if (location) params.location = location;
    if (minPrice) params.min_price = minPrice;
    if (maxPrice) params.max_price = maxPrice;
    if (minRating) params.min_rating = minRating;
    if (orderBy) params.order_by = orderBy;
    state.filters = { search, location, min_price: minPrice, max_price: maxPrice, min_rating: minRating, order_by: orderBy };
    if (state.currentView !== 'listing') navigate('listing');
    fetchHotels(params);
}

function resetFilters() {
    el.searchInput.value = '';
    el.citySelect.value = '';
    el.minPrice.value = '';
    el.maxPrice.value = '';
    el.minRatingSelect.value = '';
    el.sortSelect.value = '';
    el.searchClearBtn.classList.remove('visible');
    state.filters = { search: '', location: '', min_price: '', max_price: '', min_rating: '', order_by: '' };
    fetchHotels({});
}

/* ── View Mode ── */
function setViewMode(mode) {
    state.viewMode = mode;
    el.hotelsGrid.classList.toggle('list-view', mode === 'list');
    el.btnGridView.classList.toggle('active', mode === 'grid');
    el.btnListView.classList.toggle('active', mode === 'list');
}

/* ── Hotel Details ── */
window.viewHotelDetails = async function(id) {
    el.hotelDetailsContent.innerHTML = `<div style="padding:4rem;text-align:center;"><div class="shimmer-card" style="height:400px;border-radius:16px;"></div></div>`;
    navigate('details');
    try {
        const res = await fetch(`${API_BASE}${id}/`);
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        const hotel = data.data || data;
        state.selectedHotel = hotel;
        renderHotelDetails(hotel);
    } catch (err) {
        el.hotelDetailsContent.innerHTML = `<div style="padding:4rem;text-align:center;"><p style="color:var(--accent-pink)">Failed to load hotel details.</p><button class="btn-back" onclick="navigate('listing')" style="margin-top:1rem;">Back</button></div>`;
        showToast('Could not load hotel details.', 'error');
    }
};

function renderHotelDetails(h) {
    const inWishlist = state.wishlist.some(w => w.id === h.id);
    const photos = h.photos && h.photos.length > 0 ? h.photos : [h.thumbnail];
    const price = parseFloat(h.price).toFixed(0);

    el.hotelDetailsContent.innerHTML = `
    <div class="details-gallery">
        <div class="main-image-wrapper">
            <img src="${photos[0]}" alt="${h.name}" id="main-hotel-img" onerror="this.src='${h.thumbnail}'">
        </div>
        ${photos.length > 1 ? `<div class="thumbnail-strip">
            ${photos.map((p, i) => `<img src="${p}" alt="${h.name}" class="${i === 0 ? 'active' : ''}" onclick="changeMainImg('${p}', this)">`).join('')}
        </div>` : ''}
    </div>
    <div class="details-info-grid">
        <div class="details-info">
            <div class="detail-location"><i data-lucide="map-pin"></i> ${h.location}</div>
            <h1 class="detail-title">${h.name}</h1>
            <div class="detail-rating">
                <div class="stars-row">${starsHTML(h.rating)}</div>
                <span class="rating-text">${parseFloat(h.rating).toFixed(1)} / 5.0 rating</span>
            </div>
            <p class="detail-description">${h.description}</p>
        </div>
        <div class="booking-card">
            <div class="booking-card-price">
                <div class="price-per-night">Price per night</div>
                <div class="big-price">&#8377;${price}</div>
            </div>
            <div class="booking-form-group">
                <label>Check-in</label>
                <input type="date" id="checkin-date" min="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="booking-form-group">
                <label>Check-out</label>
                <input type="date" id="checkout-date">
            </div>
            <div class="booking-form-row">
                <div class="booking-form-group">
                    <label>Adults</label>
                    <select id="guests-adults"><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select>
                </div>
                <div class="booking-form-group">
                    <label>Rooms</label>
                    <select id="guests-rooms"><option>1</option><option>2</option><option>3</option></select>
                </div>
            </div>
            <button class="btn-confirm-book" onclick="confirmBookingFromDetail(${h.id})">
                <i data-lucide="calendar-check"></i> Confirm Booking
            </button>
            <p class="booking-fee-note">Free cancellation within 24 hours</p>
            <button class="add-wishlist-detail-btn ${inWishlist ? 'in-wishlist' : ''}" id="wishlist-detail-btn" onclick="toggleWishlistDetail(${h.id})">
                <i data-lucide="heart"></i> ${inWishlist ? 'Remove from Wishlist' : 'Save to Wishlist'}
            </button>
        </div>
    </div>`;

    lucide.createIcons();

    const checkin = document.getElementById('checkin-date');
    const checkout = document.getElementById('checkout-date');
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(); dayAfter.setDate(dayAfter.getDate() + 2);
    checkin.value = tomorrow.toISOString().split('T')[0];
    checkout.value = dayAfter.toISOString().split('T')[0];
    checkin.addEventListener('change', () => {
        if (checkout.value <= checkin.value) {
            const d = new Date(checkin.value); d.setDate(d.getDate() + 1);
            checkout.value = d.toISOString().split('T')[0];
        }
        checkout.min = checkin.value;
    });
}

window.changeMainImg = function(src, el) {
    document.getElementById('main-hotel-img').src = src;
    document.querySelectorAll('.thumbnail-strip img').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
};

window.toggleWishlistDetail = function(id) {
    toggleWishlist(id);
    const inWishlist = state.wishlist.some(w => w.id === id);
    const btn = document.getElementById('wishlist-detail-btn');
    if (btn) {
        btn.classList.toggle('in-wishlist', inWishlist);
        btn.innerHTML = `<i data-lucide="heart"></i> ${inWishlist ? 'Remove from Wishlist' : 'Save to Wishlist'}`;
        lucide.createIcons();
    }
};

window.confirmBookingFromDetail = function(id) {
    const hotel = state.selectedHotel;
    if (!hotel) return;
    const checkin = document.getElementById('checkin-date')?.value;
    const checkout = document.getElementById('checkout-date')?.value;
    const adults = document.getElementById('guests-adults')?.value;
    const rooms = document.getElementById('guests-rooms')?.value;
    if (!checkin || !checkout || checkout <= checkin) {
        showToast('Please select valid check-in and check-out dates.', 'warning');
        return;
    }
    const nights = Math.ceil((new Date(checkout) - new Date(checkin)) / 86400000);
    const total = (parseFloat(hotel.price) * nights * parseInt(rooms)).toFixed(0);
    const booking = { id: Date.now(), hotelId: hotel.id, name: hotel.name, thumbnail: hotel.thumbnail, location: hotel.location, checkin, checkout, nights, adults, rooms, total, status: 'Confirmed' };
    state.bookings.unshift(booking);
    saveBookings();
    updateBadges();
    showToast(`Booking confirmed at ${hotel.name}!`, 'success');
    setTimeout(() => navigate('bookings'), 800);
};

/* ── Booking Modal (from card) ── */
window.openBookingModal = function(id) {
    const hotel = state.hotels.find(h => h.id === id);
    if (!hotel) return;
    const price = parseFloat(hotel.price).toFixed(0);
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(); dayAfter.setDate(dayAfter.getDate() + 2);
    const tmrStr = tomorrow.toISOString().split('T')[0];
    const daStr = dayAfter.toISOString().split('T')[0];

    el.bookingModalBody.innerHTML = `
        <h2>${hotel.name}</h2>
        <p class="modal-subtitle"><i data-lucide="map-pin" style="display:inline;width:12px;height:12px;"></i> ${hotel.location} &nbsp;|&nbsp; &#8377;${price}/night</p>
        <div class="booking-form-group">
            <label>Check-in</label>
            <input type="date" id="modal-checkin" value="${tmrStr}" min="${tmrStr}">
        </div>
        <div class="booking-form-group">
            <label>Check-out</label>
            <input type="date" id="modal-checkout" value="${daStr}" min="${tmrStr}">
        </div>
        <div class="booking-form-row">
            <div class="booking-form-group"><label>Adults</label><select id="modal-adults"><option>1</option><option selected>2</option><option>3</option><option>4</option></select></div>
            <div class="booking-form-group"><label>Rooms</label><select id="modal-rooms"><option selected>1</option><option>2</option><option>3</option></select></div>
        </div>
        <button class="btn-confirm-book" onclick="confirmModalBooking(${id})">
            <i data-lucide="calendar-check"></i> Confirm Booking
        </button>
        <p class="booking-fee-note">Free cancellation within 24 hours</p>`;

    el.bookingModalOverlay.style.display = 'flex';
    lucide.createIcons();

    document.getElementById('modal-checkin').addEventListener('change', function() {
        const co = document.getElementById('modal-checkout');
        if (co.value <= this.value) {
            const d = new Date(this.value); d.setDate(d.getDate() + 1);
            co.value = d.toISOString().split('T')[0];
        }
        co.min = this.value;
    });
};

window.confirmModalBooking = function(id) {
    const hotel = state.hotels.find(h => h.id === id);
    const checkin = document.getElementById('modal-checkin')?.value;
    const checkout = document.getElementById('modal-checkout')?.value;
    const adults = document.getElementById('modal-adults')?.value;
    const rooms = document.getElementById('modal-rooms')?.value;
    if (!checkin || !checkout || checkout <= checkin) {
        showToast('Please select valid dates.', 'warning'); return;
    }
    const nights = Math.ceil((new Date(checkout) - new Date(checkin)) / 86400000);
    const total = (parseFloat(hotel.price) * nights * parseInt(rooms)).toFixed(0);
    const booking = { id: Date.now(), hotelId: hotel.id, name: hotel.name, thumbnail: hotel.thumbnail, location: hotel.location, checkin, checkout, nights, adults, rooms, total, status: 'Confirmed' };
    state.bookings.unshift(booking);
    saveBookings();
    updateBadges();
    closeBookingModal();
    showToast(`Booking confirmed at ${hotel.name}!`, 'success');
    setTimeout(() => navigate('bookings'), 600);
};

function closeBookingModal() {
    el.bookingModalOverlay.style.display = 'none';
}

/* ── Wishlist ── */
window.toggleWishlist = function(id) {
    const idx = state.wishlist.findIndex(w => w.id === id);
    if (idx > -1) {
        state.wishlist.splice(idx, 1);
        showToast('Removed from wishlist', 'warning');
    } else {
        const hotel = state.hotels.find(h => h.id === id) || state.selectedHotel;
        if (hotel) { state.wishlist.push(hotel); showToast(`Saved ${hotel.name} to wishlist!`, 'success'); }
    }
    saveWishlist();
    updateBadges();
    // Update button in grid
    const btn = document.querySelector(`.hotel-card[data-id="${id}"] .hotel-wishlist-btn`);
    if (btn) btn.classList.toggle('in-wishlist', state.wishlist.some(w => w.id === id));
};

function renderWishlist() {
    if (state.wishlist.length === 0) {
        el.wishlistGrid.innerHTML = `<div class="wishlist-empty"><i data-lucide="heart-off"></i><h3>Your wishlist is empty</h3><p>Save hotels you love to find them easily later.</p><button class="btn-browse" onclick="navigate('listing')">Browse Hotels</button></div>`;
    } else {
        el.wishlistGrid.innerHTML = state.wishlist.map(h => hotelCardHTML(h)).join('');
    }
    lucide.createIcons();
}

function saveWishlist() { localStorage.setItem('luxora_wishlist', JSON.stringify(state.wishlist)); }

/* ── Bookings ── */
function renderBookings() {
    if (state.bookings.length === 0) {
        el.bookingsList.innerHTML = `<div class="bookings-empty"><i data-lucide="calendar-x"></i><h3>No bookings yet</h3><p>Find your perfect hotel and make your first booking!</p><button class="btn-browse" onclick="navigate('listing')">Browse Hotels</button></div>`;
    } else {
        el.bookingsList.innerHTML = state.bookings.map(b => `
        <div class="booking-item">
            <img src="${b.thumbnail}" alt="${b.name}" onerror="this.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&q=60'">
            <div class="booking-item-info">
                <div class="booking-item-name">${b.name}</div>
                <div class="booking-item-meta">
                    <span><i data-lucide="map-pin"></i>${b.location}</span>
                    <span><i data-lucide="calendar"></i>${formatDate(b.checkin)} - ${formatDate(b.checkout)}</span>
                    <span><i data-lucide="moon"></i>${b.nights} night${b.nights > 1 ? 's' : ''}</span>
                    <span><i data-lucide="users"></i>${b.adults} adult${b.adults > 1 ? 's' : ''}, ${b.rooms} room${b.rooms > 1 ? 's' : ''}</span>
                </div>
                <span class="booking-status"><i data-lucide="check-circle"></i>${b.status}</span>
                <br>
                <button class="btn-cancel-booking" onclick="cancelBooking(${b.id})">Cancel Booking</button>
            </div>
            <div class="booking-item-total">&#8377;${parseInt(b.total).toLocaleString('en-IN')}<small>Total amount</small></div>
        </div>`).join('');
    }
    lucide.createIcons();
}

window.cancelBooking = function(id) {
    const idx = state.bookings.findIndex(b => b.id === id);
    if (idx > -1) {
        state.bookings.splice(idx, 1);
        saveBookings();
        updateBadges();
        renderBookings();
        showToast('Booking cancelled.', 'warning');
    }
};

function saveBookings() { localStorage.setItem('luxora_bookings', JSON.stringify(state.bookings)); }

function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ── Badges ── */
function updateBadges() {
    const wl = state.wishlist.length;
    const bk = state.bookings.length;
    el.wishlistBadge.textContent = wl;
    el.wishlistBadge.classList.toggle('show', wl > 0);
    el.bookingsBadge.textContent = bk;
    el.bookingsBadge.classList.toggle('show', bk > 0);
}

/* ── Toast ── */
function showToast(msg, type = 'success') {
    const icons = { success: 'check-circle', warning: 'alert-circle', error: 'x-circle' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i data-lucide="${icons[type] || 'info'}"></i><span>${msg}</span>`;
    el.toastContainer.appendChild(toast);
    lucide.createIcons();
    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
