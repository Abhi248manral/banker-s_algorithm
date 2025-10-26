// Main Application Logic

(function() {
  'use strict';

  // Global state
  let banker = new BankerAlgorithm();
  let currentPage = 'hero';
  let currentTab = 'matrices';
  let isLoggedIn = false;
  let userEmail = '';
  let draggedModal = null;
  let dragOffset = { x: 0, y: 0 };

  // Initialize application
  function init() {
    // Check authentication first
    checkAuth();
    
    if (!isLoggedIn) {
      showLoginPage();
      return;
    }
    
    loadPreferences();
    setupNavigation();
    setupSettings();
    setupSimulator();
    setupBanking();
    setupParticles();
    setupModals();
    setupAuth();
    
    // Check for URL state
    const urlState = storage.parseURLState();
    if (urlState) {
      loadStateFromURL(urlState);
      navigateToPage('simulator');
    } else {
      // Load last saved state or initialize default
      const savedState = storage.loadCurrentState();
      if (savedState) {
        banker.initialize(savedState.processes, savedState.resources);
        banker.available = savedState.available;
        banker.max = savedState.max;
        banker.allocation = savedState.allocation;
        banker.need = savedState.need;
        generateMatrices();
      } else {
        // Initialize with default values
        banker.initialize(5, 3);
        generateMatrices();
      }
    }

    // Update scroll progress
    window.addEventListener('scroll', updateScrollProgress);
  }

  // Check authentication
  function checkAuth() {
    const authData = window._appStorage?.auth;
    if (authData && authData.isLoggedIn) {
      isLoggedIn = true;
      userEmail = authData.userEmail;
    }
  }

  // Show login page
  function showLoginPage() {
    document.getElementById('login-page').classList.add('active');
    document.getElementById('hero-page').classList.remove('active');
    setupLoginForm();
  }

  // Setup login form
  function setupLoginForm() {
    const form = document.getElementById('login-form');
    const passwordToggle = document.getElementById('password-toggle');
    const passwordInput = document.getElementById('login-password');
    const signInBtn = document.getElementById('sign-in-btn');
    
    // Password toggle
    passwordToggle.addEventListener('click', () => {
      const type = passwordInput.type === 'password' ? 'text' : 'password';
      passwordInput.type = type;
      passwordToggle.textContent = type === 'password' ? '👁' : '👁️';
    });
    
    // Form submit
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      const rememberMe = document.getElementById('remember-me').checked;
      
      // Basic validation
      if (!email || !password) {
        showToast('Please fill in all fields', 'error');
        return;
      }
      
      if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
      }
      
      // Show loading
      signInBtn.classList.add('loading');
      signInBtn.disabled = true;
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Store auth
      if (!window._appStorage) window._appStorage = {};
      window._appStorage.auth = {
        isLoggedIn: true,
        userEmail: email,
        loginTime: Date.now(),
        rememberMe: rememberMe
      };
      
      isLoggedIn = true;
      userEmail = email;
      
      // Hide loading
      signInBtn.classList.remove('loading');
      signInBtn.disabled = false;
      
      // Redirect to home
      document.getElementById('login-page').classList.remove('active');
      document.getElementById('hero-page').classList.add('active');
      
      // Initialize app
      loadPreferences();
      setupNavigation();
      setupSettings();
      setupSimulator();
      setupBanking();
      setupParticles();
      setupModals();
      setupAuth();
      
      showToast(`Welcome back, ${email}!`, 'success');
      updateUserUI();
    });
    
    // OAuth buttons (demo only)
    document.querySelectorAll('.btn-oauth').forEach(btn => {
      btn.addEventListener('click', () => {
        showToast('OAuth demo - use email/password login', 'error');
      });
    });
  }

  // Setup auth UI
  function setupAuth() {
    updateUserUI();
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn.addEventListener('click', logout);
  }

  // Update user UI
  function updateUserUI() {
    const userEmailEl = document.getElementById('user-email');
    const logoutBtn = document.getElementById('logout-btn');
    const welcomeMsg = document.getElementById('welcome-message');
    
    if (isLoggedIn) {
      userEmailEl.textContent = userEmail;
      userEmailEl.style.display = 'inline';
      logoutBtn.style.display = 'inline-flex';
      
      if (welcomeMsg) {
        welcomeMsg.textContent = `Welcome back, ${userEmail}!`;
        welcomeMsg.style.display = 'block';
      }
    }
  }

  // Logout
  function logout() {
    if (!window._appStorage) window._appStorage = {};
    window._appStorage.auth = {
      isLoggedIn: false,
      userEmail: '',
      loginTime: 0
    };
    
    isLoggedIn = false;
    userEmail = '';
    
    // Redirect to login
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('login-page').classList.add('active');
    
    // Hide user UI
    document.getElementById('user-email').style.display = 'none';
    document.getElementById('logout-btn').style.display = 'none';
    
    // Clear form
    document.getElementById('login-form').reset();
    
    showToast('Logged out successfully', 'success');
  }

  // Setup modals
  function setupModals() {
    // Move content to modals
    moveContentToModals();
    
    // Modal triggers
    document.querySelectorAll('[data-modal]').forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        const modalName = trigger.dataset.modal;
        openModal(modalName);
      });
    });
    
    // Close buttons
    document.querySelectorAll('.close-modal-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal-backdrop');
        closeModal(modal);
      });
    });
    
    // Minimize buttons
    document.querySelectorAll('.minimize-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal-backdrop');
        minimizeModal(modal);
      });
    });
    
    // Backdrop click to close
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          closeModal(backdrop);
        }
      });
    });
    
    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal-backdrop[style*="display: flex"]');
        if (openModal) closeModal(openModal);
      }
    });
    
    // Setup dragging
    setupModalDrag();
  }

  // Move content to modals
  function moveContentToModals() {
    // Theory content
    const theoryPage = document.getElementById('theory-page');
    const theoryModalContent = document.getElementById('theory-modal-content');
    if (theoryPage && theoryModalContent) {
      const content = theoryPage.querySelector('.page-container');
      if (content) {
        theoryModalContent.appendChild(content.cloneNode(true));
      }
    }
    
    // Simulator content
    const simulatorPage = document.getElementById('simulator-page');
    const simulatorModalContent = document.getElementById('simulator-modal-content');
    if (simulatorPage && simulatorModalContent) {
      const content = simulatorPage.querySelector('.page-container');
      if (content) {
        simulatorModalContent.appendChild(content.cloneNode(true));
      }
    }
    
    // Banking content
    const bankingPage = document.getElementById('banking-page');
    const bankingModalContent = document.getElementById('banking-modal-content');
    if (bankingPage && bankingModalContent) {
      const content = bankingPage.querySelector('.page-container');
      if (content) {
        bankingModalContent.appendChild(content.cloneNode(true));
      }
    }
    
    // Re-setup event listeners for modal content
    setupModalEventListeners();
  }

  // Setup event listeners for modal content
  function setupModalEventListeners() {
    // Simulator modal listeners
    const simModal = document.getElementById('simulator-modal');
    if (simModal) {
      // Generate matrices button
      const genBtn = simModal.querySelector('#generate-matrices');
      if (genBtn && !genBtn.dataset.listenerAdded) {
        genBtn.dataset.listenerAdded = 'true';
        genBtn.addEventListener('click', () => {
          const p = parseInt(simModal.querySelector('#num-processes').value);
          const r = parseInt(simModal.querySelector('#num-resources').value);
          banker.initialize(p, r);
          generateMatricesInModal(simModal);
          showToast('Matrices generated', 'success');
        });
      }
      
      // Safety check button
      const safetyBtn = simModal.querySelector('#run-safety-check');
      if (safetyBtn && !safetyBtn.dataset.listenerAdded) {
        safetyBtn.dataset.listenerAdded = 'true';
        safetyBtn.addEventListener('click', () => runSafetyCheckInModal(simModal));
      }
      
      // Request simulation button
      const reqBtn = simModal.querySelector('#simulate-request');
      if (reqBtn && !reqBtn.dataset.listenerAdded) {
        reqBtn.dataset.listenerAdded = 'true';
        reqBtn.addEventListener('click', () => simulateRequestInModal(simModal));
      }
      
      // Tab buttons
      simModal.querySelectorAll('.tab-btn').forEach(btn => {
        if (!btn.dataset.listenerAdded) {
          btn.dataset.listenerAdded = 'true';
          btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTabInModal(simModal, tab);
          });
        }
      });
      
      // Preset buttons
      simModal.querySelectorAll('[data-preset]').forEach(btn => {
        if (!btn.dataset.listenerAdded) {
          btn.dataset.listenerAdded = 'true';
          btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.preset);
            loadPreset(index);
            generateMatricesInModal(simModal);
          });
        }
      });
    }
    
    // Banking modal listeners
    const bankModal = document.getElementById('banking-modal');
    if (bankModal) {
      const processBtn = bankModal.querySelector('#process-loan');
      if (processBtn && !processBtn.dataset.listenerAdded) {
        processBtn.dataset.listenerAdded = 'true';
        processBtn.addEventListener('click', () => processLoanInModal(bankModal));
      }
      
      const loadDemoBtn = bankModal.querySelector('#load-banking-demo');
      if (loadDemoBtn && !loadDemoBtn.dataset.listenerAdded) {
        loadDemoBtn.dataset.listenerAdded = 'true';
        loadDemoBtn.addEventListener('click', () => {
          loadPreset(2);
          displayBankingMatricesInModal(bankModal);
        });
      }
    }
  }

  // Generate matrices in modal
  function generateMatricesInModal(modal) {
    const container = modal.querySelector('#matrices-display');
    if (!container) return;
    
    container.innerHTML = '';

    // Available vector
    const availableSection = createMatrixSection(
      i18n.t('available'),
      'available',
      1,
      banker.resources,
      [banker.available]
    );
    container.appendChild(availableSection);

    // Max matrix
    const maxSection = createMatrixSection(
      i18n.t('max'),
      'max',
      banker.processes,
      banker.resources,
      banker.max
    );
    container.appendChild(maxSection);

    // Allocation matrix
    const allocationSection = createMatrixSection(
      i18n.t('allocation'),
      'allocation',
      banker.processes,
      banker.resources,
      banker.allocation
    );
    container.appendChild(allocationSection);

    // Need matrix (read-only)
    banker.calculateAllNeeds();
    const needSection = createMatrixSection(
      i18n.t('need'),
      'need',
      banker.processes,
      banker.resources,
      banker.need,
      true
    );
    container.appendChild(needSection);

    // Update process selectors
    updateProcessSelectorsInModal(modal);
  }

  // Update process selectors in modal
  function updateProcessSelectorsInModal(modal) {
    const select = modal.querySelector('#request-process');
    if (!select) return;
    
    select.innerHTML = '';
    for (let i = 0; i < banker.processes; i++) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = `${i18n.t('process')} P${i}`;
      select.appendChild(option);
    }
    updateRequestFormInModal(modal);
  }

  // Update request form in modal
  function updateRequestFormInModal(modal) {
    const container = modal.querySelector('#request-inputs');
    if (!container) return;
    
    container.innerHTML = '';

    for (let j = 0; j < banker.resources; j++) {
      const div = document.createElement('div');
      div.className = 'form-group';

      const label = document.createElement('label');
      label.textContent = `${i18n.t('resource')} R${j}:`;
      div.appendChild(label);

      const input = document.createElement('input');
      input.type = 'number';
      input.min = '0';
      input.value = '0';
      input.className = 'form-control';
      input.dataset.resource = j;
      div.appendChild(input);

      container.appendChild(div);
    }
  }

  // Switch tab in modal
  function switchTabInModal(modal, tab) {
    modal.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    modal.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `${tab}-tab`);
    });

    if (tab === 'request') {
      updateRequestFormInModal(modal);
    }
  }

  // Run safety check in modal
  function runSafetyCheckInModal(modal) {
    const stepByStep = modal.querySelector('#step-by-step')?.checked || false;
    const result = banker.checkSafety(stepByStep);

    const vizContainer = modal.querySelector('#safety-viz');
    const resultPanel = modal.querySelector('#safety-result');

    if (stepByStep && result.steps) {
      displaySteps(vizContainer, result.steps);
    } else {
      vizContainer.innerHTML = '<div class="viz-placeholder">Running algorithm...</div>';
    }

    displayResult(resultPanel, result);

    if (result.isSafe) {
      showConfetti();
      showToast(i18n.t('system_safe'), 'success');
    } else {
      showToast(i18n.t('system_unsafe'), 'error');
    }
  }

  // Simulate request in modal
  function simulateRequestInModal(modal) {
    const processIndex = parseInt(modal.querySelector('#request-process')?.value || 0);
    const request = [];
    
    modal.querySelectorAll('#request-inputs input').forEach(input => {
      request.push(parseInt(input.value) || 0);
    });

    const testBanker = banker.clone();
    const result = testBanker.requestResources(processIndex, request);

    const resultContainer = modal.querySelector('#request-result');
    if (!resultContainer) return;
    
    resultContainer.style.display = 'block';
    resultContainer.className = 'result-panel ' + (result.approved ? 'safe' : 'unsafe');

    let html = `
      <div class="result-title">${result.approved ? i18n.t('request_approved') : i18n.t('request_denied')}</div>
      <p><strong>${i18n.t('process')} P${processIndex}</strong> ${i18n.t('request_vector')}: [${request.join(', ')}]</p>
      <p>${i18n.t(result.reason)}</p>
    `;

    if (result.approved) {
      html += `<p><strong>${i18n.t('safe_sequence')}:</strong> P${result.safeSequence.join(' → P')}</p>`;
      html += `<button class="btn btn-primary" id="commit-request-modal">Commit Allocation</button>`;
    }

    resultContainer.innerHTML = html;

    if (result.approved) {
      const commitBtn = modal.querySelector('#commit-request-modal');
      if (commitBtn) {
        commitBtn.addEventListener('click', () => {
          banker.requestResources(processIndex, request);
          generateMatricesInModal(modal);
          showToast('Request committed', 'success');
          storage.saveCurrentState(banker);
        });
      }
    }

    showToast(result.approved ? i18n.t('request_approved') : i18n.t('request_denied'), result.approved ? 'success' : 'error');
  }

  // Display banking matrices in modal
  function displayBankingMatricesInModal(modal) {
    const container = modal.querySelector('#banking-matrices');
    if (!container) return;
    
    container.innerHTML = '';

    const loanTypes = ['Home Loan', 'Auto Loan', 'Personal Loan'];

    // Bank liquidity
    const liquidityDiv = document.createElement('div');
    liquidityDiv.style.cssText = 'padding: 1rem; background: var(--bg-primary); border-radius: 8px; margin-bottom: 1rem;';
    liquidityDiv.innerHTML = `<h4>Bank Liquidity</h4>`;
    loanTypes.forEach((type, i) => {
      liquidityDiv.innerHTML += `<p><strong>${type}:</strong> $${banker.available[i]?.toLocaleString() || 0}</p>`;
    });
    container.appendChild(liquidityDiv);

    // Customer portfolios
    for (let i = 0; i < banker.processes; i++) {
      const customerDiv = document.createElement('div');
      customerDiv.style.cssText = 'padding: 1rem; background: var(--bg-primary); border: 1px solid var(--border); border-radius: 8px; margin-bottom: 1rem;';
      
      customerDiv.innerHTML = `
        <h4>Customer ${i + 1}</h4>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <th>Loan Type</th>
            <th>Max Credit</th>
            <th>Current</th>
            <th>Available</th>
          </tr>
          ${loanTypes.map((type, j) => `
            <tr>
              <td>${type}</td>
              <td>$${banker.max[i]?.[j]?.toLocaleString() || 0}</td>
              <td>$${banker.allocation[i]?.[j]?.toLocaleString() || 0}</td>
              <td>$${banker.need[i]?.[j]?.toLocaleString() || 0}</td>
            </tr>
          `).join('')}
        </table>
      `;
      container.appendChild(customerDiv);
    }
  }

  // Process loan in modal
  function processLoanInModal(modal) {
    const customerIndex = parseInt(modal.querySelector('#banking-customer')?.value || 0);
    const request = [];
    
    modal.querySelectorAll('.loan-input').forEach(input => {
      request.push(parseInt(input.value) || 0);
    });

    const testBanker = banker.clone();
    const result = testBanker.requestResources(customerIndex, request);

    const resultContainer = modal.querySelector('#loan-result');
    if (!resultContainer) return;
    
    resultContainer.style.display = 'block';
    resultContainer.className = 'result-panel ' + (result.approved ? 'safe' : 'unsafe');

    const loanTypes = ['Home', 'Auto', 'Personal'];
    const requestStr = request.map((val, i) => `${loanTypes[i]}: $${val.toLocaleString()}`).join(', ');

    resultContainer.innerHTML = `
      <div class="result-title">${result.approved ? '✓ Loan APPROVED' : '✗ Loan DENIED'}</div>
      <p><strong>Customer ${customerIndex + 1}</strong> requesting: ${requestStr}</p>
      <p>${result.message}</p>
      ${result.approved ? `<p><strong>Safe processing order:</strong> Customer ${result.safeSequence.map(i => i + 1).join(' → ')}</p>` : ''}
    `;

    if (result.approved) {
      banker.requestResources(customerIndex, request);
      displayBankingMatricesInModal(modal);
      showConfetti();
      showToast('Loan approved!', 'success');
    } else {
      showToast('Loan denied', 'error');
    }
  }

  // Open modal
  function openModal(modalName) {
    const modal = document.getElementById(`${modalName}-modal`);
    if (modal) {
      modal.style.display = 'flex';
      modal.setAttribute('aria-hidden', 'false');
      
      // Initialize modal content if needed
      if (modalName === 'simulator') {
        generateMatricesInModal(modal);
      } else if (modalName === 'banking') {
        if (banker.processes === 0) loadPreset(2);
        displayBankingMatricesInModal(modal);
      }
    }
  }

  // Close modal
  function closeModal(modal) {
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
  }

  // Minimize modal
  function minimizeModal(modal) {
    modal.style.display = 'none';
    showToast('Modal minimized', 'success');
  }

  // Setup modal drag
  function setupModalDrag() {
    document.querySelectorAll('.modal-window-header').forEach(header => {
      header.addEventListener('mousedown', startDrag);
    });
    
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
  }

  function startDrag(e) {
    if (e.target.classList.contains('modal-control-btn')) return;
    
    draggedModal = e.target.closest('.modal-window');
    if (!draggedModal) return;
    
    const rect = draggedModal.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    
    draggedModal.style.position = 'fixed';
    draggedModal.style.margin = '0';
  }

  function drag(e) {
    if (!draggedModal) return;
    
    e.preventDefault();
    
    let left = e.clientX - dragOffset.x;
    let top = e.clientY - dragOffset.y;
    
    // Boundary checks
    const maxX = window.innerWidth - draggedModal.offsetWidth;
    const maxY = window.innerHeight - draggedModal.offsetHeight;
    
    left = Math.max(0, Math.min(left, maxX));
    top = Math.max(0, Math.min(top, maxY));
    
    draggedModal.style.left = left + 'px';
    draggedModal.style.top = top + 'px';
  }

  function stopDrag() {
    draggedModal = null;
  }

  // Load and apply user preferences
  function loadPreferences() {
    const prefs = storage.loadPreferences();
    
    // Apply theme
    document.documentElement.setAttribute('data-theme', prefs.theme);
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === prefs.theme);
    });

    // Apply language
    i18n.setLanguage(prefs.language);
    document.getElementById('language-select').value = prefs.language;
    document.getElementById('setting-language').value = prefs.language;

    // Apply reduce motion
    if (prefs.reduceMotion) {
      document.body.classList.add('reduce-motion');
      document.getElementById('reduce-motion-toggle').checked = true;
    }

    // Apply low-spec mode
    if (prefs.lowSpecMode) {
      document.body.classList.add('low-spec');
      document.getElementById('low-spec-toggle').checked = true;
    }

    // Apply font size
    document.body.className = document.body.className.replace(/font-\w+/g, '');
    document.body.classList.add(`font-${prefs.fontSize}`);
    document.getElementById('font-size-select').value = prefs.fontSize;
  }

  // Setup navigation
  function setupNavigation() {
    // Nav buttons
    document.querySelectorAll('[data-page]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const page = btn.dataset.page;
        navigateToPage(page);
      });
    });

    // Theme toggle
    document.getElementById('theme-toggle').addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const themes = ['light', 'dark', 'high-contrast'];
      const currentIndex = themes.indexOf(currentTheme);
      const nextTheme = themes[(currentIndex + 1) % themes.length];
      setTheme(nextTheme);
    });

    // Language selector
    document.getElementById('language-select').addEventListener('change', (e) => {
      i18n.setLanguage(e.target.value);
      savePreferences();
    });
  }

  // Navigate to page
  function navigateToPage(page) {
    if (!isLoggedIn && page !== 'login') {
      showLoginPage();
      return;
    }
    
    currentPage = page;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`${page}-page`)?.classList.add('active');
    window.scrollTo(0, 0);
  }

  // Setup settings modal
  function setupSettings() {
    const modal = document.getElementById('settings-modal');
    const openBtn = document.getElementById('settings-btn');
    const closeBtn = document.getElementById('close-settings');
    const overlay = document.getElementById('settings-overlay');
    const saveBtn = document.getElementById('save-settings');

    openBtn.addEventListener('click', () => {
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
    });

    const closeModal = () => {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
    };

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);

    // Theme buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        setTheme(btn.dataset.theme);
      });
    });

    // Language selector in settings
    document.getElementById('setting-language').addEventListener('change', (e) => {
      i18n.setLanguage(e.target.value);
      document.getElementById('language-select').value = e.target.value;
    });

    // Reduce motion toggle
    document.getElementById('reduce-motion-toggle').addEventListener('change', (e) => {
      document.body.classList.toggle('reduce-motion', e.target.checked);
    });

    // Low-spec mode toggle
    document.getElementById('low-spec-toggle').addEventListener('change', (e) => {
      document.body.classList.toggle('low-spec', e.target.checked);
      if (e.target.checked) {
        clearParticles();
      } else {
        setupParticles();
      }
    });

    // Font size selector
    document.getElementById('font-size-select').addEventListener('change', (e) => {
      document.body.className = document.body.className.replace(/font-\w+/g, '');
      document.body.classList.add(`font-${e.target.value}`);
    });

    // Save settings
    saveBtn.addEventListener('click', () => {
      savePreferences();
      showToast(i18n.t('settings') + ' ' + i18n.t('save_settings'), 'success');
      closeModal();
    });
  }

  // Set theme
  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === theme);
    });
  }

  // Save preferences
  function savePreferences() {
    const prefs = {
      theme: document.documentElement.getAttribute('data-theme'),
      language: i18n.currentLang,
      reduceMotion: document.getElementById('reduce-motion-toggle').checked,
      lowSpecMode: document.getElementById('low-spec-toggle').checked,
      fontSize: document.getElementById('font-size-select').value
    };
    storage.savePreferences(prefs);
  }

  // Setup simulator
  function setupSimulator() {
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        switchTab(tab);
      });
    });

    // Matrix controls
    document.getElementById('generate-matrices').addEventListener('click', () => {
      const p = parseInt(document.getElementById('num-processes').value);
      const r = parseInt(document.getElementById('num-resources').value);
      banker.initialize(p, r);
      generateMatrices();
      showToast('Matrices generated', 'success');
    });

    // Preset buttons
    document.querySelectorAll('[data-preset]').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.preset);
        loadPreset(index);
      });
    });

    // Export/Import
    document.getElementById('export-json').addEventListener('click', exportJSON);
    document.getElementById('export-csv').addEventListener('click', exportCSV);
    document.getElementById('import-json').addEventListener('click', () => {
      document.getElementById('file-input').click();
    });
    document.getElementById('file-input').addEventListener('change', importJSON);

    // Safety check
    document.getElementById('run-safety-check').addEventListener('click', runSafetyCheck);

    // Request simulation
    document.getElementById('simulate-request').addEventListener('click', simulateRequest);
  }

  // Switch tab
  function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `${tab}-tab`);
    });

    if (tab === 'request') {
      updateRequestForm();
    }
  }

  // Generate matrices UI
  function generateMatrices() {
    const container = document.getElementById('matrices-display');
    container.innerHTML = '';

    // Available vector
    const availableSection = createMatrixSection(
      i18n.t('available'),
      'available',
      1,
      banker.resources,
      [banker.available]
    );
    container.appendChild(availableSection);

    // Max matrix
    const maxSection = createMatrixSection(
      i18n.t('max'),
      'max',
      banker.processes,
      banker.resources,
      banker.max
    );
    container.appendChild(maxSection);

    // Allocation matrix
    const allocationSection = createMatrixSection(
      i18n.t('allocation'),
      'allocation',
      banker.processes,
      banker.resources,
      banker.allocation
    );
    container.appendChild(allocationSection);

    // Need matrix (read-only)
    banker.calculateAllNeeds();
    const needSection = createMatrixSection(
      i18n.t('need'),
      'need',
      banker.processes,
      banker.resources,
      banker.need,
      true
    );
    container.appendChild(needSection);

    // Update process selectors
    updateProcessSelectors();
  }

  // Create matrix section
  function createMatrixSection(title, id, rows, cols, data, readOnly = false) {
    const section = document.createElement('div');
    section.className = 'matrix-section';

    const heading = document.createElement('h3');
    heading.textContent = title;
    section.appendChild(heading);

    const table = document.createElement('table');
    table.className = 'matrix-table';

    // Header row
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const emptyTh = document.createElement('th');
    headerRow.appendChild(emptyTh);
    for (let j = 0; j < cols; j++) {
      const th = document.createElement('th');
      th.textContent = `R${j}`;
      headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body rows
    const tbody = document.createElement('tbody');
    for (let i = 0; i < rows; i++) {
      const row = document.createElement('tr');
      const labelTd = document.createElement('td');
      labelTd.textContent = rows > 1 ? `P${i}` : '';
      labelTd.style.fontWeight = '600';
      row.appendChild(labelTd);

      for (let j = 0; j < cols; j++) {
        const td = document.createElement('td');
        const input = document.createElement('input');
        input.type = 'number';
        input.min = '0';
        input.value = data[i][j];
        input.readOnly = readOnly;
        input.dataset.row = i;
        input.dataset.col = j;
        input.dataset.matrix = id;

        if (!readOnly) {
          input.addEventListener('change', (e) => {
            handleMatrixChange(e.target);
          });
        }

        td.appendChild(input);
        row.appendChild(td);
      }
      tbody.appendChild(row);
    }
    table.appendChild(tbody);
    section.appendChild(table);

    return section;
  }

  // Handle matrix input change
  function handleMatrixChange(input) {
    const matrix = input.dataset.matrix;
    const row = parseInt(input.dataset.row);
    const col = parseInt(input.dataset.col);
    const value = parseInt(input.value) || 0;

    if (matrix === 'available') {
      banker.available[col] = value;
    } else if (matrix === 'max') {
      banker.max[row][col] = value;
      banker.calculateNeed(row);
      updateNeedMatrix();
    } else if (matrix === 'allocation') {
      banker.allocation[row][col] = value;
      banker.calculateNeed(row);
      updateNeedMatrix();
    }

    storage.saveCurrentState(banker);
  }

  // Update need matrix display
  function updateNeedMatrix() {
    document.querySelectorAll('[data-matrix="need"]').forEach(input => {
      const row = parseInt(input.dataset.row);
      const col = parseInt(input.dataset.col);
      input.value = banker.need[row][col];
    });
  }

  // Update process selectors
  function updateProcessSelectors() {
    const select = document.getElementById('request-process');
    select.innerHTML = '';
    for (let i = 0; i < banker.processes; i++) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = `${i18n.t('process')} P${i}`;
      select.appendChild(option);
    }
    updateRequestForm();
  }

  // Update request form
  function updateRequestForm() {
    const container = document.getElementById('request-inputs');
    container.innerHTML = '';

    for (let j = 0; j < banker.resources; j++) {
      const div = document.createElement('div');
      div.className = 'form-group';

      const label = document.createElement('label');
      label.textContent = `${i18n.t('resource')} R${j}:`;
      div.appendChild(label);

      const input = document.createElement('input');
      input.type = 'number';
      input.min = '0';
      input.value = '0';
      input.className = 'form-control';
      input.dataset.resource = j;
      div.appendChild(input);

      container.appendChild(div);
    }
  }

  // Load preset
  function loadPreset(index) {
    const preset = demoScenarios[index];
    banker.initialize(preset.processes, preset.resources);
    banker.available = [...preset.available];
    banker.max = preset.max.map(row => [...row]);
    banker.allocation = preset.allocation.map(row => [...row]);
    banker.calculateAllNeeds();
    generateMatrices();
    showToast(`Loaded: ${preset.name}`, 'success');
    storage.saveCurrentState(banker);
  }

  // Export JSON
  function exportJSON() {
    const json = banker.exportJSON();
    downloadFile('banker-state.json', json, 'application/json');
    showToast('Exported as JSON', 'success');
  }

  // Export CSV
  function exportCSV() {
    const csv = banker.exportCSV();
    downloadFile('banker-state.csv', csv, 'text/csv');
    showToast('Exported as CSV', 'success');
  }

  // Import JSON
  function importJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (banker.importJSON(event.target.result)) {
        generateMatrices();
        showToast('Imported successfully', 'success');
        storage.saveCurrentState(banker);
      } else {
        showToast('Import failed', 'error');
      }
    };
    reader.readAsText(file);
  }

  // Download file helper
  function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Run safety check
  function runSafetyCheck() {
    const stepByStep = document.getElementById('step-by-step').checked;
    const result = banker.checkSafety(stepByStep);

    const vizContainer = document.getElementById('safety-viz');
    const resultPanel = document.getElementById('safety-result');

    if (stepByStep && result.steps) {
      displaySteps(vizContainer, result.steps);
    } else {
      vizContainer.innerHTML = '<div class="viz-placeholder">Running algorithm...</div>';
    }

    displayResult(resultPanel, result);

    if (result.isSafe) {
      showConfetti();
      showToast(i18n.t('system_safe'), 'success');
    } else {
      showToast(i18n.t('system_unsafe'), 'error');
    }
  }

  // Display algorithm steps
  function displaySteps(container, steps) {
    container.innerHTML = '';
    
    steps.forEach((step, index) => {
      setTimeout(() => {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'algorithm-step';
        stepDiv.style.cssText = 'padding: 1rem; margin: 0.5rem 0; background: var(--bg-primary); border-left: 3px solid var(--accent); border-radius: 4px;';

        const stepTitle = document.createElement('h4');
        stepTitle.textContent = `Step ${step.step}`;
        stepTitle.style.marginBottom = '0.5rem';
        stepDiv.appendChild(stepTitle);

        const stepDesc = document.createElement('p');
        stepDesc.textContent = step.description;
        stepDiv.appendChild(stepDesc);

        if (step.processIndex !== undefined) {
          const workText = document.createElement('p');
          workText.textContent = `${i18n.t('work')}: [${step.work.join(', ')}]`;
          workText.style.fontFamily = 'var(--font-mono)';
          stepDiv.appendChild(workText);
        }

        container.appendChild(stepDiv);
        container.scrollTop = container.scrollHeight;
      }, index * 500);
    });
  }

  // Display result
  function displayResult(container, result) {
    container.style.display = 'block';
    container.className = 'result-panel ' + (result.isSafe ? 'safe' : 'unsafe');
    
    container.innerHTML = `
      <div class="result-title">${result.isSafe ? i18n.t('system_safe') : i18n.t('system_unsafe')}</div>
      ${result.isSafe ? `<p><strong>${i18n.t('safe_sequence')}:</strong> P${result.safeSequence.join(' → P')}</p>` : `<p>${i18n.t('deadlock_warning')}</p>`}
    `;
  }

  // Simulate request
  function simulateRequest() {
    const processIndex = parseInt(document.getElementById('request-process').value);
    const request = [];
    
    document.querySelectorAll('#request-inputs input').forEach(input => {
      request.push(parseInt(input.value) || 0);
    });

    // Clone banker to test without modifying original
    const testBanker = banker.clone();
    const result = testBanker.requestResources(processIndex, request);

    const resultContainer = document.getElementById('request-result');
    resultContainer.style.display = 'block';
    resultContainer.className = 'result-panel ' + (result.approved ? 'safe' : 'unsafe');

    let html = `
      <div class="result-title">${result.approved ? i18n.t('request_approved') : i18n.t('request_denied')}</div>
      <p><strong>${i18n.t('process')} P${processIndex}</strong> ${i18n.t('request_vector')}: [${request.join(', ')}]</p>
      <p>${i18n.t(result.reason)}</p>
    `;

    if (result.approved) {
      html += `<p><strong>${i18n.t('safe_sequence')}:</strong> P${result.safeSequence.join(' → P')}</p>`;
      html += `<button class="btn btn-primary" id="commit-request">Commit Allocation</button>`;
    }

    resultContainer.innerHTML = html;

    if (result.approved) {
      document.getElementById('commit-request').addEventListener('click', () => {
        banker.requestResources(processIndex, request);
        generateMatrices();
        showToast('Request committed', 'success');
        storage.saveCurrentState(banker);
      });
    }

    showToast(result.approved ? i18n.t('request_approved') : i18n.t('request_denied'), result.approved ? 'success' : 'error');
  }

  // Setup banking page
  function setupBanking() {
    document.getElementById('load-banking-demo').addEventListener('click', () => {
      loadPreset(2);
      displayBankingMatrices();
    });

    document.getElementById('process-loan').addEventListener('click', processLoan);
    
    // Initialize with demo data
    if (banker.processes === 0) {
      loadPreset(2);
    }
    displayBankingMatrices();
  }

  // Display banking matrices
  function displayBankingMatrices() {
    const container = document.getElementById('banking-matrices');
    container.innerHTML = '';

    const loanTypes = ['Home Loan', 'Auto Loan', 'Personal Loan'];

    // Bank liquidity
    const liquidityDiv = document.createElement('div');
    liquidityDiv.style.cssText = 'padding: 1rem; background: var(--bg-primary); border-radius: 8px; margin-bottom: 1rem;';
    liquidityDiv.innerHTML = `<h4>Bank Liquidity</h4>`;
    loanTypes.forEach((type, i) => {
      liquidityDiv.innerHTML += `<p><strong>${type}:</strong> $${banker.available[i]?.toLocaleString() || 0}</p>`;
    });
    container.appendChild(liquidityDiv);

    // Customer portfolios
    for (let i = 0; i < banker.processes; i++) {
      const customerDiv = document.createElement('div');
      customerDiv.style.cssText = 'padding: 1rem; background: var(--bg-primary); border: 1px solid var(--border); border-radius: 8px; margin-bottom: 1rem;';
      
      customerDiv.innerHTML = `
        <h4>Customer ${i + 1}</h4>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <th>Loan Type</th>
            <th>Max Credit</th>
            <th>Current</th>
            <th>Available</th>
          </tr>
          ${loanTypes.map((type, j) => `
            <tr>
              <td>${type}</td>
              <td>$${banker.max[i]?.[j]?.toLocaleString() || 0}</td>
              <td>$${banker.allocation[i]?.[j]?.toLocaleString() || 0}</td>
              <td>$${banker.need[i]?.[j]?.toLocaleString() || 0}</td>
            </tr>
          `).join('')}
        </table>
      `;
      container.appendChild(customerDiv);
    }
  }

  // Process loan request
  function processLoan() {
    const customerIndex = parseInt(document.getElementById('banking-customer').value);
    const request = [];
    
    document.querySelectorAll('.loan-input').forEach(input => {
      request.push(parseInt(input.value) || 0);
    });

    const testBanker = banker.clone();
    const result = testBanker.requestResources(customerIndex, request);

    const resultContainer = document.getElementById('loan-result');
    resultContainer.style.display = 'block';
    resultContainer.className = 'result-panel ' + (result.approved ? 'safe' : 'unsafe');

    const loanTypes = ['Home', 'Auto', 'Personal'];
    const requestStr = request.map((val, i) => `${loanTypes[i]}: $${val.toLocaleString()}`).join(', ');

    resultContainer.innerHTML = `
      <div class="result-title">${result.approved ? '✓ Loan APPROVED' : '✗ Loan DENIED'}</div>
      <p><strong>Customer ${customerIndex + 1}</strong> requesting: ${requestStr}</p>
      <p>${result.message}</p>
      ${result.approved ? `<p><strong>Safe processing order:</strong> Customer ${result.safeSequence.map(i => i + 1).join(' → ')}</p>` : ''}
    `;

    if (result.approved) {
      banker.requestResources(customerIndex, request);
      displayBankingMatrices();
      showConfetti();
      showToast('Loan approved!', 'success');
    } else {
      showToast('Loan denied', 'error');
    }
  }

  // Setup particles background
  function setupParticles() {
    if (document.body.classList.contains('low-spec')) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const particlesEl = document.getElementById('particles');
    if (!particlesEl) return;

    const numParticles = 30;
    particlesEl.innerHTML = '';

    for (let i = 0; i < numParticles; i++) {
      const particle = document.createElement('div');
      particle.style.cssText = `
        position: absolute;
        width: 2px;
        height: 2px;
        background: var(--accent);
        border-radius: 50%;
        opacity: ${Math.random() * 0.5 + 0.2};
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        animation: float ${Math.random() * 10 + 10}s infinite ease-in-out;
      `;
      particlesEl.appendChild(particle);
    }

    // Add animation keyframes if not exists
    if (!document.getElementById('particle-animation')) {
      const style = document.createElement('style');
      style.id = 'particle-animation';
      style.textContent = `
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Clear particles
  function clearParticles() {
    const particlesEl = document.getElementById('particles');
    if (particlesEl) particlesEl.innerHTML = '';
  }

  // Show confetti animation
  function showConfetti() {
    if (document.body.classList.contains('reduce-motion')) return;

    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const confetti = [];
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    for (let i = 0; i < 100; i++) {
      confetti.push({
        x: Math.random() * canvas.width,
        y: -10,
        size: Math.random() * 5 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        velocity: Math.random() * 3 + 2,
        wobble: Math.random() * 2 - 1
      });
    }

    let frameCount = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      confetti.forEach((c, index) => {
        c.y += c.velocity;
        c.x += c.wobble;
        
        ctx.fillStyle = c.color;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
        ctx.fill();

        if (c.y > canvas.height) {
          confetti.splice(index, 1);
        }
      });

      frameCount++;
      if (confetti.length > 0 && frameCount < 300) {
        requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    animate();
  }

  // Show toast notification
  function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  // Update scroll progress
  function updateScrollProgress() {
    if (currentPage !== 'theory') return;

    const progressBar = document.getElementById('scroll-progress');
    const page = document.getElementById('theory-page');
    const scrollHeight = page.scrollHeight - window.innerHeight;
    const scrollTop = window.scrollY;
    const progress = (scrollTop / scrollHeight) * 100;

    if (progressBar) {
      progressBar.style.setProperty('--progress', `${Math.min(progress, 100)}%`);
    }
  }

  // Load state from URL
  function loadStateFromURL(state) {
    banker.initialize(state.processes, state.resources);
    banker.available = state.available;
    banker.max = state.max;
    banker.allocation = state.allocation;
    banker.calculateAllNeeds();
    generateMatrices();
    showToast('Loaded shared state', 'success');
  }

  // Initialize app when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
