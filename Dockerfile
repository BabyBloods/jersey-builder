# ==========================================
# Stage 1: Development (Live Reload / HMR)
# ==========================================
FROM node:20-alpine AS dev
WORKDIR /app

# Copy dependency definitions
COPY package*.json ./
RUN npm install

# Copy all source files
COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev"]

# ==========================================
# Stage 2: Production Builder
# ==========================================
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ==========================================
# Stage 3: Production Server (Nginx Alpine)
# ==========================================
FROM nginx:alpine AS prod

# Copy static assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration (SPA routing & GLB MIME support)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
