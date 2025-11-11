import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { pool, testConnection } from './db.js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.set('trust proxy', true);
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Test database connection on startup
testConnection();

// Simple authentication middleware
const authenticateUser = async (req, res, next) => {
    const { username, password } = req.headers;
    
    if (!username || !password) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    try {
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE username = ? AND password = ?',
            [username, password]
        );

        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        req.user = users[0];
        next();
    } catch (error) {
        res.status(500).json({ success: false, message: 'Authentication error' });
    }
};

const requireAdmin = (req, res, next) => {
    if (req.user.role !== 1) {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
};

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Active Rooms Detection API is running',
        timestamp: new Date().toISOString()
    });
});

// --- Delete Room (admin only) ---
// This endpoint deletes a room by its ID. It requires admin authentication.
// Steps:
// 1. Check if the room exists.
// 2. Unassign all sensors in this room (set room_id to NULL).
// 3. Remove all area-room relations for this room (area_room table).
// 4. Delete the room from the rooms table.
// 5. Return success or error message.
app.delete('/api/rooms/:id', authenticateUser, requireAdmin, async (req, res) => {
    const roomId = req.params.id;
    try {
        // 1. Check if the room exists
        const [rooms] = await pool.execute('SELECT * FROM rooms WHERE id = ?', [roomId]);
        if (rooms.length === 0) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        // 2. Unassign all sensors in this room (set room_id to NULL)
        await pool.execute('UPDATE sensors SET room_id = NULL WHERE room_id = ?', [roomId]);

        // 3. Remove all area-room relations for this room
        await pool.execute('DELETE FROM area_room WHERE room_id = ?', [roomId]);

        // 4. Delete the room itself
        await pool.execute('DELETE FROM rooms WHERE id = ?', [roomId]);

        res.json({ success: true, message: 'Room deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete room', error: error.message });
    }
});

// --- Check if Room ID Exists ---
// GET /api/rooms/check-id?id=1001
app.get('/api/rooms/check-id', async (req, res) => {
    const { id } = req.query;
    if (!id) {
        return res.status(400).json({ exists: false, message: 'Missing id parameter' });
    }
    try {
    const [rows] = await pool.execute('SELECT id FROM rooms WHERE id = ?', [id]);
        res.json({ exists: rows.length > 0 });
    } catch (err) {
        res.status(500).json({ exists: false, message: 'DB error' });
    }
});

// === VALIDATION FUNCTIONS ===
const validateSensorData = (data, isUpdate = false) => {
    const errors = [];
    
    // ID validation (only if not update, or if specified)
    if (data.id !== undefined) {
        if (!data.id || typeof data.id !== 'string' || data.id.trim() === '') {
            errors.push('ID must be a non-empty string');
        } else if (data.id.length > 50) {
            errors.push('ID must be 50 characters or less');
        } else if (!/^[A-Za-z0-9_-]+$/.test(data.id)) {
            errors.push('ID can only contain letters, numbers, underscores, and hyphens');
        }
    } else if (!isUpdate) {
        errors.push('ID is required');
    }
    
    // X coordinate validation
    if (data.x !== undefined) {
        const x = parseInt(data.x);
        if (isNaN(x)) {
            errors.push('X coordinate must be a valid number');
        } else if (x < 0 || x > 800) {
            errors.push('X coordinate must be between 0 and 800');
        }
    } else if (!isUpdate) {
        errors.push('X coordinate is required');
    }
    
    // Y coordinate validation
    if (data.y !== undefined) {
        const y = parseInt(data.y);
        if (isNaN(y)) {
            errors.push('Y coordinate must be a valid number');
        } else if (y < 0 || y > 600) {
            errors.push('Y coordinate must be between 0 and 600');
        }
    } else if (!isUpdate) {
        errors.push('Y coordinate is required');
    }
    
    // Status validation
    if (data.status !== undefined && !['available', 'occupied', 'error'].includes(data.status)) {
        errors.push('Status must be one of: available, occupied, error');
    }
    
    // Room ID validation
    if (data.room_id !== undefined && data.room_id !== null && data.room_id !== '') {
        if (typeof data.room_id !== 'string' || data.room_id.length > 10) {
            errors.push('Room ID must be a string with 10 characters or less');
        }
    }
    
    return errors;
};

