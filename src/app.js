// 言练 · 表达训练台

class ExpressionTrainer {
  constructor() {
    this.appState = 'idle';
    this.isRecording = false;
    this.isPaused = false;
    this.startTime = null;
    this.pausedTime = 0;
    this.pauseStart = null;
    this.timerInterval = null;
    this.fullText = '';
    this.sentences = [];
    this.stats = { fillers: 0, hedges: 0, vagueWords: 0, totalWords: 0, duration: 0 };
    this.lastFeedbackText = '';
    this.lastReport = '';
    this.pendingAnalyses = new Set();
    this.feedbackRequestInFlight = false;
    this.activePracticeGoal = '';
    this.reportScrollHandler = null;

    this.topicStage = 'draw';
    this.selectedTopic = null;
    this.preparationInterval = null;
    this.preparationEndsAt = null;
    this.preparationStartedAt = null;
    this.currentChallenge = null;
    this.challengeAutoStopping = false;
    this.modelReady = false;
    this.modelDownloadActive = false;
    this.pendingRecording = null;

    this.initElements();
    this.bindEvents();
    this.setAppState('idle');
    this.updateSessionMeta();
    this.initializeModelSetup();
  }

  initElements() {
    this.btnStart = document.getElementById('btn-start');
    this.btnPaste = document.getElementById('btn-paste');
    this.btnTopicPractice = document.getElementById('btn-topic-practice');
    this.topicModal = document.getElementById('topic-modal');
    this.btnCloseTopic = document.getElementById('btn-close-topic');
    this.topicCategory = document.getElementById('topic-category');
    this.topicLibraryCount = document.getElementById('topic-library-count');
    this.btnDrawTopic = document.getElementById('btn-draw-topic');
    this.btnAcceptTopic = document.getElementById('btn-accept-topic');
    this.btnRedrawTopic = document.getElementById('btn-redraw-topic');
    this.btnStartTopicSpeech = document.getElementById('btn-start-topic-speech');
    this.topicStageDraw = document.getElementById('topic-stage-draw');
    this.topicStagePrepare = document.getElementById('topic-stage-prepare');
    this.topicCard = document.getElementById('topic-card');
    this.topicCardNumber = document.getElementById('topic-card-number');
    this.topicCardCategory = document.getElementById('topic-card-category');
    this.topicCardTitle = document.getElementById('topic-card-title');
    this.topicCardPrompt = document.getElementById('topic-card-prompt');
    this.topicCardAngles = document.getElementById('topic-card-angles');
    this.prepareTopicNumber = document.getElementById('prepare-topic-number');
    this.prepareTopicCategory = document.getElementById('prepare-topic-category');
    this.prepareTopicTitle = document.getElementById('prepare-topic-title');
    this.prepareTopicPrompt = document.getElementById('prepare-topic-prompt');
    this.prepareTopicAngles = document.getElementById('prepare-topic-angles');
    this.prepareTimer = document.getElementById('prepare-timer');
    this.topicNotes = document.getElementById('topic-notes');
    this.topicNotesCount = document.getElementById('topic-notes-count');
    this.challengeBanner = document.getElementById('challenge-banner');
    this.challengeBannerCode = document.getElementById('challenge-banner-code');
    this.challengeBannerStage = document.getElementById('challenge-banner-stage');
    this.challengeBannerCategory = document.getElementById('challenge-banner-category');
    this.challengeBannerTitle = document.getElementById('challenge-banner-title');
    this.btnViewChallengeNotes = document.getElementById('btn-view-challenge-notes');
    this.challengeNotesModal = document.getElementById('challenge-notes-modal');
    this.btnCloseChallengeNotes = document.getElementById('btn-close-challenge-notes');
    this.challengeNotesTopic = document.getElementById('challenge-notes-topic');
    this.challengeNotesText = document.getElementById('challenge-notes-text');
    this.btnPause = document.getElementById('btn-pause');
    this.btnResume = document.getElementById('btn-resume');
    this.btnStop = document.getElementById('btn-stop');
    this.btnReport = document.getElementById('btn-report');
    this.btnSettings = document.getElementById('btn-settings');
    this.btnPromptEditor = document.getElementById('btn-prompt-editor');
    this.btnCloseReport = document.getElementById('btn-close-report');
    this.btnClosePaste = document.getElementById('btn-close-paste');
    this.btnAnalyzePaste = document.getElementById('btn-analyze-paste');
    this.btnCopyText = document.getElementById('btn-copy-text');
    this.btnSaveText = document.getElementById('btn-save-text');
    this.btnClear = document.getElementById('btn-clear');
    this.btnCopyReport = document.getElementById('btn-copy-report');
    this.pasteModal = document.getElementById('paste-modal');
    this.pasteTextarea = document.getElementById('paste-textarea');
    this.timer = document.getElementById('timer');
    this.statusLabel = document.getElementById('status-label');
    this.statusDetail = document.getElementById('status-detail');
    this.subtitleScroll = document.getElementById('subtitle-scroll');
    this.subtitleContainer = document.getElementById('subtitle-container');
    this.subtitleEmpty = document.getElementById('subtitle-empty');
    this.feedbackContent = document.getElementById('feedback-content');
    this.reportModal = document.getElementById('report-modal');
    this.reportBody = document.getElementById('report-body');
    this.reportAction = document.getElementById('report-action');
    this.reportGoal = document.getElementById('report-goal');
    this.btnPracticeAgain = document.getElementById('btn-practice-again');
    this.statFillers = document.getElementById('stat-fillers');
    this.statHedges = document.getElementById('stat-hedges');
    this.statVague = document.getElementById('stat-vague');
    this.statDensity = document.getElementById('stat-density');
    this.wordCount = document.getElementById('word-count');
    this.sentenceCount = document.getElementById('sentence-count');
    this.modelSetup = document.getElementById('model-setup');
    this.modelSetupDescription = document.getElementById('model-setup-description');
    this.modelProgressPanel = document.getElementById('model-progress-panel');
    this.modelProgressLabel = document.getElementById('model-progress-label');
    this.modelProgressPercent = document.getElementById('model-progress-percent');
    this.modelProgressTrack = this.modelProgressPanel.querySelector('.model-progress-track');
    this.modelProgressBar = document.getElementById('model-progress-bar');
    this.modelProgressSize = document.getElementById('model-progress-size');
    this.modelProgressFile = document.getElementById('model-progress-file');
    this.modelError = document.getElementById('model-error');
    this.btnDownloadModel = document.getElementById('btn-download-model');
  }

  bindEvents() {
    this.btnStart.addEventListener('click', () => this.startRecording());
    this.btnPaste.addEventListener('click', () => this.openPasteModal());
    this.btnTopicPractice.addEventListener('click', () => this.openTopicPractice());
    this.btnCloseTopic.addEventListener('click', () => this.closeTopicPractice());
    this.btnDrawTopic.addEventListener('click', () => this.drawTopic());
    this.btnAcceptTopic.addEventListener('click', () => this.startPreparation());
    this.btnRedrawTopic.addEventListener('click', () => this.returnToTopicDraw());
    this.btnStartTopicSpeech.addEventListener('click', () => this.beginTopicSpeech());
    this.topicCategory.addEventListener('change', () => this.updateTopicLibraryCount());
    this.topicNotes.addEventListener('input', () => this.updateTopicNotesCount());
    this.topicNotes.addEventListener('paste', event => this.blockNotesPaste(event));
    this.topicNotes.addEventListener('drop', event => this.blockNotesPaste(event));
    this.topicNotes.addEventListener('beforeinput', event => {
      if (['insertFromPaste', 'insertFromDrop'].includes(event.inputType)) this.blockNotesPaste(event);
    });
    this.btnViewChallengeNotes.addEventListener('click', () => this.openChallengeNotes());
    this.btnCloseChallengeNotes.addEventListener('click', () => this.closeModal(this.challengeNotesModal));
    this.btnPause.addEventListener('click', () => this.pauseRecording());
    this.btnResume.addEventListener('click', () => this.resumeRecording());
    this.btnStop.addEventListener('click', () => this.stopRecording());
    this.btnReport.addEventListener('click', () => this.generateReport());
    this.btnSettings.addEventListener('click', () => window.api.openSettings());
    this.btnPromptEditor.addEventListener('click', () => window.api.openPromptEditor());
    this.btnCloseReport.addEventListener('click', () => this.closeModal(this.reportModal));
    this.btnClosePaste.addEventListener('click', () => this.closeModal(this.pasteModal));
    this.btnAnalyzePaste.addEventListener('click', () => this.analyzePastedText());
    this.btnCopyText.addEventListener('click', () => this.copyOriginalText());
    this.btnSaveText.addEventListener('click', () => this.saveOriginalText());
    this.btnClear.addEventListener('click', () => this.clearAll());
    this.btnPracticeAgain.addEventListener('click', () => this.startPracticeAgain());
    this.btnDownloadModel.addEventListener('click', () => this.downloadModel());
    window.api.onModelDownloadProgress(progress => this.renderModelProgress(progress));

    this.btnCopyReport.addEventListener('click', () => {
      const reportText = this.lastReport || this.reportBody.innerText;
      navigator.clipboard.writeText(reportText).then(() => {
        this.btnCopyReport.textContent = '已复制';
        setTimeout(() => { this.btnCopyReport.textContent = '复制全文'; }, 1600);
      });
    });

    [this.pasteModal, this.reportModal, this.challengeNotesModal].forEach(modal => {
      modal.addEventListener('click', event => {
        if (event.target === modal) this.closeModal(modal);
      });
    });

    document.addEventListener('keydown', event => this.handleKeyboardShortcut(event));
  }

