class GifMemeGenerator {
    constructor() {
        // Singleton pattern
        if (GifMemeGenerator.instance) {
            console.warn('GifMemeGenerator instance already exists');
            return GifMemeGenerator.instance;
        }
        
        console.log('Creating new GifMemeGenerator instance');
        GifMemeGenerator.instance = this;
        
        this.apiKey = localStorage.getItem('tenorApiKey') || '';
        this.selectedGif = null;
        this.gifFrames = [];
        this.currentFrame = 0;
        this.isPlaying = true;
        this.animationId = null;
        this.textOverlays = [];
        this.canvas = null;
        this.ctx = null;
        this.gifWorker = null;
        this.searchState = { query: '', pos: null, prevStack: [], page: 1, lastNextPos: null, limit: 20 };
        this.initialized = false;
        this.eventHandlers = {}; // Track event handlers for cleanup
    this.renderOverlaysInPreview = false; // avoid double render (DOM + canvas)
        
        // Initialize lock variables to prevent duplicate operations
        this._isAddingText = false;
        this._textOperationInProgress = false;
        
        this.init();
    }

    setupEmojiPicker() {
        const emojiBtn = document.getElementById('emojiBtn');
        const emojiPicker = document.getElementById('emojiPicker');
        const emojiGrid = document.getElementById('emojiGrid');
        const categories = document.querySelectorAll('.emoji-category');
        const textInput = document.getElementById('textInput');

        // Emoji data by category
        const emojiData = {
            smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳'],
            animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴'],
            food: ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨'],
            activities: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤸'],
            travel: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄'],
            objects: ['💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '🪙', '💰', '💳', '💎', '⚖️', '🧰', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🔩', '⚙️', '🧱', '⛓️', '🧲', '🔫', '💣', '🧨', '🪓', '🔪'],
            symbols: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈'],
            flags: ['🏳️', '🏴', '🏁', '🚩', '🏳️‍🌈', '🏳️‍⚧️', '🇺🇸', '🇬🇧', '🇫🇷', '🇩🇪', '🇮🇹', '🇪🇸', '🇵🇹', '🇷🇺', '🇨🇳', '🇯🇵', '🇰🇷', '🇮🇳', '🇧🇷', '🇨🇦', '🇦🇺', '🇲🇽', '🇳🇱', '🇸🇪', '🇳🇴', '🇩🇰', '🇫🇮', '🇵🇱', '🇨🇿', '🇦🇹', '🇨🇭', '🇧🇪']
        };

        // Show/hide emoji picker
        emojiBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = emojiPicker.style.display === 'block';
            emojiPicker.style.display = isVisible ? 'none' : 'block';
            if (!isVisible) {
                this.populateEmojiGrid('smileys', emojiData, emojiGrid, textInput);
            }
        });

        // Category switching
        categories.forEach(category => {
            category.addEventListener('click', () => {
                categories.forEach(c => c.classList.remove('active'));
                category.classList.add('active');
                const categoryName = category.dataset.category;
                this.populateEmojiGrid(categoryName, emojiData, emojiGrid, textInput);
            });
        });

        // Close picker when clicking outside
        document.addEventListener('click', (e) => {
            if (!emojiBtn.contains(e.target) && !emojiPicker.contains(e.target)) {
                emojiPicker.style.display = 'none';
            }
        });

        // Initial population
        this.populateEmojiGrid('smileys', emojiData, emojiGrid, textInput);
    }

    populateEmojiGrid(categoryName, emojiData, emojiGrid, textInput) {
        const emojis = emojiData[categoryName] || [];
        emojiGrid.innerHTML = '';
        
        emojis.forEach(emoji => {
            const button = document.createElement('button');
            button.className = 'emoji-item';
            button.textContent = emoji;
            button.addEventListener('click', () => {
                // Insert emoji at cursor position
                const start = textInput.selectionStart;
                const end = textInput.selectionEnd;
                const text = textInput.value;
                textInput.value = text.substring(0, start) + emoji + text.substring(end);
                textInput.focus();
                textInput.setSelectionRange(start + emoji.length, start + emoji.length);
                
                // Hide picker after selection
                document.getElementById('emojiPicker').style.display = 'none';
            });
            emojiGrid.appendChild(button);
        });
    }

    setupEmojiPicker() {
        // Check if elements exist first
        const emojiBtn = document.getElementById('emojiBtn');
        const emojiPicker = document.getElementById('emojiPicker');
        const emojiGrid = document.getElementById('emojiGrid');
        const categories = document.querySelectorAll('.emoji-category');
        const textInput = document.getElementById('textInput');

        if (!emojiBtn || !emojiPicker || !emojiGrid || !textInput) {
            console.warn('Emoji picker elements not found, skipping setup');
            return;
        }

        console.log('Setting up emoji picker...');

        // Emoji data by category
        const emojiData = {
            smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳'],
            animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴'],
            food: ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨'],
            activities: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤸'],
            travel: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄'],
            objects: ['💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '🪙', '💰', '💳', '💎', '⚖️', '🧰', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🔩', '⚙️', '🧱', '⛓️', '🧲', '🔫', '💣', '🧨', '🪓', '🔪'],
            symbols: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈'],
            flags: ['🏳️', '🏴', '🏁', '🚩', '🏳️‍🌈', '🏳️‍⚧️', '🇺🇸', '🇬🇧', '🇫🇷', '🇩🇪', '🇮🇹', '🇪🇸', '🇵🇹', '🇷🇺', '🇨🇳', '🇯🇵', '🇰🇷', '🇮🇳', '🇧🇷', '🇨🇦', '🇦🇺', '🇲🇽', '🇳🇱', '🇸🇪', '🇳🇴', '🇩🇰', '🇫🇮', '🇵🇱', '🇨🇿', '🇦🇹', '🇨🇭', '🇧🇪']
        };

        // Show/hide emoji picker
        emojiBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('Emoji button clicked');
            const isVisible = emojiPicker.style.display === 'block';
            emojiPicker.style.display = isVisible ? 'none' : 'block';
            if (!isVisible) {
                this.populateEmojiGrid('smileys', emojiData, emojiGrid, textInput);
            }
        });

        // Category switching
        categories.forEach(category => {
            category.addEventListener('click', () => {
                console.log('Category clicked:', category.dataset.category);
                categories.forEach(c => c.classList.remove('active'));
                category.classList.add('active');
                const categoryName = category.dataset.category;
                this.populateEmojiGrid(categoryName, emojiData, emojiGrid, textInput);
            });
        });

        // Close picker when clicking outside
        document.addEventListener('click', (e) => {
            if (!emojiBtn.contains(e.target) && !emojiPicker.contains(e.target)) {
                emojiPicker.style.display = 'none';
            }
        });

        // Initial population
        this.populateEmojiGrid('smileys', emojiData, emojiGrid, textInput);
        console.log('Emoji picker setup complete');
    }

    populateEmojiGrid(categoryName, emojiData, emojiGrid, textInput) {
        console.log('Populating emoji grid for category:', categoryName);
        const emojis = emojiData[categoryName] || [];
        emojiGrid.innerHTML = '';
        
        emojis.forEach(emoji => {
            const button = document.createElement('button');
            button.className = 'emoji-item';
            button.textContent = emoji;
            button.addEventListener('click', (e) => {
                console.log('Emoji clicked:', emoji);
                e.stopPropagation();
                
                // Insert emoji at cursor position
                const start = textInput.selectionStart || 0;
                const end = textInput.selectionEnd || 0;
                const text = textInput.value;
                textInput.value = text.substring(0, start) + emoji + text.substring(end);
                textInput.focus();
                textInput.setSelectionRange(start + emoji.length, start + emoji.length);
                
                // Hide picker after selection
                document.getElementById('emojiPicker').style.display = 'none';
            });
            emojiGrid.appendChild(button);
        });
        
        console.log('Added', emojis.length, 'emojis to grid');
    }

    testEmojiPicker() {
        const emojiBtn = document.getElementById('emojiBtn');
        const emojiPicker = document.getElementById('emojiPicker');
        const textInput = document.getElementById('textInput');
        
        console.log('Testing emoji picker elements:');
        console.log('Emoji button:', emojiBtn ? 'Found' : 'Missing');
        console.log('Emoji picker:', emojiPicker ? 'Found' : 'Missing');
        console.log('Text input:', textInput ? 'Found' : 'Missing');
        
        if (emojiBtn) {
            console.log('Emoji button click listener added');
        }
    }

    // Get canvas position and size relative to the overlay root
    getCanvasRectRelative() {
        const root = document.getElementById('textOverlays');
        const canvasEl = this.canvas;
        const rootRect = root.getBoundingClientRect();
        const canvasRect = canvasEl.getBoundingClientRect();
        return {
            left: canvasRect.left - rootRect.left,
            top: canvasRect.top - rootRect.top,
            width: canvasRect.width,
            height: canvasRect.height
        };
    }

    /**
     * Lightweight validation of a GIF Blob / ArrayBuffer
     * Returns an object with metadata & potential warnings.
     */
    async validateGif(blob) {
        try {
            const buf = blob instanceof Blob ? new Uint8Array(await blob.arrayBuffer()) : new Uint8Array(blob);
            const text = (i,l)=>String.fromCharCode(...buf.slice(i,i+l));
            const out = { ok:true, warnings:[], width:null, height:null, frames:0, hasLoop:false };
            if (buf.length < 20 || text(0,3) !== 'GIF') {
                out.ok = false; out.warnings.push('Not a GIF header'); return out;
            }
            // Logical Screen Descriptor
            out.width = buf[6] | (buf[7]<<8);
            out.height = buf[8] | (buf[9]<<8);
            let p = 10;
            const packed = buf[p++]; // GCTF etc
            const hasGCT = (packed & 0x80) !== 0;
            const gctSize = hasGCT ? 3 * (1 << ((packed & 0x07) + 1)) : 0;
            p += 2; // bg + aspect
            p += gctSize;
            let localPalettes = 0;
            let gceBlocks = 0;
            while (p < buf.length) {
                const b = buf[p++];
                if (b === 0x3B) { // trailer
                    break;
                } else if (b === 0x21) { // extension
                    const label = buf[p++];
                    if (label === 0xF9) { // GCE
                        gceBlocks++;
                        const blockSize = buf[p++];
                        p += blockSize; // skip fields
                        p++; // block terminator
                    } else if (label === 0xFF) { // application extension
                        const blockSize = buf[p++];
                        const appId = text(p, blockSize);
                        p += blockSize;
                        // data sub-blocks
                        while (p < buf.length && buf[p] !== 0) {
                            const sz = buf[p++]; p += sz;
                        }
                        p++; // terminator
                        if (/NETSCAPE/i.test(appId)) out.hasLoop = true;
                    } else {
                        // skip generic extension
                        const blockSize2 = buf[p++]; p += blockSize2;
                        while (p < buf.length && buf[p] !== 0) { const sz = buf[p++]; p += sz; }
                        p++;
                    }
                } else if (b === 0x2C) { // Image descriptor
                    out.frames++;
                    p += 8; // left top width height
                    const packedImg = buf[p++];
                    const hasLCT = (packedImg & 0x80) !== 0;
                    if (hasLCT) {
                        localPalettes++;
                        const lctSize = 3 * (1 << ((packedImg & 0x07) + 1));
                        p += lctSize;
                    }
                    p++; // LZW min code size
                    while (p < buf.length && buf[p] !== 0) { const sz = buf[p++]; p += sz; }
                    p++; // terminator
                } else {
                    // Unknown byte – abort
                    out.warnings.push('Unexpected block 0x'+b.toString(16));
                    break;
                }
            }
            if (!hasGCT) out.warnings.push('No global color table');
            if (localPalettes > 0) out.warnings.push(localPalettes+ ' local color tables');
            if (gceBlocks === 0) out.warnings.push('No Graphic Control Extensions');
            if (!out.hasLoop) out.warnings.push('No NETSCAPE loop extension');
            if (out.frames > 180) out.warnings.push('Large frame count: '+out.frames);
            if (out.warnings.length) out.ok = out.warnings.length < 3; // heuristic
            return out;
        } catch (e) {
            return { ok:false, error:e.message, warnings:['Validate exception'] };
        }
    }

    /** Resolve a usable gif.js worker script URL with preference order:
     * 1. Same-origin gif.worker.js if present
     * 2. Already provided window.__gifWorkerUrl (cached)
     * 3. CDN fallback
     * Returns null if none confidently available.
     */
    getWorkerScriptUrl() {
        if (this._workerUrlChecked) return this._resolvedWorkerUrl || null;
        this._workerUrlChecked = true;
        // Same-origin guess
        const local = `${location.origin}/gif.worker.js`;
        // Heuristic: if page served over http(s) and not a file:// assume reachable; we can't sync check existence without HEAD.
        if (/^https?:/.test(location.origin)) {
            this._resolvedWorkerUrl = local;
        }
        // Allow override via global
        if (window.__gifWorkerUrl) {
            this._resolvedWorkerUrl = window.__gifWorkerUrl;
        }
        // Fallback CDN last
        if (!this._resolvedWorkerUrl) {
            this._resolvedWorkerUrl = 'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js';
        }
        return this._resolvedWorkerUrl;
    }

    init() {
        console.log('Initializing GifMemeGenerator');
        
        // Check if we're on a mobile device first (needed by other methods)
        this.isMobileDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.userAgent.toLowerCase().includes('mobile');
        
        // Check if already initialized to prevent duplicate event handlers
        if (this.initialized) {
            console.warn('GifMemeGenerator already initialized, skipping initialization');
            return;
        }
        
        this.loadApiKey();
        this.setupCanvas();
        this.setupMobileControls();
        this.setupEventListeners();
        this.setupOverlayDeselection();
        
        // Mark as initialized
        this.initialized = true;
    }
    
    setupMobileControls() {
        console.log('Setting up mobile controls');
        
        // Setup "Aa" button for adding text (Instagram style) - MOBILE SPECIFIC HANDLING
        const addTextButton = document.getElementById('mobileAddTextBtn');
        if (addTextButton) {
            // Use a direct method binding and create a wrapping handler 
            // that prevents default behavior but calls our locked addTextOverlay method
            this.handleMobileAddText = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Mobile add text button clicked');
                // Use the same bound method as the desktop button
                if (this.handleAddText) {
                    this.handleAddText();
                } else {
                    console.warn('handleAddText not defined yet, falling back to direct call');
                    this.addTextOverlay();
                }
            };
            this.addSafeEventListener('mobileAddTextBtn', 'click', this.handleMobileAddText, 'mobile-add-text-btn');
            
            // Prevent touchmove on the button to avoid page scrolling when touching it
            this.addSafeEventListener('mobileAddTextBtn', 'touchmove', (e) => {
                e.preventDefault();
            }, 'mobile-add-text-touchmove');
        }
        
        // Setup delete zone
        const deleteZone = document.getElementById('deleteZone');
        if (deleteZone) {
            deleteZone.classList.remove('visible');
        }
        
        // Add mobile-specific class to body if on mobile
        if (this.isMobileDevice) {
            document.body.classList.add('mobile-device');
        }
    }

    // Helper method to safely add event listeners and track them
    addSafeEventListener(elementId, eventType, handler, handlerId) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        // Generate a unique ID for this handler if not provided
        const id = handlerId || `${elementId}-${eventType}`;
        
        // Remove any existing handler with this ID
        if (this.eventHandlers[id]) {
            const oldElement = this.eventHandlers[id].element;
            if (oldElement) {
                oldElement.removeEventListener(eventType, this.eventHandlers[id].handler);
            }
        }
        
        // Store the new handler
        this.eventHandlers[id] = {
            element: element,
            handler: handler
        };
        
        // Add the event listener
        element.addEventListener(eventType, handler);
        
        console.log(`Added event listener: ${id}`);
    }
    
    setupEventListeners() {
        console.log('Setting up event listeners');
        
        // API Key management
        this.addSafeEventListener('saveKeyBtn', 'click', () => this.saveApiKey());
        this.addSafeEventListener('apiKeyInput', 'keypress', (e) => {
            if (e.key === 'Enter') this.saveApiKey();
        });

        // Search functionality
        this.addSafeEventListener('searchBtn', 'click', () => this.searchGifs());
        this.addSafeEventListener('searchInput', 'keypress', (e) => {
            if (e.key === 'Enter') this.searchGifs();
        });
        
        this.addSafeEventListener('prevPageBtn', 'click', () => this.prevSearchPage());
        this.addSafeEventListener('nextPageBtn', 'click', () => this.nextSearchPage());

    // Minimal text actions only
    this.handleAddText = this.addTextOverlay.bind(this);
    this.addSafeEventListener('addTextBtn', 'click', this.handleAddText, 'add-text-btn-click');
    this.addSafeEventListener('clearTextBtn', 'click', () => this.clearAllText());

        // Playback controls
        document.getElementById('playPauseBtn').addEventListener('click', () => this.togglePlayback());
        document.getElementById('prevFrameBtn').addEventListener('click', () => this.previousFrame());
        document.getElementById('nextFrameBtn').addEventListener('click', () => this.nextFrame());

        // GIF generation
        document.getElementById('quickGifBtn').addEventListener('click', () => this.generateQuickGif());
    const compatBtn = document.getElementById('compatGifBtn');
    if (compatBtn) compatBtn.addEventListener('click', () => this.generateCompatGifGlobal());
    }

    loadApiKey() {
        if (this.apiKey) {
            document.getElementById('apiKeyInput').value = this.apiKey;
            document.getElementById('giphyKey').style.display = 'none';
        }
    }

    saveApiKey() {
        const keyInput = document.getElementById('apiKeyInput');
        this.apiKey = keyInput.value.trim();
        
        if (this.apiKey) {
            localStorage.setItem('tenorApiKey', this.apiKey);
            document.getElementById('giphyKey').style.display = 'none';
            this.showMessage('API key saved successfully!', 'success');
        } else {
            this.showMessage('Please enter a valid API key', 'error');
        }
    }

    async searchGifs() {
        if (!this.apiKey) {
            this.showMessage('Please enter your Tenor API key first', 'error');
            document.getElementById('giphyKey').style.display = 'block';
            return;
        }

        const query = document.getElementById('searchInput').value.trim();
        if (!query) {
            this.showMessage('Please enter a search term', 'error');
            return;
        }

        const searchBtn = document.getElementById('searchBtn');
        const originalText = searchBtn.textContent;
        searchBtn.innerHTML = 'Searching... <span class="loading"></span>';
        searchBtn.disabled = true;

        try {
            // Reset pagination state for a new query
            this.searchState = { query, pos: null, prevStack: [], page: 1, lastNextPos: null, limit: 20 };
            await this.fetchSearchPage();
        } catch (error) {
            console.error('Error searching GIFs:', error);
            this.showMessage('Error searching GIFs. Please check your API key and try again.', 'error');
        } finally {
            searchBtn.textContent = originalText;
            searchBtn.disabled = false;
        }
    }

    async fetchSearchPage(posOverride=null) {
        const resultsContainer = document.getElementById('gifResults');
        const pagination = document.getElementById('pagination');
        if (pagination) pagination.style.display = 'none';
        resultsContainer.innerHTML = '<p style="color:#fff;opacity:.8;">Loading…</p>';
    const { query, limit } = this.searchState;
        // Tenor Search v2
        const params = new URLSearchParams({
            key: this.apiKey,
            q: query,
            limit: String(limit),
            media_filter: 'gif',
            ar_range: 'standard',
            client_key: 'memegifgenerator'
        });
        const pos = posOverride !== null ? posOverride : this.searchState.pos;
        if (pos) params.set('pos', pos);
        const response = await fetch(`https://tenor.googleapis.com/v2/search?${params.toString()}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        const results = (data.results || []).map(item => {
            const media = item.media_formats || {};
            const gifUrl = media.gif ? media.gif.url : (media.mediumgif ? media.mediumgif.url : (media.tinygif ? media.tinygif.url : ''));
            const previewUrl = media.tinygif ? media.tinygif.url : gifUrl;
            return {
                id: item.id,
                title: item.content_description || item.title || 'Tenor GIF',
                images: {
                    fixed_height: { url: previewUrl },
                    original: { url: gifUrl }
                }
            };
        }).filter(x => x.images.original.url);
        this.searchState.lastNextPos = data.next || null;
        this.displayGifResults(results);
        this.updatePaginationUI();
    }

    updatePaginationUI() {
        const pagination = document.getElementById('pagination');
        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');
        const pageInfo = document.getElementById('pageInfo');
        const hasResults = document.getElementById('gifResults').children.length > 0;
        if (!pagination) return;
    if (!hasResults) { pagination.style.display = 'none'; return; }
    // Force-show pagination once we have any results
    pagination.style.display = 'flex';
        if (pageInfo) pageInfo.textContent = `Page ${this.searchState.page}`;
        if (prevBtn) prevBtn.disabled = this.searchState.page <= 1;
        if (nextBtn) nextBtn.disabled = !this.searchState.lastNextPos;
    }

    async nextSearchPage() {
        if (!this.searchState.lastNextPos) return;
        // push current pos into stack for prev nav
        this.searchState.prevStack.push(this.searchState.pos);
        this.searchState.pos = this.searchState.lastNextPos;
        this.searchState.page += 1;
        await this.fetchSearchPage();
    }

    async prevSearchPage() {
        if (this.searchState.page <= 1) return;
        const prevPos = this.searchState.prevStack.pop() || null;
        this.searchState.pos = prevPos;
        this.searchState.page = Math.max(1, this.searchState.page - 1);
        await this.fetchSearchPage();
    }

    displayGifResults(gifs) {
        const resultsContainer = document.getElementById('gifResults');
        resultsContainer.innerHTML = '';

        if (gifs.length === 0) {
            resultsContainer.innerHTML = '<p>No GIFs found. Try a different search term.</p>';
            return;
        }

        gifs.forEach(gif => {
            const gifElement = document.createElement('div');
            gifElement.className = 'gif-item fade-in';
            gifElement.innerHTML = `
                <img src="${gif.images.fixed_height.url}" alt="${gif.title}" />
                <p style="margin-top: 8px; font-size: 12px; color: #666;">${gif.title}</p>
            `;
            
            gifElement.addEventListener('click', () => this.selectGif(gif));
            resultsContainer.appendChild(gifElement);
        });
    }

    async selectGif(gif) {
        // When choosing a new GIF we need to fully reset transient state so
        // previously decoded frames, animation loops and overlays don't
        // conflict and cause a blank canvas or mixed frames.
        this.resetForNewGif();
        this.selectedGif = gif;
        const editor = document.getElementById('editorSection');
        editor.style.display = 'block';
        requestAnimationFrame(() => editor.classList.add('active'));
        editor.scrollIntoView({ behavior: 'smooth' });

        await this.loadGifFrames(gif.images.original.url);
        this.showMessage('GIF loaded! Add text and customize your meme.', 'success');
    }

    setupCanvas() {
        this.canvas = document.getElementById('gifCanvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    }

    // Reset state when a new GIF is selected
    resetForNewGif() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.isPlaying = true;
        this.currentFrame = 0;
        this.gifFrames = [];
        this.originalGifUrl = null;
        this.frameDelay = 100;
        this.textOverlays = [];
        const overlayRoot = document.getElementById('textOverlays');
        if (overlayRoot) overlayRoot.innerHTML = '';
        if (this.ctx && this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        // Restore quality preset selection
        this.loadQualityPreset();
    }

    // Load quality preset from localStorage
    loadQualityPreset() {
        const preset = localStorage.getItem('qualityPreset') || 'balanced';
        const sel = document.getElementById('qualityPreset');
        if (sel) sel.value = preset;
        this.qualityPreset = preset;
        // Attach change listener once
        if (!this._qualityBound) {
            this._qualityBound = true;
            if (sel) {
                sel.addEventListener('change', () => {
                    this.qualityPreset = sel.value;
                    localStorage.setItem('qualityPreset', this.qualityPreset);
                    this.showMessage(`Quality preset: ${this.qualityPreset}`, 'info');
                });
            }
        }
    }

    // Determine encoding settings based on frame count and preset
    getEncodingSettings() {
        this.loadQualityPreset();
        const frameCount = this.gifFrames.length || 1;
        const avgDelay = this.gifFrames.reduce((a, f) => a + (f.delay || this.frameDelay || 100), 0) / frameCount;
        const originalFps = 1000 / (avgDelay || 100);

        let baseTargetFps = Math.min(14, Math.round(originalFps));
        if (frameCount > 120) baseTargetFps = Math.min(baseTargetFps, 10);
        if (frameCount > 200) baseTargetFps = Math.min(baseTargetFps, 8);
        if (frameCount > 300) baseTargetFps = Math.min(baseTargetFps, 6);

        let quality = 30; // gif.js: higher number => more compression (skips more pixels)
        let maxEncodeWidth = 320;

        switch (this.qualityPreset) {
            case 'high':
                quality = 20; // less skipping → better quality, bigger file
                maxEncodeWidth = 380;
                baseTargetFps = Math.min(16, Math.max(10, baseTargetFps + 2));
                break;
            case 'economy':
                quality = 40; // more skipping → smaller file
                maxEncodeWidth = frameCount > 150 ? 260 : 280;
                baseTargetFps = Math.max(6, baseTargetFps - 2);
                break;
            default: // balanced
                // leave defaults, slight tweak if huge
                if (frameCount > 200) quality = 35;
        }

        return { targetFps: baseTargetFps, quality, maxEncodeWidth, originalFps, frameCount, preset: this.qualityPreset };
    }

    // Down-sample frames to approximate target FPS, preserving total duration
    optimizeEncodingFrames(frames, targetFps) {
        if (!frames || frames.length === 0) return [];
        const totalDuration = frames.reduce((a, f) => a + (f.delay || 100), 0);
        targetFps = targetFps || 10;
        const interval = 1000 / targetFps;
        const optimized = [];
        let elapsed = 0;
        let nextSampleAt = 0;
        let idx = 0;
        while (nextSampleAt < totalDuration && idx < frames.length) {
            let frame = frames[idx];
            let frameDuration = frame.delay || 100;
            if (elapsed + frameDuration < nextSampleAt && idx < frames.length - 1) {
                elapsed += frameDuration;
                idx++;
                continue;
            }
            optimized.push({ canvas: frame.canvas || frame.image || frame, delay: Math.round(interval) });
            nextSampleAt += interval;
        }
        if (optimized.length < 2 && frames.length >= 2) {
            return [frames[0], frames[Math.floor(frames.length / 2)]];
        }
        return optimized;
    }

    async loadGifFrames(gifUrl) {
        try {
            console.log('Loading GIF frames from:', gifUrl);
            // If a progress element exists in the DOM, update it (best-effort)
            const _p = document.getElementById('progressText');
            if (_p) _p.textContent = 'Extracting GIF frames...';
            console.log('gifuct presence check:', {
                gifuctNS: !!window.gifuct,
                parseGIF: typeof (window.gifuct && window.gifuct.parseGIF) || typeof window.parseGIF,
                decompressFrames: typeof (window.gifuct && window.gifuct.decompressFrames) || typeof window.decompressFrames
            });
            
            // Load the GIF and extract frames
            const response = await fetch(gifUrl);
            const arrayBuffer = await response.arrayBuffer();
            
            // Decode all frames (gifuct-js) or fallback
            await this.extractGifFrames(arrayBuffer, gifUrl);
            
        } catch (error) {
            console.error('Error loading GIF frames:', error);
            // Fallback to single frame
            await this.loadSingleFrameNetwork(gifUrl);
        }
    }
    
    // Load a single frame using a network URL (may taint canvas on some CDNs)
    async loadSingleFrameNetwork(gifUrl) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        return new Promise((resolve, reject) => {
            img.onload = () => {
                // Limit canvas size for performance
                const maxSize = 400;
                const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
                
                this.canvas.width = Math.floor(img.width * scale);
                this.canvas.height = Math.floor(img.height * scale);
                
                // Cache base image into an offscreen canvas to avoid re-decoding
                this.baseCanvas = document.createElement('canvas');
                this.baseCanvas.width = this.canvas.width;
                this.baseCanvas.height = this.canvas.height;
                const bctx = this.baseCanvas.getContext('2d', { willReadFrequently: true });
                bctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
                
                // Draw to visible canvas initially
                this.ctx.drawImage(this.baseCanvas, 0, 0);
                
                // Store as single frame (offscreen canvas)
                this.gifFrames = [this.baseCanvas];
                this.originalGifUrl = gifUrl;
                this.frameDelay = 100; // Default delay
                this.currentFrame = 0;
                
                this.startAnimation();
                resolve();
            };
            
            img.onerror = () => {
                reject(new Error('Failed to load GIF'));
            };
            
            img.src = gifUrl;
        });
    }
    
    async extractGifFrames(arrayBuffer, gifUrl) {
        // Target output size used in editor
        let outW, outH;
        const trySetCanvasSize = (w, h) => {
            const maxSize = 400;
            const scale = Math.min(maxSize / w, maxSize / h, 1);
            outW = Math.floor(w * scale);
            outH = Math.floor(h * scale);
            this.canvas.width = outW;
            this.canvas.height = outH;
        };

        // 1) Try gifuct-js if available
        try {
            const gifuctNS = window.gifuct || window;
            const parseGIF = gifuctNS.parseGIF || window.parseGIF;
            const decompressFrames = gifuctNS.decompressFrames || window.decompressFrames;
            if (parseGIF && decompressFrames) {
                const gif = parseGIF(arrayBuffer);
                const frames = decompressFrames(gif, true);
                if (frames && frames.length) {
                    const w = gif.lsd.width;
                    const h = gif.lsd.height;
                    trySetCanvasSize(w, h);

                    const playCanvas = document.createElement('canvas');
                    playCanvas.width = outW;
                    playCanvas.height = outH;
                    const playCtx = playCanvas.getContext('2d', { willReadFrequently: true });

                    const accumCanvas = document.createElement('canvas');
                    accumCanvas.width = w;
                    accumCanvas.height = h;
                    const accumCtx = accumCanvas.getContext('2d', { willReadFrequently: true });
                    accumCtx.clearRect(0, 0, w, h);

                    const frameCanvas = document.createElement('canvas');
                    frameCanvas.width = w;
                    frameCanvas.height = h;
                    const frameCtx = frameCanvas.getContext('2d', { willReadFrequently: true });

                    const assembledFrames = [];
                    for (const f of frames) {
                        if (f.disposalType === 2) {
                            accumCtx.clearRect(0, 0, w, h);
                        }
                        const imgData = new ImageData(new Uint8ClampedArray(f.patch), f.dims.width, f.dims.height);
                        frameCtx.clearRect(0, 0, w, h);
                        frameCtx.putImageData(imgData, f.dims.left, f.dims.top);
                        accumCtx.drawImage(frameCanvas, 0, 0);

                        playCtx.clearRect(0, 0, outW, outH);
                        playCtx.drawImage(accumCanvas, 0, 0, outW, outH);

                        const snap = document.createElement('canvas');
                        snap.width = outW;
                        snap.height = outH;
                        const sctx = snap.getContext('2d', { willReadFrequently: true });
                        sctx.drawImage(playCanvas, 0, 0);
                        assembledFrames.push({ canvas: snap, delay: Math.max(20, (f.delay || 10) * 10) });
                    }

                    this.gifFrames = assembledFrames;
                    this.currentFrame = 0;
                    this.frameDelay = assembledFrames[0]?.delay || 100;
                    this.originalGifUrl = gifUrl;

                    this.baseCanvas = document.createElement('canvas');
                    this.baseCanvas.width = outW;
                    this.baseCanvas.height = outH;
                    const bctx = this.baseCanvas.getContext('2d', { willReadFrequently: true });
                    bctx.drawImage(assembledFrames[0].canvas, 0, 0, outW, outH);

                    this.startAnimation();
                    return;
                }
            }
            console.warn('gifuct-js not available or returned no frames; trying omggif fallback');
        } catch (e) {
            console.warn('gifuct-js decode failed, trying omggif fallback:', e);
        }

        // 2) Try omggif (GifReader) fallback for full frames
        try {
            const GifReader = window.GifReader || (window.OMGGIF && window.OMGGIF.GifReader);
            if (GifReader) {
                const u8 = new Uint8Array(arrayBuffer);
                const reader = new GifReader(u8);
                const w = reader.width;
                const h = reader.height;
                trySetCanvasSize(w, h);

                const rgba = new Uint8ClampedArray(w * h * 4);
                const snapCanvas = document.createElement('canvas');
                const snapCtx = snapCanvas.getContext('2d', { willReadFrequently: true });
                const assembledFrames = [];

                for (let i = 0; i < reader.numFrames(); i++) {
                    reader.decodeAndBlitFrameRGBA(i, rgba);
                    // put into a source canvas of original size
                    const src = document.createElement('canvas');
                    src.width = w; src.height = h;
                    const sctx = src.getContext('2d', { willReadFrequently: true });
                    const id = new ImageData(rgba, w, h);
                    sctx.putImageData(id, 0, 0);

                    // scale into output size
                    snapCanvas.width = outW; snapCanvas.height = outH;
                    snapCtx.clearRect(0, 0, outW, outH);
                    snapCtx.drawImage(src, 0, 0, outW, outH);

                    const frameCanvas = document.createElement('canvas');
                    frameCanvas.width = outW; frameCanvas.height = outH;
                    const fctx = frameCanvas.getContext('2d', { willReadFrequently: true });
                    fctx.drawImage(snapCanvas, 0, 0);

                    const info = reader.frameInfo ? reader.frameInfo(i) : { delay: 10 };
                    const delayMs = Math.max(20, (info.delay || 10) * 10);
                    assembledFrames.push({ canvas: frameCanvas, delay: delayMs });
                }

                this.gifFrames = assembledFrames;
                this.currentFrame = 0;
                this.frameDelay = assembledFrames[0]?.delay || 100;
                this.originalGifUrl = gifUrl;

                this.baseCanvas = document.createElement('canvas');
                this.baseCanvas.width = outW;
                this.baseCanvas.height = outH;
                const bctx2 = this.baseCanvas.getContext('2d', { willReadFrequently: true });
                bctx2.drawImage(assembledFrames[0].canvas, 0, 0, outW, outH);

                this.startAnimation();
                return;
            }
            console.warn('omggif not available; falling back to single frame');
        } catch (e2) {
            console.warn('omggif decode failed; falling back to single frame:', e2);
        }

        // 3) Last resort: single frame
        await this.loadSingleFrameNetwork(gifUrl);
    }

    // Load a single frame from a same-origin Blob/ObjectURL; safe for canvas readback
    async loadSingleFrameFromObjectUrl(objectUrl, originalUrl) {
        const img = new Image();
        // crossOrigin not required for blob URLs, but harmless
        img.crossOrigin = 'anonymous';
        
        return new Promise((resolve, reject) => {
            img.onload = () => {
                const maxSize = 400;
                const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
                
                this.canvas.width = Math.floor(img.width * scale);
                this.canvas.height = Math.floor(img.height * scale);
                
                // Cache into offscreen base canvas
                this.baseCanvas = document.createElement('canvas');
                this.baseCanvas.width = this.canvas.width;
                this.baseCanvas.height = this.canvas.height;
                const bctx = this.baseCanvas.getContext('2d', { willReadFrequently: true });
                bctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
                
                // Draw to visible canvas
                this.ctx.drawImage(this.baseCanvas, 0, 0);
                
                // Use baseCanvas as the single frame
                this.gifFrames = [this.baseCanvas];
                this.originalGifUrl = originalUrl;
                this.frameDelay = 100;
                this.currentFrame = 0;
                
                this.startAnimation();
                resolve();
            };
            img.onerror = () => reject(new Error('Failed to load GIF from blob URL'));
            img.src = objectUrl;
        });
    }

    startAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        let lastTs = performance.now();
        let carry = 0;

        const animate = (ts) => {
            if (!ts) ts = performance.now();
            const dt = ts - lastTs;
            lastTs = ts;

            if (this.isPlaying && this.gifFrames.length > 0) {
                carry += dt;
                const f = this.gifFrames[this.currentFrame % this.gifFrames.length];
                const delay = Math.max(20, f.delay || this.frameDelay || 100);
                if (carry >= delay) {
                    carry = carry % delay;
                    this.currentFrame = (this.currentFrame + 1) % this.gifFrames.length;
                }
                this.drawCurrentFrame();
            }
            this.animationId = requestAnimationFrame(animate);
        };

        this.animationId = requestAnimationFrame(animate);
    }

    drawCurrentFrame() {
        if (!this.gifFrames.length) return;

        const f = this.gifFrames[this.currentFrame % this.gifFrames.length];
        const img = (f && (f.canvas || f.image)) ? (f.canvas || f.image) : f;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (img && (img instanceof HTMLCanvasElement || img instanceof HTMLImageElement)) {
            this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
        } else {
            // Skip drawing if frame is not drawable yet
            return;
        }
        
        // Only draw overlays to canvas if preview flag enabled
        if (this.renderOverlaysInPreview) {
            this.textOverlays.forEach(overlay => {
                this.drawText(overlay);
            });
        }
    }

    drawText(overlay) {
        this.ctx.save();
        
        const fontSize = overlay.fontSize || 24;
        const fontFamily = overlay.fontFamily || 'Impact, Arial, sans-serif';
        const bold = overlay.bold ? 'bold ' : '';
        
        // Apply rotation if specified
        if (overlay.rotation) {
            this.ctx.translate(overlay.x, overlay.y);
            this.ctx.rotate(overlay.rotation * Math.PI / 180);
            this.ctx.translate(-overlay.x, -overlay.y);
        }
        
        this.ctx.font = `${bold}${fontSize}px ${fontFamily}`;
        
        // Handle special text styles
        if (overlay.style === 'gradient') {
            // Create gradient
            const gradient = this.ctx.createLinearGradient(
                overlay.x - fontSize * 2, overlay.y, 
                overlay.x + fontSize * 2, overlay.y
            );
            gradient.addColorStop(0, '#ff0080');
            gradient.addColorStop(0.2, '#ff8c00');
            gradient.addColorStop(0.4, '#ffed00');
            gradient.addColorStop(0.6, '#00ff80');
            gradient.addColorStop(0.8, '#00bfff');
            gradient.addColorStop(1, '#8000ff');
            this.ctx.fillStyle = gradient;
        } else if (overlay.style === 'neon') {
            // Create neon glow effect
            this.ctx.shadowColor = overlay.color || '#ffffff';
            this.ctx.shadowBlur = fontSize / 3;
            this.ctx.fillStyle = overlay.color || '#ffffff';
        } else {
            // Regular text
            this.ctx.fillStyle = overlay.color || '#ffffff';
        }
        
        this.ctx.strokeStyle = overlay.strokeColor || '#000000';
        this.ctx.lineWidth = overlay.strokeWidth || 2;
    this.ctx.textAlign = overlay.alignment || overlay.align || 'center';
        this.ctx.textBaseline = 'middle';
        
        // Apply opacity if specified
        if (overlay.opacity !== undefined && overlay.opacity !== 1) {
            this.ctx.globalAlpha = overlay.opacity;
        }
        
        // Draw stroke (outline)
        if (overlay.strokeWidth > 0) {
            this.ctx.strokeText(overlay.text, overlay.x, overlay.y);
        }
        
        // Draw fill
        this.ctx.fillText(overlay.text, overlay.x, overlay.y);
        
        this.ctx.restore();
    }

    addTextOverlay() {
        console.log('addTextOverlay called with stack:', new Error().stack);
        
        // Implement a lock mechanism to prevent concurrent executions
        if (this._isAddingText === true) {
            console.warn('Text addition already in progress, ignoring duplicate call');
            return;
        }
        
        // Set lock
        this._isAddingText = true;
            
    if (!this.selectedGif) {
            this.showMessage('Please select a GIF first', 'error');
            this._isAddingText = false; // Release lock
            return;
        }
    const text = 'Tap to edit';


        try {
            // Generate a unique ID based on timestamp and a random number
            const uniqueId = Date.now() + '-' + Math.floor(Math.random() * 1000);
            
            console.log('Creating text overlay with ID:', uniqueId);
            
            const overlay = {
                id: uniqueId,
                text: text,
                x: this.canvas.width / 2,
                y: this.canvas.height / 2,
                fontSize: 28,
                color: '#ffffff',
                fontFamily: 'Impact, Charcoal, sans-serif',
                bold: true,
                strokeWidth: 3,
                strokeColor: '#000000',
                rotation: 0,
                style: 'normal',
                align: 'center',
                hasBg: false,
                opacity: 1
            };

            this.textOverlays.push(overlay);
            this.createTextOverlayElement(overlay);
            // No input to clear in minimal UI
            
            // Optionally just select (do not open editor automatically)
            const lastAddedElement = document.querySelector(`.text-overlay[data-id="${overlay.id}"]`);
            if (lastAddedElement) {
                this.selectTextOverlay(lastAddedElement, overlay); // no inline edit call
            }

            this.showMessage('Text added. Double click or tap to edit.', 'success');
        } catch (err) {
            console.error('Error adding text overlay:', err);
            this.showMessage('Error adding text. Please try again.', 'error');
        } finally {
            // Always release the lock, even if there's an error
            setTimeout(() => {
                console.log('Releasing text addition lock');
                this._isAddingText = false;
            }, 500); // Short delay to prevent any rapid consecutive calls
        }
    }

    createTextOverlayElement(overlay) {
        const overlayElement = document.createElement('div');
        overlayElement.className = 'text-overlay';
        overlayElement.setAttribute('data-id', overlay.id);
    overlayElement.style.overflow = 'hidden';

        // Create visible text element (Instagram style)
        const textElement = document.createElement('div');
        textElement.className = 'overlay-text';
        textElement.textContent = overlay.text;
        
        // Initialize properties if not set
        overlay.align = overlay.align || 'center';
        overlay.hasBg = overlay.hasBg || false;
        
        // Apply Instagram-like styling
        const bold = overlay.bold ? 'bold ' : '';
    textElement.style.fontSize = `${overlay.fontSize}px`;
    textElement.style.fontFamily = overlay.fontFamily;
    textElement.style.fontWeight = overlay.bold ? 'bold' : 'normal';
    textElement.style.color = overlay.color;
    textElement.style.textAlign = overlay.align || 'center';
    textElement.style.opacity = overlay.opacity || 1;
    textElement.style.padding = '8px';
    textElement.style.width = '100%';
    textElement.style.height = '100%';
    textElement.style.display = 'flex';
    textElement.style.alignItems = 'center';
    textElement.style.justifyContent = 'center';
    textElement.style.whiteSpace = 'normal';
    textElement.style.wordBreak = 'break-word';
        
        // Apply background if enabled
        if (overlay.hasBg) {
            textElement.classList.add('overlay-text-bg');
        }
        
        // Apply text shadow/stroke
        if (overlay.strokeWidth > 0) {
            textElement.style.textShadow = `
                -${overlay.strokeWidth}px -${overlay.strokeWidth}px 0 ${overlay.strokeColor},  
                ${overlay.strokeWidth}px -${overlay.strokeWidth}px 0 ${overlay.strokeColor},
                -${overlay.strokeWidth}px ${overlay.strokeWidth}px 0 ${overlay.strokeColor},
                ${overlay.strokeWidth}px ${overlay.strokeWidth}px 0 ${overlay.strokeColor}`;
        }
        
        // Apply special styles
        if (overlay.style === 'gradient') {
            textElement.style.background = 'linear-gradient(45deg, #ff0080, #ff8c00, #ffed00, #00ff80, #00bfff, #8000ff)';
            textElement.style.backgroundClip = 'text';
            textElement.style.webkitBackgroundClip = 'text';
            textElement.style.color = 'transparent';
            textElement.style.textShadow = 'none';
        } else if (overlay.style === 'neon') {
            textElement.style.textShadow = `0 0 5px ${overlay.color}, 0 0 10px ${overlay.color}, 0 0 15px ${overlay.color}`;
        }
        
        overlayElement.appendChild(textElement);

        // Measure text for overlay dimensions
        const measureCtx = this.ctx;
        measureCtx.save();
        measureCtx.font = `${bold}${overlay.fontSize}px ${overlay.fontFamily}`;
        const metrics = measureCtx.measureText(overlay.text);
        // More generous padding for Instagram-style
    // Tighter padding so box hugs text better
    const pad = Math.max(6, Math.round(overlay.fontSize * 0.15));
        const boxW = Math.ceil(metrics.width) + pad * 2;
    const boxH = Math.ceil(overlay.fontSize * 1.25) + pad * 2;
        measureCtx.restore();

        // Position box centered at overlay.x/y within the canvas rect
        const crect = this.getCanvasRectRelative();
        overlayElement.style.position = 'absolute';
        overlayElement.style.width = `${boxW}px`;
        overlayElement.style.height = `${boxH}px`;
        overlayElement.style.left = `${crect.left + (overlay.x - boxW / 2)}px`;
    overlayElement.style.top = `${crect.top + (overlay.y - boxH / 2)}px`;
    overlay.boxWidth = boxW;
    overlay.boxHeight = boxH;
        
        // Apply rotation if specified
        if (overlay.rotation) {
            overlayElement.style.transform = `rotate(${overlay.rotation}deg)`;
        }

        // Add a rotation handle (Instagram style)
        const rotationHandle = document.createElement('div');
        rotationHandle.className = 'rotation-handle';
        overlayElement.appendChild(rotationHandle);

        // Add resize handles
        this.addResizeHandles(overlayElement);

        // Make draggable, resizable and rotatable
        this.makeDraggable(overlayElement, overlay, boxW, boxH);
        this.makeResizable(overlayElement, overlay);
        this.makeRotatable(overlayElement, overlay, rotationHandle);
        
        // Add mobile touch gestures
        this.addMobileGestures(overlayElement, overlay);

        // Add style controls (only visible when selected)
        const styleControls = document.createElement('div');
        styleControls.className = 'style-controls';
        styleControls.innerHTML = `
            <div class="style-btn" data-style="normal">Aa</div>
            <div class="style-btn" data-style="gradient">🌈</div>
            <div class="style-btn" data-style="neon">✨</div>
        `;
        overlayElement.appendChild(styleControls);

        document.getElementById('textOverlays').appendChild(overlayElement);
    // Ensure initial fit inside box
    this.fitTextToBox(overlayElement, overlay);
    }    addResizeHandles(element) {
        const handles = ['nw-resize', 'ne-resize', 'sw-resize', 'se-resize'];
        handles.forEach(handle => {
            const resizeHandle = document.createElement('div');
            resizeHandle.className = `resize-handle ${handle}`;
            resizeHandle.style.pointerEvents = 'auto';
            element.appendChild(resizeHandle);
        });
    }
    
    addMobileGestures(element, overlay) {
        const textElement = element.querySelector('.overlay-text');
        if (!textElement) return;
        
        // Variables for touch handling
        let initialTouchDistance = 0;
        let initialFontSize = overlay.fontSize;
        let lastTouchRotation = 0;
        let initialRotation = overlay.rotation || 0;
        let touchStartTime = 0;
        
        // Double tap to edit
        element.addEventListener('touchstart', (e) => {
            const now = new Date().getTime();
            const timeSince = now - touchStartTime;
            
            if (timeSince < 300 && timeSince > 0) {
                // Double tap detected
                e.preventDefault();
                this.selectTextOverlay(element, overlay);
                this.editTextOverlayInline(overlay, element);
            }
            
            touchStartTime = now;
        });
        
        // Long press for context menu
        let longPressTimer;
        element.addEventListener('touchstart', (e) => {
            longPressTimer = setTimeout(() => {
                e.preventDefault();
                this.showMobileContextMenu(overlay, element);
            }, 600);
        });
        
        element.addEventListener('touchend', () => {
            clearTimeout(longPressTimer);
        });
        
        element.addEventListener('touchmove', () => {
            clearTimeout(longPressTimer);
        });
        
        // Handle multi-touch gestures (pinch to zoom, rotate)
        element.addEventListener('touchstart', (e) => {
            if (e.touches.length >= 2) {
                e.preventDefault();
                
                // Calculate initial distance between two touch points (for pinch zoom)
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                initialTouchDistance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                );
                initialFontSize = overlay.fontSize;
                
                // Calculate initial rotation angle
                lastTouchRotation = Math.atan2(
                    touch2.clientY - touch1.clientY,
                    touch2.clientX - touch1.clientX
                ) * 180 / Math.PI;
                initialRotation = overlay.rotation || 0;
            }
        });
        
        element.addEventListener('touchmove', (e) => {
            if (e.touches.length >= 2) {
                e.preventDefault();
                this.selectTextOverlay(element, overlay);
                
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                
                // Handle pinch to zoom (font size)
                const currentDistance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                );
                
                const scaleFactor = currentDistance / initialTouchDistance;
                const newFontSize = Math.max(10, Math.min(100, Math.round(initialFontSize * scaleFactor)));
                
                if (Math.abs(newFontSize - overlay.fontSize) > 1) {
                    overlay.fontSize = newFontSize;
                    textElement.style.fontSize = `${newFontSize}px`;
                }
                
                // Handle two-finger rotation
                const currentRotation = Math.atan2(
                    touch2.clientY - touch1.clientY,
                    touch2.clientX - touch1.clientX
                ) * 180 / Math.PI;
                
                const rotationDelta = currentRotation - lastTouchRotation;
                const newRotation = (initialRotation + rotationDelta) % 360;
                
                if (Math.abs(rotationDelta) > 1) {
                    overlay.rotation = newRotation;
                    element.style.transform = `rotate(${newRotation}deg)`;
                    lastTouchRotation = currentRotation;
                    initialRotation = newRotation;
                }
            }
        });
        
        // Handle drag to delete
        let isDraggingToDelete = false;
        
        element.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1 && element.classList.contains('selected')) {
                const deleteZone = document.getElementById('deleteZone');
                if (!deleteZone) return;
                
                const touch = e.touches[0];
                const deleteRect = deleteZone.getBoundingClientRect();
                const touchY = touch.clientY;
                
                // Check if the touch is near the bottom of the screen
                if (touchY > window.innerHeight - 100) {
                    // Show delete zone
                    deleteZone.classList.add('visible');
                    isDraggingToDelete = true;
                    
                    // Check if touch is over delete zone
                    if (touch.clientX >= deleteRect.left && 
                        touch.clientX <= deleteRect.right &&
                        touchY >= deleteRect.top &&
                        touchY <= deleteRect.bottom) {
                        
                        deleteZone.style.transform = 'translateX(-50%) scale(1.2)';
                    } else {
                        deleteZone.style.transform = 'translateX(-50%) scale(1)';
                    }
                } else if (isDraggingToDelete) {
                    deleteZone.classList.remove('visible');
                    deleteZone.style.transform = 'translateX(-50%) scale(1)';
                    isDraggingToDelete = false;
                }
            }
        });
        
        element.addEventListener('touchend', (e) => {
            if (isDraggingToDelete) {
                const deleteZone = document.getElementById('deleteZone');
                if (!deleteZone) return;
                
                // Check if last touch position was over delete zone
                if (e.changedTouches.length > 0) {
                    const touch = e.changedTouches[0];
                    const deleteRect = deleteZone.getBoundingClientRect();
                    
                    if (touch.clientX >= deleteRect.left && 
                        touch.clientX <= deleteRect.right &&
                        touch.clientY >= deleteRect.top &&
                        touch.clientY <= deleteRect.bottom) {
                        
                        // Delete the overlay
                        this.removeTextOverlay(overlay.id);
                    }
                }
                
                // Hide delete zone
                deleteZone.classList.remove('visible');
                deleteZone.style.transform = 'translateX(-50%) scale(1)';
                isDraggingToDelete = false;
            }
        });
    }

    makeResizable(element, overlay) {
        const handles = element.querySelectorAll('.resize-handle');
        
        handles.forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                e.preventDefault();
                
                element.classList.add('selected');
                
                const startX = e.clientX;
                const startY = e.clientY;
                const startWidth = parseInt(element.style.width);
                const startHeight = parseInt(element.style.height);
                const startLeft = parseInt(element.style.left);
                const startTop = parseInt(element.style.top);
                const startFontSize = overlay.fontSize;
                const startStrokeWidth = overlay.strokeWidth || 0;
                
                const handleClass = handle.className.split(' ')[1];
                
                const onMouseMove = (e) => {
                    const deltaX = e.clientX - startX;
                    const deltaY = e.clientY - startY;
                    
                    let newWidth = startWidth;
                    let newHeight = startHeight;
                    let newLeft = startLeft;
                    let newTop = startTop;
                    
                    // Calculate new dimensions based on handle direction
                    switch(handleClass) {
                        case 'se-resize': // Bottom-right
                            newWidth = Math.max(30, startWidth + deltaX);
                            newHeight = Math.max(20, startHeight + deltaY);
                            break;
                        case 'sw-resize': // Bottom-left
                            newWidth = Math.max(30, startWidth - deltaX);
                            newHeight = Math.max(20, startHeight + deltaY);
                            newLeft = startLeft + (startWidth - newWidth);
                            break;
                        case 'ne-resize': // Top-right
                            newWidth = Math.max(30, startWidth + deltaX);
                            newHeight = Math.max(20, startHeight - deltaY);
                            newTop = startTop + (startHeight - newHeight);
                            break;
                        case 'nw-resize': // Top-left
                            newWidth = Math.max(30, startWidth - deltaX);
                            newHeight = Math.max(20, startHeight - deltaY);
                            newLeft = startLeft + (startWidth - newWidth);
                            newTop = startTop + (startHeight - newHeight);
                            break;
                    }
                    
                    // Update element size and position
                    element.style.width = newWidth + 'px';
                    element.style.height = newHeight + 'px';
                    element.style.left = newLeft + 'px';
                    element.style.top = newTop + 'px';
                    
                    // Calculate uniform scale factor based on BOTH width & height change (feel more natural)
                    const scaleFactor = Math.min(newWidth / startWidth, newHeight / startHeight);
                    const newFontSize = Math.max(8, Math.min(72, Math.round(startFontSize * scaleFactor)));
                    overlay.fontSize = newFontSize;
                    // Scale stroke width proportionally (cap reasonable range)
                    overlay.strokeWidth = Math.max(0, Math.min(12, Math.round(startStrokeWidth * scaleFactor)));
                    // Update DOM text element immediately (since preview canvas no longer paints overlays)
                    const textEl = element.querySelector('.overlay-text');
                    if (textEl) {
                        textEl.style.fontSize = newFontSize + 'px';
                        // Recreate stroke via text-shadow if not gradient style
                        if (overlay.style === 'gradient') {
                            // gradient handled via background clip; no stroke
                            textEl.style.textShadow = 'none';
                        } else if (overlay.style === 'neon') {
                            const c = overlay.color || '#ffffff';
                            textEl.style.textShadow = `0 0 5px ${c}, 0 0 10px ${c}, 0 0 15px ${c}`;
                        } else if (overlay.strokeWidth > 0) {
                            const sw = overlay.strokeWidth;
                            const sc = overlay.strokeColor || '#000000';
                            textEl.style.textShadow = `-${sw}px -${sw}px 0 ${sc}, ${sw}px -${sw}px 0 ${sc}, -${sw}px ${sw}px 0 ${sc}, ${sw}px ${sw}px 0 ${sc}`;
                        } else {
                            textEl.style.textShadow = '';
                        }
                    }
                    
                    // Update overlay position (center point)
                    const crect = this.getCanvasRectRelative();
                    overlay.x = (newLeft - crect.left) + newWidth / 2;
                    overlay.y = (newTop - crect.top) + newHeight / 2;
                    
                    // Redraw with new font size
                    this.drawCurrentFrame();
                    // Enforce containment (shrink if overflow)
                    this.fitTextToBox(element, overlay);
                };
                
                const onMouseUp = () => {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                    element.classList.remove('selected');
                };
                
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
        });
    }

    makeDraggable(element, overlay, boxW = 0, boxH = 0) {
        let isDragging = false;
        let startX, startY, startLeftPx, startTopPx;
        let touchStartTime = 0;
        const overlayRoot = document.getElementById('textOverlays');

        // Mouse events for desktop
        element.addEventListener('mousedown', (e) => {
            // Don't start dragging if clicking on a resize handle
            if (e.target.classList.contains('resize-handle') || e.target.classList.contains('rotation-handle')) return;
            
            isDragging = true;
            this.selectTextOverlay(element, overlay);
            // Starting pointer position in viewport
            startX = e.clientX;
            startY = e.clientY;
            // Current element pixel position (left/top)
            startLeftPx = parseFloat(element.style.left) || 0;
            startTopPx = parseFloat(element.style.top) || 0;
            e.preventDefault();
        });

        const onMove = (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            // New element box top-left in pixels
            let newLeft = startLeftPx + dx;
            let newTop = startTopPx + dy;

            const halfW = (boxW || element.offsetWidth) / 2;
            const halfH = (boxH || element.offsetHeight) / 2;
            // Clamp to canvas bounds within overlay root
            const crect = this.getCanvasRectRelative();
            const minLeft = crect.left;
            const minTop = crect.top;
            const maxLeft = crect.left + crect.width - (halfW * 2);
            const maxTop = crect.top + crect.height - (halfH * 2);
            newLeft = Math.max(minLeft, Math.min(maxLeft, newLeft));
            newTop = Math.max(minTop, Math.min(maxTop, newTop));

            // Update element position
            element.style.left = newLeft + 'px';
            element.style.top = newTop + 'px';

            // Update center-based overlay coordinates used for drawing
            overlay.x = (newLeft - crect.left) + halfW;
            overlay.y = (newTop - crect.top) + halfH;
        };

        const onUp = () => {
            if (!isDragging) return;
            isDragging = false;
            this.drawCurrentFrame(); // Update the canvas
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        
        // Touch events for mobile
        element.addEventListener('touchstart', (e) => {
            // Don't start dragging if touching a resize handle
            if (e.target.classList.contains('resize-handle') || e.target.classList.contains('rotation-handle')) return;
            
            // Check for double tap
            const now = new Date().getTime();
            const timeSince = now - touchStartTime;
            
            if (timeSince < 300 && timeSince > 0) {
                // Double tap detected
                e.preventDefault();
                this.editTextOverlayInline(overlay, element);
                return;
            }
            
            touchStartTime = now;
            
            if (e.touches.length === 1) {
                isDragging = true;
                this.selectTextOverlay(element, overlay);
                
                const touch = e.touches[0];
                startX = touch.clientX;
                startY = touch.clientY;
                startLeftPx = parseFloat(element.style.left) || 0;
                startTopPx = parseFloat(element.style.top) || 0;
            }
        });
        
        const onTouchMove = (e) => {
            if (!isDragging || e.touches.length !== 1) return;
            
            const touch = e.touches[0];
            const dx = touch.clientX - startX;
            const dy = touch.clientY - startY;

            // New element box top-left in pixels
            let newLeft = startLeftPx + dx;
            let newTop = startTopPx + dy;

            const halfW = (boxW || element.offsetWidth) / 2;
            const halfH = (boxH || element.offsetHeight) / 2;
            // Clamp to canvas bounds within overlay root
            const crect = this.getCanvasRectRelative();
            const minLeft = crect.left;
            const minTop = crect.top;
            const maxLeft = crect.left + crect.width - (halfW * 2);
            const maxTop = crect.top + crect.height - (halfH * 2);
            newLeft = Math.max(minLeft, Math.min(maxLeft, newLeft));
            newTop = Math.max(minTop, Math.min(maxTop, newTop));

            // Update element position
            element.style.left = newLeft + 'px';
            element.style.top = newTop + 'px';

            // Update center-based overlay coordinates used for drawing
            overlay.x = (newLeft - crect.left) + halfW;
            overlay.y = (newTop - crect.top) + halfH;
        };
        
        const onTouchEnd = () => {
            if (!isDragging) return;
            isDragging = false;
            this.drawCurrentFrame(); // Update the canvas
        };
        
        document.addEventListener('touchmove', onTouchMove, { passive: false });
        document.addEventListener('touchend', onTouchEnd);

        // Double-click to edit text inline
        element.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.editTextOverlayInline(overlay, element);
        });

        // Right-click to remove
        element.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.removeTextOverlay(overlay.id);
        });

        // Click to select (and deselect others)
        element.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('Text overlay clicked, selecting...');
            // Deselect all other overlays
            document.querySelectorAll('.text-overlay.selected').forEach(el => {
                if (el !== element) {
                    el.classList.remove('selected');
                    console.log('Deselected other overlay');
                }
            });
            element.classList.add('selected');
            console.log('Selected overlay, handles should be visible');
        });
    }

    // Deselect all overlays when clicking outside
    setupOverlayDeselection() {
        // Create a named handler function that we can reference
        this.overlayDeselectionHandler = (e) => {
            // Close any open context menus
            const contextMenu = document.getElementById('textContextMenu');
            if (contextMenu) {
                contextMenu.style.display = 'none';
            }
            
            if (!e.target.closest('.text-overlay') && !e.target.closest('#textOverlays')) {
                document.querySelectorAll('.text-overlay.selected').forEach(el => {
                    el.classList.remove('selected');
                    const styleControls = el.querySelector('.style-controls');
                    if (styleControls) {
                        styleControls.style.display = 'none';
                    }
                });
            }
        };
        
        // Remove any existing handler first to prevent duplicates
        document.removeEventListener('click', this.overlayDeselectionHandler);
        
        // Add the new handler
        document.addEventListener('click', this.overlayDeselectionHandler);
    }
    
    selectTextOverlay(element, overlay) {
        // Deselect all other overlays
        const allOverlays = document.querySelectorAll('.text-overlay');
        allOverlays.forEach(o => {
            o.classList.remove('selected');
            const controls = o.querySelector('.style-controls');
            if (controls) {
                controls.style.display = 'none';
            }
        });
        
        // Select this overlay
        element.classList.add('selected');
        
        // Show style controls for this overlay
        const styleControls = element.querySelector('.style-controls');
        if (styleControls) {
            // Only display controls automatically on desktop
            const displayStyle = this.isMobileDevice ? 'none' : 'flex';
            styleControls.style.display = displayStyle;
            
            // Add style button handlers if not already added
            if (!styleControls.dataset.initialized) {
                styleControls.dataset.initialized = 'true';
                const styleBtns = styleControls.querySelectorAll('.style-btn');
                styleBtns.forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const style = btn.dataset.style;
                        overlay.style = style;
                        
                        // Update active state
                        styleBtns.forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        
                        // Update the text display
                        const textElement = element.querySelector('.overlay-text');
                        if (textElement) {
                            // Apply the style
                            this.applyTextStyle(textElement, style, overlay.color);
                        }
                        
                        // Redraw
                        this.drawCurrentFrame();
                    });
                });
                
                // Set initial active style
                if (overlay.style) {
                    const activeBtn = styleControls.querySelector(`.style-btn[data-style="${overlay.style}"]`);
                    if (activeBtn) {
                        activeBtn.classList.add('active');
                    }
                }
            }
        }
        
        // Make resize handles visible on selection
        const resizeHandles = element.querySelectorAll('.resize-handle');
        resizeHandles.forEach(handle => {
            handle.style.display = 'block';
        });
        
        // Bring selected element to front
        element.style.zIndex = '5';
    }
    
    // Helper function to apply text styles (reusable)
    applyTextStyle(element, style, color) {
        // Reset styles first
        element.style.background = '';
        element.style.backgroundClip = '';
        element.style.webkitBackgroundClip = '';
        element.style.textShadow = '';
        element.style.color = color;
        
        // Apply new style
        if (style === 'gradient') {
            element.style.background = 'linear-gradient(45deg, #ff0080, #ff8c00, #ffed00, #00ff80, #00bfff, #8000ff)';
            element.style.backgroundClip = 'text';
            element.style.webkitBackgroundClip = 'text';
            element.style.color = 'transparent';
        } else if (style === 'neon') {
            element.style.textShadow = `0 0 5px ${color}, 0 0 10px ${color}, 0 0 15px ${color}`;
        }
    }
    
    showMobileContextMenu(overlay, element) {
        // Use the bottom slide-up mobile context menu
        const mobileMenu = document.getElementById('mobileContextMenu');
        if (!mobileMenu) return;
        
        // Show the menu with animation
        mobileMenu.classList.add('visible');
        
        // Add touch handlers
        const menuItems = mobileMenu.querySelectorAll('.mobile-menu-item');
        
        // Remove any existing handlers first
        menuItems.forEach(item => {
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
        });
        
        // Add new handlers
        mobileMenu.querySelectorAll('.mobile-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = item.dataset.action;
                
                switch(action) {
                    case 'edit':
                        this.editTextOverlayInline(overlay, element);
                        break;
                    case 'style':
                        // Show style controls
                        const styleControls = element.querySelector('.style-controls');
                        if (styleControls) {
                            styleControls.style.display = 'flex';
                        }
                        break;
                    case 'front':
                        element.style.zIndex = '10';
                        // Reorder in array to render last (on top)
                        const idx = this.textOverlays.findIndex(o => o.id === overlay.id);
                        if (idx !== -1) {
                            this.textOverlays.push(this.textOverlays.splice(idx, 1)[0]);
                        }
                        break;
                    case 'back':
                        element.style.zIndex = '1';
                        // Reorder in array to render first (on bottom)
                        const idx2 = this.textOverlays.findIndex(o => o.id === overlay.id);
                        if (idx2 !== -1) {
                            this.textOverlays.unshift(this.textOverlays.splice(idx2, 1)[0]);
                        }
                        break;
                    case 'duplicate':
                        const newOverlay = {...overlay, id: Date.now()};
                        newOverlay.x += 20;
                        newOverlay.y += 20;
                        this.textOverlays.push(newOverlay);
                        this.createTextOverlayElement(newOverlay);
                        break;
                    case 'delete':
                        this.removeTextOverlay(overlay.id);
                        break;
                }
                
                // Hide menu
                mobileMenu.classList.remove('visible');
                
                // Redraw
                this.drawCurrentFrame();
            });
        });
        
        // Close when clicking outside
        const closeMenu = (e) => {
            if (!mobileMenu.contains(e.target)) {
                mobileMenu.classList.remove('visible');
                document.removeEventListener('click', closeMenu);
                document.removeEventListener('touchstart', closeMenu);
            }
        };
        
        // Small delay to prevent immediate close
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
            document.addEventListener('touchstart', closeMenu);
        }, 100);
    }
    
    showTextContextMenu(e, overlay, element) {
        // On mobile devices, use the mobile context menu
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            this.showMobileContextMenu(overlay, element);
            return;
        }
        
        // Desktop context menu
        let contextMenu = document.getElementById('textContextMenu');
        if (contextMenu) {
            document.body.removeChild(contextMenu);
        }
        
        // Create new context menu
        contextMenu = document.createElement('div');
        contextMenu.id = 'textContextMenu';
        contextMenu.className = 'text-context-menu';
        
        // Add menu items
        contextMenu.innerHTML = `
            <div class="menu-item" data-action="edit">Edit Text</div>
            <div class="menu-item" data-action="bring-front">Bring to Front</div>
            <div class="menu-item" data-action="send-back">Send to Back</div>
            <div class="menu-item" data-action="duplicate">Duplicate</div>
            <div class="menu-item delete" data-action="delete">Delete</div>
        `;
        
        // Position menu at cursor
        contextMenu.style.left = `${e.clientX}px`;
        contextMenu.style.top = `${e.clientY}px`;
        
        // Add to document
        document.body.appendChild(contextMenu);
        
        // Add click handlers
        contextMenu.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = item.dataset.action;
                
                switch(action) {
                    case 'edit':
                        this.editTextOverlayInline(overlay, element);
                        break;
                    case 'bring-front':
                        element.style.zIndex = '10';
                        // Reorder in array to render last (on top)
                        const idx = this.textOverlays.findIndex(o => o.id === overlay.id);
                        if (idx !== -1) {
                            this.textOverlays.push(this.textOverlays.splice(idx, 1)[0]);
                        }
                        break;
                    case 'send-back':
                        element.style.zIndex = '1';
                        // Reorder in array to render first (on bottom)
                        const idx2 = this.textOverlays.findIndex(o => o.id === overlay.id);
                        if (idx2 !== -1) {
                            this.textOverlays.unshift(this.textOverlays.splice(idx2, 1)[0]);
                        }
                        break;
                    case 'duplicate':
                        const newOverlay = {...overlay, id: Date.now()};
                        newOverlay.x += 20;
                        newOverlay.y += 20;
                        this.textOverlays.push(newOverlay);
                        this.createTextOverlayElement(newOverlay);
                        break;
                    case 'delete':
                        this.removeTextOverlay(overlay.id);
                        break;
                }
                
                // Hide menu
                contextMenu.style.display = 'none';
                
                // Redraw
                this.drawCurrentFrame();
            });
        });
        
        // Close menu when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!contextMenu.contains(e.target)) {
                    contextMenu.style.display = 'none';
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 0);
    }

    editTextOverlayInline(overlay, element) {
        // Instagram-like editing - create a styled contenteditable div for richer text entry
        const textEditor = document.createElement('div');
        textEditor.contentEditable = true;
        textEditor.className = 'instagram-text-editor';
        textEditor.textContent = overlay.text;
        
        // Instagram-like editor styles
        textEditor.style.cssText = `
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            min-width: ${Math.max(200, parseInt(element.style.width || '200') * 1.2)}px;
            padding: 12px 16px;
            font-size: ${overlay.fontSize}px;
            font-family: ${overlay.fontFamily};
            font-weight: ${overlay.bold ? 'bold' : 'normal'};
            color: ${overlay.color};
            background: rgba(0,0,0,0.7);
            text-align: center;
            border: none;
            outline: none;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 2000;
            transition: all 0.2s ease;
        `;
        
        // Create font toolbar for Instagram-like styling
        const fontToolbar = document.createElement('div');
        fontToolbar.className = 'instagram-editor-toolbar instagram-font-toolbar';
        
        // Define available fonts with preview
        const fonts = [
            { name: 'Classic', value: 'Arial, sans-serif' },
            { name: 'Bold', value: 'Impact, Arial, sans-serif' },
            { name: 'Modern', value: 'Helvetica, sans-serif' },
            { name: 'Typewriter', value: 'Courier New, monospace' },
            { name: 'Fancy', value: 'Comic Sans MS, cursive' }
        ];
        
        // Create font options
        const fontOptionsHTML = fonts.map(font => `
            <div class="font-option ${overlay.fontFamily === font.value ? 'active' : ''}" data-font="${font.value}">
                <div class="font-preview" style="font-family: ${font.value}">Aa</div>
                <div class="font-name">${font.name}</div>
            </div>
        `).join('');
        
        fontToolbar.innerHTML = `
            <div class="toolbar-item font-picker">
                ${fontOptionsHTML}
            </div>
        `;
        
        // Create color toolbar
        const colorToolbar = document.createElement('div');
        colorToolbar.className = 'instagram-editor-toolbar instagram-color-toolbar';
        
        // Extended color palette for mobile
        const colors = [
            '#ffffff', '#000000', '#ff0080', '#ff8c00', '#ffed00', 
            '#00ff80', '#00bfff', '#8000ff', '#ff0000', '#00ff00',
            '#0000ff', '#ffff00', '#ff00ff', '#00ffff'
        ];
        
        // Create color options
        const colorOptionsHTML = colors.map(color => `
            <div class="color-option ${overlay.color === color ? 'active' : ''}" 
                data-color="${color}" style="background-color:${color}"></div>
        `).join('');
        
        // Create style options
        const styleOptionsList = [
            { name: 'Normal', value: 'normal' },
            { name: 'Gradient', value: 'gradient' },
            { name: 'Neon', value: 'neon' }
        ];
        
        const styleOptionsHTML = styleOptionsList.map(style => `
            <div class="style-option ${overlay.style === style.value ? 'active' : ''}" 
                data-style="${style.value}">${style.name}</div>
        `).join('');
        
        // Create alignment options
        const alignOptionsList = [
            { name: '<i class="fas fa-align-left"></i>', value: 'left' },
            { name: '<i class="fas fa-align-center"></i>', value: 'center' },
            { name: '<i class="fas fa-align-right"></i>', value: 'right' }
        ];
        
        const alignOptionsHTML = `
            <div class="align-options">
                ${alignOptionsList.map(align => `
                    <div class="align-option ${overlay.align === align.value ? 'active' : ''}" 
                        data-align="${align.value}">${align.name}</div>
                `).join('')}
            </div>
        `;
        
        // Add text background toggle
        const bgToggleHTML = `
            <div class="text-bg-toggle ${overlay.hasBg ? 'active' : ''}" id="textBgToggle">
                <i class="fas fa-font"></i>
            </div>
        `;
        
        colorToolbar.innerHTML = `
            <div class="toolbar-item color-picker">
                ${colorOptionsHTML}
            </div>
            <div class="toolbar-item style-picker">
                ${styleOptionsHTML}
            </div>
            ${alignOptionsHTML}
            ${bgToggleHTML}
        `;
        
        // Hide the original overlay element while editing
        element.style.display = 'none';
        
        // Append elements to body
        const editorContainer = document.createElement('div');
        editorContainer.className = 'instagram-editor-container';
        editorContainer.appendChild(textEditor);
        editorContainer.appendChild(fontToolbar);
        editorContainer.appendChild(colorToolbar);
        document.body.appendChild(editorContainer);
        
        // Show keyboard automatically on mobile
        setTimeout(() => {
            textEditor.focus();
        }, 100);
        
        // Focus and select all text
        textEditor.focus();
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(textEditor);
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Event handlers for color options
        const colorOptions = colorToolbar.querySelectorAll('.color-option');
        colorOptions.forEach(option => {
            option.addEventListener('click', () => {
                const color = option.dataset.color;
                overlay.color = color;
                
                // Apply color based on current style
                applyTextStyle(textEditor, overlay.style, color);
                
                // Update active state
                colorOptions.forEach(o => o.classList.remove('active'));
                option.classList.add('active');
                
                // Visual feedback for mobile
                showTouchIndicator(option);
            });
        });
        
        // Event handlers for style options
        const styleOptions = colorToolbar.querySelectorAll('.style-option');
        styleOptions.forEach(option => {
            option.addEventListener('click', () => {
                const style = option.dataset.style;
                overlay.style = style;
                
                // Update active state
                styleOptions.forEach(o => o.classList.remove('active'));
                option.classList.add('active');
                
                // Apply the style
                applyTextStyle(textEditor, style, overlay.color);
                
                // Visual feedback for mobile
                showTouchIndicator(option);
            });
        });
        
        // Event handlers for font options
        const fontOptions = fontToolbar.querySelectorAll('.font-option');
        fontOptions.forEach(option => {
            option.addEventListener('click', () => {
                const font = option.dataset.font;
                overlay.fontFamily = font;
                textEditor.style.fontFamily = font;
                
                // Update active state
                fontOptions.forEach(o => o.classList.remove('active'));
                option.classList.add('active');
                
                // Visual feedback for mobile
                showTouchIndicator(option);
            });
        });
        
        // Event handlers for alignment options
        const alignOptions = colorToolbar.querySelectorAll('.align-option');
        alignOptions.forEach(option => {
            option.addEventListener('click', () => {
                const align = option.dataset.align;
                overlay.align = align;
                textEditor.style.textAlign = align;
                
                // Update active state
                alignOptions.forEach(o => o.classList.remove('active'));
                option.classList.add('active');
                
                // Visual feedback for mobile
                showTouchIndicator(option);
            });
        });
        
        // Background toggle handler
        const bgToggle = colorToolbar.querySelector('#textBgToggle');
        if (bgToggle) {
            bgToggle.addEventListener('click', () => {
                overlay.hasBg = !overlay.hasBg;
                
                if (overlay.hasBg) {
                    textEditor.classList.add('overlay-text-bg');
                    bgToggle.classList.add('active');
                } else {
                    textEditor.classList.remove('overlay-text-bg');
                    bgToggle.classList.remove('active');
                }
                
                // Visual feedback for mobile
                showTouchIndicator(bgToggle);
            });
        }
        
        // Helper function to apply text styles
        const applyTextStyle = (element, style, color) => {
            // Reset styles first
            element.style.background = '';
            element.style.backgroundClip = '';
            element.style.webkitBackgroundClip = '';
            element.style.textShadow = '';
            element.style.color = color;
            
            // Apply new style
            if (style === 'gradient') {
                element.style.background = 'linear-gradient(45deg, #ff0080, #ff8c00, #ffed00, #00ff80, #00bfff, #8000ff)';
                element.style.backgroundClip = 'text';
                element.style.webkitBackgroundClip = 'text';
                element.style.color = 'transparent';
            } else if (style === 'neon') {
                element.style.textShadow = `0 0 5px ${color}, 0 0 10px ${color}, 0 0 15px ${color}`;
                element.style.color = color;
            }
        };
        
        // Visual touch feedback function
        const showTouchIndicator = (element) => {
            const touchIndicator = document.getElementById('touchIndicator');
            if (!touchIndicator) return;
            
            const rect = element.getBoundingClientRect();
            touchIndicator.style.left = `${rect.left + rect.width/2}px`;
            touchIndicator.style.top = `${rect.top + rect.height/2}px`;
            
            touchIndicator.classList.add('active');
            
            setTimeout(() => {
                touchIndicator.classList.remove('active');
            }, 500);
        };

        // Close editor and apply changes
        const finishEditing = () => {
            try {
                // First, remove all event handlers
                if (typeof removeOutsideClickHandlers === 'function') {
                    removeOutsideClickHandlers();
                }
                
                const newText = textEditor.textContent.trim();
                
                // If text is empty, delete the overlay or use placeholder
                if (!newText) {
                    // Always use placeholder text - more intuitive than a confirm dialog
                    overlay.text = "Tap to edit";
                } else {
                    // Update with the new text
                    overlay.text = newText;
                }
                
                // Update the overlay element
                this.syncOverlayDom(element, overlay);
                
                // Show the overlay again
                element.style.display = 'block';
                
                // Check if container still exists and is in DOM before removing
                if (editorContainer && editorContainer.parentNode) {
                    editorContainer.parentNode.removeChild(editorContainer);
                }
                
                this.drawCurrentFrame();
                
                // Make sure the element is selected after editing
                this.selectTextOverlay(element, overlay);
                
            } catch (err) {
                console.error('Error in finishEditing:', err);
                // Fallback recovery - just make sure the editor is gone and element is visible
                element.style.display = 'block';
                if (editorContainer && editorContainer.parentNode) {
                    editorContainer.parentNode.removeChild(editorContainer);
                }
            }
        };

        // Add direct close button to the editor
        const closeButton = document.createElement('button');
        closeButton.className = 'instagram-editor-close-button';
        closeButton.innerHTML = '✓';
        closeButton.title = 'Save changes';
        editorContainer.appendChild(closeButton);
        
        // Add close button event handler
        closeButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            finishEditing();
        });
        
        // Add cancel button to the editor
        const cancelButton = document.createElement('button');
        cancelButton.className = 'instagram-editor-cancel-button';
        cancelButton.innerHTML = '×';
        cancelButton.title = 'Cancel editing';
        editorContainer.appendChild(cancelButton);
        
        // Add cancel button event handler
        cancelButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Cancel editing without saving changes
            element.style.display = 'block';
            document.body.removeChild(editorContainer);
            this.drawCurrentFrame();
        });
        
        // Handle tap/click outside to close
        const handleOutsideClick = (e) => {
            // Make sure we're not inside the editor container
            if (!editorContainer.contains(e.target)) {
                // Cleanup event listeners first
                removeOutsideClickHandlers();
                // Apply the changes
                finishEditing();
            }
        };
        
        // Function to cleanly remove all event listeners
        const removeOutsideClickHandlers = () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            document.removeEventListener('touchstart', handleOutsideClick);
        };
        
        // Add event listeners with a delay
        setTimeout(() => {
            document.addEventListener('mousedown', handleOutsideClick);
            document.addEventListener('touchstart', handleOutsideClick);
        }, 500);
        
        // Handle Enter key to finish editing
        textEditor.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                // Cleanup event listeners
                if (typeof removeOutsideClickHandlers === 'function') {
                    removeOutsideClickHandlers();
                }
                finishEditing();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                // Cleanup event listeners
                if (typeof removeOutsideClickHandlers === 'function') {
                    removeOutsideClickHandlers();
                }
                // Cancel editing without saving changes
                element.style.display = 'block';
                if (editorContainer && editorContainer.parentNode) {
                    editorContainer.parentNode.removeChild(editorContainer);
                }
                this.drawCurrentFrame();
            }
        });
        
        // Initial style application
        if (overlay.style) {
            applyTextStyle(textEditor, overlay.style, overlay.color);
        }
        
        // Apply text background if enabled
        if (overlay.hasBg) {
            textEditor.classList.add('overlay-text-bg');
        }
        
        // Apply text alignment
        if (overlay.align) {
            textEditor.style.textAlign = overlay.align;
        } else {
            // Default to center
            textEditor.style.textAlign = 'center';
            overlay.align = 'center';
        }
    }

    // Ensure DOM overlay reflects current model (text, colors, style, font, etc.)
    syncOverlayDom(element, overlay) {
        if (!element) return;
        const textElement = element.querySelector('.overlay-text');
        if (!textElement) return;
        textElement.textContent = overlay.text;
        // Font + weight
        textElement.style.fontFamily = overlay.fontFamily || 'Impact, Charcoal, sans-serif';
        textElement.style.fontWeight = overlay.bold ? 'bold' : 'normal';
        textElement.style.fontSize = (overlay.fontSize || 28) + 'px';
        // Alignment
        textElement.style.textAlign = overlay.align || 'center';
        // Background toggle
        if (overlay.hasBg) {
            textElement.classList.add('overlay-text-bg');
        } else {
            textElement.classList.remove('overlay-text-bg');
        }
        // Reset style-related properties
        textElement.style.background = '';
        textElement.style.backgroundClip = '';
        textElement.style.webkitBackgroundClip = '';
        textElement.style.color = overlay.color || '#ffffff';
        textElement.style.textShadow = '';
        // Stroke simulation via text-shadow if strokeWidth
        if (overlay.strokeWidth && overlay.strokeWidth > 0 && overlay.style !== 'gradient') {
            const sw = overlay.strokeWidth;
            const sc = overlay.strokeColor || '#000000';
            textElement.style.textShadow = `-${sw}px -${sw}px 0 ${sc}, ${sw}px -${sw}px 0 ${sc}, -${sw}px ${sw}px 0 ${sc}, ${sw}px ${sw}px 0 ${sc}`;
        }
        // Apply style variants
        if (overlay.style === 'gradient') {
            textElement.style.background = 'linear-gradient(45deg, #ff0080, #ff8c00, #ffed00, #00ff80, #00bfff, #8000ff)';
            textElement.style.backgroundClip = 'text';
            textElement.style.webkitBackgroundClip = 'text';
            textElement.style.color = 'transparent';
            textElement.style.textShadow = 'none';
        } else if (overlay.style === 'neon') {
            const c = overlay.color || '#ffffff';
            textElement.style.textShadow = `0 0 5px ${c}, 0 0 10px ${c}, 0 0 15px ${c}`;
        }
        // Force canvas redraw if overlays are rendered there (optional flag)
        if (this.renderOverlaysInPreview) {
            this.drawCurrentFrame();
        }
        // After any style changes ensure text still fits
        this.fitTextToBox(element, overlay);
    }

    // Adjust font size so text fits INSIDE the box (shrink) and also expands to fill extra space (grow)
    fitTextToBox(element, overlay) {
        const textElement = element.querySelector('.overlay-text');
        if (!textElement) return;
        let currentSize = overlay.fontSize || 28;
        const maxWidth = element.clientWidth - 4;
        const maxHeight = element.clientHeight - 4;
        textElement.style.whiteSpace = 'normal';
        textElement.style.wordBreak = 'break-word';

        // 1. Shrink if overflowing
        let iterations = 0;
        while (iterations < 50 && currentSize > 6 && (textElement.scrollWidth > maxWidth || textElement.scrollHeight > maxHeight)) {
            currentSize -= 1;
            textElement.style.fontSize = currentSize + 'px';
            iterations++;
        }

        // 2. Grow if there is still free space (user enlarged box) up to cap
        if (iterations < 50) {
            let growIters = 0;
            while (growIters < 50 && currentSize < 180) {
                textElement.style.fontSize = (currentSize + 1) + 'px';
                if (textElement.scrollWidth > maxWidth || textElement.scrollHeight > maxHeight) {
                    // revert last growth
                    textElement.style.fontSize = currentSize + 'px';
                    break;
                }
                currentSize += 1;
                growIters++;
            }
        }

        overlay.fontSize = currentSize;
    }
    
    makeRotatable(element, overlay, rotateHandle) {
        rotateHandle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Mark element as selected
            this.selectTextOverlay(element, overlay);

            const rect = element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const startAngle = Math.atan2(
                e.clientY - centerY,
                e.clientX - centerX
            ) * 180 / Math.PI;
            
            const startRotation = overlay.rotation || 0;

            const onMouseMove = (e) => {
                const angle = Math.atan2(
                    e.clientY - centerY,
                    e.clientX - centerX
                ) * 180 / Math.PI;
                
                const newRotation = (startRotation + angle - startAngle) % 360;
                
                overlay.rotation = newRotation;
                element.style.transform = `rotate(${newRotation}deg)`;
                this.drawCurrentFrame();
            };

            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }

    removeTextOverlay(id) {
        this.textOverlays = this.textOverlays.filter(overlay => overlay.id !== id);
        const element = document.querySelector(`[data-id="${id}"]`);
        if (element) {
            element.remove();
        }
    }

    clearAllText() {
        this.textOverlays = [];
        document.getElementById('textOverlays').innerHTML = '';
        this.showMessage('All text cleared', 'success');
    }

    togglePlayback() {
        this.isPlaying = !this.isPlaying;
        const btn = document.getElementById('playPauseBtn');
        btn.textContent = this.isPlaying ? '⏸️ Pause' : '▶️ Play';
    }

    previousFrame() {
        if (this.gifFrames.length > 1) {
            this.currentFrame = (this.currentFrame - 1 + this.gifFrames.length) % this.gifFrames.length;
            this.drawCurrentFrame();
        }
    }

    nextFrame() {
        if (this.gifFrames.length > 1) {
            this.currentFrame = (this.currentFrame + 1) % this.gifFrames.length;
            this.drawCurrentFrame();
        }
    }

    async generateQuickGif() {
        if (!this.selectedGif) {
            this.showMessage('Please select a GIF first', 'error');
            return;
        }

        if (this.textOverlays.length === 0) {
            this.showMessage('Please add some text first', 'error');
            return;
        }

    const dl = document.getElementById('downloadSection');
    dl.style.display = 'block';
    requestAnimationFrame(() => dl.classList.add('active'));
    dl.scrollIntoView({ behavior: 'smooth' });

        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const quickBtn = document.getElementById('quickGifBtn');

        // Disable button during processing
        quickBtn.disabled = true;
        quickBtn.textContent = 'Generating...';

        try {
            // Reset progress
            progressFill.style.width = '0%';
            progressText.textContent = 'Quick generation mode - creating static image...';

            await this.generateStaticImage(progressFill, progressText);
            this.showMessage('Quick image created successfully! 🚀', 'success');
        } catch (error) {
            console.error('Error in quick generation:', error);
            this.showMessage('Error creating quick image. Please try again.', 'error');
            document.getElementById('downloadSection').style.display = 'none';
        } finally {
            // Re-enable button
            quickBtn.disabled = false;
            quickBtn.textContent = 'Quick Static Image';
        }
    }

    async generateCompatGif() {
        if (!this.selectedGif) { this.showMessage('Select a GIF first', 'error'); return; }
        if (this.textOverlays.length === 0) { this.showMessage('Add some text first', 'error'); return; }
        const btn = document.getElementById('compatGifBtn');
        const dl = document.getElementById('downloadSection');
        dl.style.display = 'block'; requestAnimationFrame(()=>dl.classList.add('active'));
        dl.scrollIntoView({ behavior: 'smooth' });
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        btn.disabled = true; const oldLabel = btn.textContent; btn.textContent = 'Encoding...';
        try {
            progressFill.style.width = '0%';
            progressText.textContent = 'Messenger mode: preparing frames...';
            // Build conservative frame list but preserve original timing
            let targetDelay = null; // Use original delays instead of forcing 90ms
            let maxDim = 300;     // constrain both width & height
            let frames = this.gifFrames.slice();
            // basic FPS cap ~1000/targetDelay
            const roughFps = 1000/targetDelay;
            if (this.optimizeEncodingFrames) frames = this.optimizeEncodingFrames(frames, roughFps);
            // Hard cap frame count to avoid huge files
            const maxFrames = 48;
            if (frames.length > maxFrames) frames = frames.slice(0, maxFrames);
            // Prepare encoder with robust worker fallback chain
            let gif;
            const makeEncoder = (opts)=> new GIF(Object.assign({
                repeat:0,
                background:'#000000',
                transparent:null
            }, opts));
            const workerUrl = this.getWorkerScriptUrl();
            let workerTried = false;
            if (workerUrl) {
                try {
                    workerTried = true;
                    gif = makeEncoder({ workers:2, workerScript:workerUrl, quality:26, dither:false });
                } catch(e) {
                    console.warn('Primary worker failed, attempt blob fallback', e);
                }
            }
            if (!gif) {
                // Try inline blob fallback by fetching or reusing global cached blob
                try {
                    if (!window.__inlineGifWorkerBlobUrl) {
                        const resp = await fetch(workerUrl).catch(()=>null);
                        if (resp && resp.ok) {
                            const code = await resp.text();
                            const blobUrl = URL.createObjectURL(new Blob([code], { type:'application/javascript'}));
                            window.__inlineGifWorkerBlobUrl = blobUrl;
                        }
                    }
                    if (window.__inlineGifWorkerBlobUrl) {
                        gif = makeEncoder({ workers:2, workerScript:window.__inlineGifWorkerBlobUrl, quality:26, dither:false });
                    }
                } catch (e2) {
                    console.warn('Blob worker fallback failed', e2);
                }
            }
            if (!gif) {
                console.warn('Falling back to no-worker mode for compat GIF');
                gif = makeEncoder({ workers:0, quality:28, dither:false });
            }
            // Encoding canvas (scaled)
            const srcW = this.canvas.width, srcH = this.canvas.height;
            const scale = Math.min(1, maxDim / Math.max(srcW, srcH));
            const encW = Math.max(1, Math.round(srcW * scale));
            const encH = Math.max(1, Math.round(srcH * scale));
            const encCanvas = document.createElement('canvas');
            encCanvas.width = encW; encCanvas.height = encH;
            const encCtx = encCanvas.getContext('2d', { willReadFrequently:true });
            for (let i=0;i<frames.length;i++) {
                const f = frames[i];
                const img = (f.canvas||f.image)||f;
                this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
                // Pre-fill to remove any transparency
                this.ctx.fillStyle = '#000000';
                this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
                this.ctx.drawImage(img,0,0,this.canvas.width,this.canvas.height);
                this.textOverlays.forEach(o=>this.drawText(o));
                encCtx.clearRect(0,0,encW,encH);
                encCtx.fillStyle = '#000000';
                encCtx.fillRect(0,0,encW,encH);
                encCtx.drawImage(this.canvas,0,0,encW,encH);
                // Use original frame delay to preserve smoothness
                const frameDelay = f.delay || this.frameDelay || 100;
                gif.addFrame(encCanvas,{ delay: frameDelay, copy:true, dispose:2 });
                const pct = Math.round(((i+1)/frames.length)*60);
                progressFill.style.width = pct+'%';
                progressText.textContent = `Adding frame ${i+1}/${frames.length}`;
                await new Promise(r=>setTimeout(r,0));
            }
            progressText.textContent = 'Rendering optimized GIF...';
            gif.on('progress', p => {
                const base = 60 + Math.round(p*30);
                progressFill.style.width = base+'%';
                progressText.textContent = `Rendering... ${base}%`;
            });
            const encodeOnce = () => new Promise((resolve,reject)=>{
                gif.on('finished', b=>resolve(b));
                gif.on('abort', ()=>reject(new Error('Aborted')));
                gif.on('error', e=>reject(e));
                gif.render();
            });

            let blob = await encodeOnce();
            progressFill.style.width = '95%';
            progressText.textContent = 'Validating...';
            let meta = await this.validateGif(blob);
            console.log('Compat GIF validation', meta, 'size', blob.size);

            const targetBytes = 1800000; // ~1.8MB tighter for Messenger
            let attempt = 1;
            // Adaptive retries if too large
            while (blob.size > targetBytes && attempt <= 2) {
                this.showMessage(`Optimizing for Messenger (pass ${attempt+1})...`, 'info');
                // Tweak settings: shrink width and increase quality number (more compression)
                maxDim = Math.round(maxDim * 0.8);
                // Keep original timing - don't slow down further
                // targetDelay = Math.min(140, targetDelay + 10); // REMOVED
                const qBump = 6 * attempt;
                const newQuality = 26 + qBump;

                // Rebuild encoder
                gif = makeEncoder({ workers:0, quality:newQuality, dither:false, repeat:0, background:'#000000', transparent:null });
                const newScale = Math.min(1, maxDim / Math.max(srcW, srcH));
                const nW = Math.max(1, Math.round(srcW * newScale));
                const nH = Math.max(1, Math.round(srcH * newScale));
                encCanvas.width = nW; encCanvas.height = nH;

                // Subsample frames to reduce count on retries
                const step = (attempt + 1);
                const totalOut = Math.ceil(frames.length / step);
                for (let i=0;i<totalOut;i++) {
                    const idx = i * step;
                    if (idx >= frames.length) break;
                    const f = frames[idx]; const img=(f.canvas||f.image)||f;
                    this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
                    this.ctx.fillStyle = '#000000';
                    this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
                    this.ctx.drawImage(img,0,0,this.canvas.width,this.canvas.height);
                    this.textOverlays.forEach(o=>this.drawText(o));
                    encCtx.clearRect(0,0,nW,nH);
                    encCtx.fillStyle = '#000000';
                    encCtx.fillRect(0,0,nW,nH);
                    encCtx.drawImage(this.canvas,0,0,nW,nH);
                    // Preserve original frame timing even in retries
                    const retryDelay = frames[idx].delay || this.frameDelay || 100;
                    gif.addFrame(encCanvas,{ delay: retryDelay, copy:true, dispose:2 });
                    const pctBase = 65;
                    const pct = pctBase + Math.round(((i+1)/totalOut)*20);
                    progressFill.style.width = Math.min(90, pct)+'%';
                    progressText.textContent = `Re-encoding (${attempt+1}) ${i+1}/${totalOut}`;
                    await new Promise(r=>setTimeout(r,0));
                }
                blob = await new Promise((resolve,reject)=>{
                    gif.on('finished', b=>resolve(b));
                    gif.on('abort', ()=>reject(new Error('Aborted')));
                    gif.on('error', e=>reject(e));
                    gif.render();
                });
                meta = await this.validateGif(blob);
                console.log('Retry result', attempt+1, 'size', blob.size, meta);
                attempt++;
            }

            this.setupDownload(blob,'gif');
            progressFill.style.width = '100%';
            progressText.textContent = 'Messenger compatible GIF ready';
        } catch (e) {
            console.error('Compat generation failed', e);
            this.showMessage('Compat GIF failed','error');
        } finally {
            btn.disabled = false; btn.textContent = oldLabel;
        }
    }

    // New: Global-palette Messenger encoder using gifenc
    async generateCompatGifGlobal() {
        if (!this.selectedGif) { this.showMessage('Select a GIF first', 'error'); return; }
        if (this.textOverlays.length === 0) { this.showMessage('Add some text first', 'error'); return; }
        const btn = document.getElementById('compatGifBtn');
        const dl = document.getElementById('downloadSection');
        dl.style.display = 'block'; requestAnimationFrame(()=>dl.classList.add('active'));
        dl.scrollIntoView({ behavior: 'smooth' });
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        btn.disabled = true; const oldLabel = btn.textContent; btn.textContent = 'Encoding...';
        try {
            progressFill.style.width = '0%';
            progressText.textContent = 'Loading encoder...';
            // Prefer preloaded module
            let mod = window.__gifenc || null;
            // Try a few resilient sources if not already loaded
            const trySources = async () => {
                const sources = [
                    'https://cdn.jsdelivr.net/npm/gifenc@1.0.3/+esm',
                    'https://unpkg.com/gifenc@1.0.3'
                ];
                for (const src of sources) {
                    try {
                        const m = await import(src);
                        if (m) return m;
                    } catch (e) {
                        console.warn('gifenc runtime import failed from', src, e);
                    }
                }
                return null;
            };
            if (!mod) mod = await trySources();
            const GIFEncoder = (mod && (mod.GIFEncoder || (mod.default && mod.default.GIFEncoder))) || null;
            const quantize = (mod && (mod.quantize || (mod.default && mod.default.quantize))) || null;
            const applyPalette = (mod && (mod.applyPalette || (mod.default && mod.default.applyPalette))) || null;
            if (!GIFEncoder || typeof quantize !== 'function' || typeof applyPalette !== 'function') {
                throw new Error('gifenc not available');
            }
            const maxDim = 300;
            // Don't clamp delays - use original timing to preserve smoothness
            // const minDelay = 80; // REMOVED - this was making animations too slow

            // Prepare frames (compose base + text)
            let frames = (this.gifFrames && this.gifFrames.length) ? this.gifFrames.slice() : [];
            if (!frames.length) {
                this.showMessage('No frames available for encoding, using fallback encoder...', 'error');
                throw new Error('No frames to encode');
            }
            
            // Apply frame smoothing if selected
            const smoothingType = document.getElementById('frameSmoothing')?.value || 'none';
            if (smoothingType !== 'none') {
                frames = this.applySmoothingToFrames(frames, smoothingType);
            }
            
            // Cap frames to something reasonable for size (Messenger compatibility)
            // Allow more frames but still keep it reasonable to avoid file size issues
            const maxFrames = 200; // Increased to 200 to preserve longer animations
            if (frames.length > maxFrames) frames = frames.slice(0, maxFrames);

            // Build a sample set to compute a single global palette
            const sampleCount = Math.max(1, Math.min(16, frames.length));
            const step = Math.max(1, Math.floor(frames.length / sampleCount));
            const samples = [];

            // Canvas to draw composed frames
            const srcW = this.canvas.width, srcH = this.canvas.height;
            const scale = Math.min(1, maxDim / Math.max(srcW, srcH));
            const encW = Math.max(1, Math.round(srcW * scale));
            const encH = Math.max(1, Math.round(srcH * scale));
            const encCanvas = document.createElement('canvas');
            encCanvas.width = encW; encCanvas.height = encH;
            const encCtx = encCanvas.getContext('2d', { willReadFrequently:true });

            const rgbaFromCanvas = (cvs) => {
                const id = encCtx.getImageData(0,0,encW,encH);
                return id.data; // Uint8ClampedArray RGBA
            };

            try {
                for (let i=0;i<frames.length;i+=step) {
                    const f = frames[i]; const img=(f.canvas||f.image)||f;
                    this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
                    // Solid background to remove transparency
                    this.ctx.fillStyle = '#000000';
                    this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
                    this.ctx.drawImage(img,0,0,this.canvas.width,this.canvas.height);
                    this.textOverlays.forEach(o=>this.drawText(o));
                    encCtx.clearRect(0,0,encW,encH);
                    encCtx.fillStyle = '#000000';
                    encCtx.fillRect(0,0,encW,encH);
                    encCtx.drawImage(this.canvas,0,0,encW,encH);
                    samples.push(new Uint8Array(rgbaFromCanvas(encCanvas)));
                    if (samples.length >= sampleCount) break;
                }
            } catch (imgErr) {
                console.warn('getImageData failed during palette sampling, falling back', imgErr);
                throw imgErr;
            }

            progressFill.style.width = '25%';
            progressText.textContent = 'Computing global palette...';

            // Concatenate sample RGBA for quantization
            let concatLen = samples.reduce((a,s)=>a+s.length,0);
            const all = new Uint8Array(concatLen);
            let off=0; for (const s of samples) { all.set(s, off); off += s.length; }
            // Quantize to 256 colors (or fewer)
            let palette = quantize(all, 128);
            if (!palette || !palette.length) {
                this.showMessage('Palette generation failed, using fallback encoder...', 'error');
                throw new Error('Empty palette');
            }
            // Always output a 256-color GCT, padded with black (#000000) to match working GIFs
            if (palette.length < 256) {
                const padColor = [0, 0, 0]; // Always pad with black, not the last color
                while (palette.length < 256) palette.push(padColor.slice());
            } else if (palette.length > 256) {
                palette = palette.slice(0, 256);
            }

            // Setup GIFEncoder (gifenc) with default options that match working GIFs
            const enc = new GIFEncoder({ auto: true });

            progressFill.style.width = '45%';
            progressText.textContent = 'Adding frames...';

            // Now encode each frame using the same palette
            const total = frames.length;
            let written = 0;
            for (let i=0;i<total;i++) {
                const f = frames[i]; const img=(f.canvas||f.image)||f;
                this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
                this.ctx.fillStyle = '#000000';
                this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
                this.ctx.drawImage(img,0,0,this.canvas.width,this.canvas.height);
                this.textOverlays.forEach(o=>this.drawText(o));
                encCtx.clearRect(0,0,encW,encH);
                encCtx.fillStyle = '#000000';
                encCtx.fillRect(0,0,encW,encH);
                encCtx.drawImage(this.canvas,0,0,encW,encH);
                let id;
                try {
                    id = encCtx.getImageData(0,0,encW,encH);
                } catch (idErr) {
                    console.warn('getImageData failed while writing frames; falling back', idErr);
                    throw idErr;
                }
                // Map RGBA -> palette indices using the precomputed global palette
                const indexStream = applyPalette(id.data, palette);
                if (!indexStream || indexStream.length === 0) {
                    console.warn('applyPalette returned empty indices; aborting to fallback');
                    throw new Error('Empty index stream');
                }
                // Use original frame delay to preserve animation smoothness
                const delay = f.delay || this.frameDelay || 100;
                // Match working GIFs: transparent: false, transparencyIndex: 255, dispose: 0, repeat: 0 (endless loop)
                const frameOptions = {
                    palette,
                    delay,
                    dispose: 0,  // Use dispose: 0 like working GIFs, not dispose: 2
                    transparent: false,
                    transparentIndex: 255
                };
                // Add repeat: 0 (endless loop) for the first frame only
                if (i === 0) {
                    frameOptions.repeat = 0;
                }
                enc.writeFrame(indexStream, encW, encH, frameOptions);
                written++;
                const pct = 45 + Math.round(((i+1)/total)*45);
                progressFill.style.width = pct+'%';
                progressText.textContent = `Adding frame ${i+1}/${total}`;
                await new Promise(r=>setTimeout(r,0));
            }
            if (!written) {
                this.showMessage('No frames were written to GIF, using fallback encoder...', 'error');
                throw new Error('No frames written');
            }

            progressText.textContent = 'Finalizing...';
            enc.finish(); // Write end-of-stream character (no parameters needed)
            const bytes = enc.bytes(); // Get the Uint8Array output
            const blob = new Blob([bytes], { type:'image/gif' });
            // Validate the result; bail out if clearly invalid or tiny
            let valid = true;
            try {
                const meta = await this.validateGif(blob);
                valid = Boolean(meta && meta.ok && meta.frames > 0);
            } catch {}
            if (!valid || (blob && blob.size && blob.size < 64)) {
                console.warn('Global palette result invalid or too small (', blob && blob.size, 'bytes ), falling back');
                throw new Error('Invalid tiny GIF output');
            }
            this.setupDownload(blob, 'gif');
            progressFill.style.width = '100%';
            progressText.textContent = 'Messenger compatible GIF (global palette) ready';
        } catch (e) {
            console.warn('Global encoder failed, falling back to legacy compat path', e);
            try {
                await this.generateCompatGif();
            } catch(e2) {
                this.showMessage('Compat GIF failed','error');
            }
        } finally {
            const btn = document.getElementById('compatGifBtn');
            if (btn) { btn.disabled = false; btn.textContent = 'Messenger Compatible GIF'; }
        }
    }

    async reencodeSimple(originalBlob, frames, delay, encW, encH, progressFill, progressText) {
        return new Promise(async (resolve,reject)=>{
            try {
                let gif2 = new GIF({ workers:1, quality:22, repeat:0, background:'#000000' });
                const encCanvas = document.createElement('canvas'); encCanvas.width=encW; encCanvas.height=encH;
                const encCtx = encCanvas.getContext('2d',{ willReadFrequently:true });
                for (let i=0;i<frames.length;i++) {
                    const f=frames[i]; const img=(f.canvas||f.image)||f;
                    this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
                    this.ctx.drawImage(img,0,0,this.canvas.width,this.canvas.height);
                    this.textOverlays.forEach(o=>this.drawText(o));
                    encCtx.clearRect(0,0,encW,encH);
                    encCtx.drawImage(this.canvas,0,0,encW,encH);
                    // Use original frame delay instead of fixed delay
                    const frameDelay = f.delay || this.frameDelay || delay || 100;
                    gif2.addFrame(encCanvas,{ delay: frameDelay, copy:true });
                }
                gif2.on('finished', b=>resolve(b));
                gif2.on('abort', ()=>reject(new Error('Fallback abort')));
                gif2.render();
            } catch(err){ reject(err); }
        });
    }

    async generateWithGifJs(progressFill, progressText) {
        return new Promise(async (resolve, reject) => {
            console.log('Starting REAL animated GIF generation...');
            
            try {
                const settings = this.getEncodingSettings ? this.getEncodingSettings() : { quality: 30, targetFps: 12, maxEncodeWidth: 320 };
                console.log('Using encoding settings:', settings);
                let gif;
                const make = (opts)=> new GIF(Object.assign({ repeat:0, debug:false, dither:false, background:'#000000', transparent:null }, opts));
                const workerUrl = this.getWorkerScriptUrl();
                if (workerUrl) {
                    try {
                        gif = make({ workers: Math.max(2, navigator.hardwareConcurrency ? Math.min(4, navigator.hardwareConcurrency) : 2), workerScript: workerUrl, quality: settings.quality });
                    } catch(e) {
                        console.warn('Primary worker failed, trying blob fallback', e);
                    }
                }
                if (!gif) {
                    // Attempt async inline fetch via promise chain
                    // (generateWithGifJs runs in synchronous executor; we dynamically create a promise)
                    // We'll block subsequent logic by constructing a temporary promise.
                    try {
                        gif = await (async ()=>{
                            if (!window.__inlineGifWorkerBlobUrl && workerUrl) {
                                try {
                                    const resp = await fetch(workerUrl).catch(()=>null);
                                    if (resp && resp.ok) {
                                        const code = await resp.text();
                                        window.__inlineGifWorkerBlobUrl = URL.createObjectURL(new Blob([code], { type:'application/javascript'}));
                                    }
                                } catch(err) { console.warn('Inline worker fetch failed', err); }
                            }
                            if (window.__inlineGifWorkerBlobUrl) {
                                return make({ workers:2, workerScript:window.__inlineGifWorkerBlobUrl, quality: settings.quality });
                            }
                            return null;
                        })();
                    } catch(e2) { console.warn('Blob worker fallback failed', e2); }
                }
                if (!gif) {
                    console.warn('Falling back to no-worker mode');
                    gif = make({ workers:0, quality: Math.min(50, (settings.quality || 30) + 5) });
                }

                let completed = false;
                let timeoutId = null;

                // Progress tracking
                gif.on('progress', (p) => {
                    if (completed) return;
                    const percent = Math.round(p * 50 + 50);
                    progressFill.style.width = percent + '%';
                    progressText.textContent = `Encoding GIF... ${percent}%`;
                    console.log(`GIF progress: ${percent}%`);
                });

                gif.on('finished', (blob) => {
                    if (completed) return;
                    completed = true;
                    if (timeoutId) clearTimeout(timeoutId);
                    
                    console.log('GIF completed! Size:', blob.size, 'bytes');
                    progressText.textContent = 'Animated GIF created successfully!';
                    progressFill.style.width = '100%';
                    this.setupDownload(blob, 'gif');
                    resolve();
                });

                gif.on('abort', () => {
                    if (!completed) {
                        completed = true;
                        if (timeoutId) clearTimeout(timeoutId);
                        reject(new Error('GIF generation aborted'));
                    }
                });

                // Timeout after 90 seconds
                timeoutId = setTimeout(() => {
                    if (!completed) {
                        completed = true;
                        console.log('GIF generation timeout');
                        gif.abort();
                        reject(new Error('GIF generation timeout'));
                    }
                }, 90000);

                // Create frames and render (pass settings)
                this.addGifFrames(gif, progressFill, progressText, settings).then(() => {
                    if (completed) return;
                    
                    console.log('Starting GIF render...');
                    progressText.textContent = 'Rendering animated GIF...';
                    progressFill.style.width = '50%';
                    
                    gif.render();
                }).catch(error => {
                    if (!completed) {
                        completed = true;
                        if (timeoutId) clearTimeout(timeoutId);
                        reject(error);
                    }
                });

            } catch (error) {
                reject(error);
            }
        });
    }

    async addGifFrames(gif, progressFill, progressText, settings = { maxEncodeWidth: 320, targetFps: 12 }) {
        if (!this.gifFrames || this.gifFrames.length === 0) {
            throw new Error('No frames available for encoding');
        }

        // Frame sampling to reduce file size
        let frames = this.gifFrames;
        if (this.optimizeEncodingFrames) {
            frames = this.optimizeEncodingFrames(frames, settings.targetFps);
        }
        console.log(`Encoding ${frames.length} frames (original ${this.gifFrames.length})`);

        // Prepare a smaller encoding canvas to speed up quantization
        const maxEncodeSize = settings.maxEncodeWidth || 320; // px (width)
        const srcW = this.canvas.width;
        const srcH = this.canvas.height;
        const scale = Math.min(1, maxEncodeSize / srcW);
        const encW = Math.max(1, Math.round(srcW * scale));
        const encH = Math.max(1, Math.round(srcH * scale));

        if (!this._encCanvas) {
            this._encCanvas = document.createElement('canvas');
            this._encCtx = this._encCanvas.getContext('2d', { willReadFrequently: true });
        }
        this._encCanvas.width = encW;
        this._encCanvas.height = encH;

        const total = frames.length;
        for (let i = 0; i < total; i++) {
            const f = frames[i];
            const img = (f && (f.canvas || f.image)) ? (f.canvas || f.image) : f;

            // Draw original frame (scaled) to main canvas
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);

            // Draw static text overlays
            this.textOverlays.forEach(overlay => this.drawText(overlay));

            // Downscale into encoding canvas
            this._encCtx.clearRect(0, 0, encW, encH);
            this._encCtx.drawImage(this.canvas, 0, 0, encW, encH);

            gif.addFrame(this._encCanvas, {
                delay: Math.max(20, f.delay || this.frameDelay || 100),
                copy: true
            });

            const percent = Math.round(((i + 1) / total) * 50);
            progressFill.style.width = percent + '%';
            progressText.textContent = `Adding frame ${i + 1}/${total}...`;

            // Yield to UI a bit
            await new Promise(resolve => setTimeout(resolve, 0));
        }

        console.log(`All ${total} frames added with original timing`);
    }

    async createOptimizedMeme(progressFill, progressText) {
        // Clear canvas and create the final high-quality meme
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw base GIF frame
        if (this.gifFrames.length > 0) {
            this.ctx.drawImage(
                this.gifFrames[0], 
                0, 0, 
                this.canvas.width, 
                this.canvas.height
            );
        }
        
        // Draw all text overlays
        this.textOverlays.forEach(overlay => {
            this.drawText(overlay);
        });
        
        progressFill.style.width = '100%';
        progressText.textContent = 'High-quality meme created!';
        
        return new Promise((resolve) => {
            this.canvas.toBlob((blob) => {
                this.setupDownload(blob, 'png');
                resolve();
            }, 'image/png', 0.98);
        });
    }

    async addFramesToGif(gif, progressFill, progressText) {
        // Drastically reduce frame count for faster generation
        const canvasArea = this.canvas.width * this.canvas.height;
        let frameCount;
        
        if (canvasArea > 300000) {
            frameCount = 3; // Very large images get minimal frames
        } else if (canvasArea > 150000) {
            frameCount = 5; // Medium images get few frames
        } else {
            frameCount = 8; // Small images can have more frames
        }
        
        console.log(`Generating ${frameCount} frames for ${this.canvas.width}x${this.canvas.height} image`);
        
        // Store original text positions
        const originalPositions = this.textOverlays.map(overlay => ({ x: overlay.x, y: overlay.y }));
        
        // Create a temporary canvas for frame generation to avoid multiple reads from main canvas
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
        
        for (let i = 0; i < frameCount; i++) {
            console.log(`Preparing frame ${i + 1}/${frameCount}`);
            
            // Clear and redraw temporary canvas
            tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
            
            // Draw the GIF frame to temporary canvas
            if (this.gifFrames.length > 0) {
                tempCtx.drawImage(this.gifFrames[0], 0, 0);
            }
            
            // Add subtle animation to text (very minimal for speed)
            this.textOverlays.forEach((overlay, index) => {
                const variation = Math.sin((i / frameCount) * Math.PI * 2) * 0.5; // Very small variation
                overlay.animatedY = originalPositions[index].y + variation;
            });
            
            // Draw text overlays to temporary canvas
            this.textOverlays.forEach(overlay => {
                this.drawTextToContext(tempCtx, overlay);
            });
            
            // Add frame to GIF from temporary canvas with optimized settings
            gif.addFrame(tempCtx, { 
                delay: frameCount <= 3 ? 500 : 200, // Slower animation for fewer frames
                copy: true,
                dispose: 2 // Restore to background color
            });
            
            // Update progress
            const percent = Math.round((i + 1) / frameCount * 50);
            progressFill.style.width = percent + '%';
            progressText.textContent = `Prepared frame ${i + 1}/${frameCount}`;
            
            // Minimal delay
            await new Promise(resolve => setTimeout(resolve, 5));
        }
        
        console.log('All frames prepared successfully');
        
        // Restore original positions
        this.textOverlays.forEach((overlay, index) => {
            overlay.x = originalPositions[index].x;
            overlay.y = originalPositions[index].y;
            delete overlay.animatedY;
        });
        
        // Update main canvas one final time
        this.drawCurrentFrame();
    }

    drawTextToContext(ctx, overlay) {
        ctx.save();
        
        const fontSize = overlay.fontSize || 24;
        const fontFamily = overlay.fontFamily || 'Impact, Arial, sans-serif';
        const bold = overlay.bold ? 'bold ' : '';
        
        ctx.font = `${bold}${fontSize}px ${fontFamily}`;
        ctx.fillStyle = overlay.color || '#ffffff';
        ctx.strokeStyle = overlay.strokeColor || '#000000';
        ctx.lineWidth = overlay.strokeWidth || 2;
    ctx.textAlign = overlay.alignment || overlay.align || 'center';
        ctx.textBaseline = 'middle';
        
        // Use the animated Y position if available, otherwise use original
        const yPos = overlay.animatedY !== undefined ? overlay.animatedY : overlay.y;
        
        if (overlay.rotation) {
            ctx.translate(overlay.x, yPos);
            ctx.rotate(overlay.rotation * Math.PI / 180);
            ctx.translate(-overlay.x, -yPos);
        }
        if (overlay.strokeWidth > 0) ctx.strokeText(overlay.text, overlay.x, yPos);
        ctx.fillText(overlay.text, overlay.x, yPos);
        
        ctx.restore();
    }

    drawAnimatedText(overlay, frameIndex, totalFrames) {
        this.ctx.save();
        
        const fontSize = overlay.fontSize || 24;
        const fontFamily = overlay.fontFamily || 'Impact, Arial, sans-serif';
        const bold = overlay.bold ? 'bold ' : '';
        
        this.ctx.font = `${bold}${fontSize}px ${fontFamily}`;
        this.ctx.fillStyle = overlay.color || '#ffffff';
        this.ctx.strokeStyle = overlay.strokeColor || '#000000';
        this.ctx.lineWidth = overlay.strokeWidth || 2;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Use the animated Y position if available, otherwise use original
        const yPos = overlay.animatedY !== undefined ? overlay.animatedY : overlay.y;
        
        // Draw stroke (outline) first
        if (overlay.strokeWidth > 0) {
            this.ctx.strokeText(overlay.text, overlay.x, yPos);
        }
        
        // Draw fill text on top
        this.ctx.fillText(overlay.text, overlay.x, yPos);
        
        this.ctx.restore();
    }

    async generateStaticImage(progressFill, progressText) {
        return new Promise((resolve, reject) => {
            try {
                progressText.textContent = 'Generating static image...';
                progressFill.style.width = '25%';
                
                // Clear and redraw canvas with final content
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                
                progressFill.style.width = '50%';
                
                // Draw the first GIF frame (handle canvas/image containers)
                if (this.gifFrames.length > 0) {
                    const f0 = this.gifFrames[0];
                    const base = (f0 && (f0.canvas || f0.image)) ? (f0.canvas || f0.image) : f0;
                    this.ctx.drawImage(base, 0, 0, this.canvas.width, this.canvas.height);
                }
                
                progressFill.style.width = '75%';
                
                // Draw all text overlays
                this.textOverlays.forEach(overlay => {
                    this.drawText(overlay);
                });
                
                progressFill.style.width = '100%';
                progressText.textContent = 'Image generated successfully!';
                
                // Convert canvas to blob
                this.canvas.toBlob((blob) => {
                    if (blob) {
                        this.setupDownload(blob, 'png');
                        resolve();
                    } else {
                        reject(new Error('Failed to create image blob'));
                    }
                }, 'image/png', 0.95);
                
            } catch (error) {
                reject(error);
            }
        });
    }

    // Apply smoothing to frames to improve animation quality
    applySmoothingToFrames(frames, smoothingType) {
        if (smoothingType === 'interpolate') {
            return this.interpolateFrames(frames);
        } else if (smoothingType === 'blend') {
            return this.blendFrameTransitions(frames);
        }
        return frames;
    }

    // Add intermediate frames between existing frames for smoother animation
    interpolateFrames(frames) {
        if (frames.length < 2) return frames;
        
        const smoothedFrames = [];
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = frames[0].canvas ? frames[0].canvas.width : frames[0].width;
        tempCanvas.height = frames[0].canvas ? frames[0].canvas.height : frames[0].height;
        const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
        
        for (let i = 0; i < frames.length; i++) {
            // Add original frame
            smoothedFrames.push(frames[i]);
            
            // Add interpolated frame between this and next (except for last frame)
            if (i < frames.length - 1) {
                const currentFrame = frames[i].canvas || frames[i];
                const nextFrame = frames[i + 1].canvas || frames[i + 1];
                
                // Create blended intermediate frame
                tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
                tempCtx.globalAlpha = 0.6;
                tempCtx.drawImage(currentFrame, 0, 0);
                tempCtx.globalAlpha = 0.4;
                tempCtx.drawImage(nextFrame, 0, 0);
                tempCtx.globalAlpha = 1.0;
                
                // Create canvas copy for the interpolated frame
                const interpCanvas = document.createElement('canvas');
                interpCanvas.width = tempCanvas.width;
                interpCanvas.height = tempCanvas.height;
                const interpCtx = interpCanvas.getContext('2d');
                interpCtx.drawImage(tempCanvas, 0, 0);
                
                // Use half the delay of the original frame
                const avgDelay = Math.max(40, (frames[i].delay || 100) / 2);
                smoothedFrames.push({ canvas: interpCanvas, delay: avgDelay });
            }
        }
        
        return smoothedFrames;
    }

    // Apply subtle blending between consecutive frames
    blendFrameTransitions(frames) {
        if (frames.length < 2) return frames;
        
        const blendedFrames = [];
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = frames[0].canvas ? frames[0].canvas.width : frames[0].width;
        tempCanvas.height = frames[0].canvas ? frames[0].canvas.height : frames[0].height;
        const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
        
        for (let i = 0; i < frames.length; i++) {
            const currentFrame = frames[i].canvas || frames[i];
            
            if (i === 0) {
                // First frame - no blending
                blendedFrames.push(frames[i]);
            } else {
                // Blend with previous frame for smoother transitions
                const prevFrame = frames[i - 1].canvas || frames[i - 1];
                
                tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
                tempCtx.globalAlpha = 0.15; // Subtle blend with previous
                tempCtx.drawImage(prevFrame, 0, 0);
                tempCtx.globalAlpha = 0.85; // Mostly current frame
                tempCtx.drawImage(currentFrame, 0, 0);
                tempCtx.globalAlpha = 1.0;
                
                // Create canvas copy for the blended frame
                const blendCanvas = document.createElement('canvas');
                blendCanvas.width = tempCanvas.width;
                blendCanvas.height = tempCanvas.height;
                const blendCtx = blendCanvas.getContext('2d');
                blendCtx.drawImage(tempCanvas, 0, 0);
                
                blendedFrames.push({ 
                    canvas: blendCanvas, 
                    delay: frames[i].delay || 100 
                });
            }
        }
        
        return blendedFrames;
    }

    setupDownload(blob, format = 'gif') {
        const downloadBtn = document.getElementById('downloadBtn');
        const url = URL.createObjectURL(blob);
        
        downloadBtn.style.display = 'block';
        downloadBtn.textContent = `Download ${format.toUpperCase()}`;
        downloadBtn.onclick = () => {
            const a = document.createElement('a');
            a.href = url;
            a.download = `meme-${Date.now()}.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        };
    }

    showMessage(message, type = 'info') {
        // Create a simple toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            animation: slideIn 0.3s ease;
            max-width: 300px;
        `;

        switch (type) {
            case 'success':
                toast.style.background = '#28a745';
                break;
            case 'error':
                toast.style.background = '#dc3545';
                break;
            default:
                toast.style.background = '#667eea';
        }

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// Add animation styles for toast notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize the application when the page loads
// Ensure we only create one instance
let gifMemeGeneratorInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    // Check if we already have an instance
    if (!gifMemeGeneratorInstance) {
        console.log('Creating new GifMemeGenerator instance');
        gifMemeGeneratorInstance = new GifMemeGenerator();
    } else {
        console.log('GifMemeGenerator instance already exists');
    }
});