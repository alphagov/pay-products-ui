FROM govukpay/nodejs:8.11.3

RUN apk update &&\
    apk upgrade &&\
    apk add --update bash libc6-compat

ENV PORT 9000
EXPOSE 9000

ADD package.json /tmp/package.json
ADD package-lock.json /tmp/package-lock.json
RUN cd /tmp && npm install --production

WORKDIR /app
ADD . /app

RUN ln -s /tmp/node_modules /app/node_modules
ENV LD_LIBRARY_PATH /app/node_modules/appmetrics
CMD npm start
