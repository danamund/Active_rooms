import { pool, testConnection } from './db.js';

async function checkFinalSetup() {
    console.log('🔍 Checking final database setup...\n');
    
    try {
        await testConnection();
        console.log('✅ Database connection successful\n');
        
        // Check users
        const [users] = await pool.execute('SELECT id, username, role FROM users ORDER BY id');
        console.log('👥 Users:');
        users.forEach(user => {
            console.log(`   ${user.id}: ${user.username} (${user.role === 1 ? 'Admin' : 'User'})`);
        });
        
        // Check rooms
        const [rooms] = await pool.execute('SELECT id, description, x, y FROM rooms ORDER BY CAST(id AS UNSIGNED)');
        console.log('\n🏠 Rooms:');
        rooms.forEach(room => {
            console.log(`   Room ${room.id}: ${room.description} at (${room.x}, ${room.y})`);
        });
        
        // Check sensors
        const [sensors] = await pool.execute(`
            SELECT s.id, s.room_id, s.x, s.y, s.status 
            FROM sensors s 
            ORDER BY s.id
        `);
        console.log('\n📡 Sensors:');
        sensors.forEach(sensor => {
            console.log(`   ${sensor.id}: Room ${sensor.room_id} at (${sensor.x}, ${sensor.y}) - ${sensor.status}`);
        });
        
        console.log(`\n📊 Final Count:`);
        console.log(`   👥 Users: ${users.length}`);
        console.log(`   🏠 Rooms: ${rooms.length}`);
        console.log(`   📡 Sensors: ${sensors.length}`);
        console.log('\n✅ Database is ready for the application!');
        
    } catch (error) {
        console.error('❌ Setup check failed:', error.message);
    } finally {
        process.exit(0);
    }
}

checkFinalSetup();