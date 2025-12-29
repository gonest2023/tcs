/**
 * storage.js - 本地存储管理模块
 * 负责用户数据和游戏记录的持久化存储
 */

const Storage = {
    // 存储键名
    KEYS: {
        USERS: 'snake_users',
        SESSION: 'snake_session',
        SCORES: 'snake_scores'
    },

    /**
     * 初始化存储
     * 确保所有必需的存储结构存在
     */
    init() {
        if (!localStorage.getItem(this.KEYS.USERS)) {
            localStorage.setItem(this.KEYS.USERS, JSON.stringify({ users: {} }));
        }
        if (!localStorage.getItem(this.KEYS.SCORES)) {
            localStorage.setItem(this.KEYS.SCORES, JSON.stringify({}));
        }
    },

    /**
     * 获取所有用户数据
     * @returns {Object} 用户数据对象
     */
    getUsers() {
        const data = localStorage.getItem(this.KEYS.USERS);
        return data ? JSON.parse(data) : { users: {} };
    },

    /**
     * 保存用户数据
     * @param {Object} usersData - 用户数据对象
     */
    saveUsers(usersData) {
        localStorage.setItem(this.KEYS.USERS, JSON.stringify(usersData));
    },

    /**
     * 获取当前会话
     * @returns {Object|null} 会话数据或null
     */
    getSession() {
        const data = localStorage.getItem(this.KEYS.SESSION);
        return data ? JSON.parse(data) : null;
    },

    /**
     * 保存会话
     * @param {Object} sessionData - 会话数据
     */
    saveSession(sessionData) {
        localStorage.setItem(this.KEYS.SESSION, JSON.stringify(sessionData));
    },

    /**
     * 清除会话
     */
    clearSession() {
        localStorage.removeItem(this.KEYS.SESSION);
    },

    /**
     * 获取所有分数数据
     * @returns {Object} 分数数据对象
     */
    getScores() {
        const data = localStorage.getItem(this.KEYS.SCORES);
        return data ? JSON.parse(data) : {};
    },

    /**
     * 保存分数数据
     * @param {Object} scoresData - 分数数据对象
     */
    saveScores(scoresData) {
        localStorage.setItem(this.KEYS.SCORES, JSON.stringify(scoresData));
    },

    /**
     * 记录用户游戏分数
     * @param {string} username - 用户名
     * @param {number} score - 分数
     * @param {number} duration - 游戏时长（秒）
     */
    recordGameScore(username, score, duration) {
        const scores = this.getScores();
        
        if (!scores[username]) {
            scores[username] = {
                highScore: 0,
                totalGames: 0,
                history: []
            };
        }

        const userScores = scores[username];
        
        // 更新最高分
        if (score > userScores.highScore) {
            userScores.highScore = score;
        }

        // 增加游戏计数
        userScores.totalGames++;

        // 添加历史记录（最多保留20条）
        userScores.history.unshift({
            score: score,
            duration: duration,
            playedAt: new Date().toISOString()
        });

        if (userScores.history.length > 20) {
            userScores.history = userScores.history.slice(0, 20);
        }

        this.saveScores(scores);
    },

    /**
     * 获取用户的最高分
     * @param {string} username - 用户名
     * @returns {number} 最高分
     */
    getHighScore(username) {
        const scores = this.getScores();
        return scores[username]?.highScore || 0;
    },

    /**
     * 获取用户的游戏历史
     * @param {string} username - 用户名
     * @param {number} limit - 返回条数限制
     * @returns {Array} 游戏历史数组
     */
    getGameHistory(username, limit = 5) {
        const scores = this.getScores();
        const history = scores[username]?.history || [];
        return history.slice(0, limit);
    },

    /**
     * 获取用户的登录历史
     * @param {string} username - 用户名
     * @param {number} limit - 返回条数限制
     * @returns {Array} 登录历史数组
     */
    getLoginHistory(username, limit = 5) {
        const users = this.getUsers();
        const user = users.users[username];
        if (!user || !user.loginHistory) {
            return [];
        }
        return user.loginHistory.slice(0, limit);
    },

    /**
     * 简单的字符串哈希函数
     * 注意：这只是演示用途，不适用于生产环境的密码存储
     * @param {string} str - 要哈希的字符串
     * @returns {string} 哈希值
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(16);
    }
};

// 页面加载时初始化存储
Storage.init();
