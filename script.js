/**
 * Birthday Surprise Application
 * A interactive birthday surprise with video segments and letter typing animation
 */

// ===== CONFIGURATION =====
const CONFIG = {
  SEGMENT_PLAY_DURATION: 4.3,
  SEGMENT_JUMP: 5,
  TOTAL_SEGMENTS: 8,
  TYPING_SPEED: 30,
  EMOJI_COUNT: 30,
  EMOJI_REFRESH_INTERVAL: 15000
};

// ===== CONSTANTS =====
const CUTE_EMOJIS = ['💖', '🎀', '✨', '🌸', '🦄', '🍬', '🎂', '🍭', '🧁', '🌈', '⭐', '🌺', '🍡', '🎁', '🫧'];
const EMOJI_COLORS = ['#ff6699', '#ff4d8d', '#ffb6c1', '#ffc0cb', '#ff85a2', '#ff6ec7', '#ffaeb9', '#ff99cc'];

// ===== LETTER CONTENT =====
const FULL_LETTER = `Dulu aku nggak pernah nyangka bakal ketemu seseorang kayak kamu. Seseorang yang nerima aku pas lagi ancur, pas lagi nggak pede, pas lagi nggak jelas. Kamu nggak cuma jadi pacar, tapi jadi tempat ternyaman buat cerita, tempat buat nangis, tempat buat ketawa sampe perut sakit.

Aku masih inget sampe sekarang, momen-momen kecil yang bikin aku sadar kalo kamu tuh spesial banget. Dari cara kamu inget hal-hal kecil tentang aku kalo aku nggak suka wortel di mie ayam, kalo aku suka dengerin lagu itu pas lagi hujan sampe cara kamu sabar dengerin curhat panjang lebar aku yang nggak penting. Kamu bikin aku ngerasa... cukup. Nggak perlu pura-pura jadi siapa-siapa.

Dan yang paling berharga kamu nggak cuma cinta aku pas aku lagi baik-baiknya. Kamu juga stay pas aku lagi nggak karuan, lagi moody, lagi insecure, lagi jadi versi terburuk dari diri aku sendiri. That shit means everything to me. Kamu udah nunjukin arti "home" itu apa bukan tempat, tapi orang. Bukan alamat, tapi perasaan.

So today, and every day after this aku mau kamu tau kalo aku selalu bersyukur banget punya kamu. You're my favorite person to do nothing with, my favorite adventure partner, and my safest place to land. I don't need grand gestures or fancy dates I just need you, exactly as you are, every single day.

Love you more than my morning coffee, more than my favorite song on repeat, more than words can ever say.
Always yours,
joko anwar`;

// ===== PAGE MAPPING =====
const PAGE_MAP = {
  'ready': 'readySection',
  'refuse': 'refuseSection',
  'video': 'videoSection',
  'letter': 'page8'
};

// ===== STATE MANAGEMENT =====
class AppState {
  constructor() {
    this.currentSegment = 0;
    this.segmentTimeout = null;
    this.isPlaying = false;
    this.isMusicPlaying = false;
    this.isVideoEnded = false;
    this.typingInterval = null;
    this.letterIndex = 0;
    this.musicInitialized = false;
    this.videoDuration = 0;
    this.isVideoReady = false;
    this.hideIndicatorTimeout = null;
  }
}

// ===== DOM ELEMENTS =====
class DOMElements {
  constructor() {
    // Pages
    this.readySection = document.getElementById("readySection");
    this.refuseSection = document.getElementById("refuseSection");
    this.videoSection = document.getElementById("videoSection");
    this.page8 = document.getElementById("page8");
    
    // Video player elements
    this.video = document.getElementById("mainVideo");
    this.music = document.getElementById("backgroundMusic");
    this.indicator = document.getElementById("indicator");
    this.loading = document.getElementById("loading");
    this.notification = document.getElementById("notification");
    this.leftZone = document.getElementById("leftZone");
    this.rightZone = document.getElementById("rightZone");
    this.prevBtn = document.getElementById("prev");
    this.nextBtn = document.getElementById("next");
    this.musicToggle = document.getElementById("musicToggle");
    this.emojiRain = document.getElementById("emojiRain");
    
    // Letter page elements
    this.letterText = document.getElementById("letterText");
    this.skipBtn = document.getElementById("skipBtn");
  }
}

