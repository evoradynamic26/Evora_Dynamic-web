/**
 * ÉVORA DYNAMIC - BE ON BEAT
 * Script Principal & Motores Interactivos
 * Creado para Expo-Tec 2026
 */

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initHeroParticles();
    initAudioEngine();
    initSlider();
    initMiniGame();
    initReviewsSystem();
    initDownloadModals();
});

/* ==========================================================================
   1. NAVEGACIÓN Y MENÚ RESPONSIVO
   ========================================================================== */
function initNavigation() {
    const navbar = document.getElementById('navbar');
    const menuToggle = document.getElementById('menuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    const sections = document.querySelectorAll('section[id], footer[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    // Efecto de sombra y fondo al scrollear
    window.addEventListener('scroll', () => {
        if (window.scrollY > 30) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Scrollspy: Resalta el enlace activo según la sección visible
        let currentSectionId = '';
        sections.forEach(section => {
            const top = section.offsetTop - 180;
            const height = section.offsetHeight;
            if (window.pageYOffset >= top && window.pageYOffset < top + height) {
                currentSectionId = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('active');
            }
        });
    });

    // Toggle de Menú Móvil
    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => {
            const isOpen = mobileMenu.classList.toggle('active');
            menuToggle.innerHTML = isOpen
                ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
                : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`;
        });

        // Cerrar menú al hacer clic en cualquier enlace
        document.querySelectorAll('.mobile-menu-link').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                menuToggle.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`;
            });
        });
    }
}

/* ==========================================================================
   2. MOTOR DE SONIDO PROCEDURAL (Web Audio API - 100% Offline)
   ========================================================================== */
let audioCtx = null;
let isAudioPlaying = false;
let beatInterval = null;
let currentStep = 0;

function getAudioContext() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

// Generador de Bombo (Kick)
function playKick(time) {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.35);

    gain.gain.setValueAtTime(0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.35);
}

// Generador de Hi-Hat (Ruido blanco con filtro pasa-altos)
function playHiHat(time, open = false) {
    const ctx = getAudioContext();
    const bufferSize = ctx.sampleRate * (open ? 0.15 : 0.04);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7500;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(open ? 0.25 : 0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + (open ? 0.15 : 0.04));

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(time);
    noise.stop(time + (open ? 0.15 : 0.04));
}

// Generador de Snare / Caja rítmica
function playSnare(time) {
    const ctx = getAudioContext();
    // Tonal part
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.15);
    oscGain.gain.setValueAtTime(0.4, time);
    oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.15);

    // Noise part
    const bufferSize = ctx.sampleRate * 0.18;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.18);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(time);
    noise.stop(time + 0.18);
}

// Sintetizador de Bajo Cyberpunk / Chiptune
const bassNotes = [110, 110, 130.81, 146.83, 110, 110, 164.81, 146.83]; // A minor
function playBass(time, step) {
    const ctx = getAudioContext();
    const freq = bassNotes[step % bassNotes.length];

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, time);
    filter.frequency.exponentialRampToValueAtTime(250, time + 0.2);

    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.22);
}

// Efectos de sonido para UI y Minijuego
window.playSfxJump = function() {
    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
    } catch (e) {}
};

window.playSfxScore = function() {
    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
    } catch (e) {}
};

window.playSfxCrash = function() {
    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
};

function initAudioEngine() {
    const audioToggleBtn = document.getElementById('audioToggleBtn');
    const audioStatusText = document.getElementById('audioStatusText');
    const equalizer = document.getElementById('equalizerBars');
    const mobileAudioBtn = document.getElementById('mobileAudioToggleBtn');
    const mobileAudioText = document.getElementById('mobileAudioStatusText');

    function toggleAudio() {
        getAudioContext();
        if (isAudioPlaying) {
            stopAudioLoop();
            if (audioStatusText) audioStatusText.textContent = 'Música: OFF';
            if (mobileAudioText) mobileAudioText.textContent = '🎵 Música Beat: OFF';
            if (equalizer) equalizer.classList.remove('playing');
            if (audioToggleBtn) audioToggleBtn.classList.remove('active');
            if (mobileAudioBtn) mobileAudioBtn.classList.remove('active');
        } else {
            startAudioLoop();
            if (audioStatusText) audioStatusText.textContent = 'Música: ON';
            if (mobileAudioText) mobileAudioText.textContent = '🎵 Música Beat: ON';
            if (equalizer) equalizer.classList.add('playing');
            if (audioToggleBtn) audioToggleBtn.classList.add('active');
            if (mobileAudioBtn) mobileAudioBtn.classList.add('active');
        }
        isAudioPlaying = !isAudioPlaying;
    }

    if (audioToggleBtn) audioToggleBtn.addEventListener('click', toggleAudio);
    if (mobileAudioBtn) mobileAudioBtn.addEventListener('click', toggleAudio);
}

