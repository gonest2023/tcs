/**
 * ui.js - UI交互模块
 * 负责页面切换、元素更新和事件绑定
 */

const UI = {
    // DOM元素缓存
    elements: {},

    /**
     * 初始化UI模块
     */
    init() {
        // 缓存DOM元素
        this.elements = {
            // 屏幕
            authScreen: document.getElementById('auth-screen'),
            gameScreen: document.getElementById('game-screen'),

            // 登录表单
            loginForm: document.getElementById('login-form'),
            registerForm: document.getElementById('register-form'),
            loginUsername: document.getElementById('login-username'),
            loginPassword: document.getElementById('login-password'),
            registerUsername: document.getElementById('register-username'),
            registerPassword: document.getElementById('register-password'),
            registerConfirm: document.getElementById('register-confirm'),

            // 切换链接
            showRegister: document.getElementById('show-register'),
            showLogin: document.getElementById('show-login'),

            // 游客按钮
            guestLoginBtn: document.getElementById('guest-login-btn'),

            // 消息提示
            authMessage: document.getElementById('auth-message'),

            // 游戏界面
            currentUser: document.getElementById('current-user'),
            logoutBtn: document.getElementById('logout-btn'),
            currentScore: document.getElementById('current-score'),
            highScore: document.getElementById('high-score'),
            gameCanvas: document.getElementById('game-canvas'),
            gameOverlay: document.getElementById('game-overlay'),
            overlayTitle: document.getElementById('overlay-title'),
            overlayMessage: document.getElementById('overlay-message'),
            startBtn: document.getElementById('start-btn'),
            pauseBtn: document.getElementById('pause-btn'),
            historyList: document.getElementById('history-list'),
            loginHistoryList: document.getElementById('login-history-list')
        };
    },

    /**
     * 显示登录界面
     */
    showAuthScreen() {
        this.elements.authScreen.classList.remove('hidden');
        this.elements.gameScreen.classList.add('hidden');
        this.showLoginForm();
    },

    /**
     * 显示游戏界面
     */
    showGameScreen() {
        this.elements.authScreen.classList.add('hidden');
        this.elements.gameScreen.classList.remove('hidden');
    },

    /**
     * 显示登录表单
     */
    showLoginForm() {
        this.elements.loginForm.classList.remove('hidden');
        this.elements.registerForm.classList.add('hidden');
        this.hideMessage();
        this.clearForms();
    },

    /**
     * 显示注册表单
     */
    showRegisterForm() {
        this.elements.loginForm.classList.add('hidden');
        this.elements.registerForm.classList.remove('hidden');
        this.hideMessage();
        this.clearForms();
    },

    /**
     * 清空表单
     */
    clearForms() {
        this.elements.loginUsername.value = '';
        this.elements.loginPassword.value = '';
        this.elements.registerUsername.value = '';
        this.elements.registerPassword.value = '';
        this.elements.registerConfirm.value = '';
    },

    /**
     * 显示消息
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型 ('success' 或 'error')
     */
    showMessage(message, type = 'error') {
        const msgEl = this.elements.authMessage;
        msgEl.textContent = message;
        msgEl.className = `message ${type}`;
        msgEl.classList.remove('hidden');

        // 3秒后自动隐藏
        setTimeout(() => this.hideMessage(), 3000);
    },

    /**
     * 隐藏消息
     */
    hideMessage() {
        this.elements.authMessage.classList.add('hidden');
    },

    /**
     * 更新当前用户显示
     * @param {string} username - 用户名
     */
    updateCurrentUser(username) {
        this.elements.currentUser.textContent = username;
    },

    /**
     * 更新分数显示
     * @param {number} current - 当前分数
     * @param {number} high - 最高分
     */
    updateScores(current, high) {
        this.elements.currentScore.textContent = current;
        this.elements.highScore.textContent = high;
    },

    /**
     * 更新当前分数
     * @param {number} score - 分数
     */
    updateCurrentScore(score) {
        this.elements.currentScore.textContent = score;
    },

    /**
     * 显示游戏覆盖层
     * @param {string} title - 标题
     * @param {string} message - 消息
     */
    showOverlay(title, message) {
        this.elements.overlayTitle.textContent = title;
        this.elements.overlayMessage.textContent = message;
        this.elements.gameOverlay.classList.remove('hidden');
    },

    /**
     * 隐藏游戏覆盖层
     */
    hideOverlay() {
        this.elements.gameOverlay.classList.add('hidden');
    },

    /**
     * 更新按钮状态
     * @param {string} state - 状态 ('ready', 'playing', 'paused', 'gameover')
     */
    updateButtons(state) {
        const startBtn = this.elements.startBtn;
        const pauseBtn = this.elements.pauseBtn;

        switch (state) {
            case 'ready':
                startBtn.textContent = '开始游戏';
                startBtn.disabled = false;
                pauseBtn.disabled = true;
                pauseBtn.textContent = '暂停';
                break;
            case 'playing':
                startBtn.textContent = '重新开始';
                startBtn.disabled = false;
                pauseBtn.disabled = false;
                pauseBtn.textContent = '暂停';
                break;
            case 'paused':
                pauseBtn.textContent = '继续';
                break;
            case 'gameover':
                startBtn.textContent = '再来一局';
                pauseBtn.disabled = true;
                break;
        }
    },

    /**
     * 更新游戏历史列表
     * @param {Array} history - 历史记录数组
     */
    updateGameHistory(history) {
        const list = this.elements.historyList;

        if (!history || history.length === 0) {
            list.innerHTML = '<p class="empty-history">暂无游戏记录</p>';
            return;
        }

        list.innerHTML = history.map(item => {
            const date = new Date(item.playedAt);
            const dateStr = this.formatDate(date);
            const durationStr = this.formatDuration(item.duration);

            return `
                <div class="history-item">
                    <span class="history-date">${dateStr}</span>
                    <span class="history-score">${item.score} 分</span>
                    <span class="history-time">${durationStr}</span>
                </div>
            `;
        }).join('');
    },

    /**
     * 更新登录历史列表
     * @param {Array} history - 登录历史数组
     */
    updateLoginHistory(history) {
        const list = this.elements.loginHistoryList;

        if (!history || history.length === 0) {
            list.innerHTML = '<p class="empty-history">暂无登录记录</p>';
            return;
        }

        list.innerHTML = history.map(time => {
            const date = new Date(time);
            const dateStr = this.formatDateTime(date);

            return `
                <div class="history-item">
                    <span class="history-date">🕐 ${dateStr}</span>
                </div>
            `;
        }).join('');
    },

    /**
     * 格式化日期
     * @param {Date} date - 日期对象
     * @returns {string} 格式化的日期字符串
     */
    formatDate(date) {
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${month}/${day} ${hours}:${minutes}`;
    },

    /**
     * 格式化完整日期时间
     * @param {Date} date - 日期对象
     * @returns {string} 格式化的日期时间字符串
     */
    formatDateTime(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    },

    /**
     * 格式化时长
     * @param {number} seconds - 秒数
     * @returns {string} 格式化的时长字符串
     */
    formatDuration(seconds) {
        if (seconds < 60) {
            return `${seconds}秒`;
        }
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}分${secs}秒`;
    }
};
