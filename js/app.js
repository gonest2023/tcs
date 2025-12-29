/**
 * app.js - 应用主入口
 * 协调各模块，处理事件绑定和应用初始化
 */

// 游戏实例
let game = null;

/**
 * 应用初始化
 */
function initApp() {
    // 初始化UI模块
    UI.init();

    // 检查登录状态
    if (Auth.isLoggedIn()) {
        showGame();
    } else {
        UI.showAuthScreen();
    }

    // 绑定事件
    bindEvents();
}

/**
 * 显示游戏界面
 */
function showGame() {
    const username = Auth.getCurrentUser();
    const isGuest = Auth.isGuest();

    UI.showGameScreen();
    UI.updateCurrentUser(username);

    // 初始化游戏
    initGame();

    // 加载用户数据（非游客）
    if (!isGuest) {
        const highScore = Storage.getHighScore(username);
        UI.updateScores(0, highScore);

        // 加载历史记录
        const gameHistory = Storage.getGameHistory(username);
        const loginHistory = Storage.getLoginHistory(username);
        UI.updateGameHistory(gameHistory);
        UI.updateLoginHistory(loginHistory);
    } else {
        // 游客模式
        UI.updateScores(0, 0);
        UI.updateGameHistory([]);
        UI.updateLoginHistory([]);
    }

    // 显示初始覆盖层
    UI.showOverlay('准备开始', '按 [空格键] 或点击下方按钮开始游戏');
    UI.updateButtons('ready');
}

/**
 * 初始化游戏实例
 */
function initGame() {
    const canvas = UI.elements.gameCanvas;
    game = new SnakeGame(canvas);

    // 设置回调
    game.onScoreUpdate = (score) => {
        UI.updateCurrentScore(score);

        // 更新最高分（如果超过）
        const username = Auth.getCurrentUser();
        if (!Auth.isGuest()) {
            const highScore = Storage.getHighScore(username);
            if (score > highScore) {
                UI.updateScores(score, score);
            }
        }
    };

    game.onGameOver = (score, duration) => {
        const username = Auth.getCurrentUser();

        // 保存分数（非游客）
        if (!Auth.isGuest()) {
            Storage.recordGameScore(username, score, duration);

            // 更新最高分显示
            const highScore = Storage.getHighScore(username);
            UI.updateScores(score, highScore);

            // 刷新历史记录
            const gameHistory = Storage.getGameHistory(username);
            UI.updateGameHistory(gameHistory);
        }

        // 显示游戏结束覆盖层
        UI.showOverlay('游戏结束', `最终得分: ${score} 分`);
        UI.updateButtons('gameover');
    };
}

/**
 * 绑定事件
 */
function bindEvents() {
    // 登录表单提交
    UI.elements.loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = UI.elements.loginUsername.value.trim();
        const password = UI.elements.loginPassword.value;

        const result = Auth.login(username, password);
        if (result.success) {
            showGame();
        } else {
            UI.showMessage(result.message, 'error');
        }
    });

    // 注册表单提交
    UI.elements.registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = UI.elements.registerUsername.value.trim();
        const password = UI.elements.registerPassword.value;
        const confirm = UI.elements.registerConfirm.value;

        if (password !== confirm) {
            UI.showMessage('两次输入的密码不一致', 'error');
            return;
        }

        const result = Auth.register(username, password);
        if (result.success) {
            UI.showMessage(result.message, 'success');
            setTimeout(() => UI.showLoginForm(), 1500);
        } else {
            UI.showMessage(result.message, 'error');
        }
    });

    // 切换到注册表单
    UI.elements.showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        UI.showRegisterForm();
    });

    // 切换到登录表单
    UI.elements.showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        UI.showLoginForm();
    });

    // 游客登录
    UI.elements.guestLoginBtn.addEventListener('click', () => {
        const result = Auth.guestLogin();
        if (result.success) {
            showGame();
        }
    });

    // 登出
    UI.elements.logoutBtn.addEventListener('click', () => {
        if (game) {
            game.stop();
        }
        Auth.logout();
        UI.showAuthScreen();
    });

    // 开始/重新开始游戏
    UI.elements.startBtn.addEventListener('click', () => {
        UI.hideOverlay();
        game.start();
        UI.updateButtons('playing');
    });

    // 暂停/继续游戏
    UI.elements.pauseBtn.addEventListener('click', () => {
        game.togglePause();
        const state = game.getState();

        if (state.isPaused) {
            UI.showOverlay('游戏暂停', '按 [空格键] 或点击继续按钮继续游戏');
            UI.updateButtons('paused');
        } else {
            UI.hideOverlay();
            UI.updateButtons('playing');
        }
    });

    // 键盘控制
    document.addEventListener('keydown', (e) => {
        // 只在游戏界面响应
        if (UI.elements.gameScreen.classList.contains('hidden')) return;

        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                e.preventDefault();
                game.setDirection('up');
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                e.preventDefault();
                game.setDirection('down');
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                e.preventDefault();
                game.setDirection('left');
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                e.preventDefault();
                game.setDirection('right');
                break;
            case ' ':
                e.preventDefault();
                if (!game.isRunning || game.isPaused) {
                    // 开始或继续游戏
                    UI.hideOverlay();
                    game.start();
                    UI.updateButtons('playing');
                } else {
                    // 暂停游戏
                    game.pause();
                    UI.showOverlay('游戏暂停', '按 [空格键] 或点击继续按钮继续游戏');
                    UI.updateButtons('paused');
                }
                break;
        }
    });
}

// DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initApp);
