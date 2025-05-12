#!/bin/bash

set -e

ZIP_NAME="zebra-bsb-feed-downloader.zip"
STACK_NAME="zebra-feed-downloader-stack"
TEMPLATE="zebra-puppeteer-lambda.yaml"
S3_BUCKET="zebra-lambda-deploy"
S3_KEY="$ZIP_NAME"
LAMBDA_NAME="zebra-puppeteer"

echo "🧼 Cleaning old zip..."
rm -f $ZIP_NAME

# Skip npm install because you want to use the already available node_modules
echo "🗜️ Creating deployment zip..."
zip -r $ZIP_NAME index.js node_modules zebra-puppeteer-lambda.yaml > /dev/null

echo "☁️ Uploading to S3..."
aws s3 cp $ZIP_NAME s3://$S3_BUCKET/$S3_KEY

echo "🚀 Deploying CloudFormation stack..."
aws cloudformation deploy \
  --template-file $TEMPLATE \
  --stack-name $STACK_NAME \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides LambdaCodeBucket=$S3_BUCKET LambdaCodeKey=$S3_KEY

echo "✅ Stack deployed. Invoking Lambda..."
aws lambda invoke \
  --function-name $LAMBDA_NAME \
  --payload '{}' \
  output.json && cat output.json

echo "📋 Fetching CloudWatch logs:"
aws logs tail /aws/lambda/$LAMBDA_NAME --since 5m --format short