// Initialize Mermaid
console.log("Portfolio Script Loaded - Version 1.4");
mermaid.initialize({ 
    startOnLoad: false, 
    theme: 'dark',
    securityLevel: 'loose',
    logLevel: 'debug'
});

// Global State
let KNOWLEDGE_BASE = {};
let isModelReady = false;
let isModelLoading = false;
let isGenerating = false;
let workerResolve = null;

// Initialize Web Worker with error handling for local file protocol
let aiWorker = null;
try {
    if (window.location.protocol === 'file:') {
        console.warn("Web Workers (AI Assistant) are disabled when running via file:// due to browser security.");
    } else {
        aiWorker = new Worker('worker.js', { type: 'module' });
        aiWorker.onmessage = (e) => {
            const { type, data } = e.data;
            if (type === 'status' && data === 'ready') {
                isModelReady = true;
                const statusDot = document.getElementById('ai-status-dot');
                if (statusDot) {
                    statusDot.className = 'ai-status-dot online';
                    statusDot.title = 'Online';
                }
                if (workerResolve) {
                    workerResolve(true);
                    workerResolve = null;
                }
            } else if (type === 'result') {
                if (workerResolve) {
                    workerResolve(data);
                    workerResolve = null;
                }
            } else if (type === 'error') {
                console.error('Worker error:', data);
                if (workerResolve) {
                    workerResolve(null);
                    workerResolve = null;
                }
            }
        };
    }
} catch (e) {
    console.error("Failed to initialize AI Worker:", e);
}

async function callWorker(type, data) {
    if (!aiWorker) return null;
    return new Promise((resolve) => {
        workerResolve = resolve;
        aiWorker.postMessage({ type, data });
    });
}

// --- Global Functions ---

async function openDiagram(projectName, btn, event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    const diagramFile = btn.getAttribute('data-diagram');
    
    const modal = document.getElementById('diagram-modal');
    const modalTitle = document.getElementById('modal-title');
    const imageContainer = document.getElementById('image-container');
    const mermaidContainer = document.getElementById('mermaid-container');

    if (modalTitle) modalTitle.innerText = `${projectName} - System Design`;
    if (imageContainer) imageContainer.style.display = 'none';
    if (mermaidContainer) {
        mermaidContainer.style.display = 'flex';
        mermaidContainer.innerHTML = 'Loading diagram...';
    }
    if (modal) modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; 

    try {
        if (window.location.protocol === 'file:') {
            throw new Error("Local 'file://' protocol blocks fetching external diagrams. Use a server to view.");
        }

        const response = await fetch(`diagrams/${diagramFile}.mmd`);
        if (!response.ok) throw new Error(`Diagram not found: ${diagramFile}`);
        const architecture = await response.text();
        
        if (mermaidContainer) {
            mermaidContainer.removeAttribute('data-processed');
            mermaidContainer.innerHTML = architecture;
            
            // Modern Mermaid rendering (v10+)
            if (mermaid.run) {
                await mermaid.run({
                    nodes: [mermaidContainer],
                });
            } else {
                mermaid.init(undefined, mermaidContainer);
            }
        }
    } catch (err) {
        console.error('Error loading diagram:', err);
        if (mermaidContainer) {
            mermaidContainer.innerHTML = `<div style="color: #ff4444; padding: 2rem; text-align: center;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i><br>
                ${err.message}
            </div>`;
        }
    }
}

