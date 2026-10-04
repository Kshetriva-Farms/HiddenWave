/**
 * TASK PLANNER — CLEAN STREAMLINED ENGINE
 * With Single-Location Navigation, Markdown/PDF Download Hub, Due Notifications & Master Explorer.
 */

(function () {
  'use strict';

  // --- Selectors & Utility Functions ---
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => document.querySelectorAll(selector);
  const esc = (str) =>
    String(str || '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c]));

  const ymd = (date) =>
    date.getFullYear() +
    '-' +
    String(date.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(date.getDate()).padStart(2, '0');

  const pd = (str) => {
    if (!str) return new Date();
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d || 1);
  };

  const addD = (str, n) => {
    const d = pd(str);
    d.setDate(d.getDate() + n);
    return ymd(d);
  };

  const addM = (str, n) => {
    const d = pd(str);
    d.setDate(1);
    d.setMonth(d.getMonth() + n);
    return ymd(d);
  };

  const wkStart = (str) => addD(str, -pd(str).getDay());
  const uid = () => Math.random().toString(36).slice(2, 10);
  const L = (str, opts) => pd(str).toLocaleDateString(undefined, opts);
  const T = () => ymd(new Date());

  // --- Haptic Feedback Utility ---
  const vibrate = (pattern = 15) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch (e) {}
  };

  // --- Cached Web Audio Synthesized Chime (Singleton) ---
  let audioCtx = null;
  const playBellChime = () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      if (!audioCtx) audioCtx = new AudioContextClass();
      if (audioCtx.state === 'suspended') audioCtx.resume();

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 1.2);
    } catch (e) {}
  };

  // --- Multi-Tier Persistent State ---
  let S = {
    items: [],
    lastUpdated: Date.now(),
    examDate: localStorage.getItem('planner-exam-date') || '',
    examName: localStorage.getItem('planner-exam-name') || 'Finals',
    totalFocusMinutes: parseInt(localStorage.getItem('planner-total-focus-mins') || '0', 10)
  };

  // Tier 1: LocalStorage & SessionStorage Initial Load
  const loadLocalState = () => {
    try {
      const primary = localStorage.getItem('planner-dwm');
      if (primary) {
        const parsed = JSON.parse(primary);
        if (parsed && Array.isArray(parsed.items)) return parsed;
      }
      const backup = localStorage.getItem('planner-dwm-backup-v1');
      if (backup) {
        const parsed = JSON.parse(backup);
        if (parsed && Array.isArray(parsed.items)) return parsed;
      }
      const session = sessionStorage.getItem('planner-dwm-session');
      if (session) {
        const parsed = JSON.parse(session);
        if (parsed && Array.isArray(parsed.items)) return parsed;
      }
    } catch (e) {
      console.warn('LocalStorage parse warning:', e);
    }
    return { items: [], lastUpdated: Date.now() };
  };

  const loadedState = loadLocalState();
  S.items = loadedState.items || [];
  S.lastUpdated = loadedState.lastUpdated || Date.now();

  // Tier 2: IndexedDB Persistent Storage
  const DB_NAME = 'TaskPlannerDB';
  const DB_VERSION = 1;
  const STORE_NAME = 'planner_state';
  let idb = null;

  const initIndexedDB = () => {
    return new Promise((resolve) => {
      if (!window.indexedDB) return resolve(null);
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = (e) => {
        idb = e.target.result;
        resolve(idb);
      };
      request.onerror = () => resolve(null);
    });
  };

  const saveToIndexedDB = (data) => {
    if (!idb) return;
    try {
      const tx = idb.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(JSON.stringify(data), 'current_state');
    } catch (e) {}
  };

  const loadFromIndexedDB = () => {
    return new Promise((resolve) => {
      if (!idb) return resolve(null);
      try {
        const tx = idb.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get('current_state');
        req.onsuccess = () => {
          if (req.result) {
            try {
              const parsed = JSON.parse(req.result);
              if (parsed && Array.isArray(parsed.items)) return resolve(parsed);
            } catch (e) {}
          }
          resolve(null);
        };
        req.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  };

  // Request Persistent Storage from Browser
  let isPersistentStorageGranted = false;
  const requestPersistentStorage = async () => {
    if (navigator.storage && navigator.storage.persist) {
      try {
        const isPersisted = await navigator.storage.persisted();
        if (!isPersisted) {
          isPersistentStorageGranted = await navigator.storage.persist();
        } else {
          isPersistentStorageGranted = true;
        }
      } catch (e) {}
    }
  };

  // Tier 3: Firebase Cloud Sync Configuration
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
  let firebaseEnabled = false;
  let currentUser = null;
  let activeSyncCode = localStorage.getItem('planner-sync-code') || '';
  let cloudSyncStatus = 'idle';
  let firestoreUnsubscribe = null;

  const initFirebase = () => {
    if (typeof firebase !== 'undefined' && firebase.initializeApp) {
      try {
        if (!firebase.apps.length) {
          firebase.initializeApp(firebaseConfig);
        }
        auth = firebase.auth();
        db = firebase.firestore();
        firebaseEnabled = true;

        try {
          db.enablePersistence({ synchronizeTabs: true }).catch(() => {});
        } catch (e) {}

        auth.onAuthStateChanged((user) => {
          currentUser = user;
          updateCloudSyncListener();
          render();
        });
      } catch (e) {
        console.warn('Firebase init warning:', e);
      }
    }
  };

  const updateCloudSyncListener = () => {
    if (firestoreUnsubscribe) {
      firestoreUnsubscribe();
      firestoreUnsubscribe = null;
    }

    if (!firebaseEnabled || !db) return;

    let docRef = null;
    if (currentUser) {
      docRef = db.collection('planner_users').doc(currentUser.uid);
    } else if (activeSyncCode) {
      docRef = db.collection('planner_sync_codes').doc(activeSyncCode.toUpperCase());
    }

    if (docRef) {
      cloudSyncStatus = 'syncing';
      firestoreUnsubscribe = docRef.onSnapshot((doc) => {
        if (doc.exists) {
          const cloudData = doc.data();
          if (cloudData && Array.isArray(cloudData.items)) {
            if (!S.lastUpdated || (cloudData.lastUpdated && cloudData.lastUpdated > S.lastUpdated)) {
              S.items = cloudData.items;
              S.lastUpdated = cloudData.lastUpdated || Date.now();
              saveToLocalStorage(false);
              saveToIndexedDB(S);
              render();
            }
          }
        }
        cloudSyncStatus = 'synced';
        render();
      }, () => {
        cloudSyncStatus = 'offline';
        render();
      });
    } else {
      cloudSyncStatus = 'idle';
    }
  };

  let cloudDebounceTimer = null;
  const syncToCloud = () => {
    if (!firebaseEnabled || !db) return;
    let docRef = null;
    if (currentUser) {
      docRef = db.collection('planner_users').doc(currentUser.uid);
    } else if (activeSyncCode) {
      docRef = db.collection('planner_sync_codes').doc(activeSyncCode.toUpperCase());
    }

    if (!docRef) return;

    cloudSyncStatus = 'syncing';
    renderCloudPill();

    clearTimeout(cloudDebounceTimer);
    cloudDebounceTimer = setTimeout(async () => {
      try {
        await docRef.set({
          items: S.items,
          lastUpdated: Date.now(),
          clientScope: scope,
          clientAnchor: anchor,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        cloudSyncStatus = 'synced';
      } catch (err) {
        cloudSyncStatus = 'offline';
      }
      renderCloudPill();
    }, 400);
  };

  const saveToLocalStorage = (triggerCloud = true) => {
    S.lastUpdated = Date.now();
    try {
      const serialized = JSON.stringify(S);
      localStorage.setItem('planner-dwm', serialized);
      localStorage.setItem('planner-dwm-backup-v1', serialized);
      sessionStorage.setItem('planner-dwm-session', serialized);
    } catch (e) {}
    saveToIndexedDB(S);
    if (triggerCloud) {
      syncToCloud();
    }
  };

  const save = () => saveToLocalStorage(true);

  // --- App State ---
  let scope = 'day'; // 'day' | 'week' | 'month'
  let anchor = T();
  let editingId = null;
  let focusNewSubId = null;
  let pendingDeleteId = null;
  let pendingRestore = false;
  let isSharedView = false;
  let sharedDataBackup = null;
  let activeTagFilter = null;
  let exportScope = 'current'; // 'current' | 'all'
  const openSubtasks = new Set();
  let calendarCursor = '';

  // Master Explorer state
  let explorerTimeFilter = 'all'; // 'all' | 'today' | 'week' | 'month' | 'year'
  let explorerStatusFilter = 'all'; // 'all' | 'pending' | 'completed'
  let explorerSearchQuery = '';

  // --- Customizable Pomodoro Focus Timer Settings ---
  let pomoSettings = {
    focusMins: parseInt(localStorage.getItem('planner-pomo-focus') || '25', 10),
    shortBreakMins: parseInt(localStorage.getItem('planner-pomo-short') || '5', 10),
    longBreakMins: parseInt(localStorage.getItem('planner-pomo-long') || '15', 10),
    sound: localStorage.getItem('planner-pomo-sound') !== 'false',
    notifications: localStorage.getItem('planner-pomo-notify') !== 'false'
  };

  let pomodoroInterval = null;
  let pomodoroSecondsLeft = pomoSettings.focusMins * 60;
  let pomodoroIsRunning = false;
  let pomodoroMode = 'focus'; // 'focus' | 'shortBreak' | 'longBreak'
  let pomodoroActiveTaskText = '';

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const togglePomodoro = (taskText = '') => {
    if (taskText) pomodoroActiveTaskText = taskText;
    if (pomodoroIsRunning) {
      clearInterval(pomodoroInterval);
      pomodoroIsRunning = false;
      document.title = 'Kaizen — Day, Week, Month';
      showToast('Pomodoro timer paused', 'info');
    } else {
      pomodoroIsRunning = true;
      vibrate(20);
      showToast(pomodoroActiveTaskText ? `Focusing on: ${pomodoroActiveTaskText}` : `Focus timer started (${pomoSettings.focusMins}m)`, 'success');
      pomodoroInterval = setInterval(() => {
        if (pomodoroSecondsLeft > 0) {
          pomodoroSecondsLeft--;
          document.title = `(${formatTimer(pomodoroSecondsLeft)}) Kaizen`;
          renderPomodoroPill();
        } else {
          clearInterval(pomodoroInterval);
          pomodoroIsRunning = false;
          
          if (pomodoroMode === 'focus') {
            S.totalFocusMinutes = (S.totalFocusMinutes || 0) + pomoSettings.focusMins;
            localStorage.setItem('planner-total-focus-mins', S.totalFocusMinutes.toString());
            document.title = '🎉 Focus Complete! — Kaizen';
            if (pomoSettings.sound) playBellChime();
            vibrate([40, 80, 40]);
            sendBrowserNotification('🍅 Pomodoro Complete!', 'Great work! Time for a short break.');
            showToast('🎉 Pomodoro session complete! Take a break.', 'success');
            pomodoroMode = 'shortBreak';
            pomodoroSecondsLeft = pomoSettings.shortBreakMins * 60;
          } else {
            document.title = '🔔 Break Finished — Kaizen';
            if (pomoSettings.sound) playBellChime();
            sendBrowserNotification('🔔 Break Finished!', 'Ready for another deep focus session?');
            showToast('Break finished! Ready to focus.', 'info');
            pomodoroMode = 'focus';
            pomodoroSecondsLeft = pomoSettings.focusMins * 60;
          }
          render();
        }
      }, 1000);
    }
    renderPomodoroPill();
  };

  const resetPomodoro = () => {
    clearInterval(pomodoroInterval);
    pomodoroIsRunning = false;
    pomodoroMode = 'focus';
    pomodoroSecondsLeft = pomoSettings.focusMins * 60;
    pomodoroActiveTaskText = '';
    document.title = 'Kaizen — Day, Week, Month';
    renderPomodoroPill();
    showToast(`Pomodoro reset to ${pomoSettings.focusMins}:00`, 'info');
  };

  // --- Browser Notifications Engine ---
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        showToast('🔔 Browser notifications enabled!', 'success');
      }
      return permission;
    }
    return 'unsupported';
  };

  const sendBrowserNotification = (title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: 'icon.svg',
          badge: 'icon.svg'
        });
      } catch (e) {}
    }
  };

  // Due time scanner (@HH:MM)
  let lastScannedDay = '';
  const notifiedTasksInSession = new Set();
  setInterval(() => {
    const todayStr = T();
    if (lastScannedDay !== todayStr) {
      notifiedTasksInSession.clear();
      lastScannedDay = todayStr;
    }
    const now = new Date();
    const curHour = now.getHours();
    const curMin = now.getMinutes();

    const todayTasks = S.items.filter((i) => i.scope === 'day' && i.key === todayStr && !i.done);
    todayTasks.forEach((task) => {
      const match = task.text.match(/@(\d{1,2})(?::(\d{2}))?(am|pm)?/i);
      if (match && !notifiedTasksInSession.has(task.id)) {
        let taskHour = parseInt(match[1], 10);
        const taskMin = match[2] ? parseInt(match[2], 10) : 0;
        const meridian = match[3] ? match[3].toLowerCase() : null;

        if (meridian === 'pm' && taskHour < 12) taskHour += 12;
        if (meridian === 'am' && taskHour === 12) taskHour = 0;

        if (taskHour === curHour && taskMin === curMin) {
          notifiedTasksInSession.add(task.id);
          playBellChime();
          vibrate([30, 60, 30]);
          sendBrowserNotification('⏰ Task Due Reminder', task.text.replace(/@[\w:]+/gi, '').trim());
          showToast(`🔔 Reminder: ${task.text}`, 'success');
        }
      }
    });
  }, 20000);

  // --- Voice Dictation (Web Speech API) ---
  let speechRecognizer = null;
  let isListeningVoice = false;

  const initVoiceRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;
    const recognizer = new SpeechRecognition();
    recognizer.continuous = false;
    recognizer.interimResults = true;
    recognizer.lang = 'en-US';

    recognizer.onstart = () => {
      isListeningVoice = true;
      vibrate(25);
      renderVoiceButton();
      showToast('🎙️ Listening... Speak your task', 'info');
    };

    recognizer.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join('');
      const input = $('#new-task-input');
      if (input) input.value = transcript;
    };

    recognizer.onend = () => {
      isListeningVoice = false;
      renderVoiceButton();
      const input = $('#new-task-input');
      if (input && input.value.trim()) {
        S.items.push({
          id: uid(),
          scope,
          key: currentKey(),
          text: input.value.trim(),
          done: false,
          subs: []
        });
        input.value = '';
        save();
        render();
        vibrate(15);
        showToast('Task added via voice!', 'success');
      }
    };

    recognizer.onerror = (err) => {
      isListeningVoice = false;
      renderVoiceButton();
      if (err.error !== 'no-speech') {
        showToast(`Voice error: ${err.error}`, 'danger');
      }
    };

    return recognizer;
  };

  const toggleVoiceInput = () => {
    if (!speechRecognizer) speechRecognizer = initVoiceRecognition();
    if (!speechRecognizer) {
      showToast('Voice dictation not supported on this browser', 'info');
      return;
    }
    if (isListeningVoice) speechRecognizer.stop();
    else speechRecognizer.start();
  };

  // --- Streak & Exam Calculations ---
  const calculateStreak = () => {
    const completedDays = new Set(
      S.items.filter((i) => i.done && i.scope === 'day').map((i) => i.key)
    );
    let streak = 0;
    let checkDate = T();
    if (!completedDays.has(checkDate)) {
      checkDate = addD(checkDate, -1);
    }
    while (completedDays.has(checkDate)) {
      streak++;
      checkDate = addD(checkDate, -1);
    }
    return streak;
  };

  const calculateLongestStreak = () => {
    const completedDays = Array.from(
      new Set(S.items.filter((i) => i.done && i.scope === 'day').map((i) => i.key))
    ).sort();
    if (completedDays.length === 0) return 0;
    let maxStreak = 1;
    let current = 1;
    for (let i = 1; i < completedDays.length; i++) {
      if (completedDays[i] === addD(completedDays[i - 1], 1)) {
        current++;
        if (current > maxStreak) maxStreak = current;
      } else {
        current = 1;
      }
    }
    return maxStreak;
  };

  const getExamCountdown = () => {
    const examDate = localStorage.getItem('planner-exam-date') || S.examDate;
    const examName = localStorage.getItem('planner-exam-name') || S.examName || 'Exam';
    if (!examDate) return null;
    const diffTime = pd(examDate) - pd(T());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { name: examName, days: diffDays, date: examDate };
  };

  // Theme Management
  const initTheme = () => {
    const savedTheme = localStorage.getItem('planner-theme') || 'auto';
    applyTheme(savedTheme);
  };

  const applyTheme = (theme) => {
    if (theme === 'dark' || theme === 'light') {
      document.documentElement.setAttribute('data-theme', theme);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('planner-theme', theme);
  };

  const toggleTheme = () => {
    const current = localStorage.getItem('planner-theme') || 'auto';
    let nextTheme = current === 'dark' ? 'light' : current === 'light' ? 'auto' : 'dark';
    applyTheme(nextTheme);
    vibrate(10);
    showToast(`Theme switched to ${nextTheme}`, 'info');
  };

  // URL Hash Sync without reload loops
  const updateUrlHash = () => {
    if (isSharedView) return;
    const keyStr = scope === 'day' ? anchor : scope === 'week' ? anchor : anchor.slice(0, 7);
    const targetHash = `#${scope}/${keyStr}`;
    if (window.location.hash !== targetHash) {
      history.replaceState(null, '', targetHash);
    }
  };

  const parseUrlHash = () => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;

    if (hash.startsWith('share=')) {
      try {
        const encoded = hash.replace('share=', '');
        const jsonStr = decodeURIComponent(atob(encoded));
        const sharedPayload = JSON.parse(jsonStr);
        if (sharedPayload && Array.isArray(sharedPayload.items)) {
          isSharedView = true;
          sharedDataBackup = S;
          S = sharedPayload;
          if (sharedPayload.anchor) anchor = sharedPayload.anchor;
          if (sharedPayload.scope) scope = sharedPayload.scope;
          showToast('Viewing shared plan in snapshot mode', 'info');
          return;
        }
      } catch (err) {}
    }

    const [hScope, hDate] = hash.split('/');
    if (['day', 'week', 'month'].includes(hScope)) {
      scope = hScope;
      if (hDate && /^\d{4}-\d{2}(-\d{2})?$/.test(hDate)) {
        anchor = hDate.length === 7 ? hDate + '-01' : hDate;
      }
    }
  };

  // Keys & Items retrieval
  const currentKey = () =>
    scope === 'day' ? anchor : scope === 'week' ? wkStart(anchor) : anchor.slice(0, 7);

  const getVisibleItems = () => {
    let list = S.items.filter((i) => i.scope === scope && i.key === currentKey());
    if (activeTagFilter) {
      list = list.filter(
        (i) =>
          i.text.toLowerCase().includes('#' + activeTagFilter.toLowerCase()) ||
          (i.note && i.note.toLowerCase().includes('#' + activeTagFilter.toLowerCase())) ||
          (i.subs && i.subs.some((s) => s.text.toLowerCase().includes('#' + activeTagFilter.toLowerCase())))
      );
    }
    return list;
  };

  const findTaskOrSub = (id) => {
    for (const task of S.items) {
      if (task.id === id) return [task, null];
      if (task.subs) {
        const sub = task.subs.find((s) => s.id === id);
        if (sub) return [sub, task];
      }
    }
    return [null, null];
  };

  // Header Labels & Dates
  const getHeaderLabels = () => {
    const today = T();
    if (scope === 'day') {
      const isToday = anchor === today;
      return {
        eyebrow: L(anchor, { month: 'long', year: 'numeric' }),
        title: isToday ? 'Today' : L(anchor, { weekday: 'long' }),
        nav: L(anchor, { weekday: 'short', day: 'numeric', month: 'short' }),
        isToday: isToday
      };
    }
    if (scope === 'week') {
      const start = wkStart(anchor);
      const end = addD(start, 6);
      const isThisWeek = start === wkStart(today);
      const navStr =
        L(start, { month: 'short', day: 'numeric' }) +
        ' – ' +
        (pd(start).getMonth() === pd(end).getMonth()
          ? pd(end).getDate()
          : L(end, { month: 'short', day: 'numeric' }));
      return {
        eyebrow: L(start, { month: 'long', year: 'numeric' }),
        title: isThisWeek ? 'This Week' : 'Weekly Priorities',
        nav: navStr,
        isToday: isThisWeek
      };
    }
    const isThisMonth = anchor.slice(0, 7) === today.slice(0, 7);
    return {
      eyebrow: L(anchor, { year: 'numeric' }),
      title: isThisMonth ? 'This Month' : 'Monthly Goals',
      nav: L(anchor, { month: 'long', year: 'numeric' }),
      isToday: isThisMonth
    };
  };

  // Tag Color Palettes Helper
  const tagColorClasses = ['tag-rose', 'tag-amber', 'tag-emerald', 'tag-sky', 'tag-purple', 'tag-indigo'];
  const getTagColorClass = (tag) => {
    let hash = 0;
    for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    return tagColorClasses[Math.abs(hash) % tagColorClasses.length];
  };

  const formatRichTaskText = (rawText) => {
    let escaped = esc(rawText);
    escaped = escaped.replace(/#([\w-]+)/g, (match, tag) => {
      const colorClass = getTagColorClass(tag);
      return `<span class="tag-badge ${colorClass}" data-action="filter-by-tag" data-tag="${esc(tag)}">#${esc(tag)}</span>`;
    });
    escaped = escaped.replace(/@(\d{1,2}(?::\d{2})?(?:am|pm)?)/gi, (match, timeStr) => {
      return `<span class="time-badge">⏰ ${esc(timeStr)}</span>`;
    });
    return escaped;
  };

  // --- Rendering UI ---
  const renderCheckCircle = (completed, id) => `
    <button class="check-circle ${completed ? 'completed' : ''}" 
            data-action="toggle-done" 
            data-id="${id}" 
            aria-label="${completed ? 'Mark incomplete' : 'Mark complete'}">
      ${completed ? `<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>` : ''}
    </button>
  `;

  const renderTaskText = (item) => {
    if (editingId === item.id) {
      return `<input class="task-edit-input" id="edit-task-input" value="${esc(item.text)}" data-id="${item.id}" autocomplete="off" spellcheck="false">`;
    }
    return `<span class="task-text" data-action="start-edit" data-id="${item.id}">${formatRichTaskText(item.text)}</span>`;
  };

  const renderPomodoroPillHtml = () => `
    <button class="pomodoro-pill ${pomodoroIsRunning ? 'running' : ''}" data-action="toggle-pomodoro" title="Pomodoro Focus Timer (${formatTimer(pomodoroSecondsLeft)})">
      <span>${pomodoroMode === 'focus' ? '🍅' : '☕'}</span>
      <span>${formatTimer(pomodoroSecondsLeft)}</span>
      <span style="font-size: 10px; opacity: 0.8;">${pomodoroIsRunning ? '⏸' : '▶'}</span>
    </button>
    <button class="tool-btn" data-action="open-pomodoro-settings" title="Customize Pomodoro Timer" style="padding: 4px;">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
    </button>
  `;

  const renderPomodoroPill = () => {
    const el = $('#pomodoro-pill-wrapper');
    if (el) el.innerHTML = renderPomodoroPillHtml();
  };

  const renderVoiceButton = () => {
    const el = $('#voice-btn-wrapper');
    if (el) {
      el.innerHTML = `
        <button class="voice-dictate-btn ${isListeningVoice ? 'listening' : ''}" data-action="toggle-voice" title="${isListeningVoice ? 'Listening... click to stop' : 'Voice dictation'}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
        </button>
      `;
    }
  };

  const renderCloudPillHtml = () => {
    if (currentUser) {
      const name = currentUser.displayName || currentUser.email || 'Google User';
      const shortName = name.split(' ')[0] || 'User';
      return `
        <button class="cloud-sync-pill synced" data-action="open-cloud-sync" title="Connected to Google Account (${name})">
          <span class="cloud-pulse-dot"></span>
          <span>${esc(shortName)}</span>
        </button>
      `;
    }
    if (activeSyncCode) {
      return `
        <button class="cloud-sync-pill synced" data-action="open-cloud-sync" title="Synced with code ${activeSyncCode}">
          <span class="cloud-pulse-dot"></span>
          <span>Code: ${esc(activeSyncCode)}</span>
        </button>
      `;
    }
    return `
      <button class="cloud-sync-pill" data-action="open-cloud-sync" title="Enable Cloud Sync & Permanent Storage">
        <span class="cloud-pulse-dot"></span>
        <span>Sync</span>
      </button>
    `;
  };

  const renderCloudPill = () => {
    const pillContainer = $('#cloud-pill-wrapper');
    if (pillContainer) pillContainer.innerHTML = renderCloudPillHtml();
  };

  function render() {
    const labels = getHeaderLabels();
    const list = getVisibleItems();
    const streakCount = calculateStreak();
    const examInfo = getExamCountdown();

    const inputPlaceholder =
      scope === 'day'
        ? 'Add task or chapter (e.g. #Physics @10am)...'
        : scope === 'week'
        ? 'Add weekly goal / syllabus milestone...'
        : 'Add high-level target or exam objective...';

    const totalCount = list.length;
    const doneCount = list.filter((i) => i.done).length;
    const progressPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

    let html = '';

    // Shared Plan Banner
    if (isSharedView) {
      html += `
        <div class="shared-banner">
          <div><strong>Viewing Shared Plan</strong> (Snapshot Mode)</div>
          <div class="banner-actions">
            <button class="banner-btn" data-action="import-shared">Import to My Planner</button>
            <button class="banner-btn secondary" data-action="exit-shared">Exit</button>
          </div>
        </div>
      `;
    }

    // Active Tag Filter Banner
    if (activeTagFilter) {
      html += `
        <div class="filter-banner">
          <div>Filtered by <strong>#${esc(activeTagFilter)}</strong></div>
          <button class="banner-btn secondary" data-action="clear-tag-filter">Clear Filter ✕</button>
        </div>
      `;
    }

    // Top Header Bar (Clean & Non-Redundant)
    html += `
      <div class="top-bar">
        <div class="brand-eyebrow">
          <img src="icon.svg" class="brand-icon" alt="Kaizen logo" width="20" height="20">
          <span>KAIZEN • ${labels.eyebrow}</span>
        </div>
        <div class="top-right-tools">
          <div id="pomodoro-pill-wrapper" style="display: flex; align-items: center; gap: 4px;">
            ${renderPomodoroPillHtml()}
          </div>
          <div id="cloud-pill-wrapper">${renderCloudPillHtml()}</div>
          <button class="tool-btn" data-action="toggle-theme" title="Toggle dark/light theme">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2"/><line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" stroke-width="2"/><line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" stroke-width="2"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" stroke-width="2"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" stroke-width="2"/><line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" stroke-width="2"/><line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" stroke-width="2"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" stroke-width="2"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" stroke-width="2"/></svg>
          </button>
        </div>
      </div>
    `;

    // Stats & Primary Feature Bar
    html += `
      <div class="stats-bar">
        <div class="stats-badge-group">
          <div class="stat-pill streak" data-action="open-heatmap-modal" title="View 90-Day Study Heatmap & Consistency Stats">
            <span>🔥</span>
            <span>${streakCount}-Day Streak</span>
          </div>
          ${examInfo ? `
            <div class="stat-pill exam" data-action="open-exam-settings" title="Target Exam: ${esc(examInfo.name)} on ${examInfo.date}">
              <span>⏳</span>
              <span>${examInfo.days > 0 ? `${examInfo.days}d to ${esc(examInfo.name)}` : examInfo.days === 0 ? `🎯 D-Day: ${esc(examInfo.name)}!` : `${esc(examInfo.name)} Done`}</span>
            </div>
          ` : `
            <div class="stat-pill" data-action="open-exam-settings" title="Set target exam or goal deadline">
              <span>🎯</span>
              <span>Set Exam D-Day</span>
            </div>
          `}
          <div class="stat-pill explorer" data-action="open-master-explorer" title="Search all tasks across Day, Week, Month & Year (E)">
            <span>📋</span>
            <span>All Tasks & Search</span>
          </div>
        </div>
      </div>
    `;

    // Title & Progress Section
    html += `
      <div class="head-section">
        <h1 class="planner-title">${labels.title}</h1>
        ${
          totalCount > 0
            ? `
          <div class="progress-container">
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width: ${progressPercent}%"></div>
            </div>
            <span class="progress-pill">${doneCount}/${totalCount} (${progressPercent}%)</span>
          </div>
        `
            : ''
        }
      </div>
    `;

    // Segment Control (Day / Week / Month)
    html += `
      <div class="seg-control">
        ${['day', 'week', 'month']
          .map(
            (s) => `
          <button class="seg-btn ${scope === s ? 'active' : ''}" data-action="set-scope" data-id="${s}">
            ${s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        `
          )
          .join('')}
      </div>
    `;

    // Navigation Bar (‹ Date ▾ ›  Today)
    html += `
      <div class="nav-bar">
        <div class="nav-left">
          <button class="nav-arrow" data-action="shift-prev" aria-label="Previous">‹</button>
          <button class="date-picker-btn" data-action="open-calendar" aria-label="Open calendar">
            <span>${labels.nav}</span>
            <span style="font-size: 12px; opacity: 0.7;">▾</span>
          </button>
          <button class="nav-arrow" data-action="shift-next" aria-label="Next">›</button>
        </div>
        <button class="today-pill-btn ${labels.isToday ? 'is-today' : ''}" data-action="jump-today">
          ${labels.isToday ? '<span class="today-dot"></span>' : ''}
          Today
        </button>
      </div>
    `;

    // Task Items List
    if (list.length > 0) {
      html += `<div class="task-list">`;
      list.forEach((task) => {
        const isExpanded = openSubtasks.has(task.id);
        const subList = task.subs || [];
        const subDoneCount = subList.filter((s) => s.done).length;

        html += `
          <div class="task-item ${task.done ? 'done' : ''}" data-id="${task.id}">
            <div class="task-row">
              ${renderCheckCircle(task.done, task.id)}
              ${renderTaskText(task)}
              ${
                subList.length > 0
                  ? `<span class="subtask-count-badge">${subDoneCount}/${subList.length}</span>`
                  : ''
              }
              <button class="icon-btn ${isExpanded ? 'active' : ''}" data-action="toggle-expand" data-id="${task.id}" aria-label="Task Details">
                ${isExpanded ? '▲' : '▼'}
              </button>
            </div>

            ${
              !isExpanded && task.note
                ? `
              <div class="task-note-preview" data-action="toggle-expand" data-id="${task.id}">
                <span>📝 ${esc(task.note.length > 60 ? task.note.slice(0, 60) + '...' : task.note)}</span>
              </div>
            `
                : ''
            }
            
            ${
              isExpanded
                ? `
              <!-- Subtasks List -->
              <div class="subtasks-wrapper">
                ${subList
                  .map(
                    (sub) => `
                  <div class="subtask-item ${sub.done ? 'done' : ''}" data-id="${sub.id}">
                    ${renderCheckCircle(sub.done, sub.id)}
                    ${renderTaskText(sub)}
                    <button class="icon-btn" data-action="delete-item" data-id="${sub.id}" title="Delete subtask" aria-label="Delete subtask">×</button>
                  </div>
                `
                  )
                  .join('')}
                
                <div class="add-task-row" style="margin-top: 4px;">
                  <span class="add-icon-badge">+</span>
                  <input class="add-task-input" 
                         data-sub-for="${task.id}" 
                         placeholder="Add subtask / revision checklist..."
                         ${focusNewSubId === task.id ? 'autofocus' : ''}
                         autocomplete="off">
                </div>
              </div>

              <!-- Task Notes / Description Box -->
              <div class="task-note-container">
                <textarea class="task-note-box" 
                          data-note-for="${task.id}" 
                          placeholder="📝 Add study notes, formulas, reference links, or task descriptions...">${esc(task.note || '')}</textarea>
              </div>

              <!-- Tools Bar -->
              <div class="task-tools-row">
                <button class="task-tool-btn" data-action="focus-task" data-text="${esc(task.text)}" title="Start Pomodoro on this task">🍅 Focus</button>
                <button class="task-tool-btn" data-action="schedule-revision" data-id="${task.id}" title="Schedule Spaced Revision (1-3-7d)">🧠 Spaced Revision</button>
                <button class="task-tool-btn" data-action="move-up" data-id="${task.id}" title="Move task up">▲</button>
                <button class="task-tool-btn" data-action="move-down" data-id="${task.id}" title="Move task down">▼</button>
                <button class="task-tool-btn danger ${pendingDeleteId === task.id ? 'confirm-delete' : ''}" 
                        data-action="delete-item" 
                        data-id="${task.id}" 
                        title="Delete task">
                  ${pendingDeleteId === task.id ? '⚠️ Tap again to delete' : 'Delete'}
                </button>
              </div>
            `
                : ''
            }
          </div>
        `;
      });
      html += `</div>`;
    } else {
      html += `
        <div class="empty-state">
          <span class="empty-state-icon">✍️</span>
          ${
            activeTagFilter
              ? `No tasks matching tag <strong>#${esc(activeTagFilter)}</strong>.`
              : scope === 'month'
              ? 'No monthly syllabus goals set for this period.'
              : scope === 'week'
              ? 'No weekly priorities scheduled yet.'
              : 'Nothing planned for today yet. Clear mind, fresh start!'
          }
        </div>
      `;
    }

    // Add New Task Row
    html += `
      <div class="add-task-row">
        <span class="add-icon-badge">+</span>
        <input class="add-task-input" id="new-task-input" placeholder="${inputPlaceholder}" autocomplete="off">
        <div id="voice-btn-wrapper">
          <button class="voice-dictate-btn ${isListeningVoice ? 'listening' : ''}" data-action="toggle-voice" title="${isListeningVoice ? 'Listening... click to stop' : 'Voice dictation'}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    // Clean Streamlined Footer
    html += `
      <footer class="planner-footer">
        <div class="footer-nav">
          <button class="footer-btn" data-action="open-share">🔗 Share Plan</button>
          <button class="footer-btn" data-action="open-backup">📥 Export & Download (TXT / PDF / JSON)</button>
          <button class="footer-btn" data-action="open-shortcuts">⌨️ Shortcuts</button>
        </div>
        <div class="footer-credit">
          Crafted for focus & clarity • <a href="https://hiddenwave.in" target="_blank" rel="noopener">HiddenWave.in</a>
        </div>
      </footer>
    `;

    $('#app-container').innerHTML = html;

    const editField = $('#edit-task-input');
    const autoFocusField = document.querySelector('[autofocus]');
    if (editField) {
      editField.focus();
      editField.select();
    } else if (autoFocusField) {
      autoFocusField.focus();
    }
    focusNewSubId = null;

    updateUrlHash();
  }

  // --- Date Shifting ---
  const shiftDate = (step) => {
    vibrate(10);
    if (scope === 'day') anchor = addD(anchor, step);
    else if (scope === 'week') anchor = addD(anchor, 7 * step);
    else anchor = addM(anchor, step);
    render();
  };

  // --- Spaced Repetition Auto-Scheduler ---
  const scheduleSpacedRevision = (taskId) => {
    const [task] = findTaskOrSub(taskId);
    if (!task) return;
    const baseText = task.text.replace(/#revision/gi, '').trim();

    const intervals = [
      { days: 1, label: 'Revise (Day +1)' },
      { days: 3, label: 'Revise (Day +3)' },
      { days: 7, label: 'Revise (Day +7)' }
    ];

    intervals.forEach(({ days, label }) => {
      const targetDate = addD(T(), days);
      S.items.push({
        id: uid(),
        scope: 'day',
        key: targetDate,
        text: `🧠 ${label}: ${baseText} #revision`,
        done: false,
        subs: []
      });
    });

    save();
    vibrate([20, 40, 20]);
    showToast(`Scheduled 3 spaced revisions for +1d, +3d, and +7d!`, 'success');
    render();
  };

  // --- Reordering ---
  const moveTask = (id, direction) => {
    const list = getVisibleItems();
    const currentIndex = list.findIndex((t) => t.id === id);
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const currentGlobalIndex = S.items.indexOf(list[currentIndex]);
    const targetGlobalIndex = S.items.indexOf(list[targetIndex]);

    const temp = S.items[currentGlobalIndex];
    S.items[currentGlobalIndex] = S.items[targetGlobalIndex];
    S.items[targetGlobalIndex] = temp;

    vibrate(10);
    save();
    render();
  };

  // --- Commit Edits ---
  const commitEdit = (inputElement) => {
    const id = inputElement.dataset.id;
    const [item] = findTaskOrSub(id);
    const val = inputElement.value.trim();
    if (item && val) item.text = val;
    editingId = null;
    save();
    render();
  };

  // Flush pending inputs before unload/visibility change
  const flushPendingInputs = () => {
    const editInput = $('#edit-task-input');
    if (editInput && editInput.dataset.id) {
      const [item] = findTaskOrSub(editInput.dataset.id);
      if (item && editInput.value.trim()) item.text = editInput.value.trim();
    }
    const newTaskInput = $('#new-task-input');
    if (newTaskInput && newTaskInput.value.trim()) {
      S.items.push({
        id: uid(),
        scope,
        key: currentKey(),
        text: newTaskInput.value.trim(),
        done: false,
        subs: []
      });
      newTaskInput.value = '';
    }
    $$('[data-note-for]').forEach((textarea) => {
      const taskId = textarea.dataset.noteFor;
      const [task] = findTaskOrSub(taskId);
      if (task) task.note = textarea.value.trim();
    });

    saveToLocalStorage(true);
  };

  window.addEventListener('beforeunload', flushPendingInputs);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushPendingInputs();
  });

  let noteDebounceTimer = null;
  document.addEventListener('input', (e) => {
    if (e.target.id === 'explorer-search-input') {
      explorerSearchQuery = e.target.value;
      updateExplorerResultsOnly();
      return;
    }
    if (e.target.dataset && e.target.dataset.noteFor) {
      const taskId = e.target.dataset.noteFor;
      const [task] = findTaskOrSub(taskId);
      if (task) {
        task.note = e.target.value;
        clearTimeout(noteDebounceTimer);
        noteDebounceTimer = setTimeout(() => {
          saveToLocalStorage(false);
        }, 300);
      }
    }
  });

  // --- Touch Swipe Gestures ---
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;

  document.addEventListener(
    'touchstart',
    (e) => {
      if (e.target.closest('dialog') || e.target.closest('input') || e.target.closest('textarea')) return;
      const touch = e.changedTouches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchStartTime = Date.now();
    },
    { passive: true }
  );

  document.addEventListener(
    'touchend',
    (e) => {
      if (e.target.closest('dialog') || e.target.closest('input') || e.target.closest('textarea')) return;
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      const elapsed = Date.now() - touchStartTime;

      if (Math.abs(deltaX) > 55 && Math.abs(deltaY) < 45 && elapsed < 500) {
        if (deltaX < 0) shiftDate(1);
        else shiftDate(-1);
      }
    },
    { passive: true }
  );

  // --- Toast Notifications ---
  const showToast = (message, type = 'success') => {
    const container = $('#toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'success' ? 'toast-success' : ''}`;
    toast.innerHTML = `<span>${esc(message)}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 3000);
  };

  // --- Modal Helpers ---
  const openModal = (htmlContent) => {
    const dlg = $('#modal-dialog');
    const body = $('#modal-dialog-body');
    body.innerHTML = htmlContent;
    dlg.showModal();
  };

  const closeModal = () => {
    const dlg = $('#modal-dialog');
    dlg.close();
  };

  // --- 1. Study Heatmap & Consistency Dashboard Modal ---
  function openHeatmapModal() {
    const streak = calculateStreak();
    const longestStreak = calculateLongestStreak();
    const totalDone = S.items.filter((i) => i.done).length;
    const totalHours = ((S.totalFocusMinutes || 0) / 60).toFixed(1);

    const today = T();
    const totalDays = 91;
    const startDate = addD(today, -totalDays + 1);

    const countsByDate = {};
    S.items.forEach((item) => {
      if (item.done && item.scope === 'day') {
        countsByDate[item.key] = (countsByDate[item.key] || 0) + 1;
      }
    });

    let heatmapColsHtml = '';
    const startDayOfWeek = pd(startDate).getDay();
    let weekCells = '<div></div>'.repeat(startDayOfWeek);

    for (let d = 0; d < totalDays; d++) {
      const dateStr = addD(startDate, d);
      const count = countsByDate[dateStr] || 0;
      const level = count === 0 ? 'level-0' : count <= 2 ? 'level-1' : count <= 5 ? 'level-2' : 'level-3';
      const formattedDate = L(dateStr, { month: 'short', day: 'numeric' });

      weekCells += `
        <div class="heatmap-cell ${level}" 
             data-action="cal-pick-date" 
             data-id="${dateStr}" 
             title="${formattedDate}: ${count} task${count === 1 ? '' : 's'} completed"></div>
      `;

      if (pd(dateStr).getDay() === 6 || d === totalDays - 1) {
        heatmapColsHtml += `<div class="heatmap-col">${weekCells}</div>`;
        weekCells = '';
      }
    }

    const html = `
      <div class="dialog-header">
        <h3 class="dialog-title">📈 Study Heatmap & Consistency Stats</h3>
        <button class="dialog-close-btn" data-action="modal-close">×</button>
      </div>
      <div class="dialog-body">
        <div class="stats-dashboard-grid">
          <div class="stat-metric-card">
            <div class="stat-metric-value" style="color: var(--warning);">🔥 ${streak}d</div>
            <div class="stat-metric-label">Current Streak</div>
          </div>
          <div class="stat-metric-card">
            <div class="stat-metric-value" style="color: var(--acc);">🏆 ${longestStreak}d</div>
            <div class="stat-metric-label">Best Streak</div>
          </div>
          <div class="stat-metric-card">
            <div class="stat-metric-value" style="color: var(--success);">✅ ${totalDone}</div>
            <div class="stat-metric-label">Tasks Done</div>
          </div>
          <div class="stat-metric-card">
            <div class="stat-metric-value" style="color: #5eb4ef;">⏱️ ${totalHours}h</div>
            <div class="stat-metric-label">Focus Logged</div>
          </div>
        </div>

        <div class="heatmap-wrapper">
          <div class="heatmap-header">
            <strong style="font-size: 13.5px; color: var(--ink);">Last 90 Days Activity</strong>
            <span style="font-size: 12px; color: var(--mut);">${L(startDate, { month: 'short', day: 'numeric' })} – ${L(today, { month: 'short', day: 'numeric' })}</span>
          </div>
          <div class="heatmap-grid">
            ${heatmapColsHtml}
          </div>
          <div class="heatmap-legend">
            <span>Less</span>
            <div class="heatmap-cell level-0" style="width: 10px; height: 10px;"></div>
            <div class="heatmap-cell level-1" style="width: 10px; height: 10px;"></div>
            <div class="heatmap-cell level-2" style="width: 10px; height: 10px;"></div>
            <div class="heatmap-cell level-3" style="width: 10px; height: 10px;"></div>
            <span>More</span>
          </div>
        </div>
      </div>
      <div class="dialog-footer">
        <button class="btn btn-primary" data-action="modal-close">Got it</button>
      </div>
    `;

    openModal(html);
  }

  // --- 2. Customizable Pomodoro Settings Modal ---
  function openPomodoroSettingsModal() {
    const html = `
      <div class="dialog-header">
        <h3 class="dialog-title">🍅 Customize Pomodoro Timer</h3>
        <button class="dialog-close-btn" data-action="modal-close">×</button>
      </div>
      <div class="dialog-body">
        <label style="font-size: 13px; font-weight: 600; color: var(--ink); display: block; margin-bottom: 4px;">
          Focus Duration (Minutes)
        </label>
        <input class="dialog-input" type="number" id="pomo-focus-input" min="5" max="90" value="${pomoSettings.focusMins}">

        <label style="font-size: 13px; font-weight: 600; color: var(--ink); display: block; margin: 10px 0 4px;">
          Short Break Duration (Minutes)
        </label>
        <input class="dialog-input" type="number" id="pomo-short-input" min="1" max="30" value="${pomoSettings.shortBreakMins}">

        <label style="font-size: 13px; font-weight: 600; color: var(--ink); display: block; margin: 10px 0 4px;">
          Long Break Duration (Minutes)
        </label>
        <input class="dialog-input" type="number" id="pomo-long-input" min="5" max="45" value="${pomoSettings.longBreakMins}">

        <div style="margin-top: 14px; display: flex; flex-direction: column; gap: 8px;">
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13.5px; color: var(--ink);">
            <input type="checkbox" id="pomo-sound-checkbox" ${pomoSettings.sound ? 'checked' : ''}>
            <span>Play bell chime when timer completes</span>
          </label>
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13.5px; color: var(--ink);">
            <input type="checkbox" id="pomo-notify-checkbox" ${pomoSettings.notifications ? 'checked' : ''}>
            <span>Show browser push notification</span>
          </label>
        </div>
      </div>
      <div class="dialog-footer">
        <button class="btn btn-primary" data-action="save-pomo-settings">Save Settings</button>
        <button class="btn btn-secondary" data-action="reset-pomo-timer">Reset Timer (${pomoSettings.focusMins}m)</button>
        <button class="btn btn-secondary" data-action="modal-close">Close</button>
      </div>
    `;

    openModal(html);
  }

  // --- 3. Master Task Explorer & Archive Modal ---
  function openMasterExplorerModal() {
    renderMasterExplorerModalContent();
  }

  function getExplorerFilteredTasks() {
    const today = T();
    const currentWeek = wkStart(today);
    const currentMonth = today.slice(0, 7);
    const currentYear = today.slice(0, 4);
    const q = (explorerSearchQuery || '').trim().toLowerCase();

    return S.items.filter((task) => {
      if (explorerTimeFilter === 'today' && (task.scope !== 'day' || task.key !== today)) return false;
      if (explorerTimeFilter === 'week' && (task.scope === 'month' || (task.scope === 'day' && wkStart(task.key) !== currentWeek) || (task.scope === 'week' && task.key !== currentWeek))) return false;
      if (explorerTimeFilter === 'month' && !task.key.startsWith(currentMonth)) return false;
      if (explorerTimeFilter === 'year' && !task.key.startsWith(currentYear)) return false;

      if (explorerStatusFilter === 'pending' && task.done) return false;
      if (explorerStatusFilter === 'completed' && !task.done) return false;

      if (q) {
        const textMatch = task.text.toLowerCase().includes(q);
        const noteMatch = task.note && task.note.toLowerCase().includes(q);
        const subMatch = task.subs && task.subs.some((s) => s.text.toLowerCase().includes(q));
        if (!textMatch && !noteMatch && !subMatch) return false;
      }

      return true;
    });
  }

  function renderExplorerResultsHtml() {
    const tasks = getExplorerFilteredTasks();
    if (!tasks.length) {
      return `
        <div class="empty-state" style="padding: 24px;">
          <span>No tasks found matching your filter criteria.</span>
        </div>
      `;
    }

    return tasks.map((t) => {
      const dateStr =
        t.scope === 'day'
          ? L(t.key, { dateStyle: 'medium' })
          : t.scope === 'week'
          ? 'Week of ' + L(t.key, { month: 'short', day: 'numeric' })
          : L(t.key + '-01', { month: 'long', year: 'numeric' });

      return `
        <div class="explorer-card ${t.done ? 'completed' : ''}">
          <div class="explorer-card-header">
            <span class="explorer-date-badge">${t.scope.toUpperCase()} • ${dateStr}</span>
            <button class="banner-btn secondary" data-action="jump-to-task" data-scope="${t.scope}" data-key="${t.key}">
              🚀 Jump to Date
            </button>
          </div>
          <div style="display: flex; align-items: flex-start; gap: 8px;">
            ${renderCheckCircle(t.done, t.id)}
            <div style="flex: 1;">
              <div class="explorer-card-title">${formatRichTaskText(t.text)}</div>
              ${t.note ? `<div class="explorer-card-note">📝 ${esc(t.note)}</div>` : ''}
              ${t.subs && t.subs.length ? `
                <div style="font-size: 12.5px; color: var(--mut); margin-top: 6px;">
                  ${t.subs.map((s) => `<div style="${s.done ? 'text-decoration: line-through; opacity: 0.6;' : ''}">• ${esc(s.text)}</div>`).join('')}
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function updateExplorerResultsOnly() {
    const container = $('#explorer-results-container');
    if (container) container.innerHTML = renderExplorerResultsHtml();
  }

  function renderMasterExplorerModalContent() {
    const html = `
      <div class="dialog-header">
        <h3 class="dialog-title">📋 Master Task Explorer & Archive</h3>
        <button class="dialog-close-btn" data-action="modal-close">×</button>
      </div>
      <div class="dialog-body">
        <div class="explorer-controls">
          <input class="dialog-input" id="explorer-search-input" placeholder="🔍 Search tasks, descriptions, #tags, or @times..." value="${esc(explorerSearchQuery)}" style="margin: 0;" autocomplete="off">

          <div class="explorer-filters">
            ${[
              { id: 'all', label: 'All-Time' },
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'This Week' },
              { id: 'month', label: 'This Month' },
              { id: 'year', label: 'This Year' }
            ].map(
              (f) => `
              <button class="explorer-filter-btn ${explorerTimeFilter === f.id ? 'active' : ''}" 
                      data-action="set-explorer-time" 
                      data-id="${f.id}">
                ${f.label}
              </button>
            `
            ).join('')}
          </div>

          <div class="explorer-filters">
            ${[
              { id: 'all', label: 'All Status' },
              { id: 'pending', label: '⏳ Pending' },
              { id: 'completed', label: '✅ Completed' }
            ].map(
              (s) => `
              <button class="explorer-filter-btn ${explorerStatusFilter === s.id ? 'active' : ''}" 
                      data-action="set-explorer-status" 
                      data-id="${s.id}">
                ${s.label}
              </button>
            `
            ).join('')}
          </div>
        </div>

        <div class="explorer-results-list" id="explorer-results-container">
          ${renderExplorerResultsHtml()}
        </div>
      </div>
      <div class="dialog-footer">
        <button class="btn btn-secondary" data-action="modal-close">Close</button>
      </div>
    `;

    openModal(html);
  }

  // --- Generate Formatted Markdown String ---
  // --- Generate Human-Readable Formatted Text String ---
  const generateFormattedTextString = (all = false) => {
    const today = T();
    const isAll = all;
    let txt = '';
    const lineSep = '='.repeat(68);
    const subSep = '-'.repeat(68);

    if (isAll) {
      const total = S.items.length;
      const completed = S.items.filter((i) => i.done).length;
      const pending = total - completed;

      txt += `${lineSep}\n`;
      txt += `KAIZEN — COMPLETE MASTER TASK ARCHIVE\n`;
      txt += `Export Date: ${L(today, { dateStyle: 'full' })}\n`;
      txt += `Summary: ${total} Total Tasks | ${completed} Completed | ${pending} Pending\n`;
      if (S.totalFocusMinutes) {
        txt += `Focus Logged: ${(S.totalFocusMinutes / 60).toFixed(1)} hours\n`;
      }
      txt += `${lineSep}\n\n`;

      const dayTasks = S.items.filter((i) => i.scope === 'day').sort((a, b) => b.key.localeCompare(a.key));
      const weekTasks = S.items.filter((i) => i.scope === 'week').sort((a, b) => b.key.localeCompare(a.key));
      const monthTasks = S.items.filter((i) => i.scope === 'month').sort((a, b) => b.key.localeCompare(a.key));

      if (dayTasks.length) {
        txt += `\n${subSep}\n📅 DAILY TASKS (DAY)\n${subSep}\n`;
        let lastKey = '';
        dayTasks.forEach((t) => {
          if (t.key !== lastKey) {
            lastKey = t.key;
            txt += `\n[ ${L(t.key, { dateStyle: 'full' })} ]\n`;
          }
          txt += `  [${t.done ? '✓' : ' '}] ${t.text}\n`;
          if (t.note) {
            txt += `      📝 Notes: ${t.note.replace(/\n/g, '\n         ')}\n`;
          }
          if (t.subs && t.subs.length) {
            txt += `      Checklist:\n`;
            t.subs.forEach((s) => {
              txt += `        [${s.done ? '✓' : ' '}] ${s.text}\n`;
            });
          }
        });
      }

      if (weekTasks.length) {
        txt += `\n\n${subSep}\n📅 WEEKLY PRIORITIES (WEEK)\n${subSep}\n`;
        let lastKey = '';
        weekTasks.forEach((t) => {
          if (t.key !== lastKey) {
            lastKey = t.key;
            txt += `\n[ Week of ${L(t.key, { month: 'short', day: 'numeric', year: 'numeric' })} ]\n`;
          }
          txt += `  [${t.done ? '✓' : ' '}] ${t.text}\n`;
          if (t.note) {
            txt += `      📝 Notes: ${t.note.replace(/\n/g, '\n         ')}\n`;
          }
          if (t.subs && t.subs.length) {
            txt += `      Checklist:\n`;
            t.subs.forEach((s) => {
              txt += `        [${s.done ? '✓' : ' '}] ${s.text}\n`;
            });
          }
        });
      }

      if (monthTasks.length) {
        txt += `\n\n${subSep}\n📅 MONTHLY GOALS (MONTH)\n${subSep}\n`;
        let lastKey = '';
        monthTasks.forEach((t) => {
          if (t.key !== lastKey) {
            lastKey = t.key;
            txt += `\n[ ${L(t.key + '-01', { month: 'long', year: 'numeric' })} ]\n`;
          }
          txt += `  [${t.done ? '✓' : ' '}] ${t.text}\n`;
          if (t.note) {
            txt += `      📝 Notes: ${t.note.replace(/\n/g, '\n         ')}\n`;
          }
          if (t.subs && t.subs.length) {
            txt += `      Checklist:\n`;
            t.subs.forEach((s) => {
              txt += `        [${s.done ? '✓' : ' '}] ${s.text}\n`;
            });
          }
        });
      }
    } else {
      const items = getVisibleItems();
      const total = items.length;
      const completed = items.filter((i) => i.done).length;
      const pending = total - completed;
      const headerTitle =
        scope === 'day'
          ? `DAILY AGENDA — ${L(anchor, { dateStyle: 'full' })}`
          : scope === 'week'
          ? `WEEKLY PRIORITIES — Week of ${L(wkStart(anchor), { month: 'short', day: 'numeric', year: 'numeric' })}`
          : `MONTHLY GOALS — ${L(anchor.slice(0, 7) + '-01', { month: 'long', year: 'numeric' })}`;

      txt += `${lineSep}\n`;
      txt += `KAIZEN — ${headerTitle}\n`;
      txt += `Summary: ${total} Tasks (${completed} Completed, ${pending} Pending)\n`;
      txt += `${lineSep}\n\n`;

      if (items.length) {
        items.forEach((t, idx) => {
          txt += `[${t.done ? '✓' : ' '}] ${idx + 1}. ${t.text}\n`;
          if (t.note) {
            txt += `    📝 Notes: ${t.note.replace(/\n/g, '\n       ')}\n`;
          }
          if (t.subs && t.subs.length) {
            txt += `    Checklist:\n`;
            t.subs.forEach((s) => {
              txt += `      [${s.done ? '✓' : ' '}] ${s.text}\n`;
            });
          }
          txt += `\n`;
        });
      } else {
        txt += `(No tasks scheduled for this period)\n\n`;
      }
    }

    txt += `${lineSep}\n`;
    txt += `Exported from Kaizen • https://hiddenwave.in\n`;
    txt += `${lineSep}\n`;

    return txt;
  };

  // --- Generate Standalone Printable Document HTML ---
  const generatePrintableHtml = (all = false) => {
    const today = T();
    const isAll = all;
    const targetItems = isAll ? S.items : getVisibleItems();
    const total = targetItems.length;
    const completed = targetItems.filter((i) => i.done).length;
    const pending = total - completed;
    const title = isAll ? 'Complete Task Archive' : (scope === 'day' ? L(anchor, { dateStyle: 'full' }) : scope === 'week' ? 'Week of ' + L(wkStart(anchor), { month: 'short', day: 'numeric', year: 'numeric' }) : L(anchor.slice(0, 7) + '-01', { month: 'long', year: 'numeric' }));

    const renderTaskHtml = (t) => {
      let taskTextEscaped = esc(t.text);
      taskTextEscaped = taskTextEscaped.replace(/#([\w-]+)/g, '<span class="tag">#$1</span>');
      taskTextEscaped = taskTextEscaped.replace(/@(\d{1,2}(?::\d{2})?(?:am|pm)?)/gi, '<span class="time-tag">⏰ $1</span>');

      return `
        <div class="task-card ${t.done ? 'completed' : ''}">
          <div class="task-title-row">
            <span class="status-check ${t.done ? 'completed' : 'pending'}">${t.done ? '✓' : '○'}</span>
            <div style="flex: 1;">
              <span class="task-name">${taskTextEscaped}</span>
              ${t.note ? `<div class="task-note-text"><strong>📝 Notes:</strong> ${esc(t.note)}</div>` : ''}
              ${t.subs && t.subs.length ? `
                <div class="subtasks-list">
                  ${t.subs.map((s) => `
                    <div class="subtask-row ${s.done ? 'completed' : ''}">
                      <span>${s.done ? '☑' : '☐'}</span>
                      <span>${esc(s.text)}</span>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    };

    let bodyContent = '';

    if (isAll) {
      const dayTasks = S.items.filter((i) => i.scope === 'day').sort((a, b) => b.key.localeCompare(a.key));
      const weekTasks = S.items.filter((i) => i.scope === 'week').sort((a, b) => b.key.localeCompare(a.key));
      const monthTasks = S.items.filter((i) => i.scope === 'month').sort((a, b) => b.key.localeCompare(a.key));

      if (dayTasks.length) {
        bodyContent += `<div class="group-header">📅 Daily Tasks (Day)</div>`;
        let lastKey = '';
        dayTasks.forEach((t) => {
          if (t.key !== lastKey) {
            lastKey = t.key;
            bodyContent += `<div style="font-weight: 700; font-size: 13px; color: #4b5563; margin: 12px 0 6px;">• ${L(t.key, { dateStyle: 'full' })}</div>`;
          }
          bodyContent += renderTaskHtml(t);
        });
      }

      if (weekTasks.length) {
        bodyContent += `<div class="group-header">📅 Weekly Priorities (Week)</div>`;
        let lastKey = '';
        weekTasks.forEach((t) => {
          if (t.key !== lastKey) {
            lastKey = t.key;
            bodyContent += `<div style="font-weight: 700; font-size: 13px; color: #4b5563; margin: 12px 0 6px;">• Week of ${L(t.key, { month: 'short', day: 'numeric', year: 'numeric' })}</div>`;
          }
          bodyContent += renderTaskHtml(t);
        });
      }

      if (monthTasks.length) {
        bodyContent += `<div class="group-header">📅 Monthly Goals (Month)</div>`;
        let lastKey = '';
        monthTasks.forEach((t) => {
          if (t.key !== lastKey) {
            lastKey = t.key;
            bodyContent += `<div style="font-weight: 700; font-size: 13px; color: #4b5563; margin: 12px 0 6px;">• ${L(t.key + '-01', { month: 'long', year: 'numeric' })}</div>`;
          }
          bodyContent += renderTaskHtml(t);
        });
      }
    } else {
      if (targetItems.length) {
        targetItems.forEach((t) => {
          bodyContent += renderTaskHtml(t);
        });
      } else {
        bodyContent += `<div style="padding: 20px; text-align: center; color: #6b7280;">No tasks recorded for this period.</div>`;
      }
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Task Planner — ${esc(title)}</title>
  <style>
    @page { margin: 12mm 12mm 12mm 12mm; size: auto; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      background: #ffffff;
      padding: 20px 24px;
      font-size: 13px;
      line-height: 1.45;
    }
    .doc-header {
      border-bottom: 2px solid #111827;
      padding-bottom: 10px;
      margin-bottom: 14px;
    }
    .doc-title {
      font-size: 22px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 4px;
    }
    .doc-meta {
      font-size: 12px;
      color: #4b5563;
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 6px;
    }
    .stats-summary {
      background: #f3f4f6;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 16px;
      display: flex;
      gap: 16px;
      font-size: 12px;
      font-weight: 600;
    }
    .group-header {
      font-size: 13px;
      font-weight: 700;
      color: #1f2937;
      background: #e5e7eb;
      padding: 5px 10px;
      border-radius: 4px;
      margin: 16px 0 8px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .task-card {
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 8px 10px;
      margin-bottom: 6px;
      page-break-inside: avoid;
    }
    .task-card.completed {
      background: #f9fafb;
    }
    .task-title-row {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }
    .status-check {
      font-size: 13px;
      font-weight: bold;
      width: 16px;
      flex: none;
    }
    .status-check.completed { color: #059669; }
    .status-check.pending { color: #9ca3af; }
    .task-name {
      font-size: 13.5px;
      font-weight: 600;
      color: #111827;
      word-break: break-word;
    }
    .task-card.completed .task-name {
      text-decoration: line-through;
      color: #6b7280;
    }
    .tag {
      display: inline-block;
      font-size: 11px;
      font-weight: 600;
      padding: 1px 6px;
      border-radius: 4px;
      background: #e5e7eb;
      color: #374151;
      margin-left: 4px;
    }
    .time-tag {
      font-size: 11px;
      font-weight: 600;
      color: #b45309;
      background: #fef3c7;
      padding: 1px 6px;
      border-radius: 4px;
      margin-left: 4px;
    }
    .task-note-text {
      margin: 5px 0 0 24px;
      font-size: 12px;
      color: #4b5563;
      background: #f9fafb;
      padding: 5px 8px;
      border-left: 3px solid #d1d5db;
      border-radius: 2px;
      white-space: pre-wrap;
    }
    .subtasks-list {
      margin: 5px 0 0 24px;
      font-size: 12px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .subtask-row {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #374151;
    }
    .subtask-row.completed {
      text-decoration: line-through;
      color: #9ca3af;
    }
    .doc-footer {
      margin-top: 24px;
      padding-top: 8px;
      border-top: 1px solid #e5e7eb;
      font-size: 11px;
      color: #9ca3af;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="doc-header">
    <div class="doc-title">⛩️ Kaizen — ${esc(title)}</div>
    <div class="doc-meta">
      <span>Generated on: ${L(today, { dateStyle: 'full' })}</span>
      <span>Platform: HiddenWave Kaizen</span>
    </div>
  </div>

  <div class="stats-summary">
    <span>Total Tasks: <strong>${total}</strong></span>
    <span style="color: #059669;">Completed: <strong>${completed}</strong></span>
    <span style="color: #d97706;">Pending: <strong>${pending}</strong></span>
    ${isAll && S.totalFocusMinutes ? `<span>Focus Logged: <strong>${(S.totalFocusMinutes / 60).toFixed(1)}h</strong></span>` : ''}
  </div>

  ${bodyContent}

  <div class="doc-footer">
    Exported from Kaizen • <a href="https://hiddenwave.in" target="_blank" style="color: #9ca3af; text-decoration: none;">HiddenWave.in</a>
  </div>
</body>
</html>`;
  };

  // Dedicated Print Engine (Runs in background frame without UI clutter)
  const printTaskDocument = (all = false) => {
    const docHtml = generatePrintableHtml(all);
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(docHtml);
    doc.close();

    iframe.contentWindow.focus();
    setTimeout(() => {
      iframe.contentWindow.print();
      setTimeout(() => {
        iframe.remove();
      }, 3000);
    }, 250);
  };

  // --- 4. Export & Download Hub Modal ---
  function openBackupModal() {
    pendingRestore = false;
    renderBackupModalContent();
  }

  function renderBackupModalContent() {
    const isAll = exportScope === 'all';
    const textContent = generateFormattedTextString(isAll);
    const jsonString = JSON.stringify(isAll ? S : { scope, anchor, items: getVisibleItems() }, null, 2);

    const html = `
      <div class="dialog-header">
        <h3 class="dialog-title">📥 Export & Download Hub</h3>
        <button class="dialog-close-btn" data-action="modal-close">×</button>
      </div>
      <div class="dialog-body">
        <!-- Scope Toggle: Current View vs All Archive -->
        <div style="display: flex; gap: 6px; margin-bottom: 12px;">
          <button class="explorer-filter-btn ${exportScope === 'current' ? 'active' : ''}" data-action="set-export-scope" data-id="current">
            Current View (${scope.toUpperCase()})
          </button>
          <button class="explorer-filter-btn ${exportScope === 'all' ? 'active' : ''}" data-action="set-export-scope" data-id="all">
            All Tasks Archive (${S.items.length} tasks)
          </button>
        </div>

        <div class="tab-nav">
          <button class="tab-btn active" data-tab="txt-tab">Formatted Text (.txt)</button>
          <button class="tab-btn" data-tab="pdf-tab">Print / PDF Document</button>
          <button class="tab-btn" data-tab="json-tab">JSON Backup</button>
        </div>

        <!-- Formatted Text Tab -->
        <div class="tab-content active" id="txt-tab">
          <p style="font-size: 13px; color: var(--mut); margin-bottom: 6px;">
            Clean human-readable text format with checkboxes, notes, and checklists.
          </p>
          <textarea class="dialog-textarea" id="formatted-text-textarea" readonly>${esc(textContent)}</textarea>
          <div style="display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap;">
            <button class="btn btn-primary btn-sm" data-action="download-text-file">📥 Download .txt File</button>
            <button class="btn btn-secondary btn-sm" data-action="copy-formatted-text">📋 Copy Text</button>
          </div>
        </div>

        <!-- PDF / Print Tab -->
        <div class="tab-content" id="pdf-tab">
          <p style="font-size: 13px; color: var(--mut); margin-bottom: 12px;">
            Generates a clean, high-resolution printable document containing all task details, checklists, study notes, and summary statistics.
          </p>
          <div style="background: var(--bg); border: 1px solid var(--line); border-radius: var(--radius-md); padding: 16px; text-align: center;">
            <p style="font-weight: 600; font-size: 14.5px; color: var(--ink); margin-bottom: 4px;">
              📄 ${isAll ? 'Complete Task Archive Document' : `Current ${scope.toUpperCase()} Agenda Document`}
            </p>
            <p style="font-size: 12.5px; color: var(--mut); margin-bottom: 14px;">
              ${isAll ? `Includes all ${S.items.length} tasks across Day, Week, and Month with expanded descriptions & checklists.` : `Includes all ${getVisibleItems().length} tasks for this view with expanded descriptions & checklists.`}
            </p>
            <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
              <button class="btn btn-primary" data-action="print-planner">🖨️ Print / Save as PDF</button>
              <button class="btn btn-secondary" data-action="download-html-file">📥 Download Document (.html)</button>
            </div>
          </div>
        </div>

        <!-- JSON Tab -->
        <div class="tab-content" id="json-tab">
          <p style="font-size: 13px; color: var(--mut); margin-bottom: 6px;">
            Raw JSON backup format. To restore, paste valid JSON below and click Restore.
          </p>
          <textarea class="dialog-textarea" id="backup-textarea">${esc(jsonString)}</textarea>
          <p id="backup-msg" style="font-size: 13px; color: var(--acc); min-height: 20px;"></p>
          <div style="display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap;">
            <button class="btn btn-primary btn-sm" data-action="download-json-file">📥 Download .json File</button>
            <button class="btn btn-secondary btn-sm" data-action="copy-backup-json">📋 Copy JSON</button>
            <button class="btn btn-secondary btn-sm" data-action="restore-backup-json">🔄 Restore JSON</button>
          </div>
        </div>
      </div>
      <div class="dialog-footer">
        <button class="btn btn-secondary" data-action="modal-close">Close</button>
      </div>
    `;

    openModal(html);
  }

  // --- 5. Share Modal (Clean, No Duplicate Print Button) ---
  function openShareModal() {
    const payload = {
      version: 1,
      createdAt: new Date().toISOString(),
      scope,
      anchor,
      items: S.items
    };
    const jsonStr = JSON.stringify(payload);
    const encoded = btoa(encodeURIComponent(jsonStr));
    const shareUrl = `${window.location.origin}${window.location.pathname}#share=${encoded}`;

    const html = `
      <div class="dialog-header">
        <h3 class="dialog-title">🔗 Publish & Share Plan</h3>
        <button class="dialog-close-btn" data-action="modal-close">×</button>
      </div>
      <div class="dialog-body">
        <p style="margin-bottom: 12px; color: var(--ink-secondary);">
          Generate a direct, zero-backend shareable link to publish your planner snapshot online. Anyone with this link can view your tasks or import them into their planner.
        </p>
        <label style="font-size: 13px; font-weight: 600; color: var(--mut); display: block; margin-bottom: 4px;">
          Shareable Web Link
        </label>
        <input class="dialog-input" id="share-link-input" value="${esc(shareUrl)}" readonly>
        <p id="share-msg" style="font-size: 13px; color: var(--acc); min-height: 20px; margin-top: 6px;"></p>
      </div>
      <div class="dialog-footer">
        <button class="btn btn-primary" data-action="copy-share-link">Copy Share Link</button>
        <button class="btn btn-secondary" data-action="modal-close">Close</button>
      </div>
    `;

    openModal(html);
  }

  // --- 6. Exam & Goal Countdown Settings Modal ---
  function openExamSettingsModal() {
    const curExamDate = localStorage.getItem('planner-exam-date') || S.examDate || '';
    const curExamName = localStorage.getItem('planner-exam-name') || S.examName || 'Finals';

    const html = `
      <div class="dialog-header">
        <h3 class="dialog-title">🎯 Exam & Target D-Day Countdown</h3>
        <button class="dialog-close-btn" data-action="modal-close">×</button>
      </div>
      <div class="dialog-body">
        <p style="font-size: 13.5px; color: var(--mut); margin-bottom: 12px;">
          Keep your target exam date pinned at the top of your planner to track remaining days and revision urgency.
        </p>
        <label style="font-size: 13px; font-weight: 600; color: var(--ink); display: block; margin-bottom: 4px;">
          Exam / Target Name
        </label>
        <input class="dialog-input" id="exam-name-input" value="${esc(curExamName)}" placeholder="e.g. NEET, UPSC, Semester Finals, CFA Level 1">
        
        <label style="font-size: 13px; font-weight: 600; color: var(--ink); display: block; margin: 10px 0 4px;">
          Exam Date
        </label>
        <input class="dialog-input" type="date" id="exam-date-input" value="${esc(curExamDate)}">
      </div>
      <div class="dialog-footer">
        <button class="btn btn-primary" data-action="save-exam-settings">Save Target</button>
        ${curExamDate ? `<button class="btn btn-secondary" data-action="clear-exam-settings">Clear</button>` : ''}
        <button class="btn btn-secondary" data-action="modal-close">Close</button>
      </div>
    `;

    openModal(html);
  }

  // --- 7. Cloud Sync & Persistence Modal ---
  function openCloudSyncModal() {
    const html = `
      <div class="dialog-header">
        <h3 class="dialog-title">☁️ Cloud Sync & Permanent Storage</h3>
        <button class="dialog-close-btn" data-action="modal-close">×</button>
      </div>
      <div class="dialog-body">
        <p style="font-size: 13.5px; color: var(--mut); margin-bottom: 14px;">
          Keep your tasks and study plans permanently safe from browser clear, cache wipes, or device loss:
        </p>

        <div class="modal-feature-card">
          <div class="modal-feature-card-header">
            <span class="modal-feature-title">
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
              Google Account Sync
            </span>
            <span class="status-badge ${currentUser ? 'active' : 'inactive'}">
              ${currentUser ? 'Connected' : 'Not Connected'}
            </span>
          </div>
          <p style="font-size: 13px; color: var(--mut); margin: 6px 0 10px;">
            ${currentUser ? `Signed in as <strong>${esc(currentUser.displayName || currentUser.email)}</strong>. Changes sync automatically in real-time.` : 'Sign in with Google to automatically sync your study plans across all your devices.'}
          </p>
          ${currentUser ? `
            <button class="btn btn-secondary btn-sm" data-action="google-sign-out">Sign Out</button>
          ` : `
            <button class="btn btn-google btn-full" data-action="google-sign-in">
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
              Sign In with Google
            </button>
          `}
        </div>

        <div class="modal-feature-card">
          <div class="modal-feature-card-header">
            <span class="modal-feature-title">🔑 Secret Sync Passcode</span>
            <span class="status-badge ${activeSyncCode ? 'active' : 'inactive'}">
              ${activeSyncCode ? 'Active' : 'Optional'}
            </span>
          </div>
          <p style="font-size: 13px; color: var(--mut); margin: 6px 0;">
            Prefer not to sign in? Enter a secret passcode (e.g. <code>MY-STUDY-99</code>) to link multiple devices instantly.
          </p>
          <div style="display: flex; gap: 8px; margin-top: 8px;">
            <input class="dialog-input" id="sync-code-input" placeholder="Enter sync code..." value="${esc(activeSyncCode)}" style="margin: 0;">
            <button class="btn btn-primary btn-sm" data-action="save-sync-code">Connect</button>
            ${activeSyncCode ? `<button class="btn btn-secondary btn-sm" data-action="disconnect-sync-code">Clear</button>` : ''}
          </div>
        </div>

        <div class="modal-feature-card">
          <div class="modal-feature-card-header">
            <span class="modal-feature-title">🔒 Storage Persistence</span>
            <span class="status-badge ${isPersistentStorageGranted ? 'active' : 'inactive'}">
              ${isPersistentStorageGranted ? 'Guaranteed' : 'Standard'}
            </span>
          </div>
          <p style="font-size: 13px; color: var(--mut); margin: 6px 0 10px;">
            Prevents Chrome from deleting your offline tasks during disk cleanup.
          </p>
          <button class="btn btn-secondary btn-sm" data-action="request-browser-persistence">
            ${isPersistentStorageGranted ? '✓ Storage Protection Active' : 'Request Storage Protection'}
          </button>
        </div>
      </div>
      <div class="dialog-footer">
        <button class="btn btn-secondary" data-action="modal-close">Close</button>
      </div>
    `;

    openModal(html);
  }

  // --- 8. Calendar View Modal ---
  function openCalendarModal() {
    const today = T();
    const curYear = calendarCursor.slice(0, 4);
    let html = '';

    if (scope === 'month') {
      html = `
        <div class="dialog-header">
          <h3 class="dialog-title">Select Month</h3>
          <button class="dialog-close-btn" data-action="modal-close">×</button>
        </div>
        <div class="dialog-body">
          <div class="calendar-header">
            <button class="nav-arrow" data-action="cal-prev-year">‹</button>
            <strong>${curYear}</strong>
            <button class="nav-arrow" data-action="cal-next-year">›</button>
          </div>
          <div class="calendar-months-grid">
            ${Array.from({ length: 12 }, (_, m) => {
              const keyMonth = curYear + '-' + String(m + 1).padStart(2, '0');
              const isSelected = keyMonth === anchor.slice(0, 7);
              const isCurrent = keyMonth === today.slice(0, 7);
              const mName = new Date(+curYear, m, 1).toLocaleDateString(undefined, {
                month: 'short'
              });
              return `
                <button class="cal-month-cell ${isSelected ? 'selected' : ''} ${isCurrent ? 'is-today' : ''}" 
                        data-action="cal-pick-date" 
                        data-id="${keyMonth}-01">
                  ${mName}
                </button>
              `;
            }).join('')}
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-secondary" data-action="cal-jump-today">Jump to Today</button>
          <button class="btn btn-secondary" data-action="modal-close">Close</button>
        </div>
      `;
    } else {
      const firstDayIndex = pd(calendarCursor).getDay();
      const daysInMonth = new Date(+curYear, pd(calendarCursor).getMonth() + 1, 0).getDate();
      const currentWeekStart = wkStart(anchor);

      html = `
        <div class="dialog-header">
          <h3 class="dialog-title">Select Date</h3>
          <button class="dialog-close-btn" data-action="modal-close">×</button>
        </div>
        <div class="dialog-body">
          <div class="calendar-header">
            <button class="nav-arrow" data-action="cal-prev-month">‹</button>
            <strong>${L(calendarCursor, { month: 'long', year: 'numeric' })}</strong>
            <button class="nav-arrow" data-action="cal-next-month">›</button>
          </div>
          <div class="calendar-grid-weekdays">
            ${['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
              .map((d) => `<div>${d}</div>`)
              .join('')}
          </div>
          <div class="calendar-days-grid">
            ${'<div></div>'.repeat(firstDayIndex)}
            ${Array.from({ length: daysInMonth }, (_, d) => {
              const dayNum = d + 1;
              const dateStr =
                calendarCursor.slice(0, 8) + String(dayNum).padStart(2, '0');
              const isSelected =
                scope === 'day' ? dateStr === anchor : wkStart(dateStr) === currentWeekStart;
              const isToday = dateStr === today;
              const hasTasks = S.items.some(
                (i) => i.scope === 'day' && i.key === dateStr && !i.done
              );

              return `
                <button class="cal-day-cell ${isSelected ? 'selected' : ''} ${isToday ? 'is-today' : ''}" 
                        data-action="cal-pick-date" 
                        data-id="${dateStr}">
                  ${dayNum}
                  ${hasTasks ? '<span class="cal-dot"></span>' : ''}
                </button>
              `;
            }).join('')}
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-secondary" data-action="cal-jump-today">Jump to Today</button>
          <button class="btn btn-secondary" data-action="modal-close">Close</button>
        </div>
      `;
    }

    openModal(html);
  }

  // --- 9. Keyboard Shortcuts Cheatsheet Modal ---
  function openShortcutsModal() {
    const html = `
      <div class="dialog-header">
        <h3 class="dialog-title">⌨️ Keyboard Shortcuts</h3>
        <button class="dialog-close-btn" data-action="modal-close">×</button>
      </div>
      <div class="dialog-body">
        <div class="shortcuts-grid">
          <div class="shortcut-card">
            <span>New Task</span>
            <kbd class="shortcut-key">N</kbd>
          </div>
          <div class="shortcut-card">
            <span>Jump to Today</span>
            <kbd class="shortcut-key">T</kbd>
          </div>
          <div class="shortcut-card">
            <span>Day View</span>
            <kbd class="shortcut-key">1</kbd>
          </div>
          <div class="shortcut-card">
            <span>Week View</span>
            <kbd class="shortcut-key">2</kbd>
          </div>
          <div class="shortcut-card">
            <span>Month View</span>
            <kbd class="shortcut-key">3</kbd>
          </div>
          <div class="shortcut-card">
            <span>Previous Date (Swipe 👉)</span>
            <kbd class="shortcut-key">J or ←</kbd>
          </div>
          <div class="shortcut-card">
            <span>Next Date (Swipe 👈)</span>
            <kbd class="shortcut-key">K or →</kbd>
          </div>
          <div class="shortcut-card">
            <span>Pomodoro Focus</span>
            <kbd class="shortcut-key">P</kbd>
          </div>
          <div class="shortcut-card">
            <span>Master Task Explorer</span>
            <kbd class="shortcut-key">E or /</kbd>
          </div>
          <div class="shortcut-card">
            <span>Heatmap & Stats</span>
            <kbd class="shortcut-key">H</kbd>
          </div>
          <div class="shortcut-card">
            <span>Share Plan</span>
            <kbd class="shortcut-key">S</kbd>
          </div>
          <div class="shortcut-card">
            <span>Close / Cancel</span>
            <kbd class="shortcut-key">Esc</kbd>
          </div>
        </div>
      </div>
      <div class="dialog-footer">
        <button class="btn btn-primary" data-action="modal-close">Got it</button>
      </div>
    `;

    openModal(html);
  }

  // --- Global Event Dispatcher ---
  document.addEventListener('click', async (e) => {
    const actionEl = e.target.closest('[data-action]');
    if (!actionEl) return;

    const action = actionEl.dataset.action;
    const id = actionEl.dataset.id;

    if (actionEl.matches('input') || actionEl.matches('textarea')) return;

    const Actions = {
      'set-scope': () => {
        vibrate(8);
        scope = id;
        editingId = null;
        render();
      },
      'shift-prev': () => shiftDate(-1),
      'shift-next': () => shiftDate(1),
      'jump-today': () => {
        vibrate(10);
        anchor = T();
        render();
      },
      'toggle-done': () => {
        const [item] = findTaskOrSub(id);
        if (item) {
          item.done = !item.done;
          vibrate(item.done ? 20 : 10);
          save();
          render();
        }
      },
      'toggle-expand': () => {
        vibrate(8);
        if (openSubtasks.has(id)) openSubtasks.delete(id);
        else {
          openSubtasks.add(id);
          focusNewSubId = id;
        }
        render();
      },
      'start-edit': () => {
        editingId = id;
        render();
      },
      'delete-item': () => {
        const [item, parent] = findTaskOrSub(id);
        if (parent) {
          parent.subs = parent.subs.filter((s) => s.id !== id);
        } else {
          if (item.subs && item.subs.length && pendingDeleteId !== id) {
            pendingDeleteId = id;
            vibrate(20);
            render();
            return;
          }
          S.items = S.items.filter((t) => t.id !== id);
          pendingDeleteId = null;
        }
        vibrate(15);
        save();
        render();
        showToast('Item deleted', 'info');
      },
      'move-up': () => moveTask(id, -1),
      'move-down': () => moveTask(id, 1),
      'toggle-theme': () => toggleTheme(),
      'toggle-pomodoro': () => togglePomodoro(),
      'open-pomodoro-settings': () => openPomodoroSettingsModal(),
      'save-pomo-settings': () => {
        const focusInp = $('#pomo-focus-input');
        const shortInp = $('#pomo-short-input');
        const longInp = $('#pomo-long-input');
        const soundBox = $('#pomo-sound-checkbox');
        const notifyBox = $('#pomo-notify-checkbox');

        if (focusInp) pomoSettings.focusMins = Math.max(5, parseInt(focusInp.value, 10) || 25);
        if (shortInp) pomoSettings.shortBreakMins = Math.max(1, parseInt(shortInp.value, 10) || 5);
        if (longInp) pomoSettings.longBreakMins = Math.max(5, parseInt(longInp.value, 10) || 15);
        if (soundBox) pomoSettings.sound = soundBox.checked;
        if (notifyBox) {
          pomoSettings.notifications = notifyBox.checked;
          if (pomoSettings.notifications) requestNotificationPermission();
        }

        localStorage.setItem('planner-pomo-focus', pomoSettings.focusMins.toString());
        localStorage.setItem('planner-pomo-short', pomoSettings.shortBreakMins.toString());
        localStorage.setItem('planner-pomo-long', pomoSettings.longBreakMins.toString());
        localStorage.setItem('planner-pomo-sound', pomoSettings.sound.toString());
        localStorage.setItem('planner-pomo-notify', pomoSettings.notifications.toString());

        resetPomodoro();
        closeModal();
        showToast('Pomodoro settings updated!', 'success');
      },
      'reset-pomo-timer': () => {
        resetPomodoro();
        closeModal();
      },
      'focus-task': () => {
        const taskText = actionEl.dataset.text || '';
        togglePomodoro(taskText);
      },
      'schedule-revision': () => scheduleSpacedRevision(id),
      'toggle-voice': () => toggleVoiceInput(),
      'open-heatmap-modal': () => openHeatmapModal(),
      'open-master-explorer': () => openMasterExplorerModal(),
      'set-explorer-time': () => {
        explorerTimeFilter = id;
        renderMasterExplorerModalContent();
      },
      'set-explorer-status': () => {
        explorerStatusFilter = id;
        renderMasterExplorerModalContent();
      },
      'open-exam-settings': () => openExamSettingsModal(),
      'save-exam-settings': () => {
        const nameInp = $('#exam-name-input');
        const dateInp = $('#exam-date-input');
        if (dateInp && dateInp.value) {
          S.examDate = dateInp.value;
          S.examName = (nameInp && nameInp.value.trim()) || 'Exam';
          localStorage.setItem('planner-exam-date', S.examDate);
          localStorage.setItem('planner-exam-name', S.examName);
          vibrate(15);
          showToast(`Target set: ${S.examName} on ${S.examDate}`, 'success');
          closeModal();
          render();
        }
      },
      'clear-exam-settings': () => {
        S.examDate = '';
        S.examName = '';
        localStorage.removeItem('planner-exam-date');
        localStorage.removeItem('planner-exam-name');
        showToast('Exam countdown cleared', 'info');
        closeModal();
        render();
      },
      'filter-by-tag': () => {
        const tag = actionEl.dataset.tag;
        if (tag) {
          vibrate(10);
          activeTagFilter = tag;
          render();
        }
      },
      'clear-tag-filter': () => {
        activeTagFilter = null;
        render();
      },
      'open-cloud-sync': () => openCloudSyncModal(),
      'google-sign-in': async () => {
        if (!auth) {
          showToast('Firebase Auth not available offline', 'danger');
          return;
        }
        try {
          const provider = new firebase.auth.GoogleAuthProvider();
          const res = await auth.signInWithPopup(provider);
          currentUser = res.user;
          vibrate([20, 40, 20]);
          showToast(`Signed in as ${currentUser.displayName || currentUser.email}`, 'success');
          updateCloudSyncListener();
          closeModal();
        } catch (err) {
          showToast(err.message || 'Google sign-in failed', 'danger');
        }
      },
      'google-sign-out': async () => {
        if (auth) {
          await auth.signOut();
          currentUser = null;
          showToast('Signed out of Google account', 'info');
          updateCloudSyncListener();
          closeModal();
        }
      },
      'save-sync-code': () => {
        const input = $('#sync-code-input');
        if (input && input.value.trim()) {
          activeSyncCode = input.value.trim().toUpperCase();
          localStorage.setItem('planner-sync-code', activeSyncCode);
          vibrate(15);
          showToast(`Connected to sync code: ${activeSyncCode}`, 'success');
          updateCloudSyncListener();
          closeModal();
        }
      },
      'disconnect-sync-code': () => {
        activeSyncCode = '';
        localStorage.removeItem('planner-sync-code');
        showToast('Sync code disconnected', 'info');
        updateCloudSyncListener();
        closeModal();
      },
      'request-browser-persistence': async () => {
        await requestPersistentStorage();
        if (isPersistentStorageGranted) {
          showToast('Persistent storage granted by browser!', 'success');
        } else {
          showToast('Browser storage active', 'info');
        }
        openCloudSyncModal();
      },
      'open-calendar': () => {
        calendarCursor =
          scope === 'month' ? anchor.slice(0, 4) + '-01-01' : anchor.slice(0, 8) + '01';
        openCalendarModal();
      },
      'cal-prev-month': () => {
        calendarCursor = addM(calendarCursor, -1);
        openCalendarModal();
      },
      'cal-next-month': () => {
        calendarCursor = addM(calendarCursor, 1);
        openCalendarModal();
      },
      'cal-prev-year': () => {
        calendarCursor = +calendarCursor.slice(0, 4) - 1 + '-01-01';
        openCalendarModal();
      },
      'cal-next-year': () => {
        calendarCursor = +calendarCursor.slice(0, 4) + 1 + '-01-01';
        openCalendarModal();
      },
      'cal-pick-date': () => {
        anchor = id;
        closeModal();
        render();
      },
      'cal-jump-today': () => {
        anchor = T();
        closeModal();
        render();
      },
      'open-share': () => openShareModal(),
      'open-backup': () => openBackupModal(),
      'set-export-scope': () => {
        exportScope = id;
        renderBackupModalContent();
      },
      'open-shortcuts': () => openShortcutsModal(),
      'modal-close': () => closeModal(),
      'copy-share-link': async () => {
        const input = $('#share-link-input');
        if (input) {
          input.select();
          try {
            await navigator.clipboard.writeText(input.value);
            $('#share-msg').textContent = 'Link copied to clipboard!';
            showToast('Shareable link copied!', 'success');
          } catch (err) {
            document.execCommand('copy');
            $('#share-msg').textContent = 'Link selected. Press copy.';
          }
        }
      },
      'download-text-file': () => {
        const isAll = exportScope === 'all';
        const textData = generateFormattedTextString(isAll);
        const blob = new Blob([textData], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kaizen-${isAll ? 'master-archive' : scope + '-' + anchor}.txt`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        vibrate(15);
        showToast('Formatted Text (.txt) file downloaded!', 'success');
      },
      'copy-formatted-text': async () => {
        const textarea = $('#formatted-text-textarea');
        if (textarea) {
          textarea.select();
          try {
            await navigator.clipboard.writeText(textarea.value);
            showToast('Formatted text copied to clipboard!', 'success');
          } catch (err) {
            document.execCommand('copy');
          }
        }
      },
      'download-html-file': () => {
        const isAll = exportScope === 'all';
        const htmlContent = generatePrintableHtml(isAll);
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kaizen-${isAll ? 'master-archive' : scope + '-' + anchor}.html`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        vibrate(15);
        showToast('Clean Document (.html) downloaded!', 'success');
      },
      'download-json-file': () => {
        const isAll = exportScope === 'all';
        const payload = isAll ? S : { scope, anchor, items: getVisibleItems() };
        const jsonBlob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(jsonBlob);
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', url);
        downloadAnchor.setAttribute('download', `kaizen-${isAll ? 'master-archive' : scope + '-' + anchor}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        vibrate(15);
        showToast('Backup JSON file downloaded', 'success');
      },
      'copy-backup-json': async () => {
        const textarea = $('#backup-textarea');
        if (textarea) {
          textarea.select();
          try {
            await navigator.clipboard.writeText(textarea.value);
            $('#backup-msg').textContent = 'JSON copied to clipboard.';
            showToast('Backup JSON copied!', 'success');
          } catch (err) {
            document.execCommand('copy');
          }
        }
      },
      'restore-backup-json': () => {
        const textarea = $('#backup-textarea');
        const msg = $('#backup-msg');
        try {
          const parsed = JSON.parse(textarea.value);
          if (!parsed || !Array.isArray(parsed.items)) throw new Error();
          if (!pendingRestore) {
            pendingRestore = true;
            msg.textContent = '⚠️ Click Restore again to confirm overwriting current data.';
            return;
          }
          parsed.items.forEach((t) => (t.subs = t.subs || []));
          pendingRestore = false;
          S = parsed;
          save();
          closeModal();
          render();
          showToast('Data restored successfully!', 'success');
        } catch (err) {
          msg.textContent = 'Invalid JSON backup format.';
        }
      },
      'print-planner': () => {
        const isAll = exportScope === 'all';
        vibrate(15);
        showToast('Preparing clean document for print/PDF...', 'info');
        printTaskDocument(isAll);
      },
      'import-shared': () => {
        if (sharedDataBackup) {
          save();
          isSharedView = false;
          sharedDataBackup = null;
          window.location.hash = '';
          render();
          showToast('Shared plan imported to your storage!', 'success');
        }
      },
      'exit-shared': () => {
        if (sharedDataBackup) {
          S = sharedDataBackup;
          isSharedView = false;
          sharedDataBackup = null;
          window.location.hash = '';
          render();
          showToast('Exited shared view', 'info');
        }
      },
      'jump-to-task': () => {
        const taskScope = actionEl.dataset.scope;
        const taskKey = actionEl.dataset.key;
        scope = taskScope;
        anchor = taskScope === 'month' ? taskKey + '-01' : taskKey;
        closeModal();
        render();
      }
    };

    if (action !== 'delete-item') pendingDeleteId = null;

    if (Actions[action]) {
      Actions[action]();
    }
  });

  // --- Tab switching in Modals ---
  document.addEventListener('click', (e) => {
    const tabBtn = e.target.closest('.tab-btn');
    if (!tabBtn) return;
    const tabId = tabBtn.dataset.tab;

    $$('.tab-btn').forEach((b) => b.classList.remove('active'));
    $$('.tab-content').forEach((c) => c.classList.remove('active'));

    tabBtn.classList.add('active');
    const targetContent = document.getElementById(tabId);
    if (targetContent) targetContent.classList.add('active');
  });

  // --- Keyboard Event Listeners ---
  document.addEventListener('keydown', (e) => {
    const target = e.target;
    const isInputFocused = ['INPUT', 'TEXTAREA'].includes(target.tagName);

    if (target.id === 'new-task-input' && e.key === 'Enter' && target.value.trim()) {
      S.items.push({
        id: uid(),
        scope,
        key: currentKey(),
        text: target.value.trim(),
        done: false,
        subs: []
      });
      vibrate(10);
      save();
      render();
      const newInp = $('#new-task-input');
      if (newInp) newInp.focus();
      return;
    }

    if (target.dataset && target.dataset.subFor && e.key === 'Enter' && target.value.trim()) {
      const [parentTask] = findTaskOrSub(target.dataset.subFor);
      if (parentTask) {
        parentTask.subs = parentTask.subs || [];
        parentTask.subs.push({
          id: uid(),
          text: target.value.trim(),
          done: false
        });
        focusNewSubId = target.dataset.subFor;
        vibrate(10);
        save();
        render();
      }
      return;
    }

    if (target.id === 'edit-task-input') {
      if (e.key === 'Enter') commitEdit(target);
      if (e.key === 'Escape') {
        editingId = null;
        render();
      }
      return;
    }

    if (!isInputFocused) {
      const isModalOpen = $('#modal-dialog') && $('#modal-dialog').open;

      if (e.key === 'Escape' && isModalOpen) {
        closeModal();
        return;
      }

      if (!isModalOpen) {
        if (e.key === 'n' || e.key === 'N') {
          e.preventDefault();
          const newInp = $('#new-task-input');
          if (newInp) newInp.focus();
        } else if (e.key === 't' || e.key === 'T') {
          e.preventDefault();
          anchor = T();
          render();
        } else if (e.key === 'p' || e.key === 'P') {
          e.preventDefault();
          togglePomodoro();
        } else if (e.key === 'e' || e.key === 'E' || e.key === '/') {
          e.preventDefault();
          openMasterExplorerModal();
        } else if (e.key === 'h' || e.key === 'H') {
          e.preventDefault();
          openHeatmapModal();
        } else if (e.key === '1') {
          scope = 'day';
          render();
        } else if (e.key === '2') {
          scope = 'week';
          render();
        } else if (e.key === '3') {
          scope = 'month';
          render();
        } else if (e.key === 'j' || e.key === 'J' || e.key === 'ArrowLeft') {
          shiftDate(-1);
        } else if (e.key === 'k' || e.key === 'K' || e.key === 'ArrowRight') {
          shiftDate(1);
        } else if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          openShareModal();
        } else if (e.key === '?') {
          e.preventDefault();
          openShortcutsModal();
        }
      }
    }
  });

  document.addEventListener('focusout', (e) => {
    const target = e.target;
    if (target.id === 'edit-task-input' && editingId) commitEdit(target);
  });

  window.addEventListener('hashchange', () => {
    parseUrlHash();
    render();
  });

  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('./sw.js')
        .then((reg) => console.log('Task Planner PWA Service Worker Registered', reg.scope))
        .catch((err) => console.warn('Service Worker registration failed:', err));
    });
  }

  // --- Async Boot & Hydration ---
  (async function boot() {
    initTheme();
    parseUrlHash();
    await initIndexedDB();

    if ((!S || !S.items || S.items.length === 0) && idb) {
      const idbState = await loadFromIndexedDB();
      if (idbState && idbState.items && idbState.items.length > 0) {
        S.items = idbState.items;
        S.lastUpdated = idbState.lastUpdated || Date.now();
        saveToLocalStorage(false);
      }
    }

    requestPersistentStorage();
    initFirebase();
    render();
  })();
})();
