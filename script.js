/**
 * Aashra Studio — Main Interaction & Supabase Engine
 */

// ==========================================
// 1. STUDIO CONFIGURATION & AUTH SETUP
// ==========================================
const STUDIO_WHATSAPP = "916201607744";
const STUDIO_UPI_ID   = "ashraaofficial@okicici";
const STUDIO_QR_IMAGE = "assets/upi-qr.png"; // User's official Google Pay QR code
const STUDIO_QR_FALLBACK = "assets/upi-qr-placeholder.svg";
const STUDIO_NAME     = "Ashraa Media";

// Google OAuth Client ID (Optional for Google Cloud Console direct verification):
// Paste your Web Client ID here (e.g. "123456789-abcdefg.apps.googleusercontent.com")
window.GOOGLE_CLIENT_ID = window.GOOGLE_CLIENT_ID || "";

// ==========================================
// FIREBASE CONFIGURATION (ashraa-media)
// NOTE: This file is a standard browser script. Do NOT add "import ... from 'firebase/app'".
// The Firebase Compat SDK is loaded via <script> tags in the HTML <head>.
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyArxdpZr8l-MQ_zkyQ2S82WKcDw4UVPlds",
  authDomain: "ashraa-media.firebaseapp.com",
  projectId: "ashraa-media",
  storageBucket: "ashraa-media.firebasestorage.app",
  messagingSenderId: "1010629537115",
  appId: "1:1010629537115:web:14291f1bbd5d00d4f8be7e",
  measurementId: "G-RSPGYLY13Y"
};

const DEFAULT_FIREBASE_CONFIG = firebaseConfig;
let FIREBASE_CONFIG = DEFAULT_FIREBASE_CONFIG;
try {
  const savedCfg = localStorage.getItem('ashraa_firebase_config');
  if (savedCfg) {
    const parsed = JSON.parse(savedCfg);
    if (parsed && parsed.apiKey && !parsed.apiKey.includes('YOUR_') && parsed.projectId === 'ashraa-media') {
      FIREBASE_CONFIG = Object.assign({}, DEFAULT_FIREBASE_CONFIG, parsed);
    } else {
      localStorage.removeItem('ashraa_firebase_config');
    }
  }
} catch (e) {
  localStorage.removeItem('ashraa_firebase_config');
}
window.FIREBASE_CONFIG = FIREBASE_CONFIG;
window.firebaseConfig = FIREBASE_CONFIG;

let firebaseApp = null;
let firebaseAuth = null;

function getFirebaseAuth() {
  if (firebaseAuth) return firebaseAuth;
  if (typeof window !== 'undefined' && window.firebase) {
    try {
      if (!window.firebase.apps || !window.firebase.apps.length) {
        if (FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey && !FIREBASE_CONFIG.apiKey.includes("YOUR_")) {
          firebaseApp = window.firebase.initializeApp(FIREBASE_CONFIG);
        }
      } else {
        firebaseApp = window.firebase.app();
      }
      if (firebaseApp) {
        firebaseAuth = window.firebase.auth();
        if (typeof setupFirebaseAuthListener === 'function') {
          setupFirebaseAuthListener();
        }
      }
    } catch (err) {
      console.warn("Could not initialize Firebase Auth:", err);
    }
  }
  return firebaseAuth;
}

window.configureFirebase = function() {
  const current = localStorage.getItem('ashraa_firebase_config') || (FIREBASE_CONFIG && !FIREBASE_CONFIG.apiKey.includes('YOUR_') ? JSON.stringify(FIREBASE_CONFIG, null, 2) : '');
  const input = prompt("Paste your Firebase project config object (from Firebase Console > Project Settings > Your apps):\n\nExample:\n{\n  apiKey: 'AIzaSy...',\n  authDomain: 'my-project.firebaseapp.com',\n  projectId: 'my-project'\n}", current);
  if (!input) return;
  try {
    let parsed = null;
    const clean = input.trim();
    if (clean.startsWith('{')) {
      try {
        parsed = JSON.parse(clean);
      } catch (err) {
        parsed = (new Function('return ' + clean))();
      }
    } else {
      const matchApiKey = input.match(/apiKey:\s*["']([^"']+)["']/);
      const matchAuthDomain = input.match(/authDomain:\s*["']([^"']+)["']/);
      const matchProjectId = input.match(/projectId:\s*["']([^"']+)["']/);
      const matchStorageBucket = input.match(/storageBucket:\s*["']([^"']+)["']/);
      const matchSenderId = input.match(/messagingSenderId:\s*["']([^"']+)["']/);
      const matchAppId = input.match(/appId:\s*["']([^"']+)["']/);
      if (matchApiKey && matchProjectId) {
        parsed = {
          apiKey: matchApiKey[1],
          authDomain: matchAuthDomain ? matchAuthDomain[1] : `${matchProjectId[1]}.firebaseapp.com`,
          projectId: matchProjectId[1],
          storageBucket: matchStorageBucket ? matchStorageBucket[1] : `${matchProjectId[1]}.appspot.com`,
          messagingSenderId: matchSenderId ? matchSenderId[1] : '',
          appId: matchAppId ? matchAppId[1] : ''
        };
      }
    }
    if (parsed && parsed.apiKey && parsed.projectId) {
      localStorage.setItem('ashraa_firebase_config', JSON.stringify(parsed));
      alert("✓ Firebase Configuration saved successfully! Reloading studio...");
      window.location.reload();
    } else {
      alert("Could not find apiKey and projectId in the provided text. Please copy the full firebaseConfig object from Firebase Console.");
    }
  } catch (err) {
    alert("Invalid configuration format: " + err.message);
  }
};

// Initial Firebase attempt
getFirebaseAuth();

// Optional Supabase client (for projects portfolio table)
const SUPABASE_URL = (typeof window !== 'undefined' && (window.SUPABASE_URL || localStorage.getItem('ashraa_supabase_url'))) || "https://nbxmptemldnusvhbuaih.supabase.co";
const SUPABASE_ANON_KEY = (typeof window !== 'undefined' && (window.SUPABASE_ANON_KEY || localStorage.getItem('ashraa_supabase_anon_key'))) || "sb_publishable_edVFMpyCnnpmf95F4Eyn9g_2fOBCrbP";

let supabaseClient = null;
function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;
  if (typeof window !== 'undefined' && window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.includes("YOUR_ANON_KEY")) {
    try {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      window.supabaseClient = supabaseClient;
    } catch (err) {}
  }
  return supabaseClient;
}
getSupabaseClient();

// Helper: Extract clean Google Drive ID from any URL or string
function extractDriveId(input) {
  if (!input) return '';
  const str = String(input).trim();
  const match = str.match(/\/d\/([a-zA-Z0-9_-]+)/) || str.match(/id=([a-zA-Z0-9_-]+)/);
  if (match && match[1]) return match[1];
  return str;
}

// Global Video Lightbox Controllers
// Comprehensive map of known portfolio video assets for reliable in-page local playback
const KNOWN_PORTFOLIO_VIDEOS = {
  // Reel 1: Documentary Storytelling Reel
  '17gGoKwbjlQ0jb7pY5NVpULoyWxBMhgOJ': {
    src: 'assets/videos/reel-1.mp4',
    poster: 'assets/thumb-reel-1.jpg',
    title: 'Documentary Storytelling Reel'
  },
  'assets/videos/reel-1.mp4': {
    src: 'assets/videos/reel-1.mp4',
    poster: 'assets/thumb-reel-1.jpg',
    title: 'Documentary Storytelling Reel'
  },
  'reel-1.mp4': {
    src: 'assets/videos/reel-1.mp4',
    poster: 'assets/thumb-reel-1.jpg',
    title: 'Documentary Storytelling Reel'
  },

  // Reel 2: Viral Retention Hook
  '1JUDKEyJjB47jBiLS3bCKlOBk_UroBvuB': {
    src: 'assets/videos/reel-2.mp4',
    poster: 'assets/thumb-reel-2.jpg',
    title: 'Viral Retention Hook'
  },
  'assets/videos/reel-2.mp4': {
    src: 'assets/videos/reel-2.mp4',
    poster: 'assets/thumb-reel-2.jpg',
    title: 'Viral Retention Hook'
  },
  'reel-2.mp4': {
    src: 'assets/videos/reel-2.mp4',
    poster: 'assets/thumb-reel-2.jpg',
    title: 'Viral Retention Hook'
  },

  // Reel 3: Haute Cinematic Reel
  '1WvZ1WSDI1Uvqy52nhe62HeizqrcuYWi-': {
    src: 'assets/videos/reel-3.mp4',
    poster: 'assets/thumb-reel-3.jpg',
    title: 'Haute Cinematic Reel'
  },
  'assets/videos/reel-3.mp4': {
    src: 'assets/videos/reel-3.mp4',
    poster: 'assets/thumb-reel-3.jpg',
    title: 'Haute Cinematic Reel'
  },
  'reel-3.mp4': {
    src: 'assets/videos/reel-3.mp4',
    poster: 'assets/thumb-reel-3.jpg',
    title: 'Haute Cinematic Reel'
  }
};

