/**
 * pages/login —— 登录 / 注册页逻辑
 *
 * 由 登录.html 的内联脚本抽出。页面里的按钮使用内联 onclick，
 * 因此本文件中需要被 onclick 调用的函数会显式挂到 window 上。
 */
(function (global) {
    'use strict';

    var AppStorage = global.AppStorage;

    /** 用户数据（db.json + 本地注册缓存） */
    var users = [];
    var DB_JSON_PATH = './db.json';

    // ====================== 选项卡 ======================
    function switchTab(tab) {
        var studentTab = document.getElementById('studentTab');
        var adminTab = document.getElementById('adminTab');
        var studentForm = document.getElementById('studentForm');
        var adminForm = document.getElementById('adminForm');

        if (tab === 'student') {
            studentTab.classList.add('active');
            adminTab.classList.remove('active');
            studentForm.style.display = 'flex';
            adminForm.style.display = 'none';
        } else {
            adminTab.classList.add('active');
            studentTab.classList.remove('active');
            adminForm.style.display = 'flex';
            studentForm.style.display = 'none';
        }
    }

    // ====================== 用户数据 ======================
    /** 从 db.json 加载用户数据 */
    async function loadUsersFromDB() {
        try {
            var response = await fetch(DB_JSON_PATH);
            var data = await response.json();
            if (data && data.users) {
                users = data.users;
            }
        } catch (error) {
            console.error('加载db.json失败:', error);
            // 加载失败时使用默认数据
            users = [
                { id: 1, username: 'admin', password: 'admin', role: 'admin', name: '系统管理员' },
                { id: 2, username: '20210001', password: '123456', role: 'student', name: '张三', credit_score: 85 },
                { id: 3, username: '20210002', password: '654321', role: 'student', name: '李四', credit_score: 90 }
            ];
        }
        mergeRegisteredUsers();
    }

    /** 合并本地缓存中已注册的用户 */
    function mergeRegisteredUsers() {
        var registeredUsers = AppStorage.getRegisteredUsers();
        var existingUsernames = new Set(users.map(function (u) { return u.username; }));
        registeredUsers.forEach(function (user) {
            if (!existingUsernames.has(user.username)) {
                users.push(user);
            }
        });
    }

    function getUsers() {
        return users;
    }

    /** 把用户写回内存列表（不存在则追加） */
    function upsertUserInMemory(user) {
        var memIndex = users.findIndex(function (u) { return u.username === user.username; });
        if (memIndex !== -1) users[memIndex] = user;
        else users.push(user);
    }

    /**
     * 保存注册用户：优先写服务端 /api/register，
     * 失败时回退到 localStorage 缓存，返回值表示服务端是否写入成功。
     */
    async function saveRegisteredUser(user) {
        try {
            var response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user)
            });

            var result = await response.json();

            if (result.success) {
                upsertUserInMemory(user);
                AppStorage.upsertRegisteredUser(user);
                return true;
            }

            console.error('保存失败:', result.error);
            return false;
        } catch (error) {
            console.error('保存用户失败:', error);
            // 接口不可用时退回 localStorage
            AppStorage.upsertRegisteredUser(user);
            upsertUserInMemory(user);
            return false;
        }
    }

    /** 修改密码（供登录页自身使用，写入服务端 + 本地缓存） */
    async function updateLoginPageUsers(username, newPassword) {
        var index = users.findIndex(function (u) { return u.username === username; });
        if (index === -1) return;

        users[index].password = newPassword;

        try {
            var response = await fetch('/api/update-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username, newPassword: newPassword })
            });
            var result = await response.json();
            if (!result.success) {
                console.error('密码更新失败:', result.error);
            }
        } catch (error) {
            console.error('密码更新失败:', error);
        }

        await saveRegisteredUser(users[index]);
    }

    // ====================== 登录 ======================
    function studentLogin() {
        var username = document.getElementById('studentUsername').value.trim();
        var password = document.getElementById('studentPassword').value.trim();

        if (!username || !password) {
            alert('请输入学号和密码');
            return;
        }

        var user = getUsers().find(function (u) {
            return u.username === username && u.password === password && u.role === 'student';
        });

        if (user) {
            AppStorage.setCurrentUser(user);
            alert('登录成功！欢迎, ' + user.name);
            global.location.href = '/student/index.html';
        } else {
            alert('学号或密码错误');
        }
    }

    function adminLogin() {
        var username = document.getElementById('adminUsername').value.trim();
        var password = document.getElementById('adminPassword').value.trim();

        if (!username || !password) {
            alert('请输入管理员账号和密码');
            return;
        }

        var user = getUsers().find(function (u) {
            return u.username === username && u.password === password && u.role === 'admin';
        });

        if (user) {
            AppStorage.setCurrentUser(user);
            alert('管理员登录成功！即将跳转到管理后台');
            global.location.href = '/admin/';
        } else {
            alert('管理员账号或密码错误');
        }
    }

    // ====================== 注册 ======================
    function openRegisterModal() {
        global.openModal('registerModal');
    }

    function closeRegisterModal() {
        global.closeModal('registerModal');
        document.getElementById('regStudentId').value = '';
        document.getElementById('regName').value = '';
        document.getElementById('regPassword').value = '';
        document.getElementById('regConfirmPassword').value = '';
    }

    async function registerStudent() {
        var studentId = document.getElementById('regStudentId').value.trim();
        var name = document.getElementById('regName').value.trim();
        var password = document.getElementById('regPassword').value.trim();
        var confirmPassword = document.getElementById('regConfirmPassword').value.trim();

        if (!studentId || !name || !password || !confirmPassword) {
            alert('请填写所有字段');
            return;
        }

        if (password !== confirmPassword) {
            alert('两次输入的密码不一致');
            return;
        }

        if (password.length < 6) {
            alert('密码长度至少为6位');
            return;
        }

        var exists = getUsers().find(function (u) { return u.username === studentId; });
        if (exists) {
            alert('该学号已被注册');
            return;
        }

        var newUser = {
            id: users.length + 1,
            username: studentId,
            password: password,
            role: 'student',
            name: name,
            credit_score: 100,
            last_update_time: new Date().toLocaleString('zh-CN')
        };

        var success = await saveRegisteredUser(newUser);

        if (success) {
            alert('注册成功！请登录');
        } else {
            alert('注册成功！（数据已保存到本地缓存）');
        }
        closeRegisterModal();
    }

    // ====================== 初始化 ======================
    document.addEventListener('DOMContentLoaded', function () {
        loadUsersFromDB();
    });

    // 内联 onclick 需要访问的全局函数
    global.switchTab = switchTab;
    global.studentLogin = studentLogin;
    global.adminLogin = adminLogin;
    global.openRegisterModal = openRegisterModal;
    global.closeRegisterModal = closeRegisterModal;
    global.registerStudent = registerStudent;

    // 供其他模块复用
    global.LoginPage = {
        loadUsersFromDB: loadUsersFromDB,
        getUsers: getUsers,
        saveRegisteredUser: saveRegisteredUser,
        updateLoginPageUsers: updateLoginPageUsers
    };
})(window);
