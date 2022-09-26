FROM node:16-alpine
RUN npm install http-echo-server -g

ENTRYPOINT [ "/bin/sh", "-c", "http-echo-server ${PORT}" ]