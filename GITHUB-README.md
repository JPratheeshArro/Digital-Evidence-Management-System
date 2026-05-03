# Digital Evidence Management System (DEMS)

An intelligent, AI-powered Digital Evidence Management System with advanced anomaly detection, risk scoring, and comprehensive analytics.

## 🚀 Features

### **Core Functionality**
- **Evidence Management**: Upload, store, and manage digital evidence with file integrity verification
- **Case Management**: Create and manage cases with evidence association
- **User Management**: Role-based access control (Admin, Officer, Forensic)
- **Audit Logging**: Complete audit trail of all system activities

### **🤖 Intelligent Features**
- **AI-Based Anomaly Detection**: Detect duplicates, cross-case usage, and upload patterns
- **Risk Scoring System**: 0-100 risk scores with colored badges (Critical, High, Medium, Low, Minimal)
- **Explainable Insights**: Detailed metadata and actionable recommendations
- **Activity Analytics**: Real-time metrics, user analytics, and comprehensive dashboards
- **Export Features**: Professional CSV/PDF exports with filtering and customization
- **Intelligent Alerts**: Multi-level alerts with escalation and notification systems

### **🔒 Security Features**
- **SHA-256 File Hashing**: Ensure file integrity and detect duplicates
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Proper authorization for different user roles
- **Input Validation**: Comprehensive validation using express-validator
- **Rate Limiting**: Protection against abuse and DoS attacks
- **Audit Logging**: Complete audit trail of all actions

## 🛠️ Technology Stack

### **Backend**
- **Node.js** with Express.js framework
- **MySQL** database with connection pooling
- **JWT** for authentication
- **Multer** for file uploads
- **Express-validator** for input validation
- **Helmet** for security headers
- **Morgan** for logging
- **PDFKit** for PDF generation
- **json2csv** for CSV export

### **Frontend**
- **React** with modern hooks
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **Axios** for API communication
- **React Router** for navigation

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **MySQL** (v8.0 or higher)
- **npm** or **yarn** package manager

## 🚀 Quick Start

### **1. Clone the Repository**
```bash
git clone https://github.com/yourusername/dems-v2.git
cd dems-v2
```

### **2. Backend Setup**
```bash
cd backend
npm install
```

### **3. Database Setup**
```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE dems;

# Import database schema
mysql -u root -p dems < database/setup.sql

# Configure environment variables
cp .env.example .env
# Edit .env with your database credentials
```

### **4. Start Backend Server**
```bash
npm start
```
Backend will run on: http://localhost:5000

### **5. Frontend Setup**
```bash
cd frontend
npm install
```

### **6. Start Frontend Development Server**
```bash
npm run dev
```
Frontend will run on: http://localhost:5173

## 📁 Project Structure

```
dems-v2/
├── backend/                    # Backend application
│   ├── config/               # Database configuration
│   ├── controllers/          # API controllers
│   ├── middleware/           # Express middleware
│   ├── models/              # Database models
│   ├── routes/              # API routes
│   ├── services/            # Intelligent features services
│   ├── utils/               # Utility functions
│   └── uploads/             # File upload directory
├── frontend/                  # Frontend application
│   ├── public/              # Static assets
│   └── src/                 # React source code
├── database/                  # Database setup files
└── docs/                     # Documentation
```

## 🔌 API Documentation

### **Base URL**: `http://localhost:5000/api`

### **Authentication**
All API endpoints require JWT authentication (except login/register).

```bash
# Login
POST /auth/login
{
  "email": "admin@dems.com",
  "password": "admin123"
}

# Get token in response and use in headers:
Authorization: Bearer YOUR_JWT_TOKEN
```

### **Core Endpoints**

#### **Evidence Management**
- `GET /evidence` - Get all evidence
- `POST /evidence/upload` - Upload evidence
- `GET /evidence/:id` - Get specific evidence
- `PUT /evidence/:id` - Update evidence
- `DELETE /evidence/:id` - Delete evidence

