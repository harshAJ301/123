/**
 * ============================================
 * MAGICAL BIRTHDAY EXPERIENCE
 * Main Application Entry Point
 * ============================================
 * 
 * Architecture: Modular Singleton Pattern
 * Technologies: Three.js, GSAP, MediaPipe
 * 
 * Features:
 * - 3D Scene with Particle System
 * - Hand Tracking with MediaPipe
 * - Interactive Gesture Recognition
 * - Procedural Flower Generation
 * - Butterfly Flocking System
 * - Premium Animations with GSAP
 * ============================================
 */

// ============================================
// APPLICATION STATE
// ============================================
const AppState = {
    isReady: false,
    isTracking: false,
    seedCount: 0,
    flowerCount: 0,
    butterflyCount: 0,
    scene: null,
    camera: null,
    renderer: null,
    handLandmarks: null,
    gestures: {
        pinch: false,
        wave: false,
        point: false
    },
    // Performance settings
    settings: {
        maxParticles: 500,
        maxFlowers: 50,
        maxButterflies: 30,
        enableShadows: true,
        quality: 'high' // 'high', 'medium', 'low'
    }
};

// ============================================
// THREE.JS SCENE MANAGER
// ============================================
class SceneManager {
    constructor() {
        this.container = document.getElementById('app');
        this.canvas = document.getElementById('three-canvas');
        
        // Initialize Three.js
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x0a0a0f, 0.002);
        
        // Camera - Perspective
        this.camera = new THREE.PerspectiveCamera(
            60, // FOV
            window.innerWidth / window.innerHeight, // Aspect
            0.1, // Near
            1000 // Far
        );
        this.camera.position.set(0, 2, 8);
        this.camera.lookAt(0, 0, 0);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        
        // Add to state
        AppState.scene = this.scene;
        AppState.camera = this.camera;
        AppState.renderer = this.renderer;
        
        // Setup lighting
        this.setupLighting();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Start rendering loop
        this.animate();
    }
    
    /**
     * Setup scene lighting for premium look
     */
    setupLighting() {
        // Ambient light - base illumination
        const ambient = new THREE.AmbientLight(0x222244, 0.4);
        this.scene.add(ambient);
        
        // Main directional light - warm gold
        const mainLight = new THREE.DirectionalLight(0xffeedd, 1.2);
        mainLight.position.set(5, 10, 7);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 1024;
        mainLight.shadow.mapSize.height = 1024;
        this.scene.add(mainLight);
        
        // Fill light - cool blue
        const fillLight = new THREE.DirectionalLight(0x4444ff, 0.4);
        fillLight.position.set(-5, 0, 5);
        this.scene.add(fillLight);
        
        // Rim light - purple
        const rimLight = new THREE.DirectionalLight(0x8855ff, 0.3);
        rimLight.position.set(0, -5, -5);
        this.scene.add(rimLight);
        
        // Point light - for dramatic effects
        const pointLight = new THREE.PointLight(0xff6b9d, 0.5, 20);
        pointLight.position.set(0, 3, 0);
        this.scene.add(pointLight);
        
        // Store lights for animation
        this.lights = { mainLight, fillLight, rimLight, pointLight };
    }
    
    /**
     * Handle window resize
     */
    setupEventListeners() {
        window.addEventListener('resize', () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
        });
    }
    
    /**
     * Main animation loop
     */
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Update camera orbit if needed
        // this.updateCamera();
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
}

// ============================================
// HAND TRACKING MANAGER (MediaPipe)
// ============================================
class HandTrackingManager {
    constructor() {
        this.canvas = document.getElementById('hand-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.isInitialized = false;
        
        // Setup canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Initialize MediaPipe
        this.initializeMediaPipe();
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    /**
     * Initialize MediaPipe Hands
     */
    async initializeMediaPipe() {
        try {
            const hands = new Hands({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
                }
            });
            
            hands.setOptions({
                maxNumHands: 1,
                modelComplexity: 1,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });
            
            hands.onResults((results) => {
                this.handleResults(results);
            });
            
            // Start camera
            const camera = new Camera(document.createElement('video'), {
                onFrame: async () => {
                    await hands.send({ image: document.querySelector('video') });
                },
                width: 640,
                height: 480
            });
            
            await camera.start();
            this.isInitialized = true;
            AppState.isTracking = true;
            
            // Hide loading screen
            this.hideLoadingScreen();
            
            console.log('✨ Hand tracking initialized successfully!');
            
        } catch (error) {
            console.error('❌ Failed to initialize hand tracking:', error);
            this.showFallbackUI();
        }
    }
    
    /**
     * Handle MediaPipe results
     */
    handleResults(results) {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            
            // Draw hand landmarks
            this.drawHand(landmarks);
            
            // Process gestures
            this.processGestures(landmarks);
            
            // Store landmarks in state
            AppState.handLandmarks = landmarks;
        } else {
            AppState.handLandmarks = null;
            this.resetGestures();
        }
    }
    
