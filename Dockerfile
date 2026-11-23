# El primer contenedor prepara únicamente los recursos públicos que se sirven en producción.
FROM node:24-alpine AS web-build
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY web/ ./web/
COPY scripts/build.mjs scripts/environment.mjs ./scripts/
RUN npm run build

FROM dunglas/frankenphp:1-php8.5-alpine
RUN install-php-extensions pdo_mysql mbstring
WORKDIR /app
RUN cp "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=web-build /build/dist/ /app/public/
COPY api/index.php /app/public/api/index.php
COPY server/ /app/server/
ENV VETCARE_SERVER_ROOT=/app/server
ENV PORT=80
CMD ["frankenphp", "run", "--config", "/etc/caddy/Caddyfile"]
