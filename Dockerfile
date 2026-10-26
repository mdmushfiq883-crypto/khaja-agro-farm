# ==============================================================================
# Khaja Agro Farm - Production Dockerfile (Railway Deployment)
# Ultra-lightweight native Node.js 24 runtime with built-in node:sqlite
# ==============================================================================

FROM node:24-alpine

# Set working directory inside container
WORKDIR /app

# Ensure production environment
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0 \
    DB_PATH=/app/data/khaja_agro.db

# Create directories for persistent volume and local backups
RUN mkdir -p /app/data /app/backups

# Copy application manifest and source files
COPY package.json ./
COPY server.js ./
COPY src ./src
COPY public ./public

# Expose default HTTP port (Railway injects dynamic PORT at runtime)
EXPOSE 3000

# Start Khaja Agro Farm production server using standard Node.js
CMD ["node", "server.js"]
