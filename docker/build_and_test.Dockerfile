FROM govukpay/nodejs:alpine-3.8

RUN apk update &&\
    apk upgrade &&\
    apk add --update bash ruby

# add package.json before source for node_module cache layer
ADD package.json /tmp/package.json
ADD package-lock.json /tmp/package-lock.json
RUN cd /tmp && npm install
WORKDIR /app
ENV LD_LIBRARY_PATH /app/node_modules/appmetrics
CMD rm -rf node_modules && ln -s /tmp/node_modules /app/node_modules && npm run compile && npm run lint && npm run test-with-coverage -- --forbid-only --forbid-pending && rm -rf node_modules
