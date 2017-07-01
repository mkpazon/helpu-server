
var ClassConstants = {
    OBJECT_ID: "objectId",
    CREATED_AT:"createdAt",
    Installation: {
    	FIELD_LAST_KNOWN_LOCATION: "lastKnownLocation",
        FIELD_LAST_KNOWN_LOCATION_DATE: "lastKnownLocationDate"
    },
    Config: {
        TYPE: "Config",
        FIELD_LATEST_VERSION_CODE: "latestVersionCode"
    },
    Message: {
        TYPE: "ParseMessage"
    },
    Conversation: {
        TYPE: "Conversation",
        FIELD_TOPIC: "topic",
        FIELD_USERS: "users",
        FIELD_LAST_MESSAGE: "lastMessage",
        FIELD_LAST_MESSAGE_DATE: "lastMessageDate",
        FIELD_ITEM: "item"
    },
    User: {
        FIELD_DISPLAY_NAME: "displayName",
        FIELD_PROFILE_PIC: "profilePic",
        FIELD_PROFILE_PIC_THUMBNAIL: "profilePicThumbnail",
        FIELD_LAST_KNOWN_LOCATION: "lastKnownLocation",
        FIELD_LAST_KNOWN_LOCATION_DATE: "lastKnownLocationDate"
    },
    Item: {
        TYPE: "Item",
        RELATION_QUEUE: "queue",
        FIELD_OWNER: "owner",
        FIELD_TITLE: "title",
        // Deprecated
        FIELD_LATITUDE: "latitude",
        // Deprecated
        FIELD_LONGITUDE: "longitude",
        FIELD_LOCATION_COORDS: "locationCoords",
        FIELD_STATUS: "status",
        FIELD_QUANTITY: "quantity",
        FIELD_NUM_OF_QUEUES: "numOfQueues",
        FIELD_PHOTOS: "photos",
        STATUS_TAKEN: "TAKEN"
    },
    Message: {
        TYPE: "ParseMessage",
        FIELD_MESSAGE_TEXT: "messageText",
        FIELD_CONVERSATION: "conversation",
        FIELD_SINCH_ID: "sinchId",
        FIELD_SENDER: "sender"
    },
    Notification: {
        TYPE: "Notification",
        FIELD_TYPE: "type",
        FIELD_USER: "user",
        FIELD_FROM: "from",
        FIELD_DATA: "data",
        FIELD_DATA_OBJECT_ID: "dataObjectId",
        FIELD_MESSAGE: "message",
        FIELD_STATUS: "status"
    },
    Report: {
        TYPE: "Report",
        FIELD_ITEM: "item",
        FIELD_TYPE: "type",
        FIELD_CREATED_BY: "createdBy",
        FIELD_OTHERS_MSG: "otherMessage"
    },
    Redemption: {
        TYPE: "Redemption",
        FIELD_ITEM: "item",
        FIELD_USER: "user",
        FIELD_STATUS: "status"
    }
}

var PushConstants = {
    Message: {
        TYPE: "message"
    },
    Queue: {
        TYPE: "queue"
    },
    Update: {
        TYPE: "update"
    },
    AppUpdate: {
        TYPE: "app_update"
    },
    Redemption: {
        TYPE: "redemption"   
    },
    NewItemNearby: {
        TYPE: "new_item_nearby"
    }
}

var ParseConfigConstants = {
    NEARBY_RADIUS_METERS: "nearby_radius_m",
    NEARBY_SPONSORED_RADIUS_METERS:"nearby_sponsored_radius_m"
}

var Notification = {
    TYPE_MESSAGE: 100,
    TYPE_QUEUE: 101,
    TYPE_REDEMPTION: 102,
    TYPE_NEWITEM_NEARBY: 103,
    STATUS_NEW: 200,
    STATUS_READ: 201
}

///////////////
//BEFORE SAVE
///////////////

