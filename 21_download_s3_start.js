const S3_BUCKET_NAME = 'huan.middle';
const SAVE_DIR = "C:\\PhanTichDL\\download_dir\\";
const INTERVAL_SLEEP_TIME_MS = 1000; // milisecond
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


// BucketWatcher declare
var bucketwatch = require("./lib/BucketWatcher.js");
var simMonitor = new bucketwatch.BucketWatcher(s3, S3_BUCKET_NAME);

// start the monitor and have it check for updates
simMonitor.start(INTERVAL_SLEEP_TIME_MS);


simMonitor.on("fileAdded", function (filename) {
  var params = {Bucket: S3_BUCKET_NAME, Key: filename};
  s3.getObject(params).createReadStream().pipe( fs.createWriteStream(SAVE_DIR + filename) );

  // log to the console when a file is added.
  Logger("File Added: " + filename);
});


simMonitor.on("fileChanged", function (filename) {
  var params = {Bucket: S3_BUCKET_NAME, Key: filename};
  s3.getObject(params).createReadStream().pipe( fs.createWriteStream(SAVE_DIR + filename) );

  // Log to the console when a file is changed.
  Logger("File Changed: " + filename);
});


simMonitor.on("fileRemoved", function (filename) {

  fs.unlink(SAVE_DIR + filename, (err) => {
    if (err) throw err;

    // Log to the console when a file is removed
    Logger("File Removed: " + filename);
  });
});


// Let us know that directory monitoring is happening and where.
Logger("START Monitoring the s3 bucket name of [" + S3_BUCKET_NAME + "]");
Logger("The files in this bucket will be synchronized to the local directory; [" + S3_BUCKET_NAME + "] -> [" + SAVE_DIR + "]");