// Global Video Lightbox Controllers
window.openVideoModal = function(videoTarget, title, ratio, poster) {
  const videoModal = document.getElementById('videoModal');
  const modalVideo = document.getElementById('modalVideo');
  const modalIframe = document.getElementById('modalIframe');
  const modalHeading = document.getElementById('modalHeading');
  const playerWrap = document.getElementById('playerWrap');
  const videoLoader = document.getElementById('videoLoader');
  const videoUnmuteBtn = document.getElementById('videoUnmuteBtn');
  const videoCenterPlay = document.getElementById('videoCenterPlay');

  const cleanId = extractDriveId(videoTarget);
  let actualSrc = videoTarget;
  let actualPoster = poster || '';

  if (KNOWN_PORTFOLIO_VIDEOS[cleanId]) {
    actualSrc = KNOWN_PORTFOLIO_VIDEOS[cleanId].src;
    if (!actualPoster) actualPoster = KNOWN_PORTFOLIO_VIDEOS[cleanId].poster;
    if (!title || title === 'Preview Video') title = KNOWN_PORTFOLIO_VIDEOS[cleanId].title;
  } else if (KNOWN_PORTFOLIO_VIDEOS[videoTarget]) {
    actualSrc = KNOWN_PORTFOLIO_VIDEOS[videoTarget].src;
    if (!actualPoster) actualPoster = KNOWN_PORTFOLIO_VIDEOS[videoTarget].poster;
    if (!title || title === 'Preview Video') title = KNOWN_PORTFOLIO_VIDEOS[videoTarget].title;
  } else if (!videoTarget.includes('/') && !videoTarget.includes('.')) {
    actualSrc = `https://drive.usercontent.google.com/download?id=${cleanId}&export=download`;
  }

  if (modalHeading) modalHeading.textContent = title || 'Preview Video';

  // Modal sizing & visibility
  if (videoModal) {
    if (ratio === '9-16') {
      videoModal.classList.add('ratio-vertical');
    } else {
      videoModal.classList.remove('ratio-vertical');
    }
    videoModal.classList.add('active');
    videoModal.style.display = 'flex';
  }

  if (playerWrap) {
    if (ratio === '9-16') playerWrap.classList.add('ratio-9-16');
    else playerWrap.classList.remove('ratio-9-16');
  }

  if (modalVideo) {
    modalVideo.style.display = 'block';
    if (modalIframe) modalIframe.style.display = 'none';

    // Reset overlay elements
    if (videoUnmuteBtn) videoUnmuteBtn.style.display = 'none';
    if (videoCenterPlay) videoCenterPlay.style.display = 'none';

    // If modalVideo is already loaded with this exact source, just ensure it plays
    const currentActiveSrc = modalVideo.getAttribute('data-active-src') || '';
    if (currentActiveSrc !== actualSrc) {
      modalVideo.setAttribute('data-active-src', actualSrc);
      if (actualPoster) modalVideo.poster = actualPoster;
      
      // Display buffer loader while video initial frames load
      if (videoLoader) videoLoader.style.display = 'flex';

      modalVideo.src = actualSrc;
      // Note: Do NOT call modalVideo.load() immediately before play() to avoid interrupting the promise
    } else {
      if (modalVideo.paused && videoLoader) {
        videoLoader.style.display = 'flex';
      }
    }

    const hideLoader = () => {
      if (videoLoader) videoLoader.style.display = 'none';
    };
    modalVideo.addEventListener('playing', hideLoader, { once: true });
    modalVideo.addEventListener('canplay', hideLoader, { once: true });

    // Initial attempt: Full unmuted playback
    modalVideo.muted = false;
    const playPromise = modalVideo.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        hideLoader();
        if (videoCenterPlay) videoCenterPlay.style.display = 'none';
      }).catch(err => {
        console.warn("Unmuted autoplay restricted by browser policy; retrying with muted autoplay:", err);
        // Fallback: Muted playback is universally permitted across iOS, Android, and Desktop
        modalVideo.muted = true;
        modalVideo.play().then(() => {
          hideLoader();
          if (videoCenterPlay) videoCenterPlay.style.display = 'none';
          if (videoUnmuteBtn) videoUnmuteBtn.style.display = 'flex';
        }).catch(err2 => {
          console.warn("Muted autoplay also blocked; showing central play button:", err2);
          hideLoader();
          if (videoCenterPlay) videoCenterPlay.style.display = 'flex';
        });
      });
    }
  } else if (modalIframe) {
    modalIframe.style.display = 'block';
    modalIframe.src = actualSrc;
  }
};

window.closeVideoModal = function() {
  const videoModal = document.getElementById('videoModal');
  const modalVideo = document.getElementById('modalVideo');
  const modalIframe = document.getElementById('modalIframe');
  const videoLoader = document.getElementById('videoLoader');
  const videoUnmuteBtn = document.getElementById('videoUnmuteBtn');
  const videoCenterPlay = document.getElementById('videoCenterPlay');

  if (videoModal) {
    videoModal.classList.remove('active');
    videoModal.style.display = 'none';
  }
  if (modalVideo) {
    modalVideo.pause();
    modalVideo.removeAttribute('data-active-src');
    modalVideo.removeAttribute('src');
    modalVideo.load(); // Clean up audio/video hardware pipeline
  }
  if (modalIframe) {
    modalIframe.src = "";
  }
  if (videoLoader) videoLoader.style.display = 'none';
  if (videoUnmuteBtn) videoUnmuteBtn.style.display = 'none';
  if (videoCenterPlay) videoCenterPlay.style.display = 'none';
};

window.unmuteModalVideo = function() {
  const modalVideo = document.getElementById('modalVideo');
  const videoUnmuteBtn = document.getElementById('videoUnmuteBtn');
  if (modalVideo) {
    modalVideo.muted = false;
    modalVideo.play().catch(() => {});
  }
  if (videoUnmuteBtn) {
    videoUnmuteBtn.style.display = 'none';
  }
};

window.toggleModalVideoPlay = function() {
  const modalVideo = document.getElementById('modalVideo');
  const videoCenterPlay = document.getElementById('videoCenterPlay');
  if (!modalVideo) return;

  if (modalVideo.paused) {
    modalVideo.play().then(() => {
      if (videoCenterPlay) videoCenterPlay.style.display = 'none';
    }).catch(err => {
      console.warn("Toggle play failed:", err);
    });
  } else {
    modalVideo.pause();
    if (videoCenterPlay) videoCenterPlay.style.display = 'flex';
  }
};