Parse.Cloud.beforeSave(Parse.Installation, function(request, response) {
    console.log("#########Installation.beforeSave()");
    console.log("request"+JSON.stringify(request));
	var dirtyKeys = request.object.dirtyKeys();
	for (var i = 0; i < dirtyKeys.length; ++i) {
		var dirtyKey = dirtyKeys[i];
		console.log("dirtyKey:" + dirtyKey);
		if (dirtyKey === ClassConstants.Installation.FIELD_LAST_KNOWN_LOCATION) {
			console.log("Found dirty key " + ClassConstants.Installation.FIELD_LAST_KNOWN_LOCATION);
			request.object.set(ClassConstants.Installation.FIELD_LAST_KNOWN_LOCATION_DATE, new Date());
			break;
		}
	}

    /*
    console.log("request.object>>>"+JSON.stringify(request.object));

    var installation = request.object;
    var channels = installation.get("channels");



    var promises = new Parse.Promise();
    // Remove sender form array
    for(index = 0; index < channels.length; index++) {
        var channel = channels[index];
        console.log("checking "+channel);
        if(!((channel.indexOf("user_") > -1) || (channel.indexOf("item_") > -1)   )) {
            promises.then(function(result) {



            });

            // TODO check if channel is item or user

        }

        console.log("result:"+channels[index]);
    }



    request.object.set("channels", channels);*/

    response.success();
});

Parse.Cloud.afterSave(ClassConstants.Item.TYPE, function(request, response) {
    console.log("#########Item.afterSave()");
    
    if(!request.object.existed()) {

        // TODO notify all parseInstallations nearby
        // 1. Retrieve radius from parseconfig
        // 2. Find all parseinstallations within the radius
        // 3. Send push notification (each should have a different id)

        var item = request.object;
        notifyDevicesNearby(item);
    }

});

Parse.Cloud.beforeSave(ClassConstants.Notification.TYPE, function(request, response) {
    console.log("#########Notification.beforeSave()");
    response.success();
});

Parse.Cloud.afterSave(ClassConstants.Notification.TYPE, function(request, response) {
    console.log("#########Notification.afterSave()");


    // Workaround. This should have been done in "createNotification" method. We simply get the item objectId and
    // retrieve the item and save it to ClassConstants.Notification.FIELD_DATA field.
    if(!request.object.existed()) {
        var notification = request.object;
        var ItemType = Parse.Object.extend(ClassConstants.Item.TYPE);
        var item = new ItemType();
        item.id = notification.get(ClassConstants.Notification.FIELD_DATA_OBJECT_ID);
        notification.set(ClassConstants.Notification.FIELD_DATA, item);
        notification.save().then(function(result){
            console.log("created data");
        },function request(error){
            console.log("");
        });
    }
});

Parse.Cloud.beforeSave(ClassConstants.Redemption.TYPE, function(request, response) {
    console.log("#########Redemption.beforeSave()"); 
    console.log("request"+JSON.stringify(request));
    
    if(request.object.isNew()) {
        var redemption = request.object;
        var item = redemption.get(ClassConstants.Redemption.FIELD_ITEM);
        var owner = {};
        var qinguser = redemption.get(ClassConstants.Redemption.FIELD_USER);
        var qinguserId = qinguser.id;
        
        
        var Item = Parse.Object.extend(ClassConstants.Item.TYPE);
        var itemQuery = new Parse.Query(Item);
        var completeItem = {};

        var Redemption = Parse.Object.extend(ClassConstants.Redemption.TYPE);
        var redemptionQuery = new Parse.Query(Redemption);
        redemptionQuery.equalTo(ClassConstants.Redemption.FIELD_ITEM, item);
        redemptionQuery.count().then(function(num){
            if(num > 0) {
                // Do not allow more than one redemption per item
                response.error("Item already taken.");
            } else {
                return itemQuery.get(item.id).then(function(item){
                    completeItem = item;
                    owner = completeItem.get(ClassConstants.Item.FIELD_OWNER);
                    item.set(ClassConstants.Item.FIELD_STATUS, ClassConstants.Item.STATUS_TAKEN);
                    return item.save();
                }).then(function(result) {
                    return createNotification(Notification.TYPE_REDEMPTION, qinguser, owner, completeItem, null);
                }).then(function(result) {
                    var item = completeItem;
                    msg = "You were selected to get the " + item.get(ClassConstants.Item.FIELD_TITLE);
                    var object = {};
                    object.type = PushConstants.Redemption.TYPE;
                    object.message = msg;
                    object.id = item.id;
                    
                    // Send push to owner
                    return Parse.Push.send({
                        channels: [("user_" + qinguserId)],
                        data: object
                    }, {useMasterKey: true }).then(function(result){
                        console.log("Push sent");
                        response.success();
                    }, function(error) {
                        console.log("Got an error " + error.code + " : " + error.message);

                        // Continue saving even if an error occurred
                        response.success();
                    });
                });
            }
        });        
    } else {
        response.success();
    }
});

