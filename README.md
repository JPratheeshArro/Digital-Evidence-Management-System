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

## Project Structure

```
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
