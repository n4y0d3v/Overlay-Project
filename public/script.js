const socket = io();
let overlayId = null;
const overlayTypes = ['bible', 'lyrics', 'presenter', 'ticker', 'image'];
const overlayStates = {
  bible: false,
  lyrics: false,
  presenter: false,
  ticker: false,
  image: false
};
const overlayElements = {};
let songs = [];
let currentSongIndex = -1;
let tempSong = { title: '', segments: [], activeSegmentIndex: 0 };

function openLyricsModal() {
  const modal = document.getElementById('lyricsModal');
  const backdrop = document.getElementById('modalBackdrop');
  const songTitleInput = document.getElementById('modalSongTitle');

  if (currentSongIndex >= 0 && songs[currentSongIndex]) {
    tempSong = JSON.parse(JSON.stringify(songs[currentSongIndex]));
    songTitleInput.value = tempSong.title;
  } else {
    tempSong = { title: '', segments: [{ type: 'Verse', content: '' }], activeSegmentIndex: 0 };
    songTitleInput.value = '';
  }

  renderSegments();
  modal.style.display = 'block';
  backdrop.style.display = 'block';
}

function closeLyricsModal(apply) {
  const modal = document.getElementById('lyricsModal');
  const backdrop = document.getElementById('modalBackdrop');
  modal.style.display = 'none';
  backdrop.style.display = 'none';

  if (apply) {
    tempSong.title = document.getElementById('modalSongTitle').value.trim();
    if (!tempSong.title) {
      alert('Please enter a song title.');
      return;
    }

    const existingSongIndex = songs.findIndex(s => s.title === tempSong.title);
    if (existingSongIndex >= 0) {
      if (confirm(`A song titled "${tempSong.title}" already exists. Overwrite it?`)) {
        songs[existingSongIndex] = tempSong;
        currentSongIndex = existingSongIndex;
      }
    } else {
      songs.push(tempSong);
      currentSongIndex = songs.length - 1;
    }

    updateSongDropdown();
    selectSong(tempSong.title);
  }
}

function addSegment() {
  tempSong.segments.push({ type: 'Verse', content: '' });
  renderSegments();
}

function newSong() {
  tempSong = { title: '', segments: [{ type: 'Verse', content: '' }], activeSegmentIndex: 0 };
  document.getElementById('modalSongTitle').value = '';
  currentSongIndex = -1;
  renderSegments();
}

function removeSegment(index) {
  tempSong.segments.splice(index, 1);
  if (tempSong.activeSegmentIndex >= tempSong.segments.length) {
    tempSong.activeSegmentIndex = tempSong.segments.length - 1;
  }
  renderSegments();
  updateOverlay('lyrics');
}

function renderSegments() {
  const segmentList = document.getElementById('segmentList');
  segmentList.innerHTML = '';
  tempSong.segments.forEach((segment, index) => {
    const segmentItem = document.createElement('div');
    segmentItem.className = 'segment-item';
    segmentItem.innerHTML = `
      <div class="segment-header">
        <select onchange="updateSegmentType(${index}, this.value)">
          <option value="Verse" ${segment.type === 'Verse' ? 'selected' : ''}>Verse</option>
          <option value="Chorus" ${segment.type === 'Chorus' ? 'selected' : ''}>Chorus</option>
        </select>
        <button onclick="removeSegment(${index})"><i class="fas fa-trash"></i></button>
      </div>
      <textarea class="large-text" rows="3" maxlength="500" oninput="updateSegmentContent(${index}, this.value)">${segment.content}</textarea>
    `;
    if (index === tempSong.activeSegmentIndex) {
      segmentItem.style.background = '#e0f0ff';
    }
    segmentList.appendChild(segmentItem);
  });
}

function updateSegmentType(index, type) {
  tempSong.segments[index].type = type;
}

function updateSegmentContent(index, content) {
  tempSong.segments[index].content = content;
  if (index === tempSong.activeSegmentIndex) {
    updateOverlay('lyrics');
  }
}

