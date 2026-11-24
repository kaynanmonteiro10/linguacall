/**
 * LinguaCall Pro - Conexão WebRTC com Grade Desktop & Mobile,
 * PWA Service Worker, Filtros de Câmera, Controle de Volume, Tela Cheia,
 * Síntese de Fala Push-to-Talk e Créditos para Kaynan Monteiro.
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
  // REGISTRO DE SERVICE WORKER & PWA INSTALL
  // ==========================================
  let deferredPrompt = null;
  const btnInstallPwa = document.getElementById('btnInstallPwa');

  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('./sw.js').then(() => {
      console.log('PWA Service Worker registrado com sucesso!');
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
  const remoteAudioFallback = document.getElementById('remoteAudioFallback');
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

  // Gaveta de Chat
  const chatDrawer = document.getElementById('chatDrawer');
  const chatNotificationBadge = document.getElementById('chatNotificationBadge');
  const transcriptList = document.getElementById('transcriptList');
  const inputChatFallback = document.getElementById('inputChatFallback');

  // Modais
  const settingsModal = document.getElementById('settingsModal');
  const savedCallsModal = document.getElementById('savedCallsModal');
  const viewSpecificCallModal = document.getElementById('viewSpecificCallModal');
  const statsModal = document.getElementById('statsModal');
  const filtersModal = document.getElementById('filtersModal');
  const creatorModal = document.getElementById('creatorModal');
  const savedCallsList = document.getElementById('savedCallsList');

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
    localSecondStream: null,
    remoteStream: null,
    screenStream: null,
    roomId: null,
    isInitiator: false,
    
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
    
    transcriptHistory: []
  };

  if (inputUserName) inputUserName.value = state.userName;
  if (selectSpeakLang) selectSpeakLang.value = state.speakLang;
  if (selectTargetLang) selectTargetLang.value = state.targetLang;
  if (inCallSpeakLang) inCallSpeakLang.value = state.speakLang;
  if (inCallTargetLang) inCallTargetLang.value = state.targetLang;
  
  const selectTranslateEngine = document.getElementById('selectTranslateEngine');
  const inputGeminiApiKey = document.getElementById('inputGeminiApiKey');
  const geminiKeyContainer = document.getElementById('geminiKeyContainer');
  if (selectTranslateEngine) selectTranslateEngine.value = state.engine;
  if (inputGeminiApiKey) inputGeminiApiKey.value = state.geminiKey;
  if (geminiKeyContainer && state.engine === 'gemini') geminiKeyContainer.classList.remove('hidden');

  applyMirrorSetting();

  const urlParams = new URLSearchParams(window.location.search);
  const roomFromUrl = urlParams.get('room');
  if (roomFromUrl && inputRoomCode) inputRoomCode.value = roomFromUrl;

  // ==========================================
  // MODAL SOBRE O CRIADOR (KAYNAN MONTEIRO)
  // ==========================================
  function openCreatorModal() {
    if (creatorModal) creatorModal.classList.remove('hidden');
  }
  function closeCreatorModal() {
    if (creatorModal) creatorModal.classList.add('hidden');
  }
  on('btnOpenCreatorModal', 'click', openCreatorModal);
  on('btnCreatorLinkFooter', 'click', openCreatorModal);
  on('btnCloseCreatorModal', 'click', closeCreatorModal);
  on('btnCloseCreatorModalBtn', 'click', closeCreatorModal);

  // ==========================================
  // VOLUME, FILTROS, TELA CHEIA E PUSH-TO-TALK
  // ==========================================
  on('sliderRemoteVolume', 'input', (e) => {
    const vol = parseFloat(e.target.value) / 100;
    if (remoteAudioFallback) remoteAudioFallback.volume = vol;
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

  on('btnSpeakMyText', 'click', async () => {
    const text = inputChatFallback ? inputChatFallback.value.trim() : '';
    if (!text) {
      showNotification('Digite uma mensagem antes.');
      return;
    }
    inputChatFallback.value = '';

    showNotification('Traduzindo e sintetizando voz...');
    const translated = await translateText(text, state.speakLang, state.targetLang);

    sendData({
      type: 'remote_tts',
      sender: state.userName,
      text: text,
      translated: translated,
      lang: state.targetLang
    });

    addTranscriptItem({
      sender: state.userName + ' (Voz)',
      isSelf: true,
      original: text,
      translated: translated,
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

  function renderSavedCallsList() {
    if (!savedCallsList) return;
    savedCallsList.innerHTML = '';
    const records = JSON.parse(localStorage.getItem('lc_saved_calls') || '[]');
    
    if (records.length === 0) {
      savedCallsList.innerHTML = '<div class="text-center py-8 text-slate-500">Nenhuma reunião finalizada ainda.<br>Quando você fizer uma ligação, ela aparecerá arquivada aqui.</div>';
      return;
    }

    records.forEach((rec, idx) => {
      const item = document.createElement('div');
      item.className = 'p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between hover:border-slate-700 transition';
      item.innerHTML = `
        <div class="flex-1 pr-3">
          <div class="font-bold text-white flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
            <span>Sala: ${escapeHtml(rec.id)}</span>
          </div>
          <div class="text-[11px] text-slate-400 mt-0.5">
            ${rec.date} • Duração: ${rec.duration} • ${rec.totalSpeeches} falas
          </div>
        </div>
        <div class="flex items-center gap-1.5">
          <button class="btnViewCall px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs transition" data-idx="${idx}">
            Ver Chat
          </button>
          <button class="btnDeleteCall p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition" data-idx="${idx}" title="Excluir">
            ✕
          </button>
        </div>
      `;
      savedCallsList.appendChild(item);
    });

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
        renderSavedCallsList();
      });
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
        div.className = 'p-2.5 bg-slate-950 border border-slate-800 rounded-xl';
        const orig = m.original ? `<div class="text-[11px] text-slate-400 italic mt-0.5">Original: ${escapeHtml(m.original)}</div>` : '';
        const main = m.translated || m.original;
        div.innerHTML = `
          <div class="flex justify-between text-[11px] mb-1 font-semibold">
            <span class="${m.isSelf ? 'text-indigo-400' : 'text-emerald-400'}">${escapeHtml(m.sender)}</span>
            <span class="text-slate-500">${m.timestamp}</span>
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
      btnMirrorLocalVideo?.classList.add('text-indigo-400');
    } else {
      localVideo.classList.remove('-scale-x-100');
      btnMirrorLocalVideo?.classList.remove('text-indigo-400');
    }
  }

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

        btnToggleDualCamera?.classList.add('text-emerald-400');
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
    btnToggleDualCamera?.classList.remove('text-emerald-400');
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
      btnRecordCall?.classList.add('bg-rose-600/30', 'text-rose-400');
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
      btnRecordCall?.classList.remove('bg-rose-600/30', 'text-rose-400');
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
    let csv = `Horario,Participante,Texto Original,Texto Traduzido\n`;
    state.transcriptHistory.forEach(m => {
      const orig = `"${(m.original || '').replace(/"/g, '""')}"`;
      const trans = `"${(m.translated || m.original || '').replace(/"/g, '""')}"`;
      csv += `${m.timestamp},"${m.sender}",${orig},${trans}\n`;
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

    if (speechRecognizer) {
      speechRecognizer.lang = state.speakLang;
      if (isRecognitionRunning) {
        try { speechRecognizer.stop(); } catch(err) {}
      }
    }

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

  function updateChatDrawerUI() {
    if (!chatDrawer) return;
    if (state.isChatDrawerOpen) {
      chatDrawer.classList.remove('translate-x-full');
      chatNotificationBadge?.classList.add('hidden');
    } else {
      chatDrawer.classList.add('translate-x-full');
    }
  }

  // Configurações
  on('btnSettings', 'click', () => settingsModal?.classList.remove('hidden'));
  on('btnCloseSettings', 'click', () => settingsModal?.classList.add('hidden'));
  on(selectTranslateEngine, 'change', (e) => {
    if (e.target.value === 'gemini') geminiKeyContainer?.classList.remove('hidden');
    else geminiKeyContainer?.classList.add('hidden');
  });

  on('btnSaveSettings', 'click', () => {
    state.engine = selectTranslateEngine ? selectTranslateEngine.value : 'mymemory';
    state.geminiKey = inputGeminiApiKey ? inputGeminiApiKey.value.trim() : '';
    localStorage.setItem('lc_engine', state.engine);
    localStorage.setItem('lc_gemini_key', state.geminiKey);
    settingsModal?.classList.add('hidden');
    showNotification('Configurações salvas!');
  });

  on(inputUserName, 'change', (e) => {
    state.userName = e.target.value.trim() || 'Você';
    localStorage.setItem('lc_user_name', state.userName);
  });
  on(selectSpeakLang, 'change', (e) => {
    state.speakLang = e.target.value;
    if (inCallSpeakLang) inCallSpeakLang.value = state.speakLang;
    localStorage.setItem('lc_speak_lang', state.speakLang);
    if (speechRecognizer) speechRecognizer.lang = state.speakLang;
  });
  on(selectTargetLang, 'change', (e) => {
    state.targetLang = e.target.value;
    if (inCallTargetLang) inCallTargetLang.value = state.targetLang;
    localStorage.setItem('lc_target_lang', state.targetLang);
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
    stopMicTest();

    if (wantVideo) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } }
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
      if (localVideo) localVideo.classList.add('hidden');
      if (localAvatarBox) localAvatarBox.classList.remove('hidden');
      return audioStream;
    } catch (err) {
      console.error('Falha de microfone:', err);
      alert('O navegador não autorizou o microfone. Abra pelo link do GitHub Pages (com HTTPS) para liberar.');
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
      btnToggleCamera.className = 'w-11 h-11 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center border border-slate-700 transition active:scale-95';
    }
    if (iconCamera) iconCamera.setAttribute('data-lucide', 'video');
    applyMirrorSetting();
    try { lucide.createIcons(); } catch(e) {}
  }

  function setupCallUI(roomId) {
    state.roomId = roomId;
    
    state.transcriptHistory = [];
    if (transcriptList) {
      transcriptList.innerHTML = '<div class="text-center py-8 text-slate-500"><p>Histórico iniciado para a sala: ' + escapeHtml(roomId) + '</p></div>';
    }

    if (lobbyScreen) lobbyScreen.classList.add('hidden');
    if (callScreen) callScreen.classList.remove('hidden');
    if (mainHeader) mainHeader.classList.add('hidden');

    if (localUserNameDisplay) localUserNameDisplay.textContent = state.userName;
    if (localUserAvatar) localUserAvatar.textContent = (state.userName[0] || 'V').toUpperCase();
    if (localLangBadge) localLangBadge.textContent = state.speakLang.split('-')[0].toUpperCase();

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

      const peerId = state.isInitiator ? roomId : 'guest-' + Math.random().toString(36).substring(2, 8);
      
      state.peer = new Peer(peerId, {
        debug: 1,
        config: rtcConfig
      });

      state.peer.on('open', (id) => {
        if (state.isInitiator) {
          updateConnectionBadge('Aguardando colega...', 'connecting');
          if (remoteUserNameDisplay) remoteUserNameDisplay.textContent = 'Aguardando colega...';
          if (remoteStatusIndicator) remoteStatusIndicator.textContent = 'Envie o convite para o colega';
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
    if (remoteVideo) remoteVideo.srcObject = remoteStream;
    if (remoteAudioFallback) remoteAudioFallback.srcObject = remoteStream;

    const videoTracks = remoteStream.getVideoTracks();
    if (videoTracks.length > 0 && videoTracks[0].enabled) {
      if (remoteVideo) remoteVideo.classList.remove('hidden');
      if (remoteAvatarBox) remoteAvatarBox.classList.add('hidden');
    } else {
      if (remoteVideo) remoteVideo.classList.add('hidden');
      if (remoteAvatarBox) remoteAvatarBox.classList.remove('hidden');
    }

    if (remoteVideo) remoteVideo.play().catch(() => {});
    if (remoteAudioFallback) remoteAudioFallback.play().catch(() => {});
    
    updateConnectionBadge('Conectado', 'connected');
    if (remoteStatusIndicator) remoteStatusIndicator.textContent = 'Conectado';
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
      if (remoteUserNameDisplay) remoteUserNameDisplay.textContent = 'Colega saiu';
      if (remoteLangBadge) remoteLangBadge.textContent = '--';
      if (remoteStatusIndicator) remoteStatusIndicator.textContent = 'Desconectado';
      if (remoteVideo) remoteVideo.classList.add('hidden');
      if (remoteAvatarBox) remoteAvatarBox.classList.remove('hidden');
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
      speakText(data.translated, data.lang);
      addTranscriptItem({
        sender: data.sender + ' (Voz)',
        isSelf: false,
        original: data.text,
        translated: data.translated,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      showRemoteCaption(data.sender, data.text, data.translated);
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
  // MOTOR DE TRADUÇÃO EM TEMPO REAL
  // ==========================================

  async function translateText(text, fromLang, toLang) {
    const src = (fromLang || 'auto').split('-')[0].toLowerCase();
    const tgt = (toLang || 'pt').split('-')[0].toLowerCase();

    if (src === tgt && src !== 'auto') return text;

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

    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${src}|${tgt}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.responseData?.translatedText) return data.responseData.translatedText;
      }
    } catch (e) {}

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
  // HISTÓRICO DA CHAMADA ATUAL
  // ==========================================

  function addTranscriptItem(item) {
    state.transcriptHistory.push(item);
    if (!transcriptList) return;

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

    if (!state.isChatDrawerOpen && chatNotificationBadge) {
      chatNotificationBadge.classList.remove('hidden');
    }
  }

  on('btnSendChat', 'click', sendManualChatMessage);
  if (inputChatFallback) {
    inputChatFallback.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendManualChatMessage();
    });
  }

  async function sendManualChatMessage() {
    if (!inputChatFallback) return;
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

  // ==========================================
  // CONTROLES DE MÍDIA
  // ==========================================

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
    if (state.localStream) {
      state.localStream.getAudioTracks().forEach(track => {
        track.enabled = !state.isMuted;
      });
    }

    if (state.isMuted) {
      if (btnToggleMic) btnToggleMic.className = 'w-11 h-11 rounded-full bg-rose-600/30 text-rose-400 border border-rose-500/50 flex items-center justify-center transition active:scale-95';
      if (iconMic) iconMic.setAttribute('data-lucide', 'mic-off');
      if (speechRecognizer && isRecognitionRunning) {
        try { speechRecognizer.stop(); } catch(e) {}
      }
    } else {
      if (btnToggleMic) btnToggleMic.className = 'w-11 h-11 rounded-full bg-slate-800 text-slate-200 flex items-center justify-center border border-slate-700 transition active:scale-95';
      if (iconMic) iconMic.setAttribute('data-lucide', 'mic');
      if (speechRecognizer && !isRecognitionRunning) {
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
      if (btnToggleCamera) btnToggleCamera.className = 'w-11 h-11 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center border border-slate-700 transition active:scale-95';
      if (iconCamera) iconCamera.setAttribute('data-lucide', 'video');
    } else {
      if (localVideo) localVideo.classList.add('hidden');
      if (localAvatarBox) localAvatarBox.classList.remove('hidden');
      if (btnToggleCamera) btnToggleCamera.className = 'w-11 h-11 rounded-full bg-rose-600/30 text-rose-400 border border-rose-500/50 flex items-center justify-center transition active:scale-95';
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

  on(btnToggleTTS, 'click', () => {
    state.ttsEnabled = !state.ttsEnabled;
    if (state.ttsEnabled) {
      if (btnToggleTTS) btnToggleTTS.className = 'w-11 h-11 rounded-full bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center transition active:scale-95';
      showNotification('Voz sintetizada ativada');
    } else {
      if (btnToggleTTS) btnToggleTTS.className = 'w-11 h-11 rounded-full bg-slate-800 text-slate-400 border border-slate-700 flex items-center justify-center transition active:scale-95';
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      showNotification('Voz sintetizada desativada');
    }
  });

  on('btnCopyInvite', 'click', () => {
    const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${state.roomId}`;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      showNotification('Link copiado!');
    }).catch(() => {
      prompt('Copie o link:', inviteUrl);
    });
  });

  on('btnEndCall', 'click', () => {
    if (confirm('Deseja encerrar a ligação? O histórico será arquivado.')) {
      cleanupAndExitCall();
    }
  });

  function cleanupAndExitCall() {
    stopScreenShare();
    stopSecondCamera();
    stopRecording();
    clearInterval(state.timerInterval);

    const duration = callTimerDisplay ? callTimerDisplay.textContent : '00:00';
    saveCallToArchive(state.roomId, duration, state.transcriptHistory);

    if (speechRecognizer) {
      try { speechRecognizer.stop(); } catch(e) {}
    }
    if (state.localStream) {
      state.localStream.getTracks().forEach(track => track.stop());
    }
    if (state.call) state.call.close();
    if (state.dataConnection) state.dataConnection.close();
    if (state.peer) state.peer.destroy();

    if (mainHeader) mainHeader.classList.remove('hidden');
    if (callScreen) callScreen.classList.add('hidden');
    if (lobbyScreen) lobbyScreen.classList.remove('hidden');
    updateConnectionBadge('Desconectado', 'ready');
    window.history.pushState({}, '', window.location.pathname);
    showNotification('Reunião finalizada e salva em "Reuniões"!');
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
