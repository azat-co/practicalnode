Chapter 16
----------
# Serverless Node with AWS Lambda

Servers are fun until they are not. You are running a news agency which has high peaks of traffic but they happen sporadically (infrequently). It'll be more cost effective to set up a REST API using Lambda to access and perform CRUD on tables in your noSQL DynamoDB database. Lambdas are charged only when they are working unlike EC2 instances which are charged for always, as long as they are running. This way with Lambda, your company will pay only for peaks and in other times when there's 0 traffic, it won't be charged at all! Stales news get almost no traffic.

Also, your last IT Ops person is leaving to work for an hot Artificial Intelligence Big Data Augmented Reality ICO-funded startup. Your company can't hire a replacement. Luckily you read this book and know that Lambda will require almost no maintenance since they are managed app environment. You can do everything yourself. The system quality might be even better than your IT Ops person did (AWS hires lots of good experts who will work on your Lambda infrastructure). All the patches, security and scaling is taken care off by AWS experts! 

Let's learn how to get started with Lambda by building a REST API for any database tables not just one. As an example, you'll be using and working with messages but clients can work with any table by sending a different query or payload. Later, you'll be able to create auth and validate request and response in API Gateway (not covered in this lab). You are going to use three Amazon Web Services (AWS) services which we will cover in this chapter:

* DynamoDB
* Lambda
* API Gateway

This chapter's project is to learn serverless. It involves creation a lambda CRUD microservice to save data in DB (AWS DynamoDB). This project is broken down into digestible easy subtasks:

1. Creating a DynamoDB table
1. Creating an IAM role to access DynamoDB
1. Creating a AWS Lambda resource
1. Creating a API Gateway resource
1. Testing the RESTful API Microservice
1. Cleaning up

Let's get started with the database. 

## 1. Creating a DynamoDB Table

The name of the table in these examples is `messages`. Feel free to modify it in the command options as you wish. The key name is `id` and the type is string (`S`)

```sh
aws dynamodb create-table --table-name messages \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
```

You'll get back the Arn identifier `TableArn` along with other information:

```js
{
  "TableDescription": {
    "TableArn": "arn:aws:dynamodb:us-west-1:161599702702:table/messages",
    "AttributeDefinitions": [
      {
        "AttributeName": "id",
        "AttributeType": "N"
      }
    ],
    "ProvisionedThroughput": {
      "NumberOfDecreasesToday": 0,
      "WriteCapacityUnits": 5,
      "ReadCapacityUnits": 5
    },
    "TableSizeBytes": 0,
    "TableName": "messages",
    "TableStatus": "CREATING",
    "KeySchema": [
      {
        "KeyType": "HASH",
        "AttributeName": "id"
      }
    ],
    "ItemCount": 0,
    "CreationDateTime": 1493219395.933
  }
}
```

You can also get this info by

```sh
aws dynamodb describe-table --table-name messages
```

You can get the list of all tables in your selected region (which you set in `aws configure`):

```sh
aws dynamodb list-tables
```

Next on our agenda is the access role to this table. 

## 2. Creating an IAM role to Access DynamoDB

The next step is to create an identity access management role which will allow the Lambda function to access the DynamoDB database. We shall start with this JSON file which describes a thing called *trust policy*. This policy is needed for the role. Copy this code and save into `lambda-trust-policy.json`:

