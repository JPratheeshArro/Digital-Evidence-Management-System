<<<<<<< HEAD
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
=======
# Digital Evidence Management System (DEMS)

## Overview

The **Digital Evidence Management System (DEMS)** is a full-stack web application designed to securely manage, store, and track digital evidence. It ensures structured handling of evidence with role-based access control and a scalable architecture suitable for real-world forensic workflows.

---

## Key Features

* 🔐 **Authentication & Authorization** – Secure login using JWT
* 📁 **Case Management** – Create, update, and manage cases
* 📂 **Evidence Handling** – Upload, store, and organize digital evidence
* 📊 **Dashboard** – Centralized view of system activity and data
* 👥 **Role-Based Access** – Controlled access for different user roles
* 🔄 **RESTful APIs** – Structured backend communication

---

## Tech Stack

**Frontend**

* React
* Tailwind CSS
* Vite

**Backend**

* Node.js
* Express.js

**Database**

* MySQL

**Tools**

* Git & GitHub
* Postman

---

## System Architecture

```
User Interface (React)
        ↓
Backend API (Node.js / Express)
        ↓
Database (MySQL)
        ↓
Response to Frontend
```

---
>>>>>>> 518bd3793567222aab9723c4f850ce30f623e7d5

## Project Structure

```
<<<<<<< HEAD
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
=======
dems/
├── backend/
├── frontend/
├── screenshots/
├── README.md
└── .gitignore
```

---

## Installation & Setup

### 1. Clone the Repository

```
git clone https://github.com/YOUR_USERNAME/digital-evidence-management-system.git
cd digital-evidence-management-system
```

---

### 2. Backend Setup

```
cd backend
npm install
npm run dev
```

---

### 3. Frontend Setup

```
cd frontend
npm install
npm run dev
```

---

### 4. Environment Configuration

Create a `.env` file inside the backend directory:

```
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=dems
JWT_SECRET=your_secret
PORT=5000
```

---

## API Overview

| Method | Endpoint           | Description       |
| ------ | ------------------ | ----------------- |
| POST   | /api/auth/login    | User login        |
| POST   | /api/auth/register | User registration |
| GET    | /api/cases         | Fetch all cases   |
| POST   | /api/cases         | Create a case     |
| GET    | /api/evidence      | Fetch evidence    |
| POST   | /api/evidence      | Upload evidence   |

---

## Screenshots

> Add project screenshots in the `/screenshots` folder

```
screenshots/login.png
screenshots/dashboard.png
screenshots/evidence.png
```

---

## Advantages

* Simplifies digital evidence management
* Reduces manual errors and improves traceability
* Scalable and modular architecture
* Secure handling with authentication mechanisms

---

## Limitations

* Limited advanced analytics
* UI can be further enhanced
* Not yet deployed for production use

---

## Future Enhancements

* 🔐 Evidence integrity verification (SHA-256 hashing)
* 📜 Chain-of-custody tracking system
* 🤖 AI-based anomaly detection
* ☁️ Cloud deployment
* 📱 Mobile application support

---

## Author

**Pratheesh Arro J**
B.Tech Computer Science Engineering
SRM Institute of Science and Technology

---

## License

This project is developed for academic and demonstration purposes.
>>>>>>> 518bd3793567222aab9723c4f850ce30f623e7d5