// ===== APPLICATION CONTROLLER =====
class BirthdayApp {
  constructor() {
    this.state = new AppState();
    this.dom = new DOMElements();
    this.init();
  }
  
  init() {
    this.setupEventListeners();
    this.setupKeyboardControls();
    this.setupIndicatorBehavior();
    this.handleHashChange();
    
    // Start emoji rain refresh interval
    setInterval(() => this.updateEmojiRain(), CONFIG.EMOJI_REFRESH_INTERVAL);
    
    console.log("Sistem siap! Gunakan #ready, #refuse, #video, atau #letter di URL untuk langsung ke halaman tertentu.");
  }
  
  // ===== PAGE NAVIGATION =====
  showOpenItPage() {
    this.hideAllPages();
    this.dom.videoSection.style.display = "flex";
    window.location.hash = "#video";
    
    setTimeout(() => {
      this.initializeVideoPlayer();
      
      if (!this.state.musicInitialized) {
        this.playMusicFromStart();
      } else {
        if (this.dom.music.paused && this.state.isMusicPlaying) {
          this.dom.music.play().catch(e => console.log("Gagal melanjutkan musik:", e));
        }
      }
    }, 100);
  }
  
  showRefusePage() {
    this.hideAllPages();
    this.dom.refuseSection.style.display = "block";
    window.location.hash = "#refuse";
  }
  
  backToReady() {
    this.hideAllPages();
    this.dom.readySection.style.display = "block";
    window.location.hash = "#ready";
  }
  
  showLetterPage() {
    this.hideAllPages();
    this.dom.page8.style.display = "block";
    window.location.hash = "#letter";
    this.startLetterTyping();
    this.triggerConfetti();
    
    if (!this.state.isMusicPlaying && this.state.musicInitialized) {
      this.dom.music.play().then(() => {
        this.state.isMusicPlaying = true;
        this.updateMusicIcon();
      }).catch(e => {
        console.log("Gagal melanjutkan musik:", e);
      });
    }
  }
  
  hideAllPages() {
    this.dom.readySection.style.display = "none";
    this.dom.refuseSection.style.display = "none";
    this.dom.videoSection.style.display = "none";
    this.dom.page8.style.display = "none";
  }
  
  // ===== MUSIC FUNCTIONS =====
  playMusicFromStart() {
    if (!this.state.musicInitialized) {
      this.dom.music.currentTime = 0;
      this.state.musicInitialized = true;
    }
    
    this.dom.music.play().then(() => {
      this.state.isMusicPlaying = true;
      this.updateMusicIcon();
    }).catch(e => {
      console.log("Autoplay musik diblok, tunggu user interaksi");
    });
  }
  
  toggleMusic() {
    if (this.state.isMusicPlaying) {
      this.dom.music.pause();
      this.dom.musicToggle.textContent = "♪";
      this.state.isMusicPlaying = false;
    } else {
      this.dom.music.play().then(() => {
        this.state.isMusicPlaying = true;
        this.dom.musicToggle.textContent = "♫";
      }).catch(e => {
        console.log("Gagal memutar musik:", e);
      });
    }
  }
  
  updateMusicIcon() {
    this.dom.musicToggle.textContent = this.state.isMusicPlaying ? "♫" : "♪";
  }
  
  // ===== VIDEO PLAYER FUNCTIONS =====
  initializeVideoPlayer() {
    this.state.currentSegment = 0;
    this.state.isVideoEnded = false;
    this.state.isPlaying = false;
    this.dom.video.currentTime = 0;
    
    if (!this.dom.video.hasListener) {
      this.dom.video.addEventListener("loadedmetadata", () => this.handleVideoLoaded());
      this.dom.video.addEventListener("error", () => this.handleVideoError());
      this.dom.video.addEventListener("pause", () => this.handleVideoPause());
      this.dom.video.addEventListener("play", () => this.handleVideoPlay());
      this.dom.video.addEventListener("ended", () => this.handleVideoEnded());
      this.dom.video.hasListener = true;
    }
    
    this.dom.video.load();
  }
  
