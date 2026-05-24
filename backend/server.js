const express = require('express');
const cors = require('cors');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Data directory
const DATA_DIR = './data';
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

// Helper functions
const read = (file, def = []) => {
    if (!fs.existsSync(file)) return def;
    return JSON.parse(fs.readFileSync(file));
};
const write = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

// Users file with default admin
const usersFile = `${DATA_DIR}/users.json`;
if (!fs.existsSync(usersFile)) {
    const hashed = bcrypt.hashSync('admin123', 10);
    write(usersFile, [{ UserID: 1, Username: 'admin', PasswordHash: hashed, FullName: 'Administrator', Role: 'admin' }]);
}

// Other data files
const projectsFile = `${DATA_DIR}/projects.json`;
const suppliersFile = `${DATA_DIR}/suppliers.json`;
const materialsFile = `${DATA_DIR}/materials.json`;
const purchasesFile = `${DATA_DIR}/purchases.json`;

if (!fs.existsSync(materialsFile)) {
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
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    jwt.verify(token, 'secretkey', (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};

// Register
app.post('/api/register', async (req, res) => {
    const { username, password, fullName } = req.body;
    const users = read(usersFile);
    if (users.find(u => u.Username === username)) return res.status(400).json({ error: 'Username exists' });
    const newId = users.length ? Math.max(...users.map(u => u.UserID)) + 1 : 1;
    const hashed = bcrypt.hashSync(password, 10);
    users.push({ UserID: newId, Username: username, PasswordHash: hashed, FullName: fullName || username, Role: 'manager' });
    write(usersFile, users);
    res.json({ success: true });
});

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const users = read(usersFile);
    const user = users.find(u => u.Username === username);
    if (!user || !bcrypt.compareSync(password, user.PasswordHash)) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ userId: user.UserID, username: user.Username }, 'secretkey', { expiresIn: '8h' });
    res.json({ success: true, token, user: { id: user.UserID, username: user.Username, fullName: user.FullName, role: user.Role } });
});

// Projects CRUD
app.get('/api/projects', auth, (req, res) => res.json(read(projectsFile)));
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
app.get('/api/suppliers', auth, (req, res) => res.json(read(suppliersFile)));
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
app.get('/api/materials', auth, (req, res) => res.json(read(materialsFile)));

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