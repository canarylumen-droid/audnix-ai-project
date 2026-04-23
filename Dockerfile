# --- Stage 1: Build Frontend ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build:client

# --- Stage 2: Build Backend ---
FROM node:20-alpine AS backend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Ensure we build the server code if it's TypeScript
RUN npm run build:server || true

# --- Stage 3: Production Image ---
FROM node:20-alpine
WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm install --omit=dev

# Copy built assets
COPY --from=frontend-builder /app/dist/public ./dist/public
COPY --from=backend-builder /app/dist ./dist
# If server code is not in dist, copy the source (assuming it runs via tsx or similar in some cases, 
# but for production it should be compiled)
COPY . .

# Environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose the API port
EXPOSE 5000

# Healthcheck to monitor app status
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5000/api/health/status || exit 1

# Start the application
# We use a single entrypoint that can distinguish between 'web' and 'worker' roles
CMD ["npm", "start"]