// Helper: Attach 3D Card Tilt & In-Page Video Modal
function setupProjectCard(card) {
  card.style.cursor = 'pointer';

  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)`;
  });

  const handleCardTrigger = (e) => {
    if (e && e.target && e.target.closest && e.target.closest('a')) return;
    const videoSrc = card.getAttribute('data-video-src');
    const rawDriveId = card.getAttribute('data-drive-id');
    const cleanId = extractDriveId(rawDriveId);
    const title = card.getAttribute('data-title');
    const ratio = card.getAttribute('data-ratio') || '9-16';
    const poster = card.getAttribute('data-poster');

    const target = videoSrc || cleanId || rawDriveId;
    if (target) {
      window.openVideoModal(target, title, ratio, poster);
    }
  };

  // Only attach listener if card doesn't already have an inline onclick attribute
  if (!card.getAttribute('onclick')) {
    card.addEventListener('click', handleCardTrigger);
  }

  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardTrigger(e);
    }
  });
}

// ==========================================
// GLOBAL 20-MIN CALL CONTROLLERS (Supports onclick & class triggers)
// ==========================================
window.selectedCallSlot = "Morning (10 AM - 1 PM)";

window.openCallModal = function() {
  const modal = document.getElementById('callModal');
  if (modal) {
    modal.classList.add('active');
    modal.style.display = 'flex';
  }
};

window.closeCallModal = function() {
  const modal = document.getElementById('callModal');
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
  }
};

window.closePayModal = function() {
  const payModal = document.getElementById('paymentModal');
  if (payModal) {
    payModal.classList.remove('active');
    payModal.style.display = 'none';
  }
};

function hasRealUpiId() {
  const id = (STUDIO_UPI_ID || "").trim();
  return id.includes("@") && !id.toLowerCase().includes("yourstudio@upi");
}

window.activePlan = "Starter Creator";
window.activeAmount = 4999;
window.currentQrMode = 'gpay';

window.copyUpiId = function() {
  const upiId = STUDIO_UPI_ID;
  const btn = document.getElementById('btnCopyUpi');

  function onCopied() {
    if (btn) {
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg><span>Copied!</span>`;
      btn.style.background = "rgba(37, 211, 102, 0.3)";
      btn.style.borderColor = "var(--whatsapp)";
      btn.style.color = "#4ade80";
      setTimeout(() => {
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg><span>Copy</span>`;
        btn.style.background = "";
        btn.style.borderColor = "";
        btn.style.color = "";
      }, 2500);
    }
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(upiId).then(onCopied).catch(() => fallbackCopy(upiId));
  } else {
    fallbackCopy(upiId);
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    onCopied();
  }
};

window.switchQrMode = function(mode) {
  window.currentQrMode = mode;
  const upiQrCode = document.getElementById('upiQrCode');
  const btnGpay = document.getElementById('qrBtnGpay');
  const btnDynamic = document.getElementById('qrBtnDynamic');
  const qrAmountBadge = document.getElementById('qrAmountBadge');
  const amount = window.activeAmount || 4999;
  const plan = window.activePlan || "Starter Creator";
  const formattedAmount = Number(amount).toLocaleString('en-IN');

  if (mode === 'static_gpay' || mode === 'gpay') {
    if (btnGpay) btnGpay.classList.add('active');
    if (btnDynamic) btnDynamic.classList.remove('active');
    if (upiQrCode) {
      upiQrCode.src = STUDIO_QR_IMAGE;
      upiQrCode.alt = `Official Google Pay QR Code for ${STUDIO_NAME}`;
    }
    if (qrAmountBadge) {
      qrAmountBadge.textContent = `Payee: ${STUDIO_NAME} (Enter ₹${formattedAmount})`;
      qrAmountBadge.style.color = '#94a3b8';
      qrAmountBadge.style.borderColor = '#232938';
    }
  } else {
    // Default & Recommended: Dynamic UPI QR with PRE-FILLED EXACT AMOUNT
    if (btnDynamic) btnDynamic.classList.add('active');
    if (btnGpay) btnGpay.classList.remove('active');
    if (upiQrCode) {
      // NPCI standard UPI format with pre-filled exact amount
      const upiUri = `upi://pay?pa=${encodeURIComponent(STUDIO_UPI_ID)}&pn=${encodeURIComponent(STUDIO_NAME)}&am=${Number(amount).toFixed(2)}&cu=INR&tn=${encodeURIComponent(plan + ' Suite')}`;
      upiQrCode.src = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(upiUri)}`;
      upiQrCode.alt = `Scan with any UPI App (GPay, PhonePe, Paytm) to pay pre-filled ₹${formattedAmount}`;
    }
    if (qrAmountBadge) {
      qrAmountBadge.textContent = `✓ Amount Auto-Prefilled: ₹${formattedAmount}`;
      qrAmountBadge.style.color = '#4ade80';
      qrAmountBadge.style.borderColor = 'rgba(37, 211, 102, 0.4)';
    }
  }
};

window.openPayModal = function(plan, amount) {
  const payModal = document.getElementById('paymentModal');
  if (!payModal) return;

  window.activePlan = plan;
  window.activeAmount = Number(amount);

  const payPlanTitle = document.getElementById('payPlanTitle');
  const payPlanBadge = document.getElementById('payPlanBadge');
  const payAmountDisplay = document.getElementById('payAmountDisplay');
  const upiQrCode = document.getElementById('upiQrCode');
  const mobileUpiBtn = document.getElementById('mobileUpiBtn');
  const upiIdDisplay = document.getElementById('upiIdDisplay');
  const successCard = document.getElementById('paymentSuccessCard');
  const confirmForm = document.getElementById('paymentConfirmForm');

  if (successCard) successCard.style.display = 'none';
  if (confirmForm && typeof confirmForm.reset === 'function') confirmForm.reset();

  const rupees = Number(amount);
  const amountText = Number.isFinite(rupees) ? rupees.toLocaleString('en-IN') : String(amount);

  if (payPlanTitle) payPlanTitle.textContent = `${plan}`;
  if (payPlanBadge) payPlanBadge.textContent = `${plan} Package`;
  if (payAmountDisplay) payAmountDisplay.textContent = `₹${amountText}`;
  if (upiIdDisplay) upiIdDisplay.textContent = STUDIO_UPI_ID;

  // Set default QR mode to pre-filled dynamic QR code so scanning immediately fills the exact amount!
  window.switchQrMode('dynamic');

  if (upiQrCode) {
    upiQrCode.onerror = function () {
      upiQrCode.onerror = null;
      upiQrCode.src = STUDIO_QR_FALLBACK;
    };
  }

  if (mobileUpiBtn) {
    const upiUri = `upi://pay?pa=${encodeURIComponent(STUDIO_UPI_ID)}&pn=${encodeURIComponent(STUDIO_NAME)}&am=${rupees.toFixed(2)}&cu=INR&tn=${encodeURIComponent(plan + ' Suite')}`;
    mobileUpiBtn.href = upiUri;
    mobileUpiBtn.style.display = 'flex';
  }

  payModal.classList.add('active');
  payModal.style.display = 'flex';
};