```js
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "",
      "Effect": "Allow",
      "Principal": {
        "Service": [
          "lambda.amazonaws.com"
        ]
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

Let's create an IAM role so our lambda can access DynamoDB. Create a role with a trust policy from a file using this AWS CLI command (you installed AWS CLI, right?):

```sh
aws iam create-role --role-name LambdaServiceRole --assume-role-policy-document file://lambda-trust-policy.json
```

If everything went file, then the role will be created. Compare your results with the one below which has the trust policy content under `AssumeRolePolicyDocument` *in addition* to the identifiers of the newly created role: the role ID, name and `Arn`. Here's my result. You result will have different IDs.


```js
{
  "Role": {
    "AssumeRolePolicyDocument": {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Action": "sts:AssumeRole",
          "Principal": {
            "Service": [
              "lambda.amazonaws.com"
            ]
          },
          "Effect": "Allow",
          "Sid": ""
        }
      ]
    },
    "RoleId": "AROAJLHUFSSSWHS5XKZOQ",
    "CreateDate": "2017-04-26T15:22:41.432Z",
    "RoleName": "LambdaServiceRole",
    "Path": "/",
    "Arn": "arn:aws:iam::161599702702:role/LambdaServiceRole"
  }
}
```

Write down the role Arn somewhere so you have it handy. 

Next, add the policies so the lambda function can work with the database. In the command below, the role is specified by name `LambdaServiceRole` which if you remember is the name we used to create the role in the previous command. In other words, we attach a special *managed* policy which grants our future Lambda functions (which will use this role) an access to DynamoDB. The name of this special policy is `AmazonDynamoDBFullAccess`. Not all services have managed policies. In some cases, developers will have to attach policies for read, write, etc. one by one which is called inline policies.

```sh
aws iam attach-role-policy --role-name LambdaServiceRole --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess
```

No output is a good thing in this case. 😄

Other optional managed policy which you can use in addition to `AmazonDynamoDBFullAccess` is `AWSLambdaBasicExecutionRole`. It has the logs (CloudWatch) write permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
```

The commands to attach more managed policies are the same—`attach-role-policy`.


## 3. Creating a AWS Lambda resource

On the high level view, our function (file `code/ch16/serverless/index.js`) looks like this:

```js
const doc = require('dynamodb-doc')
const dynamo = new doc.DynamoDB() // Connects to the DB in the same region automatically, no need for IPs or passwords

exports.handler = (event, context, callback) => {
  switch (event.httpMethod) {
    case 'DELETE':
      // Delete item
      // Call callback with ok
    case 'GET':
      // Read items
      // Call callback with items
    case 'POST':
      // Create item
      // Call callback with ok
    case 'PUT':
      // Update item
      // Call callback with ok
    default:
      // Call callback with error
  }
}
```

The access to the database is provided via the `dynamodb-doc` library which is instantiated into the `dynamo` object. No need for IP/domain or passwords. The IAM and AWS will do everything and provide the access to the entire DynamoDB instance which can have multiple tables There's a single instance per region and there are multiple regions per account.

The Lambda function which is in this case a request handler is very similar to Express request handler. There's a function with three arguments: event, context and callback. The request body is in the `event.body`. The request HTTP method is in `event.httpMethod`. It's worth mentioning that Lambda functions could be and do anything not just be request handlers. They can do some computation or work with data. All the operations are done with these three arguments `event`, `context` and `callback`.

Here's the code for the function. It checks HTTP methods and performs CRUD on DynamoDB table accordingly. Table name comes from query string or from the request body.

```js
'use strict'

console.log('Loading function')
const doc = require('dynamodb-doc')
const dynamo = new doc.DynamoDB()

// All the request info in event
// "handler" is defined on the function creation
exports.handler = (event, context, callback) => {
    // Callback to finish response
  const done = (err, res) => callback(null, {
    statusCode: err ? '400' : '200',
    body: err ? err.message : JSON.stringify(res),
    headers: {
      'Content-Type': 'application/json'
    }
  })
    // To support mock testing, accept object not just strings
  if (typeof event.body === 'string') { event.body = JSON.parse(event.body) }
  switch (event.httpMethod) {
        // Table name and key are in payload
    case 'DELETE':
      dynamo.deleteItem(event.body, done)
      break
        // No payload, just a query string param
    case 'GET':
      dynamo.scan({ TableName: event.queryStringParameters.TableName }, done)
      break
        // Table name and key are in payload
    case 'POST':
      dynamo.putItem(event.body, done)
      break
        // Table name and key are in payload
    case 'PUT':
      dynamo.updateItem(event.body, done)
      break
    default:
      done(new Error(`Unsupported method "${event.httpMethod}"`))
  }
}
```

