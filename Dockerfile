# syntax=docker/dockerfile:1
# =============================================================================
# Multi-stage build: stage 1 compiles the Angular app with Node, stage 2 serves the
# static files with nginx. The final image contains NO Node, NO source, NO node_modules
# (~25 MB instead of ~1 GB) — smaller, faster to pull, less attack surface.
#
#   docker build -t adme-portal-angular:local .
#   docker run --rm -p 8080:8080 adme-portal-angular:local      → http://localhost:8080
#   docker run --rm -p 8080:8080 -v ./deploy/config.local.json:/usr/share/nginx/html/config.json:ro adme-portal-angular:local
# =============================================================================

# ---------- Stage 1: build ----------
FROM node:24-alpine AS build
WORKDIR /app

# Copy only the manifests first: this layer (npm ci) is cached until dependencies change.
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npx ng build --configuration production

# ---------- Stage 2: serve ----------
# nginx-unprivileged runs as a NON-ROOT user and listens on 8080 — required by OpenShift
# (arbitrary UID, no privileged ports < 1024) and best practice on any Kubernetes.
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

COPY deploy/nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY deploy/nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist/adme-portal-angular/browser /usr/share/nginx/html

# OpenShift runs the container with a random UID in group 0 (root GROUP, not root user):
# give group 0 the same permissions as the owner on the folders nginx writes to.
USER root
RUN chgrp -R 0 /usr/share/nginx/html /var/cache/nginx /tmp \
 && chmod -R g=u /usr/share/nginx/html /var/cache/nginx /tmp
USER 101

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