window.handlePaymentSubmit = async function(e) {
  if (e) e.preventDefault();

  const plan = window.activePlan || "Starter Creator";
  const amount = window.activeAmount || 4999;
  const nameInput = document.getElementById('payClientName');
  const utrInput = document.getElementById('payUtrNumber');

  const clientName = nameInput ? nameInput.value.trim() : "Creator";
  const utr = utrInput ? utrInput.value.trim() : "";

  // 1. Record in Supabase payments table
  if (supabaseClient) {
    try {
      await supabaseClient.from('payments').insert([{
        planName: plan,
        amountINR: Number(amount),
        upiRefNumber: utr || null,
        paymentMethod: 'UPI',
        status: 'PENDING'
      }]);
    } catch (err) {
      console.warn("Could not record payment in Supabase:", err);
    }
  }

  // 2. Display on-screen confirmation card
  const successCard = document.getElementById('paymentSuccessCard');
  if (successCard) {
    successCard.style.display = 'block';
  }

  // 3. Format WhatsApp confirmation link
  let msg = `Hello ${STUDIO_NAME}! I have initiated payment for the *${plan}* package.\n\n`;
  msg += `*Amount:* ₹${Number(amount).toLocaleString('en-IN')}\n`;
  msg += `*Name / Brand:* ${clientName}\n`;
  if (utr) {
    msg += `*UPI Ref / UTR:* ${utr}\n`;
  }
  msg += `\nI am attaching the payment confirmation screenshot:`;

  setTimeout(() => {
    window.open(`https://wa.me/${STUDIO_WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank');
  }, 800);
};

window.selectedCallSlot = "Morning (10 AM - 1 PM)";

window.setSlot = function(btn, slot) {
  if (!btn) return;
  const container = btn.closest('.slot-grid') || document;
  container.querySelectorAll('.slot-btn').forEach(b => {
    b.classList.remove('active');
    b.removeAttribute('style');
  });
  btn.classList.add('active');
  window.selectedCallSlot = slot || btn.getAttribute('data-slot') || btn.textContent.trim();
};

window.handleCallSubmit = function(e) {
  if (e) e.preventDefault();
  const nameInput = document.getElementById('callerName') || document.getElementById('callName');
  const dateInput = document.getElementById('callDate');
  const topicInput = document.getElementById('callTopic');

  const name = nameInput ? nameInput.value.trim() : 'Creator';
  const date = dateInput ? dateInput.value : '';
  const topic = topicInput ? topicInput.value : 'Strategy';
  const slot = window.selectedCallSlot || "Morning (10 AM - 1 PM)";

  if (supabaseClient) {
    try {
      supabaseClient.from('strategy_calls').insert([{
        callerName: name,
        preferredDate: new Date(date),
        timeWindow: slot,
        topic: topic,
        status: 'PENDING'
      }]).then(() => {}).catch(() => {});
    } catch (err) {}
  }

  let msg = `Hello Aashra Studio! I would like to book a *Private 20-Minute Strategy Session*.\n\n`;
  msg += `*Name / Channel:* ${name}\n`;
  msg += `*Preferred Date:* ${date}\n`;
  msg += `*Time Window:* ${slot}\n`;
  msg += `*Focus Area:* ${topic}`;

  window.open(`https://wa.me/${STUDIO_WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank');
  window.closeCallModal();
};

document.addEventListener('DOMContentLoaded', async () => {

  // ==========================================
  // 2. MOUSE SPOTLIGHT FOLLOWER
  // ==========================================
  const spotlight = document.getElementById('cursorSpotlight');
  if (spotlight) {
    window.addEventListener('mousemove', (e) => {
      spotlight.style.left = `${e.clientX}px`;
      spotlight.style.top = `${e.clientY}px`;
    });
  }

  // ==========================================
  // 20-MIN STRATEGY CALL (EVENT ATTACHMENTS)
  // ==========================================
  const callModal = document.getElementById('callModal');
  const callModalClose = document.getElementById('callModalClose');
  const callForm = document.getElementById('callForm');
  const slotButtons = document.querySelectorAll('.slot-btn');

  // Handle time-slot button clicks (Morning / Afternoon / Evening)
  if (slotButtons.length > 0) {
    slotButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const slot = btn.getAttribute('data-slot') || btn.textContent.trim();
        window.setSlot(btn, slot);
      });
    });
  }

  // Open modal when any button with class "call-trigger" is clicked
  document.querySelectorAll('.call-trigger').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      window.openCallModal();
    });
  });

  // Close modal with 'X' button
  if (callModalClose) {
    callModalClose.addEventListener('click', () => {
      window.closeCallModal();
    });
  }

  // Close modal if user clicks outside the box
  if (callModal) {
    callModal.addEventListener('click', (e) => {
      if (e.target === callModal) window.closeCallModal();
    });
  }

  // Submit Call Booking
  if (callForm) {
    callForm.addEventListener('submit', window.handleCallSubmit);
  }

  // ==========================================
  // 3. 24 FPS CINEMATIC CAMERA HUD TIMECODE
  // ==========================================
  const timecodeEl = document.getElementById('hudTimecode');
  if (timecodeEl) {
    let frames = 0, seconds = 14, minutes = 24, hours = 1;
    setInterval(() => {
      frames++;
      if (frames >= 24) { frames = 0; seconds++; }
      if (seconds >= 60) { seconds = 0; minutes++; }
      if (minutes >= 60) { minutes = 0; hours++; }
      
      const fmt = (n) => String(n).padStart(2, '0');
      timecodeEl.textContent = `TC ${fmt(hours)}:${fmt(minutes)}:${fmt(seconds)}:${fmt(frames)}`;
    }, 1000 / 24);
  }

  // ==========================================
  // 4. BEFORE / AFTER COLOR GRADING SLIDER
  // ==========================================
  const compWrapper = document.getElementById('compWrapper');
  const compAfter = document.getElementById('compAfter');
  const compHandle = document.getElementById('compHandle');

  if (compWrapper && compAfter && compHandle) {
    let isDown = false;

    const moveSlider = (clientX) => {
      const rect = compWrapper.getBoundingClientRect();
      let pos = clientX - rect.left;
      if (pos < 0) pos = 0;
      if (pos > rect.width) pos = rect.width;

      const percentage = (pos / rect.width) * 100;
      compAfter.style.clipPath = `polygon(0 0, ${percentage}% 0, ${percentage}% 100%, 0 100%)`;
      compHandle.style.left = `${percentage}%`;
    };

    compWrapper.addEventListener('mousedown', (e) => {
      isDown = true;
      moveSlider(e.clientX);
    });

    window.addEventListener('mouseup', () => { isDown = false; });
    window.addEventListener('mousemove', (e) => {
      if (isDown) moveSlider(e.clientX);
    });

    compWrapper.addEventListener('touchstart', (e) => {
      isDown = true;
      moveSlider(e.touches[0].clientX);
    });
    window.addEventListener('touchend', () => { isDown = false; });
    window.addEventListener('touchmove', (e) => {
      if (isDown) moveSlider(e.touches[0].clientX);
    });
  }

  // ==========================================
  // 5. LOAD LIVE PROJECTS FROM SUPABASE
  // ==========================================
  const projectsGrid = document.querySelector('.projects-grid');

  if (projectsGrid && supabaseClient) {
    try {
      const { data: projects, error } = await supabaseClient
        .from('projects')
        .select('*')
        .order('orderIndex', { ascending: true });

      if (!error && projects && projects.length > 0) {
        projectsGrid.innerHTML = ''; // Replace sample cards with Supabase rows

        projects.forEach(project => {
          const isNineBySixteen = project.ratio === 'RATIO_9_16';
          const ratioClass = isNineBySixteen ? 'aspect-9-16' : 'aspect-16-9';
          const categorySlug = (project.category || 'shorts').toLowerCase().replace('_', '');
          const cleanId = extractDriveId(project.driveId);
          const known = KNOWN_PORTFOLIO_VIDEOS[cleanId];

          const videoSrc = known ? known.src : `https://drive.usercontent.google.com/download?id=${cleanId}&export=download`;
          const posterUrl = project.thumbnailUrl || (known ? known.poster : (cleanId ? `https://lh3.googleusercontent.com/d/${cleanId}=w800` : ''));
          const displayTitle = (project.title && project.title.trim() && project.title !== 'Sample' && project.title !== 'Empty') 
            ? project.title.trim() 
            : (known ? known.title : 'Featured Video');

          const card = document.createElement('div');
          card.className = 'project-card';
          card.setAttribute('data-cat', categorySlug);
          card.setAttribute('data-ratio', isNineBySixteen ? '9-16' : '16-9');
          card.setAttribute('data-drive-id', cleanId);
          card.setAttribute('data-video-src', videoSrc);
          if (posterUrl) card.setAttribute('data-poster', posterUrl);
          card.setAttribute('data-title', displayTitle);
          card.setAttribute('role', 'button');
          card.setAttribute('tabindex', '0');
          card.setAttribute('aria-label', `Play ${displayTitle}`);

          const bgStyle = posterUrl ? `background-image: url('${posterUrl}');` : 'background: linear-gradient(135deg, #1e293b, #0f172a);';

          card.innerHTML = `
            <div class="thumb-wrap ${ratioClass}">
              <div class="thumb-bg" style="${bgStyle}"></div>
              <div class="play-btn">
                <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              </div>
            </div>
            <div class="project-body">
              <span class="tag-chip">${project.tags || (isNineBySixteen ? '9:16 Reel' : '16:9 Video')}</span>
              <h4>${displayTitle}</h4>
              <p style="color: var(--text-muted); font-size: 0.88rem;">${project.description || (known ? 'Paced narrative editing, audio layering, and archival integration.' : 'High-retention post-production edit.')}</p>
              <div class="drive-badge">▶ Watch Video</div>
            </div>
          `;

          setupProjectCard(card);
          projectsGrid.appendChild(card);
        });
      }
    } catch (err) {
      console.warn("Supabase fetch failed, showing static cards:", err);
    }
  }

  // Setup static cards (fallback if Supabase is loading or empty)
  document.querySelectorAll('.project-card').forEach(card => {
    setupProjectCard(card);
  });

  // ==========================================
  // 6. VIDEO LIGHTBOX MODAL & PLAYER CONTROLS
  // ==========================================
  const videoModal = document.getElementById('videoModal');
  const modalClose = document.getElementById('modalClose');
  const modalVideo = document.getElementById('modalVideo');
  const videoCenterPlay = document.getElementById('videoCenterPlay');

  if (modalClose && videoModal) {
    modalClose.addEventListener('click', () => {
      window.closeVideoModal();
    });

    videoModal.addEventListener('click', (e) => {
      if (e.target === videoModal) {
        window.closeVideoModal();
      }
    });
  }

  if (modalVideo) {
    modalVideo.addEventListener('click', (e) => {
      // Toggle play/pause when user clicks the video viewport
      const rect = modalVideo.getBoundingClientRect();
      const clickY = e.clientY - rect.top;
      // If click is not in the bottom 46px (where native controls sit)
      if (clickY < rect.height - 46) {
        window.toggleModalVideoPlay();
      }
    });

    modalVideo.addEventListener('play', () => {
      if (videoCenterPlay) videoCenterPlay.style.display = 'none';
      const videoLoader = document.getElementById('videoLoader');
      if (videoLoader) videoLoader.style.display = 'none';
    });

    modalVideo.addEventListener('pause', () => {
      if (videoModal && videoModal.classList.contains('active')) {
        if (videoCenterPlay) videoCenterPlay.style.display = 'flex';
      }
    });

    modalVideo.addEventListener('waiting', () => {
      const videoLoader = document.getElementById('videoLoader');
      if (videoLoader) videoLoader.style.display = 'flex';
    });

    modalVideo.addEventListener('canplay', () => {
      const videoLoader = document.getElementById('videoLoader');
      if (videoLoader) videoLoader.style.display = 'none';
    });
  }

  // ==========================================
  // 7. PORTFOLIO CATEGORY FILTER
  // ==========================================
  window.filterCategory = function(cat, btn) {
    document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    document.querySelectorAll('.project-card').forEach(card => {
      const cardCat = (card.getAttribute('data-cat') || '').toLowerCase();
      if (cat === 'all' || cardCat === cat || cardCat.includes(cat)) {
        card.style.display = 'flex';
        card.classList.remove('hidden');
      } else {
        card.style.display = 'none';
        card.classList.add('hidden');
      }
    });
  };

  const filterTabs = document.querySelectorAll('.filter-tab');
  if (filterTabs.length > 0) {
    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const filter = (tab.getAttribute('data-filter') || 'all').toLowerCase();
        window.filterCategory(filter, tab);
      });
    });
  }

  // ==========================================
  // 8. INTERACTIVE UPI PAYMENT MODAL
  // ==========================================
  const payModal = document.getElementById('paymentModal');
  const payModalClose = document.getElementById('payModalClose');

  if (payModalClose) {
    payModalClose.addEventListener('click', () => window.closePayModal());
  }

  if (payModal) {
    payModal.addEventListener('click', (e) => {
      if (e.target === payModal) window.closePayModal();
    });
  }

  // Attach to all pay-trigger buttons
  document.querySelectorAll('.pay-trigger-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const plan = btn.getAttribute('data-plan') || 'Custom Edit Package';
      const amount = btn.getAttribute('data-amount') || 4999;
      window.openPayModal(plan, amount);
    });
  });

  // ESC key closes any open modal, Space toggles video play/pause
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.closePayModal();
      window.closeCallModal();
      window.closeVideoModal();
    } else if (e.key === ' ' || e.code === 'Space') {
      const vModal = document.getElementById('videoModal');
      if (vModal && vModal.classList.contains('active')) {
        if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
          return;
        }
        e.preventDefault();
        window.toggleModalVideoPlay();
      }
    }
  });

  // ==========================================
  // 10. CONTACT FORM (SAVES TO SUPABASE & WA)
  // ==========================================
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const service = document.getElementById('contactService').value;
      const notes = document.getElementById('contactNotes').value.trim();

      if (supabaseClient) {
        try {
          await supabaseClient.from('inquiries').insert([{
            service: service,
            scopeNotes: notes
          }]);
        } catch (err) {
          console.warn("Could not record inquiry in Supabase:", err);
        }
      }

      let msg = `Hello Aashra Studio! I would like to commission an edit.\n\n*Service Suite:* ${service}`;
      if (notes) msg += `\n*Creative Scope:* ${notes}`;

      window.open(`https://wa.me/${STUDIO_WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank');
    });
  }

  // ==========================================
  // 11. RESPONSIVE MOBILE NAVIGATION HANDLERS
  // ==========================================
  // Close mobile menu when clicking any nav link
  document.querySelectorAll('.nav-menu .nav-link').forEach(link => {
    link.addEventListener('click', () => {
      window.closeMobileMenu();
    });
  });

  // Close mobile menu when clicking outside
  document.addEventListener('click', (e) => {
    const navMenu = document.getElementById('navMenu');
    const toggleBtn = document.getElementById('mobileMenuToggle');
    if (navMenu && navMenu.classList.contains('active')) {
      if (!navMenu.contains(e.target) && (!toggleBtn || !toggleBtn.contains(e.target))) {
        window.closeMobileMenu();
      }
    }
  });

  // ==========================================
  // 12. PERMANENTLY FIXED NAVBAR SCROLL EFFECT
  // ==========================================
  const handleScrollHeader = () => {
    const header = document.querySelector('header');
    if (header) {
      if (window.scrollY > 15) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }
  };
  window.addEventListener('scroll', handleScrollHeader, { passive: true });
  handleScrollHeader();

  // ==========================================
  // 13. INITIALIZE AUTHENTICATION PORTAL GATE
  // ==========================================
  window.initAuthGate();

});

// Global Mobile Menu Toggle
window.toggleMobileMenu = function() {
  const toggleBtn = document.getElementById('mobileMenuToggle');
  const navMenu = document.getElementById('navMenu');
  if (!navMenu) return;

  const isActive = navMenu.classList.toggle('active');
  if (toggleBtn) {
    toggleBtn.classList.toggle('active', isActive);
    toggleBtn.setAttribute('aria-expanded', String(isActive));
  }
};

window.closeMobileMenu = function() {
  const toggleBtn = document.getElementById('mobileMenuToggle');
  const navMenu = document.getElementById('navMenu');
  if (navMenu) navMenu.classList.remove('active');
  if (toggleBtn) {
    toggleBtn.classList.remove('active');
    toggleBtn.setAttribute('aria-expanded', 'false');
  }
};

// ==========================================
// 14. AUTHENTICATION & LOGIN GATE CONTROLLERS
// ==========================================
window.authCurrentView = 'login'; // 'login', 'signup', 'forgot'

// Dynamically load Google Identity Services (GIS) SDK
function loadGoogleIdentityServices() {
  if (document.getElementById('google-gsi-script')) return;
  const script = document.createElement('script');
  script.id = 'google-gsi-script';
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.defer = true;
  script.onload = () => {
    if (window.GOOGLE_CLIENT_ID && window.google && window.google.accounts && window.google.accounts.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: window.GOOGLE_CLIENT_ID,
          callback: handleGoogleGsiResponse
        });
      } catch (err) {
        console.warn("Google GIS initialization notice:", err);
      }
    }
  };
  document.head.appendChild(script);
}

// Google GIS Credential Response Handler
function handleGoogleGsiResponse(response) {
  if (response && response.credential) {
    try {
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const payload = JSON.parse(jsonPayload);
      window.authenticateUser({
        name: payload.name || payload.given_name || 'Google Creator',
        email: payload.email,
        picture: payload.picture || '',
        provider: 'google',
        signedInAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn("Could not decode Google token:", e);
    }
  }
}

// ==========================================
// 14.1 SUPABASE AUTHENTICATION ENGINE
// ==========================================

function displayAuthAlert(type, message) {
  // 1. On login.html (#authAlert)
  const authAlert = document.getElementById('authAlert');
  if (authAlert) {
    authAlert.className = `auth-alert ${type}`;
    authAlert.innerHTML = message;
    authAlert.style.display = 'block';
  }

  // 2. On index.html / other pages (#authMsg)
  const authMsg = document.getElementById('authMsg');
  if (authMsg) {
    authMsg.className = `auth-msg ${type === 'error' ? 'error' : (type === 'success' ? 'success' : 'info')}`;
    authMsg.innerHTML = message;
    authMsg.style.display = 'block';
  }
}

// Supabase Real-time Auth State Synchronizer
function setupSupabaseAuthListener() {
  const client = getSupabaseClient();
  if (client && client.auth && !window._supabaseAuthListenerAttached) {
    window._supabaseAuthListenerAttached = true;
    client.auth.onAuthStateChange((event, session) => {
      console.log("[Supabase Auth]", event, session ? session.user?.email : "No session");
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') && session && session.user) {
        const u = session.user;
        const profile = {
          id: u.id,
          name: u.user_metadata?.full_name || u.user_metadata?.name || (u.email ? u.email.split('@')[0] : 'Creator'),
          email: u.email,
          picture: u.user_metadata?.avatar_url || u.user_metadata?.picture || '',
          provider: u.app_metadata?.provider || 'supabase',
          signedInAt: new Date().toISOString()
        };
        window.authenticateUser(profile);
      } else if (event === 'SIGNED_OUT') {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('ashraa_auth_user');
        }
        window.updateAuthUI(null);
      }
    });
  }
}

// Health Check Helper to Prevent Browser DNS Crash When Supabase Is Paused
async function isSupabaseReachable() {
  if (!SUPABASE_URL || !SUPABASE_URL.startsWith('http')) return false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2800);
    await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      method: 'GET',
      mode: 'no-cors',
      signal: controller.signal
    });
    clearTimeout(timeout);
    return true;
  } catch (err) {
    return false;
  }
}

// Convenient In-Browser Configuration Helper
window.configureSupabase = function() {
  const currentUrl = localStorage.getItem('ashraa_supabase_url') || SUPABASE_URL;
  const currentKey = localStorage.getItem('ashraa_supabase_anon_key') || SUPABASE_ANON_KEY;
  
  const newUrl = prompt("Enter your Supabase Project URL:\n(e.g. https://your-project-id.supabase.co)", currentUrl);
  if (!newUrl) return;
  
  const newKey = prompt("Enter your Supabase 'anon public' API Key:\n(starts with eyJhbGci...)", currentKey);
  if (!newKey) return;
  
  localStorage.setItem('ashraa_supabase_url', newUrl.trim());
  localStorage.setItem('ashraa_supabase_anon_key', newKey.trim());
  alert("✓ Supabase settings updated! Reloading studio...");
  window.location.reload();
};

// Setup Firebase Real-Time Auth State Synchronizer
function setupFirebaseAuthListener() {
  const auth = getFirebaseAuth();
  if (auth && !window._firebaseAuthListenerAttached) {
    window._firebaseAuthListenerAttached = true;

    // Check for redirect sign-in result (mobile / popup-blocked fallback)
    if (typeof auth.getRedirectResult === 'function') {
      auth.getRedirectResult().then((result) => {
        if (result && result.user) {
          const user = result.user;
          const profile = {
            id: user.uid,
            name: user.displayName || user.email.split('@')[0],
            email: user.email,
            picture: user.photoURL || '',
            provider: 'google',
            signedInAt: new Date().toISOString()
          };
          window.authenticateUser(profile);
        }
      }).catch((err) => {
        console.warn("[Firebase Redirect Auth Notice]", err);
      });
    }

    auth.onAuthStateChanged((user) => {
      console.log("[Firebase Auth State]", user ? user.email : "Signed out");
      if (user && (user.emailVerified || (user.providerData && user.providerData.some(p => p.providerId === 'google.com')))) {
        const profile = {
          id: user.uid,
          name: user.displayName || user.email.split('@')[0],
          email: user.email,
          picture: user.photoURL || '',
          provider: (user.providerData && user.providerData[0]?.providerId) || 'firebase',
          signedInAt: new Date().toISOString()
        };
        window.authenticateUser(profile);
      } else {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('ashraa_auth_user');
        }
        window.updateAuthUI(null);
      }
    });
  }
}

// Genuine Google Authentication via Firebase (1-Click Native Popup, Zero DNS Errors)
window.signInWithGoogle = async function(e) {
  if (e) {
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
  }

  const auth = getFirebaseAuth();
  if (!auth) {
    displayAuthAlert('error', `
      <div style="text-align:left;">
        <strong>⚙️ Initializing Firebase...</strong><br>
        <span style="font-size:0.82rem; color:#fca5a5; display:block; margin:6px 0;">
          Firebase Auth is loading. Please refresh the page and try again.
        </span>
      </div>
    `);
    return;
  }

  displayAuthAlert('info', '<span class="google-spinner"></span> Opening Google Sign-In...');

  try {
    const provider = new window.firebase.auth.GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({ prompt: 'select_account' });

    // Official Google OAuth Popup Window
    const result = await auth.signInWithPopup(provider);
    const user = result.user;

    const profile = {
      id: user.uid,
      name: user.displayName || user.email.split('@')[0],
      email: user.email,
      picture: user.photoURL || '',
      provider: 'google',
      signedInAt: new Date().toISOString()
    };

    displayAuthAlert('success', `✓ Verified via Google! Welcome, ${profile.name}.`);
    window.authenticateUser(profile);

    if (window.location.pathname.endsWith('login.html') || window.location.href.includes('login.html')) {
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 700);
    }
  } catch (err) {
    console.error("Firebase Google Auth error:", err);
    if (err.code === 'auth/popup-closed-by-user') {
      displayAuthAlert('info', 'Google sign-in popup was closed.');
    } else if (err.code === 'auth/popup-blocked') {
      displayAuthAlert('error', `Pop-up was blocked by browser. Please allow popups for <strong>${window.location.hostname}</strong> or try clicking again.`);
    } else if (err.code === 'auth/unauthorized-domain') {
      const isLoopback = window.location.hostname === '127.0.0.1';
      displayAuthAlert('error', `
        <div style="text-align:left; line-height: 1.5;">
          <strong>Domain Not Authorized in Firebase</strong><br>
          <span style="font-size:0.82rem; display:block; margin:6px 0;">
            ${isLoopback ? `Firebase pre-authorizes <code>localhost</code> by default. Try accessing via: <br><a href="${window.location.href.replace('127.0.0.1', 'localhost')}" style="color:#60a5fa; font-weight:700; text-decoration:underline;">http://localhost:5500</a><br><br>Or add <code>127.0.0.1</code> under <strong>Firebase Console &rarr; Authentication &rarr; Settings &rarr; Authorized domains</strong>.` : `Please add <code>${window.location.hostname}</code> to <strong>Firebase Console &rarr; Authentication &rarr; Settings &rarr; Authorized domains</strong>.`}
          </span>
        </div>
      `);
    } else if (err.code === 'auth/operation-not-allowed') {
      displayAuthAlert('error', `
        <div style="text-align:left; line-height: 1.5;">
          <strong>Google Sign-In Disabled in Firebase Console</strong><br>
          <span style="font-size:0.82rem; display:block; margin:6px 0;">
            Please enable Google Sign-In:<br>
            1. Open <a href="https://console.firebase.google.com" target="_blank" style="color:#60a5fa; text-decoration:underline;">Firebase Console</a> &rarr; <strong>Authentication</strong> &rarr; <strong>Sign-in method</strong><br>
            2. Click <strong>Google</strong> &rarr; Switch to <strong>Enable</strong><br>
            3. Select your support email &rarr; Click <strong>Save</strong>.
          </span>
        </div>
      `);
    } else {
      displayAuthAlert('error', `Google Authentication failed: ${err.message || err.code}`);
    }
  }
};

window.handleGoogleAuth = window.signInWithGoogle;
window.handleGoogleSignInClick = window.signInWithGoogle;
window.triggerGoogleSignIn = window.signInWithGoogle;


// Central User Authentication & State Manager
window.authenticateUser = function(userData) {
  if (!userData || !userData.email) return;

  // Persist session in localStorage
  localStorage.setItem('ashraa_auth_user', JSON.stringify(userData));

  // Update UI across all active pages
  window.updateAuthUI(userData);

  // Provide user feedback on login.html
  const authAlert = document.getElementById('authAlert');
  if (authAlert) {
    authAlert.className = 'auth-alert success';
    authAlert.innerHTML = `✓ Signed in successfully as <strong>${userData.name}</strong> (${userData.email})`;
    authAlert.style.display = 'block';
  }

  // Provide user feedback on modal on index.html / other pages
  const msgBox = document.getElementById('authMsg');
  if (msgBox) {
    msgBox.className = 'auth-msg success';
    msgBox.innerHTML = `✓ Welcome, <strong>${userData.name}</strong>! Access unlocked.`;
    msgBox.style.display = 'block';
  }

  // Dismiss modal if present
  setTimeout(() => {
    window.unlockPortal();
  }, 500);
};

// Navbar User Profile Dropdown Controllers
window.toggleUserDropdown = function(e) {
  if (e) {
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
  }
  const menu = document.getElementById('navUserMenu');
  const btn = document.getElementById('navUserBtn');
  if (!menu) return;
  const isHidden = menu.style.display === 'none' || !menu.classList.contains('show');
  if (isHidden) {
    menu.style.display = 'block';
    menu.classList.add('show');
    if (btn) {
      btn.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    }
  } else {
    window.closeUserDropdown();
  }
};

window.closeUserDropdown = function() {
  const menu = document.getElementById('navUserMenu');
  const btn = document.getElementById('navUserBtn');
  if (menu) {
    menu.style.display = 'none';
    menu.classList.remove('show');
  }
  if (btn) {
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  }
};

// Global click-outside listener to close user profile dropdown
if (typeof document !== 'undefined') {
  document.addEventListener('click', function(e) {
    const wrap = document.querySelector('.nav-user-dropdown-wrap');
    if (wrap && !wrap.contains(e.target)) {
      window.closeUserDropdown();
    }
  });
}

// User Profile "Sign Up" button handler:
// Signs out current user and brings them directly to the Sign Up view/page
window.handleNavSignUp = function(e) {
  if (e && e.preventDefault) e.preventDefault();
  window.closeUserDropdown();
  window.signOutUser();

  // If on login.html, switch to sign up tab
  if (typeof switchAuthTab === 'function') {
    switchAuthTab('signup');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    // If on a page with authModal
    const authModal = document.getElementById('authModal');
    if (authModal) {
      if (typeof window.switchAuthView === 'function') {
        window.switchAuthView('signup');
      }
      authModal.classList.remove('auth-hidden');
      authModal.style.display = 'flex';
    } else {
      window.location.href = 'login.html#signup';
    }
  }
};

// UI Synchronizer (Navbar auth state, Login profile cards, Portal gates)
window.updateAuthUI = function(user) {
  const authModal = document.getElementById('authModal');
  const userPills = document.querySelectorAll('.user-status-pill');
  const userProfileCard = document.getElementById('userProfileCard');
  const authCard = document.getElementById('authCard');
  const userEmailDisplay = document.getElementById('userEmailDisplay');
  const userNameDisplay = document.getElementById('userNameDisplay');
  const userAvatarDisplay = document.getElementById('userAvatarDisplay');
  const userProviderBadge = document.getElementById('userProviderBadge');

  // Navbar elements for Login vs User Name button
  const navLoginItem = document.getElementById('navLoginItem');
  const navUserItem = document.getElementById('navUserItem');
  const navUserName = document.getElementById('navUserName');
  const navUserAvatar = document.getElementById('navUserAvatar');
  const menuUserName = document.getElementById('menuUserName');
  const menuUserEmail = document.getElementById('menuUserEmail');

  if (user) {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.classList.remove('show-auth-portal');
    }
    // 1. Hide modal gate on home/services/portfolio pages
    if (authModal) {
      authModal.classList.add('auth-hidden');
      authModal.classList.remove('active');
      authModal.style.display = 'none';
    }

    // 2. Hide Login button and ONLY show user name button in navbar
    if (navLoginItem) navLoginItem.style.display = 'none';
    if (navUserItem) navUserItem.style.display = 'inline-block';

    const displayName = user.name || (user.email ? user.email.split('@')[0] : 'Creator');
    if (navUserName) navUserName.textContent = displayName;
    if (menuUserName) menuUserName.textContent = displayName;
    if (menuUserEmail) menuUserEmail.textContent = user.email || '';

    if (navUserAvatar) {
      if (user.picture) {
        navUserAvatar.innerHTML = `<img src="${user.picture}" alt="${displayName}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />`;
      } else {
        const initial = displayName.charAt(0).toUpperCase();
        navUserAvatar.textContent = initial || '👤';
      }
    }

    // Legacy pills if any
    userPills.forEach(pill => {
      pill.style.display = 'none';
    });

    // 3. Update dedicated Login page views
    if (userProfileCard) {
      userProfileCard.style.display = 'block';
    }
    if (authCard) {
      authCard.style.display = 'none';
    }
    if (userEmailDisplay) {
      userEmailDisplay.textContent = user.email;
    }
    if (userNameDisplay) {
      userNameDisplay.textContent = `Welcome Back, ${user.name}!`;
    }
    if (userAvatarDisplay) {
      if (user.picture) {
        userAvatarDisplay.innerHTML = `<img src="${user.picture}" alt="${user.name}" />`;
      } else {
        const initial = (user.name || user.email || 'G').charAt(0).toUpperCase();
        userAvatarDisplay.textContent = initial;
      }
    }
    if (userProviderBadge) {
      if (user.provider === 'google') {
        userProviderBadge.innerHTML = `
          <svg viewBox="0 0 24 24" width="14" height="14">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>Verified via Google Account</span>
        `;
      } else {
        userProviderBadge.innerHTML = `<span>Verified Email Account</span>`;
      }
    }
  } else {
    // Logged out state - Automatically show login portal first on website entry
    const isGuestBrowsing = (typeof sessionStorage !== 'undefined') && sessionStorage.getItem('ashraa_guest_browsing') === 'true';
    if (authModal && !isGuestBrowsing) {
      if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.classList.add('show-auth-portal');
      }
      authModal.classList.remove('auth-hidden');
      authModal.classList.add('active');
      authModal.style.display = 'flex';
    } else if (authModal) {
      if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.classList.remove('show-auth-portal');
      }
      authModal.classList.add('auth-hidden');
      authModal.classList.remove('active');
      authModal.style.display = 'none';
    }

    // Show Login button, hide User Name button
    if (navLoginItem) navLoginItem.style.display = '';
    if (navUserItem) navUserItem.style.display = 'none';
    window.closeUserDropdown();

    userPills.forEach(pill => {
      pill.style.display = 'none';
      pill.onclick = null;
    });

    if (userProfileCard) {
      userProfileCard.style.display = 'none';
    }
    if (authCard) {
      authCard.style.display = 'block';
    }
  }
};

