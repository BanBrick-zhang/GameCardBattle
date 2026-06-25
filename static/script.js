const PAGE_SIZE = 6;
const currentPage = [1, 1, 1];
const comparePage = [1, 1, 1];
let selectedItems = [];
let searchKeyword = '';
let currentTab = 'compare';

const API_BASE = 'https://gamecardbattle.onrender.com';
// const API_BASE = 'https://cepdcs-rbbdib-5000.app.cloudstudio.work';
// const API_BASE = 'http://127.0.0.1:5000';
const API_SEARCH = API_BASE + '/api/search';
const API_DEFAULT = API_BASE + '/api/default';
const API_DETAIL = API_BASE + '/api/detail';

// 平台默认数据缓存
let platformDefaultData = [[], [], []];
let compareSearchData = [[], [], []];

// 平台名称映射
const PLATFORM_NAMES = ['老猎人电玩', '海螺电玩', '火枪手电玩'];
const PLATFORM_ICONS = ['💁', '🐚', '🔫'];

// 当前是否在详情页
let isInDetailPage = false;
// Chart实例引用
let detailChartInstance = null;
let compareChartInstance = null;

// ========== Tab 切换 ==========
function switchTab(tabName) {
    // 如果当前在详情页，先关闭详情页
    if (isInDetailPage) {
        closeDetail();
    }

    currentTab = tabName;

    // 隐藏所有 tab-content
    document.querySelectorAll('.tab-content').forEach(el => {
        el.classList.remove('active');
    });

    // 显示目标 tab
    document.getElementById('tab-' + tabName).classList.add('active');

    // 更新底部导航高亮
    document.querySelectorAll('.tab-item').forEach(el => {
        el.classList.remove('active');
    });
    document.querySelector('.tab-item[data-tab="' + tabName + '"]').classList.add('active');

    // 滚动到顶部
    document.querySelector('.app-main').scrollTop = 0;

    // 如果是单平台tab且未加载过数据，则加载默认数据
    if (tabName === 'laolieren') {
        loadPlatformDataIfNeeded(0);
    } else if (tabName === 'hailuo') {
        loadPlatformDataIfNeeded(1);
    } else if (tabName === 'huoqiangshou') {
        loadPlatformDataIfNeeded(2);
    }
}

// ========== 加载平台默认数据 ==========
function loadPlatformDataIfNeeded(platformIndex) {
    if (platformDefaultData[platformIndex].length === 0) {
        const platform = document.getElementById('filterPlatform' + (platformIndex + 1)).value;
        loadDefaultData(platformIndex, platform);
    }
}

async function loadDefaultData(platformIndex, platform) {
    try {
        showLoading();

        const res = await fetch(API_DEFAULT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ platform: platform, plat_index: platformIndex })
        });

        const result = await res.json();
        if (result.code === 200 && result.data) {
            platformDefaultData[platformIndex] = result.data;
            currentPage[platformIndex] = 1;
            renderPlatform(platformIndex, platformDefaultData[platformIndex]);
        } else {
            console.error('获取默认数据失败:', result.msg);
        }
    } catch (err) {
        console.error('默认数据请求失败:', err);
    } finally {
        hideLoading();
    }
}

function loadPlatformData(platformIndex) {
    const platform = document.getElementById('filterPlatform' + (platformIndex + 1)).value;
    currentPage[platformIndex] = 1;
    loadDefaultData(platformIndex, platform);
}

// ========== 搜索功能（对比模块） ==========
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
        showLoading();

        const res = await fetch(API_SEARCH, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keyword: searchKeyword, platform: platform })
        });

        const result = await res.json();
        if (result.code === 200 && result.data) {
            compareSearchData = result.data;

            const isAllEmpty = compareSearchData.every(plat => plat.length === 0);
            if (isAllEmpty) {
                alert('未搜索到该游戏信息！');
            }

            comparePage[0] = comparePage[1] = comparePage[2] = 1;
            selectedItems = [];
            renderCompareAll();
        } else {
            alert('搜索失败：' + (result.msg || '未知错误'));
        }
    } catch (err) {
        console.error(err);
        alert('搜索请求失败，请检查后端');
    } finally {
        hideLoading();
    }
}

