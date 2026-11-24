/**
 * LinguaCall Pro - Conexão WebRTC com Grade Desktop & Mobile,
 * PWA Service Worker, Vocabulário Salvo, Beep Sonoro, Temas Visuais,
 * Filtros de Câmera, Controle de Volume, Tela Cheia e Créditos para Kaynan Monteiro.
 */

document.addEventListener('DOMContentLoaded', () => {
  try {
    if (window.lucide) lucide.createIcons();
  } catch(e) {}

  function on(idOrEl, event, callback) {
    const el = typeof idOrEl === 'string' ? document.getElementById(idOrEl) : idOrEl;
    if (el) {
      el.addEventListener(event, callback);
    }
  }

  // ==========================================
  // PWA REGISTRO & INSTALL
  // ==========================================
  let deferredPrompt = null;
  let pendingAppReload = false;
  const btnInstallPwa = document.getElementById('btnInstallPwa');

  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('./sw.js').then((reg) => {
      console.log('PWA Service Worker registrado com sucesso!');
      // Busca um service worker novo a cada abertura e recarrega uma vez
      // quando ele assume — é assim que a correção chega sem "limpar cache".
      reg.update().catch(() => {});
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            const activeCallScreen = document.getElementById('callScreen');
            if (activeCallScreen && !activeCallScreen.classList.contains('hidden')) {
              pendingAppReload = true;
              showNotification('Atualização pronta. Ela será aplicada ao encerrar a chamada.');
            } else {
              window.location.reload();
            }
          }
        });
      });
    }).catch(err => console.warn('Service Worker erro:', err));
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (btnInstallPwa) {
      btnInstallPwa.classList.remove('hidden');
    }
  });

  on(btnInstallPwa, 'click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        btnInstallPwa.classList.add('hidden');
      }
      deferredPrompt = null;
    }
  });

  // Aviso de protocolo file://
  const isFileProtocol = window.location.protocol === 'file:';
  const fileProtocolWarning = document.getElementById('fileProtocolWarning');
  if (isFileProtocol && fileProtocolWarning) {
    fileProtocolWarning.classList.remove('hidden');
  }

  // Elementos do Layout
  const mainHeader = document.getElementById('mainHeader');
  const lobbyScreen = document.getElementById('lobbyScreen');
  const callScreen = document.getElementById('callScreen');
  const connectionStatusBadge = document.getElementById('connectionStatusBadge');
  const connectionStatusText = document.getElementById('connectionStatusText');
  const callTimerDisplay = document.getElementById('callTimerDisplay');
  const reactionOverlay = document.getElementById('reactionOverlay');
  
  // Lobby Inputs
  const inputUserName = document.getElementById('inputUserName');
  const selectSpeakLang = document.getElementById('selectSpeakLang');
  const selectTargetLang = document.getElementById('selectTargetLang');
  const checkStartWithVideo = document.getElementById('checkStartWithVideo');
  const inputRoomCode = document.getElementById('inputRoomCode');

  // Seletores Rápidos Dentro da Chamada
  const inCallSpeakLang = document.getElementById('inCallSpeakLang');
  const inCallTargetLang = document.getElementById('inCallTargetLang');

  // Mídia Local
  const localVideo = document.getElementById('localVideo');
  const localSecondVideo = document.getElementById('localSecondVideo');
  const localAvatarBox = document.getElementById('localAvatarBox');
  const localUserNameDisplay = document.getElementById('localUserNameDisplay');
  const localUserAvatar = document.getElementById('localUserAvatar');
  const localLangBadge = document.getElementById('localLangBadge');
  const localAudioWave = document.getElementById('localAudioWave');
  const localLiveCaptionOverlay = document.getElementById('localLiveCaptionOverlay');
  const localLiveCaptionText = document.getElementById('localLiveCaptionText');
  const btnMirrorLocalVideo = document.getElementById('btnMirrorLocalVideo');
  const btnToggleDualCamera = document.getElementById('btnToggleDualCamera');

  // Mídia Remota
  const remoteVideo = document.getElementById('remoteVideo');
  const remoteAvatarBox = document.getElementById('remoteAvatarBox');
  const remoteUserNameDisplay = document.getElementById('remoteUserNameDisplay');
  const remoteUserAvatar = document.getElementById('remoteUserAvatar');
  const remoteLangBadge = document.getElementById('remoteLangBadge');
  const remoteAudioWave = document.getElementById('remoteAudioWave');
  const remoteStatusIndicator = document.getElementById('remoteStatusIndicator');
  
  // Legendas Sobrepostas na Tela
  const remoteLiveCaptionOverlay = document.getElementById('remoteLiveCaptionOverlay');
  const remoteLiveCaptionSpeaker = document.getElementById('remoteLiveCaptionSpeaker');
  const remoteLiveCaptionTranslated = document.getElementById('remoteLiveCaptionTranslated');
  const remoteLiveCaptionOriginal = document.getElementById('remoteLiveCaptionOriginal');

  // Controles da Chamada
  const btnToggleMic = document.getElementById('btnToggleMic');
  const iconMic = document.getElementById('iconMic');
  const btnToggleCamera = document.getElementById('btnToggleCamera');
  const iconCamera = document.getElementById('iconCamera');
  const btnShareScreen = document.getElementById('btnShareScreen');
  const btnToggleTTS = document.getElementById('btnToggleTTS');
  const btnRecordCall = document.getElementById('btnRecordCall');
  const iconRecord = document.getElementById('iconRecord');

  // Gaveta de Chat e Abas de Vocabulário
  const chatDrawer = document.getElementById('chatDrawer');
  const chatNotificationBadge = document.getElementById('chatNotificationBadge');
  const transcriptList = document.getElementById('transcriptList');
  const inputChatFallback = document.getElementById('inputChatFallback');
  const tabChatAll = document.getElementById('tabChatAll');
  const tabChatSaved = document.getElementById('tabChatSaved');
  const savedVocabCount = document.getElementById('savedVocabCount');

  // Modais
  const settingsModal = document.getElementById('settingsModal');
  const savedCallsModal = document.getElementById('savedCallsModal');
  const viewSpecificCallModal = document.getElementById('viewSpecificCallModal');
  const statsModal = document.getElementById('statsModal');
  const filtersModal = document.getElementById('filtersModal');
  const aboutCreatorModal = document.getElementById('aboutCreatorModal');
  const savedCallsList = document.getElementById('savedCallsList');

  // Estado da Aplicação
  const state = {
    userName: localStorage.getItem('lc_user_name') || 'Você',
    speakLang: localStorage.getItem('lc_speak_lang') || 'pt-BR',
    targetLang: localStorage.getItem('lc_target_lang') || 'pt',
    engine: 'google',
    autoRestartSpeech: localStorage.getItem('lc_continuous_recognition') !== 'false',
    enableBeep: localStorage.getItem('lc_beep') !== 'false',
    enableBlur: localStorage.getItem('lc_blur_bg') === 'true',
    autoReconnect: localStorage.getItem('lc_auto_reconnect') !== 'false',
    currentThemeIdx: 0,
    activeTab: 'all', // 'all' ou 'saved'
    
    peer: null,
    call: null,
    dataConnection: null,
    localStream: null,
    localSecondStream: null,
    remoteStream: null,
    screenStream: null,
    roomId: null,
    callActive: false,
    hasConnectedBefore: false,
    remotePeerId: null,
    isInitiator: false,
    isReconnecting: false,
    reconnectAttempts: 0,
    reconnectTimer: null,
    reconnectCheckTimer: null,
    
    isMuted: false,
    isVideoEnabled: true,
    isMirrored: localStorage.getItem('lc_mirror') !== 'false',
    isDualCameraActive: false,
    currentFacingMode: 'user',
    isSharingScreen: false,
    ttsEnabled: false,
    isChatDrawerOpen: false,
    
    // Gravação
    mediaRecorder: null,
    recordedChunks: [],
    isRecording: false,
    
    // Cronômetro
    callStartTime: null,
    timerInterval: null,
    
    // HISTÓRICO ISOLADO DA CHAMADA ATUAL
    transcriptHistory: [],
    savedVocab: []
  };

  if (inputUserName) inputUserName.value = state.userName;
  if (selectSpeakLang) selectSpeakLang.value = state.speakLang;
  if (selectTargetLang) selectTargetLang.value = state.targetLang;
  if (inCallSpeakLang) inCallSpeakLang.value = state.speakLang;
  if (inCallTargetLang) inCallTargetLang.value = state.targetLang;
  
  const checkAudioBeep = document.getElementById('checkAudioBeep');
  const checkBackgroundBlur = document.getElementById('checkBackgroundBlur');
  const checkAutoReconnect = document.getElementById('checkAutoReconnect');
  const checkContinuousRecognition = document.getElementById('checkContinuousRecognition');
  if (checkAudioBeep) checkAudioBeep.checked = state.enableBeep;
  if (checkBackgroundBlur) checkBackgroundBlur.checked = state.enableBlur;
  if (checkAutoReconnect) checkAutoReconnect.checked = state.autoReconnect;
  if (checkContinuousRecognition) checkContinuousRecognition.checked = state.autoRestartSpeech;

  applyMirrorSetting();
  applyBlurSetting();

  const urlParams = new URLSearchParams(window.location.search);
  const roomFromUrl = urlParams.get('room');
  if (roomFromUrl && inputRoomCode) inputRoomCode.value = roomFromUrl;

  // ==========================================
  // BEEP SONORO SUAVE (WEB AUDIO SYNTH)
  // ==========================================
  function playSoftBeep() {
    if (!state.enableBeep) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch(e) {}
  }

  // ==========================================
  // ALTERNADOR DE TEMAS VISUAIS
  // ==========================================
  const themes = [
    { name: 'Escuro', vars: { '--bg': '#0a0f14', '--surface': '#101820', '--raised': '#16222d', '--line': '#24323f', '--fg': '#f5f7fa', '--muted': '#94a3b8', '--accent': '#14b8a6', '--accent-strong': '#2dd4bf', '--accent-soft': '#5eead4', '--accent-ink': '#03211d' } },
    { name: 'Grafite', vars: { '--bg': '#11161b', '--surface': '#182029', '--raised': '#202b36', '--line': '#2e3b48', '--fg': '#eef2f6', '--muted': '#a0adba', '--accent': '#14b8a6', '--accent-strong': '#2dd4bf', '--accent-soft': '#5eead4', '--accent-ink': '#03211d' } },
    { name: 'Claro', vars: { '--bg': '#f4f7f8', '--surface': '#ffffff', '--raised': '#edf2f4', '--line': '#dbe4e8', '--fg': '#102027', '--muted': '#60717c', '--accent': '#0d9488', '--accent-strong': '#0f766e', '--accent-soft': '#0f766e', '--accent-ink': '#ecfdf5' } }
  ];
  function applyTheme(idx) {
    const t = themes[idx];
    Object.entries(t.vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
    document.documentElement.setAttribute('data-theme', t.name.toLowerCase());
    try { localStorage.setItem('linguacall-theme', String(idx)); } catch (e) {}
  }
  // Aplica o tema salvo assim que o app abre
  try {
    const saved = parseInt(localStorage.getItem('linguacall-theme'), 10);
    if (!isNaN(saved) && themes[saved]) { state.currentThemeIdx = saved; applyTheme(saved); }
  } catch (e) {}
  on('btnToggleTheme', 'click', () => {
    state.currentThemeIdx = (state.currentThemeIdx + 1) % themes.length;
    applyTheme(state.currentThemeIdx);
    showNotification('Tema: ' + themes[state.currentThemeIdx].name);
  });

  // ==========================================
  // ABAS DE HISTÓRICO & VOCABULÁRIO SALVO
  // ==========================================
  on(tabChatAll, 'click', () => {
    state.activeTab = 'all';
    tabChatAll.className = 'flex-1 h-9 border-b-2 border-accent-500 text-neutral-100';
    tabChatSaved.className = 'flex-1 h-9 border-b-2 border-transparent text-neutral-500 hover:text-neutral-300';
    document.getElementById('tabChatLive').className = 'flex-1 h-9 border-b-2 border-transparent text-neutral-500 hover:text-neutral-300';
    switchChatPanel();
  });

  on(tabChatSaved, 'click', () => {
    state.activeTab = 'saved';
    tabChatSaved.className = 'flex-1 h-9 border-b-2 border-accent-500 text-neutral-100';
    tabChatAll.className = 'flex-1 h-9 border-b-2 border-transparent text-neutral-500 hover:text-neutral-300';
    document.getElementById('tabChatLive').className = 'flex-1 h-9 border-b-2 border-transparent text-neutral-500 hover:text-neutral-300';
    switchChatPanel();
  });

  on('tabChatLive', 'click', () => {
    state.activeTab = 'live';
    document.getElementById('tabChatLive').className = 'flex-1 h-9 border-b-2 border-accent-500 text-neutral-100';
    tabChatAll.className = 'flex-1 h-9 border-b-2 border-transparent text-neutral-500 hover:text-neutral-300';
    tabChatSaved.className = 'flex-1 h-9 border-b-2 border-transparent text-neutral-500 hover:text-neutral-300';
    switchChatPanel();
  });

  function switchChatPanel() {
    const livePanel = document.getElementById('liveCaptionPanel');
    if (state.activeTab === 'live') {
      transcriptList?.classList.add('hidden');
      livePanel?.classList.remove('hidden');
    } else {
      livePanel?.classList.add('hidden');
      transcriptList?.classList.remove('hidden');
      renderTranscriptList();
    }
  }

  function toggleSaveVocab(idx) {
    const item = state.transcriptHistory[idx];
    if (!item) return;
    item.isSaved = !item.isSaved;
    updateSavedVocabCount();
    renderTranscriptList();
    showNotification(item.isSaved ? 'Frase salva no seu vocabulário!' : 'Frase removida do vocabulário.');
  }

  function updateSavedVocabCount() {
    const count = state.transcriptHistory.filter(m => m.isSaved).length;
    if (savedVocabCount) savedVocabCount.textContent = count;
  }

  function renderTranscriptList() {
    if (!transcriptList) return;
    transcriptList.innerHTML = '';

    const itemsToDisplay = state.activeTab === 'saved' 
      ? state.transcriptHistory.filter(m => m.isSaved)
      : state.transcriptHistory;

    if (itemsToDisplay.length === 0) {
      const msg = state.activeTab === 'saved'
        ? 'Nenhuma frase favoritada ainda.<br>Clique no ícone de marcador nas falas para salvar expressões aqui.'
        : 'Tudo o que for conversado e traduzido nesta chamada ficará gravado aqui.';
      transcriptList.innerHTML = `<div class="text-center py-8 text-neutral-500 text-xs">${msg}</div>`;
      return;
    }

    itemsToDisplay.forEach((item, index) => {
      const realIndex = state.transcriptHistory.indexOf(item);
      const div = document.createElement('div');
      div.className = `p-2.5 rounded-lg border ${
        item.isSelf ? 'bg-accent-950/40 border-accent-900/60 ml-2' : 'bg-neutral-950/70 border-neutral-800 mr-2'
      }`;

      const senderColor = item.isSelf ? 'text-accent-400' : 'text-ok-400';
      const mainText = item.isSelf ? item.original : (item.translated || item.original);
      const subText = (!item.isSelf && item.translated) ? `Original: ${item.original}` : '';
      const errorText = item.translationError
        ? `<div class="text-[10px] text-danger-400 mt-1">${escapeHtml(item.translationError)}</div>` : '';
      const bookmarkColor = item.isSaved ? 'text-accent-400 fill-amber-400' : 'text-neutral-500 hover:text-accent-400';

      div.innerHTML = `
        <div class="flex items-center justify-between mb-1">
          <span class="font-bold ${senderColor}">${escapeHtml(item.sender)}</span>
          <div class="flex items-center gap-1.5">
            <span class="text-[10px] text-neutral-500">${item.timestamp}</span>
            <button class="btnBookmarkVocab p-0.5 ${bookmarkColor} transition" data-idx="${realIndex}" title="Favoritar/Salvar Frase">
              <i data-lucide="bookmark" class="w-3 h-3"></i>
            </button>
          </div>
        </div>
        <div class="text-neutral-100 font-medium">${escapeHtml(mainText)}</div>
        ${subText ? `<div class="text-[10px] text-neutral-400 italic mt-0.5">${escapeHtml(subText)}</div>` : ''}
        ${errorText}
      `;
      transcriptList.appendChild(div);
    });

    try { lucide.createIcons(); } catch(e) {}

    document.querySelectorAll('.btnBookmarkVocab').forEach(b => {
      b.addEventListener('click', () => {
        const idx = parseInt(b.dataset.idx);
        toggleSaveVocab(idx);
      });
    });

    transcriptList.scrollTop = transcriptList.scrollHeight;
  }

  // ==========================================
  // VOLUME, FILTROS, TELA CHEIA E PUSH-TO-TALK
  // ==========================================
  on('sliderRemoteVolume', 'input', (e) => {
    const vol = parseFloat(e.target.value) / 100;
    if (remoteVideo) remoteVideo.volume = vol;
  });

  on('btnCameraFilters', 'click', () => {
    if (filtersModal) filtersModal.classList.remove('hidden');
  });
  on('btnCloseFiltersModal', 'click', () => {
    if (filtersModal) filtersModal.classList.add('hidden');
  });
  document.querySelectorAll('.btnApplyFilter').forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      if (localVideo) localVideo.style.filter = filter;
      filtersModal?.classList.add('hidden');
      showNotification('Filtro aplicado!');
    });
  });

  on('btnToggleFullscreen', 'click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  // Botão de teste do microfone DENTRO da chamada (útil quando o colega não ouve)
  on('btnTestMicInCall', 'click', async () => {
    if (!state.localStream) {
      showNotification('Microfone não está ativo. Saia e entre de novo liberando o microfone.');
      return;
    }
    const track = state.localStream.getAudioTracks()[0];
    if (!track) {
      showNotification('Nenhuma faixa de áudio encontrada.');
      return;
    }

    // 1) Volume real captado pelo microfone
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      ctx.createMediaStreamSource(new MediaStream([track])).connect(analyser);
      analyser.fftSize = 64;
      const arr = new Uint8Array(analyser.frequencyBinCount);
      let peak = 0;
      let ticks = 0;
      showNotification('Fale algo: medindo o microfone...');
      const timer = setInterval(() => {
        analyser.getByteFrequencyData(arr);
        let sum = 0;
        for (let i = 0; i < arr.length; i++) sum += arr[i];
        peak = Math.max(peak, sum / arr.length);
        if (++ticks >= 20) {
          clearInterval(timer);
          ctx.close().catch(() => {});
          if (peak < 6) {
            alert('O microfone está captando quase nada.\n\nVerifique: 1) se o microfone está mutado; 2) se outro app está usando o microfone; 3) a permissão do microfone no navegador.');
          } else {
            showNotification('Microfone OK! O problema pode estar no áudio do colega.');
          }
        }
      }, 100);
    } catch (e) {}

    // 2) Estado das faixas que estão sendo enviadas
    const audioTracks = state.localStream.getAudioTracks();
    const muted = state.isMuted || audioTracks.some(t => !t.enabled);
    const live = audioTracks.some(t => t.readyState === 'live');
    if (muted) showNotification('Atenção: seu microfone está MUTADO.');
    else if (!live) showNotification('Atenção: a faixa de áudio caiu. Saia e entre de novo.');
    else showNotification('Microfone ligado e enviando áudio.');
  });

  on('btnSpeakMyText', 'click', async () => {
    const text = inputChatFallback ? inputChatFallback.value.trim() : '';
    if (!text) {
      showNotification('Digite uma mensagem antes.');
      return;
    }
    const sent = sendData({
      type: 'remote_tts',
      sender: state.userName,
      text,
      lang: state.speakLang
    });
    if (!sent) {
      showNotification('Colega desconectado. A mensagem não foi enviada.');
      return;
    }
    inputChatFallback.value = '';
    showNotification('Mensagem enviada para ser lida no idioma do colega.');

    addTranscriptItem({
      sender: state.userName + ' (Voz)',
      isSelf: true,
      original: text,
      translated: null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  });

  // ==========================================
  // ARQUIVAMENTO DE REUNIÕES PASSADAS
  // ==========================================
  function saveCallToArchive(roomId, durationStr, history) {
    if (!history || history.length === 0) return;
    try {
      const existing = JSON.parse(localStorage.getItem('lc_saved_calls') || '[]');
      const newRecord = {
        id: roomId || 'sala-' + Date.now().toString(36),
        date: new Date().toLocaleString(),
        duration: durationStr || '00:00',
        totalSpeeches: history.length,
        messages: history
      };
      existing.unshift(newRecord);
      localStorage.setItem('lc_saved_calls', JSON.stringify(existing.slice(0, 40)));
    } catch(e) {}
  }

  // ==========================================
  // BUSCA NO HISTÓRICO DE REUNIÕES ANTIGAS
  // ==========================================
  function normalizeSearch(text) {
    return (text || '').toString().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function renderSavedCallsList(query = '') {
    if (!savedCallsList) return;
    savedCallsList.innerHTML = '';
    const records = JSON.parse(localStorage.getItem('lc_saved_calls') || '[]');
    const q = normalizeSearch(query).trim();
    const summaryEl = document.getElementById('searchCallsSummary');

    if (records.length === 0) {
      if (summaryEl) summaryEl.classList.add('hidden');
      savedCallsList.innerHTML = '<div class="text-center py-8 text-neutral-500">Nenhuma reunião finalizada ainda.<br>Quando você fizer uma ligação, ela aparecerá arquivada aqui.</div>';
      return;
    }

    if (!q) {
      if (summaryEl) summaryEl.classList.add('hidden');
      records.forEach((rec, idx) => savedCallsList.appendChild(buildCallRow(rec, idx, records)));
    } else {
      // Busca dentro de todas as falas de todas as reuniões
      let totalHits = 0;
      const matches = [];

      records.forEach((rec) => {
        (rec.messages || []).forEach((m) => {
          const haystack = normalizeSearch(`${m.original || ''} ${m.translated || ''} ${m.sender || ''}`);
          if (haystack.includes(q)) {
            matches.push({ rec: rec, msg: m });
            totalHits++;
          }
        });
      });

      if (summaryEl) {
        summaryEl.classList.remove('hidden');
        summaryEl.innerHTML = totalHits === 0
          ? `Nenhuma fala encontrada para <span class="text-neutral-200 font-semibold">"${escapeHtml(query)}"</span>.`
          : `<span class="text-ok-400 font-semibold">${totalHits}</span> fala(s) encontrada(s) em <span class="text-ok-400 font-semibold">${new Set(matches.map(x => x.rec.id)).size}</span> reunião(ões).`;
      }

      if (totalHits === 0) {
        savedCallsList.innerHTML = '<div class="text-center py-6 text-neutral-500 text-xs">Tente buscar por outra palavra da fala.</div>';
        return;
      }

      matches.slice(0, 200).forEach(({ rec, msg }) => {
        const realIdx = records.indexOf(rec);
        const div = document.createElement('div');
        div.className = 'p-2.5 bg-neutral-950 border border-ok-900/50 rounded-lg cursor-pointer hover:border-ok-600/60 transition';
        div.innerHTML = `
          <div class="flex items-center justify-between text-[10px] text-neutral-500 mb-1">
            <span class="text-accent-300 font-semibold">Sala: ${escapeHtml(rec.id)}</span>
            <span>${escapeHtml(rec.date || '')}</span>
          </div>
          <div class="text-[11px] font-semibold ${msg.isSelf ? 'text-accent-400' : 'text-ok-400'}">${escapeHtml(msg.sender || '')} <span class="text-neutral-500 font-normal">${escapeHtml(msg.timestamp || '')}</span></div>
          <div class="text-white mt-0.5">${highlightText(msg.translated || msg.original || '', query)}</div>
          ${msg.original && msg.translated ? `<div class="text-[10px] text-neutral-400 italic mt-0.5">Original: ${escapeHtml(msg.original)}</div>` : ''}
        `;
        div.addEventListener('click', () => openSpecificCallView(records[realIdx]));
        savedCallsList.appendChild(div);
      });
    }

    bindSavedCallActions(records);
  }

  function buildCallRow(rec, idx, records) {
    const item = document.createElement('div');
    item.className = 'p-3 bg-neutral-950 border border-neutral-800 rounded-lg flex items-center justify-between hover:border-neutral-700 transition';
    item.innerHTML = `
      <div class="flex-1 pr-3">
        <div class="font-bold text-white flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-accent-500"></span>
          <span>Sala: ${escapeHtml(rec.id)}</span>
        </div>
        <div class="text-[11px] text-neutral-400 mt-0.5">
          ${escapeHtml(rec.date || '')} • Duração: ${escapeHtml(rec.duration || '00:00')} • ${rec.totalSpeeches || 0} falas
        </div>
      </div>
      <div class="flex items-center gap-1.5">
        <button class="btnViewCall px-2.5 py-1.5 bg-accent-600 hover:bg-accent-500 text-white rounded-lg text-xs transition" data-idx="${idx}">
          Ver Chat
        </button>
        <button class="btnDeleteCall p-1.5 text-neutral-500 hover:text-danger-400 rounded-lg transition" data-idx="${idx}" title="Excluir">
          ✕
        </button>
      </div>
    `;
    return item;
  }

  function highlightText(text, query) {
    const safe = escapeHtml(text || '');
    const q = (query || '').trim();
    if (!q) return safe;
    try {
      const pattern = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return safe.replace(new RegExp(pattern, 'gi'), (m) => `<mark class="bg-accent-400/30 text-accent-200 rounded px-0.5">${m}</mark>`);
    } catch (e) {
      return safe;
    }
  }

  function bindSavedCallActions(records) {
    document.querySelectorAll('.btnViewCall').forEach(b => {
      b.addEventListener('click', () => {
        const idx = parseInt(b.dataset.idx);
        openSpecificCallView(records[idx]);
      });
    });

    document.querySelectorAll('.btnDeleteCall').forEach(b => {
      b.addEventListener('click', () => {
        const idx = parseInt(b.dataset.idx);
        records.splice(idx, 1);
        localStorage.setItem('lc_saved_calls', JSON.stringify(records));
        renderSavedCallsList(document.getElementById('inputSearchCalls')?.value || '');
      });
    });
  }

  let searchCallsTimer = null;
  const inputSearchCalls = document.getElementById('inputSearchCalls');
  if (inputSearchCalls) {
    inputSearchCalls.addEventListener('input', (e) => {
      clearTimeout(searchCallsTimer);
      const value = e.target.value;
      searchCallsTimer = setTimeout(() => renderSavedCallsList(value), 220);
    });
  }

  function openSpecificCallView(record) {
    if (!record || !viewSpecificCallModal) return;
    const title = document.getElementById('viewSpecificCallTitle');
    const sub = document.getElementById('viewSpecificCallSubtitle');
    const body = document.getElementById('viewSpecificCallBody');
    const btnDownload = document.getElementById('btnDownloadSpecificCallTxt');

    if (title) title.textContent = 'Sala: ' + record.id;
    if (sub) sub.textContent = `${record.date} • Duração: ${record.duration} • ${record.totalSpeeches} mensagens`;

    if (body) {
      body.innerHTML = '';
      record.messages.forEach(m => {
        const div = document.createElement('div');
        div.className = 'p-2.5 bg-neutral-950 border border-neutral-800 rounded-lg';
        const orig = m.original ? `<div class="text-[11px] text-neutral-400 italic mt-0.5">Original: ${escapeHtml(m.original)}</div>` : '';
        const main = m.translated || m.original;
        div.innerHTML = `
          <div class="flex justify-between text-[11px] mb-1 font-semibold">
            <span class="${m.isSelf ? 'text-accent-400' : 'text-ok-400'}">${escapeHtml(m.sender)}</span>
            <span class="text-neutral-500">${m.timestamp}</span>
          </div>
          <div class="text-white">${escapeHtml(main)}</div>
          ${orig}
        `;
        body.appendChild(div);
      });
    }

    if (btnDownload) {
      btnDownload.onclick = () => {
        let txt = `RELATORIO DA REUNIAO - LINGUACALL\nData: ${record.date}\nSala: ${record.id}\nDuracao: ${record.duration}\nCriado por Kaynan Monteiro\n\n`;
        record.messages.forEach(m => {
          txt += `[${m.timestamp}] ${m.sender}:\n  ${m.translated || m.original}\n`;
          if (m.original && m.translated) txt += `  (Original: ${m.original})\n`;
          txt += `\n`;
        });
        downloadBlob(txt, `reuniao-${record.id}.txt`, 'text/plain;charset=utf-8');
      };
    }

    savedCallsModal?.classList.add('hidden');
    viewSpecificCallModal?.classList.remove('hidden');
  }

  on('btnOpenSavedCallsModal', 'click', () => {
    renderSavedCallsList();
    if (savedCallsModal) savedCallsModal.classList.remove('hidden');
  });
  on('btnCloseSavedCallsModal', 'click', () => savedCallsModal?.classList.add('hidden'));
  on('btnCloseSavedCallsModalBtn', 'click', () => savedCallsModal?.classList.add('hidden'));
  on('btnCloseSpecificCallModal', 'click', () => {
    viewSpecificCallModal?.classList.add('hidden');
    savedCallsModal?.classList.remove('hidden');
  });
  on('btnCloseSpecificCallModalBtn', 'click', () => {
    viewSpecificCallModal?.classList.add('hidden');
    savedCallsModal?.classList.remove('hidden');
  });
  on('btnClearAllSavedCalls', 'click', () => {
    if (confirm('Deseja apagar todo o histórico de reuniões passadas?')) {
      localStorage.removeItem('lc_saved_calls');
      renderSavedCallsList();
    }
  });

  // ==========================================
  // TESTE DE MICROFONE NO LOBBY
  // ==========================================
  let micTestStream = null;
  let micTestAudioCtx = null;
  let micTestInterval = null;

  on('btnTestMicLobby', 'click', async () => {
    const btn = document.getElementById('btnTestMicLobby');
    const bar = document.getElementById('micVolumeBar');

    if (micTestStream) {
      stopMicTest();
      if (btn) btn.textContent = 'Testar áudio';
      if (bar) bar.style.width = '0%';
      return;
    }

    try {
      if (btn) btn.textContent = 'Ouvindo...';
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micTestStream = stream;

      micTestAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = micTestAudioCtx.createAnalyser();
      const source = micTestAudioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 64;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      micTestInterval = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const average = sum / dataArray.length;
        const percent = Math.min(100, Math.round((average / 128) * 100));
        if (bar) bar.style.width = percent + '%';
      }, 80);

    } catch (e) {
      alert('Não foi possível acessar o microfone para teste.');
      stopMicTest();
      if (btn) btn.textContent = 'Testar áudio';
    }
  });

  function stopMicTest() {
    if (micTestInterval) clearInterval(micTestInterval);
    if (micTestStream) {
      micTestStream.getTracks().forEach(t => t.stop());
      micTestStream = null;
    }
    if (micTestAudioCtx) {
      micTestAudioCtx.close().catch(() => {});
      micTestAudioCtx = null;
    }
  }

  // ==========================================
  // ESPELHO & CÂMERA DUPLA
  // ==========================================
  on(btnMirrorLocalVideo, 'click', () => {
    state.isMirrored = !state.isMirrored;
    localStorage.setItem('lc_mirror', state.isMirrored);
    applyMirrorSetting();
    showNotification(state.isMirrored ? 'Espelhamento ativado' : 'Espelhamento desativado');
  });

  function applyMirrorSetting() {
    if (!localVideo) return;
    if (state.isMirrored) {
      localVideo.classList.add('-scale-x-100');
      btnMirrorLocalVideo?.classList.add('text-accent-400');
    } else {
      localVideo.classList.remove('-scale-x-100');
      btnMirrorLocalVideo?.classList.remove('text-accent-400');
    }
    applyBlurSetting();
  }

  // ==========================================
  // DESFOQUE DE FUNDO (PRIVACIDADE DO AMBIENTE)
  // ==========================================
  function applyBlurSetting() {
    [localVideo, remoteVideo].forEach(v => {
      if (!v) return;
      v.classList.toggle('blur-background', state.enableBlur);
    });
    const btn = document.getElementById('btnToggleBgBlur');
    if (btn) {
      btn.classList.toggle('text-accent-300', state.enableBlur);
      btn.classList.toggle('text-neutral-300', !state.enableBlur);
      btn.title = state.enableBlur ? 'Desfocar fundo (ativado)' : 'Desfocar fundo';
    }
    if (checkBackgroundBlur) checkBackgroundBlur.checked = state.enableBlur;
  }

  function toggleBackgroundBlur(showToast = true) {
    state.enableBlur = !state.enableBlur;
    localStorage.setItem('lc_blur_bg', state.enableBlur);
    applyBlurSetting();
    if (showToast) {
      showNotification(state.enableBlur ? 'Fundo desfocado (privacidade)' : 'Desfoque de fundo desligado');
    }
  }

  on('btnToggleBgBlur', 'click', () => toggleBackgroundBlur(true));

  on(checkBackgroundBlur, 'change', (e) => {
    state.enableBlur = e.target.checked;
    localStorage.setItem('lc_blur_bg', state.enableBlur);
    applyBlurSetting();
    showNotification(state.enableBlur ? 'Fundo desfocado (privacidade)' : 'Desfoque de fundo desligado');
  });

  on(btnToggleDualCamera, 'click', async () => {
    if (!state.isVideoEnabled) {
      showNotification('Ligue a câmera principal primeiro.');
      return;
    }

    if (!state.isDualCameraActive) {
      try {
        const secondFacing = state.currentFacingMode === 'user' ? 'environment' : 'user';
        const secondStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: secondFacing, width: { ideal: 640 }, height: { ideal: 480 } }
        });
        state.localSecondStream = secondStream;
        state.isDualCameraActive = true;

        if (localSecondVideo) {
          localSecondVideo.srcObject = secondStream;
          localSecondVideo.classList.remove('hidden');
        }
        if (localVideo) {
          localVideo.classList.remove('h-full');
          localVideo.classList.add('h-1/2');
        }

        btnToggleDualCamera?.classList.add('text-ok-400');
        showNotification('Câmera dupla ativada!');
      } catch (err) {
        alert('Seu dispositivo não suporta abrir duas câmeras simultâneas no navegador.\nVocê pode usar o botão "Virar Câmera" na barra inferior para alternar!');
      }
    } else {
      stopSecondCamera();
      showNotification('Segunda câmera desativada.');
    }
  });

  function stopSecondCamera() {
    if (state.localSecondStream) {
      state.localSecondStream.getTracks().forEach(t => t.stop());
      state.localSecondStream = null;
    }
    state.isDualCameraActive = false;
    if (localSecondVideo) localSecondVideo.classList.add('hidden');
    if (localVideo) {
      localVideo.classList.remove('h-1/2');
      localVideo.classList.add('h-full');
    }
    btnToggleDualCamera?.classList.remove('text-ok-400');
  }

  // ==========================================
  // EMOJIS FLUTUANTES
  // ==========================================
  document.querySelectorAll('.btnReaction').forEach(btn => {
    btn.addEventListener('click', () => {
      const emoji = btn.dataset.emoji;
      triggerFloatingEmoji(emoji, true);
      sendData({ type: 'reaction', emoji: emoji });
    });
  });

  function triggerFloatingEmoji(emoji, isSelf = false) {
    if (!reactionOverlay) return;
    const el = document.createElement('div');
    el.className = 'absolute text-3xl select-none animate-float-up pointer-events-none z-50';
    el.style.left = isSelf ? `${Math.random() * 25 + 15}%` : `${Math.random() * 35 + 45}%`;
    el.style.bottom = '90px';
    el.textContent = emoji;
    reactionOverlay.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  }

  // ==========================================
  // GRAVAÇÃO DA CHAMADA
  // ==========================================
  on(btnRecordCall, 'click', () => {
    if (!state.isRecording) startRecording();
    else stopRecording();
  });

  function startRecording() {
    try {
      const streamToRecord = state.remoteStream || state.localStream;
      if (!streamToRecord) {
        showNotification('Nenhum vídeo ativo para gravar.');
        return;
      }

      state.recordedChunks = [];
      state.mediaRecorder = new MediaRecorder(streamToRecord, { mimeType: 'video/webm' });

      state.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) state.recordedChunks.push(e.data);
      };

      state.mediaRecorder.onstop = () => {
        const blob = new Blob(state.recordedChunks, { type: 'video/webm' });
        downloadBlob(blob, `gravacao-${state.roomId || 'reuniao'}.webm`, 'video/webm');
        showNotification('Gravação salva no seu dispositivo!');
      };

      state.mediaRecorder.start(1000);
      state.isRecording = true;
      btnRecordCall?.classList.add('bg-danger-600/30', 'text-danger-400');
      iconRecord?.setAttribute('data-lucide', 'square');
      try { lucide.createIcons(); } catch(e) {}
      showNotification('Gravação iniciada!');
    } catch (e) {
      showNotification('Gravação não suportada neste navegador.');
    }
  }

  function stopRecording() {
    if (state.mediaRecorder && state.isRecording) {
      state.mediaRecorder.stop();
      state.isRecording = false;
      btnRecordCall?.classList.remove('bg-danger-600/30', 'text-danger-400');
      iconRecord?.setAttribute('data-lucide', 'disc');
      try { lucide.createIcons(); } catch(e) {}
    }
  }

  // ==========================================
  // EXPORTAÇÃO DO HISTÓRICO
  // ==========================================
  on('btnExportTxt', 'click', () => {
    if (state.transcriptHistory.length === 0) {
      alert('Nenhuma conversa nesta chamada ainda para exportar.');
      return;
    }
    let txt = `RELATORIO DE REUNIAO - LINGUACALL PRO\nData: ${new Date().toLocaleString()}\nSala: ${state.roomId}\nCriado por Kaynan Monteiro\n\n`;
    state.transcriptHistory.forEach(m => {
      txt += `[${m.timestamp}] ${m.sender}:\n  ${m.translated || m.original}\n`;
      if (m.original && m.translated) txt += `  (Original: ${m.original})\n`;
      txt += `\n`;
    });
    downloadBlob(txt, `reuniao-${state.roomId}.txt`, 'text/plain;charset=utf-8');
  });

  on('btnExportCsv', 'click', () => {
    if (state.transcriptHistory.length === 0) {
      alert('Nenhuma conversa nesta chamada para exportar em CSV.');
      return;
    }
    let csv = `Horario,Participante,Texto Original,Texto Traduzido,Salvo no Vocabulario\n`;
    state.transcriptHistory.forEach(m => {
      const orig = `"${(m.original || '').replace(/"/g, '""')}"`;
      const trans = `"${(m.translated || m.original || '').replace(/"/g, '""')}"`;
      csv += `${m.timestamp},"${m.sender}",${orig},${trans},${m.isSaved ? 'Sim' : 'Nao'}\n`;
    });
    downloadBlob(csv, `reuniao-${state.roomId}.csv`, 'text/csv;charset=utf-8');
  });

  on('btnCopyTranscript', 'click', () => {
    if (state.transcriptHistory.length === 0) {
      alert('Nada para copiar ainda.');
      return;
    }
    let text = `Transcrição LinguaCall (${state.roomId}) - Por Kaynan Monteiro:\n\n`;
    state.transcriptHistory.forEach(m => {
      const c = m.isSelf ? m.original : `${m.translated} (Original: ${m.original})`;
      text += `[${m.timestamp}] ${m.sender}: ${c}\n`;
    });
    navigator.clipboard.writeText(text).then(() => {
      showNotification('Histórico copiado!');
    });
  });

  function downloadBlob(content, filename, type) {
    const blob = content instanceof Blob ? content : new Blob([content], { type: type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ==========================================
  // ESTATÍSTICAS DA CONVERSA
  // ==========================================
  on('btnOpenStatsModal', 'click', () => {
    if (!statsModal) return;
    const dur = callTimerDisplay ? callTimerDisplay.textContent : '00:00';
    document.getElementById('statsCallDuration').textContent = dur;
    document.getElementById('statsTotalSpeeches').textContent = state.transcriptHistory.length;

    let localCount = 0;
    let remoteCount = 0;
    state.transcriptHistory.forEach(m => {
      if (m.isSelf) localCount++; else remoteCount++;
    });

    const total = localCount + remoteCount || 1;
    const localPct = Math.round((localCount / total) * 100);
    const remotePct = 100 - localPct;

    document.getElementById('statsLocalBar').style.width = localPct + '%';
    document.getElementById('statsRemoteBar').style.width = remotePct + '%';
    document.getElementById('statsLocalPercent').textContent = `Você: ${localPct}% (${localCount})`;
    document.getElementById('statsRemotePercent').textContent = `Colega: ${remotePct}% (${remoteCount})`;

    statsModal.classList.remove('hidden');
  });
  on('btnCloseStatsModal', 'click', () => statsModal?.classList.add('hidden'));
  on('btnCloseStatsModalBtn', 'click', () => statsModal?.classList.add('hidden'));

  // ==========================================
  // TROCA DE IDIOMAS IN-CALL
  // ==========================================
  on(inCallSpeakLang, 'change', (e) => {
    state.speakLang = e.target.value;
    localStorage.setItem('lc_speak_lang', state.speakLang);
    if (selectSpeakLang) selectSpeakLang.value = state.speakLang;
    if (localLangBadge) localLangBadge.textContent = state.speakLang.split('-')[0].toUpperCase();

    // Reinicia a escuta com o idioma novo — antes ela parava e não voltava
    state.speechBlocked = false;
    restartSpeechRecognition(null);

    sendData({ type: 'lang_change', speakLang: state.speakLang });
    showNotification('Você agora fala em: ' + state.speakLang);
  });

  on(inCallTargetLang, 'change', (e) => {
    state.targetLang = e.target.value;
    localStorage.setItem('lc_target_lang', state.targetLang);
    if (selectTargetLang) selectTargetLang.value = state.targetLang;
    showNotification('Você agora lê em: ' + state.targetLang.toUpperCase());
  });

  // Gaveta Mobile
  on('btnToggleDrawerChat', 'click', () => {
    state.isChatDrawerOpen = !state.isChatDrawerOpen;
    updateChatDrawerUI();
  });
  on('btnCloseChatDrawer', 'click', () => {
    state.isChatDrawerOpen = false;
    updateChatDrawerUI();
  });
  on('btnToggleDrawerChatBar', 'click', () => {
    state.isChatDrawerOpen = !state.isChatDrawerOpen;
    updateChatDrawerUI();
  });

  function updateChatDrawerUI() {
    if (!chatDrawer) return;
    if (state.isChatDrawerOpen) {
      chatDrawer.classList.remove('translate-x-full');
      chatNotificationBadge?.classList.add('hidden');
      document.getElementById('chatNotificationBadgeBar')?.classList.add('hidden');
    } else {
      chatDrawer.classList.add('translate-x-full');
    }
  }

  // Configurações
  on('btnSettings', 'click', () => settingsModal?.classList.remove('hidden'));
  on('btnCloseSettings', 'click', () => settingsModal?.classList.add('hidden'));
  on('btnSaveSettings', 'click', () => {
    state.engine = 'google';
    state.enableBeep = checkAudioBeep ? checkAudioBeep.checked : true;
    state.autoReconnect = checkAutoReconnect ? checkAutoReconnect.checked : true;
    state.autoRestartSpeech = checkContinuousRecognition ? checkContinuousRecognition.checked : true;
    if (checkBackgroundBlur) state.enableBlur = checkBackgroundBlur.checked;
    localStorage.setItem('lc_engine', 'google');
    localStorage.setItem('lc_beep', state.enableBeep);
    localStorage.setItem('lc_blur_bg', state.enableBlur);
    localStorage.setItem('lc_auto_reconnect', state.autoReconnect);
    localStorage.setItem('lc_continuous_recognition', state.autoRestartSpeech);
    applyBlurSetting();
    settingsModal?.classList.add('hidden');
    showNotification('Configurações salvas!');
  });

  // Modal Oficial do Criador Kaynan Monteiro
  function openAboutCreator() {
    if (aboutCreatorModal) {
      aboutCreatorModal.classList.remove('hidden');
      try { if (window.lucide) lucide.createIcons(); } catch(e) {}
    }
  }
  function closeAboutCreator() {
    if (aboutCreatorModal) aboutCreatorModal.classList.add('hidden');
  }
  on('btnOpenAboutCreator', 'click', openAboutCreator);
  on('btnOpenCreatorDetails', 'click', openAboutCreator);
  on('btnInCallAboutCreator', 'click', openAboutCreator);
  on('btnCloseAboutCreatorModal', 'click', closeAboutCreator);
  on('btnCloseAboutCreatorModalBtn', 'click', closeAboutCreator);

  // Compartilhar App
  on('btnShareAppModal', 'click', () => {
    const shareData = {
      title: 'LinguaCall Pro',
      text: 'Conheça o LinguaCall Pro - Chamadas de vídeo gratuitas com tradução de voz em tempo real criada pelo desenvolvedor brasileiro Kaynan Monteiro!',
      url: window.location.href
    };
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      navigator.share(shareData).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        showNotification('Link do LinguaCall copiado!');
      }).catch(() => {
        prompt('Copie o link do app:', window.location.href);
      });
    }
  });

  // Janela Flutuante (Picture-in-Picture)
  on('btnPipMode', 'click', async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        showNotification('Janela flutuante fechada');
      } else if (remoteVideo && remoteVideo.srcObject) {
        await remoteVideo.requestPictureInPicture();
        showNotification('Modo janela flutuante (PiP) ativado!');
      } else if (localVideo && localVideo.srcObject) {
        await localVideo.requestPictureInPicture();
        showNotification('Modo janela flutuante ativado!');
      } else {
        showNotification('Abra a câmera ou entre numa ligação para usar janela flutuante');
      }
    } catch (err) {
      showNotification('Modo flutuante não disponível no momento');
    }
  });

  // Luz Virtual / Ring Light para o Rosto
  let isRingLightOn = false;
  const virtualRingLightOverlay = document.getElementById('virtualRingLightOverlay');
  const iconRingLight = document.getElementById('iconRingLight');
  on('btnVirtualRingLight', 'click', () => {
    isRingLightOn = !isRingLightOn;
    if (virtualRingLightOverlay) {
      if (isRingLightOn) {
        virtualRingLightOverlay.classList.remove('hidden');
        if (iconRingLight) iconRingLight.classList.add('text-accent-300', 'fill-amber-400');
        showNotification('Ring Light facial ativada!');
      } else {
        virtualRingLightOverlay.classList.add('hidden');
        if (iconRingLight) iconRingLight.classList.remove('fill-amber-400');
        showNotification('Ring Light desativada');
      }
    }
  });

  // Atalhos Rápidos de Teclado no PC
  window.addEventListener('keydown', (e) => {
    const tag = (e.target && e.target.tagName) ? e.target.tagName.toUpperCase() : '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    if (e.key === 'Escape') {
      [aboutCreatorModal, settingsModal, savedCallsModal, viewSpecificCallModal, statsModal, filtersModal].forEach(m => m?.classList.add('hidden'));
      closeVoiceDiag();
      return;
    }

    if (callScreen && !callScreen.classList.contains('hidden')) {
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        btnToggleMic?.click();
      } else if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        btnToggleCamera?.click();
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        document.getElementById('btnPipMode')?.click();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        document.getElementById('btnToggleFullscreen')?.click();
      } else if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        document.getElementById('btnVoiceDiag')?.click();
      }
    }
  });

  // Som suave de conexão via Web Audio API
  function playConnectChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.15);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now + 0.15);
      osc2.frequency.exponentialRampToValueAtTime(783.99, now + 0.35);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.2);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.5);
    } catch(e) {}
  }

  on(inputUserName, 'change', (e) => {
    state.userName = e.target.value.trim() || 'Você';
    localStorage.setItem('lc_user_name', state.userName);
  });
  on(selectSpeakLang, 'change', (e) => {
    state.speakLang = e.target.value;
    if (inCallSpeakLang) inCallSpeakLang.value = state.speakLang;
    localStorage.setItem('lc_speak_lang', state.speakLang);
    if (localLangBadge) localLangBadge.textContent = state.speakLang.split('-')[0].toUpperCase();
    if (speechRecognizer) restartSpeechRecognition(null);
  });
  on(selectTargetLang, 'change', (e) => {
    state.targetLang = e.target.value;
    if (inCallTargetLang) inCallTargetLang.value = state.targetLang;
    localStorage.setItem('lc_target_lang', state.targetLang);
  });

  on('btnSwapLanguages', 'click', () => {
    if (!selectSpeakLang || !selectTargetLang) return;
    const locales = {
      pt: 'pt-BR', en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE',
      it: 'it-IT', ja: 'ja-JP', zh: 'zh-CN', ru: 'ru-RU', ar: 'ar-SA',
      hi: 'hi-IN', ko: 'ko-KR', tr: 'tr-TR', id: 'id-ID', nl: 'nl-NL',
      pl: 'pl-PL', th: 'th-TH', vi: 'vi-VN'
    };
    const nextSpeak = locales[selectTargetLang.value];
    const nextTarget = selectSpeakLang.value.split('-')[0];
    if (!nextSpeak) return;
    selectSpeakLang.value = nextSpeak;
    selectTargetLang.value = nextTarget;
    selectSpeakLang.dispatchEvent(new Event('change'));
    selectTargetLang.dispatchEvent(new Event('change'));
    showNotification('Idiomas trocados.');
  });

  function generateRoomId() {
    return 'room-' + Math.random().toString(36).substring(2, 8);
  }

  function updateConnectionBadge(text, type = 'ready') {
    if (!connectionStatusBadge || !connectionStatusText) return;
    connectionStatusBadge.classList.remove('hidden');
    connectionStatusText.textContent = text;
    connectionStatusBadge.className = 'px-2 py-0.5 rounded-full text-[11px] border flex items-center gap-1 ';
    if (type === 'connecting') {
      connectionStatusBadge.className += 'border-accent-500/30 bg-accent-500/10 text-accent-400';
    } else if (type === 'connected') {
      connectionStatusBadge.className += 'border-ok-500/30 bg-ok-500/10 text-ok-400';
    } else if (type === 'error') {
      connectionStatusBadge.className += 'border-danger-500/30 bg-danger-500/10 text-danger-400';
    }
  }

  // ==========================================
  // OBTENÇÃO DE ÁUDIO E CÂMERA
  // ==========================================

  // Mensagem de erro que diz o que realmente aconteceu (e como resolver)
  function explainMediaError(err, wantsVideo) {
    const name = (err && err.name) || 'Error';
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError') {
      return isIOS
        ? 'O iPhone bloqueou o microfone/câmera para este site.\n\nComo liberar no iPhone:\n1) Toque no ícone "aA" ou no cadeado ao lado do endereço;\n2) Toque em "Ajustes do Site" e permita Microfone e Câmera;\n3) Em Ajustes do iPhone > Safari > Microfone, escolha "Perguntar" ou "Permitir";\n4) Recarregue a página e entre de novo.\n\nSe estiver usando um atalho do Instagram/Facebook/WhatsApp, abra o link no Safari.'
        : 'O navegador bloqueou o microfone/câmera para este site.\n\nToque no cadeado ao lado do endereço, permita Microfone e Câmera e recarregue a página.';
    }
    if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
      return wantsVideo
        ? 'Não encontrei câmera/microfone neste aparelho. Vou tentar entrar apenas com áudio.'
        : 'Não encontrei um microfone neste aparelho.';
    }
    if (name === 'NotReadableError' || name === 'TrackStartError') {
      return 'A câmera ou o microfone está sendo usado por outro aplicativo (ou outra aba).\n\nFeche o outro app/aba, recarregue e tente de novo.';
    }
    if (name === 'OverconstrainedError' || name === 'ConstraintNotSatisfiedError') {
      return 'Este aparelho não aceitou as configurações de vídeo. Vou tentar com uma configuração mais simples.';
    }
    return 'Não foi possível abrir o microfone (' + name + '). Recarregue a página e tente de novo.';
  }

  function showMediaErrorOnce(err, wantsVideo) {
    const key = (err && err.name) || 'Error';
    if (state.lastMediaErrorKey === key) return;
    state.lastMediaErrorKey = key;
    showNotification(explainMediaError(err, wantsVideo).split('\n')[0]);
    setTimeout(() => {
      if (err && (err.name === 'NotAllowedError' || err.name === 'SecurityError')) {
        alert(explainMediaError(err, wantsVideo));
      }
    }, 60);
  }

  async function requestUserMedia(wantVideo = true, facingMode = 'user') {
    stopMicTest();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Este navegador não libera câmera/microfone nesta página.\n\nNo iPhone, abra o link no Safari (não dentro do Instagram, Facebook ou WhatsApp) e em HTTPS.');
      throw new Error('getUserMedia indisponível');
    }

    // Tentativa 1: vídeo simples (facingMode exato pode falhar no iPhone)
    if (wantVideo) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        state.localStream = stream;
        state.isVideoEnabled = true;
        state.currentFacingMode = facingMode;
        state.lastMediaErrorKey = null;
        setupLocalVideoStream(stream);
        return stream;
      } catch (err) {
        console.warn('Falha vídeo+áudio (1/3):', err && err.name);
        state.lastMediaErrorKey = null;
        showMediaErrorOnce(err, true);
        // Se a permissão foi negada, não adianta tentar só áudio: pede de novo com áudio puro
        // (no iOS o áudio costuma ser liberado mesmo quando o vídeo falha).
      }
    }

    // Tentativa 2: apenas áudio
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      state.localStream = audioStream;
      state.isVideoEnabled = false;
      if (localVideo) localVideo.classList.add('hidden');
      if (localAvatarBox) localAvatarBox.classList.remove('hidden');
      state.lastMediaErrorKey = null;
      return audioStream;
    } catch (err) {
      console.error('Falha de microfone:', err && err.name);
      showMediaErrorOnce(err, false);
      throw err;
    }
  }

  function setupLocalVideoStream(stream) {
    if (localVideo) {
      localVideo.srcObject = stream;
      localVideo.classList.remove('hidden');
    }
    if (localAvatarBox) localAvatarBox.classList.add('hidden');
    if (btnToggleCamera) {
      btnToggleCamera.className = 'w-11 h-11 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-200 flex items-center justify-center border border-neutral-700 transition active:scale-95';
    }
    if (iconCamera) iconCamera.setAttribute('data-lucide', 'video');
    applyMirrorSetting();
    try { lucide.createIcons(); } catch(e) {}
  }

  function setupCallUI(roomId) {
    state.roomId = roomId;
    state.callActive = true;
    state.hasConnectedBefore = false;
    state.remotePeerId = null;
    state.isReconnecting = false;
    state.reconnectAttempts = 0;
    state.isMuted = false;
    state.ttsEnabled = false;
    state.speechBlocked = false;
    speechSeq = 0;
    speechRendered = 0;
    speechPending.clear();
    cancelQueuedSpeech();
    updateTTSButton();
    if (btnToggleMic) btnToggleMic.className = 'w-11 h-11 rounded-full bg-raised hover:bg-line text-neutral-100 flex items-center justify-center transition active:scale-95';
    if (iconMic) iconMic.setAttribute('data-lucide', 'mic');
    
    state.transcriptHistory = [];
    state.savedVocab = [];
    updateSavedVocabCount();
    renderTranscriptList();

    if (lobbyScreen) lobbyScreen.classList.add('hidden');
    if (callScreen) callScreen.classList.remove('hidden');
    if (mainHeader) mainHeader.classList.add('hidden');

    if (localUserNameDisplay) localUserNameDisplay.textContent = state.userName;
    if (localUserAvatar) localUserAvatar.textContent = (state.userName[0] || 'V').toUpperCase();
    if (localLangBadge) localLangBadge.textContent = state.speakLang.split('-')[0].toUpperCase();

    // No celular, o painel do chat começa fechado para os controles aparecerem
    if (window.innerWidth < 768) {
      state.isChatDrawerOpen = false;
      updateChatDrawerUI();
    }

    // Notas desta chamada (por sala)
    loadCallNotes(roomId);
    clearLiveCaptions();
    state.activeTab = 'live';
    switchChatPanel();
    if (callNotesPanel) callNotesPanel.classList.add('hidden');
    document.getElementById('btnCallNotes')?.classList.remove('text-accent-300');
    setNetworkUI(null);

    state.callStartTime = Date.now();
    clearInterval(state.timerInterval);
    state.timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - state.callStartTime) / 1000);
      const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
      const secs = String(elapsed % 60).padStart(2, '0');
      if (callTimerDisplay) callTimerDisplay.textContent = `${mins}:${secs}`;
    }, 1000);

    const newUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
    const inviteInput = document.getElementById('inviteLinkInput');
    if (inviteInput) inviteInput.value = newUrl;
  }

  // ==========================================
  // WEBRTC PEERJS
  // ==========================================

  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ]
  };

  on('btnCreateRoom', 'click', async () => {
    state.isInitiator = true;
    const roomId = generateRoomId();
    await startCallFlow(roomId);
  });

  on('btnJoinRoom', 'click', async () => {
    let code = inputRoomCode ? inputRoomCode.value.trim() : '';
    if (!code) {
      alert('Informe o código da sala.');
      return;
    }
    if (code.includes('?room=')) {
      code = code.split('?room=')[1].split('&')[0];
    }
    state.isInitiator = false;
    await startCallFlow(code);
  });

  async function startCallFlow(roomId) {
    try {
      updateConnectionBadge('Pedindo microfone...', 'connecting');
      const wantVideo = checkStartWithVideo ? checkStartWithVideo.checked : true;
      await requestUserMedia(wantVideo, 'user');

      setupCallUI(roomId);
      createPeerConnection(roomId);
    } catch (e) {
      updateConnectionBadge('Permissão negada', 'error');
    }
  }

  function createPeerConnection(roomId) {
    if (!state.callActive || !roomId) return;
    detachConnection(state.call);
    detachConnection(state.dataConnection);
    state.call = null;
    state.dataConnection = null;
    if (state.peer && !state.peer.destroyed) state.peer.destroy();

    const peerId = state.isInitiator ? roomId : 'guest-' + Math.random().toString(36).substring(2, 8);
    const peer = new Peer(peerId, { debug: 1, config: rtcConfig });
    state.peer = peer;
    const isCurrentPeer = () => state.callActive && state.peer === peer;

    peer.on('open', () => {
      if (!isCurrentPeer()) return;
      if (state.isInitiator) {
        updateConnectionBadge('Aguardando colega...', 'connecting');
        if (remoteUserNameDisplay) remoteUserNameDisplay.textContent = 'Aguardando colega...';
        if (remoteStatusIndicator) remoteStatusIndicator.textContent = 'Envie o convite para o colega';
      } else {
        updateConnectionBadge('Conectando...', 'connecting');
        connectToPeer(roomId);
      }
      if (!speechRecognizer) initSpeechRecognition();
      else restartSpeechRecognition(null);
      updateVoiceDiag();
      updateSpeechWarningBar();
      updateCompatNotice();
      updateListenStatusBar();
    });

    peer.on('call', (incomingCall) => {
      if (!isCurrentPeer()) return;
      detachConnection(state.call);
      state.call = incomingCall;
      state.remotePeerId = incomingCall.peer;
      incomingCall.answer(state.localStream);
      incomingCall.on('stream', (remoteMediaStream) => {
        if (isCurrentPeer() && state.call === incomingCall) attachRemoteStream(remoteMediaStream);
      });
      incomingCall.on('close', () => {
        if (!isCurrentPeer() || state.call !== incomingCall || state.isReconnecting) return;
        updateConnectionBadge('Áudio interrompido. Aguardando conexão...', 'connecting');
        if (!state.isInitiator) scheduleReconnect();
      });
      incomingCall.on('error', () => {
        if (isCurrentPeer() && !state.isInitiator) scheduleReconnect();
      });
    });

    peer.on('connection', (conn) => {
      if (!isCurrentPeer()) return;
      detachConnection(state.dataConnection);
      state.dataConnection = conn;
      setupDataConnectionListeners(conn);
    });

    peer.on('disconnected', () => {
      if (!isCurrentPeer()) return;
      updateConnectionBadge('Conexão instável...', 'connecting');
      scheduleReconnect();
    });

    peer.on('close', () => {
      if (isCurrentPeer()) scheduleReconnect();
    });

    peer.on('error', (err) => {
      if (!isCurrentPeer()) return;
      console.error('Peer error:', err);
      if (err && err.type === 'unavailable-id') {
        if (state.reconnectAttempts > 0) {
          scheduleReconnect();
          return;
        }
        updateConnectionBadge('Sala cheia ou link inválido', 'error');
        showNotification('Não foi possível entrar: sala cheia ou link inválido. Encerre e tente outro link.');
        return;
      }
      if (err && err.type === 'peer-unavailable') {
        updateConnectionBadge('Colega não encontrado', 'error');
        showNotification('Colega ainda não encontrado. Continuaremos tentando.');
        scheduleReconnect();
        return;
      }
      updateConnectionBadge('Erro na conexão', 'error');
      scheduleReconnect();
    });
  }

  // ==========================================
  // RECONEXÃO AUTOMÁTICA SE A CHAMADA CAIR
  // ==========================================
  function detachConnection(conn) {
    if (!conn) return;
    try { conn.removeAllListeners(); } catch (e) {}
    try { conn.close(); } catch (e) {}
  }

  function clearReconnectTimers() {
    clearTimeout(state.reconnectTimer);
    clearTimeout(state.reconnectCheckTimer);
    state.reconnectTimer = null;
    state.reconnectCheckTimer = null;
  }

  function markPeerConnected() {
    if (!state.callActive || !state.dataConnection?.open || !state.call?.open) return;
    clearReconnectTimers();
    state.reconnectAttempts = 0;
    state.isReconnecting = false;
    updateConnectionBadge('Conectado', 'connected');
  }

  function scheduleReconnect() {
    if (!state.callActive || !state.autoReconnect || !state.roomId || state.isReconnecting) return;
    if (state.reconnectAttempts >= 12) {
      updateConnectionBadge('Falha ao reconectar', 'error');
      showNotification('Não foi possível reconectar automaticamente. Tente entrar de novo.');
      return;
    }

    clearTimeout(state.reconnectCheckTimer);
    state.reconnectCheckTimer = null;
    state.isReconnecting = true;
    state.reconnectAttempts++;
    const delay = Math.min(8000, 1200 * state.reconnectAttempts);
    updateConnectionBadge(`Reconectando... (${state.reconnectAttempts})`, 'connecting');

    state.reconnectTimer = setTimeout(() => {
      state.reconnectTimer = null;
      if (!state.callActive || !state.roomId) {
        state.isReconnecting = false;
        return;
      }

      try {
        if (!state.peer || state.peer.destroyed || state.peer.disconnected || !state.peer.open) {
          createPeerConnection(state.roomId);
        } else if (!state.isInitiator) {
          connectToPeer(state.roomId);
        }
      } catch (e) {
        try { createPeerConnection(state.roomId); } catch (err) {}
      }

      state.reconnectCheckTimer = setTimeout(() => {
        state.reconnectCheckTimer = null;
        if (!state.callActive) return;
        if (state.dataConnection?.open && state.call?.open) {
          markPeerConnected();
        } else {
          state.isReconnecting = false;
          scheduleReconnect();
        }
      }, 5000);
    }, delay);
  }

  window.addEventListener('online', () => {
    if (state.roomId && callScreen && !callScreen.classList.contains('hidden')) {
      showNotification('Internet voltou. Reconectando a chamada...');
      clearReconnectTimers();
      state.reconnectAttempts = 0;
      state.isReconnecting = false;
      scheduleReconnect();
    }
  });

  window.addEventListener('offline', () => {
    if (state.roomId) {
      updateConnectionBadge('Sem internet', 'error');
      showNotification('Sua internet caiu. Tentaremos reconectar sozinhos.');
    }
  });

  function connectToPeer(hostRoomId) {
    if (!state.callActive || !state.peer || !state.peer.open || state.peer.disconnected) {
      throw new Error('Peer ainda não está conectado');
    }
    detachConnection(state.call);
    detachConnection(state.dataConnection);
    state.call = null;
    state.dataConnection = null;

    const call = state.peer.call(hostRoomId, state.localStream);
    state.call = call;
    call.on('stream', (remoteMediaStream) => {
      if (state.callActive && state.call === call) attachRemoteStream(remoteMediaStream);
    });
    call.on('close', () => {
      if (!state.callActive || state.call !== call || state.isReconnecting) return;
      updateConnectionBadge('Áudio interrompido. Aguardando conexão...', 'connecting');
      scheduleReconnect();
    });
    call.on('error', () => {
      if (state.callActive && state.call === call) scheduleReconnect();
    });

    const conn = state.peer.connect(hostRoomId);
    state.dataConnection = conn;
    setupDataConnectionListeners(conn);
  }

  function attachRemoteStream(remoteStream) {
    state.remoteStream = remoteStream;
    state.hasConnectedBefore = true;
    if (remoteVideo) {
      remoteVideo.muted = false;
      remoteVideo.volume = 1;
      remoteVideo.srcObject = remoteStream;
    }

    const videoTracks = remoteStream.getVideoTracks();
    if (videoTracks.length > 0 && videoTracks[0].enabled) {
      if (remoteVideo) remoteVideo.classList.remove('hidden');
      if (remoteAvatarBox) remoteAvatarBox.classList.add('hidden');
    } else {
      if (remoteVideo) remoteVideo.classList.add('hidden');
      if (remoteAvatarBox) remoteAvatarBox.classList.remove('hidden');
    }

    guardPlayback(remoteVideo, 'vídeo e áudio');
    updateConnectionBadge('Conectado', 'connected');
    if (remoteStatusIndicator) remoteStatusIndicator.textContent = 'Conectado';
    applyBlurSetting();
    markPeerConnected();
    startNetworkMonitor();
    playConnectChime();
  }

  function setupDataConnectionListeners(conn) {
    conn.on('open', () => {
      if (!state.callActive || state.dataConnection !== conn) return;
      state.hasConnectedBefore = true;
      state.remotePeerId = conn.peer;
      updateConnectionBadge('Conectado', 'connected');
      sendData({
        type: 'handshake',
        userName: state.userName,
        speakLang: state.speakLang,
        hasVideo: state.isVideoEnabled
      });
      markPeerConnected();
    });

    conn.on('data', (data) => {
      if (state.callActive && state.dataConnection === conn) handleIncomingData(data);
    });

    conn.on('close', () => {
      if (!state.callActive || state.dataConnection !== conn) return;
      state.dataConnection = null;
      updateConnectionBadge('Colega desconectou', 'connecting');
      if (remoteUserNameDisplay) remoteUserNameDisplay.textContent = 'Colega saiu';
      if (remoteLangBadge) remoteLangBadge.textContent = '--';
      if (remoteStatusIndicator) remoteStatusIndicator.textContent = 'Desconectado';
      if (remoteVideo) remoteVideo.classList.add('hidden');
      if (remoteAvatarBox) remoteAvatarBox.classList.remove('hidden');
      hideRemoteCaption();
      if (!state.isInitiator) scheduleReconnect();
    });

    conn.on('error', () => {
      if (state.callActive && state.dataConnection === conn && !state.isInitiator) scheduleReconnect();
    });
  }

  // ==========================================
  // ALERTA DE QUALIDADE DE REDE
  // ==========================================
  let pingInterval = null;
  let pingSeq = 0;
  let lastPongAt = 0;
  let networkAlertShown = false;
  let networkDownSince = 0;

  function setNetworkUI(ms) {
    const pingDisplay = document.getElementById('pingDisplay');
    const networkDot = document.getElementById('networkDot');
    const badge = document.getElementById('networkStatusBadge');
    if (!pingDisplay) return;

    pingDisplay.textContent = ms === null ? '--' : `${ms}ms`;
    let color = 'bg-neutral-500';
    let textColor = 'text-neutral-400';
    if (ms !== null) {
      if (ms < 150) { color = 'bg-ok-400'; textColor = 'text-ok-400'; }
      else if (ms < 350) { color = 'bg-accent-400'; textColor = 'text-accent-400'; }
      else { color = 'bg-danger-500'; textColor = 'text-danger-400'; }
    }
    if (networkDot) networkDot.className = `w-1.5 h-1.5 rounded-full ${color}`;
    if (badge) {
      badge.classList.remove('text-ok-400', 'text-accent-400', 'text-danger-400', 'text-neutral-400');
      badge.classList.add(textColor);
      badge.title = ms === null ? 'Sem resposta da rede' : `Qualidade da conexão: ${ms}ms`;
    }
  }

  function startNetworkMonitor() {
    stopNetworkMonitor();
    lastPongAt = Date.now();
    networkAlertShown = false;
    networkDownSince = 0;

    pingInterval = setInterval(() => {
      if (!state.dataConnection || !state.dataConnection.open) {
        setNetworkUI(null);
        return;
      }
      const id = ++pingSeq;
      state.lastPingId = id;
      sendData({ type: 'ping', id: id, t: Date.now() });

      // Sem resposta em 3,5s = rede instável
      setTimeout(() => {
        if (state.lastPingId === id && Date.now() - lastPongAt > 3500) {
          setNetworkUI(null);
          if (!networkAlertShown) {
            networkAlertShown = true;
            networkDownSince = Date.now();
            showNotification('Sua conexão está instável. A chamada pode travar.');
            playNetworkAlertSound();
          }
          if (Date.now() - networkDownSince > 8000) scheduleReconnect();
        }
      }, 3500);
    }, 3000);
  }

  function stopNetworkMonitor() {
    if (pingInterval) clearInterval(pingInterval);
    pingInterval = null;
    setNetworkUI(null);
  }

  function playNetworkAlertSound() {
    if (!state.enableBeep) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [440, 330].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.18);
        gain.gain.setValueAtTime(0.05, ctx.currentTime + i * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.16);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.18);
        osc.stop(ctx.currentTime + i * 0.18 + 0.18);
      });
    } catch (e) {}
  }

  function sendData(dataObj) {
    if (!state.callActive || !state.dataConnection?.open) return false;
    try {
      state.dataConnection.send(dataObj);
      return true;
    } catch (e) {
      return false;
    }
  }

  async function handleIncomingData(data) {
    if (data.type === 'call_end') {
      if (!state.callActive) return;
      cleanupAndExitCall(true);
      showNotification('O colega encerrou a chamada.');
      return;
    }

    // ---- PING / PONG para medir qualidade de rede ----
    if (data.type === 'ping') {
      sendData({ type: 'pong', id: data.id, t: data.t });
      return;
    }
    if (data.type === 'pong') {
      lastPongAt = Date.now();
      networkAlertShown = false;
      networkDownSince = 0;
      setNetworkUI(Math.max(0, Math.round(Date.now() - (data.t || Date.now()))));
      return;
    }

    // ---- "Está digitando..." ----
    if (data.type === 'typing') {
      showTypingIndicator(!!data.isTyping, data.userName);
      return;
    }

    if (data.type === 'handshake') {
      if (remoteUserNameDisplay) remoteUserNameDisplay.textContent = data.userName || 'Colega';
      if (remoteUserAvatar) remoteUserAvatar.textContent = (data.userName ? data.userName[0] : 'C').toUpperCase();
      if (remoteLangBadge) remoteLangBadge.textContent = (data.speakLang || 'outro').split('-')[0].toUpperCase();
      if (remoteStatusIndicator) remoteStatusIndicator.textContent = 'Online';
      
      if (state.isInitiator) {
        sendData({
          type: 'handshake_ack',
          userName: state.userName,
          speakLang: state.speakLang,
          hasVideo: state.isVideoEnabled
        });
      }
      showNotification(`${data.userName || 'Colega'} entrou na chamada!`);
    } else if (data.type === 'handshake_ack') {
      if (remoteUserNameDisplay) remoteUserNameDisplay.textContent = data.userName || 'Colega';
      if (remoteUserAvatar) remoteUserAvatar.textContent = (data.userName ? data.userName[0] : 'C').toUpperCase();
      if (remoteLangBadge) remoteLangBadge.textContent = (data.speakLang || 'outro').split('-')[0].toUpperCase();
      if (remoteStatusIndicator) remoteStatusIndicator.textContent = 'Online';
    } else if (data.type === 'lang_change') {
      if (remoteLangBadge) remoteLangBadge.textContent = (data.speakLang || '').split('-')[0].toUpperCase();
      showNotification(`${remoteUserNameDisplay?.textContent || 'Colega'} agora fala em ${data.speakLang}`);
    } else if (data.type === 'video_toggle') {
      if (data.enabled) {
        if (remoteVideo) remoteVideo.classList.remove('hidden');
        if (remoteAvatarBox) remoteAvatarBox.classList.add('hidden');
      } else {
        if (remoteVideo) remoteVideo.classList.add('hidden');
        if (remoteAvatarBox) remoteAvatarBox.classList.remove('hidden');
      }
    } else if (data.type === 'reaction') {
      triggerFloatingEmoji(data.emoji, false);
    } else if (data.type === 'remote_tts') {
      handleRemoteSpeech({ ...data, forceSpeech: true });
    } else if (data.type === 'voice_clip') {
      playIncomingVoiceClip(data);
    } else if (data.type === 'speech') {
      handleRemoteSpeech(data);
    } else if (data.type === 'chat') {
      handleIncomingChat(data);
    }
  }

  // Barra de status da escuta: em uma linha, o que está acontecendo de verdade.
  // É isto que mostra se o Android está ouvindo ou parado.
  const useAndroidStt = /Android/i.test(navigator.userAgent);
  const androidStt = {
    status: 'idle', worker: null, context: null, source: null, node: null,
    frames: [], frameCount: 0, silenceFrames: 0, voiceFrames: 0, preroll: [],
    busy: false, pending: [], session: 0, error: ''
  };

  function resetAndroidSpeech() {
    androidStt.frames = [];
    androidStt.frameCount = 0;
    androidStt.silenceFrames = 0;
    androidStt.voiceFrames = 0;
  }

  function sendNextAndroidChunk() {
    if (!androidStt.worker || androidStt.busy || !androidStt.pending.length || !state.callActive) return;
    androidStt.busy = true;
    androidStt.worker.postMessage({ type: 'transcribe', audio: androidStt.pending.shift(), lang: state.speakLang });
  }

  function flushAndroidSpeech() {
    if (androidStt.voiceFrames >= 2 && androidStt.frameCount >= 8000) {
      const audio = new Float32Array(androidStt.frameCount);
      let offset = 0;
      for (const frame of androidStt.frames) {
        audio.set(frame, offset);
        offset += frame.length;
      }
      // Mantém a memória limitada quando a inferência demora em um celular lento.
      if (androidStt.pending.length < 2) androidStt.pending.push(audio);
      sendNextAndroidChunk();
    }
    resetAndroidSpeech();
  }

  function handleAndroidAudio(frame) {
    if (!state.callActive || state.isMuted || androidStt.status !== 'ready') {
      resetAndroidSpeech();
      return;
    }
    let power = 0;
    for (let i = 0; i < frame.length; i++) power += frame[i] * frame[i];
    const hasVoice = Math.sqrt(power / frame.length) > 0.008;
    if (!androidStt.frameCount) {
      if (!hasVoice) {
        androidStt.preroll.push(frame);
        if (androidStt.preroll.length > 4) androidStt.preroll.shift();
        return;
      }
      androidStt.frames = androidStt.preroll.splice(0);
      androidStt.frameCount = androidStt.frames.reduce((total, part) => total + part.length, 0);
    }
    androidStt.frames.push(frame);
    androidStt.frameCount += frame.length;
    if (hasVoice) androidStt.voiceFrames++;
    androidStt.silenceFrames = hasVoice ? 0 : androidStt.silenceFrames + 1;
    if (androidStt.silenceFrames >= 7 || androidStt.frameCount >= 8 * 16000) flushAndroidSpeech();
  }

  async function startAndroidAudio(session) {
    const track = state.localStream?.getAudioTracks()[0];
    if (!track || track.readyState !== 'live') throw new Error('Faixa de áudio indisponível');
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const context = new Ctx();
    androidStt.context = context;
    await context.audioWorklet.addModule('./android-stt-processor.js');
    if (androidStt.session !== session || !state.callActive) return;
    const source = context.createMediaStreamSource(new MediaStream([track]));
    const node = new AudioWorkletNode(context, 'android-stt-processor');
    const silent = context.createGain();
    silent.gain.value = 0;
    node.port.onmessage = ({ data }) => handleAndroidAudio(data);
    source.connect(node).connect(silent).connect(context.destination);
    androidStt.source = source;
    androidStt.node = node;
    await context.resume();
    androidStt.status = 'ready';
    updateListenStatusBar();
    updateVoiceDiag();
  }

  function startAndroidStt() {
    if (!useAndroidStt || !state.callActive || androidStt.status === 'loading' || androidStt.status === 'ready') return;
    stopAndroidStt();
    const session = ++androidStt.session;
    androidStt.status = 'loading';
    androidStt.error = '';
    updateListenStatusBar();
    const fail = (message) => {
      if (androidStt.session !== session) return;
      stopAndroidStt();
      androidStt.status = 'failed';
      androidStt.error = message;
      updateListenStatusBar();
      updateVoiceDiag();
      showNotificationOnce('android-stt-error', 'Falha ao carregar a transcrição local. Verifique a internet e toque em Religar.');
    };
    let worker;
    try {
      worker = new Worker('./android-stt-worker.js', { type: 'module' });
      androidStt.worker = worker;
    } catch (error) {
      fail(error.message);
      return;
    }
    worker.onmessage = ({ data }) => {
      if (androidStt.session !== session || !state.callActive) return;
      if (data.type === 'progress') {
        const txt = document.getElementById('listenStatusText');
        if (txt && androidStt.status === 'loading') txt.textContent = `Preparando transcrição no Android: ${data.progress}%`;
      } else if (data.type === 'ready') {
        startAndroidAudio(session).catch(error => fail(error.message));
      } else if (data.type === 'result') {
        androidStt.busy = false;
        if (data.text) {
          diag.lastResultAt = Date.now();
          diag.lastResultText = data.text;
          sendSpeechNow(data.text);
          updateVoiceDiag();
        }
        sendNextAndroidChunk();
      } else if (data.type === 'error') {
        fail(data.message);
      }
    };
    worker.onerror = (event) => {
      fail(event.message || 'Falha ao iniciar a transcrição');
    };
    worker.postMessage({ type: 'load' });
  }

  function stopAndroidStt() {
    androidStt.session++;
    androidStt.node?.disconnect();
    androidStt.source?.disconnect();
    androidStt.context?.close().catch(() => {});
    androidStt.worker?.terminate();
    androidStt.node = androidStt.source = androidStt.context = androidStt.worker = null;
    androidStt.busy = false;
    androidStt.pending = [];
    androidStt.preroll = [];
    resetAndroidSpeech();
    androidStt.status = 'idle';
  }

  function updateListenStatusBar() {
    const dot = document.getElementById('listenDot');
    const txt = document.getElementById('listenStatusText');
    const fix = document.getElementById('btnFixListening');
    if (!dot || !txt) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const setBar = (color, message, showFix) => {
      dot.className = 'w-1.5 h-1.5 rounded-full flex-shrink-0 ' + color;
      txt.textContent = message;
      if (fix) fix.classList.toggle('hidden', !showFix);
    };

    if (!state.callActive) {
      setBar('bg-neutral-600', 'Escuta desligada fora da chamada', false);
      return;
    }
    if (state.isMuted) {
      setBar('bg-neutral-600', 'Escuta pausada: microfone mudo', false);
      return;
    }
    if (useAndroidStt) {
      if (androidStt.status === 'loading') setBar('bg-accent-500', 'Preparando transcrição no Android…', false);
      else if (androidStt.status === 'failed') setBar('bg-danger-500', 'Transcrição indisponível — toque em Religar', true);
      else if (androidStt.status === 'ready') setBar('bg-ok-500', 'Transcrição local ligada — pode falar', false);
      else setBar('bg-accent-500', 'Iniciando transcrição local…', false);
      return;
    }
    if (!SpeechRecognition) {
      setBar('bg-neutral-600', 'Escuta: este navegador não transcreve voz (use o microfone com ondas)', false);
      return;
    }
    if (state.speechBlocked) {
      setBar('bg-danger-500', 'Escuta bloqueada pelo navegador — libere o microfone e recarregue', true);
      return;
    }
    if (isRecognitionRunning) {
      const last = diag.lastResultAt ? Math.round((Date.now() - diag.lastResultAt) / 1000) : null;
      setBar('bg-ok-500',
        last === null ? `Escuta ligada (${state.speakLang}) — pode falar` : `Escuta ligada (${state.speakLang}) — última fala há ${last}s`,
        false);
      return;
    }
    setBar('bg-accent-500',
      diag.speechError ? `Escuta parada (${diag.speechError}) — toque em Religar` : 'Escuta parada — toque em Religar',
      true);
  }
  on('btnFixListening', 'click', () => {
    state.speechBlocked = false;
    diag.speechError = null;
    shownNotices.delete('mic-blocked');
    restartSpeechRecognition('Religando a escuta…');
    setTimeout(updateListenStatusBar, 600);
  });
  setInterval(updateListenStatusBar, 1000);

  // Vigia da escuta: se ela parar (o Chrome encerra a sessão a cada ~60s,
  // troca de aba, tela bloqueada), religa em até 3s.
  setInterval(() => {
    if (useAndroidStt) return;
    if (!state.callActive || !callScreen || callScreen.classList.contains('hidden')) return;
    if (!state.autoRestartSpeech || state.speechUnsupported || state.speechBlocked || state.isMuted) return;
    if (!state.localStream || !speechRecognizer) return;
    if (isRecognitionRunning) return;
    try {
      speechRecognizer.lang = state.speakLang;
      speechRecognizer.start();
    } catch (e) {}
  }, 3000);

  // ==========================================
  // DIAGNÓSTICO DE VOZ (o que está travando a conversa)
  // ==========================================
  const diag = {
    isListening: false,
    speechError: null,
    lastErrorAt: 0,
    micLevel: 0,
    micPeak: 0,
    lastTranslateOk: null,
    lastTranslateAt: 0,
    lastTranslateFrom: '',
    lastTranslateTo: '',
    voiceError: null,
    lastSpokenLang: '',
    lastSpokenVoice: '',
    lastSpokenAt: 0,
    lastRemoteAt: 0,
    lastRemoteText: '',
    lastRemoteTranslated: '',
    lastResultAt: 0,
    lastResultText: '',
    lastLocalSentAt: 0,
    lastLocalSentText: '',
    restarts: 0,
    playBlocked: false
  };

  function diagSet(id, text, colorClass) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.className = 'text-[11px] font-medium ' + (colorClass || 'text-neutral-400');
  }

  on('btnCloseCompatNotice', 'click', () => {
    document.getElementById('compatNotice')?.classList.add('hidden');
  });

  function updateCompatNotice() {
    const el = document.getElementById('compatNotice');
    if (!el) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    // No iPhone/Safari não existe reconhecimento: avisa uma vez, de forma tranquila
    if (!SpeechRecognition && !useAndroidStt) el.classList.remove('hidden');
    else el.classList.add('hidden');
  }

  function updateSpeechWarningBar() {
    const bar = document.getElementById('speechWarningBar');
    const text = document.getElementById('speechWarningText');
    if (!bar || !text) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition && !useAndroidStt) {
      text.textContent = 'Este navegador (iPhone/Safari) não reconhece voz: o colega precisa digitar no chat ou usar "Falar meu texto traduzido".';
      bar.classList.remove('hidden');
    } else if (state.speechBlocked) {
      text.textContent = 'O navegador bloqueou a escuta do microfone. Libere a permissão e recarregue a página.';
      bar.classList.remove('hidden');
    } else {
      bar.classList.add('hidden');
    }
  }

  function updateVoiceDiag() {
    const modal = document.getElementById('voiceDiagModal');
    if (!modal || modal.classList.contains('hidden')) return;

    // 1) Escuta
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (useAndroidStt && androidStt.status === 'ready') {
      diagSet('diagSpeechStatus', 'Ouvindo localmente', 'text-ok-400');
      const hint = document.getElementById('diagSpeechHint');
      if (hint) hint.textContent = 'O áudio da chamada está sendo transcrito no próprio aparelho.';
    } else if (useAndroidStt && androidStt.status !== 'idle') {
      diagSet('diagSpeechStatus', androidStt.status === 'failed' ? 'Falhou' : 'Carregando', 'text-accent-400');
      const hint = document.getElementById('diagSpeechHint');
      if (hint) hint.textContent = androidStt.status === 'failed' ? androidStt.error : 'Baixando o modelo de transcrição. Aguarde antes de falar.';
    } else if (!SpeechRecognition) {
      diagSet('diagSpeechStatus', 'Indisponível', 'text-danger-400');
      const hint = document.getElementById('diagSpeechHint');
      if (hint) hint.textContent = 'Este navegador não tem reconhecimento de voz (o iPhone/Safari não tem). Sem ele, a fala do colega não é transcrita nem traduzida automaticamente: ele precisa digitar no chat ou usar o botão "Falar meu texto traduzido".';
    } else if (state.speechBlocked) {
      diagSet('diagSpeechStatus', 'Bloqueada', 'text-danger-400');
      const hint = document.getElementById('diagSpeechHint');
      if (hint) hint.textContent = 'O navegador bloqueou a escuta. Toque no cadeado ao lado do endereço, libere o microfone, recarregue a página e entre na sala de novo.';
    } else if (isRecognitionRunning) {
      diagSet('diagSpeechStatus', 'Ouvindo', 'text-ok-400');
      const hint = document.getElementById('diagSpeechHint');
      if (hint) hint.textContent = `Escutando em ${state.speakLang}. Se você fala outro idioma, troque em "Falo" — a escuta reinicia sozinha.`;
    } else {
      diagSet('diagSpeechStatus', 'Parada', 'text-danger-400');
      const hint = document.getElementById('diagSpeechHint');
      if (hint) hint.textContent = diag.speechError
        ? `A escuta parou com o erro "${diag.speechError}". Toque em "Testar agora" para religar.`
        : 'A escuta está parada. Toque em "Testar agora" para religar.';
    }

    // 2) Microfone
    const level = Math.round(diag.micLevel);
    const bar = document.getElementById('diagMicBar');
    if (bar) bar.style.width = Math.min(100, Math.round(diag.micLevel * 1.6)) + '%';
    const micHint = document.getElementById('diagMicHint');
    if (state.isMuted) {
      diagSet('diagMicStatus', 'Mudo', 'text-danger-400');
      if (micHint) micHint.textContent = 'Seu microfone está mutado: toque no ícone do microfone para liberar.';
    } else if (!state.localStream) {
      diagSet('diagMicStatus', 'Inativo', 'text-danger-400');
      if (micHint) micHint.textContent = 'Nenhum microfone ativo. Saia e entre de novo liberando o microfone.';
    } else if (diag.micPeak < 6) {
      diagSet('diagMicStatus', 'Sem som', 'text-accent-400');
      if (micHint) micHint.textContent = 'O microfone está ligado mas não captou som. Fale algo perto dele ou verifique se outro app está usando o microfone.';
    } else {
      diagSet('diagMicStatus', `Captando (${level})`, 'text-ok-400');
      if (micHint) micHint.textContent = 'O microfone está captando a sua voz normalmente.';
    }

    // 3) Tradução
    if (diag.lastTranslateOk === true) {
      diagSet('diagTranslateStatus', 'Funcionando', 'text-ok-400');
      const h = document.getElementById('diagTranslateHint');
      if (h) h.textContent = `Última tradução ${diag.lastTranslateFrom} → ${diag.lastTranslateTo} deu certo.`;
    } else if (diag.lastTranslateOk === false) {
      diagSet('diagTranslateStatus', 'Falhou', 'text-danger-400');
      const h = document.getElementById('diagTranslateHint');
      if (h) h.textContent = 'O serviço de tradução não respondeu agora há pouco. Ele volta sozinho; se insistir, tente de novo em alguns segundos.';
    } else {
      diagSet('diagTranslateStatus', 'Ainda não usada', 'text-neutral-400');
      const h = document.getElementById('diagTranslateHint');
      if (h) h.textContent = 'Nenhuma tradução foi feita nesta chamada ainda.';
    }

    // 4) Voz de leitura
    const voices = ('speechSynthesis' in window) ? window.speechSynthesis.getVoices() : [];
    const hasVoice = !!pickVoice(state.targetLang);
    if (diag.voiceError) {
      diagSet('diagVoiceStatus', 'Com erro', 'text-danger-400');
      const h = document.getElementById('diagVoiceHint');
      if (h) h.textContent = `A voz falhou ("${diag.voiceError}"). No iPhone, o som só sai depois de um toque na tela — toque em "Testar agora".`;
    } else if (!voices.length) {
      diagSet('diagVoiceStatus', 'Carregando', 'text-neutral-400');
      const h = document.getElementById('diagVoiceHint');
      if (h) h.textContent = 'O navegador ainda não carregou as vozes do aparelho.';
    } else if (!hasVoice) {
      diagSet('diagVoiceStatus', 'Sem voz do idioma', 'text-accent-400');
      const h = document.getElementById('diagVoiceHint');
      if (h) h.textContent = `Seu aparelho não tem voz instalada para "${state.targetLang}". A tradução aparece escrita, mas não será falada.`;
    } else {
      diagSet('diagVoiceStatus', state.ttsEnabled ? 'Ligada' : 'Desligada', state.ttsEnabled ? 'text-ok-400' : 'text-neutral-400');
      const h = document.getElementById('diagVoiceHint');
      if (h) h.textContent = state.ttsEnabled
        ? `Lendo a tradução em ${state.targetLang} com a voz "${pickVoice(state.targetLang).name}".`
        : 'Ligada a leitura: o botão de alto-falante na barra de baixo (voz lendo a tradução).';
    }

    // 5) Minha fala saindo (o pedaço que o Chrome devolveu e o que já foi enviado)
    const sendHint = document.getElementById('diagSendHint');
    if (diag.lastLocalSentAt) {
      const s2 = Math.round((Date.now() - diag.lastLocalSentAt) / 1000);
      diagSet('diagSendStatus', `Enviada (${s2}s atrás)`, 'text-ok-400');
      if (sendHint) sendHint.textContent = `"${(diag.lastLocalSentText || '').slice(0, 90)}"`;
    } else if (diag.lastResultAt) {
      const s3 = Math.round((Date.now() - diag.lastResultAt) / 1000);
      diagSet('diagSendStatus', `Ouvida (${s3}s)`, 'text-accent-400');
      if (sendHint) sendHint.textContent = `Reconhecido: "${(diag.lastResultText || '').slice(0, 90)}" — aguardando a pausa para enviar.`;
    } else if (isRecognitionRunning) {
      diagSet('diagSendStatus', 'Escutando…', 'text-neutral-400');
      if (sendHint) sendHint.textContent = 'A escuta está ligada, mas nada foi reconhecido ainda. Fale mais perto do microfone.';
    } else {
      diagSet('diagSendStatus', 'Nada enviado', 'text-danger-400');
      if (sendHint) sendHint.textContent = 'A escuta não está ativa. Toque em "Testar agora".';
    }

    // 6) Última fala do colega
    if (diag.playBlocked) {
      diagSet('diagRemoteStatus', 'Som bloqueado', 'text-danger-400');
      const h0 = document.getElementById('diagRemoteHint');
      if (h0) h0.textContent = 'O navegador bloqueou o som até você tocar na tela. Toque em qualquer lugar da chamada.';
      return;
    }
    if (diag.lastRemoteAt) {
      const secs = Math.round((Date.now() - diag.lastRemoteAt) / 1000);
      const ago = secs < 60 ? `${secs}s atrás` : `${Math.round(secs / 60)}min atrás`;
      diagSet('diagRemoteStatus', `Recebida (${ago})`, 'text-ok-400');
      const h = document.getElementById('diagRemoteHint');
      if (h) h.textContent = `"${(diag.lastRemoteText || '').slice(0, 80)}" → "${(diag.lastRemoteTranslated || '').slice(0, 80)}"`;
    } else {
      diagSet('diagRemoteStatus', 'Nada recebido', 'text-neutral-400');
      const h = document.getElementById('diagRemoteHint');
      if (h) h.textContent = 'Nenhuma fala do colega chegou. Se ele fala pelo celular, o reconhecimento de voz não existe no iPhone/Safari — ele precisa digitar ou usar "Falar meu texto traduzido".';
    }
  }

  // Medidor contínuo do microfone (só enquanto o diagnóstico está aberto)
  let diagMeterTimer = null;
  let diagAudioCtx = null;
  function startDiagMeter() {
    stopDiagMeter();
    if (!state.localStream) { updateVoiceDiag(); return; }
    const track = state.localStream.getAudioTracks()[0];
    if (!track) { updateVoiceDiag(); return; }
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      diagAudioCtx = new Ctx();
      const analyser = diagAudioCtx.createAnalyser();
      analyser.fftSize = 64;
      diagAudioCtx.createMediaStreamSource(new MediaStream([track])).connect(analyser);
      const arr = new Uint8Array(analyser.frequencyBinCount);
      diagMeterTimer = setInterval(() => {
        analyser.getByteFrequencyData(arr);
        let sum = 0;
        for (let i = 0; i < arr.length; i++) sum += arr[i];
        diag.micLevel = sum / arr.length;
        diag.micPeak = Math.max(diag.micPeak, diag.micLevel);
        updateVoiceDiag();
      }, 150);
    } catch (e) { updateVoiceDiag(); }
  }
  function stopDiagMeter() {
    if (diagMeterTimer) { clearInterval(diagMeterTimer); diagMeterTimer = null; }
    if (diagAudioCtx) { diagAudioCtx.close().catch(() => {}); diagAudioCtx = null; }
  }

  function openVoiceDiag() {
    document.getElementById('voiceDiagModal')?.classList.remove('hidden');
    updateSpeechWarningBar();
    diag.micPeak = 0;
    updateVoiceDiag();
    // preenche as dicas com o estado real, sem esperar um clique
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const hint = document.getElementById('diagSpeechHint');
    if (hint && !SpeechRecognition && !useAndroidStt) {
      hint.textContent = 'Este navegador não tem reconhecimento de voz (o iPhone/Safari não tem). Sem ele, a fala do colega não é transcrita nem traduzida automaticamente: ele precisa digitar no chat ou usar o botão "Falar meu texto traduzido".';
    }
    // dicas iniciais imediatas para nenhuma linha ficar com "—"
    const micH0 = document.getElementById('diagMicHint');
    if (micH0 && !state.localStream) micH0.textContent = 'Nenhum microfone ativo nesta tela.';
    const sendH0 = document.getElementById('diagSendHint');
    if (sendH0 && !diag.lastLocalSentAt) sendH0.textContent = 'A escuta está ligada; assim que você falar, a frase aparece aqui e é enviada ao colega.';
    const tHint = document.getElementById('diagTranslateHint');
    if (tHint && diag.lastTranslateOk === null) tHint.textContent = 'Nenhuma tradução foi feita nesta chamada ainda.';
    const vHint = document.getElementById('diagVoiceHint');
    if (vHint) {
      const hasVoice = ('speechSynthesis' in window) && !!pickVoice(state.targetLang);
      vHint.textContent = hasVoice
        ? `Seu aparelho tem voz para ${state.targetLang}. Ligue a leitura no botão de alto-falante da barra de baixo.`
        : `Seu aparelho não tem voz instalada para ${state.targetLang}: a tradução aparece escrita, mas não será falada.`;
    }
    startDiagMeter();
    // destrava o áudio do iPhone com este toque
    if ('speechSynthesis' in window) {
      try {
        const u = new SpeechSynthesisUtterance(' ');
        u.volume = 0;
        window.speechSynthesis.speak(u);
      } catch (e) {}
    }
  }
  function closeVoiceDiag() {
    document.getElementById('voiceDiagModal')?.classList.add('hidden');
    stopDiagMeter();
  }

  on('btnVoiceDiag', 'click', openVoiceDiag);
  on('btnOpenVoiceDiagFromBar', 'click', openVoiceDiag);
  on('btnCloseVoiceDiag', 'click', closeVoiceDiag);
  on('btnCloseVoiceDiagBtn', 'click', closeVoiceDiag);

  on('btnVoiceDiagTest', 'click', async () => {
    diag.micPeak = 0;
    diag.speechError = null;
    state.speechBlocked = false;
    // 1) religa a escuta
    restartSpeechRecognition('Religando a escuta...');
    // 2) testa a tradução de verdade
    const sample = state.speakLang.startsWith('pt') ? 'Olá, esta é uma tradução de teste.' : 'Hello, this is a translation test.';
    try {
      const out = await translateText(sample, state.speakLang, state.targetLang);
      diag.lastTranslateOk = !!out;
      diag.lastTranslateFrom = state.speakLang;
      diag.lastTranslateTo = state.targetLang;
    } catch (e) { diag.lastTranslateOk = false; }
    // 3) testa a voz de leitura
    if ('speechSynthesis' in window) {
      diag.voiceError = null;
      const phrase = state.targetLang.startsWith('pt') ? 'Teste de voz funcionando.' : 'Voice test working.';
      speakText(phrase, state.targetLang === 'pt' ? 'pt-BR' : (state.targetLang === 'en' ? 'en-US' : state.targetLang));
    }
    startDiagMeter();
    setTimeout(updateVoiceDiag, 400);
    showNotification('Teste rodando: fale algo agora.');
  });

  // ==========================================
  // MODO SEGURO DE FALA (não usa reconhecimento de voz)
  // ==========================================
  // Envia a voz gravada sem depender do reconhecimento do navegador.
  // A tradução escrita continua disponível pelo chat.
  const safeMic = {
    recorder: null,
    chunks: [],
    recording: false,
    starting: false,
    session: 0,
    startedAt: 0,
    meterTimer: null,
    audioCtx: null,
    stream: null
  };

  function safeMicSetStatus(text, color) {
    const el = document.getElementById('safeMicStatus');
    if (el) { el.textContent = text; el.className = 'text-[11px] font-medium ' + (color || 'text-neutral-400'); }
  }

  function safeMicShowOriginal(text) {
    const el = document.getElementById('safeMicOriginal');
    if (el) el.textContent = text || '—';
  }
  function safeMicShowTranslated(text) {
    const el = document.getElementById('safeMicTranslated');
    if (el) el.textContent = text || '—';
  }

  async function ensureSafeMicStream() {
    if (state.localStream && state.localStream.getAudioTracks().some(t => t.readyState === 'live' && t.enabled)) {
      return state.localStream;
    }
    if (safeMic.stream && safeMic.stream.getAudioTracks().some(t => t.readyState === 'live' && t.enabled)) {
      return safeMic.stream;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    safeMic.stream = stream;
    return stream;
  }

  function startSafeMicMeter(stream) {
    stopSafeMicMeter();
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      safeMic.audioCtx = new Ctx();
      const analyser = safeMic.audioCtx.createAnalyser();
      analyser.fftSize = 64;
      safeMic.audioCtx.createMediaStreamSource(stream).connect(analyser);
      const arr = new Uint8Array(analyser.frequencyBinCount);
      safeMic.meterTimer = setInterval(() => {
        analyser.getByteFrequencyData(arr);
        let sum = 0;
        for (let i = 0; i < arr.length; i++) sum += arr[i];
        const level = sum / arr.length;
        const bar = document.getElementById('safeMicBar');
        if (bar) bar.style.width = Math.min(100, Math.round(level * 1.6)) + '%';
      }, 120);
    } catch (e) {}
  }

  function stopSafeMicMeter() {
    if (safeMic.meterTimer) { clearInterval(safeMic.meterTimer); safeMic.meterTimer = null; }
    if (safeMic.audioCtx) { safeMic.audioCtx.close().catch(() => {}); safeMic.audioCtx = null; }
    const bar = document.getElementById('safeMicBar');
    if (bar) bar.style.width = '0%';
  }

  async function startSafeMicRecording() {
    if (safeMic.recording || safeMic.starting || !state.callActive) return;
    const session = ++safeMic.session;
    safeMic.starting = true;
    safeMicSetStatus('Abrindo microfone…', 'text-neutral-400');
    unlockAudioPlayback();
    try {
      const sourceStream = await ensureSafeMicStream();
      const stream = new MediaStream(sourceStream.getAudioTracks());
      if (!stream.getAudioTracks().length) throw new Error('Faixa de áudio indisponível');
      if (session !== safeMic.session || !state.callActive) {
        if (safeMic.stream) safeMic.stream.getTracks().forEach(track => track.stop());
        safeMic.stream = null;
        return;
      }
      const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', ''].find(t => {
        try { return !t || MediaRecorder.isTypeSupported(t); } catch (e) { return false; }
      });
      safeMic.chunks = [];
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      safeMic.recorder = recorder;
      recorder.ondataavailable = (e) => { if (e.data && e.data.size) safeMic.chunks.push(e.data); };
      recorder.onstop = () => {
        if (session === safeMic.session) finishSafeMicRecording();
      };
      recorder.start();
      safeMic.recording = true;
      safeMic.startedAt = Date.now();
      safeMicSetStatus('Gravando…', 'text-ok-400');
      const label = document.getElementById('btnSafeMicRecordLabel');
      if (label) label.textContent = 'Parar e enviar';
      startSafeMicMeter(stream);
    } catch (err) {
      if (session !== safeMic.session) return;
      safeMicSetStatus('Microfone indisponível', 'text-danger-400');
      showNotification('Não consegui usar o microfone. Libere a permissão e tente de novo.');
    } finally {
      if (session === safeMic.session) safeMic.starting = false;
    }
  }

  function stopSafeMicRecording() {
    if (safeMic.starting) {
      safeMic.session++;
      safeMic.starting = false;
      safeMicSetStatus('Pronto', 'text-neutral-400');
      return;
    }
    if (!safeMic.recording) return;
    safeMic.recording = false;
    stopSafeMicMeter();
    try { safeMic.recorder.stop(); } catch (e) {}
    const label = document.getElementById('btnSafeMicRecordLabel');
    if (label) label.textContent = 'Segurar para falar';
  }

  async function finishSafeMicRecording() {
    const seconds = (Date.now() - safeMic.startedAt) / 1000;
    if (seconds < 0.6 || !safeMic.chunks.length) {
      safeMicSetStatus('Muito curto', 'text-accent-400');
      return;
    }

    const blob = new Blob(safeMic.chunks, { type: safeMic.chunks[0].type || 'audio/webm' });
    const sent = await sendAudioToPeer(blob);
    if (!state.callActive) return;
    if (!sent) {
      safeMicSetStatus('Colega desconectado', 'text-danger-400');
      safeMicShowOriginal('O áudio não foi enviado. Conecte-se e tente de novo.');
      safeMicShowTranslated('—');
      return;
    }

    safeMicSetStatus('Voz enviada', 'text-ok-400');
    safeMicShowOriginal('Mensagem de voz enviada ao colega.');
    safeMicShowTranslated('Digite o que você falou no chat para enviar a tradução escrita.');
    addTranscriptItem({
      sender: state.userName + ' (voz)',
      isSelf: true,
      original: 'Mensagem de voz enviada.',
      translated: null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  }

  // Envia o áudio gravado para o colega tocar (funciona em qualquer navegador)
  function sendAudioToPeer(blob) {
    if (!state.callActive || !state.dataConnection?.open) return Promise.resolve(false);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = String(reader.result || '').split(',')[1] || '';
        resolve(!!base64 && sendData({
          type: 'voice_clip',
          sender: state.userName,
          mime: blob.type || 'audio/webm',
          data: base64
        }));
      };
      reader.onerror = () => resolve(false);
      reader.readAsDataURL(blob);
    });
  }

  function playIncomingVoiceClip(data) {
    try {
      const bytes = Uint8Array.from(atob(data.data), c => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: data.mime || 'audio/webm' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.autoplay = true;
      audio.playsInline = true;
      audio.volume = 1;
      audio.play().catch(() => {
        diag.playBlocked = true;
        updateVoiceDiag();
        showNotificationOnce('play-blocked', 'Toque na tela uma vez para liberar o som do colega.');
      });
      audio.onended = () => URL.revokeObjectURL(url);
    } catch (e) {}
  }

  function openSafeMic() {
    document.getElementById('safeMicModal')?.classList.remove('hidden');
    unlockAudioPlayback();
    safeMicSetStatus('Pronto', 'text-neutral-400');
    safeMicShowOriginal('—');
    safeMicShowTranslated('—');
    const btn = document.getElementById('btnSafeMicRecord');
    if (btn) {
      const isTouch = ('ontouchstart' in window);
      const label = document.getElementById('btnSafeMicRecordLabel');
      if (label) label.textContent = isTouch ? 'Segurar para falar' : 'Clique para falar';
    }
  }
  function closeSafeMic() {
    stopSafeMicRecording();
    document.getElementById('safeMicModal')?.classList.add('hidden');
  }

  on('btnSafeMic', 'click', openSafeMic);
  on('btnCloseSafeMic', 'click', closeSafeMic);
  on('btnCloseSafeMicBtn', 'click', closeSafeMic);
  on('btnSafeMicRetry', 'click', () => { startSafeMicRecording(); });

  // Segurar para falar (celular) e clique para começar/parar (computador)
  (function bindSafeMicButton() {
    const btn = document.getElementById('btnSafeMicRecord');
    if (!btn) return;
    const isTouch = ('ontouchstart' in window);
    if (isTouch) {
      btn.addEventListener('pointerdown', (e) => { e.preventDefault(); startSafeMicRecording(); });
      btn.addEventListener('pointerup', (e) => { e.preventDefault(); stopSafeMicRecording(); });
      btn.addEventListener('pointercancel', () => stopSafeMicRecording());
      btn.addEventListener('pointerleave', () => { if (safeMic.recording) stopSafeMicRecording(); });
    } else {
      btn.addEventListener('click', () => {
        if (safeMic.recording || safeMic.starting) stopSafeMicRecording();
        else startSafeMicRecording();
      });
    }
  })();

  // ==========================================
  // DESBLOQUEIO DE ÁUDIO (autoplay do celular)
  // ==========================================
  // Android/iPhone bloqueiam som sem toque na tela. Este áudio silencioso,
  // iniciado no primeiro toque, libera o canal para a voz do colega.
  let audioUnlocked = false;
  function unlockAudioPlayback() {
    if (audioUnlocked) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) {
        const ctx = new Ctx();
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.value = 0.0001;
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      }
      if (remoteVideo) {
        remoteVideo.muted = false;
        remoteVideo.play().catch(() => {});
      }
      audioUnlocked = true;
    } catch (e) {}
  }
  ['pointerdown', 'touchstart', 'click'].forEach(evt => {
    window.addEventListener(evt, unlockAudioPlayback, { once: true, passive: true });
  });

  // Se o navegador bloquear a reprodução, avisa e reage no próximo toque
  function guardPlayback(el, label) {
    if (!el) return;
    el.addEventListener('play', () => { diag.playBlocked = false; updateVoiceDiag(); });
    el.play && el.play().catch(() => {
      diag.playBlocked = true;
      updateVoiceDiag();
      showNotificationOnce('play-blocked', 'Toque na tela uma vez para liberar o som do colega.');
    });
  }

  // ==========================================
  // RECONHECIMENTO DE FALA
  // ==========================================
  let speechRecognizer = null;
  let isRecognitionRunning = false;
  let speechRestartTimer = null;
  let localCaptionTimeout = null;
  let remoteCaptionTimeout = null;

  // Junta os pedaços que o Chrome manda e fecha a frase por pausa.
  // Sem isso, frases longas se perdem: cada pedaço sobrescreve o anterior.
  const speechBuffer = {
    text: '',
    lang: '',
    timer: null,
    flushAt: 0,
    lastSent: '',
    lastSentAt: 0
  };

  function flushSpeechBuffer(reason) {
    if (!state.callActive) {
      clearTimeout(speechBuffer.timer);
      speechBuffer.text = '';
      return;
    }
    clearTimeout(speechBuffer.timer);
    speechBuffer.timer = null;
    const phrase = (speechBuffer.text || '').trim();
    speechBuffer.text = '';
    if (!phrase) return;
    // evita repetir a mesma frase (o Chrome às vezes reemite o resultado final)
    const now = Date.now();
    if (phrase === speechBuffer.lastSent && now - speechBuffer.lastSentAt < 4000) return;

    if (!sendData({
      type: 'speech',
      sender: state.userName,
      text: phrase,
      lang: speechBuffer.lang || state.speakLang,
      timestamp: now
    })) return;
    speechBuffer.lastSent = phrase;
    speechBuffer.lastSentAt = now;

    addTranscriptItem({
      sender: state.userName,
      isSelf: true,
      original: phrase,
      translated: null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    diag.lastLocalSentAt = now;
    diag.lastLocalSentText = phrase;
    updateVoiceDiag();
  }

  // Envia um trecho assim que o navegador reconhece — sem espera nenhuma
  function sendSpeechNow(piece) {
    const clean = (piece || '').trim();
    if (!state.callActive || !clean) return;
    const now = Date.now();
    if (clean === speechBuffer.lastSent && now - speechBuffer.lastSentAt < 1200) return;

    if (!sendData({
      type: 'speech',
      sender: state.userName,
      text: clean,
      lang: state.speakLang,
      timestamp: now
    })) return;
    speechBuffer.lastSent = clean;
    speechBuffer.lastSentAt = now;
    addTranscriptItem({
      sender: state.userName,
      isSelf: true,
      original: clean,
      translated: null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    diag.lastLocalSentAt = now;
    diag.lastLocalSentText = clean;
    updateVoiceDiag();
  }

  // Se a pessoa pausou e voltou a falar, o trecho novo é independente
  function markSpeechBoundary() {
    if (Date.now() - (speechBuffer.lastSentAt || 0) > 1500) {
      speechBuffer.text = '';
      speechBuffer.flushAt = 0;
    }
  }

  function scheduleSpeechFlush(delay) {
    clearTimeout(speechBuffer.timer);
    speechBuffer.timer = setTimeout(() => flushSpeechBuffer('pausa'), delay);
  }

  function initSpeechRecognition() {
    if (!state.callActive) return;
    if (useAndroidStt) {
      startAndroidStt();
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // iPhone/Safari não têm reconhecimento de voz: avisa e segue com o chat + tradução
      state.speechUnsupported = true;
      showNotification('Este navegador não reconhece voz. Use o chat ou o botão "Falar meu texto".');
      return;
    }

    speechRecognizer = new SpeechRecognition();
    speechRecognizer.continuous = true;
    speechRecognizer.interimResults = true;
    speechRecognizer.lang = state.speakLang;

    speechRecognizer.onstart = () => {
      isRecognitionRunning = true;
      diag.isListening = true;
      diag.speechError = null;
      updateVoiceDiag();
    };

    speechRecognizer.onresult = (event) => {
      if (!state.callActive || state.isMuted) return;

      let interim = '';
      let finalPart = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const res = event.results[i];
        const txt = (res[0] && res[0].transcript) ? res[0].transcript : '';
        if (res.isFinal) finalPart += txt;
        else interim += txt;
      }

      triggerSpeakingWave(true);
      diag.lastResultAt = Date.now();
      diag.lastResultText = (finalPart || interim || '').trim();

      // TEMPO REAL: o trecho final vai embora na mesma hora, sem pausa de espera.
      if (finalPart.trim()) {
        markSpeechBoundary();
        speechBuffer.lang = state.speakLang;
        sendSpeechNow(finalPart.trim());
        speechBuffer.text = '';
      }

      // legenda local mostra a frase em construção + o que está sendo falado
      const preview = (speechBuffer.text + ' ' + interim).trim();
      if (preview) showLocalCaption(preview);
      if (speechBuffer.text && !speechBuffer.flushAt) speechBuffer.flushAt = Date.now();
      updateVoiceDiag();
    };

    speechRecognizer.onerror = (event) => {
      const code = event && event.error ? event.error : 'desconhecido';
      diag.speechError = code;
      diag.lastErrorAt = Date.now();
      // Erros que o navegador não recupera sozinho
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        state.speechBlocked = true;
        showNotificationOnce('mic-blocked', 'O navegador bloqueou o microfone para a escuta. Libere nas permissões do site e recarregue a página.');
      } else if (code === 'audio-capture') {
        showNotificationOnce('no-mic', 'Nenhum microfone foi encontrado pelo navegador.');
      } else if (code === 'network') {
        showNotificationOnce('rec-net', 'A escuta depende da internet e a conexão falhou. Vou tentar de novo.');
      } else if (code === 'language-not-supported') {
        showNotificationOnce('lang-ns', 'Este navegador não reconhece o idioma escolhido. Troque em "Falo" para PT ou EN.');
      } else if (code === 'no-speech') {
        // normal: ninguém falou na sessão. Não faz nada, o vigia religa.
      } else if (code === 'aborted') {
        // normal: reinício intencional
      } else {
        showNotificationOnce('rec-' + code, 'A escuta deu o erro "' + code + '". Veja o Diagnóstico de voz (tecla D).');
      }
      updateVoiceDiag();
    };

    speechRecognizer.onend = () => {
      isRecognitionRunning = false;
      diag.isListening = false;
      // o Chrome encerra a sessão a cada ~60s: fecha a frase antes de religar
      flushSpeechBuffer('fim de sessão');
      speechBuffer.flushAt = 0;
      diag.restarts = (diag.restarts || 0) + 1;
      updateVoiceDiag();
      if (!state.callActive || state.speechBlocked) return;
      if (state.autoRestartSpeech && !state.isMuted && state.localStream) {
        clearTimeout(speechRestartTimer);
        speechRestartTimer = setTimeout(() => {
          if (state.callActive && !isRecognitionRunning && !state.isMuted && !state.speechBlocked && speechRecognizer) {
            try { speechRecognizer.start(); } catch(e) {}
          }
        }, 400);
      }
    };

    if (!state.isMuted) {
      try { speechRecognizer.start(); } catch(e) {}
    }
  }

  // Reinicia a escuta já com o novo idioma (sem isso ela fica parada após a troca)
  function restartSpeechRecognition(reason) {
    if (useAndroidStt) {
      startAndroidStt();
      return;
    }
    if (!state.callActive || state.speechUnsupported) return;
    if (!speechRecognizer) { initSpeechRecognition(); return; }
    try {
      speechRecognizer.lang = state.speakLang;
      if (isRecognitionRunning) speechRecognizer.stop();
      // o onend reinicia sozinho; se não reiniciar em 1,2s, forçamos
      clearTimeout(speechRestartTimer);
      speechRestartTimer = setTimeout(() => {
        if (state.callActive && !isRecognitionRunning && !state.isMuted && !state.speechBlocked && speechRecognizer) {
          try { speechRecognizer.lang = state.speakLang; speechRecognizer.start(); } catch(e) {}
        }
      }, 1200);
      if (reason) showNotification(reason);
    } catch (e) {}
  }

  // Aviso repetido uma vez só (evita alerta em loop a cada reinício)
  const shownNotices = new Set();
  function showNotificationOnce(key, msg) {
    if (shownNotices.has(key)) return;
    shownNotices.add(key);
    showNotification(msg);
  }

  // ==========================================
  // PAINEL DE LEGENDAS AO VIVO (funciona em qualquer aparelho)
  // ==========================================
  const liveCaptionList = document.getElementById('liveCaptionList');
  let liveCaptionPanel = document.getElementById('liveCaptionPanel');
  const liveCaptionEmpty = document.getElementById('liveCaptionEmpty');

  function addLiveCaption(speaker, original, translated, isSelf) {
    if (!liveCaptionList) return;
    if (liveCaptionEmpty) liveCaptionEmpty.classList.add('hidden');
    const row = document.createElement('div');
    row.className = 'p-2 rounded-lg border ' + (isSelf
      ? 'bg-accent-950/50 border-accent-900/60'
      : 'bg-neutral-950/80 border-ok-900/50');
    row.innerHTML = `
      <div class="flex items-center justify-between mb-0.5">
        <span class="font-bold ${isSelf ? 'text-accent-400' : 'text-ok-400'}">${escapeHtml(speaker)}</span>
        <span class="text-[10px] text-neutral-500">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <div class="text-white leading-snug">${escapeHtml(translated || original || '')}</div>
      ${original && translated && original !== translated
        ? `<div class="text-[10px] text-neutral-400 italic mt-0.5">Original: ${escapeHtml(original)}</div>` : ''}
    `;
    liveCaptionList.appendChild(row);
    while (liveCaptionList.children.length > 120) liveCaptionList.removeChild(liveCaptionList.firstChild);
    // rola só o painel de legendas (antes podia arrastar a página no celular)
    if (liveCaptionPanel) liveCaptionPanel.scrollTop = liveCaptionPanel.scrollHeight;
  }

  function clearLiveCaptions() {
    if (liveCaptionList) liveCaptionList.innerHTML = '';
    if (liveCaptionEmpty) liveCaptionEmpty.classList.remove('hidden');
  }

  function showLocalCaption(text) {
    if (!localLiveCaptionText || !localLiveCaptionOverlay) return;
    localLiveCaptionText.textContent = text;
    localLiveCaptionOverlay.classList.remove('hidden');
    clearTimeout(localCaptionTimeout);
    localCaptionTimeout = setTimeout(() => {
      localLiveCaptionOverlay.classList.add('hidden');
    }, 3000);
  }

  function showRemoteCaption(speaker, original, translated) {
    if (!remoteLiveCaptionOverlay) return;
    if (remoteLiveCaptionSpeaker) remoteLiveCaptionSpeaker.textContent = speaker + ' falando:';
    if (remoteLiveCaptionTranslated) remoteLiveCaptionTranslated.textContent = translated;
    if (remoteLiveCaptionOriginal) remoteLiveCaptionOriginal.textContent = 'Original: ' + original;
    remoteLiveCaptionOverlay.classList.remove('hidden');

    clearTimeout(remoteCaptionTimeout);
    remoteCaptionTimeout = setTimeout(() => {
      hideRemoteCaption();
    }, 4500);
  }

  function hideRemoteCaption() {
    if (remoteLiveCaptionOverlay) remoteLiveCaptionOverlay.classList.add('hidden');
  }

  function triggerSpeakingWave(isLocal) {
    const wave = isLocal ? localAudioWave : remoteAudioWave;
    if (!wave) return;
    wave.classList.remove('hidden');
    clearTimeout(isLocal ? window.localWaveTimer : window.remoteWaveTimer);
    const timer = setTimeout(() => {
      wave.classList.add('hidden');
    }, 1500);
    if (isLocal) window.localWaveTimer = timer; else window.remoteWaveTimer = timer;
  }

  // ==========================================
  // TRADUÇÃO EM TEMPO REAL
  // ==========================================

  // fetch com tempo limite: um serviço lento não pode travar a frase
  async function fetchWithTimeout(url, ms) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms);
    try {
      return await fetch(url, { signal: ctrl.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  const TRANSLATION_ERROR = 'Tradução indisponível. O texto original está abaixo; tente novamente.';

  function decodeTranslation(text) {
    const entities = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ' };
    return String(text)
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
      .replace(/&(amp|quot|apos|lt|gt|nbsp);/g, (_, name) => entities[name]);
  }

  async function translateText(text, fromLang, toLang) {
    const original = String(text || '').trim();
    const src = (fromLang || 'auto').split('-')[0].toLowerCase();
    const tgt = (toLang || 'pt').split('-')[0].toLowerCase();
    if (!original) return null;
    if (src === tgt && src !== 'auto') return original;

    try {
      const gUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${src}&tl=${tgt}&dt=t&q=${encodeURIComponent(original)}`;
      const gRes = await fetchWithTimeout(gUrl, 4000);
      if (gRes && gRes.ok) {
        const gJson = await gRes.json();
        const translated = Array.isArray(gJson?.[0])
          ? gJson[0].map(item => item && item[0]).join('').trim()
          : '';
        if (translated) return translated;
      }
    } catch (e) {}

    if (src !== 'auto' && original.length <= 500) {
      try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(original)}&langpair=${src}|${tgt}`;
        const res = await fetchWithTimeout(url, 5000);
        if (res && res.ok) {
          const data = await res.json();
          const translated = decodeTranslation(data.responseData?.translatedText || '').trim();
          if (String(data.responseStatus) === '200' && translated) return translated;
        }
      } catch (e) {}
    }

    return null;
  }

  async function translateForTarget(text, fromLang, targetLang) {
    const translated = await translateText(text, fromLang, targetLang);
    const failed = !translated;
    return { translated: failed ? null : translated, failed, targetLang };
  }

  // Fila de traduções: cada trecho traduz na hora, em paralelo.
  // Nada espera a vez do anterior (era isso que criava o atraso em cascata).
  let speechSeq = 0;
  let speechRendered = 0;
  const speechPending = new Map();

  async function handleRemoteSpeech(data) {
    if (!state.callActive) return;
    const roomId = state.roomId;
    triggerSpeakingWave(false);
    showRemoteCaption(data.sender || 'Colega', data.text, 'Traduzindo…');

    const seq = ++speechSeq;
    const result = await translateForTarget(data.text, data.lang, state.targetLang);
    if (!state.callActive || state.roomId !== roomId) return;
    speechPending.set(seq, { data, result });

    while (speechPending.has(speechRendered + 1)) {
      const next = speechPending.get(speechRendered + 1);
      speechPending.delete(speechRendered + 1);
      speechRendered++;
      renderRemoteSpeech(next.data, next.result);
    }

    diag.lastTranslateOk = !result.failed;
    diag.lastTranslateFrom = data.lang || '?';
    diag.lastTranslateTo = result.targetLang;
    diag.lastTranslateAt = Date.now();
    diag.lastRemoteAt = Date.now();
    diag.lastRemoteText = data.text || '';
    diag.lastRemoteTranslated = result.translated || '';
    updateVoiceDiag();
  }

  function renderRemoteSpeech(data, result) {
    const speaker = (data.sender || 'Colega') + (data.forceSpeech ? ' (Voz)' : '');
    const displayed = result.failed ? TRANSLATION_ERROR : result.translated;
    showRemoteCaption(speaker, data.text, displayed);
    addLiveCaption(speaker, data.text, displayed, false);
    setTimeout(playSoftBeep, 0);

    if (!result.failed && (state.ttsEnabled || data.forceSpeech)) {
      speakText(result.translated, result.targetLang);
    }

    addTranscriptItem({
      sender: speaker,
      isSelf: false,
      original: data.text,
      translated: result.translated,
      translationError: result.failed ? TRANSLATION_ERROR : null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  }

  // Escolhe a voz certa do idioma (no iPhone, sem isso o Safari pode ficar mudo)
  function pickVoice(langCode) {
    const want = (langCode || 'pt-BR').toLowerCase();
    const short = want.split('-')[0];
    const voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
    if (!voices || !voices.length) return null;
    return voices.find(v => v.lang && v.lang.toLowerCase() === want)
        || voices.find(v => v.lang && v.lang.toLowerCase().replace('_', '-') === want)
        || voices.find(v => v.lang && v.lang.toLowerCase().startsWith(short))
        || null;
  }

  const speechQueue = [];
  let currentUtterance = null;
  let speechQueueGeneration = 0;

  function cancelQueuedSpeech() {
    speechQueueGeneration++;
    speechQueue.length = 0;
    currentUtterance = null;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }

  function processSpeechQueue() {
    if (currentUtterance || !speechQueue.length || !('speechSynthesis' in window)) return;
    const item = speechQueue.shift();
    const generation = speechQueueGeneration;
    const utterance = new SpeechSynthesisUtterance(item.text.slice(0, 500));
    currentUtterance = utterance;
    utterance.lang = item.langCode || 'pt-BR';
    const voice = pickVoice(utterance.lang);
    if (voice) utterance.voice = voice;
    utterance.rate = 1;
    utterance.pitch = 1;
    const finish = () => {
      if (generation !== speechQueueGeneration || currentUtterance !== utterance) return;
      currentUtterance = null;
      processSpeechQueue();
    };
    utterance.onend = finish;
    utterance.onerror = (e) => {
      if (generation !== speechQueueGeneration) return;
      diag.voiceError = (e && e.error) || 'erro';
      updateVoiceDiag();
      finish();
    };
    diag.lastSpokenLang = utterance.lang;
    diag.lastSpokenVoice = voice ? voice.name : 'padrão do sistema';
    diag.lastSpokenAt = Date.now();
    try { window.speechSynthesis.speak(utterance); } catch (e) { diag.voiceError = 'não iniciou'; finish(); }
    updateVoiceDiag();
  }

  function speakText(text, langCode) {
    if (!text || !('speechSynthesis' in window)) return;
    if (speechQueue.length >= 20) speechQueue.shift();
    speechQueue.push({ text: String(text), langCode });
    processSpeechQueue();
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => updateVoiceDiag();
  }

  // ==========================================
  // ADIÇÃO DE MENSAGENS AO HISTÓRICO
  // ==========================================

  function addTranscriptItem(item) {
    state.transcriptHistory.push(item);
    renderTranscriptList();

    if (!state.isChatDrawerOpen) {
      chatNotificationBadge?.classList.remove('hidden');
      document.getElementById('chatNotificationBadgeBar')?.classList.remove('hidden');
    }
  }

  on('btnSendChat', 'click', sendManualChatMessage);
  if (inputChatFallback) {
    inputChatFallback.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendManualChatMessage();
    });
    // Avisa o colega "está digitando..." enquanto o texto está sendo escrito
    inputChatFallback.addEventListener('input', () => {
      const hasText = inputChatFallback.value.length > 0;
      if (hasText && !state.isTypingSent) {
        state.isTypingSent = true;
        sendData({ type: 'typing', isTyping: true, userName: state.userName });
      } else if (!hasText && state.isTypingSent) {
        state.isTypingSent = false;
        sendData({ type: 'typing', isTyping: false });
      }
      clearTimeout(state.typingStopTimer);
      state.typingStopTimer = setTimeout(() => {
        if (state.isTypingSent) {
          state.isTypingSent = false;
          sendData({ type: 'typing', isTyping: false });
        }
      }, 3000);
    });
  }

  // ==========================================
  // "ESTÁ DIGITANDO..."
  // ==========================================
  let typingHideTimer = null;
  function showTypingIndicator(isTyping, name) {
    const el = document.getElementById('typingIndicator');
    const txt = document.getElementById('typingIndicatorText');
    if (!el) return;
    clearTimeout(typingHideTimer);
    if (isTyping) {
      if (txt) txt.textContent = `${name || 'Colega'} está digitando...`;
      el.classList.remove('hidden');
      typingHideTimer = setTimeout(() => el.classList.add('hidden'), 4000);
    } else {
      el.classList.add('hidden');
    }
  }

  async function sendManualChatMessage() {
    if (!inputChatFallback) return;
    const text = inputChatFallback.value.trim();
    if (!text) return;
    const sent = sendData({
      type: 'chat',
      sender: state.userName,
      text: text,
      lang: state.speakLang
    });
    if (!sent) {
      showNotification('Colega desconectado. A mensagem não foi enviada.');
      return;
    }
    inputChatFallback.value = '';

    addTranscriptItem({
      sender: state.userName,
      isSelf: true,
      original: text,
      translated: null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    addLiveCaption(state.userName, text, text, true);

    state.isTypingSent = false;
    sendData({ type: 'typing', isTyping: false });
  }

  async function handleIncomingChat(data) {
    const roomId = state.roomId;
    showRemoteCaption(data.sender || 'Colega', data.text, 'Traduzindo…');
    const result = await translateForTarget(data.text, data.lang, state.targetLang);
    if (!state.callActive || state.roomId !== roomId) return;
    const displayed = result.failed ? TRANSLATION_ERROR : result.translated;
    showRemoteCaption(data.sender || 'Colega', data.text, displayed);
    addLiveCaption(data.sender || 'Colega', data.text, displayed, false);
    playSoftBeep();
    addTranscriptItem({
      sender: data.sender || 'Colega',
      isSelf: false,
      original: data.text,
      translated: result.translated,
      translationError: result.failed ? TRANSLATION_ERROR : null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  }

  // ==========================================
  // CONTROLES DE MÍDIA
  // ==========================================

  // Só mostra "Virar câmera" quando existe mais de uma câmera no aparelho
  async function updateFlipCameraVisibility() {
    const btn = document.getElementById('btnFlipCamera');
    if (!btn || !navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cams = devices.filter(d => d.kind === 'videoinput');
      if (cams.length > 1) {
        btn.classList.remove('hidden');
        btn.classList.add('flex');
      } else {
        btn.classList.add('hidden');
        btn.classList.remove('flex');
      }
    } catch (e) {}
  }
  updateFlipCameraVisibility();

  on('btnFlipCamera', 'click', async () => {
    if (!state.localStream || !state.isVideoEnabled) {
      showNotification('Ligue a câmera primeiro para alternar.');
      return;
    }

    const newFacingMode = state.currentFacingMode === 'user' ? 'environment' : 'user';
    try {
      const newVideoStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      const newVideoTrack = newVideoStream.getVideoTracks()[0];
      const oldVideoTrack = state.localStream.getVideoTracks()[0];

      if (oldVideoTrack) {
        oldVideoTrack.stop();
        state.localStream.removeTrack(oldVideoTrack);
      }
      state.localStream.addTrack(newVideoTrack);
      state.currentFacingMode = newFacingMode;

      if (localVideo) localVideo.srcObject = state.localStream;
      applyMirrorSetting();

      if (state.call?.peerConnection) {
        const sender = state.call.peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender) sender.replaceTrack(newVideoTrack);
      }

      showNotification(newFacingMode === 'environment' ? 'Câmera traseira ativada' : 'Câmera frontal ativada');
    } catch (e) {
      showNotification('Não foi possível alternar de câmera.');
    }
  });

  on(btnToggleMic, 'click', () => {
    state.isMuted = !state.isMuted;
    updateVoiceDiag();
    if (state.localStream) {
      state.localStream.getAudioTracks().forEach(track => {
        track.enabled = !state.isMuted;
      });
    }

    if (state.isMuted) {
      if (btnToggleMic) btnToggleMic.className = 'w-11 h-11 rounded-full bg-danger-500/15 text-danger-400 flex items-center justify-center transition active:scale-95';
      if (iconMic) iconMic.setAttribute('data-lucide', 'mic-off');
      if (speechRecognizer && isRecognitionRunning) {
        try { speechRecognizer.stop(); } catch(e) {}
      }
    } else {
      if (btnToggleMic) btnToggleMic.className = 'w-11 h-11 rounded-full bg-raised hover:bg-line text-neutral-100 flex items-center justify-center transition active:scale-95';
      if (iconMic) iconMic.setAttribute('data-lucide', 'mic');
      if (state.callActive && speechRecognizer && !isRecognitionRunning) {
        try { speechRecognizer.start(); } catch(e) {}
      }
    }
    try { lucide.createIcons(); } catch(e) {}
  });

  on(btnToggleCamera, 'click', async () => {
    state.isVideoEnabled = !state.isVideoEnabled;

    if (state.localStream) {
      let videoTrack = state.localStream.getVideoTracks()[0];
      if (!videoTrack && state.isVideoEnabled) {
        try {
          const videoStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: state.currentFacingMode }
          });
          videoTrack = videoStream.getVideoTracks()[0];
          state.localStream.addTrack(videoTrack);
          if (state.call?.peerConnection) {
            state.call.peerConnection.addTrack(videoTrack, state.localStream);
          }
        } catch (e) {
          state.isVideoEnabled = false;
          alert('Não foi possível ligar a câmera.');
          return;
        }
      }
      if (videoTrack) videoTrack.enabled = state.isVideoEnabled;
    }

    if (state.isVideoEnabled) {
      if (localVideo) localVideo.classList.remove('hidden');
      if (localAvatarBox) localAvatarBox.classList.add('hidden');
      if (btnToggleCamera) btnToggleCamera.className = 'w-11 h-11 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-200 flex items-center justify-center border border-neutral-700 transition active:scale-95';
      if (iconCamera) iconCamera.setAttribute('data-lucide', 'video');
    } else {
      if (localVideo) localVideo.classList.add('hidden');
      if (localAvatarBox) localAvatarBox.classList.remove('hidden');
      if (btnToggleCamera) btnToggleCamera.className = 'w-11 h-11 rounded-full bg-danger-600/30 text-danger-400 border border-danger-500/50 flex items-center justify-center transition active:scale-95';
      if (iconCamera) iconCamera.setAttribute('data-lucide', 'video-off');
    }

    sendData({ type: 'video_toggle', enabled: state.isVideoEnabled });
    try { lucide.createIcons(); } catch(e) {}
  });

  if (btnShareScreen) {
    btnShareScreen.addEventListener('click', async () => {
      if (!state.isSharingScreen) {
        try {
          const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          state.screenStream = screenStream;
          state.isSharingScreen = true;
          const screenTrack = screenStream.getVideoTracks()[0];
          if (localVideo) {
            localVideo.srcObject = screenStream;
            localVideo.classList.remove('hidden');
          }
          if (localAvatarBox) localAvatarBox.classList.add('hidden');

          if (state.call?.peerConnection) {
            const sender = state.call.peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
            if (sender) sender.replaceTrack(screenTrack);
          }

          btnShareScreen.className = 'w-11 h-11 rounded-full bg-accent-500 text-[#0d0d0f] flex items-center justify-center transition active:scale-95';
          screenTrack.onended = () => stopScreenShare();
        } catch (e) {}
      } else {
        stopScreenShare();
      }
    });
  }

  function stopScreenShare() {
    if (state.screenStream) {
      state.screenStream.getTracks().forEach(t => t.stop());
      state.screenStream = null;
    }
    state.isSharingScreen = false;
    if (btnShareScreen) {
      btnShareScreen.className = 'w-11 h-11 rounded-full bg-raised hover:bg-line text-neutral-300 flex items-center justify-center transition active:scale-95 hidden sm:flex';
    }

    if (state.localStream) {
      const cameraTrack = state.localStream.getVideoTracks()[0];
      if (localVideo) localVideo.srcObject = state.localStream;
      if (cameraTrack && state.call?.peerConnection) {
        const sender = state.call.peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender) sender.replaceTrack(cameraTrack);
      }
      if (!state.isVideoEnabled) {
        if (localVideo) localVideo.classList.add('hidden');
        if (localAvatarBox) localAvatarBox.classList.remove('hidden');
      }
    }
  }

  function updateTTSButton() {
    if (!btnToggleTTS) return;
    btnToggleTTS.className = state.ttsEnabled
      ? 'w-11 h-11 rounded-full bg-ok-600/20 text-ok-300 border border-ok-500/30 flex items-center justify-center transition active:scale-95'
      : 'w-11 h-11 rounded-full bg-raised hover:bg-line text-neutral-300 flex items-center justify-center transition active:scale-95';
    btnToggleTTS.title = state.ttsEnabled ? 'Desativar leitura da tradução' : 'Ouvir a tradução por voz';
    btnToggleTTS.setAttribute('aria-pressed', String(state.ttsEnabled));
    const icon = document.getElementById('iconTTS');
    if (icon) icon.setAttribute('data-lucide', state.ttsEnabled ? 'volume-2' : 'volume-x');
    try { if (window.lucide) lucide.createIcons(); } catch (e) {}
  }

  on(btnToggleTTS, 'click', () => {
    state.ttsEnabled = !state.ttsEnabled;
    if (!state.ttsEnabled) cancelQueuedSpeech();
    updateTTSButton();
    showNotification(state.ttsEnabled ? 'Voz sintetizada ativada' : 'Voz sintetizada desativada');
  });

  function buildInviteUrl() {
    return `${window.location.origin}${window.location.pathname}?room=${state.roomId}`;
  }

  function shareInvite() {
    const inviteUrl = buildInviteUrl();
    const text = `Entre na minha chamada no LinguaCall: ${inviteUrl}`;
    // 1) Compartilhar nativo (celular): abre WhatsApp, Telegram etc.
    if (navigator.share) {
      navigator.share({ title: 'LinguaCall', text: text, url: inviteUrl })
        .catch(() => { copyInvite(inviteUrl); });
      return;
    }
    copyInvite(inviteUrl);
  }

  function copyInvite(inviteUrl) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(inviteUrl).then(() => {
        showNotification('Link copiado!');
      }).catch(() => { prompt('Copie o link:', inviteUrl); });
    } else {
      prompt('Copie o link:', inviteUrl);
    }
  }

  on('btnCopyInvite', 'click', shareInvite);
  on('btnShareInviteBig', 'click', shareInvite);

  on('btnEndCall', 'click', () => {
    if (confirm('Deseja encerrar a ligação? O histórico será arquivado.')) {
      cleanupAndExitCall();
    }
  });

  function cleanupAndExitCall(silent = false) {
    if (!state.callActive) return;
    if (!silent) sendData({ type: 'call_end' });

    const duration = callTimerDisplay ? callTimerDisplay.textContent : '00:00';
    saveCallToArchive(state.roomId, duration, state.transcriptHistory);
    saveCallNotes(state.roomId);

    state.callActive = false;
    stopAndroidStt();
    clearReconnectTimers();
    clearTimeout(speechRestartTimer);
    clearTimeout(speechBuffer.timer);
    clearTimeout(state.typingStopTimer);
    clearTimeout(localCaptionTimeout);
    clearTimeout(remoteCaptionTimeout);
    clearTimeout(window.localWaveTimer);
    clearTimeout(window.remoteWaveTimer);
    speechBuffer.text = '';
    speechPending.clear();
    cancelQueuedSpeech();
    closeSafeMic();
    stopDiagMeter();
    document.getElementById('voiceDiagModal')?.classList.add('hidden');

    if (speechRecognizer) {
      speechRecognizer.onstart = null;
      speechRecognizer.onresult = null;
      speechRecognizer.onerror = null;
      speechRecognizer.onend = null;
      try { speechRecognizer.abort(); } catch (e) {}
      speechRecognizer = null;
    }
    isRecognitionRunning = false;
    diag.isListening = false;

    stopScreenShare();
    stopSecondCamera();
    stopRecording();
    stopNetworkMonitor();
    clearInterval(state.timerInterval);
    state.timerInterval = null;

    if (state.localStream) state.localStream.getTracks().forEach(track => track.stop());
    if (state.remoteStream) state.remoteStream.getTracks().forEach(track => track.stop());
    if (safeMic.stream) safeMic.stream.getTracks().forEach(track => track.stop());
    safeMic.stream = null;
    if (localVideo) localVideo.srcObject = null;
    if (remoteVideo) {
      remoteVideo.srcObject = null;
      remoteVideo.classList.add('hidden');
    }

    detachConnection(state.call);
    detachConnection(state.dataConnection);
    if (state.peer && !state.peer.destroyed) state.peer.destroy();

    state.call = null;
    state.dataConnection = null;
    state.peer = null;
    state.localStream = null;
    state.remoteStream = null;
    state.roomId = null;
    state.callStartTime = null;
    state.hasConnectedBefore = false;
    state.remotePeerId = null;
    state.isReconnecting = false;
    state.reconnectAttempts = 0;
    state.isMuted = false;
    state.ttsEnabled = false;
    state.isTypingSent = false;
    state.transcriptHistory = [];
    state.savedVocab = [];
    if (callTimerDisplay) callTimerDisplay.textContent = '00:00';
    if (btnToggleMic) btnToggleMic.className = 'w-11 h-11 rounded-full bg-raised hover:bg-line text-neutral-100 flex items-center justify-center transition active:scale-95';
    if (iconMic) iconMic.setAttribute('data-lucide', 'mic');
    if (remoteUserNameDisplay) remoteUserNameDisplay.textContent = 'Aguardando colega...';
    if (remoteUserAvatar) remoteUserAvatar.textContent = 'C';
    if (remoteLangBadge) remoteLangBadge.textContent = '--';
    if (remoteStatusIndicator) remoteStatusIndicator.textContent = 'Desconectado';
    if (remoteAvatarBox) remoteAvatarBox.classList.remove('hidden');
    if (localAudioWave) localAudioWave.classList.add('hidden');
    if (remoteAudioWave) remoteAudioWave.classList.add('hidden');
    hideRemoteCaption();
    showTypingIndicator(false);
    updateTTSButton();
    try { if (window.lucide) lucide.createIcons(); } catch (e) {}

    if (mainHeader) mainHeader.classList.remove('hidden');
    if (callScreen) callScreen.classList.add('hidden');
    if (lobbyScreen) lobbyScreen.classList.remove('hidden');
    updateConnectionBadge('Desconectado', 'ready');
    updateListenStatusBar();
    window.history.pushState({}, '', window.location.pathname);
    if (!silent) showNotification('Reunião finalizada e salva em "Reuniões"!');
    if (pendingAppReload) setTimeout(() => window.location.reload(), 300);
  }

  // ==========================================
  // BLOCO DE NOTAS DURANTE A CHAMADA
  // ==========================================
  let callNotesPanel = document.getElementById('callNotesPanel');
  const callNotesText = document.getElementById('callNotesText');
  const callNotesStatus = document.getElementById('callNotesStatus');

  function notesKey(roomId) {
    return 'lc_call_notes_' + (roomId || 'avulsa');
  }

  function loadCallNotes(roomId) {
    if (!callNotesText) return;
    callNotesText.value = localStorage.getItem(notesKey(roomId)) || '';
    if (callNotesStatus) callNotesStatus.textContent = 'Salvo automaticamente';
  }

  function saveCallNotes(roomId) {
    if (!callNotesText) return;
    try {
      const text = callNotesText.value;
      if (text && text.trim()) localStorage.setItem(notesKey(roomId), text);
      if (callNotesStatus) callNotesStatus.textContent = 'Salvo ✓';
    } catch (e) {}
  }

  on('btnCallNotes', 'click', () => {
    if (!callNotesPanel) return;
    const willOpen = callNotesPanel.classList.contains('hidden');
    callNotesPanel.classList.toggle('hidden', !willOpen);
    document.getElementById('btnCallNotes')?.classList.toggle('text-accent-300', willOpen);
    if (willOpen) {
      if (window.innerWidth < 768) state.isChatDrawerOpen = false;
      updateChatDrawerUI();
      loadCallNotes(state.roomId);
      setTimeout(() => callNotesText?.focus(), 60);
    }
  });

  on('btnCloseCallNotes', 'click', () => {
    saveCallNotes(state.roomId);
    callNotesPanel?.classList.add('hidden');
    document.getElementById('btnCallNotes')?.classList.remove('text-accent-300');
  });

  if (callNotesText) {
    let notesSaveTimer = null;
    callNotesText.addEventListener('input', () => {
      if (callNotesStatus) callNotesStatus.textContent = 'Salvando...';
      clearTimeout(notesSaveTimer);
      notesSaveTimer = setTimeout(() => saveCallNotes(state.roomId), 600);
    });
  }

  on('btnDownloadCallNotes', 'click', () => {
    const text = callNotesText ? callNotesText.value : '';
    if (!text.trim()) {
      showNotification('Nenhuma nota escrita ainda.');
      return;
    }
    const header = `NOTAS DA REUNIAO - LINGUACALL\nSala: ${state.roomId || '-'}\nData: ${new Date().toLocaleString()}\nCriado por Kaynan Monteiro\n\n`;
    downloadBlob(header + text, `notas-${state.roomId || 'reuniao'}.txt`, 'text/plain;charset=utf-8');
  });

  // Atalho N para abrir/fechar o bloco de notas

  function showNotification(msg) {
    const toast = document.createElement('div');
    toast.className = 'app-toast';
    toast.innerHTML = `<span>${escapeHtml(msg)}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }

  function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
});