Parse.Cloud.beforeSave(ClassConstants.Item.TYPE, function(request, response) {
    console.log("#########Item.beforeSave()");

    if(request.object.isNew()) {
        // Default values
        if(!request.object.has(ClassConstants.Item.FIELD_QUANTITY)) {
            request.object.set(ClassConstants.Item.FIELD_QUANTITY, 1);
        }

        response.success();
    } else {
        console.log("request"+JSON.stringify(request));
        console.log("request.object>>>"+JSON.stringify(request.object));
        var relQueueJsonStr = JSON.stringify(request.object.op(ClassConstants.Item.RELATION_QUEUE));
        console.log("-._.-._.-._.-1:" + relQueueJsonStr);
        if( relQueueJsonStr !== undefined ) {
            var relQueue = JSON.parse(relQueueJsonStr);
            console.log("-._.-._.-._.-2");
            var operation = relQueue.__op;
            console.log("-._.-._.-._.-3");
            
            var item = request.object;
            var relationQueue = item.relation(ClassConstants.Item.RELATION_QUEUE);
            var queryQueues = relationQueue.query();
            queryQueues.count().then(function(count) {
                if (operation == "AddRelation"){
                    item.set(ClassConstants.Item.FIELD_NUM_OF_QUEUES, count + 1);
                    handleQueueRelation(request, response, relQueue);
                } else {
                    item.set(ClassConstants.Item.FIELD_NUM_OF_QUEUES, count - 1);
                    console.log("*un-Q*");
                    response.success();
                }   
            });
        } else {
            handleObjectUpdate(request, response);
        }
    } 
});

function notifyDevicesNearby(item) {
    Parse.Config.get().then(function(config) {
        var nearByRadiusKm = config.get(ParseConfigConstants.NEARBY_RADIUS_METERS) / 1000;
        var message = "nearByRadiusKm: " + nearByRadiusKm;
        console.log(message);

        var installationQuery = new Parse.Query(Parse.Installation);
        var coordinates = item.get(ClassConstants.Item.FIELD_LOCATION_COORDS);

        var dateTime = new Date()
        dateTime.setMinutes(dateTime.getMinutes() - 15);

        installationQuery.withinKilometers(ClassConstants.Installation.FIELD_LAST_KNOWN_LOCATION, coordinates, nearByRadiusKm);
        installationQuery.greaterThanOrEqualTo(ClassConstants.Installation.FIELD_LAST_KNOWN_LOCATION_DATE, dateTime);
        // Is this limit reasonable
        installationQuery.limit(2000);
        // TODO do we include sponsored posts?

        var object = {
            type: PushConstants.NewItemNearby.TYPE,
            message: "FREE: " + item.get(ClassConstants.Item.FIELD_TITLE),
            itemId: item.id,
            ownerId: item.get(ClassConstants.Item.FIELD_OWNER).id,
        };

        try {
            object.imageUrl = item.get(ClassConstants.Item.FIELD_PHOTOS)[0].url();
        } catch(err) {
            object.imageUrl = "";
        }
            
        Parse.Push.send({
            where: installationQuery,
            data: object
        }, {useMasterKey: true }).then(function(success) {
            console.log("Push sent.");
        }, function(error) {
            console.log("Got an error " + error.code + " : " + error.message);
        });
    }, function(error) {
      // Something went wrong (e.g. request timed out)
        console.log("Got an error " + error.code + " : " + error.message);
    });
}

function handleObjectUpdate(request, response) {
    console.log("Object update.");
    var item = request.object;
    var origItem = request.original;
    
    // Only send push notification on item changes not related to item status
    if(item.get(ClassConstants.Item.FIELD_STATUS) == origItem.get(ClassConstants.Item.FIELD_STATUS)) {
        msg = item.get(ClassConstants.Item.FIELD_TITLE) + " has been updated.";

        var object = {};
        object.type = PushConstants.Update.TYPE;
        object.message = msg;
        object.id = item.id;

        Parse.Push.send({
            channels: ["item_" + item.id],
            data: object
        }, {useMasterKey: true }).then(function(success) {
            console.log("Push sent.");
            response.success();
        }, function(error) {
            console.log("Got an error " + error.code + " : " + error.message);
            response.success();
        });
    } else {
        response.success();   
    }
}

