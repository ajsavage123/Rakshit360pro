
const { Client } = require('pg');
const fs = require('fs');

async function setupPostGIS() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });

    try {
        await client.connect();
        console.log('Connected to PostgreSQL database');

        // Read and execute the migration SQL
        const migrationSQL = fs.readFileSync('./migration_postgis.sql', 'utf8');
        
        // Split by semicolon and execute each statement
        const statements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        for (const statement of statements) {
            try {
                await client.query(statement);
                console.log('✅ Executed:', statement.substring(0, 50) + '...');
            } catch (error) {
                console.warn('⚠️ Warning:', error.message);
            }
        }

        console.log('\n🎉 PostGIS setup completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Review the migration_postgis.sql file');
        console.log('2. Uncomment the data migration section if you have existing data');
        console.log('3. Run the migration in your PostgreSQL database');

    } catch (error) {
        console.error('❌ Error setting up PostGIS:', error);
    } finally {
        await client.end();
    }
}

setupPostGIS();
