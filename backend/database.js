const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./cpt.db');

db.serialize(() => {
  // Projects table
  db.run(`CREATE TABLE IF NOT EXISTS Project (
    ProjectID INTEGER PRIMARY KEY AUTOINCREMENT,
    ProjectName TEXT NOT NULL,
    ClientName TEXT,
    StartDate TEXT,
    EndDate TEXT,
    Budget REAL
  )`);

  // Suppliers table
  db.run(`CREATE TABLE IF NOT EXISTS Supplier (
    SupplierID INTEGER PRIMARY KEY AUTOINCREMENT,
    SupplierName TEXT NOT NULL,
    ContactPerson TEXT,
    PhoneNumber TEXT
  )`);

  // Materials table
  db.run(`CREATE TABLE IF NOT EXISTS Material (
    MaterialID INTEGER PRIMARY KEY AUTOINCREMENT,
    MaterialName TEXT NOT NULL,
    UnitOfMeasure TEXT,
    AvgPrice REAL
  )`);

  // Purchases table
  db.run(`CREATE TABLE IF NOT EXISTS Purchase (
    PurchaseID INTEGER PRIMARY KEY AUTOINCREMENT,
    PurchaseDate TEXT,
    Quantity REAL,
    UnitPrice REAL,
    TotalCost REAL,
    ProjectID INTEGER,
    SupplierID INTEGER,
    MaterialID INTEGER,
    FOREIGN KEY (ProjectID) REFERENCES Project(ProjectID),
    FOREIGN KEY (SupplierID) REFERENCES Supplier(SupplierID),
    FOREIGN KEY (MaterialID) REFERENCES Material(MaterialID)
  )`);

  // Insert materials with average price
  const materials = [
    ['Cement', 'per 50kg bag', 9000],
    ['River Sand', 'per cubic meter', 35000],
    ['Crushed Stones', 'per cubic meter', 45000],
    ['Steel Rebar', 'per piece', 12000],
    ['Bricks', 'per 100 pieces', 15000],
    ['Paint', 'per 20-liter bucket', 75000]
  ];

  const stmt = db.prepare(`INSERT INTO Material (MaterialName, UnitOfMeasure, AvgPrice) VALUES (?, ?, ?)`);
  for (let m of materials) {
    stmt.run(m[0], m[1], m[2]);
  }
  stmt.finalize();

  console.log('Database initialized with tables and materials.');
});

db.close();