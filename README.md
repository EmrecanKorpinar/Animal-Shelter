# 🐾 Barınak - Animal Shelter Management System

Modern, performant and user-friendly animal shelter management system built with React, Node.js, PostgreSQL, Redis, and advanced image processing capabilities.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.2.0-blue.svg)

## ✨ Features

### 🎯 Core Features
- **Advanced Animal Management**: Complete CRUD operations with image compression and optimization
- **Smart Search**: Search by animal ID, name, species with real-time results
- **Adoption System**: Handle adoption requests with status tracking
- **User Authentication**: Secure JWT-based authentication with admin/user roles
- **Notification System**: Real-time notifications for adoption status changes

### 🚀 Advanced Features
- **Background Job Queue**: Bull/Redis-based queue system for bulk imports and image processing
- **Image Optimization**: Automatic image compression with LZ4/Zstd algorithms (up to 98% compression ratio)
- **Smart Caching**: Redis-based caching with automatic invalidation
- **S3/MinIO Integration**: Cloud storage for animal photos with CDN support
- **System Monitoring**: Real-time stats for cache, queue, and system performance
- **Excel Import/Export**: Bulk import animals from Excel with background processing

### 💎 Admin Panel Features
- **Dashboard**: Real-time statistics and system monitoring
- **Queue Management**: Monitor import/export jobs with progress tracking
- **Cache Statistics**: View cache hit rates and memory usage
- **System Stats**: CPU, memory, and uptime monitoring
- **Animal ID Search**: Quick search and edit animals by ID
- **Bulk Operations**: Import/export animals with Excel files

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI library
- **Vite** - Lightning-fast build tool
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **CSS3** - Modern styling

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **PostgreSQL** - Relational database
- **Redis** - Caching and queue management
- **Bull** - Queue processing
- **Sharp** - Image processing
- **LZ4/Zstd** - Image compression algorithms
- **AWS S3/MinIO** - Object storage

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Git** - Version control

## 📋 Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 14
- Redis >= 6
- Docker & Docker Compose (optional)
- MinIO or AWS S3 account

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/EmrecanKorpinar/Animal-Shelter.git
cd Animal-Shelter
```

### 2. Setup Backend

```bash
cd barinak-app/barinak-backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your settings

# Setup database
npm run db:setup

# Start Redis and PostgreSQL with Docker
docker compose up -d

# Start backend server
npm start

# Start workers (in separate terminals)
node workers/importWorker.js
node workers/imageOptimizeWorker.js
```

### 3. Setup Frontend

```bash
cd barinak-app

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your settings

# Start development server
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Admin Panel**: http://localhost:5173/admin

## 🔧 Configuration

### Backend Environment Variables (.env)

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=barinak_db
DB_USER=postgres
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_jwt_secret

# S3/MinIO
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=animal-photos
S3_REGION=us-east-1

# Admin
ADMIN_PASSWORD=admin123
```

### Frontend Environment Variables (.env)

```env
VITE_API_URL=http://localhost:3000
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `POST /api/users/admin/login` - Admin login

### Animal Endpoints
- `GET /api/animals` - List all animals
- `GET /api/animals/:id` - Get animal by ID
- `POST /api/animals` - Create animal (admin)
- `PUT /api/animals/:id` - Update animal (admin)
- `DELETE /api/animals/:id` - Delete animal (admin)
- `POST /api/animals/search` - Search animals by ID

### Adoption Endpoints
- `POST /api/adoption-requests` - Create adoption request
- `GET /api/adoption-requests` - List all requests (admin)
- `GET /api/adoption-requests/user/:userId` - User's requests
- `PUT /api/adoption-requests/:id` - Update request status (admin)

### Import/Export Endpoints
- `POST /api/import-export/import` - Import animals from Excel (admin)
- `GET /api/import-export/export` - Export animals to Excel (admin)
- `GET /api/import-export/queue-status` - Get queue statistics (admin)

### System Endpoints
- `GET /api/system/cache-stats` - Get cache statistics (admin)
- `GET /api/system/stats` - Get system statistics (admin)

## 🏗️ Project Structure

```
Animal-Shelter/
├── barinak-app/
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── admin/       # Admin-specific components
│   │   │   ├── common/      # Shared components
│   │   │   └── user/        # User-facing components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── contexts/        # React contexts
│   │   └── utils/           # Utility functions
│   ├── barinak-backend/
│   │   ├── controllers/     # Request handlers
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Express middleware
│   │   ├── workers/         # Background workers
│   │   ├── utils/           # Utility functions
│   │   └── db/              # Database scripts
│   └── public/              # Static assets
├── LICENSE
└── README.md
```

## 🎨 Key Features Details

### Image Compression
The system uses advanced compression algorithms to reduce storage costs:
- **LZ4**: Fast compression with good ratio (up to 98%)
- **Zstd**: Higher compression ratio with moderate speed
- Automatic algorithm selection based on image characteristics
- Decompression on-the-fly for frontend display

### Background Processing
Bull queue system handles time-consuming tasks:
- Bulk animal imports from Excel
- Image optimization and compression
- S3 upload with retry logic
- Progress tracking and error handling

### Caching Strategy
Redis-based caching for improved performance:
- Animal listings cached with TTL
- Search results cached
- Automatic cache invalidation on data changes
- Cache statistics monitoring

### Admin Dashboard
Comprehensive admin panel with:
- Real-time system monitoring
- Queue progress visualization
- Cache performance metrics
- Quick animal search by ID
- Bulk import/export operations

## 🧪 Testing

```bash
# Run backend tests
cd barinak-app/barinak-backend
npm test

# Run frontend tests
cd barinak-app
npm test
```

## 🚢 Deployment

### Docker Deployment

```bash
# Build and run all services
docker compose up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down
```

### Manual Deployment

1. Setup PostgreSQL and Redis on your server
2. Configure environment variables
3. Build frontend: `npm run build`
4. Deploy backend with PM2 or similar process manager
5. Serve frontend with Nginx or similar web server
6. Start worker processes

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Emrecan Korpinar**

- GitHub: [@EmrecanKorpinar](https://github.com/EmrecanKorpinar)

## 🙏 Acknowledgments

- React team for the amazing library
- Node.js community
- All contributors who have helped this project

## 📞 Support

Open an issue on GitHub.

## 🔮 Future Plans

- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Social media integration
- [ ] Payment integration for donations
- [ ] Volunteer management system
- [ ] Veterinary records management

---

Made with ❤️ for animal welfare