    /**
     * Draw hand landmarks on canvas
     */
    drawHand(landmarks) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Draw connections
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
            [0, 5], [5, 6], [6, 7], [7, 8], // Index
            [0, 9], [9, 10], [10, 11], [11, 12], // Middle
            [0, 13], [13, 14], [14, 15], [15, 16], // Ring
            [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
            [5, 9], [9, 13], [13, 17] // Palm
        ];
        
        this.ctx.strokeStyle = 'rgba(247, 212, 74, 0.3)';
        this.ctx.lineWidth = 2;
        
        connections.forEach(([i, j]) => {
            const p1 = landmarks[i];
            const p2 = landmarks[j];
            this.ctx.beginPath();
            this.ctx.moveTo(p1.x * width, p1.y * height);
            this.ctx.lineTo(p2.x * width, p2.y * height);
            this.ctx.stroke();
        });
        
        // Draw landmarks
        landmarks.forEach((landmark, index) => {
            const x = landmark.x * width;
            const y = landmark.y * height;
            
            // Color based on finger
            const colors = [
                '#f7d44a', '#ff6b9d', '#a855f7', '#3b82f6', '#06b6d4'
            ];
            const fingerIndex = Math.floor(index / 4);
            const color = colors[fingerIndex % colors.length] || '#ffffff';
            
            // Glow effect
            const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, 10);
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, 'transparent');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 10, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Core dot
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    /**
     * Process gestures from hand landmarks
     */
    processGestures(landmarks) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Get key landmarks
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const middleTip = landmarks[12];
        const ringTip = landmarks[16];
        const pinkyTip = landmarks[20];
        const wrist = landmarks[0];
        
        // Calculate distances
        const pinchDistance = this.distance(thumbTip, indexTip);
        const waveHeight = this.getWaveHeight(landmarks);
        
        // Detect pinch gesture
        const isPinching = pinchDistance < 0.05;
        if (isPinching && !AppState.gestures.pinch) {
            // Pinch started - plant a seed!
            this.onPinch(landmarks);
        }
        AppState.gestures.pinch = isPinching;
        
        // Detect wave gesture
        const isWaving = waveHeight > 0.15;
        if (isWaving && !AppState.gestures.wave) {
            this.onWave(landmarks);
        }
        AppState.gestures.wave = isWaving;
        