const validateUserData = (data) => {
    const errors = [];
    
    // Username validation
    if (!data.username || typeof data.username !== 'string' || data.username.trim() === '') {
        errors.push('Username is required and must be a non-empty string');
    } else if (data.username.length > 50) {
        errors.push('Username must be 50 characters or less');
    } else if (!/^[A-Za-z0-9_-]+$/.test(data.username)) {
        errors.push('Username can only contain letters, numbers, underscores, and hyphens');
    }
    
    // Password validation
    if (!data.password || typeof data.password !== 'string' || data.password.length < 3) {
        errors.push('Password must be at least 3 characters long');
    } else if (data.password.length > 255) {
        errors.push('Password must be 255 characters or less');
    }
    
    // Email validation
    if (data.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            errors.push('Email must be a valid email address');
        } else if (data.email.length > 100) {
            errors.push('Email must be 100 characters or less');
        }
    }
    
    // Phone validation
    if (data.phone) {
        if (typeof data.phone !== 'string' || data.phone.length > 20) {
            errors.push('Phone must be a string with 20 characters or less');
        } else if (!/^[0-9+\-\s()]+$/.test(data.phone)) {
            errors.push('Phone can only contain numbers, +, -, spaces, and parentheses');
        }
    }
    
    // Role validation
    if (data.role !== undefined && ![0, 1, '0', '1'].includes(data.role)) {
        errors.push('Role must be 0 (user) or 1 (admin)');
    }
    
    return errors;
};

const validateRoomData = (data) => {
    const errors = [];
    
    // ID validation
    if (!data.id || typeof data.id !== 'string' || data.id.trim() === '') {
        errors.push('Room ID is required and must be a non-empty string');
    } else if (data.id.length > 10) {
        errors.push('Room ID must be 10 characters or less');
    }
    
    // Description validation
    if (data.description && (typeof data.description !== 'string' || data.description.length > 255)) {
        errors.push('Description must be a string with 255 characters or less');
    }
    
    // Area validation
    if (data.area && (!Number.isInteger(parseInt(data.area)) || parseInt(data.area) < 1)) {
        errors.push('Area must be a valid positive integer (area ID)');
    }
    
    return errors;
};

// === AUTH API ===
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        console.log(`🔐 Login attempt: username="${username}"`);

        // Validation
        const validationErrors = validateUserData({ username, password });
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors
            });
        }

        const [users] = await pool.execute(
            'SELECT id, username, email, phone, role FROM users WHERE username = ? AND password = ?',
            [username, password]
        );

        if (users.length === 0) {
            console.log(`❌ Invalid credentials for: ${username}`);
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const user = users[0];
        console.log(`✅ Login successful for: ${user.username}`);
        
        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                phone: user.phone,
                role: user.role === 1 ? 'admin' : 'user'
            }
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// === ROOMS API ===
app.get('/api/rooms', async (req, res) => {
try {
    const { map_code } = req.query;

    let query = `
    SELECT r.*, a.name as area_name
    FROM rooms r 
    LEFT JOIN areas a ON r.area = a.id
    `;
    const params = [];

    if (map_code) {
    query += ' WHERE r.map_code = ?';
    params.push(map_code);
    }

    query += ' ORDER BY CAST(r.id AS UNSIGNED)';

    const [rows] = await pool.execute(query, params);

    res.json({
    success: true,
    data: rows
    });
} catch (error) {
    res.status(500).json({
    success: false,
    message: 'Error fetching rooms',
    error: error.message
    });
}
});

