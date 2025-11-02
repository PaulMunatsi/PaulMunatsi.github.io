/* =================================================================
   PAWAFAN WEBSITE JAVASCRIPT
   Handles navigation, smooth scrolling, order processing, and interactions
   ================================================================= */

'use strict';

/* =================================================================
   INITIALIZATION
   ================================================================= */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initNavigation();
    initScrollEffects();
    initOrderButtons();
    initAnimations();
    initGallery();
});

/* =================================================================
   NAVIGATION FUNCTIONALITY
   ================================================================= */
function initNavigation() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');
    const navbar = document.getElementById('navbar');
    
    // Mobile menu toggle
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }
    
    // Close mobile menu when clicking on a link
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        const isClickInsideNav = navMenu.contains(event.target) || hamburger.contains(event.target);
        if (!isClickInsideNav && navMenu.classList.contains('active')) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        }
    });
    
    // Smooth scrolling for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const navHeight = navbar.offsetHeight;
                const targetPosition = targetSection.offsetTop - navHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Active navigation link based on scroll position
    window.addEventListener('scroll', function() {
        let current = '';
        const sections = document.querySelectorAll('section[id]');
        const navHeight = navbar.offsetHeight;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - navHeight - 100;
            const sectionHeight = section.offsetHeight;
            
            if (window.pageYOffset >= sectionTop && 
                window.pageYOffset < sectionTop + sectionHeight) {
                current = '#' + section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === current) {
                link.classList.add('active');
            }
        });
        
        // Add scrolled class to navbar
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

/* =================================================================
   SCROLL EFFECTS
   ================================================================= */
function initScrollEffects() {
    const scrollTopBtn = document.getElementById('scrollTop');
    
    // Show/hide scroll to top button
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }
    });
    
    // Scroll to top functionality
    if (scrollTopBtn) {
        scrollTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe all glass cards for animation
    const glassCards = document.querySelectorAll('.glass-card');
    glassCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
}

/* =================================================================
   ORDER BUTTON FUNCTIONALITY
   ================================================================= */
function initOrderButtons() {
    const orderButtons = document.querySelectorAll('.order-btn');
    
    orderButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get product details from data attributes
            const productName = this.getAttribute('data-product');
            const productPrice = this.getAttribute('data-price');
            
            // Create order form
            createOrderForm(productName, productPrice);
        });
    });
}

/* =================================================================
   ORDER FORM CREATION
   ================================================================= */
