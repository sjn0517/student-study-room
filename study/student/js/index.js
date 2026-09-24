let students = [
    { student_id: "20210001", name: "张三", credit_score: 85, last_update_time: "2025-04-01 10:00:00" }
];
let seats = [];
let reservations = [
    { reservation_id: "RES202504010001", student_id: "20210001", seat_id: "A05", start_time: "2025-04-04 08:00:00", end_time: "2025-04-04 12:00:00", status: "已签到", create_time: "2025-04-01 09:00:00" },
    { reservation_id: "RES202504020002", student_id: "20210002", seat_id: "B12", start_time: "2025-04-04 14:00:00", end_time: "2025-04-04 18:00:00", status: "已预约", create_time: "2025-04-02 13:00:00" }
];
// 从 localStorage 读取当前登录用户，fallback 到默认值
function getCurrentUserFromStorage() {
    try {
        const stored = localStorage.getItem('currentUser');
        if (stored) {
            const user = JSON.parse(stored);
            return {
                student_id: user.username || "20210001",
                name: user.name || "用户",
                credit_score: user.credit_score || 85
            };
        }
    } catch (e) {}
    return { student_id: "20210001", name: "张三", credit_score: 85 };
}
const CURRENT_USER = getCurrentUserFromStorage();
let selectedSeatId = null;
let currentFilter = "all";

function generateSeats() {
    seats = [];
    const seatTypes = ["普通座", "插座座", "静音座"];
    
    function generateAreaSeats(area, prefix, floor, count) {
        for (let i = 1; i <= count; i++) {
            const seatNumber = i < 10 ? `0${i}` : `${i}`;
            seats.push({
                seat_id: `${prefix}${seatNumber}`,
                floor: floor,
                area: area + "区",
                type: seatTypes[(i-1) % 3],
                status: "空闲"
            });
        }
    }
    
    generateAreaSeats("A", "A", 1, 30);
    generateAreaSeats("B", "B", 1, 30);
    generateAreaSeats("C", "C", 2, 30);
    generateAreaSeats("D", "D", 2, 30);
    
    seats.find(s => s.seat_id === "A05").status = "占用";
    seats.find(s => s.seat_id === "B12").status = "占用";
    seats.find(s => s.seat_id === "C10").status = "占用";
    seats.find(s => s.seat_id === "D25").status = "占用";
}

function persistData() {
    localStorage.setItem("mock_seats", JSON.stringify(seats));
    localStorage.setItem("mock_reservations", JSON.stringify(reservations));
    localStorage.setItem("mock_students", JSON.stringify(students));
}

function loadData() {
    const savedSeats = localStorage.getItem("mock_seats");
    const savedReservations = localStorage.getItem("mock_reservations");
    const savedStudents = localStorage.getItem("mock_students");
    if(savedSeats) seats = JSON.parse(savedSeats);
    if(savedReservations) reservations = JSON.parse(savedReservations);
    if(savedStudents) students = JSON.parse(savedStudents);
    const cur = students.find(s => s.student_id === CURRENT_USER.student_id);
    if(cur) CURRENT_USER.credit_score = cur.credit_score;
}

function updateStats() {
    const total = seats.length;
    const available = seats.filter(s => s.status === "空闲").length;
    document.getElementById("totalSeats").textContent = total;
    document.getElementById("availableSeats").textContent = available;
}

function updateCreditUI() {
    const studentObj = students.find(s => s.student_id === CURRENT_USER.student_id);
    const score = studentObj ? studentObj.credit_score : 85;
    document.getElementById("creditScoreDisplay").textContent = score;
    document.getElementById("creditScoreBig").textContent = score;
    const violations = reservations.filter(r => r.student_id === CURRENT_USER.student_id && r.status === "违约").length;
    document.getElementById("violationCount").textContent = violations > 0 ? violations : 1;
}

