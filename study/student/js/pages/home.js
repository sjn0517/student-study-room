/**
 * pages/home —— 首页（座位地图 + 预约）页面逻辑
 *
 * 由原 `js/index.js` 与 index.html 内联脚本合并而来，
 * 顶栏用户信息、签到按钮等公共能力改为复用 components 下的组件。
 */
(function (global) {
    'use strict';

    var AppStorage = global.AppStorage;

    // ====================== 数据 ======================
    var students = [
        { student_id: '20210001', name: '张三', credit_score: 85, last_update_time: '2025-04-01 10:00:00' }
    ];
    var seats = [];
    var reservations = [
        { reservation_id: 'RES202504010001', student_id: '20210001', seat_id: 'A05', start_time: '2025-04-04 08:00:00', end_time: '2025-04-04 12:00:00', status: '已签到', create_time: '2025-04-01 09:00:00' },
        { reservation_id: 'RES202504020002', student_id: '20210002', seat_id: 'B12', start_time: '2025-04-04 14:00:00', end_time: '2025-04-04 18:00:00', status: '已预约', create_time: '2025-04-02 13:00:00' }
    ];

    /** 当前登录用户：优先取 localStorage，缺失时退回默认值 */
    var CURRENT_USER = (function () {
        var user = AppStorage.getCurrentUser();
        if (user) {
            return {
                student_id: user.username || '20210001',
                name: user.name || '用户',
                credit_score: user.credit_score || 85
            };
        }
        return { student_id: '20210001', name: '张三', credit_score: 85 };
    })();

    var selectedSeatId = null;
    var currentFilter = 'all';

    // ====================== 座位数据 ======================
    function generateSeats() {
        seats = [];
        var seatTypes = ['普通座', '插座座', '静音座'];

        function generateAreaSeats(area, prefix, floor, count) {
            for (var i = 1; i <= count; i++) {
                var seatNumber = i < 10 ? '0' + i : '' + i;
                seats.push({
                    seat_id: prefix + seatNumber,
                    floor: floor,
                    area: area + '区',
                    type: seatTypes[(i - 1) % 3],
                    status: '空闲'
                });
            }
        }

        generateAreaSeats('A', 'A', 1, 30);
        generateAreaSeats('B', 'B', 1, 30);
        generateAreaSeats('C', 'C', 2, 30);
        generateAreaSeats('D', 'D', 2, 30);

        seats.find(function (s) { return s.seat_id === 'A05'; }).status = '占用';
        seats.find(function (s) { return s.seat_id === 'B12'; }).status = '占用';
        seats.find(function (s) { return s.seat_id === 'C10'; }).status = '占用';
        seats.find(function (s) { return s.seat_id === 'D25'; }).status = '占用';
    }

    function persistData() {
        AppStorage.writeJSON('mock_seats', seats);
        AppStorage.writeJSON('mock_reservations', reservations);
        AppStorage.writeJSON('mock_students', students);
    }

    function loadData() {
        var savedSeats = global.localStorage.getItem('mock_seats');
        var savedReservations = global.localStorage.getItem('mock_reservations');
        var savedStudents = global.localStorage.getItem('mock_students');
        if (savedSeats) seats = JSON.parse(savedSeats);
        if (savedReservations) reservations = JSON.parse(savedReservations);
        if (savedStudents) students = JSON.parse(savedStudents);
        var cur = students.find(function (s) { return s.student_id === CURRENT_USER.student_id; });
        if (cur) CURRENT_USER.credit_score = cur.credit_score;
    }

    // ====================== 顶部用户信息 ======================
    function loadUserInfo() {
        var user = AppStorage.getCurrentUser();
        if (!user) {
            // 没有登录态，稍后跳转登录页
            setTimeout(function () {
                global.location.href = './登录.html';
            }, 1000);
            return;
        }

        var userDisplayName = document.getElementById('userDisplayName');
        var userAvatar = document.getElementById('userAvatar');
        var creditScoreDisplay = document.getElementById('creditScoreDisplay');

        if (userDisplayName) {
            userDisplayName.innerHTML = '<i class="fas fa-user-graduate"></i> ' + (user.name || '用户') + '同学';
        }
        if (userAvatar) {
            userAvatar.textContent = AppStorage.getInitial(user.name, '用');
        }
        if (creditScoreDisplay) {
            creditScoreDisplay.textContent = user.credit_score || '85';
        }
    }

    // ====================== 统计与信用分 ======================
    function updateStats() {
        var total = seats.length;
        var available = seats.filter(function (s) { return s.status === '空闲'; }).length;
        document.getElementById('totalSeats').textContent = total;
        document.getElementById('availableSeats').textContent = available;
    }

    function updateCreditUI() {
        var studentObj = students.find(function (s) { return s.student_id === CURRENT_USER.student_id; });
        var score = studentObj ? studentObj.credit_score : 85;
        document.getElementById('creditScoreDisplay').textContent = score;
        document.getElementById('creditScoreBig').textContent = score;
        var violations = reservations.filter(function (r) {
            return r.student_id === CURRENT_USER.student_id && r.status === '违约';
        }).length;
        document.getElementById('violationCount').textContent = violations > 0 ? violations : 1;
    }

    // ====================== 座位渲染 ======================
    function renderSeats() {
        var container = document.getElementById('seatGridContainer');
        if (!container) {
            console.error('seatGridContainer not found');
            return;
        }
        container.innerHTML = '';

        var filteredSeats = seats.filter(function (seat) {
            if (currentFilter === 'all') return true;
            return seat.area === currentFilter;
        });

        if (filteredSeats.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 2rem; color: #64748b;">暂无座位数据</div>';
            return;
        }

        filteredSeats.forEach(function (seat) {
            var seatDiv = document.createElement('div');
            seatDiv.className = 'seat-card ' + (seat.status !== '空闲' ? 'disabled-seat' : '');
            seatDiv.style.cursor = seat.status === '空闲' ? 'pointer' : 'not-allowed';

            var statusText = '';
            var statusClass = '';
            if (seat.status === '空闲') { statusText = '空闲'; statusClass = 'free'; }
            else if (seat.status === '占用') { statusText = '占用'; statusClass = 'occupied'; }
            else if (seat.status === '预约中') { statusText = '预约中'; statusClass = 'reserving'; }
            else { statusText = seat.status; statusClass = 'occupied'; }

            seatDiv.innerHTML =
                '<div class="seat-number">' + seat.seat_id + '</div>' +
                '<div class="seat-area">' + seat.area + ' ' + seat.floor + '楼</div>' +
                '<div class="seat-type">' + seat.type + '</div>' +
                '<div class="status-badge ' + statusClass + '">' + statusText + '</div>';

            if (seat.status === '空闲') {
                seatDiv.addEventListener('click', function (e) {
                    e.stopPropagation();
                    openReservationModal(seat.seat_id);
                });
            }
            container.appendChild(seatDiv);
        });
        updateStats();
    }

    // ====================== 预约弹窗 ======================
    function getReservationModal() {
        return document.getElementById('reservationModal');
    }

    function openReservationModal(seatId) {
        var targetSeat = seats.find(function (s) { return s.seat_id === seatId; });
        if (!targetSeat || targetSeat.status !== '空闲') {
            global.showToast('该座位已被占用，请重新选择', 'warning');
            renderSeats();
            return;
        }
        selectedSeatId = seatId;
        document.getElementById('modalSeatId').textContent = seatId;

        var now = new Date();
        now.setMinutes(0);
        var startDefault = new Date(now.getTime() + 60 * 60 * 1000);
        var endDefault = new Date(startDefault.getTime() + 2 * 60 * 60 * 1000);
        document.getElementById('startTimeInput').value = startDefault.toISOString().slice(0, 16);
        document.getElementById('endTimeInput').value = endDefault.toISOString().slice(0, 16);

        getReservationModal().open();
    }

    function closeReservationModal() {
        getReservationModal().close();
        selectedSeatId = null;
    }

    async function performReservation() {
        if (!selectedSeatId) {
            closeReservationModal();
            return;
        }
        var startRaw = document.getElementById('startTimeInput').value;
        var endRaw = document.getElementById('endTimeInput').value;
        if (!startRaw || !endRaw) {
            global.showToast('请完整填写预约时间段', 'error');
            return;
        }
        var startTime = new Date(startRaw);
        var endTime = new Date(endRaw);
        var now = new Date();
        if (startTime >= endTime) {
            global.showToast('开始时间必须早于结束时间', 'error');
            return;
        }
        if (startTime < now) {
            global.showToast('预约时间不能为过去时间', 'error');
            return;
        }

        var userConflicts = reservations.filter(function (r) {
            if (r.student_id !== CURRENT_USER.student_id) return false;
            var rStart = new Date(r.start_time);
            var rEnd = new Date(r.end_time);
            return (startTime < rEnd && endTime > rStart);
        });
        if (userConflicts.length > 0) {
            global.showToast('您选择的时间段与已有预约冲突，请重新选择', 'error');
            closeReservationModal();
            return;
        }

        var seatOccupied = reservations.some(function (r) {
            if (r.seat_id !== selectedSeatId) return false;
            if (r.status === '已取消') return false;
            var rStart = new Date(r.start_time);
            var rEnd = new Date(r.end_time);
            return (startTime < rEnd && endTime > rStart);
        });
        if (seatOccupied) {
            global.showToast('该座位在此时间段已被预约，请重新选择', 'error');
            closeReservationModal();
            renderSeats();
            return;
        }

        var seatIdx = seats.findIndex(function (s) { return s.seat_id === selectedSeatId; });
        if (seatIdx === -1 || seats[seatIdx].status !== '空闲') {
            global.showToast('座位状态已变化，请刷新重试', 'error');
            closeReservationModal();
            renderSeats();
            return;
        }

        seats[seatIdx].status = '预约中';
        renderSeats();

        try {
            var newResId = 'RES' + Date.now() + Math.floor(Math.random() * 1000);
            var startStr = startTime.toLocaleString('sv-SE').replace('T', ' ').slice(0, 19);
            var endStr = endTime.toLocaleString('sv-SE').replace('T', ' ').slice(0, 19);

            var newReservation = {
                reservation_id: newResId,
                student_id: CURRENT_USER.student_id,
                seat_id: selectedSeatId,
                start_time: startStr,
                end_time: endStr,
                status: '已预约',
                create_time: new Date().toLocaleString('sv-SE').slice(0, 19)
            };

            var startDate = startStr.split(' ')[0];
            var startTimeOnly = startStr.split(' ')[1];
            var endTimeOnly = endStr.split(' ')[1];

            var areaMap = {
                'A': 'A区 1楼',
                'B': 'B区 1楼',
                'C': 'C区 2楼',
                'D': 'D区 2楼'
            };
            var area = areaMap[selectedSeatId.charAt(0)] || 'A区 1楼';

            var serverBooking = {
                seatNumber: selectedSeatId,
                area: area,
                userName: CURRENT_USER.name || '用户',
                userId: CURRENT_USER.student_id,
                date: startDate,
                startTime: startTimeOnly,
                endTime: endTimeOnly,
                status: 'pending',
                phone: '',
                note: '',
                createdTime: new Date().toISOString()
            };

            try {
                var response = await fetch('http://localhost:3001/bookings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(serverBooking)
                });
                if (!response.ok) {
                    throw new Error('服务器预约失败');
                }
                console.log('预约数据已同步到服务器');
            } catch (serverErr) {
                console.warn('服务器同步失败，继续使用本地存储:', serverErr);
            }

            reservations.push(newReservation);
            var finalSeatIdx = seats.findIndex(function (s) { return s.seat_id === selectedSeatId; });
            if (finalSeatIdx !== -1) seats[finalSeatIdx].status = '占用';
            persistData();
            renderSeats();
            updateMyReservations();
            global.showToast('预约成功！座位 ' + selectedSeatId + ' ' + newReservation.start_time + ' ~ ' + newReservation.end_time, 'success');
            closeReservationModal();
        } catch (err) {
            console.error(err);
            var rollbackSeat = seats.findIndex(function (s) { return s.seat_id === selectedSeatId; });
            if (rollbackSeat !== -1 && seats[rollbackSeat].status === '预约中') {
                seats[rollbackSeat].status = '空闲';
                renderSeats();
            }
            global.showToast('预约失败: 系统异常，请稍后重试', 'error');
            closeReservationModal();
        }
    }

    // ====================== 我的预约 ======================
    function updateMyReservations() {
        var myRes = reservations.filter(function (r) {
            return r.student_id === CURRENT_USER.student_id && r.status !== '已取消';
        });
        var container = document.getElementById('myReservationsList');
        if (!container) return;
        if (myRes.length === 0) {
            container.innerHTML = '<div class="empty-message"><i class="far fa-calendar-times"></i> 暂无预约，快去选座吧~</div>';
            return;
        }
        container.innerHTML = myRes.map(function (res) {
            return '<div class="my-reservation-item">' +
                '<div class="res-seat"><i class="fas fa-chair"></i> ' + res.seat_id + '</div>' +
                '<div class="res-time"><i class="far fa-clock"></i> ' + res.start_time.slice(5, 16) + ' 至 ' + res.end_time.slice(5, 16) + '</div>' +
                '<div><span class="res-status">' + (res.status === '已预约' ? '⏳ 待签到' : '✅ 已完成') + '</span></div>' +
            '</div>';
        }).join('');
    }

    function refreshAll() {
        loadData();
        renderSeats();
        updateMyReservations();
        updateCreditUI();
        global.showToast('数据已同步', 'info');
    }

    // ====================== 签到按钮 ======================
    function setupCheckinButton() {
        var checkinBtn = document.getElementById('checkinBtn');
        if (!checkinBtn) return;

        // 是否处于可签到状态（当前为演示逻辑，固定返回 true）
        var hasPendingCheckin = true;
        var isCheckinTime = true;

        if (hasPendingCheckin && isCheckinTime) {
            checkinBtn.innerHTML = '<i class="fas fa-qrcode"></i><span>立即签到</span>';
            checkinBtn.disabled = false;
        } else {
            checkinBtn.innerHTML = '<i class="fas fa-clock"></i><span>暂无签到</span>';
            checkinBtn.disabled = false;
            checkinBtn.style.background = '#cbd5e1';
        }

        checkinBtn.addEventListener('click', function () {
            if (this.disabled) return;
            if (hasPendingCheckin) {
                global.location.href = './签到.html';
            } else {
                global.showToast('当前没有需要签到的预约', 'info');
            }
        });
    }

    // ====================== 初始化 ======================
    function init() {
        try {
            var storedSeats = global.localStorage.getItem('mock_seats');
            if (!storedSeats || storedSeats === '[]') {
                console.log('未找到座位数据，正在生成...');
                generateSeats();
                persistData();
            } else {
                try {
                    var parsed = JSON.parse(storedSeats);
                    if (!Array.isArray(parsed) || parsed.length === 0) {
                        console.log('座位数据为空，重新生成...');
                        generateSeats();
                        persistData();
                    } else {
                        var firstSeat = parsed[0];
                        if (firstSeat && firstSeat.seat_id && firstSeat.seat_id.startsWith('S')) {
                            console.log('检测到旧格式座位数据，重新生成...');
                            generateSeats();
                            persistData();
                        } else {
                            loadData();
                        }
                    }
                } catch (parseErr) {
                    console.log('座位数据格式错误，重新生成...');
                    generateSeats();
                    persistData();
                }
            }
        } catch (err) {
            console.error('初始化失败:', err);
            generateSeats();
            persistData();
        }

        renderSeats();
        updateMyReservations();
        updateCreditUI();

        document.querySelectorAll('.area-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                document.querySelectorAll('.area-btn').forEach(function (b) { b.classList.remove('active'); });
                this.classList.add('active');
                currentFilter = this.dataset.area;
                renderSeats();
            });
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        // 1. 弹窗与刷新按钮
        document.getElementById('confirmReserveBtn').addEventListener('click', performReservation);
        document.getElementById('cancelModalBtn').addEventListener('click', closeReservationModal);
        document.getElementById('refreshReservationsBtn').addEventListener('click', refreshAll);

        init();

        setInterval(function () {
            loadData();
            renderSeats();
            updateMyReservations();
            updateCreditUI();
        }, 5000);

        // 2. 顶部用户信息与签到按钮
        loadUserInfo();
        setupCheckinButton();
    });
})(window);
