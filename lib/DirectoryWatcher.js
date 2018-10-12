// Imports / Requires
const {Logger} = require("./Logger.js");
var fs = require("fs");
var path = require("path");
var util = require("util");
var events = require("events");


// Create an object that watches a given directory for any
// changes to files or folders in that directory
// root = root path of directory to watch
// Emits six events:
//   fileAdded        : When a file is added to a monitored directory
//   fileChanged      : When a file is changed
//   fileRemoved      : When a file is removed
//   scannedDirectory : When a directory has been scanned
var DirectoryWatcher = function (root) {  
  this.root = root;  // Root or base directory
  this.previousFileList = new Map();
  this.currentFileList = new Map();
  this.timer = null;  // timer handling scan passes
  this.suppressInitialEvents = true;  // should we supress initial events?
  
  // set a self var
  var self = this;

  // Call the EvnetEmitter
  events.EventEmitter.call(this);

  
  /*===========================================================================
    Exposed Methods (Public)
    =========================================================================*/

  // The primary scanning method. Tries to be non blocking
  // as possible. Scanns a given directory. then attempts
  // to record each file in the directory.
  // dir = the directory to scan.
  // suppressEvents = Suppress any events that would be
  //                  raised this scan iteration.
  //                  true = Events will be suppressed
  //                  false = Events will be raised.
  this.scanDirectory = function (dir, suppressEvents) {    
    fs.readdir(dir, function (err, files) {
      // throw any errors that came up
      if (err) throw err;
      // get the number of files / folders in the directory

      // Logger(files);

      var i = files.length;
      if (i === 0) {
        // if there are no files (0) then emit scanned directory
        if (!suppressEvents) {
          self.emit("scannedDirectory", dir);
        }      
      } 

      else {

        var previousFile, currentFile;
        self.previousFileList = new Map(self.currentFileList);
        self.currentFileList = new Map();

        files.forEach(function(filename) {

          stats = fs.statSync( path.join(dir, filename ) );

          currentFile = {
                          LastModified  : stats.mtime, 
                          Size          : stats.size, 
                        };


          self.currentFileList.set(filename, currentFile);

          // check 
          if (self.previousFileList.has(filename)) {
            previousFile = self.previousFileList.get(filename);

            if ( previousFile.LastModified.toISOString() !== currentFile.LastModified.toISOString() || 
                 previousFile.Size                       !== currentFile.Size) {

              // object was changed
              self.emit("fileChanged", filename);
            }
          }
          else {
            // object was added
            self.emit("fileAdded", filename);
          }
        });


        self.previousFileList.forEach(function(value, key) {
           // Logger(key);

           // check 
          if ( !self.currentFileList.has(key) ) {

            // object was deleted
            self.emit("fileRemoved", key);
          }
        });
      }
    });  
  };


  // Starts this instance of the DirectoryWatcher monitoring
  // the given root path (set when the object was created)
  // and defines the interval to check for changes.
  // interval = Time (in milliseconds) between checks for
  //            update for the given monitored directory
  this.start = function (interval) {    
    if (interval) {
      // if interval exists and is greater than zero (if it doesn't exists it will evaluate false)
      // and if it's zero (0) it will evaluate false.
      self.timer = setInterval(function () { self.scanDirectory(self.root, false) }, interval); 
    } else {
      // if the interval is empty or 0 then kill monitoring
      self.stop();
    }
    // Initial scan of the directory... suppresses events for the first
    // scan through. The next scan will be after interval
    self.scanDirectory(self.root, self.suppressInitialEvents);
  };

  // Stops this instance of the DirectoryWatcher
  // from watching for changes
  this.stop = function () {
    clearTimeout(self.timer);
  };

};

// Inherit the Event Emitter
util.inherits(DirectoryWatcher, events.EventEmitter);

// Exports/Returns Object that watches a given directory for any
// changes to files or folders in that directory
// root = root path of directory to watch
// Emits six events:
//   fileAdded        : When a file is added to a monitored directory
//   fileChanged      : When a file is changed
//   fileRemoved      : When a file is removed
//   scannedDirectory : When a directory has been scanned
exports.DirectoryWatcher = function (root) {
  return new DirectoryWatcher(root);
};