#### **Case Management**
- `GET /cases` - Get all cases
- `POST /cases` - Create new case
- `GET /cases/:id` - Get specific case
- `PUT /cases/:id` - Update case
- `DELETE /cases/:id` - Delete case

#### **User Management**
- `GET /users` - Get all users
- `POST /users` - Create new user
- `GET /users/:id` - Get specific user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### **🤖 Intelligent Features Endpoints**

#### **Anomaly Detection**
- `GET /intelligence/anomalies` - Complete anomaly report
- `GET /intelligence/anomalies/duplicates` - Duplicate evidence detection
- `GET /intelligence/anomalies/cross-case` - Cross-case usage analysis
- `GET /intelligence/anomalies/upload-patterns` - Upload pattern detection

#### **Risk Scoring**
- `POST /intelligence/risk/evidence` - Calculate evidence risk scores
- `POST /intelligence/risk/cases` - Calculate case risk scores
- `GET /intelligence/risk/distribution` - Risk distribution analysis

#### **Activity Analytics**
- `GET /intelligence/analytics/activity` - Activity analytics report
- `GET /intelligence/analytics/realtime` - Real-time metrics
- `GET /intelligence/analytics/user/:userId` - User activity analytics
- `GET /intelligence/analytics/case/:caseId` - Case activity analytics

#### **Export Features**
- `POST /intelligence/export/evidence` - Export evidence data
- `POST /intelligence/export/audit-logs` - Export audit logs
- `POST /intelligence/export/anomaly-report` - Export anomaly report
- `GET /intelligence/export/files` - List export files
- `GET /intelligence/export/download/:filename` - Download file

#### **Alerts**
- `GET /intelligence/alerts` - Get active alerts
- `GET /intelligence/alerts/statistics` - Alert statistics
- `POST /intelligence/alerts/:alertId/acknowledge` - Acknowledge alert
- `POST /intelligence/alerts/:alertId/resolve` - Resolve alert

#### **Dashboard**
- `GET /intelligence/dashboard/summary` - Comprehensive dashboard summary

## 🎯 Default Credentials

### **Admin User**
- **Email**: admin@dems.com
- **Password**: admin123
- **Role**: Admin

### **Test Users**
- **Officer**: officer@dems.com / officer123
- **Forensic**: forensic@dems.com / forensic123

## 🔧 Configuration

### **Environment Variables (.env)**
```env
# Database Configuration
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=dems

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d

# Server Configuration
PORT=5000
NODE_ENV=development
```

## 📊 Intelligent Features

### **Anomaly Detection**
- **Duplicate Evidence**: SHA-256 hash-based duplicate identification
- **Cross-Case Usage**: Files used across multiple cases detection
- **Upload Patterns**: Bulk and rapid upload pattern detection
- **Severity Levels**: Low, Medium, High, Critical

### **Risk Scoring**
- **Evidence Risk**: 0-100 score based on duplicates, cross-case usage, file type
- **Case Risk**: Comprehensive case-level risk analysis
- **Colored Badges**: Visual risk indicators with specific colors
- **Risk Factors**: Detailed breakdown of risk contributors

### **Activity Analytics**
- **Real-time Metrics**: Live activity monitoring and statistics
- **User Analytics**: Individual and group activity patterns
- **Case Analytics**: Per-case activity and engagement metrics
- **Trend Analysis**: Activity trends and growth patterns

### **Export Capabilities**
- **Evidence Export**: CSV/PDF with risk scores and metadata
- **Audit Log Export**: Filterable audit reports
- **Anomaly Reports**: Comprehensive anomaly analysis
- **Activity Reports**: Analytics dashboard exports

## 🚨 Alert System

### **Alert Types**
- **Anomaly Alerts**: Generated from detected anomalies
- **System Alerts**: Health and performance monitoring
- **User Alerts**: Suspicious activity detection
- **Security Alerts**: Potential security issues

### **Severity Levels**
- **Critical**: Immediate attention required
- **High**: Urgent attention needed
- **Medium**: Normal priority
- **Low**: Low priority

