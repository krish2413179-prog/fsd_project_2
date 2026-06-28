let state = {
    products: [],
    categories: [],
    cart: JSON.parse(localStorage.getItem('luxora_cart')) || [],
    currentView: 'listing',
    selectedProductId: null,
    filters: {
        search: '',
        category: 'all',
        sortBy: 'default'
    }
};

const el = {
    listingPage: document.getElementById('listing-page'),
    detailsPage: document.getElementById('details-page'),
    cartPage: document.getElementById('cart-page'),
    controlsSection: document.getElementById('controls-section'),
    productsGrid: document.getElementById('products-grid'),
    productDetailsContent: document.getElementById('product-details-content'),
    cartItemsContainer: document.getElementById('cart-items-container'),
    cartBadgeCount: document.getElementById('cart-badge-count'),
    searchInput: document.getElementById('search-input'),
    categorySelect: document.getElementById('category-select'),
    sortSelect: document.getElementById('sort-select'),
    navLogo: document.getElementById('nav-logo'),
    btnGotoListing: document.getElementById('btn-goto-listing'),
    btnGotoCart: document.getElementById('btn-goto-cart'),
    btnBackToListing: document.getElementById('btn-back-to-listing'),
    toastContainer: document.getElementById('toast-container'),
    summarySubtotal: document.getElementById('summary-subtotal'),
    summaryDiscount: document.getElementById('summary-discount'),
    summaryShipping: document.getElementById('summary-shipping'),
    summaryTotal: document.getElementById('summary-total'),
    btnCheckout: document.getElementById('btn-checkout'),
    headerSearchBar: document.getElementById('header-search-bar')
};

document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    setupEventListeners();
    updateCartUI();
    navigate('listing');
});

function setupEventListeners() {
    el.navLogo.addEventListener('click', (e) => { e.preventDefault(); navigate('listing'); });
    el.btnGotoListing.addEventListener('click', () => navigate('listing'));
    el.btnGotoCart.addEventListener('click', () => navigate('cart'));
    el.btnBackToListing.addEventListener('click', () => navigate('listing'));

    el.searchInput.addEventListener('input', (e) => {
        state.filters.search = e.target.value;
        renderFilteredProducts();
    });

    el.categorySelect.addEventListener('change', (e) => {
        state.filters.category = e.target.value;
        renderFilteredProducts();
    });

    el.sortSelect.addEventListener('change', (e) => {
        state.filters.sortBy = e.target.value;
        renderFilteredProducts();
    });

    el.btnCheckout.addEventListener('click', () => {
        if (state.cart.length === 0) {
            showToast('Your cart is empty!', 'warning');
            return;
        }
        showToast('Processing order... Thank you for shopping with us!', 'success');
        state.cart = [];
        saveCartToStorage();
        updateCartUI();
        navigate('listing');
    });
}

