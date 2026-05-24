require('dotenv').config();
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

async function setDefaultUser() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });
    const hashed = await bcrypt.hash('admin123', 10);
    await pool.execute('DELETE FROM User WHERE Username = ?', ['admin']);
    await pool.execute(
        'INSERT INTO User (Username, PasswordHash, FullName, Role) VALUES (?, ?, ?, ?)',
        ['admin', hashed, 'Administrator', 'admin']
    );
    console.log('✅ Default user created: admin / admin123');
    await pool.end();
}
setDefaultUser();