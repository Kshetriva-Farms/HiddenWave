document.addEventListener('DOMContentLoaded', () => {

  // --- 1. Dynamic UI Additions (Scroll Progress & Back to Top) ---
  let progressBar = document.getElementById('scroll-progress');
  if (!progressBar) {
    progressBar = document.createElement('div');
    progressBar.id = 'scroll-progress';
    document.body.prepend(progressBar);
  }

  let backToTopBtn = document.getElementById('back-to-top');
  if (!backToTopBtn) {
    backToTopBtn = document.createElement('button');
    backToTopBtn.id = 'back-to-top';
    backToTopBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="18 15 12 9 6 15"></polyline>
      </svg>
    `;
    backToTopBtn.title = "Back to Top";
    document.body.appendChild(backToTopBtn);
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // --- 2. Sticky Navigation & Scroll Progress Header ---
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    
    // Scroll progress bar width update
    const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    if (windowHeight > 0) {
      const scrolled = (window.scrollY / windowHeight) * 100;
      progressBar.style.width = scrolled + '%';
    }
    
    // Show back-to-top button
    if (window.scrollY > 300) {
      backToTopBtn.classList.add('show');
    } else {
      backToTopBtn.classList.remove('show');
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
      label: 'Website Design & Support',
      partner: 'K.Vishnu Vardhan',
      details: 'K. Vishnu Vardhan designs your site, registers your domain name, makes sure it runs fast on phones, and updates your content.'
    },
    'mktg-lead': {
      label: 'Getting Customers (Marketing)',
      partner: 'Rohit Sharma',
      details: 'Rohit Sharma sets up Facebook/Google ads, helps you rank higher on Google search, and brings buyers to your site.'
    },
    'fin-lead': {
      label: 'Business Taxes & Bookkeeping',
      partner: 'Neha Gupta, CA',
      details: 'Neha Gupta (CA) registers your company, files your monthly GST and income tax, and reviews your bookkeeping records.'
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
      price: 15000,
      isSetup: true,
      deliverables: [
        'Website design built for phones and computers',
        'Fast and modern visual layout design',
        'Basic search-engine optimization setup'
      ]
    },
    tech_support: {
      price: 5000,
      isSetup: false,
      deliverables: [
        'Continuous website domain and security support',
        'Quick text and image updates every month',
        'Regular website speed optimization checks'
      ]
    },
    marketing: {
      price: 10000,
      isSetup: false,
      deliverables: [
        'Online ads setup on Google and Facebook',
        'Monthly sales and traffic monitoring reports',
        'Help to improve Google search visibility'
      ]
    },
    finance: {
      price: 5000,
      isSetup: false,
      deliverables: [
        'Company registration and government compliance support',
        'Monthly GST calculation and income tax filings',
        'Regular bookkeeping and finance dashboard checks'
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

    // Updated Discount logic: 10% (1 service), 20% (2 services), 30% (3 or more services)
    if (activeCount === 1) {
      discount = 0.10;
    } else if (activeCount === 2) {
      discount = 0.20;
    } else if (activeCount >= 3) {
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
      
      // Check for hCaptcha token
      const hCaptchaTokenEl = contactForm.querySelector('textarea[name=h-captcha-response]');
      const hCaptchaToken = hCaptchaTokenEl ? hCaptchaTokenEl.value : "";
      
      if (!hCaptchaToken) {
        alert("Please complete the hCaptcha spam verification first.");
        return;
      }
      
      // Disable submit button and show sending state
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting Request...';

      const leadData = {
        name: document.getElementById('contact-name').value,
        email: document.getElementById('contact-email-input').value,
        service: document.getElementById('contact-service').value,
        budget: document.getElementById('contact-budget').value,
        message: document.getElementById('contact-message').value,
        "h-captcha-response": hCaptchaToken,
        timestamp: new Date().toISOString()
      };

      if (useFirebase && db) {
        // Run Firestore write in the background to avoid blocking the user
        db.collection('leads').add({
          ...leadData,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
          console.log("🌊 HiddenWave: Lead successfully saved in Firestore.");
        })
        .catch((err) => {
          console.error("🌊 HiddenWave: Error saving lead to Firestore:", err);
        });
      } else {
        // Local simulation fallback
        let localLeads = [];
        try {
          localLeads = JSON.parse(localStorage.getItem('hiddenwave_local_leads')) || [];
        } catch(err) {}
        localLeads.push(leadData);
        localStorage.setItem('hiddenwave_local_leads', JSON.stringify(localLeads));
      }

      // Dispatch email notification in the background
      sendEmailNotification(leadData);

      // Instantly transition UI to success screen without waiting
      setTimeout(() => {
        if (successOverlay) successOverlay.classList.add('show');
        contactForm.reset();
        
        // Reset hCaptcha if defined
        if (window.hcaptcha) {
          hcaptcha.reset();
        }
        
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Request';
      }, 800);
    });
  }

  // --- 7. Web3Forms Email Notification Dispatcher ---
  function sendEmailNotification(leadData) {
    // Please replace with your actual Web3Forms access key
    const accessKey = "2aca75c3-4605-4657-9d72-e1b1441b0e5f"; 
    
    if (accessKey === "YOUR_WEB3FORMS_ACCESS_KEY") {
      console.log("🌊 HiddenWave: Web3Forms Access Key is not configured. Skipping email delivery.");
      return;
    }

    fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        access_key: accessKey,
        subject: `🌊 New Lead from ${leadData.name} - HiddenWave`,
        from_name: "HiddenWave Portal",
        name: leadData.name,
        email: leadData.email,
        service: leadData.service,
        budget: leadData.budget,
        message: leadData.message,
        "h-captcha-response": leadData["h-captcha-response"]
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log("🌊 HiddenWave: Email notification sent successfully via Web3Forms.");
      } else {
        console.warn("🌊 HiddenWave: Web3Forms email dispatch failed:", data.message);
      }
    })
    .catch(err => {
      console.error("🌊 HiddenWave: Error dispatching email via Web3Forms:", err);
    });
  }

  if (resetBtn && successOverlay) {
    resetBtn.addEventListener('click', () => {
      successOverlay.classList.remove('show');
    });
  }
  // --- Firebase Google Auth Implementation ---
  
  // Firebase configuration keys (matching hidden-wave)
  const firebaseConfig = {
      apiKey: "AIzaSyCOBgUAqFlzf2jm-_tJTQ5CB7sBoPTqZOg",
      authDomain: "hidden-wave.firebaseapp.com",
      projectId: "hidden-wave",
      storageBucket: "hidden-wave.firebasestorage.app",
      messagingSenderId: "467324173990",
      appId: "1:467324173990:web:f63b86f3b549467e947e67",
      measurementId: "G-3MRS99C9MP"
  };

  let auth = null;
  let db = null;
  let useFirebase = false;
  let currentUser = null;

  // Initialize Firebase if compat libraries are loaded
  if (typeof firebase !== 'undefined') {
    try {
      firebase.initializeApp(firebaseConfig);
      auth = firebase.auth();
      db = firebase.firestore();
      useFirebase = true;
      console.log("🌊 HiddenWave: Firebase & Firestore Initialized successfully.");
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
          name: user.displayName || 'Client User',
          phone: '',
          company: ''
        };
        
        // Immediate UI refresh with basic Auth data and local storage cache
        updateAuthUI();

        // Fetch custom user details from Firestore if db is active
        if (db) {
          db.collection('users').doc(user.uid).get()
            .then((doc) => {
              if (doc.exists) {
                const data = doc.data();
                currentUser.name = data.name || currentUser.name;
                currentUser.phone = data.phone || '';
                currentUser.company = data.company || '';

                // Cache in localStorage & sessionStorage
                localStorage.setItem('hiddenwave_custom_user_details_' + user.uid, JSON.stringify({
                  name: currentUser.name,
                  phone: currentUser.phone,
                  company: currentUser.company
                }));
                sessionStorage.setItem('hiddenwave_customer_session', JSON.stringify(currentUser));
                updateAuthUI();
              }
            })
            .catch((err) => {
              console.error("🌊 HiddenWave: Error fetching user profile from Firestore:", err);
            });
        }
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

  // Dynamic Auth status in-modal banner
  function showAuthStatus(message, type = 'info') {
    let statusDiv = document.getElementById('authStatusMessage');
    if (!statusDiv) {
      statusDiv = document.createElement('div');
      statusDiv.id = 'authStatusMessage';
      statusDiv.style.padding = '10px 14px';
      statusDiv.style.marginBottom = '15px';
      statusDiv.style.borderRadius = 'var(--radius-sm, 6px)';
      statusDiv.style.fontSize = '0.9rem';
      statusDiv.style.fontWeight = '500';
      statusDiv.style.textAlign = 'center';
      statusDiv.style.transition = 'all 0.25s ease';
      statusDiv.style.marginTop = '10px';
      
      const modalContent = document.querySelector('.auth-modal-content');
      if (modalContent) {
        const closeBtn = modalContent.querySelector('.close-auth-modal');
        if (closeBtn) {
          closeBtn.after(statusDiv);
        } else {
          modalContent.prepend(statusDiv);
        }
      }
    }
    
    if (type === 'success') {
      statusDiv.style.backgroundColor = '#d1fae5';
      statusDiv.style.color = '#065f46';
      statusDiv.style.border = '1px solid #10b981';
    } else if (type === 'error') {
      statusDiv.style.backgroundColor = '#fee2e2';
      statusDiv.style.color = '#991b1b';
      statusDiv.style.border = '1px solid #ef4444';
    } else { // info
      statusDiv.style.backgroundColor = '#e0f2fe';
      statusDiv.style.color = '#075985';
      statusDiv.style.border = '1px solid #3b82f6';
    }
    
    statusDiv.textContent = message;
    statusDiv.style.display = 'block';
    
    if (type !== 'error') {
      setTimeout(() => {
        statusDiv.style.display = 'none';
      }, 4000);
    }
  }

  // UI state updater
  function updateAuthUI() {
    const accountBtn = document.getElementById('accountBtn');
    const guestView = document.getElementById('authGuestView');
    const profileView = document.getElementById('authProfileView');
    
    if (!accountBtn) return;

    if (currentUser) {
      // Merge custom local details if saved previously in localStorage
      const localDetails = localStorage.getItem('hiddenwave_custom_user_details_' + currentUser.uid);
      if (localDetails) {
        try {
          const parsed = JSON.parse(localDetails);
          currentUser.name = parsed.name || currentUser.name;
          currentUser.phone = parsed.phone || '';
          currentUser.company = parsed.company || '';
        } catch (e) {}
      }

      const initial = (currentUser.name || 'C').trim().charAt(0).toUpperCase();
      accountBtn.innerHTML = `<div class="user-avatar" style="background: var(--gradient-main); color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.1);">${initial}</div>`;
      accountBtn.title = `My Account (${currentUser.name})`;
      
      // Update modal profile details
      if (profileView) {
        document.getElementById('profileInitials').textContent = initial;
        document.getElementById('profileName').textContent = currentUser.name;
        document.getElementById('profileEmail').textContent = currentUser.email;
        document.getElementById('profileUid').textContent = currentUser.uid.substring(0, 12) + "...";

        // Pre-fill editable input elements
        const editNameInput = document.getElementById('editProfileName');
        const editPhoneInput = document.getElementById('editProfilePhone');
        const editCompanyInput = document.getElementById('editProfileCompany');
        if (editNameInput) editNameInput.value = currentUser.name || '';
        if (editPhoneInput) editPhoneInput.value = currentUser.phone || '';
        if (editCompanyInput) editCompanyInput.value = currentUser.company || '';
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
      const googleBtn = document.querySelector('.btn-google');
      let originalHtml = "";
      if (googleBtn) {
        originalHtml = googleBtn.innerHTML;
        googleBtn.disabled = true;
        googleBtn.innerHTML = `
          <svg class="animate-spin" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="3" style="animation: spin 0.8s linear infinite; margin-right: 8px;">
            <circle cx="12" cy="12" r="10" stroke="var(--border-medium)" stroke-dasharray="31.4" stroke-dashoffset="10"/>
          </svg>
          <span>Signing in...</span>
        `;
      }

      const provider = new firebase.auth.GoogleAuthProvider();
      auth.signInWithPopup(provider)
        .then((result) => {
          const user = result.user;
          console.log("Google Login successful: ", user.email);
          
          if (db) {
            const userRef = db.collection('users').doc(user.uid);
            userRef.get().then((doc) => {
              if (doc.exists) {
                // Keep custom fields intact. Only sync lastLogin and photoURL.
                userRef.update({
                  lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                  photoURL: user.photoURL || ''
                })
                .then(() => {
                  console.log("🌊 HiddenWave: User session refreshed in Firestore.");
                })
                .catch((err) => {
                  console.error("🌊 HiddenWave: Error updating session timestamp:", err);
                });
              } else {
                // Initialize default profile details for new user
                userRef.set({
                  uid: user.uid,
                  email: user.email,
                  name: user.displayName || 'Client User',
                  photoURL: user.photoURL || '',
                  phone: '',
                  company: '',
                  lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                  createdAt: firebase.firestore.FieldValue.serverTimestamp()
                })
                .then(() => {
                  console.log("🌊 HiddenWave: Created new user profile in Firestore.");
                })
                .catch((err) => {
                  console.error("🌊 HiddenWave: Error creating user profile:", err);
                });
              }
            });
          }
          
          window.closeAuthModal();
        })
        .catch((err) => {
          console.error("Google Login failed: ", err);
          showAuthStatus("Google Sign-In failed: " + err.message, 'error');
        })
        .finally(() => {
          if (googleBtn) {
            googleBtn.disabled = false;
            googleBtn.innerHTML = originalHtml;
          }
        });
    } else {
      console.log("Running simulated offline Google login.");
      const mockUser = {
        uid: "google_mock_user_12345",
        email: "john.doe@corporate.com",
        name: "John Doe",
        phone: "+91 99999 88888",
        company: "Mock Corp LLC"
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
          // Clear cached local profile info
          if (currentUser) {
            localStorage.removeItem('hiddenwave_custom_user_details_' + currentUser.uid);
          }
          sessionStorage.removeItem('hiddenwave_customer_session');
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

  window.handleSaveProfileChanges = function() {
    const editName = document.getElementById('editProfileName');
    const editPhone = document.getElementById('editProfilePhone');
    const editCompany = document.getElementById('editProfileCompany');

    if (!currentUser) return;

    const uid = currentUser.uid;
    const customData = {
      name: editName ? editName.value.trim() : currentUser.name,
      phone: editPhone ? editPhone.value.trim() : '',
      company: editCompany ? editCompany.value.trim() : ''
    };

    if (!customData.name) {
      showAuthStatus("Display Name cannot be empty.", 'error');
      return;
    }

    const saveBtn = document.querySelector('button[onclick="handleSaveProfileChanges()"]');
    const originalText = saveBtn ? saveBtn.textContent : "Save Profile Changes";
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving...";
    }

    if (useFirebase && db) {
      db.collection('users').doc(uid).set({
        name: customData.name,
        phone: customData.phone,
        company: customData.company,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true })
      .then(() => {
        console.log("🌊 HiddenWave: User profile synced to Firestore.");
        
        // Keep Firebase Auth user display name synchronized
        if (auth.currentUser && auth.currentUser.displayName !== customData.name) {
          auth.currentUser.updateProfile({
            displayName: customData.name
          }).catch(err => console.error("🌊 HiddenWave: Error syncing Auth displayName:", err));
        }

        // Cache changes locally
        localStorage.setItem('hiddenwave_custom_user_details_' + uid, JSON.stringify(customData));
        currentUser.name = customData.name;
        currentUser.phone = customData.phone;
        currentUser.company = customData.company;
        sessionStorage.setItem('hiddenwave_customer_session', JSON.stringify(currentUser));

        updateAuthUI();
        showAuthStatus("Profile details saved successfully!", 'success');
      })
      .catch((err) => {
        console.error("🌊 HiddenWave: Error saving profile to Firestore:", err);
        showAuthStatus("Failed to save changes: " + err.message, 'error');
      })
      .finally(() => {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = originalText;
        }
      });
    } else {
      // Mock mode save
      localStorage.setItem('hiddenwave_custom_user_details_' + uid, JSON.stringify(customData));
      currentUser.name = customData.name;
      currentUser.phone = customData.phone;
      currentUser.company = customData.company;
      sessionStorage.setItem('hiddenwave_customer_session', JSON.stringify(currentUser));
      updateAuthUI();
      showAuthStatus("Profile details saved successfully!", 'success');
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
      }
    }
  };

  // --- 8. Web Showcase Custom Package Calculator ---
  function initWebShowcaseCalculator() {
    const calcRange = document.getElementById('wcalc-range');
    const calcDiscountBadge = document.getElementById('wcalc-discount-badge');
    const calcDiscountVal = document.getElementById('wcalc-discount-val');
    const calcDeliverables = document.getElementById('wcalc-deliverables');
    const cards = document.querySelectorAll('.calc-item-card');
    const selectAllCoresBtn = document.getElementById('calc-select-all-cores');
    const selectAllAddonsBtn = document.getElementById('calc-select-all-addons');
    const calcSubmitBtn = document.getElementById('wcalc-submit');

    if (!calcRange) return; // Only run on web-operations page

    const specs = {
      landing: {
        price: 10000,
        type: 'core',
        deliverables: ['Basic landing page visual layout', 'Mobile responsive design', 'Standard web contact form']
      },
      ecommerce: {
        price: 25000,
        type: 'core',
        deliverables: ['Shopping cart page for customers', 'Online catalog with images', 'Grocery store online storefront setup']
      },
      webapp: {
        price: 35000,
        type: 'core',
        deliverables: ['Custom Client Portal page', 'Private dashboard for users', 'Virtualized customer log tables']
      },
      backend: {
        price: 30000,
        type: 'core',
        deliverables: ['Database setup to store passwords', 'Secure customer login checks', 'Encrypted transaction database logs']
      },
      cms: {
        price: 5000,
        type: 'addon',
        deliverables: ['Admin Control Dashboard panel', 'Inventory management control log']
      },
      payments: {
        price: 5000,
        type: 'addon',
        deliverables: ['Credit card & UPI payment systems integration', 'Automated purchase receipts and invoicing']
      },
      notifications: {
        price: 5000,
        type: 'addon',
        deliverables: ['Browser screen alert messages', 'Automated email notifications to clients']
      },
      chat: {
        price: 5000,
        type: 'addon',
        deliverables: ['Instant messaging bubble on the site']
      },
      analytics: {
        price: 5000,
        type: 'addon',
        deliverables: ['Visitor count graphs & sales charts']
      },
      language: {
        price: 5000,
        type: 'addon',
        deliverables: ['Language translation switcher (Hindi/Telugu/English)']
      }
    };

    cards.forEach(card => {
      card.addEventListener('click', () => {
        card.classList.toggle('active');
        calculateWebEstimate();
      });
    });

    function calculateWebEstimate() {
      let sum = 0;
      let coreCount = 0;
      let selectedDeliverables = [];

      cards.forEach(card => {
        if (card.classList.contains('active')) {
          const id = card.getAttribute('data-id');
          const spec = specs[id];
          if (spec) {
            sum += spec.price;
            if (spec.type === 'core') {
              coreCount++;
            }
            selectedDeliverables = [...selectedDeliverables, ...spec.deliverables];
          }
        }
      });

      let discount = 0;
      if (coreCount === 1) {
        discount = 0.10;
      } else if (coreCount === 2) {
        discount = 0.20;
      } else if (coreCount >= 3) {
        discount = 0.30;
      }

      const discountedSum = Math.round(sum * (1 - discount));
      const upperBound = Math.round(discountedSum * 1.30);

      // Render Price Display
      if (sum === 0) {
        calcRange.textContent = 'No services selected';
        const periodDisplay = calcRange.nextElementSibling;
        if (periodDisplay) periodDisplay.textContent = 'Select options above';
        calcDiscountBadge.style.display = 'none';
      } else {
        calcRange.textContent = `₹${discountedSum.toLocaleString('en-IN')} - ₹${upperBound.toLocaleString('en-IN')}`;
        const periodDisplay = calcRange.nextElementSibling;
        if (periodDisplay) periodDisplay.textContent = 'Based on selected features';

        if (discount > 0) {
          calcDiscountBadge.style.display = 'inline-flex';
          calcDiscountVal.textContent = `${discount * 100}%`;
        } else {
          calcDiscountBadge.style.display = 'none';
        }
      }

      // Render Deliverables
      calcDeliverables.innerHTML = '';
      if (selectedDeliverables.length === 0) {
        calcDeliverables.innerHTML = `<li><span style="color: var(--text-muted);">Please select options above to view deliverables.</span></li>`;
      } else {
        selectedDeliverables.forEach(item => {
          const li = document.createElement('li');
          li.innerHTML = `<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg><span>${item}</span>`;
          calcDeliverables.appendChild(li);
        });
      }
    }

    // Select All Core layers
    if (selectAllCoresBtn) {
      selectAllCoresBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const coreCards = Array.from(cards).filter(c => c.getAttribute('data-type') === 'core');
        const allActive = coreCards.every(c => c.classList.contains('active'));

        coreCards.forEach(c => {
          if (allActive) {
            c.classList.remove('active');
          } else {
            c.classList.add('active');
          }
        });
        calculateWebEstimate();
      });
    }

    // Select All Addons
    if (selectAllAddonsBtn) {
      selectAllAddonsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const addonCards = Array.from(cards).filter(c => c.getAttribute('data-type') === 'addon');
        const allActive = addonCards.every(c => c.classList.contains('active'));

        addonCards.forEach(c => {
          if (allActive) {
            c.classList.remove('active');
          } else {
            c.classList.add('active');
          }
        });
        calculateWebEstimate();
      });
    }

    // Initial load calculation
    calculateWebEstimate();

    // Map selections to main page contact form when clicked
    if (calcSubmitBtn) {
      calcSubmitBtn.addEventListener('click', (e) => {
        let selectedCores = [];
        let selectedAddons = [];
        cards.forEach(card => {
          if (card.classList.contains('active')) {
            const id = card.getAttribute('data-id');
            const type = card.getAttribute('data-type');
            if (type === 'core') selectedCores.push(id);
            else selectedAddons.push(id);
          }
        });

        // Store configuration details in sessionStorage to pre-fill if navigating to main contact form
        const configData = {
          cores: selectedCores,
          addons: selectedAddons,
          formattedRange: calcRange.textContent
        };
        sessionStorage.setItem('hiddenwave_configured_package', JSON.stringify(configData));
      });
    }
  }

  // Initialize Web Showcase Calculator
  initWebShowcaseCalculator();

  // Pre-fill contact form from session storage if a configuration exists
  function checkAndPrefillConfiguredBrief() {
    const contactMessage = document.getElementById('contact-message');
    if (!contactMessage) return; // Only run if contact form is present (index.html)

    const storedConfig = sessionStorage.getItem('hiddenwave_configured_package');
    if (storedConfig) {
      try {
        const config = JSON.parse(storedConfig);
        const coreNames = config.cores.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ');
        const addonNames = config.addons.map(a => a.charAt(0).toUpperCase() + a.slice(1)).join(', ');
        
        let brief = `Configured Package Details:\n`;
        brief += `- Core Layers: ${coreNames || 'None'}\n`;
        brief += `- Add-ons: ${addonNames || 'None'}\n`;
        brief += `- Estimated Cost Range: ${config.formattedRange}\n\n`;
        brief += `Please outline additional customization details here...`;
        
        contactMessage.value = brief;
        
        // Clear item from sessionStorage so it doesn't populate repeatedly
        sessionStorage.removeItem('hiddenwave_configured_package');
      } catch (err) {
        console.error("Error parsing configured package data:", err);
      }
    }
  }
  checkAndPrefillConfiguredBrief();
});
