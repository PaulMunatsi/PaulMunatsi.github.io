// ========================================
// ENHANCED FEATURES FOR LINUX MASTERY
// Particle system, code copy buttons, accessibility, keyboard shortcuts
// ========================================

// ========================================
// PARTICLE BACKGROUND SYSTEM
// ========================================

function initParticles() {
    const canvas = document.getElementById('particles');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    
    // Set canvas size
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    
    // Particle configuration
    const particles = [];
    const particleCount = Math.min(50, Math.floor(window.innerWidth / 30)); // Responsive count
    
    // Create particles
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            radius: Math.random() * 2 + 1
        });
    }
    
    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Get theme for colors
        const theme = document.documentElement.getAttribute('data-theme') || 'light';
        const color = theme === 'dark' ? '0, 255, 65' : '100, 126, 234'; // Green for dark, blue for light
        
        // Update and draw particles
        particles.forEach((p, i) => {
            p.x += p.vx;
            p.y += p.vy;
            
            // Bounce off edges
            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
            
            // Draw particle
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${color}, 0.6)`;
            ctx.fill();
            
            // Connect nearby particles
            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 120) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(${color}, ${0.15 * (1 - distance / 120)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        });
        
        animationFrameId = requestAnimationFrame(animate);
    }
    
    // Start animation
    animate();
    
    // Handle window resize
    window.addEventListener('resize', () => {
        resizeCanvas();
    });
    
    // Pause animation when tab is not visible (performance)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(animationFrameId);
        } else {
            animate();
        }
    });
}

// ========================================
// CODE COPY BUTTON ENHANCEMENT
// ========================================

function enhanceCodeBlocks() {
    document.querySelectorAll('pre code').forEach((block, index) => {
        // Skip if already enhanced
        if (block.parentElement.parentElement.classList.contains('code-block-wrapper')) {
            return;
        }
        
        const wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper';
        wrapper.setAttribute('data-code-block', index);
        
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-code-btn';
        copyBtn.setAttribute('aria-label', 'Copy code to clipboard');
        copyBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span>Copy</span>
        `;
        
        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(block.textContent);
                copyBtn.classList.add('copied');
                copyBtn.innerHTML = '<span>✓ Copied!</span>';
                announce('Code copied to clipboard');
                
                setTimeout(() => {
                    copyBtn.classList.remove('copied');
                    copyBtn.innerHTML = `
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        <span>Copy</span>
                    `;
                }, 2000);
            } catch (err) {
                console.error('Failed to copy code:', err);
                announce('Failed to copy code');
            }
        });
        
        // Wrap the code block
        const pre = block.parentElement;
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);
        wrapper.appendChild(copyBtn);
    });
}

// ========================================
// ACCESSIBILITY - SCREEN READER ANNOUNCEMENTS
// ========================================

function announce(message, priority = 'polite') {
    const announcer = document.getElementById('announcer');
    if (!announcer) return;
    
    // Set priority (polite or assertive)
    announcer.setAttribute('aria-live', priority);
    
    // Clear and set message
    announcer.textContent = '';
    setTimeout(() => {
        announcer.textContent = message;
    }, 100);
    
    // Clear after announcement
    setTimeout(() => {
        announcer.textContent = '';
    }, 3000);
}

// ========================================
// KEYBOARD SHORTCUTS
// ========================================

function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K: Focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.focus();
                announce('Search focused');
            }
        }
        
        // Ctrl/Cmd + T: Toggle theme
        if ((e.ctrlKey || e.metaKey) && e.key === 't') {
            e.preventDefault();
            const themeToggle = document.getElementById('themeToggle');
            if (themeToggle) {
                themeToggle.click();
            }
        }
        
        // Escape: Close search results
        if (e.key === 'Escape') {
            const searchResults = document.getElementById('searchResults');
            if (searchResults && searchResults.classList.contains('show')) {
                searchResults.classList.remove('show');
                announce('Search closed');
            }
            
            // Close mobile sidebar
            const sidebar = document.getElementById('sidebar');
            if (sidebar && sidebar.classList.contains('mobile-open')) {
                sidebar.classList.remove('mobile-open');
                announce('Navigation closed');
            }
        }
    });
}

// ========================================
// READING TIME CALCULATOR
// ========================================

function calculateReadingTime(text) {
    const wordsPerMinute = 200;
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return minutes;
}

function addReadingTime() {
    const headings = document.querySelectorAll('.content-body h1');
    headings.forEach(heading => {
        // Skip if already has reading time
        if (heading.querySelector('.reading-time')) return;
        
        const contentBody = heading.closest('.content-body');
        if (contentBody) {
            const text = contentBody.textContent;
            const minutes = calculateReadingTime(text);
            
            const badge = document.createElement('span');
            badge.className = 'reading-time';
            badge.textContent = `${minutes} min read`;
            badge.setAttribute('aria-label', `Estimated reading time: ${minutes} minutes`);
            
            heading.appendChild(badge);
        }
    });
}

// ========================================
// TERMINAL BREADCRUMB UPDATE
// ========================================

