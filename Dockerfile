# alpine:3.9
FROM alpine@sha256:769fddc7cc2f0a1c35abb2f91432e8beecf83916c421420e6a6da9f8975464b6

RUN ["apk", "--no-cache", "upgrade"]

RUN ["apk", "add", "--no-cache", "nodejs", "npm", "bash", "libc6-compat"]

ENV PORT 9000
EXPOSE 9000

ADD package.json /tmp/package.json
ADD package-lock.json /tmp/package-lock.json
RUN cd /tmp && apk add --no-cache python make g++ && npm install --production && apk del python

WORKDIR /app
ADD . /app

RUN ["ln", "-s", "/tmp/node_modules", "/app/node_modules"]
ENV LD_LIBRARY_PATH /app/node_modules/appmetrics
CMD npm start
