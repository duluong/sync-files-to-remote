// Imports / Requires
const {Logger} = require("./Logger.js");
var fs      = require('fs');

var QueueListener = function (sqs_client, sqs_params, SAVE_DIR, INTERVAL_SLEEP_TIME_MS) {  
  this.sqs_client             = sqs_client;  
  this.sqs_params             = sqs_params;  
  this.SAVE_DIR               = SAVE_DIR;  
  this.INTERVAL_SLEEP_TIME_MS = INTERVAL_SLEEP_TIME_MS;  
  this.working_internal       = INTERVAL_SLEEP_TIME_MS;  
  
  // set a self var
  var self = this;

  this.listenQueue = function (loopback) {
    // // check loop time
    // Logger(new Date());

    self.sqs_client.receiveMessage(self.sqs_params, function(err, data) {
      if (err) {
        Logger("Receive Error : " + err);
      } 
      else if (data.Messages) {

        // Logger(JSON.stringify(data, null, 2));
        var status, filename;
        data.Messages.forEach(function(message) {
          status    = message.MessageAttributes.Status.StringValue;
          filename  = message.MessageAttributes.FileName.StringValue;

          if (status === 'REMOVE') {
            if ( fs.existsSync(self.SAVE_DIR + filename) ) {
              fs.unlinkSync(self.SAVE_DIR + filename);
              
              // Log to the console when a file is removed
              Logger("File Removed: " + filename);
            }
          }
          else if (status === 'NEW') {
            fs.writeFileSync(self.SAVE_DIR + filename, message.Body);

            // log to the console when a file is added.
            Logger("File Added: " + filename);
          }
          else if (status === 'UPDATE') {
            fs.writeFileSync(self.SAVE_DIR + filename, message.Body);

            // log to the console when a file is added.
            Logger("File Changed: " + filename);
          }

          var deleteParams = {
            QueueUrl: self.sqs_params.QueueUrl,
            ReceiptHandle: message.ReceiptHandle
          };

          self.sqs_client.deleteMessage(deleteParams, function(err, ret) {
            if (err) {
              Logger("Error on Deleting message after has received. Error msg : " + err);
            } else {
              // Logger("Message Deleted : " + ret);
            }
          });

        });
      }

      // adjust waiting time, if queue is empty wait the interval time, other request immedieatly.
      self.working_internal = data.Messages? 1: self.INTERVAL_SLEEP_TIME_MS;

      // // check loop time
      // Logger(new Date());
      
      setTimeout(
        function () { 
          loopback(loopback);
        },
        self.working_internal
      );
    });
  };


  this.start = function () {    
    self.listenQueue(self.listenQueue);
  };

};


exports.QueueListener = function (sqs_client, sqs_params, SAVE_DIR, INTERVAL_SLEEP_TIME_MS) {
  return new QueueListener(sqs_client, sqs_params, SAVE_DIR, INTERVAL_SLEEP_TIME_MS);
};