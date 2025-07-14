# 🔐 NestJS Authentication System

A robust authentication and user management system built with NestJS, MongoDB, and JWT tokens.

## ✨ Features

- **🔑 JWT Authentication** - Secure token-based authentication
- **👥 Role-Based Access Control** - Three user roles (Admin, Officer, Supervisor)
- **🛡️ Password Security** - bcrypt password hashing
- **📊 User Management** - Track login/logout status and history
- **🚫 Business Rules** - Single admin registration, single supervisor login
- **📈 Monitoring** - Real-time user status tracking

## 🎯 User Roles & Restrictions

| Role | Registration | Login | Special Rules |
|------|-------------|-------|---------------|
| **Admin** | ⚠️ Only 1 allowed | ✅ Multiple | Full system access |
| **Officer** | ✅ Unlimited | ✅ Multiple | Standard access |
| **Supervisor** | ✅ Unlimited | ⚠️ Only 1 at a time | Single login restriction |

## 🚀 Quick Start

### Prerequisites
- Node.js (≥16.0.0)
- MongoDB (local or cloud)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nest-auth-project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   Create a `.env` file in the root directory:
   ```env
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   
   # Database Configuration  
   MONGODB_URI=mongodb://localhost:27017/nest-auth-db
   # OR for MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database-name?retryWrites=true&w=majority
   
   # Application Configuration
   PORT=3000
   NODE_ENV=development
   ```
   
   **Note:** Never commit your `.env` file to version control. It's already included in `.gitignore`.

4. **Start the application**
   ```bash
   # Development mode
   npm run start:dev
   
   # Production mode
   npm run build
   npm run start
   ```

5. **Access the API**
   
   The server will be running at `http://localhost:3000`

## 📚 API Documentation

### 🔐 Authentication Routes

| Route | Method | Access | Description |
|-------|--------|--------|-------------|
| `/auth/register` | POST | Public | Register new user |
| `/auth/login` | POST | Public | User login |
| `/auth/logout` | POST | JWT Required | User logout |
| `/auth/system-status` | GET | Public | System status |
| `/auth/logged-in-users` | GET | Admin Only | Get all logged-in users |
| `/auth/login-records` | GET | Admin Only | Get login records |

### 👥 User Management Routes

| Route | Method | Access | Description |
|-------|--------|--------|-------------|
| `/users/online` | GET | JWT Required | Get online users |
| `/users/offline` | GET | JWT Required | Get offline users |
| `/users/records` | GET | JWT Required | Get login records |

## 🧪 API Examples

### Register a User
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "username": "admin",
    "password": "password123",
    "role": "admin"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "password123"
  }'
```

### Access Protected Route
```bash
curl -X GET http://localhost:3000/auth/logged-in-users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🏗️ Project Structure

```
src/
├── auth/                 # Authentication module
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.module.ts
│   └── jwt.strategy.ts
├── users/                # User management module
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── users.module.ts
│   ├── schemas/
│   └── dto/
├── common/               # Shared utilities
│   ├── guards/
│   └── decorators/
├── config/               # Configuration
├── app.module.ts         # Root module
└── main.ts              # Application entry point
```

## 🛡️ Security Features

- **Password Hashing**: Uses bcrypt with salt rounds
- **JWT Tokens**: 24-hour expiration
- **Role-based Authorization**: Guards and decorators
- **Input Validation**: DTO validation with class-validator
- **Environment Variables**: Sensitive data protection

## 🔧 Development

### Available Scripts

```bash
npm run build          # Build the application
npm run start          # Start production server
npm run start:dev      # Start development server
npm run start:debug    # Start with debugging
```

### Database Schema

**User Model:**
```typescript
{
  email: string (unique)
  username: string
  password: string (hashed)
  role: 'admin' | 'officer' | 'supervisor'
  isLoggedIn: boolean
  loginTime: Date
  logoutTime: Date
  lastLoginTime: Date
  lastLogoutTime: Date
}
```

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `JWT_SECRET` | Secret key for JWT signing | ✅ Yes |
| `MONGODB_URI` | MongoDB connection string | ✅ Yes |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙋‍♂️ Support

If you have any questions or need help, please open an issue or contact the development team.

---

**Built with ❤️ using NestJS, MongoDB, and TypeScript** 