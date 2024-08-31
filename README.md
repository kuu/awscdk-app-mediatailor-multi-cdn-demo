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

## Cleanup
```
$ npx cdk destroy
```

