require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

app.use(cors());
app.use(express.json());

// Global Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

// Data directory
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

// Helper functions
const read = (file, def = []) => {
    try {
        if (!fs.existsSync(file)) return def;
        const content = fs.readFileSync(file, 'utf8');
        return content ? JSON.parse(content) : def;
    } catch (err) {
        console.error(`[ERROR] Failed to read ${file}:`, err.message);
        return def;
    }
};
const write = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

// Root Route - Health Check
app.get('/', (req, res) => {
    res.send({ status: "API is running", port: PORT, data_dir: DATA_DIR });
});

// Users file with default admin
const usersFile = `${DATA_DIR}/users.json`;
let users = read(usersFile);
let usersChanged = false;

if (!users.find(u => u.Username === 'admin')) {
    const hashed = bcrypt.hashSync('admin123', 10);
    users.push({ UserID: 1, Username: 'admin', PasswordHash: hashed, FullName: 'Administrator', Role: 'admin' });
    usersChanged = true;
}

if (!users.find(u => u.Username === 'mugisha')) {
    const hashed = bcrypt.hashSync('mugisha123', 10);
    const newId = users.length ? Math.max(...users.map(u => u.UserID)) + 1 : 1;
    users.push({ UserID: newId, Username: 'mugisha', PasswordHash: hashed, FullName: 'Mugisha', Role: 'admin' });
    usersChanged = true;
    console.log("Initialization: Created missing user 'mugisha'");
}

if (usersChanged) write(usersFile, users);

// Other data files
const projectsFile = `${DATA_DIR}/projects.json`;
const suppliersFile = `${DATA_DIR}/suppliers.json`;
const materialsFile = `${DATA_DIR}/materials.json`;
const purchasesFile = `${DATA_DIR}/purchases.json`;

const existingMaterials = read(materialsFile);
if (!fs.existsSync(materialsFile) || existingMaterials.length === 0) {
    write(materialsFile, [
        { MaterialID: 1, MaterialName: 'Cement', UnitOfMeasure: 'per 50kg bag', AvgPrice: 9000 },
        { MaterialID: 2, MaterialName: 'River Sand', UnitOfMeasure: 'per cubic meter', AvgPrice: 35000 },
        { MaterialID: 3, MaterialName: 'Crushed Stones', UnitOfMeasure: 'per cubic meter', AvgPrice: 45000 },
        { MaterialID: 4, MaterialName: 'Steel Rebar', UnitOfMeasure: 'per piece', AvgPrice: 12000 },
        { MaterialID: 5, MaterialName: 'Bricks', UnitOfMeasure: 'per 100 pieces', AvgPrice: 15000 },
        { MaterialID: 6, MaterialName: 'Paint', UnitOfMeasure: 'per 20-liter bucket', AvgPrice: 75000 }
    ]);
}
if (!fs.existsSync(projectsFile)) write(projectsFile, []);
if (!fs.existsSync(suppliersFile)) write(suppliersFile, []);
if (!fs.existsSync(purchasesFile)) write(purchasesFile, []);

// Auth middleware
const auth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        console.log(`[AUTH] Missing token for ${req.method} ${req.url}`);
        return res.status(401).json({ error: 'Unauthorized' });
    }
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.log(`[AUTH] Invalid token for ${req.method} ${req.url}`);
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Register
app.post('/api/register', async (req, res) => {
    try {
        const { username, password, fullName } = req.body;
        const users = read(usersFile);
        if (users.find(u => u.Username === username)) return res.status(400).json({ error: 'Username exists' });
        const newId = users.length ? Math.max(...users.map(u => u.UserID)) + 1 : 1;
        const hashed = bcrypt.hashSync(password, 10);
        users.push({ UserID: newId, Username: username, PasswordHash: hashed, FullName: fullName || username, Role: 'manager' });
        write(usersFile, users);
        res.json({ success: true });
    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ error: 'Internal server error during registration' });
    }
});

