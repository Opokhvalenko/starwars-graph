# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Serve stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Basic SPA fallback
RUN printf 'server { listen 8080; root /usr/share/nginx/html; include /etc/nginx/mime.types; \
  location / { try_files $uri /index.html; } }' > /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]