// ========== 渲染单平台数据（非对比模式，无选择圆点） ==========
function renderPlatform(platformIndex, data) {
    const container = document.getElementById('platform' + (platformIndex + 1));
    container.innerHTML = '';

    const start = (currentPage[platformIndex] - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const pageData = data.slice(start, end);

    if (pageData.length === 0) {
        container.innerHTML = `<div style="text-align:center;padding:25px 5px;font-size:13px;color:#666;">暂无数据</div>`;
        renderPageInfo(platformIndex, data);
        return;
    }

    pageData.forEach(item => {
        const gameHtml = `
            <div class="game-item" 
                 onclick="openDetail('${item.game_id}', '${item.platform}', '${item.img_url || ''}')"
                 data-name="${item.name}" 
                 data-price="${Number(item.price)}" 
                 data-platform="${item.platform}"
                 data-img="${item.img_url}">
                <img src="${item.img_url}" alt="${item.name}" class="game-img" 
                     onerror="this.src='https://picsum.photos/44/44?gray'">
                <div class="game-info">
                    <div class="game-name" title="${item.name}">${item.name}</div>
                    <div class="game-price">¥ ${Number(item.price).toFixed(0)}</div>
                </div>
            </div>`;
        container.innerHTML += gameHtml;
    });

    renderPageInfo(platformIndex, data);
}

function renderPageInfo(platformIndex, data) {
    const total = Math.ceil(data.length / PAGE_SIZE);
    const curr = currentPage[platformIndex];
    const el = document.getElementById('pageInfo' + (platformIndex + 1));
    if (data.length === 0) {
        el.innerText = '';
    } else {
        el.innerText = `第 ${curr} 页 / 共 ${total} 页`;
    }
}

function changePage(platformNum, direction) {
    const idx = platformNum - 1;
    const data = platformDefaultData[idx];
    const maxPage = Math.ceil(data.length / PAGE_SIZE);
    currentPage[idx] += direction;
    if (currentPage[idx] < 1) currentPage[idx] = 1;
    if (currentPage[idx] > maxPage) currentPage[idx] = maxPage;
    renderPlatform(idx, data);
}

// ========== 渲染对比模块数据（带选择圆点） ==========
function renderCompareAll() {
    renderComparePlatform(0);
    renderComparePlatform(1);
    renderComparePlatform(2);
}

function renderComparePlatform(platformIndex) {
    const container = document.getElementById('platformCompare' + (platformIndex + 1));
    container.innerHTML = '';

    const data = compareSearchData[platformIndex] || [];
    const start = (comparePage[platformIndex] - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const pageData = data.slice(start, end);

    if (pageData.length === 0) {
        container.innerHTML = `<div style="text-align:center;padding:25px 5px;font-size:13px;color:#666;">暂无数据</div>`;
        renderComparePageInfo(platformIndex, data);
        return;
    }

    pageData.forEach(item => {
        const isSelected = selectedItems.some(s =>
            s.platform === item.platform && s.name === item.name
        );

        const gameHtml = `
            <div class="game-item compare-mode" 
                 data-name="${item.name}" 
                 data-price="${Number(item.price)}" 
                 data-platform="${item.platform}"
                 data-img="${item.img_url}"
                 data-gameid="${item.game_id}">
                <img src="${item.img_url}" alt="${item.name}" class="game-img" 
                     onclick="event.stopPropagation(); openZoom('${item.img_url}')" 
                     onerror="this.src='https://picsum.photos/44/44?gray'">
                <div class="game-info" onclick="event.stopPropagation(); openDetail('${item.game_id}', '${item.platform}', '${item.img_url || ''}')">
                    <div class="game-name" title="${item.name}">${item.name}</div>
                    <div class="game-price">¥ ${Number(item.price).toFixed(0)}</div>
                </div>
                <div class="select-dot ${isSelected ? 'selected' : ''}" 
                     onclick="event.stopPropagation(); toggleSelectDot(this, ${platformIndex})"></div>
            </div>`;
        container.innerHTML += gameHtml;
    });

    renderComparePageInfo(platformIndex, data);
}

function renderComparePageInfo(platformIndex, data) {
    const total = Math.ceil(data.length / PAGE_SIZE);
    const curr = comparePage[platformIndex];
    const el = document.getElementById('pageInfoCompare' + (platformIndex + 1));
    if (data.length === 0) {
        el.innerText = '';
    } else {
        el.innerText = `第 ${curr} 页 / 共 ${total} 页`;
    }
}

function changeComparePage(platformNum, direction) {
    const idx = platformNum - 1;
    const data = compareSearchData[idx] || [];
    const maxPage = Math.ceil(data.length / PAGE_SIZE);
    comparePage[idx] += direction;
    if (comparePage[idx] < 1) comparePage[idx] = 1;
    if (comparePage[idx] > maxPage) comparePage[idx] = maxPage;
    renderComparePlatform(idx);
}

// ========== 选择圆点按钮 ==========
function toggleSelectDot(dotEl, platformIndex) {
    dotEl.classList.toggle('selected');

    const itemEl = dotEl.closest('.game-item');
    const name = itemEl.dataset.name;
    const itemData = compareSearchData[platformIndex].find(i => i.name === name);
    if (!itemData) return;

    const index = selectedItems.findIndex(i =>
        i.platform === itemData.platform && i.name === itemData.name
    );
    if (index > -1) {
        selectedItems.splice(index, 1);
    } else {
        selectedItems.push(itemData);
    }
}

// ========== 对比弹窗（异步获取历史价格） ==========
async function compareSelected() {
    if (selectedItems.length < 2) {
        alert('请至少选择2个卡带！');
        return;
    }

    // 显示弹窗骨架
    const res = document.getElementById('compareResult');
    res.innerHTML = '<div style="text-align:center;padding:30px;color:#666;">正在获取历史价格数据...</div>';
    document.getElementById('modal').style.display = 'flex';

    try {
        showLoading();

        // 为每个选中的卡带获取详情（含历史价格）
        const detailPromises = selectedItems.map(item =>
            fetch(API_DETAIL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    game_id: item.game_id,
                    plat_name: item.platform,
                    img_url: item.img_url || ''
                })
            }).then(r => r.json())
        );

        const detailResults = await Promise.all(detailPromises);

        // 合并选中项与详情数据
        const itemsWithHistory = selectedItems.map((item, idx) => {
            const detail = detailResults[idx];
            return {
                ...item,
                history_prices: (detail.code === 200 && detail.data)
                    ? detail.data.history_prices || []
                    : []
            };
        });

        hideLoading();

        // 构建对比卡片列表
        let cardsHtml = '';
        itemsWithHistory.forEach(item => {
            cardsHtml += `
            <div class="compare-item">
                <img src="${item.img_url}" class="compare-img" onerror="this.src='https://picsum.photos/40/40?gray'">
                <div class="compare-info">
                    <div class="compare-platform">${item.platform}</div>
                    <div class="compare-name">${item.name}</div>
                    <div class="compare-price">¥ ${Number(item.price).toFixed(0)}</div>
                </div>
            </div>`;
        });

        // 价格统计
        const prices = itemsWithHistory.map(i => ({
            price: Number(i.price),
            platform: i.platform
        }));
        const minItem = prices.reduce((a, b) => a.price < b.price ? a : b);
        const maxItem = prices.reduce((a, b) => a.price > b.price ? a : b);

        const statsHtml = `
        <div class="compare-diff">
            💰 最低价：¥ ${minItem.price}（来自 ${minItem.platform}）<br>
            📈 最高价：¥ ${maxItem.price}（来自 ${maxItem.platform}）<br>
            📊 差价：¥ ${maxItem.price - minItem.price}
        </div>`;

        // 历史价格对比折线图
        const chartHtml = `
        <div class="compare-chart-section">
            <div class="compare-chart-title">📈 历史价格走势对比</div>
            <div class="compare-chart-container">
                <canvas id="comparePriceChart"></canvas>
            </div>
        </div>`;

        res.innerHTML = cardsHtml + statsHtml + chartHtml;

        // 渲染折线图
        setTimeout(() => {
            renderCompareChart(itemsWithHistory);
        }, 100);

    } catch (err) {
        hideLoading();
        console.error('获取对比详情失败:', err);
        res.innerHTML = '<div style="text-align:center;padding:20px;color:#e74c3c;">获取历史价格数据失败，请重试</div>';
    }
}

