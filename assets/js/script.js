/* JavaScript Behaviors for Arshith Fresh Replica */

// Global Toast Notification Helper
function showToast(message, duration = 3000) {
    if (!message) return;
    let toast = document.getElementById("arshithGlobalToast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "arshithGlobalToast";
        toast.className = "arshith-toast";
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("show");

    if (window._toastTimeout) {
        clearTimeout(window._toastTimeout);
    }

    window._toastTimeout = setTimeout(() => {
        toast.classList.remove("show");
    }, duration);
}
window.showToast = showToast;

document.addEventListener("DOMContentLoaded", () => {
    // 1. Mobile Menu Drawer Navigation
    const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
    const mobileDrawer = document.getElementById("mobileDrawer");
    const drawerCloseBtn = document.querySelector(".drawer-close-btn");
    const drawerOverlay = document.getElementById("drawerOverlay");

    function toggleDrawer(open) {
        if (open) {
            mobileDrawer.classList.add("open");
            drawerOverlay.classList.add("open");
            document.body.style.overflow = "hidden"; // Disable scroll behind
        } else {
            mobileDrawer.classList.remove("open");
            drawerOverlay.classList.remove("open");
            document.body.style.overflow = ""; // Restore scroll
        }
    }

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener("click", () => toggleDrawer(true));
    }
    if (drawerCloseBtn) {
        drawerCloseBtn.addEventListener("click", () => toggleDrawer(false));
    }
    if (drawerOverlay) {
        drawerOverlay.addEventListener("click", () => toggleDrawer(false));
    }

    // Drawer submenu dropdown toggle
    const submenuToggle = document.querySelector(".submenu-toggle");
    if (submenuToggle) {
        submenuToggle.addEventListener("click", (e) => {
            e.preventDefault();
            const submenu = submenuToggle.nextElementSibling;
            if (submenu) {
                submenu.classList.toggle("show");
                submenuToggle.querySelector(".arrow-down").style.transform =
                    submenu.classList.contains("show") ? "rotate(180deg)" : "";
            }
        });
    }

    // 2. Hero Banner Slider (Carousel)
    const track = document.querySelector(".carousel-track");
    const slides = document.querySelectorAll(".carousel-slide");
    const prevBtn = document.querySelector(".carousel-control.prev");
    const nextBtn = document.querySelector(".carousel-control.next");
    const indicators = document.querySelectorAll(".carousel-indicators .indicator");
    let currentSlide = 0;
    let slideInterval;

    function showSlide(index) {
        currentSlide = (index + slides.length) % slides.length;
        if (track) {
            track.style.transform = `translateX(-${currentSlide * 100}%)`;
        }
        slides.forEach((slide, i) => {
            slide.classList.toggle("active", i === currentSlide);
        });
        indicators.forEach((ind, i) => {
            ind.classList.toggle("active", i === currentSlide);
        });
    }

    function changeSlide(direction) {
        showSlide(currentSlide + direction);
    }

    function startAutoSlide() {
        slideInterval = setInterval(() => {
            changeSlide(1);
        }, 5000); // Change slide every 5 seconds
    }

    function resetSlideTimer() {
        clearInterval(slideInterval);
        startAutoSlide();
    }

    if (slides.length > 0) {
        showSlide(currentSlide);
        startAutoSlide();

        if (prevBtn) {
            prevBtn.addEventListener("click", (e) => {
                e.preventDefault();
                changeSlide(-1);
                resetSlideTimer();
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener("click", (e) => {
                e.preventDefault();
                changeSlide(1);
                resetSlideTimer();
            });
        }

        indicators.forEach(indicator => {
            indicator.addEventListener("click", () => {
                const targetSlide = parseInt(indicator.getAttribute("data-slide"));
                showSlide(targetSlide);
                resetSlideTimer();
            });
        });
    }

    // 3. Product Shelves Slider Buttons
    const sliders = document.querySelectorAll(".product-slider-wrapper");
    sliders.forEach(slider => {
        const grid = slider.querySelector(".products-grid");
        const prevArrow = slider.querySelector(".slider-arrow.prev");
        const nextArrow = slider.querySelector(".slider-arrow.next");

        if (grid && prevArrow && nextArrow) {
            const getScrollAmount = () => {
                // Scroll roughly by one card width
                const card = grid.querySelector(".product-card");
                return card ? card.offsetWidth + 24 : 300;
            };

            prevArrow.addEventListener("click", () => {
                grid.scrollBy({ left: -getScrollAmount(), behavior: "smooth" });
            });

            nextArrow.addEventListener("click", () => {
                grid.scrollBy({ left: getScrollAmount(), behavior: "smooth" });
            });

            // Toggle arrow visibility depending on scroll position
            const toggleArrows = () => {
                const isScrollable = grid.scrollWidth > grid.clientWidth;
                if (!isScrollable) {
                    prevArrow.style.display = "none";
                    nextArrow.style.display = "none";
                    return;
                }
                prevArrow.style.display = grid.scrollLeft <= 10 ? "none" : "flex";
                nextArrow.style.display = (grid.scrollLeft + grid.clientWidth >= grid.scrollWidth - 10) ? "none" : "flex";
            };

            grid.addEventListener("scroll", toggleArrows);
            window.addEventListener("resize", toggleArrows);
            // Initial check
            setTimeout(toggleArrows, 500);
        }
    });

    // 4. FAQ Accordion Section
    const faqItems = document.querySelectorAll(".faq-item");
    faqItems.forEach(item => {
        const question = item.querySelector(".faq-question");
        const toggle = question.querySelector("span");

        question.addEventListener("click", () => {
            const isActive = item.classList.contains("active");

            // Close all items
            faqItems.forEach(i => {
                i.classList.remove("active");
                const span = i.querySelector(".faq-question span");
                if (span) span.textContent = "+";
            });

            // Open current if it was not active
            if (!isActive) {
                item.classList.add("active");
                if (toggle) toggle.textContent = "−";
            }
        });
    });

    // 5. Mobile Footer Menu Accordions
    const footerButtons = document.querySelectorAll(".footer-accordion-btn");
    footerButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            // Only trigger on mobile screen size
            if (window.innerWidth <= 767) {
                const linksList = btn.nextElementSibling;
                const arrow = btn.querySelector(".footer-arrow");
                if (linksList) {
                    linksList.classList.toggle("show");
                    if (linksList.classList.contains("show")) {
                        arrow.textContent = "-";
                    } else {
                        arrow.textContent = "+";
                    }
                }
            }
        });
    });

    // 6. Interactive add-to-cart feedback (mock)
    const cartCountElement = document.querySelector(".cart-count");
    const cartBarCount = document.getElementById("cartBarCount");
    const cartBarTotal = document.getElementById("cartBarTotal");

    let cartCount = 0;
    let totalPrice = 0;

    const addToCartBtns = document.querySelectorAll(".add-to-cart-btn");
    addToCartBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            cartCount++;

            // Extract price from card
            const card = btn.closest(".product-card");
            if (card) {
                const salePriceElem = card.querySelector(".sale-price");
                if (salePriceElem) {
                    const priceText = salePriceElem.textContent; // e.g. "Rs. 349.00"
                    const priceNum = parseFloat(priceText.replace('Rs.', '').replace(/,/g, '').trim()) || 0;
                    totalPrice += priceNum;
                }
            }

            if (cartCountElement) {
                cartCountElement.textContent = cartCount;
                cartCountElement.style.transform = "scale(1.3)";
                setTimeout(() => {
                    cartCountElement.style.transform = "scale(1)";
                }, 200);
            }

            // Update bottom sticky cart bar
            if (cartBarCount) {
                cartBarCount.textContent = `${cartCount} Item${cartCount !== 1 ? 's' : ''}`;
            }
            if (cartBarTotal) {
                cartBarTotal.textContent = `₹${totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }

            // Button feedback
            const originalText = btn.textContent;
            btn.textContent = "Added ✓";
            btn.style.backgroundColor = "#278d43";
            btn.disabled = true;
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.backgroundColor = "";
                btn.disabled = false;
            }, 1000);
        });
    });

    // 7. Interactive Filter Accordions (Expand/Collapse on click & Live Filtering)
    const filterHeaders = document.querySelectorAll(".filter-accordion-header");
    filterHeaders.forEach(header => {
        header.addEventListener("click", () => {
            const item = header.closest(".filter-accordion-item");
            if (item) {
                item.classList.toggle("open");
            }
        });
    });

    // Make default first 2 filter items open by default
    const filterItems = document.querySelectorAll(".filter-accordion-item");
    if (filterItems.length > 0) {
        filterItems[0].classList.add("open");
        if (filterItems[1]) filterItems[1].classList.add("open");
    }

    // 8. Don't Miss Out newsletter popup closable
    const dontMissOutPopup = document.getElementById("dontMissOutPopup");
    const closePopupBtn = document.getElementById("closePopupBtn");
    if (dontMissOutPopup && closePopupBtn) {
        closePopupBtn.addEventListener("click", () => {
            dontMissOutPopup.classList.add("hidden");
        });
    }

    // 8. Collection Banner Sliders (Autoplay, Touch Swipe, Smooth Animation, Indicators)
    function initCollectionSliders() {
        const wrappers = document.querySelectorAll(".collection-banner-slider-wrapper");
        wrappers.forEach(wrapper => {
            const track = wrapper.querySelector(".collection-slider-track");
            if (!track) return;

            const slides = wrapper.querySelectorAll(".collection-slide");
            if (slides.length === 0) return;

            const prevBtn = wrapper.querySelector(".collection-slider-arrow.prev");
            const nextBtn = wrapper.querySelector(".collection-slider-arrow.next");

            // Create or locate dots container
            let dotsContainer = wrapper.querySelector(".collection-slider-dots");
            if (!dotsContainer && slides.length > 1) {
                dotsContainer = document.createElement("div");
                dotsContainer.className = "collection-slider-dots";
                wrapper.appendChild(dotsContainer);
            }

            if (dotsContainer) {
                dotsContainer.innerHTML = "";
                slides.forEach((_, i) => {
                    const dot = document.createElement("span");
                    dot.className = `dot ${i === 0 ? "active" : ""}`;
                    dot.setAttribute("data-slide", i);
                    dotsContainer.appendChild(dot);
                });
            }

            let currentIndex = 0;
            let slideTimer = null;

            function updateSlide(index) {
                currentIndex = (index + slides.length) % slides.length;
                track.style.transform = `translateX(-${currentIndex * 100}%)`;
                if (dotsContainer) {
                    const dots = dotsContainer.querySelectorAll(".dot");
                    dots.forEach((dot, i) => {
                        dot.classList.toggle("active", i === currentIndex);
                    });
                }
            }

            function startTimer() {
                if (slides.length <= 1) return;
                stopTimer();
                slideTimer = setInterval(() => {
                    updateSlide(currentIndex + 1);
                }, 4500);
            }

            function stopTimer() {
                if (slideTimer) clearInterval(slideTimer);
            }

            if (prevBtn) {
                prevBtn.addEventListener("click", (e) => {
                    e.preventDefault();
                    updateSlide(currentIndex - 1);
                    startTimer();
                });
            }

            if (nextBtn) {
                nextBtn.addEventListener("click", (e) => {
                    e.preventDefault();
                    updateSlide(currentIndex + 1);
                    startTimer();
                });
            }

            if (dotsContainer) {
                dotsContainer.addEventListener("click", (e) => {
                    if (e.target.classList.contains("dot")) {
                        const targetIdx = parseInt(e.target.getAttribute("data-slide"));
                        if (!isNaN(targetIdx)) {
                            updateSlide(targetIdx);
                            startTimer();
                        }
                    }
                });
            }

            // Touch Swipe Support
            let startX = 0;
            wrapper.addEventListener("touchstart", (e) => {
                startX = e.changedTouches[0].clientX;
                stopTimer();
            }, { passive: true });

            wrapper.addEventListener("touchend", (e) => {
                const dist = e.changedTouches[0].clientX - startX;
                if (Math.abs(dist) > 35) {
                    if (dist < 0) {
                        updateSlide(currentIndex + 1);
                    } else {
                        updateSlide(currentIndex - 1);
                    }
                }
                startTimer();
            }, { passive: true });

            wrapper.addEventListener("mouseenter", stopTimer);
            wrapper.addEventListener("mouseleave", startTimer);

            updateSlide(0);
            startTimer();
        });
    }
    initCollectionSliders();

    // 9. Dynamic Live API & Collection Product Sync
    async function syncStorefrontProducts() {
        try {
            let apiProducts = [];
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout for local backend API
                const res = await fetch("http://localhost:5000/api/products", { signal: controller.signal });
                clearTimeout(timeoutId);
                if (res && res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        apiProducts = data;
                    }
                }
            } catch (err) {
                // API offline or empty
            }

            const homeGrid = document.querySelector(".products-carousel-section .products-grid");
            if (homeGrid) {
                const homeList = apiProducts.length > 0 ? apiProducts : [
                    { name: "Cold Pressed Groundnut Oil - 1L", price: 349, originalPrice: 420, image: "https://arshithfresh.com/cdn/shop/files/WhatsApp_Image_2025-08-22_at_11.41.18_AM_1.jpg?v=1757334051&width=400" },
                    { name: "Cold Pressed Sesame / Gingelly Oil - 1L", price: 440, originalPrice: 520, image: "https://arshithfresh.com/cdn/shop/files/WhatsApp_Image_2025-08-22_at_11.41.18_AM.jpg?v=1757334052&width=400" },
                    { name: "Cold Pressed Coconut Oil - 1L", price: 380, originalPrice: 450, image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500" },
                    { name: "Pure Buffalo Ghee (Premium Quality)", price: 440, originalPrice: 520, image: "https://arshithfresh.com/cdn/shop/files/WhatsApp_Image_2025-09-15_at_4.34.52_PM.jpg?v=1757934372" }
                ];
                homeGrid.innerHTML = homeList.map(p => createProductCardHTML(p)).join('');
            }

            const path = window.location.pathname.toLowerCase();
            const colGrid = document.getElementById("collectionsProductGrid");
            if (!colGrid) return;

            // 1. On All Products page (collections.html)
            if (path.endsWith("collections") || path.endsWith("collections.html")) {
                const displayProducts = apiProducts || [];
                if (displayProducts.length > 0) {
                    colGrid.innerHTML = displayProducts.map(p => createProductCardHTML(p)).join('');
                    const countElem = document.getElementById("collectionProductCount");
                    if (countElem) {
                        countElem.textContent = `${displayProducts.length} products`;
                    }
                } else {
                    colGrid.innerHTML = `
                        <div class="empty-collection-state" style="grid-column: 1 / -1; padding: 60px 20px; text-align: center; background: #ffffff; border: 1.5px dashed #cbd5e1; border-radius: 16px; margin: 20px 0;">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0f7139" stroke-width="1.5" style="margin-bottom: 12px;"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                            <h3 style="font-family:'Playfair Display', serif; font-size:20px; color:#0f7139; margin:0 0 8px 0;">No products in this collection yet</h3>
                            <p style="color:#64748b; font-size:14px; margin:0;">Products added by Admin will appear here automatically.</p>
                        </div>
                    `;
                    const countElem = document.getElementById("collectionProductCount");
                    if (countElem) {
                        countElem.textContent = "0 products";
                    }
                }
                return;
            }

            // 2. On Subcollection pages (oils, ghee, dry fruits, seeds, spices, powders, cooking essentials)
            let categoryProducts = [];
            if (apiProducts && apiProducts.length > 0) {
                if (path.includes("oils-natural-extracts")) {
                    categoryProducts = apiProducts.filter(p => (p.category && p.category.toLowerCase().includes("oil")) || (p.name && p.name.toLowerCase().includes("oil")));
                } else if (path.includes("ghee-and-honey")) {
                    categoryProducts = apiProducts.filter(p => (p.category && (p.category.toLowerCase().includes("ghee") || p.category.toLowerCase().includes("honey"))) || (p.name && (p.name.toLowerCase().includes("ghee") || p.name.toLowerCase().includes("honey"))));
                } else if (path.includes("dry-fruits-nuts")) {
                    categoryProducts = apiProducts.filter(p => (p.category && p.category.toLowerCase().includes("dry")) || (p.name && (p.name.toLowerCase().includes("almond") || p.name.toLowerCase().includes("cashew") || p.name.toLowerCase().includes("pista") || p.name.toLowerCase().includes("walnut"))));
                } else if (path.includes("dry-seeds")) {
                    categoryProducts = apiProducts.filter(p => (p.category && p.category.toLowerCase().includes("seed")) || (p.name && p.name.toLowerCase().includes("seed")));
                } else if (path.includes("cooking-essentials")) {
                    categoryProducts = apiProducts.filter(p => (p.category && p.category.toLowerCase().includes("cooking")) || (p.name && (p.name.toLowerCase().includes("rice") || p.name.toLowerCase().includes("dal") || p.name.toLowerCase().includes("salt"))));
                } else if (path.includes("spice-powders")) {
                    categoryProducts = apiProducts.filter(p => (p.category && p.category.toLowerCase().includes("powder")) || (p.name && (p.name.toLowerCase().includes("powder") || p.name.toLowerCase().includes("podi"))));
                } else if (path.includes("spices")) {
                    categoryProducts = apiProducts.filter(p => (p.category && p.category.toLowerCase().includes("spice")) || (p.name && (p.name.toLowerCase().includes("clove") || p.name.toLowerCase().includes("cardamom") || p.name.toLowerCase().includes("cinnamon") || p.name.toLowerCase().includes("pepper") || p.name.toLowerCase().includes("ajwain"))));
                }
            }

            if (categoryProducts.length > 0) {
                colGrid.innerHTML = categoryProducts.map(p => createProductCardHTML(p)).join('');
                const countElem = document.getElementById("collectionProductCount");
                if (countElem) {
                    countElem.textContent = `${categoryProducts.length} products`;
                }
            } else {
                colGrid.innerHTML = `
                    <div class="empty-collection-state" style="grid-column: 1 / -1; padding: 60px 20px; text-align: center; background: #ffffff; border: 1.5px dashed #cbd5e1; border-radius: 16px; margin: 20px 0;">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0f7139" stroke-width="1.5" style="margin-bottom: 12px;"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                        <h3 style="font-family:'Playfair Display', serif; font-size:20px; color:#0f7139; margin:0 0 8px 0;">No products in this collection yet</h3>
                        <p style="color:#64748b; font-size:14px; margin:0;">Products added by Admin will appear here automatically.</p>
                    </div>
                `;
                const countElem = document.getElementById("collectionProductCount");
                if (countElem) {
                    countElem.textContent = "0 products";
                }
            }
        } catch (e) {
            console.error("Product sync error:", e);
        }
    }

    // Global Cart State
    let CART_ITEMS = [];
    try {
        const saved = localStorage.getItem("arshith_cart");
        if (saved) {
            CART_ITEMS = JSON.parse(saved);
        }
    } catch (e) {}

    function saveCart() {
        try {
            localStorage.setItem("arshith_cart", JSON.stringify(CART_ITEMS));
        } catch (e) {}
        updateCartCountBadge();
    }

    function addToStoreCart(id, name, price, image, qty = 1) {
        const existing = CART_ITEMS.find(item => item.id === id || item.title === name);
        if (existing) {
            existing.quantity += Number(qty);
        } else {
            CART_ITEMS.push({
                id: id || String(Date.now()),
                title: name,
                name: name,
                price: Number(price) || 0,
                image: image || "https://arshithfresh.com/cdn/shop/collections/spice_200x200_crop_center.png?v=1746963495",
                quantity: Number(qty)
            });
        }
        saveCart();
        if (typeof showToast === "function") {
            showToast(`Added ${name} to cart!`);
        } else {
            alert(`Added ${name} to cart!`);
        }
    }

    function updateCartQuantity(index, newQty) {
        if (newQty <= 0) {
            CART_ITEMS.splice(index, 1);
        } else {
            CART_ITEMS[index].quantity = newQty;
        }
        saveCart();
    }

    function removeFromCart(index) {
        CART_ITEMS.splice(index, 1);
        saveCart();
    }

    function updateCartCountBadge() {
        const totalCount = CART_ITEMS.reduce((sum, item) => sum + (item.quantity || 1), 0);
        const badges = document.querySelectorAll(".cart-count");
        badges.forEach(b => b.textContent = totalCount);
        const barCount = document.getElementById("cartBarCount");
        if (barCount) barCount.textContent = `${totalCount} items`;
        const barTotal = document.getElementById("cartBarTotal");
        if (barTotal) {
            const subtotal = CART_ITEMS.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            barTotal.textContent = `₹${subtotal.toFixed(2)}`;
        }
    }
    window.CART_ITEMS = CART_ITEMS;
    window.addToStoreCart = addToStoreCart;
    window.updateCartQuantity = updateCartQuantity;
    window.removeFromCart = removeFromCart;
    window.saveCart = saveCart;
    window.updateCartCountBadge = updateCartCountBadge;

    function createProductCardHTML(p) {
        if (!p) return "";
        const name = p.name || p.title || p.productName || "Arshith Fresh Product";
        const price = Number(p.price || p.salePrice || p.currentPrice || 30);
        const originalPrice = Number(p.originalPrice || p.regularPrice || p.mrp || Math.round(price * 1.25));
        const image = p.image || p.img || p.imageUrl || "https://arshithfresh.com/cdn/shop/collections/spice_200x200_crop_center.png?v=1746963495";
        const discount = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
        const reviewsCount = p.reviewsCount || Math.floor(Math.random() * 20) + 25;
        const fallbackImg = "https://arshithfresh.com/cdn/shop/collections/spice_200x200_crop_center.png?v=1746963495";
        const id = p._id || "";

        // Calculate correct relative path to pages/product.html
        const path = window.location.pathname.toLowerCase();
        let productUrl = "pages/product.html";
        if (path.includes("/pages/categories/") || path.includes("/pages/auth/") || path.includes("/pages/policies/")) {
            productUrl = "../product.html";
        } else if (path.includes("/pages/")) {
            productUrl = "product.html";
        }
        if (id) {
            productUrl += `?id=${id}`;
        }

        return `
            <div class="product-card">
                <a href="${productUrl}" class="product-card-link" style="text-decoration: none; color: inherit; display: block; cursor: pointer;">
                    <div class="product-image-container">
                        ${discount > 0 ? `<span class="card-discount-tag">${discount}% Off</span>` : ''}
                        <img src="${image}" alt="${name}" class="primary-img" onerror="this.onerror=null; this.src='${fallbackImg}';">
                    </div>
                    <div class="product-info">
                        <h3 class="card__heading" title="${name}">${name}</h3>
                        <div class="rating-box">
                            <span class="rating-stars">★★★★★</span>
                            <span class="rating-text">(${reviewsCount})</span>
                        </div>
                        <div class="price-box">
                            ${originalPrice > price ? `<span class="regular-price">Rs. ${originalPrice.toFixed(2)}</span>` : ''}
                            <span class="sale-price">From Rs. ${price.toFixed(2)}</span>
                        </div>
                    </div>
                </a>
                <button class="add-to-cart-btn" onclick="addToStoreCart('${id}', '${name.replace(/'/g, "\\'")}', ${price}, '${image.replace(/'/g, "\\'")}')">ADD TO CART</button>
            </div>
        `;
    }

    // 3. Sync Storefront Homepage Collections from Database
    async function syncStorefrontCollections() {
        const slider = document.querySelector(".categories-slider") || document.getElementById("categoriesSlider");
        if (!slider) return;

        try {
            const res = await fetch("http://localhost:5000/api/collections");
            if (!res.ok) return;
            const collections = await res.json();
            if (!collections || collections.length === 0) return;

            slider.innerHTML = collections.map(col => {
                const title = col.title || "Category";
                const img = col.image || "https://arshithfresh.com/cdn/shop/collections/spice_200x200_crop_center.png?v=1746963495";
                const slug = col.slug || title.toLowerCase().replace(/\s+/g, '-');
                return `
                    <div class="category-card" onclick="window.location.href='pages/categories/${slug}.html'">
                        <div class="category-img-container">
                            <img src="${img}" alt="${title}" class="category-img" onerror="this.src='https://arshithfresh.com/cdn/shop/collections/spice_200x200_crop_center.png?v=1746963495';">
                        </div>
                        <h4 class="category-name">${title}</h4>
                    </div>
                `;
            }).join('');
        } catch (e) {}
    }

    // 4. Sync Single Product Detail View (if on product view page or ?id= is present)
    async function syncSingleProductView() {
        const viewContainer = document.getElementById("productDetailView") || document.getElementById("singleProductContainer");
        if (!viewContainer) return;

        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get("id");

        if (!productId) {
            // If no ID passed in URL, fetch the first available product as default
            try {
                const res = await fetch("http://localhost:5000/api/products");
                if (res.ok) {
                    const products = await res.json();
                    if (products.length > 0) {
                        renderSingleProductDetail(products[0], viewContainer);
                        return;
                    }
                }
            } catch (e) {}
            return;
        }

        try {
            const res = await fetch(`http://localhost:5000/api/products/${productId}`);
            if (!res.ok) throw new Error("Product not found");
            const p = await res.json();
            renderSingleProductDetail(p, viewContainer);
        } catch (e) {
            viewContainer.innerHTML = `<div style="text-align: center; padding: 60px 20px;"><h2>Product Not Found</h2><p style="color:#64748b; margin-top:8px;">The product you requested could not be found.</p><a href="../index.html" class="continue-shopping-btn" style="display:inline-block; margin-top:16px;">Back to Home</a></div>`;
        }
    }

    function renderSingleProductDetail(p, viewContainer) {
        const name = p.name || p.title || "Arshith Fresh Product";
        const price = Number(p.price || 0);
        const originalPrice = Number(p.originalPrice || Math.round(price * 1.25));
        const image = p.image || (p.images && p.images[0] ? p.images[0].url : '') || "https://arshithfresh.com/cdn/shop/collections/spice_200x200_crop_center.png?v=1746963495";
        const discount = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
        const discountAmount = (originalPrice - price).toFixed(2);
        const isInstock = (p.countInStock ?? 10) > 0;
        const category = p.category || 'Natural Food';
        const subcategory = p.subcategory || '';
        const unit = p.unit || '1 unit';
        const brand = p.brand || 'Arshith Fresh';
        const description = p.description || '100% pure, natural, and preservative-free authentic grocery freshly packed and delivered from Arshith Fresh.';
        const id = p._id || '';

        // Update page title
        document.title = `${name} | Arshith Fresh`;

        viewContainer.innerHTML = `
            <!-- Breadcrumbs -->
            <nav style="margin-bottom: 24px; font-size: 13.5px; color: #64748b; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <a href="../index.html" style="color: #0f7139; text-decoration: none;">Home</a>
                <span>/</span>
                <a href="collections.html?category=all" style="color: #0f7139; text-decoration: none;">Collections</a>
                <span>/</span>
                <span style="color: #0f7139; font-weight: 500;">${category}</span>
                <span>/</span>
                <span style="color: #1e293b; font-weight: 600;">${name}</span>
            </nav>

            <div class="product-detail-layout" style="display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: start; background: #ffffff; padding: 32px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); border: 1px solid #e2e8f0;">
                
                <!-- LEFT GALLERY -->
                <div class="product-gallery-side">
                    <div style="position: relative; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; background: #fafbfc; text-align: center; padding: 24px;">
                        ${discount > 0 ? `<span class="card-discount-tag" style="position: absolute; top: 16px; left: 16px; background: #e11d48; color: #fff; padding: 6px 12px; border-radius: 6px; font-weight: 700; font-size: 13px; letter-spacing: 0.5px;">${discount}% OFF</span>` : ''}
                        <img src="${image}" alt="${name}" id="mainDetailProductImg" style="width: 100%; max-height: 440px; object-fit: contain; transition: transform 0.3s ease;">
                    </div>
                </div>

                <!-- RIGHT PRODUCT DETAILS -->
                <div class="product-info-side">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                        <span style="background: #e8f5e9; color: #0f7139; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 20px; text-transform: uppercase;">${category}</span>
                        ${subcategory ? `<span style="background: #f1f5f9; color: #475569; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px;">${subcategory}</span>` : ''}
                    </div>

                    <h1 style="font-family: 'Playfair Display', serif; font-size: 32px; color: #0f172a; margin: 0 0 12px 0; line-height: 1.25;">${name}</h1>

                    <!-- Ratings -->
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 18px;">
                        <div style="color: #f59e0b; font-size: 16px;">★★★★★</div>
                        <span style="font-size: 13px; color: #64748b; font-weight: 500;">4.9 (48 customer reviews)</span>
                        <span style="color: #cbd5e1;">•</span>
                        <span style="color: #16a34a; font-size: 13px; font-weight: 600;">✓ Verified Product</span>
                    </div>

                    <!-- Price Box -->
                    <div style="background: #f8fafc; padding: 16px 20px; border-radius: 12px; margin-bottom: 22px; border: 1px solid #edf2f7; display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap;">
                        <span style="font-size: 32px; font-weight: 800; color: #0f7139;">₹${price.toFixed(2)}</span>
                        ${originalPrice > price ? `<span style="font-size: 18px; text-decoration: line-through; color: #94a3b8; font-weight: 500;">₹${originalPrice.toFixed(2)}</span>` : ''}
                        ${discount > 0 ? `<span style="font-size: 13px; color: #e11d48; font-weight: 700; background: #ffe4e6; padding: 2px 8px; border-radius: 4px;">Save ₹${discountAmount}</span>` : ''}
                    </div>

                    <!-- Specs List -->
                    <div style="margin-bottom: 22px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13.5px;">
                        <div style="background: #fff; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 8px;">
                            <strong style="color:#64748b; font-size:12px; display:block;">UNIT / NET WEIGHT</strong>
                            <span style="font-weight:600; color:#1e293b;">${unit}</span>
                        </div>
                        <div style="background: #fff; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 8px;">
                            <strong style="color:#64748b; font-size:12px; display:block;">AVAILABILITY</strong>
                            <span style="font-weight:600; color:${isInstock ? '#16a34a' : '#dc2626'};">${isInstock ? `In Stock (${p.countInStock || 15} left)` : 'Out of Stock'}</span>
                        </div>
                    </div>

                    <!-- Quantity + Action Buttons -->
                    <div style="display: flex; gap: 14px; margin-bottom: 24px; flex-wrap: wrap;">
                        <div style="display: flex; align-items: center; border: 1.5px solid #cbd5e1; border-radius: 8px; overflow: hidden; background: #fff; height: 50px;">
                            <button type="button" onclick="const q = document.getElementById('detailQtyInput'); if (Number(q.value) > 1) q.value = Number(q.value) - 1;" style="width: 40px; height: 100%; border: none; background: transparent; font-size: 18px; cursor: pointer; color: #475569;">−</button>
                            <input type="number" id="detailQtyInput" value="1" min="1" readonly style="width: 44px; text-align: center; border: none; font-size: 16px; font-weight: 700; color: #1e293b; outline: none;">
                            <button type="button" onclick="const q = document.getElementById('detailQtyInput'); q.value = Number(q.value) + 1;" style="width: 40px; height: 100%; border: none; background: transparent; font-size: 18px; cursor: pointer; color: #475569;">+</button>
                        </div>

                        <button type="button" onclick="const q = Number(document.getElementById('detailQtyInput').value) || 1; addToStoreCart('${id}', '${name.replace(/'/g, "\\'")}', ${price}, '${image.replace(/'/g, "\\'")}', q);" style="flex: 1; min-width: 160px; height: 50px; background: #0f7139; color: #fff; border: none; border-radius: 8px; font-weight: 700; font-size: 15px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.2s;">
                            🛒 ADD TO CART
                        </button>

                        <button type="button" onclick="const q = Number(document.getElementById('detailQtyInput').value) || 1; addToStoreCart('${id}', '${name.replace(/'/g, "\\'")}', ${price}, '${image.replace(/'/g, "\\'")}', q); window.location.href='cart.html';" style="flex: 1; min-width: 140px; height: 50px; background: #1e293b; color: #fff; border: none; border-radius: 8px; font-weight: 700; font-size: 15px; cursor: pointer; transition: background 0.2s;">
                            ⚡ BUY NOW
                        </button>
                    </div>

                    <!-- Description Card -->
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                        <h3 style="font-size: 15px; font-weight: 700; color: #0f7139; margin: 0 0 10px 0;">Product Description & Highlights</h3>
                        <div style="font-size: 14px; line-height: 1.7; color: #475569;">${description}</div>
                    </div>

                    <!-- Trust Icons -->
                    <div style="display: flex; gap: 20px; font-size: 12.5px; color: #64748b; flex-wrap: wrap;">
                        <span>🌿 <strong>100% Pure & Fresh</strong></span>
                        <span>🚚 <strong>Free Delivery Above ₹1000</strong></span>
                        <span>🔒 <strong>Secure Checkout</strong></span>
                    </div>
                </div>

            </div>
        `;

        // Load Related Products
        loadRelatedProducts(p);
    }

    async function loadRelatedProducts(currentProduct) {
        const relatedGrid = document.getElementById("relatedProductsGrid");
        if (!relatedGrid) return;

        try {
            const res = await fetch("http://localhost:5000/api/products");
            if (!res.ok) return;
            const allProducts = await res.json();
            const related = allProducts.filter(item => item._id !== currentProduct._id && item.category === currentProduct.category).slice(0, 4);
            if (related.length > 0) {
                relatedGrid.innerHTML = related.map(item => createProductCardHTML(item)).join('');
            } else {
                const other = allProducts.filter(item => item._id !== currentProduct._id).slice(0, 4);
                relatedGrid.innerHTML = other.map(item => createProductCardHTML(item)).join('');
            }
        } catch (e) {}
    }

    function syncAuthHeader() {
        try {
            const user = JSON.parse(localStorage.getItem('arshith_user'));
            const loginBtn = document.querySelector('.action-btn.login-btn');
            if (!loginBtn) return;

            const path = window.location.pathname;
            const isSubpage = path.includes('/pages/');
            const isDeep = path.includes('/pages/auth/') || path.includes('/pages/categories/') || path.includes('/pages/policies/');

            if (user && user.name) {
                const profileUrl = isDeep ? '../profile.html' : (isSubpage ? 'profile.html' : 'pages/profile.html');
                loginBtn.href = profileUrl;
                loginBtn.title = `Account: ${user.name}`;
                loginBtn.style.color = '#0f7139';
                loginBtn.classList.add('user-logged-in');
            } else {
                const loginUrl = isDeep ? 'login.html' : (isSubpage ? 'auth/login.html' : 'pages/auth/login.html');
                loginBtn.href = loginUrl;
                loginBtn.title = 'Log In';
                loginBtn.style.color = '';
                loginBtn.classList.remove('user-logged-in');
            }
        } catch (e) {}
    }

    syncStorefrontCollections();
    syncStorefrontProducts();
    syncSingleProductView();
    syncAuthHeader();
});


