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
    initTeamModals();
    initBlogModals();
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
        background: rgba(255, 255, 255, 0.3);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
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
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 255, 245, 0.98) 100%);
        backdrop-filter: blur(30px);
        -webkit-backdrop-filter: blur(30px);
        border: 1px solid rgba(255, 255, 255, 0.5);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(126, 217, 87, 0.1);
        border-radius: 16px;
        padding: 32px;
        transform: scale(0.9);
        transition: transform 0.3s ease;
    `;
    
    // Form HTML
    formContainer.innerHTML = `
        <button class="close-modal" style="
            position: absolute;
            top: 15px;
            right: 15px;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 2px solid rgba(126, 217, 87, 0.3);
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 2rem;
            color: #666;
            line-height: 1;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        " aria-label="Close">&times;</button>
        
        <h2 style="color: #3a8024; margin-bottom: 20px;">Order: ${escapeHtml(productName)}</h2>
        <p style="color: #666; margin-bottom: 20px;">Price: $${escapeHtml(productPrice)}/month</p>
        
        <form id="orderForm" style="display: flex; flex-direction: column; gap: 15px;">
            <div class="form-group">
                <label for="customerName" style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">Full Name *</label>
                <input type="text" id="customerName" name="customerName" required 
                    style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1rem; transition: border-color 0.2s ease; background: rgba(255, 255, 255, 0.8);"
                    placeholder="John Doe">
            </div>
            
            <div class="form-group">
                <label for="customerEmail" style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">Email *</label>
                <input type="email" id="customerEmail" name="customerEmail" required 
                    style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1rem; transition: border-color 0.2s ease; background: rgba(255, 255, 255, 0.8);"
                    placeholder="john@example.com">
            </div>
            
            <div class="form-group">
                <label for="customerPhone" style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">Phone Number *</label>
                <input type="tel" id="customerPhone" name="customerPhone" required 
                    style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1rem; transition: border-color 0.2s ease; background: rgba(255, 255, 255, 0.8);"
                    placeholder="+263 XXX XXX XXX">
            </div>
            
            <div class="form-group">
                <label for="customerAddress" style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">Delivery Address *</label>
                <textarea id="customerAddress" name="customerAddress" required rows="3"
                    style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1rem; resize: vertical; transition: border-color 0.2s ease; background: rgba(255, 255, 255, 0.8);"
                    placeholder="Your full address including city and district"></textarea>
            </div>
            
            <div class="form-group">
                <label for="quantity" style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">Quantity *</label>
                <input type="number" id="quantity" name="quantity" min="1" value="1" required 
                    style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1rem; transition: border-color 0.2s ease; background: rgba(255, 255, 255, 0.8);">
            </div>
            
            <div class="form-group">
                <label for="additionalInfo" style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">Additional Information</label>
                <textarea id="additionalInfo" name="additionalInfo" rows="3"
                    style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1rem; resize: vertical; transition: border-color 0.2s ease; background: rgba(255, 255, 255, 0.8);"
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
        this.style.background = 'linear-gradient(135deg, #7ed957, #5cb33a)';
        this.style.color = '#fff';
        this.style.transform = 'rotate(90deg)';
        this.style.borderColor = '#5cb33a';
        this.style.boxShadow = '0 6px 20px rgba(126, 217, 87, 0.4)';
    });
    closeBtn.addEventListener('mouseleave', function() {
        this.style.background = 'rgba(255, 255, 255, 0.9)';
        this.style.color = '#666';
        this.style.transform = 'rotate(0deg)';
        this.style.borderColor = 'rgba(126, 217, 87, 0.3)';
        this.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
    });
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal(modal);
        }
    });
    
    // Close modal on Escape key
    const escapeHandler = function(e) {
        if (e.key === 'Escape') {
            closeModal(modal);
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
    
    // Add focus styles to inputs
    const inputs = formContainer.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.style.borderColor = '#7ed957';
            this.style.outline = 'none';
            this.style.boxShadow = '0 0 0 3px rgba(126, 217, 87, 0.1)';
        });
        input.addEventListener('blur', function() {
            this.style.borderColor = '#e0e0e0';
            this.style.boxShadow = 'none';
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
   TEAM MODALS
   ================================================================= */
// Team member data
const teamData = [
    {
        name: 'Perseverance Ziwende',
        role: 'Managing Director',
        initials: 'PZ',
        bio: 'Perseverance Ziwende is the visionary Managing Director of Pawafan, leading the company\'s mission to provide sustainable energy solutions across Zimbabwe. With extensive experience in social entrepreneurship and renewable energy, Perseverance has been instrumental in establishing Pawafan as a trusted provider of smart energy innovations.',
        achievements: [
            'Founded Pawafan in 2023',
            'Led installation of 1,900+ solar systems',
            'Established partnerships with key stakeholders',
            'Developed innovative pay-as-you-go model'
        ]
    },
    {
        name: 'Nancy Gandawa',
        role: 'Finance Director',
        initials: 'NG',
        bio: 'Nancy Gandawa serves as Finance Director, bringing expertise in financial management and strategic planning. Her financial acumen has been crucial in developing sustainable business models and ensuring the company\'s financial health while maintaining affordable solutions for customers.',
        achievements: [
            'Implemented robust financial systems',
            'Developed pay-as-you-go payment infrastructure',
            'Managed $160K+ revenue operations',
            'Established financial sustainability practices'
        ]
    },
    {
        name: 'Prosper Chanana',
        role: 'Head Technician',
        initials: 'PC',
        bio: 'Prosper Chanana is the Head Technician at Pawafan, overseeing all technical installations and maintenance operations. With deep technical expertise in solar systems and clean cooking solutions, Prosper ensures quality installations and excellent after-sales service.',
        achievements: [
            'Supervised 1,900+ system installations',
            'Developed installation best practices',
            'Led technical training programs',
            'Maintained 90%+ customer retention through quality service'
        ]
    },
    {
        name: 'Paul Munatsi',
        role: 'Chief Technology Officer',
        initials: 'PM',
        bio: 'Paul Munatsi serves as Chief Technology Officer, driving technological innovation at Pawafan. He oversees the development of digital payment platforms, IoT integration, and smart energy management systems that make Pawafan\'s solutions accessible and efficient.',
        achievements: [
            'Developed digital payment platform',
            'Implemented IoT monitoring systems',
            'Created mobile-friendly customer interface',
            'Led technology infrastructure development'
        ]
    }
];

function initTeamModals() {
    const teamCards = document.querySelectorAll('.team-card');
    
    teamCards.forEach(card => {
        const moreBtn = card.querySelector('.team-more-btn');
        const memberIndex = parseInt(card.getAttribute('data-member'));
        
        moreBtn.addEventListener('click', function() {
            openTeamModal(memberIndex);
        });
    });
}

function openTeamModal(index) {
    const member = teamData[index];
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'team-modal';
    modal.innerHTML = `
        <div class="team-modal-content">
            <button class="team-modal-close" aria-label="Close modal">&times;</button>
            
            <div class="team-modal-avatar">
                <div class="avatar-placeholder">${escapeHtml(member.initials)}</div>
            </div>
            
            <div class="team-modal-info">
                <h3>${escapeHtml(member.name)}</h3>
                <p class="team-role">${escapeHtml(member.role)}</p>
            </div>
            
            <div class="team-modal-bio">
                <h4>About</h4>
                <p>${escapeHtml(member.bio)}</p>
                
                <h4>Key Achievements</h4>
                <ul>
                    ${member.achievements.map(achievement => `<li>✓ ${escapeHtml(achievement)}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Get close button
    const closeBtn = modal.querySelector('.team-modal-close');
    
    // Close button event
    closeBtn.addEventListener('click', function() {
        closeTeamModal(modal);
    });
    
    // Trigger animation
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
    
    // Close on background click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeTeamModal(modal);
        }
    });
    
    // Close on Escape key
    const escapeHandler = function(e) {
        if (e.key === 'Escape') {
            closeTeamModal(modal);
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
}

function closeTeamModal(modal) {
    modal.classList.remove('active');
    
    setTimeout(() => {
        if (modal.parentNode) {
            document.body.removeChild(modal);
        }
        document.body.style.overflow = '';
    }, 300);
}

/* =================================================================
   BLOG MODALS
   ================================================================= */
// Blog post data
const blogData = [
    {
        title: 'Solar Installation in Mutoko Rural Community',
        category: 'Installation',
        date: 'November 2024',
        excerpt: 'Successfully installed 50+ solar home systems in Mutoko district, bringing reliable electricity to rural families for the first time.',
        image: {
            gradient: 'linear-gradient(135deg, #7ed957, #4a7ba7)',
            icon: '🏠'
        },
        content: `
            <p>We are thrilled to share the success of our recent solar installation project in the Mutoko rural community. Over the course of two weeks, our dedicated team installed more than 50 solar home systems, bringing reliable electricity to families who have never had access to grid power.</p>
            
            <h3>Project Overview</h3>
            <p>Mutoko district, located in Mashonaland East Province, has long struggled with energy access. Most households relied on candles, kerosene lamps, and battery-powered torches for lighting. This project aimed to change that reality by providing sustainable, affordable solar power solutions.</p>
            
            <h3>Installation Details</h3>
            <p>Each household received a complete solar home system including:</p>
            <ul>
                <li>30W to 50W solar panels depending on household needs</li>
                <li>3-4 LED lights for indoor and outdoor use</li>
                <li>Mobile phone charging capabilities</li>
                <li>FM radio for news and entertainment</li>
                <li>Battery backup for reliable power storage</li>
            </ul>
            
            <h3>Community Impact</h3>
            <p>The impact has been transformative. Children can now study after dark, small businesses can operate longer hours, and families report significant savings on fuel costs. One resident, Mai Chipo, shared: "For the first time, my grandchildren can do their homework at night. This changes everything for our family."</p>
            
            <h3>Technical Training</h3>
            <p>Beyond installation, we conducted comprehensive training sessions for all beneficiaries on system maintenance, troubleshooting, and safe usage practices. We also identified and trained local technicians who can provide ongoing support to the community.</p>
            
            <p>This project demonstrates our commitment to sustainable development and energy access for all Zimbabweans. We look forward to expanding this work to more rural communities.</p>
        `,
        stats: [
            { number: '50+', label: 'Systems Installed' },
            { number: '250+', label: 'People Impacted' },
            { number: '100%', label: 'Satisfaction Rate' }
        ]
    },
    {
        title: 'Powering Schools in Marondera',
        category: 'Community Project',
        date: 'October 2024',
        excerpt: 'Completed commercial solar installation at three primary schools in Marondera, enabling computer classes and evening study sessions.',
        image: {
            gradient: 'linear-gradient(135deg, #ffd93d, #7ed957)',
            icon: '🏫'
        },
        content: `
            <p>Education is the foundation of progress, and reliable electricity is essential for modern learning. This month, we completed a significant project installing commercial-grade solar systems at three primary schools in the Marondera district.</p>
            
            <h3>The Challenge</h3>
            <p>These schools faced frequent power outages that disrupted computer classes and made evening study sessions impossible. Students couldn't access digital learning resources, and teachers struggled to prepare lessons using modern technology.</p>
            
            <h3>Our Solution</h3>
            <p>We designed and installed comprehensive solar power systems for each school, including:</p>
            <ul>
                <li>Commercial-grade solar panel arrays (5-10kW capacity)</li>
                <li>Battery banks for 24/7 power availability</li>
                <li>Backup power for critical facilities</li>
                <li>Dedicated circuits for computer labs</li>
                <li>LED lighting throughout classrooms</li>
                <li>Power for administrative offices</li>
            </ul>
            
            <h3>Educational Impact</h3>
            <p>The results have been remarkable. Computer labs now run uninterrupted classes throughout the day. Evening study sessions serve over 200 students preparing for national exams. Teachers can prepare multimedia lessons and access online educational resources.</p>
            
            <h3>Community Engagement</h3>
            <p>We involved students in the installation process through educational demonstrations, teaching them about renewable energy and sustainable technology. Many students expressed newfound interest in STEM fields, inspired by seeing solar technology in action.</p>
            
            <h3>Looking Forward</h3>
            <p>This project serves as a model for educational institutions across Zimbabwe. We're in discussions with several other schools interested in similar installations.</p>
        `,
        stats: [
            { number: '3', label: 'Schools Powered' },
            { number: '1,500+', label: 'Students Benefiting' },
            { number: '25kW', label: 'Total Capacity' }
        ]
    },
    {
        title: 'Biodigester Systems for Smallholder Farmers',
        category: 'Clean Cooking',
        date: 'September 2024',
        excerpt: 'Installed 20 biodigester systems for farmers in Goromonzi, converting waste into clean cooking gas and organic fertilizer.',
        image: {
            gradient: 'linear-gradient(135deg, #4a7ba7, #7ed957)',
            icon: '♻️'
        },
        content: `
            <p>Sustainable farming requires sustainable energy. This quarter, we completed an innovative project installing biodigester systems for 20 smallholder farmers in the Goromonzi district, demonstrating the powerful synergy between agriculture and clean energy.</p>
            
            <h3>What is a Biodigester?</h3>
            <p>A biodigester is a system that breaks down organic waste (animal manure, crop residues) in an oxygen-free environment, producing two valuable outputs: biogas for cooking and liquid organic fertilizer for crops.</p>
            
            <h3>Project Implementation</h3>
            <p>We worked closely with each farmer to:</p>
            <ul>
                <li>Assess their waste production and cooking needs</li>
                <li>Design appropriately sized biodigester systems</li>
                <li>Install and commission the equipment</li>
                <li>Provide comprehensive training on operation and maintenance</li>
                <li>Set up regular monitoring and support schedules</li>
            </ul>
            
            <h3>Farmer Benefits</h3>
            <p>The impact on participating farms has been substantial:</p>
            <ul>
                <li><strong>Cooking Gas:</strong> Each system produces enough biogas for 3-4 hours of daily cooking, eliminating the need for firewood or charcoal</li>
                <li><strong>Organic Fertilizer:</strong> The liquid effluent is rich in nutrients, improving crop yields by 20-30%</li>
                <li><strong>Cost Savings:</strong> Farmers save $30-50 per month on fuel and fertilizer costs</li>
                <li><strong>Environmental Impact:</strong> Reduced deforestation and greenhouse gas emissions</li>
                <li><strong>Health Benefits:</strong> Elimination of indoor air pollution from traditional cooking methods</li>
            </ul>
            
            <h3>Success Story</h3>
            <p>VaMoyo, one of the project participants, shared: "This biodigester has changed my farm completely. I used to spend hours collecting firewood and money buying fertilizer. Now my waste produces both my cooking gas and my fertilizer. My crops are healthier, and I have more time for farming."</p>
            
            <h3>Scaling Up</h3>
            <p>Based on this project's success, we're planning to expand the biodigester program to 100 more farmers in 2025. We're also developing a farmer-to-farmer training program where successful early adopters can share their experiences with new participants.</p>
        `,
        stats: [
            { number: '20', label: 'Biodigesters Installed' },
            { number: '100+', label: 'People Benefiting' },
            { number: '30%', label: 'Yield Increase' }
        ]
    },
    {
        title: 'Solar Power for Rural Health Clinics',
        category: 'Healthcare',
        date: 'August 2024',
        excerpt: 'Providing reliable power to 5 rural health clinics in Mashonaland East, ensuring refrigeration for vaccines and 24/7 lighting.',
        image: {
            gradient: 'linear-gradient(135deg, #7ed957, #b8f59a)',
            icon: '🏥'
        },
        content: `
            <p>Healthcare can't wait for electricity. That's why we partnered with the Mashonaland East Provincial Health Authority to install solar power systems at five critical rural health clinics serving over 50,000 people.</p>
            
            <h3>The Healthcare Challenge</h3>
            <p>Rural health clinics face unique challenges:</p>
            <ul>
                <li>Unreliable grid power threatens vaccine cold chain integrity</li>
                <li>Emergency procedures are difficult or impossible during power outages</li>
                <li>Nighttime deliveries occur in dangerous lighting conditions</li>
                <li>Medical equipment can't be operated consistently</li>
            </ul>
            
            <h3>Our Healthcare Solar Solution</h3>
            <p>Each clinic received a carefully designed system including:</p>
            <ul>
                <li>High-capacity solar arrays (3-5kW) with battery backup</li>
                <li>Dedicated power for vaccine refrigerators with temperature monitoring</li>
                <li>24/7 lighting for emergency and maternity wards</li>
                <li>Power for essential medical equipment</li>
                <li>Backup systems for critical facilities</li>
                <li>Remote monitoring capabilities</li>
            </ul>
            
            <h3>Life-Saving Impact</h3>
            <p>The installations have had immediate, measurable impacts on healthcare delivery:</p>
            
            <ul>
                <li><strong>Vaccine Protection:</strong> 100% cold chain reliability ensures vaccine effectiveness</li>
                <li><strong>24/7 Operations:</strong> Clinics can now handle nighttime emergencies and deliveries safely</li>
                <li><strong>Extended Hours:</strong> Evening clinic hours serve working families</li>
                <li><strong>Better Outcomes:</strong> Healthcare workers report improved ability to provide quality care</li>
            </ul>
            
            <h3>Healthcare Worker Perspective</h3>
            <p>Sister Patience, a midwife at one of the clinics, shared: "Before solar power, nighttime deliveries were extremely stressful. We used flashlights and battery lamps. Now we have bright, reliable lighting. We can see what we're doing, and mothers feel safer. This solar system has literally saved lives."</p>
            
            <h3>Sustainability and Maintenance</h3>
            <p>We've established a comprehensive maintenance program including:</p>
            <ul>
                <li>Monthly system checks and cleaning</li>
                <li>Quarterly performance reviews</li>
                <li>Remote monitoring of critical components</li>
                <li>Rapid response team for any issues</li>
                <li>Training for clinic staff on basic maintenance</li>
            </ul>
            
            <h3>Expansion Plans</h3>
            <p>Building on this success, we're working with the Ministry of Health to identify 20 additional rural health facilities for solar installation in 2025. Healthcare is a right, not a privilege, and reliable power is essential to delivering it.</p>
        `,
        stats: [
            { number: '5', label: 'Clinics Powered' },
            { number: '50,000+', label: 'People Served' },
            { number: '100%', label: 'Uptime Achieved' }
        ]
    },
    {
        title: 'Community Training Workshop Success',
        category: 'Training',
        date: 'July 2024',
        excerpt: 'Conducted hands-on training for 100+ community members on solar system maintenance and clean cooking practices.',
        image: {
            gradient: 'linear-gradient(135deg, #ffa07a, #ffd93d)',
            icon: '👥'
        },
        content: `
            <p>Sustainable energy is about more than just installing systems—it's about empowering communities with knowledge. Last month, we conducted our largest training workshop series to date, teaching over 100 community members essential skills in solar maintenance and clean cooking practices.</p>
            
            <h3>Workshop Overview</h3>
            <p>The five-day workshop series covered:</p>
            <ul>
                <li><strong>Day 1:</strong> Solar Energy Basics and System Components</li>
                <li><strong>Day 2:</strong> Routine Maintenance and Troubleshooting</li>
                <li><strong>Day 3:</strong> Clean Cooking Technologies and Benefits</li>
                <li><strong>Day 4:</strong> Biodigester Operation and Maintenance</li>
                <li><strong>Day 5:</strong> Hands-on Practice and Certification</li>
            </ul>
            
            <h3>Practical Skills Development</h3>
            <p>Participants learned practical skills including:</p>
            <ul>
                <li>Cleaning and maintaining solar panels for optimal performance</li>
                <li>Basic troubleshooting of electrical connections</li>
                <li>Battery care and replacement procedures</li>
                <li>Safety protocols for solar system operation</li>
                <li>Efficient cookstove usage and maintenance</li>
                <li>Biodigester feeding and gas production optimization</li>
            </ul>
            
            <h3>Community Technician Program</h3>
            <p>A key outcome was the certification of 15 community members as local solar technicians. These individuals can now:</p>
            <ul>
                <li>Provide basic maintenance and repairs in their communities</li>
                <li>Conduct regular system checks</li>
                <li>Educate neighbors on proper system use</li>
                <li>Serve as the first point of contact for technical support</li>
                <li>Earn additional income through technical services</li>
            </ul>
            
            <h3>Women in Solar Energy</h3>
            <p>We're particularly proud that 60% of participants were women. One participant, Mai Tendai, shared: "I never thought I could learn about solar panels and electrical systems. Now I can maintain my own system and help my neighbors. This knowledge gives me independence and confidence."</p>
            
            <h3>Clean Cooking Focus</h3>
            <p>The clean cooking component addressed:</p>
            <ul>
                <li>Health impacts of traditional cooking methods</li>
                <li>Proper use of improved cookstoves</li>
                <li>Fuel efficiency techniques</li>
                <li>Indoor air quality improvement</li>
                <li>Alternative fuel sources</li>
            </ul>
            
            <h3>Ongoing Support</h3>
            <p>Training doesn't end with the workshop. We've established:</p>
            <ul>
                <li>A WhatsApp support group for graduates</li>
                <li>Monthly refresher sessions</li>
                <li>A mentorship program pairing new technicians with experienced ones</li>
                <li>Access to spare parts and tools</li>
                <li>Opportunities for advanced training</li>
            </ul>
            
            <h3>Looking Ahead</h3>
            <p>Based on this success, we're planning quarterly training workshops across different districts. Our goal is to train 500 community members by the end of 2025, creating a network of local solar experts throughout rural Zimbabwe.</p>
        `,
        stats: [
            { number: '100+', label: 'People Trained' },
            { number: '15', label: 'Certified Technicians' },
            { number: '60%', label: 'Women Participants' }
        ]
    },
    {
        title: 'Reaching 1,500 Households Milestone',
        category: 'Milestone',
        date: 'June 2024',
        excerpt: 'Celebrating a major achievement as we reach 1,500 households powered by clean, sustainable solar energy.',
        image: {
            gradient: 'linear-gradient(135deg, #4a7ba7, #7ed957)',
            icon: '💡'
        },
        content: `
            <p>We are incredibly proud to announce that Pawafan has reached a significant milestone: 1,500 households now have access to clean, reliable solar energy through our systems. This achievement represents not just a number, but transformed lives, empowered communities, and a more sustainable Zimbabwe.</p>
            
            <h3>Our Journey</h3>
            <p>Since our founding in 2023, we've been committed to making sustainable energy accessible to all Zimbabweans. Starting with just 50 installations in our first quarter, we've grown steadily through dedication, innovation, and most importantly, the trust of the communities we serve.</p>
            
            <h3>Impact by Numbers</h3>
            <ul>
                <li><strong>1,500 households</strong> with reliable electricity</li>
                <li><strong>7,500+ people</strong> directly benefiting from our systems</li>
                <li><strong>90% customer retention</strong> rate demonstrating satisfaction and reliability</li>
                <li><strong>$160,000+</strong> in revenue supporting sustainable growth</li>
                <li><strong>300+ community groups</strong> registered in our programs</li>
                <li><strong>50+ schools and clinics</strong> powered with commercial systems</li>
            </ul>
            
            <h3>Real Stories, Real Impact</h3>
            <p>Behind every installation is a story of transformation:</p>
            
            <p><strong>The Moyo Family - Mutoko:</strong> "Before Pawafan, my children studied by candlelight. Now they have bright LED lights, and their grades have improved. My small shop can stay open later, increasing our income by 40%."</p>
            
            <p><strong>Chiremba Primary School - Marondera:</strong> "Our computer lab used to sit idle during power outages. Now, with solar power, we're teaching digital literacy to 400 students consistently."</p>
            
            <p><strong>VaMoyo - Goromonzi:</strong> "The biodigester system Pawafan installed has revolutionized my farm. I no longer buy cooking gas or chemical fertilizers. My crops are healthier, and I'm saving $50 monthly."</p>
            
            <h3>Environmental Impact</h3>
            <p>Our installations have contributed significantly to environmental sustainability:</p>
            <ul>
                <li>Reduced CO2 emissions by an estimated 2,000 tons annually</li>
                <li>Prevented the burning of over 500 tons of firewood</li>
                <li>Protected thousands of trees from deforestation</li>
                <li>Reduced indoor air pollution affecting thousands of families</li>
            </ul>
            
            <h3>Innovation and Technology</h3>
            <p>Reaching this milestone has been possible through continuous innovation:</p>
            <ul>
                <li><strong>Pay-As-You-Go System:</strong> Making solar accessible through affordable monthly payments</li>
                <li><strong>Mobile Platform:</strong> Easy payment and system monitoring via mobile phones</li>
                <li><strong>Remote Monitoring:</strong> IoT-enabled systems for proactive maintenance</li>
                <li><strong>Modular Design:</strong> Systems that can grow with household needs</li>
            </ul>
            
            <h3>Community Partnerships</h3>
            <p>This milestone wouldn't be possible without our partners:</p>
            <ul>
                <li>Local government authorities supporting rural electrification</li>
                <li>Community leaders championing sustainable energy</li>
                <li>Financial institutions enabling our pay-as-you-go model</li>
                <li>International organizations providing technical support</li>
                <li>Most importantly, our customers who trust us with their energy needs</li>
            </ul>
            
            <h3>Looking to the Future</h3>
            <p>This milestone is not an endpoint but a launching pad. Our vision remains bold:</p>
            <ul>
                <li><strong>2025 Goal:</strong> 3,000 households powered</li>
                <li><strong>2028 Vision:</strong> 75,000 households across Zimbabwe</li>
                <li><strong>Long-term Mission:</strong> Contributing to universal energy access in Zimbabwe</li>
            </ul>
            
            <h3>Thank You</h3>
            <p>To every household that has trusted Pawafan with their energy needs, every community leader who has supported our work, every team member who has installed systems in remote areas, and every partner who has believed in our mission—thank you. This milestone belongs to all of us.</p>
            
            <p>Together, we're proving that sustainable energy is not just possible in Zimbabwe—it's happening now. The future is indeed here, and it's powered by the sun.</p>
            
            <h3>Join Us</h3>
            <p>If you're part of the 1,500 households already powered by Pawafan, thank you for being pioneers. If you're not yet part of our community, we invite you to join us. Contact us today to learn how solar power can transform your home or business.</p>
            
            <p><em>Here's to the next 1,500 households and beyond!</em></p>
        `,
        stats: [
            { number: '1,500', label: 'Households Powered' },
            { number: '7,500+', label: 'Lives Impacted' },
            { number: '90%', label: 'Customer Retention' }
        ]
    }
];

function initBlogModals() {
    const blogCards = document.querySelectorAll('.blog-card');
    
    blogCards.forEach(card => {
        const readMoreBtn = card.querySelector('.blog-read-more');
        const postIndex = parseInt(card.getAttribute('data-post'));
        
        // Open modal on card click
        card.addEventListener('click', function(e) {
            // Don't open if clicking the button (which has its own handler)
            if (!e.target.closest('.blog-read-more')) {
                openBlogModal(postIndex);
            }
        });
        
        // Also handle button click
        readMoreBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            openBlogModal(postIndex);
        });
    });
}

