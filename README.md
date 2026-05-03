# Full-Stack Application

A modern full-stack application with React frontend and Node.js/Express backend.

## Tech Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- Axios

### Backend
- Node.js
- Express.js
- MVC Architecture
- MySQL

## Project Structure

```
dems-v2/
├── frontend/          # React frontend
├── backend/           # Node.js backend
├── database/          # Database setup and migrations
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Update .env with your database credentials
npm run dev
```

The backend server will start on `http://localhost:5000`

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The frontend will start on `http://localhost:3000`

### Database Setup
1. Install MySQL on your system
2. Create a database named `dems_db`
3. Update database configuration in `backend/.env`
4. Run the initialization script:
```bash
mysql -u root -p < database/init.sql
```

## Environment Variables

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=dems_db
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Users (Protected)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Health Check
- `GET /health` - Server health status

## Features

- ✅ User authentication with JWT
- ✅ Role-based access control
- ✅ User management CRUD operations
- ✅ Responsive design with Tailwind CSS
- ✅ API error handling
- ✅ Input validation
- ✅ Security middleware
- ✅ Database connection pooling
- ✅ Environment configuration

## Development

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests (if configured)
cd frontend
npm test
```

### Building for Production
```bash
# Backend
cd backend
npm start

# Frontend
cd frontend
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
