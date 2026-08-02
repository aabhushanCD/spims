# 💊 SPIMS — Smart Pharmacy Inventory Management System

<p align="center">
  <img src="https://img.shields.io/badge/React-19-blue?logo=react" />
  <img src="https://img.shields.io/badge/Node.js-Express-green?logo=node.js" />
  <img src="https://img.shields.io/badge/MongoDB-Database-brightgreen?logo=mongodb" />
  <img src="https://img.shields.io/badge/Redis-Caching-red?logo=redis" />
  <img src="https://img.shields.io/badge/JWT-Authentication-black" />
  <img src="https://img.shields.io/badge/License-MIT-blue" />
</p>

<p align="center">
A modern, scalable Pharmacy Inventory Management System built with the MERN stack that automates inventory tracking, batch management, sales, purchasing, supplier management, expiry monitoring, and intelligent reorder recommendations.
</p>

---

# 📖 Overview

SPIMS (Smart Pharmacy Inventory Management System) is a full-stack web application designed to simplify pharmacy operations by managing medicines, inventory, suppliers, purchases, sales, and analytics from a single platform.

Unlike traditional inventory systems, SPIMS tracks medicine batches individually, monitors expiry dates, automatically recommends reorder quantities using inventory analytics, and ensures secure access through Role-Based Access Control (RBAC).

The backend follows a **Modular Layered Architecture**, making the application scalable, maintainable, and easy to extend.

---

# ✨ Features

## 📦 Inventory Management

- Medicine CRUD
- Inventory Tracking
- Batch-wise Stock Management
- Automatic Stock Updates
- Available Stock Calculation
- Reserved Stock Management

---

## 💊 Batch Management

Every medicine is managed batch-wise with:

- Batch Number
- Manufacturing Date
- Expiry Date
- Purchase Price
- Selling Price
- Quantity Received
- Remaining Quantity

Benefits:

- Accurate inventory
- Expiry tracking
- Batch history
- FEFO sales

---

## 🔄 FEFO (First Expire First Out)

During every sale, SPIMS automatically selects the medicine batch with the nearest expiry date.

Benefits

- Reduces medicine wastage
- Prevents expired medicine sales
- Industry-standard pharmacy practice

---

## 📉 Smart Inventory Analytics

The system continuously calculates:

- Current Stock
- Available Stock
- Reserved Stock
- Safety Stock
- Reorder Point

---

## 📈 Intelligent Reorder Recommendation

Instead of using fixed reorder levels, SPIMS calculates reorder recommendations using:

- Weighted Average Daily Sales (WADS)
- Supplier Lead Time
- Safety Stock
- Current Inventory
- Expiry Risk

This helps pharmacies purchase medicines only when necessary.

---

## ⏰ Expiry Monitoring

Automatically identifies

- Expired Medicines
- Near Expiry Medicines
- Soon-to-expire batches

Scheduled Cron Jobs continuously monitor medicine expiry.

---

## 🛒 Sales Management

Features include

- Invoice Generation
- Multiple Sale Items
- Automatic Inventory Deduction
- Payment Recording
- Sales History

Inventory updates happen automatically after every successful sale.

---

## 🏭 Purchase Order Management

- Create Purchase Orders
- Supplier Selection
- Receive Orders
- Update Inventory
- Batch Creation
- Purchase History

---

## 🚚 Supplier Management

Manage

- Supplier Details
- Contact Information
- Purchase History
- Active Suppliers

---

## 📊 Dashboard & Reports

Dashboard includes

- Total Medicines
- Current Inventory
- Low Stock Medicines
- Expiring Medicines
- Top Selling Medicines
- Monthly Sales
- Purchase Reports

---

## 👥 Authentication & Authorization

Authentication

- JWT Authentication
- Secure Password Hashing
- Protected Routes

Authorization

Role-Based Access Control (RBAC)

Supported Roles

- Owner
- Pharmacist
- Inventory Manager

Each role has its own permissions.

---

# 🏗 Architecture

The backend follows a **Modular Layered Architecture**.

```
Client
      │
      ▼
Controllers
      │
      ▼
Services
      │
      ▼
Repositories
      │
      ▼
MongoDB
```

Each layer has a single responsibility.

### Controllers

- Handle HTTP Requests
- Return Responses
- Call Services

### Services

- Business Logic
- Transactions
- Inventory Calculations
- Validation

### Repositories

- Database Operations
- Aggregation Queries
- CRUD

### Models

- MongoDB Schemas

### Schemas

- Zod Validation

### Types

- TypeScript Interfaces

---

# 📂 Project Structure

```
SPIMS
│
├── client
│   ├── src
│   │   ├── components
│   │   ├── features
│   │   ├── hooks
│   │   ├── layouts
│   │   ├── pages
│   │   ├── services
│   │   └── utils
│   │
│   └── package.json
│
├── server
│   ├── src
│   │
│   ├── modules
│   │
│   │   ├── auth
│   │   ├── inventory
│   │   ├── medicine
│   │   ├── sales
│   │   ├── purchase-order
│   │   ├── supplier
│   │   ├── dashboard
│   │   └── recommendation
│   │
│   ├── shared
│   │   ├── middleware
│   │   ├── providers
│   │   ├── utils
│   │   └── errors
│   │
│   └── server.ts
│
├── README.md
└── .env.example
```

