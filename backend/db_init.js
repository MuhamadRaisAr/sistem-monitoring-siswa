const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Create connection without database first to ensure database exists
const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        process.exit(1);
    }
    console.log('Connected to MySQL server.');

    // Read the SQL schema file
    const schemaPath = path.join(__dirname, '..', 'database', 'skema_database.sql');
    fs.readFile(schemaPath, 'utf8', (err, sql) => {
        if (err) {
            console.error('Error reading schema file:', err);
            connection.end();
            process.exit(1);
        }

        // Split the SQL script into individual queries
        // Note: This is a simple parser that splits by semicolon. It works for standard schemas without triggers/routines.
        const queries = sql
            .split(/;\s*$/m)
            .map(q => q.trim())
            .filter(q => q.length > 0);

        console.log(`Executing ${queries.length} SQL commands...`);

        executeQueries(queries, 0);
    });
});

function executeQueries(queries, index) {
    if (index >= queries.length) {
        console.log('Database initialization completed successfully.');
        connection.end();
        process.exit(0);
    }

    const query = queries[index];
    
    // We can print the first line of query for logging
    const firstLine = query.split('\n')[0].trim();
    console.log(`Executing: ${firstLine}...`);

    connection.query(query, (err) => {
        if (err) {
            // If it's a comment or empty, mysql might error, but we want to know what failed
            console.error(`Error executing query at index ${index}:`, err.message);
            connection.end();
            process.exit(1);
        }
        executeQueries(queries, index + 1);
    });
}
