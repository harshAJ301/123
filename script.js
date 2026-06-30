/**
 * ============================================
 * MILESTONE 1: CINEMATIC LOADING EXPERIENCE
 * ============================================
 * 
 * Features:
 * - Animated loading screen with flower logo
 * - 3D particle background using Three.js
 * - Progress bar animation
 * - "Begin Experience" button with hover effects
 * - Camera permission request flow
 * - Smooth transitions between states
 * 
 * No hand tracking yet - just beautiful UI/UX
 * ============================================
 */

// ============================================
// THREE.JS BACKGROUND
// ============================================
class ThreeBackground {
    constructor() {
        this.canvas = document.getElementById('bg-canvas');
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: true
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        this.camera.position.z = 30;
        
        this.createParticles();
        this.animate();
        this.handleResize();
    }
    
    createParticles() {
        // Create floating particles
        const geometry = new THREE.BufferGeometry();
        const count = 800;
        const positions = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        const colors = new Float32Array(count * 3);
        
        const colorPalette = [
            new THREE.Color(0xf7d44a), // gold
            new THREE.Color(0xff6b9d), // rose
            new THREE.Color(0xa855f7), // purple
            new THREE.Color(0x3b82f6), // blue
            new THREE.Color(0x06b6d4)  // cyan
        ];
        
        for (let i = 0; i < count; i++) {
            // Position in a sphere
            const radius = 20 + Math.random() * 15;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.cos(phi);
            positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
            
            sizes[i] = 0.1 + Math.random() * 0.3;
            
            const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        // Create texture for particles (glow dot)
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.3, 'rgba(255,255,255,0.8)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        
        const texture = new THREE.CanvasTexture(canvas);
        
        const material = new THREE.PointsMaterial({
            size: 0.4,
            map: texture,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true,
            vertexColors: true,
            opacity: 0.6
        });
        
        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.particles) {
            this.particles.rotation.x += 0.0005;
            this.particles.rotation.y += 0.001;
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
// LOADING SCREEN MANAGER
// ============================================
class LoadingManager {
    constructor() {
        this.progressBar = document.getElementById('progress-bar');
        this.progressText = document.getElementById('progress-text');
        this.loadingScreen = document.getElementById('loading-screen');
        this.beginScreen = document.getElementById('begin-screen');
        this.currentProgress = 0;
        
        this.startLoading();
    }
    
    startLoading() {
        // Simulate loading with beautiful timing
        const steps = [
            { progress: 20, delay: 400, label: '✦ loading assets' },
            { progress: 40, delay: 600, label: '✦ preparing magic' },
            { progress: 60, delay: 500, label: '✦ growing flowers' },
            { progress: 80, delay: 700, label: '✦ almost ready' },
            { progress: 95, delay: 400, label: '✦ final touches' },
            { progress: 100, delay: 300, label: '✦ complete' }
        ];
        
        let currentStep = 0;
        
        const nextStep = () => {
            if (currentStep >= steps.length) {
                this.onLoadingComplete();
                return;
            }
            
            const step = steps[currentStep];
            this.updateProgress(step.progress, step.label);
            
            currentStep++;
            setTimeout(nextStep, step.delay);
        };
        
        // Start after a small delay
        setTimeout(nextStep, 500);
    }
    
    updateProgress(value, label) {
        this.currentProgress = value;
        this.progressBar.style.width = value + '%';
        this.progressText.textContent = label || value + '%';
        
        // Add subtle glow when near completion
        if (value > 80) {
            this.progressBar.style.boxShadow = '0 0 20px rgba(247, 212, 74, 0.2)';
        }
    }
    
    onLoadingComplete() {
        // Hide loading screen with animation
        this.loadingScreen.classList.add('hidden');
        
        // Show begin screen after a moment
        setTimeout(() => {
            this.beginScreen.classList.add('visible');
            this.beginScreen.style.display = 'flex';
            
            // Animate button entrance
            const button = document.getElementById('begin-button');
            gsap.from(button, {
                scale: 0.9,
                opacity: 0,
                duration: 1,
                delay: 0.3,
                ease: 'back.out(1.7)'
            });
        }, 400);
    }
}

// ============================================
// CAMERA PERMISSION MANAGER
// ============================================
class CameraManager {
    constructor() {
        this.permissionOverlay = document.getElementById('camera-permission-overlay');
        this.beginButton = document.getElementById('begin-button');
        this.allowButton = document.getElementById('allow-camera');
        this.denyButton = document.getElementById('deny-camera');
        this.cameraFeed = document.getElementById('camera-feed');
        this.mainExperience = document.getElementById('main-experience');
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Begin button click
        this.beginButton.addEventListener('click', () => {
            this.showPermissionOverlay();
        });
        
        // Allow camera button
        this.allowButton.addEventListener('click', () => {
            this.requestCamera();
        });
        
        // Deny camera button
        this.denyButton.addEventListener('click', () => {
            this.skipCamera();
        });
    }
    
    showPermissionOverlay() {
        // Hide begin screen
        document.getElementById('begin-screen').classList.remove('visible');
        document.getElementById('begin-screen').style.display = 'none';
        
        // Show permission overlay with animation
        this.permissionOverlay.classList.add('visible');
        this.permissionOverlay.style.display = 'flex';
        
        // Animate permission content
        gsap.from('.permission-container', {
            scale: 0.9,
            opacity: 0,
            duration: 0.8,
            ease: 'back.out(1.7)'
        });
    }
    
    async requestCamera() {
        try {
            // Update button state
            this.allowButton.textContent = '✦ requesting... ✦';
            this.allowButton.disabled = true;
            this.allowButton.style.opacity = '0.6';
            
            // Request camera
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            });
            
            // Success - show camera feed
            this.cameraFeed.srcObject = stream;
            await this.cameraFeed.play();
            this.cameraFeed.style.display = 'block';
            
            // Hide permission overlay
            this.permissionOverlay.classList.remove('visible');
            this.permissionOverlay.style.display = 'none';
            
            // Show main experience
            this.mainExperience.style.display = 'block';
            
            // Animate main experience in
            gsap.from('#main-experience', {
                opacity: 0,
                duration: 1.2,
                ease: 'power2.out'
            });
            
            console.log('📷 Camera access granted');
            
        } catch (error) {
            console.error('❌ Camera access denied:', error);
            
            // Show error state
            this.allowButton.textContent = '✦ camera denied ✦';
            this.allowButton.style.background = 'rgba(255, 107, 157, 0.3)';
            
            // After a moment, show skip option
            setTimeout(() => {
                this.allowButton.textContent = '✦ retry ✦';
                this.allowButton.disabled = false;
                this.allowButton.style.opacity = '1';
                this.allowButton.style.background = 'linear-gradient(135deg, #f7d44a, #ff6b9d)';
                
                // Show skip button more prominently
                this.denyButton.textContent = '✦ continue without camera ✦';
                this.denyButton.style.borderColor = 'rgba(255,255,255,0.2)';
                this.denyButton.style.color = 'rgba(255,255,255,0.8)';
            }, 2000);
        }
    }
    
    skipCamera() {
        // Hide permission overlay
        this.permissionOverlay.classList.remove('visible');
        this.permissionOverlay.style.display = 'none';
        
        // Show main experience without camera
        this.mainExperience.style.display = 'block';
        
        // Add a note that camera is off
        const hint = document.getElementById('action-hint');
        hint.textContent = '✦ camera off • experience limited ✦';
        hint.style.color = 'rgba(255,255,255,0.3)';
        
        console.log('📷 Camera skipped, continuing without');
    }
}

// ============================================
// MAIN APPLICATION
// ============================================
class Application {
    constructor() {
        console.log('🌸 Initializing Digital Flowers...');
        console.log('📸 Milestone 1: Cinematic Loading Experience');
        
        // Start Three.js background
        this.background = new ThreeBackground();
        
        // Start loading sequence
        this.loading = new LoadingManager();
        
        // Setup camera manager (will be triggered by user)
        this.camera = new CameraManager();
        
        console.log('✨ Ready for Milestone 1');
        console.log('✦ Waiting for user to begin...');
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
    console.error('❌ Application error:', error.message);
});

console.log('🚀 Milestone 1: Cinematic Loading Screen');
console.log('✦ Created with love for digital flowers ✦');
