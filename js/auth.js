/**
 * auth.js - 用户认证模块
 * 负责登录、注册、登出和游客模式
 */

const Auth = {
    /**
     * 用户注册
     * @param {string} username - 用户名
     * @param {string} password - 密码
     * @returns {Object} 结果对象 {success, message}
     */
    register(username, password) {
        // 验证输入
        if (!username || username.trim().length < 2) {
            return { success: false, message: '用户名至少需要2个字符' };
        }
        if (!password || password.length < 4) {
            return { success: false, message: '密码至少需要4个字符' };
        }

        const usersData = Storage.getUsers();

        // 检查用户名是否已存在
        if (usersData.users[username]) {
            return { success: false, message: '用户名已存在' };
        }

        // 创建新用户
        const now = new Date().toISOString();
        usersData.users[username] = {
            password: Storage.simpleHash(password),
            createdAt: now,
            lastLogin: null,
            loginHistory: []
        };

        Storage.saveUsers(usersData);
        return { success: true, message: '注册成功！请登录' };
    },

    /**
     * 用户登录
     * @param {string} username - 用户名
     * @param {string} password - 密码
     * @returns {Object} 结果对象 {success, message}
     */
    login(username, password) {
        if (!username || !password) {
            return { success: false, message: '请输入用户名和密码' };
        }

        const usersData = Storage.getUsers();
        const user = usersData.users[username];

        if (!user) {
            return { success: false, message: '用户不存在' };
        }

        if (user.password !== Storage.simpleHash(password)) {
            return { success: false, message: '密码错误' };
        }

        // 更新登录时间和历史
        const now = new Date().toISOString();
        user.lastLogin = now;

        if (!user.loginHistory) {
            user.loginHistory = [];
        }
        user.loginHistory.unshift(now);

        // 最多保留10条登录记录
        if (user.loginHistory.length > 10) {
            user.loginHistory = user.loginHistory.slice(0, 10);
        }

        Storage.saveUsers(usersData);

        // 创建会话
        Storage.saveSession({
            currentUser: username,
            loginTime: now,
            isGuest: false
        });

        return { success: true, message: '登录成功' };
    },

    /**
     * 游客模式登录
     * @returns {Object} 结果对象 {success, message}
     */
    guestLogin() {
        const now = new Date().toISOString();
        const guestId = '游客_' + Math.random().toString(36).substring(2, 8);

        // 创建游客会话
        Storage.saveSession({
            currentUser: guestId,
            loginTime: now,
            isGuest: true
        });

        return { success: true, message: '游客模式已启动', username: guestId };
    },

    /**
     * 用户登出
     */
    logout() {
        Storage.clearSession();
    },

    /**
     * 检查是否已登录
     * @returns {boolean}
     */
    isLoggedIn() {
        const session = Storage.getSession();
        return session !== null && session.currentUser;
    },

    /**
     * 检查是否为游客
     * @returns {boolean}
     */
    isGuest() {
        const session = Storage.getSession();
        return session?.isGuest === true;
    },

    /**
     * 获取当前登录用户名
     * @returns {string|null}
     */
    getCurrentUser() {
        const session = Storage.getSession();
        return session?.currentUser || null;
    },

    /**
     * 获取当前登录时间
     * @returns {string|null}
     */
    getLoginTime() {
        const session = Storage.getSession();
        return session?.loginTime || null;
    }
};