async function fetchProducts() {
    try {
        const response = await fetch('https://dummyjson.com/products?limit=194');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        state.products = data.products;
        
        const rawCategories = state.products.map(p => p.category);
        state.categories = ['all', ...new Set(rawCategories)];

        populateCategoriesDropdown();
        renderFilteredProducts();
    } catch (error) {
        console.error(error);
        el.productsGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                <p style="color: var(--accent-pink); font-size: 1.2rem;">Failed to load products.</p>
            </div>
        `;
    }
}

function populateCategoriesDropdown() {
    el.categorySelect.innerHTML = state.categories.map(cat => {
        const displayName = cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ');
        return `<option value="${cat}">${displayName}</option>`;
    }).join('');
}

function navigate(viewName) {
    state.currentView = viewName;
    
    el.btnGotoListing.classList.remove('active');
    el.btnGotoCart.classList.remove('active');
    
    if (viewName === 'listing') {
        el.btnGotoListing.classList.add('active');
        el.listingPage.classList.add('active');
        el.detailsPage.classList.remove('active');
        el.cartPage.classList.remove('active');
        el.controlsSection.style.display = 'block';
        el.headerSearchBar.style.visibility = 'visible';
    } else if (viewName === 'details') {
        el.listingPage.classList.remove('active');
        el.detailsPage.classList.add('active');
        el.cartPage.classList.remove('active');
        el.controlsSection.style.display = 'none';
        el.headerSearchBar.style.visibility = 'hidden';
    } else if (viewName === 'cart') {
        el.btnGotoCart.classList.add('active');
        el.listingPage.classList.remove('active');
        el.detailsPage.classList.remove('active');
        el.cartPage.classList.add('active');
        el.controlsSection.style.display = 'none';
        el.headerSearchBar.style.visibility = 'hidden';
        renderCartList();
    }
    
    window.scrollTo({ top: 0 });
}

function renderFilteredProducts() {
    let filtered = [...state.products];

    if (state.filters.search) {
        const query = state.filters.search.toLowerCase();
        filtered = filtered.filter(p => 
            p.title.toLowerCase().includes(query) || 
            p.description.toLowerCase().includes(query)
        );
    }

    if (state.filters.category !== 'all') {
        filtered = filtered.filter(p => p.category === state.filters.category);
    }

    if (state.filters.sortBy === 'price-asc') {
        filtered.sort((a, b) => getDiscountedPrice(a) - getDiscountedPrice(b));
    } else if (state.filters.sortBy === 'price-desc') {
        filtered.sort((a, b) => getDiscountedPrice(b) - getDiscountedPrice(a));
    } else if (state.filters.sortBy === 'rating-desc') {
        filtered.sort((a, b) => b.rating - a.rating);
    }

    if (filtered.length === 0) {
        el.productsGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 4rem;">
                <h3 style="color: var(--text-secondary); margin-bottom: 0.5rem;">No products found</h3>
            </div>
        `;
        return;
    }

    el.productsGrid.innerHTML = filtered.map(product => {
        const discPrice = getDiscountedPrice(product);
        const hasDiscount = product.discountPercentage > 0;
        
        return `
            <div class="product-card" data-id="${product.id}">
                ${hasDiscount ? `<div class="discount-badge">-${Math.round(product.discountPercentage)}%</div>` : ''}
                <div class="card-img-wrapper" onclick="viewProductDetails(${product.id})">
                    <img src="${product.thumbnail}" alt="${product.title}" class="product-card-img" loading="lazy">
                </div>
                <div class="card-content">
                    <span class="product-category">${product.category.replace('-', ' ')}</span>
                    <h3 class="product-title" onclick="viewProductDetails(${product.id})">${product.title}</h3>
                    <div class="rating-container">
                        <div class="stars">${renderStarsHTML(product.rating)}</div>
                        <span class="rating-number">(${product.rating.toFixed(1)})</span>
                    </div>
                    <div class="card-footer">
                        <div class="price-box">
                            ${hasDiscount ? `<span class="original-price">$${product.price.toFixed(2)}</span>` : ''}
                            <span class="current-price">$${discPrice.toFixed(2)}</span>
                        </div>
                        <button class="btn-add-cart" onclick="addToCart(${product.id})">
                            <i data-lucide="plus"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    lucide.createIcons();
}

async function viewProductDetails(id) {
    el.productDetailsContent.innerHTML = `
        <div style="grid-column: span 2; display: flex; justify-content: center; padding: 4rem;">
            <div class="shimmer-card" style="width: 100%; height: 400px;"></div>
        </div>
    `;
    navigate('details');

    try {
        const response = await fetch(`https://dummyjson.com/products/${id}`);
        if (!response.ok) throw new Error('Failed to load product details');
        const product = await response.json();
        renderProductDetails(product);
    } catch (error) {
        console.error(error);
        el.productDetailsContent.innerHTML = `
            <div style="grid-column: span 2; text-align: center; padding: 4rem;">
                <p style="color: var(--accent-pink); font-size: 1.2rem;">Failed to load details.</p>
                <button class="btn-back" onclick="navigate('listing')" style="margin-top: 1rem; display: inline-flex;">Back to Products</button>
            </div>
        `;
    }
}

function renderProductDetails(product) {
    const discPrice = getDiscountedPrice(product);
    const hasDiscount = product.discountPercentage > 0;
    const isLowStock = product.stock <= 10;
    
    el.productDetailsContent.innerHTML = `
        <div class="details-gallery">
            <div class="main-image-wrapper">
                <img src="${product.images && product.images.length > 0 ? product.images[0] : product.thumbnail}" alt="${product.title}" class="main-image" id="main-product-image">
            </div>
            ${product.images && product.images.length > 1 ? `
                <div class="thumbnail-strip">
                    ${product.images.map((img, index) => `
                        <img src="${img}" alt="${product.title}" class="thumbnail ${index === 0 ? 'active' : ''}" onclick="changeMainImage('${img}', this)">
                    `).join('')}
                </div>
            ` : ''}
        </div>
        <div class="details-info">
            <div class="detail-category-brand">
                <span>${product.category.toUpperCase().replace('-', ' ')}</span> &bull; ${product.brand || 'Luxury Edition'}
            </div>
            <h1 class="detail-title">${product.title}</h1>
            
            <div class="detail-rating">
                <div class="stars">${renderStarsHTML(product.rating)}</div>
                <span class="rating-number">(${product.rating.toFixed(1)} / 5)</span>
            </div>

            <div class="detail-price-box">
                <div class="price-box">
                    ${hasDiscount ? `<span class="detail-original-price">$${product.price.toFixed(2)}</span>` : ''}
                    <span class="detail-price">$${discPrice.toFixed(2)}</span>
                </div>
                ${hasDiscount ? `<span class="detail-discount">${Math.round(product.discountPercentage)}% OFF</span>` : ''}
            </div>

            <p class="detail-description">${product.description}</p>

            <div class="specs-grid">
                <div class="spec-item">
                    <span class="spec-label">Warranty</span>
                    <span class="spec-value">${product.warrantyInformation || 'N/A'}</span>
                </div>
                <div class="spec-item">
                    <span class="spec-label">Shipping Info</span>
                    <span class="spec-value">${product.shippingInformation || 'Standard'}</span>
                </div>
                <div class="spec-item">
                    <span class="spec-label">Availability</span>
                    <span class="stock-badge ${isLowStock ? 'stock-low' : 'stock-in'}">
                        ${isLowStock ? `Low stock (${product.stock})` : 'In Stock'}
                    </span>
                </div>
                <div class="spec-item">
                    <span class="spec-label">SKU</span>
                    <span class="spec-value">${product.sku || 'N/A'}</span>
                </div>
            </div>

            <button class="btn-detail-add-cart" onclick="addToCart(${product.id})">
                <i data-lucide="shopping-cart"></i>
                <span>Add to Cart</span>
            </button>
        </div>

        <div class="reviews-section">
            <h3>Feedback</h3>
            <div class="reviews-grid">
                ${product.reviews && product.reviews.length > 0 ? product.reviews.map(rev => `
                    <div class="review-card">
                        <div class="review-header">
                            <span class="reviewer-name">${rev.reviewerName}</span>
                            <div class="stars">${renderStarsHTML(rev.rating)}</div>
                        </div>
                        <div class="review-date">${new Date(rev.date).toLocaleDateString()}</div>
                        <p class="review-comment">"${rev.comment}"</p>
                    </div>
                `).join('') : '<p>No reviews yet.</p>'}
            </div>
        </div>
    `;

    lucide.createIcons();
}

window.changeMainImage = function(src, thumbnailEl) {
    document.getElementById('main-product-image').src = src;
    document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
    thumbnailEl.classList.add('active');
};

function getDiscountedPrice(product) {
    if (product.discountPercentage > 0) {
        return product.price * (1 - product.discountPercentage / 100);
    }
    return product.price;
}

function renderStarsHTML(rating) {
    let stars = '';
    const rounded = Math.round(rating);
    for (let i = 1; i <= 5; i++) {
        if (i <= rounded) {
            stars += '<i data-lucide="star"></i>';
        } else {
            stars += '<i data-lucide="star" class="empty"></i>';
        }
    }
    return stars;
}

window.addToCart = function(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    const cartItem = state.cart.find(item => item.id === productId);
    if (cartItem) {
        cartItem.quantity += 1;
    } else {
        state.cart.push({
            id: product.id,
            title: product.title,
            price: product.price,
            discountPercentage: product.discountPercentage,
            thumbnail: product.thumbnail,
            quantity: 1
        });
    }

    saveCartToStorage();
    updateCartUI();
    showToast(`Added "${product.title}"`);
};

function saveCartToStorage() {
    localStorage.setItem('luxora_cart', JSON.stringify(state.cart));
}

function updateCartUI() {
    const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    el.cartBadgeCount.innerText = totalItems;
    el.cartBadgeCount.style.display = totalItems > 0 ? 'inline-block' : 'none';
}

function renderCartList() {
    if (state.cart.length === 0) {
        el.cartItemsContainer.innerHTML = `
            <div class="cart-empty">
                <i data-lucide="shopping-bag"></i>
                <h3>Cart is empty</h3>
                <button class="btn-back" onclick="navigate('listing')" style="margin-top: 1rem;">Browse Products</button>
            </div>
        `;
        updateBillSummary(0, 0, 0);
        lucide.createIcons();
        return;
    }

    el.cartItemsContainer.innerHTML = state.cart.map(item => {
        const itemDiscountedPrice = getDiscountedPrice(item);
        const hasDiscount = item.discountPercentage > 0;
        
        return `
            <div class="cart-item">
                <div class="cart-item-img-wrapper">
                    <img src="${item.thumbnail}" alt="${item.title}" class="cart-item-img">
                </div>
                <div class="cart-item-info">
                    <h4 class="cart-item-title" onclick="viewProductDetails(${item.id})">${item.title}</h4>
                    <div class="cart-item-price">
                        ${hasDiscount ? `<span class="original">$${item.price.toFixed(2)}</span>` : ''}
                        <span>$${itemDiscountedPrice.toFixed(2)}</span>
                    </div>
                </div>
                <div class="cart-qty-controls">
                    <button class="qty-btn" onclick="updateQty(${item.id}, -1)">
                        <i data-lucide="minus"></i>
                    </button>
                    <span class="qty-val">${item.quantity}</span>
                    <button class="qty-btn" onclick="updateQty(${item.id}, 1)">
                        <i data-lucide="plus"></i>
                    </button>
                </div>
                <button class="btn-remove-item" onclick="removeCartItem(${item.id})">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        `;
    }).join('');

    lucide.createIcons();
    calculateAndRenderBill();
}

window.updateQty = function(productId, delta) {
    const item = state.cart.find(item => item.id === productId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
        removeCartItem(productId);
        return;
    }

    saveCartToStorage();
    updateCartUI();
    renderCartList();
};

window.removeCartItem = function(productId) {
    const itemIndex = state.cart.findIndex(item => item.id === productId);
    if (itemIndex > -1) {
        state.cart.splice(itemIndex, 1);
        saveCartToStorage();
        updateCartUI();
        renderCartList();
    }
};

function calculateAndRenderBill() {
    let subtotal = 0;
    let totalDiscount = 0;

    state.cart.forEach(item => {
        const origPriceTotal = item.price * item.quantity;
        const discPriceTotal = getDiscountedPrice(item) * item.quantity;
        subtotal += origPriceTotal;
        totalDiscount += (origPriceTotal - discPriceTotal);
    });

    const shipping = subtotal > 150 || subtotal === 0 ? 0 : 15;
    const grandTotal = subtotal - totalDiscount + shipping;

    updateBillSummary(subtotal, totalDiscount, shipping, grandTotal);
}

function updateBillSummary(subtotal, discount, shipping, total) {
    el.summarySubtotal.innerText = `$${subtotal.toFixed(2)}`;
    el.summaryDiscount.innerText = discount > 0 ? `-$${discount.toFixed(2)}` : `$0.00`;
    el.summaryShipping.innerText = shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`;
    el.summaryTotal.innerText = `$${(total || 0).toFixed(2)}`;
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${message}</span>`;
    el.toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 2000);
}