  handleVideoLoaded() {
    this.state.videoDuration = this.dom.video.duration;
    this.state.isVideoReady = true;
    
    const requiredDuration = (CONFIG.TOTAL_SEGMENTS - 1) * CONFIG.SEGMENT_JUMP + CONFIG.SEGMENT_PLAY_DURATION;
    if (this.state.videoDuration < requiredDuration) {
      console.warn(`Video terlalu pendek! Diperlukan: ${requiredDuration.toFixed(1)}s`);
      this.dom.loading.textContent = `Video pendek! Butuh ${requiredDuration.toFixed(1)}s`;
    }
    
    this.dom.loading.style.display = "none";
    this.state.currentSegment = 0;
    this.playFromTime(0);
    this.createEmojiRain();
  }
  
  handleVideoError() {
    this.dom.loading.textContent = "Gagal memuat video";
    this.state.isPlaying = false;
    this.updateUIState();
  }
  
  handleVideoPause() {
    if (this.state.segmentTimeout) {
      clearTimeout(this.state.segmentTimeout);
      this.state.segmentTimeout = null;
    }
    this.state.isPlaying = false;
    this.updateUIState();
    this.showIndicatorTemporarily();
  }
  
  handleVideoPlay() {
    if (this.state.segmentTimeout) {
      clearTimeout(this.state.segmentTimeout);
      this.state.segmentTimeout = null;
    }
    
    this.state.isPlaying = true;
    this.updateUIState();
    
    const currentTime = this.dom.video.currentTime;
    this.state.currentSegment = Math.floor(currentTime / CONFIG.SEGMENT_JUMP);
    
    const segmentStartTime = this.state.currentSegment * CONFIG.SEGMENT_JUMP;
    const timeInSegment = currentTime - segmentStartTime;
    const timeRemaining = CONFIG.SEGMENT_PLAY_DURATION - timeInSegment;
    
    if (timeRemaining <= 0) {
      this.dom.video.pause();
      this.dom.video.currentTime = segmentStartTime + CONFIG.SEGMENT_PLAY_DURATION;
      this.state.isPlaying = false;
      this.updateUIState();
      this.showIndicatorTemporarily();
      return;
    }
    
    this.state.segmentTimeout = setTimeout(() => {
      this.dom.video.pause();
      const playEndTime = segmentStartTime + CONFIG.SEGMENT_PLAY_DURATION;
      this.dom.video.currentTime = playEndTime;
      this.state.isPlaying = false;
      this.updateUIState();
      
      if (this.state.currentSegment === CONFIG.TOTAL_SEGMENTS - 1) {
        this.state.isVideoEnded = true;
      }
      
      this.showIndicatorTemporarily();
    }, timeRemaining * 1000);
    
    this.showIndicatorTemporarily();
  }
  
  handleVideoEnded() {
    this.state.isVideoEnded = true;
    this.state.isPlaying = false;
    this.updateUIState();
  }
  
  // ===== VIDEO NAVIGATION =====
  updateUIState() {
    this.dom.leftZone.classList.remove('disabled');
    this.dom.rightZone.classList.remove('disabled');
    this.dom.prevBtn.disabled = false;
    this.dom.nextBtn.disabled = false;
    
    if (this.state.isPlaying) {
      this.dom.leftZone.classList.add('disabled');
      this.dom.rightZone.classList.add('disabled');
      this.dom.prevBtn.disabled = true;
      this.dom.nextBtn.disabled = true;
      this.dom.indicator.textContent = `${this.state.currentSegment + 1}/${CONFIG.TOTAL_SEGMENTS}`;
    } else {
      if (this.state.currentSegment === 0) {
        this.dom.leftZone.classList.add('disabled');
        this.dom.prevBtn.disabled = true;
      }
      
      if (this.state.currentSegment === CONFIG.TOTAL_SEGMENTS - 1) {
        this.dom.rightZone.classList.add('disabled');
        this.dom.nextBtn.disabled = true;
      }
      
      this.dom.indicator.textContent = `${this.state.currentSegment + 1}/${CONFIG.TOTAL_SEGMENTS}`;
    }
  }
  
  showNotification(message) {
    this.dom.notification.textContent = message;
    this.dom.notification.classList.add('show');
    
    setTimeout(() => {
      this.dom.notification.classList.remove('show');
    }, 1500);
  }
  
