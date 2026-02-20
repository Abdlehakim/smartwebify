# backend/Dockerfile
FROM ghcr.io/puppeteer/puppeteer:24.17.1

# Fonts for Arabic/French/Emoji in PDFs
USER root
RUN apt-get update && apt-get install -y --no-install-recommends \
    fonts-noto-core fonts-noto-extra fonts-dejavu-core fonts-noto-color-emoji \
  && rm -rf /var/lib/apt/lists/*

# Create a writable app dir for the non-root user
RUN install -d -o pptruser -g pptruser /home/pptruser/app
WORKDIR /home/pptruser/app

# Copy manifests with correct ownership
COPY --chown=pptruser:pptruser package*.json tsconfig.json ./

# Switch to non-root user before installing
USER pptruser
RUN npm ci

# Copy source and build
COPY --chown=pptruser:pptruser src ./src
RUN npm run build

# Trim dev deps
RUN npm prune --omit=dev --no-audit --no-fund --no-optional --no-save

# Copy entrypoint
COPY --chown=pptruser:pptruser entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

ENV NODE_ENV=production
EXPOSE 3000

# Decide at runtime whether this container is API or Worker
CMD ["./entrypoint.sh"]
