document.addEventListener('DOMContentLoaded', () => {

  // --- 1. Sticky Navigation Header Scroll Effect ---
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    
    // Active Link Scroll Highlight (only on main index.html)
    highlightNavLink();
  });

  // --- 2. Responsive Mobile Menu Toggle ---
  const menuToggle = document.getElementById('menu-toggle');
  const bodyElement = document.body;
  const navLinks = document.querySelectorAll('nav a');

  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      bodyElement.classList.toggle('nav-active');
    });
  }

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      bodyElement.classList.remove('nav-active');
    });
  });

  // --- 3. Scroll Reveal Animation using Intersection Observer ---
  const revealElements = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  revealElements.forEach(el => {
    revealObserver.observe(el);
  });

  // Function to update active menu link based on current section
  const sections = document.querySelectorAll('section, footer');
  function highlightNavLink() {
    let scrollPos = window.scrollY + 120;
    
    sections.forEach(section => {
      if (section.id && scrollPos >= section.offsetTop && scrollPos < section.offsetTop + section.offsetHeight) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${section.id}` || link.getAttribute('href') === `index.html#${section.id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }

  // --- 4. Interactive Venn Synergy Diagram ---
  const vennCircles = document.querySelectorAll('.venn-circle');
  const highlightSpan = document.getElementById('highlighted-sector');
  const captionText = document.getElementById('diagram-caption');

  const partnerDetails = {
    'tech-lead': {
      label: 'Web Operations',
      partner: 'Aravind Nair',
      details: 'Aravind Nair (Lead Technology Architect) oversees customized responsive web builds, speed optimizations, Next.js architecture, and ongoing code support.'
    },
    'mktg-lead': {
      label: 'Growth Marketing',
      partner: 'Rohit Sharma',
      details: 'Rohit Sharma (Lead Marketing Strategist) structures search presence updates (SEO), paid advertising campaigns, and conversion funnels to build target visibility.'
    },
    'fin-lead': {
      label: 'CA Compliance & Audit',
      partner: 'Neha Gupta, CA',
      details: 'Neha Gupta, CA (Lead Financial & Tax Advisor) directs corporate accounting, GST preparations, ROC statutory filings, and board audit readiness.'
    }
  };

  vennCircles.forEach(circle => {
    circle.addEventListener('mouseenter', (e) => {
      const target = e.target.getAttribute('data-target');
      highlightCircle(e.target);
      updateDiagramText(target);
    });

    circle.addEventListener('click', (e) => {
      const target = e.target.getAttribute('data-target');
      highlightCircle(e.target);
      updateDiagramText(target);
    });
  });

  function highlightCircle(activeCircle) {
    vennCircles.forEach(c => c.classList.remove('active'));
    activeCircle.classList.add('active');
  }

  function updateDiagramText(key) {
    if (partnerDetails[key] && highlightSpan && captionText) {
      highlightSpan.textContent = partnerDetails[key].label;
      captionText.innerHTML = `Hover over a sector to see the lead partner. Currently highlighting: <span>${partnerDetails[key].label}</span> overseen by <span>${partnerDetails[key].partner}</span>. <br><small style="display:block; margin-top:5px; color: var(--text-muted); line-height: 1.4;">${partnerDetails[key].details}</small>`;
    }
  }

  // --- 5. Service Plan Mixer & Synergy Calculator ---
  const mixerCards = document.querySelectorAll('.mixer-card');
  const totalDisplay = document.getElementById('calc-total');
  const periodDisplay = document.getElementById('calc-period');
  const discountBadge = document.getElementById('calc-discount-badge');
  const deliverablesList = document.getElementById('calc-deliverables');
  const mixerInquireBtn = document.getElementById('mixer-btn-inquire');
  const contactServiceSelect = document.getElementById('contact-service');

  const serviceSpecs = {
    tech: {
      price: 35000,
      isSetup: true,
      deliverables: [
        'High-speed responsive website setup',
        'Continuous security & domain support',
        'Custom web applications layout structure'
      ]
    },
    marketing: {
      price: 20000,
      isSetup: false,
      deliverables: [
        'Conversion-focused search optimization (SEO)',
        'Paid campaigns setup & analytics monitoring',
        'Monthly growth metrics reports'
      ]
    },
    finance: {
      price: 12000,
      isSetup: false,
      deliverables: [
        'Statutory ROC filings & compliance reports',
        'GST & Corporate taxation filings',
        'Fractional CFO financial bookkeeping'
      ]
    }
  };

  mixerCards.forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('active');
      calculateSynergyPrice();
    });
  });

  function calculateSynergyPrice() {
    if (!totalDisplay) return; // Prevent errors on sub-pages

    let selectedSpecs = [];
    let setupSum = 0;
    let monthlySum = 0;
    let combinedDeliverables = [];

    mixerCards.forEach(card => {
      if (card.classList.contains('active')) {
        const serviceKey = card.getAttribute('data-service');
        const spec = serviceSpecs[serviceKey];
        selectedSpecs.push(serviceKey);
        
        if (spec.isSetup) {
          setupSum += spec.price;
        } else {
          monthlySum += spec.price;
        }
        
        combinedDeliverables = [...combinedDeliverables, ...spec.deliverables];
      }
    });

    const activeCount = selectedSpecs.length;
    let discount = 0;

    // Updated Discount logic: 10% (1 service), 20% (2 services), 30% (3 services)
    if (activeCount === 1) {
      discount = 0.10;
    } else if (activeCount === 2) {
      discount = 0.20;
    } else if (activeCount === 3) {
      discount = 0.30;
    }

    // Apply discount
    const finalSetup = Math.round(setupSum * (1 - discount));
    const finalMonthly = Math.round(monthlySum * (1 - discount));

    // Format Total Cost String
    let costString = '';
    let periodString = '';

    if (activeCount === 0) {
      costString = '₹0';
      periodString = '(Select services)';
      discountBadge.style.display = 'none';
    } else {
      // Format setup cost
      if (finalSetup > 0) {
        costString += `₹${finalSetup.toLocaleString('en-IN')}`;
        periodString = '(Setup Cost)';
      }
      
      // Format monthly cost
      if (finalMonthly > 0) {
        if (costString) {
          costString += ` + ₹${finalMonthly.toLocaleString('en-IN')}`;
          periodString = '(Setup + Monthly Retainer)';
        } else {
          costString = `₹${finalMonthly.toLocaleString('en-IN')}`;
          periodString = '(/month Retainer)';
        }
      }

      // Display discount badge
      if (discount > 0) {
        discountBadge.style.display = 'inline-flex';
        if (activeCount === 1) {
          discountBadge.innerHTML = `Single-Service Discount: <span id="calc-discount-val">${discount * 100}%</span>`;
        } else {
          discountBadge.innerHTML = `Consolidated Discount: <span id="calc-discount-val">${discount * 100}%</span>`;
        }
      } else {
        discountBadge.style.display = 'none';
      }
    }

    totalDisplay.textContent = costString;
    periodDisplay.textContent = periodString;

    // Render Deliverables
    deliverablesList.innerHTML = '';
    if (combinedDeliverables.length === 0) {
      deliverablesList.innerHTML = `<li><span style="color: var(--text-muted);">Please select a service above to view deliverables.</span></li>`;
    } else {
      combinedDeliverables.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg><span>${item}</span>`;
        deliverablesList.appendChild(li);
      });
    }
  }

  // Handle Plan Mixer CTA click: scrolls to form and maps selections
  if (mixerInquireBtn) {
    mixerInquireBtn.addEventListener('click', () => {
      let selectedServices = [];
      mixerCards.forEach(card => {
        if (card.classList.contains('active')) {
          selectedServices.push(card.getAttribute('data-service'));
        }
      });

      // Map selection to form dropdown
      if (contactServiceSelect) {
        if (selectedServices.length === 3) {
          contactServiceSelect.value = 'integrated';
        } else if (selectedServices.length === 1) {
          contactServiceSelect.value = selectedServices[0];
        } else if (selectedServices.length === 2) {
          contactServiceSelect.value = 'custom';
        } else {
          contactServiceSelect.value = 'integrated'; // Default fallback
        }
        
        // Highlight contact service input field
        contactServiceSelect.focus();
      }

      // Scroll to contact form
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // --- 6. Contact Form Submission with Overlay Success Notification ---
  const contactForm = document.getElementById('contact-form');
  const submitBtn = document.getElementById('contact-submit-btn');
  const successOverlay = document.getElementById('form-success-overlay');
  const resetBtn = document.getElementById('form-reset-btn');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Disable submit button and show sending state
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting Request...';

      // Simulate network latency (AJAX POST simulation)
      setTimeout(() => {
        successOverlay.classList.add('show');
        
        // Reset Form fields
        contactForm.reset();
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Request';
      }, 1200);
    });
  }

  if (resetBtn && successOverlay) {
    resetBtn.addEventListener('click', () => {
      successOverlay.classList.remove('show');
    });
  }
  // --- Firebase Google Auth Implementation ---
  
  // Firebase configuration keys (matching Farms_Version_5)
  const firebaseConfig = {
      apiKey: "AIzaSyC4rquVj5Ug2ZdsDci7zHucEUXXVtaCPcI",
      authDomain: "kshetriva-farms.firebaseapp.com",
      projectId: "kshetriva-farms",
      storageBucket: "kshetriva-farms.firebasestorage.app",
      messagingSenderId: "332889493996",
      appId: "1:332889493996:web:945cbd393438dc3aa9b0c9"
  };

  let auth = null;
  let useFirebase = false;
  let currentUser = null;

  // Initialize Firebase if compat libraries are loaded
  if (typeof firebase !== 'undefined') {
    try {
      firebase.initializeApp(firebaseConfig);
      auth = firebase.auth();
      useFirebase = true;
      console.log("🌊 HiddenWave: Firebase Initialized successfully.");
    } catch (e) {
      console.error("🌊 HiddenWave: Firebase init exception, running in mock/local mode:", e);
    }
  } else {
    console.log("🌊 HiddenWave: Compat SDKs not loaded or running offline, running in mock/local mode.");
  }

  // Auth state changed listener
  if (useFirebase && auth) {
    auth.onAuthStateChanged((user) => {
      if (user) {
        currentUser = {
          uid: user.uid,
          email: user.email,
          name: user.displayName || 'Client User'
        };
        updateAuthUI();
      } else {
        currentUser = null;
        updateAuthUI();
      }
    });
  } else {
    // Restore mock session from storage if offline
    const session = sessionStorage.getItem('hiddenwave_customer_session');
    if (session) {
      try {
        currentUser = JSON.parse(session);
      } catch (e) {}
    }
    // Update navbar on page load
    setTimeout(updateAuthUI, 200);
  }

  // UI state updater
  function updateAuthUI() {
    const accountBtn = document.getElementById('accountBtn');
    const guestView = document.getElementById('authGuestView');
    const profileView = document.getElementById('authProfileView');
    
    if (!accountBtn) return;

    if (currentUser) {
      const initial = (currentUser.name || 'C').trim().charAt(0).toUpperCase();
      accountBtn.innerHTML = `<div class="user-avatar" style="background: var(--gradient-main); color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.1);">${initial}</div>`;
      accountBtn.title = `My Account (${currentUser.name})`;
      
      // Update modal profile details
      if (profileView) {
        document.getElementById('profileInitials').textContent = initial;
        document.getElementById('profileName').textContent = currentUser.name;
        document.getElementById('profileEmail').textContent = currentUser.email;
        document.getElementById('profileUid').textContent = currentUser.uid.substring(0, 12) + "...";
      }
      if (guestView) guestView.style.display = 'none';
      if (profileView) profileView.style.display = 'block';
    } else {
      accountBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      `;
      accountBtn.title = "My Account";
      
      if (guestView) guestView.style.display = 'block';
      if (profileView) profileView.style.display = 'none';
    }
  }

  // Global functions exposed to window so inline HTML onclick calls work
  window.openAuthModal = function() {
    const modal = document.getElementById('customerAuthModal');
    if (modal) modal.classList.add('open');
  };

  window.closeAuthModal = function() {
    const modal = document.getElementById('customerAuthModal');
    if (modal) modal.classList.remove('open');
  };

  window.handleGoogleSignIn = function() {
    if (useFirebase && auth) {
      const provider = new firebase.auth.GoogleAuthProvider();
      auth.signInWithPopup(provider)
        .then((result) => {
          console.log("Google Login successful: ", result.user.email);
          window.closeAuthModal();
        })
        .catch((err) => {
          console.error("Google Login failed: ", err);
          alert("Login failed: " + err.message);
        });
    } else {
      console.log("Running simulated offline Google login.");
      const mockUser = {
        uid: "google_mock_" + Date.now(),
        email: "google.tester@example.com",
        name: "Google Tester"
      };
      currentUser = mockUser;
      sessionStorage.setItem('hiddenwave_customer_session', JSON.stringify(mockUser));
      updateAuthUI();
      window.closeAuthModal();
    }
  };

  window.handleSignOut = function() {
    if (useFirebase && auth) {
      auth.signOut()
        .then(() => {
          console.log("User signed out.");
          window.closeAuthModal();
        })
        .catch(err => console.error("Signout error:", err));
    } else {
      currentUser = null;
      sessionStorage.removeItem('hiddenwave_customer_session');
      updateAuthUI();
      window.closeAuthModal();
    }
  };

});