  playFromTime(startTime) {
    if (!this.state.isVideoReady) return;
    
    if (this.state.segmentTimeout) {
      clearTimeout(this.state.segmentTimeout);
      this.state.segmentTimeout = null;
    }
    
    this.state.isPlaying = true;
    this.updateUIState();
    
    this.dom.video.currentTime = startTime;
    
    this.dom.video.play().then(() => {
      this.state.segmentTimeout = setTimeout(() => {
        this.dom.video.pause();
        const playEndTime = startTime + CONFIG.SEGMENT_PLAY_DURATION;
        this.dom.video.currentTime = playEndTime;
        
        this.state.isPlaying = false;
        this.updateUIState();
        
        if (this.state.currentSegment === CONFIG.TOTAL_SEGMENTS - 1) {
          this.state.isVideoEnded = true;
        }
        
        this.showIndicatorTemporarily();
      }, CONFIG.SEGMENT_PLAY_DURATION * 1000);
    }).catch(e => {
      console.log("Autoplay video mungkin diblok:", e);
      this.state.isPlaying = false;
      this.updateUIState();
    });
    
    this.showIndicatorTemporarily();
  }
  
  nextSegment() {
    if (this.state.isPlaying) {
      this.showNotification("Tunggu video selesai dulu...");
      return;
    }
    
    if (this.state.currentSegment >= CONFIG.TOTAL_SEGMENTS - 1) {
      this.showLetterPage();
      return;
    }
    
    this.state.currentSegment++;
    const nextStartTime = this.state.currentSegment * CONFIG.SEGMENT_JUMP;
    
    if (nextStartTime >= this.state.videoDuration) {
      console.warn("Sudah di akhir video");
      return;
    }
    
    this.playFromTime(nextStartTime);
  }
  
  prevSegment() {
    if (this.state.isPlaying) {
      this.showNotification("Tunggu video selesai dulu...");
      return;
    }
    
    if (this.state.currentSegment <= 0) {
      return;
    }
    
    this.state.currentSegment--;
    const prevStartTime = this.state.currentSegment * CONFIG.SEGMENT_JUMP;
    this.playFromTime(prevStartTime);
  }
  
  // ===== EMOJI RAIN =====
  createEmojiRain() {
    this.dom.emojiRain.innerHTML = '';
    
    for (let i = 0; i < CONFIG.EMOJI_COUNT; i++) {
      const emoji = document.createElement('div');
      emoji.className = 'emoji';
      
      const randomEmoji = CUTE_EMOJIS[Math.floor(Math.random() * CUTE_EMOJIS.length)];
      emoji.textContent = randomEmoji;
      
      const left = Math.random() * 100;
      emoji.style.left = `${left}%`;
      
      const randomColor = EMOJI_COLORS[Math.floor(Math.random() * EMOJI_COLORS.length)];
      emoji.style.color = randomColor;
      
      const size = 20 + Math.random() * 12;
      emoji.style.fontSize = `${size}px`;
      
      const delay = Math.random() * 5;
      const duration = 5 + Math.random() * 10;
      
      emoji.style.animationDelay = `${delay}s`;
      emoji.style.animationDuration = `${duration}s`;
      
      const rotate = Math.random() * 360;
      emoji.style.transform = `rotate(${rotate}deg)`;
      
      this.dom.emojiRain.appendChild(emoji);
    }
  }
  
  updateEmojiRain() {
    this.createEmojiRain();
  }
  
  // ===== LETTER FUNCTIONS =====
  startLetterTyping() {
    this.state.letterIndex = 0;
    this.dom.letterText.textContent = "";
    this.dom.skipBtn.style.display = "block";
    
    if (this.state.typingInterval) {
      clearInterval(this.state.typingInterval);
    }
    
    this.state.typingInterval = setInterval(() => {
      if (this.state.letterIndex < FULL_LETTER.length) {
        this.dom.letterText.textContent += FULL_LETTER.charAt(this.state.letterIndex);
        this.state.letterIndex++;
        this.dom.letterText.scrollTop = this.dom.letterText.scrollHeight;
      } else {
        clearInterval(this.state.typingInterval);
        this.dom.skipBtn.style.display = "none";
      }
    }, CONFIG.TYPING_SPEED);
  }
  
  skipTyping() {
    if (this.state.typingInterval) {
      clearInterval(this.state.typingInterval);
    }
    this.dom.letterText.textContent = FULL_LETTER;
    this.dom.skipBtn.style.display = "none";
  }
  
