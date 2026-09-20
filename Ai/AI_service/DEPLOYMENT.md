# Genkit Service Deployment Guide

## Overview
This document describes the automated deployment process for the Genkit Immunization Service using GitHub Actions.

## Deployment Architecture
- **CI/CD**: GitHub Actions
- **Target Server**: Ubuntu VPS
- **Process Manager**: PM2
- **Runtime**: Node.js 20

## Required GitHub Secrets

Configure the following secrets in your GitHub repository settings (`Settings > Secrets and variables > Actions`):

### Server Connection
- `SSH_HOST` - Your server's IP address or domain
- `SSH_USER` - SSH username (e.g., `ubuntu`, `root`)
- `SSH_KEY` - Private SSH key for authentication

### Project Configuration
- `GENKIT_PROJECT_PATH` - Absolute path on server where the service will be deployed (e.g., `/home/ubuntu/lindatoto/genkit-service`)
- `GENKIT_PORT` - Port number for the service (default: `3002`)
- `NODE_ENV` - Environment mode (`production` or `development`)

### API Keys
- `GOOGLE_API_KEY` - Google AI API key for Genkit (required for Gemini AI)

## Deployment Process

### Automatic Deployment
The service automatically deploys when you push to the `master` or `main` branch:

```bash
git add .
git commit -m "Your commit message"
git push origin master
```

### Manual Deployment
You can also trigger deployment manually from GitHub Actions tab.

## Server Setup Requirements

### 1. Install Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Install PM2
```bash
sudo npm install -g pm2
pm2 startup
# Follow the instructions from the startup command
```

### 3. Create Project Directory
```bash
mkdir -p /path/to/genkit-service
```

### 4. Configure SSH Access
Ensure your server accepts SSH key authentication and the provided SSH_KEY has access.

## PM2 Process Management

### View Service Status
```bash
pm2 status
```

### View Logs
```bash
pm2 logs lindatoto_genkit
```

### Restart Service
```bash
pm2 restart lindatoto_genkit
```

### Stop Service
```bash
pm2 stop lindatoto_genkit
```

## Service Endpoints

Once deployed, the service will be available at:

- **Health Check**: `GET http://your-server:3002/health`
- **Draft Daycare Profile**: `POST http://your-server:3002/draftDaycareProfile`
- **Generate Executive Report**: `POST http://your-server:3002/generateDaycareReport`
- **Parent Chat Assistant**: `POST http://your-server:3002/parentChat`
- **Root Info**: `GET http://your-server:3002/`

## Troubleshooting

### Build Fails
- Check that `tsconfig.json` is properly configured
- Verify all dependencies are listed in `package.json`
- Review build logs in GitHub Actions

### Deployment Fails
- Verify all GitHub secrets are correctly set
- Check SSH key has proper permissions
- Ensure server has sufficient disk space
- Review PM2 logs: `pm2 logs lindatoto_genkit`

### Service Not Starting
- Check environment variables are set correctly
- Verify `GOOGLE_API_KEY` is valid
- Check port 3002 is not already in use
- Review PM2 logs for error messages

## Environment Variables

The service requires the following environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 3002) | No |
| `NODE_ENV` | Environment mode | Yes |
| `GOOGLE_API_KEY` | Google AI API key | Yes |

## Security Notes

1. Never commit `.env` files or API keys to the repository
2. Use GitHub Secrets for all sensitive information
3. Restrict SSH key permissions: `chmod 600 ~/.ssh/id_rsa`
4. Consider using a firewall to restrict access to the service port
5. Regularly rotate API keys and SSH keys

## Monitoring

### Health Check
```bash
curl http://your-server:3002/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "genkit-immunization-service",
  "timestamp": "2025-01-10T12:00:00.000Z",
  "environment": "production"
}
```

### PM2 Monitoring
```bash
pm2 monit
```

## Rollback

If a deployment fails, you can rollback by:

1. Reverting the git commit
2. Pushing to trigger a new deployment
3. Or manually restarting the previous version on the server

## Support

For issues or questions, contact the development team or check the project repository.
