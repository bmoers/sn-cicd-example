FROM node:10.13-alpine

LABEL maintainer Boris Moers <boris.moers@gmail.com>

ENV CICD_ATF_BROWSER="/usr/bin/chromium-browser" \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true"

RUN apk update && apk upgrade && \
    echo @edge http://nl.alpinelinux.org/alpine/edge/community >> /etc/apk/repositories && \
    echo @edge http://nl.alpinelinux.org/alpine/edge/main >> /etc/apk/repositories && \
    apk add --no-cache \
    git \
    openssh \
    chromium@edge \
    nss@edge \
    freetype@edge \
    harfbuzz@edge \
    ttf-freefont@edge && \
    rm -rf /var/lib/apt/lists/*

VOLUME ["/opt/cicd", "/home/node/.ssh"]

RUN mkdir -p /usr/src/app
RUN chown node:node /usr/src/app

USER node
WORKDIR /usr/src/app
COPY --chown=node:node ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install --production


COPY --chown=node:node ["project-templates/", "modules/", "cicd.js", "server.js", "worker.js", "./"]

EXPOSE 8080 8443
CMD npm update && npm start


