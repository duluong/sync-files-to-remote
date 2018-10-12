// Imports / Requires
const {Logger} = require("./Logger.js");
var util = require("util");
var events = require("events");


// Create an object that watches a given directory for any
// changes to files or folders in that directory
// bucket_name = bucket_name path of directory to watch
// Emits six events:
//   fileAdded        : When a file is added to a monitored directory
//   fileChanged      : When a file is changed
//   fileRemoved      : When a file is removed
//   scannedDirectory : When a directory has been scanned
var BucketWatcher = function (s3_client, bucket_name) {  
  this.s3_client        = s3_client;  
  this.bucket_name      = bucket_name;  
  this.previousFileList = new Map();
  this.currentFileList  = new Map();
  // this.timer            = null;  // timer handling scan passes
  this.suppressEvents   = false;  // should we supress initial events?
  
  // set a self var
  var self = this;

  // Call the EvnetEmitter
  events.EventEmitter.call(this);


  this.scanBucket = function (interval_sleep_time_ms, loopback) {
    // // check loop time
    // Logger(new Date());

    self.s3_client.listObjects({
      Bucket: self.bucket_name
    }, 
    function(err, data) {
      // Logger(data.Contents);
      if (err) throw err;

      var i = data.Contents.length;
      if (i === 0) {
        // if there are no files (0) then emit scanned directory
        if (!self.suppressEvents) {
          self.suppressEvents = true;
          self.emit("scannedDirectory", self.bucket_name);
        }      
      }
      else {
        var previousFile, currentFile;
        self.previousFileList = new Map(self.currentFileList);
        self.currentFileList = new Map();

        data.Contents.forEach(function(f) {
          // Logger(f);
          currentFile = {
                          LastModified  : f.LastModified, 
                          Size          : f.Size, 
                        };

          self.currentFileList.set(f.Key, currentFile);

          // check 
          if (self.previousFileList.has(f.Key)) {
            previousFile = self.previousFileList.get(f.Key);

            if ( previousFile.LastModified.toISOString() !== currentFile.LastModified.toISOString() || 
                 previousFile.Size                       !== currentFile.Size) {

              // object was changed
              self.emit("fileChanged", f.Key);
              // Logger("File Changed: " + f.Key);
            }
          }
          else {
            // object was added
            self.emit("fileAdded", f.Key);
          }
        });

        self.previousFileList.forEach(function(value, key) {
           // check 
          if ( !self.currentFileList.has(key) ) {
            // object was deleted
            self.emit("fileRemoved", key);
            // Logger("File Removed: " + key);
          }
        });

        if (!self.suppressEvents) {
          self.suppressEvents = true;
          self.emit("scannedDirectory", self.bucket_name);
        }     
      }

      // // check loop time
      // Logger(new Date());
      
      setTimeout(
        function () { 
          loopback(interval_sleep_time_ms, loopback);
        },
        interval_sleep_time_ms
      );
    });
  };


  this.start = function (interval_sleep_time_ms) {
    self.scanBucket(interval_sleep_time_ms, self.scanBucket);

  };

  // // Stops this instance of the BucketWatcher
  // // from watching for changes
  // this.stop = function () {
  //   clearTimeout(self.timer);
  // };

};

// Inherit the Event Emitter
util.inherits(BucketWatcher, events.EventEmitter);

// Exports/Returns Object that watches a given directory for any
// changes to files or folders in that directory
// bucket_name = bucket_name path of directory to watch
// Emits six events:
//   fileAdded        : When a file is added to a monitored directory
//   fileChanged      : When a file is changed
//   fileRemoved      : When a file is removed
//   scannedDirectory : When a directory has been scanned
exports.BucketWatcher = function (s3_client, bucket_name) {
  return new BucketWatcher(s3_client, bucket_name);
};