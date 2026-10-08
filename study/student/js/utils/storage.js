/**
 * utils/storage —— 学生端公共存储工具
 *
 * 统一 currentUser / registeredUsers 的本地读写，避免各页面重复实现。
 * 以经典脚本（非 module）方式加载，挂到 window.AppStorage 上，同时保留
 * window.getCurrentUser 这一全局函数，兼容原有页面的调用方式。
 */
(function (global) {
    'use strict';

    var CURRENT_USER_KEY = 'currentUser';
    var REGISTERED_USERS_KEY = 'registeredUsers';

    /**
     * 读取当前登录用户，不存在或解析失败返回 null
     */
    function getCurrentUser() {
        var userStr = global.localStorage.getItem(CURRENT_USER_KEY);
        if (!userStr) return null;
        try {
            return JSON.parse(userStr);
        } catch (e) {
            console.error('解析当前用户失败:', e);
            return null;
        }
    }

    /**
     * 写入当前登录用户
     */
    function setCurrentUser(user) {
        global.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    }

    /**
     * 清除登录态
     */
    function clearCurrentUser() {
        global.localStorage.removeItem(CURRENT_USER_KEY);
    }

    /**
     * 取名字首字，用于头像占位
     */
    function getInitial(name, fallback) {
        return String(name || fallback || '用').charAt(0);
    }

    /**
     * 读取本地缓存的注册用户列表
     */
    function getRegisteredUsers() {
        var stored = global.localStorage.getItem(REGISTERED_USERS_KEY);
        if (!stored) return [];
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('解析注册用户数据失败:', e);
            return [];
        }
    }

    /**
     * 覆盖写入注册用户列表
     */
    function saveRegisteredUsers(list) {
        global.localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(list));
    }

    /**
     * 新增或更新一条注册用户缓存
     */
    function upsertRegisteredUser(user) {
        var list = getRegisteredUsers();
        var index = -1;
        for (var i = 0; i < list.length; i++) {
            if (list[i].username === user.username) { index = i; break; }
        }
        if (index !== -1) list[index] = user;
        else list.push(user);
        saveRegisteredUsers(list);
        return list;
    }

    /**
     * 通用 JSON 读取（带默认值）
     */
    function readJSON(key, defaultValue) {
        var raw = global.localStorage.getItem(key);
        if (!raw) return defaultValue;
        try {
            return JSON.parse(raw);
        } catch (e) {
            return defaultValue;
        }
    }

    /**
     * 通用 JSON 写入
     */
    function writeJSON(key, value) {
        global.localStorage.setItem(key, JSON.stringify(value));
    }

    global.AppStorage = {
        CURRENT_USER_KEY: CURRENT_USER_KEY,
        REGISTERED_USERS_KEY: REGISTERED_USERS_KEY,
        getCurrentUser: getCurrentUser,
        setCurrentUser: setCurrentUser,
        clearCurrentUser: clearCurrentUser,
        getInitial: getInitial,
        getRegisteredUsers: getRegisteredUsers,
        saveRegisteredUsers: saveRegisteredUsers,
        upsertRegisteredUser: upsertRegisteredUser,
        readJSON: readJSON,
        writeJSON: writeJSON
    };

    // 兼容原有页面直接在全局调用 getCurrentUser()
    global.getCurrentUser = getCurrentUser;
})(window);
