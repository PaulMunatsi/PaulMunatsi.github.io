/* ========================================
   TALIVIN POWER SOLUTIONS - NAVIGATION JAVASCRIPT
   ========================================
   
   Additional navigation functionality:
   - Dropdown menus
   - Mega menus
   - Scroll spy for single-page sections
   
   ======================================== */

'use strict';

/* ========================================
   DROPDOWN NAVIGATION
   ======================================== */

class DropdownNav {
    constructor() {
        this.dropdowns = document.querySelectorAll('.nav-dropdown');
        this.init();
    }
    
    init() {
        if (this.dropdowns.length === 0) return;
        
        this.dropdowns.forEach(dropdown => {
            const trigger = dropdown.querySelector('.nav-dropdown-trigger');
            const menu = dropdown.querySelector('.nav-dropdown-menu');
            
            if (!trigger || !menu) return;
            
            // Desktop: hover behavior
            dropdown.addEventListener('mouseenter', () => {
                if (window.innerWidth >= 1024) {
                    this.openDropdown(dropdown);
                }
            });
            
            dropdown.addEventListener('mouseleave', () => {
                if (window.innerWidth >= 1024) {
                    this.closeDropdown(dropdown);
                }
            });
            
            // Mobile: click behavior
            trigger.addEventListener('click', (e) => {
                if (window.innerWidth < 1024) {
                    e.preventDefault();
                    this.toggleDropdown(dropdown);
                }
            });
        });
        
        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.nav-dropdown')) {
                this.closeAllDropdowns();
            }
        });
    }
    
    openDropdown(dropdown) {
        dropdown.classList.add('active');
        const menu = dropdown.querySelector('.nav-dropdown-menu');
        if (menu) {
            menu.style.display = 'block';
            // Animate in
            requestAnimationFrame(() => {
                menu.style.opacity = '1';
                menu.style.transform = 'translateY(0)';
            });
        }
    }
    
    closeDropdown(dropdown) {
        dropdown.classList.remove('active');
        const menu = dropdown.querySelector('.nav-dropdown-menu');
        if (menu) {
            menu.style.opacity = '0';
            menu.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                menu.style.display = 'none';
            }, 300);
        }
    }
    
    toggleDropdown(dropdown) {
        if (dropdown.classList.contains('active')) {
            this.closeDropdown(dropdown);
        } else {
            this.closeAllDropdowns();
            this.openDropdown(dropdown);
        }
    }
    
    closeAllDropdowns() {
        this.dropdowns.forEach(dropdown => {
            this.closeDropdown(dropdown);
        });
    }
}

/* ========================================
   SCROLL SPY
   ======================================== */

class ScrollSpy {
    constructor(options = {}) {
        this.navLinks = document.querySelectorAll(options.navSelector || '.nav-link[href^="#"]');
        this.sections = [];
        this.offset = options.offset || 100;
        
        this.init();
    }
    
    init() {
        if (this.navLinks.length === 0) return;
        
        // Get all sections that nav links point to
        this.navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#') && href.length > 1) {
                const section = document.querySelector(href);
                if (section) {
                    this.sections.push({
                        id: href,
                        element: section,
                        link: link
                    });
                }
            }
        });
        
        if (this.sections.length === 0) return;
        
        // Listen for scroll
        window.addEventListener('scroll', this.throttle(() => {
            this.update();
        }, 100));
        
        // Initial update
        this.update();
    }
    
    update() {
        const scrollPosition = window.scrollY + this.offset;
        
        let currentSection = null;
        
        // Find current section
        this.sections.forEach(section => {
            const sectionTop = section.element.offsetTop;
            const sectionBottom = sectionTop + section.element.offsetHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                currentSection = section;
            }
        });
        
        // Update active states
        this.sections.forEach(section => {
            if (section === currentSection) {
                section.link.classList.add('active');
            } else {
                section.link.classList.remove('active');
            }
        });
    }
    
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

/* ========================================
   STICKY SIDEBAR NAVIGATION
   ======================================== */

class StickySidebar {
    constructor(sidebarSelector, containerSelector) {
        this.sidebar = document.querySelector(sidebarSelector);
        this.container = document.querySelector(containerSelector);
        
        if (this.sidebar && this.container) {
            this.init();
        }
    }
    
    init() {
        // Get header height for offset
        const header = document.querySelector('.header');
        this.offset = header ? header.offsetHeight + 20 : 20;
        
        window.addEventListener('scroll', () => {
            this.update();
        });
        
        window.addEventListener('resize', () => {
            this.update();
        });
        
        this.update();
    }
    
    update() {
        // Only apply sticky behavior on larger screens
        if (window.innerWidth < 1024) {
            this.sidebar.style.position = '';
            this.sidebar.style.top = '';
            return;
        }
        
        const containerRect = this.container.getBoundingClientRect();
        const sidebarHeight = this.sidebar.offsetHeight;
        
        // Check if container is in view
        if (containerRect.top <= this.offset && containerRect.bottom > sidebarHeight + this.offset) {
            this.sidebar.style.position = 'fixed';
            this.sidebar.style.top = `${this.offset}px`;
            this.sidebar.style.width = `${this.sidebar.parentElement.offsetWidth}px`;
        } else if (containerRect.bottom <= sidebarHeight + this.offset) {
            // Stick to bottom of container
            this.sidebar.style.position = 'absolute';
            this.sidebar.style.top = 'auto';
            this.sidebar.style.bottom = '0';
        } else {
            // Reset
            this.sidebar.style.position = '';
            this.sidebar.style.top = '';
            this.sidebar.style.width = '';
        }
    }
}

/* ========================================
   INITIALIZE ON DOM LOAD
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize dropdown navigation
    new DropdownNav();
    
    // Initialize scroll spy if on a page with section anchors
    if (document.querySelector('.nav-link[href^="#"]')) {
        new ScrollSpy();
    }
    
    // Initialize sticky sidebar if present
    if (document.querySelector('.service-sidebar')) {
        new StickySidebar('.service-sidebar', '.service-content-grid');
    }
});

/* ========================================
   EXPORT FOR EXTERNAL USE
   ======================================== */

window.TalivinNav = {
    DropdownNav,
    ScrollSpy,
    StickySidebar
};
