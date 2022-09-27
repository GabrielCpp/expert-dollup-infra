FROM node:lts-alpine3.14 AS app-env

# Install Python and Java and pre-cache emulator dependencies.
RUN apk add --no-cache python3 py3-pip openjdk11-jre bash && \
    npm install -g npm@latest && \
    npm install -g firebase-tools@latest && \
    rm -rf /var/cache/apk/*

COPY ./firebase-hosting/firebase.json /opt/firebase/firebase.json

ENTRYPOINT [ "/bin/sh" ]