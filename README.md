# CN Terminal Web Application

Customs & Clearance Management System for terminal operations.

## Technology Stack

- **Frontend**: React 18, Ant Design, React Router
- **Backend**: Node.js, Express.js, Prisma ORM
- **Database**: PostgreSQL
- **Real-time**: Socket.IO
- **Deployment**: Docker, Docker Compose

## Production Deployment

### Prerequisites

- Docker & Docker Compose installed
- PostgreSQL 15+
- Node.js 18+ (for server setup scripts)

### Quick Start

1. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your production values
   ```

2. **Deploy using Docker**:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

3. **Access the application**:
   - Frontend: `http://your-server-ip:3001`
   - Backend API: `http://your-server-ip:5001/api`
   - API Docs: `http://your-server-ip:5001/api-docs`

### Database Setup

```bash
# Run Prisma migrations
docker exec -it cn_terminal_backend npx prisma db push

# Create super admin user
docker exec -it cn_terminal_backend node scripts/create-admin.js
```

### Environment Variables

Key environment variables (see `.env.example` for full list):

- `DB_PASSWORD`: PostgreSQL password
- `JWT_SECRET`: JWT signing secret
- `REACT_APP_API_URL`: Backend API URL
- `FRONTEND_URL`: Frontend URL
- `CORS_ORIGIN`: Allowed origins (comma-separated)
- `APP_BASE_URL`: Application base URL for links

### Docker Management

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Stop services
docker-compose -f docker-compose.prod.yml down

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build
```

### Support

For deployment issues, check `docker-compose.prod.yml logs` or contact the development team.

