const config = require('./conf/config.json')
const {Logger} = require("./lib/Logger.js");

// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');

var credentials = new AWS.SharedIniFileCredentials({profile: config.SQS.Credential});
AWS.config.credentials = credentials;

var sqs_config = {
                  region  : config.SQS.Region,
                };

// Create an SQS service object
var sqs = new AWS.SQS(sqs_config);

var params = {
 QueueUrl: config.SQS.SQS_QUEUE_URL,
 WaitTimeSeconds: 20,
 MaxNumberOfMessages: 10,
 VisibilityTimeout: 60,
 MessageAttributeNames: [
    "All"
 ]
};

// QueueListener declare
var queueListener = require("./lib/QueueListener.js");
var simMonitor = new queueListener.QueueListener(sqs, params, config.SQS.SAVE_DIR, config.SQS.INTERVAL_SLEEP_TIME_MS);

// start listening new data from queue
simMonitor.start();

// Let us know that directory monitoring is happening and where.
Logger("START listen the Queue");
Logger("The queue contents will be writen to the local directory; [QUEUE] -> [" + config.SQS.SAVE_DIR + "]");
