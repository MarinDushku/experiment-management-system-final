# Deployment Guide

This guide covers various deployment options for the Research Experiment Management System.

## Quick Deployment Options

### 1. Docker Compose (Recommended for Development)

```bash
# Clone repository
git clone https://github.com/yourusername/experiment-management-system.git
cd experiment-management-system

# Copy environment configuration
cp .env.docker .env

# Start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost:80
# Backend API: http://localhost:5000
# API Documentation: http://localhost:5000/api/docs
```

### 2. Local Development Setup

```bash
# Backend setup
cd backend
npm install
cp .env.example .env
npm run create-admin
npm run dev

# Frontend setup (new terminal)
cd frontend  
npm install --legacy-peer-deps
npm start

# Access: http://localhost:3000
```

## Production Deployment

### Docker Compose Production

1. **Prepare Environment**
```bash
# Create production environment file
cp .env.docker .env.production

# Edit production settings
nano .env.production
```

2. **Production Environment Variables**
```env
# Database
MONGODB_URI=mongodb://mongo:27017/experiment_management

# Security (CHANGE THESE!)
JWT_SECRET=your_extremely_secure_jwt_secret_key_here

# Server
NODE_ENV=production
PORT=5000

# Admin User
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change_this_secure_password
```

3. **Deploy**
```bash
# Build and start production services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Check service health
docker-compose ps
docker-compose logs -f backend
```

### Kubernetes Deployment

1. **Create Namespace**
```bash
kubectl create namespace experiment-system
```

2. **Deploy MongoDB**
```yaml
# mongodb-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mongodb-deployment
  namespace: experiment-system
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mongodb
  template:
    metadata:
      labels:
        app: mongodb
    spec:
      containers:
      - name: mongodb
        image: mongo:latest
        ports:
        - containerPort: 27017
        env:
        - name: MONGO_INITDB_DATABASE
          value: "experiment_management"
        volumeMounts:
        - name: mongodb-storage
          mountPath: /data/db
      volumes:
      - name: mongodb-storage
        persistentVolumeClaim:
          claimName: mongodb-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: mongodb-service
  namespace: experiment-system
spec:
  selector:
    app: mongodb
  ports:
  - port: 27017
    targetPort: 27017
```

3. **Deploy Backend**
```yaml
# backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-deployment
  namespace: experiment-system
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: ghcr.io/yourusername/experiment-management-system/backend:latest
        ports:
        - containerPort: 5000
        env:
        - name: MONGODB_URI
          value: "mongodb://mongodb-service:27017/experiment_management"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: jwt-secret
        livenessProbe:
          httpGet:
            path: /api/test
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/test
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: experiment-system
spec:
  selector:
    app: backend
  ports:
  - port: 80
    targetPort: 5000
  type: LoadBalancer
```

4. **Deploy Frontend**
```yaml
# frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend-deployment
  namespace: experiment-system
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: ghcr.io/yourusername/experiment-management-system/frontend:latest
        ports:
        - containerPort: 80
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  namespace: experiment-system
spec:
  selector:
    app: frontend
  ports:
  - port: 80
    targetPort: 80
  type: LoadBalancer
```

5. **Apply Kubernetes Manifests**
```bash
kubectl apply -f k8s/mongodb-deployment.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml

# Check deployment status
kubectl get pods -n experiment-system
kubectl get services -n experiment-system
```

### AWS ECS Deployment

1. **Create Task Definitions**
```json
{
  "family": "experiment-management-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "ghcr.io/yourusername/experiment-management-system/backend:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "MONGODB_URI",
          "value": "mongodb://mongodb.cluster.amazonaws.com:27017/experiment_management"
        }
      ],
      "secrets": [
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:ssm:region:account:parameter/experiment-system/jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/experiment-management-backend",
          "awslogs-region": "us-west-2",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

2. **Deploy with AWS CLI**
```bash
# Register task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Create service
aws ecs create-service \
  --cluster experiment-cluster \
  --service-name experiment-backend \
  --task-definition experiment-management-backend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

## CI/CD Pipeline Setup

### GitHub Actions

The repository includes comprehensive GitHub Actions workflows:

- **`.github/workflows/ci.yml`** - Continuous Integration
- **`.github/workflows/quality.yml`** - Code Quality and Security
- **`.github/workflows/release.yml`** - Release and Deployment

#### Required Secrets

Configure these secrets in your GitHub repository:

```bash
# Container Registry
GITHUB_TOKEN  # Automatically provided

# Deployment
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY

# Code Quality  
SONAR_TOKEN
SNYK_TOKEN

# Notifications
SLACK_WEBHOOK_URL
```

#### Triggering Deployments

```bash
# Deploy to staging
git push origin develop

# Deploy to production  
git tag v1.0.0
git push origin v1.0.0
```

### Jenkins Pipeline

```groovy
pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'ghcr.io'
        IMAGE_NAME = 'experiment-management-system'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Test Backend') {
            steps {
                dir('backend') {
                    sh 'npm ci'
                    sh 'npm test'
                }
            }
        }
        
        stage('Test Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm ci --legacy-peer-deps'
                    sh 'npm test -- --coverage --watchAll=false'
                }
            }
        }
        
        stage('Build Images') {
            parallel {
                stage('Build Backend') {
                    steps {
                        sh 'docker build -t ${DOCKER_REGISTRY}/${IMAGE_NAME}/backend:${BUILD_NUMBER} -f Dockerfile.backend .'
                    }
                }
                stage('Build Frontend') {
                    steps {
                        sh 'docker build -t ${DOCKER_REGISTRY}/${IMAGE_NAME}/frontend:${BUILD_NUMBER} -f Dockerfile.frontend .'
                    }
                }
            }
        }
        
        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                sh 'docker-compose up -d --force-recreate'
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
    }
}
```

