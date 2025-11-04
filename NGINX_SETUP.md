# Nginx Reverse Proxy Setup for app.cnterminalghana.com

Since we're using a domain (`app.cnterminalghana.com`), you'll need to set up Nginx as a reverse proxy to handle SSL termination and route traffic to your Docker containers.

## Prerequisites

- Domain `app.cnterminalghana.com` pointing to server IP `81.0.247.14`
- Docker containers running on ports:
  - Frontend: `3004`
  - Backend: `5001`
  - Database: `5434` (internal only)

## Step 1: Install Nginx

```bash
sudo apt update
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

## Step 2: Install Certbot (for SSL)

```bash
sudo apt install certbot python3-certbot-nginx -y
```

## Step 3: Configure Nginx

Create Nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/cn_terminal
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name app.cnterminalghana.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.cnterminalghana.com;

    # SSL Configuration (will be updated by Certbot)
    ssl_certificate /etc/letsencrypt/live/app.cnterminalghana.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.cnterminalghana.com/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Frontend (React App)
    location / {
        proxy_pass http://localhost:3004;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5001/api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        proxy_buffering off;
    }

    # API Documentation
    location /api-docs {
        proxy_pass http://localhost:5001/api-docs;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.IO support (for real-time notifications)
    location /socket.io {
        proxy_pass http://localhost:5001/socket.io;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # File uploads (static files)
    location /uploads {
        proxy_pass http://localhost:5001/uploads;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Max upload size
    client_max_body_size 10M;
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/cn_terminal /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remove default site
sudo nginx -t  # Test configuration
```

## Step 4: Obtain SSL Certificate

```bash
sudo certbot --nginx -d app.cnterminalghana.com
```

Follow the prompts:
- Enter your email address
- Agree to terms of service
- Choose whether to redirect HTTP to HTTPS (select option 2 - Redirect)

Certbot will automatically:
- Obtain SSL certificate from Let's Encrypt
- Update Nginx configuration with SSL settings
- Set up auto-renewal

## Step 5: Reload Nginx

```bash
sudo systemctl reload nginx
sudo systemctl status nginx
```

## Step 6: Verify SSL Certificate Auto-Renewal

```bash
sudo certbot renew --dry-run
```

## Firewall Configuration

Ensure ports 80 and 443 are open:

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status
```

## Testing

1. **HTTP Redirect**: Visit `http://app.cnterminalghana.com` - should redirect to HTTPS
2. **Frontend**: Visit `https://app.cnterminalghana.com` - should show React app
3. **API**: Visit `https://app.cnterminalghana.com/api/health` - should return API response
4. **API Docs**: Visit `https://app.cnterminalghana.com/api-docs` - should show Swagger UI

## Troubleshooting

### Check Nginx logs:
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Test Nginx configuration:
```bash
sudo nginx -t
```

### Reload Nginx after changes:
```bash
sudo systemctl reload nginx
```

### Check if containers are accessible:
```bash
curl http://localhost:3004
curl http://localhost:5001/api/health
```

## Important Notes

1. **DNS Setup**: Ensure `app.cnterminalghana.com` A record points to `81.0.247.14`
2. **Firewall**: Ports 80/443 must be open on the server
3. **Container Ports**: Docker containers (3004, 5001) should only be accessible via Nginx, not directly from internet
4. **SSL Renewal**: Certbot auto-renews certificates, but test renewal manually: `sudo certbot renew --dry-run`
5. **Environment Variables**: Your GitHub Secrets should use `https://app.cnterminalghana.com` (already configured)

## Alternative: Without SSL (Development Only)

If you want to test without SSL first, you can temporarily use HTTP:

```nginx
server {
    listen 80;
    server_name app.cnterminalghana.com;

    location / {
        proxy_pass http://localhost:3004;
        # ... (same proxy settings as above)
    }
    
    location /api {
        proxy_pass http://localhost:5001/api;
        # ... (same proxy settings as above)
    }
}
```

**Note**: For production, always use HTTPS!

