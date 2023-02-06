# pay-products-ui 

User interface app for product payments (Prototype/Demo/Ad-hoc etc) integrated with GOVUK Pay.

## Running locally

### Prerequisites

* This requires the [Pay CLI](https://github.com/alphagov/pay-infra/tree/master/cli), which is not publicly available at present.
* You have [set up your local development environment](https://pay-team-manual.cloudapps.digital/manual/setup-local-dev-environment.html)
* Clone this repo locally.

### Starting app

Copy `.env.example` and rename to `.env`. This contains the environment variables required to run the app, and contains the URLs for other microservices that products UI makes requests to, which default to the URLs that apps run using pay local are available on.

Start the Pay local environment 

```
pay local launch --cluster paymentlinks
```

Start products UI

```
npm install && npm run compile
npm run start:dev
```

Visit the site on http://localhost:3000.

### Debug using Visual Studio Code

* In VSCode, go to the `Debug` view (on MacOS, use shortcut `CMD + shift + D`).
* From the **Run** toolbar, select tne launch config `Products UI`.
* Add breakpoints to any file you want to debug - click in the left hand column and a red dot will appear.
* Press The `green play` button (`F5` MacOS):
    * This will run the app in debug mode.
    * Uses `nodemon` so it will automatically restart on code changes.

### Watching for changes

You shouldn’t need to restart the app to see changes you make.

We use [nodemon](https://github.com/remy/nodemon) which watches for changes to files and restarts the node process.

If you’re making changes to client-side JS or Sass files (anything within [`/browsered/`](app/browsered) or [`/assets/`](app/assets/)) then running `npm run watch-live-reload` will watch for changes and recompile. Nodemon does not do anything here as that’s not necessary. If you install the [livereload browser plugin](http://livereload.com/extensions/) then it will refresh your page once the assets have been compiled to the `/public` folder.

## Running tests

### To run mocha tests
```
npm run compile && npm test
```
### Debug tests using Visual Studio Code

#### IMPORTANT NOTE - some tests do not work in debug mode
* Some integration tests do not work in debug mode.  This is because the tests are dependent on other tests running before hand.
* Nevertheless, it is still useful to debug tests that do work in debug mode.

#### Run tests in debug mode
* In VSCode, go to the `Debug` view (on MacOS, use shortcut `CMD + shift + D`).
* From the **Run** toolbar, select the launch config you want to run:
  * `Mocha All` - runs all tests.
  * `Mocha Current File` - only run currently open test file.
* Add breakpoints to any file you want to debug - click in the left hand column and a red dot will appear.
* Press The `green play` button or `F5`.

## Key runtime environment variables

| Variable                              | Description                               |
|---------------------------------------|:----------------------------------------- |
| `ADMINUSERS_URL`                      | 
| `ANALYTICS_TRACKING_ID`               | 
| `COOKIE_MAX_AGE`                      | 
| `CORRELATION_HEADER_NAME`             | Default `x-request-id`
| `DISABLE_INTERNAL_HTTPS`              | 
| `DISABLE_REQUEST_LOGGING`             | 
| `MAX_SOCKETS`                         | 
| `METRICS_HOST`                        | 
| `NODE_ENV`                            | 
| `NODE_WORKER_COUNT`                   | Default `1`
| `PORT`                                | Default `3000`
| `PRODUCTS_URL`                        | 
| `SELFSERVICE_DASHBOARD_URL`           | 
| `SELFSERVICE_DEMO_PAYMENT_RETURN_URL` | 
| `SESSION_ENCRYPTION_KEY`              | 


## Key build-time environment variables

| Variable                | Description                               |
| ----------------------- |:----------------------------------------- |
| `LOCAL_ENV`             | 
| `PACT_BROKER_PASSWORD`  | 
| `PACT_BROKER_URL`       | 
| `PACT_BROKER_USERNAME`  | 
| `PACT_CONSUMER_TAG`     | 
| `PACT_CONSUMER_VERSION` | 

## Vulnerability Disclosure

GOV.UK Pay aims to stay secure for everyone. If you are a security researcher and have discovered a security vulnerability in this code, we appreciate your help in disclosing it to us in a responsible manner. Please refer to our [vulnerability disclosure policy](https://www.gov.uk/help/report-vulnerability) and our [security.txt](https://vdp.cabinetoffice.gov.uk/.well-known/security.txt) file for details.