// --- Add Room (admin only) ---
app.post('/api/rooms', authenticateUser, requireAdmin, async (req, res) => {
    try {
        const { id, description, room_number, x, y, floor, area_id, map_code } = req.body;

        // Validation
        const errors = [];
        if (!id || typeof id !== 'string' || id.trim() === '')
            errors.push('Room ID is required and must be a non-empty string');
        else if (id.length > 10)
            errors.push('Room ID must be 10 characters or less');
        if (!description || typeof description !== 'string' || description.length < 2 || description.length > 255)
            errors.push('Description is required (2-255 chars)');
        if (!room_number || isNaN(room_number))
            errors.push('Room number is required and must be a number');
        if (x === undefined || y === undefined || isNaN(x) || isNaN(y))
            errors.push('x and y coordinates are required and must be numbers');
        if (x < 0 || x > 800 || y < 0 || y > 600)
            errors.push('Coordinates must be within map bounds (x: 0-800, y: 0-600)');
        if (floor !== undefined && floor !== null && floor !== '' && (isNaN(floor) || floor < 0 || floor > 100))
            errors.push('Floor must be a valid number');
        if (area_id !== undefined && area_id !== null && area_id !== '' && isNaN(area_id))
            errors.push('Area ID must be a valid number');
        if (!map_code || typeof map_code !== 'string' || map_code.trim() === '')
            errors.push('Map code is required');

        // Check area exists if area_id provided
        let areaIdToUse = null;
        if (area_id !== undefined && area_id !== null && area_id !== '') {
            const [areas] = await pool.execute('SELECT id FROM areas WHERE id = ?', [area_id]);
            if (areas.length === 0) errors.push('Selected area does not exist');
            else areaIdToUse = area_id;
        }
        // Room ID uniqueness
        const [existingId] = await pool.execute('SELECT id FROM rooms WHERE id = ?', [id]);
        if (existingId.length > 0)
            errors.push('Room ID already exists');
        // Room number uniqueness (per floor/area)
        let whereClause = 'room_name = ?';
        let params = [room_number];
        if (floor !== undefined && floor !== null && floor !== '') {
            whereClause += ' AND floor = ?';
            params.push(floor);
        }
        if (areaIdToUse !== undefined && areaIdToUse !== null && areaIdToUse !== '') {
            whereClause += ' AND area = ?';
            params.push(areaIdToUse);
        } else {
            whereClause += ' AND area IS NULL';
        }
        // Add map_code to uniqueness check
        if (map_code) {
            whereClause += ' AND map_code = ?';
            params.push(map_code);
        }
        const [existingRooms] = await pool.execute(
            `SELECT id FROM rooms WHERE ${whereClause}`,
            params
        );
        if (existingRooms.length > 0)
            errors.push('Room number already exists for this floor/area');

        if (errors.length > 0) {
            return res.status(400).json({ success: false, message: 'Validation failed', errors });
        }

        // Convert empty string floor to null
        const floorValue = (floor === undefined || floor === null || floor === '') ? null : floor;

        await pool.execute(
        `INSERT INTO rooms (id, description, area, x, y, floor, room_name, map_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            id,
            description,
            areaIdToUse,
            x,
            y,
            floorValue,
            room_number,
            map_code.trim()

        ]
        );

        // Update area_room table if area is set
        if (areaIdToUse) {
            await pool.execute(
                `INSERT INTO area_room (area_id, room_id, room_name) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE area_id = VALUES(area_id), room_name = VALUES(room_name)`,
                [areaIdToUse, id, room_number]
            );
        } else {
            // No area: ensure no area_room row exists
            await pool.execute('DELETE FROM area_room WHERE room_id = ?', [id]);
        }

        // Return the new room
        const [roomRows] = await pool.execute(
            `SELECT r.*, a.name as area_name FROM rooms r LEFT JOIN areas a ON r.area = a.id WHERE r.id = ?`,
            [id]
        );

        res.status(201).json({
            success: true,
            message: 'Room added successfully',
            data: roomRows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error adding room',
            error: error.message
        });
    }
});

    app.put('/api/rooms/:id', authenticateUser, requireAdmin, async (req, res) => {
        const roomId = req.params.id;
        const data = req.body;
        const errors = validateRoomData({ ...data, id: roomId });
        // --- Uniqueness check for room_name only if room_name is sent ---
        if (data.room_name !== undefined) {
            let whereClause = 'room_name = ?';
            let params = [data.room_name];
            if (data.floor !== undefined && data.floor !== null && data.floor !== '') {
                whereClause += ' AND floor = ?';
                params.push(data.floor);
            }
            let areaToCheck = data.area !== undefined && data.area !== null && data.area !== '' ? data.area : null;
            if (areaToCheck !== null) {
                whereClause += ' AND area = ?';
                params.push(areaToCheck);
            } else {
                whereClause += ' AND area IS NULL';
            }
            // Add map_code to uniqueness check
            if (data.map_code) {
                whereClause += ' AND map_code = ?';
                params.push(data.map_code);
            }
            whereClause += ' AND id != ?';
            params.push(roomId);
            const [existingRooms] = await pool.execute(
                `SELECT id FROM rooms WHERE ${whereClause}`,
                params
            );
            if (existingRooms.length > 0)
                errors.push('Room number already exists for this floor/area');
        }
        if (errors.length > 0) {
            return res.status(400).json({ success: false, errors });
        }
        try {
            // Build update query dynamically
            const fields = [];
            const values = [];
            if (data.description !== undefined) {
                fields.push('description = ?');
                values.push(data.description);
            }
            if (data.area !== undefined) {
                const areaValue = (data.area === '' || data.area === null) ? null : data.area;
                fields.push('area = ?');
                values.push(areaValue);
            }
            if (data.x !== undefined) {
                fields.push('x = ?');
                values.push(data.x);
            }
            if (data.y !== undefined) {
                fields.push('y = ?');
                values.push(data.y);
            }
            if (data.floor !== undefined) {
                fields.push('floor = ?');
                values.push(data.floor === '' ? null : data.floor);
            }
            // --- Add room_name update ---
            if (data.room_name !== undefined) {
                fields.push('room_name = ?');
                values.push(data.room_name);
            }
            if (fields.length === 0) {
                return res.status(400).json({ success: false, message: 'No fields to update' });
            }
            values.push(roomId);
            const [result] = await pool.execute(
                `UPDATE rooms SET ${fields.join(', ')} WHERE id = ?`,
                values
            );
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Room not found' });
            }
            // Update area_room table if area is set or removed
            if (data.area !== undefined) {
                if (data.area === '' || data.area === null) {
                    // No area: remove from area_room
                    await pool.execute('DELETE FROM area_room WHERE room_id = ?', [roomId]);
                } else {
                    // get room_name (prefer from data, else fetch from DB)
                    let roomName = data.room_name;
                    if (!roomName) {
                        const [rows] = await pool.execute('SELECT room_name FROM rooms WHERE id = ?', [roomId]);
                        roomName = rows.length > 0 ? rows[0].room_name : null;
                    }
                    await pool.execute(
                        `INSERT INTO area_room (area_id, room_id, room_name) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE area_id = VALUES(area_id), room_name = VALUES(room_name)`,
                        [data.area, roomId, roomName]
                    );
                }
            } else if (data.room_name !== undefined) {
                // If only room_name changed (not area) - update also in area_room
                const [rows] = await pool.execute('SELECT area FROM rooms WHERE id = ?', [roomId]);
                const areaId = rows.length > 0 ? rows[0].area : null;
                if (areaId) {
                    await pool.execute(
                        `UPDATE area_room SET room_name = ? WHERE room_id = ?`,
                        [data.room_name, roomId]
                    );
                }
            }
            res.json({ success: true, message: 'Room updated successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });
// === SENSORS API ===
app.get('/api/sensors', authenticateUser, async (req, res) => {
try {
    const { map_code } = req.query;

    let query = `
    SELECT s.*, r.description as room_description, a.name as area_name
    FROM sensors s 
    LEFT JOIN rooms r ON s.room_id = r.id 
    LEFT JOIN areas a ON r.area = a.id
    `;
    const params = [];

    if (map_code) {
    query += ' WHERE s.map_code = ?';
    params.push(map_code);
    }

    query += ' ORDER BY s.id';

    const [rows] = await pool.execute(query, params);

    res.json({
    success: true,
    data: rows
    });
} catch (error) {
    res.status(500).json({
    success: false,
    message: 'Error fetching sensors',
    error: error.message
    });
}
});

// --- Check if Sensor ID Exists ---
// GET /api/sensors/check-id?id=S001
app.get('/api/sensors/check-id', async (req, res) => {
    const { id } = req.query;
    if (!id) {
        return res.status(400).json({ exists: false, message: 'Missing id parameter' });
    }
    try {
        const [rows] = await pool.execute('SELECT id FROM sensors WHERE UPPER(id) = UPPER(?)', [id]);
        res.json({ exists: rows.length > 0 });
    } catch (err) {
        res.status(500).json({ exists: false, message: 'DB error' });
    }
});

// Add Sensor (updated with validation)
app.post('/api/sensors', authenticateUser, requireAdmin, async (req, res) => {
    try {
        let { id, x, y, room_id, status = 'available', map_code } = req.body;

        console.log('📝 Received sensor data:', { id, x, y, room_id, status });

        // Normalize room_id: treat undefined, null, or '' as null for DB
        if (!room_id) room_id = null;

        // Comprehensive validation (isUpdate = false)
        const validationErrors = validateSensorData({ id, x, y, room_id, status }, false);
        if (validationErrors.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Validation failed',
                errors: validationErrors
            });
        }

        // Convert to numbers (after validation)
        const xCoord = parseInt(x);
        const yCoord = parseInt(y);

        // Check if sensor already exists (case-insensitive)
        const [existingSensors] = await pool.execute(
            'SELECT id FROM sensors WHERE UPPER(id) = UPPER(?)',
            [id]
        );

        if (existingSensors.length > 0) {
            return res.status(409).json({ 
                success: false, 
                message: `Sensor ${id} already exists` 
            });
        }

        // Check if room exists (if specified)
        // room_id is optional: only check if provided
        if (room_id) {
            const [existingRooms] = await pool.execute(
                'SELECT id FROM rooms WHERE id = ?',
                [room_id]
            );

            if (existingRooms.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Room ${room_id} does not exist` 
                });
            }
        }

        // Adding sensor
        await pool.execute(
            'INSERT INTO sensors (id, x, y, room_id, status, created_at, updated_at, map_code) VALUES (?, ?, ?, ?, ?, NOW(), NOW(), ?)',
            [id, xCoord, yCoord, room_id, status, map_code || null]
        );

        console.log(`✅ Sensor added: ${id} at (${xCoord}, ${yCoord})`);
        
        res.status(201).json({ 
            success: true, 
            message: `Sensor ${id} added successfully`,
            data: { id, x: xCoord, y: yCoord, room_id, status }
        });

    } catch (error) {
        console.error('❌ Error adding sensor:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Database error: ' + error.message 
        });
    }
});

