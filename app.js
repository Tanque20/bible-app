 
// Bible data storage
let bibleData = {};
let bookIndexMap = {};

function saveLastViewed(book, chapter) {
  localStorage.setItem('lastViewedBook', book);
  localStorage.setItem('lastViewedChapter', chapter);
}

function loadLastViewed() {
  const book = localStorage.getItem('lastViewedBook') || 'matthew';
  const chapter = localStorage.getItem('lastViewedChapter') || '1';
  return { book, chapter };
}

const menuToggle = document.getElementById('menu-toggle');
const aboutModal = document.getElementById('about-modal');
const doctrineBtn = document.getElementById('notes-btn');
const doctrineModal = document.getElementById('doctrine-modal');
const bookSelectSearch = document.getElementById('book-select');
const searchBtn = document.getElementById('search-btn');
const searchModal = document.getElementById('search-modal');
const closeSearch = document.getElementById('close-search');
const executeSearch = document.getElementById('execute-search');
const searchQuery = document.getElementById('search-query');
const searchResults = document.getElementById('search-results');
const verseContainer = document.getElementById('verse-container');
const bookSelector = document.getElementById('book-selector');
const chapterSelector = document.getElementById('chapter-selector');
const currentBook = document.getElementById('current-book');
const currentChapter = document.getElementById('current-chapter');
const prevChapterBtn = document.getElementById('prev-chapter');
const nextChapterBtn = document.getElementById('next-chapter');
const copyToolbar = document.getElementById('copy-toolbar');
const copyBtn = document.getElementById('copy-btn');
const copyRef = document.getElementById('copy-ref');

const bibleBooks = [
  'genesis', 'exodus', 'leviticus', 'numbers', 'deuteronomy',
  'joshua', 'judges', 'ruth', '1samuel', '2samuel',
  '1kings', '2kings', '1chronicles', '2chronicles', 'ezra',
  'nehemiah', 'esther', 'job', 'psalms', 'proverbs',
  'ecclesiastes', 'songofsolomon', 'isaiah', 'jeremiah', 'lamentations',
  'ezekiel', 'daniel', 'hosea', 'joel', 'amos',
  'obadiah', 'jonah', 'micah', 'nahum', 'habakkuk',
  'zephaniah', 'haggai', 'zechariah', 'malachi',
  'matthew', 'mark', 'luke', 'john', 'acts',
  'romans', '1corinthians', '2corinthians', 'galatians', 'ephesians',
  'philippians', 'colossians', '1thessalonians', '2thessalonians', '1timothy',
  '2timothy', 'titus', 'philemon', 'hebrews', 'james',
  '1peter', '2peter', '1 John', '2 John', '3john',
  'jude', 'revelation'
];

async function loadIndexFile() {
  try {
    const response = await fetch("index.json");
    if (!response.ok) throw new Error("Failed to load index.json");
    bookIndexMap = await response.json();
  } catch (error) {
    console.error("Failed to load index.json:", error);
    verseContainer.innerHTML = "<p>Error loading index file.</p>";
  }
}

function getBookFilename(book) {
  return bookIndexMap[book] || `${book}.json`;
}

async function preloadAllBooks() {
  for (const book of bibleBooks) {
    if (!bibleData[book]) {
      try {
        const response = await fetch(getBookFilename(book));
        if (response.ok) {
          bibleData[book] = await response.json();
        }
      } catch (e) {
        console.warn(`Failed to preload ${book}`);
      }
    }
  }
}

// Add this to your app.js after the DOM elements are defined
const themeToggle = document.getElementById('theme-toggle');

// Initialize theme
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
themeToggle.checked = savedTheme === 'dark';

// Theme toggle event listener
if (themeToggle) {
    themeToggle.addEventListener('change', () => {
        const theme = themeToggle.checked ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    });
}

async function loadBibleData() {
  await loadIndexFile();
  const { book, chapter } = loadLastViewed();
  await loadBook(book);
  initializeApp(book, chapter);
  preloadAllBooks();
}

async function loadBook(bookName) {
  try {
    if (!bibleData[bookName]) {
      const response = await fetch(getBookFilename(bookName));
      if (!response.ok) throw new Error(`Failed to load ${bookName}`);
      bibleData[bookName] = await response.json();
    }
    return true;
  } catch (error) {
    console.error(`Error loading ${bookName}:`, error);
    return false;
  }
}

function initializeApp(book, chapter) {
  populateBookSelector();
  populateSearchBookSelect(); // ✅ ADD THIS LINE
  loadChapter(book, chapter);
  setupEventListeners();
}

function populateBookSelector() {
  bookSelector.innerHTML = bibleBooks.map(book =>
    `<option value="${book}">${capitalize(book)}</option>`).join('');
}

