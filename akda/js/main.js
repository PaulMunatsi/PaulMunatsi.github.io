/**
 * AKDA Website - Combined JavaScript
 * Pure Vanilla JavaScript - No Dependencies
 */

(function() {
  'use strict';

  // ========================================
  // MOBILE NAVIGATION - FIXED
  // ========================================
  const initMobileNav = () => {
    const navToggle = document.querySelector('.navbar-toggle');
    const navMenu = document.querySelector('.navbar-menu');
    const navDropdowns = document.querySelectorAll('.nav-dropdown');

    if (!navToggle || !navMenu) {
      console.log('Navigation elements not found');
      return;
    }

    // Toggle mobile menu on hamburger click
    navToggle.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Toggle active class on hamburger button
      navToggle.classList.toggle('active');
      
      // Toggle active class on menu to slide it in/out
      navMenu.classList.toggle('active');
      
      // Update aria-expanded attribute for accessibility
      const isExpanded = navMenu.classList.contains('active');
      navToggle.setAttribute('aria-expanded', isExpanded);
      
      // Prevent body scroll when menu is open
      document.body.style.overflow = isExpanded ? 'hidden' : '';
    });

    // Handle dropdown toggles on mobile
    navDropdowns.forEach(dropdown => {
      const dropdownBtn = dropdown.querySelector('.dropdown-btn');
      
      if (dropdownBtn) {
        dropdownBtn.addEventListener('click', function(e) {
          // Only handle click on mobile
          if (window.innerWidth < 768) {
            e.preventDefault();
            e.stopPropagation();
            
            // Close other dropdowns first
            navDropdowns.forEach(other => {
              if (other !== dropdown) {
                other.classList.remove('active');
              }
            });
            
            // Toggle current dropdown
            dropdown.classList.toggle('active');
          }
        });
      }
    });

    // Close menu when clicking on a non-dropdown link
    const navLinks = navMenu.querySelectorAll('.nav-link:not(.dropdown-btn)');
    navLinks.forEach(link => {
      link.addEventListener('click', function() {
        navToggle.classList.remove('active');
        navMenu.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
      if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
        if (navMenu.classList.contains('active')) {
          navToggle.classList.remove('active');
          navMenu.classList.remove('active');
          navToggle.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
        }
        
        // Close all dropdowns when clicking outside
        navDropdowns.forEach(dropdown => {
          dropdown.classList.remove('active');
        });
      }
    });

    // Close menu when window is resized to desktop
    window.addEventListener('resize', function() {
      if (window.innerWidth >= 768) {
        navToggle.classList.remove('active');
        navMenu.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        
        // Close all mobile dropdowns
        navDropdowns.forEach(dropdown => {
          dropdown.classList.remove('active');
        });
      }
    });
  };

  // ========================================
  // NAVBAR SCROLL EFFECT
  // ========================================
  const initNavbarScroll = () => {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    const scrollThreshold = 50;

    window.addEventListener('scroll', function() {
      if (window.scrollY > scrollThreshold) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  };

  // ========================================
  // SCROLL TO TOP BUTTON
  // ========================================
  const initScrollToTop = () => {
    const scrollBtn = document.querySelector('.scroll-to-top');
    if (!scrollBtn) return;

    window.addEventListener('scroll', function() {
      if (window.pageYOffset > 300) {
        scrollBtn.classList.add('visible');
      } else {
        scrollBtn.classList.remove('visible');
      }
    });

    scrollBtn.addEventListener('click', function() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  };

  // ========================================
  // SMOOTH SCROLL FOR ANCHOR LINKS
  // ========================================
  const initSmoothScroll = () => {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        
        // Skip if it's just "#"
        if (href === '#') {
          e.preventDefault();
          return;
        }

        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          const navHeight = document.querySelector('.navbar')?.offsetHeight || 0;
          const targetPosition = target.offsetTop - navHeight - 20;

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  };

  // ========================================
  // FORM VALIDATION
  // ========================================
  const initFormValidation = () => {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
      form.addEventListener('submit', function(e) {
        let isValid = true;
        const inputs = form.querySelectorAll('input[required], textarea[required]');

        inputs.forEach(input => {
          // Remove previous error states
          input.classList.remove('error');
          
          if (!input.value.trim()) {
            isValid = false;
            input.classList.add('error');
          }

          // Email validation
          if (input.type === 'email' && input.value.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(input.value)) {
              isValid = false;
              input.classList.add('error');
            }
          }

          // URL validation
          if (input.type === 'url' && input.value.trim()) {
            const urlRegex = /^https?:\/\/.+/;
            if (!urlRegex.test(input.value)) {
              isValid = false;
              input.classList.add('error');
            }
          }
        });

        if (!isValid) {
          e.preventDefault();
          alert('Please fill in all required fields correctly.');
        }
      });

      // Remove error class on input
      form.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('input', function() {
          input.classList.remove('error');
        });
      });
    });
  };

  // ========================================
  // INTERSECTION OBSERVER FOR ANIMATIONS
  // ========================================
  const initScrollAnimations = () => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe elements with animation classes
    document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right, .scale-in').forEach(el => {
      el.style.opacity = '0';
      observer.observe(el);
    });

    // Add animate class styles
    const style = document.createElement('style');
    style.textContent = '.fade-in.animate, .slide-in-left.animate, .slide-in-right.animate, .scale-in.animate { opacity: 1 !important; }';
    document.head.appendChild(style);
  };

  // ========================================
  // LAZY LOADING IMAGES
  // ========================================
  const initLazyLoading = () => {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver(function(entries) {
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
  };

  // ========================================
  // VIDEO PLAYER
  // ========================================
  const initVideoPlayers = () => {
    const videoContainers = document.querySelectorAll('.video-container');
    
    videoContainers.forEach(container => {
      const video = container.querySelector('video');
      const playBtn = container.querySelector('.video-play-btn');
      const controls = container.querySelector('.video-controls');
      
      if (!video) return;

      // Play/Pause functionality
      if (playBtn) {
        playBtn.addEventListener('click', function() {
          if (video.paused) {
            video.play();
            playBtn.style.display = 'none';
          } else {
            video.pause();
            playBtn.style.display = 'block';
          }
        });
      }

      // Show/hide controls
      video.addEventListener('play', function() {
        if (controls) controls.classList.add('visible');
      });

      video.addEventListener('pause', function() {
        if (playBtn) playBtn.style.display = 'block';
      });

      // Custom controls if present
      const playPauseBtn = controls?.querySelector('.play-pause');
      const volumeSlider = controls?.querySelector('.volume-slider');
      const progressBar = controls?.querySelector('.progress-bar');
      const fullscreenBtn = controls?.querySelector('.fullscreen-btn');

      if (playPauseBtn) {
        playPauseBtn.addEventListener('click', function() {
          if (video.paused) {
            video.play();
          } else {
            video.pause();
          }
        });
      }

      if (volumeSlider) {
        volumeSlider.addEventListener('input', function(e) {
          video.volume = e.target.value / 100;
        });
      }

      if (progressBar) {
        video.addEventListener('timeupdate', function() {
          const progress = (video.currentTime / video.duration) * 100;
          progressBar.style.width = progress + '%';
        });

        progressBar.parentElement?.addEventListener('click', function(e) {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const percentage = clickX / rect.width;
          video.currentTime = percentage * video.duration;
        });
      }

      if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', function() {
          if (video.requestFullscreen) {
            video.requestFullscreen();
          } else if (video.webkitRequestFullscreen) {
            video.webkitRequestFullscreen();
          } else if (video.msRequestFullscreen) {
            video.msRequestFullscreen();
          }
        });
      }
    });

    // Initialize video thumbnails
    const videoThumbnails = document.querySelectorAll('.video-thumbnail');
    
    videoThumbnails.forEach(function(thumbnail) {
      thumbnail.addEventListener('click', function() {
        const featuredVideo = document.getElementById('featured-video');
        if (featuredVideo) {
          featuredVideo.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
      
      thumbnail.addEventListener('mouseenter', function() {
        this.style.cursor = 'pointer';
      });
    });
  };

  // ========================================
  // GALLERY/LIGHTBOX
  // ========================================
  const initGallery = () => {
    const galleryImages = document.querySelectorAll('.gallery-item img');
    
    if (galleryImages.length === 0) return;

    // Check if lightbox already exists in HTML
    let lightbox = document.getElementById('lightbox');
    let lightboxImg, closeBtn, prevBtn, nextBtn;
    
    if (lightbox) {
      // Use existing lightbox elements
      lightboxImg = document.getElementById('lightbox-image');
      closeBtn = lightbox.querySelector('.lightbox-close');
      prevBtn = lightbox.querySelector('.lightbox-prev');
      nextBtn = lightbox.querySelector('.lightbox-next');
    } else {
      // Create lightbox dynamically
      lightbox = document.createElement('div');
      lightbox.className = 'lightbox';
      lightbox.id = 'lightbox';
      lightbox.innerHTML = 
        '<div class="lightbox-content">' +
          '<span class="lightbox-close">&times;</span>' +
          '<img id="lightbox-image" src="" alt="">' +
          '<button class="lightbox-prev">&#10094;</button>' +
          '<button class="lightbox-next">&#10095;</button>' +
        '</div>';
      document.body.appendChild(lightbox);
      
      lightboxImg = document.getElementById('lightbox-image');
      closeBtn = lightbox.querySelector('.lightbox-close');
      prevBtn = lightbox.querySelector('.lightbox-prev');
      nextBtn = lightbox.querySelector('.lightbox-next');
    }

    let currentIndex = 0;

    // Convert NodeList to Array
    const images = Array.from(galleryImages);

    // Open lightbox
    images.forEach(function(img, index) {
      img.addEventListener('click', function() {
        currentIndex = index;
        lightboxImg.src = img.src;
        lightbox.classList.add('active');
        lightbox.style.display = 'flex';
        document.body.style.overflow = 'hidden';
      });
    });

    // Close lightbox
    const closeLightbox = function() {
      lightbox.classList.remove('active');
      lightbox.style.display = 'none';
      document.body.style.overflow = '';
    };

    if (closeBtn) {
      closeBtn.addEventListener('click', closeLightbox);
    }
    
    lightbox.addEventListener('click', function(e) {
      if (e.target === lightbox) closeLightbox();
    });

    // Navigation
    if (prevBtn) {
      prevBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        currentIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
        lightboxImg.src = images[currentIndex].src;
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        currentIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
        lightboxImg.src = images[currentIndex].src;
      });
    }

    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
      if (!lightbox.classList.contains('active') && lightbox.style.display !== 'flex') return;
      
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft' && prevBtn) prevBtn.click();
      if (e.key === 'ArrowRight' && nextBtn) nextBtn.click();
    });
  };

  // ========================================
  // CONTACT FORM - MAILTO HANDLER
  // ========================================
  const initContactForm = () => {
    const contactForm = document.getElementById('contact-form');
    
    if (!contactForm) return;
    
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Get form values
      const name = contactForm.querySelector('input[name="name"]').value.trim();
      const surname = contactForm.querySelector('input[name="surname"]').value.trim();
      const subject = contactForm.querySelector('input[name="subject"]').value.trim();
      const message = contactForm.querySelector('textarea[name="message"]').value.trim();
      
      // Validate required fields
      if (!name || !surname || !subject || !message) {
        alert('Please fill in all required fields.');
        return;
      }
      
      // Build email body
      let emailBody = 'Name: ' + name + ' ' + surname + '\n';
      emailBody += '\nMessage:\n' + message;
      
      // Create mailto link
      const mailtoLink = 'mailto:info@akda-org.za?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(emailBody);
      
      // Open default mail client
      window.location.href = mailtoLink;
    });
  };

  // ========================================
  // INITIALIZE ALL
  // ========================================
  const init = () => {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    // Initialize all features
    initMobileNav();
    initNavbarScroll();
    initScrollToTop();
    initSmoothScroll();
    initFormValidation();
    initScrollAnimations();
    initLazyLoading();
    initVideoPlayers();
    initGallery();
    initContactForm();

    // Add loaded class to body
    document.body.classList.add('loaded');
  };

  // Start initialization
  init();

})();