function handleQueueRelation(request, response, relQueue){
    console.log("*Q*"+JSON.stringify(relQueue));
    var qingUser = relQueue.objects[0];
    console.log("queueing userId:" + qingUser.objectId);
    var query = new Parse.Query(Parse.User);
    query.get(qingUser.objectId).then(function(result) {
        console.log("name:"+result.get(ClassConstants.User.FIELD_DISPLAY_NAME));

        qingUser = result;
        // Retrieve item's owner
        var item = request.object;
        var owner = item.get(ClassConstants.Item.FIELD_OWNER);
        var ownerId = owner.id;
        console.log("ownerId:" + ownerId);
        msg = result.get(ClassConstants.User.FIELD_DISPLAY_NAME) + " started queueing to your " + item.get(ClassConstants.Item.FIELD_TITLE);

        // Create push payload
        var object = {};
        object.type = PushConstants.Queue.TYPE;
        object.message = msg;
        object.id = item.id;

        var sender = {};
        sender.id = qingUser.id;
        sender.displayName = qingUser.get(ClassConstants.User.FIELD_DISPLAY_NAME);
        try {
            sender.profileUrl = qingUser.get(ClassConstants.User.FIELD_PROFILE_PIC).url();
        } catch(err) {
            sender.profileUrl = "";
        }

        object.sender = sender;

        return createNotification(Notification.TYPE_QUEUE, owner, qingUser, item, null).then(
            function(result) {
            // Send push to owner
                return Parse.Push.send({
                    channels: [("user_" + ownerId)],
                    data: object
                }, {useMasterKey: true }).then(function(result){
                    console.log("Push sent");
                });
            });
    }).then(function(result){
        console.log("SUCCESS");
        response.success();
    }, function(error) {
        console.log("Got an error " + error.code + " : " + error.message);

        // Continue saving.
        response.success();
    });
}

// After a message is saved send push notifications to all recipients
Parse.Cloud.afterSave(ClassConstants.Message.TYPE, function(request, response) {
	console.log("\n######Message.afterSave()");

    var msg = request.object.get("messageText");
    var conversation = request.object.get("conversation");
    var conversationId = conversation.id;
    var parseSender = request.object.get("sender");

    var query = new Parse.Query(Parse.User);
    query.get(parseSender.id).then(function(result) {
        parseSender = result;
        var Conversation = Parse.Object.extend(ClassConstants.Conversation.TYPE);
        var conversationQuery = new Parse.Query(Conversation);
        return conversationQuery.get(conversationId);
    }).then(function(conversation2) {
        console.log("\nConversation:"+JSON.stringify(conversation));
        var object = {};
        object.type = PushConstants.Message.TYPE;
        object.message = msg;
        object.id = conversation2.get(ClassConstants.Conversation.FIELD_TOPIC);
        object.conversationId = conversationId;

        var sender = {};
        sender.id = parseSender.id;
        sender.displayName = parseSender.get(ClassConstants.User.FIELD_DISPLAY_NAME);
        try {
            sender.profileUrl = parseSender.get(ClassConstants.User.FIELD_PROFILE_PIC).url();
        } catch(err) {
            sender.profileUrl = "";
        }
        
        object.sender = sender;
        var users = conversation2.get(ClassConstants.Conversation.FIELD_USERS);
        
        console.log("users.length:" + users.length);

        var userToNotify;
        for(index = 0; index < users.length; index++) {
            if(users[index].id != sender.id) {
                console.log("notify "+users[index].id );
        		userToNotify = users[index];
                break;
            }
        }

        conversation2.set(ClassConstants.Conversation.FIELD_LAST_MESSAGE, msg);
        conversation2.set(ClassConstants.Conversation.FIELD_LAST_MESSAGE_DATE, new Date());
        conversation2.save(null, {
           success: function(result) {
             // Saved successfully.
               console.log("successfully saved last message");
           },
           error: function(result, error) {
               console.log("Got an error " + error.code + " : " + error.message);
           }
        });

        var item = conversation2.get(ClassConstants.Conversation.FIELD_ITEM);

        // Send notification with payload
        createNotification(Notification.TYPE_MESSAGE, userToNotify, parseSender, item, null).then(
            function(result) {
                Parse.Push.send({
                    channels: [("user_" + userToNotify.id)],
                    data: object
                }, { useMasterKey: true });
            }).then(function(){
                console.log("push sent successfully");
            }, function(error) {
                console.log("push sending failed :" + error.code + " : " + error.message);
            });
    }, function(error) {
        response.error(error.message);
    });
});