function openBlogModal(index) {
    const post = blogData[index];
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'blog-modal';
    
    // Build stats HTML
    const statsHTML = post.stats ? `
        <div class="blog-stats">
            ${post.stats.map(stat => `
                <div class="blog-stat">
                    <span class="blog-stat-number">${escapeHtml(stat.number)}</span>
                    <span class="blog-stat-label">${escapeHtml(stat.label)}</span>
                </div>
            `).join('')}
        </div>
    ` : '';
    
    modal.innerHTML = `
        <div class="blog-modal-content">
            <button class="blog-modal-close" aria-label="Close modal">&times;</button>
            
            <div class="blog-modal-image">
                <div class="blog-placeholder" style="background: ${post.image.gradient};">
                    <div class="placeholder-icon">${post.image.icon}</div>
                </div>
            </div>
            
            <div class="blog-modal-header">
                <div class="blog-modal-meta">
                    <span class="blog-category">${escapeHtml(post.category)}</span>
                    <span class="blog-date">${escapeHtml(post.date)}</span>
                </div>
                <h2>${escapeHtml(post.title)}</h2>
            </div>
            
            ${statsHTML}
            
            <div class="blog-modal-body">
                ${post.content}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Get close button
    const closeBtn = modal.querySelector('.blog-modal-close');
    
    // Close button event
    closeBtn.addEventListener('click', function() {
        closeBlogModal(modal);
    });
    
    // Trigger animation
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
    
    // Close on background click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeBlogModal(modal);
        }
    });
    
    // Close on Escape key
    const escapeHandler = function(e) {
        if (e.key === 'Escape') {
            closeBlogModal(modal);
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
}

function closeBlogModal(modal) {
    modal.classList.remove('active');
    
    setTimeout(() => {
        if (modal.parentNode) {
            document.body.removeChild(modal);
        }
        document.body.style.overflow = '';
    }, 300);
}

/* =================================================================
   CONSOLE MESSAGE
   ================================================================= */
console.log('%cPawafan Website', 'color: #7ed957; font-size: 24px; font-weight: bold;');
console.log('%cThe Future Is Here', 'color: #4a7ba7; font-size: 16px;');
console.log('Website loaded successfully! 🌱⚡');
