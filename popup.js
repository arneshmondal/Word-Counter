// Common English stopwords to exclude from top keyword extraction
const STOP_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
  'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
  'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
  'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
  'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
  'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
  'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
  'are', 'was', 'were', 'been', 'has', 'had', 'is', 'am'
]);

// State
let currentTab = null;
let currentScope = 'full'; // 'full' | 'selection'
let pageStats = null;
let selectionStats = null;

// DOM Elements
const pageDomainEl = document.getElementById('pageDomain');
const refreshBtn = document.getElementById('refreshBtn');
const refreshIcon = document.getElementById('refreshIcon');
const copyBtn = document.getElementById('copyBtn');
const tabEntirePage = document.getElementById('tabEntirePage');
const tabSelection = document.getElementById('tabSelection');
const selectionBadge = document.getElementById('selectionBadge');
const scopeTag = document.getElementById('scopeTag');
const statsContainer = document.getElementById('statsContainer');
const restrictedState = document.getElementById('restrictedState');
const restrictedTitle = document.getElementById('restrictedTitle');
const restrictedMsg = document.getElementById('restrictedMsg');
const noSelectionNotice = document.getElementById('noSelectionNotice');
const toast = document.getElementById('toast');

// Metric elements
const wordCountEl = document.getElementById('wordCount');
const charCountEl = document.getElementById('charCount');
const charNoSpaceCountEl = document.getElementById('charNoSpaceCount');
const sentenceCountEl = document.getElementById('sentenceCount');
const avgSentenceWordsEl = document.getElementById('avgSentenceWords');
const paragraphCountEl = document.getElementById('paragraphCount');
const readingTimeEl = document.getElementById('readingTime');
const speakingTimeEl = document.getElementById('speakingTime');
const keywordsListEl = document.getElementById('keywordsList');

// Formatter for numbers (1,234)
const numFormat = new Intl.NumberFormat();

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadStats();
});

function setupEventListeners() {
  refreshBtn.addEventListener('click', () => {
    refreshIcon.classList.add('spinning');
    loadStats().finally(() => {
      setTimeout(() => refreshIcon.classList.remove('spinning'), 600);
    });
  });

  tabEntirePage.addEventListener('click', () => switchTab('full'));
  tabSelection.addEventListener('click', () => switchTab('selection'));
  copyBtn.addEventListener('click', copySummaryToClipboard);
}

function switchTab(scope) {
  currentScope = scope;
  if (scope === 'full') {
    tabEntirePage.classList.add('active');
    tabEntirePage.setAttribute('aria-selected', 'true');
    tabSelection.classList.remove('active');
    tabSelection.setAttribute('aria-selected', 'false');
    scopeTag.textContent = 'Full Page';
    noSelectionNotice.classList.add('hidden');
    renderStats(pageStats);
  } else {
    tabSelection.classList.add('active');
    tabSelection.setAttribute('aria-selected', 'true');
    tabEntirePage.classList.remove('active');
    tabEntirePage.setAttribute('aria-selected', 'false');
    scopeTag.textContent = 'Selection';
    if (!selectionStats || selectionStats.wordCount === 0) {
      noSelectionNotice.classList.remove('hidden');
    } else {
      noSelectionNotice.classList.add('hidden');
    }
    renderStats(selectionStats);
  }
}

// Function injected into the target tab
function extractPageDataInTab() {
  let selected = '';
  // Check active input/textarea selection first
  const activeEl = document.activeElement;
  if (activeEl && (activeEl.tagName === 'TEXTAREA' || (activeEl.tagName === 'INPUT' && /^(text|search|url|tel)$/i.test(activeEl.type)))) {
    const start = activeEl.selectionStart || 0;
    const end = activeEl.selectionEnd || 0;
    if (end > start) {
      selected = activeEl.value.substring(start, end);
    }
  }

  // Fallback to standard window selection
  if (!selected && window.getSelection) {
    selected = window.getSelection().toString();
  }

  // Get visible rendered text from document body
  const full = document.body ? document.body.innerText : '';

  return {
    fullText: full || '',
    selectedText: selected || '',
    title: document.title || '',
    url: window.location.href || ''
  };
}