  // ===== CONFETTI =====
  triggerConfetti() {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ff6699', '#ff4d8d', '#ffb6c1']
        });
      }, i * 300);
    }
    
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#ff6699', '#ffb6c1']
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#ff4d8d', '#ffc0cb']
      });
    }, 500);
  }
  
  // ===== HASH ROUTING =====
  handleHashChange() {
    const hash = window.location.hash.substring(1);
    
    if (!hash || hash === 'ready') {
      this.hideAllPages();
      this.dom.readySection.style.display = 'block';
    } else if (PAGE_MAP[hash]) {
      const pageId = PAGE_MAP[hash];
      this.hideAllPages();
      
      if (pageId === 'readySection') {
        this.dom.readySection.style.display = 'block';
      } else if (pageId === 'refuseSection') {
        this.dom.refuseSection.style.display = 'block';
      } else if (pageId === 'videoSection') {
        this.dom.videoSection.style.display = 'flex';
        setTimeout(() => {
          if (!this.dom.video.hasListener) {
            this.initializeVideoPlayer();
          }
        }, 100);
      } else if (pageId === 'page8') {
        this.dom.page8.style.display = 'block';
        this.startLetterTyping();
      }
    }
  }
  
  // ===== INDICATOR BEHAVIOR =====
  showIndicatorTemporarily() {
    this.dom.indicator.style.opacity = "1";
    clearTimeout(this.state.hideIndicatorTimeout);
    this.state.hideIndicatorTimeout = setTimeout(() => {
      this.dom.indicator.style.opacity = "0.5";
    }, 3000);
  }
  
  // ===== INDICATOR SETUP =====
  setupIndicatorBehavior() {
    this.dom.videoSection.addEventListener("click", () => {
      if (!this.state.isPlaying) this.showIndicatorTemporarily();
    });
  }
  
  // ===== KEYBOARD CONTROLS =====
  setupKeyboardControls() {
    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft" && !this.state.isPlaying && this.state.currentSegment > 0) {
        this.prevSegment();
      }
      if (e.key === "ArrowRight" && !this.state.isPlaying) {
        this.nextSegment();
      }
      if (e.key === " ") {
        e.preventDefault();
        if (this.dom.video.paused) {
          this.dom.video.play();
        } else {
          this.dom.video.pause();
        }
      }
      if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        this.toggleMusic();
      }
    });
  }
  
  // ===== EVENT LISTENERS =====
  setupEventListeners() {
    // Navigation zones
    this.dom.leftZone.addEventListener("click", () => {
      if (!this.state.isPlaying && this.state.currentSegment > 0) this.prevSegment();
    });
    
    this.dom.rightZone.addEventListener("click", () => {
      if (!this.state.isPlaying) this.nextSegment();
    });
    
    // Mobile navigation buttons
    this.dom.prevBtn.addEventListener("click", () => this.prevSegment());
    this.dom.nextBtn.addEventListener("click", () => this.nextSegment());
    
    // Music toggle
    this.dom.musicToggle.addEventListener("click", () => this.toggleMusic());
    
    // Hash change
    window.addEventListener('hashchange', () => this.handleHashChange());
    
    // Music initialization on first click
    document.addEventListener('click', () => {
      if (!this.state.isMusicPlaying) {
        this.playMusicFromStart();
      }
    }, { once: true });
    
    // Music events
    this.dom.music.addEventListener("playing", () => {
      this.state.isMusicPlaying = true;
      this.updateMusicIcon();
    });
    
    this.dom.music.addEventListener("pause", () => {
      this.state.isMusicPlaying = false;
      this.updateMusicIcon();
    });
    
    // Initial hash handling
    window.addEventListener('DOMContentLoaded', () => {
      if (!window.location.hash) {
        window.location.hash = '#ready';
      }
      this.handleHashChange();
    });
  }
}

// ===== GLOBAL FUNCTIONS FOR ONCLICK ATTRIBUTES =====
const app = new BirthdayApp();

// Expose functions globally for onclick attributes
window.showOpenItPage = () => app.showOpenItPage();
window.showRefusePage = () => app.showRefusePage();
window.backToReady = () => app.backToReady();
window.skipTyping = () => app.skipTyping();