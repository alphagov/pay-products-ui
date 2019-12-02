FROM node@sha256:b556d8910b851c27c5c8922eeb55d94fe6dbaf878d24bf0c9a8c32ba21cd091a

### Needed to run appmetrics and pact-mock-service
COPY sgerrand.rsa.pub /etc/apk/keys/sgerrand.rsa.pub
RUN ["apk", "--no-cache", "add", "ca-certificates=20190108-r0"]
RUN wget https://github.com/sgerrand/alpine-pkg-glibc/releases/download/2.28-r0/glibc-2.28-r0.apk && apk add --no-cache glibc-2.28-r0.apk && rm -f glibc-2.28-r0.apk
###

RUN ["apk", "--no-cache", "upgrade"]

RUN ["apk", "add", "--no-cache", "bash=5.0.0-r0", "make=4.2.1-r2", "g++=8.3.0-r0", "python=2.7.16-r1", "git=2.22.0-r0", "ruby=2.5.7-r0"]

# add package.json before source for node_module cache layer
ADD package.json /tmp/package.json
ADD package-lock.json /tmp/package-lock.json
RUN cd /tmp && npm install
WORKDIR /app
ENV LD_LIBRARY_PATH /app/node_modules/appmetrics
CMD ./docker/build_and_test.sh