function updateTerminalBreadcrumb() {
    const breadcrumb = document.querySelector('.terminal-breadcrumb .path');
    if (!breadcrumb) return;
    
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    let path = 'home';
    
    if (currentPage.startsWith('module')) {
        const match = currentPage.match(/module(\d+)/);
        if (match) {
            path = `modules/module-${match[1].padStart(2, '0')}`;
        }
    }
    
    breadcrumb.textContent = `cd ${path}`;
}

// ========================================
// ENHANCED PROGRESS TRACKING
// ========================================

function showCompletionCelebration(moduleNum) {
    // Create confetti effect (lightweight)
    const colors = ['#00ff41', '#00d9ff', '#ffb800'];
    const confettiCount = 30;
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = '-10px';
        confetti.style.borderRadius = '50%';
        confetti.style.pointerEvents = 'none';
        confetti.style.zIndex = '10000';
        confetti.style.opacity = '1';
        confetti.style.transition = 'all 3s ease-out';
        
        document.body.appendChild(confetti);
        
        setTimeout(() => {
            confetti.style.top = '110%';
            confetti.style.opacity = '0';
            confetti.style.transform = `translateX(${(Math.random() - 0.5) * 200}px) rotate(${Math.random() * 720}deg)`;
        }, 50);
        
        setTimeout(() => {
            confetti.remove();
        }, 3000);
    }
    
    announce(`Module ${moduleNum} completed! Congratulations!`, 'assertive');
}

// ========================================
// ENHANCED SEARCH WITH KEYBOARD NAVIGATION
// ========================================

function initEnhancedSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    if (!searchInput || !searchResults) return;
    
    let selectedIndex = -1;
    
    searchInput.addEventListener('keydown', (e) => {
        const results = searchResults.querySelectorAll('.search-result-item');
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
            updateSelectedResult(results, selectedIndex);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, -1);
            updateSelectedResult(results, selectedIndex);
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            results[selectedIndex].click();
        }
    });
    
    function updateSelectedResult(results, index) {
        results.forEach((result, i) => {
            if (i === index) {
                result.style.background = 'var(--bg-glass)';
                result.style.paddingLeft = '28px';
                result.setAttribute('aria-selected', 'true');
                result.scrollIntoView({ block: 'nearest' });
            } else {
                result.style.background = '';
                result.style.paddingLeft = '20px';
                result.setAttribute('aria-selected', 'false');
            }
        });
    }
    
    // Reset selection when results change
    const observer = new MutationObserver(() => {
        selectedIndex = -1;
    });
    observer.observe(searchResults, { childList: true });
}

// ========================================
// SIDEBAR FOCUS TRAP (Accessibility)
// ========================================

function initSidebarFocusTrap() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    
    sidebar.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && window.innerWidth <= 768) {
            sidebar.classList.remove('mobile-open');
            const toggle = document.getElementById('sidebarToggle');
            if (toggle) toggle.focus();
        }
    });
}

// ========================================
// PERFORMANCE - LAZY LOAD IMAGES
// ========================================

function initLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

// ========================================
// MODULE STATUS INDICATOR ENHANCEMENT
// ========================================

function enhanceModuleStatusIndicators() {
    document.querySelectorAll('.module-status').forEach(button => {
        // Make keyboard accessible
        button.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                button.click();
            }
        });
        
        // Add tooltip
        button.addEventListener('mouseenter', () => {
            const isCompleted = button.classList.contains('completed');
            button.title = isCompleted ? 'Mark as incomplete' : 'Mark as complete';
        });
    });
}

// ========================================
// INITIALIZATION
// ========================================

// Wait for DOM and original script to load
window.addEventListener('load', () => {
    // Small delay to ensure original script has initialized
    setTimeout(() => {
        initParticles();
        initKeyboardShortcuts();
        initEnhancedSearch();
        initSidebarFocusTrap();
        initLazyLoading();
        enhanceModuleStatusIndicators();
        updateTerminalBreadcrumb();
        
        // Enhance code blocks after content loads
        const contentObserver = new MutationObserver(() => {
            enhanceCodeBlocks();
            addReadingTime();
        });
        
        const contentBody = document.getElementById('contentBody');
        if (contentBody) {
            contentObserver.observe(contentBody, {
                childList: true,
                subtree: true
            });
        }
        
        // Initial enhancement
        enhanceCodeBlocks();
        addReadingTime();
    }, 500);
});

// Override the original toggleModuleCompletion to add celebration
if (window.toggleModuleCompletion) {
    const originalToggle = window.toggleModuleCompletion;
    window.toggleModuleCompletion = function(moduleNum) {
        const wasCompleted = window.isModuleCompleted ? window.isModuleCompleted(moduleNum) : false;
        originalToggle(moduleNum);
        
        // Check if now completed (not before)
        const isNowCompleted = window.isModuleCompleted ? window.isModuleCompleted(moduleNum) : false;
        if (isNowCompleted && !wasCompleted) {
            showCompletionCelebration(moduleNum);
        }
    };
}

// Export functions for external use
window.LinuxMasteryEnhancements = {
    announce,
    enhanceCodeBlocks,
    addReadingTime,
    showCompletionCelebration
};
