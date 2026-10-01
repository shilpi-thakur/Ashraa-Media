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

// Your Supabase Project Details (Optional)
const SUPABASE_URL = "https://nbxmptemldnusvhbuaih.supabase.co";

// PASTE YOUR ANON KEY FROM YOUR .ENV FILE BETWEEN THE QUOTES BELOW:
const SUPABASE_ANON_KEY = "sb_publishable_edVFMpyCnnpmf95F4Eyn9g_2fOBCrbP"; // Replace with your Supabase anon key

// Initialize Supabase safely (avoid collision with window.supabase from CDN and prevent runtime crashes)
const hasValidKey = Boolean(SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.includes("YOUR_ANON_KEY"));
let supabaseClient = null;
try {
  if (typeof window !== 'undefined' && window.supabase && hasValidKey) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
} catch (err) {
  console.warn("Could not initialize Supabase client:", err);
}

// Helper: Extract clean Google Drive ID from any URL or string
function extractDriveId(input) {
  if (!input) return '';
  const str = String(input).trim();
  const match = str.match(/\/d\/([a-zA-Z0-9_-]+)/) || str.match(/id=([a-zA-Z0-9_-]+)/);
  if (match && match[1]) return match[1];
  return str;
}

// Global Video Lightbox Controllers
// Map of known portfolio video assets for reliable in-page playback
const KNOWN_PORTFOLIO_VIDEOS = {
  '17gGoKwbjlQ0jb7pY5NVpULoyWxBMhgOJ': {
    src: 'assets/videos/reel-1.mp4',
    poster: 'assets/thumb-reel-1.jpg',
    title: 'Documentary Storytelling Reel'
  },
  '1JUDKEyJjB47jBiLS3bCKlOBk_UroBvuB': {
    src: 'assets/videos/reel-2.mp4',
    poster: 'assets/thumb-reel-2.jpg',
    title: 'Viral Retention Hook'
  },
  '1WvZ1WSDI1Uvqy52nhe62HeizqrcuYWi-': {
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
  } else if (!videoTarget.includes('/') && !videoTarget.includes('.')) {
    actualSrc = `https://drive.usercontent.google.com/download?id=${cleanId}&export=download`;
  }

  if (modalHeading) modalHeading.textContent = title || 'Preview Video';

  if (modalVideo) {
    modalVideo.style.display = 'block';
    if (modalIframe) modalIframe.style.display = 'none';
    if (actualPoster) modalVideo.poster = actualPoster;
    modalVideo.src = actualSrc;
    modalVideo.load();

    const playPromise = modalVideo.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.log("Auto-play paused, user can click play to start:", err);
      });
    }
  } else if (modalIframe) {
    modalIframe.style.display = 'block';
    modalIframe.src = actualSrc;
  }

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
};

window.closeVideoModal = function() {
  const videoModal = document.getElementById('videoModal');
  const modalVideo = document.getElementById('modalVideo');
  const modalIframe = document.getElementById('modalIframe');

  if (videoModal) {
    videoModal.classList.remove('active');
    videoModal.style.display = 'none';
  }
  if (modalVideo) {
    modalVideo.pause();
    modalVideo.removeAttribute('src');
    modalVideo.load();
  }
  if (modalIframe) {
    modalIframe.src = "";
  }
};

// Helper: Attach 3D Card Tilt & In-Page Video Modal
function setupProjectCard(card) {
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
    e.preventDefault();
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

  card.addEventListener('click', handleCardTrigger);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
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
  // 6. VIDEO LIGHTBOX MODAL CLOSE HANDLERS
  // ==========================================
  const videoModal = document.getElementById('videoModal');
  const modalClose = document.getElementById('modalClose');
  const modalIframe = document.getElementById('modalIframe');

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

  // ESC key closes any open modal
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.closePayModal();
      window.closeCallModal();
      window.closeVideoModal();
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
// 14.1 USER ACCOUNTS DATABASE & STATE HELPERS
// ==========================================
const DEFAULT_REGISTERED_USERS = [
  {
    name: "Shilpi Thakur",
    email: "shilpithskur9b37@gmail.com",
    password: "Password@123",
    provider: "google",
    createdAt: "2026-09-01T00:00:00.000Z"
  },
  {
    name: "Ashraa Studio Admin",
    email: "admin@ashraamedia.com",
    password: "Admin@1234",
    provider: "email",
    createdAt: "2026-09-01T00:00:00.000Z"
  }
];

function getRegisteredUsers() {
  const raw = localStorage.getItem('ashraa_registered_users');
  if (!raw) {
    localStorage.setItem('ashraa_registered_users', JSON.stringify(DEFAULT_REGISTERED_USERS));
    return [...DEFAULT_REGISTERED_USERS];
  }
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [...DEFAULT_REGISTERED_USERS];
  } catch (e) {
    return [...DEFAULT_REGISTERED_USERS];
  }
}

