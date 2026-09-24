const express = require('express');
const fs = require('fs');
const path = require('path');
const http = require('http');

const app = express();
// 改用 4000 端口，避开 dev:all 中 json-server 占用的 3000
const PORT = 4000;

const { exec } = require('child_process');

// 中间件
app.use(express.json());
// app.use(express.static('student'));

// 学生端路由
app.use('/student', express.static(path.join(__dirname, 'student')));

// db.json 供登录页直接读取
app.get('/db.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'student', 'db.json'));
});

// 管理员后台代理到 Vite 开发服务器
// Express 的 app.use('/admin') 会 strip /admin 前缀，所以 req.url 已经是去掉 /admin 后的路径
// 但 req.originalUrl 保留了原始完整路径，我们需要用完整路径发给 Vite
// 然后由 Vite（无 base 配置）处理请求

app.use('/admin', (req, res) => {
    const targetPath = req.originalUrl || '/';
    
    const options = {
        hostname: '127.0.0.1',
        port: 5174,
        path: targetPath,
        method: req.method,
        headers: { ...req.headers, host: '127.0.0.1:5174' }
    };

    const proxyReq = http.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
        console.error('代理错误:', err.message);
        if (!res.headersSent) {
            res.writeHead(502);
            res.end('代理错误');
        }
    });

    req.pipe(proxyReq);
});

// Vite 无 base 配置，HTML 中资源路径为 /@vite/client、/src/main.ts 等
// 需要将这些路径代理回 Vite
// 注意：Express 的 app.use('/prefix', ...) 会自动 strip 前缀，所以 req.url 已去掉了前缀
// 但 Vite 需要完整路径，因此代理时必须恢复原始 URL
const viteTarget = { hostname: '127.0.0.1', port: 5174 };

function proxyToVite(req, res) {
    // 恢复被 Express strip 掉的路径前缀
    const originalPath = req.originalUrl || req.url;
    const options = {
        hostname: viteTarget.hostname,
        port: viteTarget.port,
        path: originalPath,
        method: req.method,
        headers: { ...req.headers, host: '127.0.0.1:5174' }
    };
    const proxyReq = http.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
    });
    proxyReq.on('error', (err) => {
        console.error('代理错误:', err.message);
        if (!res.headersSent) { res.writeHead(502); res.end('代理错误'); }
    });
    req.pipe(proxyReq);
}

app.use('/@vite', proxyToVite);
app.use('/@fs', proxyToVite);
app.use('/@id', proxyToVite);
app.use('/src', proxyToVite);
app.use('/node_modules', proxyToVite);
app.use('/favicon.ico', proxyToVite);

// 获取用户列表
app.get('/api/users', (req, res) => {
    const dbPath = path.join(__dirname, 'student/db.json');
    fs.readFile(dbPath, 'utf8', (err, data) => {
        if (err) {
            console.error('读取db.json失败:', err);
            return res.status(500).json({ error: '读取用户数据失败' });
        }
        try {
            const jsonData = JSON.parse(data);
            res.json(jsonData);
        } catch (parseErr) {
            console.error('解析JSON失败:', parseErr);
            res.status(500).json({ error: '解析用户数据失败' });
        }
    });
});

// 注册新用户
app.post('/api/register', (req, res) => {
    const { username, password, name, role = 'student' } = req.body;
    
    if (!username || !password || !name) {
        return res.status(400).json({ error: '缺少必要参数' });
    }

    const dbPath = path.join(__dirname, 'student/db.json');
    fs.readFile(dbPath, 'utf8', (err, data) => {
        if (err) {
            console.error('读取db.json失败:', err);
            return res.status(500).json({ error: '读取用户数据失败' });
        }

        try {
            const jsonData = JSON.parse(data);
            
            // 检查用户是否已存在
            const exists = jsonData.users.find(u => u.username === username);
            if (exists) {
                return res.status(400).json({ error: '用户已存在' });
            }

            // 创建新用户
            const newUser = {
                id: jsonData.users.length + 1,
                username,
                password,
                role,
                name,
                credit_score: 100,
                last_update_time: new Date().toLocaleString('zh-CN')
            };

            jsonData.users.push(newUser);

            // 写入文件
            fs.writeFile(dbPath, JSON.stringify(jsonData, null, 2), (writeErr) => {
                if (writeErr) {
                    console.error('写入db.json失败:', writeErr);
                    return res.status(500).json({ error: '保存用户数据失败' });
                }
                res.json({ success: true, user: newUser });
            });

        } catch (parseErr) {
            console.error('解析JSON失败:', parseErr);
            res.status(500).json({ error: '解析用户数据失败' });
        }
    });
});