// Sign Out Handler
window.signOutUser = async function(e) {
  if (e && e.preventDefault) e.preventDefault();
  window.closeUserDropdown();

  const auth = getFirebaseAuth();
  if (auth) {
    try {
      await auth.signOut();
    } catch (err) {
      console.warn("Firebase sign out error:", err);
    }
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('ashraa_auth_user');
  }
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem('ashraa_guest_browsing');
  }
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.classList.add('show-auth-portal');
  }
  window.updateAuthUI(null);

  const authAlert = document.getElementById('authAlert');
  if (authAlert) {
    authAlert.className = 'auth-alert info';
    authAlert.textContent = 'You have signed out of Ashraa Media.';
    authAlert.style.display = 'block';
  }
};

window.handleSignOut = window.signOutUser;

// Authentic Firebase Email & Password Sign In
window.signInWithEmail = async function(email, password) {
  email = (email || '').trim().toLowerCase();
  password = (password || '').trim();

  if (!email || !password) {
    displayAuthAlert('error', 'Please enter both your email address and password.');
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    displayAuthAlert('error', 'Please enter a valid email address (e.g. you@brand.com).');
    return;
  }

  const auth = getFirebaseAuth();
  if (!auth) {
    displayAuthAlert('error', `Firebase Auth is not configured.<br><button type="button" onclick="window.configureFirebase()" class="btn btn-secondary" style="margin-top:6px; font-size:0.78rem;">Configure Firebase</button>`);
    return;
  }

  displayAuthAlert('info', 'Verifying credentials...');

  try {
    const cred = await auth.signInWithEmailAndPassword(email, password);
    const user = cred.user;

    // Strict Email Verification Check - Fake or unverified emails CANNOT enter!
    if (!user.emailVerified) {
      displayAuthAlert('error', `Your email is not verified yet. Please check your inbox at <strong>${email}</strong> and click the confirmation link before signing in.<br><button type="button" onclick="window.resendFirebaseVerification()" class="auth-link" style="margin-top:6px; font-size:0.8rem; display:inline-block;">Resend verification email</button>`);
      return;
    }

    const profile = {
      id: user.uid,
      name: user.displayName || user.email.split('@')[0],
      email: user.email,
      picture: user.photoURL || '',
      provider: 'email',
      signedInAt: new Date().toISOString()
    };

    displayAuthAlert('success', `✓ Verified! Welcome back, ${profile.name}.`);
    window.authenticateUser(profile);

    // If on login.html, redirect smoothly to studio
    if (window.location.pathname.endsWith('login.html') || window.location.href.includes('login.html')) {
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 700);
    }
  } catch (err) {
    console.error("Sign in error:", err);
    if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
      displayAuthAlert('error', 'Invalid email or password. Access denied.');
    } else if (err.code === 'auth/operation-not-allowed') {
      displayAuthAlert('error', 'Email/Password sign-in is not enabled in Firebase Console yet. Please enable it under <strong>Authentication &rarr; Sign-in method &rarr; Email/Password &rarr; Enable &rarr; Save</strong>.');
    } else {
      displayAuthAlert('error', err.message || 'Authentication failed. Access denied.');
    }
  }
};

