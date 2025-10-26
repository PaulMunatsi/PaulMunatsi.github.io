// ========================================
// GLOBAL STATE & CONFIGURATION
// ========================================

const CONFIG = {
    modules: [
        { id: 1, title: 'Linux Fundamentals', file: 'Module01_LinuxFundamentals.md', days: 7 },
        { id: 2, title: 'File System & Permissions', file: 'Module02_FileSystemAndPermissions.md', days: 5 },
        { id: 3, title: 'Text Processing & Scripting', file: 'Module03_TextProcessingAndShellScripting.md', days: 7 },
        { id: 4, title: 'User & Process Management', file: 'Module04_UserAndProcessManagement.md', days: 4 },
        { id: 5, title: 'Networking Essentials', file: 'Module05_NetworkingEssentials.md', days: 4 },
        { id: 6, title: 'Package Management & Sys Admin', file: 'Module06_PackageManagementAndSystemAdmin.md', days: 7 }
    ],
    markdownPath: 'assets/markdown/'
};

let moduleContent = {}; // Cache for loaded module content
let searchIndex = []; // Search index

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initSidebar();
    initBackToTop();
    initSearch();
    initProgress();
    loadPageContent();
    preloadModuleContent();
    
    // Initialize quiz after content loads
    setTimeout(() => {
        initQuiz();
    }, 1500);
});

// Update on window load as backup
window.addEventListener('load', () => {
    setTimeout(updateActiveModule, 100);
});

// Make force update available globally
window.forceUpdateActiveModule = forceUpdateActiveModule;

// ========================================
// THEME MANAGEMENT
// ========================================

function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// ========================================
// SIDEBAR NAVIGATION
// ========================================

function initSidebar() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-open');
        });
    }
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
                sidebar.classList.remove('mobile-open');
            }
        }
    });
    
    // Initial update
    updateActiveModule();
}

function updateActiveModule() {
    // Get current page filename
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop() || 'index.html';
    
    // Get all module items
    const allModuleItems = document.querySelectorAll('.module-item');
    
    // First, remove active class from ALL module items
    allModuleItems.forEach(item => {
        item.classList.remove('active');
    });
    
    // Now find the matching module and add active class
    allModuleItems.forEach(item => {
        const link = item.querySelector('.module-link');
        if (link) {
            const href = link.getAttribute('href');
            
            // Direct match
            if (href === currentPage) {
                item.classList.add('active');
                return;
            }
            
            // Handle index.html case
            if (currentPage === 'index.html' && href === 'index.html') {
                item.classList.add('active');
                return;
            }
            
            // Handle empty or root path
            if ((currentPage === '' || currentPage === '/') && href === 'index.html') {
                item.classList.add('active');
                return;
            }
        }
    });
}

// Force update active module - can be called from console if needed
function forceUpdateActiveModule() {
    console.log('Forcing active module update...');
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    console.log('Current page:', currentPage);
    
    const allModuleItems = document.querySelectorAll('.module-item');
    console.log('Found module items:', allModuleItems.length);
    
    allModuleItems.forEach((item, index) => {
        const link = item.querySelector('.module-link');
        const href = link ? link.getAttribute('href') : 'none';
        console.log(`Module ${index + 1}: href="${href}", active="${item.classList.contains('active')}"`);
    });
    
    updateActiveModule();
}

// ========================================
// BACK TO TOP BUTTON
// ========================================

function initBackToTop() {
    const backToTop = document.getElementById('backToTop');
    
    if (!backToTop) return;
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });
    
    backToTop.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ========================================
// PROGRESS TRACKING
// ========================================

function initProgress() {
    // Update progress display immediately
    updateProgressDisplay();
    updateModuleStatusIndicators();
    
    // Set up the mark complete button
    const markCompleteBtn = document.getElementById('markComplete');
    if (markCompleteBtn) {
        const moduleNum = getModuleNumber();
        if (moduleNum) {
            const isCompleted = isModuleCompleted(moduleNum);
            updateCompleteButton(markCompleteBtn, isCompleted);
            
            markCompleteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                toggleModuleCompletion(moduleNum);
            });
        }
    }
}

