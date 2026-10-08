// A-Frame コンポーネント定義
AFRAME.registerComponent('high-quality-texture', {
    init: function () {
        this.el.addEventListener('model-loaded', (e) => {
            const mesh = this.el.getObject3D('mesh');
            if (mesh) {
                mesh.traverse((node) => {
                    if (node.isMesh && node.material && node.material.map) {
                        node.material.map.generateMipmaps = false;
                        node.material.map.minFilter = THREE.LinearFilter;
                        node.material.map.magFilter = THREE.LinearFilter;
                        node.material.map.needsUpdate = true;
                    }
                });
            }
        });
    }
});

// 定数データ定義
const videoData = {
    'stamp-a-flag': { title: 'スポット1：校章スポット', src: 'jgvideo.mp4' },
    'stamp-b-flag': { title: 'スポット2：シューティングゲーム', src: 'GameVideo.mp4' },
    'stamp-c-flag': { title: 'スポット3：丸型スポット', src: 'jgvideo.mp4' }
};

const deptNames = {
    'stamp-a': '電子機械科',
    'stamp-b': '情報技術科',
    'stamp-c': '情報処理科',
    'stamp-d': '服飾デザイン科',
    'stamp-e': '食物調理科',
    'stamp-f': '流通経済科'
};

let clickCount = 0;
let clickTimer = null;
let nearLogTimeout = null;
let markerTimers = {};

// --- 画面制御関数 ---

function startAR() {
    // 1. 説明画面を非表示にする
    const screen = document.getElementById('explanation-screen');
    if (screen) {
        screen.style.display = 'none';
    }

    // 2. AR.js のカメラを手動で起動する
    const scene = document.querySelector('a-scene');
    if (scene && scene.systems && scene.systems.arjs) {
        // AR.js の WebCam を開始
        if (typeof scene.systems.arjs.startWebcam === 'function') {
            scene.systems.arjs.startWebcam();
        }
    }
}
// 説明画面の「← 戻る」ボタンを押したときに実行（TOP画面へ移動）
function closeExplanation() {
    const expScreen = document.getElementById('explanation-screen');
    if (expScreen) {
        expScreen.style.display = 'none';
    }
    // TOPページに戻る場合
    window.location.href = 'index.html';
}