// Authentic Firebase Email Sign Up with Real Email Verification Link
window.signUpWithEmail = async function(email, password, name) {
  email = (email || '').trim().toLowerCase();
  password = (password || '').trim();
  name = (name || '').trim();

  if (!email || !password || !name) {
    displayAuthAlert('error', 'Please fill in all fields (Full Name, Email Address, and Password).');
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    displayAuthAlert('error', 'Please enter a valid email address.');
    return;
  }

  if (password.length < 6) {
    displayAuthAlert('error', 'Password must be at least 6 characters long.');
    return;
  }

  const auth = getFirebaseAuth();
  if (!auth) {
    displayAuthAlert('error', `Firebase Auth is not configured.<br><button type="button" onclick="window.configureFirebase()" class="btn btn-secondary" style="margin-top:6px; font-size:0.78rem;">Configure Firebase</button>`);
    return;
  }

  displayAuthAlert('info', 'Creating account and sending verification email...');

  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    const user = cred.user;

    if (name) {
      try {
        await user.updateProfile({ displayName: name });
      } catch (e) {}
    }

    // Send official Google/Firebase verification email with link
    await user.sendEmailVerification();

    displayAuthAlert('success', `✓ Account created! A real verification link has been sent to <strong>${email}</strong>.<br>Please open your email inbox and click the verification link. Unverified accounts cannot access the studio.`);

    setTimeout(() => {
      if (typeof switchAuthTab === 'function') switchAuthTab('signin');
      const signInEmail = document.getElementById('signInEmail');
      if (signInEmail) signInEmail.value = email;
    }, 5500);
  } catch (err) {
    console.error("Sign up error:", err);
    if (err.code === 'auth/email-already-in-use') {
      displayAuthAlert('error', `An account with "<strong>${email}</strong>" already exists. Please Sign In.`);
    } else if (err.code === 'auth/operation-not-allowed') {
      displayAuthAlert('error', 'Email/Password registration is not enabled in Firebase Console yet. Please enable it under <strong>Authentication &rarr; Sign-in method &rarr; Email/Password &rarr; Enable &rarr; Save</strong>.');
    } else {
      displayAuthAlert('error', err.message || 'Registration failed.');
    }
  }
};