So either copy or type the code of the Lambda function above into a file. Then archive it with ZIP into `db-api.zip`. Yes. It's a simple archive and that's how we will deploy it, by archiving and uploading this archive file. No Git. Funny, right?

Now, we can create an AWS Lambda function in the cloud from the source code which is now only on your local machines. Use your IAM role Arn from the IAM step. The code for the function will come from a zip file. The handle is the name of the method in `index.js` for AWS to import and invoke. The `--zip-file fileb://db-api.zip` means upload the function from this file named `db-api.zip` which is in the same folder as this command `create-function`.

Memory size and timeout are optional. By default, they are 128 and 3 correspondingly. You can see that the Node version is 6.1. Another important thing to notice and to know about is the function name itself which is `db-api`. We'll use this name a lot for connecting this function to API Gateway later in this chapter.

```
aws lambda create-function --function-name db-api \
  --runtime nodejs6.10 --role arn:aws:iam::161599702702:role/LambdaServiceRole \
  --handler index.handler \
  --zip-file fileb://db-api.zip \
  --memory-size 512 \
  --timeout 10
```

Results will look similar to this but with different IDs of course. The function name must be `db-api` or other scripts in this chapter won't work. Also, make sure Node is at least version 6.

```js
{
  "CodeSha256": "bEsDGu7ZUb9td3SA/eYOPCw3GsliT3q+bZsqzcrW7Xg=",
  "FunctionName": "db-api",
  "CodeSize": 778,
  "MemorySize": 512,
  "FunctionArn": "arn:aws:lambda:us-west-1:161599702702:function:db-api",
  "Version": "$LATEST",
  "Role": "arn:aws:iam::161599702702:role/LambdaServiceRole",
  "Timeout": 10,
  "LastModified": "2017-04-26T21:20:11.408+0000",
  "Handler": "index.handler",
  "Runtime": "nodejs6.10",
  "Description": ""
}
```

Test function with this data mocks an HTTP request. I saved it in the `db-api-test.json` file. It just has an object with the HTTP method set to GET and the query string with the table name parameter. 

```json
{
  "httpMethod": "GET",
  "queryStringParameters": {
    "TableName": "messages"
  }
}
```

You can copy this object into the web console as shown in Figure 16-1 or use CLI. I recommend CLI. Run from your terminal or command prompt the AWS CLI command `aws lambda invoke` with parameters to execute function in the cloud. The parameters will point to the data file with the mock HTTP request using `--payload file://db-api-test.json`.

```
aws lambda invoke \
  --invocation-type RequestResponse \
  --function-name db-api \
  --payload file://db-api-test.json \
  output.txt
```

Or testing can be done from the web console in Lambda dashboard as I mentioned before. Simply select the blue test button once you navigate to function detailed view and paste the data (Figure 16-1). Disregard the template which says mobile backend. This event that we tested is a GET HTTP request with a query string.  

![](media/serverless-1.png)
***Figure 16-1.** Mocking HTTP request to our AWS Lambda in AWS web console*

The results should be 200 (ok status) and output in the `output.txt` file. For example, I do NOT have any record yet so my response is this:

```
{"statusCode":"200","body":"{\"Items\":[],\"Count\":0,\"ScannedCount\":0}","headers":{"Content-Type":"application/json"}}
```

The function is working and fetching from the database.  You can test other HTTP methods by modifying the input. For example, to test creation of an item use POST method and provide the proper body with must have `TableName` and `Item` fields just like in our Node code of our function (*what we coded in the function, exactly that must be used in the body*):

```json
{
  "httpMethod": "POST",
  "queryStringParameters": {
    "TableName": "messages"
  },
  "body": {
    "TableName": "messages",
    "Item":{
      "id":"1",       
      "author": "Neil Armstrong",
      "text": "That is one small step for (a) man, one giant leap for mankind"
    }
  }
}
```

Enough with the testing by the way of mocking the HTTP requests. THe function is working. It was invoked from the AWS CLI and from the AWS web console. Now we must create a special URL which will trigger/invoke/execute our function every time there's a request.