function renderSeats() {
    const container = document.getElementById("seatGridContainer");
    if(!container) {
        console.error("seatGridContainer not found");
        return;
    }
    container.innerHTML = "";
    
    const filteredSeats = seats.filter(seat => {
        if(currentFilter === "all") return true;
        return seat.area === currentFilter;
    });
    
    if(filteredSeats.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 2rem; color: #64748b;">暂无座位数据</div>';
        return;
    }
    
    filteredSeats.forEach(seat => {
        const seatDiv = document.createElement("div");
        seatDiv.className = `seat-card ${seat.status !== "空闲" ? "disabled-seat" : ""}`;
        seatDiv.style.cursor = seat.status === "空闲" ? "pointer" : "not-allowed";
        
        let statusText = "";
        let statusClass = "";
        if(seat.status === "空闲") { statusText = "空闲"; statusClass = "free"; }
        else if(seat.status === "占用") { statusText = "占用"; statusClass = "occupied"; }
        else if(seat.status === "预约中") { statusText = "预约中"; statusClass = "reserving"; }
        else { statusText = seat.status; statusClass = "occupied"; }
        
        seatDiv.innerHTML = `
            <div class="seat-number">${seat.seat_id}</div>
            <div class="seat-area">${seat.area} ${seat.floor}楼</div>
            <div class="seat-type">${seat.type}</div>
            <div class="status-badge ${statusClass}">${statusText}</div>
        `;
        
        if(seat.status === "空闲") {
            seatDiv.addEventListener("click", (e) => {
                e.stopPropagation();
                openReservationModal(seat.seat_id);
            });
        }
        container.appendChild(seatDiv);
    });
    updateStats();
}

function openReservationModal(seatId) {
    const targetSeat = seats.find(s => s.seat_id === seatId);
    if(!targetSeat || targetSeat.status !== "空闲") {
        showToast("该座位已被占用，请重新选择", "warning");
        renderSeats();
        return;
    }
    selectedSeatId = seatId;
    document.getElementById("modalSeatId").textContent = seatId;
    const now = new Date();
    now.setMinutes(0);
    const startDefault = new Date(now.getTime() + 60*60*1000);
    const endDefault = new Date(startDefault.getTime() + 2*60*60*1000);
    document.getElementById("startTimeInput").value = startDefault.toISOString().slice(0,16);
    document.getElementById("endTimeInput").value = endDefault.toISOString().slice(0,16);
    document.getElementById("reservationModal").classList.add("active");
}

function closeModal() {
    document.getElementById("reservationModal").classList.remove("active");
    selectedSeatId = null;
}

