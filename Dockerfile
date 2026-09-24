# Preparación para el preset Container de Vercel; despliegue pendiente de T18.
FROM dunglas/frankenphp:1-php8.5-alpine
RUN install-php-extensions pdo_mysql mbstring
WORKDIR /app
RUN cp "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"
COPY Caddyfile /etc/caddy/Caddyfile
COPY web/ /app/public/
COPY api/index.php /app/public/api/index.php
COPY server/ /app/server/
ENV VETCARE_SERVER_ROOT=/app/server
ENV PORT=80
CMD ["frankenphp", "run", "--config", "/etc/caddy/Caddyfile"]