function createOrderForm(productName, productPrice) {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'order-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(5px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        padding: 20px;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    
    // Create form container
    const formContainer = document.createElement('div');
    formContainer.className = 'order-form-container glass-card';
    formContainer.style.cssText = `
        max-width: 500px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        position: relative;
        transform: scale(0.9);
        transition: transform 0.3s ease;
    `;
    
    // Form HTML
    formContainer.innerHTML = `
        <button class="close-modal" style="
            position: absolute;
            top: 15px;
            right: 15px;
            background: transparent;
            border: none;
            font-size: 2rem;
            cursor: pointer;
            color: #666;
            line-height: 1;
            padding: 5px;
            transition: color 0.2s ease;
        " aria-label="Close">&times;</button>
        
        <h2 style="color: #3a8024; margin-bottom: 20px;">Order: ${escapeHtml(productName)}</h2>
        <p style="color: #666; margin-bottom: 20px;">Price: $${escapeHtml(productPrice)}/month</p>
        
        <form id="orderForm" style="display: flex; flex-direction: column; gap: 15px;">
            <div class="form-group">
                <label for="customerName" style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">Full Name *</label>
                <input type="text" id="customerName" name="customerName" required 
                    style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1rem; transition: border-color 0.2s ease;"
                    placeholder="John Doe">
            </div>
            
            <div class="form-group">
                <label for="customerEmail" style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">Email *</label>
                <input type="email" id="customerEmail" name="customerEmail" required 
                    style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1rem; transition: border-color 0.2s ease;"
                    placeholder="john@example.com">
            </div>
            
            <div class="form-group">
                <label for="customerPhone" style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">Phone Number *</label>
                <input type="tel" id="customerPhone" name="customerPhone" required 
                    style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1rem; transition: border-color 0.2s ease;"
                    placeholder="+263 XXX XXX XXX">
            </div>
            
            <div class="form-group">
                <label for="customerAddress" style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">Delivery Address *</label>
                <textarea id="customerAddress" name="customerAddress" required rows="3"
                    style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1rem; resize: vertical; transition: border-color 0.2s ease;"
                    placeholder="Your full address including city and district"></textarea>
            </div>
            
            <div class="form-group">
                <label for="quantity" style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">Quantity *</label>
                <input type="number" id="quantity" name="quantity" min="1" value="1" required 
                    style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1rem; transition: border-color 0.2s ease;">
            </div>
            
            <div class="form-group">
                <label for="additionalInfo" style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">Additional Information</label>
                <textarea id="additionalInfo" name="additionalInfo" rows="3"
                    style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1rem; resize: vertical; transition: border-color 0.2s ease;"
                    placeholder="Any special requests or questions?"></textarea>
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px;">
                Submit Order
            </button>
        </form>
    `;
    
    modal.appendChild(formContainer);
    document.body.appendChild(modal);
    
    // Trigger animation
    setTimeout(() => {
        modal.style.opacity = '1';
        formContainer.style.transform = 'scale(1)';
    }, 10);
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    
    // Close modal functionality
    const closeBtn = formContainer.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => closeModal(modal));
    closeBtn.addEventListener('mouseenter', function() {
        this.style.color = '#e74c3c';
    });
    closeBtn.addEventListener('mouseleave', function() {
        this.style.color = '#666';
    });
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal(modal);
        }
    });
    
    // Close modal on Escape key
    document.addEventListener('keydown', function escapeHandler(e) {
        if (e.key === 'Escape') {
            closeModal(modal);
            document.removeEventListener('keydown', escapeHandler);
        }
    });
    
    // Add focus styles to inputs
    const inputs = formContainer.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.style.borderColor = '#7ed957';
            this.style.outline = 'none';
        });
        input.addEventListener('blur', function() {
            this.style.borderColor = '#e0e0e0';
        });
    });
    
    // Handle form submission
    const orderForm = document.getElementById('orderForm');
    orderForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = {
            product: productName,
            price: productPrice,
            name: document.getElementById('customerName').value,
            email: document.getElementById('customerEmail').value,
            phone: document.getElementById('customerPhone').value,
            address: document.getElementById('customerAddress').value,
            quantity: document.getElementById('quantity').value,
            additionalInfo: document.getElementById('additionalInfo').value
        };
        
        // Validate form data
        if (!validateFormData(formData)) {
            return;
        }
        
        // Process order
        processOrder(formData);
        closeModal(modal);
    });
}

/* =================================================================
   MODAL CLOSING FUNCTION
   ================================================================= */
function closeModal(modal) {
    const formContainer = modal.querySelector('.order-form-container');
    modal.style.opacity = '0';
    formContainer.style.transform = 'scale(0.9)';
    
    setTimeout(() => {
        document.body.removeChild(modal);
        document.body.style.overflow = '';
    }, 300);
}

/* =================================================================
   FORM VALIDATION
   ================================================================= */
function validateFormData(data) {
    // Validate name
    if (!data.name || data.name.trim().length < 2) {
        showAlert('Please enter a valid name (at least 2 characters).');
        return false;
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email || !emailRegex.test(data.email)) {
        showAlert('Please enter a valid email address.');
        return false;
    }
    
    // Validate phone
    if (!data.phone || data.phone.trim().length < 10) {
        showAlert('Please enter a valid phone number.');
        return false;
    }
    
    // Validate address
    if (!data.address || data.address.trim().length < 10) {
        showAlert('Please enter a complete delivery address.');
        return false;
    }
    
    // Validate quantity
    if (!data.quantity || parseInt(data.quantity) < 1) {
        showAlert('Please enter a valid quantity (at least 1).');
        return false;
    }
    
    return true;
}

