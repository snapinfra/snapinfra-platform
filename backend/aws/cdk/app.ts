#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { RhinoBackStack } from './rhinoback-stack';

const app = new cdk.App();

new RhinoBackStack(app, 'RhinoBackStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.AWS_REGION || 'us-east-1',
  },
  
  // Stack description
  description: 'RhinoBack - AI-powered backend generation platform infrastructure',
  
  // Tags for all resources
  tags: {
    Project: 'RhinoBack',
    Environment: process.env.NODE_ENV || 'development',
    ManagedBy: 'CDK'
  }
});