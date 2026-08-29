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

    // 6. Interactive add-to-cart feedback for static cards
    const addToCartBtns = document.querySelectorAll(".add-to-cart-btn");
    addToCartBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const card = btn.closest(".product-card") || btn.closest(".product-detail-info");
            if (card) {
                let name = "Arshith Fresh Product";
                let price = 30;
                let image = "";
                let id = card.getAttribute("data-product-id") || String(Date.now());

                const titleElem = card.querySelector(".product-title, h1, h3, h4");
                if (titleElem) name = titleElem.textContent.trim();

                const salePriceElem = card.querySelector(".sale-price, .price, .product-price");
                if (salePriceElem) {
                    const priceText = salePriceElem.textContent;
                    price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || price;
                }

                const imgElem = card.querySelector("img");
                if (imgElem) image = imgElem.src;

                if (typeof addToStoreCart === "function") {
                    addToStoreCart(id, name, price, image, 1);
                }
            } else if (typeof updateCartCountBadge === "function") {
                updateCartCountBadge();
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

    const FALLBACK_STOREFRONT_PRODUCTS = [
        {
            _id: "6a910cc273615f661cdfc429",
            name: "Groundnut Oil (Premium Quality)",
            category: "Oils",
            price: 349,
            originalPrice: 471,
            unit: "1 Litre",
            countInStock: 25,
            brand: "Arshith Fresh",
            image: "https://arshithfresh.com/cdn/shop/files/WhatsApp_Image_2025-08-22_at_11.41.18_AM_1.jpg?v=1757334051&width=533",
            hoverImage: "https://arshithfresh.com/cdn/shop/files/WhatsApp_Image_2025-06-30_at_7.28.42_PM_1_3752719d-4e83-4d00-a8be-0c4d13076c23.jpg?v=1757334051&width=533",
            description: "100% pure cold-pressed groundnut oil, ideal for healthy everyday cooking.",
            rating: 4.9,
            numReviews: 67,
            isFeatured: true
        },
        {
            _id: "6a910cc273615f661cdfc42a",
            name: "Coconut Oil (Premium Quality)",
            category: "Oils",
            price: 165,
            originalPrice: 214,
            unit: "500 ml",
            countInStock: 30,
            brand: "Arshith Fresh",
            image: "https://arshithfresh.com/cdn/shop/files/WhatsApp_Image_2025-08-22_at_11.41.18_AM_2.jpg?v=1757334050&width=533",
            hoverImage: "https://arshithfresh.com/cdn/shop/files/WhatsApp_Image_2025-06-30_at_7.28.41_PM_887d3105-a7d1-45a3-b1b0-e0054291d902.jpg?v=1757334050&width=533",
            description: "Unrefined, fragrant cold-pressed coconut oil from sun-dried copra.",
            rating: 4.83,
            numReviews: 54,
            isFeatured: true
        },
        {
            _id: "6a910cc273615f661cdfc42b",
            name: "Pure Buffalo Ghee (Premium Quality)",
            category: "Ghee & Honey",
            price: 222,
            originalPrice: 288,
            unit: "250 ml",
            countInStock: 20,
            brand: "Arshith Fresh",
            image: "https://arshithfresh.com/cdn/shop/files/WhatsApp_Image_2025-09-15_at_4.34.52_PM.jpg?v=1757934372&width=533",
            hoverImage: "https://arshithfresh.com/cdn/shop/files/WhatsApp_Image_2025-06-30_at_7.32.29_PM_2_eb23ab0e-a49c-457d-9dad-00ce2758289c.jpg?v=1757934372&width=533",
            description: "Traditional granular bilona buffalo ghee with rich aroma and taste.",
            rating: 4.91,
            numReviews: 32,
            isFeatured: true
        },
        {
            _id: "6a910cc273615f661cdfc42c",
            name: "Sunflower Oil (Premium Quality)",
            category: "Oils",
            price: 499,
            originalPrice: 608,
            unit: "1 Litre",
            countInStock: 18,
            brand: "Arshith Fresh",
            image: "https://arshithfresh.com/cdn/shop/files/WhatsApp_Image_2025-08-22_at_11.41.18_AM.jpg?v=1757334052&width=533",
            description: "Light, nutrient-dense cold-pressed sunflower oil for light frying and baking.",
            rating: 4.91,
            numReviews: 54,
            isFeatured: true
        },
        {
            _id: "6a910cc273615f661cdfc42d",
            name: "Flax Seeds (Premium Quality)",
            category: "Seeds",
            price: 29,
            originalPrice: 36,
            unit: "100 g",
            countInStock: 50,
            brand: "Arshith Fresh",
            image: "https://arshithfresh.com/cdn/shop/files/WhatsApp_Image_2025-07-08_at_4.04.02_PM_2_ce2dcb8e-81dc-46c5-b343-1a14dff25208.jpg?v=1757334052&width=533",
            description: "Omega-3 rich golden brown flax seeds for everyday smoothies and bowls.",
            rating: 4.9,
            numReviews: 31,
            isFeatured: false
        },
        {
            _id: "6a910cc273615f661cdfc42e",
            name: "Chia Seeds (Premium Quality)",
            category: "Seeds",
            price: 49,
            originalPrice: 53,
            unit: "100 g",
            countInStock: 45,
            brand: "Arshith Fresh",
            image: "https://arshithfresh.com/cdn/shop/files/WhatsApp_Image_2025-07-08_at_4.04.01_PM_6b2e5750-03f7-4a0a-b4e3-9ef639891875.jpg?v=1757333987&width=533",
            description: "High-fiber superfood chia seeds, 100% natural and clean.",
            rating: 4.91,
            numReviews: 35,
            isFeatured: false
        },
        {
            _id: "6a910cc273615f661cdfc42f",
            name: "Chana Dal Spice Powder (Pappula Podi)",
            category: "Spice Powders",
            price: 59,
            originalPrice: 80,
            unit: "100 g",
            countInStock: 40,
            brand: "Arshith Fresh",
            image: "https://arshithfresh.com/cdn/shop/files/WhatsApp_Image_2025-07-08_at_4.19.01_PM_2_717030b8-c8a8-40a4-bdf0-7e516dec3029.jpg?v=1757334045&width=533",
            description: "Authentic Andhra style homemade roasted chana dal podi with ghee flavor.",
            rating: 5,
            numReviews: 31,
            isFeatured: true
        },
        {
            _id: "6a910cc273615f661cdfc430",
            name: "Garlic Powder (Velluli Karam)",
            category: "Spice Powders",
            price: 59,
            originalPrice: 80,
            unit: "100 g",
            countInStock: 35,
            brand: "Arshith Fresh",
            image: "https://arshithfresh.com/cdn/shop/files/WhatsApp_Image_2025-07-08_at_4.19.01_PM_3_6262e177-7c59-4137-afc4-5d486daa9175.jpg?v=1757334046&width=533",
            description: "Spicy, pungent country garlic podi blended with red chillies and cumin.",
            rating: 4.97,
            numReviews: 38,
            isFeatured: true
        },
        {
            _id: "6a910cc273615f661cdfc431",
            name: "Fresh Malai Paneer (Pure & Soft)",
            category: "Dairy",
            subcategory: "Fresh Paneer",
            price: 95,
            originalPrice: 120,
            unit: "200 g",
            countInStock: 25,
            brand: "Arshith Fresh",
            image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop&q=80",
            description: "100% natural, soft, rich cottage cheese made from fresh cow milk.",
            rating: 4.95,
            numReviews: 42,
            isFeatured: true
        },
        {
            _id: "6a910cc273615f661cdfc432",
            name: "Pure Organic Cow Milk (Pasteurized)",
            category: "Dairy",
            subcategory: "Pure Cow Milk",
            price: 42,
            originalPrice: 50,
            unit: "500 ml",
            countInStock: 40,
            brand: "Arshith Fresh",
            image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=80",
            description: "Farm fresh, unadulterated pure cow milk delivered daily.",
            rating: 4.88,
            numReviews: 58,
            isFeatured: true
        }
    ];

    // 9. Dynamic Live API & Collection Product Sync
    async function syncStorefrontProducts() {
        try {
            let apiProducts = [];
            try {
                const apiHost = window.location.origin.includes('http') ? window.location.origin : 'http://localhost:5000';
                const res = await fetch(`${apiHost}/api/products`);
                if (res && res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        apiProducts = data;
                    }
                }
            } catch (err) {
                // API offline or empty
            }

            if (!apiProducts || apiProducts.length === 0) {
                apiProducts = FALLBACK_STOREFRONT_PRODUCTS;
            }

            const homeGrids = document.querySelectorAll(".products-carousel-section .products-grid");
            homeGrids.forEach(grid => {
                if (apiProducts && apiProducts.length > 0) {
                    grid.innerHTML = apiProducts.map(p => createProductCardHTML(p)).join('');
                }
            });

            const path = window.location.pathname.toLowerCase();
            const colGrid = document.getElementById("collectionsProductGrid");
            if (!colGrid) return;

            // 1. On All Products page (collections.html)
            if (path.includes("collections")) {
                const urlParams = new URLSearchParams(window.location.search);
                const searchQ = (urlParams.get("search") || urlParams.get("q") || "").trim().toLowerCase();
                const categoryQ = (urlParams.get("category") || urlParams.get("cat") || "").trim().toLowerCase();

                let displayProducts = apiProducts || [];
                if (searchQ) {
                    displayProducts = displayProducts.filter(p => {
                        const title = (p.title || p.name || "").toLowerCase();
                        const cat = (p.category || "").toLowerCase();
                        const sub = (p.subcategory || "").toLowerCase();
                        const desc = (p.description || "").toLowerCase();
                        const brand = (p.brand || "").toLowerCase();
                        return title.includes(searchQ) || cat.includes(searchQ) || sub.includes(searchQ) || desc.includes(searchQ) || brand.includes(searchQ);
                    });
                } else if (categoryQ && categoryQ !== "all" && categoryQ !== "all products") {
                    displayProducts = displayProducts.filter(p => {
                        const cat = (p.category || "").toLowerCase();
                        const title = (p.title || p.name || "").toLowerCase();
                        return cat.includes(categoryQ) || title.includes(categoryQ);
                    });
                }

                if (displayProducts.length > 0) {
                    colGrid.innerHTML = displayProducts.map(p => createProductCardHTML(p)).join('');
                    const countElem = document.getElementById("collectionProductCount");
                    if (countElem) {
                        const searchLabel = urlParams.get("search") || urlParams.get("q") || urlParams.get("category") || urlParams.get("cat");
                        countElem.textContent = searchLabel 
                            ? `${displayProducts.length} product(s) found for "${searchLabel}"`
                            : `${displayProducts.length} products`;
                    }
                } else {
                    colGrid.innerHTML = `
                        <div class="empty-collection-state" style="grid-column: 1 / -1; padding: 60px 20px; text-align: center; background: #ffffff; border: 1.5px dashed #cbd5e1; border-radius: 16px; margin: 20px 0;">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0f7139" stroke-width="1.5" style="margin-bottom: 12px;"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                            <h3 style="font-family:'Playfair Display', serif; font-size:20px; color:#0f7139; margin:0 0 8px 0;">No matching products found</h3>
                            <p style="color:#64748b; font-size:14px; margin:0;">No products match your selection. Try searching another category like Oils, Ghee, or Honey.</p>
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
                if (path.includes("oils-natural-extracts") || path.includes("oils")) {
                    categoryProducts = apiProducts.filter(p => (p.category && p.category.toLowerCase().includes("oil")) || (p.name && p.name.toLowerCase().includes("oil")));
                } else if (path.includes("ghee-and-honey") || path.includes("ghee")) {
                    categoryProducts = apiProducts.filter(p => (p.category && (p.category.toLowerCase().includes("ghee") || p.category.toLowerCase().includes("honey"))) || (p.name && (p.name.toLowerCase().includes("ghee") || p.name.toLowerCase().includes("honey"))));
                } else if (path.includes("dry-fruits-nuts") || path.includes("dry-fruits")) {
                    categoryProducts = apiProducts.filter(p => (p.category && p.category.toLowerCase().includes("dry")) || (p.name && (p.name.toLowerCase().includes("almond") || p.name.toLowerCase().includes("cashew") || p.name.toLowerCase().includes("pista") || p.name.toLowerCase().includes("walnut") || p.name.toLowerCase().includes("anjeer") || p.name.toLowerCase().includes("date"))));
                } else if (path.includes("dry-seeds") || path.includes("seeds")) {
                    categoryProducts = apiProducts.filter(p => (p.category && p.category.toLowerCase().includes("seed")) || (p.name && p.name.toLowerCase().includes("seed")));
                } else if (path.includes("cooking-essentials") || path.includes("essentials")) {
                    categoryProducts = apiProducts.filter(p => (p.category && p.category.toLowerCase().includes("cooking")) || (p.name && (p.name.toLowerCase().includes("rice") || p.name.toLowerCase().includes("dal") || p.name.toLowerCase().includes("salt"))));
                } else if (path.includes("spice-powders") || path.includes("powders")) {
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
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0f7139" stroke-width="1.5" style="margin-bottom: 12px;"><path d="M20 7l-8-4-8 4m16 0l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
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
        let items = CART_ITEMS || [];
        try {
            const saved = localStorage.getItem("arshith_cart");
            if (saved) {
                items = JSON.parse(saved);
                CART_ITEMS = items;
                window.CART_ITEMS = items;
            }
        } catch (e) {}

        const totalCount = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
        const subtotal = items.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1)), 0);

        // Update all badge elements across pages
        const badges = document.querySelectorAll(".cart-count, .cart-badge-num, #checkoutTopCartCount, .cart-count-badge");
        badges.forEach(b => {
            b.textContent = totalCount;
        });

        const barCount = document.getElementById("cartBarCount");
        if (barCount) barCount.textContent = `${totalCount} item${totalCount !== 1 ? 's' : ''}`;

        const barTotal = document.getElementById("cartBarTotal");
        if (barTotal) {
            barTotal.textContent = `₹${subtotal.toFixed(2)}`;
        }
    }

    // Auto-update badges on page load, history navigation, and cross-tab storage changes
    document.addEventListener("DOMContentLoaded", updateCartCountBadge);
    window.addEventListener("pageshow", updateCartCountBadge);
    window.addEventListener("storage", updateCartCountBadge);
    try { updateCartCountBadge(); } catch (e) {}

    window.CART_ITEMS = CART_ITEMS;
    window.addToStoreCart = addToStoreCart;
    window.updateCartQuantity = updateCartQuantity;
    window.removeFromCart = removeFromCart;
    window.saveCart = saveCart;
    window.updateCartCountBadge = updateCartCountBadge;

    function createProductCardHTML(p) {
        if (!p) return "";
        try {
            const rawName = p.name || p.title || p.productName || "Arshith Fresh Product";
            const name = rawName.replace(/"/g, '&quot;');
            const safeNameForJs = rawName.replace(/['"\\]/g, "\\$&");
            const price = Number(p.price || p.salePrice || p.currentPrice || 30);
            const originalPrice = Number(p.originalPrice || p.regularPrice || p.mrp || Math.round(price * 1.25));
            const image = p.image || (p.images && p.images[0] ? (typeof p.images[0] === 'object' ? p.images[0].url : p.images[0]) : '') || p.img || p.imageUrl || "https://arshithfresh.com/cdn/shop/collections/spice_200x200_crop_center.png?v=1746963495";
            const safeImgForJs = image.replace(/['"\\]/g, "\\$&");
            
            let secondImage = '';
            if (Array.isArray(p.images) && p.images.length > 1) {
                secondImage = typeof p.images[1] === 'object' ? (p.images[1].url || '') : p.images[1];
            }
            if (!secondImage && p.hoverImage) {
                secondImage = p.hoverImage;
            }
            const hasSecondImage = Boolean(secondImage && secondImage !== image);

            const discount = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
            const reviewsCount = p.reviewsCount || Math.floor(Math.random() * 20) + 25;
            const fallbackImg = "https://arshithfresh.com/cdn/shop/collections/spice_200x200_crop_center.png?v=1746963495";
            const id = p._id || p.id || "";

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

            const inStock = (p.countInStock === undefined || p.countInStock === null) ? true : (Number(p.countInStock) > 0);

            return `
                <div class="product-card ${inStock ? '' : 'product-card-out-of-stock'}">
                    <a href="${productUrl}" class="product-card-link" style="text-decoration: none; color: inherit; display: block; cursor: pointer;">
                        <div class="product-image-container ${hasSecondImage ? 'has-second-img' : ''}">
                            ${discount > 0 ? `<span class="card-discount-tag">${discount}% Off</span>` : ''}
                            ${!inStock ? `<span class="card-out-of-stock-tag" style="position: absolute; top: 10px; right: 10px; background: #dc2626; color: #fff; font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 4px; z-index: 2; letter-spacing: 0.5px;">OUT OF STOCK</span>` : ''}
                            <img src="${image}" alt="${name}" class="primary-img" style="${inStock ? '' : 'opacity: 0.7;'}" onerror="this.onerror=null; this.src='${fallbackImg}';">
                            ${hasSecondImage ? `<img src="${secondImage}" alt="${name}" class="hover-img" onerror="this.style.display='none';">` : ''}
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
                    ${inStock ? `
                        <button class="add-to-cart-btn" onclick="addToStoreCart('${id}', '${safeNameForJs}', ${price}, '${safeImgForJs}')">ADD TO CART</button>
                    ` : `
                        <button class="add-to-cart-btn disabled" disabled style="background: #f1f5f9; color: #94a3b8; border: 1px solid #cbd5e1; cursor: not-allowed; opacity: 0.85;">OUT OF STOCK</button>
                    `}
                </div>
            `;
        } catch (err) {
            console.error("Error creating product card HTML:", err);
            return "";
        }
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
            if (res.ok) {
                const p = await res.json();
                renderSingleProductDetail(p, viewContainer);
                return;
            }

            // Resilient Fallback: If direct ID failed, fetch product list and search
            const allRes = await fetch("http://localhost:5000/api/products");
            if (allRes.ok) {
                const list = await allRes.json();
                if (list.length > 0) {
                    const cleanSlug = productId.replace(/-/g, ' ').toLowerCase();
                    const matched = list.find(item => (item.name || '').toLowerCase().includes(cleanSlug.split(' ')[0])) || list[0];
                    renderSingleProductDetail(matched, viewContainer);
                    return;
                }
            }
            throw new Error("Product not found");
        } catch (e) {
            viewContainer.innerHTML = `<div style="text-align: center; padding: 60px 20px;"><h2>Product Not Found</h2><p style="color:#64748b; margin-top:8px;">The product you requested could not be found.</p><a href="../index.html" class="continue-shopping-btn" style="display:inline-block; margin-top:16px;">Back to Home</a></div>`;
        }
    }

    function renderSingleProductDetail(p, viewContainer) {
        const name = p.name || p.title || "Arshith Fresh Product";
        const price = Number(p.price || 0);
        const originalPrice = Number(p.originalPrice || Math.round(price * 1.25));
        
        // Extract all images
        let allImgs = [];
        if (Array.isArray(p.images) && p.images.length > 0) {
            allImgs = p.images.map(img => typeof img === 'object' ? (img.url || '') : img).filter(Boolean);
        }
        if (allImgs.length === 0 && p.image) {
            allImgs = [p.image];
        }
        if (allImgs.length === 0) {
            allImgs = ["https://arshithfresh.com/cdn/shop/collections/spice_200x200_crop_center.png?v=1746963495"];
        }

        const mainImage = allImgs[0];
        const discount = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
        const discountAmount = (originalPrice - price).toFixed(2);
        const isInstock = (p.countInStock ?? 10) > 0;
        const category = p.category || 'Natural Food';
        const subcategory = p.subcategory || '';
        const unit = p.unit || '1 unit';
        const brand = p.brand || 'Arshith Fresh';
        const description = p.description || '100% pure, natural, and preservative-free authentic grocery freshly packed and delivered from Arshith Fresh.';
        const id = p._id || '';

        window.CURRENT_DETAIL_PRODUCT = p;
        const prodImage = p.image || (p.images && p.images[0] ? (p.images[0].url || p.images[0]) : '') || mainImage;

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
                        <img src="${mainImage}" alt="${name}" id="mainDetailProductImg" style="width: 100%; max-height: 440px; object-fit: contain; transition: transform 0.3s ease;">
                    </div>

                    ${allImgs.length > 1 ? `
                    <div class="product-thumbnails-carousel" style="display: flex; gap: 10px; margin-top: 14px; overflow-x: auto; padding-bottom: 4px;">
                        ${allImgs.map((imgUrl, i) => `
                            <div class="detail-thumb-item ${i === 0 ? 'active' : ''}" onclick="switchDetailImage('${imgUrl.replace(/'/g, "\\'")}', this)" style="width: 72px; height: 72px; border-radius: 8px; border: 2px solid ${i === 0 ? '#0f7139' : '#e2e8f0'}; background: #fafbfc; padding: 4px; cursor: pointer; flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">
                                <img src="${imgUrl}" alt="${name} thumbnail ${i + 1}" style="max-height: 100%; max-width: 100%; object-fit: contain;">
                            </div>
                        `).join('')}
                    </div>
                    ` : ''}
                </div>

                <!-- RIGHT PRODUCT DETAILS -->
                <div class="product-info-side">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                        <span style="background: #e8f5e9; color: #0f7139; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 20px; text-transform: uppercase;">${category}</span>
                        ${subcategory ? `<span style="background: #f1f5f9; color: #475569; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px;">${subcategory}</span>` : ''}
                    </div>

                    <h1 style="font-family: 'Playfair Display', serif; font-size: 32px; color: #0f172a; margin: 0 0 12px 0; line-height: 1.25;">${name}</h1>

                    <!-- 5-Star Rating Beside Photo (Synced with Amazon Reviews Section) -->
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 18px; flex-wrap: wrap;">
                        <a href="#amazonReviewsSection" id="topRatingScoreLink" style="display: inline-flex; align-items: center; gap: 8px; text-decoration: none; cursor: pointer;" title="Jump to Customer Reviews">
                            <div id="topRatingStarsVisual" style="color: #f59e0b; font-size: 17px; letter-spacing: 1.5px;">★★★★★</div>
                            <strong id="topRatingScoreNum" style="font-size: 15px; color: #1e293b;">${(p.rating || 5.0).toFixed(1)}</strong>
                            <span id="topRatingCountText" style="font-size: 13px; color: #0284c7; text-decoration: underline;">(${p.numReviews || 0} customer ratings)</span>
                        </a>
                        <span style="color: #cbd5e1;">•</span>
                        <span style="color: #16a34a; font-size: 13px; font-weight: 600; background: #ecfdf5; padding: 2px 8px; border-radius: 12px;">✓ Verified Product</span>
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

                    <!-- Quantity + Action Buttons (Visible ONLY if In Stock) -->
                    ${isInstock ? `
                    <div style="display: flex; gap: 14px; margin-bottom: 24px; flex-wrap: wrap;">
                        <div style="display: flex; align-items: center; border: 1.5px solid #cbd5e1; border-radius: 8px; overflow: hidden; background: #fff; height: 50px;">
                            <button type="button" onclick="const q = document.getElementById('detailQtyInput'); if (Number(q.value) > 1) q.value = Number(q.value) - 1;" style="width: 40px; height: 100%; border: none; background: transparent; font-size: 18px; cursor: pointer; color: #475569;">−</button>
                            <input type="number" id="detailQtyInput" value="1" min="1" readonly style="width: 44px; text-align: center; border: none; font-size: 16px; font-weight: 700; color: #1e293b; outline: none;">
                            <button type="button" onclick="const q = document.getElementById('detailQtyInput'); q.value = Number(q.value) + 1;" style="width: 40px; height: 100%; border: none; background: transparent; font-size: 18px; cursor: pointer; color: #475569;">+</button>
                        </div>

                        <button type="button" onclick="handleDetailAddToCart(false)" style="flex: 1; min-width: 160px; height: 50px; background: #0f7139; color: #fff; border: none; border-radius: 8px; font-weight: 700; font-size: 15px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.2s;">
                            🛒 ADD TO CART
                        </button>

                        <button type="button" onclick="handleDetailAddToCart(true)" style="flex: 1; min-width: 140px; height: 50px; background: #1e293b; color: #fff; border: none; border-radius: 8px; font-weight: 700; font-size: 15px; cursor: pointer; transition: background 0.2s;">
                            ⚡ BUY NOW
                        </button>
                    </div>
                    ` : `
                    <!-- Out of Stock Message (No Buy Options) -->
                    <div style="background: #fef2f2; border: 1.5px solid #fca5a5; border-radius: 12px; padding: 18px 22px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <span style="font-size: 26px; line-height: 1;">🚫</span>
                            <div>
                                <div style="color: #991b1b; font-weight: 800; font-size: 16px;">Currently Out of Stock</div>
                                <div style="font-size: 13px; color: #b91c1c; margin-top: 2px;">This product is temporarily sold out and not available for purchase.</div>
                            </div>
                        </div>
                        <a href="collections.html?category=all" style="background: #ffffff; color: #991b1b; border: 1.5px solid #f87171; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 700; text-decoration: none; display: inline-block; transition: all 0.2s;">
                            Browse Other Products →
                        </a>
                    </div>
                    `}

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

        // Initialize Amazon-Style Customer Reviews Section
        initAmazonProductReviews(p);

        // Load Related Products
        loadRelatedProducts(p);
    }

    window.handleDetailAddToCart = function(isBuyNow = false) {
        if (!window.CURRENT_DETAIL_PRODUCT) return;
        const prod = window.CURRENT_DETAIL_PRODUCT;

        const isStockAvailable = (prod.countInStock === undefined || prod.countInStock === null) ? true : (Number(prod.countInStock) > 0);
        if (!isStockAvailable) {
            if (typeof showToast === 'function') {
                showToast('Sorry, this product is currently out of stock.');
            } else {
                alert('Sorry, this product is currently out of stock.');
            }
            return;
        }

        const qInput = document.getElementById('detailQtyInput');
        const qty = qInput ? (Number(qInput.value) || 1) : 1;
        const pImg = prod.image || (prod.images && prod.images[0] ? (prod.images[0].url || prod.images[0]) : '') || "https://arshithfresh.com/cdn/shop/collections/spice_200x200_crop_center.png?v=1746963495";
        addToStoreCart(
            prod._id || '',
            prod.name || prod.title || 'Arshith Fresh Product',
            Number(prod.price) || 0,
            pImg,
            qty
        );
        if (isBuyNow) {
            window.location.href = 'cart.html';
        }
    };

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
    initLiveSearchAutocomplete();
});

// Global Image Thumbnail Switcher for Product Detail
window.switchDetailImage = function(url, thumbElem) {
    const mainImg = document.getElementById('mainDetailProductImg');
    if (mainImg) {
        mainImg.style.opacity = '0.6';
        mainImg.src = url;
        setTimeout(() => { mainImg.style.opacity = '1'; }, 150);
    }
    document.querySelectorAll('.detail-thumb-item').forEach(el => {
        el.style.borderColor = '#e2e8f0';
        el.classList.remove('active');
    });
    if (thumbElem) {
        thumbElem.style.borderColor = '#0f7139';
        thumbElem.classList.add('active');
    }
};

// Auto Signup Lead Capture Popup Modal for Unauthenticated Visitors
function initAutoSignupPopup() {
    let currentUser = null;
    try {
        currentUser = JSON.parse(localStorage.getItem('arshith_user'));
    } catch (e) {}

    if (currentUser && (currentUser._id || currentUser.email)) return;
    try {
        if (sessionStorage.getItem('arshith_signup_popup_dismissed') === 'true') return;
    } catch (e) {}

    const path = window.location.pathname.toLowerCase();
    if (path.includes('/auth/') || path.includes('login.html') || path.includes('register.html') || path.includes('checkout.html') || path.includes('/admin/')) {
        return;
    }

    const isSubpage = path.includes('/pages/');
    const isDeep = path.includes('/categories/') || path.includes('/policies/');
    const logoUrl = 'https://arshithfresh.com/cdn/shop/files/Arshithlogo111.jpg?v=1755685028&width=600';
    const loginUrl = isDeep ? '../auth/login.html' : (isSubpage ? 'auth/login.html' : 'pages/auth/login.html');

    setTimeout(() => {
        if (document.getElementById('arshithSignupModalOverlay')) return;

        const modalHTML = `
            <div id="arshithSignupModalOverlay" class="signup-modal-overlay">
                <div class="signup-modal-container">
                    <button type="button" class="signup-modal-close" onclick="closeSignupModal()">&times;</button>
                    
                    <div class="signup-modal-header">
                        <img src="${logoUrl}" alt="Arshith Fresh Logo" class="signup-modal-logo">
                        <br>
                        <span class="signup-offer-badge">🎁 SPECIAL WELCOME OFFER</span>
                        <h2 class="signup-modal-title">Get 10% OFF Your First Order!</h2>
                        <p class="signup-modal-sub">Create your account today to unlock instant discount code <strong>ARSHITH10</strong>, track live orders, and enjoy faster checkout.</p>
                    </div>

                    <form id="autoSignupModalForm" onsubmit="handleModalSignup(event)">
                        <div class="signup-form-group">
                            <input type="text" id="modalSignupName" placeholder="Full Name" required class="signup-modal-input">
                        </div>
                        <div class="signup-form-group">
                            <input type="email" id="modalSignupEmail" placeholder="Email Address" required class="signup-modal-input">
                        </div>
                        <div class="signup-form-group">
                            <input type="password" id="modalSignupPassword" placeholder="Create Password (min 6 characters)" minlength="6" required class="signup-modal-input">
                        </div>

                        <button type="submit" id="modalSignupBtn" class="signup-modal-submit-btn">
                            Claim 10% OFF & Create Account
                        </button>
                    </form>

                    <div class="signup-modal-footer">
                        <p>Already have an account? <a href="${loginUrl}" class="signup-login-link">Log In</a></p>
                        <button type="button" class="signup-skip-link" onclick="closeSignupModal()">No thanks, continue browsing</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        setTimeout(() => {
            const overlay = document.getElementById('arshithSignupModalOverlay');
            if (overlay) overlay.classList.add('show');
        }, 50);
    }, 3000);
}

function closeSignupModal() {
    const overlay = document.getElementById('arshithSignupModalOverlay');
    if (overlay) {
        overlay.classList.remove('show');
        setTimeout(() => overlay.remove(), 350);
    }
    try {
        sessionStorage.setItem('arshith_signup_popup_dismissed', 'true');
    } catch (e) {}
}

async function handleModalSignup(e) {
    e.preventDefault();
    const btn = document.getElementById('modalSignupBtn');
    const name = document.getElementById('modalSignupName').value.trim();
    const email = document.getElementById('modalSignupEmail').value.trim();
    const password = document.getElementById('modalSignupPassword').value;

    if (!name || !email || !password) return;

    btn.disabled = true;
    btn.textContent = 'Creating Account...';

    try {
        const res = await fetch('http://localhost:5000/api/users/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || 'Registration failed');
        }

        localStorage.setItem('arshith_user', JSON.stringify(data));
        try {
            sessionStorage.setItem('arshith_signup_popup_dismissed', 'true');
        } catch (e) {}

        if (typeof showToast === 'function') {
            showToast('🎉 Account created! Discount code ARSHITH10 unlocked.');
        }

        closeSignupModal();

        setTimeout(() => {
            window.location.reload();
        }, 1200);

    } catch (err) {
        if (typeof showToast === 'function') {
            showToast(err.message || 'Registration error');
        } else {
            alert(err.message || 'Registration error');
        }
    } finally {
        btn.disabled = false;
        btn.textContent = 'Claim 10% OFF & Create Account';
    }
}

window.closeSignupModal = closeSignupModal;
window.handleModalSignup = handleModalSignup;
window.initAutoSignupPopup = initAutoSignupPopup;

document.addEventListener("DOMContentLoaded", () => {
    initAutoSignupPopup();
    initLiveSearchAutocomplete();
});

/* ==========================================================================
   LIVE SEARCH BAR WITH AUTO-COMPLETE WORDS & PRODUCTS DROPDOWN
   ========================================================================== */
function initLiveSearchAutocomplete() {
    const searchInputs = document.querySelectorAll('.search-form input[name="q"], .search-form input[type="text"], .search-bar-container input, #searchQueryInput');
    if (searchInputs.length === 0) return;

    function getPathPrefix() {
        const loc = window.location.pathname;
        if (loc.includes('/pages/auth/') || loc.includes('/pages/categories/') || loc.includes('/pages/policies/')) {
            return '../../';
        } else if (loc.includes('/pages/')) {
            return '../';
        }
        return '';
    }

    function getRecentSearches() {
        try {
            const data = localStorage.getItem('arshith_recent_searches');
            return data ? JSON.parse(data) : ['spices', 'oils', 'dry fruits', 'ghee'];
        } catch (e) {
            return ['spices', 'oils', 'dry fruits', 'ghee'];
        }
    }

    function saveRecentSearch(q) {
        if (!q || q.trim().length === 0) return;
        const query = q.trim();
        let list = getRecentSearches();
        list = list.filter(item => item.toLowerCase() !== query.toLowerCase());
        list.unshift(query);
        if (list.length > 6) list = list.slice(0, 6);
        try {
            localStorage.setItem('arshith_recent_searches', JSON.stringify(list));
        } catch (e) {}
    }

    window.removeRecentSearchItem = function(event, itemText) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        let list = getRecentSearches();
        list = list.filter(item => item.toLowerCase() !== itemText.toLowerCase());
        try {
            localStorage.setItem('arshith_recent_searches', JSON.stringify(list));
        } catch (e) {}
        
        document.querySelectorAll('.search-bar-container, .search-form').forEach(container => {
            const input = container.querySelector('input');
            const dropdown = container.querySelector('.search-suggestions-dropdown');
            if (input && dropdown && dropdown.classList.contains('active')) {
                renderSuggestions(input.value.trim(), dropdown);
            }
        });
    };

    window.clearAllRecentSearches = function(event) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        try {
            localStorage.setItem('arshith_recent_searches', JSON.stringify([]));
        } catch (e) {}

        document.querySelectorAll('.search-bar-container, .search-form').forEach(container => {
            const input = container.querySelector('input');
            const dropdown = container.querySelector('.search-suggestions-dropdown');
            if (input && dropdown && dropdown.classList.contains('active')) {
                renderSuggestions(input.value.trim(), dropdown);
            }
        });
    };

    let allSearchProducts = [];
    let isFetchingProducts = false;

    const STARTER_SEARCH_CATALOG = [
        { _id: 's1', title: 'Granular Buffalo Ghee (Traditional Bilona)', category: 'Ghee and Honey', price: 699, image: 'https://arshithfresh.com/cdn/shop/files/WhatsApp_Image_2025-09-15_at_4.34.52_PM.jpg?v=1757934372&width=533' },
        { _id: 's2', title: 'Cold Pressed Sunflower Oil (Premium Quality)', category: 'Oils', price: 499, image: 'https://arshithfresh.com/cdn/shop/files/WhatsApp_Image_2025-08-22_at_11.41.18_AM.jpg?v=1757334052&width=533' },
        { _id: 's3', title: 'Groundnut Oil (Cold Pressed)', category: 'Oils', price: 349, image: 'https://arshithfresh.com/cdn/shop/files/WhatsApp_Image_2025-08-22_at_11.41.18_AM_1.jpg?v=1757334051&width=533' },
        { _id: 's4', title: 'Flax Seeds (Organic & Premium)', category: 'Dry Seeds', price: 29, image: 'https://arshithfresh.com/cdn/shop/files/WhatsApp_Image_2025-08-22_at_11.41.18_AM_2.jpg?v=1757334051&width=533' },
        { _id: 's5', title: 'Chia Seeds (High Fiber)', category: 'Dry Seeds', price: 49, image: 'https://arshithfresh.com/cdn/shop/files/WhatsApp_Image_2025-08-22_at_11.41.18_AM_3.jpg?v=1757334051&width=533' },
        { _id: 's6', title: 'Raw Wild Forest Honey', category: 'Ghee and Honey', price: 399, image: 'https://arshithfresh.com/cdn/shop/files/4_6d56df69-1c9f-4f05-b1a7-ca631fc7b9aa.png?v=1757334051&width=533' },
        { _id: 's7', title: 'Cashews (W240 Grade Premium)', category: 'Dry Fruits', price: 899, image: 'https://arshithfresh.com/cdn/shop/files/WhatsApp_Image_2025-08-22_at_11.41.18_AM.jpg?v=1757334052&width=533' },
        { _id: 's8', title: 'California Almonds (Badam)', category: 'Dry Fruits', price: 799, image: 'https://arshithfresh.com/cdn/shop/files/WhatsApp_Image_2025-08-22_at_11.41.18_AM_1.jpg?v=1757334051&width=533' }
    ];

    async function loadSearchProducts() {
        if (allSearchProducts.length > 0) return;
        if (isFetchingProducts) return;
        isFetchingProducts = true;
        try {
            let res = await fetch('http://localhost:5000/api/products');
            if (!res.ok) res = await fetch('/api/products');
            if (res.ok) {
                const data = await res.json();
                const fetched = Array.isArray(data) ? data : (data.data || []);
                if (fetched.length > 0) {
                    allSearchProducts = fetched;
                } else {
                    allSearchProducts = STARTER_SEARCH_CATALOG;
                }
            } else {
                allSearchProducts = STARTER_SEARCH_CATALOG;
            }
        } catch (e) {
            allSearchProducts = STARTER_SEARCH_CATALOG;
        } finally {
            isFetchingProducts = false;
        }
    }

    searchInputs.forEach(input => {
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('autocorrect', 'off');
        input.setAttribute('spellcheck', 'false');

        const form = input.closest('form');
        const container = input.closest('.search-bar-container') || (form ? form.parentElement : input.parentElement);
        if (!container) return;

        container.style.position = 'relative';

        if (form && !form.querySelector('.search-clear-btn')) {
            const clearBtn = document.createElement('button');
            clearBtn.type = 'button';
            clearBtn.className = 'search-clear-btn';
            clearBtn.innerHTML = '&times;';
            clearBtn.style.display = 'none';
            clearBtn.title = 'Clear search text';
            clearBtn.addEventListener('click', (e) => {
                e.preventDefault();
                input.value = '';
                clearBtn.style.display = 'none';
                input.focus();
                renderSuggestions('', dropdown);
            });
            form.appendChild(clearBtn);
        }

        let dropdown = container.querySelector('.search-suggestions-dropdown');
        if (!dropdown) {
            dropdown = document.createElement('div');
            dropdown.className = 'search-suggestions-dropdown';
            container.appendChild(dropdown);
        }

        const updateClearBtnState = () => {
            const clearBtn = form ? form.querySelector('.search-clear-btn') : null;
            if (clearBtn) {
                clearBtn.style.display = input.value.trim().length > 0 ? 'flex' : 'none';
            }
        };

        input.addEventListener('focus', () => {
            loadSearchProducts();
            updateClearBtnState();
            renderSuggestions(input.value.trim(), dropdown);
        });

        input.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            updateClearBtnState();
            loadSearchProducts().then(() => {
                renderSuggestions(query, dropdown);
            });
        });

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const q = input.value.trim();
                if (!q) return;
                saveRecentSearch(q);
                const prefix = getPathPrefix();
                window.location.href = `${prefix}pages/collections.html?search=${encodeURIComponent(q)}`;
            });
        }
    });

    function renderSuggestions(query, dropdown) {
        const qLower = query.toLowerCase();
        const prefix = getPathPrefix();
        const recents = getRecentSearches();

        let html = '';

        // 1. Saved Info (Recent Searches) Section with Cross Mark
        if (recents.length > 0) {
            const filteredRecents = query.length > 0 ? recents.filter(r => r.toLowerCase().includes(qLower)) : recents;
            if (filteredRecents.length > 0) {
                html += `
                    <div class="search-suggestion-header" style="display: flex; align-items: center; justify-content: space-between;">
                        <span>Saved info</span>
                        <button type="button" class="clear-all-searches-btn" onclick="clearAllRecentSearches(event)">Clear all</button>
                    </div>
                `;
                filteredRecents.forEach(item => {
                    html += `
                        <div class="search-saved-info-row" onclick="goToAllProducts('${escapeHtml(item)}')">
                            <div class="saved-info-label">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" style="flex-shrink:0;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                <span>${highlightMatch(item, query)}</span>
                            </div>
                            <button type="button" class="delete-saved-item-btn" title="Delete saved item" onclick="removeRecentSearchItem(event, '${escapeHtml(item).replace(/'/g, "\\'")}')">&times;</button>
                        </div>
                    `;
                });
            }
        }

        // 2. Typing Search Suggestions (Categories & Products)
        if (query.length > 0) {
            const matchingProducts = allSearchProducts.filter(p => {
                const title = (p.title || p.name || '').toLowerCase();
                const cat = (p.category || '').toLowerCase();
                const sub = (p.subcategory || '').toLowerCase();
                const desc = (p.description || '').toLowerCase();
                const brand = (p.brand || '').toLowerCase();
                return title.includes(qLower) || cat.includes(qLower) || sub.includes(qLower) || desc.includes(qLower) || brand.includes(qLower);
            }).slice(0, 5);

            const categories = [...new Set(allSearchProducts.map(p => p.category).filter(Boolean))];
            const matchingCats = categories.filter(c => c.toLowerCase().includes(qLower)).slice(0, 3);

            if (matchingCats.length > 0) {
                html += `<div class="search-suggestion-header">Suggested Categories</div>`;
                matchingCats.forEach(cat => {
                    html += `
                        <div class="search-suggestion-word" onclick="goToCategory('${escapeHtml(cat)}')">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0f7139" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            <span>${highlightMatch(cat, query)}</span>
                        </div>
                    `;
                });
            }

            if (matchingProducts.length > 0) {
                html += `<div class="search-suggestion-header">Matching Products</div>`;
                matchingProducts.forEach(p => {
                    const prodTitle = p.title || p.name || 'Product';
                    const img = (p.images && p.images.length > 0) ? p.images[0].url : (p.image || 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=100');
                    const price = p.price ? `₹${p.price}` : '';
                    const catName = p.category || 'General';
                    const detailUrl = `${prefix}pages/product.html?id=${p._id}`;

                    html += `
                        <a href="${detailUrl}" class="search-suggestion-item">
                            <img src="${img}" class="search-suggestion-thumb" alt="${escapeHtml(prodTitle)}" onerror="this.src='https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=100';">
                            <div class="search-suggestion-info">
                                <div class="search-suggestion-title">${highlightMatch(prodTitle, query)}</div>
                                <div class="search-suggestion-meta">
                                    <span>${escapeHtml(catName)}</span>
                                    ${price ? `<span class="search-suggestion-price">${price}</span>` : ''}
                                </div>
                            </div>
                        </a>
                    `;
                });
            }

            if (matchingProducts.length === 0 && matchingCats.length === 0 && recents.length === 0) {
                html += `
                    <div class="search-suggestion-header">Suggestions</div>
                    <div style="padding: 14px; text-align: center; color: #64748b; font-size: 13px;">
                        No products found for "<strong>${escapeHtml(query)}</strong>"
                    </div>
                `;
            }

            html += `
                <div class="search-suggestion-footer" onclick="goToAllProducts('${escapeHtml(query)}')">
                    See all results for "${escapeHtml(query)}" →
                </div>
            `;
        }

        if (html.trim().length === 0) {
            dropdown.classList.remove('active');
            return;
        }

        dropdown.innerHTML = html;
        dropdown.classList.add('active');
    }

    function highlightMatch(text, query) {
        if (!text || !query) return escapeHtml(text);
        const idx = text.toLowerCase().indexOf(query.toLowerCase());
        if (idx === -1) return escapeHtml(text);
        const match = text.substring(idx, idx + query.length);
        const before = text.substring(0, idx);
        const after = text.substring(idx + query.length);
        return `${escapeHtml(before)}<strong style="color:#0f7139; background: #eef7f2; padding: 0 2px; border-radius: 2px;">${escapeHtml(match)}</strong>${escapeHtml(after)}`;
    }

    function escapeHtml(str) {
        return (str || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    window.goToCategory = function(catName) {
        saveRecentSearch(catName);
        const prefix = getPathPrefix();
        window.location.href = `${prefix}pages/collections.html?search=${encodeURIComponent(catName)}`;
    };

    window.goToAllProducts = function(q) {
        if (q) saveRecentSearch(q);
        const prefix = getPathPrefix();
        window.location.href = `${prefix}pages/collections.html?search=${encodeURIComponent(q || '')}`;
    };

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-bar-container') && !e.target.closest('.search-form')) {
            document.querySelectorAll('.search-suggestions-dropdown').forEach(d => d.classList.remove('active'));
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.search-suggestions-dropdown').forEach(d => d.classList.remove('active'));
        }
    });
}

