# awscdk-app-mediatailor-multi-cdn-demo

AWS CDK app for deploying a MediaTailor config and 2 x CloudFront distributions to demonstrate CDN switching using MediaTailor's configuration aliases

## Install
1. Setup [CDK](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html) environment (including Node.js)

2. Install this CDK app
```
$ git clone https://github.com/kuu/awscdk-app-mediatailor-multi-cdn-demo.git
$ cd awscdk-app-mediatailor-multi-cdn-demo
$ npm i
```

## Deploy
```
$ npx cdk deploy
```
The following resources will be deployed:
* MediaLive channel
* MediaPackage channel and endpoints
* MediaTailor configuration
* S3 bucket
* CloudFront distributions
* EventBridge rule
* Lambda functions
* API Gateway REST API

## Swith CDN
You can specify CDN using the configuration aliases (primary/secondary.)
A `curl` command like the following will be printed:
```
$ curl -X POST -H "Content-Type: application/json" -d '{ "playerParams": {"cdn": "primary"}}' https://{Origin ID}.mediatailor.{Region}.amazonaws.com/v1/session/{Customer ID}/{Config Name}/{MediaPackage endpoint ID}/index.m3u8

{"manifestUrl":"/v1/master/{Customer ID}/{Config Name}/{MediaPackage endpoint ID}/index.m3u8?aws.sessionId={Session ID}","trackingUrl":"/v1/tracking/{Customer ID}/{Config Name}/{Session ID}"}
```
You can use the command to get the manitest/tracking URLs.

## Cleanup
```
$ npx cdk destroy
```
