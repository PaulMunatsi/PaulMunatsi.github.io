/* ========================================
   TALIVIN POWER SOLUTIONS - GALLERY JAVASCRIPT
   ========================================
   
   Lightbox gallery functionality:
   - Click to open image in lightbox
   - Navigation with arrows and keyboard
   - Touch/swipe support for mobile
   - Thumbnail gallery grid
   
   ======================================== */

'use strict';

/* ========================================
   GALLERY CLASS
   ======================================== */

class Gallery {
    constructor() {
        this.lightbox = null;
        this.lightboxImage = null;
        this.currentIndex = 0;
        this.images = [];
        this.touchStartX = 0;
        this.touchEndX = 0;
        
        this.init();
    }
    
    /**
     * Initialize the gallery
     */
    init() {
        this.createLightbox();
        this.bindGalleryItems();
        this.bindKeyboardEvents();
        this.bindTouchEvents();
    }
    
    /**
     * Create lightbox HTML structure
     */
    createLightbox() {
        // Check if lightbox already exists
        if (document.querySelector('.lightbox')) {
            this.lightbox = document.querySelector('.lightbox');
            this.lightboxImage = this.lightbox.querySelector('.lightbox-image');
            return;
        }
        
        // Create lightbox elements
        const lightbox = document.createElement('div');
        lightbox.classList.add('lightbox');
        lightbox.innerHTML = `
            <div class="lightbox-content">
                <button class="lightbox-close" aria-label="Close lightbox">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <button class="lightbox-nav lightbox-prev" aria-label="Previous image">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>
                <img class="lightbox-image" src="" alt="Gallery image">
                <button class="lightbox-nav lightbox-next" aria-label="Next image">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
            </div>
        `;
        
        document.body.appendChild(lightbox);
        
        this.lightbox = lightbox;
        this.lightboxImage = lightbox.querySelector('.lightbox-image');
        
        // Bind lightbox events
        this.bindLightboxEvents();
    }
    
    /**
     * Bind events to lightbox controls
     */
    bindLightboxEvents() {
        // Close button
        const closeBtn = this.lightbox.querySelector('.lightbox-close');
        closeBtn.addEventListener('click', () => this.close());
        
        // Previous button
        const prevBtn = this.lightbox.querySelector('.lightbox-prev');
        prevBtn.addEventListener('click', () => this.prev());
        
        // Next button
        const nextBtn = this.lightbox.querySelector('.lightbox-next');
        nextBtn.addEventListener('click', () => this.next());
        
        // Close on backdrop click
        this.lightbox.addEventListener('click', (e) => {
            if (e.target === this.lightbox) {
                this.close();
            }
        });
    }
    
    /**
     * Bind click events to gallery items
     */
    bindGalleryItems() {
        const galleryItems = document.querySelectorAll('.gallery-item, [data-gallery]');
        
        galleryItems.forEach((item, index) => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Get all images in the same gallery
                const galleryContainer = item.closest('.gallery-grid, [data-gallery-container]');
                if (galleryContainer) {
                    const items = galleryContainer.querySelectorAll('.gallery-item, [data-gallery]');
                    this.images = Array.from(items).map(el => {
                        const img = el.querySelector('img') || el;
                        return img.src || img.dataset.src || img.href;
                    });
                    this.currentIndex = Array.from(items).indexOf(item);
                } else {
                    this.images = [item.querySelector('img')?.src || item.dataset.src || item.href];
                    this.currentIndex = 0;
                }
                
                this.open();
            });
        });
    }
    
    /**
     * Bind keyboard events for navigation
     */
    bindKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            if (!this.lightbox.classList.contains('active')) return;
            
            switch (e.key) {
                case 'Escape':
                    this.close();
                    break;
                case 'ArrowLeft':
                    this.prev();
                    break;
                case 'ArrowRight':
                    this.next();
                    break;
            }
        });
    }
    
    /**
     * Bind touch events for swipe navigation
     */
    bindTouchEvents() {
        if (!this.lightbox) return;
        
        this.lightbox.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        this.lightbox.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        }, { passive: true });
    }
    
    /**
     * Handle swipe gesture
     */
    handleSwipe() {
        const swipeThreshold = 50;
        const diff = this.touchStartX - this.touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Swipe left - next image
                this.next();
            } else {
                // Swipe right - previous image
                this.prev();
            }
        }
    }
    
    /**
     * Open lightbox with current image
     */
    open() {
        if (this.images.length === 0) return;
        
        this.lightboxImage.src = this.images[this.currentIndex];
        this.lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Update navigation visibility
        this.updateNavigation();
    }
    
    /**
     * Close lightbox
     */
    close() {
        this.lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    /**
     * Go to previous image
     */
    prev() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.updateImage();
        } else {
            // Loop to last image
            this.currentIndex = this.images.length - 1;
            this.updateImage();
        }
    }
    
    /**
     * Go to next image
     */
    next() {
        if (this.currentIndex < this.images.length - 1) {
            this.currentIndex++;
            this.updateImage();
        } else {
            // Loop to first image
            this.currentIndex = 0;
            this.updateImage();
        }
    }
    
    /**
     * Update displayed image
     */
    updateImage() {
        // Add fade effect
        this.lightboxImage.style.opacity = '0';
        
        setTimeout(() => {
            this.lightboxImage.src = this.images[this.currentIndex];
            this.lightboxImage.style.opacity = '1';
        }, 150);
        
        this.updateNavigation();
    }
    
    /**
     * Update navigation button visibility
     */
    updateNavigation() {
        const prevBtn = this.lightbox.querySelector('.lightbox-prev');
        const nextBtn = this.lightbox.querySelector('.lightbox-next');
        
        // Show/hide based on image count (always show if looping)
        if (this.images.length <= 1) {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        } else {
            prevBtn.style.display = 'flex';
            nextBtn.style.display = 'flex';
        }
    }
}

/* ========================================
   INITIALIZE GALLERY ON DOM LOAD
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if there are gallery items
    if (document.querySelector('.gallery-item, [data-gallery]')) {
        window.gallery = new Gallery();
    }
});

/* ========================================
   EXPORT FOR EXTERNAL USE
   ======================================== */

window.TalivinGallery = Gallery;