// 渲染对比弹窗中的历史价格折线图
function renderCompareChart(itemsWithHistory) {
    const canvas = document.getElementById('comparePriceChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // 销毁旧实例
    if (compareChartInstance) {
        compareChartInstance.destroy();
    }

    // 收集所有日期
    const allDates = new Set();
    itemsWithHistory.forEach(item => {
        if (item.history_prices) {
            item.history_prices.forEach(hp => {
                if (hp.date) allDates.add(hp.date);
            });
        }
    });
    const sortedDates = Array.from(allDates).sort();

    if (sortedDates.length === 0) {
        canvas.parentElement.innerHTML = '<div style="text-align:center;color:#999;padding:20px;">暂无历史价格数据</div>';
        return;
    }

    // 颜色配置
    const colors = [
        { border: '#e74c3c', bg: 'rgba(231, 76, 60, 0.1)' },
        { border: '#3498db', bg: 'rgba(52, 152, 219, 0.1)' },
        { border: '#2ecc71', bg: 'rgba(46, 204, 113, 0.1)' },
        { border: '#f39c12', bg: 'rgba(243, 156, 18, 0.1)' },
        { border: '#9b59b6', bg: 'rgba(155, 89, 182, 0.1)' }
    ];

    // 构建数据集
    const datasets = itemsWithHistory.map((item, idx) => {
        const color = colors[idx % colors.length];
        const priceMap = {};
        if (item.history_prices) {
            item.history_prices.forEach(hp => {
                priceMap[hp.date] = Number(hp.price);
            });
        }
        const data = sortedDates.map(date => priceMap[date] || null);

        return {
            label: item.platform,
            data: data,
            borderColor: color.border,
            backgroundColor: color.bg,
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: color.border,
            tension: 0.3,
            fill: false
        };
    });

    compareChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedDates,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: { size: 11 },
                        boxWidth: 12
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleFont: { size: 12 },
                    bodyFont: { size: 12 },
                    padding: 10,
                    cornerRadius: 8,
                    callbacks: {
                        label: function (context) {
                            return context.dataset.label + ': ¥' + context.parsed.y;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: { font: { size: 10 } },
                    grid: { display: false }
                },
                y: {
                    ticks: {
                        font: { size: 10 },
                        callback: function (value) {
                            return '¥' + value;
                        }
                    },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                }
            }
        }
    });
}