  // ===== 首次启动模型准备 =====

  async initializeModelSetup() {
    this.showModelSetup('checking');
    try {
      const status = await window.api.getModelStatus();
      if (status.ready) {
        this.modelReady = true;
        this.modelSetup.classList.add('hidden');
        this.setAppState('idle', '本地语音模型已就绪');
        return;
      }
      if (status.state === 'error') {
        this.showModelSetup('error', status.error || '无法检查本地语音模型');
        return;
      }
      this.showModelSetup('missing');
    } catch (error) {
      this.showModelSetup('error', error?.message || '无法检查本地语音模型');
    }
  }

  showModelSetup(state = 'missing', errorMessage = '') {
    this.modelSetup.classList.remove('hidden', 'is-ready', 'is-error');
    this.modelError.classList.add('hidden');
    this.modelProgressPanel.classList.toggle('hidden', !['checking', 'downloading', 'verifying', 'ready', 'error'].includes(state));

    if (state === 'checking') {
      this.modelSetupDescription.textContent = '正在检查本地语音识别文件，首次启动可能需要下载模型。';
      this.btnDownloadModel.disabled = true;
      this.btnDownloadModel.textContent = '正在检查…';
      this.renderModelProgress({ state: 'checking', percent: 0, completedBytes: 0, totalBytes: 237202501, message: '正在检查本地文件' });
    } else if (state === 'missing') {
      this.modelSetupDescription.textContent = '言练需要约 226 MB 的语音识别文件。模型只下载一次，录音识别仍在你的电脑上完成。';
      this.btnDownloadModel.disabled = false;
      this.btnDownloadModel.textContent = '下载并开始使用';
    } else if (state === 'error') {
      this.modelSetup.classList.add('is-error');
      this.modelError.textContent = errorMessage;
      this.modelError.classList.remove('hidden');
      this.btnDownloadModel.disabled = false;
      this.btnDownloadModel.textContent = '重新下载';
    }
  }

  async downloadModel() {
    if (this.modelDownloadActive) return;
    this.modelDownloadActive = true;
    this.showModelSetup('downloading');
    this.btnDownloadModel.disabled = true;
    this.btnDownloadModel.textContent = '正在下载…';

    try {
      const result = await window.api.downloadModel();
      if (!result.success || !result.ready) throw new Error(result.error || '模型下载未完成');
      this.modelReady = true;
      this.renderModelProgress({
        state: 'ready',
        percent: 100,
        completedBytes: result.totalBytes,
        totalBytes: result.totalBytes,
        message: '语音模型已准备完成'
      });
      this.modelSetup.classList.add('is-ready');
      this.btnDownloadModel.textContent = '准备完成';
      this.setAppState('idle', '本地语音模型已就绪');

      const pending = this.pendingRecording;
      this.pendingRecording = null;
      setTimeout(() => {
        this.modelSetup.classList.add('hidden');
        if (pending) this.startRecording(pending.practiceGoal, pending.options);
      }, 650);
    } catch (error) {
      this.showModelSetup('error', `下载失败：${error?.message || '请检查网络连接后重试'}`);
    } finally {
      this.modelDownloadActive = false;
    }
  }

  renderModelProgress(progress = {}) {
    const totalBytes = progress.totalBytes || 237202501;
    const completedBytes = Math.min(progress.completedBytes || 0, totalBytes);
    const percent = Number.isFinite(progress.percent)
      ? Math.max(0, Math.min(100, progress.percent))
      : Math.round((completedBytes / totalBytes) * 1000) / 10;

    this.modelProgressPanel.classList.remove('hidden');
    this.modelProgressLabel.textContent = progress.message || '正在准备语音模型';
    this.modelProgressPercent.textContent = `${percent.toFixed(percent % 1 ? 1 : 0)}%`;
    this.modelProgressBar.style.width = `${percent}%`;
    this.modelProgressTrack.setAttribute('aria-valuenow', String(Math.round(percent)));
    this.modelProgressSize.textContent = `${this.formatMegabytes(completedBytes)} / ${this.formatMegabytes(totalBytes)}`;
    this.modelProgressFile.textContent = progress.fileName || (progress.state === 'verifying' ? '校验文件' : '准备下载');

    if (progress.state === 'error') this.showModelSetup('error', progress.message || '下载失败，请重试');
  }

  formatMegabytes(bytes) {
    return `${(bytes / 1024 / 1024).toFixed(bytes ? 1 : 0)} MB`;
  }

  handleKeyboardShortcut(event) {
    if (event.key === 'Escape') {
      if (!this.challengeNotesModal.classList.contains('hidden')) this.closeModal(this.challengeNotesModal);
      else if (!this.topicModal.classList.contains('hidden')) this.closeTopicPractice();
      else if (!this.reportModal.classList.contains('hidden')) this.closeModal(this.reportModal);
      else if (!this.pasteModal.classList.contains('hidden')) this.closeModal(this.pasteModal);
      return;
    }

    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && document.activeElement === this.pasteTextarea) {
      event.preventDefault();
      this.analyzePastedText();
      return;
    }

    const isTyping = ['TEXTAREA', 'INPUT', 'SELECT'].includes(document.activeElement?.tagName);
    const modalOpen = !this.pasteModal.classList.contains('hidden')
      || !this.reportModal.classList.contains('hidden')
      || !this.topicModal.classList.contains('hidden')
      || !this.challengeNotesModal.classList.contains('hidden')
      || !this.modelSetup.classList.contains('hidden');
    if (event.code !== 'Space' || isTyping || modalOpen || event.metaKey || event.ctrlKey || event.altKey) return;