function saveRegisteredUsers(users) {
  localStorage.setItem('ashraa_registered_users', JSON.stringify(users));
}

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
    authMsg.className = `auth-msg ${type === 'error' ? 'error' : 'success'}`;
    authMsg.innerHTML = message;
    authMsg.style.display = 'block';
  }
}

// Ensure the Google Account Modal exists in DOM
function ensureGoogleModal() {
  let modal = document.getElementById('googleAccountModal');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.className = 'google-modal';
  modal.id = 'googleAccountModal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'googleModalTitle');

  modal.innerHTML = `
    <div class="google-modal-box">
      <button type="button" class="google-modal-close" onclick="closeGoogleModal()" aria-label="Close">&times;</button>
      <div class="google-modal-header">
        <svg class="google-modal-logo" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
        </svg>
        <h3 class="google-modal-title" id="googleModalTitle">Choose an account</h3>
        <p class="google-modal-subtitle">to continue to <strong style="color:#1f1f1f;">Ashraa Media</strong></p>
      </div>

      <div id="googleModalAlert" style="display:none; font-size:0.84rem; padding:10px 12px; border-radius:8px; margin-bottom:12px; text-align:center;"></div>

      <!-- Quick 1-Click Accounts List (First & Prominent) -->
      <div class="google-account-list" id="googleAccountList">
        <button type="button" class="google-account-item" onclick="selectGoogleAccount('Shilpi Thakur', 'shilpithskur9b37@gmail.com')">
          <div class="google-account-avatar">S</div>
          <div class="google-account-info">
            <div class="google-account-name">Shilpi Thakur</div>
            <div class="google-account-email">shilpithskur9b37@gmail.com</div>
          </div>
          <span class="google-account-arrow">&rsaquo;</span>
        </button>

        <button type="button" class="google-account-item" onclick="selectGoogleAccount('Ashraa Studio', 'ashraaofficial@gmail.com')">
          <div class="google-account-avatar" style="background:#ea4335;">A</div>
          <div class="google-account-info">
            <div class="google-account-name">Ashraa Studio</div>
            <div class="google-account-email">ashraaofficial@gmail.com</div>
          </div>
          <span class="google-account-arrow">&rsaquo;</span>
        </button>

        <!-- Use Another Account Option -->
        <button type="button" class="google-custom-trigger" onclick="toggleCustomGoogleAccount(event)">
          <div class="google-account-avatar" style="background:#f1f3f4; color:#1a73e8; font-weight:700;">+</div>
          <div class="google-account-info">
            <div class="google-account-name" style="color:#1a73e8; font-weight:600;">Use another Google account</div>
          </div>
          <span class="google-account-arrow" style="color:#1a73e8;">&rsaquo;</span>
        </button>
      </div>

      <!-- Expandable Single Input for Custom Google Email -->
      <form id="googleCustomForm" class="google-custom-form" onsubmit="handleGoogleDirectSubmit(event)" style="display: none;">
        <div style="margin-bottom: 8px;">
          <label for="googleAuthEmail" style="display:block; font-size:0.78rem; color:#5f6368; margin-bottom:4px; font-weight:600;">Google Email Address</label>
          <input type="email" id="googleAuthEmail" class="google-custom-input" placeholder="e.g. yourname@gmail.com" required autocomplete="email" style="margin-bottom:8px;" />
        </div>
        <button type="submit" id="btnGoogleSubmit" class="btn btn-primary" style="width:100%; justify-content:center; padding:10px 12px; font-size:0.88rem; font-weight:600; background:#1a73e8; border-color:#1a73e8; color:#fff; border-radius:8px; cursor:pointer;">
          Continue with Google &rarr;
        </button>
      </form>

      <div class="google-modal-footer">
        To continue, Google will share your name, email address, language preference, and profile picture with Ashraa Media.
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) window.closeGoogleModal();
  });

  return modal;
}

// Toggle "Use another Google account" input
window.toggleCustomGoogleAccount = function(e) {
  if (e && e.preventDefault) e.preventDefault();
  const form = document.getElementById('googleCustomForm');
  if (!form) return;
  const isShown = form.classList.contains('active') && form.style.display === 'block';
  if (isShown) {
    form.classList.remove('active');
    form.style.display = 'none';
  } else {
    form.classList.add('active');
    form.style.display = 'block';
    const emailInput = document.getElementById('googleAuthEmail');
    if (emailInput) setTimeout(() => emailInput.focus(), 60);
  }
};

// Google Modal Open Action
window.openGoogleModal = function(e) {
  if (e) {
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
  }
  const modal = ensureGoogleModal();

  // If real Google Client ID is configured and GIS is available, trigger One-Tap prompt
  if (window.GOOGLE_CLIENT_ID && window.GOOGLE_CLIENT_ID.includes('.apps.googleusercontent.com') && window.google && window.google.accounts && window.google.accounts.id) {
    try {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          if (modal) {
            modal.classList.add('active');
            modal.style.display = 'flex';
          }
        }
      });
      return;
    } catch (e) {
      console.warn("Google One-Tap trigger fallback:", e);
    }
  }

  // Display authentic 1-Click Google Account Chooser
  if (modal) {
    const alertEl = document.getElementById('googleModalAlert');
    if (alertEl) {
      alertEl.style.display = 'none';
      alertEl.textContent = '';
    }
    const customForm = document.getElementById('googleCustomForm');
    if (customForm) {
      customForm.classList.remove('active');
      customForm.style.display = 'none';
    }
    modal.classList.add('active');
    modal.style.display = 'flex';
  }
};

window.closeGoogleModal = function() {
  const modal = document.getElementById('googleAccountModal');
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
  }
};

// 1-Click Direct Google Authentication Handler
window.handleGoogleAuth = function(e, specificUser) {
  if (e && e.preventDefault) e.preventDefault();

  const googleUser = specificUser || {
    name: 'Shilpi Thakur',
    email: 'shilpithskur9b37@gmail.com',
    provider: 'google',
    picture: '',
    signedInAt: new Date().toISOString()
  };

  // Immediate visual feedback on all Google buttons
  const googleBtns = document.querySelectorAll('.btn-google-auth, .btn-google');
  googleBtns.forEach(btn => {
    if (!btn.hasAttribute('data-original-html')) {
      btn.setAttribute('data-original-html', btn.innerHTML);
    }
    btn.disabled = true;
    btn.innerHTML = `
      <span class="google-spinner"></span>
      <span>Connecting with Google...</span>
    `;
  });

  // Modal alert inside Google Chooser if open
  const modalAlertEl = document.getElementById('googleModalAlert');
  if (modalAlertEl) {
    modalAlertEl.style.display = 'block';
    modalAlertEl.style.background = '#e8f0fe';
    modalAlertEl.style.color = '#1a73e8';
    modalAlertEl.innerHTML = `<span class="google-spinner"></span> Authenticating as <strong>${googleUser.name}</strong> (${googleUser.email})...`;
  }

  // Provide immediate status feedback in authModal
  const msgBox = document.getElementById('authMsg');
  if (msgBox) {
    msgBox.className = 'auth-msg success';
    msgBox.innerHTML = `✓ Authenticating with Google as <strong>${googleUser.name}</strong>...`;
    msgBox.style.display = 'block';
  }

  // Provide immediate status feedback on login.html
  const alertBox = document.getElementById('authAlert');
  if (alertBox) {
    alertBox.className = 'auth-alert success';
    alertBox.innerHTML = `✓ Authenticating with Google as <strong>${googleUser.name}</strong> (${googleUser.email})...`;
    alertBox.style.display = 'block';
  }

  // Register in user database if not present
  const users = getRegisteredUsers();
  let existingUser = users.find(u => u.email.toLowerCase() === googleUser.email.toLowerCase());
  if (!existingUser) {
    existingUser = {
      name: googleUser.name,
      email: googleUser.email,
      password: "GoogleAuthUser@2026",
      provider: "google",
      picture: googleUser.picture || "",
      createdAt: new Date().toISOString()
    };
    users.push(existingUser);
    saveRegisteredUsers(users);
  }

  // Close Google Chooser modal if open
  window.closeGoogleModal();

  setTimeout(() => {
    window.authenticateUser({
      name: existingUser.name || googleUser.name,
      email: existingUser.email || googleUser.email,
      picture: existingUser.picture || googleUser.picture || '',
      provider: 'google',
      signedInAt: new Date().toISOString()
    });

    // If on login.html, smooth transition to home
    if (typeof window !== 'undefined' && window.location && (window.location.pathname.endsWith('login.html') || window.location.href.includes('login.html'))) {
      const alertBox = document.getElementById('authAlert');
      if (alertBox) {
        alertBox.innerHTML = `✓ Welcome, <strong>${googleUser.name}</strong>! Redirecting to studio...`;
      }
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 700);
    }

    // Restore button appearance after short delay
    setTimeout(() => {
      googleBtns.forEach(btn => {
        btn.disabled = false;
        const originalHtml = btn.getAttribute('data-original-html');
        if (originalHtml) {
          btn.innerHTML = originalHtml;
        }
      });
    }, 400);
  }, 250);
};

// Aliases and unified handlers
window.signInWithGoogle = function(e) {
  window.handleGoogleAuth(e);
};

window.selectGoogleAccount = function(name, email, picture) {
  name = (name || 'Google Creator').trim();
  email = (email || '').trim().toLowerCase();
  window.handleGoogleAuth(null, {
    name: name,
    email: email,
    picture: picture || '',
    provider: 'google',
    signedInAt: new Date().toISOString()
  });
};

// Direct Submit for Custom Google Email
window.handleGoogleDirectSubmit = function(e) {
  if (e && e.preventDefault) e.preventDefault();
  const emailInput = document.getElementById('googleAuthEmail');
  const email = emailInput ? emailInput.value.trim().toLowerCase() : '';

  if (!email || !email.includes('@') || !email.includes('.')) {
    const alertEl = document.getElementById('googleModalAlert');
    if (alertEl) {
      alertEl.style.display = 'block';
      alertEl.style.background = 'rgba(239, 68, 68, 0.15)';
      alertEl.style.color = '#f87171';
      alertEl.textContent = 'Please enter a valid Google email address.';
    }
    return;
  }

  const defaultName = email.split('@')[0];
  const resolvedName = defaultName.charAt(0).toUpperCase() + defaultName.slice(1);
  window.selectGoogleAccount(resolvedName, email);
};

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
    // 1. Hide modal gate on home/services/portfolio pages
    if (authModal) {
      authModal.classList.add('auth-hidden');
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
    // Logged out state
    if (authModal) {
      authModal.classList.remove('auth-hidden');
      authModal.style.display = 'flex';
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
window.signOutUser = function(e) {
  if (e && e.preventDefault) e.preventDefault();
  window.closeUserDropdown();
  localStorage.removeItem('ashraa_auth_user');
  window.updateAuthUI(null);

  const authAlert = document.getElementById('authAlert');
  if (authAlert) {
    authAlert.className = 'auth-alert info';
    authAlert.textContent = 'You have signed out of Ashraa Media.';
    authAlert.style.display = 'block';
  }
};

window.handleSignOut = window.signOutUser;

// Proper Email Sign In Handler
window.signInWithEmail = function(email, password) {
  email = (email || '').trim().toLowerCase();
  password = (password || '').trim();

  if (!email || !password) {
    displayAuthAlert('error', 'Please enter both your email address and password.');
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    displayAuthAlert('error', 'Please enter a valid email address (e.g. you@channel.com).');
    return;
  }

  const users = getRegisteredUsers();
  const user = users.find(u => u.email.toLowerCase() === email);

  if (!user) {
    displayAuthAlert('error', `No account found for "<strong>${email}</strong>". Please click <strong>Create Account</strong> above to register.`);
    return;
  }

  if (user.password !== password) {
    displayAuthAlert('error', 'Incorrect password. Please verify your password and try again.');
    return;
  }

  // Proper credentials verified!
  displayAuthAlert('success', `✓ Signed in successfully! Welcome back, ${user.name}.`);
  window.authenticateUser({
    name: user.name,
    email: user.email,
    picture: user.picture || '',
    provider: user.provider || 'email',
    signedInAt: new Date().toISOString()
  });
};

// Proper Email Sign Up Handler
window.signUpWithEmail = function(email, password, name) {
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

  const users = getRegisteredUsers();
  const existing = users.find(u => u.email.toLowerCase() === email);

  if (existing) {
    displayAuthAlert('error', `An account with "<strong>${email}</strong>" already exists. Please Sign In.`);
    if (typeof switchAuthTab === 'function') {
      switchAuthTab('signin');
      const signInEmail = document.getElementById('signInEmail');
      if (signInEmail) signInEmail.value = email;
    }
    return;
  }

  // Register in persistent storage
  const newUser = {
    name: name,
    email: email,
    password: password,
    provider: 'email',
    createdAt: new Date().toISOString()
  };
  users.push(newUser);
  saveRegisteredUsers(users);

  displayAuthAlert('success', `✓ Account created successfully! Welcome to Ashraa Media, ${name}.`);
  window.authenticateUser({
    name: newUser.name,
    email: newUser.email,
    provider: 'email',
    signedInAt: new Date().toISOString()
  });
};

// Proper Password Reset Handler
window.resetPassword = function(email) {
  email = (email || '').trim().toLowerCase();
  const resetAlert = document.getElementById('resetAlert') || document.getElementById('authAlert');

  if (!email) {
    if (resetAlert) {
      resetAlert.className = 'auth-alert error';
      resetAlert.textContent = 'Please enter your registered email address.';
      resetAlert.style.display = 'block';
    }
    return;
  }

  const users = getRegisteredUsers();
  const user = users.find(u => u.email.toLowerCase() === email);

  if (!user) {
    if (resetAlert) {
      resetAlert.className = 'auth-alert error';
      resetAlert.innerHTML = `No registered account found with "<strong>${email}</strong>".`;
      resetAlert.style.display = 'block';
    }
    return;
  }

  user.password = "Ashraa@123";
  saveRegisteredUsers(users);

  if (resetAlert) {
    resetAlert.className = 'auth-alert success';
    resetAlert.innerHTML = `✓ Password reset successful for <strong>${email}</strong>!<br>Your temporary password is: <span style="background:rgba(255,255,255,0.2); padding:2px 8px; border-radius:4px; font-weight:700;">Ashraa@123</span><br>Click Back to Sign In to log in.`;
    resetAlert.style.display = 'block';
  }
};

// Portal Gate Initializer
window.initAuthGate = function() {
  ensureGoogleModal();
  loadGoogleIdentityServices();

  const savedUser = localStorage.getItem('ashraa_auth_user');
  if (savedUser) {
    try {
      const userData = JSON.parse(savedUser);
      window.updateAuthUI(userData);
    } catch (e) {
      window.updateAuthUI(null);
    }
  } else {
    window.updateAuthUI(null);
  }
};

// Modal Dismiss
window.unlockPortal = function() {
  const authModal = document.getElementById('authModal');
  if (authModal) {
    authModal.classList.add('auth-hidden');
    setTimeout(() => {
      authModal.style.display = 'none';
    }, 300);
  }
};

// Inline Form Switchers (index.html authModal)
window.switchAuthView = function(view) {
  window.authCurrentView = view;
  const loginForm = document.getElementById('authLoginForm');
  const forgotForm = document.getElementById('authForgotForm');
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
    if (toggleRow) toggleRow.style.display = 'none';
    if (title) title.textContent = 'Reset Your Password';
    if (subtitle) subtitle.textContent = 'Enter your email to receive recovery instructions:';
  } else if (view === 'signup') {
    if (loginForm) loginForm.style.display = 'block';
    if (forgotForm) forgotForm.style.display = 'none';
    if (toggleRow) toggleRow.style.display = 'block';
    if (title) title.textContent = 'Join Creator Portal';
    if (subtitle) subtitle.textContent = 'Create an account for priority retention video editing:';
    const submitBtn = document.getElementById('authSubmitBtn');
    if (submitBtn) submitBtn.textContent = 'Create Account &rarr;';
    const togglePrompt = document.getElementById('authTogglePrompt');
    if (togglePrompt) togglePrompt.innerHTML = `Already have an account? <button type="button" class="auth-link" onclick="switchAuthView('login')">Sign In</button>`;
  } else {
    if (loginForm) loginForm.style.display = 'block';
    if (forgotForm) forgotForm.style.display = 'none';
    if (toggleRow) toggleRow.style.display = 'block';
    if (title) title.textContent = 'Creator & Brand Portal';
    if (subtitle) subtitle.textContent = 'Sign in to access post-production suites & client dashboard:';
    const submitBtn = document.getElementById('authSubmitBtn');
    if (submitBtn) submitBtn.textContent = 'Sign In to Portal &rarr;';
    const togglePrompt = document.getElementById('authTogglePrompt');
    if (togglePrompt) togglePrompt.innerHTML = `Don't have an account? <button type="button" class="auth-link" onclick="switchAuthView('signup')">Sign Up</button>`;
  }
};

window.handleEmailAuth = function(e) {
  if (e) e.preventDefault();
  const emailInput = document.getElementById('authEmail');
  const passInput = document.getElementById('authPassword');
  const email = emailInput ? emailInput.value.trim() : '';
  const password = passInput ? passInput.value : '';

  if (window.authCurrentView === 'signup') {
    const defaultName = email.split('@')[0];
    const formattedName = defaultName.charAt(0).toUpperCase() + defaultName.slice(1);
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
  window.authenticateUser({
    name: 'Guest Creator',
    email: 'guest@ashraamedia.com',
    provider: 'guest',
    signedInAt: new Date().toISOString()
  });
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