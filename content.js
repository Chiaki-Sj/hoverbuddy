async function loadDictionary(filename) {
  const url = chrome.runtime.getURL(`data/${filename}`);
  const response = await fetch(url);
  return await response.text();
}


function showPopup(text, event) {
  // 古いポップアップを消す
  if (currentPopup) {
    currentPopup.remove();
  }
  
  const meaning = dictionary[text.toLowerCase()] || "未登録の単語です";
  const popup = document.createElement('div');
  popup.style.position = 'fixed';
  popup.textContent = meaning;
  popup.style.left = event.clientX + 10 + 'px';
  popup.style.top = event.clientY + 10 + 'px';
  popup.style.backgroundColor = 'Pink';
  popup.style.padding = '5px';
  popup.style.border = '1px solid black';
  document.body.appendChild(popup);
  
  // 新しいポップアップを覚えておく
  currentPopup = popup;
}
let currentPopup = null;  // 今表示してるポップアップを覚えておく
let mouseX = 0;
let mouseY = 0;
document.addEventListener('mousemove', function(e) {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

document.addEventListener('keydown', function(e) {

  if (e.target.textContent && e.shiftKey) {
    showPopup(e.target.textContent, {clientX: mouseX, clientY: mouseY});
  }
});
document.addEventListener('keyup', function(e) {
  if (e.key === 'Shift' && currentPopup) {
    currentPopup.remove();
    currentPopup = null;
  }
});
const dictionary = {};
console.log('dictionaryの読み込みを開始します');
loadDictionary('supplement.tsv').then(text => {
  text.split('\n').forEach(line => {
    const parts = line.split('\t');
    const word = parts[0].split('=')[1];  // word=painful から painful を取り出す
    dictionary[word] = parts[1];  // とりあえず最初の意味だけ入れてみる
  });
  console.log('dictionaryの読み込みが完了しました');
  // dictionaryの中身を見る

});