/* ==========================================================================
   GLOBAL UTILITIES (available to all modules outside DOMContentLoaded)
   ========================================================================== */
function escapeHtml(str) {
    return (str || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
window.escapeHtml = escapeHtml;

/* ==========================================================================
   AMAZON-STYLE PRODUCT REVIEW & RATING CLIENT MODULE
   ========================================================================== */
let amazonReviewState = {
    productId: '',
    productName: '',
    reviews: [],
    stats: null,
    currentFilterRating: '',
    currentSort: 'recent',
    currentVerifiedOnly: false,
    selectedFormRating: 5,
    uploadedImages: [],
    editingReviewId: null,
    isLoading: false,
};

const ratingLabelsMap = {
    5: '⭐⭐⭐⭐⭐ 5 Stars — Excellent / Highly Recommended!',
    4: '⭐⭐⭐⭐ 4 Stars — Very Good / High Quality',
    3: '⭐⭐⭐ 3 Stars — Good / Average Quality',
    2: '⭐⭐ 2 Stars — Below Average / Disappointed',
    1: '⭐ 1 Star — Poor / Not Recommended'
};

window.initAmazonProductReviews = function(product) {
    if (!product) return;
    const container = document.getElementById('amazonReviewsSection');
    if (!container) return;

    amazonReviewState.productId = product._id || product.id;
    amazonReviewState.productName = product.name || 'Product';
    amazonReviewState.currentFilterRating = '';
    amazonReviewState.currentSort = 'recent';
    amazonReviewState.currentVerifiedOnly = false;
    amazonReviewState.selectedFormRating = 5;
    amazonReviewState.uploadedImages = [];
    amazonReviewState.editingReviewId = null;

    fetchAndRenderAmazonReviews();
};

async function fetchAndRenderAmazonReviews() {
    const container = document.getElementById('amazonReviewsSection');
    if (!container) return;

    amazonReviewState.isLoading = true;

    try {
        let url = `http://localhost:5000/api/reviews/product/${encodeURIComponent(amazonReviewState.productId)}?sort=${amazonReviewState.currentSort}`;
        if (amazonReviewState.currentFilterRating) {
            url += `&rating=${amazonReviewState.currentFilterRating}`;
        }
        if (amazonReviewState.currentVerifiedOnly) {
            url += `&verifiedOnly=true`;
        }

        // Always fetch fresh — no browser caching so updated reviews always load
        const res = await fetch(url, { cache: 'no-store' });
        const data = await res.json();

        let fetchedReviews = (data && data.success && Array.isArray(data.reviews)) ? data.reviews : [];

        // Supplement with local review from Order History ONLY if backend doesn't already have it
        // (Backend is source of truth — only add local if backend returned no review for this user)
        try {
            const localRatings = JSON.parse(localStorage.getItem('arshith_product_ratings') || '{}');
            const currentUser = JSON.parse(localStorage.getItem('arshith_user') || 'null');
            const userEmail = currentUser && currentUser.email ? currentUser.email.toLowerCase() : null;

            // Check if backend already returned a review for the current user
            const backendAlreadyHasUserReview = userEmail &&
                fetchedReviews.some(r => r.customerEmail && r.customerEmail.toLowerCase() === userEmail);

            if (!backendAlreadyHasUserReview) {
                // Backend doesn't have it yet — check localStorage for a recently submitted review
                const pidKey = `pid_${amazonReviewState.productId}`;
                const userRatingForThis = localRatings[pidKey] ||
                    Object.values(localRatings).find(v => v && v.productId && v.productId === amazonReviewState.productId) ||
                    (amazonReviewState.productName && Object.values(localRatings).find(v => v && v.productName && v.productName.toLowerCase() === amazonReviewState.productName.toLowerCase()));

                if (userRatingForThis && userRatingForThis.comment) {
                    fetchedReviews.unshift({
                        _id: 'local_' + (userRatingForThis.date || Date.now()),
                        productId: amazonReviewState.productId,
                        productName: amazonReviewState.productName,
                        rating: userRatingForThis.rating || 5,
                        title: userRatingForThis.title || 'Customer Review',
                        comment: userRatingForThis.comment,
                        customerName: userRatingForThis.name || (currentUser ? currentUser.name : 'Verified Customer'),
                        customerEmail: userRatingForThis.email || userEmail || '',
                        verifiedPurchase: true,
                        helpfulCount: 0,
                        createdAt: userRatingForThis.date || new Date().toISOString()
                    });
                }
            }
        } catch (e) {}

        // Apply in-memory filter & sort if needed
        if (amazonReviewState.currentFilterRating) {
            fetchedReviews = fetchedReviews.filter(r => String(r.rating) === String(amazonReviewState.currentFilterRating));
        }
        if (amazonReviewState.currentVerifiedOnly) {
            fetchedReviews = fetchedReviews.filter(r => r.verifiedPurchase === true);
        }

        if (amazonReviewState.currentSort === 'rating_desc') {
            fetchedReviews.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        } else if (amazonReviewState.currentSort === 'rating_asc') {
            fetchedReviews.sort((a, b) => (a.rating || 0) - (b.rating || 0));
        } else if (amazonReviewState.currentSort === 'helpful') {
            fetchedReviews.sort((a, b) => (b.helpfulCount || 0) - (a.helpfulCount || 0));
        } else {
            fetchedReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        amazonReviewState.reviews = fetchedReviews;

        // Compute aggregate stats from REAL backend data
        let totalRev = 0, avgScore = 0, dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }, distCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

        const hasBackendStats = data && data.totalReviews !== undefined;

        if (hasBackendStats && data.totalReviews > 0) {
            // Real stats from backend
            totalRev = data.totalReviews;
            avgScore = data.averageRating || 0;
            dist = data.ratingDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
            distCounts = data.distributionCounts || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        } else if (fetchedReviews.length > 0) {
            totalRev = fetchedReviews.length;
            const totalScore = fetchedReviews.reduce((s, r) => s + (r.rating || 5), 0);
            avgScore = Math.round((totalScore / totalRev) * 10) / 10;
            fetchedReviews.forEach(r => {
                const star = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
                distCounts[star] = (distCounts[star] || 0) + 1;
            });
            dist = {
                5: Math.round((distCounts[5] / totalRev) * 100),
                4: Math.round((distCounts[4] / totalRev) * 100),
                3: Math.round((distCounts[3] / totalRev) * 100),
                2: Math.round((distCounts[2] / totalRev) * 100),
                1: Math.round((distCounts[1] / totalRev) * 100),
            };
        }

        amazonReviewState.stats = {
            averageRating: avgScore,
            totalReviews: totalRev,
            distributionCounts: distCounts,
            ratingDistribution: dist
        };

        // Update top product rating numbers beside photo
        updateTopProductRatingDisplay(avgScore, totalRev);


    } catch (err) {
        console.warn('Could not fetch reviews from backend, using local defaults:', err);
    } finally {
        amazonReviewState.isLoading = false;
        renderAmazonReviewsUI(container);
    }
}

function updateTopProductRatingDisplay(avg, totalCount) {
    const starsEl = document.getElementById('topRatingStarsVisual');
    const numEl = document.getElementById('topRatingScoreNum');
    const countEl = document.getElementById('topRatingCountText');

    if (starsEl) {
        const rounded = Math.round(avg);
        starsEl.innerHTML = '★'.repeat(rounded) + '☆'.repeat(5 - rounded);
    }
    if (numEl) numEl.textContent = avg.toFixed(1);
    if (countEl) countEl.textContent = `(${totalCount.toLocaleString()} customer ratings)`;
}

function renderAmazonReviewsUI(container) {
    const stats = amazonReviewState.stats || {
        averageRating: 0,
        totalReviews: 0,
        distributionCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    };

    const avg = stats.averageRating || 0;
    const total = stats.totalReviews || 0;
    const dist = stats.ratingDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const distCounts = stats.distributionCounts || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    const roundedStars = Math.round(avg);
    const starString = '★'.repeat(roundedStars) + '☆'.repeat(5 - roundedStars);

    // Collect all customer images across reviews for the top gallery strip
    const allCustomerImages = [];
    amazonReviewState.reviews.forEach(r => {
        if (Array.isArray(r.images)) {
            r.images.forEach(img => {
                if (img && !allCustomerImages.includes(img)) allCustomerImages.push(img);
            });
        }
    });

    // Fallback demo images if none in reviews
    if (allCustomerImages.length === 0) {
        allCustomerImages.push(
            'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&auto=format&fit=crop&q=60',
            'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&auto=format&fit=crop&q=60',
            'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=300&auto=format&fit=crop&q=60'
        );
    }

    // Get Logged In User
    let currentUser = null;
    try {
        currentUser = JSON.parse(localStorage.getItem('arshith_user'));
    } catch (e) {}

    container.innerHTML = `
        <!-- Section Navigation Bar Tabs (Amazon style) -->
        <div style="border-bottom: 2px solid #e2e8f0; display: flex; gap: 32px; margin-bottom: 28px; font-size: 14.5px; font-weight: 700; color: #475569;">
            <span style="color: #007185; border-bottom: 3px solid #007185; padding-bottom: 8px; cursor: pointer;">Customer Reviews</span>
            <span style="color: #64748b; padding-bottom: 8px; cursor: pointer;" onclick="document.querySelector('.related-products-section')?.scrollIntoView({behavior:'smooth'})">Similar Products</span>
            <span style="color: #64748b; padding-bottom: 8px; cursor: pointer;" onclick="window.scrollTo({top:0, behavior:'smooth'})">↑ Back to Top</span>
        </div>

        <div class="amazon-reviews-grid" style="display: grid; grid-template-columns: 340px 1fr; gap: 48px; align-items: start;">
            
            <!-- LEFT COLUMN: RATING BREAKDOWN & SUMMARY -->
            <div class="reviews-summary-panel" style="background: #ffffff; padding: 0;">
                <h3 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0;">Customer reviews</h3>
                
                <div class="overall-score-box" style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
                    <div class="overall-stars-row" style="color: #de7921; font-size: 20px; letter-spacing: 1px;">${starString}</div>
                    <span class="overall-score-num" style="font-size: 18px; font-weight: 700; color: #0f172a;">${avg.toFixed(1)} out of 5</span>
                </div>
                <span class="total-ratings-label" style="font-size: 13.5px; color: #565959; margin-bottom: 18px; display: block;">${total.toLocaleString()} global ratings</span>

                <!-- 5 to 1 Star Progress Breakdown Bars -->
                <div class="distribution-list" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px;">
                    ${[5, 4, 3, 2, 1].map(starNum => {
                        const pct = dist[starNum] || 0;
                        const count = distCounts[starNum] || 0;
                        const isSelected = amazonReviewState.currentFilterRating === String(starNum);
                        return `
                            <div class="distribution-row ${isSelected ? 'active-filter-row' : ''}" 
                                 onclick="setAmazonReviewFilter('${isSelected ? '' : starNum}')" 
                                 title="Filter by ${starNum} star reviews (${count} review${count === 1 ? '' : 's'})"
                                 style="display: flex; align-items: center; gap: 12px; font-size: 13.5px; cursor: pointer; padding: 3px 0; border-radius: 4px;">
                                <span class="dist-star-label" style="width: 48px; color: #007185; font-weight: 500; white-space: nowrap; text-decoration: underline;">${starNum} star</span>
                                <div class="dist-bar-track" style="flex: 1; height: 20px; background: #f0f2f2; border: 1px solid #d5d9d9; border-radius: 4px; overflow: hidden; position: relative; box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);">
                                    <div class="dist-bar-fill" style="height: 100%; background: #de7921; border-radius: 3px; width: ${pct}%;"></div>
                                </div>
                                <span class="dist-pct-label" style="width: 36px; text-align: right; font-weight: 500; color: #007185; font-size: 13px;">${pct}%</span>
                            </div>
                        `;
                    }).join('')}
                </div>
                <!-- Verified Purchase Policy Notice -->
                <div class="write-review-prompt-box" style="border-top: 1px solid #e7e7e7; padding-top: 18px; text-align: left;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                        <span style="font-size: 16px;">🛡️</span>
                        <strong style="font-size: 14px; color: #0f172a;">Verified Reviews Only</strong>
                    </div>
                    <p style="margin: 0; font-size: 12.5px; line-height: 1.5; color: #565959;">
                        To guarantee 100% authentic ratings, only customers who purchased this product can leave reviews from their <a href="../profile.html" style="color: #007185; font-weight: 600; text-decoration: none;">Order History</a>.
                    </p>
                </div>
            </div>

            <!-- RIGHT COLUMN: REVIEWS FEED -->
            <div class="reviews-feed-panel" style="display: flex; flex-direction: column; gap: 24px;">

                <!-- Feed Header: Title + Sort -->
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e7e7e7; padding-bottom: 10px;">
                    <h3 style="font-size: 19px; font-weight: 700; color: #0f172a; margin: 0;">Top reviews from India</h3>
                    
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 13px; color: #565959;">Sort by:</span>
                        <select onchange="handleAmazonReviewSort(this.value)" style="padding: 4px 8px; border: 1px solid #d5d9d9; border-radius: 6px; font-size: 13px; color: #0f1111; background: #f0f2f2; cursor: pointer; outline: none;">
                            <option value="recent" ${amazonReviewState.currentSort === 'recent' ? 'selected' : ''}>Top reviews</option>
                            <option value="recent" ${amazonReviewState.currentSort === 'recent' ? 'selected' : ''}>Most recent</option>
                            <option value="rating_desc" ${amazonReviewState.currentSort === 'rating_desc' ? 'selected' : ''}>Highest rating</option>
                            <option value="rating_asc" ${amazonReviewState.currentSort === 'rating_asc' ? 'selected' : ''}>Lowest rating</option>
                            <option value="helpful" ${amazonReviewState.currentSort === 'helpful' ? 'selected' : ''}>Most helpful</option>
                        </select>
                    </div>
                </div>

                <!-- Reviews Feed List (Matching User's Amazon Screenshot) -->
                <div class="reviews-list-container" style="display: flex; flex-direction: column; gap: 26px;">
                    ${amazonReviewState.reviews.length === 0 ? `
                        <div style="text-align: center; padding: 40px 20px; background: #fafafa; border: 1px dashed #d5d9d9; border-radius: 8px; color: #565959;">
                            <p style="font-size: 15px; font-weight: 600; color: #0f1111; margin: 0 0 6px 0;">No customer reviews yet</p>
                            <p style="font-size: 13.5px; margin: 0; color: #565959;">Verified customers who purchased this item can leave a review from their account order history.</p>
                        </div>
                    ` : amazonReviewState.reviews.map(r => {
                        const stars = '★'.repeat(r.rating || 5) + '☆'.repeat(5 - (r.rating || 5));
                        const dateFormatted = new Date(r.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        });
                        const isOwnReview = currentUser && (
                            (currentUser.email && r.customerEmail && currentUser.email.toLowerCase() === r.customerEmail.toLowerCase()) ||
                            (currentUser._id && r.userId && String(currentUser._id) === String(r.userId))
                        );

                        return `
                            <div class="review-item-card" id="review_card_${r._id}" style="border-bottom: 1px solid #e7e7e7; padding-bottom: 22px;">
                                
                                <!-- Author Row (Grey avatar icon + Customer Name) -->
                                <div class="review-author-row" style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                                    <div style="width: 32px; height: 32px; border-radius: 50%; background: #d5d9d9; display: flex; align-items: center; justify-content: center; color: #ffffff;">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                                    </div>
                                    <span class="author-name-text" style="font-weight: 500; font-size: 13.5px; color: #0f1111;">${escapeHtml(r.customerName || 'Amazon Customer')}</span>
                                </div>

                                <!-- Star Rating & Title Headline (Exact Amazon Format) -->
                                <div class="review-rating-headline-row" style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; flex-wrap: wrap;">
                                    <span class="review-card-stars" style="color: #de7921; font-size: 15px; letter-spacing: 1px;">${stars}</span>
                                    <strong class="review-card-title" style="font-weight: 700; font-size: 14px; color: #0f1111;">${escapeHtml(r.title || 'VALUE FOR MONEY')}</strong>
                                </div>

                                <!-- Date & Verified Purchase Badge -->
                                <div class="review-date-verified-row" style="font-size: 13px; color: #565959; margin-bottom: 10px;">
                                    <span>Reviewed in India on ${dateFormatted}</span>
                                    ${r.verifiedPurchase ? `
                                        <div style="margin-top: 3px;">
                                            <span style="color: #c45500; font-weight: 700; font-size: 12px;">Verified Purchase</span>
                                        </div>
                                    ` : ''}
                                </div>

                                <!-- Review Comment Body Text -->
                                <p class="review-card-comment" style="font-size: 14px; line-height: 1.55; color: #0f1111; margin: 0 0 12px 0;">${escapeHtml(r.comment)}</p>

                                <!-- Optional Photo Gallery Thumbnails -->
                                ${r.images && r.images.length > 0 ? `
                                    <div class="review-images-gallery" style="display: flex; gap: 10px; margin-bottom: 14px; flex-wrap: wrap;">
                                        ${r.images.map(img => `
                                            <img src="${img}" class="review-img-thumb" onclick="openAmazonReviewLightbox('${img.replace(/'/g, "\\'")}')" alt="Customer review photo" style="width: 88px; height: 88px; border-radius: 6px; object-fit: cover; border: 1px solid #d5d9d9; cursor: pointer;">
                                        `).join('')}
                                    </div>
                                ` : ''}

                                <!-- Helpful count text (e.g. "17 people found this helpful") -->
                                <div style="font-size: 13px; color: #565959; margin-bottom: 10px;">
                                    ${(r.helpfulCount && r.helpfulCount > 0) ? `${r.helpfulCount} ${r.helpfulCount === 1 ? 'person' : 'people'} found this helpful` : 'One person found this helpful'}
                                </div>

                                <!-- Helpful button + Report link (Exact Amazon styling) -->
                                <div class="review-actions-footer" style="display: flex; align-items: center; gap: 16px;">
                                    <button type="button" class="helpful-vote-btn" onclick="toggleAmazonHelpfulVote('${r._id}')" style="background: #ffffff; border: 1px solid #d5d9d9; border-radius: 8px; padding: 5px 22px; font-size: 13px; font-weight: 500; color: #0f1111; cursor: pointer; box-shadow: 0 2px 5px rgba(213,217,217,.5); transition: background 0.15s;">
                                        Helpful
                                    </button>
                                    <span style="color: #d5d9d9;">|</span>
                                    <a href="javascript:void(0)" onclick="if(typeof showToast==='function') showToast('Thank you for reporting. Our moderation team will review it.'); else alert('Thank you for reporting.');" style="font-size: 13px; color: #565959; text-decoration: none;">Report</a>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>

            </div>

        </div>

        <!-- Review Photo Lightbox Modal -->
        <div id="amazonReviewLightbox" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(4px); z-index: 99999; align-items: center; justify-content: center; padding: 20px;" onclick="closeAmazonReviewLightbox()">
            <div style="position: relative; max-width: 90vw; max-height: 90vh;">
                <img id="amazonLightboxImg" src="" style="max-width: 100%; max-height: 85vh; border-radius: 8px; object-fit: contain;">
                <button type="button" style="position: absolute; top: -14px; right: -14px; width: 36px; height: 36px; border-radius: 50%; background: #ffffff; border: none; font-size: 20px; font-weight: bold; cursor: pointer; color: #0f172a;">&times;</button>
            </div>
        </div>
    `;
}

// Interaction Handlers
window.toggleAmazonReviewForm = function(forceOpen) {
    const card = document.getElementById('amazonWriteReviewCard');
    if (!card) return;

    let currentUser = null;
    try {
        currentUser = JSON.parse(localStorage.getItem('arshith_user'));
    } catch (e) {}

    if (forceOpen === true && !currentUser) {
        if (typeof showToast === 'function') {
            showToast('Please log in to write a product review.');
        } else {
            alert('Please log in to write a product review.');
        }
        setTimeout(() => {
            window.location.href = 'auth/login.html';
        }, 600);
        return;
    }

    if (forceOpen === true) {
        card.style.display = 'block';
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (forceOpen === false) {
        card.style.display = 'none';
        amazonReviewState.editingReviewId = null;
        amazonReviewState.uploadedImages = [];
        const form = document.getElementById('amazonReviewForm');
        if (form) form.reset();
    } else {
        const isOpen = card.style.display === 'block';
        card.style.display = isOpen ? 'none' : 'block';
        if (!isOpen) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
};

window.setInteractiveFormRating = function(star) {
    amazonReviewState.selectedFormRating = Number(star);
    updateInteractiveStarsVisual(amazonReviewState.selectedFormRating);
};

window.previewInteractiveStars = function(star) {
    updateInteractiveStarsVisual(Number(star));
};

window.restoreInteractiveStars = function() {
    updateInteractiveStarsVisual(amazonReviewState.selectedFormRating);
};

function updateInteractiveStarsVisual(starCount) {
    const btns = document.querySelectorAll('.star-pick-btn');
    btns.forEach(btn => {
        const s = Number(btn.getAttribute('data-star'));
        if (s <= starCount) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    const labelEl = document.getElementById('starFeedbackText');
    if (labelEl) {
        labelEl.textContent = ratingLabelsMap[starCount] || `${starCount} Stars`;
    }
}

window.handleReviewImageUpload = function(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const previewBox = document.getElementById('reviewImagesPreviewBox');

    Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64 = e.target.result;
            amazonReviewState.uploadedImages.push(base64);
            renderReviewImagePreviews();
        };
        reader.readAsDataURL(file);
    });
};

function renderReviewImagePreviews() {
    const previewBox = document.getElementById('reviewImagesPreviewBox');
    if (!previewBox) return;

    previewBox.innerHTML = amazonReviewState.uploadedImages.map((img, idx) => `
        <div style="position: relative; display: inline-block;">
            <img src="${img}" style="width: 60px; height: 60px; border-radius: 6px; object-fit: cover; border: 1px solid #cbd5e1;">
            <button type="button" onclick="removeReviewImage(${idx})" style="position: absolute; top: -6px; right: -6px; width: 20px; height: 20px; border-radius: 50%; background: #dc2626; color: #fff; border: none; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center;">&times;</button>
        </div>
    `).join('');
}

window.removeReviewImage = function(index) {
    amazonReviewState.uploadedImages.splice(index, 1);
    renderReviewImagePreviews();
};

window.handleAmazonReviewFormSubmit = async function(event) {
    event.preventDefault();
    const btn = document.getElementById('submitAmazonReviewBtn');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Submitting...';
    }

    const rating = amazonReviewState.selectedFormRating || 5;
    const name = document.getElementById('reviewAuthorInput').value.trim();
    const email = document.getElementById('reviewEmailInput').value.trim();
    const title = document.getElementById('reviewTitleInput').value.trim();
    const comment = document.getElementById('reviewCommentInput').value.trim();

    if (!rating || !name || !email || !title || !comment) {
        alert('Please fill out all required fields.');
        if (btn) { btn.disabled = false; btn.textContent = 'Submit Review ✨'; }
        return;
    }

    let currentUser = null;
    try {
        currentUser = JSON.parse(localStorage.getItem('arshith_user'));
    } catch (e) {}

    const payload = {
        productId: amazonReviewState.productId,
        productName: amazonReviewState.productName,
        rating,
        title,
        comment,
        customerName: name,
        customerEmail: email,
        userId: currentUser ? currentUser._id : null,
        images: amazonReviewState.uploadedImages
    };

    try {
        let res, data;
        if (amazonReviewState.editingReviewId) {
            // Update existing review
            res = await fetch(`http://localhost:5000/api/reviews/${amazonReviewState.editingReviewId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            data = await res.json();
        } else {
            // Create new review
            res = await fetch(`http://localhost:5000/api/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            data = await res.json();
        }

        if (data && data.success) {
            if (typeof showToast === 'function') {
                showToast(data.message || '🎉 Review submitted successfully!');
            } else {
                alert(data.message || '🎉 Review submitted successfully!');
            }

            toggleAmazonReviewForm(false);
            fetchAndRenderAmazonReviews();
        } else {
            alert(data.message || 'Failed to submit review');
        }
    } catch (err) {
        alert('Error: ' + err.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Submit Review ✨';
        }
    }
};

window.setAmazonReviewFilter = function(starVal) {
    amazonReviewState.currentFilterRating = starVal;
    fetchAndRenderAmazonReviews();
};

window.toggleAmazonVerifiedFilter = function() {
    amazonReviewState.currentVerifiedOnly = !amazonReviewState.currentVerifiedOnly;
    fetchAndRenderAmazonReviews();
};

window.handleAmazonReviewSort = function(sortVal) {
    amazonReviewState.currentSort = sortVal;
    fetchAndRenderAmazonReviews();
};

window.toggleAmazonHelpfulVote = async function(reviewId) {
    let currentUser = null;
    try {
        currentUser = JSON.parse(localStorage.getItem('arshith_user'));
    } catch (e) {}

    const voterId = currentUser ? currentUser.email : (localStorage.getItem('arshith_voter_id') || 'guest_' + Math.random().toString(36).substring(2, 9));
    localStorage.setItem('arshith_voter_id', voterId);

    try {
        const res = await fetch(`http://localhost:5000/api/reviews/${reviewId}/helpful`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userIdentifier: voterId })
        });
        const data = await res.json();
        if (data && data.success) {
            fetchAndRenderAmazonReviews();
        }
    } catch (err) {
        console.error('Error voting helpful:', err);
    }
};

