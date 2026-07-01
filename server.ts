import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import fs from "fs";

// Initialize SQLite database
const dbDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const dbPath = path.join(dbDir, "app.db");
const db = new Database(dbPath);

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE NOT NULL,
    is_member BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS wheel_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    start_date TEXT,
    end_date TEXT,
    settings TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS prizes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_id INTEGER,
    name TEXT NOT NULL,
    label TEXT DEFAULT '',
    probability REAL NOT NULL,
    color TEXT NOT NULL,
    stock INTEGER DEFAULT -1,
    FOREIGN KEY(config_id) REFERENCES wheel_configs(id)
  );

  CREATE TABLE IF NOT EXISTS spins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    prize_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(prize_id) REFERENCES prizes(id)
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Add config_id to prizes if missing
try {
  db.prepare('ALTER TABLE prizes ADD COLUMN config_id INTEGER REFERENCES wheel_configs(id)').run();
} catch (e) {}

// Add label column if it doesn't exist (for existing databases)
try {
  db.prepare('ALTER TABLE prizes ADD COLUMN label TEXT DEFAULT ""').run();
} catch (e) {
  // Ignore if column already exists
}

// Migrate settings to wheel_configs if wheel_configs is empty
const configsCount = db.prepare('SELECT COUNT(*) as count FROM wheel_configs').get() as { count: number };
if (configsCount.count === 0) {
  const settingsRows = db.prepare('SELECT * FROM settings').all() as any[];
  const settingsObj: any = {};
  settingsRows.forEach(r => settingsObj[r.key] = r.value);

  const startDate = settingsObj.startDate || null;
  const endDate = settingsObj.endDate || null;
  // delete them from settingsObj so they don't stay redundant, but let's keep them for simplicity
  
  const info = db.prepare('INSERT INTO wheel_configs (name, start_date, end_date, settings) VALUES (?, ?, ?, ?)').run(
    'Chiến dịch mặc định', startDate, endDate, JSON.stringify(settingsObj)
  );
  
  const configId = info.lastInsertRowid;
  db.prepare('UPDATE prizes SET config_id = ? WHERE config_id IS NULL').run(configId);
}

// Seed initial data if empty
const prizesCount = db.prepare('SELECT COUNT(*) as count FROM prizes').get() as { count: number };
if (prizesCount.count === 0) {
  const insertPrize = db.prepare('INSERT INTO prizes (name, label, probability, color, stock) VALUES (?, ?, ?, ?, ?)');
  const initialPrizes = [
    { name: "Voucher 10%", label: "10%", probability: 0.3, color: "#3A1F5C", stock: 100 },
    { name: "Voucher 20%", label: "20%", probability: 0.2, color: "#FF5AAD", stock: 50 },
    { name: "Khám mắt miễn phí", label: "Khám mắt", probability: 0.1, color: "#B794D6", stock: 20 },
    { name: "Kính mát thời trang", label: "Kính mát", probability: 0.05, color: "#3A1F5C", stock: 5 },
    { name: "Chúc bạn may mắn", label: "May mắn", probability: 0.35, color: "#FF5AAD", stock: -1 },
  ];
  
  initialPrizes.forEach(p => {
    insertPrize.run(p.name, p.label, p.probability, p.color, p.stock);
  });
}