// Login
app.post('/api/login', (req, res) => {
    try {
        const { username, password } = req.body;
        console.log(`[AUTH] Login attempt received for: "${username}"`);

        const users = read(usersFile);
        const user = users.find(u => u.Username === username);

        if (!user || !bcrypt.compareSync(password, user.PasswordHash)) {
            console.log(`[AUTH] Login FAILED for: "${username}". (User found: ${!!user})`);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user.UserID, username: user.Username }, JWT_SECRET, { expiresIn: '8h' });
        console.log(`[AUTH] Login SUCCESSFUL for: "${username}"`);
        res.json({ success: true, token, user: { id: user.UserID, username: user.Username, fullName: user.FullName, role: user.Role } });
    } catch (err) {
        console.error("[AUTH] Server Error during login:", err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Projects CRUD
app.get('/api/projects', auth, (req, res) => {
    const projects = read(projectsFile);
    const page = parseInt(req.query._page) || 1;
    const limit = parseInt(req.query._limit) || projects.length; // Default to all if no limit
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedProjects = projects.slice(startIndex, endIndex);
    console.log(`[DATA] GET /api/projects - Found ${projects.length}, returning ${paginatedProjects.length}`);
    res.json(paginatedProjects);
});

app.post('/api/projects', auth, (req, res) => {
    const projects = read(projectsFile);
    const newId = projects.length ? Math.max(...projects.map(p => p.ProjectID)) + 1 : 1;
    const newProject = { ProjectID: newId, ...req.body };
    projects.push(newProject);
    write(projectsFile, projects);
    res.json(newProject);
});
app.put('/api/projects/:id', auth, (req, res) => {
    let projects = read(projectsFile);
    const id = parseInt(req.params.id);
    const index = projects.findIndex(p => p.ProjectID === id);
    if (index === -1) return res.status(404).json({ error: 'Not found' });
    projects[index] = { ...projects[index], ...req.body, ProjectID: id };
    write(projectsFile, projects);
    res.json({ success: true });
});
app.delete('/api/projects/:id', auth, (req, res) => {
    let projects = read(projectsFile);
    const id = parseInt(req.params.id);
    projects = projects.filter(p => p.ProjectID !== id);
    write(projectsFile, projects);
    res.json({ success: true });
});

// Suppliers (same pattern)
app.get('/api/suppliers', auth, (req, res) => {
    const data = read(suppliersFile);
    console.log(`[DATA] GET /api/suppliers - Found ${data.length}`);
    res.json(data);
});
app.post('/api/suppliers', auth, (req, res) => {
    const suppliers = read(suppliersFile);
    const newId = suppliers.length ? Math.max(...suppliers.map(s => s.SupplierID)) + 1 : 1;
    const newSupplier = { SupplierID: newId, ...req.body };
    suppliers.push(newSupplier);
    write(suppliersFile, suppliers);
    res.json(newSupplier);
});
app.put('/api/suppliers/:id', auth, (req, res) => {
    let suppliers = read(suppliersFile);
    const id = parseInt(req.params.id);
    const index = suppliers.findIndex(s => s.SupplierID === id);
    if (index === -1) return res.status(404).json({ error: 'Not found' });
    suppliers[index] = { ...suppliers[index], ...req.body, SupplierID: id };
    write(suppliersFile, suppliers);
    res.json({ success: true });
});
app.delete('/api/suppliers/:id', auth, (req, res) => {
    let suppliers = read(suppliersFile);
    const id = parseInt(req.params.id);
    suppliers = suppliers.filter(s => s.SupplierID !== id);
    write(suppliersFile, suppliers);
    res.json({ success: true });
});

// Materials
app.get('/api/materials', auth, (req, res) => {
    const data = read(materialsFile);
    console.log(`[DATA] GET /api/materials - Found ${data.length}`);
    res.json(data);
});

// Purchases
app.get('/api/purchases', auth, (req, res) => {
    const purchases = read(purchasesFile);
    const projects = read(projectsFile);
    const suppliers = read(suppliersFile);
    const materials = read(materialsFile);
    const enriched = purchases.map(p => ({
        ...p,
        ProjectName: projects.find(pr => pr.ProjectID === p.ProjectID)?.ProjectName,
        SupplierName: suppliers.find(s => s.SupplierID === p.SupplierID)?.SupplierName,
        MaterialName: materials.find(m => m.MaterialID === p.MaterialID)?.MaterialName
    }));
    console.log(`[DATA] Returning ${enriched.length} enriched purchases`);
    res.json(enriched);
});
app.post('/api/purchases', auth, (req, res) => {
    const purchases = read(purchasesFile);
    const newId = purchases.length ? Math.max(...purchases.map(p => p.PurchaseID)) + 1 : 1;
    const newPurchase = { PurchaseID: newId, ...req.body };
    purchases.push(newPurchase);
    write(purchasesFile, purchases);
    res.json(newPurchase);
});
app.delete('/api/purchases/:id', auth, (req, res) => {
    let purchases = read(purchasesFile);
    const id = parseInt(req.params.id);
    purchases = purchases.filter(p => p.PurchaseID !== id);
    write(purchasesFile, purchases);
    res.json({ success: true });
});

// Cost report
app.get('/api/cost-report/:projectId', auth, (req, res) => {
    const projectId = parseInt(req.params.projectId);
    const purchases = read(purchasesFile);
    const materials = read(materialsFile);
    const filtered = purchases.filter(p => p.ProjectID === projectId);
    const report = [];
    for (const mat of materials) {
        const matPurchases = filtered.filter(p => p.MaterialID === mat.MaterialID);
        if (matPurchases.length) {
            const totalQty = matPurchases.reduce((s, p) => s + (p.Quantity || 0), 0);
            const totalCost = matPurchases.reduce((s, p) => s + (p.TotalCost || 0), 0);
            const unitPrice = matPurchases[0]?.UnitPrice || mat.AvgPrice;
            report.push({ MaterialName: mat.MaterialName, TotalQuantity: totalQty, UnitPrice: unitPrice, TotalCost: totalCost });
        }
    }
    res.json(report);
});

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));