function populateSearchBookSelect() {
  bookSelectSearch.innerHTML = `<option value="">— Select Book —</option>` +
    bibleBooks.map(book =>
      `<option value="${book}">${capitalize(book)}</option>`
    ).join('');
}

function populateChapterSelector(book) {
  chapterSelector.innerHTML = '';
  if (bibleData[book]) {
    Object.keys(bibleData[book]).forEach(chapter => {
      const option = document.createElement('option');
      option.value = chapter;
      option.textContent = `Chapter ${chapter}`;
      chapterSelector.appendChild(option);
    });
  }
}

async function loadChapter(book, chapter) {
  if (!bibleData[book]) {
    const loaded = await loadBook(book);
    if (!loaded) {
      verseContainer.innerHTML = `<p>Could not load ${capitalize(book)}</p>`;
      return;
    }
  }
bookSelector.value = book;             // ✅ Sync book dropdown
chapterSelector.value = chapter;       // ✅ Sync chapter dropdown
  if (!bibleData[book][chapter]) {
    verseContainer.innerHTML = '<p>Chapter not available</p>';
    return;
  }

  currentBook.textContent = capitalize(book);
  currentChapter.textContent = `Chapter ${chapter}`;
  verseContainer.innerHTML = '';

  Object.entries(bibleData[book][chapter]).forEach(([verseNum, verseText]) => {
    const verseDiv = document.createElement('div');
    verseDiv.classList.add('verse');
    verseDiv.dataset.verse = verseNum;
    verseDiv.innerHTML = `<span class="verse-number">${verseNum}</span><span class="verse-text">${verseText}</span>`;
    verseDiv.addEventListener('click', () => {
      verseDiv.classList.toggle('selected');
      updateCopyToolbar(book, chapter);
    });
    verseContainer.appendChild(verseDiv);
saveLastViewed(book, chapter);
  });

  populateChapterSelector(book);
  chapterSelector.value = chapter;
}

function updateCopyToolbar(book, chapter) {
  const selectedVerses = document.querySelectorAll('.verse.selected');
  if (selectedVerses.length === 0) {
    copyToolbar.classList.add('hidden');
    return;
  }

  const verseNumbers = Array.from(selectedVerses).map(v => v.dataset.verse)
    .sort((a, b) => parseInt(a) - parseInt(b));
  const verseText = Array.from(selectedVerses).map(v =>
    `${v.dataset.verse}. ${v.querySelector('.verse-text').textContent}`
  ).join('\n');
  const refText = `${capitalize(book)} ${chapter}:${verseNumbers.join(', ')}`;

  copyRef.textContent = refText;
  copyBtn.setAttribute('data-text', `${refText}\n\n${verseText}`);
  copyToolbar.classList.remove('hidden');
}

function setupEventListeners() {
  bookSelector.addEventListener('change', async () => {
    const book = bookSelector.value;
    if (!bibleData[book]) await loadBook(book);
    populateChapterSelector(book);
    if (chapterSelector.options.length > 0) {
      loadChapter(book, chapterSelector.value);
    }
  });

document.querySelectorAll('.jump-link').forEach(link => {
  link.addEventListener('click', async (e) => {
    e.preventDefault();
    const book = link.dataset.book;
    const chapter = link.dataset.chapter;
    const verse = link.dataset.verse;

    bookSelector.value = book;
    chapterSelector.value = chapter;
    await loadChapter(book, chapter);

    // Highlight verse
    setTimeout(() => {
      const verseEl = document.querySelector(`.verse[data-verse="${verse}"]`);
      if (verseEl) {
        verseEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        verseEl.classList.add('highlighted');
        setTimeout(() => verseEl.classList.remove('highlighted'), 1500);
      }
    }, 100);

    // Close any open modal
    const openModals = document.querySelectorAll('.modal.open');
    openModals.forEach(modal => modal.classList.remove('open'));
  });
});

if (menuToggle && aboutModal) {
  menuToggle.addEventListener('click', () => {
    aboutModal.classList.add('open');
  });
}

if (doctrineBtn && doctrineModal) {
  doctrineBtn.addEventListener('click', () => {
    doctrineModal.classList.add('open');
  });
}
  chapterSelector.addEventListener('change', () => {
    loadChapter(bookSelector.value, chapterSelector.value);
  });

  prevChapterBtn.addEventListener('click', () => {
    const current = parseInt(chapterSelector.value);
    if (current > 1) chapterSelector.value = current - 1;
    chapterSelector.dispatchEvent(new Event('change'));
  });

  nextChapterBtn.addEventListener('click', () => {
    const current = parseInt(chapterSelector.value);
    const max = chapterSelector.options.length;
    if (current < max) chapterSelector.value = current + 1;
    chapterSelector.dispatchEvent(new Event('change'));
  });

  searchBtn.addEventListener('click', () => searchModal.classList.add('open'));
  closeSearch.addEventListener('click', () => searchModal.classList.remove('open'));
  searchModal.addEventListener('click', (e) => {
    if (e.target === searchModal) searchModal.classList.remove('open');
  });

  executeSearch.addEventListener('click', performSearch);
  searchQuery.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
  });

  copyBtn.addEventListener('click', handleCopy);
}