function startAudioLoop() {
    const ctx = getAudioContext();
    const tempo = 124; // BPM energético
    const stepDuration = 60 / tempo / 2; // Semi-corcheas (16th notes)

    currentStep = 0;
    let nextNoteTime = ctx.currentTime + 0.05;

    beatInterval = setInterval(() => {
        while (nextNoteTime < ctx.currentTime + 0.1) {
            // Kick en los 4 tiempos principales
            if (currentStep % 4 === 0) {
                playKick(nextNoteTime);
            }
            // Snare en el 2 y 4 (pasos 4 y 12 de 16)
            if (currentStep % 8 === 4) {
                playSnare(nextNoteTime);
            }
            // Hi-Hat en contratiempos
            if (currentStep % 2 === 0) {
                playHiHat(nextNoteTime, currentStep % 4 === 2);
            }
            // Línea de bajo continua
            playBass(nextNoteTime, currentStep);

            nextNoteTime += stepDuration;
            currentStep = (currentStep + 1) % 16;
        }
    }, 25);
}

function stopAudioLoop() {
    if (beatInterval) {
        clearInterval(beatInterval);
        beatInterval = null;
    }
}

/* ==========================================================================
   3. CANVAS DE PARTÍCULAS CYBERPUNK (HERO BACKGROUND)
   ========================================================================== */