/* =================================================================
   ORDER PROCESSING
   ================================================================= */
function processOrder(data) {
    // Calculate total
    const total = (parseFloat(data.price) * parseInt(data.quantity)).toFixed(2);
    
    // Create email body
    const subject = encodeURIComponent(`Order Request: ${data.product}`);
    const body = encodeURIComponent(`
Hello Pawafan Team,

I would like to place an order for the following:

PRODUCT DETAILS:
-----------------
Product: ${data.product}
Price per month: $${data.price}
Quantity: ${data.quantity}
Total monthly payment: $${total}

CUSTOMER INFORMATION:
--------------------
Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone}
Delivery Address: ${data.address}

${data.additionalInfo ? `ADDITIONAL INFORMATION:\n${data.additionalInfo}\n` : ''}

Please contact me to confirm this order and arrange for delivery and installation.

Thank you!

Best regards,
${data.name}
    `.trim());
    
    // Create mailto link
    const mailtoLink = `mailto:panashe@pawafan.co.zw?subject=${subject}&body=${body}`;
    
    // Open default email client
    window.location.href = mailtoLink;
    
    // Show confirmation message
    showAlert('Your order has been prepared! Your email client will open to send the order. If it doesn\'t open automatically, please email us at panashe@pawafan.co.zw', 'success');
}

/* =================================================================
   ALERT SYSTEM
   ================================================================= */
