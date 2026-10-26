#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { CrudApiStack } from '../lib/crud-api-stack';
import { DynamoddbStack } from '../lib/dynamoddb-stack';

const app = new cdk.App();

const dynamodbStack = new DynamoddbStack(app, 'DynamodbStack');

const usersAppStack = new CrudApiStack(app, 'CrudApiStack', {dynamodbStack});

usersAppStack.addDependency(dynamodbStack);
