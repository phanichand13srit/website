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

    function createProductCardHTML(p) {
        if (!p) return "";
        const name = p.name || p.title || p.productName || "Arshith Fresh Product";
        const price = Number(p.price || p.salePrice || p.currentPrice || 30);
        const originalPrice = Number(p.originalPrice || p.regularPrice || p.mrp || Math.round(price * 1.25));
        const image = p.image || p.img || p.imageUrl || "https://arshithfresh.com/cdn/shop/collections/spice_200x200_crop_center.png?v=1746963495";
        const discount = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
        const reviewsCount = p.reviewsCount || Math.floor(Math.random() * 20) + 25;
        const fallbackImg = "https://arshithfresh.com/cdn/shop/collections/spice_200x200_crop_center.png?v=1746963495";

        return `
            <div class="product-card">
                <div class="product-card-link">
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
                </div>
                <button class="add-to-cart-btn">ADD TO CART</button>
            </div>
        `;
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

    syncStorefrontProducts();
    syncAuthHeader();
});

