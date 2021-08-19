ARG DOCKER_REGISTRY="index.docker.io"
# remote-docker.artifactory.company.com
FROM ${DOCKER_REGISTRY}/node:14-alpine AS base


ARG PROXY_URL
# http://server-proxy.corproot.net:8080

ARG NPM_REGISTRY
# https://remote-npm.artifactory.company.com/api/npm/npm-remote/

ARG NO_PROXY="127.0.0.1,localhost"
# localhost,.artifactory.company.com

USER root

ENV HTTP_PROXY=$PROXY_URL \
    HTTPS_PROXY=$PROXY_URL \
    http_proxy=$PROXY_URL \
    https_proxy=$PROXY_URL \
    no_proxy=$NO_PROXY \
    NO_PROXY=$NO_PROXY
    # company.com,127.0.0.1,localhost
    
# debug ENV
RUN echo "HTTP_PROXY: ${HTTP_PROXY}" && \ 
    echo "NO_PROXY: ${NO_PROXY}" && \
    echo "NPM_REGISTRY: ${NPM_REGISTRY}"

# Installs latest Chromium (76) package.
RUN apk add --no-cache \
    curl \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    git \
    npm \
    openssh && \
    rm -rf /var/lib/apt/lists/* && \
    update-ca-certificates 


# required for errors in npm ci
RUN if [[ ! -z "${NPM_REGISTRY}" ]] ; then npm config set registry ${NPM_REGISTRY} ; fi && \
    npm config set unsafe-perm true && \
    npm config set cafile  /etc/ssl/certs/ca-certificates.crt && \
    npm install npm@latest -g

# add wait for CMD later
ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.7.3/wait /wait
RUN chmod +x /wait

FROM base as build

WORKDIR /usr/src/app

# cache in workdir
RUN npm config set cache /usr/src/app/.npm-cache --global 

RUN chown -R node:node /usr/src/app && \
    chmod 755 /usr/src/app


# run as non-root as we need the NPM packages to be cached in the NODE user 
#USER node


ENV NODE_ENV production
ENV NODE_EXTRA_CA_CERTS /etc/ssl/certs/ca-certificates.crt
ENV CICD_ATF_BROWSER /usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

COPY --chown=node:node ./package*.json ./

# install dependencies
RUN npm ci --only=production --no-optional 
#&& npm cache clean --force
#RUN npm install mongo-express --ignore-scripts && npm install --only=production --no-optional

# copy all app files
#COPY --chown=node:node . .
COPY . .

## cache all dependencies
#RUN cp node_modules/sn-cicd/lib/project-templates/package.lock.json node_modules/sn-cicd/lib/project-templates/package-lock.json && \
#    npm ci --prefix node_modules/sn-cicd/lib/project-templates && \
#    rm -rf node_modules/sn-cicd/lib/project-templates/package-lock.json && \
#    rm -rf node_modules/sn-cicd/lib/project-templates/node_modules

EXPOSE 8080 8443 4443

# wait for DB etc, then start
CMD /wait && npm start
