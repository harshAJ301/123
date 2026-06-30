/**
 * ============================================
 * DIGITAL FLOWERS - COMPLETE EXPERIENCE
 * Full Camera + Hand Tracking + Poetry + Interactions
 * ============================================
 * 
 * This is the complete implementation with:
 * - Full-screen camera feed
 * - MediaPipe hand tracking with visual overlay
 * - Pinch gesture detection (thumb + index finger)
 * - Wave gesture detection (hand waving)
 * - Poetry text overlay with fade-in animation
 * - Dynamic counters with number animation
 * - Bloom & Grow control values
 * - Particle burst effects on gestures
 * - Loading screen with animated sparkles
 * - Begin experience button flow
 * - Fully responsive design
 * - Three.js 3D background particles
 * ============================================
 */

// ============================================
// SECTION 1: APPLICATION STATE
// ============================================
// Central state management for the entire application
const AppState = {
    // Tracking status
    isReady: false,
    isTracking: false,
    isCameraActive: false,
    
    // Counters
    flowerCount: 2229,
    seedCount: 31,
    
    // Control values
    bloom: 0.35,
    grow: 0.30,
    
    // Hand tracking data
    handLandmarks: null,
    isPinching: false,
    isWaving: false,
    
    // Timing for gesture cooldowns (prevents multiple triggers)
    lastPinchTime: 0,
    lastWaveTime: 0,
    pinchCooldown: 500, // milliseconds
    waveCooldown: 1000, // milliseconds
    
    // DOM element references (populated during init)
    elements: {}
};

// ============================================
// SECTION 2: DOM REFERENCE CACHE
// ============================================
// Cache all DOM elements for performance
function cacheElements() {
    AppState.elements = {
        video: document.getElementById('camera-feed'),
        handCanvas: document.getElementById('hand-canvas'),
        threeCanvas: document.getElementById('three-canvas'),
        loadingScreen: document.getElementById('loading-screen'),
        beginScreen: document.getElementById('begin-screen'),
        beginButton: document.getElementById('begin-button'),
        actionHint: document.getElementById('action-hint'),
        flowerCounter: document.getElementById('flower-counter'),
        seedCounter: document.getElementById('seed-counter'),
        bloomValue: document.getElementById('bloom-value'),
        growValue: document.getElementById('grow-value'),
        poetryText: document.getElementById('poetry-text')
    };
}

// ============================================
// SECTION 3: THREE.JS 3D BACKGROUND
// ============================================
class ThreeBackground {
    constructor() {
        this.canvas = AppState.elements.threeCanvas;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 2, 8);
        this.camera.lookAt(0, 0, 0);
        
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        this.createParticles();
        this.animate();
        this.handleResize();
    }
    
    createParticles() {
        const geometry = new THREE.BufferGeometry();
        const count = 200;
        const positions = new Float32Array(count * 3);
        
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 20;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 10 + 2;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 15 - 5;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0xa855f7,
            size: 0.04,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });
        
        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.particles) {
            this.particles.rotation.y += 0.001;
            this.particles.rotation.x += 0.0003;
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    handleResize() {
        window.addEventListener('resize', () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
        });
    }
}

// ============================================
// SECTION 4: HAND TRACKING MANAGER
// ============================================
class HandTrackingManager {
    constructor() {
        this.canvas = AppState.elements.handCanvas;
        this.ctx = this.canvas.getContext('2d');
        this.video = AppState.elements.video;
        this.isInitialized = false;
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    async initialize() {
        try {
            this.updateStatus('✦ starting camera ✦');
            
            // Request camera access
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            });
            
            // Connect stream to video element
            this.video.srcObject = stream;
            await this.video.play();
            AppState.isCameraActive = true;
            
            this.updateStatus('✦ loading hand tracking ✦');
            
            // Initialize MediaPipe Hands
            const hands = new Hands({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
                }
            });
            
            hands.setOptions({
                maxNumHands: 1,
                modelComplexity: 1,
                minDetectionConfidence: 0.7,
                minTrackingConfidence: 0.6
            });
            
