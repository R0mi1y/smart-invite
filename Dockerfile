FROM node:24.8.0-alpine

# Install dependencies for native modules
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY .nvmrc ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Set build-time environment variables
ARG NEXT_PUBLIC_BASE_PATH
ARG NEXT_PUBLIC_ASSET_PREFIX
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH
ENV NEXT_PUBLIC_ASSET_PREFIX=$NEXT_PUBLIC_ASSET_PREFIX

# Build the application with environment variables
RUN npm run build

# Create uploads directory with proper permissions
RUN mkdir -p /app/public/uploads && \
    chmod 777 /app/public/uploads && \
    chown -R node:node /app/public/uploads

# Expose port
EXPOSE 3001

# Set runtime environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Switch to node user for security
USER node

# Start the application
CMD ["npm", "start"]