Parse.Cloud.beforeSave(ClassConstants.Conversation.TYPE, function(request, response) {
	console.log("\n#######Message.afterSave()");
    var topic = request.object.get(ClassConstants.Conversation.FIELD_TOPIC);
    var Item = Parse.Object.extend(ClassConstants.Item.TYPE);
    var item = new Item();
    item.id = topic;
    request.object.set(ClassConstants.Conversation.FIELD_ITEM, item);
    response.success();
});


Parse.Cloud.beforeSave(Parse.User, function(request, response) {
    console.log("\n#######Parse.User.beforeSave()");
	var dirtyKeys = request.object.dirtyKeys();
	for (var i = 0; i < dirtyKeys.length; ++i) {
		var dirtyKey = dirtyKeys[i];
		console.log("dirtyKey:" + dirtyKey);
		if (dirtyKey === ClassConstants.User.FIELD_LAST_KNOWN_LOCATION) {
			console.log("Found dirty key " + ClassConstants.User.FIELD_LAST_KNOWN_LOCATION);
			request.object.set(ClassConstants.User.FIELD_LAST_KNOWN_LOCATION_DATE, new Date());
			break;
		}
	}
    response.success();
});



/*
  The following method is in charge of creating a Notification object (different from push notification).
  It only handles the following use cases:
  - message
  - queue

  This does not handle "item update" because it will be resource consuming if a notification object will need to be created for each
  user queueing.
*/
function createNotification(type, user, from, data, message) {
    console.log(".createNotification ");

    var NotificationType = Parse.Object.extend(ClassConstants.Notification.TYPE);
    var notification = new NotificationType();
    notification.set(ClassConstants.Notification.FIELD_TYPE, type);
    notification.set(ClassConstants.Notification.FIELD_USER, user);
    notification.set(ClassConstants.Notification.FIELD_FROM, from);
    notification.set(ClassConstants.Notification.FIELD_STATUS, Notification.STATUS_NEW);

    // XXX this creates an infinite loop for some reason. Sent a bug report to Parse (https://github.com/ParsePlatform/Parse-SDK-JS/issues/58)
    // notification.set(ClassConstants.Notification.FIELD_DATA, data);
    notification.set(ClassConstants.Notification.FIELD_DATA_OBJECT_ID, data.id);
    notification.set(ClassConstants.Notification.FIELD_MESSAGE, message);

    return notification.save();
}


////////////////////
// CLOUD FUNCTIONS
////////////////////
/*
`PROD`

    curl -X POST -H "X-Parse-Application-Id: soc7jmyDban7PE8SRl1OmJwZyBRTTam5EAiJUE6m" -H "X-Parse-REST-API-Key: O3xDMqwZm0DV2DsR6cNsRwOaKpDfpPsq4MKvnTVv" -H "Content-Type: application/json" -d '{"latestVersionCode":10}' https://api.parse.com/1/functions/appUpdateNotify`

`DEBUG`

    curl -X POST -H "X-Parse-Application-Id: yN8887wLWZMCmsd9FtBQnAwubXgOCWL6GQg73jp1" -H "X-Parse-REST-API-Key: 3KdCM6wZGGkwz9uTQM37ffYGgp7hOFZnrrKneuaZ" -H "Content-Type: application/json" -d '{"latestVersionCode":10}' https://api.parse.com/1/functions/appUpdateNotify
*/
Parse.Cloud.define("getLastKnownLocations", function(request, response) {
    console.log(".getLastKnownLocations");
    Parse.Cloud.useMasterKey();
    var query = new Parse.Query(Parse.Installation);
   	query.exists(ClassConstants.Installation.FIELD_LAST_KNOWN_LOCATION);
    var dateTime = new Date()
    dateTime.setMinutes(dateTime.getMinutes() - 15);
    query.greaterThanOrEqualTo(ClassConstants.Installation.FIELD_LAST_KNOWN_LOCATION_DATE, dateTime);
    query.limit(2000);
   	query.find(function(results) {
     	response.success(results);
    }, function(error) {
        console.log("Got an error " + error.code + " : " + error.message);
        response.error("Failed to send push app_update");
    });
});