function setActiveSegment(index) {
  if (index >= 0 && index < tempSong.segments.length) {
    tempSong.activeSegmentIndex = index;
    if (currentSongIndex >= 0 && songs[currentSongIndex] && songs[currentSongIndex].title === tempSong.title) {
      songs[currentSongIndex].activeSegmentIndex = index;
    }
    document.getElementById('lyricsText').value = tempSong.segments[index].content;
    updateOverlay('lyrics');
    renderSegments();
  }
}

function nextSegment() {
  if (tempSong.activeSegmentIndex < tempSong.segments.length - 1) {
    setActiveSegment(tempSong.activeSegmentIndex + 1);
  }
}

function prevSegment() {
  if (tempSong.activeSegmentIndex > 0) {
    setActiveSegment(tempSong.activeSegmentIndex - 1);
  }
}

function nextSegmentControl() {
  if (currentSongIndex >= 0 && songs[currentSongIndex]) {
    const song = songs[currentSongIndex];
    if (song.activeSegmentIndex < song.segments.length - 1) {
      song.activeSegmentIndex++;
      document.getElementById('lyricsText').value = song.segments[song.activeSegmentIndex].content;
      updateOverlay('lyrics');
    }
  }
}

function prevSegmentControl() {
  if (currentSongIndex >= 0 && songs[currentSongIndex]) {
    const song = songs[currentSongIndex];
    if (song.activeSegmentIndex > 0) {
      song.activeSegmentIndex--;
      document.getElementById('lyricsText').value = song.segments[song.activeSegmentIndex].content;
      updateOverlay('lyrics');
    }
  }
}

function updateSongDropdown() {
  const dropdown = document.getElementById('lyricsTitle');
  dropdown.innerHTML = '<option value="">Select a Song</option>';
  songs.forEach(song => {
    const option = document.createElement('option');
    option.value = song.title;
    option.textContent = song.title;
    if (currentSongIndex >= 0 && song.title === songs[currentSongIndex].title) {
      option.selected = true;
    }
    dropdown.appendChild(option);
  });
}

function selectSong(title) {
  currentSongIndex = songs.findIndex(s => s.title === title);
  if (currentSongIndex >= 0) {
    const song = songs[currentSongIndex];
    document.getElementById('lyricsText').value = song.segments[song.activeSegmentIndex]?.content || '';
    tempSong = JSON.parse(JSON.stringify(song));
    updateOverlay('lyrics');
  } else {
    document.getElementById('lyricsText').value = '';
    tempSong = { title: '', segments: [{ type: 'Verse', content: '' }], activeSegmentIndex: 0 };
    updateOverlay('lyrics');
  }
}