function clearSelected() {
    selectedItems = [];
    document.querySelectorAll('.select-dot').forEach(el => el.classList.remove('selected'));
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    selectedItems = [];
    document.querySelectorAll('.select-dot').forEach(el => {
        el.classList.remove('selected');
    });
    if (compareChartInstance) {
        compareChartInstance.destroy();
        compareChartInstance = null;
    }
}

// ========== 详情页面 ==========
async function openDetail(gameId, platName, imgUrl) {
    if (!gameId) return;

    try {
        showLoading();

        const res = await fetch(API_DETAIL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ game_id: gameId, plat_name: platName, img_url: imgUrl || '' })
        });

        const result = await res.json();
        if (result.code === 200 && result.data) {
            renderDetailPage(result.data);
            document.getElementById('detailPage').classList.add('active');
            document.getElementById('detailPage').scrollTop = 0;
            isInDetailPage = true;
        } else {
            alert('获取详情失败：' + (result.msg || '未知错误'));
        }
    } catch (err) {
        console.error('详情请求失败:', err);
        alert('详情请求失败');
    } finally {
        hideLoading();
    }
}

function renderDetailPage(data) {
    const container = document.getElementById('detailContent');

    // 历史价格 - 使用折线图
    let historyHtml = '';
    if (data.history_prices && data.history_prices.length > 0) {
        historyHtml = `
            <div class="detail-chart-container">
                <canvas id="detailPriceChart"></canvas>
            </div>
            <div class="history-price-list">`;
        data.history_prices.forEach(hp => {
            historyHtml += `
                <div class="history-price-item">
                    <span class="history-price-date">${hp.date}</span>
                    <span class="history-price-value">¥ ${Number(hp.price).toFixed(0)}</span>
                </div>`;
        });
        historyHtml += '</div>';
    } else {
        historyHtml = '<div style="color:#999;font-size:13px;">暂无历史价格数据</div>';
    }

    // 相册HTML
    let albumHtml = '';
    const validAlbum = (data.album || []).filter(img => img && img.trim() !== '');
    if (validAlbum.length > 0) {
        albumHtml = '<div class="detail-album">';
        validAlbum.forEach(img => {
            albumHtml += `<img src="${img}" class="detail-album-img" onclick="openZoom('${img}')" onerror="this.style.display='none'">`;
        });
        albumHtml += '</div>';
    } else {
        albumHtml = '<div class="detail-no-image">📷 暂无图片</div>';
    }

    // SKU列表HTML
    let skuHtml = '';
    if (data.skus && data.skus.length > 0) {
        skuHtml = '<div class="detail-sku-list">';
        data.skus.forEach(sku => {
            const isNew = sku.is_new === '1';
            const skuType = isNew ? '【全新】' : '【二手】';
            const quantityText = sku.quantity ? ` (库存: ${sku.quantity})` : '';
            skuHtml += `
                <div class="detail-sku-item">
                    <span class="detail-sku-title">${skuType} ${sku.title}${quantityText}</span>
                    <span class="detail-sku-price">¥ ${sku.price}</span>
                </div>`;
        });
        skuHtml += '</div>';
    } else {
        skuHtml = '<div style="color:#999;font-size:13px;">暂无SKU价格数据</div>';
    }

    // 描述HTML
    let descHtml = data.description || '';
    if (!descHtml || descHtml === '') {
        descHtml = '<div style="color:#999;font-size:13px;">暂无详细介绍</div>';
    }

    const gamePlatform = data.platform || 'NS';

    let extraInfo = '';
    if (data.fashou_date) {
        extraInfo += `<div class="detail-info-row"><span class="detail-info-label">发售日期</span><span class="detail-info-value">${data.fashou_date}</span></div>`;
    }
    if (data.metacritic && data.metacritic !== '0' && data.metacritic !== '') {
        extraInfo += `<div class="detail-info-row"><span class="detail-info-label">Metacritic</span><span class="detail-info-value">${data.metacritic}</span></div>`;
    }

    container.innerHTML = `
        <div class="detail-cover-section">
            <img src="${data.cover}" class="detail-cover-img" onerror="this.src='https://picsum.photos/160/160?gray'">
            <div class="detail-name">${data.name}</div>
            <div class="detail-price-tag">¥ ${Number(data.price).toFixed(0)}</div>
        </div>

        <div class="detail-card">
            <div class="detail-card-title">📋 基本信息</div>
            <div class="detail-info-row">
                <span class="detail-info-label">平台</span>
                <span class="detail-info-value">${gamePlatform}</span>
            </div>
            <div class="detail-info-row">
                <span class="detail-info-label">分类</span>
                <span class="detail-info-value">${data.genres || '暂无'}</span>
            </div>
            <div class="detail-info-row">
                <span class="detail-info-label">语言</span>
                <span class="detail-info-value">${data.language || '暂无'}</span>
            </div>
            ${extraInfo}
        </div>

        <div class="detail-card">
            <div class="detail-card-title">💰 价格详情</div>
            ${skuHtml}
        </div>

        <div class="detail-card">
            <div class="detail-card-title">📈 历史价格</div>
            ${historyHtml}
        </div>

        <div class="detail-card">
            <div class="detail-card-title">📷 游戏图片</div>
            ${albumHtml}
        </div>

        <div class="detail-card">
            <div class="detail-card-title">📝 详细介绍</div>
            <div class="detail-description">${descHtml}</div>
        </div>
    `;

    // 渲染详情页折线图
    if (data.history_prices && data.history_prices.length > 0) {
        setTimeout(() => {
            renderDetailChart(data.history_prices);
        }, 100);
    }
}