Parse.Cloud.define("appUpdateNotify", function(request, response) {
    console.log(".appUpdateNotify");
    console.log("latestVersionCode:"+request.params.latestVersionCode);
    var object = {
        type: PushConstants.AppUpdate.TYPE,
        latest_version_code: request.params.latestVersionCode
    };
    Parse.Push.send({
        where: new Parse.Query(Parse.Installation),
        data: object
    }).then(function(success) {
        console.log("Push sent.");
        response.success("Success");
    }, function(error) {
        console.log("Got an error " + error.code + " : " + error.message);
        response.error("Failed to send push app_update");
    });
});

Parse.Cloud.define("reportItem", function(request, response) {
    console.log(".reportItem");

    // Query if a user already has reported the item
    // If a report has already been created, update it
    // otherwise create a new one

    var Item = Parse.Object.extend(ClassConstants.Item.TYPE);
    var item = new Item();
    item.id = request.params.itemId;

    var user = new Parse.User();
    user.id = request.params.userId;

    var query = new Parse.Query(ClassConstants.Report.TYPE);
    query.equalTo(ClassConstants.Report.FIELD_CREATED_BY, user);
    query.equalTo(ClassConstants.Report.FIELD_ITEM, item);
    query.find(function(results) {
        if(results.length > 0) {
            var report = results[0];
            report.set(ClassConstants.Report.FIELD_TYPE, request.params.type);
            report.set(ClassConstants.Report.FIELD_OTHERS_MSG, request.params.otherMsg);
            return report.save();
        } else {
            var Report = Parse.Object.extend(ClassConstants.Report.TYPE);
            var report = new Report();
            report.set(ClassConstants.Report.FIELD_ITEM, item);
            report.set(ClassConstants.Report.FIELD_CREATED_BY, user);
            report.set(ClassConstants.Report.FIELD_TYPE, request.params.type);
            report.set(ClassConstants.Report.FIELD_OTHERS_MSG, request.params.otherMsg);
            return report.save();
        }
    }).then(function(result) {
        console.log("Report item saved.");
        response.success("Success");
    }, function(error) {
        console.log("Got an error " + error.code + " : " + error.message);
        response.error("Failed to send push app_update");
    });
});

/*Parse.Cloud.define("sendRedemption", function(request, response) {
    console.log(".sendRedemption");

    var Item = Parse.Object.extend(ClassConstants.Item.TYPE);
    var item = new Item();
    item.id = request.params.itemId;

    var user = new Parse.User();
    user.id = request.params.userId;

    var query = new Parse.Query(ClassConstants.Report.TYPE);
    query.equalTo(ClassConstants.Report.FIELD_CREATED_BY, user);
    query.equalTo(ClassConstants.Report.FIELD_ITEM, item);
    query.find(function(results) {
        if(results.length > 0) {
            var report = results[0];
            report.set(ClassConstants.Report.FIELD_TYPE, request.params.type);
            report.set(ClassConstants.Report.FIELD_OTHERS_MSG, request.params.otherMsg);
            return report.save();
        } else {
            var Report = Parse.Object.extend(ClassConstants.Report.TYPE);
            var report = new Report();
            report.set(ClassConstants.Report.FIELD_ITEM, item);
            report.set(ClassConstants.Report.FIELD_CREATED_BY, user);
            report.set(ClassConstants.Report.FIELD_TYPE, request.params.type);
            report.set(ClassConstants.Report.FIELD_OTHERS_MSG, request.params.otherMsg);
            return report.save();
        }
    }).then(function(result) {
        console.log("Report item saved.");
        response.success("Success");
    }, function(error) {
        console.log("Got an error " + error.code + " : " + error.message);
        response.error("Failed to send push app_update");
    });
});*/


////////////////////
// BACKGROUND JOBS
////////////////////

Parse.Cloud.job("geopoint_migration", function(request, status) {
  Parse.Cloud.useMasterKey();
  var counter = 0;

  var query = new Parse.Query(ClassConstants.Item.TYPE);
  query.each(function(item) {

      var latitude = item.get(ClassConstants.Item.FIELD_LATITUDE);
      var longitude = item.get(ClassConstants.Item.FIELD_LONGITUDE);

      var point = new Parse.GeoPoint({latitude: latitude, longitude: longitude});

      item.set(ClassConstants.Item.FIELD_LOCATION_COORDS, point);
      if (counter % 100 === 0) {
        // Set the  job's progress status
        status.message(counter + " items processed.");
      }
      counter += 1;
      return item.save();
  }).then(function() {
    // Set the job's success status
    status.success("Migration completed successfully.");
  }, function(error) {
    // Set the job's error status
    status.error("Uh oh, something went wrong.");
  });
});
