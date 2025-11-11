
# Active Rooms Detection System - Server


## 📁 Server Structure

```
server/
├── server.js              # Main Express server
├── db.js                  # Database connection
├── check-final-setup.js   # Database setup verification (see below)
├── .env                   # Environment variables
├── package.json           # Server dependencies
├── package-lock.json      # Locked versions
├── uploads/
│   └── maps/              # Uploaded map images (used by client map display)
└── *.sql                  # Database schema files
```


## 🚀 Getting Started

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Configure database:**
   - Update `.env` file with your database credentials
   - Import database schema from SQL files

3. **Run server:**
   ```bash
   # Development mode
   npm run dev

   # Production mode  
   npm start

   # Test database setup
   npm test
   ```


## 🔧 Environment Variables (.env)

```properties
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=active_rooms
DB_PORT=3306
PORT=3001
```


## 📡 API Endpoints

- `GET /api/health` - Health check (public)
- `POST /api/auth/login` - User authentication (public)
- `GET /api/rooms` - Get all rooms (public)
- `GET /api/areas` - Get all areas (public)
- `GET /api/sensors` - Get all sensors (**requires authentication**)
- `POST /api/sensors` - Add sensor (**admin only**)
- `PUT /api/sensors/:id` - Update sensor (**admin only**)
- `DELETE /api/sensors/:id` - Delete sensor (**admin only**)

### Example: Login (curl)
```bash
curl -X POST http://localhost:3001/api/auth/login \
   -H "Content-Type: application/json" \
   -d '{"username": "admin", "password": "admin123"}'
```

### Example: Get Sensors (curl, with token)
```bash
curl http://localhost:3001/api/sensors \
   -H "Authorization: Bearer <your_token_here>"
```


## 🗄️ Database

MySQL database with tables:
- `users` - User accounts
- `rooms` - Room information
- `sensors` - Sensor data
- `areas` - Area definitions

---

## 🛠️ Database Setup Verification

The script `check-final-setup.js` verifies:
- Database connectivity
- Existence and structure of required tables
- Sample data presence
- Relationship integrity

Run with:
```bash
npm test
```
If setup is correct, you will see a success message. Otherwise, errors will be printed.

---

*See also: [Main Project README](../README.md) for full-stack/project-wide documentation.*