        // Update UI hints
        this.updateUI(landmarks);
    }
    
    /**
     * Calculate distance between two points
     */
    distance(p1, p2) {
        return Math.sqrt(
            Math.pow(p1.x - p2.x, 2) +
            Math.pow(p1.y - p2.y, 2) +
            Math.pow(p1.z - p2.z, 2)
        );
    }
    
    /**
     * Calculate wave height (vertical movement of fingers)
     */
    getWaveHeight(landmarks) {
        let heights = [];
        for (let i = 5; i < 21; i += 4) {
            heights.push(landmarks[i].y);
        }
        const max = Math.max(...heights);
        const min = Math.min(...heights);
        return max - min;
    }
    
    /**
     * Reset gestures
     */
    resetGestures() {
        AppState.gestures.pinch = false;
        AppState.gestures.wave = false;
    }
    
    /**
     * Pinch event handler - Plant a seed
     */
    onPinch(landmarks) {
        console.log('🌱 Pinch detected! Planting seed...');
        AppState.seedCount++;
        document.getElementById('seed-count').textContent = AppState.seedCount;
        
        // Show action hint
        const hint = document.getElementById('action-hint');
        hint.textContent = '🌱 Seed planted!';
        hint.style.opacity = '1';
        setTimeout(() => {
            hint.style.opacity = '0';
        }, 2000);
        
        // TODO: Call Seed System to plant seed at hand position
        // This will be implemented in Phase 3
        this.createSeedEffect(landmarks);
    }
    
    /**
     * Wave event handler - Attract butterflies
     */
    onWave(landmarks) {
        console.log('🦋 Wave detected! Attracting butterflies...');
        AppState.butterflyCount++;
        document.getElementById('butterfly-count').textContent = AppState.butterflyCount;
        
        // Show action hint
        const hint = document.getElementById('action-hint');
        hint.textContent = '🦋 Butterflies approaching!';
        hint.style.opacity = '1';
        setTimeout(() => {
            hint.style.opacity = '0';
        }, 2000);
        
        // TODO: Call Butterfly System to spawn butterflies
        // This will be implemented in Phase 5
        this.createButterflyEffect(landmarks);
    }
    
    /**
     * Create visual effect for seed planting
     */
    createSeedEffect(landmarks) {
        // Get hand position
        const wrist = landmarks[0];
        const x = wrist.x * window.innerWidth;
        const y = wrist.y * window.innerHeight;
        
        // Create particle burst with Three.js
        // This is a placeholder - will be enhanced in later phases
        const particles = document.createElement('div');
        particles.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: radial-gradient(circle, #f7d44a, #ff6b9d);
            pointer-events: none;
            z-index: 100;
            animation: seed-burst 1s ease-out forwards;
        `;
        document.body.appendChild(particles);
        
        // Remove after animation
        setTimeout(() => {
            particles.remove();
        }, 1000);
    }
    
    /**
     * Create visual effect for butterflies
     */
    createButterflyEffect(landmarks) {
        // Get hand position
        const wrist = landmarks[0];
        const x = wrist.x * window.innerWidth;
        const y = wrist.y * window.innerHeight;
        
        // Create sparkle burst
        for (let i = 0; i < 20; i++) {
            const sparkle = document.createElement('div');
            const angle = Math.random() * Math.PI * 2;
            const distance = 50 + Math.random() * 100;
            const dx = Math.cos(angle) * distance;
            const dy = Math.sin(angle) * distance;
            
            sparkle.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: ${y}px;
                width: 4px;
                height: 4px;
                border-radius: 50%;
                background: ${['#ff6b9d', '#a855f7', '#3b82f6', '#f7d44a', '#06b6d4'][Math.floor(Math.random() * 5)]};
                pointer-events: none;
                z-index: 100;
                transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
                transform: translate(0, 0);
                opacity: 1;
            `;
            document.body.appendChild(sparkle);
            
            // Animate
            requestAnimationFrame(() => {
                sparkle.style.transform = `translate(${dx}px, ${dy}px) scale(0)`;
                sparkle.style.opacity = '0';
            });
            
            // Remove after animation
            setTimeout(() => {
                sparkle.remove();
            }, 1000);
        }
    }
    
    /**
     * Update UI based on hand position
     */
    updateUI(landmarks) {
        // Get hand position for UI tracking
        const wrist = landmarks[0];
        const x = wrist.x * window.innerWidth;
        const y = wrist.y * window.innerHeight;
        
        // Update cursor position for any UI elements
        // This can be used for hover effects later
    }
    
    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('fade-out');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                AppState.isReady = true;
            }, 800);
        }
    }
    
    /**
     * Show fallback UI if camera fails
     */
    showFallbackUI() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.innerHTML = `
                <div style="text-align: center; color: var(--text-secondary);">
                    <div style="font-size: 4rem; margin-bottom: var(--spacing-lg);">📷</div>
                    <h2 style="color: var(--text-primary); margin-bottom: var(--spacing-md);">
                        Camera Access Required
                    </h2>
                    <p style="max-width: 400px; margin: 0 auto var(--spacing-lg);">
                        Please allow camera access to enable the magical hand-tracking experience.
                    </p>
                    <button onclick="location.reload()" style="
                        background: var(--accent-gold);
                        color: var(--bg-primary);
                        border: none;
                        padding: var(--spacing-sm) var(--spacing-xl);
                        border-radius: 50px;
                        font-size: 1rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: transform 0.2s;
                    ">🔄 Retry</button>
                </div>
            `;
        }
    }
}

// ============================================
// MAIN APPLICATION INITIALIZATION
// ============================================
class Application {
    constructor() {
        console.log('🎂 Initializing Magical Birthday Experience...');
        
        // Initialize Three.js Scene
        this.sceneManager = new SceneManager();
        
        // Initialize Hand Tracking
        this.handTracking = new HandTrackingManager();
        
        // Setup additional systems
        this.setupParticleSystem();
        this.setupAudio();
        
        console.log('✨ Application ready!');
    }
    
    /**
     * Setup background particle system
     */
    setupParticleSystem() {
        // Create ambient floating particles
        const geometry = new THREE.BufferGeometry();
        const count = 200;
        const positions = new Float32Array(count * 3);
        
        for (let i = 0; i < count * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 20;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0x8855ff,
            size: 0.02,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(geometry, material);
        particles.position.y = 2;
        AppState.scene.add(particles);
        
        // Store for animation
        this.backgroundParticles = particles;
    }
    
    /**
     * Setup audio context (placeholder)
     */
    setupAudio() {
        // Audio will be implemented in Phase 8
        console.log('🎵 Audio system ready (placeholder)');
    }
}

// ============================================
// START APPLICATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const app = new Application();
    
    // Expose for debugging
    window.__APP__ = app;
});

// ============================================
// ERROR HANDLING
// ============================================
window.addEventListener('error', (error) => {
    console.error('❌ Application error:', error);
});

// ============================================
// ADD CUSTOM CSS ANIMATIONS DYNAMICALLY
// ============================================
const styleSheet = document.createElement("style");
styleSheet.textContent = `
    @keyframes seed-burst {
        0% {
            transform: scale(0);
            opacity: 1;
        }
        50% {
            transform: scale(3);
            opacity: 0.8;
        }
        100% {
            transform: scale(5);
            opacity: 0;
        }
    }
`;
document.head.appendChild(styleSheet);

console.log('🎉 Magical Birthday Experience loaded successfully!');