function openScreenshot(projectName, imagePath, event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    const modal = document.getElementById('diagram-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalImage = document.getElementById('modal-image');
    const imageContainer = document.getElementById('image-container');
    const mermaidContainer = document.getElementById('mermaid-container');

    if (modalTitle) modalTitle.innerText = `${projectName} - Screenshot`;
    if (modalImage) modalImage.src = imagePath;
    if (mermaidContainer) {
        mermaidContainer.style.display = 'none';
        mermaidContainer.innerHTML = ''; 
    }
    if (imageContainer) imageContainer.style.display = 'block';
    if (modal) modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; 
}

function closeDiagram() {
    const modal = document.getElementById('diagram-modal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function openWeatherModal(event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    const modal = document.getElementById('weather-modal');
    const iframe = document.getElementById('weather-iframe');
    const link = document.getElementById('weather-site-link');
    const weatherAppUrl = 'https://weathercolt-abhnaggubzdfd4fa.canadacentral-01.azurewebsites.net/'; 

    if (iframe && link && modal) {
        iframe.src = weatherAppUrl;
        link.href = weatherAppUrl;
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function closeWeather() {
    const modal = document.getElementById('weather-modal');
    const iframe = document.getElementById('weather-iframe');

    if (modal && iframe) {
        modal.style.display = 'none';
        iframe.src = '';
        document.body.style.overflow = 'auto';
    }
}

function animateSkills(container) {
    if (!container) return;
    const fills = container.querySelectorAll('.skill-bar-fill');
    fills.forEach(fill => {
        const targetWidth = fill.getAttribute('data-width');
        // Small timeout to trigger CSS transition
        setTimeout(() => {
            fill.style.width = targetWidth;
        }, 50);
    });
}

function toggleSection(sectionId) {
    const content = document.getElementById(sectionId + '-content');
    const toggle = document.getElementById(sectionId + '-toggle');
    if (!content || !toggle) return;
    
    const icon = toggle.querySelector('i');
    
    if (content.classList.contains('expanded')) {
        content.classList.remove('expanded');
        content.classList.add('collapsed');
        if (icon) {
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        }
    } else {
        content.classList.remove('collapsed');
        content.classList.add('expanded');
        if (icon) {
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
        }
        
        if (sectionId === 'skills') {
            animateSkills(content);
        }
    }
}

// Attach to window for global access
window.openDiagram = openDiagram;
window.openScreenshot = openScreenshot;
window.closeDiagram = closeDiagram;
window.openWeatherModal = openWeatherModal;
window.closeWeather = closeWeather;
window.toggleSection = toggleSection;

// UI and Interactivity logic
document.addEventListener('DOMContentLoaded', () => {
    // Skill Animation Observer
    const observerOptions = { 
        threshold: 0.2, // Wait until 20% of the section is visible
        rootMargin: "0px 0px -50px 0px" // Trigger slightly before it hits bottom
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                console.log("Skills section visible, animating bars...");
                animateSkills(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const skillsContent = document.querySelector('#skills-content');
    if (skillsContent) {
        observer.observe(skillsContent);
        
        // Manual check for bars already in view
        const rect = skillsContent.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom >= 0) {
            animateSkills(skillsContent);
        }
    }

    // Mobile Menu Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar-nav');
    
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            const icon = menuToggle.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            }
        });
    }

    // Close sidebar when clicking a link on mobile
    const tocLinks = document.querySelectorAll('.toc-link');
    tocLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 1300 && sidebar) {
                sidebar.classList.remove('active');
                if (menuToggle) {
                    const icon = menuToggle.querySelector('i');
                    if (icon) {
                        icon.classList.add('fa-bars');
                        icon.classList.remove('fa-times');
                    }
                }
            }
        });
    });

    // Active Link Highlighting and Sticky Positioning
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.toc-link');
    const sidebarNav = document.querySelector('.sidebar-nav');
    const header = document.querySelector('header');

    function handleScroll() {
        if (!sidebarNav || !menuToggle) return;
        
        const scrollPos = window.pageYOffset;
        const headerHeight = header ? header.offsetHeight : 500;

        // Show/hide sidebar based on scroll position
        if (scrollPos > headerHeight / 4) {
            sidebarNav.classList.add('visible');
            menuToggle.classList.add('visible');
        } else {
            sidebarNav.classList.remove('visible');
            menuToggle.classList.remove('visible');
        }

        // Handle Sticky Position
        if (window.innerWidth > 1300 && sidebarNav) {
            if (header && scrollPos > headerHeight) {
                sidebarNav.style.top = '10vh';
            } else if (header) {
                sidebarNav.style.top = (headerHeight + 100 - scrollPos) + 'px';
            }
        }

        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (scrollPos >= (sectionTop - 350)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    
    handleScroll();
    setTimeout(handleScroll, 500);

    // AI Chat Initialization
    fetch('knowledge.json')
        .then(response => response.json())
        .then(data => { KNOWLEDGE_BASE = data; })
        .catch(err => console.error('Error loading knowledge base:', err));

    // Modal Close Logic
    const closeModal = document.querySelector('.close-modal');
    if (closeModal) closeModal.onclick = closeDiagram;

    const closeWeatherBtn = document.querySelector('.close-weather-modal');
    if (closeWeatherBtn) closeWeatherBtn.onclick = closeWeather;
});

// Window Global Click handler for Modals
window.onclick = function(event) {
    const diagramModal = document.getElementById('diagram-modal');
    const weatherModal = document.getElementById('weather-modal');
    
    if (event.target == diagramModal) closeDiagram();
    if (event.target == weatherModal) closeWeather();
};

