FROM node:16.19.1-alpine3.17@sha256:25828d5c4ae9824273db9ca2e923da2d29bbae78f534e979f09eb99a2e812e94 as builder

### Needed to run pact-mock-service
COPY sgerrand.rsa.pub /etc/apk/keys/sgerrand.rsa.pub
RUN ["apk", "--no-cache", "add", "ca-certificates", "python3", "build-base", "bash", "ruby"]
RUN wget https://github.com/sgerrand/alpine-pkg-glibc/releases/download/2.28-r0/glibc-2.28-r0.apk && apk add --force-overwrite --no-cache glibc-2.28-r0.apk && rm -f glibc-2.28-r0.apk
###

WORKDIR /app
COPY package.json .
COPY package-lock.json .
RUN npm ci --quiet

COPY . .
RUN npm run compile

FROM node:16.19.1-alpine3.17@sha256:25828d5c4ae9824273db9ca2e923da2d29bbae78f534e979f09eb99a2e812e94 as final

RUN ["apk", "--no-cache", "upgrade"]

RUN ["apk", "add", "--no-cache", "tini"]

WORKDIR /app
COPY . .
RUN rm -rf ./test

# Copy in compile assets and deps from build container
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
RUN npm prune --production

ENV PORT 9000
EXPOSE 9000

ENTRYPOINT ["tini", "--"]

CMD ["npm", "start"]