// 更新个人信息
app.post('/api/update-profile', (req, res) => {
    const { username, name, college, phone, email } = req.body;
    
    if (!username) {
        return res.status(400).json({ error: '缺少必要参数' });
    }

    const dbPath = path.join(__dirname, 'student/db.json');
    fs.readFile(dbPath, 'utf8', (err, data) => {
        if (err) {
            console.error('读取db.json失败:', err);
            return res.status(500).json({ error: '读取用户数据失败' });
        }

        try {
            const jsonData = JSON.parse(data);
            
            // 查找用户
            const userIndex = jsonData.users.findIndex(u => u.username === username);
            if (userIndex === -1) {
                return res.status(404).json({ error: '用户不存在' });
            }

            // 更新个人信息
            if (name) jsonData.users[userIndex].name = name;
            if (college) jsonData.users[userIndex].college = college;
            if (phone) jsonData.users[userIndex].phone = phone;
            if (email) jsonData.users[userIndex].email = email;
            jsonData.users[userIndex].last_update_time = new Date().toLocaleString('zh-CN');

            // 写入文件
            fs.writeFile(dbPath, JSON.stringify(jsonData, null, 2), (writeErr) => {
                if (writeErr) {
                    console.error('写入db.json失败:', writeErr);
                    return res.status(500).json({ error: '保存用户数据失败' });
                }
                res.json({ success: true, message: '个人信息更新成功' });
            });

        } catch (parseErr) {
            console.error('解析JSON失败:', parseErr);
            res.status(500).json({ error: '解析用户数据失败' });
        }
    });
});

// 获取用户预约记录
app.get('/api/reservations', (req, res) => {
    const { userId } = req.query;
    
    if (!userId) {
        return res.status(400).json({ error: '缺少必要参数' });
    }

    const dbPath = path.join(__dirname, 'admin3/study-room-admin/db.json');
    fs.readFile(dbPath, 'utf8', (err, data) => {
        if (err) {
            console.error('读取db.json失败:', err);
            return res.status(500).json({ error: '读取预约数据失败' });
        }

        try {
            const jsonData = JSON.parse(data);
            
            // 筛选该用户的预约记录
            const userReservations = jsonData.bookings.filter(b => b.userId === userId);
            
            // 计算时长
            const reservationsWithDuration = userReservations.map(booking => {
                const start = new Date(`2000-01-01T${booking.startTime}`);
                const end = new Date(`2000-01-01T${booking.endTime}`);
                const duration = (end - start) / (1000 * 60 * 60);
                
                return {
                    ...booking,
                    duration: `${duration}小时`,
                    time: `${booking.date} ${booking.startTime}-${booking.endTime}`
                };
            });

            res.json({ success: true, reservations: reservationsWithDuration });

        } catch (parseErr) {
            console.error('解析JSON失败:', parseErr);
            res.status(500).json({ error: '解析预约数据失败' });
        }
    });
});

// 更新用户密码
app.post('/api/update-password', (req, res) => {
    const { username, newPassword } = req.body;
    
    if (!username || !newPassword) {
        return res.status(400).json({ error: '缺少必要参数' });
    }

    const dbPath = path.join(__dirname, 'student/db.json');
    fs.readFile(dbPath, 'utf8', (err, data) => {
        if (err) {
            console.error('读取db.json失败:', err);
            return res.status(500).json({ error: '读取用户数据失败' });
        }

        try {
            const jsonData = JSON.parse(data);
            
            // 查找用户
            const userIndex = jsonData.users.findIndex(u => u.username === username);
            if (userIndex === -1) {
                return res.status(404).json({ error: '用户不存在' });
            }

            // 更新密码
            jsonData.users[userIndex].password = newPassword;
            jsonData.users[userIndex].last_update_time = new Date().toLocaleString('zh-CN');

            // 写入文件
            fs.writeFile(dbPath, JSON.stringify(jsonData, null, 2), (writeErr) => {
                if (writeErr) {
                    console.error('写入db.json失败:', writeErr);
                    return res.status(500).json({ error: '保存用户数据失败' });
                }
                res.json({ success: true, message: '密码更新成功' });
            });

        } catch (parseErr) {
            console.error('解析JSON失败:', parseErr);
            res.status(500).json({ error: '解析用户数据失败' });
        }
    });
});

// 根路由 - 统一登录入口
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'student', '登录.html'));
});

// 启动服务器（带端口冲突检测）
const server = app.listen(PORT, () => {
    console.log(`统一入口: http://localhost:${PORT}/`);
    console.log(`学生端:   http://localhost:${PORT}/student/index.html`);
    console.log(`管理员端: http://localhost:${PORT}/admin/`);

    const url = `http://localhost:${PORT}/`;

  // Windows
  if (process.platform === 'win32') {
    exec(`start "" "${url}"`);
  }
  // macOS
  else if (process.platform === 'darwin') {
    exec(`open ${url}`);
  }
  // Linux
  else {
    exec(`xdg-open ${url}`);
  }
});

// 端口冲突时显式提示
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ 端口 ${PORT} 已被占用！`);
        console.error(`   请检查是否已有其他服务（如 json-server / vite）在使用该端口。`);
        console.error(`   或者修改本文件顶部的 PORT 值换一个端口。\n`);
        process.exit(1);
    } else {
        throw err;
    }
});

