/**
 * ============================================
 * DIGITAL FLOWERS - AR Poetry Experience
 * Full Camera + Hand Tracking + Poetry
 * ============================================
 */

// ============================================
// STATE
// ============================================
const AppState = {
    isReady: false,
    isTracking: false,
    flowerCount: 2229,
    seedCount: 31,
    bloom: 0.35,
    grow: 0.30,
    handLandmarks: null,
    gestures: { pinch: false, wave: false },
    feedback: { cursor: null }
};

// ============================================
// HAND TRACKING
// ============================================
class HandTrackingManager {
    constructor() {
        this.canvas = document.getElementById('hand-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.video = document.getElementById('camera-feed');
        this.lastPinchTime = 0;
        this.lastWaveTime = 0;
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.initializeMediaPipe();
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    async initializeMediaPipe() {
        try {
            this.updateLoading('✦ starting camera ✦');
            
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: 640, height: 480 }
            });
            this.video.srcObject = stream;
            await this.video.play();
            
            this.updateLoading('✦ loading hand tracking ✦');
            
            const hands = new Hands({
                locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
            });
            
            hands.setOptions({
                maxNumHands: 1,
                modelComplexity: 1,
                minDetectionConfidence: 0.7,
                minTrackingConfidence: 0.6
            });
            
            hands.onResults((results) => this.handleResults(results));
            
            const camera = new Camera(this.video, {
                onFrame: async () => {
                    try {
                        await hands.send({ image: this.video });
                    } catch (e) {}
                },
                width: 640,
                height: 480
            });
            
            await camera.start();
            
            this.updateLoading('✦ ready ✦');
            setTimeout(() => this.hideLoading(), 1000);
            
            console.log('✦ Hand tracking ready ✦');
            
        } catch (error) {
            console.error('❌ Camera error:', error);
            this.showFallbackUI();
        }
    }
    
    updateLoading(text) {
        const el = document.querySelector('.loading-text');
        if (el) el.textContent = text;
    }
    
    hideLoading() {
        const screen = document.getElementById('loading-screen');
        if (screen) {
            screen.classList.add('fade-out');
            setTimeout(() => {
                screen.style.display = 'none';
                AppState.isReady = true;
            }, 800);
        }
    }
    
    showFallbackUI() {
        const screen = document.getElementById('loading-screen');
        if (screen) {
            screen.innerHTML = `
                <div style="text-align:center;color:white;padding:20px;">
                    <div style="font-size:4rem;margin-bottom:20px;">📷</div>
                    <h2 style="margin-bottom:12px;font-weight:300;letter-spacing:0.1em;">camera access required</h2>
                    <p style="max-width:400px;margin:0 auto 20px;color:rgba(255,255,255,0.5);font-weight:300;">
                        please allow camera access for the experience
                    </p>
                    <button onclick="location.reload()" style="
                        background:rgba(255,255,255,0.1);
                        border:1px solid rgba(255,255,255,0.2);
                        padding:12px 32px;
                        border-radius:40px;
                        font-size:0.85rem;
                        font-weight:300;
                        cursor:pointer;
                        color:white;
                        letter-spacing:0.1em;
                        transition: all 0.3s ease;
                    "
                    onmouseover="this.style.background='rgba(255,255,255,0.2)'"
                    onmouseout="this.style.background='rgba(255,255,255,0.1)'"
                    >✦ retry ✦</button>
                </div>
            `;
        }
    }
    
    handleResults(results) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            this.drawHand(landmarks);
            this.processGestures(landmarks);
            this.updateCursor(landmarks);
            AppState.handLandmarks = landmarks;
        } else {
            AppState.handLandmarks = null;
            if (AppState.feedback.cursor) {
                AppState.feedback.cursor.style.opacity = '0';
            }
        }
    }
    
    drawHand(landmarks) {
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        // Connections - elegant lines
        const connections = [
            [0,1],[1,2],[2,3],[3,4],
            [0,5],[5,6],[6,7],[7,8],
            [0,9],[9,10],[10,11],[11,12],
            [0,13],[13,14],[14,15],[15,16],
            [0,17],[17,18],[18,19],[19,20],
            [5,9],[9,13],[13,17]
        ];
        
        // Draw elegant lines with glow
        connections.forEach(([i, j]) => {
            const p1 = landmarks[i];
            const p2 = landmarks[j];
            
            const gradient = this.ctx.createLinearGradient(
                p1.x * w, p1.y * h,
                p2.x * w, p2.y * h
            );
            gradient.addColorStop(0, 'rgba(247, 212, 74, 0.25)');
            gradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.2)');
            gradient.addColorStop(1, 'rgba(255, 107, 157, 0.25)');
            
            this.ctx.shadowColor = 'rgba(247, 212, 74, 0.1)';
            this.ctx.shadowBlur = 10;
            this.ctx.strokeStyle = gradient;
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.moveTo(p1.x * w, p1.y * h);
            this.ctx.lineTo(p2.x * w, p2.y * h);
            this.ctx.stroke();
        });
        
        this.ctx.shadowBlur = 0;
        
        // Draw subtle landmarks
        const colors = ['#f7d44a', '#ff6b9d', '#a855f7', '#3b82f6', '#06b6d4'];
        landmarks.forEach((landmark, index) => {
            const x = landmark.x * w;
            const y = landmark.y * h;
            const fingerIndex = Math.floor(index / 4);
            const color = colors[fingerIndex % colors.length];
            
            // Subtle glow
            const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, 12);
            gradient.addColorStop(0, color + '40');
            gradient.addColorStop(1, 'transparent');
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 12, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Tiny dot
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 15;
            this.ctx.fillStyle = color + '80';
            this.ctx.beginPath();
            this.ctx.arc(x, y, 2.5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });
        
        // Pinch indicator - subtle ring
        if (AppState.gestures.pinch) {
            const thumb = landmarks[4];
            const index = landmarks[8];
            const cx = (thumb.x + index.x) / 2 * w;
            const cy = (thumb.y + index.y) / 2 * h;
            
            this.ctx.strokeStyle = 'rgba(247, 212, 74, 0.3)';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, 25, 0, Math.PI * 2);
            this.ctx.stroke();
            
            this.ctx.strokeStyle = 'rgba(255, 107, 157, 0.15)';
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, 40, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }
    
    processGestures(landmarks) {
        const thumb = landmarks[4];
        const index = landmarks[8];
        const now = Date.now();
        
        // Pinch detection
        const distance = Math.sqrt(
            Math.pow(thumb.x - index.x, 2) +
            Math.pow(thumb.y - index.y, 2) +
            Math.pow(thumb.z - index.z, 2)
        );
        const isPinching = distance < 0.04;
        
        if (isPinching && !AppState.gestures.pinch && now - this.lastPinchTime > 500) {
            this.onPinch(landmarks);
            this.lastPinchTime = now;
        }
        AppState.gestures.pinch = isPinching;
        
        // Wave detection
        let heights = [];
        for (let i = 5; i < 21; i += 4) {
            heights.push(landmarks[i].y);
        }
        const waveHeight = Math.max(...heights) - Math.min(...heights);
        const isWaving = waveHeight > 0.12;
        
        if (isWaving && !AppState.gestures.wave && now - this.lastWaveTime > 1000) {
            this.onWave(landmarks);
            this.lastWaveTime = now;
        }
        AppState.gestures.wave = isWaving;
    }
    
    onPinch(landmarks) {
        AppState.seedCount++;
        AppState.flowerCount++;
        
        // Update counters with comma formatting
        document.getElementById('seed-counter').textContent = 
            AppState.seedCount.toLocaleString();
        document.getElementById('flower-counter').textContent = 
            AppState.flowerCount.toLocaleString();
        
        // Show hint
        const hint = document.getElementById('action-hint');
        hint.textContent = '✦ flower planted ✦';
        hint.style.color = '#f7d44a';
        clearTimeout(this.hintTimeout);
        this.hintTimeout = setTimeout(() => {
            hint.textContent = '✧ pinch to plant a flower ✧';
            hint.style.color = 'rgba(255,255,255,0.5)';
        }, 1500);
        
        // Create burst
        this.createBurst(landmarks, '#f7d44a', 15);
    }
    
    onWave(landmarks) {
        // Show hint
        const hint = document.getElementById('action-hint');
        hint.textContent = '✦ butterflies dancing ✦';
        hint.style.color = '#ff6b9d';
        clearTimeout(this.hintTimeout);
        this.hintTimeout = setTimeout(() => {
            hint.textContent = '✧ pinch to plant a flower ✧';
            hint.style.color = 'rgba(255,255,255,0.5)';
        }, 1500);
        
        // Create burst
        this.createBurst(landmarks, '#ff6b9d', 20);
    }
    
    createBurst(landmarks, color, count = 15) {
        const wrist = landmarks[0];
        const x = wrist.x * window.innerWidth;
        const y = wrist.y * window.innerHeight;
        const colors = ['#f7d44a', '#ff6b9d', '#a855f7', '#3b82f6', '#06b6d4'];
        
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            const angle = Math.random() * Math.PI * 2;
            const distance = 30 + Math.random() * 80;
            const size = 3 + Math.random() * 6;
            const duration = 600 + Math.random() * 400;
            
            particle.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: ${y}px;
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                pointer-events: none;
                z-index: 50;
                opacity: 0.8;
                transform: translate(0, 0) scale(1);
                transition: all ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1);
            `;
            document.body.appendChild(particle);
            
            requestAnimationFrame(() => {
                const dx = Math.cos(angle) * distance;
                const dy = Math.sin(angle) * distance;
                particle.style.transform = `translate(${dx}px, ${dy}px) scale(0)`;
                particle.style.opacity = '0';
            });
            
            setTimeout(() => particle.remove(), duration + 100);
        }
    }
    
    updateCursor(landmarks) {
        const wrist = landmarks[0];
        const x = wrist.x * window.innerWidth;
        const y = wrist.y * window.innerHeight;
        
        let cursor = AppState.feedback.cursor;
        if (!cursor) {
            cursor = document.createElement('div');
            cursor.style.cssText = `
                position: fixed;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                border: 1px solid rgba(247, 212, 74, 0.15);
                pointer-events: none;
                z-index: 3;
                transform: translate(-50%, -50%);
                transition: all 0.15s ease;
                background: radial-gradient(circle, rgba(247, 212, 74, 0.05), transparent);
            `;
            document.body.appendChild(cursor);
            AppState.feedback.cursor = cursor;
        }
        
        cursor.style.left = x + 'px';
        cursor.style.top = y + 'px';
        cursor.style.opacity = '0.6';
        
        if (AppState.gestures.pinch) {
            cursor.style.transform = 'translate(-50%, -50%) scale(0.3)';
            cursor.style.borderColor = 'rgba(255, 107, 157, 0.3)';
            cursor.style.background = 'radial-gradient(circle, rgba(255, 107, 157, 0.1), transparent)';
        } else {
            cursor.style.transform = 'translate(-50%, -50%) scale(1)';
            cursor.style.borderColor = 'rgba(247, 212, 74, 0.15)';
            cursor.style.background = 'radial-gradient(circle, rgba(247, 212, 74, 0.05), transparent)';
        }
    }
}

// ============================================
// CONTROLS MANAGER
// ============================================
class ControlsManager {
    constructor() {
        this.setupControls();
        this.startCounterAnimation();
    }
    
    setupControls() {
        // We'll make these interactive later
        // For now they display the values
        
        // Animate bloom value
        this.animateValue('bloom-value', AppState.bloom);
        this.animateValue('grow-value', AppState.grow);
    }
    
    animateValue(elementId, targetValue) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        let current = 0;
        const duration = 2000;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const value = eased * targetValue;
            
            element.textContent = value.toFixed(2);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    startCounterAnimation() {
        // Animate flower counter
        const flowerEl = document.getElementById('flower-counter');
        if (flowerEl) {
            let current = 0;
            const target = AppState.flowerCount;
            const duration = 3000;
            const startTime = Date.now();
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                const value = Math.floor(eased * target);
                
                flowerEl.textContent = value.toLocaleString();
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };
            
            animate();
        }
    }
}

// ============================================
// INITIALIZE
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const handTracking = new HandTrackingManager();
    const controls = new ControlsManager();
    
    console.log('✦ Digital Flowers ready ✦');
});

console.log('🌸 How I would send her flowers, but she didn\'t exist');
