"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var FCM = require('fcm-node');

var serverKey = process.env.FCM_SERVER_KEY;
var fcm = new FCM(serverKey);

var FCMAdapter = exports.FCMAdapter = function () {
  function FCMAdapter() {
    var pushConfig = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, FCMAdapter);

    
  }

  _createClass(FCMAdapter, [{
    key: 'getValidPushTypes',
    value: function getValidPushTypes() {
      return this.validPushTypes;
    }
  }, {
    key: 'send',
    value: function send(data, installations) {
      var _this = this;
      
      console.log("FCMAdapter.send");
      
      console.log("data:"+JSON.stringify(data));
      console.log("installations:"+JSON.stringify(installations));
        
      var finalTo = {};
      var message = {};
      if(hasProp(data, 'channels')) {
      // The assumption is we only allow 1 channel at a time
          var channel = data.channels[0];
          console.log("channel:"+channel);
          var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
            to: "/topics/" + channel, 
            data: data
          };
      } else if (hasProp(data, 'where')) {
          var fcmTokens = [];
          for (var i = 0; i < installations.length; i++) {
            try {
              var installation = installations[i];
              if(hasProp(installation, 'fcmToken')) {
                fcmTokens.push(installation.fcmToken);
              }
            } catch (err) {
              console.log(err);
              // Do nothing
            }
          }
          var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
            registration_ids: fcmTokens, 
            data: data
          };
      }

      console.log("[FCMAdapter] final Message:"+JSON.stringify(message));

      fcm.send(message, function(err, response){
        if (err) {
            console.log("Something has gone wrong!"+err);
        } else {
            console.log("Successfully sent with response: ", response);
        }
      });
    }
  }], [{
    key: 'classifyInstallations',
    value: function classifyInstallations(installations, validTypes) {
      return (0, _PushAdapterUtils.classifyInstallations)(installations, validTypes);
    }
  }]);

  return FCMAdapter;
}();

function hasProp (obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

exports.default = FCMAdapter;
module.exports = FCMAdapter;
