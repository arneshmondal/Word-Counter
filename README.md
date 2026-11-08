# Page Word Counter - Chrome Extension (Manifest V3)

A fast, lightweight, and privacy-focused Google Chrome extension that instantly counts words, characters, sentences, paragraphs, reading time, and keyword frequency on any webpage or highlighted selection.

---

## ✨ Features

- ⚡ **Instant Word Counting**: Counts words accurately on any webpage with a single click or keyboard shortcut.
- 🎯 **Dual Modes (Full Page vs Selection)**:
  - **Full Page**: Analyzes all readable, rendered text on the current webpage (excluding invisible scripts, hidden CSS, and navigation boilerplate).
  - **Selected Text**: Automatically detects and analyzes text highlighted with your mouse/cursor or within text inputs.
- 📊 **Comprehensive Metrics**:
  - **Total Words**
  - **Characters (with spaces)**
  - **Characters (without spaces)**
  - **Sentences** & **Average Words per Sentence**
  - **Paragraphs**
  - **Estimated Reading Time** (~200 wpm)
  - **Estimated Speaking Time** (~130 wpm)
  - **Top 5 Keywords & Frequency** (smart stopword filtering)
- 📋 **One-Click Copy**: Copies a clean, formatted statistical summary to your clipboard.
- ⌨️ **Keyboard Shortcut**: Press `Alt + Shift + W` (or `Cmd + Shift + W` on macOS) to instantly pop open the counter.
- 🎨 **Modern & Polished UI**: Clean card layout, smooth number animations, responsive light/dark mode support.
- 🔒 **100% Private & Offline**: Works entirely within your browser using `activeTab` permissions. No tracking, analytics, or external server calls.

---

## 🚀 How to Install and Use in Chrome

### Step 1: Open Chrome Extensions
1. In Google Chrome, navigate to `chrome://extensions/` (or click the three dots menu in the top right → **Extensions** → **Manage Extensions**).
iigigig
### Step 2: Enable Developer Mode
1. In the top-right corner of the Extensions page, toggle the **Developer mode** switch to **ON**.

### Step 3: Load the Extension
1. Click the **Load unpacked** button in the top-left toolbar.
2. Browse to and select this folder:
   ```
   c:\backup\Development\Project Android App
   ```
3. Click **Select Folder**.

### Step 4: Pin and Use
1. Click the **Extensions puzzle icon** (🧩) in your Chrome toolbar.
2. Find **Page Word Counter** and click the **Pin** icon (📌) to keep it visible.
3. Open any website (e.g. Wikipedia, a blog, or news article) and click the Word Counter icon or press `Alt + Shift + W`.

---

## 📁 File Structure

```
.
├── manifest.json       # Chrome Manifest V3 configuration & permissions
├── popup.html          # Extension popup UI structure
├── popup.css           # Styling with light/dark theme support & animations
├── popup.js            # Text analysis engine, DOM extraction, and clipboard logic
├── icons/              # Extension icons (16px, 32px, 48px, 128px)
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md           # Documentation and installation instructions
```

---

## 🧠 How Word Counting Works

- **Layout-Aware Extraction**: Uses `document.body.innerText` to extract visible text, automatically bypassing `<script>`, `<style>`, `<noscript>`, and elements styled with `display: none`.
- **Unicode-Compliant Tokenization**: Uses Unicode property escapes (`\p{L}`, `\p{N}`, `\p{Script=Han}`, etc.) to accurately tokenize multilingual words, contractions (e.g., *don't*), hyphenated phrases (e.g., *state-of-the-art*), and East Asian scripts (Chinese, Japanese, Korean).
- **Graceful Error Handling**: Automatically detects browser-restricted URLs (like `chrome://` and the Chrome Web Store) and provides clear user guidance.


