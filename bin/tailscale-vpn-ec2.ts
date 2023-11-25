#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TailscaleVpnEc2Stack } from '../lib/tailscale-vpn-ec2-stack';
import 'dotenv/config';

const app = new cdk.App();

type StackPerRegionArgs = {
  id: string;
  region: string;
  node: string;
}

const stackPerRegion = ({ id, region, node }: StackPerRegionArgs) =>
  new TailscaleVpnEc2Stack(app, id, {
    env: { region },
    tailscaleAuthKey: process.env.TAILSCALE_AUTH_KEY!,
    exitNodeName: node,
  });

stackPerRegion({ id: 'ExitNodeNorthVirginia', region: 'us-east-1', node: 'TSNorthVirginiaExitNode' });