### **Notification Channels**
- **In-App**: Real-time dashboard notifications
- **Email**: Email notifications for high-priority alerts
- **SMS**: SMS notifications for critical alerts

## 🔒 Security Features

### **Authentication & Authorization**
- **JWT Tokens**: Secure token-based authentication
- **Role-Based Access**: Admin, Officer, Forensic roles
- **Session Management**: Secure session handling
- **Password Security**: Bcrypt password hashing

### **Data Integrity**
- **SHA-256 Hashing**: File integrity verification
- **Duplicate Detection**: Hash-based duplicate identification
- **Audit Trail**: Complete activity logging
- **Data Validation**: Comprehensive input validation

### **System Security**
- **Rate Limiting**: Protection against abuse
- **CORS Configuration**: Secure cross-origin requests
- **Security Headers**: Helmet.js security headers
- **Input Sanitization**: Express-validator protection

## 📈 Performance Features

### **Database Optimization**
- **Connection Pooling**: Efficient database connections
- **Query Optimization**: Optimized database queries
- **Indexing Strategy**: Proper database indexing
- **Caching**: Intelligent caching for performance

### **API Performance**
- **Async Processing**: Non-blocking operations
- **Batch Operations**: Efficient bulk processing
- **Error Handling**: Comprehensive error management
- **Response Optimization**: Fast API responses

## 🧪 Testing

### **Security Testing**
```bash
# Run security tests
cd backend
npm run test-security
```

### **Intelligent Features Testing**
```bash
# Test intelligent features
node test-intelligent-features.js
```

### **API Testing**
```bash
# Test API endpoints
node test-api-endpoints.js
```

## 📚 Documentation

### **API Documentation**
- **Swagger/OpenAPI**: Available at `/api-docs`
- **Postman Collection**: Available in `docs/` directory
- **API Examples**: Comprehensive examples in documentation

### **Intelligent Features**
- **Anomaly Detection**: Detailed algorithm documentation
- **Risk Scoring**: Risk calculation methodology
- **Analytics**: Metrics and KPIs documentation
- **Alerts**: Alert system documentation

## 🚀 Deployment

### **Development**
```bash
# Backend
cd backend && npm start

# Frontend
cd frontend && npm run dev
```

### **Production**
```bash
# Build frontend
cd frontend && npm run build

# Start production backend
cd backend && NODE_ENV=production npm start
```

### **Docker Deployment**
```bash
# Build and run with Docker
docker-compose up -d
```

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### **Code Style**
- **ESLint**: Follow ESLint configuration
- **Prettier**: Use Prettier for formatting
- **Comments**: Add meaningful comments
- **Testing**: Write tests for new features

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### **Issues**
- **Bug Reports**: Use GitHub Issues
- **Feature Requests**: Use GitHub Discussions
- **Security Issues**: Report privately to maintainers

### **Documentation**
- **Wiki**: Comprehensive documentation in GitHub Wiki
- **API Docs**: Interactive API documentation
- **FAQ**: Frequently asked questions in Wiki

## 📊 Project Status

### **Current Version**: 2.0.0
### **Last Updated**: April 2025
### **Status**: Production Ready
### **Features**: Complete with AI-powered intelligent features

---

## 🏆 Key Achievements

- ✅ **AI-Powered Anomaly Detection**: Advanced pattern recognition
- ✅ **Comprehensive Risk Scoring**: Multi-factor risk assessment
- ✅ **Real-time Analytics**: Live monitoring and insights
- ✅ **Professional Exports**: PDF/CSV with customization
- ✅ **Intelligent Alerts**: Multi-level alert system
- ✅ **Enterprise Security**: Production-ready security features
- ✅ **Modern UI/UX**: Responsive, intuitive interface
- ✅ **Scalable Architecture**: Ready for production deployment

---

**Digital Evidence Management System** - Transforming evidence management with intelligent, AI-powered features for modern law enforcement and forensic agencies.

🚀 **Ready for Production** | 🤖 **AI-Powered** | 🔒 **Enterprise Security** | 📊 **Advanced Analytics**