const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get() as { count: number };
if (settingsCount.count === 0) {
  const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
  insertSetting.run('primaryColor', '#3A1F5C');
  insertSetting.run('secondaryColor', '#B794D6');
  insertSetting.run('tertiaryColor', '#FF5AAD');
  insertSetting.run('backgroundColor', '#FFF5FB');
  insertSetting.run('metaTitle', 'HmkEyewear Vòng Quay Giáng Sinh');
  insertSetting.run('metaDescription', '“HmkEyewear Vòng Quay Giáng Sinh” là chương trình minigame tương tác do HmkEyewear tổ chức.');
  insertSetting.run('metaImage', 'https://images.unsplash.com/photo-1512403754473-272e1ab497e5?q=80&w=1000&auto=format&fit=crop');
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // === API ROUTES ===

  // 1. Check if phone exists
  app.post("/api/check-phone", (req, res) => {
    const { phone, configId } = req.body;
    if (!phone) return res.status(400).json({ error: "Phone number required" });
    
    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as any;
    if (user) {
      let previousPrize = null;
      let hasSpun = false;

      if (configId) {
        previousPrize = db.prepare(`
          SELECT p.* FROM spins s
          JOIN prizes p ON s.prize_id = p.id
          WHERE s.user_id = ? AND p.config_id = ?
        `).get(user.id, configId);
        
        hasSpun = !!previousPrize;
      }
      
      res.json({ exists: true, user, hasSpun, previousPrize });
    } else {
      res.json({ exists: false });
    }
  });

  // 2. Register user & Send Zalo message (mock)
  app.post("/api/register", (req, res) => {
    const { phone, configId } = req.body;
    if (!phone) return res.status(400).json({ error: "Phone number required" });

    try {
      const stmt = db.prepare('INSERT INTO users (phone, is_member) VALUES (?, 1)');
      const info = stmt.run(phone);
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
      
      // Mock Zalo ZNS Send
      console.log(`[ZALO ZNS] Gửi tin nhắn xác nhận đăng ký thành viên cho số: ${phone}`);

      res.json({ success: true, user });
    } catch (e: any) {
      if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as any;
        
        let previousPrize = null;
        if (configId) {
          previousPrize = db.prepare(`
            SELECT p.* FROM spins s
            JOIN prizes p ON s.prize_id = p.id
            WHERE s.user_id = ? AND p.config_id = ?
          `).get(user.id, configId);
        }
        
        res.json({ success: true, user, previousPrize });
      } else {
        res.status(500).json({ error: e.message });
      }
    }
  });

  // 3. Spin Wheel
  app.post("/api/spin", (req, res) => {
    const { userId, configId } = req.body;
    if (!userId) return res.status(400).json({ error: "User ID required" });
    if (!configId) return res.status(400).json({ error: "Config ID required" });

    // Validate user exists
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    let selectedPrize;
    try {
      selectedPrize = db.transaction(() => {
        const spinCount = db.prepare(`
          SELECT COUNT(*) as count FROM spins s
          JOIN prizes p ON s.prize_id = p.id
          WHERE s.user_id = ? AND p.config_id = ?
        `).get(userId, configId) as {count: number};
        if (spinCount.count > 0) {
           throw new Error("Bạn đã tham gia chiến dịch này rồi!");
        }

        const prizes = db.prepare('SELECT * FROM prizes WHERE config_id = ? AND (stock > 0 OR stock = -1)').all(configId) as any[];
        if (prizes.length === 0) {
           throw new Error("Tất cả phần thưởng đã hết!");
        }
        
        let totalProb = prizes.reduce((sum, p) => sum + p.probability, 0);
        let rand = Math.random() * totalProb;
        let cumulative = 0;
        let prizeToAward = prizes[prizes.length - 1];

        for (const prize of prizes) {
          cumulative += prize.probability;
          if (rand <= cumulative) {
            prizeToAward = prize;
            break;
          }
        }

        const insertSpin = db.prepare('INSERT INTO spins (user_id, prize_id) VALUES (?, ?)');
        insertSpin.run(userId, prizeToAward.id);

        if (prizeToAward.stock > 0) {
          const info = db.prepare('UPDATE prizes SET stock = stock - 1 WHERE id = ? AND stock > 0').run(prizeToAward.id);
          if (info.changes === 0) {
             throw new Error("Lỗi cập nhật kho!");
          }
        }
        return prizeToAward;
      })();
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }

    // Mock Zalo ZNS Send for Prize
    console.log(`[ZALO ZNS] Chúc mừng số điện thoại ${(user as any).phone} đã trúng: ${selectedPrize.name}`);

    res.json({ success: true, prize: selectedPrize });
  });

  // 4. Get Active Config for Game
  app.get("/api/config", (req, res) => {
    // We expect ISO string dates in DB, or empty. We'll fetch all active and find the one that fits.
    // To handle timezone safely, we just fetch all active and filter in JS.
    const activeConfigs = db.prepare("SELECT * FROM wheel_configs WHERE status = 'active'").all() as any[];
    const now = new Date().getTime();
    
    let activeConfig = null;
    for (const config of activeConfigs) {
       const start = config.start_date ? new Date(config.start_date).getTime() : null;
       const end = config.end_date ? new Date(config.end_date).getTime() : null;
       
       let isValid = true;
       if (start && start > now) isValid = false;
       if (end && end < now) isValid = false;
       
       if (isValid) {
         activeConfig = config;
         break;
       }
    }

    if (!activeConfig) {
      return res.json({ settings: null, prizes: [] });
    }

    const settings = JSON.parse(activeConfig.settings);
    settings.startDate = activeConfig.start_date;
    settings.endDate = activeConfig.end_date;
    
    const prizes = db.prepare('SELECT * FROM prizes WHERE config_id = ?').all(activeConfig.id);
    
    res.json({ settings, prizes, configId: activeConfig.id });
  });

  // 5. Admin - Get All Configs
  app.get("/api/configs", (req, res) => {
    const configs = db.prepare('SELECT * FROM wheel_configs ORDER BY created_at DESC').all() as any[];
    for (const c of configs) {
      c.settings = JSON.parse(c.settings);
      c.prizes = db.prepare('SELECT * FROM prizes WHERE config_id = ?').all(c.id);
    }
    res.json(configs);
  });

  // 6. Admin - Create Config
  app.post("/api/configs", (req, res) => {
    const { name, startDate, endDate, settings, prizes, status } = req.body;
    
    // Validate overlap
    if (status !== 'draft') {
      const activeConfigs = db.prepare("SELECT * FROM wheel_configs WHERE status = 'active'").all() as any[];
      const newStart = startDate ? new Date(startDate).getTime() : null;
      const newEnd = endDate ? new Date(endDate).getTime() : null;
  
      if (newStart && newEnd && newStart > newEnd) {
        return res.status(400).json({ error: "Thời gian bắt đầu phải trước kết thúc." });
      }
  
      for (const c of activeConfigs) {
         const cStart = c.start_date ? new Date(c.start_date).getTime() : 0;
         const cEnd = c.end_date ? new Date(c.end_date).getTime() : Infinity;
         
         const s1 = newStart || 0;
         const e1 = newEnd || Infinity;
         const s2 = cStart;
         const e2 = cEnd;
         
         if (s1 < e2 && s2 < e1) {
           return res.status(400).json({ error: "Thời gian áp dụng bị trùng lặp với chiến dịch: " + c.name });
         }
      }
    }

    const transaction = db.transaction(() => {
      const info = db.prepare('INSERT INTO wheel_configs (name, start_date, end_date, settings, status) VALUES (?, ?, ?, ?, ?)').run(
        name || 'Chiến dịch mới', startDate || null, endDate || null, JSON.stringify(settings || {}), status || 'active'
      );
      const configId = info.lastInsertRowid;

      if (prizes && prizes.length > 0) {
        const insertPrize = db.prepare('INSERT INTO prizes (config_id, name, label, probability, color, stock) VALUES (?, ?, ?, ?, ?, ?)');
        for (const prize of prizes) {
          insertPrize.run(configId, prize.name, prize.label || '', prize.probability, prize.color, prize.stock);
        }
      }
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // 7. Admin - Update Config
  app.put("/api/configs/:id", (req, res) => {
    const configId = req.params.id;
    const { name, startDate, endDate, settings, prizes, status } = req.body;
    
    // Validate overlap if active
    if (status !== 'draft') {
      const activeConfigs = db.prepare("SELECT * FROM wheel_configs WHERE status = 'active' AND id != ?").all(configId) as any[];
      const newStart = startDate ? new Date(startDate).getTime() : null;
      const newEnd = endDate ? new Date(endDate).getTime() : null;
  
      if (newStart && newEnd && newStart > newEnd) {
        return res.status(400).json({ error: "Thời gian bắt đầu phải trước kết thúc." });
      }
  
      for (const c of activeConfigs) {
         const cStart = c.start_date ? new Date(c.start_date).getTime() : 0;
         const cEnd = c.end_date ? new Date(c.end_date).getTime() : Infinity;
         
         const s1 = newStart || 0;
         const e1 = newEnd || Infinity;
         const s2 = cStart;
         const e2 = cEnd;
         
         if (s1 < e2 && s2 < e1) {
           return res.status(400).json({ error: "Thời gian áp dụng bị trùng lặp với chiến dịch: " + c.name });
         }
      }
    }

    const transaction = db.transaction(() => {
      db.prepare('UPDATE wheel_configs SET name=?, start_date=?, end_date=?, settings=?, status=? WHERE id=?').run(
        name, startDate || null, endDate || null, JSON.stringify(settings || {}), status || 'active', configId
      );

      if (prizes) {
        const updatePrize = db.prepare('UPDATE prizes SET name=?, label=?, probability=?, color=?, stock=? WHERE id=? AND config_id=?');
        const insertPrize = db.prepare('INSERT INTO prizes (config_id, name, label, probability, color, stock) VALUES (?, ?, ?, ?, ?, ?)');
        const deletePrize = db.prepare('DELETE FROM prizes WHERE id=? AND config_id=?');

        const existingIds = (db.prepare('SELECT id FROM prizes WHERE config_id=?').all(configId) as any[]).map(r => r.id);
        const incomingIds = prizes.filter((p: any) => p.id).map((p: any) => p.id);
        
        for (const id of existingIds) {
          if (!incomingIds.includes(id)) {
            deletePrize.run(id, configId);
          }
        }

        for (const prize of prizes) {
          if (prize.id && existingIds.includes(prize.id)) {
            updatePrize.run(prize.name, prize.label || '', prize.probability, prize.color, prize.stock, prize.id, configId);
          } else {
            insertPrize.run(configId, prize.name, prize.label || '', prize.probability, prize.color, prize.stock);
          }
        }
      }
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/configs/:id", (req, res) => {
    const configId = req.params.id;
    const transaction = db.transaction(() => {
      db.prepare('DELETE FROM prizes WHERE config_id=?').run(configId);
      db.prepare('DELETE FROM wheel_configs WHERE id=?').run(configId);
    });
    try {
      transaction();
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // 8. Legacy Update Config endpoint for backwards compatibility (optional)
  app.post("/api/config", (req, res) => {
    // redirect to PUT on the default/latest config, or just ignore.
    res.json({ success: true });
  });

  // 9. Get Stats for Admin
  app.get("/api/stats", (req, res) => {
    const configId = req.query.configId as string;
    
    let totalUsers, totalMembers, totalSpins, spinsByDate, prizeStats, prizeStatsByDateRaw;

    if (configId) {
      totalUsers = (db.prepare('SELECT COUNT(DISTINCT s.user_id) as count FROM spins s JOIN prizes p ON s.prize_id = p.id WHERE p.config_id = ?').get(configId) as any).count;
      totalMembers = (db.prepare('SELECT COUNT(DISTINCT s.user_id) as count FROM spins s JOIN prizes p ON s.prize_id = p.id JOIN users u ON s.user_id = u.id WHERE p.config_id = ? AND u.is_member = 1').get(configId) as any).count;
      totalSpins = (db.prepare('SELECT COUNT(*) as count FROM spins s JOIN prizes p ON s.prize_id = p.id WHERE p.config_id = ?').get(configId) as any).count;
      
      spinsByDate = db.prepare(`
        SELECT date(s.created_at) as date, COUNT(*) as count 
        FROM spins s
        JOIN prizes p ON s.prize_id = p.id
        WHERE p.config_id = ?
        GROUP BY date(s.created_at)
        ORDER BY date(s.created_at) DESC
        LIMIT 7
      `).all(configId);

      prizeStats = db.prepare(`
        SELECT p.name, COUNT(s.id) as count 
        FROM prizes p
        LEFT JOIN spins s ON p.id = s.prize_id
        WHERE p.config_id = ?
        GROUP BY p.id
      `).all(configId);

      prizeStatsByDateRaw = db.prepare(`
        SELECT date(s.created_at) as date, p.name as prize_name, COUNT(s.id) as count 
        FROM spins s
        JOIN prizes p ON s.prize_id = p.id
        WHERE date(s.created_at) >= date('now', '-7 days') AND p.config_id = ?
        GROUP BY date(s.created_at), p.id
        ORDER BY date(s.created_at) ASC
      `).all(configId);
    } else {
      totalUsers = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;
      totalMembers = (db.prepare('SELECT COUNT(*) as count FROM users WHERE is_member = 1').get() as any).count;
      totalSpins = (db.prepare('SELECT COUNT(*) as count FROM spins').get() as any).count;
      
      spinsByDate = db.prepare(`
        SELECT date(created_at) as date, COUNT(*) as count 
        FROM spins 
        GROUP BY date(created_at)
        ORDER BY date(created_at) DESC
        LIMIT 7
      `).all();

      prizeStats = db.prepare(`
        SELECT p.name, COUNT(s.id) as count 
        FROM prizes p
        LEFT JOIN spins s ON p.id = s.prize_id
        GROUP BY p.id
      `).all();

      prizeStatsByDateRaw = db.prepare(`
        SELECT date(s.created_at) as date, p.name as prize_name, COUNT(s.id) as count 
        FROM spins s
        JOIN prizes p ON s.prize_id = p.id
        WHERE date(s.created_at) >= date('now', '-7 days')
        GROUP BY date(s.created_at), p.id
        ORDER BY date(s.created_at) ASC
      `).all();
    }

    const prizeStatsByDateMap = new Map();
    prizeStatsByDateRaw.forEach((row: any) => {
      if (!prizeStatsByDateMap.has(row.date)) {
        prizeStatsByDateMap.set(row.date, { date: row.date });
      }
      prizeStatsByDateMap.get(row.date)[row.prize_name] = row.count;
    });
    
    // Get unique prize names for chart keys
    const uniquePrizes = Array.from(new Set(prizeStatsByDateRaw.map((r: any) => r.prize_name)));

    res.json({
      totalUsers,
      totalMembers,
      totalSpins,
      conversionRate: totalUsers > 0 ? ((totalMembers / totalUsers) * 100).toFixed(1) : 0,
      spinsByDate: spinsByDate.reverse(), // oldest to newest
      prizeStats,
      prizeStatsByDate: Array.from(prizeStatsByDateMap.values()),
      uniquePrizes
    });
  });

  app.get("/api/winners", (req, res) => {
    const configId = req.query.configId as string;
    
    let query = `
      SELECT u.phone, p.name as prize_name, s.created_at
      FROM spins s
      JOIN users u ON s.user_id = u.id
      JOIN prizes p ON s.prize_id = p.id
    `;
    let params: any[] = [];
    
    if (configId) {
      query += ` WHERE p.config_id = ? `;
      params.push(configId);
    }
    
    query += ` ORDER BY s.created_at DESC LIMIT 100 `;
    
    const winners = db.prepare(query).all(...params);
    res.json(winners);
  });

  // 7. Export CSV
  app.get("/api/export-csv", (req, res) => {
    try {
      const configId = req.query.configId as string;
      
      let query = `
        SELECT u.phone, u.is_member, u.created_at as register_date, 
               p.name as prize_name, s.created_at as spin_date
        FROM users u
        LEFT JOIN spins s ON u.id = s.user_id
        LEFT JOIN prizes p ON s.prize_id = p.id
      `;
      let params: any[] = [];
      
      if (configId) {
         query += ` WHERE p.config_id = ? OR s.id IS NULL `;
         params.push(configId);
      }
      
      query += ` ORDER BY u.created_at DESC `;
      
      const data = db.prepare(query).all(...params) as any[];

      const csvRows = [
        ['Số điện thoại', 'Thành viên', 'Ngày đăng ký', 'Giải thưởng', 'Ngày quay']
      ];

      for (const row of data) {
        csvRows.push([
          row.phone,
          row.is_member ? 'Có' : 'Không',
          row.register_date,
          row.prize_name || 'Chưa quay',
          row.spin_date || ''
        ]);
      }

      const csvContent = "\uFEFF" + csvRows.map(e => e.map(field => `"${field}"`).join(",")).join("\n");
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="players_data.csv"');
      res.send(csvContent);
    } catch (e) {
      res.status(500).json({ error: "Could not generate CSV" });
    }
  });

  // === VITE MIDDLEWARE ===
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
    app.use(vite.middlewares);
    
    app.use('*', async (req, res, next) => {
      try {
        const url = req.originalUrl;
        
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        
        const settingsRows = db.prepare('SELECT * FROM settings').all() as any[];
        const settings = settingsRows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
        
        const title = settings.metaTitle || "Vòng Quay May Mắn";
        const desc = settings.metaDescription || "Tham gia ngay để nhận hàng ngàn phần quà hấp dẫn!";
        const img = settings.metaImage || "";
        
        const metaTags = `
          <title>${title}</title>
          <meta name="description" content="${desc}" />
          <meta property="og:title" content="${title}" />
          <meta property="og:description" content="${desc}" />
          <meta property="og:image" content="${img}" />
          <meta property="og:type" content="website" />
        `;
        
        template = template.replace(/<title>.*?<\/title>/i, '');
        const html = template.replace('</head>', `${metaTags}</head>`);
        
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false }));
    app.get('*', (req, res) => {
      let template = fs.readFileSync(path.join(distPath, 'index.html'), 'utf-8');
      
      const settingsRows = db.prepare('SELECT * FROM settings').all() as any[];
      const settings = settingsRows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
      
      const title = settings.metaTitle || "Vòng Quay May Mắn";
      const desc = settings.metaDescription || "Tham gia ngay để nhận hàng ngàn phần quà hấp dẫn!";
      const img = settings.metaImage || "";
      
      const metaTags = `
        <title>${title}</title>
        <meta name="description" content="${desc}" />
        <meta property="og:title" content="${title}" />
        <meta property="og:description" content="${desc}" />
        <meta property="og:image" content="${img}" />
        <meta property="og:type" content="website" />
      `;
      
      // Remove original title if exists
      template = template.replace(/<title>.*?<\/title>/i, '');
      const html = template.replace('</head>', `${metaTags}</head>`);
      
      res.send(html);
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
