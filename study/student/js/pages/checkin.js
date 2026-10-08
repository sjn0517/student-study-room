/**
 * pages/checkin —— 智能签到页逻辑
 *
 * 由 签到.html 的内联脚本抽出；顶栏、提示、弹窗改为复用公共组件
 * （showToast / openModal / closeModal 由 components 提供）。
 */
(function (global) {
    'use strict';

    // ====================== 模拟数据 ======================
    var mockData = {
        currentReservation: {
            seat: 'S205',
            date: '2025-04-05',
            startTime: '14:00',
            endTime: '18:00',
            duration: 4,
            status: 'pending'
        },
        userStats: {
            checkinCount: 24,
            successRate: 96,
            lateCount: 2,
            streakDays: 5,
            creditScore: 85
        },
        checkinHistory: [
            { id: 1, date: '2025-04-04', time: '08:05', seat: 'S104', status: 'success', isLate: false },
            { id: 2, date: '2025-04-03', time: '13:58', seat: 'S203', status: 'success', isLate: false },
            { id: 3, date: '2025-04-02', time: '10:12', seat: 'S101', status: 'late', isLate: true },
            { id: 4, date: '2025-04-01', time: '15:01', seat: 'S205', status: 'success', isLate: false },
            { id: 5, date: '2025-03-31', time: '19:05', seat: 'S102', status: 'success', isLate: false }
        ]
    };

    // ====================== 状态 ======================
    var currentMethod = 'location';
    var checkinStatus = 'pending'; // pending, checking, success, error
    var dynamicCode = generateDynamicCode();
    var codeTimer = 60;
    var locationAccessGranted = false;
    var timerInterval = null;

    // ====================== 页面初始化 ======================
    function initPage() {
        loadUserData();
        loadCheckinHistory();
        initLocationCheckin();
        initCodeCheckin();
        bindEvents();
    }

    /** 渲染当前预约、统计数据与顶栏信用分 */
    function loadUserData() {
        var reservation = mockData.currentReservation;
        var stats = mockData.userStats;

        document.getElementById('currentSeat').textContent = reservation.seat;
        document.getElementById('currentTime').textContent = '今天 ' + reservation.startTime + ' - ' + reservation.endTime;
        document.getElementById('resDuration').textContent = '时长: ' + reservation.duration + '小时';

        document.getElementById('checkinCount').textContent = stats.checkinCount;
        document.getElementById('successRate').textContent = stats.successRate + '%';
        document.getElementById('lateCount').textContent = stats.lateCount;
        document.getElementById('streakDays').textContent = stats.streakDays;

        var creditBadge = document.querySelector('.credit-badge');
        if (creditBadge) {
            creditBadge.innerHTML = '<i class="fas fa-star"></i> 信用分: ' + stats.creditScore;
        }
    }

    /** 渲染最近签到记录 */
    function loadCheckinHistory() {
        var historyList = document.getElementById('checkinHistory');
        historyList.innerHTML = '';

        mockData.checkinHistory.forEach(function (record) {
            var historyItem = document.createElement('div');
            historyItem.className = 'history-item';

            var statusClass = 'success';
            var statusText = '成功';

            if (record.status === 'late') {
                statusClass = 'late';
                statusText = '迟到';
            }

            historyItem.innerHTML =
                '<div>' +
                    '<div class="history-time">' + record.date + ' ' + record.time + '</div>' +
                    '<div class="history-seat">' + record.seat + '</div>' +
                '</div>' +
                '<div class="history-status ' + statusClass + '">' + statusText + '</div>';

            historyList.appendChild(historyItem);
        });
    }

    // ====================== 位置验证 ======================
    /** 把"位置检测通过/未通过"的结果写进界面 */
    function applyLocationResult(isInRange, withToast) {
        var statusIndicator = document.getElementById('locationStatus');
        var statusMessage = document.getElementById('locationMessage');
        var checkinBtn = document.getElementById('locationCheckinBtn');
        var distanceInfo = document.getElementById('currentDistance');

        if (isInRange) {
            statusIndicator.classList.add('active');
            statusMessage.textContent = '检测到您在自习室范围内';
            distanceInfo.innerHTML = '<i class="fas fa-location-dot"></i> 当前位置: 自习室25米内';
            checkinBtn.disabled = false;
            checkinBtn.innerHTML = '<i class="fas fa-map-marker-alt"></i><span>立即签到</span>';
            locationAccessGranted = true;
            if (withToast) global.showToast('位置验证通过', 'success');
        } else {
            statusMessage.textContent = '您不在自习室范围内';
            distanceInfo.innerHTML = '<i class="fas fa-location-dot"></i> 当前位置: 距离自习室120米';
            checkinBtn.disabled = true;
            checkinBtn.innerHTML = '<i class="fas fa-exclamation-circle"></i><span>不在签到范围内</span>';
            locationAccessGranted = false;
        }
    }

    function initLocationCheckin() {
        // 模拟位置检测
        setTimeout(function () {
            applyLocationResult(Math.random() > 0.2, false); // 80% 概率在范围内
        }, 2000);
    }

    function resetLocationCheckin() {
        var statusIndicator = document.getElementById('locationStatus');
        var statusMessage = document.getElementById('locationMessage');
        var checkinBtn = document.getElementById('locationCheckinBtn');
        var distanceInfo = document.getElementById('currentDistance');

        statusIndicator.classList.remove('active');
        statusMessage.textContent = '正在重新检测您的位置...';
        distanceInfo.innerHTML = '<i class="fas fa-location-dot"></i> 正在获取当前位置...';
        checkinBtn.disabled = true;
        checkinBtn.innerHTML = '<i class="fas fa-map-marker-alt"></i><span>等待位置验证...</span>';
        locationAccessGranted = false;

        setTimeout(function () {
            applyLocationResult(Math.random() > 0.2, true);
        }, 1500);
    }

    // ====================== 签到码验证 ======================
    function generateDynamicCode() {
        return Array.from({ length: 6 }, function () {
            return Math.floor(Math.random() * 10);
        }).join('');
    }

    function initCodeCheckin() {
        document.getElementById('dynamicCode').textContent = dynamicCode.split('').join(' ');

        startCodeTimer();

        var codeInput = document.getElementById('codeInput');
        var checkinBtn = document.getElementById('codeCheckinBtn');

        codeInput.addEventListener('input', function () {
            if (this.value.length === 6) {
                checkinBtn.disabled = false;
                checkinBtn.innerHTML = '<i class="fas fa-check-circle"></i><span>验证签到码</span>';
            } else {
                checkinBtn.disabled = true;
                checkinBtn.innerHTML = '<i class="fas fa-check-circle"></i><span>请先输入签到码</span>';
            }
        });
    }

    function startCodeTimer() {
        var timerElement = document.getElementById('codeTimer');
        var codeDisplay = document.getElementById('dynamicCode');

        if (timerInterval) {
            clearInterval(timerInterval);
        }

        timerInterval = setInterval(function () {
            codeTimer--;
            timerElement.textContent = codeTimer;

            if (codeTimer <= 10) {
                timerElement.style.color = '#ef4444';
            }

            if (codeTimer <= 0) {
                clearInterval(timerInterval);
                dynamicCode = generateDynamicCode();
                codeDisplay.textContent = dynamicCode.split('').join(' ');
                codeTimer = 60;
                timerElement.textContent = codeTimer;
                timerElement.style.color = '#3b82f6';
                startCodeTimer();
            }
        }, 1000);
    }

    // ====================== 事件绑定 ======================
    function bindEvents() {
        // 签到方式切换
        document.querySelectorAll('.method-tab').forEach(function (tab) {
            tab.addEventListener('click', function () {
                var method = this.dataset.method;

                document.querySelectorAll('.method-tab').forEach(function (t) {
                    t.classList.remove('active');
                });
                this.classList.add('active');

                document.querySelectorAll('.checkin-content > div').forEach(function (content) {
                    content.style.display = 'none';
                });
                document.getElementById(method + '-checkin').style.display = 'block';

                currentMethod = method;
            });
        });

        // 位置验证签到
        document.getElementById('locationCheckinBtn').addEventListener('click', function () {
            if (!this.disabled) {
                performCheckin('location');
            }
        });

        // 签到码验证
        document.getElementById('codeCheckinBtn').addEventListener('click', function () {
            if (this.disabled) return;
            var inputCode = document.getElementById('codeInput').value;
            if (inputCode === dynamicCode) {
                performCheckin('code');
            } else {
                showErrorModal('签到码错误', '请输入正确的6位动态签到码');
            }
        });

        // 弹窗按钮
        document.getElementById('closeModalBtn').addEventListener('click', function () {
            global.closeModal('successModal');
        });

        document.getElementById('viewDetailsBtn').addEventListener('click', function () {
            global.closeModal('successModal');
            global.showToast('查看签到详情（功能演示）', 'info');
        });

        document.getElementById('retryBtn').addEventListener('click', function () {
            global.closeModal('errorModal');
            if (currentMethod === 'location') {
                resetLocationCheckin();
            } else if (currentMethod === 'code') {
                document.getElementById('codeInput').value = '';
                document.getElementById('codeCheckinBtn').disabled = true;
            }
        });

        document.getElementById('tryOtherMethodBtn').addEventListener('click', function () {
            global.closeModal('errorModal');
            if (currentMethod === 'location') {
                document.querySelector('.method-tab[data-method="code"]').click();
            } else {
                document.querySelector('.method-tab[data-method="location"]').click();
            }
        });
    }

    // ====================== 执行签到 ======================
    function performCheckin(method) {
        if (checkinStatus === 'checking') return;

        checkinStatus = 'checking';

        var checkinBtn = method === 'location'
            ? document.getElementById('locationCheckinBtn')
            : document.getElementById('codeCheckinBtn');

        checkinBtn.disabled = true;
        checkinBtn.innerHTML = '<div class="loading"></div><span>签到中...</span>';

        setTimeout(function () {
            var isSuccess = Math.random() > 0.1; // 90% 成功率

            if (isSuccess) {
                handleCheckinSuccess(checkinBtn, method);
            } else {
                showErrorModal('签到失败', '网络连接不稳定，请稍后重试');
            }

            checkinStatus = 'pending';
            restoreCheckinButton(checkinBtn, method);
        }, 2000);
    }

    /** 签到成功：计算信用分变化、更新界面与记录 */
    function handleCheckinSuccess(checkinBtn, method) {
        var now = new Date();
        var checkinTime = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

        var reservationTime = mockData.currentReservation.startTime;
        var parts = reservationTime.split(':').map(Number);
        var resDate = new Date();
        resDate.setHours(parts[0], parts[1], 0, 0);

        var diffMinutes = Math.floor((now - resDate) / (1000 * 60));
        var creditChange = 2; // 正常签到 +2
        var isLate = false;

        if (diffMinutes > 0 && diffMinutes <= 15) {
            creditChange = 0;
            isLate = true;
        } else if (diffMinutes > 15) {
            creditChange = -5;
            isLate = true;
        } else if (diffMinutes < -5) {
            creditChange = 3;
        }

        mockData.userStats.creditScore += creditChange;

        document.getElementById('successTitle').textContent =
            isLate ? (diffMinutes > 15 ? '签到完成（迟到）' : '签到完成') : '签到成功！';

        document.getElementById('successMessage').innerHTML =
            '您已成功签到座位 <span class="res-seat">' + mockData.currentReservation.seat + '</span><br>' +
            '签到时间: <span id="checkinTime">' + checkinTime + '</span><br>' +
            (creditChange > 0
                ? '<span style="color: #10b981; font-weight: 600;">信用分 +' + creditChange + '</span>'
                : creditChange < 0
                    ? '<span style="color: #ef4444; font-weight: 600;">信用分 ' + creditChange + '</span>'
                    : '<span style="color: #64748b; font-weight: 600;">信用分无变化</span>');

        global.openModal('successModal');

        mockData.userStats.checkinCount++;
        mockData.userStats.streakDays++;
        if (isLate) mockData.userStats.lateCount++;

        loadUserData();

        mockData.checkinHistory.unshift({
            id: mockData.checkinHistory.length + 1,
            date: now.toISOString().split('T')[0],
            time: checkinTime,
            seat: mockData.currentReservation.seat,
            status: isLate ? 'late' : 'success',
            isLate: isLate
        });
        loadCheckinHistory();
    }

    /** 恢复签到按钮的可点击状态 */
    function restoreCheckinButton(checkinBtn, method) {
        if (method === 'location') {
            checkinBtn.disabled = !locationAccessGranted;
            checkinBtn.innerHTML = locationAccessGranted
                ? '<i class="fas fa-map-marker-alt"></i><span>立即签到</span>'
                : '<i class="fas fa-map-marker-alt"></i><span>等待位置验证...</span>';
        } else {
            checkinBtn.disabled = document.getElementById('codeInput').value.length !== 6;
            checkinBtn.innerHTML = checkinBtn.disabled
                ? '<i class="fas fa-check-circle"></i><span>请先输入签到码</span>'
                : '<i class="fas fa-check-circle"></i><span>验证签到码</span>';
        }
    }

    /** 展示错误弹窗 */
    function showErrorModal(title, message) {
        document.getElementById('errorTitle').textContent = title;
        document.getElementById('errorMessage').textContent = message;
        global.openModal('errorModal');
    }

    // ====================== 启动 ======================
    document.addEventListener('DOMContentLoaded', function () {
        initPage();

        // 模拟实时位置更新
        setInterval(function () {
            if (currentMethod === 'location' && !locationAccessGranted) {
                if (Math.random() > 0.3) {
                    var statusIndicator = document.getElementById('locationStatus');
                    if (!statusIndicator.classList.contains('active')) {
                        applyLocationResult(true, false);
                        global.showToast('已进入签到范围', 'success');
                    }
                }
            }
        }, 5000);
    });

    global.CheckinPage = { mockData: mockData };
})(window);
