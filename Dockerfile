FROM node:lts-alpine

# required for errors in npm ci
RUN npm install npm@latest -g

# Installs latest Chromium (76) package.
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    git \
    openssh && \
    rm -rf /var/lib/apt/lists/*

ENV CICD_ATF_BROWSER /usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

VOLUME ["/opt/cicd", "/home/node/.ssh"]

RUN mkdir -p /usr/src/app
RUN chown node:node /usr/src/app

USER node
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --no-optional && npm cache clean --force

COPY ["project-templates/", "modules/", "cicd.js", "server.js", "worker.js", "./"]

EXPOSE 8080 8443
CMD npm update && npm start