window.editAmazonOwnReview = function(reviewId) {
    const rev = amazonReviewState.reviews.find(r => String(r._id) === String(reviewId));
    if (!rev) return;

    amazonReviewState.editingReviewId = reviewId;
    amazonReviewState.selectedFormRating = rev.rating || 5;
    amazonReviewState.uploadedImages = rev.images || [];

    toggleAmazonReviewForm(true);

    const titleInput = document.getElementById('reviewTitleInput');
    const commentInput = document.getElementById('reviewCommentInput');
    const nameInput = document.getElementById('reviewAuthorInput');
    const emailInput = document.getElementById('reviewEmailInput');

    if (titleInput) titleInput.value = rev.title || '';
    if (commentInput) commentInput.value = rev.comment || '';
    if (nameInput) nameInput.value = rev.customerName || '';
    if (emailInput) emailInput.value = rev.customerEmail || '';

    updateInteractiveStarsVisual(rev.rating || 5);
    renderReviewImagePreviews();
};

window.deleteAmazonOwnReview = async function(reviewId) {
    if (!confirm('Are you sure you want to delete your review?')) return;

    let currentUser = null;
    try {
        currentUser = JSON.parse(localStorage.getItem('arshith_user'));
    } catch (e) {}

    try {
        const res = await fetch(`http://localhost:5000/api/reviews/${reviewId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customerEmail: currentUser ? currentUser.email : '' })
        });
        const data = await res.json();
        if (data && data.success) {
            if (typeof showToast === 'function') showToast('Review deleted successfully');
            fetchAndRenderAmazonReviews();
        } else {
            alert(data.message || 'Failed to delete review');
        }
    } catch (err) {
        alert('Error: ' + err.message);
    }
};

window.openAmazonReviewLightbox = function(imgUrl) {
    const lightbox = document.getElementById('amazonReviewLightbox');
    const img = document.getElementById('amazonLightboxImg');
    if (lightbox && img) {
        img.src = imgUrl;
        lightbox.style.display = 'flex';
    }
};

window.closeAmazonReviewLightbox = function() {
    const lightbox = document.getElementById('amazonReviewLightbox');
    if (lightbox) lightbox.style.display = 'none';
};

// ============================================================
// 🌟 REAL REVIEWS & RATINGS SYNC (HOMEPAGE & STOREFRONT)
// Replaces hardcoded/fake review numbers with 100% real MongoDB data
// ============================================================
async function syncHomepageRealRatingsAndReviews() {
    // 1. Fetch Real Products from Backend
    try {
        const prodRes = await fetch('http://localhost:5000/api/products');
        if (prodRes.ok) {
            const products = await prodRes.json();
            if (Array.isArray(products) && products.length > 0) {
                // Map products by name and slug for fast lookup
                const prodMap = {};
                products.forEach(p => {
                    if (p.name) prodMap[p.name.toLowerCase().trim()] = p;
                    if (p.title) prodMap[p.title.toLowerCase().trim()] = p;
                });

                // Update all product cards on the current page
                const cards = document.querySelectorAll('.product-card');
                cards.forEach(card => {
                    const headingEl = card.querySelector('.card__heading');
                    const ratingBox = card.querySelector('.rating-box');
                    if (!headingEl || !ratingBox) return;

                    const title = headingEl.textContent.trim().toLowerCase();
                    const matched = prodMap[title] || Object.values(prodMap).find(p => title.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(title));

                    if (matched) {
                        const count = Number(matched.numReviews || 0);
                        const rate = Number(matched.rating || 5.0).toFixed(1);
                        const starsFilled = Math.round(matched.rating || 5);
                        const starsStr = '★'.repeat(starsFilled) + '☆'.repeat(5 - starsFilled);

                        const starsEl = ratingBox.querySelector('.rating-stars');
                        const textEl = ratingBox.querySelector('.rating-text');

                        if (starsEl) starsEl.textContent = starsStr;
                        if (textEl) {
                            textEl.textContent = count > 0 ? `${rate} / 5.0 (${count})` : 'No reviews yet';
                        }
                    } else {
                        // Product without DB match -> show clean no reviews yet
                        const textEl = ratingBox.querySelector('.rating-text');
                        if (textEl) textEl.textContent = 'No reviews yet';
                    }
                });
            }
        }
    } catch (err) {
        console.debug('[Reviews Sync] Products fetch error:', err);
    }

    // 2. Fetch Real Reviews for Homepage Showcase
    const reviewsGrid = document.getElementById('homepageRealReviewsGrid');
    if (!reviewsGrid) return;

    try {
        const revRes = await fetch('http://localhost:5000/api/reviews/latest?limit=8');
        if (!revRes.ok) throw new Error('API ' + revRes.status);
        const revData = await revRes.json();
        const reviews = revData.reviews || [];

        if (reviews.length === 0) {
            reviewsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 12px; color: #64748b;">
                    <div style="font-size: 32px; margin-bottom: 8px;">🌿</div>
                    <h4 style="margin: 0 0 6px 0; color: #1e293b; font-size: 16px;">Be the First to Leave a Review!</h4>
                    <p style="margin: 0 0 16px 0; font-size: 13.5px;">Order our farm-fresh products and share your authentic feedback with our community.</p>
                    <a href="pages/collections.html?category=all" style="display: inline-block; background: #0f7139; color: #fff; padding: 8px 20px; border-radius: 20px; text-decoration: none; font-weight: 600; font-size: 13px;">Shop Our Products &rarr;</a>
                </div>
            `;
            return;
        }

        reviewsGrid.innerHTML = reviews.map(r => {
            const stars = '★'.repeat(r.rating || 5) + '☆'.repeat(5 - (r.rating || 5));
            const dateStr = r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            }) : 'Recent';

            const prodName = r.productName || (r.productId && r.productId.name) || 'Arshith Fresh Product';
            const prodImg = (r.productId && r.productId.image) || 'https://arshithfresh.com/cdn/shop/files/WhatsApp_Image_2025-08-22_at_11.41.18_AM_1.jpg?v=1757334051&width=120';
            const customerInitial = (r.customerName || 'C').charAt(0).toUpperCase();

            return `
                <div class="homepage-real-review-card" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 22px; display: flex; flex-direction: column; box-shadow: 0 2px 6px rgba(0,0,0,0.03); transition: transform 0.2s ease, box-shadow 0.2s ease;">
                    <!-- Top Author Row -->
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 14px;">
                        <div style="width: 38px; height: 38px; border-radius: 50%; background: #e8f5e9; color: #0f7139; font-weight: 700; font-size: 15px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            ${customerInitial}
                        </div>
                        <div style="flex: 1; min-width: 0;">
                            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                                <strong style="font-size: 13.5px; color: #1e293b;">${escapeHtml(r.customerName || 'Customer')}</strong>
                                ${r.verifiedPurchase ? '<span style="background: #dcfce7; color: #15803d; font-size: 10.5px; font-weight: 700; padding: 1px 6px; border-radius: 10px;">✓ Verified</span>' : ''}
                            </div>
                            <span style="font-size: 11.5px; color: #94a3b8;">${dateStr}</span>
                        </div>
                    </div>

                    <!-- Star Rating & Title -->
                    <div style="margin-bottom: 10px;">
                        <div style="color: #de7921; font-size: 14px; letter-spacing: 1px; margin-bottom: 2px;">${stars}</div>
                        <strong style="font-size: 14px; color: #0f172a;">${escapeHtml(r.title || 'Customer Review')}</strong>
                    </div>

                    <!-- Review Comment Body -->
                    <p style="font-size: 13px; line-height: 1.5; color: #334155; margin: 0 0 16px 0; flex: 1; word-break: break-word;">
                        "${escapeHtml(r.comment)}"
                    </p>

                    <!-- Product Tag Footer -->
                    <div style="margin-top: auto; padding-top: 12px; border-top: 1px solid #f1f5f9; display: flex; align-items: center; gap: 8px;">
                        <img src="${prodImg}" alt="${escapeHtml(prodName)}" style="width: 28px; height: 28px; border-radius: 4px; object-fit: cover; border: 1px solid #e2e8f0;">
                        <span style="font-size: 11.5px; font-weight: 600; color: #0284c7; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            ${escapeHtml(prodName)}
                        </span>
                    </div>
                </div>
            `;
        }).join('');

    } catch (err) {
        console.debug('[Reviews Sync] Latest reviews fetch error:', err);
    }
}

// Automatically trigger on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncHomepageRealRatingsAndReviews);
} else {
    syncHomepageRealRatingsAndReviews();
}