function initHeroParticles() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = canvas.width = canvas.parentElement.offsetWidth;
    let height = canvas.height = canvas.parentElement.offsetHeight;

    window.addEventListener('resize', () => {
        if (!canvas.parentElement) return;
        width = canvas.width = canvas.parentElement.offsetWidth;
        height = canvas.height = canvas.parentElement.offsetHeight;
    });

    const particles = [];
    const particleCount = Math.min(50, Math.floor(width / 22));

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.8;
            this.vy = (Math.random() - 0.5) * 0.8;
            this.radius = Math.random() * 2 + 1;
            this.color = Math.random() > 0.4 ? 'rgba(0, 212, 255, ' : 'rgba(124, 58, 237, ';
            this.alpha = Math.random() * 0.6 + 0.2;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            if (this.x < 0) this.x = width;
            if (this.x > width) this.x = 0;
            if (this.y < 0) this.y = height;
            if (this.y > height) this.y = 0;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `${this.color}${this.alpha})`;
            ctx.fill();
        }
    }

    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);

        // Conectar partículas cercanas con líneas suaves
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 110) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(0, 212, 255, ${0.18 * (1 - dist / 110)})`;
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                }
            }
        }

        particles.forEach(p => {
            p.update();
            p.draw();
        });

        requestAnimationFrame(animate);
    }

    animate();
}

/* ==========================================================================
   4. CARRUSEL INTERACTIVO CON CONTROLES (ESCENAS)
   ========================================================================== */
function initSlider() {
    const slidesContainer = document.querySelector('.slides');
    const slides = document.querySelectorAll('.slides img');
    const prevBtn = document.getElementById('sliderPrev');
    const nextBtn = document.getElementById('sliderNext');
    const dotsContainer = document.getElementById('sliderDots');
    const sliderBox = document.querySelector('.slider');

    if (!slidesContainer || slides.length === 0) return;

    // Desactivar explícitamente cualquier animación CSS keyframe para que JS tenga control total
    slidesContainer.style.animation = 'none';
    slidesContainer.style.webkitAnimation = 'none';
    slidesContainer.style.transition = 'transform 0.45s cubic-bezier(0.23, 1, 0.32, 1)';

    let currentIndex = 0;
    const totalSlides = slides.length;
    let autoSlideTimer = null;

    // Crear puntos indicadores (dots)
    if (dotsContainer) {
        dotsContainer.innerHTML = '';
        for (let i = 0; i < totalSlides; i++) {
            const dot = document.createElement('button');
            dot.className = `slider-dot ${i === 0 ? 'active' : ''}`;
            dot.setAttribute('aria-label', `Ir a escena ${i + 1}`);
            dot.addEventListener('click', (e) => {
                e.preventDefault();
                goToSlide(i);
                resetAutoSlide();
            });
            dotsContainer.appendChild(dot);
        }
    }

    function updateSlider() {
        slidesContainer.style.transform = `translateX(-${(currentIndex * 100) / totalSlides}%)`;
        if (dotsContainer) {
            const dots = dotsContainer.querySelectorAll('.slider-dot');
            dots.forEach((dot, idx) => {
                dot.classList.toggle('active', idx === currentIndex);
            });
        }
    }

    function goToSlide(index) {
        currentIndex = (index + totalSlides) % totalSlides;
        updateSlider();
    }

    function nextSlide() {
        goToSlide(currentIndex + 1);
    }

    function prevSlide() {
        goToSlide(currentIndex - 1);
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            prevSlide();
            resetAutoSlide();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            nextSlide();
            resetAutoSlide();
        });
    }

    // Soporte para gestos táctiles (Swipe en celulares)
    let touchStartX = 0;
    let touchEndX = 0;

    if (sliderBox) {
        sliderBox.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        sliderBox.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });
    }

    function handleSwipe() {
        const threshold = 40;
        if (touchEndX < touchStartX - threshold) {
            nextSlide();
            resetAutoSlide();
        } else if (touchEndX > touchStartX + threshold) {
            prevSlide();
            resetAutoSlide();
        }
    }

    function startAutoSlide() {
        clearInterval(autoSlideTimer);
        autoSlideTimer = setInterval(nextSlide, 5000);
    }

    function resetAutoSlide() {
        clearInterval(autoSlideTimer);
        startAutoSlide();
    }

    // Pausar auto-avance al pasar el cursor
    if (sliderBox) {
        sliderBox.addEventListener('mouseenter', () => clearInterval(autoSlideTimer));
        sliderBox.addEventListener('mouseleave', startAutoSlide);
    }

    // Navegación con teclado si el slider tiene foco
    window.addEventListener('keydown', (e) => {
        const gallery = document.getElementById('gallery');
        if (gallery) {
            const rect = gallery.getBoundingClientRect();
            if (rect.top >= -200 && rect.bottom <= window.innerHeight + 200) {
                if (e.key === 'ArrowLeft') {
                    prevSlide();
                    resetAutoSlide();
                } else if (e.key === 'ArrowRight') {
                    nextSlide();
                    resetAutoSlide();
                }
            }
        }
    });

    updateSlider();
    startAutoSlide();
}

/* ==========================================================================
   5. MINI-JUEGO DE DEMOSTRACIÓN ARCADE: BE ON BEAT RUNNER
   ========================================================================== */
function initMiniGame() {
    const canvas = document.getElementById('arcadeCanvas');
    const startBtn = document.getElementById('arcadeStartBtn');
    const scoreVal = document.getElementById('arcadeScore');
    const highScoreVal = document.getElementById('arcadeHighScore');
    const statusMsg = document.getElementById('arcadeStatus');

    if (!canvas || !startBtn) return;

    const ctx = canvas.getContext('2d');
    let width = canvas.width = 640;
    let height = canvas.height = 240;

    let isPlaying = false;
    let score = 0;
    let highScore = parseInt(localStorage.getItem('be_on_beat_high_score') || '0', 10);
    if (highScoreVal) highScoreVal.textContent = highScore;

    let gameLoopId = null;
    let frame = 0;

    // Estado del Jugador (Personaje Rítmico de Ciberseguridad)
    const player = {
        x: 60,
        y: height - 55,
        width: 32,
        height: 32,
        vy: 0,
        gravity: 0.72,
        jumpPower: -11.5,
        isGrounded: true,
        color: '#00d4ff',
        trail: []
    };

    // Obstáculos (Virus & Malware)
    let obstacles = [];
    const threatTypes = [
        { name: 'MALWARE', color: '#ff3366', width: 22, height: 35, shape: 'spike' },
        { name: 'RANSOM', color: '#ff9900', width: 28, height: 42, shape: 'block' },
        { name: 'DDoS', color: '#a855f7', width: 34, height: 30, shape: 'spike' }
    ];

    function jump() {
        if (!isPlaying) return;
        if (player.isGrounded) {
            player.vy = player.jumpPower;
            player.isGrounded = false;
            if (window.playSfxJump) window.playSfxJump();
        }
    }

    // Controles: Barra espaciadora, flecha arriba o clic/touch en canvas
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.code === 'ArrowUp') {
            if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                e.preventDefault();
                jump();
            }
        }
    });

    canvas.addEventListener('click', jump);
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        jump();
    });

    function spawnObstacle() {
        const type = threatTypes[Math.floor(Math.random() * threatTypes.length)];
        obstacles.push({
            x: width + 20,
            y: height - 20 - type.height,
            width: type.width,
            height: type.height,
            name: type.name,
            color: type.color,
            shape: type.shape,
            passed: false
        });
    }

    function resetGame() {
        obstacles = [];
        player.y = height - 55;
        player.vy = 0;
        player.isGrounded = true;
        player.trail = [];
        score = 0;
        frame = 0;
        if (scoreVal) scoreVal.textContent = '0';
        if (statusMsg) statusMsg.textContent = '¡Esquivá las amenazas al ritmo de la música!';
    }

    function startGame() {
        resetGame();
        isPlaying = true;
        startBtn.textContent = 'REINICIAR';
        startBtn.classList.remove('btn-gaming-solid');
        startBtn.classList.add('btn-gaming-outline');
        cancelAnimationFrame(gameLoopId);
        gameLoop();
    }

    startBtn.addEventListener('click', startGame);

    function gameOver() {
        isPlaying = false;
        if (window.playSfxCrash) window.playSfxCrash();
        if (statusMsg) statusMsg.innerHTML = `<span style="color: #ff3366;">¡AMENAZA DETECTADA!</span> Puntuación final: <strong>${score}</strong>. Presioná reiniciar para intentar de nuevo.`;
        startBtn.textContent = 'JUGAR DE NUEVO';
        startBtn.classList.remove('btn-gaming-outline');
        startBtn.classList.add('btn-gaming-solid');

        if (score > highScore) {
            highScore = score;
            localStorage.setItem('be_on_beat_high_score', highScore);
            if (highScoreVal) highScoreVal.textContent = highScore;
            if (statusMsg) statusMsg.innerHTML += ' 🌟 <strong>¡Nuevo Récord!</strong>';
        }
    }

    function gameLoop() {
        if (!isPlaying) return;
        frame++;

        // Actualizar física del jugador
        player.vy += player.gravity;
        player.y += player.vy;

        if (player.y >= height - 20 - player.height) {
            player.y = height - 20 - player.height;
            player.vy = 0;
            player.isGrounded = true;
        }

        // Estela neón del jugador
        player.trail.unshift({ x: player.x, y: player.y });
        if (player.trail.length > 5) player.trail.pop();

        // Spawn de obstáculos al compás
        if (frame % 85 === 0) {
            spawnObstacle();
        }

        // Velocidad de scroll
        const scrollSpeed = 4.8 + Math.min(score * 0.1, 4.5);

        // Dibujar escena Cyberpunk
        ctx.fillStyle = '#090d12';
        ctx.fillRect(0, 0, width, height);

        // Rejilla de fondo rítmica
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.08)';
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 30) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        // Suelo cibernético
        ctx.fillStyle = '#151b27';
        ctx.fillRect(0, height - 20, width, 20);
        ctx.fillStyle = '#00d4ff';
        ctx.fillRect(0, height - 20, width, 2);

        // Dibujar estela
        player.trail.forEach((t, index) => {
            const alpha = 0.3 - index * 0.05;
            ctx.fillStyle = `rgba(0, 212, 255, ${alpha})`;
            ctx.fillRect(t.x, t.y, player.width, player.height);
        });

        // Dibujar Jugador (Cubo Neón con núcleo de pulso)
        ctx.fillStyle = player.color;
        ctx.shadowColor = '#00d4ff';
        ctx.shadowBlur = 12;
        ctx.fillRect(player.x, player.y, player.width, player.height);
        ctx.shadowBlur = 0;

        // Ojo / visor del personaje
        ctx.fillStyle = '#090d12';
        ctx.fillRect(player.x + 18, player.y + 8, 8, 6);

        // Actualizar y dibujar obstáculos
        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obs = obstacles[i];
            obs.x -= scrollSpeed;

            // Dibujar amenaza
            ctx.fillStyle = obs.color;
            ctx.shadowColor = obs.color;
            ctx.shadowBlur = 10;

            if (obs.shape === 'spike') {
                ctx.beginPath();
                ctx.moveTo(obs.x + obs.width / 2, obs.y);
                ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
                ctx.lineTo(obs.x, obs.y + obs.height);
                ctx.closePath();
                ctx.fill();
            } else {
                ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
            }
            ctx.shadowBlur = 0;

            // Etiqueta del virus
            ctx.fillStyle = '#ffffff';
            ctx.font = '8px "Exo 2", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(obs.name, obs.x + obs.width / 2, obs.y - 4);

            // Colisión AABB
            const hitboxMargin = 4;
            if (
                player.x + hitboxMargin < obs.x + obs.width &&
                player.x + player.width - hitboxMargin > obs.x &&
                player.y + hitboxMargin < obs.y + obs.height &&
                player.y + player.height - hitboxMargin > obs.y
            ) {
                gameOver();
                return;
            }

            // Sumar puntos al esquivar
            if (!obs.passed && obs.x + obs.width < player.x) {
                obs.passed = true;
                score += 10;
                if (scoreVal) scoreVal.textContent = score;
                if (window.playSfxScore) window.playSfxScore();
            }

            // Eliminar obstáculos fuera de pantalla
            if (obs.x + obs.width < -30) {
                obstacles.splice(i, 1);
            }
        }

        gameLoopId = requestAnimationFrame(gameLoop);
    }

    // Dibujado inicial en reposo
    ctx.fillStyle = '#090d12';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#151b27';
    ctx.fillRect(0, height - 20, width, 20);
    ctx.fillStyle = '#00d4ff';
    ctx.fillRect(0, height - 20, width, 2);
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px "Exo 2", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Presioná "INICIAR DEMO" y saltá con ESPACIO o Clic al compás', width / 2, height / 2 - 5);
}

/* ==========================================================================
   6. SISTEMA DE RESEÑAS Y FEEDBACK INTERACTIVO EN VIVO (CON EDICIÓN Y ELIMINACIÓN)
   ========================================================================== */
function initReviewsSystem() {
    const starsContainer = document.getElementById('interactiveStars');
    const reviewForm = document.getElementById('reviewForm');
    const reviewsList = document.getElementById('dynamicReviewsList');
    const selectedRatingInput = document.getElementById('selectedRating');

    if (!starsContainer || !reviewForm || !reviewsList) return;

    let currentRating = 5;

    // Reseñas predeterminadas de la Expo-Tec 2026 para que se carguen en cualquier dispositivo
    const DEFAULT_REVIEWS = [
        {
            id: 'rev-prof-carlos',
            name: 'Prof. Carlos Mendoza',
            role: 'Docente E.E.S.T N°3',
            rating: 5,
            comment: 'Excelente propuesta interdisciplinaria combinando ciberseguridad, programación y música rítmica. Gran trabajo del equipo para la Expo-Tec 2026.',
            date: 'Expo-Tec, 2026'
        },
        {
            id: 'rev-lucas-benitez',
            name: 'Lucas Benítez',
            role: 'Estudiante 7mo año',
            rating: 5,
            comment: 'La demo arcade en el navegador y los controles rítmicos quedaron geniales. La temática de esquivar malware al compás de la música es muy original y fluida.',
            date: 'Expo-Tec, 2026'
        },
        {
            id: 'rev-mariana-gomez',
            name: 'Mariana Gómez',
            role: 'Visitante Expo-Tec',
            rating: 5,
            comment: 'Me encantó la estética futurista y la música integrada. Se nota el compromiso y dedicación de todo el grupo en la presentación del stand.',
            date: 'Expo-Tec, 2026'
        }
    ];

    // Cargar y sincronizar reseñas guardadas en localStorage
    let savedReviews = [];
    const rawReviews = localStorage.getItem('evora_reviews');
    if (!rawReviews) {
        savedReviews = [...DEFAULT_REVIEWS];
        saveReviewsToStorage();
    } else {
        try {
            const parsed = JSON.parse(rawReviews);
            if (Array.isArray(parsed) && parsed.length > 0) {
                savedReviews = parsed.map((item, idx) => ({
                    id: item.id || `rev-${Date.now()}-${idx}`,
                    name: item.name || 'Anónimo',
                    role: item.role || 'Visitante',
                    rating: Number(item.rating) || 5,
                    comment: item.comment || '',
                    date: item.date || 'Expo-Tec, 2026'
                }));
            } else {
                savedReviews = [...DEFAULT_REVIEWS];
                saveReviewsToStorage();
            }
        } catch (e) {
            savedReviews = [...DEFAULT_REVIEWS];
            saveReviewsToStorage();
        }
    }

    function saveReviewsToStorage() {
        localStorage.setItem('evora_reviews', JSON.stringify(savedReviews));
    }

    function showReviewNotice(message) {
        const successNotice = document.getElementById('reviewSuccessNotice');
        if (successNotice) {
            successNotice.textContent = message;
            successNotice.classList.add('visible');
            setTimeout(() => successNotice.classList.remove('visible'), 4000);
        }
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Selector interactivo de estrellas del formulario principal
    const starSvgs = starsContainer.querySelectorAll('.interactive-star');
    starSvgs.forEach((star, index) => {
        star.addEventListener('mouseenter', () => highlightStars(index + 1));
        star.addEventListener('click', () => {
            currentRating = index + 1;
            if (selectedRatingInput) selectedRatingInput.value = currentRating;
            highlightStars(currentRating);
        });
    });

    starsContainer.addEventListener('mouseleave', () => highlightStars(currentRating));

    function highlightStars(count) {
        starSvgs.forEach((star, idx) => {
            if (idx < count) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    // Renderizar todas las reseñas en pantalla
    function renderAllReviews() {
        reviewsList.innerHTML = '';
        if (savedReviews.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-reviews-state';
            emptyState.innerHTML = `
                <p>No hay comentarios guardados en este dispositivo.</p>
                <button type="button" class="btn-restore-reviews" id="btnRestoreReviews">🔄 Restaurar comentarios de muestra</button>
            `;
            reviewsList.appendChild(emptyState);
            const restoreBtn = emptyState.querySelector('#btnRestoreReviews');
            if (restoreBtn) {
                restoreBtn.addEventListener('click', () => {
                    savedReviews = [...DEFAULT_REVIEWS];
                    saveReviewsToStorage();
                    renderAllReviews();
                    showReviewNotice('✨ Comentarios de muestra restaurados.');
                });
            }
            return;
        }

        savedReviews.forEach(review => {
            const card = createReviewCardElement(review);
            reviewsList.appendChild(card);
        });
    }

    // Crear elemento de tarjeta con soporte para modo visualización y modo edición
    function createReviewCardElement(data) {
        const card = document.createElement('div');
        card.className = 'blog-card new-review-card';
        card.dataset.id = data.id;

        function renderStars(rating) {
            let starIcons = '';
            for (let i = 0; i < 5; i++) {
                const fill = i < rating ? 'var(--cyan-primary)' : 'rgba(255,255,255,0.15)';
                starIcons += `<svg class="star" style="color: ${fill}" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 10.26 24 10.27 17.18 16.70 20.27 25 12 19.54 3.73 25 6.82 16.70 0 10.27 8.91 10.26 12 2"></polygon></svg>`;
            }
            return starIcons;
        }

        // Modo Visualización
        const viewContainer = document.createElement('div');
        viewContainer.className = 'blog-card-content review-view-mode';
        viewContainer.style.padding = '1.5rem';
        viewContainer.innerHTML = `
            <div class="review-header-flex">
                <div class="post-tags">
                    <span class="tag-badge tag-new">${escapeHtml(data.role || 'Visitante')}</span>
                    <span class="post-date">${escapeHtml(data.date || 'Expo-Tec, 2026')}</span>
                </div>
                <div class="review-card-actions">
                    <button type="button" class="review-btn review-btn-edit" title="Editar este comentario">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                            <path d="M12 20h9"></path>
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                        </svg>
                        <span>Editar</span>
                    </button>
                    <button type="button" class="review-btn review-btn-delete" title="Eliminar este comentario">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        <span>Eliminar</span>
                    </button>
                </div>
            </div>
            <div class="blog-card-header">
                <h3 class="blog-card-title">${escapeHtml(data.name)}</h3>
            </div>
            <p class="blog-card-excerpt" style="margin-top: 0.5rem; font-style: italic;">
                "${escapeHtml(data.comment)}"
            </p>
            <div class="blog-card-footer" style="margin-top: 1rem;">
                <div class="star-rating">${renderStars(data.rating)}</div>
            </div>
        `;

        // Modo Edición
        const editContainer = document.createElement('div');
        editContainer.className = 'blog-card-content review-edit-mode hidden';
        editContainer.style.padding = '1.5rem';
        editContainer.innerHTML = `
            <div class="review-edit-box">
                <div class="review-edit-header">
                    <span class="review-edit-title">✏️ Modificar Reseña</span>
                </div>
                <div class="form-group">
                    <label class="form-label">Nombre:</label>
                    <input type="text" class="form-input edit-input-name" value="${escapeHtml(data.name)}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Rol / Escuela:</label>
                    <input type="text" class="form-input edit-input-role" value="${escapeHtml(data.role || '')}" placeholder="Ej. Visitante">
                </div>
                <div class="form-group">
                    <label class="form-label">Calificación:</label>
                    <div class="interactive-stars edit-interactive-stars">
                        <svg class="interactive-star" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 10.26 24 10.27 17.18 16.70 20.27 25 12 19.54 3.73 25 6.82 16.70 0 10.27 8.91 10.26 12 2"></polygon></svg>
                        <svg class="interactive-star" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 10.26 24 10.27 17.18 16.70 20.27 25 12 19.54 3.73 25 6.82 16.70 0 10.27 8.91 10.26 12 2"></polygon></svg>
                        <svg class="interactive-star" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 10.26 24 10.27 17.18 16.70 20.27 25 12 19.54 3.73 25 6.82 16.70 0 10.27 8.91 10.26 12 2"></polygon></svg>
                        <svg class="interactive-star" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 10.26 24 10.27 17.18 16.70 20.27 25 12 19.54 3.73 25 6.82 16.70 0 10.27 8.91 10.26 12 2"></polygon></svg>
                        <svg class="interactive-star" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 10.26 24 10.27 17.18 16.70 20.27 25 12 19.54 3.73 25 6.82 16.70 0 10.27 8.91 10.26 12 2"></polygon></svg>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Comentario:</label>
                    <textarea class="form-textarea edit-input-comment" rows="3" required>${escapeHtml(data.comment)}</textarea>
                </div>
                <div class="review-edit-actions">
                    <button type="button" class="btn-gaming-solid btn-save-edit">💾 GUARDAR CAMBIOS</button>
                    <button type="button" class="btn-cancel-edit">✕ CANCELAR</button>
                </div>
            </div>
        `;

        card.appendChild(viewContainer);
        card.appendChild(editContainer);

        // Control de estrellas en modo edición
        let editRating = data.rating || 5;
        const editStars = editContainer.querySelectorAll('.edit-interactive-stars .interactive-star');
        function updateEditStarsDisplay(val) {
            editStars.forEach((s, idx) => {
                if (idx < val) s.classList.add('active');
                else s.classList.remove('active');
            });
        }
        updateEditStarsDisplay(editRating);

        editStars.forEach((star, idx) => {
            star.addEventListener('mouseenter', () => updateEditStarsDisplay(idx + 1));
            star.addEventListener('click', () => {
                editRating = idx + 1;
                updateEditStarsDisplay(editRating);
            });
        });
        const starsWrap = editContainer.querySelector('.edit-interactive-stars');
        if (starsWrap) {
            starsWrap.addEventListener('mouseleave', () => updateEditStarsDisplay(editRating));
        }

        // Acciones: Editar, Cancelar, Guardar y Eliminar
        const editBtn = viewContainer.querySelector('.review-btn-edit');
        const deleteBtn = viewContainer.querySelector('.review-btn-delete');
        const cancelBtn = editContainer.querySelector('.btn-cancel-edit');
        const saveBtn = editContainer.querySelector('.btn-save-edit');

        editBtn.addEventListener('click', () => {
            viewContainer.classList.add('hidden');
            editContainer.classList.remove('hidden');
            editRating = data.rating || 5;
            updateEditStarsDisplay(editRating);
        });

        cancelBtn.addEventListener('click', () => {
            editContainer.classList.add('hidden');
            viewContainer.classList.remove('hidden');
        });

        saveBtn.addEventListener('click', () => {
            const newName = editContainer.querySelector('.edit-input-name').value.trim();
            const newRole = editContainer.querySelector('.edit-input-role').value.trim() || 'Visitante';
            const newComment = editContainer.querySelector('.edit-input-comment').value.trim();

            if (!newName || !newComment) {
                alert('Por favor completá tu nombre y el comentario.');
                return;
            }

            data.name = newName;
            data.role = newRole;
            data.rating = editRating;
            data.comment = newComment;

            saveReviewsToStorage();
            renderAllReviews();
            showReviewNotice('✨ Reseña actualizada exitosamente.');
            if (window.playSfxScore) window.playSfxScore();
        });

        deleteBtn.addEventListener('click', () => {
            if (confirm(`¿Estás seguro de que deseás eliminar el comentario de "${data.name}"?`)) {
                savedReviews = savedReviews.filter(r => r.id !== data.id);
                saveReviewsToStorage();
                renderAllReviews();
                showReviewNotice('🗑️ Comentario eliminado correctamente.');
                if (window.playSfxGameOver) window.playSfxGameOver();
            }
        });

        return card;
    }

    // Inicializar renderizado de reseñas
    renderAllReviews();

    // Event listener para publicar una nueva reseña
    reviewForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const authorName = document.getElementById('reviewerName').value.trim();
        const authorRole = document.getElementById('reviewerRole').value.trim() || 'Visitante Expo-Tec';
        const reviewText = document.getElementById('reviewerComment').value.trim();

        if (!authorName || !reviewText) return;

        const newReview = {
            id: 'rev-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
            name: authorName,
            role: authorRole,
            rating: currentRating,
            comment: reviewText,
            date: 'Expo-Tec, 2026'
        };

        savedReviews.unshift(newReview);
        saveReviewsToStorage();
        renderAllReviews();

        reviewForm.reset();
        currentRating = 5;
        highlightStars(5);

        if (window.playSfxScore) window.playSfxScore();
        showReviewNotice('✨ ¡Muchas gracias por tu reseña! Ha sido añadida con éxito.');
    });
}