            // Bind results handler
            hands.onResults((results) => this.handleResults(results));
            
            // Initialize camera with MediaPipe
            const camera = new Camera(this.video, {
                onFrame: async () => {
                    try {
                        await hands.send({ image: this.video });
                    } catch (e) {
                        // Silent error handling for frame drops
                    }
                },
                width: 640,
                height: 480
            });
            
            await camera.start();
            
            this.isInitialized = true;
            AppState.isTracking = true;
            
            this.updateStatus('✦ ready ✦');
            setTimeout(() => this.hideLoading(), 800);
            
            console.log('✅ Hand tracking initialized successfully');
            
        } catch (error) {
            console.error('❌ Camera initialization failed:', error);
            this.showCameraError();
        }
    }
    
    updateStatus(text) {
        const loadingText = document.querySelector('.loading-text');
        if (loadingText) {
            loadingText.textContent = text;
        }
    }
    
    hideLoading() {
        const screen = AppState.elements.loadingScreen;
        if (screen) {
            screen.classList.add('hidden');
            setTimeout(() => {
                screen.style.display = 'none';
                AppState.isReady = true;
            }, 800);
        }
    }
    
    showCameraError() {
        const screen = AppState.elements.loadingScreen;
        if (screen) {
            screen.innerHTML = `
                <div style="text-align:center;color:white;padding:20px;">
                    <div style="font-size:4rem;margin-bottom:20px;">📷</div>
                    <h2 style="font-weight:300;letter-spacing:0.1em;">camera access required</h2>
                    <p style="margin:20px auto;color:rgba(255,255,255,0.5);">
                        please allow camera access for the experience
                    </p>
                    <button onclick="location.reload()" style="
                        background:rgba(255,255,255,0.1);
                        border:1px solid rgba(255,255,255,0.2);
                        padding:12px 32px;
                        border-radius:40px;
                        font-size:0.85rem;
                        color:white;
                        cursor:pointer;
                        letter-spacing:0.1em;
                    ">✦ retry ✦</button>
                </div>
            `;
        }
    }
    
    handleResults(results) {
        // Clear canvas for new frame
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            
            // Draw hand overlay
            this.drawHand(landmarks);
            
            // Process gestures
            this.processGestures(landmarks);
            
            // Store for other systems
            AppState.handLandmarks = landmarks;
            
            // Update UI
            this.updateUI(true);
        } else {
            AppState.handLandmarks = null;
            this.updateUI(false);
        }
    }
    
    drawHand(landmarks) {
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        // Define hand connections
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
            [0, 5], [5, 6], [6, 7], [7, 8], // Index
            [0, 9], [9, 10], [10, 11], [11, 12], // Middle
            [0, 13], [13, 14], [14, 15], [15, 16], // Ring
            [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
            [5, 9], [9, 13], [13, 17] // Palm
        ];
        
        // Draw connections with glow
        this.ctx.shadowColor = 'rgba(247, 212, 74, 0.15)';
        this.ctx.shadowBlur = 10;
        
        connections.forEach(([i, j]) => {
            const p1 = landmarks[i];
            const p2 = landmarks[j];
            
            this.ctx.beginPath();
            this.ctx.moveTo(p1.x * w, p1.y * h);
            this.ctx.lineTo(p2.x * w, p2.y * h);
            this.ctx.strokeStyle = 'rgba(247, 212, 74, 0.25)';
            this.ctx.lineWidth = 1.5;
            this.ctx.stroke();
        });
        
        this.ctx.shadowBlur = 0;
        
        // Define finger colors
        const colors = ['#f7d44a', '#ff6b9d', '#a855f7', '#3b82f6', '#06b6d4'];
        
        // Draw landmarks with glow
        landmarks.forEach((landmark, index) => {
            const x = landmark.x * w;
            const y = landmark.y * h;
            const colorIndex = Math.floor(index / 4) % colors.length;
            const color = colors[colorIndex];
            
            // Glow effect
            const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, 12);
            gradient.addColorStop(0, color + '40');
            gradient.addColorStop(1, 'transparent');
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 12, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Core dot
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 15;
            this.ctx.fillStyle = color + '80';
            this.ctx.beginPath();
            this.ctx.arc(x, y, 2.5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });
        
        // Draw pinch indicator if pinching
        if (AppState.isPinching) {
            const thumb = landmarks[4];
            const index = landmarks[8];
            const cx = (thumb.x + index.x) / 2 * w;
            const cy = (thumb.y + index.y) / 2 * h;
            
            // Outer ring
            this.ctx.strokeStyle = 'rgba(247, 212, 74, 0.2)';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, 25, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // Inner ring
            this.ctx.strokeStyle = 'rgba(255, 107, 157, 0.1)';
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, 40, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }
    
    processGestures(landmarks) {
        const thumb = landmarks[4];
        const index = landmarks[8];
        const now = Date.now();
        
        // Calculate distance between thumb and index finger tips
        const distance = Math.sqrt(
            Math.pow(thumb.x - index.x, 2) +
            Math.pow(thumb.y - index.y, 2) +
            Math.pow(thumb.z - index.z, 2)
        );
        
        // PINCH DETECTION
        const currentlyPinching = distance < 0.04;
        if (currentlyPinching && !AppState.isPinching && 
            (now - AppState.lastPinchTime > AppState.pinchCooldown)) {
            this.onPinch();
            AppState.lastPinchTime = now;
        }
        AppState.isPinching = currentlyPinching;
        
        // WAVE DETECTION
        let fingerHeights = [];
        for (let i = 5; i < 21; i += 4) {
            fingerHeights.push(landmarks[i].y);
        }
        const waveHeight = Math.max(...fingerHeights) - Math.min(...fingerHeights);
        const currentlyWaving = waveHeight > 0.12;
        
        if (currentlyWaving && !AppState.isWaving && 
            (now - AppState.lastWaveTime > AppState.waveCooldown)) {
            this.onWave();
            AppState.lastWaveTime = now;
        }
        AppState.isWaving = currentlyWaving;
    }
    
    onPinch() {
        // Increment counters
        AppState.seedCount++;
        AppState.flowerCount++;
        
        // Update UI
        this.updateCounters();
        
        // Show feedback
        const hint = AppState.elements.actionHint;
        hint.textContent = '✦ flower planted ✦';
        hint.style.color = '#f7d44a';
        clearTimeout(this.hintTimeout);
        this.hintTimeout = setTimeout(() => {
            hint.textContent = '✦ pinch to plant a flower ✦';
            hint.style.color = 'rgba(255,255,255,0.4)';
        }, 1500);
        
        // Create visual effect
        this.createBurst('#f7d44a', 15);
    }
    
    onWave() {
        // Show feedback
        const hint = AppState.elements.actionHint;
        hint.textContent = '✦ butterflies dancing ✦';
        hint.style.color = '#ff6b9d';
        clearTimeout(this.hintTimeout);
        this.hintTimeout = setTimeout(() => {
            hint.textContent = '✦ wave to attract butterflies ✦';
            hint.style.color = 'rgba(255,255,255,0.4)';
        }, 1500);
        
        // Create visual effect
        this.createBurst('#ff6b9d', 20);
    }
    
    createBurst(color, count = 15) {
        const colors = ['#f7d44a', '#ff6b9d', '#a855f7', '#3b82f6', '#06b6d4'];
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            const angle = Math.random() * Math.PI * 2;
            const distance = 30 + Math.random() * 80;
            const size = 3 + Math.random() * 6;
            const duration = 600 + Math.random() * 400;
            const colorChoice = colors[Math.floor(Math.random() * colors.length)];
            
            particle.style.cssText = `
                position: fixed;
                left: ${centerX}px;
                top: ${centerY}px;
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background: ${colorChoice};
                pointer-events: none;
                z-index: 50;
                opacity: 0.9;
                transform: translate(0, 0) scale(1);
                transition: all ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1);
            `;
            document.body.appendChild(particle);
            
            // Animate particle outward
            requestAnimationFrame(() => {
                const dx = Math.cos(angle) * distance;
                const dy = Math.sin(angle) * distance - 30;
                particle.style.transform = `translate(${dx}px, ${dy}px) scale(0)`;
                particle.style.opacity = '0';
            });
            
            // Remove particle after animation
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.remove();
                }
            }, duration + 100);
        }
    }
    
    updateCounters() {
        AppState.elements.flowerCounter.textContent = AppState.flowerCount.toLocaleString();
        AppState.elements.seedCounter.textContent = AppState.seedCount.toLocaleString();
    }
    
    updateUI(handDetected) {
        const hint = AppState.elements.actionHint;
        if (handDetected) {
            hint.textContent = '✦ hand detected • try pinch or wave ✦';
            hint.style.color = 'rgba(255,255,255,0.8)';
        } else {
            hint.textContent = '✦ show your hand to the camera ✦';
            hint.style.color = 'rgba(255,255,255,0.4)';
        }
    }
}