async function loadStats() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs || tabs.length === 0) {
      showRestricted('No active tab found', 'Please ensure a webpage is open.');
      return;
    }

    currentTab = tabs[0];
    const url = currentTab.url || '';

    // Check for restricted URLs
    if (isRestrictedUrl(url)) {
      showRestricted(
        'Cannot Access This Page',
        'Chrome extensions cannot access internal browser pages (chrome://, edge://, about:) or the Chrome Web Store due to browser security restrictions.'
      );
      updateDomainDisplay(url);
      return;
    }

    updateDomainDisplay(url);

    // Execute script on current page
    const results = await chrome.scripting.executeScript({
      target: { tabId: currentTab.id },
      func: extractPageDataInTab
    });

    if (!results || !results[0] || !results[0].result) {
      showRestricted('Cannot Read Page Content', 'The page could not be accessed. Try refreshing the page.');
      return;
    }

    const { fullText, selectedText, title } = results[0].result;

    // Analyze full page text
    pageStats = analyzeText(fullText, title || 'Current Page');

    // Analyze selection text
    selectionStats = analyzeText(selectedText, 'Selected Text');

    // Update selection badge
    if (selectionStats.wordCount > 0) {
      selectionBadge.textContent = numFormat.format(selectionStats.wordCount);
      selectionBadge.style.display = 'inline-block';
    } else {
      selectionBadge.textContent = '0';
    }

    // Switch view to visible stats
    restrictedState.classList.add('hidden');
    statsContainer.classList.remove('hidden');

    // Render current active tab scope
    if (currentScope === 'selection') {
      renderStats(selectionStats);
      if (selectionStats.wordCount === 0) {
        noSelectionNotice.classList.remove('hidden');
      } else {
        noSelectionNotice.classList.add('hidden');
      }
    } else {
      renderStats(pageStats);
      noSelectionNotice.classList.add('hidden');
    }

  } catch (err) {
    console.error('Word Counter Error:', err);
    showRestricted(
      'Cannot Access Page',
      err.message || 'Make sure the page is completely loaded, or try refreshing the active tab.'
    );
  }
}

function isRestrictedUrl(url) {
  if (!url) return true;
  return (
    url.startsWith('chrome://') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('edge://') ||
    url.startsWith('about:') ||
    url.startsWith('view-source:') ||
    url.includes('chromewebstore.google.com') ||
    url.includes('chrome.google.com/webstore')
  );
}

function updateDomainDisplay(urlString) {
  try {
    const url = new URL(urlString);
    pageDomainEl.textContent = url.hostname.replace(/^www\./, '') || urlString;
    pageDomainEl.title = urlString;
  } catch {
    pageDomainEl.textContent = urlString || 'Unknown Page';
  }
}

function showRestricted(title, msg) {
  statsContainer.classList.add('hidden');
  restrictedState.classList.remove('hidden');
  restrictedTitle.textContent = title;
  restrictedMsg.textContent = msg;
}

function analyzeText(rawText, title = '') {
  const text = (rawText || '').trim();

  if (!text) {
    return {
      title,
      wordCount: 0,
      charCount: 0,
      charNoSpaceCount: 0,
      sentenceCount: 0,
      avgSentenceWords: '0',
      paragraphCount: 0,
      readingTime: '0 min',
      speakingTime: '0 min',
      topKeywords: []
    };
  }

  // Multi-lingual & Unicode-aware word tokenization:
  // Matches Latin/Cyrillic/Greek/Arabic/Hebrew/Devanagari words with hyphens & apostrophes,
  // or individual CJK ideographs/syllables.
  const wordsMatch = text.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]|[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu) || [];
  const wordCount = wordsMatch.length;

  // Characters
  const charCount = [...text].length;
  const charNoSpaceCount = text.replace(/\s+/gu, '').length;

  // Sentences: text segments ending with ., !, ?, or line breaks
  const sentences = (text.match(/[^.!?\n]+(?:[.!?]+|$)/g) || [])
    .map(s => s.trim())
    .filter(s => s.length > 0 && /[\p{L}\p{N}]/u.test(s));
  const sentenceCount = sentences.length;
  const avgSentenceWords = sentenceCount > 0 ? (wordCount / sentenceCount).toFixed(1) : '0';

  // Paragraphs: separated by one or more blank lines
  const paragraphs = text.split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
  const paragraphCount = paragraphs.length > 0 ? paragraphs.length : (wordCount > 0 ? 1 : 0);

  // Reading time (~200 words per minute)
  let readingTime = '0 min';
  if (wordCount > 0) {
    if (wordCount < 100) {
      const sec = Math.max(1, Math.round((wordCount / 200) * 60));
      readingTime = `~${sec} sec`;
    } else {
      const min = Math.ceil(wordCount / 200);
      readingTime = `~${min} min`;
    }
  }

  // Speaking time (~130 words per minute)
  let speakingTime = '0 min';
  if (wordCount > 0) {
    if (wordCount < 65) {
      const sec = Math.max(1, Math.round((wordCount / 130) * 60));
      speakingTime = `~${sec} sec`;
    } else {
      const min = Math.ceil(wordCount / 130);
      speakingTime = `~${min} min`;
    }
  }

  // Top Keywords Frequency (exclude stopwords, words >= 3 characters)
  const freqMap = new Map();
  for (const word of wordsMatch) {
    const lower = word.toLowerCase();
    if (lower.length >= 3 && !STOP_WORDS.has(lower) && !/^\d+$/.test(lower)) {
      freqMap.set(lower, (freqMap.get(lower) || 0) + 1);
    }
  }

  const topKeywords = Array.from(freqMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word, count]) => ({ word, count }));

  return {
    title,
    wordCount,
    charCount,
    charNoSpaceCount,
    sentenceCount,
    avgSentenceWords,
    paragraphCount,
    readingTime,
    speakingTime,
    topKeywords
  };
}