    event.preventDefault();
    if (this.appState === 'idle' || this.appState === 'complete' || this.appState === 'error') {
      this.startRecording();
    } else if (this.appState === 'listening') {
      this.pauseRecording();
    } else if (this.appState === 'paused') {
      this.resumeRecording();
    }
  }

  setAppState(state, detail = '') {
    const stateCopy = {
      idle: ['准备就绪', '模型与麦克风将在开始录制时检查'],
      initializing: ['正在准备', '正在加载本地识别模型并请求麦克风权限'],
      listening: ['正在聆听', '请自然表达，完成一句后会自动分析'],
      paused: ['录制已暂停', '点击继续录制，或结束本次训练'],
      stopping: ['正在收尾', '正在处理最后一段语音'],
      complete: ['训练已完成', '可以生成报告、复制或保存逐字稿'],
      analyzing: ['正在分析', '正在整理表达数据与建议'],
      error: ['需要处理', '请根据提示检查设置后重试']
    };

    this.appState = state;
    document.body.dataset.state = state;
    const [label, defaultDetail] = stateCopy[state] || stateCopy.idle;
    this.statusLabel.textContent = label;
    this.statusDetail.textContent = detail || defaultDetail;

    [this.btnStart, this.btnPause, this.btnResume, this.btnStop].forEach(button => button.classList.add('hidden'));
    this.btnTopicPractice.classList.toggle('hidden', !['idle', 'complete', 'error'].includes(state));
    this.btnStart.disabled = false;
    this.btnStop.disabled = false;
    this.setButtonLabel(this.btnStart, this.fullText.trim() ? '重新自由录制' : '自由录制');
    this.setButtonLabel(this.btnStop, '结束训练');

    if (state === 'initializing') {
      this.btnStart.classList.remove('hidden');
      this.btnStart.disabled = true;
      this.setButtonLabel(this.btnStart, '正在准备…');
    } else if (state === 'listening') {
      this.btnPause.classList.remove('hidden');
      this.btnStop.classList.remove('hidden');
    } else if (state === 'paused') {
      this.btnResume.classList.remove('hidden');
      this.btnStop.classList.remove('hidden');
    } else if (state === 'stopping') {
      this.btnStop.classList.remove('hidden');
      this.btnStop.disabled = true;
      this.setButtonLabel(this.btnStop, '正在收尾…');
    } else {
      this.btnStart.classList.remove('hidden');
    }

    const hasText = Boolean(this.fullText.trim());
    this.btnReport.classList.toggle('hidden', !hasText || this.isRecording || state === 'initializing' || state === 'stopping');
    this.btnReport.disabled = state === 'analyzing';
    this.btnCopyText.classList.toggle('hidden', !hasText || this.isRecording);
    this.btnSaveText.classList.toggle('hidden', !hasText || this.isRecording);
    this.btnClear.classList.toggle('hidden', !hasText || this.isRecording);

    this.timer.classList.toggle('active', state === 'listening');
    this.subtitleScroll.setAttribute('aria-busy', ['initializing', 'stopping', 'analyzing'].includes(state) ? 'true' : 'false');
    this.updateEmptyState();
  }

  setButtonLabel(button, label) {
    const labelElement = button.querySelector('.btn-label');
    if (labelElement) labelElement.textContent = label;
  }

  updateEmptyState() {
    if (this.fullText.trim() || this.subtitleContainer.children.length > 0) {
      this.subtitleEmpty.classList.add('hidden');
      return;
    }

    const emptyCopy = {
      idle: ['开始一次有目标的表达训练', '先抽取一个话题，准备 15 分钟并完成 5 分钟演讲；也可以选择自由录制。'],
      initializing: ['正在准备识别环境', '首次加载模型可能需要一些时间，请稍候。'],
      listening: ['正在听你说', '现在可以开始表达，识别到的内容会实时出现在这里。'],
      paused: ['录制暂时停在这里', '继续录制后，新的内容会接在当前逐字稿后。'],
      stopping: ['正在处理最后一句', '请稍候，系统正在收齐尚未确认的语音。'],
      complete: ['本次没有识别到文字', '可以重新录制，或导入一份已有逐字稿进行分析。'],
      analyzing: ['正在分析逐字稿', '系统正在统计表达特征并生成反馈。'],
      error: ['没有成功开始录制', '请检查下方错误信息，确认模型路径和麦克风权限。']
    };
    const [title, description] = emptyCopy[this.appState] || emptyCopy.idle;
    this.subtitleEmpty.querySelector('h1').textContent = title;
    this.subtitleEmpty.querySelector('p').textContent = description;
    this.subtitleEmpty.classList.remove('hidden');
  }

  // ===== 录制控制 =====

  async startRecording(practiceGoal = '', options = {}) {
    if (['initializing', 'listening', 'paused', 'stopping'].includes(this.appState)) return;
    if (!this.modelReady) {
      this.pendingRecording = { practiceGoal, options };
      this.showModelSetup('missing');
      return;
    }

    this.activePracticeGoal = practiceGoal;
    if (options.challenge) {
      this.currentChallenge = { ...options.challenge };
      this.challengeAutoStopping = false;
      this.renderChallengeBanner('speaking');
    } else {
      this.currentChallenge = null;
      this.challengeBanner.classList.add('hidden');
    }
    this.setAppState('initializing', practiceGoal ? `正在准备下一轮：${practiceGoal}` : '');

    try {
      const initResult = await window.api.initASR();
      if (!initResult.success) throw new Error(initResult.error || '本地语音识别模型初始化失败');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContextClass({ sampleRate: 16000 });
      if (this.audioContext.state === 'suspended') await this.audioContext.resume();

      const source = this.audioContext.createMediaStreamSource(stream);
      this.audioProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
      this.audioProcessor.onaudioprocess = async event => {
        if (!this.isRecording || this.isPaused) return;
        const samples = event.inputBuffer.getChannelData(0);
        try {
          const result = await window.api.feedAudio(samples);
          if (result && this.isRecording) this.handleASRResult(result);
        } catch (error) {
          console.error('[ASR] 音频处理失败:', error);
        }
      };
      source.connect(this.audioProcessor);
      this.audioProcessor.connect(this.audioContext.destination);
      this.mediaStream = stream;
    } catch (error) {
      await this.releaseAudioResources();
      try { await window.api.stopASR(); } catch (_) { /* ASR 可能尚未初始化 */ }
      this.isRecording = false;
      this.isPaused = false;
      this.showError(this.describeRecordingError(error));
      this.setAppState('error');
      return;
    }

    this.isRecording = true;
    this.isPaused = false;
    this.startTime = Date.now();
    this.pausedTime = 0;
    this.pauseStart = null;
    this.fullText = '';
    this.sentences = [];
    this.lastFeedbackText = '';
    this.lastReport = '';
    this.subtitleContainer.innerHTML = '';
    this.resetStats();
    this.timer.textContent = this.currentChallenge ? '05:00' : '00:00';
    if (this.activePracticeGoal) {
      this.addFeedbackItem(`本轮练习：${this.activePracticeGoal}`, 'goal');
      this.setAppState('listening', `本轮练习：${this.activePracticeGoal}`);
    } else {
      this.setAppState('listening');
    }

    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => this.updateTimer(), 1000);
  }

  describeRecordingError(error) {
    if (error?.name === 'NotAllowedError') return '无法使用麦克风：请在系统设置中允许“言练”访问麦克风。';
    if (error?.name === 'NotFoundError') return '没有找到可用的麦克风，请连接设备后重试。';
    return `录制启动失败：${error?.message || '未知错误'}`;
  }

  pauseRecording() {
    if (!this.isRecording || this.isPaused) return;
    this.isPaused = true;
    this.pauseStart = Date.now();
    this.setAppState('paused');
  }

  resumeRecording() {
    if (!this.isRecording || !this.isPaused) return;
    this.isPaused = false;
    this.pausedTime += Date.now() - this.pauseStart;
    this.pauseStart = null;
    this.setAppState('listening');
  }

  async stopRecording() {
    if (!this.isRecording) return;

    this.setAppState('stopping');
    this.isRecording = false;
    const wasPausedAt = this.pauseStart;
    await this.releaseAudioResources();

    try {
      const stopResult = await window.api.stopASR();
      const finalText = stopResult?.finalText?.trim();
      if (finalText && finalText !== this.sentences[this.sentences.length - 1]) {
        this.handleASRResult({ text: finalText, isFinal: true });
      }
    } catch (error) {
      this.showError(`结束识别时发生错误：${error.message}`);
    }

    this.isPaused = false;
    clearInterval(this.timerInterval);
    this.timerInterval = null;

    let totalPaused = this.pausedTime;
    if (wasPausedAt) totalPaused += Date.now() - wasPausedAt;
    this.stats.duration = this.startTime ? Math.max(0, Math.floor((Date.now() - this.startTime - totalPaused) / 1000)) : 0;
    this.pauseStart = null;

    await Promise.allSettled(Array.from(this.pendingAnalyses));
    this.updateStatsDisplay();
    this.setAppState('complete');
    if (this.currentChallenge) this.renderChallengeBanner('complete');
  }

  async releaseAudioResources() {
    if (this.audioProcessor) {
      this.audioProcessor.onaudioprocess = null;
      try { this.audioProcessor.disconnect(); } catch (_) { /* 已断开 */ }
      this.audioProcessor = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.audioContext) {
      try { await this.audioContext.close(); } catch (_) { /* 已关闭 */ }
      this.audioContext = null;
    }
  }

  // ===== ASR 结果处理 =====

  handleASRResult({ text, isFinal }) {
    const normalizedText = String(text || '').trim();
    if (!normalizedText) return;

    if (isFinal) {
      const isDuplicate = normalizedText === this.sentences[this.sentences.length - 1];
      if (!isDuplicate) {
        this.sentences.push(normalizedText);
        this.fullText += normalizedText;
        this.queueSentenceAnalysis(normalizedText);
        this.updateSessionMeta();

        if (this.fullText.length - this.lastFeedbackText.length >= 30) {
          this.requestRealtimeFeedback();
        }
      }
    }

    this.renderSubtitle(normalizedText, isFinal);
  }

  queueSentenceAnalysis(text) {
    const task = this.analyzeCurrentSentence(text)
      .catch(error => console.error('[Analysis] 句子分析失败:', error))
      .finally(() => this.pendingAnalyses.delete(task));
    this.pendingAnalyses.add(task);
    return task;
  }

  renderSubtitle(currentText, isFinal) {
    this.subtitleEmpty.classList.add('hidden');

    if (isFinal) {
      const interim = this.subtitleContainer.querySelector('.interim-line');
      if (interim) interim.remove();

      this.subtitleContainer.querySelectorAll('.subtitle-line:not(.old)').forEach(element => {
        element.classList.add('old');
      });

      const line = document.createElement('div');
      line.className = 'subtitle-line';
      line.innerHTML = this.highlightText(currentText);
      this.subtitleContainer.appendChild(line);
    } else {
      let interim = this.subtitleContainer.querySelector('.interim-line');
      if (!interim) {
        interim = document.createElement('div');
        interim.className = 'subtitle-line interim-line';
        this.subtitleContainer.appendChild(interim);
      }
      interim.textContent = currentText;
    }

    this.subtitleScroll.scrollTop = this.subtitleScroll.scrollHeight;
  }

  highlightText(text) {
    const categoryByWord = new Map();
    ['开心', '难过', '害怕', '生气', '不舒服', '很好', '很多', '很快', '很大', '很小', '好看', '不好', '喜欢', '讨厌', '觉得', '想想']
      .forEach(word => categoryByWord.set(word, 'vague'));
    ['嗯', '啊', '呃', '额', '那个', '就是', '然后', '这个', '对吧', '是吧', '反正', '基本上']
      .forEach(word => categoryByWord.set(word, 'filler'));
    ['可能', '也许', '大概', '应该', '我觉得', '好像', '似乎', '或许', '不一定', '差不多', '感觉']
      .forEach(word => categoryByWord.set(word, 'hedge'));

    const words = Array.from(categoryByWord.keys()).sort((a, b) => b.length - a.length);
    const pattern = new RegExp(words.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
    let html = '';
    let cursor = 0;
    let match;

    while ((match = pattern.exec(text)) !== null) {
      html += this.escapeHtml(text.slice(cursor, match.index));
      html += `<span class="${categoryByWord.get(match[0])}">${this.escapeHtml(match[0])}</span>`;
      cursor = match.index + match[0].length;
    }

    return html + this.escapeHtml(text.slice(cursor));
  }

  escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ===== 分析 =====

  async analyzeCurrentSentence(text) {
    const analysis = await window.api.analyzeText(text);
    if (!analysis) return;

    this.stats.fillers += analysis.fillers?.length || 0;
    this.stats.hedges += analysis.hedges?.length || 0;
    this.stats.vagueWords += analysis.vagueWords?.length || 0;
    this.stats.totalWords += analysis.totalWords || 0;
    this.updateStatsDisplay();

    if (analysis.vagueWords?.length) {
      analysis.vagueWords.forEach(item => {
        const alternatives = (item.alternatives || []).slice(0, 3).join(' / ');
        this.addFeedbackItem(`「${item.word}」→ ${alternatives}`, 'vague');
      });
    }

    if (analysis.fillers?.length >= 2) {
      const uniqueFillers = [...new Set(analysis.fillers.map(item => item.word))].slice(0, 3);
      this.addFeedbackItem(`填充词：${uniqueFillers.join('、')}——试试停顿`, 'filler');
    }

    if (analysis.hedges?.length) {
      const uniqueHedges = [...new Set(analysis.hedges.map(item => item.word))].slice(0, 2);
      this.addFeedbackItem(`「${uniqueHedges.join('」「')}」→ 直接说`, 'hedge');
    }
  }

  updateStatsDisplay() {
    this.statFillers.textContent = this.stats.fillers;
    this.statHedges.textContent = this.stats.hedges;
    this.statVague.textContent = this.stats.vagueWords;

    if (this.stats.totalWords > 0) {
      const usefulWords = Math.max(0, this.stats.totalWords - this.stats.fillers - this.stats.hedges);
      this.statDensity.textContent = `${Math.round(usefulWords / this.stats.totalWords * 100)}%`;
    } else {
      this.statDensity.textContent = '--';
    }

    this.updateSessionMeta();
  }

  updateSessionMeta() {
    this.wordCount.textContent = this.stats.totalWords || this.fullText.trim().length || 0;
    this.sentenceCount.textContent = this.sentences.length;
  }

  // ===== 实时反馈 =====

  async requestRealtimeFeedback() {
    if (!this.fullText.trim() || this.feedbackRequestInFlight) return;

    this.feedbackRequestInFlight = true;
    this.lastFeedbackText = this.fullText;
    try {
      const result = await window.api.getRealtimeFeedback(this.fullText);
      if (result.success && result.feedback) {
        result.feedback.split('\n').filter(line => line.trim()).forEach(line => {
          const feedback = line.trim();
          this.addFeedbackItem(feedback, this.classifyFeedback(feedback));
        });
      }
    } catch (error) {
      console.error('[LLM] 实时反馈失败:', error);
    } finally {
      this.feedbackRequestInFlight = false;
    }
  }

  classifyFeedback(text) {
    if (text === '✓' || text.includes('✓')) return 'good';
    const fillerKeywords = ['嗯', '啊', '呃', '那个', '就是', '然后', '这个', '对吧', '是吧', '反正', '基本上', '所以说'];
    if (fillerKeywords.some(word => text.includes(`「${word}」`))) return 'filler';
    const hedgeKeywords = ['可能', '也许', '大概', '应该', '我觉得', '好像', '似乎', '感觉', '或许'];
    if (hedgeKeywords.some(word => text.includes(`「${word}」`))) return 'hedge';
    if (text.includes('→')) return 'vague';
    return 'ai';
  }

  addFeedbackItem(text, type = 'ai') {
    const empty = this.feedbackContent.querySelector('.feedback-empty');
    if (empty) empty.remove();

    const existing = Array.from(this.feedbackContent.querySelectorAll('.feedback-item')).slice(0, 3);
    if (existing.some(element => element.textContent === text)) return;

    const item = document.createElement('div');
    item.className = `feedback-item type-${type}`;
    item.textContent = text;
    this.feedbackContent.insertBefore(item, this.feedbackContent.firstChild);

    const items = this.feedbackContent.querySelectorAll('.feedback-item');
    if (items.length > 12) items[items.length - 1].remove();
  }

  renderFeedbackEmpty() {
    this.feedbackContent.innerHTML = `
      <div id="feedback-empty" class="feedback-empty">
        <span class="feedback-empty-icon" aria-hidden="true">↳</span>
        <strong>反馈会出现在这里</strong>
        <p>完成一句话后，系统会提示填充词、犹豫词和更精准的表达方式。</p>
      </div>
    `;
  }

  // ===== 报告 =====

  async generateReport() {
    if (!this.fullText.trim()) return;

    await Promise.allSettled(Array.from(this.pendingAnalyses));
    this.openModal(this.reportModal);
    this.reportAction.classList.add('hidden');
    this.reportBody.innerHTML = `
      <div class="report-message report-loading" role="status">
        <span class="report-loading-dot" aria-hidden="true"></span>
        <strong>正在整理这一轮最值得练的内容</strong>
        <p>报告会列出主要发现，并给出一个可以马上尝试的建议。</p>
      </div>
    `;
    this.setAppState('analyzing');

    try {
      const result = await window.api.getFinalReport({
        fullText: this.fullText,
        stats: this.stats,
        context: this.currentChallenge ? {
          topic: this.currentChallenge.title,
          topicPrompt: this.currentChallenge.prompt,
          category: this.currentChallenge.category
        } : null
      });
      if (!result.success) throw new Error(result.error || '报告服务暂时不可用');
      this.lastReport = result.report;
      this.renderReport(result.report);
    } catch (error) {
      this.reportAction.classList.add('hidden');
      this.reportBody.innerHTML = `<div class="report-message error">${this.escapeHtml(`生成失败：${error.message}`)}</div>`;
    } finally {
      this.setAppState('complete');
    }
  }

  renderReport(report) {
    this.nextPracticeGoal = this.extractPracticeGoal(report);
    const scoreData = this.extractReportScores(report);
    const lines = String(report || '').split('\n');
    const intro = [];
    const sections = [];
    let currentSection = null;

    lines.forEach(line => {
      const headingMatch = line.match(/^##\s+(.+)$/);
      if (headingMatch) {
        currentSection = { title: headingMatch[1].trim(), lines: [] };
        sections.push(currentSection);
        return;
      }
      if (currentSection) currentSection.lines.push(line);
      else intro.push(line);
    });

    if (!sections.length) {
      sections.push({ title: '本轮概览', lines: intro.splice(0) });
    }

    let transcriptSection = sections.find(section => /数据|记录|原文/.test(section.title));
    if (transcriptSection) {
      transcriptSection.includesTranscript = true;
    } else {
      transcriptSection = { title: '数据与原文', lines: [], includesTranscript: true };
      sections.push(transcriptSection);
    }

    const introHtml = intro
      .filter(line => line.trim())
      .map(line => `<p>${this.formatInline(line)}</p>`)
      .join('');

    const sectionsHtml = sections.map((section, index) => {
      const sectionClass = this.getReportSectionClass(section.title);
      const sectionId = `report-section-${index + 1}`;
      const isScoreOverview = /总览与评分|评分总览/.test(section.title);
      const scoreDashboard = isScoreOverview ? this.renderScoreDashboard(scoreData) : '';
      const body = this.renderReportSectionLines(section.lines, { hideScoreSummary: isScoreOverview });
      const transcriptHtml = section.includesTranscript ? this.renderReportTranscript() : '';
      return `
        <section id="${sectionId}" class="report-section ${sectionClass}" data-report-section>
          <div class="report-section-number">${String(index + 1).padStart(2, '0')}</div>
          <div class="report-section-content">
            <h2>${this.formatInline(section.title)}</h2>
            ${scoreDashboard}
            ${body}
            ${transcriptHtml}
          </div>
        </section>
      `;
    }).join('');

    const navigationHtml = sections.map((section, index) => `
      <button class="report-nav-button${index === 0 ? ' active' : ''}" type="button" data-report-target="report-section-${index + 1}">
        <span>${String(index + 1).padStart(2, '0')}</span>
        <strong>${this.escapeHtml(section.title)}</strong>
      </button>
    `).join('');

    this.reportBody.innerHTML = `
      <div class="report-toolbar">
        <div>
          <span class="report-toolbar-label">本轮训练复盘</span>
          <span class="report-toolbar-goal">建议尝试：${this.escapeHtml(this.nextPracticeGoal)}</span>
        </div>
        <button id="btn-save-report" class="btn-sm report-save-button" type="button">保存 Markdown</button>
      </div>
      <div class="report-layout">
        <nav class="report-navigation" aria-label="报告章节">
          <span class="report-navigation-label">报告目录</span>
          ${navigationHtml}
        </nav>
        <main class="report-document">
          ${introHtml ? `<div class="report-summary">${introHtml}</div>` : ''}
          <div class="report-sections">${sectionsHtml}</div>
        </main>
      </div>
    `;

    this.reportGoal.textContent = this.nextPracticeGoal || '把刚才的内容再清楚地说一遍';
    this.reportAction.classList.remove('hidden');
    document.getElementById('btn-save-report').addEventListener('click', () => this.saveReport());
    this.setupReportNavigation();
  }

  extractReportScores(report) {
    const dimensions = [
      { name: '观点清晰度', short: '观点', weight: 20 },
      { name: '结构组织', short: '结构', weight: 20 },
      { name: '具体与说服力', short: '具体', weight: 15 },
      { name: '用词精准度', short: '用词', weight: 15 },
      { name: '流畅与简洁度', short: '流畅', weight: 15 },
      { name: '直接与行动性', short: '行动', weight: 15 }
    ];
    const source = String(report || '');
    const scored = dimensions.map(dimension => {
      const escapedName = dimension.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`(?:^|\\n)\\s*[-*]?\\s*\\*\\*${escapedName}[：:]\\*\\*\\s*(\\d{1,3})(?:\\s*\\/\\s*100|分)?(?:\\s*[｜|]\\s*([^\\n]+))?`);
      const match = source.match(pattern);
      if (!match) return { ...dimension, score: null, note: '' };
      return {
        ...dimension,
        score: Math.max(0, Math.min(100, Number(match[1]))),
        note: (match[2] || '').trim()
      };
    });
    const available = scored.filter(item => Number.isFinite(item.score));
    const providedTotal = source.match(/\*\*综合表现[：:]\*\*\s*(\d{1,3})(?:\s*\/\s*100|分)?/);
    const calculatedTotal = available.length === dimensions.length
      ? Math.round(scored.reduce((sum, item) => sum + item.score * item.weight, 0) / 100)
      : null;

    return {
      dimensions: scored,
      total: calculatedTotal ?? (providedTotal ? Math.max(0, Math.min(100, Number(providedTotal[1]))) : null)
    };
  }

  renderScoreDashboard(scoreData) {
    const dimensions = scoreData?.dimensions?.filter(item => Number.isFinite(item.score)) || [];
    if (!dimensions.length) return '';

    const center = 110;
    const radius = 64;
    const labelRadius = 91;
    const pointAt = (index, scale) => {
      const angle = -Math.PI / 2 + (Math.PI * 2 * index) / dimensions.length;
      return {
        x: center + Math.cos(angle) * radius * scale,
        y: center + Math.sin(angle) * radius * scale
      };
    };
    const polygon = scale => dimensions
      .map((_, index) => pointAt(index, scale))
      .map(point => `${point.x.toFixed(1)},${point.y.toFixed(1)}`)
      .join(' ');
    const scorePolygon = dimensions
      .map((item, index) => pointAt(index, item.score / 100))
      .map(point => `${point.x.toFixed(1)},${point.y.toFixed(1)}`)
      .join(' ');
    const axes = dimensions.map((item, index) => {
      const edge = pointAt(index, 1);
      const labelAngle = -Math.PI / 2 + (Math.PI * 2 * index) / dimensions.length;
      const labelX = center + Math.cos(labelAngle) * labelRadius;
      const labelY = center + Math.sin(labelAngle) * labelRadius + 3;
      const anchor = Math.cos(labelAngle) > 0.25 ? 'start' : Math.cos(labelAngle) < -0.25 ? 'end' : 'middle';
      return `
        <line x1="${center}" y1="${center}" x2="${edge.x.toFixed(1)}" y2="${edge.y.toFixed(1)}"></line>
        <text x="${labelX.toFixed(1)}" y="${labelY.toFixed(1)}" text-anchor="${anchor}">${this.escapeHtml(item.short)}</text>
      `;
    }).join('');
    const dots = dimensions.map((item, index) => {
      const point = pointAt(index, item.score / 100);
      return `<circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="2.6"></circle>`;
    }).join('');
    const total = Number.isFinite(scoreData.total) ? scoreData.total : '--';
    const band = Number.isFinite(scoreData.total)
      ? scoreData.total >= 90 ? '成熟稳定'
        : scoreData.total >= 80 ? '清楚有效'
          : scoreData.total >= 70 ? '基本清楚'
            : scoreData.total >= 60 ? '理解费力'
              : '表达尚未成形'
      : '等待完整评分';
    const bars = dimensions.map(item => `
      <div class="report-score-row">
        <span class="report-score-name">${this.escapeHtml(item.name)}</span>
        <span class="report-score-track" aria-hidden="true"><i style="width:${item.score}%"></i></span>
        <strong>${item.score}</strong>
        ${item.note ? `<small>${this.escapeHtml(item.note)}</small>` : ''}
      </div>
    `).join('');

    return `
      <div class="report-score-dashboard" aria-label="六维表达评分">
        <div class="report-score-visual">
          <div class="report-total-score">
            <span>综合表现</span>
            <div><strong>${total}</strong><small>/100</small></div>
            <em>${band}</em>
          </div>
          <svg class="report-radar" viewBox="0 0 220 220" role="img" aria-label="六维评分雷达图">
            <g class="report-radar-grid">
              <polygon points="${polygon(.25)}"></polygon>
              <polygon points="${polygon(.5)}"></polygon>
              <polygon points="${polygon(.75)}"></polygon>
              <polygon points="${polygon(1)}"></polygon>
              ${axes}
            </g>
            <polygon class="report-radar-area" points="${scorePolygon}"></polygon>
            <g class="report-radar-dots">${dots}</g>
          </svg>
        </div>
        <div class="report-score-bars">${bars}</div>
        <p class="report-score-method">六维分数来自固定子项规则；综合分按 20% / 20% / 15% / 15% / 15% / 15% 加权计算。</p>
      </div>
    `;
  }

  isScoreSummaryLine(line) {
    return /\*\*综合表现[：:]\*\*/.test(line)
      || /^\s*[-*]\s+\*\*(观点清晰度|结构组织|具体与说服力|用词精准度|流畅与简洁度|直接与行动性)[：:]\*\*/.test(line);
  }

  renderReportSectionLines(lines, options = {}) {
    const html = [];
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (options.hideScoreSummary && this.isScoreSummaryLine(line)) continue;

      const nextLine = lines[index + 1] || '';
      if (/^\s*\|.*\|\s*$/.test(line) && /^\s*\|?\s*:?-{3,}/.test(nextLine)) {
        const rows = [line];
        index += 2;
        while (index < lines.length && /^\s*\|.*\|\s*$/.test(lines[index])) {
          rows.push(lines[index]);
          index += 1;
        }
        index -= 1;
        const cells = rows.map(row => row.trim().replace(/^\||\|$/g, '').split('|').map(cell => cell.trim()));
        const headers = cells.shift() || [];
        html.push(`
          <div class="report-table-wrap">
            <table class="report-table">
              <thead><tr>${headers.map(cell => `<th>${this.formatInline(cell)}</th>`).join('')}</tr></thead>
              <tbody>${cells.map(row => `<tr>${row.map(cell => `<td>${this.formatInline(cell)}</td>`).join('')}</tr>`).join('')}</tbody>
            </table>
          </div>
        `);
        continue;
      }

      html.push(this.renderReportLine(line));
    }
    return html.join('');
  }

  renderReportLine(line) {
    if (/^###\s+/.test(line)) {
      const heading = line.replace(/^###\s+/, '').trim();
      const scoredHeading = heading.match(/^(.*?)\s*[·｜|]\s*(\d{1,3})分$/);
      if (scoredHeading) {
        return `<h3 class="report-dimension-heading"><span>${this.formatInline(scoredHeading[1])}</span><strong>${scoredHeading[2]}分</strong></h3>`;
      }
      return `<h3>${this.formatInline(heading)}</h3>`;
    }
    if (/^>\s*/.test(line)) {
      const quote = line.replace(/^>\s*/, '');
      const quoteClass = /^(调整后|更直接的版本|修改后)/.test(quote) ? ' report-quote-after' : '';
      return `<blockquote class="${quoteClass.trim()}">${this.formatInline(quote)}</blockquote>`;
    }
    if (/^\*\*子项[：:]\*\*/.test(line)) {
      const content = line.replace(/^\*\*子项[：:]\*\*\s*/, '');
      const chips = content.split(/[｜|]/).map(item => item.trim()).filter(Boolean);
      return `<div class="report-subscore-list"><span>评分子项</span>${chips.map(item => `<strong>${this.escapeHtml(item)}</strong>`).join('')}</div>`;
    }
    if (/^[-*]\s+/.test(line)) return `<p class="report-list-item">${this.formatInline(line.replace(/^[-*]\s+/, ''))}</p>`;
    if (!line.trim()) return '<div class="report-spacer" aria-hidden="true"></div>';

    let lineClass = '';
    if (/\*\*(建议先试|建议动作|本轮建议)[：:]\*\*/.test(line)) {
      lineClass = ' class="report-suggestion-line"';
    }
    return `<p${lineClass}>${this.formatInline(line)}</p>`;
  }

  renderReportTranscript() {
    const text = this.escapeHtml(this.fullText || '本轮没有可显示的逐字稿。').replace(/\n/g, '<br>');
    return `
      <details class="report-transcript">
        <summary>
          <span>完整逐字稿</span>
          <small>${this.stats.totalWords || 0} 字 · 点击展开</small>
        </summary>
        <div class="report-transcript-text">${text}</div>
      </details>
    `;
  }

  setupReportNavigation() {
    if (this.reportScrollHandler) {
      this.reportBody.removeEventListener('scroll', this.reportScrollHandler);
    }

    const buttons = Array.from(this.reportBody.querySelectorAll('[data-report-target]'));
    const sections = Array.from(this.reportBody.querySelectorAll('[data-report-section]'));

    buttons.forEach(button => {
      button.addEventListener('click', () => {
        const section = document.getElementById(button.dataset.reportTarget);
        section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    this.reportScrollHandler = () => {
      const bodyTop = this.reportBody.getBoundingClientRect().top;
      const reachedBottom = Math.ceil(this.reportBody.scrollTop + this.reportBody.clientHeight) >= this.reportBody.scrollHeight - 4;
      let activeSection = reachedBottom ? sections[sections.length - 1] : sections[0];

      if (!reachedBottom) {
        sections.forEach(section => {
          if (section.getBoundingClientRect().top <= bodyTop + 118) activeSection = section;
        });
      }

      buttons.forEach(button => {
        const isActive = button.dataset.reportTarget === activeSection?.id;
        button.classList.toggle('active', isActive);
        if (isActive) button.setAttribute('aria-current', 'true');
        else button.removeAttribute('aria-current');
      });
    };

    this.reportBody.addEventListener('scroll', this.reportScrollHandler, { passive: true });
    requestAnimationFrame(this.reportScrollHandler);
  }

  getReportSectionClass(title) {
    if (/总览与评分|评分总览/.test(title)) return 'report-section-score';
    if (/评分依据|维度分析/.test(title)) return 'report-section-dimensions';
    if (/亮点|值得保留/.test(title)) return 'report-section-win';
    if (/改进机会|发现/.test(title)) return 'report-section-opportunities';
    if (/逐句编辑|修改示范|表达示范|怎么改/.test(title)) return 'report-section-rewrite';
    if (/用词|表达习惯/.test(title)) return 'report-section-habits';
    if (/建议先试|建议尝试|本轮建议|本轮优先|优先训练/.test(title)) return 'report-section-focus';
    if (/再练|训练任务/.test(title)) return 'report-section-practice';
    if (/数据|记录|原文/.test(title)) return 'report-section-data';
    if (/概览|总结/.test(title)) return 'report-section-overview';
    return '';
  }

  extractPracticeGoal(report) {
    const priorityMatch = String(report || '').match(/\*\*(?:建议先试|建议动作|本轮建议|本轮优先|训练焦点)：\*\*\s*([^\n]+)/);
    if (priorityMatch) return priorityMatch[1].trim().replace(/[。；;]+$/, '');
    const challengeMatch = String(report || '').match(/\*\*挑战：\*\*\s*([^\n]+)/);
    if (challengeMatch) return challengeMatch[1].trim().replace(/[。；;]+$/, '');
    return '把核心观点说得更直接';
  }

  async startPracticeAgain() {
    const goal = this.nextPracticeGoal || '把核心观点说得更直接';
    this.closeModal(this.reportModal);
    await this.startRecording(goal);
  }

  formatInline(text) {
    return this.escapeHtml(text)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }

  async saveReport() {
    if (!this.lastReport) return;
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 5).replace(':', '');
    const challengeMeta = this.currentChallenge
      ? `**演讲话题**: ${this.currentChallenge.title}  \n**话题分类**: ${this.currentChallenge.category}  \n`
      : '';
    const markdown = `# 言练表达训练报告\n\n**日期**: ${dateStr}  \n${challengeMeta}**时长**: ${this.stats.duration}秒  \n**总字数**: ${this.stats.totalWords}  \n\n---\n\n## 完整原文\n\n${this.fullText}\n\n---\n\n${this.lastReport}`;
    const filename = `言练-表达训练-${dateStr}-${timeStr}.md`;

    try {
      const result = await window.api.saveFile(markdown, filename);
      if (result.success) {
        const button = document.getElementById('btn-save-report');
        button.textContent = '已保存';
        button.disabled = true;
        setTimeout(() => {
          button.textContent = '保存为 Markdown';
          button.disabled = false;
        }, 1800);
      }
    } catch (error) {
      this.showError(`报告保存失败：${error.message}`);
    }
  }

  // ===== 工具 =====

  updateTimer() {
    if (!this.startTime) return;
    let totalPaused = this.pausedTime;
    if (this.pauseStart) totalPaused += Date.now() - this.pauseStart;
    const elapsed = Math.max(0, Math.floor((Date.now() - this.startTime - totalPaused) / 1000));

    if (this.currentChallenge) {
      const remaining = Math.max(0, 300 - elapsed);
      const minutes = Math.floor(remaining / 60).toString().padStart(2, '0');
      const seconds = (remaining % 60).toString().padStart(2, '0');
      this.timer.textContent = `${minutes}:${seconds}`;
      this.timer.classList.toggle('urgent', remaining <= 60);
      if (remaining === 0 && this.isRecording && !this.challengeAutoStopping) {
        this.challengeAutoStopping = true;
        this.stopRecording();
      }
      return;
    }

    this.timer.classList.remove('urgent');
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    this.timer.textContent = `${minutes}:${seconds}`;
  }

  resetStats() {
    this.stats = { fillers: 0, hedges: 0, vagueWords: 0, totalWords: 0, duration: 0 };
    this.updateStatsDisplay();
    this.renderFeedbackEmpty();
  }

  showError(message) {
    this.subtitleEmpty.classList.add('hidden');
    const line = document.createElement('div');
    line.className = 'subtitle-line error-line';
    line.textContent = message;
    this.subtitleContainer.appendChild(line);
  }

  openModal(modal) {
    modal.classList.remove('hidden');
    const focusTarget = modal.querySelector('textarea, button');
    requestAnimationFrame(() => focusTarget?.focus());
  }

  closeModal(modal) {
    modal.classList.add('hidden');
  }

  copyOriginalText() {
    if (!this.fullText.trim()) return;
    navigator.clipboard.writeText(this.fullText).then(() => {
      this.btnCopyText.textContent = '已复制';
      setTimeout(() => { this.btnCopyText.textContent = '复制'; }, 1500);
    });
  }

  async saveOriginalText() {
    if (!this.fullText.trim()) return;
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 5).replace(':', '');
    const markdown = `# 言练表达训练原文\n\n**日期**: ${dateStr}\n\n---\n\n${this.fullText}`;
    const filename = `言练-原文-${dateStr}-${timeStr}.md`;

    try {
      const result = await window.api.saveFile(markdown, filename);
      if (result.success) {
        this.btnSaveText.textContent = '已保存';
        setTimeout(() => { this.btnSaveText.textContent = '保存'; }, 1800);
      }
    } catch (error) {
      this.showError(`原文保存失败：${error.message}`);
    }
  }

  clearAll() {
    if (this.isRecording) return;
    this.fullText = '';
    this.sentences = [];
    this.lastReport = '';
    this.lastFeedbackText = '';
    this.subtitleContainer.innerHTML = '';
    this.resetStats();
    this.timer.textContent = '00:00';
    this.timer.classList.remove('urgent');
    this.currentChallenge = null;
    this.challengeBanner.classList.add('hidden');
    this.setAppState('idle');
  }

  // ===== 主题演讲训练 =====

  openTopicPractice() {
    if (this.isRecording) return;
    this.populateTopicCategories();
    this.resetTopicPractice();
    this.openModal(this.topicModal);
    requestAnimationFrame(() => this.btnDrawTopic.focus());
  }

  populateTopicCategories() {
    if (this.topicCategory.options.length > 1) return;
    Object.keys(window.SPEECH_TOPIC_CATEGORIES || {}).forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      this.topicCategory.appendChild(option);
    });
    this.updateTopicLibraryCount();
  }

  updateTopicLibraryCount() {
    const category = this.topicCategory.value;
    const count = (window.SPEECH_TOPICS || []).filter(topic => category === '全部' || topic.category === category).length;
    this.topicLibraryCount.textContent = `${count} 个话题`;
  }

  resetTopicPractice() {
    clearInterval(this.preparationInterval);
    this.preparationInterval = null;
    this.preparationEndsAt = null;
    this.preparationStartedAt = null;
    this.selectedTopic = null;
    this.topicNotes.value = '';
    this.topicNotes.removeAttribute('readonly');
    this.btnStartTopicSpeech.disabled = false;
    this.btnStartTopicSpeech.textContent = '提前开始 5 分钟演讲';
    this.updateTopicNotesCount();
    this.setTopicStage('draw');
    this.topicCard.classList.add('is-empty');
    this.topicCardNumber.textContent = 'NO. ———';
    this.topicCardCategory.textContent = 'RANDOM DRAW';
    this.topicCardTitle.textContent = '点击按钮，抽取一个演讲话题';
    this.topicCardPrompt.textContent = '抽题前可以选择方向，也可以保留“全部分类”进行完全随机抽取。';
    this.topicCardAngles.innerHTML = '';
    this.topicCardAngles.classList.add('hidden');
    this.btnDrawTopic.textContent = '随机抽一题';
    this.btnAcceptTopic.classList.add('hidden');
  }

  setTopicStage(stage) {
    this.topicStage = stage;
    this.topicStageDraw.classList.toggle('hidden', stage !== 'draw');
    this.topicStagePrepare.classList.toggle('hidden', stage !== 'prepare');
    document.querySelectorAll('[data-topic-step]').forEach(step => {
      const names = ['draw', 'prepare', 'speak'];
      const currentIndex = names.indexOf(stage);
      const stepIndex = names.indexOf(step.dataset.topicStep);
      step.classList.toggle('active', stepIndex === currentIndex);
      step.classList.toggle('done', stepIndex < currentIndex);
    });
  }

  drawTopic() {
    const category = this.topicCategory.value;
    const pool = (window.SPEECH_TOPICS || []).filter(topic => category === '全部' || topic.category === category);
    if (!pool.length) return;

    const recentIds = JSON.parse(localStorage.getItem('yanlian-recent-topics') || '[]');
    const freshPool = pool.filter(topic => !recentIds.includes(topic.id));
    const candidates = freshPool.length ? freshPool : pool;
    const next = candidates[Math.floor(Math.random() * candidates.length)];
    this.selectedTopic = next;

    const updatedRecent = [next.id, ...recentIds.filter(id => id !== next.id)].slice(0, 20);
    localStorage.setItem('yanlian-recent-topics', JSON.stringify(updatedRecent));

    const angles = window.SPEECH_TOPIC_CATEGORIES?.[next.category] || [];
    this.topicCard.classList.remove('is-empty');
    this.topicCardNumber.textContent = `NO. ${String(next.id).padStart(3, '0')}`;
    this.topicCardCategory.textContent = next.category.toUpperCase();
    this.topicCardTitle.textContent = next.title;
    this.topicCardPrompt.textContent = next.prompt;
    this.topicCardAngles.innerHTML = angles.map((angle, index) => `<span><b>0${index + 1}</b>${this.escapeHtml(angle)}</span>`).join('');
    this.topicCardAngles.classList.remove('hidden');
    this.btnDrawTopic.textContent = '换一个话题';
    this.btnAcceptTopic.classList.remove('hidden');
  }

  startPreparation() {
    if (!this.selectedTopic) return;
    const topic = this.selectedTopic;
    const angles = window.SPEECH_TOPIC_CATEGORIES?.[topic.category] || [];
    this.prepareTopicNumber.textContent = `TOPIC ${String(topic.id).padStart(3, '0')}`;
    this.prepareTopicCategory.textContent = topic.category;
    this.prepareTopicTitle.textContent = topic.title;
    this.prepareTopicPrompt.textContent = topic.prompt;
    this.prepareTopicAngles.innerHTML = angles.map(angle => `<li>${this.escapeHtml(angle)}</li>`).join('');
    this.topicNotes.value = '';
    this.updateTopicNotesCount();
    this.setTopicStage('prepare');
    this.preparationStartedAt = Date.now();
    this.preparationEndsAt = Date.now() + (15 * 60 * 1000);
    this.updatePreparationTimer();
    clearInterval(this.preparationInterval);
    this.preparationInterval = setInterval(() => this.updatePreparationTimer(), 250);
    requestAnimationFrame(() => this.topicNotes.focus());
  }

  updatePreparationTimer() {
    if (!this.preparationEndsAt) return;
    const remaining = Math.max(0, Math.ceil((this.preparationEndsAt - Date.now()) / 1000));
    const minutes = Math.floor(remaining / 60).toString().padStart(2, '0');
    const seconds = (remaining % 60).toString().padStart(2, '0');
    this.prepareTimer.textContent = `${minutes}:${seconds}`;
    this.prepareTimer.classList.toggle('urgent', remaining <= 60);
    if (remaining === 0) {
      clearInterval(this.preparationInterval);
      this.preparationInterval = null;
      this.btnStartTopicSpeech.textContent = '准备结束 · 开始演讲';
      this.topicNotes.setAttribute('readonly', 'readonly');
      this.btnStartTopicSpeech.focus();
    }
  }

  updateTopicNotesCount() {
    this.topicNotesCount.textContent = `${this.topicNotes.value.length} / 1200`;
  }

  blockNotesPaste(event) {
    event.preventDefault();
    const original = this.topicNotesCount.textContent;
    this.topicNotesCount.textContent = '请手动输入';
    this.topicNotesCount.classList.add('blocked');
    setTimeout(() => {
      this.topicNotesCount.textContent = original;
      this.topicNotesCount.classList.remove('blocked');
    }, 1600);
  }

  returnToTopicDraw() {
    if (this.topicNotes.value.trim() && !window.confirm('返回后会清空当前提纲，确定重新抽题吗？')) return;
    clearInterval(this.preparationInterval);
    this.preparationInterval = null;
    this.preparationEndsAt = null;
    this.topicNotes.removeAttribute('readonly');
    this.btnStartTopicSpeech.textContent = '提前开始 5 分钟演讲';
    this.setTopicStage('draw');
  }

  async beginTopicSpeech() {
    if (!this.selectedTopic || this.btnStartTopicSpeech.disabled) return;
    this.btnStartTopicSpeech.disabled = true;
    this.btnStartTopicSpeech.textContent = '正在准备麦克风…';
    clearInterval(this.preparationInterval);
    this.preparationInterval = null;

    const prepSeconds = this.preparationStartedAt
      ? Math.max(0, Math.floor((Date.now() - this.preparationStartedAt) / 1000))
      : 0;
    const challenge = {
      ...this.selectedTopic,
      notes: this.topicNotes.value.trim(),
      prepDuration: Math.min(900, prepSeconds),
      speechLimit: 300
    };

    this.closeModal(this.topicModal);
    await this.startRecording('', { challenge });
    this.btnStartTopicSpeech.disabled = false;
    this.btnStartTopicSpeech.textContent = '提前开始 5 分钟演讲';
    this.topicNotes.removeAttribute('readonly');
  }

  closeTopicPractice(force = false) {
    if (this.topicStage === 'prepare' && !force) {
      const confirmed = window.confirm('退出后会结束准备计时，并清空当前提纲。确定退出吗？');
      if (!confirmed) return;
    }
    clearInterval(this.preparationInterval);
    this.preparationInterval = null;
    this.preparationEndsAt = null;
    this.closeModal(this.topicModal);
  }

  renderChallengeBanner(stage = 'speaking') {
    if (!this.currentChallenge) {
      this.challengeBanner.classList.add('hidden');
      return;
    }
    const topic = this.currentChallenge;
    this.challengeBannerCode.textContent = `TOPIC ${String(topic.id).padStart(3, '0')}`;
    this.challengeBannerCategory.textContent = topic.category;
    this.challengeBannerTitle.textContent = topic.title;
    this.challengeBannerStage.textContent = stage === 'complete' ? 'SPEECH COMPLETE' : '5 MIN SPEECH';
    this.challengeBanner.classList.remove('hidden');
    this.btnViewChallengeNotes.classList.toggle('hidden', !topic.notes);
  }

  openChallengeNotes() {
    if (!this.currentChallenge) return;
    this.challengeNotesTopic.innerHTML = `<span>${this.escapeHtml(this.currentChallenge.category)}</span><strong>${this.escapeHtml(this.currentChallenge.title)}</strong>`;
    this.challengeNotesText.textContent = this.currentChallenge.notes || '本轮没有填写提纲。';
    this.openModal(this.challengeNotesModal);
  }

  // ===== 粘贴逐字稿分析 =====

  openPasteModal() {
    this.pasteTextarea.value = '';
    this.openModal(this.pasteModal);
    requestAnimationFrame(() => this.pasteTextarea.focus());
  }

  async analyzePastedText() {
    const text = this.pasteTextarea.value.trim();
    if (!text || this.btnAnalyzePaste.disabled) return;

    this.btnAnalyzePaste.disabled = true;
    this.btnAnalyzePaste.textContent = '分析中…';
    this.closeModal(this.pasteModal);
    this.fullText = text;
    this.lastReport = '';
    this.lastFeedbackText = '';
    this.subtitleContainer.innerHTML = '';
    this.resetStats();
    this.setAppState('analyzing');

    const sentences = text.split(/(?<=[。！？\n])/g).map(sentence => sentence.trim()).filter(Boolean);
    this.sentences = sentences;

    sentences.forEach(sentence => {
      const line = document.createElement('div');
      line.className = 'subtitle-line old';
      line.innerHTML = this.highlightText(sentence);
      this.subtitleContainer.appendChild(line);
    });
    const finalLine = this.subtitleContainer.lastElementChild;
    if (finalLine) finalLine.classList.remove('old');
    this.subtitleEmpty.classList.add('hidden');
    this.updateSessionMeta();

    try {
      const analyses = await Promise.all(sentences.map(sentence => window.api.analyzeText(sentence)));
      analyses.filter(Boolean).forEach(analysis => {
        this.stats.fillers += analysis.fillers?.length || 0;
        this.stats.hedges += analysis.hedges?.length || 0;
        this.stats.vagueWords += analysis.vagueWords?.length || 0;
        this.stats.totalWords += analysis.totalWords || 0;
      });
      this.updateStatsDisplay();
      this.setAppState('complete', '逐字稿分析完成，可以生成训练报告');
      this.requestRealtimeFeedback();
    } catch (error) {
      this.showError(`逐字稿分析失败：${error.message}`);
      this.setAppState('error', '逐字稿分析失败，请检查服务设置');
    } finally {
      this.btnAnalyzePaste.disabled = false;
      this.btnAnalyzePaste.textContent = '开始分析';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => { new ExpressionTrainer(); });
