const config = require('./conf/config.json')
const {Logger} = require("./lib/Logger.js");

// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
var fs  = require('fs');

var credentials = new AWS.SharedIniFileCredentials({profile: config.SQS.Credential});
AWS.config.credentials = credentials;

var sqs_config = {
                  region  : config.SQS.Region,
                };

// Create an SQS service object
var sqs = new AWS.SQS(sqs_config);

// DirectoryWatcher declare
var dirwatch = require("./lib/DirectoryWatcher.js");
var simMonitor = new dirwatch.DirectoryWatcher(config.SQS.UPLOAD_DIR);

// start the monitor and have it check for updates
simMonitor.start(config.SQS.INTERVAL_SLEEP_TIME_MS);


simMonitor.on("fileAdded", function (filename) {
  // log to the console when a file is added.
  Logger("File Added: " + filename);

  // up file to aws s3
  fs.readFile( config.SQS.UPLOAD_DIR + filename , function (err, data) {
    if (err) { throw err; }

    var params = {
     DelaySeconds: 0,
     MessageAttributes: {
      "FileName": {
        DataType: "String",
        StringValue: filename
       },
       "Status": {
        DataType: "String",
        StringValue: "NEW"
       }
     },
     MessageBody: data.toString(),
     QueueUrl: config.SQS.SQS_QUEUE_URL
    };

    sqs.sendMessage(params, function(err, ret) {
      if (err) {
        Logger("Error : " + err);
      } else {
        // Logger("Success : " + ret.MessageId);
      }
    });
  });
});


simMonitor.on("fileChanged", function (filename) {
  // Log to the console when a file is changed.
  Logger("File Changed: " + filename);

  // up file to aws s3
  fs.readFile( config.SQS.UPLOAD_DIR + filename , function (err, data) {
    if (err) { throw err; }

    var params = {
     DelaySeconds: 0,
     MessageAttributes: {
      "FileName": {
        DataType: "String",
        StringValue: filename
       },
      "Status": {
        DataType: "String",
        StringValue: "UPDATE"
       }
     },
     MessageBody: data.toString(),
     QueueUrl: config.SQS.SQS_QUEUE_URL
    };

    sqs.sendMessage(params, function(err, ret) {
      if (err) {
        Logger("Error : " + err);
      } else {
        // Logger("Success : " + ret.MessageId);
      }
    });
  });
});


// Log to the console when a file is removed
simMonitor.on("fileRemoved", function (filename) {
  Logger("File Deleted: " + filename);

  var params = {
   DelaySeconds: 0,
   MessageAttributes: {
    "FileName": {
      DataType: "String",
      StringValue: filename
     },
    "Status": {
      DataType: "String",
      StringValue: "REMOVE"
     }
   },
   MessageBody: "REMOVE " + filename,
   QueueUrl: config.SQS.SQS_QUEUE_URL
  };

  sqs.sendMessage(params, function(err, ret) {
    if (err) {
      Logger("Error : " + err);
    } else {
      // Logger("Success : " + ret.MessageId);
    }
  });

});


// // Let us know that directory monitoring is happening and where.
Logger("START Monitoring the directory of [" + config.SQS.UPLOAD_DIR + "]");
Logger("The files in this directory will be send to queue; [" + config.SQS.UPLOAD_DIR + "] -> [QUEUE]");