// 解放動画ボタンを押した時の処理
function openCollection() {
    renderCollectionList();
    
    // 2. モーダルを表示（display: none から flex に変更）
    const modal = document.getElementById('collection-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeCollection() {
    const modal = document.getElementById('collection-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 学科ボタンを押したときの処理
function selectDepartment(deptKey) {
    renderCollectionList();
    const listContainer = document.getElementById('collection-list');
    if (listContainer) {
        listContainer.scrollIntoView({ behavior: 'smooth' });
    }
}

function openDeptVideos(deptKey) {
    const modal = document.getElementById('dept-video-modal');
    const title = document.getElementById('dept-title');
    const list = document.getElementById('dept-video-list');
    
    if (title) title.textContent = `${deptNames[deptKey] || '学科'} の動画一覧`;
    
    if (list) {
        list.innerHTML = '';
        const isUnlocked = localStorage.getItem(`${deptKey}-flag`) === '1';
        
        const div = document.createElement('div');
        div.className = `video-item ${isUnlocked ? 'unlocked' : 'locked'}`;
        
        if (isUnlocked) {
            div.innerHTML = `
                <p style="font-weight:bold; margin:0 0 8px 0; color:#059669;">🔓 学科紹介動画</p>
                <video src="jgvideo.mp4" controls style="width:100%; border-radius:8px; display:block;"></video>
            `;
        } else {
            div.innerHTML = `
                <p style="font-weight:bold; margin:0; color:#475569;">🔒 未解放の動画</p>
                <div class="secret-box">
                    <div class="secret-icon">❓</div>
                    <small style="color:#64748b; font-weight:bold;">ARマーカーを探して解放しよう！</small>
                </div>
            `;
        }
        list.appendChild(div);
    }
    
    const collectionModal = document.getElementById('collection-modal');
    if (collectionModal) collectionModal.style.display = 'none';
    if (modal) modal.style.display = 'flex';
}

function closeDeptVideos() {
    const deptModal = document.getElementById('dept-video-modal');
    const collectionModal = document.getElementById('collection-modal');
    if (deptModal) deptModal.style.display = 'none';
    if (collectionModal) collectionModal.style.display = 'flex';
}


//  トップ画面（コレクションモーダル）用の動画描画関数
function renderCollectionList() {
    const listContainer = document.getElementById('collection-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    Object.keys(videoData).forEach(key => {
        const item = videoData[key];
        const isUnlocked = localStorage.getItem(key) === '1';

        const div = document.createElement('div');
        div.className = `video-item ${isUnlocked ? 'unlocked' : 'locked'}`;

        if (isUnlocked) {
            div.innerHTML = `
                <p style="font-weight:bold; margin:0 0 8px 0; color:#059669;">🔓 ${item.title}</p>
                <video src="${item.src}" controls style="width:100%; border-radius:8px; display:block;"></video>
            `;
        } else {
            div.innerHTML = `
                <p style="font-weight:bold; margin:0; color:#475569;">🔒 ${item.title}</p>
                <div class="secret-box">
                    <div class="secret-icon">❓</div>
                    <small style="color:#64748b; font-weight:bold;">ARマーカーを探して解放しよう！</small>
                </div>
            `;
        }
        listContainer.appendChild(div);
    });
}

// 説明ダイアログ（#exp-video-list）専用の解放動画描画関数
function renderExpVideoList() {
    const listContainer = document.getElementById('exp-video-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    Object.keys(videoData).forEach(key => {
        const item = videoData[key];
        const isUnlocked = localStorage.getItem(key) === '1';

        const div = document.createElement('div');
        div.style.cssText = "background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px; margin-bottom: 10px; text-align: left;";

        if (isUnlocked) {
            div.innerHTML = `
                <p style="font-weight:bold; margin:0 0 6px 0; color:#059669; font-size:13px;">🔓 ${item.title}</p>
                <video src="${item.src}" controls style="width:100%; border-radius:6px; display:block;"></video>
            `;
        } else {
            div.innerHTML = `
                <p style="font-weight:bold; margin:0; color:#64748b; font-size:13px;">🔒 ${item.title}</p>
                <div style="background:#e2e8f0; border-radius:6px; padding:8px; text-align:center; margin-top:6px;">
                    <small style="color:#64748b; font-size:11px; font-weight:bold;">ARマーカーをかざして解放！</small>
                </div>
            `;
        }
        listContainer.appendChild(div);
    });
}

// タイトル連続クリックによるデータリセット処理
function handleTitleClick() {
    clickCount++;
    clearTimeout(clickTimer);

    if (clickCount >= 5) {
        clickCount = 0;
        if (confirm('【開発者コマンド】スタンプと解放状況を全リセットしますか？')) {
            localStorage.removeItem('stamp-a-flag');
            localStorage.removeItem('stamp-b-flag');
            localStorage.removeItem('stamp-c-flag');
            localStorage.removeItem('stamp-a-done');
            localStorage.removeItem('stamp-b-done');
            localStorage.removeItem('stamp-c-done');

            renderCollectionList();
            renderExpVideoList();
            alert('すべての進行状況をリセットしました！');
        }
    } else {
        clickTimer = setTimeout(() => {
            clickCount = 0;
        }, 1500);
    }
}

// --- 近くのオブジェクト読み取り案内ログの表示 ---
function showNearObjectLog() {
    const logElem = document.getElementById('near-object-log');
    if (!logElem) return;

    logElem.classList.add('show');

    clearTimeout(nearLogTimeout);
    nearLogTimeout = setTimeout(() => {
        logElem.classList.remove('show');
    }, 10000);
}

// --- test.htmlへ切り替え ---
function switchToMarkerless() {
    window.location.href = 'test.html';
}

// --- ARマーカー検知イベント設定 ---
window.addEventListener('DOMContentLoaded', () => {
    // 説明ダイアログ内の動画リストを初回描画
    renderExpVideoList();

    const markers = document.querySelectorAll('a-marker');

    markers.forEach(marker => {
        marker.addEventListener('markerFound', function() {
            console.log("検出成功:", this.id);

            const videoAttr = this.querySelector('a-video');
            const video = videoAttr ? document.querySelector(videoAttr.getAttribute('src')) : null;

            // 動画解放フラグの記録
            if (this.id === 'ar-marker-1') {
                localStorage.setItem('stamp-a-flag', '1');
            } else if (this.id === 'ar-marker-2') {
                localStorage.setItem('stamp-b-flag', '1');
            } else if (this.id === 'ar-marker-3') {
                localStorage.setItem('stamp-c-flag', '1');
            }

            // 1. マーカー動画の再生
            if (video) {
                video.currentTime = 0;
                video.muted = false;
                video.play().catch(e => console.log('動画再生エラー:', e));
            }

            // 2. マーカー認識から1.5秒後に通知ログを表示
            setTimeout(() => {
                showNearObjectLog();
            }, 1500);
        });

        marker.addEventListener('markerLost', function() {
            if (markerTimers[this.id]) {
                clearTimeout(markerTimers[this.id]);
            }

            const videoAttr = this.querySelector('a-video');
            const video = videoAttr ? document.querySelector(videoAttr.getAttribute('src')) : null;
            if (video) {
                video.pause();
            }
        });
    });
});