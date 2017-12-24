APINAME=api-for-db-api
REGION=us-west-1
NAME=db-api # function name
API_PATH=db-api
# Create an API
aws apigateway create-rest-api --name "${APINAME}" --description "Api for ${NAME}" --region ${REGION}
APIID=$(aws apigateway get-rest-apis --query "items[?name==\`${APINAME}\`].id" --output text --region ${REGION})
echo "API ID: ${APIID}"
PARENTRESOURCEID=$(aws apigateway get-resources --rest-api-id ${APIID} --query "items[?path=='/'].id" --output text --region ${REGION})
echo "Parent resource ID: ${PARENTRESOURCEI}"
# Create a resource as a path, our function will handle many tables (resources) but you can be more specific
aws apigateway create-resource --rest-api-id ${APIID} --parent-id ${PARENTRESOURCEID} --path-part ${API_PATH} --region ${REGION}
RESOURCEID=$(aws apigateway get-resources --rest-api-id ${APIID} --query "items[?path=='/db-api'].id" --output text --region ${REGION})
echo "Resource ID for path ${API_PATH}: ${APIID}"
# Add a method like GET, POST, PUT, etc.; for CRUD we need all methods so just put ANY. Here you can set up auth as well
aws apigateway put-method --rest-api-id ${APIID} --resource-id ${RESOURCEID} --http-method ANY --authorization-type NONE  --no-api-key-required --region ${REGION}
LAMBDAARN=$(aws lambda list-functions --query "Functions[?FunctionName==\`${NAME}\`].FunctionArn" --output text --region ${REGION})
echo "Lambda Arn: ${LAMBDAARN}"
# Create integration
# http-method: proxy any http method, but could be only GET, POST, PUT, etc.
# type: proxy everything, other possible options: HTTP and AWS
# integration-http-method: must be POST for method to lambda integration to inkove lambda
aws apigateway put-integration --rest-api-id ${APIID} \
--resource-id ${RESOURCEID} \
--http-method ANY \
--type AWS_PROXY \
--integration-http-method POST \
--uri arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${LAMBDAARN}/invocations
aws apigateway create-deployment --rest-api-id ${APIID} --stage-name prod --region ${REGION}
APIARN=$(echo ${LAMBDAARN} | sed -e 's/lambda/execute-api/' -e "s/function:${NAME}/${APIID}/")
echo "APIARN: $APIARN"
UUID=$(uuidgen)
# Add permissions to invoke function
# use uuid to make sure we don't get already exists error
# in source-arn, change to prod/GET or prod/POST where pattern is stage/http-method
aws lambda add-permission \
--function-name ${NAME} \
--statement-id apigateway-db-api-any-proxy-${UUID} \
--action lambda:InvokeFunction \
--principal apigateway.amazonaws.com \
--source-arn "${APIARN}/*/*/db-api"
# This is where you can control responses
aws apigateway put-method-response \
--rest-api-id ${APIID} \
--resource-id ${RESOURCEID} \
--http-method ANY \
--status-code 200 \
--response-models "{}" \
--region ${REGION}
echo "Resource URL is https://${APIID}.execute-api.${REGION}.amazonaws.com/prod/db-api/?TableName=messages"
echo "Testing..."
curl "https://${APIID}.execute-api.${REGION}.amazonaws.com/prod/db-api/?TableName=messages"