// AI Chat Logic
async function initModel() {
    if (isModelReady || isModelLoading) return;
    if (!aiWorker) {
        addMessage("Local AI Assistant is unavailable via 'file://'.", 'bot');
        return;
    }
    isModelLoading = true;
    
    const statusDot = document.getElementById('ai-status-dot');
    if (statusDot) {
        statusDot.className = 'ai-status-dot initializing';
        statusDot.title = 'Initializing';
    }
    
    addMessage("Hi! I'm Colton's virtual assistant. Waking up my local brain now...", 'bot');
    addMessage("Initializing local AI model (this may take a moment)...", 'bot');
    
    try {
        await callWorker('load');
        addMessage("Local AI is online. I've indexed Colton's portfolio data.", 'bot');
        addMessage("Ask me about his experience with .NET, Kotlin, or his Proxmox lab!", 'bot');
    } catch (err) {
        console.error('Model loading failed:', err);
        addMessage("Local AI failed to load. Falling back to keyword matching.", 'bot');
        if (statusDot) {
            statusDot.className = 'ai-status-dot offline';
            statusDot.title = 'Offline';
        }
    } finally {
        isModelLoading = false;
    }
}

function addMessage(text, sender) {
    const aiMessages = document.getElementById('ai-messages');
    if (!aiMessages) return;
    const msg = document.createElement('div');
    msg.className = `ai-message ${sender}`;
    msg.innerText = text;
    aiMessages.appendChild(msg);
    aiMessages.scrollTop = aiMessages.scrollHeight;
    return msg;
}

async function handleChat() {
    const chatInput = document.getElementById('chat-input');
    const aiMessages = document.getElementById('ai-messages');
    if (!chatInput) return;
    
    const userInput = chatInput.value.trim();
    if (!userInput || isGenerating) return;

    addMessage(userInput, 'user');
    chatInput.value = '';
    isGenerating = true;

    const thinking = document.createElement('div');
    thinking.className = 'ai-message bot';
    thinking.innerText = '...';
    if (aiMessages) {
        aiMessages.appendChild(thinking);
        aiMessages.scrollTop = aiMessages.scrollHeight;
    }

    if (isModelReady) {
        try {
            const contextString = JSON.stringify(KNOWLEDGE_BASE);
            const systemPrompt = KNOWLEDGE_BASE.system_prompt || "You are an AI assistant for Colton Chrane's portfolio.";
            const prompt = `<|im_start|>system\n${systemPrompt}\nContext: ${contextString}<|im_end|>\n<|im_start|>user\n${userInput}<|im_end|>\n<|im_start|>assistant\n`;

            const output = await callWorker('generate', {
                prompt,
                params: {
                    max_new_tokens: 150,
                    temperature: 0.2,
                    do_sample: true,
                    stop: ["<|im_end|>"]
                }
            });

            if (aiMessages && aiMessages.contains(thinking)) {
                aiMessages.removeChild(thinking);
            }
            
            if (output && output[0]) {
                let response = output[0].generated_text.split('assistant\n')[1] || "I'm having trouble phrasing that.";
                addMessage(response.trim(), 'bot');
            } else {
                addMessage("Something went wrong with the local model.", 'bot');
            }
        } catch (err) {
            console.error('Generation error:', err);
            if (aiMessages && aiMessages.contains(thinking)) {
                aiMessages.removeChild(thinking);
            }
            addMessage("Something went wrong with the local model.", 'bot');
        }
    } else {
        setTimeout(() => {
            if (aiMessages && aiMessages.contains(thinking)) {
                aiMessages.removeChild(thinking);
            }
            let response = "Still loading the local brain... try again in a second!";
            const lowerInput = userInput.toLowerCase();
            for (const key in KNOWLEDGE_BASE) {
                if (typeof KNOWLEDGE_BASE[key] === 'string' && lowerInput.includes(key)) {
                    response = KNOWLEDGE_BASE[key];
                    break;
                }
            }
            addMessage(response, 'bot');
        }, 600);
    }
    isGenerating = false;
}

// Event Listeners for Chat
const chatToggle = document.getElementById('ai-chat-toggle');
if (chatToggle) {
    chatToggle.onclick = () => {
        const chatWindow = document.getElementById('ai-chat-window');
        const chatInput = document.getElementById('chat-input');
        if (!chatWindow) return;
        const isOpen = chatWindow.style.display === 'flex';
        chatWindow.style.display = isOpen ? 'none' : 'flex';
        if (!isOpen) {
            if (chatInput) chatInput.focus();
            initModel();
        }
    };
}

const closeChat = document.getElementById('close-chat');
if (closeChat) {
    closeChat.onclick = () => {
        const chatWindow = document.getElementById('ai-chat-window');
        if (chatWindow) chatWindow.style.display = 'none';
    };
}

const sendChat = document.getElementById('send-chat');
if (sendChat) {
    sendChat.onclick = handleChat;
}

const chatInput = document.getElementById('chat-input');
if (chatInput) {
    chatInput.onkeydown = (e) => { 
        if (e.key === 'Enter') {
            e.preventDefault();
            handleChat();
        }
    };
}