---

# ⚡ Technologies

## Frontend

- React
- TypeScript
- React Router
- React Hook Form
- Zod
- Axios
- Tailwind CSS
- Shadcn UI

---

## Backend

- Node.js
- Express.js
- TypeScript
- JWT
- Bcrypt
- Zod

---

## Database

- MongoDB
- Mongoose

---

## Caching

- Redis

Used for

- Faster Data Access
- Session Storage
- Frequently Accessed Data

---

## Background Jobs

Cron Jobs automate

- Expiry Checking
- Reorder Recommendation Generation
- Scheduled Notifications

---

# 🔐 Security

- JWT Authentication
- Role-Based Access Control
- Password Hashing
- Protected Routes
- Request Validation
- Centralized Error Handling
- Environment Variables

---

# ⚙ Inventory Algorithms

## FEFO

First Expire First Out ensures medicines with the nearest expiry date are sold first.

---

## WADS

Weighted Average Daily Sales

```
WADS = Total Weighted Sales / Total Days
```

Used for intelligent reorder recommendations.

---

## Reorder Point

```
Reorder Point =
(WADS × Lead Time)
+ Safety Stock
```

---

## Safety Stock

Calculated based on

- Demand Variability
- Supplier Lead Time
- Sales History

---

# 🔄 MongoDB Transactions

Critical operations such as

- Sales
- Purchase Orders
- Inventory Updates

are executed inside MongoDB Transactions to guarantee data consistency.

This prevents partial updates if an error occurs.

---

# 🚀 Performance Optimizations

- Redis Caching
- Aggregation Pipelines
- Lean Queries
- Pagination
- Indexed Collections
- Background Processing
- Modular Architecture

---

# 🧪 Validation

The project uses **Zod** for request validation.

Benefits

- Type Safety
- Runtime Validation
- Cleaner Controllers
- Better Error Messages

---

# 📸 Screenshots

## Login

<img width="1896" height="918" alt="image" src="https://github.com/user-attachments/assets/2b43aba0-75bb-45cd-b92a-78b80ddc0ba8" />



## Dashboard


<img width="1916" height="915" alt="image" src="https://github.com/user-attachments/assets/54a41c45-f605-4ea0-a82b-2f0c8acf9ff7" />

<img width="1902" height="920" alt="image" src="https://github.com/user-attachments/assets/ff411d21-b33d-4dea-b6b1-a0ff8d5ff6a7" />

<img width="1915" height="915" alt="image" src="https://github.com/user-attachments/assets/783b8b14-79a3-4fbc-908b-ab20cc9c2ae8" />




## Inventory


<img width="1917" height="912" alt="image" src="https://github.com/user-attachments/assets/6186d10a-eff3-4a3f-bce3-61730cdb947e" />



## Sales


<img width="1918" height="916" alt="image" src="https://github.com/user-attachments/assets/45424e7b-6a59-43bb-91ac-84bc914f743a" />


# 📚 API Documentation

Future improvements

- Swagger/OpenAPI Documentation

---

# 🚀 Installation

Clone the repository

```bash
git clone https://github.com/yourusername/SPIMS.git
```

Backend

```bash
cd server
npm install
```

Frontend

```bash
cd client
npm install
```

---

# 🔧 Environment Variables

Server

```env
PORT=5000

MONGO_URI=mongodb://localhost:27017/spims

JWT_SECRET=your_secret

REDIS_URL=redis://localhost:6379
```

---

# ▶ Running the Project

Backend

```bash
cd server
npm run dev
```

Frontend

```bash
cd client
npm run dev
```

Frontend

```
http://localhost:5173
```

Backend

```
http://localhost:8000
```

Deployed for Demo

```
https://spims-rmuk.vercel.app/
```

---

# 🎯 Future Improvements

- Barcode Scanner Integration
- eSewa Integration
- Khalti Integration
- Email Notifications
- SMS Notifications
- Multi-Branch Pharmacy Support
- AI Demand Forecasting
- Prescription Management
- Inventory Forecast Dashboard
- Docker Deployment
- CI/CD Pipeline
- Unit Testing
- Integration Testing

---

# 🤝 Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to GitHub
5. Create a Pull Request

---

# 📄 License

This project is licensed under the MIT License.

---

# 👨‍💻 Author

**Aabhushan Dhakal**

Full Stack Developer

- 💼 MERN Stack Developer
- 🌱 Passionate about scalable backend systems
- 🚀 Building modern healthcare software solutions

GitHub: https://github.com/yourusername

Portfolio: https://yourportfolio.com

LinkedIn: https://linkedin.com/in/yourprofile
