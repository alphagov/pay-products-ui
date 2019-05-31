# alpine:3.8
FROM alpine@sha256:ea47a59a33f41270c02c8c7764e581787cf5b734ab10d27e876e62369a864459

RUN ["apk", "--no-cache", "upgrade"]

RUN ["apk", "add", "--no-cache", "nodejs", "npm", "bash"]

ENV PORT 9000
EXPOSE 9000

ADD package.json /tmp/package.json
ADD package-lock.json /tmp/package-lock.json
RUN cd /tmp && npm install --production

WORKDIR /app
ADD . /app

RUN ["ln", "-s", "/tmp/node_modules", "/app/node_modules"]
ENV LD_LIBRARY_PATH /app/node_modules/appmetrics
CMD npm start