async function handleCopy() {
  const textToCopy = copyBtn.getAttribute('data-text');
  if (!textToCopy) {
    showAlert('No verses selected.');
    return;
  }

  const textWithCredit = `${textToCopy}\n\n— RSB VERSION BY TANQUE JERRY —`;
  try {
    await navigator.clipboard.writeText(textWithCredit);
    showCopySuccess();
  } catch (err) {
    if (legacyCopy(textWithCredit)) {
      showCopySuccess();
    } else {
      showAlert('Copy failed. Please manually copy the text.');
    }
  }
}

function legacyCopy(text) {
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch (err) {
    return false;
  }
}

function showCopySuccess() {
  const originalHTML = copyBtn.innerHTML;
  copyBtn.innerHTML = '<span class="copy-label">✅ Copied!</span>';
  copyBtn.disabled = true;

  // ✅ Remove selected class after feedback delay
  setTimeout(() => {
    copyBtn.innerHTML = originalHTML;
    copyBtn.disabled = false;

    // 🔴 UNSELECT all selected verses
    document.querySelectorAll('.verse.selected').forEach(v => v.classList.remove('selected'));

    // 🔴 Hide the copy toolbar
    copyToolbar.classList.add('hidden');
  }, 1500);
}

function showAlert(message) {
  alert(message);
}

// SEARCH ENGINE
function performSearch() {
    const query = searchQuery.value.trim().toLowerCase();
    if (!query) {
        searchResults.innerHTML = '<div class="search-result">Please enter search terms</div>';
        return;
    }

    const searchType = document.querySelector('input[name="search-type"]:checked').value;
    const scope = document.querySelector('input[name="search-scope"]:checked').value;
    const book = document.getElementById('book-select').value;

    let results = [];
    const searchTerms = query.toLowerCase(); // Always case-insensitive
    const terms = searchType === 'phrase' ? [searchTerms] : searchTerms.split(' ');

    for (const [bookName, chapters] of Object.entries(bibleData)) {
        if (scope === 'ot' && !isOldTestament(bookName)) continue;
        if (scope === 'nt' && isOldTestament(bookName)) continue;
        if (book && book !== bookName) continue;

        for (const [chapter, verses] of Object.entries(chapters)) {
            for (const [verseNum, verseText] of Object.entries(verses)) {
                const textToSearch = verseText.toLowerCase(); // Always convert to lowercase
                let match = false;

                if (searchType === 'phrase') {
                    match = textToSearch.includes(terms[0]); // Always partial match for phrases
                } else if (searchType === 'all') {
                    match = terms.every(term => textToSearch.includes(term)); // Always partial match
                } else {
                    match = terms.some(term => textToSearch.includes(term)); // Always partial match
                }

                if (match) {
                    results.push({
                        book: bookName,
                        chapter,
                        verse: verseNum,
                        text: verseText
                    });
                }
            }
        }
    }

    displayResults(results);
}

function isOldTestament(book) {
  return bibleBooks.indexOf(book) < 39;
}

function displayResults(results) {
  if (results.length === 0) {
    searchResults.innerHTML = '<div class="search-result">No verses found</div>';
    return;
  }

  searchResults.innerHTML = results.map(result =>
    `<div class="search-result" data-book="${result.book}" data-chapter="${result.chapter}" data-verse="${result.verse}">
      <div class="reference">${capitalize(result.book)} ${result.chapter}:${result.verse}</div>
      <div class="text">${highlightSearchTerms(result.text)}</div>
    </div>`
  ).join('');

  document.querySelectorAll('.search-result').forEach(resultEl => {
    resultEl.addEventListener('click', async () => {
      const book = resultEl.dataset.book;
      const chapter = resultEl.dataset.chapter;
      const verse = resultEl.dataset.verse;
      bookSelector.value = book;
      await loadChapter(book, chapter);
      chapterSelector.value = chapter;
      searchModal.classList.remove('open');
      setTimeout(() => {
        const verseEl = document.querySelector(`.verse[data-verse="${verse}"]`);
        if (verseEl) {
          verseEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          verseEl.classList.add('highlighted');
          setTimeout(() => verseEl.classList.remove('highlighted'), 1500);
        }
      }, 100);
    });
  });
}

function highlightSearchTerms(text) {
  const query = searchQuery.value.trim();
  if (!query) return text;
  const regex = new RegExp(query, 'gi');
  return text.replace(regex, match => `<span class="highlight">${match}</span>`);
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Start app
loadBibleData();