// 渲染详情页历史价格折线图
function renderDetailChart(historyPrices) {
    const canvas = document.getElementById('detailPriceChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (detailChartInstance) {
        detailChartInstance.destroy();
    }

    const sortedData = [...historyPrices].sort((a, b) => a.date.localeCompare(b.date));
    const labels = sortedData.map(hp => hp.date);
    const prices = sortedData.map(hp => Number(hp.price));

    detailChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '价格走势',
                data: prices,
                borderColor: '#e74c3c',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                borderWidth: 2,
                pointRadius: 4,
                pointBackgroundColor: '#e74c3c',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleFont: { size: 12 },
                    bodyFont: { size: 13 },
                    padding: 10,
                    cornerRadius: 8,
                    callbacks: {
                        label: function (context) {
                            return '¥' + context.parsed.y;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: { font: { size: 10 } },
                    grid: { display: false }
                },
                y: {
                    ticks: {
                        font: { size: 10 },
                        callback: function (value) {
                            return '¥' + value;
                        }
                    },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                }
            }
        }
    });
}

function closeDetail() {
    document.getElementById('detailPage').classList.remove('active');
    isInDetailPage = false;
    if (detailChartInstance) {
        detailChartInstance.destroy();
        detailChartInstance = null;
    }
}

// ========== 图片放大 ==========
function openZoom(imgUrl) {
    document.getElementById('zoomImg').src = imgUrl;
    document.getElementById('imgZoomOverlay').style.display = 'flex';
}