// Update Sensor (updated with validation)
app.put('/api/sensors/:id', authenticateUser, requireAdmin, async (req, res) => {
    try {
        const { x, y, status, room_id } = req.body;
        const sensorId = req.params.id;

        console.log(`📝 Updating sensor ${sensorId}:`, { x, y, status, room_id });

        // URL ID validation
        if (!sensorId || typeof sensorId !== 'string' || sensorId.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Sensor ID in URL is required'
            });
        }

        // Check that there is at least one field to update
        if (x === undefined && y === undefined && status === undefined && room_id === undefined) {
            return res.status(400).json({
                success: false,
                message: 'At least one field (x, y, status, room_id) must be provided for update'
            });
        }

        // Validation of updated data (only for sent fields)
        const updateData = {};
        if (x !== undefined) updateData.x = x;
        if (y !== undefined) updateData.y = y;
        if (status !== undefined) updateData.status = status;
        if (room_id !== undefined) updateData.room_id = room_id;

        // Call validation with isUpdate = true
        const validationErrors = validateSensorData(updateData, true);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors
            });
        }

        // Check if sensor exists
        const [existingSensors] = await pool.execute(
            'SELECT id, x, y, status, room_id FROM sensors WHERE id = ?',
            [sensorId]
        );

        if (existingSensors.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Sensor ${sensorId} not found`
            });
        }

        const currentSensor = existingSensors[0];

        // Check if room exists (if specified)
        if (room_id !== undefined && room_id !== null && room_id !== '') {
            const [existingRooms] = await pool.execute(
                'SELECT id FROM rooms WHERE id = ?',
                [room_id]
            );

            if (existingRooms.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Room ${room_id} does not exist` 
                });
            }
        }

        // Build query only with fields that need to be updated
        const updateFields = [];
        const updateValues = [];

        if (x !== undefined) {
            updateFields.push('x = ?');
            updateValues.push(parseInt(x));
        }
        if (y !== undefined) {
            updateFields.push('y = ?');
            updateValues.push(parseInt(y));
        }
        if (status !== undefined) {
            updateFields.push('status = ?');
            updateValues.push(status);
        }
        if (room_id !== undefined) {
            updateFields.push('room_id = ?');
            updateValues.push(room_id || null);
        }

        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(sensorId);

        // Update sensor
        const [result] = await pool.execute(
            `UPDATE sensors SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sensor not found'
            });
        }

        console.log(`✅ Sensor updated: ${sensorId}`);
        res.json({
            success: true,
            message: `Sensor ${sensorId} updated successfully`,
            updated: {
                ...currentSensor,
                ...(x !== undefined && { x: parseInt(x) }),
                ...(y !== undefined && { y: parseInt(y) }),
                ...(status !== undefined && { status }),
                ...(room_id !== undefined && { room_id })
            }
        });

    } catch (error) {
        console.error('❌ Error updating sensor:', error);
        res.status(500).json({
            success: false,
            message: 'Database error: ' + error.message
        });
    }
});

// Delete Sensor (updated with validation)
app.delete('/api/sensors/:id', authenticateUser, requireAdmin, async (req, res) => {
    try {
        const sensorId = req.params.id;
        
        console.log(`🗑️ Attempting to delete sensor: ${sensorId}`);
        
        // ID validation
        if (!sensorId || typeof sensorId !== 'string' || sensorId.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Sensor ID is required and must be a valid string'
            });
        }

        if (sensorId.length > 50) {
            return res.status(400).json({
                success: false,
                message: 'Sensor ID must be 50 characters or less'
            });
        }
        
        // Check if sensor exists
        const [existingSensors] = await pool.execute(
            'SELECT id FROM sensors WHERE id = ?',
            [sensorId]
        );

        if (existingSensors.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: `Sensor ${sensorId} not found` 
            });
        }

        // Delete sensor
        const [result] = await pool.execute(
            'DELETE FROM sensors WHERE id = ?',
            [sensorId]
        );

        if (result.affectedRows > 0) {
            console.log(`✅ Sensor deleted: ${sensorId}`);
            res.json({ 
                success: true, 
                message: `Sensor ${sensorId} deleted successfully` 
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Failed to delete sensor' 
            });
        }

    } catch (error) {
        console.error('❌ Error deleting sensor:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Database error: ' + error.message 
        });
    }
});

// === AREAS API ===
app.get('/api/areas', async (req, res) => {
try {
    const { map_code } = req.query;

    let query = `SELECT * FROM areas`;
    const params = [];

    if (map_code) {
    query += ' WHERE map_code = ?';
    params.push(map_code);
    }

    query += ' ORDER BY name';

    const [rows] = await pool.execute(query, params);

    res.json({
    success: true,
    data: rows
    });
} catch (error) {
    res.status(500).json({
    success: false,
    message: 'Error fetching areas',
    error: error.message
    });
}
});

// --- Check if Area ID Exists ---
// GET /api/areas/check-id?id=001
app.get('/api/areas/check-id', async (req, res) => {
    const { id } = req.query;
    if (!id) {
        return res.status(400).json({ exists: false, message: 'Missing id parameter' });
    }
    try {
        const [rows] = await pool.execute('SELECT id FROM areas WHERE id = ?', [id]);
        res.json({ exists: rows.length > 0 });
    } catch (err) {
        res.status(500).json({ exists: false, message: 'DB error' });
    }
});

// --- Add Area (admin only) ---
app.post('/api/areas', authenticateUser, requireAdmin, async (req, res) => {
    try {
        const { id, name, description, map_code } = req.body;
        const errors = [];
        // Validation
        if (!name || typeof name !== 'string' || name.trim().length < 2 || name.length > 100)
            errors.push('Name is required (2-100 chars)');
        if (description && description.length > 255)
            errors.push('Description must be 255 chars or less');
        if (id && (typeof id !== 'string' || id.length > 10))
            errors.push('ID must be up to 10 chars');
         // map_code is required to separate areas by map
        if (!map_code || typeof map_code !== 'string' || !map_code.trim())
        errors.push('map_code is required');
        // Check unique id if provided
        if (id) {
            const [existing] = await pool.execute('SELECT id FROM areas WHERE id = ?', [id]);
            if (existing.length > 0) errors.push('ID already exists');
        }
        if (errors.length > 0) {
            return res.status(400).json({ success: false, message: 'Validation failed', errors });
        }
        // Insert 
        const insertFields = ['name','description','map_code'];
        const insertValues = [name, description || null, map_code.trim()];
        if (id) { insertFields.unshift('id'); insertValues.unshift(id); }

        const fieldsStr = insertFields.join(', ');
        const qMarks = insertFields.map(() => '?').join(', ');
        await pool.execute(`INSERT INTO areas (${fieldsStr}) VALUES (${qMarks})`, insertValues);

        // Return the new record
        const [rows] = id
        ? await pool.execute('SELECT * FROM areas WHERE id = ?', [id])
        : await pool.execute('SELECT * FROM areas ORDER BY id DESC LIMIT 1');

        res.status(201).json({ success: true, message: 'Area added successfully', data: rows[0] });

    } catch (error) {
        console.error('❌ Error adding area:', error);
        res.status(500).json({ success: false, message: 'Error adding area', error: error.message });
    }
});

// --- Update Area (admin only) ---
// This endpoint updates an area's name and description. Requires admin authentication.
app.put('/api/areas/:id', authenticateUser, requireAdmin, async (req, res) => {
    const areaId = req.params.id;
    const { name, description } = req.body;
    const errors = [];
    // Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2 || name.length > 100)
        errors.push('Name is required (2-100 chars)');
    if (description && description.length > 255)
        errors.push('Description must be 255 chars or less');
    if (errors.length > 0) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }
    try {
        // Check if area exists
        const [areas] = await pool.execute('SELECT id FROM areas WHERE id = ?', [areaId]);
        if (areas.length === 0) {
            return res.status(404).json({ success: false, message: 'Area not found' });
        }
        // Update area
        await pool.execute('UPDATE areas SET name = ?, description = ? WHERE id = ?', [name, description || null, areaId]);
        // Return updated area
        const [rows] = await pool.execute('SELECT * FROM areas WHERE id = ?', [areaId]);
        res.json({ success: true, message: 'Area updated successfully', data: rows[0] });
    } catch (error) {
        console.error('❌ Error updating area:', error);
        res.status(500).json({ success: false, message: 'Error updating area', error: error.message });
    }
});

// --- Delete Area (admin only) ---
// This endpoint deletes an area by its ID. It requires admin authentication.
// Steps:
// 1. Check if the area exists.
// 2. Remove all area-room relations for this area (area_room table).
// 3. Set area=null for all rooms that belong to this area.
// 4. Delete the area from the areas table.
// 5. Return success or error message.
app.delete('/api/areas/:id', authenticateUser, requireAdmin, async (req, res) => {
    const areaId = req.params.id;
    try {
        // 1. Check if the area exists
        const [areas] = await pool.execute('SELECT id FROM areas WHERE id = ?', [areaId]);
        if (areas.length === 0) {
            return res.status(404).json({ success: false, message: 'Area not found' });
        }
        // 2. Remove all area-room relations for this area
        await pool.execute('DELETE FROM area_room WHERE area_id = ?', [areaId]);
        // 3. Set area=null for all rooms that belong to this area
        await pool.execute('UPDATE rooms SET area = NULL WHERE area = ?', [areaId]);
        // 4. Delete the area from the areas table
        const [result] = await pool.execute('DELETE FROM areas WHERE id = ?', [areaId]);
        // 5. Return success or error message
        if (result.affectedRows > 0) {
            res.json({ success: true, message: 'Area deleted successfully' });
        } else {
            res.status(500).json({ success: false, message: 'Failed to delete area' });
        }
    } catch (error) {
        console.error('❌ Error deleting area:', error);
        res.status(500).json({ success: false, message: 'Error deleting area', error: error.message });
    }
});
// === STATUS API ===
app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        message: 'Server supports multiple concurrent connections with comprehensive validation',
        info: {
            activeConnections: 'Multiple clients can connect simultaneously',
            technology: 'Express.js with async/await',
            database: 'MySQL connection pool',
            validation: 'Comprehensive data validation enabled'
        },
        timestamp: new Date().toISOString()
    });
});

// Path to uploads directory
const uploadsDir = path.join(process.cwd(), 'uploads', 'maps');

// Ensure the directory exists
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads', 'maps'));
},
filename: function (req, file, cb) {
    cb(null, file.originalname); // Uses the name sent from the client
}
});


const upload = multer({ storage });

app.post('/api/maps/upload', (req, res, next) => {
req.on('data', (chunk) => {
    console.log('Incoming data chunk:', chunk.toString());
});
next();
});


// Dedicated API router
const api = express.Router();
// After const api = express.Router(); and near the maps routes:

/**
 * GET /api/zones?map=<map_code>
 * Returns the list of zones for a map.
 * If you don't have a real polygons table yet – at least return the map record so the UI won't break.
 */
api.get('/zones', async (req, res) => {
try {
    const { map } = req.query;
    if (!map) return res.status(400).json({ success: false, message: 'map is required' });

    // New structure: map_code (PK), path (filename)
    const [rows] = await pool.execute(
        'SELECT map_code, path, created_at FROM zones WHERE map_code = ?',
        [map]
    );

    return res.json({ success: true, data: rows || [] });
} catch (err) {
    console.error('❌ /api/zones error:', err);
    res.status(500).json({ success: false, message: 'DB error: ' + err.message });
}
});

/**
 * GET /api/maps
 * Returns a list of maps (map_code + filename + created_at)
 * (In this implementation we save in the DB in the zones table: columns = map_code (PK), path (filename), created_at)
 */
api.get('/maps', async (req, res) => {
try {
    const [rows] = await pool.execute(
        'SELECT map_code, path AS filename, created_at FROM zones ORDER BY created_at DESC'
    );
    res.json({ success: true, data: rows });
} catch (err) {
    console.error('❌ Error fetching maps:', err);
    res.status(500).json({ success: false, message: 'DB error: ' + err.message });
}
});

/**
 *  POST /api/maps/upload
 * Receives a map image and saves the relation map_code → filename in the zones table
 */
api.post('/maps/upload', upload.single('mapImage'), async (req, res) => {
try {
    const { map_code } = req.body;
    if (!map_code || !req.file) {
        return res.status(400).json({ success: false, message: 'Missing map_code or file' });
    }

    // Save/update in DB: map_code → path (filename)
    await pool.execute(
        `INSERT INTO zones (map_code, path, created_at, updated_at)
         VALUES (?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE path = VALUES(path), updated_at = NOW()`,
        [map_code, req.file.filename]
    );

    // Absolute URL (with server domain and port), not relative
    const base =
        process.env.APP_BASE_URL            // e.g.: http://localhost:3001
        || `${req.protocol}://${req.get('host')}`;

    const publicUrl = `${base}/uploads/maps/${req.file.filename}`;

    return res.json({
        success: true,
        message: 'Map uploaded and saved!',
        data: {
            map_code,
            filename: req.file.filename,
            url: publicUrl,                  // This is what the client should use
        }
    });
} catch (err) {
    console.error('❌ Upload error:', err);
    res.status(500).json({ success: false, message: 'DB error: ' + err.message });
}
});

