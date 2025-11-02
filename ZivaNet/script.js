// ===========================
// Zim Safe-Zone Foundation Trust
// Interactive JavaScript
// ===========================

(function() {
    'use strict';

    // ===========================
    // Navigation
    // ===========================
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Sticky navigation on scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile menu toggle
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close mobile menu when clicking a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        }
    });

    // Active link based on scroll position
    const sections = document.querySelectorAll('section[id]');
    
    function highlightNav() {
        const scrollY = window.pageYOffset;

        sections.forEach(section => {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.offsetTop - 100;
            const sectionId = section.getAttribute('id');
            const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);

            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                navLinks.forEach(link => link.classList.remove('active'));
                if (navLink) navLink.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', highlightNav);

    // ===========================
    // Counter Animation
    // ===========================
    const counters = document.querySelectorAll('[data-count]');
    const animateCounter = (counter) => {
        const target = parseInt(counter.getAttribute('data-count'));
        const duration = 2000; // 2 seconds
        const increment = target / (duration / 16); // 60fps
        let current = 0;

        const updateCounter = () => {
            current += increment;
            if (current < target) {
                counter.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target + '+';
            }
        };

        updateCounter();
    };

    // Intersection Observer for counters
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                animateCounter(entry.target);
                entry.target.classList.add('counted');
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => counterObserver.observe(counter));

    // ===========================
    // Scroll Animations (AOS)
    // ===========================
    const animateOnScroll = () => {
        const elements = document.querySelectorAll('[data-aos]');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('aos-animate');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        });

        elements.forEach(el => observer.observe(el));
    };

    animateOnScroll();

    // ===========================
    // Scroll to Top Button
    // ===========================
    const scrollTopBtn = document.getElementById('scrollTop');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            scrollTopBtn.classList.add('show');
        } else {
            scrollTopBtn.classList.remove('show');
        }
    });

    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // ===========================
    // Smooth Scroll for Anchor Links
    // ===========================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offsetTop = target.offsetTop - 80; // Account for fixed navbar
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ===========================
    // Contact Form Handling (mailto)
    // ===========================
    const contactForm = document.getElementById('contactForm');
    const formSuccess = document.getElementById('formSuccess');

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Get form data
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const subject = document.getElementById('subject').value;
        const message = document.getElementById('message').value.trim();

        // Validate form
        if (!name || !email || !subject || !message) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }

        try {
            // Create mailto link with pre-populated data
            const recipientEmail = 'info@zimsafezone.org'; // Change to your actual email
            
            // Construct email body
            const emailBody = `
Name: ${name}
Email: ${email}
${phone ? `Phone: ${phone}` : ''}
Subject: ${subject}

Message:
${message}

---
Sent from Zim Safe-Zone Foundation Trust website
Date: ${new Date().toLocaleString('en-ZW', { timeZone: 'Africa/Harare' })}
            `.trim();

            // Encode for URL
            const mailtoLink = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject + ' - ' + name)}&body=${encodeURIComponent(emailBody)}`;

            // Store submission for analytics (optional)
            try {
                const submissions = JSON.parse(localStorage.getItem('contactSubmissions') || '[]');
                submissions.push({
                    name,
                    email,
                    subject,
                    timestamp: new Date().toISOString()
                });
                localStorage.setItem('contactSubmissions', JSON.stringify(submissions));
            } catch (storageError) {
                console.log('Could not save to localStorage:', storageError);
            }

            // Open mailto link
            window.location.href = mailtoLink;

            // Show success message
            contactForm.style.display = 'none';
            formSuccess.classList.add('show');

            // Track event
            trackEvent('Form', 'Submit', 'Contact Form - mailto');

            // Reset form after 5 seconds
            setTimeout(() => {
                contactForm.reset();
            }, 5000);

        } catch (error) {
            console.error('Form submission error:', error);
            showNotification('Could not open email client. Please email us directly at info@zimsafezone.org', 'error');
        }
    });

    // ===========================
    // Notification System
    // ===========================
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 2rem;
            padding: 1rem 1.5rem;
            background: ${type === 'error' ? 'rgba(245, 87, 108, 0.9)' : 'rgba(67, 233, 123, 0.9)'};
            color: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
            font-weight: 600;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Add notification animations to document
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // ===========================
    // Parallax Effect on Hero
    // ===========================
    const heroSection = document.querySelector('.hero');
    
    window.addEventListener('scroll', () => {
        if (heroSection && window.innerWidth > 768) {
            const scrolled = window.pageYOffset;
            const rate = scrolled * 0.5;
            heroSection.style.transform = `translate3d(0, ${rate}px, 0)`;
        }
    });

    // ===========================
    // Dynamic Background Shapes
    // ===========================
    const shapes = document.querySelectorAll('.shape');
    let mouseX = 0;
    let mouseY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX / window.innerWidth;
        mouseY = e.clientY / window.innerHeight;
    });

    function animateShapes() {
        shapes.forEach((shape, index) => {
            const speed = (index + 1) * 0.5;
            const x = mouseX * speed * 20;
            const y = mouseY * speed * 20;
            
            shape.style.transform = `translate(${x}px, ${y}px)`;
        });

        requestAnimationFrame(animateShapes);
    }

    if (window.innerWidth > 768) {
        animateShapes();
    }

    // ===========================
    // Card Hover Effects
    // ===========================
    const cards = document.querySelectorAll('.glass-card, .program-card, .team-card, .objective-card');

    cards.forEach(card => {
        card.addEventListener('mouseenter', function(e) {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });

        card.addEventListener('mouseleave', function(e) {
            this.style.transform = 'translateY(0) scale(1)';
        });

        // 3D card tilt effect
        card.addEventListener('mousemove', function(e) {
            if (window.innerWidth > 768) {
                const rect = this.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = (y - centerY) / 20;
                const rotateY = (centerX - x) / 20;
                
                this.style.transform = `
                    translateY(-10px)
                    perspective(1000px)
                    rotateX(${rotateX}deg)
                    rotateY(${rotateY}deg)
                    scale3d(1.02, 1.02, 1.02)
                `;
            }
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // ===========================
    // Dynamic Stats Animation
    // ===========================
    function animateStats() {
        const stats = document.querySelectorAll('.stat-number, .impact-number');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
                    const target = parseInt(entry.target.getAttribute('data-count'));
                    const duration = 2000;
                    const increment = target / (duration / 16);
                    let current = 0;

                    const update = () => {
                        current += increment;
                        if (current < target) {
                            entry.target.textContent = Math.floor(current);
                            requestAnimationFrame(update);
                        } else {
                            entry.target.textContent = target + (entry.target.classList.contains('stat-number') ? '+' : '');
                            entry.target.classList.add('animated');
                        }
                    };

                    update();
                }
            });
        }, { threshold: 0.5 });

        stats.forEach(stat => {
            if (stat.getAttribute('data-count')) {
                observer.observe(stat);
            }
        });
    }

    animateStats();

    // ===========================
    // Loading Animation
    // ===========================
    window.addEventListener('load', () => {
        document.body.style.opacity = '0';
        setTimeout(() => {
            document.body.style.transition = 'opacity 0.5s ease-in';
            document.body.style.opacity = '1';
        }, 100);
    });

    // ===========================
    // Keyboard Navigation
    // ===========================
    document.addEventListener('keydown', (e) => {
        // ESC key closes mobile menu
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        }

        // Arrow keys for section navigation
        if (e.key === 'ArrowDown' && e.ctrlKey) {
            e.preventDefault();
            const currentSection = getCurrentSection();
            const nextSection = getNextSection(currentSection);
            if (nextSection) {
                nextSection.scrollIntoView({ behavior: 'smooth' });
            }
        }

        if (e.key === 'ArrowUp' && e.ctrlKey) {
            e.preventDefault();
            const currentSection = getCurrentSection();
            const prevSection = getPrevSection(currentSection);
            if (prevSection) {
                prevSection.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });

    function getCurrentSection() {
        let current = null;
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= 100 && rect.bottom >= 100) {
                current = section;
            }
        });
        return current;
    }

    function getNextSection(current) {
        if (!current) return sections[0];
        const index = Array.from(sections).indexOf(current);
        return sections[index + 1] || null;
    }

    function getPrevSection(current) {
        if (!current) return sections[sections.length - 1];
        const index = Array.from(sections).indexOf(current);
        return sections[index - 1] || null;
    }

    // ===========================
    // Performance Optimization
    // ===========================
    
    // Debounce function for scroll events
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

    // Throttle function for frequent events
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

    // Apply throttle to scroll events
    window.addEventListener('scroll', throttle(() => {
        highlightNav();
    }, 100));

    // ===========================
    // Lazy Loading Images
    // ===========================
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.classList.add('loaded');
                        imageObserver.unobserve(img);
                    }
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }

    // ===========================
    // Accessibility Enhancements
    // ===========================
    
    // Focus trap for mobile menu
    const focusableElements = navMenu.querySelectorAll(
        'a[href], button, textarea, input, select'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    navMenu.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            if (e.shiftKey && document.activeElement === firstFocusable) {
                e.preventDefault();
                lastFocusable.focus();
            } else if (!e.shiftKey && document.activeElement === lastFocusable) {
                e.preventDefault();
                firstFocusable.focus();
            }
        }
    });

    // Announce page changes to screen readers
    const announcer = document.createElement('div');
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.cssText = 'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';
    document.body.appendChild(announcer);

    function announce(message) {
        announcer.textContent = message;
        setTimeout(() => {
            announcer.textContent = '';
        }, 1000);
    }

    // Announce section changes
    window.addEventListener('scroll', debounce(() => {
        const current = getCurrentSection();
        if (current) {
            announce(`Viewing ${current.id} section`);
        }
    }, 1000));

    // ===========================
    // Print Styles Handler
    // ===========================
    window.addEventListener('beforeprint', () => {
        document.body.classList.add('printing');
    });

    window.addEventListener('afterprint', () => {
        document.body.classList.remove('printing');
    });

    // ===========================
    // Console Easter Egg
    // ===========================
    console.log('%c🛡️ Zim Safe-Zone Foundation Trust', 'color: #667eea; font-size: 24px; font-weight: bold;');
    console.log('%cProtecting Zimbabwe\'s Youth in the Digital Age', 'color: #764ba2; font-size: 14px;');
    console.log('%c\nInterested in contributing to our mission?', 'color: #4facfe; font-size: 12px;');
    console.log('%cVisit our website or contact us at info@zimsafezone.org', 'color: #00f2fe; font-size: 12px;');
    console.log('%c\n💻 Built with ❤️ for youth empowerment', 'color: #43e97b; font-size: 12px;');

    // ===========================
    // Service Worker Registration
    // (For future PWA capabilities)
    // ===========================
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            // Uncomment when service worker is ready
            // navigator.serviceWorker.register('/sw.js')
            //     .then(reg => console.log('Service Worker registered'))
            //     .catch(err => console.log('Service Worker registration failed'));
        });
    }

    // ===========================
    // Analytics Helper
    // (Placeholder for future analytics integration)
    // ===========================
    function trackEvent(category, action, label) {
        console.log('Event tracked:', { category, action, label });
        // Integrate with Google Analytics, Plausible, or other service
        // Example: gtag('event', action, { event_category: category, event_label: label });
    }

    // Track button clicks
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const text = e.target.textContent.trim();
            trackEvent('Button', 'Click', text);
        });
    });

    // Track form submissions
    contactForm.addEventListener('submit', () => {
        trackEvent('Form', 'Submit', 'Contact Form');
    });

    // Track social link clicks
    document.querySelectorAll('.social-link, .social-icon').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = e.currentTarget.getAttribute('href');
            trackEvent('Social', 'Click', href);
        });
    });

    // ===========================
    // Initialization Complete
    // ===========================
    console.log('✅ Website initialized successfully');

})();