## Environment Configuration

### Environment Variables

#### Backend (.env)
```env
# Database
MONGODB_URI=mongodb://localhost:27017/experiment_management
MONGODB_TEST_URI=mongodb://localhost:27017/experiment_management_test

# JWT
JWT_SECRET=your_super_secret_jwt_key_here

# Server
NODE_ENV=production
PORT=5000

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=50000000

# OpenBCI
OPENBCI_PORT=COM3
OPENBCI_BOARD_ID=0
OPENBCI_MOCK_MODE=false

# Admin Setup
ADMIN_USERNAME=admin
ADMIN_PASSWORD=secure_password_here
```

#### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_UPLOAD_URL=http://localhost:5000/uploads
GENERATE_SOURCEMAP=false
```

### Database Configuration

#### MongoDB Production Setup

1. **Replica Set Configuration**
```javascript
// Initialize replica set
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongodb-1:27017" },
    { _id: 1, host: "mongodb-2:27017" },
    { _id: 2, host: "mongodb-3:27017" }
  ]
})

// Create database and user
use experiment_management
db.createUser({
  user: "experiment_user",
  pwd: "secure_password",
  roles: ["readWrite"]
})
```

2. **Indexes for Performance**
```javascript
// User collection indexes
db.users.createIndex({ username: 1 }, { unique: true })
db.users.createIndex({ email: 1 }, { unique: true, sparse: true })

// Experiment collection indexes
db.experiments.createIndex({ createdBy: 1, status: 1 })
db.experiments.createIndex({ createdAt: -1 })

// Trial collection indexes
db.trials.createIndex({ experiment: 1, participant: 1 })
db.trials.createIndex({ createdAt: -1 })

// Step collection indexes
db.steps.createIndex({ type: 1, createdBy: 1 })
```

## Security Configuration

### HTTPS/TLS Setup

#### Nginx Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name experiment-system.com;

    ssl_certificate /etc/ssl/certs/experiment-system.crt;
    ssl_certificate_key /etc/ssl/private/experiment-system.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://backend:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Let's Encrypt SSL
```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d experiment-system.com

# Auto-renewal
sudo crontab -e
0 12 * * * /usr/bin/certbot renew --quiet
```

### Security Headers
```javascript
// In backend server.js
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  next();
});
```

## Monitoring and Logging

### Application Monitoring
```yaml
# docker-compose.monitoring.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana

volumes:
  grafana-data:
```

### Log Aggregation
```yaml
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.14.0
    environment:
      - discovery.type=single-node
    ports:
      - "9200:9200"

  kibana:
    image: docker.elastic.co/kibana/kibana:7.14.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch

  logstash:
    image: docker.elastic.co/logstash/logstash:7.14.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
```

## Backup and Recovery

### Database Backup
```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mongodb"
mkdir -p $BACKUP_DIR

# Create backup
mongodump --uri="mongodb://user:pass@localhost:27017/experiment_management" --out "$BACKUP_DIR/$DATE"

# Compress backup
tar -czf "$BACKUP_DIR/backup_$DATE.tar.gz" "$BACKUP_DIR/$DATE"
rm -rf "$BACKUP_DIR/$DATE"

# Clean old backups (keep last 30 days)
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +30 -delete
```

### Automated Backups with Cron
```bash
# Add to crontab
0 2 * * * /opt/scripts/backup-mongodb.sh
```

### Restore Process
```bash
# Extract backup
tar -xzf backup_20240115_020000.tar.gz

# Restore database
mongorestore --uri="mongodb://user:pass@localhost:27017/experiment_management" backup_20240115_020000/experiment_management
```

## Troubleshooting

### Common Deployment Issues

#### Docker Issues
```bash
# Check container logs
docker-compose logs -f backend

# Check container status
docker-compose ps

# Rebuild containers
docker-compose down
docker-compose up --build
```

#### Database Connection Issues
```bash
# Test MongoDB connection
mongo mongodb://localhost:27017/experiment_management

# Check MongoDB logs
docker-compose logs -f mongodb

# Reset database
docker-compose down -v
docker-compose up
```

#### Performance Issues
```bash
# Check resource usage
docker stats

# Monitor database performance
mongo --eval "db.runCommand({serverStatus: 1})"

# Check application metrics
curl http://localhost:5000/api/health
```

## Scaling

### Horizontal Scaling
```yaml
# docker-compose.scale.yml
services:
  backend:
    deploy:
      replicas: 3
    
  nginx:
    image: nginx
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    ports:
      - "80:80"
    depends_on:
      - backend
```

### Database Scaling
- Use MongoDB replica sets for read scaling
- Consider sharding for large datasets
- Implement connection pooling
- Add database indexes for performance

## Maintenance

### Regular Maintenance Tasks

1. **Update Dependencies**
```bash
# Check for updates
npm outdated

# Update packages
npm update

# Security updates
npm audit fix
```

2. **Monitor Logs**
```bash
# Application logs
tail -f /var/log/experiment-system/app.log

# Access logs
tail -f /var/log/nginx/access.log
```

3. **Database Maintenance**
```bash
# Check database stats
mongo --eval "db.stats()"

# Reindex collections
mongo --eval "db.experiments.reIndex()"
```

For additional deployment assistance, refer to the [Troubleshooting Guide](./troubleshooting.md) or contact the development team.