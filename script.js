/**
 * Aashra Studio — Main Interaction & Supabase Engine
 */

// ==========================================
// 1. STUDIO CONFIGURATION & SUPABASE SETUP
// ==========================================
const STUDIO_WHATSAPP = "916201607744";
const STUDIO_UPI_ID   = "ashraaofficial@okicici";
const STUDIO_QR_IMAGE = "assets/upi-qr.png"; // User's official Google Pay QR code
const STUDIO_QR_FALLBACK = "assets/upi-qr-placeholder.svg";
const STUDIO_NAME     = "Ashraa Media";

// Your Supabase Project Details
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
  const amount = window.activeAmount || 4999;
  const plan = window.activePlan || "Starter Creator";

  if (mode === 'dynamic') {
    if (btnDynamic) btnDynamic.classList.add('active');
    if (btnGpay) btnGpay.classList.remove('active');
    if (upiQrCode) {
      const upiUri = `upi://pay?pa=${encodeURIComponent(STUDIO_UPI_ID)}&pn=${encodeURIComponent(STUDIO_NAME)}&am=${amount}&cu=INR&tn=${encodeURIComponent(plan + ' Retainer')}`;
      upiQrCode.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiUri)}`;
      upiQrCode.alt = `Dynamic UPI QR for ${plan} (₹${amount})`;
    }
  } else {
    if (btnGpay) btnGpay.classList.add('active');
    if (btnDynamic) btnDynamic.classList.remove('active');
    if (upiQrCode) {
      upiQrCode.src = STUDIO_QR_IMAGE;
      upiQrCode.alt = `Official Google Pay QR Code for ${STUDIO_NAME}`;
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

  // Set default QR mode to user's official GPay QR
  window.switchQrMode('gpay');

  if (upiQrCode) {
    upiQrCode.onerror = function () {
      upiQrCode.onerror = null;
      upiQrCode.src = STUDIO_QR_FALLBACK;
    };
  }

  if (mobileUpiBtn) {
    const upiUri = `upi://pay?pa=${encodeURIComponent(STUDIO_UPI_ID)}&pn=${encodeURIComponent(STUDIO_NAME)}&am=${rupees}&cu=INR&tn=${encodeURIComponent(plan + ' Suite')}`;
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

window.setSlot = function(btn, slot) {
  document.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  window.selectedCallSlot = slot;
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
        slotButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        window.selectedCallSlot = btn.getAttribute('data-slot') || btn.textContent;
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

});