async function fetchBibleText(input) {
  try {
    const cleanedInput = input.replace(/\s+/g, ' ').trim().toLowerCase();
    const rangeMatch = cleanedInput.match(/([a-zA-Z\s]+)\s*(\d+:\d+)(?:\s*[-–]\s*(\d+:\d+))?/);
    const singleMatch = cleanedInput.match(/([a-zA-Z\s]+)\s*(\d+:\d+)/);

    if (!singleMatch) {
      return { text: input, ref: input };
    }

    let book = singleMatch[1].trim();
    let startVerse = singleMatch[2];
    let endVerse = rangeMatch && rangeMatch[3] ? rangeMatch[3] : null;

    book = bookMap[book] || bookMap[book.replace(/\s/g, '')] || 'JHN';
    const startRef = `${book}.${startVerse}`;
    const apiRef = endVerse ? `${startRef}-${book}.${endVerse}` : startRef;

    const response = await fetch(`https://api.scripture.api.bible/v1/bibles/${BIBLE_ID}/passages/${apiRef}?content-type=text`, {
      headers: { 'api-key': API_KEY }
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    const text = data.data.content.replace(/\n/g, ' ').trim();
    const ref = data.data.reference;
    document.getElementById('bibleContent').value = text;
    return { text, ref };
  } catch (error) {
    console.error('Error fetching Bible text:', error);
    document.getElementById('bibleContent').value = `Error: Invalid reference (${input})`;
    return { text: `Error: Invalid reference (${input})`, ref: input };
  }
}

function fetchBibleVerse() {
  const reference = document.getElementById('bibleReference').value;
  fetchBibleText(reference).then(bibleData => {
    updateOverlay('bible');
  });
}

function updateOverlay(type) {
  overlayId = overlayId || Math.random().toString(36).substring(2, 7);
  const data = { id: overlayId, type };

  if (type === 'image') {
    const file = document.getElementById('imageInput').files[0];
    if (file && file.type === 'image/png') {
      const reader = new FileReader();
      reader.onload = () => {
        data.image = reader.result;
        socket.emit('customize', data);
        if (overlayStates[type]) renderOverlay(data);
      };
      reader.readAsDataURL(file);
    }
  } else {
    if (type === 'bible') {
      data.ref = document.getElementById('bibleReference').value;
      data.text = document.getElementById('bibleContent').value;
      data.refFontSize = document.getElementById('bibleRefFontSize').value + 'px';
      data.textFontSize = document.getElementById('bibleTextFontSize').value + 'px';
      data.refFontColor = document.getElementById('bibleRefFontColor').value;
      data.textFontColor = document.getElementById('bibleTextFontColor').value;
      data.refBgColor = document.getElementById('bibleRefBgTransparent').checked ? 'transparent' : document.getElementById('bibleRefBgColor').value;
      data.textBgColor = document.getElementById('bibleTextBgTransparent').checked ? 'transparent' : document.getElementById('bibleTextBgColor').value;
    } else if (type === 'lyrics') {
      const selectedSongTitle = document.getElementById('lyricsTitle').value;
      const song = songs.find(s => s.title === selectedSongTitle);
      data.title = selectedSongTitle;
      data.text = song && song.segments[song.activeSegmentIndex] ? song.segments[song.activeSegmentIndex].content : '';
      data.titleFontSize = document.getElementById('lyricsTitleFontSize').value + 'px';
      data.textFontSize = document.getElementById('lyricsTextFontSize').value + 'px';
      data.titleFontColor = document.getElementById('lyricsTitleFontColor').value;
      data.textFontColor = document.getElementById('lyricsTextFontColor').value;
      data.titleBgColor = document.getElementById('lyricsTitleBgTransparent').checked ? 'transparent' : document.getElementById('lyricsTitleBgColor').value;
      data.textBgColor = document.getElementById('lyricsTextBgTransparent').checked ? 'transparent' : document.getElementById('lyricsTextBgColor').value;
    } else if (type === 'presenter') {
      data.title = document.getElementById('presenterTitle').value;
      data.text = document.getElementById('presenterText').value;
      data.titleFontSize = document.getElementById('presenterTitleFontSize').value + 'px';
      data.textFontSize = document.getElementById('presenterTextFontSize').value + 'px';
      data.titleFontColor = document.getElementById('presenterTitleFontColor').value;
      data.textFontColor = document.getElementById('presenterTextFontColor').value;
      data.titleBgColor = document.getElementById('presenterTitleBgTransparent').checked ? 'transparent' : document.getElementById('presenterTitleBgColor').value;
      data.textBgColor = document.getElementById('presenterTextBgTransparent').checked ? 'transparent' : document.getElementById('presenterTextBgColor').value;
    } else if (type === 'ticker') {
      data.title = document.getElementById('tickerTitle').value;
      data.text = document.getElementById('tickerText').value;
      data.titleFontSize = document.getElementById('tickerTitleFontSize').value + 'px';
      data.textFontSize = document.getElementById('tickerTextFontSize').value + 'px';
      data.titleFontColor = document.getElementById('tickerTitleFontColor').value;
      data.textFontColor = document.getElementById('tickerTextFontColor').value;
      data.titleBgColor = document.getElementById('tickerTitleBgTransparent').checked ? 'transparent' : document.getElementById('tickerTitleBgColor').value;
      data.textBgColor = document.getElementById('tickerTextBgTransparent').checked ? 'transparent' : document.getElementById('tickerTextBgColor').value;
      data.titleBlink = document.getElementById('tickerTitleBlink').checked;
      data.scrollSpeed = parseInt(document.getElementById('tickerScrollSpeed').value, 10);
    }
    socket.emit('customize', data);
    if (overlayStates[type]) renderOverlay(data);
  }
}

function renderOverlay(data) {
  const outputCanvas = document.getElementById('outputCanvas');
  let overlay = overlayElements[data.type];
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = `overlay-${data.type}`;
    overlay.className = 'overlay';
    overlayElements[data.type] = overlay;
    outputCanvas.appendChild(overlay);
    if (data.type !== 'ticker') {
      makeDraggable(overlay, data.type);
    }
  }

  if (data.type === 'bible') {
    if (!overlay.style.top && !overlay.style.left) {
      overlay.style.width = '90%';
      overlay.style.left = '50%';
      overlay.style.transform = 'translateX(-50%)';
      overlay.style.bottom = '120px';
    }
    overlay.innerHTML = `
      <div class="bible-lower-third">
        <div class="bible-reference" style="color: ${data.refFontColor}; font-size: ${data.refFontSize}; background: ${data.refBgColor}">${data.ref}</div>
        <div class="bible-text" style="color: ${data.textFontColor}; font-size: ${data.textFontSize}; background: ${data.textBgColor}">${data.text}</div>
      </div>
    `;
  } else if (data.type === 'lyrics') {
    if (!overlay.style.top && !overlay.style.left) {
      overlay.style.width = '90%';
      overlay.style.left = '50%';
      overlay.style.transform = 'translateX(-50%)';
      overlay.style.bottom = '120px';
    }
    overlay.innerHTML = `
      <div class="bible-lower-third">
        <div class="bible-reference" style="color: ${data.titleFontColor}; font-size: ${data.titleFontSize}; background: ${data.titleBgColor}">${data.title}</div>
        <div class="bible-text" style="color: ${data.textFontColor}; font-size: ${data.textFontSize}; background: ${data.textBgColor}">${data.text}</div>
      </div>
    `;
  } else if (data.type === 'presenter') {
    if (!overlay.style.top && !overlay.style.left) {
      overlay.style.width = '90%';
      overlay.style.left = '50%';
      overlay.style.transform = 'translateX(-50%)';
      overlay.style.bottom = '120px';
    }
    overlay.innerHTML = `
      <div class="bible-lower-third">
        <div class="bible-reference" style="color: ${data.titleFontColor}; font-size: ${data.titleFontSize}; background: ${data.titleBgColor}">${data.title}</div>
        <div class="bible-text" style="color: ${data.textFontColor}; font-size: ${data.textFontSize}; background: ${data.textBgColor}">${data.text}</div>
      </div>
    `;
  } else if (data.type === 'ticker') {
    overlay.style.bottom = '5px';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    const fontSizePx = parseInt(data.textFontSize, 10);
    const tickerHeight = fontSizePx + 8;
    overlay.style.height = `${tickerHeight}px`;
    overlay.style.overflow = 'hidden';
    overlay.style.display = 'flex';

    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.whiteSpace = 'nowrap';
    tempDiv.style.fontSize = data.textFontSize;
    tempDiv.textContent = data.text + ' • ';
    document.body.appendChild(tempDiv);
    const textWidth = tempDiv.offsetWidth;
    document.body.removeChild(tempDiv);

    const contentContainerWidth = outputCanvas.offsetWidth * 0.85;
    const minRepetitions = Math.ceil((contentContainerWidth * 2) / textWidth);
    const repeatedText = (data.text + ' • ').repeat(Math.max(minRepetitions, 2));

    const tempDivRepeated = document.createElement('div');
    tempDivRepeated.style.position = 'absolute';
    tempDivRepeated.style.visibility = 'hidden';
    tempDivRepeated.style.whiteSpace = 'nowrap';
    tempDivRepeated.style.fontSize = data.textFontSize;
    tempDivRepeated.textContent = repeatedText;
    document.body.appendChild(tempDivRepeated);
    const repeatedTextWidth = tempDivRepeated.offsetWidth;
    document.body.removeChild(tempDivRepeated);

    const scrollSpeedPxPerSec = data.scrollSpeed;
    const animationDuration = repeatedTextWidth / scrollSpeedPxPerSec;

    overlay.innerHTML = `
      <div style="width: 15%; height: 100%; background: ${data.titleBgColor}; font-size: ${data.titleFontSize}; padding: 2px 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
        <span style="color: ${data.titleFontColor}; ${data.titleBlink ? 'animation: blink 1s step-end infinite;' : ''}">
          ${data.title}
        </span>
      </div>
      <div style="width: 85%; height: 100%; background: ${data.textBgColor}; position: relative; overflow: hidden;">
        <div id="tickerContent-${data.id}" style="color: ${data.textFontColor}; font-size: ${data.textFontSize}; white-space: nowrap; animation: scroll ${animationDuration}s linear infinite; padding: 2px 10px; display: inline-block; position: absolute; top: 0; left: 0;">
          ${repeatedText}
        </div>
      </div>
    `;
    overlay.innerHTML += `
      <style>
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-${repeatedTextWidth}px); }
        }
        @keyframes blink {
          50% { opacity: 0; }
        }
      </style>
    `;
  } else if (data.type === 'image') {
    overlay.style.left = '20px';
    overlay.style.top = '20px';
    overlay.innerHTML = `<img src="${data.image}" style="width: 200px; height: 200px;">`;
  }
}

function toggleOverlay(type) {
  const toggleSwitch = document.getElementById(`toggle${type.charAt(0).toUpperCase() + type.slice(1)}`);
  overlayStates[type] = toggleSwitch.checked;
  if (overlayStates[type]) {
    updateOverlay(type);
  } else {
    const overlay = overlayElements[type];
    if (overlay) {
      overlay.remove();
      delete overlayElements[type];
    }
  }
  updateMainToggleState();
}

function toggleAllOverlays() {
  const allVisible = Object.values(overlayStates).every(state => state);
  overlayTypes.forEach(type => {
    overlayStates[type] = !allVisible;
    const toggleSwitch = document.getElementById(`toggle${type.charAt(0).toUpperCase() + type.slice(1)}`);
    toggleSwitch.checked = overlayStates[type];
    if (overlayStates[type]) {
      updateOverlay(type);
    } else {
      const overlay = overlayElements[type];
      if (overlay) {
        overlay.remove();
        delete overlayElements[type];
      }
    }
  });
  updateMainToggleState();
}

function updateMainToggleState() {
  const allVisible = Object.values(overlayStates).every(state => state);
  const mainToggleSwitch = document.getElementById('mainToggleOverlays');
  mainToggleSwitch.checked = allVisible;
}

function copyOverlayUrl() {
  if (!overlayId) return;
  const url = `${window.location.origin}/overlay/${overlayId}`;
  navigator.clipboard.writeText(url).then(() => {
    alert('Overlay URL copied to clipboard!');
  }).catch(err => {
    console.error('Failed to copy URL:', err);
  });
}

function resetOverlay(type) {
  if (type === 'bible') {
    document.getElementById('bibleReference').value = 'John 3:16';
    document.getElementById('bibleContent').value = 'For God so loved the world...';
    document.getElementById('bibleRefFontSize').value = '12';
    document.getElementById('bibleTextFontSize').value = '12';
    document.getElementById('bibleRefFontColor').value = '#ffffff';
    document.getElementById('bibleTextFontColor').value = '#ffffff';
    document.getElementById('bibleRefBgColor').value = '#28a745';
    document.getElementById('bibleTextBgColor').value = '#007bff';
    document.getElementById('bibleRefBgTransparent').checked = false;
    document.getElementById('bibleTextBgTransparent').checked = false;
  } else if (type === 'lyrics') {
    songs = [];
    currentSongIndex = -1;
    updateSongDropdown();
    document.getElementById('lyricsText').value = '';
    document.getElementById('lyricsTitleFontSize').value = '12';
    document.getElementById('lyricsTextFontSize').value = '12';
    document.getElementById('lyricsTitleFontColor').value = '#ffffff';
    document.getElementById('lyricsTextFontColor').value = '#ffffff';
    document.getElementById('lyricsTitleBgColor').value = '#28a745';
    document.getElementById('lyricsTextBgColor').value = '#007bff';
    document.getElementById('lyricsTitleBgTransparent').checked = false;
    document.getElementById('lyricsTextBgTransparent').checked = false;
  } else if (type === 'presenter') {
    document.getElementById('presenterTitle').value = 'Pastor';
    document.getElementById('presenterText').value = 'John Doe';
    document.getElementById('presenterTitleFontSize').value = '12';
    document.getElementById('presenterTextFontSize').value = '12';
    document.getElementById('presenterTitleFontColor').value = '#ffffff';
    document.getElementById('presenterTextFontColor').value = '#ffffff';
    document.getElementById('presenterTitleBgColor').value = '#28a745';
    document.getElementById('presenterTextBgColor').value = '#007bff';
    document.getElementById('presenterTitleBgTransparent').checked = false;
    document.getElementById('presenterTextBgTransparent').checked = false;
  } else if (type === 'ticker') {
    document.getElementById('tickerTitle').value = 'News';
    document.getElementById('tickerText').value = 'Breaking News';
    document.getElementById('tickerTitleFontSize').value = '14';
    document.getElementById('tickerTextFontSize').value = '14';
    document.getElementById('tickerTitleFontColor').value = '#000000';
    document.getElementById('tickerTextFontColor').value = '#ffffff';
    document.getElementById('tickerTitleBgColor').value = '#ffffff';
    document.getElementById('tickerTextBgColor').value = '#ff0000';
    document.getElementById('tickerTitleBgTransparent').checked = false;
    document.getElementById('tickerTextBgTransparent').checked = false;
    document.getElementById('tickerScrollSpeed').value = '50';
    document.getElementById('tickerTitleBlink').checked = false;
  } else if (type === 'image') {
    document.getElementById('imageInput').value = '';
  }
  if (overlayStates[type]) updateOverlay(type);
}

const resizeHandle = document.getElementById('resizeHandle');
const controlsContainer = document.getElementById('controlsContainer');
const preview = document.getElementById('preview');
let isResizing = false;
let initialX, initialControlsWidth;

resizeHandle.addEventListener('mousedown', (e) => {
  isResizing = true;
  initialX = e.clientX;
  initialControlsWidth = controlsContainer.offsetWidth;
});

document.addEventListener('mousemove', (e) => {
  if (isResizing) {
    e.preventDefault();
    const deltaX = e.clientX - initialX;
    const newControlsWidth = initialControlsWidth + deltaX;

    const containerWidth = window.innerWidth - 32;
    const minWidth = 200;
    const maxControlsWidth = containerWidth - minWidth - 8;

    controlsContainer.style.width = `${Math.max(minWidth, Math.min(newControlsWidth, maxControlsWidth))}px`;
    preview.style.width = `${containerWidth - controlsContainer.offsetWidth - 8}px`;
  }
});

document.addEventListener('mouseup', () => {
  isResizing = false;
});

function toggleDarkMode() {
  const isDark = document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
}

if (localStorage.getItem('darkMode') === 'enabled') {
  document.body.classList.add('dark-mode');
}

document.addEventListener('DOMContentLoaded', () => {
  overlayTypes.forEach(type => {
    if (type === 'ticker') {
      document.getElementById('tickerTitle').addEventListener('input', () => updateOverlay(type));
      document.getElementById('tickerText').addEventListener('input', () => updateOverlay(type));
      document.getElementById('tickerTitleFontColor').addEventListener('input', () => updateOverlay(type));
      document.getElementById('tickerTextFontColor').addEventListener('input', () => updateOverlay(type));
      document.getElementById('tickerScrollSpeed').addEventListener('input', () => updateOverlay(type));
      document.getElementById('tickerTitleBlink').addEventListener('change', () => updateOverlay(type));
    } else if (type === 'bible') {
      document.getElementById('bibleReference').addEventListener('input', () => updateOverlay(type));
      document.getElementById('bibleContent').addEventListener('input', () => updateOverlay(type));
      document.getElementById('bibleRefFontSize').addEventListener('input', () => updateOverlay(type));
      document.getElementById('bibleTextFontSize').addEventListener('input', () => updateOverlay(type));
      document.getElementById('bibleRefFontColor').addEventListener('input', () => updateOverlay(type));
      document.getElementById('bibleTextFontColor').addEventListener('input', () => updateOverlay(type));
    } else if (type === 'lyrics') {
      document.getElementById('lyricsTitleFontSize').addEventListener('input', () => updateOverlay(type));
      document.getElementById('lyricsTextFontSize').addEventListener('input', () => updateOverlay(type));
      document.getElementById('lyricsTitleFontColor').addEventListener('input', () => updateOverlay(type));
      document.getElementById('lyricsTextFontColor').addEventListener('input', () => updateOverlay(type));
    } else if (type === 'presenter') {
      document.getElementById('presenterTitle').addEventListener('input', () => updateOverlay(type));
      document.getElementById('presenterText').addEventListener('input', () => updateOverlay(type));
      document.getElementById('presenterTitleFontSize').addEventListener('input', () => updateOverlay(type));
      document.getElementById('presenterTextFontSize').addEventListener('input', () => updateOverlay(type));
      document.getElementById('presenterTitleFontColor').addEventListener('input', () => updateOverlay(type));
      document.getElementById('presenterTextFontColor').addEventListener('input', () => updateOverlay(type));
    } else if (type === 'image') {
      document.getElementById('imageInput').addEventListener('change', () => updateOverlay(type));
    }
    if (type !== 'image') {
      document.getElementById(`${type}TitleBgColor`)?.addEventListener('input', () => updateOverlay(type));
      document.getElementById(`${type}TextBgColor`)?.addEventListener('input', () => updateOverlay(type));
      document.getElementById(`${type}TitleBgTransparent`)?.addEventListener('change', () => updateOverlay(type));
      document.getElementById(`${type}TextBgTransparent`)?.addEventListener('change', () => updateOverlay(type));
    }
  });

  overlayTypes.forEach(type => resetOverlay(type));

  tippy('.control-group[data-tippy-content]', {
    theme: 'light',
    placement: 'top',
    arrow: true,
  });
});

function makeDraggable(element, type) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  let isDragging = false;
  let initialTransform = '';
  let initialLeft = '';
  let initialBottom = '';
  let initialTop = '';

  element.addEventListener('mousedown', dragMouseDown);

  function dragMouseDown(e) {
    if (e.target === element || element.contains(e.target)) {
      e.preventDefault();
      isDragging = true;

      if (type === 'bible' || type === 'lyrics' || type === 'presenter') {
        initialTransform = element.style.transform;
        initialLeft = element.style.left;
        initialBottom = element.style.bottom;
        initialTop = element.style.top;

        if (initialLeft.includes('%')) {
          const canvas = document.getElementById('outputCanvas');
          const canvasWidth = canvas.offsetWidth;
          const elementWidth = element.offsetWidth;
          const leftPercentage = parseFloat(initialLeft);
          initialLeft = `${(canvasWidth * leftPercentage / 100) - (elementWidth / 2)}px`;
        }

        element.style.transform = 'none';
        element.style.left = initialLeft;
        element.style.bottom = 'auto';
        element.style.top = initialTop || `${element.offsetTop}px`;
      }

      pos3 = e.clientX;
      pos4 = e.clientY;

      document.addEventListener('mouseup', closeDragElement);
      document.addEventListener('mousemove', elementDrag);

      element.classList.add('dragging');
      element.style.pointerEvents = 'none';
    }
  }

  function elementDrag(e) {
    if (!isDragging) return;

    e.preventDefault();

    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;

    const currentTop = element.offsetTop;
    const currentLeft = element.offsetLeft;

    const newTop = currentTop - pos2;
    const newLeft = currentLeft - pos1;

    const canvas = document.getElementById('outputCanvas');
    const canvasRect = canvas.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    const maxTop = canvasRect.height - elementRect.height;
    const maxLeft = canvasRect.width - elementRect.width;

    element.style.top = `${Math.max(0, Math.min(newTop, maxTop))}px`;
    element.style.left = `${Math.max(0, Math.min(newLeft, maxLeft))}px`;
  }

  function closeDragElement() {
    isDragging = false;
    document.removeEventListener('mouseup', closeDragElement);
    document.removeEventListener('mousemove', elementDrag);
    element.classList.remove('dragging');
    element.style.pointerEvents = 'auto';
  }
}