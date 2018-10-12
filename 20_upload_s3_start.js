const S3_BUCKET_NAME = 'huan.middle';
const UPLOAD_DIR = "C:\\PhanTichDL\\upload_dir\\";
const INTERVAL_TIME_MS = 1000; // milisecond
const {Logger} = require("./lib/Logger.js");


// aws libary using
var AWS = require('aws-sdk');
var fs  = require('fs');

var credentials = new AWS.SharedIniFileCredentials({profile: 's3-write'});
AWS.config.credentials = credentials;

var s3_config = {
                  region  : 'ap-southeast-1', //Singapore
                };

var s3 = new AWS.S3(s3_config);

// DirectoryWatcher declare
var dirwatch = require("./lib/DirectoryWatcher.js");
var simMonitor = new dirwatch.DirectoryWatcher(UPLOAD_DIR);

// start the monitor and have it check for updates
simMonitor.start(INTERVAL_TIME_MS);


simMonitor.on("fileAdded", function (filename) {
  // log to the console when a file is added.
  Logger("File Added: " + filename);

  // up file to aws s3
  fs.readFile( UPLOAD_DIR + filename , function (err, data) {
    if (err) { throw err; }

    var base64data = new Buffer(data, 'binary');

    s3.putObject({
      Bucket: S3_BUCKET_NAME,
      Key: filename,
      Body: base64data
    },
    function(err, data) {
      if (err) Logger("Error : " + err);           // an error occurred
      // else     console.log(data);           // successful response
    });
  });
});



simMonitor.on("fileChanged", function (filename) {
  // Log to the console when a file is changed.
  Logger("File Changed: " + filename);

  // up file to aws s3
  fs.readFile( UPLOAD_DIR + filename , function (err, data) {
    if (err) { throw err; }

    var base64data = new Buffer(data, 'binary');

    s3.putObject({
      Bucket: S3_BUCKET_NAME,
      Key: filename,
      Body: base64data
    },
    function(err, data) {
      if (err) Logger("Error : "  + err); // an error occurred
      // else     console.log(data);           // successful response
    });
  });
});


// Log to the console when a file is removed
simMonitor.on("fileRemoved", function (filename) {
  Logger("File Deleted: " + filename);

  s3.deleteObject(
    {
      Bucket: S3_BUCKET_NAME,
      Key: filename,
    }, 
    function(err, data) {
      if (err) Logger("Error : " + err); // an error occurred
      // else     console.log(data);           // successful response
    }
  );

});


// Let us know that directory monitoring is happening and where.
Logger("START Monitoring the directory of [" + UPLOAD_DIR + "]");
Logger("The files in this directory will be synchronized to s3 bucket; [" + UPLOAD_DIR + "] -> [" + S3_BUCKET_NAME + "]");