function getProgress() {
    const progress = localStorage.getItem('courseProgress');
    return progress ? JSON.parse(progress) : {};
}

function saveProgress(progress) {
    localStorage.setItem('courseProgress', JSON.stringify(progress));
}

function isModuleCompleted(moduleNum) {
    const progress = getProgress();
    return progress[`module${moduleNum}`] === true;
}

function toggleModuleCompletion(moduleNum) {
    const progress = getProgress();
    const key = `module${moduleNum}`;
    
    // Toggle the completion status
    progress[key] = !progress[key];
    saveProgress(progress);
    
    // Update all UI elements
    updateProgressDisplay();
    updateModuleStatusIndicators();
    
    // Update the button on current page
    const markCompleteBtn = document.getElementById('markComplete');
    if (markCompleteBtn) {
        updateCompleteButton(markCompleteBtn, progress[key]);
        
        // Add a brief success animation
        if (progress[key]) {
            markCompleteBtn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                markCompleteBtn.style.transform = 'scale(1)';
            }, 100);
        }
    }
}

function updateCompleteButton(button, isCompleted) {
    if (isCompleted) {
        button.classList.add('completed');
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>Completed</span>
        `;
    } else {
        button.classList.remove('completed');
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>Mark as Complete</span>
        `;
    }
}

function updateProgressDisplay() {
    const progress = getProgress();
    const totalModules = CONFIG.modules.length;
    const completedModules = Object.values(progress).filter(Boolean).length;
    const percentage = Math.round((completedModules / totalModules) * 100);
    
    const progressPercentage = document.getElementById('overallProgress');
    const progressBar = document.getElementById('overallProgressBar');
    
    if (progressPercentage) {
        progressPercentage.textContent = `${percentage}%`;
    }
    
    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
    }
}

function updateModuleStatusIndicators() {
    const progress = getProgress();
    
    document.querySelectorAll('.module-status').forEach(indicator => {
        const moduleNum = indicator.getAttribute('data-status');
        const isCompleted = progress[`module${moduleNum}`] === true;
        
        if (isCompleted) {
            indicator.textContent = '✓';
            indicator.classList.add('completed');
            indicator.style.color = 'var(--accent-success)';
        } else {
            indicator.textContent = '○';
            indicator.classList.remove('completed');
            indicator.style.color = 'var(--text-muted)';
        }
        
        // Make the status indicator clickable
        indicator.style.cursor = 'pointer';
        indicator.title = isCompleted ? 'Click to mark as incomplete' : 'Click to mark as complete';
        
        // Remove old event listener and add new one
        const newIndicator = indicator.cloneNode(true);
        indicator.parentNode.replaceChild(newIndicator, indicator);
        
        newIndicator.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleModuleCompletion(moduleNum);
        });
    });
}

// ========================================
// CONTENT LOADING
// ========================================

function getModuleNumber() {
    const currentPage = window.location.pathname.split('/').pop();
    const match = currentPage.match(/module(\d+)\.html/);
    return match ? parseInt(match[1]) : null;
}