## 4. Creating a API Gateway resource

API Gateway will allow to create a REST API resource (like a route, a URL or an endpoint). Every time someone sends a request, this resource will invoke our lambda. You will need to do the following to create the REST resource/endpoint:

1. Create REST API in API Gateway
1. Create a resource (i.e, `/db-api`, e.g.,`/users`, `/accounts`)
1. Define HTTP method(s) without auth
1. Define integration to Lambda (proxy)
1. Create deployment
1. Give permissions for API Gateway resource and method to invoke Lambda

The process is not straightforward. In fact it's prone to mistake and errors. I spend many hours tweaking and mastering all the steps above to automate, that is to create a magical shell script. Thus, you can use a shell script which will perform all the steps (recommended) or... the web console because web console will simplify and automate things for you too.

The shell script is in the `create-api.sh` file. It has inline comments to help you understand what is happening. Feel free to inspect `create-api.sh`. For brevity and to avoid clutter, the file is not copied into this document.

Run this command to create the API endpoint and integrate it with Lambda function (if you modified the region or the function name, you'll need to change those values in script as well):

```
sh create-api.sh
```

In the end, script will make a GET request to check that everything is working. This is an example of running the automation script for the API Gateway (your IDs and Arns will be different):

```sh
sh create-api.sh
{
    "id": "sdzbvm11w6",
    "name": "api-for-db-api",
    "description": "Api for db-api",
    "createdDate": 1493242759
}
API ID: sdzbvm11w6
Parent resource ID: sdzbvm11w6
{
    "path": "/db-api",
    "pathPart": "db-api",
    "id": "yjc218",
    "parentId": "xgsraybhu2"
}
Resource ID for path db-api: sdzbvm11w6
{
    "apiKeyRequired": false,
    "httpMethod": "ANY",
    "authorizationType": "NONE"
}
Lambda Arn: arn:aws:lambda:us-west-1:161599702702:function:db-api
{
    "httpMethod": "POST",
    "passthroughBehavior": "WHEN_NO_MATCH",
    "cacheKeyParameters": [],
    "type": "AWS_PROXY",
    "uri": "arn:aws:apigateway:us-west-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-west-1:161599702702:function:db-api/invocations",
    "cacheNamespace": "yjc218"
}
{
    "id": "k6jko6",
    "createdDate": 1493242768
}
APIARN: arn:aws:execute-api:us-west-1:161599702702:sdzbvm11w6
{
    "Statement": "{\"Sid\":\"apigateway-db-api-any-proxy-9C30DEF8-A85B-4EBC-BBB0-8D50E6AB33E2\",\"Resource\":\"arn:aws:lambda:us-west-1:161599702702:function:db-api\",\"Effect\":\"Allow\",\"Principal\":{\"Service\":\"apigateway.amazonaws.com\"},\"Action\":[\"lambda:InvokeFunction\"],\"Condition\":{\"ArnLike\":{\"AWS:SourceArn\":\"arn:aws:execute-api:us-west-1:161599702702:sdzbvm11w6/*/*/db-api\"}}}"
}
{
    "responseModels": {},
    "statusCode": "200"
}
Resource URL is https://sdzbvm11w6.execute-api.us-west-1.amazonaws.com/prod/db-api/?TableName=messages
Testing...
{"Items":[],"Count":0,"ScannedCount":0}%
```

You are all done! The resource URL is there in your terminal output. The script even tested the function for you if you look at the very last line (must be `"Items": []` unless you inserted a few records in the DB already).

## 5. Testing the RESTful API Microservice

You can then manually run tests by getting resource URL and using cURL, Postman or any other HTTP client. For example, my GET looks like this (replace the URL with yours):

```sh
curl "https://sdzbvm11w6.execute-api.us-west-1.amazonaws.com/prod/db-api/?TableName=messages"
```

But my POST has a body and header with a unique ID:

```sh
curl "https://sdzbvm11w6.execute-api.us-west-1.amazonaws.com/prod/db-api/?TableName=messages" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"TableName": "messages",
    "Item": {
      "id": "'$(uuidgen)'",
      "author": "Neil Armstrong",
      "text": "That is one small step for (a) man, one giant leap for mankind"
    }
  }'
```

Here's an option if you don't want to copy paste your endpoint URL. Use env var to store URL and then CURL to it. Execute this once to store the env var `API_URL`:

```sh
APINAME=api-for-db-api
REGION=us-west-1
NAME=db-api
APIID=$(aws apigateway get-rest-apis --query "items[?name==\`${APINAME}\`].id" --output text --region ${REGION})
API_URL="https://${APIID}.execute-api.${REGION}.amazonaws.com/prod/db-api/?TableName=messages"
```

Then run for GET as many times as you want:

```sh
curl $API_URL
```

And for POST as many times as you want (thanks to `uuidgen`):

```sh
curl ${API_URL} \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"TableName": "messages",
    "Item": {
      "id": "'$(uuidgen)'",
      "author": "Neil Armstrong",
      "text": "That is one small step for (a) man, one giant leap for mankind"
    }
  }'
```

The new items can be observed via an HTTP interface by making another GET request... or in web console in DynamoDB dashboard as shown below in Figure 16-2:

![](media/serverless-db.png)
***Figure 16-2.** Verifying newly created in the messages table DB records by looking at the AWS web console's DynamoDB dashboard*

Yet another option to play with your new REST API resource. A very popular GUI app for making HTTP requests called Postman. Here's how the POST request looks like in Postman. Remember to select POST, Raw and JSON (application/json):

![](media/serverless-postman.png)
***Figure 16-3.** Using Postman to validate the REST API endpoint to AWS Lambda which creates a DB record*

To delete an item with DELETE HTTP request method, the payload must have a `Key` field of that record which we want to delete. For example:

```json
{
    "TableName": "messages",
    "Key":{
       "id":"8C968E41-E81B-4384-AA72-077EA85FFD04"
    }

}
```

Congratulations! You've built an event-driven REST API for an entire database not just a single table!

Note: For auth, you can set up token-based auth on a resource and method in API Gateway. You can set up response and request rules in the API Gateway as well. Also, everything (API Gateway, Lambda and DynamoDB) can be set up in CloudFormation instead of a CLI or web console ([example of Lambda with CloudFormation](https://github.com/awslabs/lambda-refarch-webapp/)).

## 6. Cleaning up

Remove API Gateway API with `delete-rest-api`. For example here's my command (for yours replace REST API ID accordingly):

```sh
aws apigateway delete-rest-api --rest-api-id sdzbvm11w6
```

Delete function by its name using `delete-function`:

```sh
aws lambda delete-function --function-name db-api
```

Finally, delete the database too by its name:

```sh
aws dynamodb delete-table --table-name messages
```

I taught this project over 20 times so I know the common problems. Thus, let's do troubleshooting of the common issues:

* Internal server error: Check your JSON input. DynamoDB requires special format for Table Name and Key.
* Permissions: Check the permission for API resource and method to invoke Lambda. Use test in API Gateway to debug
* `UnexpectedParameter: Unexpected key '0' found in params`: Check that you are sending proper format, JSON vs. string
* ` <AccessDeniedException><Message>Unable to determine service/operation name to be authorized</Message></AccessDeniedException>`: Make sure to use POST for integration-http-method as in the create-api script because API Gateway integration can only use POST to trigger functions even for other HTTP methods defined for this resource (like ANY).
* Wrong IDs: Make sure to check names and IDs if you modified the examples.


Summary
=======

Amazon Web Services offers myriads of cloud services and most of them benefit or use Node. Serverless architecture is one of them. In AWS serverless service is AWS Lambda. It uses managed and configured Node environment to run code (among other environment such as Python, Java, and other dinosaurs). The code can be HTTP request-response services (microservices) when you add API Gateway to Lambda. That's what we did but that's not all. Lambdas can be just code for sending notifications, data crunching and any other tasks. 
