// 辞書を読み込む関数
async function loadDictionary(filename) {
  const url = chrome.runtime.getURL(`data/${filename}`);
  const response = await fetch(url);
  return await response.text();
}

async function loadAllDictionaries() {
  console.log('辞書を読み込み始めるよ！');
  const dict1 = await loadDictionary('supplement.tsv');
  console.log('supplement.tsv を読み込んだよ！');
  return dict1;
}

// TSVを解析してdictionary型に変換する関数
function parseDictionaryTSV(text) {
  const dictionary = {};
  // 各行を処理
  text.split('\n').forEach(line => {
    if (!line.trim()) return; // 空行をスキップ  
    // タブで分割して各パートを取得
    const parts = line.split('\t');
    let word = '';
    let meanings = [];   
   
    parts.forEach(part => {  // 各パートを解析
      const [key, value] = part.split('=');
      if (!key || !value) return;

      if (key === 'word') {
        word = value;
      } else {
        // カンマで区切られた意味を配列に追加
        meanings = meanings.concat(value.split(', ').map(m => m.trim()));
      }
    });
    
    if (word) {
      // 重複を除去して、すべての意味をカンマで結合
      dictionary[word] = [...new Set(meanings)].join('、');
      // 小文字のバージョンも登録（検索用）
      if (word.toLowerCase() !== word) {
        dictionary[word.toLowerCase()] = dictionary[word];
      }
    }
  });
  
  return dictionary;
}


function getWordAtPoint(elem, x, y) {
  if (elem.nodeType === Node.TEXT_NODE) {
    const range = document.createRange();
    range.selectNodeContents(elem);
    
    const currentPos = 0;
    const endPos = range.endOffset;
    
    // テキストを単語に分割
    const text = elem.textContent;
    const words = text.split(/\s+/);
    let wordStart = 0;
    
    // 各単語の位置を確認
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (!word) continue;
      
      // 単語の範囲を選択
      range.setStart(elem, wordStart);
      range.setEnd(elem, wordStart + word.length);
      
      const rect = range.getBoundingClientRect();
      
      // マウス位置が単語の範囲内かチェック
      if (x >= rect.left && x <= rect.right &&
          y >= rect.top && y <= rect.bottom) {
        return word;
      }
      
      wordStart += word.length + 1;
      while (wordStart < text.length && /\s/.test(text[wordStart])) {
        wordStart++;
      }
    }
  } else {
    for (const child of elem.childNodes) {
      const word = getWordAtPoint(child, x, y);
      if (word) {
        return word;
      }
    }
  }
  return null;
}
// メイン処理
async function initializeDictionary() {
  try {
    const dictText = await loadAllDictionaries();
    // グローバルなdictionary変数に直接代入
    dictionary = parseDictionaryTSV(dictText);
    console.log('辞書の変換が完了したよ！');
    
    // 動作確認用のログ
    console.log('painfulの意味:', dictionary['painful']);
  } catch (error) {
    console.error('辞書の読み込みに失敗しました:', error);
    dictionary = {};
  }
}

// 必要な変数を準備
initializeDictionary();
let currentPopup = null;  // 今表示してるポップアップ
let mouseX = 0;
let mouseY = 0;

// ポップアップを表示する関数
function showPopup(text, event) {
  if (currentPopup) {
    currentPopup.remove();
  }
  
  const meaning = dictionary[text.toLowerCase()] || "わからないにゃ...";
  const popup = document.createElement('div');
  popup.style.position = 'fixed';
  popup.innerHTML = `
    <div style="background: white; padding: 10px; border-radius: 15px; border: 2px solid pink; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
      <span>${meaning} 🐾</span>
    </div>
  `;
  popup.style.left = event.clientX + 10 + 'px';
  popup.style.top = event.clientY + 10 + 'px';
  popup.style.zIndex = '10000';  // 他の要素より前面に表示
  currentPopup = popup;
  document.body.appendChild(popup);
}

// マウスの位置を記録
document.addEventListener('mousemove', function(e) {
 // 前回のポップアップを非表示にする
 if (currentPopup) {
  const rect = currentPopup.getBoundingClientRect();
  const isOverPopup = e.clientX >= rect.left && e.clientX <= rect.right &&
                     e.clientY >= rect.top && e.clientY <= rect.bottom;
  
  // ポップアップの上にマウスがある場合は消さない
  if (isOverPopup) {
    return;
  }
  currentPopup.remove();
  currentPopup = null;
}

const word = getWordAtPoint(document.body, e.clientX, e.clientY);
if (word && /^[a-zA-Z]+$/.test(word)) {  // アルファベットのみの単語に限定
  showPopup(word, e);
}
});


// シフトキーを押したときにポップアップを表示
document.addEventListener('keydown', function(e) {
  if (e.target.textContent && e.shiftKey) {
    showPopup(e.target.textContent, {clientX: mouseX, clientY: mouseY});
  }
});

// シフトキーを離したときにポップアップを消す
document.addEventListener('keyup', function(e) {
  if (e.key === 'Shift' && currentPopup) {
    currentPopup.remove();
    currentPopup = null;
  }
});