async function loadPageContent() {
    const contentBody = document.getElementById('contentBody');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const moduleActions = document.getElementById('moduleActions');
    
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    try {
        let markdownFile;
        
        if (currentPage === 'index.html' || currentPage === '') {
            markdownFile = 'README.md';
        } else {
            const moduleNum = getModuleNumber();
            if (moduleNum) {
                const moduleConfig = CONFIG.modules[moduleNum - 1];
                markdownFile = moduleConfig.file;
                setupModuleNavigation(moduleNum);
            }
        }
        
        if (markdownFile) {
            const content = await loadMarkdown(markdownFile);
            const html = marked.parse(content);
            
            if (loadingSpinner) {
                loadingSpinner.style.display = 'none';
            }
            
            contentBody.innerHTML = html;
            
            // Apply syntax highlighting
            Prism.highlightAllUnder(contentBody);
            
            // Show module actions if on a module page
            if (moduleActions && getModuleNumber()) {
                moduleActions.style.display = 'flex';
            }
        }
    } catch (error) {
        console.error('Error loading content:', error);
        contentBody.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <h2 style="color: var(--accent-warning);">⚠️ Content Loading Error</h2>
                <p style="color: var(--text-secondary);">Unable to load the requested content. Please try refreshing the page.</p>
            </div>
        `;
    }
}

async function loadMarkdown(filename) {
    const response = await fetch(`${CONFIG.markdownPath}${filename}`);
    if (!response.ok) {
        throw new Error(`Failed to load ${filename}`);
    }
    return await response.text();
}

function setupModuleNavigation(currentModule) {
    const prevBtn = document.getElementById('prevModule');
    const nextBtn = document.getElementById('nextModule');
    
    if (currentModule > 1 && prevBtn) {
        prevBtn.style.display = 'inline-flex';
        prevBtn.href = `module${currentModule - 1}.html`;
    }
    
    if (currentModule < CONFIG.modules.length && nextBtn) {
        nextBtn.style.display = 'inline-flex';
        nextBtn.href = `module${currentModule + 1}.html`;
    }
}

// ========================================
// SEARCH FUNCTIONALITY
// ========================================

function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    
    if (!searchInput) return;
    
    let searchTimeout;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        if (query.length < 2) {
            searchResults.classList.remove('active');
            return;
        }
        
        searchTimeout = setTimeout(() => {
            performSearch(query);
        }, 300);
    });
    
    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.remove('active');
        }
    });
}

async function preloadModuleContent() {
    // Load all module content for searching
    for (const module of CONFIG.modules) {
        try {
            const content = await loadMarkdown(module.file);
            moduleContent[module.id] = content;
            indexModuleContent(module.id, module.title, content);
        } catch (error) {
            console.error(`Failed to preload module ${module.id}:`, error);
        }
    }
    
    // Also load README
    try {
        const readmeContent = await loadMarkdown('README.md');
        moduleContent['home'] = readmeContent;
        indexModuleContent('home', 'Home', readmeContent);
    } catch (error) {
        console.error('Failed to preload README:', error);
    }
}

function indexModuleContent(moduleId, moduleTitle, content) {
    // Split content into searchable chunks (paragraphs and headings)
    const lines = content.split('\n');
    let currentSection = '';
    
    lines.forEach((line, index) => {
        // Check if it's a heading
        if (line.match(/^#{1,6}\s/)) {
            currentSection = line.replace(/^#{1,6}\s/, '').trim();
        }
        
        // Index substantial paragraphs
        if (line.length > 50 && !line.match(/^[#`\-\*]/)) {
            searchIndex.push({
                moduleId,
                moduleTitle,
                section: currentSection,
                content: line.trim(),
                index
            });
        }
    });
}

function performSearch(query) {
    const searchResults = document.getElementById('searchResults');
    const lowerQuery = query.toLowerCase();
    
    // Search through indexed content
    const results = searchIndex.filter(item => {
        return item.content.toLowerCase().includes(lowerQuery) ||
               item.section.toLowerCase().includes(lowerQuery);
    }).slice(0, 10); // Limit to top 10 results
    
    if (results.length === 0) {
        searchResults.innerHTML = `
            <div class="search-result-item">
                <div class="search-result-excerpt" style="text-align: center; color: var(--text-muted);">
                    No results found for "${query}"
                </div>
            </div>
        `;
    } else {
        searchResults.innerHTML = results.map(result => {
            const excerpt = highlightQuery(result.content, query);
            const moduleLink = result.moduleId === 'home' ? 'index.html' : `module${result.moduleId}.html`;
            
            return `
                <div class="search-result-item" onclick="window.location.href='${moduleLink}'">
                    <div class="search-result-title">${result.section || 'Content'}</div>
                    <div class="search-result-excerpt">${excerpt}</div>
                    <div class="search-result-module">📖 ${result.moduleTitle}</div>
                </div>
            `;
        }).join('');
    }
    
    searchResults.classList.add('active');
}

