/**
 * LinguaCall - Aplicação de Chamada com Tradução ao Vivo
 * 100% Client-Side WebRTC
 */

document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();

  // Verificar protocolo file://
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
  
  // Lobby Inputs
  const inputUserName = document.getElementById('inputUserName');
  const selectSpeakLang = document.getElementById('selectSpeakLang');
  const selectTargetLang = document.getElementById('selectTargetLang');
  const checkStartWithVideo = document.getElementById('checkStartWithVideo');
  const btnCreateRoom = document.getElementById('btnCreateRoom');
  const inputRoomCode = document.getElementById('inputRoomCode');
  const btnJoinRoom = document.getElementById('btnJoinRoom');

  // Seletores Rápidos Durante a Chamada (In-Call)
  const inCallSpeakLang = document.getElementById('inCallSpeakLang');
  const inCallTargetLang = document.getElementById('inCallTargetLang');

  // Controles da Chamada
  const btnCopyInvite = document.getElementById('btnCopyInvite');
  const btnToggleMic = document.getElementById('btnToggleMic');
  const iconMic = document.getElementById('iconMic');
  const btnToggleCamera = document.getElementById('btnToggleCamera');
  const iconCamera = document.getElementById('iconCamera');
  const btnFlipCamera = document.getElementById('btnFlipCamera');
  const btnShareScreen = document.getElementById('btnShareScreen');
  const btnToggleTTS = document.getElementById('btnToggleTTS');
  const iconTTS = document.getElementById('iconTTS');
  const btnEndCall = document.getElementById('btnEndCall');

  // Gaveta de Chat no Mobile
  const btnToggleDrawerChat = document.getElementById('btnToggleDrawerChat');
  const btnCloseChatDrawer = document.getElementById('btnCloseChatDrawer');
  const chatDrawer = document.getElementById('chatDrawer');
  const chatNotificationBadge = document.getElementById('chatNotificationBadge');

  // Mídia Local
  const localVideo = document.getElementById('localVideo');
  const localAvatarBox = document.getElementById('localAvatarBox');
  const localUserNameDisplay = document.getElementById('localUserNameDisplay');
  const localUserAvatar = document.getElementById('localUserAvatar');
  const localLangBadge = document.getElementById('localLangBadge');
  const localAudioWave = document.getElementById('localAudioWave');
  const localLiveCaptionOverlay = document.getElementById('localLiveCaptionOverlay');
  const localLiveCaptionText = document.getElementById('localLiveCaptionText');

  // Mídia Remota
  const remoteVideo = document.getElementById('remoteVideo');
  const remoteAvatarBox = document.getElementById('remoteAvatarBox');
  const remoteUserNameDisplay = document.getElementById('remoteUserNameDisplay');
  const remoteUserAvatar = document.getElementById('remoteUserAvatar');
  const remoteLangBadge = document.getElementById('remoteLangBadge');
  const remoteAudioWave = document.getElementById('remoteAudioWave');
  const remoteAudioFallback = document.getElementById('remoteAudioFallback');
  const remoteStatusIndicator = document.getElementById('remoteStatusIndicator');
  
  // Balões de Legenda na Tela
  const remoteLiveCaptionOverlay = document.getElementById('remoteLiveCaptionOverlay');
  const remoteLiveCaptionSpeaker = document.getElementById('remoteLiveCaptionSpeaker');
  const remoteLiveCaptionTranslated = document.getElementById('remoteLiveCaptionTranslated');
  const remoteLiveCaptionOriginal = document.getElementById('remoteLiveCaptionOriginal');

  // Histórico
  const transcriptList = document.getElementById('transcriptList');
  const inputChatFallback = document.getElementById('inputChatFallback');
  const btnSendChat = document.getElementById('btnSendChat');
  const btnExportTranscript = document.getElementById('btnExportTranscript');

  // Configurações
  const btnSettings = document.getElementById('btnSettings');
  const settingsModal = document.getElementById('settingsModal');
  const btnCloseSettings = document.getElementById('btnCloseSettings');
  const btnSaveSettings = document.getElementById('btnSaveSettings');
  const selectTranslateEngine = document.getElementById('selectTranslateEngine');
  const geminiKeyContainer = document.getElementById('geminiKeyContainer');
  const inputGeminiApiKey = document.getElementById('inputGeminiApiKey');
  const checkContinuousRecognition = document.getElementById('checkContinuousRecognition');

  // Estado da Aplicação
  const state = {
    userName: localStorage.getItem('lc_user_name') || 'Você',
    speakLang: localStorage.getItem('lc_speak_lang') || 'pt-BR',
    targetLang: localStorage.getItem('lc_target_lang') || 'pt',
    engine: localStorage.getItem('lc_engine') || 'mymemory',
    geminiKey: localStorage.getItem('lc_gemini_key') || '',
    autoRestartSpeech: true,
    
    peer: null,
    call: null,
    dataConnection: null,
    localStream: null,
    remoteStream: null,
    screenStream: null,
    roomId: null,
    isInitiator: false,
    
    isMuted: false,
    isVideoEnabled: true,
    currentFacingMode: 'user', // 'user' ou 'environment'
    isSharingScreen: false,
    ttsEnabled: false,
    isChatDrawerOpen: false,
    
    transcriptHistory: []
  };

  // Carregar dados salvos
  inputUserName.value = state.userName;
  selectSpeakLang.value = state.speakLang;
  selectTargetLang.value = state.targetLang;
  inCallSpeakLang.value = state.speakLang;
  inCallTargetLang.value = state.targetLang;
  selectTranslateEngine.value = state.engine;
  inputGeminiApiKey.value = state.geminiKey;
  if (state.engine === 'gemini') geminiKeyContainer.classList.remove('hidden');

  const urlParams = new URLSearchParams(window.location.search);
  const roomFromUrl = urlParams.get('room');
  if (roomFromUrl) inputRoomCode.value = roomFromUrl;

  // Sincronizar mudança de idiomas DURANTE A CHAMADA (In-Call)
  inCallSpeakLang.addEventListener('change', (e) => {
    state.speakLang = e.target.value;
    localStorage.setItem('lc_speak_lang', state.speakLang);
    selectSpeakLang.value = state.speakLang;
    localLangBadge.textContent = state.speakLang.split('-')[0].toUpperCase();

    if (speechRecognizer) {
      speechRecognizer.lang = state.speakLang;
      if (isRecognitionRunning) {
        try { speechRecognizer.stop(); } catch(err) {}
      }
    }

    sendData({
      type: 'lang_change',
      speakLang: state.speakLang
    });

    showNotification('Você agora está falando em: ' + state.speakLang);
  });

  inCallTargetLang.addEventListener('change', (e) => {
    state.targetLang = e.target.value;
    localStorage.setItem('lc_target_lang', state.targetLang);
    selectTargetLang.value = state.targetLang;
    showNotification('Você agora lê em: ' + state.targetLang.toUpperCase());
  });

  // Gaveta de Chat no Mobile
  btnToggleDrawerChat.addEventListener('click', () => {
    state.isChatDrawerOpen = !state.isChatDrawerOpen;
    updateChatDrawerUI();
  });
  btnCloseChatDrawer.addEventListener('click', () => {
    state.isChatDrawerOpen = false;
    updateChatDrawerUI();
  });

  function updateChatDrawerUI() {
    if (state.isChatDrawerOpen) {
      chatDrawer.classList.remove('translate-x-full');
      chatNotificationBadge.classList.add('hidden');
    } else {
      chatDrawer.classList.add('translate-x-full');
    }
  }

  // Modal Configurações
  btnSettings.addEventListener('click', () => settingsModal.classList.remove('hidden'));
  btnCloseSettings.addEventListener('click', () => settingsModal.classList.add('hidden'));
  selectTranslateEngine.addEventListener('change', (e) => {
    if (e.target.value === 'gemini') geminiKeyContainer.classList.remove('hidden');
    else geminiKeyContainer.classList.add('hidden');
  });

  btnSaveSettings.addEventListener('click', () => {
    state.engine = selectTranslateEngine.value;
    state.geminiKey = inputGeminiApiKey.value.trim();
    state.autoRestartSpeech = checkContinuousRecognition.checked;
    localStorage.setItem('lc_engine', state.engine);
    localStorage.setItem('lc_gemini_key', state.geminiKey);
    settingsModal.classList.add('hidden');
    showNotification('Configurações salvas!');
  });

  inputUserName.addEventListener('change', (e) => {
    state.userName = e.target.value.trim() || 'Você';
    localStorage.setItem('lc_user_name', state.userName);
  });
  selectSpeakLang.addEventListener('change', (e) => {
    state.speakLang = e.target.value;
    inCallSpeakLang.value = state.speakLang;
    localStorage.setItem('lc_speak_lang', state.speakLang);
    if (speechRecognizer) speechRecognizer.lang = state.speakLang;
  });
  selectTargetLang.addEventListener('change', (e) => {
    state.targetLang = e.target.value;
    inCallTargetLang.value = state.targetLang;
    localStorage.setItem('lc_target_lang', state.targetLang);
  });

  function generateRoomId() {
    return 'room-' + Math.random().toString(36).substring(2, 8);
  }

  function updateConnectionBadge(text, type = 'ready') {
    connectionStatusBadge.classList.remove('hidden');
    connectionStatusText.textContent = text;
    connectionStatusBadge.className = 'px-2 py-0.5 rounded-full text-[11px] border flex items-center gap-1 ';
    if (type === 'connecting') {
      connectionStatusBadge.className += 'border-amber-500/30 bg-amber-500/10 text-amber-400';
    } else if (type === 'connected') {
      connectionStatusBadge.className += 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400';
    } else if (type === 'error') {
      connectionStatusBadge.className += 'border-rose-500/30 bg-rose-500/10 text-rose-400';
    }
  }

  // ==========================================
  // OBTENÇÃO DE ÁUDIO E CÂMERA
  // ==========================================

  async function requestUserMedia(wantVideo = true, facingMode = 'user') {
    if (wantVideo) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: {
            facingMode: facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        state.localStream = stream;
        state.isVideoEnabled = true;
        state.currentFacingMode = facingMode;
        setupLocalVideoStream(stream);
        return stream;
      } catch (err) {
        console.warn('Erro ao obter câmera com vídeo, tentando áudio:', err);
      }
    }

    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      state.localStream = audioStream;
      state.isVideoEnabled = false;
      localVideo.classList.add('hidden');
      localAvatarBox.classList.remove('hidden');
      return audioStream;
    } catch (err) {
      console.error('Falha de microfone:', err);
      let msg = 'O navegador não autorizou o microfone.';
      if (window.location.protocol === 'file:') {
        msg += '\n\nAbra pelo link do GitHub Pages (com HTTPS) para liberar automaticamente no celular ou computador.';
      }
      alert(msg);
      throw err;
    }
  }

  function setupLocalVideoStream(stream) {
    localVideo.srcObject = stream;
    localVideo.classList.remove('hidden');
    localAvatarBox.classList.add('hidden');
    btnToggleCamera.className = 'w-11 h-11 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center border border-slate-700 transition';
    iconCamera.setAttribute('data-lucide', 'video');
    lucide.createIcons();
  }

  function setupCallUI(roomId) {
    state.roomId = roomId;
    lobbyScreen.classList.add('hidden');
    callScreen.classList.remove('hidden');
    
    // Ocultar cabeçalho da página para maximizar tela no mobile
    mainHeader.classList.add('hidden');

    localUserNameDisplay.textContent = state.userName;
    localUserAvatar.textContent = (state.userName[0] || 'V').toUpperCase();
    localLangBadge.textContent = state.speakLang.split('-')[0].toUpperCase();

    const newUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  }

  // ==========================================
  // WEBRTC PEERJS (Conexão P2P)
  // ==========================================

  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ]
  };

  btnCreateRoom.addEventListener('click', async () => {
    state.isInitiator = true;
    const roomId = generateRoomId();
    await startCallFlow(roomId);
  });

  btnJoinRoom.addEventListener('click', async () => {
    let code = inputRoomCode.value.trim();
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
      const wantVideo = checkStartWithVideo.checked;
      await requestUserMedia(wantVideo, 'user');

      setupCallUI(roomId);

      const peerId = state.isInitiator ? roomId : 'guest-' + Math.random().toString(36).substring(2, 8);
      
      state.peer = new Peer(peerId, {
        debug: 1,
        config: rtcConfig
      });

      state.peer.on('open', (id) => {
        if (state.isInitiator) {
          updateConnectionBadge('Aguardando colega...', 'connecting');
          remoteUserNameDisplay.textContent = 'Aguardando colega...';
          remoteStatusIndicator.textContent = 'Envie o link para o colega entrar';
        } else {
          updateConnectionBadge('Conectando...', 'connecting');
          connectToPeer(roomId);
        }
        initSpeechRecognition();
      });

      state.peer.on('call', (incomingCall) => {
        state.call = incomingCall;
        incomingCall.answer(state.localStream);
        incomingCall.on('stream', (remoteMediaStream) => {
          attachRemoteStream(remoteMediaStream);
        });
      });

      state.peer.on('connection', (conn) => {
        state.dataConnection = conn;
        setupDataConnectionListeners(conn);
      });

      state.peer.on('error', (err) => {
        console.error('Peer error:', err);
        updateConnectionBadge('Erro na conexão', 'error');
      });

    } catch (e) {
      updateConnectionBadge('Permissão negada', 'error');
    }
  }

  function connectToPeer(hostRoomId) {
    const call = state.peer.call(hostRoomId, state.localStream);
    state.call = call;
    call.on('stream', (remoteMediaStream) => {
      attachRemoteStream(remoteMediaStream);
    });

    const conn = state.peer.connect(hostRoomId);
    state.dataConnection = conn;
    setupDataConnectionListeners(conn);
  }

  function attachRemoteStream(remoteStream) {
    state.remoteStream = remoteStream;
    remoteVideo.srcObject = remoteStream;
    remoteAudioFallback.srcObject = remoteStream;

    const videoTracks = remoteStream.getVideoTracks();
    if (videoTracks.length > 0 && videoTracks[0].enabled) {
      remoteVideo.classList.remove('hidden');
      remoteAvatarBox.classList.add('hidden');
    } else {
      remoteVideo.classList.add('hidden');
      remoteAvatarBox.classList.remove('hidden');
    }

    remoteVideo.play().catch(() => {});
    remoteAudioFallback.play().catch(() => {});
    
    updateConnectionBadge('Conectado', 'connected');
    remoteStatusIndicator.textContent = 'Conectado';
  }

  function setupDataConnectionListeners(conn) {
    conn.on('open', () => {
      updateConnectionBadge('Conectado', 'connected');
      sendData({
        type: 'handshake',
        userName: state.userName,
        speakLang: state.speakLang,
        hasVideo: state.isVideoEnabled
      });
    });

    conn.on('data', async (data) => {
      handleIncomingData(data);
    });

    conn.on('close', () => {
      updateConnectionBadge('Colega desconectou', 'connecting');
      remoteUserNameDisplay.textContent = 'Colega saiu';
      remoteLangBadge.textContent = '--';
      remoteStatusIndicator.textContent = 'Desconectado';
      remoteVideo.classList.add('hidden');
      remoteAvatarBox.classList.remove('hidden');
      hideRemoteCaption();
    });
  }

  function sendData(dataObj) {
    if (state.dataConnection && state.dataConnection.open) {
      state.dataConnection.send(dataObj);
    }
  }

  async function handleIncomingData(data) {
    if (data.type === 'handshake') {
      remoteUserNameDisplay.textContent = data.userName || 'Colega';
      remoteUserAvatar.textContent = (data.userName ? data.userName[0] : 'C').toUpperCase();
      remoteLangBadge.textContent = (data.speakLang || 'outro').split('-')[0].toUpperCase();
      remoteStatusIndicator.textContent = 'Online';
      
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
      remoteUserNameDisplay.textContent = data.userName || 'Colega';
      remoteUserAvatar.textContent = (data.userName ? data.userName[0] : 'C').toUpperCase();
      remoteLangBadge.textContent = (data.speakLang || 'outro').split('-')[0].toUpperCase();
      remoteStatusIndicator.textContent = 'Online';
    } else if (data.type === 'lang_change') {
      remoteLangBadge.textContent = (data.speakLang || '').split('-')[0].toUpperCase();
      showNotification(`${remoteUserNameDisplay.textContent} agora fala em ${data.speakLang}`);
    } else if (data.type === 'video_toggle') {
      if (data.enabled) {
        remoteVideo.classList.remove('hidden');
        remoteAvatarBox.classList.add('hidden');
      } else {
        remoteVideo.classList.add('hidden');
        remoteAvatarBox.classList.remove('hidden');
      }
    } else if (data.type === 'speech') {
      handleRemoteSpeech(data);
    } else if (data.type === 'chat') {
      handleIncomingChat(data);
    }
  }

  // ==========================================
  // RECONHECIMENTO DE FALA
  // ==========================================
  let speechRecognizer = null;
  let isRecognitionRunning = false;
  let localCaptionTimeout = null;
  let remoteCaptionTimeout = null;

  function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    speechRecognizer = new SpeechRecognition();
    speechRecognizer.continuous = true;
    speechRecognizer.interimResults = true;
    speechRecognizer.lang = state.speakLang;

    speechRecognizer.onstart = () => {
      isRecognitionRunning = true;
    };

    speechRecognizer.onresult = (event) => {
      if (state.isMuted) return;

      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      triggerSpeakingWave(true);

      const currentText = (finalTranscript || interimTranscript).trim();
      if (currentText) {
        showLocalCaption(currentText);
      }

      if (finalTranscript.trim()) {
        const cleanText = finalTranscript.trim();

        sendData({
          type: 'speech',
          sender: state.userName,
          text: cleanText,
          lang: state.speakLang,
          timestamp: Date.now()
        });

        addTranscriptItem({
          sender: state.userName,
          isSelf: true,
          original: cleanText,
          translated: null,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }
    };

    speechRecognizer.onerror = () => {};

    speechRecognizer.onend = () => {
      isRecognitionRunning = false;
      if (state.autoRestartSpeech && !state.isMuted && state.localStream) {
        try { speechRecognizer.start(); } catch(e) {}
      }
    };

    try { speechRecognizer.start(); } catch(e) {}
  }

  function showLocalCaption(text) {
    localLiveCaptionText.textContent = text;
    localLiveCaptionOverlay.classList.remove('hidden');
    clearTimeout(localCaptionTimeout);
    localCaptionTimeout = setTimeout(() => {
      localLiveCaptionOverlay.classList.add('hidden');
    }, 3000);
  }

  function showRemoteCaption(speaker, original, translated) {
    remoteLiveCaptionSpeaker.textContent = speaker + ' falando:';
    remoteLiveCaptionTranslated.textContent = translated;
    remoteLiveCaptionOriginal.textContent = 'Original: ' + original;
    remoteLiveCaptionOverlay.classList.remove('hidden');

    clearTimeout(remoteCaptionTimeout);
    remoteCaptionTimeout = setTimeout(() => {
      hideRemoteCaption();
    }, 4500);
  }

  function hideRemoteCaption() {
    remoteLiveCaptionOverlay.classList.add('hidden');
  }

  function triggerSpeakingWave(isLocal) {
    const wave = isLocal ? localAudioWave : remoteAudioWave;
    wave.classList.remove('hidden');
    clearTimeout(isLocal ? window.localWaveTimer : window.remoteWaveTimer);
    const timer = setTimeout(() => {
      wave.classList.add('hidden');
    }, 1500);
    if (isLocal) window.localWaveTimer = timer; else window.remoteWaveTimer = timer;
  }

  // ==========================================
  // MOTOR DE TRADUÇÃO EM TEMPO REAL
  // ==========================================

  async function translateText(text, fromLang, toLang) {
    const src = (fromLang || 'auto').split('-')[0].toLowerCase();
    const tgt = (toLang || 'pt').split('-')[0].toLowerCase();

    if (src === tgt && src !== 'auto') return text;

    // Gemini
    if (state.engine === 'gemini' && state.geminiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${state.geminiKey}`;
        const prompt = `Translate this speech into "${tgt}". Only return translated text, nothing else: "${text}"`;
        const res = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        if (res.ok) {
          const json = await res.json();
          const t = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (t) return t;
        }
      } catch (e) {}
    }

    // MyMemory
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${src}|${tgt}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.responseData?.translatedText) return data.responseData.translatedText;
      }
    } catch (e) {}

    // Fallback Google Client
    try {
      const gUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${src}&tl=${tgt}&dt=t&q=${encodeURIComponent(text)}`;
      const gRes = await fetch(gUrl);
      if (gRes.ok) {
        const gJson = await gRes.json();
        if (gJson && gJson[0]) return gJson[0].map(item => item[0]).join('');
      }
    } catch (e) {}

    return text;
  }

  async function handleRemoteSpeech(data) {
    triggerSpeakingWave(false);

    showRemoteCaption(data.sender || 'Colega', data.text, 'Traduzindo...');

    const translated = await translateText(data.text, data.lang, state.targetLang);

    showRemoteCaption(data.sender || 'Colega', data.text, translated);

    if (state.ttsEnabled) {
      speakText(translated, state.targetLang);
    }

    addTranscriptItem({
      sender: data.sender || 'Colega',
      isSelf: false,
      original: data.text,
      translated: translated,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  }

  function speakText(text, langCode) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode || 'pt-BR';
    window.speechSynthesis.speak(utterance);
  }

  // ==========================================
  // HISTÓRICO DE CONVERSA
  // ==========================================

  function addTranscriptItem(item) {
    state.transcriptHistory.push(item);
    if (state.transcriptHistory.length === 1) transcriptList.innerHTML = '';

    const div = document.createElement('div');
    div.className = `p-2.5 rounded-xl border ${
      item.isSelf ? 'bg-indigo-950/40 border-indigo-900/60 ml-2' : 'bg-slate-950/70 border-slate-800 mr-2'
    }`;

    const senderColor = item.isSelf ? 'text-indigo-400' : 'text-emerald-400';
    const mainText = item.isSelf ? item.original : (item.translated || item.original);
    const subText = (!item.isSelf && item.translated) ? `Original: ${item.original}` : '';

    div.innerHTML = `
      <div class="flex items-center justify-between mb-1">
        <span class="font-bold ${senderColor}">${escapeHtml(item.sender)}</span>
        <span class="text-[10px] text-slate-500">${item.timestamp}</span>
      </div>
      <div class="text-slate-100 font-medium">${escapeHtml(mainText)}</div>
      ${subText ? `<div class="text-[10px] text-slate-400 italic mt-0.5">${escapeHtml(subText)}</div>` : ''}
    `;

    transcriptList.appendChild(div);
    transcriptList.scrollTop = transcriptList.scrollHeight;

    // Se a gaveta estiver fechada no mobile, exibe a bolinha de nova mensagem
    if (!state.isChatDrawerOpen) {
      chatNotificationBadge.classList.remove('hidden');
    }
  }

  btnSendChat.addEventListener('click', sendManualChatMessage);
  inputChatFallback.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendManualChatMessage();
  });

  async function sendManualChatMessage() {
    const text = inputChatFallback.value.trim();
    if (!text) return;
    inputChatFallback.value = '';

    sendData({
      type: 'chat',
      sender: state.userName,
      text: text,
      lang: state.speakLang
    });

    addTranscriptItem({
      sender: state.userName,
      isSelf: true,
      original: text,
      translated: null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  }

  async function handleIncomingChat(data) {
    const translated = await translateText(data.text, data.lang, state.targetLang);
    showRemoteCaption(data.sender || 'Colega', data.text, translated);
    addTranscriptItem({
      sender: data.sender || 'Colega',
      isSelf: false,
      original: data.text,
      translated: translated,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  }

  btnExportTranscript.addEventListener('click', () => {
    if (state.transcriptHistory.length === 0) {
      alert('Nenhuma conversa no histórico para baixar.');
      return;
    }

    let fileContent = `HISTORICO DA REUNIAO - LINGUACALL\nData: ${new Date().toLocaleString()}\nSala: ${state.roomId}\n\n`;
    state.transcriptHistory.forEach(item => {
      fileContent += `[${item.timestamp}] ${item.sender}:\n`;
      if (item.isSelf) {
        fileContent += `  ${item.original}\n\n`;
      } else {
        fileContent += `  Traducao: ${item.translated || item.original}\n`;
        fileContent += `  Original: ${item.original}\n\n`;
      }
    });

    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcricao-${state.roomId || 'reuniao'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // ==========================================
  // CONTROLES DE MÍDIA (FLIP CAMERA, MIC, ETC)
  // ==========================================

  // Alternar Câmera Frontal / Traseira (Flip Camera no Celular)
  btnFlipCamera.addEventListener('click', async () => {
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

      localVideo.srcObject = state.localStream;
      if (newFacingMode === 'environment') {
        localVideo.classList.remove('-scale-x-100');
      } else {
        localVideo.classList.add('-scale-x-100');
      }

      if (state.call?.peerConnection) {
        const sender = state.call.peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender) sender.replaceTrack(newVideoTrack);
      }

      showNotification(newFacingMode === 'environment' ? 'Câmera traseira ativada' : 'Câmera frontal ativada');
    } catch (e) {
      console.warn('Erro ao alternar câmera:', e);
      showNotification('Não foi possível alternar de câmera.');
    }
  });

  // Mutar/Desmutar Microfone
  btnToggleMic.addEventListener('click', () => {
    state.isMuted = !state.isMuted;
    if (state.localStream) {
      state.localStream.getAudioTracks().forEach(track => {
        track.enabled = !state.isMuted;
      });
    }

    if (state.isMuted) {
      btnToggleMic.className = 'w-11 h-11 rounded-full bg-rose-600/30 text-rose-400 border border-rose-500/50 flex items-center justify-center transition active:scale-95';
      iconMic.setAttribute('data-lucide', 'mic-off');
      if (speechRecognizer && isRecognitionRunning) {
        try { speechRecognizer.stop(); } catch(e) {}
      }
    } else {
      btnToggleMic.className = 'w-11 h-11 rounded-full bg-slate-800 text-slate-200 flex items-center justify-center border border-slate-700 transition active:scale-95';
      iconMic.setAttribute('data-lucide', 'mic');
      if (speechRecognizer && !isRecognitionRunning) {
        try { speechRecognizer.start(); } catch(e) {}
      }
    }
    lucide.createIcons();
  });

  // Ligar/Desligar Câmera
  btnToggleCamera.addEventListener('click', async () => {
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
      localVideo.classList.remove('hidden');
      localAvatarBox.classList.add('hidden');
      btnToggleCamera.className = 'w-11 h-11 rounded-full bg-slate-800 text-slate-200 flex items-center justify-center border border-slate-700 transition active:scale-95';
      iconCamera.setAttribute('data-lucide', 'video');
    } else {
      localVideo.classList.add('hidden');
      localAvatarBox.classList.remove('hidden');
      btnToggleCamera.className = 'w-11 h-11 rounded-full bg-rose-600/30 text-rose-400 border border-rose-500/50 flex items-center justify-center transition active:scale-95';
      iconCamera.setAttribute('data-lucide', 'video-off');
    }

    sendData({ type: 'video_toggle', enabled: state.isVideoEnabled });
    lucide.createIcons();
  });

  // Compartilhamento de Tela
  if (btnShareScreen) {
    btnShareScreen.addEventListener('click', async () => {
      if (!state.isSharingScreen) {
        try {
          const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          state.screenStream = screenStream;
          state.isSharingScreen = true;
          const screenTrack = screenStream.getVideoTracks()[0];
          localVideo.srcObject = screenStream;
          localVideo.classList.remove('hidden');
          localAvatarBox.classList.add('hidden');

          if (state.call?.peerConnection) {
            const sender = state.call.peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
            if (sender) sender.replaceTrack(screenTrack);
          }

          btnShareScreen.className = 'w-11 h-11 rounded-full bg-indigo-600 text-white flex items-center justify-center transition active:scale-95';
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
      btnShareScreen.className = 'w-11 h-11 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center border border-slate-700 transition active:scale-95 hidden sm:flex';
    }

    if (state.localStream) {
      const cameraTrack = state.localStream.getVideoTracks()[0];
      localVideo.srcObject = state.localStream;
      if (cameraTrack && state.call?.peerConnection) {
        const sender = state.call.peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender) sender.replaceTrack(cameraTrack);
      }
      if (!state.isVideoEnabled) {
        localVideo.classList.add('hidden');
        localAvatarBox.classList.remove('hidden');
      }
    }
  }

  btnToggleTTS.addEventListener('click', () => {
    state.ttsEnabled = !state.ttsEnabled;
    if (state.ttsEnabled) {
      btnToggleTTS.className = 'w-11 h-11 rounded-full bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center transition active:scale-95';
      showNotification('Voz sintetizada ativada');
    } else {
      btnToggleTTS.className = 'w-11 h-11 rounded-full bg-slate-800 text-slate-400 border border-slate-700 flex items-center justify-center transition active:scale-95';
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      showNotification('Voz sintetizada desativada');
    }
  });

  btnCopyInvite.addEventListener('click', () => {
    const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${state.roomId}`;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      showNotification('Link copiado!');
    }).catch(() => {
      prompt('Copie o link:', inviteUrl);
    });
  });

  btnEndCall.addEventListener('click', () => {
    if (confirm('Deseja encerrar a ligação?')) {
      cleanupAndExitCall();
    }
  });

  function cleanupAndExitCall() {
    stopScreenShare();
    if (speechRecognizer) {
      try { speechRecognizer.stop(); } catch(e) {}
    }
    if (state.localStream) {
      state.localStream.getTracks().forEach(track => track.stop());
    }
    if (state.call) state.call.close();
    if (state.dataConnection) state.dataConnection.close();
    if (state.peer) state.peer.destroy();

    mainHeader.classList.remove('hidden');
    callScreen.classList.add('hidden');
    lobbyScreen.classList.remove('hidden');
    updateConnectionBadge('Desconectado', 'ready');
    window.history.pushState({}, '', window.location.pathname);
  }

  function showNotification(msg) {
    const toast = document.createElement('div');
    toast.className = 'fixed top-14 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-3.5 py-2 rounded-xl shadow-2xl text-xs z-50 flex items-center gap-1.5 border border-indigo-400/50 animate-bounce';
    toast.innerHTML = `<span>${escapeHtml(msg)}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }

  function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
});