api.get('/maps/:map_code/image', async (req, res) => {
try {
    const { map_code } = req.params;

    const [rows] = await pool.execute(
        'SELECT path FROM zones WHERE map_code = ?',
        [map_code]
    );

    if (!rows.length || !rows[0].path) {
        return res.status(404).json({ success: false, message: 'Map not found', url: null });
    }

    const filename = rows[0].path;

    const base =
        process.env.APP_BASE_URL  // e.g.: http://localhost:3001
        || `${req.protocol}://${req.get('host')}`;

    const publicUrl = `${base}/uploads/maps/${filename}`;

    return res.json({ success: true, url: publicUrl });
} catch (err) {
    console.error('❌ image endpoint error:', err);
    res.status(500).json({ success: false, message: 'DB error: ' + err.message, url: null });
}
});

app.delete('/api/maps/:map_code', async (req, res) => {
const map_code = (req.params.map_code || '').toUpperCase();
const force = String(req.query.force || '') === 'true';

try {
    if (!map_code) {
        return res.status(400).json({ success: false, message: 'Missing map_code' });
    }
    if (map_code === 'HIT') {
        return res.status(400).json({ success: false, message: 'Cannot delete default map HIT' });
    }

    // Count dependencies
    const [[{ cnt_rooms }]]   = await pool.query('SELECT COUNT(*) AS cnt_rooms FROM rooms WHERE map_code = ?', [map_code]);
    const [[{ cnt_areas }]]   = await pool.query('SELECT COUNT(*) AS cnt_areas FROM areas WHERE map_code = ?', [map_code]);
    const [[{ cnt_sensors }]] = await pool.query('SELECT COUNT(*) AS cnt_sensors FROM sensors WHERE map_code = ?', [map_code]);
    const [[{ cnt_zones }]]   = await pool.query('SELECT COUNT(*) AS cnt_zones FROM zones  WHERE map_code = ?', [map_code]);

    const deps = { rooms: cnt_rooms, areas: cnt_areas, sensors: cnt_sensors, zones: cnt_zones };
    const total = cnt_rooms + cnt_areas + cnt_sensors + cnt_zones;

    if (total > 0 && !force) {
        return res.status(409).json({
            success: false,
            message: 'Map has dependent records',
            deps
        });
    }

    // If force=true — delete everything in a transaction
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // Delete image file (if exists) — get path from zones
        const [zoneRows] = await conn.query('SELECT path FROM zones WHERE map_code = ?', [map_code]);
        if (zoneRows.length && zoneRows[0].path) {
            const filePath = path.join(__dirname, 'uploads', 'maps', zoneRows[0].path);
            try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (e) { /* Ignore delete error */ }
        }

        await conn.query('DELETE FROM sensors WHERE map_code = ?', [map_code]);
        await conn.query('DELETE FROM rooms   WHERE map_code = ?', [map_code]);
        await conn.query('DELETE FROM areas   WHERE map_code = ?', [map_code]);
        await conn.query('DELETE FROM zones   WHERE map_code = ?', [map_code]);

        await conn.commit();
        return res.json({ success: true, message: 'Map deleted', deleted: deps });
    } catch (err) {
        await conn.rollback();
        console.error('Delete map rollback:', err);
        return res.status(500).json({ success: false, message: 'Failed to delete map' });
    } finally {
        conn.release();
    }
} catch (error) {
    console.error('Delete map error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
}
});


// Important: expose the static folder for images
app.use('/uploads/maps', express.static(path.join(__dirname, 'uploads', 'maps')));
// Must register the Router before the SPA fallback
app.use('/api', api);

// SPA static + fallback (leave as is, but outside any other route)
app.use(express.static(path.join(process.cwd(), 'client', 'build')));
app.get('*', (req, res) => {
res.sendFile(path.join(process.cwd(), 'client', 'build', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Active Rooms Detection Server running on port ${PORT}`);
    console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
    console.log(`✅ Comprehensive validation enabled`);
});