/* ==========================================================================
   7. MODALES DE DESCARGA & QR
   ========================================================================== */
function initDownloadModals() {
    const downloadModal = document.getElementById('downloadModal');
    const closeModal = document.getElementById('closeModal');
    const modalOkBtn = document.getElementById('modalOkBtn');

    function openModal() {
        if (!downloadModal) return;
        downloadModal.classList.add('active');
        downloadModal.setAttribute('aria-hidden', 'false');
    }

    function closeModalFunc() {
        if (!downloadModal) return;
        downloadModal.classList.remove('active');
        downloadModal.setAttribute('aria-hidden', 'true');
    }

    document.querySelectorAll('.btn-download-trigger').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });
    });

    if (closeModal) closeModal.addEventListener('click', closeModalFunc);
    if (modalOkBtn) modalOkBtn.addEventListener('click', closeModalFunc);

    if (downloadModal) {
        downloadModal.addEventListener('click', (e) => {
            if (e.target === downloadModal) closeModalFunc();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && downloadModal && downloadModal.classList.contains('active')) {
            closeModalFunc();
        }
    });

    // Botón copiar link del repositorio
    const copyLinkBtn = document.getElementById('copyRepoLinkBtn');
    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', () => {
            const url = 'https://github.com/evoradynamic26';
            navigator.clipboard.writeText(url).then(() => {
                const originalText = copyLinkBtn.textContent;
                copyLinkBtn.textContent = '¡LINK COPIADO!';
                copyLinkBtn.style.borderColor = 'var(--cyan-primary)';
                setTimeout(() => {
                    copyLinkBtn.textContent = originalText;
                }, 2000);
            });
        });
    }
}