function closeZoom() {
    document.getElementById('imgZoomOverlay').style.display = 'none';
}

// ========== 加载遮罩 ==========
function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

// ========== 初始化 ==========
function init() {
    switchTab('compare');
}

init();

// ========== 平台搜索相关变量 ==========
let platformSearchKeywords = ['', '', ''];  // 三个平台的搜索关键词
let platformSearchData = [[], [], []];      // 三个平台的搜索结果缓存
let isPlatformSearching = [false, false, false];  // 是否处于搜索状态

const API_SEARCH_SINGLE = API_BASE + '/api/search_single';  // 单平台搜索接口

// ========== 平台搜索功能（只请求该平台接口） ==========
async function searchPlatformGames(platformIndex) {
    const inputEl = document.getElementById('platformSearchInput' + (platformIndex + 1));
    const keyword = inputEl.value.trim();

    if (!keyword) {
        alert('请输入游戏名称');
        return;
    }

    const platform = document.getElementById('filterPlatform' + (platformIndex + 1)).value;

    try {
        showLoading();

        // 使用 /api/search_single 只请求该平台的数据
        const res = await fetch(API_SEARCH_SINGLE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                keyword: keyword,
                platform: platform,
                plat_index: platformIndex
            })
        });

        const result = await res.json();
        if (result.code === 200 && result.data) {
            platformSearchData[platformIndex] = result.data || [];
            platformSearchKeywords[platformIndex] = keyword;
            isPlatformSearching[platformIndex] = true;

            if (platformSearchData[platformIndex].length === 0) {
                alert('未搜索到该游戏信息！');
            }

            currentPage[platformIndex] = 1;
            renderPlatform(platformIndex, platformSearchData[platformIndex]);
        } else {
            alert('搜索失败：' + (result.msg || '未知错误'));
        }
    } catch (err) {
        console.error('平台搜索请求失败:', err);
        alert('搜索请求失败，请检查后端');
    } finally {
        hideLoading();
    }
}

