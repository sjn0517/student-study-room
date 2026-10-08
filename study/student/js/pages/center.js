/**
 * pages/center —— 个人中心页逻辑
 *
 * 由 个人中心.html 的内联脚本抽出；顶栏、提示、弹窗改为复用公共组件。
 */
(function (global) {
    'use strict';

    var AppStorage = global.AppStorage;

    // ====================== 用户信息 ======================
    /** 加载并展示用户信息 */
    function loadUserInfo() {
        var user = AppStorage.getCurrentUser();
        if (!user) {
            global.showToast('请先登录');
            setTimeout(function () {
                global.location.href = '登录.html';
            }, 1500);
            return;
        }

        var mainUserName = document.getElementById('mainUserName');
        var mainUserId = document.getElementById('mainUserId');
        var mainAvatar = document.getElementById('mainAvatar');
        var quickInfoAvatar = document.getElementById('quickInfoAvatar');
        var quickInfoName = document.getElementById('quickInfoName');
        var creditScoreDisplay = document.getElementById('creditScoreDisplay');
        var creditScoreValue = document.getElementById('creditScoreValue');
        var creditProgressFill = document.getElementById('creditProgressFill');
        var creditScoreMax = document.querySelector('.credit-score-max');
        var collegeText = document.getElementById('collegeText');

        if (mainUserName) mainUserName.textContent = user.name || '用户';
        if (mainUserId) mainUserId.textContent = '学号: ' + user.username;
        if (mainAvatar) mainAvatar.textContent = AppStorage.getInitial(user.name, '用');
        if (quickInfoAvatar) quickInfoAvatar.textContent = AppStorage.getInitial(user.name, '用');
        if (quickInfoName) quickInfoName.innerHTML = '<i class="fas fa-user-graduate"></i> ' + (user.name || '用户') + '同学';
        if (collegeText) collegeText.textContent = user.college || '计算机科学与技术学院';

        var creditScore = user.credit_score || 85;
        if (creditScoreDisplay) creditScoreDisplay.textContent = creditScore;
        if (creditScoreValue) creditScoreValue.textContent = creditScore;
        if (creditProgressFill) creditProgressFill.style.width = creditScore + '%';
        if (creditScoreMax) creditScoreMax.textContent = creditScore + '/100';

        var creditLevel = document.getElementById('creditLevel');
        if (creditLevel) {
            if (creditScore >= 90) creditLevel.textContent = '优秀';
            else if (creditScore >= 70) creditLevel.textContent = '良好';
            else if (creditScore >= 60) creditLevel.textContent = '及格';
            else creditLevel.textContent = '较差';
        }
    }

    // ====================== 编辑个人信息 ======================
    function openEditProfileModal() {
        var user = AppStorage.getCurrentUser();
        if (!user) return;

        document.getElementById('editName').value = user.name || '';
        document.getElementById('editCollege').value = user.college || '';
        document.getElementById('editPhone').value = user.phone || '';
        document.getElementById('editEmail').value = user.email || '';

        global.openModal('editProfileModal');
    }

    function closeEditProfileModal() {
        global.closeModal('editProfileModal');
        document.getElementById('editName').value = '';
        document.getElementById('editCollege').value = '';
        document.getElementById('editPhone').value = '';
        document.getElementById('editEmail').value = '';
    }

    async function saveProfile() {
        var user = AppStorage.getCurrentUser();
        if (!user) return;

        var name = document.getElementById('editName').value.trim();
        var college = document.getElementById('editCollege').value.trim();
        var phone = document.getElementById('editPhone').value.trim();
        var email = document.getElementById('editEmail').value.trim();

        if (!name) {
            global.showToast('请输入姓名');
            return;
        }

        user.name = name;
        user.college = college;
        user.phone = phone;
        user.email = email;
        AppStorage.setCurrentUser(user);

        try {
            var response = await fetch('/api/update-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user)
            });
            var result = await response.json();
            if (!result.success) {
                console.error('更新个人信息失败:', result.error);
            }
        } catch (error) {
            console.error('更新个人信息失败:', error);
        }

        loadUserInfo();

        var collegeText = document.getElementById('collegeText');
        if (collegeText && college) {
            collegeText.textContent = college;
        }

        closeEditProfileModal();
        global.showToast('个人信息更新成功');
    }

    // ====================== 修改密码 ======================
    function openChangePasswordModal() {
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        global.openModal('changePasswordModal');
    }

    function closeChangePasswordModal() {
        global.closeModal('changePasswordModal');
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
    }

    async function savePassword() {
        var user = AppStorage.getCurrentUser();
        if (!user) return;

        var currentPassword = document.getElementById('currentPassword').value.trim();
        var newPassword = document.getElementById('newPassword').value.trim();
        var confirmPassword = document.getElementById('confirmPassword').value.trim();

        if (currentPassword !== user.password) {
            global.showToast('当前密码不正确');
            return;
        }
        if (newPassword.length < 6) {
            global.showToast('新密码长度至少为6位');
            return;
        }
        if (newPassword !== confirmPassword) {
            global.showToast('两次输入的密码不一致');
            return;
        }

        user.password = newPassword;
        AppStorage.setCurrentUser(user);

        try {
            var response = await fetch('/api/update-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user.username, newPassword: newPassword })
            });

            if (!response.ok) {
                global.showToast('密码修改失败: 服务器错误 ' + response.status);
                return;
            }

            var result = await response.json();
            if (result.success) {
                global.showToast('密码修改成功');
            } else {
                global.showToast('密码修改失败: ' + result.error);
                return;
            }
        } catch (error) {
            console.error('更新密码失败:', error);
            if (error.message.includes('Failed to fetch')) {
                global.showToast('请通过服务器访问页面');
            } else {
                global.showToast('密码修改失败，请稍后重试');
            }
            return;
        }

        closeChangePasswordModal();
    }

    // ====================== 退出登录 ======================
    function logout() {
        if (confirm('确定要退出登录吗？')) {
            AppStorage.clearCurrentUser();
            global.showToast('已退出登录');
            setTimeout(function () {
                global.location.href = '登录.html';
            }, 1000);
        }
    }

    // ====================== 预约记录 ======================
    var allReservations = [];
    var currentTab = 'all';

    function getStatusInfo(status) {
        var statusMap = {
            'confirmed': { text: '已确认', class: 'confirmed' },
            'pending': { text: '进行中', class: 'pending' },
            'completed': { text: '已完成', class: 'completed' },
            'cancelled': { text: '已取消', class: 'cancelled' },
            'checked_in': { text: '已签到', class: 'checked_in' }
        };
        return statusMap[status] || { text: '未知', class: 'unknown' };
    }

    async function fetchReservations() {
        var user = AppStorage.getCurrentUser();
        if (!user) return;

        try {
            var response = await fetch('/api/reservations?userId=' + user.username);
            var result = await response.json();

            if (result.success) {
                allReservations = result.reservations;
                renderReservations(allReservations);
                updateUserStats();
            } else {
                console.error('获取预约记录失败:', result.error);
            }
        } catch (error) {
            console.error('获取预约记录失败:', error);
            if (error.message.includes('Failed to fetch')) {
                console.log('使用本地模拟数据');
                allReservations = [
                    { id: 1, seatNumber: 'A01', time: '2024-01-15 08:00-10:00', duration: '2小时', status: 'completed' },
                    { id: 2, seatNumber: 'B05', time: '2024-01-16 14:00-16:00', duration: '2小时', status: 'completed' },
                    { id: 3, seatNumber: 'C03', time: '2024-01-17 10:00-12:00', duration: '2小时', status: 'pending' },
                    { id: 4, seatNumber: 'A08', time: '2024-01-18 09:00-11:00', duration: '2小时', status: 'confirmed' },
                    { id: 5, seatNumber: 'D02', time: '2024-01-12 14:00-16:00', duration: '2小时', status: 'cancelled' }
                ];
                renderReservations(allReservations);
                updateUserStats();
            }
        }
    }

    function renderReservations(reservations) {
        var tbody = document.getElementById('reservationsTableBody');
        var noReservations = document.getElementById('noReservations');

        if (!tbody || !noReservations) return;

        if (reservations.length === 0) {
            tbody.innerHTML = '';
            noReservations.style.display = 'block';
            return;
        }

        noReservations.style.display = 'none';

        tbody.innerHTML = reservations.map(function (res) {
            var statusInfo = getStatusInfo(res.status);
            return '<tr>' +
                '<td>' + (res.seatNumber || res.seatNo) + '</td>' +
                '<td>' + res.time + '</td>' +
                '<td>' + res.duration + '</td>' +
                '<td><span class="status-badge ' + statusInfo.class + '">' + statusInfo.text + '</span></td>' +
                '<td><button class="action-btn" onclick="showReservationDetail(' + res.id + ')">详情</button></td>' +
            '</tr>';
        }).join('');
    }

    function filterReservations(tab) {
        currentTab = tab;

        var filtered = [];
        switch (tab) {
            case 'all':
                filtered = allReservations;
                break;
            case 'active':
                filtered = allReservations.filter(function (res) {
                    return res.status === 'pending' || res.status === 'confirmed' || res.status === 'checked_in';
                });
                break;
            case 'history':
                filtered = allReservations.filter(function (res) {
                    return res.status === 'completed' || res.status === 'cancelled';
                });
                break;
            default:
                filtered = allReservations;
        }

        renderReservations(filtered);
    }

    function updateUserStats() {
        var totalReservations = document.getElementById('totalReservations');
        var totalHours = document.getElementById('totalHours');
        var successRate = document.getElementById('successRate');

        if (!totalReservations || !totalHours || !successRate) return;

        var total = allReservations.length;

        var hours = 0;
        allReservations.forEach(function (res) {
            var match = res.duration.match(/(\d+)小时/);
            if (match) {
                hours += parseInt(match[1]);
            }
        });

        var completedCount = allReservations.filter(function (r) { return r.status === 'completed'; }).length;
        var rate = total > 0 ? Math.round((completedCount / total) * 100) : 100;

        totalReservations.textContent = total;
        totalHours.textContent = hours;
        successRate.textContent = rate + '%';
    }

    function showReservationDetail(id) {
        var reservation = allReservations.find(function (r) { return r.id === id; });
        if (!reservation) return;

        global.showToast('查看详情');
    }

    // ====================== 个人设置 ======================
    function saveSettings() {
        var settings = {
            notificationSetting: document.getElementById('notificationSetting').value,
            autoCheckin: document.getElementById('autoCheckin').value,
            privacySetting: document.getElementById('privacySetting').checked
        };

        AppStorage.writeJSON('userSettings', settings);
        global.showToast('设置保存成功');
    }

    function resetSettings() {
        document.getElementById('notificationSetting').value = 'important';
        document.getElementById('autoCheckin').value = 'disabled';
        document.getElementById('privacySetting').checked = true;
        global.localStorage.removeItem('userSettings');
        global.showToast('已恢复默认设置');
    }

    // ====================== 初始化 ======================
    document.addEventListener('DOMContentLoaded', function () {
        loadUserInfo();
        fetchReservations();

        document.getElementById('editProfileBtn').addEventListener('click', openEditProfileModal);
        document.getElementById('changePasswordBtn').addEventListener('click', openChangePasswordModal);
        document.getElementById('logoutBtn').addEventListener('click', logout);

        document.getElementById('cancelEditBtn').addEventListener('click', closeEditProfileModal);
        document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);

        document.getElementById('cancelPasswordBtn').addEventListener('click', closeChangePasswordModal);
        document.getElementById('savePasswordBtn').addEventListener('click', savePassword);

        document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
        document.getElementById('resetSettingsBtn').addEventListener('click', resetSettings);

        document.getElementById('goToBooking').addEventListener('click', function () {
            global.location.href = 'index.html';
        });

        var tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(function (btn) {
            btn.addEventListener('click', function () {
                tabButtons.forEach(function (b) { b.classList.remove('active'); });
                this.classList.add('active');
                filterReservations(this.getAttribute('data-tab'));
            });
        });
    });

    // 预约表格里的"详情"按钮使用内联 onclick，需要全局可见
    global.showReservationDetail = showReservationDetail;
})(window);
