import { awscdk } from 'projen';
const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '2.154.1',
  defaultReleaseBranch: 'main',
  name: 'awscdk-app-mediatailor-multi-cdn-demo',
  projenrcTs: true,
  keywords: [
    'cdk',
    'cdk-app',
    'MediaTailor',
    'CloudFront',
    'Multi-CDN',
  ],
  license: 'MIT',
  licensed: true,
  copyrightOwner: 'Kuu Miyazaki',
  deps: [
    'aws-cdk-lib',
    'constructs',
    'awscdk-construct-file-publisher',
    'awscdk-construct-live-channel-from-mp4-file',
    'awscdk-construct-scte-scheduler',
    'awscdk-construct-ad-decision-server',
    'awscdk-mediatailor-cloudfront-construct',
  ],
  description: 'AWS CDK app for deploying a MediaTailor config and 2x CloudFront distributions to demonstrate CDN switching using MediaTailor\'s configuration aliases',
  // devDeps: [],             /* Build dependencies for this module. */
  // packageName: undefined,  /* The "name" in package.json. */
});
project.synth();