window.resendFirebaseVerification = async function() {
  const auth = getFirebaseAuth();
  if (auth && auth.currentUser) {
    try {
      await auth.currentUser.sendEmailVerification();
      displayAuthAlert('success', '✓ A new verification email has been dispatched. Please check your inbox.');
    } catch (e) {
      displayAuthAlert('error', e.message);
    }
  } else {
    displayAuthAlert('info', 'Please sign in with your email and password first to resend verification.');
  }
};

// Authentic Password Reset via Firebase
window.resetPassword = async function(email) {
  email = (email || '').trim().toLowerCase();
  const alertEl = document.getElementById('resetAlert') || document.getElementById('authAlert');

  const showMsg = (type, msg) => {
    if (alertEl) {
      alertEl.className = `auth-alert ${type}`;
      alertEl.innerHTML = msg;
      alertEl.style.display = 'block';
    } else {
      displayAuthAlert(type, msg);
    }
  };

  if (!email) {
    showMsg('error', 'Please enter your registered email address.');
    return;
  }

  const auth = getFirebaseAuth();
  if (!auth) {
    showMsg('error', 'Firebase Auth is not connected.');
    return;
  }

  showMsg('info', 'Sending password reset link...');

  try {
    await auth.sendPasswordResetEmail(email);
    showMsg('success', `✓ A password reset link has been sent to <strong>${email}</strong>. Please check your inbox and spam folder.`);
  } catch (err) {
    showMsg('error', err.message || 'Could not send reset email.');
  }
};

