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
  return dict1;  // とりあえず1つだけ
}

// 必要な変数を準備
const dictionary = {};
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
  currentPopup = popup;
  document.body.appendChild(popup);
}

// マウスの位置を記録
document.addEventListener('mousemove', function(e) {
  mouseX = e.clientX;
  mouseY = e.clientY;
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

// 辞書データを読み込む
console.log('dictionaryの読み込みを開始します');
loadAllDictionaries().then(text => {
  console.log('辞書の最初の部分:', text.slice(0, 100));  // 👈 この行を追加
  console.log('辞書の中身の例:', text.split('\n')[0]);
  text.split('\n').forEach(line => {
    const [word, meaning] = line.split('\t');  // タブで分割
    if (word && meaning) {  // wordとmeaningが両方存在する場合だけ
      dictionary[word.toLowerCase()] = meaning;
    }
  });
     // 📌 ここで辞書の中身をチェック！
  console.log('📖 読み込まれた辞書の例:', Object.entries(dictionary).slice(0, 5));

    
  console.log('dictionaryの読み込みが完了しました')
});