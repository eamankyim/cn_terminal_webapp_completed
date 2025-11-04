# Docker Compose Updates for Nginx Integration

## Changes Required to docker-compose.prod.yml

### 1. Remove External Port Mappings from Frontend and Backend

**Before:**
```yaml
services:
  frontend:
    # ... other config ...
    ports:
      - "3004:3000"  # ❌ Remove this

  backend:
    # ... other config ...
    ports:
      - "5001:5000"  # ❌ Remove this
```

**After:**
```yaml
services:
  frontend:
    # ... other config ...
    # No ports section - nginx will route internally

  backend:
    # ... other config ...
    # No ports section - nginx will route internally
```

### 2. Add Nginx Service

Add this service block to your `docker-compose.prod.yml`:

```yaml
  nginx:
    image: nginx:alpine
    container_name: cn_terminal-nginx
    restart: unless-stopped
    # DO NOT map ports 80/443 externally - host-nginx handles that
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
      - backend
    networks:
      - cn_terminal_network
      - host-network
```

### 3. Update Networks Section

**Before:**
```yaml
networks:
  cn_terminal_network:
    driver: bridge
```

**After:**
```yaml
networks:
  cn_terminal_network:
    driver: bridge
  host-network:
    external: true  # Use existing host-network
```

## Complete Example docker-compose.prod.yml

Here's what the complete updated file should look like:

```yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: cn_terminal_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: cn_terminal_db
      POSTGRES_USER: cn_terminal_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5434:5432"  # Keep this - database port
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - cn_terminal_network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: cn_terminal_backend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://cn_terminal_user:${DB_PASSWORD}@postgres:5432/cn_terminal_db?schema=public
      - JWT_SECRET=${JWT_SECRET}
      - PORT=5000
      - FRONTEND_URL=${FRONTEND_URL}
      - PRODUCTION_URL=${PRODUCTION_URL}
      - CORS_ORIGIN=${CORS_ORIGIN}
      - APP_BASE_URL=${APP_BASE_URL}
    # REMOVED: ports:
    # REMOVED:   - "5001:5000"
    depends_on:
      - postgres
    networks:
      - cn_terminal_network
    volumes:
      - ./backend/uploads:/app/uploads

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
      args:
        REACT_APP_API_URL: ${REACT_APP_API_URL}
    container_name: cn_terminal_frontend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    # REMOVED: ports:
    # REMOVED:   - "3004:3000"
    depends_on:
      - backend
    networks:
      - cn_terminal_network

  nginx:
    image: nginx:alpine
    container_name: cn_terminal-nginx
    restart: unless-stopped
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
      - backend
    networks:
      - cn_terminal_network
      - host-network

volumes:
  postgres_data:

networks:
  cn_terminal_network:
    driver: bridge
  host-network:
    external: true
```

## After Making Changes

1. **Restart services:**
```bash
cd ~/cn_terminal
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

2. **Connect nginx to host-network:**
```bash
docker network connect host-network cn_terminal-nginx
```

3. **Verify:**
```bash
docker ps | grep cn_terminal
docker network inspect host-network | grep cn_terminal-nginx
```

