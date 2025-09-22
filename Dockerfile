FROM node:20-alpine

# Install dependencies for native modules
RUN apk add --no-cache libc6-compat dumb-init

WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package*.json ./
COPY .nvmrc ./

# Set npm configuration for stability
RUN npm config set progress false && \
    npm config set audit-level moderate && \
    npm ci --only=production --no-audit --no-fund

# Copy source code
COPY . .

# Set build-time environment variables
ARG NEXT_PUBLIC_BASE_PATH
ARG NEXT_PUBLIC_ASSET_PREFIX
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH
ENV NEXT_PUBLIC_ASSET_PREFIX=$NEXT_PUBLIC_ASSET_PREFIX

# Install dev dependencies and build
RUN npm ci --no-audit --no-fund && \
    npm run build && \
    npm prune --production

# Create uploads directory with proper permissions
RUN mkdir -p /app/public/uploads && \
    chmod 777 /app/public/uploads

# Change ownership to node user
RUN chown -R node:node /app

# Switch to node user for security
USER node

# Expose port
EXPOSE 3001

# Set runtime environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["npm", "start"]