// Portal Gate Initializer (Checks real Firebase session)
window.initAuthGate = async function() {
  const auth = getFirebaseAuth();
  if (auth) {
    const user = auth.currentUser;
    if (user && (user.emailVerified || (user.providerData && user.providerData.some(p => p.providerId === 'google.com')))) {
      const profile = {
        id: user.uid,
        name: user.displayName || user.email.split('@')[0],
        email: user.email,
        picture: user.photoURL || '',
        provider: (user.providerData && user.providerData[0]?.providerId) || 'firebase',
        signedInAt: new Date().toISOString()
      };
      window.authenticateUser(profile);
      return;
    }
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('ashraa_auth_user');
  }
  window.updateAuthUI(null);
};

// Auth Modal Open/Close Controls
window.openAuthModal = function(view) {
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.classList.add('show-auth-portal');
  }
  const authModal = document.getElementById('authModal');
  if (authModal) {
    if (view && typeof window.switchAuthView === 'function') {
      window.switchAuthView(view);
    }
    authModal.classList.remove('auth-hidden');
    authModal.classList.add('active');
    authModal.style.display = 'flex';
    const emailInput = document.getElementById('authEmail');
    if (emailInput) setTimeout(() => emailInput.focus(), 80);
  } else {
    window.location.href = 'login.html' + (view === 'signup' ? '#signup' : '');
  }
};

window.closeAuthModal = function() {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('ashraa_guest_browsing', 'true');
  }
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.classList.remove('show-auth-portal');
  }
  const authModal = document.getElementById('authModal');
  if (authModal) {
    authModal.classList.add('auth-hidden');
    authModal.classList.remove('active');
    authModal.style.display = 'none';
  }
};

window.unlockPortal = window.closeAuthModal;

// Inline Form Switchers (index.html authModal)
window.switchAuthView = function(view) {
  window.authCurrentView = view;
  const loginForm = document.getElementById('authLoginForm');
  const forgotForm = document.getElementById('authForgotForm');
  const nameGroup = document.getElementById('authNameGroup');
  const title = document.getElementById('authTitle');
  const subtitle = document.getElementById('authSubtitle');
  const msgBox = document.getElementById('authMsg');
  const toggleRow = document.getElementById('authToggleRow');

  if (msgBox) {
    msgBox.style.display = 'none';
    msgBox.className = 'auth-msg';
  }

  if (view === 'forgot') {
    if (loginForm) loginForm.style.display = 'none';
    if (forgotForm) forgotForm.style.display = 'block';
    if (nameGroup) nameGroup.style.display = 'none';
    if (toggleRow) toggleRow.style.display = 'none';
    if (title) title.textContent = 'Reset Your Password';
    if (subtitle) subtitle.textContent = 'Enter your email to receive recovery instructions:';
  } else if (view === 'signup') {
    if (loginForm) loginForm.style.display = 'block';
    if (forgotForm) forgotForm.style.display = 'none';
    if (nameGroup) nameGroup.style.display = 'block';
    if (toggleRow) toggleRow.style.display = 'block';
    if (title) title.textContent = 'Join Creator Portal';
    if (subtitle) subtitle.textContent = 'Create an account for priority retention video editing:';
    const submitBtn = document.getElementById('authSubmitBtn');
    if (submitBtn) submitBtn.textContent = 'Create Account \u2192';
    const togglePrompt = document.getElementById('authTogglePrompt');
    if (togglePrompt) togglePrompt.innerHTML = `Already have an account? <button type="button" class="auth-link" onclick="switchAuthView('login')">Sign In</button>`;
  } else {
    if (loginForm) loginForm.style.display = 'block';
    if (forgotForm) forgotForm.style.display = 'none';
    if (nameGroup) nameGroup.style.display = 'none';
    if (toggleRow) toggleRow.style.display = 'block';
    if (title) title.textContent = 'Creator & Brand Portal';
    if (subtitle) subtitle.textContent = 'Sign in to access post-production suites & client dashboard:';
    const submitBtn = document.getElementById('authSubmitBtn');
    if (submitBtn) submitBtn.textContent = 'Sign In to Portal \u2192';
    const togglePrompt = document.getElementById('authTogglePrompt');
    if (togglePrompt) togglePrompt.innerHTML = `Don't have an account? <button type="button" class="auth-link" onclick="switchAuthView('signup')">Sign Up</button>`;
  }
};

window.handleEmailAuth = function(e) {
  if (e) e.preventDefault();
  const emailInput = document.getElementById('authEmail');
  const passInput = document.getElementById('authPassword');
  const nameInput = document.getElementById('authName');
  const email = emailInput ? emailInput.value.trim() : '';
  const password = passInput ? passInput.value : '';
  const name = nameInput ? nameInput.value.trim() : '';

  if (window.authCurrentView === 'signup') {
    const defaultName = email.split('@')[0];
    const formattedName = name || (defaultName.charAt(0).toUpperCase() + defaultName.slice(1));
    window.signUpWithEmail(email, password, formattedName);
  } else {
    window.signInWithEmail(email, password);
  }
};

window.handleForgotSubmit = function(e) {
  if (e) e.preventDefault();
  const emailInput = document.getElementById('forgotEmail');
  const email = emailInput ? emailInput.value.trim() : '';
  window.resetPassword(email);
};

window.handleGuestAccess = function() {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('ashraa_guest_browsing', 'true');
  }
  window.closeAuthModal();
};

// ==========================================
// 15. GLOBAL INITIALIZATION (AUTH GATE & FIXED NAVBAR)
// ==========================================
function setupFixedNavbarScroll() {
  const header = document.querySelector('header');
  if (!header) return;
  const updateScroll = () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', updateScroll, { passive: true });
  updateScroll();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.initAuthGate === 'function') window.initAuthGate();
    setupFixedNavbarScroll();
  });
} else {
  if (typeof window.initAuthGate === 'function') window.initAuthGate();
  setupFixedNavbarScroll();
}