function highlightQuery(text, query) {
    const maxLength = 150;
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);
    
    if (index === -1) {
        return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
    }
    
    // Extract context around the match
    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + query.length + 50);
    let excerpt = text.substring(start, end);
    
    if (start > 0) excerpt = '...' + excerpt;
    if (end < text.length) excerpt = excerpt + '...';
    
    // Highlight the query
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    excerpt = excerpt.replace(regex, '<mark style="background: var(--accent-warning); color: var(--text-primary); padding: 2px 4px; border-radius: 3px;">$1</mark>');
    
    return excerpt;
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

// Configure marked.js for better rendering
if (typeof marked !== 'undefined') {
    marked.setOptions({
        breaks: true,
        gfm: true,
        headerIds: true,
        mangle: false
    });
}

// Smooth scroll for anchor links
document.addEventListener('click', (e) => {
    if (e.target.tagName === 'A' && e.target.hash) {
        const targetId = e.target.hash.substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
            e.preventDefault();
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
});

// ========================================
// QUIZ FUNCTIONALITY
// ========================================

const quizData = {
    1: [
        {
            question: "What command shows your current directory location?",
            options: ["ls", "pwd", "cd", "mkdir"],
            correct: 1,
            explanation: "pwd (Print Working Directory) displays the full path of your current location in the filesystem."
        },
        {
            question: "Which command lists all files including hidden ones?",
            options: ["ls", "ls -l", "ls -a", "ls -h"],
            correct: 2,
            explanation: "ls -a shows all files including hidden files (those starting with a dot). You can combine it with -l for detailed view: ls -la"
        },
        {
            question: "What does the tilde (~) represent in Linux?",
            options: ["Root directory", "Home directory", "Current directory", "Parent directory"],
            correct: 1,
            explanation: "The tilde (~) is a shortcut for your home directory, typically /home/username"
        },
        {
            question: "Which command creates a new directory?",
            options: ["touch", "mkdir", "create", "newdir"],
            correct: 1,
            explanation: "mkdir (make directory) creates a new directory. Example: mkdir Documents"
        },
        {
            question: "What does 'man' command do?",
            options: ["Manages files", "Displays manual pages", "Makes directories", "Moves files"],
            correct: 1,
            explanation: "man displays the manual (help) pages for commands. Example: man ls shows help for the ls command"
        }
    ],
    2: [
        {
            question: "What does 'rwx' mean in file permissions?",
            options: ["Run, write, exit", "Read, write, execute", "Read, work, export", "Root, write, execute"],
            correct: 1,
            explanation: "rwx stands for read, write, and execute permissions. These are the three basic permission types in Linux."
        },
        {
            question: "Which command changes file permissions?",
            options: ["chown", "chmod", "chgrp", "perm"],
            correct: 1,
            explanation: "chmod (change mode) is used to change file permissions. Example: chmod 755 file.txt"
        },
        {
            question: "What does permission '755' mean?",
            options: ["Owner: rwx, Group: r-x, Others: r-x", "Everyone: rwx", "Owner: rw-, Others: r--", "Full access to all"],
            correct: 0,
            explanation: "755 means: Owner can read/write/execute (7), Group can read/execute (5), Others can read/execute (5)"
        },
        {
            question: "Which command changes file ownership?",
            options: ["chmod", "chown", "owner", "permission"],
            correct: 1,
            explanation: "chown (change owner) changes the owner of a file. Example: chown user:group file.txt"
        },
        {
            question: "What is a symbolic link?",
            options: ["A copy of a file", "A shortcut to a file", "A compressed file", "A hidden file"],
            correct: 1,
            explanation: "A symbolic link (symlink) is like a shortcut - it points to another file or directory. Created with: ln -s target link"
        }
    ],
    3: [
        {
            question: "What does 'grep' command do?",
            options: ["Groups files", "Searches for patterns in text", "Generates reports", "Grabs files"],
            correct: 1,
            explanation: "grep searches for patterns in text files. Example: grep 'error' logfile.txt finds all lines containing 'error'"
        },
        {
            question: "Which command is used to edit text with sed?",
            options: ["sed 's/old/new/'", "sed -e old new", "sed replace old new", "sed change"],
            correct: 0,
            explanation: "sed 's/old/new/' substitutes 'old' with 'new' in text. The 's' stands for substitute."
        },
        {
            question: "What does '#!/bin/bash' at the start of a script mean?",
            options: ["A comment", "Shebang line specifying the interpreter", "A command", "An error"],
            correct: 1,
            explanation: "#!/bin/bash is the shebang line that tells the system to use bash to execute the script."
        },
        {
            question: "How do you make a script executable?",
            options: ["run script.sh", "chmod +x script.sh", "execute script.sh", "bash script.sh"],
            correct: 1,
            explanation: "chmod +x script.sh adds execute permission to the script, allowing it to be run directly with ./script.sh"
        },
        {
            question: "What does the pipe (|) operator do?",
            options: ["Separates commands", "Passes output to input", "Creates backups", "Deletes files"],
            correct: 1,
            explanation: "The pipe (|) passes the output of one command as input to another. Example: ls | grep txt"
        }
    ],
    4: [
        {
            question: "Which command adds a new user?",
            options: ["newuser", "adduser", "useradd", "Both b and c"],
            correct: 3,
            explanation: "Both useradd and adduser create new users. adduser is more user-friendly (interactive), while useradd is lower-level."
        },
        {
            question: "What does 'ps aux' show?",
            options: ["Available users", "All running processes", "Auxiliary files", "System packages"],
            correct: 1,
            explanation: "ps aux displays all running processes with detailed information including CPU and memory usage."
        },
        {
            question: "Which command kills a process by name?",
            options: ["kill", "pkill", "stop", "end"],
            correct: 1,
            explanation: "pkill terminates processes by name. kill requires the process ID (PID)."
        },
        {
            question: "What does 'sudo' allow you to do?",
            options: ["Super do - speed up commands", "Execute commands as superuser", "Shut down system", "Show user details"],
            correct: 1,
            explanation: "sudo (superuser do) allows authorized users to execute commands with root/administrator privileges."
        },
        {
            question: "Which file contains user account information?",
            options: ["/etc/users", "/etc/passwd", "/home/users", "/var/users"],
            correct: 1,
            explanation: "/etc/passwd contains user account information including usernames, UIDs, home directories, and default shells."
        }
    ],
    5: [
        {
            question: "Which command shows network interfaces?",
            options: ["ifconfig", "ip addr", "netstat", "Both a and b"],
            correct: 3,
            explanation: "Both ifconfig (older) and ip addr (modern) display network interface information. 'ip addr' is recommended for newer systems."
        },
        {
            question: "What does SSH stand for?",
            options: ["System Shell", "Secure Shell", "Super Shell", "Safe Shell Host"],
            correct: 1,
            explanation: "SSH (Secure Shell) is a protocol for secure remote access to systems over a network."
        },
        {
            question: "Which command tests network connectivity?",
            options: ["test", "ping", "connect", "nettest"],
            correct: 1,
            explanation: "ping tests network connectivity by sending ICMP packets to a target host. Example: ping google.com"
        },
        {
            question: "What is the default SSH port?",
            options: ["21", "22", "23", "80"],
            correct: 1,
            explanation: "Port 22 is the default port for SSH connections. It can be changed in /etc/ssh/sshd_config for security."
        },
        {
            question: "Which command configures the firewall on Ubuntu?",
            options: ["firewall", "iptables", "ufw", "firewalld"],
            correct: 2,
            explanation: "ufw (Uncomplicated Firewall) is the default firewall configuration tool on Ubuntu, providing a simple interface to iptables."
        }
    ],
    6: [
        {
            question: "Which command updates package lists on Ubuntu?",
            options: ["apt update", "apt upgrade", "apt install", "apt refresh"],
            correct: 0,
            explanation: "apt update refreshes the package lists from repositories, showing what updates are available."
        },
        {
            question: "What does 'systemctl' manage?",
            options: ["System calls", "Services and systemd", "System control panel", "CPU cycles"],
            correct: 1,
            explanation: "systemctl is used to manage systemd services, controlling service start, stop, enable, disable, and status."
        },
        {
            question: "Which command schedules recurring tasks?",
            options: ["schedule", "cron", "task", "timer"],
            correct: 1,
            explanation: "cron schedules recurring tasks. Use 'crontab -e' to edit your cron jobs."
        },
        {
            question: "Where are system logs typically stored?",
            options: ["/var/logs", "/var/log", "/etc/logs", "/home/logs"],
            correct: 1,
            explanation: "/var/log is the standard directory for system logs. Important logs include syslog, auth.log, and application-specific logs."
        },
        {
            question: "Which command shows system service logs?",
            options: ["syslog", "logview", "journalctl", "servicelog"],
            correct: 2,
            explanation: "journalctl queries and displays logs from systemd's journal. Example: journalctl -u nginx shows nginx service logs."
        }
    ]
};

function initQuiz() {
    const moduleNum = getModuleNumber();
    if (!moduleNum || !quizData[moduleNum]) return;
    
    // Check if quiz already exists
    if (document.querySelector('.quiz-container')) return;
    
    const contentBody = document.getElementById('contentBody');
    if (!contentBody) return;
    
    // Wait for content to load
    setTimeout(() => {
        createQuiz(moduleNum, quizData[moduleNum]);
    }, 1000);
}

function createQuiz(moduleNum, questions) {
    const quizHTML = `
        <div class="quiz-container" id="quiz-${moduleNum}">
            <div class="quiz-header">
                <h2 class="quiz-title">📝 Module ${moduleNum} Quiz</h2>
                <p class="quiz-description">Test your knowledge! Select the best answer for each question.</p>
                <div class="quiz-stats">
                    <div class="quiz-stat">
                        <span class="quiz-stat-label">Questions</span>
                        <span class="quiz-stat-value">${questions.length}</span>
                    </div>
                    <div class="quiz-stat">
                        <span class="quiz-stat-label">Score</span>
                        <span class="quiz-stat-value" id="quiz-score-${moduleNum}">0/${questions.length}</span>
                    </div>
                </div>
            </div>
            
            <div id="quiz-questions-${moduleNum}">
                ${questions.map((q, index) => createQuestionHTML(moduleNum, q, index)).join('')}
            </div>
            
            <div class="quiz-actions">
                <button class="quiz-btn quiz-btn-secondary" id="quiz-reset-${moduleNum}">
                    🔄 Reset Quiz
                </button>
                <button class="quiz-btn quiz-btn-primary" id="quiz-submit-${moduleNum}">
                    ✓ Submit Quiz
                </button>
            </div>
            
            <div class="quiz-results" id="quiz-results-${moduleNum}">
                <div class="results-score" id="results-score-text-${moduleNum}">0%</div>
                <div class="results-message" id="results-message-${moduleNum}">Great job!</div>
                <div class="results-details">
                    <div class="result-detail">
                        <div class="result-detail-value correct" id="results-correct-${moduleNum}">0</div>
                        <div class="result-detail-label">Correct</div>
                    </div>
                    <div class="result-detail">
                        <div class="result-detail-value incorrect" id="results-incorrect-${moduleNum}">0</div>
                        <div class="result-detail-label">Incorrect</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const contentBody = document.getElementById('contentBody');
    contentBody.insertAdjacentHTML('beforeend', quizHTML);
    
    // Add event listeners
    document.getElementById(`quiz-submit-${moduleNum}`).addEventListener('click', () => submitQuiz(moduleNum, questions));
    document.getElementById(`quiz-reset-${moduleNum}`).addEventListener('click', () => resetQuiz(moduleNum, questions));
    
    // Add listeners to each option
    questions.forEach((q, index) => {
        q.options.forEach((opt, optIndex) => {
            const radio = document.getElementById(`q${moduleNum}-${index}-${optIndex}`);
            const option = document.getElementById(`option-${moduleNum}-${index}-${optIndex}`);
            
            if (radio && option) {
                radio.addEventListener('change', () => selectOption(moduleNum, index, optIndex));
                option.addEventListener('click', () => {
                    radio.checked = true;
                    selectOption(moduleNum, index, optIndex);
                });
            }
        });
    });
}

function createQuestionHTML(moduleNum, question, index) {
    return `
        <div class="quiz-question" id="question-${moduleNum}-${index}">
            <div class="question-header">
                <div class="question-number">${index + 1}</div>
                <div class="question-text">${question.question}</div>
            </div>
            <div class="quiz-options">
                ${question.options.map((option, optIndex) => `
                    <div class="quiz-option" id="option-${moduleNum}-${index}-${optIndex}">
                        <input type="radio" 
                               id="q${moduleNum}-${index}-${optIndex}" 
                               name="q${moduleNum}-${index}" 
                               value="${optIndex}">
                        <label for="q${moduleNum}-${index}-${optIndex}">${option}</label>
                        <div class="option-icon">✓</div>
                    </div>
                `).join('')}
            </div>
            <div class="question-feedback" id="feedback-${moduleNum}-${index}">
                <div class="feedback-title"></div>
                <div class="feedback-text">${question.explanation}</div>
            </div>
        </div>
    `;
}

function selectOption(moduleNum, questionIndex, optionIndex) {
    // Remove selected class from all options in this question
    const options = document.querySelectorAll(`#question-${moduleNum}-${questionIndex} .quiz-option`);
    options.forEach(opt => opt.classList.remove('selected'));
    
    // Add selected class to clicked option
    const selectedOption = document.getElementById(`option-${moduleNum}-${questionIndex}-${optionIndex}`);
    if (selectedOption) {
        selectedOption.classList.add('selected');
    }
}

function submitQuiz(moduleNum, questions) {
    let correct = 0;
    let answered = 0;
    
    questions.forEach((q, index) => {
        const selected = document.querySelector(`input[name="q${moduleNum}-${index}"]:checked`);
        
        if (selected) {
            answered++;
            const selectedValue = parseInt(selected.value);
            const isCorrect = selectedValue === q.correct;
            
            if (isCorrect) correct++;
            
            // Show feedback
            showFeedback(moduleNum, index, isCorrect);
            
            // Disable all options
            const options = document.querySelectorAll(`#question-${moduleNum}-${index} .quiz-option`);
            options.forEach((opt, optIndex) => {
                opt.classList.add('disabled');
                const radio = opt.querySelector('input');
                radio.disabled = true;
                
                if (optIndex === q.correct) {
                    opt.classList.add('correct');
                } else if (optIndex === selectedValue && !isCorrect) {
                    opt.classList.add('incorrect');
                }
            });
        }
    });
    
    if (answered < questions.length) {
        alert(`Please answer all ${questions.length} questions before submitting!`);
        return;
    }
    
    // Update score display
    document.getElementById(`quiz-score-${moduleNum}`).textContent = `${correct}/${questions.length}`;
    
    // Show results
    showResults(moduleNum, correct, questions.length);
    
    // Disable submit button
    document.getElementById(`quiz-submit-${moduleNum}`).disabled = true;
}

function showFeedback(moduleNum, index, isCorrect) {
    const feedback = document.getElementById(`feedback-${moduleNum}-${index}`);
    const question = document.getElementById(`question-${moduleNum}-${index}`);
    const title = feedback.querySelector('.feedback-title');
    
    feedback.classList.add('show', isCorrect ? 'correct' : 'incorrect');
    question.classList.add(isCorrect ? 'answered-correct' : 'answered-incorrect');
    title.classList.add(isCorrect ? 'correct' : 'incorrect');
    title.innerHTML = isCorrect ? '✓ Correct!' : '✗ Incorrect';
}

function showResults(moduleNum, correct, total) {
    const percentage = Math.round((correct / total) * 100);
    const results = document.getElementById(`quiz-results-${moduleNum}`);
    const scoreText = document.getElementById(`results-score-text-${moduleNum}`);
    const message = document.getElementById(`results-message-${moduleNum}`);
    const correctCount = document.getElementById(`results-correct-${moduleNum}`);
    const incorrectCount = document.getElementById(`results-incorrect-${moduleNum}`);
    
    results.classList.add('show');
    scoreText.textContent = `${percentage}%`;
    correctCount.textContent = correct;
    incorrectCount.textContent = total - correct;
    
    if (percentage >= 90) {
        message.textContent = '🎉 Outstanding! You\'ve mastered this module!';
    } else if (percentage >= 70) {
        message.textContent = '👍 Great job! You have a solid understanding!';
    } else if (percentage >= 50) {
        message.textContent = '📚 Good effort! Review the material and try again.';
    } else {
        message.textContent = '💪 Keep learning! Review the module and retake the quiz.';
    }
    
    // Scroll to results
    results.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function resetQuiz(moduleNum, questions) {
    // Reset all questions
    questions.forEach((q, index) => {
        const question = document.getElementById(`question-${moduleNum}-${index}`);
        const feedback = document.getElementById(`feedback-${moduleNum}-${index}`);
        const options = document.querySelectorAll(`#question-${moduleNum}-${index} .quiz-option`);
        const radios = document.querySelectorAll(`input[name="q${moduleNum}-${index}"]`);
        
        // Reset question styling
        question.classList.remove('answered-correct', 'answered-incorrect');
        
        // Reset feedback
        feedback.classList.remove('show', 'correct', 'incorrect');
        feedback.querySelector('.feedback-title').classList.remove('correct', 'incorrect');
        
        // Reset options
        options.forEach(opt => {
            opt.classList.remove('selected', 'correct', 'incorrect', 'disabled');
        });
        
        // Reset radios
        radios.forEach(radio => {
            radio.checked = false;
            radio.disabled = false;
        });
    });
    
    // Reset score
    document.getElementById(`quiz-score-${moduleNum}`).textContent = `0/${questions.length}`;
    
    // Hide results
    document.getElementById(`quiz-results-${moduleNum}`).classList.remove('show');
    
    // Enable submit button
    document.getElementById(`quiz-submit-${moduleNum}`).disabled = false;
    
    // Scroll to top of quiz
    document.getElementById(`quiz-${moduleNum}`).scrollIntoView({ behavior: 'smooth' });
}

// ========================================
// ANALYTICS & TRACKING (Optional)
// ========================================

// Track page views
function trackPageView() {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    console.log('Page viewed:', page);
    // Add your analytics code here (Google Analytics, etc.)
}

// Track module completion
function trackModuleCompletion(moduleNum) {
    console.log('Module completed:', moduleNum);
    // Add your analytics code here
}

// Call on page load
trackPageView();