async function performReservation() {
    if(!selectedSeatId) {
        closeModal();
        return;
    }
    const startRaw = document.getElementById("startTimeInput").value;
    const endRaw = document.getElementById("endTimeInput").value;
    if(!startRaw || !endRaw) {
        showToast("请完整填写预约时间段", "error");
        return;
    }
    const startTime = new Date(startRaw);
    const endTime = new Date(endRaw);
    const now = new Date();
    if(startTime >= endTime) {
        showToast("开始时间必须早于结束时间", "error");
        return;
    }
    if(startTime < now) {
        showToast("预约时间不能为过去时间", "error");
        return;
    }
    const userConflicts = reservations.filter(r => {
        if(r.student_id !== CURRENT_USER.student_id) return false;
        const rStart = new Date(r.start_time);
        const rEnd = new Date(r.end_time);
        return (startTime < rEnd && endTime > rStart);
    });
    if(userConflicts.length > 0) {
        showToast("您选择的时间段与已有预约冲突，请重新选择", "error");
        closeModal();
        return;
    }
    const seatOccupied = reservations.some(r => {
        if(r.seat_id !== selectedSeatId) return false;
        if(r.status === "已取消") return false;
        const rStart = new Date(r.start_time);
        const rEnd = new Date(r.end_time);
        return (startTime < rEnd && endTime > rStart);
    });
    if(seatOccupied) {
        showToast("该座位在此时间段已被预约，请重新选择", "error");
        closeModal();
        renderSeats();
        return;
    }

    const seatIdx = seats.findIndex(s => s.seat_id === selectedSeatId);
    if(seatIdx === -1 || seats[seatIdx].status !== "空闲") {
        showToast("座位状态已变化，请刷新重试", "error");
        closeModal();
        renderSeats();
        return;
    }
    seats[seatIdx].status = "预约中";
    renderSeats();
    
    try {
        const newResId = "RES" + Date.now() + Math.floor(Math.random()*1000);
        
        const startStr = startTime.toLocaleString("sv-SE").replace("T", " ").slice(0,19);
        const endStr = endTime.toLocaleString("sv-SE").replace("T", " ").slice(0,19);
        
        const newReservation = {
            reservation_id: newResId,
            student_id: CURRENT_USER.student_id,
            seat_id: selectedSeatId,
            start_time: startStr,
            end_time: endStr,
            status: "已预约",
            create_time: new Date().toLocaleString("sv-SE").slice(0,19)
        };
        
        const startDate = startStr.split(' ')[0];
        const startTimeOnly = startStr.split(' ')[1];
        const endTimeOnly = endStr.split(' ')[1];
        
        const areaMap = {
            'A': 'A区 1楼',
            'B': 'B区 1楼',
            'C': 'C区 2楼',
            'D': 'D区 2楼'
        };
        const area = areaMap[selectedSeatId.charAt(0)] || 'A区 1楼';

        const serverBooking = {
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
            const response = await fetch('http://localhost:3001/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
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
        const finalSeatIdx = seats.findIndex(s => s.seat_id === selectedSeatId);
        if(finalSeatIdx !== -1) seats[finalSeatIdx].status = "占用";
        persistData();
        renderSeats();
        updateMyReservations();
        showToast(`预约成功！座位 ${selectedSeatId} ${newReservation.start_time} ~ ${newReservation.end_time}`, "success");
        closeModal();
    } catch(err) {
        console.error(err);
        const rollbackSeat = seats.findIndex(s => s.seat_id === selectedSeatId);
        if(rollbackSeat !== -1 && seats[rollbackSeat].status === "预约中") {
            seats[rollbackSeat].status = "空闲";
            renderSeats();
        }
        showToast("预约失败: 系统异常，请稍后重试", "error");
        closeModal();
    }
}

function updateMyReservations() {
    const myRes = reservations.filter(r => r.student_id === CURRENT_USER.student_id && r.status !== "已取消");
    const container = document.getElementById("myReservationsList");
    if(!container) return;
    if(myRes.length === 0) {
        container.innerHTML = `<div class="empty-message"><i class="far fa-calendar-times"></i> 暂无预约，快去选座吧~</div>`;
        return;
    }
    container.innerHTML = myRes.map(res => `
        <div class="my-reservation-item">
            <div class="res-seat"><i class="fas fa-chair"></i> ${res.seat_id}</div>
            <div class="res-time"><i class="far fa-clock"></i> ${res.start_time.slice(5,16)} 至 ${res.end_time.slice(5,16)}</div>
            <div><span class="res-status">${res.status === "已预约" ? "⏳ 待签到" : "✅ 已完成"}</span></div>
        </div>
    `).join("");
}

function showToast(msg, type="info") {
    const toast = document.getElementById("globalToast");
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, 2800);
}

function refreshAll() {
    loadData();
    renderSeats();
    updateMyReservations();
    updateCreditUI();
    showToast("数据已同步", "info");
}

function init() {
    try {
        const storedSeats = localStorage.getItem("mock_seats");
        if(!storedSeats || storedSeats === "[]") {
            console.log("未找到座位数据，正在生成...");
            generateSeats();
            persistData();
        } else {
            try {
                const parsed = JSON.parse(storedSeats);
                if(!Array.isArray(parsed) || parsed.length === 0) {
                    console.log("座位数据为空，重新生成...");
                    generateSeats();
                    persistData();
                } else {
                    const firstSeat = parsed[0];
                    if(firstSeat && firstSeat.seat_id && firstSeat.seat_id.startsWith('S')) {
                        console.log("检测到旧格式座位数据，重新生成...");
                        generateSeats();
                        persistData();
                    } else {
                        loadData();
                    }
                }
            } catch {
                console.log("座位数据格式错误，重新生成...");
                generateSeats();
                persistData();
            }
        }
    } catch(err) {
        console.error("初始化失败:", err);
        generateSeats();
        persistData();
    }
    renderSeats();
    updateMyReservations();
    updateCreditUI();
    
    document.querySelectorAll('.area-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.area-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.area;
            renderSeats();
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById("confirmReserveBtn").addEventListener("click", performReservation);
    document.getElementById("cancelModalBtn").addEventListener("click", closeModal);
    document.getElementById("refreshReservationsBtn").addEventListener("click", refreshAll);
    document.getElementById("reservationModal").addEventListener("click", (e) => {
        if(e.target === document.getElementById("reservationModal")) closeModal();
    });
    
    init();
    
    setInterval(() => {
        loadData();
        renderSeats();
        updateMyReservations();
        updateCreditUI();
    }, 5000);
});