// ============================================
// SECTION 5: CONTROLS MANAGER
// ============================================
class ControlsManager {
    constructor() {
        this.bloomValue = 0.35;
        this.growValue = 0.30;
        
        this.animateControls();
        this.animateCounters();
    }
    
    animateControls() {
        // Animate bloom value
        this.animateNumber('bloom-value', 0.35, 2000);
        this.animateNumber('grow-value', 0.30, 2000);
    }
    
    animateNumber(elementId, target, duration) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        let current = 0;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const value = eased * target;
            
            element.textContent = value.toFixed(2);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    animateCounters() {
        // Animate flower counter
        this.animateCounter('flower-counter', 2229, 3000);
        this.animateCounter('seed-counter', 31, 3000);
    }
    
    animateCounter(elementId, target, duration) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        let current = 0;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const value = Math.floor(eased * target);
            
            element.textContent = value.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
}

// ============================================
// SECTION 6: BEGIN EXPERIENCE MANAGER
// ============================================
class BeginManager {
    constructor() {
        this.beginScreen = AppState.elements.beginScreen;
        this.beginButton = AppState.elements.beginButton;
        this.loadingScreen = AppState.elements.loadingScreen;
        this.handTracking = null;
        
        this.beginButton.addEventListener('click', () => {
            this.startExperience();
        });
        
        // Auto-show begin screen after loading
        setTimeout(() => {
            this.showBeginScreen();
        }, 2000);
    }
    
