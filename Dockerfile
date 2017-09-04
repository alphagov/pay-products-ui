FROM node:6.11.1-alpine

RUN apk update && apk upgrade

# Install packages needed for production
RUN apk add --update bash python make g++ libc6-compat tar curl

ENV PORT 8080

# add package.json before source for node_module cache
ADD package.json /tmp/package.json
RUN cd /tmp && npm install

ADD . /app
WORKDIR /app

# copy cached node_modules to /app/node_modules
RUN mkdir -p /app && cp -a /tmp/node_modules /app/

# build and test
# docker runs things as root, hence --unsafe-perm, but it's in a container!
RUN npm install --unsafe-perm && npm test && npm prune --production

RUN apk del python make g++ tar curl

CMD NODE_ENV=production npm start
