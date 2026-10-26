import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import {Runtime} from 'aws-cdk-lib/aws-lambda';
import {NodejsFunction} from 'aws-cdk-lib/aws-lambda-nodejs';
import path from 'path';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigateway_integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import {DynamoddbStack} from './dynamoddb-stack';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

interface CrudApiStackProps extends cdk.StackProps {
  dynamodbStack: DynamoddbStack;
}

export class CrudApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CrudApiStackProps) {
    super(scope, id, props);

    const userHandler = new NodejsFunction(this, 'UsersHandler', {
      runtime: Runtime.NODEJS_24_X,
      entry: path.join(__dirname, '../src/lambda/handler.ts'),
      handler: 'handler',
      functionName: `${this.stackName}-user-handler`,
      environment: {
        TABLE_NAME: props.dynamodbStack.usersTable.tableName,
      },
    });

    props.dynamodbStack.usersTable.grantReadWriteData(userHandler);

    const httpApi = new apigateway.HttpApi(this, 'UsersApi', {
      apiName: 'UsersApi',
      description: 'API for managing users',
      corsPreflight: {
        allowHeaders: ['*'],
        allowMethods: [apigateway.CorsHttpMethod.ANY],
        allowOrigins: ['*'],
      },
    });

    const routes = [
      {path: '/users', method: apigateway.HttpMethod.GET, name: 'GetAllUsers'},
      {path: '/users', method: apigateway.HttpMethod.POST, name: 'CreateUser'},
      {path: '/users/{id}', method: apigateway.HttpMethod.PUT, name: 'UpdateUser'},
      {path: '/users/{id}', method: apigateway.HttpMethod.DELETE, name: 'DeleteUser'},
      {path: '/users/{id}', method: apigateway.HttpMethod.GET, name: 'GetUser'},
    ];

    routes.forEach(({path,method,name}) => {
      httpApi.addRoutes({
        path, methods:[method], integration: new apigateway_integrations.HttpLambdaIntegration(`${name}Integration`, userHandler),
    });
    });
    new cdk.CfnOutput(this, 'HttpApiUrl', {
      value: httpApi.url!,
      description: 'The URL of the HTTP API',
    })
}}