function showAlert(message, type = 'error') {
    // Create alert container
    const alert = document.createElement('div');
    alert.className = 'custom-alert';
    alert.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        max-width: 400px;
        padding: 20px;
        background: ${type === 'success' ? 'rgba(126, 217, 87, 0.95)' : 'rgba(231, 76, 60, 0.95)'};
        color: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        backdrop-filter: blur(10px);
        z-index: 3000;
        opacity: 0;
        transform: translateX(100px);
        transition: all 0.3s ease;
        font-weight: 500;
    `;
    alert.textContent = message;
    
    document.body.appendChild(alert);
    
    // Trigger animation
    setTimeout(() => {
        alert.style.opacity = '1';
        alert.style.transform = 'translateX(0)';
    }, 10);
    
    // Remove after 5 seconds
    setTimeout(() => {
        alert.style.opacity = '0';
        alert.style.transform = 'translateX(100px)';
        setTimeout(() => {
            document.body.removeChild(alert);
        }, 300);
    }, 5000);
}

/* =================================================================
   UTILITY FUNCTIONS
   ================================================================= */
// Escape HTML to prevent XSS attacks
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

/* =================================================================
   ANIMATIONS ON SCROLL
   ================================================================= */
function initAnimations() {
    // Counter animation for stats
    const observeCounters = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observeCounters.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(stat => observeCounters.observe(stat));
}

/* =================================================================
   GALLERY FUNCTIONALITY
   ================================================================= */
function initGallery() {
    // Gallery filtering
    const filterButtons = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    if (filterButtons.length > 0) {
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                const filterValue = this.getAttribute('data-filter');
                
                // Update active button
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // Filter gallery items
                galleryItems.forEach(item => {
                    const categories = item.getAttribute('data-category');
                    
                    if (filterValue === 'all') {
                        item.classList.remove('hidden');
                        setTimeout(() => {
                            item.style.opacity = '1';
                            item.style.transform = 'scale(1)';
                        }, 10);
                    } else if (categories.includes(filterValue)) {
                        item.classList.remove('hidden');
                        setTimeout(() => {
                            item.style.opacity = '1';
                            item.style.transform = 'scale(1)';
                        }, 10);
                    } else {
                        item.style.opacity = '0';
                        item.style.transform = 'scale(0.9)';
                        setTimeout(() => {
                            item.classList.add('hidden');
                        }, 300);
                    }
                });
            });
        });
    }
    
    // Attach click handlers to view buttons
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const productIndex = parseInt(this.getAttribute('data-product-index'));
            openGalleryModal(productIndex);
        });
    });
}

/* =================================================================
   GALLERY MODAL
   ================================================================= */
// Gallery data
const galleryData = [
    {
        title: 'Basic Solar Home System',
        category: 'Solar Home',
        description: 'Our entry-level solar solution provides reliable electricity for lighting and mobile charging. Perfect for rural households starting their solar journey.',
        longDescription: 'The Basic Solar Home System includes a 30W solar panel, battery storage, 3 LED lights, and phone charging capability. This system provides 6-8 hours of lighting per day and can charge multiple mobile phones. Installation is simple and can be completed in under 2 hours.',
        specs: [
            '30W Solar Panel',
            '12V Battery (10Ah)',
            '3 High-efficiency LED Lights',
            'Mobile Phone Charging (USB)',
            'FM Radio included',
            'Pay-as-you-go: $15/month',
            '2-year warranty'
        ]
    },
    {
        title: 'Standard Solar System with TV',
        category: 'Solar Home',
        description: 'Mid-range system with enhanced capacity for households needing more power. Includes TV support, fan, and multiple lights.',
        longDescription: 'Our Standard Solar System is designed for families who need more than just lighting. With 100W of solar capacity, you can power a 32" TV, standing fan, multiple lights, and charge devices simultaneously. The system includes an efficient inverter and expandable battery storage.',
        specs: [
            '2x 50W Solar Panels (100W total)',
            '24V Battery (20Ah)',
            '4-6 LED Lights',
            '32" TV Support (up to 50W)',
            'Standing Fan',
            'Radio & Multiple USB Charging',
            'Pay-as-you-go: $18/month',
            '3-year warranty'
        ]
    },
    {
        title: 'Commercial Solar Installation',
        category: 'Commercial',
        description: 'Large-scale solar solution for businesses, clinics, and schools. Grid-tie capability with battery backup for uninterrupted power.',
        longDescription: 'Our Commercial Solar Installation is designed for businesses that need reliable power throughout the day. The system includes high-capacity solar panels, inverters, and battery banks that can power computers, refrigerators, lights, and other business equipment. Grid-tie functionality allows you to reduce electricity costs while maintaining backup power.',
        specs: [
            'Multiple High-capacity Panels (1kW-10kW)',
            'Grid-tie Inverter System',
            'Large Battery Bank (100Ah-500Ah)',
            'Supports All Business Equipment',
            'Remote Monitoring System',
            'Professional Installation & Maintenance',
            'Custom pricing based on needs',
            '5-year warranty'
        ]
    },
    {
        title: 'Multi-Panel Solar Array',
        category: 'Commercial',
        description: 'High-capacity solar panel configuration for maximum energy generation. Ideal for larger homes, farms, and commercial buildings.',
        longDescription: 'The Multi-Panel Solar Array delivers maximum power generation for energy-intensive applications. Perfect for irrigation pumps, cold storage, manufacturing equipment, or powering an entire compound. Modular design allows for easy expansion as your power needs grow.',
        specs: [
            '6-20 Solar Panels (300W each)',
            'High-capacity Inverter (5kW-15kW)',
            'Industrial Battery Bank',
            'Irrigation Pump Support',
            'Cold Storage Compatible',
            'Manufacturing Equipment Support',
            'Custom configuration available',
            '5-year warranty with maintenance plan'
        ]
    },
    {
        title: 'Energy-Efficient Cookstove',
        category: 'Clean Cooking',
        description: 'Revolutionary biogas-powered cookstove that reduces indoor air pollution by 90% and eliminates the need for firewood.',
        longDescription: 'Our Energy-Efficient Cookstove uses biogas produced from our biodigester system, providing clean, smoke-free cooking. The stove heats quickly, is easy to control, and significantly reduces cooking time. Say goodbye to smoke-filled kitchens and health problems caused by traditional cooking methods.',
        specs: [
            'Biogas Powered (no smoke)',
            '90% Reduction in Indoor Air Pollution',
            '70% Reduction in Greenhouse Gases',
            'Faster Cooking Time',
            'Easy Temperature Control',
            'Safe for Indoor Use',
            'Pay-as-you-go: $12/month',
            '2-year warranty'
        ]
    },
    {
        title: 'Biodigester System',
        category: 'Clean Cooking',
        description: 'Convert organic waste into clean cooking gas and organic fertilizer. Sustainable solution for farmers and households.',
        longDescription: 'The Biodigester System turns animal waste and organic materials into clean biogas for cooking and organic fertilizer for your farm. One system can provide enough gas for daily cooking needs for a family of 5-7 people. The nutrient-rich fertilizer produced increases crop yields naturally.',
        specs: [
            'Processes Organic Waste Daily',
            'Produces Clean Cooking Gas',
            'Generates Organic Fertilizer',
            'Serves Family of 5-7 People',
            'Reduces Waste & Pollution',
            'Increases Farm Productivity',
            'Pay-as-you-go: $20/month',
            '3-year warranty'
        ]
    },
    {
        title: 'Rural Home Installation',
        category: 'Solar Home',
        description: 'Complete solar installation bringing light and power to rural households across Zimbabwe.',
        longDescription: 'We specialize in bringing solar power to rural areas where grid electricity is not available. Our team handles everything from site assessment to installation and training. We work with community groups to make solar power accessible and affordable through flexible payment plans.',
        specs: [
            'Complete Site Assessment',
            'Professional Installation',
            'User Training Included',
            'Community Group Discounts',
            'Flexible Payment Plans',
            'Local Technical Support',
            'Ongoing Maintenance Available',
            'Helping 1,900+ households'
        ]
    },
    {
        title: 'Community Solar Project',
        category: 'Community',
        description: 'Empowering entire communities with sustainable energy access through group installations and cooperative programs.',
        longDescription: 'Our Community Solar Projects bring solar power to entire villages and communities. By working with local groups, we provide bulk pricing, shared resources, and community training programs. These projects often include solar-powered water pumping, street lighting, and power for schools and clinics.',
        specs: [
            'Bulk Community Pricing',
            'Solar-powered Water Pumps',
            'Street Lighting Solutions',
            'School & Clinic Power',
            'Community Training Programs',
            'Group Payment Plans',
            'Local Job Creation',
            '300+ community groups registered'
        ]
    },
    {
        title: 'Portable Solar Pico Lights',
        category: 'Solar Home',
        description: 'Affordable, portable lighting solution perfect for studying, outdoor activities, and emergency lighting.',
        longDescription: 'Solar Pico Lights are compact, portable, and incredibly affordable. They charge during the day and provide bright LED light for 8-12 hours. Perfect for students studying at night, outdoor work, or emergency backup lighting. Built tough to withstand rural conditions.',
        specs: [
            'Compact & Portable Design',
            'Charges in Sunlight',
            '8-12 Hour Runtime',
            'Bright LED Light',
            'Multiple Brightness Settings',
            'USB Charging Option',
            'Pay-as-you-go: $5/month',
            '1-year warranty'
        ]
    }
];

// Open gallery modal
function openGalleryModal(index) {
    const data = galleryData[index];
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'gallery-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close" aria-label="Close modal">&times;</button>
            
            <div class="modal-image" style="background: linear-gradient(135deg, #7ed957, #4a7ba7);">
                <div class="placeholder-icon" style="font-size: 5rem;">${getIconForCategory(data.category)}</div>
            </div>
            
            <div class="modal-details">
                <span class="gallery-tag">${escapeHtml(data.category)}</span>
                <h3>${escapeHtml(data.title)}</h3>
                <p>${escapeHtml(data.longDescription)}</p>
                
                <div class="modal-specs">
                    <h4>Key Features & Specifications:</h4>
                    <ul>
                        ${data.specs.map(spec => `<li>✓ ${escapeHtml(spec)}</li>`).join('')}
                    </ul>
                </div>
                
                <div style="margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
                    <button class="btn btn-primary modal-order-btn">
                        Order Now
                    </button>
                    <a href="#contact" class="btn btn-secondary modal-contact-btn">
                        Contact Us
                    </a>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Get elements after modal is added to DOM
    const closeBtn = modal.querySelector('.modal-close');
    const orderBtn = modal.querySelector('.modal-order-btn');
    const contactBtn = modal.querySelector('.modal-contact-btn');
    
    // Attach event listeners
    closeBtn.addEventListener('click', function() {
        closeGalleryModal(modal);
    });
    
    orderBtn.addEventListener('click', function() {
        closeGalleryModal(modal);
        scrollToShop();
    });
    
    contactBtn.addEventListener('click', function() {
        closeGalleryModal(modal);
    });
    
    // Trigger animation
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
    
    // Close on background click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeGalleryModal(modal);
        }
    });
    
    // Close on Escape key
    const escapeHandler = function(e) {
        if (e.key === 'Escape') {
            closeGalleryModal(modal);
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
}

// Close gallery modal
function closeGalleryModal(modal) {
    modal.classList.remove('active');
    
    setTimeout(() => {
        if (modal.parentNode) {
            document.body.removeChild(modal);
        }
        document.body.style.overflow = '';
    }, 300);
}

// Get icon for category
function getIconForCategory(category) {
    const icons = {
        'Solar Home': '☀️',
        'Commercial': '🏢',
        'Clean Cooking': '🔥',
        'Community': '🤝'
    };
    return icons[category] || '⚡';
}

// Scroll to shop section
function scrollToShop() {
    const shopSection = document.getElementById('shop');
    const navbar = document.getElementById('navbar');
    const navHeight = navbar.offsetHeight;
    const targetPosition = shopSection.offsetTop - navHeight;
    
    window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
    });
}

/* =================================================================
   COUNTER ANIMATION
   ================================================================= */
function animateCounter(element) {
    const target = element.textContent;
    const isNumber = /^[\d,]+$/.test(target.replace(/[+$]/g, ''));
    
    if (!isNumber) return;
    
    const numericValue = parseInt(target.replace(/[+,$]/g, ''));
    const duration = 2000; // 2 seconds
    const increment = numericValue / (duration / 16); // 60fps
    let current = 0;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= numericValue) {
            current = numericValue;
            clearInterval(timer);
        }
        
        // Format the number
        let displayValue = Math.floor(current).toLocaleString();
        
        // Add back special characters
        if (target.includes('+')) displayValue += '+';
        if (target.includes('$')) displayValue = '$' + displayValue;
        if (target.includes('K')) displayValue += 'K';
        if (target.includes('%')) displayValue += '%';
        
        element.textContent = displayValue;
    }, 16);
}

/* =================================================================
   PERFORMANCE OPTIMIZATION
   ================================================================= */
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

// Lazy loading for images (if needed in future)
function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

/* =================================================================
   ERROR HANDLING
   ================================================================= */
// Global error handler
window.addEventListener('error', function(event) {
    console.error('An error occurred:', event.error);
    // In production, you might want to send this to a logging service
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    // In production, you might want to send this to a logging service
});

/* =================================================================
   CONSOLE MESSAGE
   ================================================================= */
console.log('%cPawafan Website', 'color: #7ed957; font-size: 24px; font-weight: bold;');
console.log('%cThe Future Is Here', 'color: #4a7ba7; font-size: 16px;');
console.log('Website loaded successfully! 🌱⚡');
