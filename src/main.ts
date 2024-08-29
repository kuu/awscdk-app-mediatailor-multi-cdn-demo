import * as crypto from 'crypto';
import { App, Aws, Stack, StackProps, CfnOutput, Fn } from 'aws-cdk-lib';
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from 'aws-cdk-lib/custom-resources';
import { AdDecisionServer } from 'awscdk-construct-ad-decision-server';
import { FilePublisher } from 'awscdk-construct-file-publisher';
import { LiveChannelFromMp4 } from 'awscdk-construct-live-channel-from-mp4-file';
import { ScteScheduler } from 'awscdk-construct-scte-scheduler';
import { MediaTailorWithCloudFront, CloudFront } from 'awscdk-mediatailor-cloudfront-construct';
import { Construct } from 'constructs';

export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    // Upload all the files in the local folder (./upload) to S3
    const publicFolder = new FilePublisher(this, 'FilePublisher', {
      path: './upload',
    });

    // Deploy a MediaLive channel and a MediaPackage channel/endpoints
    const { eml, empv1: emp } = new LiveChannelFromMp4(this, 'LiveChannelFromMp4', {
      source: `${publicFolder.url}/dog.mp4`,
      encoderSpec: {
        timecodeBurninPrefix: 'Ch1',
      },
      mediaPackageVersionSpec: 'V1_ONLY',
      packagerSpec: {
        startoverWindowSeconds: 300,
      },
    });

    const videoContentSourceUrl = emp?.endpoints.hls?.attrUrl;

    if (!videoContentSourceUrl) {
      return;
    }

    // Schedule a 60-sec ad break every 2 minutes
    new ScteScheduler(this, 'ScteScheduler1', {
      channelId: eml.channel.ref,
      scteDurationInSeconds: 30,
      intervalInMinutes: 2,
    });

    // Deploy an Ad Decision Server (ADS) that returns 3x creatives
    const ads = new AdDecisionServer(this, 'AdDecisionServer', {
      creatives: [
        {
          duration: 30,
          url: `${publicFolder.url}/30sec.mp4`,
          delivery: 'progressive',
          mimeType: 'video/mp4',
          width: 1280,
          height: 720,
        },
        {
          duration: 15,
          url: `${publicFolder.url}/15sec.mp4`,
          delivery: 'progressive',
          mimeType: 'video/mp4',
          width: 1280,
          height: 720,
        },
        {
          duration: 60,
          url: `${publicFolder.url}/60sec.mp4`,
          delivery: 'progressive',
          mimeType: 'video/mp4',
          width: 1280,
          height: 720,
        },
      ],
      clearanceRule: 'SEQUENCIAL', // Specify how ADS clear inventory: LONGEST_FIRST (defalut) or SEQUENCIAL
    });

    const adDecisionServerUrl = `${ads.url}?duration=[session.avail_duration_secs]`;

    // Deploy a MediaTailor config
    const { emt } = new MediaTailorWithCloudFront(this, 'MediaTailorWithCloudFront', {
      videoContentSourceUrl,
      adDecisionServerUrl,
      slateAdUrl: `${publicFolder.url}/slate-1sec.mp4`,
      skipCloudFront: true,
    });

    if (!emt) {
      return;
    }

    const emtHostName = Fn.select(2, Fn.split(emt.config.attrHlsConfigurationManifestEndpointPrefix, '/'));

    // Deploy CloudFront distribution-1
    const cdn1 = new CloudFront(this, 'CDN-1', {
      videoContentSourceUrl,
      mediaTailorEndpointUrl: emt.config.attrHlsConfigurationManifestEndpointPrefix,
      adSegmentSourceUrl: `https://${emtHostName}`,
    });

    // Deploy CloudFront distribution-2
    const cdn2 = new CloudFront(this, 'CDN-2', {
      videoContentSourceUrl,
      mediaTailorEndpointUrl: emt.config.attrHlsConfigurationManifestEndpointPrefix,
      adSegmentSourceUrl: `https://${emtHostName}`,
    });

    // Setup MediaTailor's configuration aliases
    new AwsCustomResource(this, 'AwsCustomResource', {
      onCreate: {
        service: 'MediaTailor',
        action: 'PutPlaybackConfiguration',
        region: Aws.REGION,
        parameters: {
          Name: emt.config.name,
          VideoContentSourceUrl: videoContentSourceUrl,
          AdDecisionServerUrl: adDecisionServerUrl,
          SlateAdUrl: emt.config.slateAdUrl,
          CdnConfiguration: {
            AdSegmentUrlPrefix: '[player_params.cdn]',
            ContentSegmentUrlPrefix: '[player_params.cdn]/out/v1',
          },
          ConfigurationAliases: {
            'player_params.cdn': {
              primary: `https://${cdn1.distribution.distributionDomainName}`,
              secondary: `https://${cdn2.distribution.distributionDomainName}`,
            },
          },
        },
        physicalResourceId: PhysicalResourceId.of(crypto.randomUUID()),
      },
      //Will ignore any resource and use the assumedRoleArn as resource and 'sts:AssumeRole' for service:action
      policy: AwsCustomResourcePolicy.fromSdkCalls({
        resources: AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
    });

    // Print MediaTialor Session Initialization URL - HLS
    const arr = Fn.split('/', emp.endpoints.hls.attrUrl);
    new CfnOutput(this, 'MediaTailorSessionInitializationURL-HLS', {
      value: `curl -X POST -H "Content-Type: application/json" -d '{ "playerParams": {"cdn": "primary"}}' ${emt.config.attrSessionInitializationEndpointPrefix}${Fn.select(5, arr)}/${Fn.select(6, arr)}`,
      exportName: Aws.STACK_NAME + 'MediaTailorSessionInitializationURL-HLS',
      description: 'MediaTailor Session Initialization URL - HLS',
    });

    // Print CloudFront distribution-1's domain name
    new CfnOutput(this, 'CloudFrontDomainName-1', {
      value: `https://${cdn1.distribution.distributionDomainName}`,
      exportName: Aws.STACK_NAME + 'CloudFrontDomainName-1',
      description: 'CloudFront domain name - 1',
    });

    // Print CloudFront distribution-2's domain name
    new CfnOutput(this, 'CloudFrontDomainName-2', {
      value: `https://${cdn2.distribution.distributionDomainName}`,
      exportName: Aws.STACK_NAME + 'CloudFrontDomainName-2',
      description: 'CloudFront domain name - 2',
    });
  }
}

// for development, use account/region from cdk cli
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new MyStack(app, 'awscdk-app-mediatailor-multi-cdn-demo-dev', { env: devEnv });
// new MyStack(app, 'awscdk-app-mediatailor-multi-cdn-demo-prod', { env: prodEnv });

app.synth();