function renderStats(stats) {
  if (!stats) return;

  // Animate hero count
  animateNumber(wordCountEl, stats.wordCount);

  // Secondary counts
  charCountEl.textContent = numFormat.format(stats.charCount);
  charNoSpaceCountEl.textContent = numFormat.format(stats.charNoSpaceCount);
  sentenceCountEl.textContent = numFormat.format(stats.sentenceCount);
  avgSentenceWordsEl.textContent = stats.avgSentenceWords;
  paragraphCountEl.textContent = numFormat.format(stats.paragraphCount);
  readingTimeEl.textContent = stats.readingTime;
  speakingTimeEl.textContent = stats.speakingTime;

  // Keywords list
  renderKeywords(stats.topKeywords);
}

function renderKeywords(keywords) {
  keywordsListEl.innerHTML = '';
  if (!keywords || keywords.length === 0) {
    keywordsListEl.innerHTML = '<span class="keyword-empty">None detected</span>';
    return;
  }

  for (const item of keywords) {
    const chip = document.createElement('span');
    chip.className = 'keyword-chip';
    chip.innerHTML = `${escapeHtml(item.word)} <span class="keyword-count">${numFormat.format(item.count)}</span>`;
    keywordsListEl.appendChild(chip);
  }
}

function animateNumber(element, target) {
  if (target === 0) {
    element.textContent = '0';
    return;
  }

  const duration = 400; // ms
  const start = 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out expo
    const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
    const current = Math.floor(start + (target - start) * easeOut);

    element.textContent = numFormat.format(current);

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = numFormat.format(target);
    }
  }

  requestAnimationFrame(update);
}

async function copySummaryToClipboard() {
  const stats = currentScope === 'selection' ? selectionStats : pageStats;
  if (!stats) return;

  const scopeLabel = currentScope === 'selection' ? 'Selected Text' : 'Full Page';
  const url = currentTab && currentTab.url ? currentTab.url : 'Current Page';
  const title = currentTab && currentTab.title ? currentTab.title : 'Page';

  const keywordsStr = stats.topKeywords && stats.topKeywords.length > 0
    ? stats.topKeywords.map(k => `${k.word} (${k.count})`).join(', ')
    : 'None';

  const summary = [
    `📊 Word Counter Summary: ${title}`,
    `🔗 URL: ${url}`,
    `🎯 Scope: ${scopeLabel}`,
    `----------------------------------------`,
    `• Total Words: ${numFormat.format(stats.wordCount)}`,
    `• Characters (with spaces): ${numFormat.format(stats.charCount)}`,
    `• Characters (no spaces): ${numFormat.format(stats.charNoSpaceCount)}`,
    `• Sentences: ${numFormat.format(stats.sentenceCount)}`,
    `• Paragraphs: ${numFormat.format(stats.paragraphCount)}`,
    `• Average Words / Sentence: ${stats.avgSentenceWords}`,
    `• Estimated Reading Time: ${stats.readingTime}`,
    `• Estimated Speaking Time: ${stats.speakingTime}`,
    `• Top Keywords: ${keywordsStr}`
  ].join('\n');

  try {
    await navigator.clipboard.writeText(summary);
    showToast('Copied summary to clipboard!');
  } catch (err) {
    console.error('Clipboard copy error:', err);
    showToast('Failed to copy to clipboard');
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 2200);
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, match => {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return map[match];
  });
}

