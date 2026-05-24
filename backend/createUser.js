require('dotenv').config();
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

async function createUser() {
    // Debug: print loaded config (remove after success)
    console.log('DB_HOST:', process.env.DB_HOST);
    console.log('DB_USER:', process.env.DB_USER);
    console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : '(empty)');
    console.log('DB_NAME:', process.env.DB_NAME);

    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10
    });

    try {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await pool.execute(
            'INSERT INTO User (Username, PasswordHash, FullName, Role) VALUES (?, ?, ?, ?)',
            ['admin', hashedPassword, 'Administrator', 'admin']
        );
        console.log('✅ User created successfully!');
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            console.log('⚠️ User already exists.');
        } else {
            console.error('❌ Error:', err.message);
        }
    } finally {
        await pool.end();
        process.exit();
    }
}

createUser();