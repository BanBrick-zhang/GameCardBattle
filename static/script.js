const PAGE_SIZE = 8;
const currentPage = [1, 1, 1];
let selectedItems = [];
let searchKeyword = '';
const API_SEARCH = 'http://localhost:5000/api/search';

function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

// 隐藏加载
function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

async function searchGames() {
    const platform = document.getElementById('gamePlatform').value;
    searchKeyword = document.getElementById('searchInput').value.trim();

    if (!platform) {
        alert('请先选择游戏平台！');
        return;
    }
    if (!searchKeyword) {
        alert('请输入游戏名称');
        return;
    }

    try {
        // ========== 搜索开始 → 显示加载 ==========
        showLoading();

        const res = await fetch(API_SEARCH, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({keyword: searchKeyword, platform: platform})
        });

        const result = await res.json();
        if (result.code === 200 && result.data) {
            platformData = result.data;

            const isAllEmpty = platformData.every(plat => plat.length === 0);
            if (isAllEmpty) {
                alert('未搜索到该游戏信息！');
            }

            currentPage[0] = currentPage[1] = currentPage[2] = 1;
            renderAll();
        } else {
            alert('搜索失败：' + (result.msg || '未知错误'));
        }
    } catch (err) {
        console.error(err);
        alert('搜索请求失败，请检查后端');
    } finally {
        // ========== 无论成功失败 → 关闭加载 ==========
        hideLoading();
    }
}

let platformData = [[], [], []];

function getDisplayData(platformIndex) {
    return platformData[platformIndex] || [];
}

// 渲染分页信息（当前页/总页数）
function renderPageInfo(platformIndex) {
    const data = getDisplayData(platformIndex);
    const total = Math.ceil(data.length / PAGE_SIZE);
    const curr = currentPage[platformIndex];
    const el = document.getElementById(`pageInfo${platformIndex + 1}`);
    if (data.length === 0) {
        el.innerText = '';
    } else {
        el.innerText = `第 ${curr} 页 / 共 ${total} 页`;
    }
}

function renderPlatform(platformIndex) {
    const data = getDisplayData(platformIndex);
    const container = document.getElementById(`platform${platformIndex + 1}`);
    container.innerHTML = '';

    const start = (currentPage[platformIndex] - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const pageData = data.slice(start, end);

    if (pageData.length === 0) {
        container.innerHTML = `<div style="text-align:center;padding:25px 5px;font-size:13px;color:#666;">暂无数据</div>`;
        renderPageInfo(platformIndex);
        return;
    }

    pageData.forEach(item => {
        const isSelected = selectedItems.some(s =>
            s.platform === item.platform && s.name === item.name
        );

        const gameHtml = `
            <div class="game-item ${isSelected ? 'selected' : ''}" 
                 onclick="toggleSelect(this, ${platformIndex})" 
                 data-name="${item.name}" 
                 data-price="${Number(item.price)}" 
                 data-platform="${item.platform}"
                 data-img="${item.img_url}">
                <img src="${item.img_url}" alt="${item.name}" class="game-img" onclick="openZoom('${item.img_url}')" onerror="this.src='https://picsum.photos/44/44?gray'">
                <div class="game-info">
                    <div class="game-name" title="${item.name}">${item.name}</div>
                    <div class="game-price">¥ ${Number(item.price).toFixed(0)}</div>
                </div>
            </div>`;
        container.innerHTML += gameHtml;
    });

    renderPageInfo(platformIndex);
}

function toggleSelect(el, platformIndex) {
    el.classList.toggle('selected');
    const name = el.dataset.name;
    const itemData = platformData[platformIndex].find(i => i.name === name);
    if (!itemData) return;

    const index = selectedItems.findIndex(i =>
        i.platform === itemData.platform && i.name === itemData.name
    );
    index > -1 ? selectedItems.splice(index, 1) : selectedItems.push(itemData);
}

function changePage(platformNum, direction) {
    const idx = platformNum - 1;
    const data = getDisplayData(idx);
    const maxPage = Math.ceil(data.length / PAGE_SIZE);
    currentPage[idx] += direction;
    if (currentPage[idx] < 1) currentPage[idx] = 1;
    if (currentPage[idx] > maxPage) currentPage[idx] = maxPage;
    renderPlatform(idx);
}

// 对比弹窗：显示最高价/最低价来自哪个平台
function compareSelected() {
    if (selectedItems.length < 2) {
        alert('请至少选择2个卡带！');
        return;
    }

    const res = document.getElementById('compareResult');
    let html = '';
    selectedItems.forEach(item => {
        html += `
        <div class="compare-item">
            <img src="${item.img_url}" class="compare-img" onerror="this.src='https://picsum.photos/40/40?gray'">
            <div class="compare-info">
                <div class="compare-platform">${item.platform}</div>
                <div class="compare-name">${item.name}</div>
                <div class="compare-price">¥ ${Number(item.price).toFixed(0)}</div>
            </div>
        </div>`;
    });

    const prices = selectedItems.map(i => ({
        price: Number(i.price),
        platform: i.platform
    }));

    const minItem = prices.reduce((a, b) => a.price < b.price ? a : b);
    const maxItem = prices.reduce((a, b) => a.price > b.price ? a : b);

    html += `
    <div class="compare-diff">
        💰 最低价：¥ ${minItem.price}（来自 ${minItem.platform}）<br>
        📈 最高价：¥ ${maxItem.price}（来自 ${maxItem.platform}）<br>
        📊 差价：¥ ${maxItem.price - minItem.price}
    </div>`;

    res.innerHTML = html;
    document.getElementById('modal').style.display = 'flex';
}

function clearSelected() {
    selectedItems = [];
    document.querySelectorAll('.game-item').forEach(el => el.classList.remove('selected'));
}

// 关闭弹窗，并清空所有选中的卡带
function closeModal() {
    document.getElementById('modal').style.display = 'none';

    // ========= ✅ 自动取消所有勾选 =========
    selectedItems = [];
    document.querySelectorAll('.game-item').forEach(el => {
        el.classList.remove('selected');
    });
}

// 点击图片放大
function openZoom(imgUrl) {
    document.getElementById('zoomImg').src = imgUrl;
    document.getElementById('imgZoomOverlay').style.display = 'flex';
}

// 关闭放大
function closeZoom() {
    document.getElementById('imgZoomOverlay').style.display = 'none';
}

function renderAll() {
    renderPlatform(0);
    renderPlatform(1);
    renderPlatform(2);
}

renderAll();