    showBeginScreen() {
        // Hide loading screen
        this.loadingScreen.classList.add('hidden');
        
        // Show begin screen with animation
        setTimeout(() => {
            this.beginScreen.classList.add('visible');
            gsap.from('.begin-container', {
                scale: 0.9,
                opacity: 0,
                duration: 1,
                ease: 'back.out(1.7)'
            });
        }, 400);
    }
    
    startExperience() {
        // Hide begin screen
        this.beginScreen.classList.remove('visible');
        this.beginScreen.style.display = 'none';
        
        // Initialize hand tracking
        this.handTracking = new HandTrackingManager();
        this.handTracking.initialize();
        
        console.log('✦ Experience started ✦');
    }
}

// ============================================
// SECTION 7: MAIN APPLICATION
// ============================================
class Application {
    constructor() {
        console.log('🌸 Initializing Digital Flowers...');
        
        // Cache DOM elements
        cacheElements();
        
        // Initialize Three.js background
        this.threeBackground = new ThreeBackground();
        
        // Initialize controls
        this.controls = new ControlsManager();
        
        // Initialize begin experience flow
        this.beginManager = new BeginManager();
        
        console.log('✅ Application ready');
        console.log('✦ How I would send her flowers, but she didn\'t exist ✦');
    }
}

// ============================================
// SECTION 8: START APPLICATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const app = new Application();
    
    // Expose to window for debugging
    window.__APP__ = app;
});

// ============================================
// SECTION 9: ERROR HANDLING
// ============================================
window.addEventListener('error', (error) => {
    console.error('❌ Application error:', error.message);
});

console.log('🚀 Digital Flowers loaded successfully');
console.log('📸 Camera + Hand Tracking + Poetry + Interactions');
