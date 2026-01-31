/* ========================================
   TALIVIN POWER SOLUTIONS - MAIN JAVASCRIPT
   ========================================
   
   Main JavaScript file handling:
   - Mobile navigation
   - Header scroll effects
   - Smooth scrolling
   - Scroll animations
   - Scroll to top button
   
   ======================================== */

'use strict';

/* ========================================
   DOM ELEMENTS
   ======================================== */

const header = document.querySelector('.header');
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
const navLinks = document.querySelectorAll('.nav-link');
const scrollTopBtn = document.querySelector('.scroll-top');

/* ========================================
   MOBILE NAVIGATION
   ======================================== */

/**
 * Toggle mobile menu open/close
 */
function toggleMenu() {
    menuToggle.classList.toggle('active');
    nav.classList.toggle('active');
    document.body.classList.toggle('menu-open');
}

/**
 * Close mobile menu
 */
function closeMenu() {
    menuToggle.classList.remove('active');
    nav.classList.remove('active');
    document.body.classList.remove('menu-open');
}

// Menu toggle click handler
if (menuToggle) {
    menuToggle.addEventListener('click', toggleMenu);
}

// Close menu when clicking nav links
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        closeMenu();
    });
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (nav && nav.classList.contains('active')) {
        if (!nav.contains(e.target) && !menuToggle.contains(e.target)) {
            closeMenu();
        }
    }
});

// Close menu on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav && nav.classList.contains('active')) {
        closeMenu();
    }
});

/* ========================================
   HEADER SCROLL EFFECTS
   ======================================== */

let lastScrollY = window.scrollY;
let ticking = false;

/**
 * Handle header appearance on scroll
 */
function handleHeaderScroll() {
    const currentScrollY = window.scrollY;
    
    // Add shadow when scrolled
    if (currentScrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
    
    lastScrollY = currentScrollY;
    ticking = false;
}

// Optimized scroll listener using requestAnimationFrame
window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            handleHeaderScroll();
            handleScrollTopButton();
        });
        ticking = true;
    }
});

/* ========================================
   SMOOTH SCROLLING
   ======================================== */

/**
 * Smooth scroll to element with offset for fixed header
 */
function smoothScrollTo(target) {
    const element = document.querySelector(target);
    if (element) {
        const headerHeight = header ? header.offsetHeight : 0;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerHeight;
        
        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
}

// Handle anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href !== '#' && href !== '#0') {
            e.preventDefault();
            smoothScrollTo(href);
        }
    });
});

/* ========================================
   SCROLL TO TOP BUTTON
   ======================================== */

/**
 * Show/hide scroll to top button based on scroll position
 */
function handleScrollTopButton() {
    if (scrollTopBtn) {
        if (window.scrollY > 500) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }
    }
}

// Scroll to top click handler
if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

/* ========================================
   SCROLL ANIMATIONS (Intersection Observer)
   ======================================== */

/**
 * Initialize scroll animations using Intersection Observer
 */
function initScrollAnimations() {
    // Elements to animate
    const animatedElements = document.querySelectorAll('.fade-in-up, .fade-in, .scale-in, .stagger-children');
    
    if (animatedElements.length === 0) return;
    
    // Observer options
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -50px 0px',
        threshold: 0.1
    };
    
    // Create observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);
    
    // Observe each element
    animatedElements.forEach(element => {
        observer.observe(element);
    });
}

/* ========================================
   ACTIVE NAV LINK HIGHLIGHTER
   ======================================== */

/**
 * Set active class on current page nav link
 */
function setActiveNavLink() {
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop() || 'index.html';
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        const linkPage = href.split('/').pop();
        
        link.classList.remove('active');
        
        if (linkPage === currentPage) {
            link.classList.add('active');
        } else if (currentPage === '' && linkPage === 'index.html') {
            link.classList.add('active');
        } else if (currentPath.includes('/services/') && href.includes('services')) {
            link.classList.add('active');
        }
    });
}

/* ========================================
   COUNTER ANIMATION
   ======================================== */

/**
 * Animate counting numbers
 * @param {HTMLElement} element - Element containing the number
 * @param {number} target - Target number to count to
 * @param {number} duration - Animation duration in milliseconds
 */
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    const suffix = element.dataset.suffix || '';
    const prefix = element.dataset.prefix || '';
    
    function updateCounter() {
        start += increment;
        if (start < target) {
            element.textContent = prefix + Math.floor(start) + suffix;
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = prefix + target + suffix;
        }
    }
    
    updateCounter();
}

/**
 * Initialize counter animations
 */
function initCounters() {
    const counters = document.querySelectorAll('[data-counter]');
    
    if (counters.length === 0) return;
    
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.5
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.dataset.counter, 10);
                animateCounter(entry.target, target);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    counters.forEach(counter => {
        observer.observe(counter);
    });
}

/* ========================================
   FORM VALIDATION
   ======================================== */

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} - Whether email is valid
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - Whether phone is valid
 */
function isValidPhone(phone) {
    const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Show form error message
 * @param {HTMLElement} input - Input element with error
 * @param {string} message - Error message to display
 */
function showError(input, message) {
    const formGroup = input.closest('.form-group');
    let errorElement = formGroup.querySelector('.form-error');
    
    if (!errorElement) {
        errorElement = document.createElement('span');
        errorElement.classList.add('form-error');
        formGroup.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    input.classList.add('error');
}

/**
 * Clear form error message
 * @param {HTMLElement} input - Input element to clear error from
 */
function clearError(input) {
    const formGroup = input.closest('.form-group');
    const errorElement = formGroup.querySelector('.form-error');
    
    if (errorElement) {
        errorElement.remove();
    }
    
    input.classList.remove('error');
}

/* ========================================
   UTILITY FUNCTIONS
   ======================================== */

/**
 * Debounce function for performance optimization
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
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

/**
 * Throttle function for performance optimization
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} - Throttled function
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/* ========================================
   LAZY LOADING IMAGES
   ======================================== */

/**
 * Initialize lazy loading for images
 */
function initLazyLoading() {
    const lazyImages = document.querySelectorAll('img[data-src]');
    
    if (lazyImages.length === 0) return;
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        lazyImages.forEach(img => {
            imageObserver.observe(img);
        });
    } else {
        // Fallback for browsers without IntersectionObserver
        lazyImages.forEach(img => {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
        });
    }
}

/* ========================================
   PRELOADER
   ======================================== */

/**
 * Hide preloader after page load
 */
function hidePreloader() {
    const preloader = document.querySelector('.preloader');
    if (preloader) {
        preloader.classList.add('hidden');
        setTimeout(() => {
            preloader.remove();
        }, 500);
    }
}

/* ========================================
   INITIALIZE ON DOM LOAD
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all features
    setActiveNavLink();
    initScrollAnimations();
    initCounters();
    initLazyLoading();
    
    // Initial scroll position check
    handleHeaderScroll();
    handleScrollTopButton();
    
    // Hide preloader
    hidePreloader();
    
    console.log('TalivinPower - Site Initialized');
});

/* ========================================
   EXPORT FOR USE IN OTHER MODULES
   ======================================== */

// Make functions available globally if needed
window.TalivinSite = {
    smoothScrollTo,
    animateCounter,
    isValidEmail,
    isValidPhone,
    showError,
    clearError,
    debounce,
    throttle
};