// ========== 重置平台搜索（清空输入框并恢复默认） ==========
function resetPlatformSearch(platformIndex) {
    const inputEl = document.getElementById('platformSearchInput' + (platformIndex + 1));
    inputEl.value = '';

    platformSearchKeywords[platformIndex] = '';
    platformSearchData[platformIndex] = [];
    isPlatformSearching[platformIndex] = false;

    // 重新加载默认数据
    const platform = document.getElementById('filterPlatform' + (platformIndex + 1)).value;
    loadDefaultData(platformIndex, platform);
}

// ========== 修改 renderPlatform 函数以支持搜索状态 ==========
// 覆盖原有的 renderPlatform 函数
function renderPlatform(platformIndex, data) {
    const container = document.getElementById('platform' + (platformIndex + 1));
    container.innerHTML = '';

    const start = (currentPage[platformIndex] - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const pageData = data.slice(start, end);

    if (pageData.length === 0) {
        container.innerHTML = `<div style="text-align:center;padding:25px 5px;font-size:13px;color:#666;">暂无数据</div>`;
        renderPageInfo(platformIndex, data);
        return;
    }

    pageData.forEach(item => {
        const gameHtml = `
            <div class="game-item" 
                 onclick="openDetail('${item.game_id}', '${item.platform}', '${item.img_url || ''}')"
                 data-name="${item.name}" 
                 data-price="${Number(item.price)}" 
                 data-platform="${item.platform}"
                 data-img="${item.img_url}">
                <img src="${item.img_url}" alt="${item.name}" class="game-img" 
                     onerror="this.src='https://picsum.photos/44/44?gray'">
                <div class="game-info">
                    <div class="game-name" title="${item.name}">${item.name}</div>
                    <div class="game-price">¥ ${Number(item.price).toFixed(0)}</div>
                </div>
            </div>`;
        container.innerHTML += gameHtml;
    });

    renderPageInfo(platformIndex, data);
}

function renderPageInfo(platformIndex, data) {
    const total = Math.ceil(data.length / PAGE_SIZE);
    const curr = currentPage[platformIndex];
    const el = document.getElementById('pageInfo' + (platformIndex + 1));
    if (data.length === 0) {
        el.innerText = '';
    } else {
        const searchHint = isPlatformSearching[platformIndex] ? ` [搜索: "${platformSearchKeywords[platformIndex]}"]` : '';
        el.innerText = `第 ${curr} 页 / 共 ${total} 页${searchHint}`;
    }
}

function changePage(platformNum, direction) {
    const idx = platformNum - 1;
    // 根据是否处于搜索状态选择数据源
    const data = isPlatformSearching[idx] ? platformSearchData[idx] : platformDefaultData[idx];
    const maxPage = Math.ceil(data.length / PAGE_SIZE);
    currentPage[idx] += direction;
    if (currentPage[idx] < 1) currentPage[idx] = 1;
    if (currentPage[idx] > maxPage) currentPage[idx] = maxPage;
    renderPlatform(idx, data);
}

// ========== 修改 loadPlatformData 以清空搜索状态 ==========
function loadPlatformData(platformIndex) {
    const platform = document.getElementById('filterPlatform' + (platformIndex + 1)).value;

    // 清空该平台的搜索状态
    const inputEl = document.getElementById('platformSearchInput' + (platformIndex + 1));
    if (inputEl) inputEl.value = '';
    platformSearchKeywords[platformIndex] = '';
    platformSearchData[platformIndex] = [];
    isPlatformSearching[platformIndex] = false;

    currentPage[platformIndex] = 1;
    loadDefaultData(platformIndex, platform);
}

// 为平台搜索输入框添加回车键搜索支持
document.addEventListener('DOMContentLoaded', function () {
    for (let i = 0; i < 3; i++) {
        const inputEl = document.getElementById('platformSearchInput' + (i + 1));
        if (inputEl) {
            inputEl.addEventListener('keypress', function (e) {
                if (e.key === 'Enter') {
                    searchPlatformGames(i);
                }
            });
        }
    }
});
