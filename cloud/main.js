
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
    Schedule: {
        TYPE: "Schedule",
        FIELD_STATUS: "status"
    }
}

Parse.Cloud.afterSave("TempNotif", function(request, response) {
    console.log("\n######TempNotif.afterSave()");
    var installationQuery = new Parse.Query(Parse.Installation);
    installationQuery.equalTo("objectId", "Oc3pXVrtFn");
    var object = {
        type: "scheduleConfirmed",
        message: "Your booking has been confirmed"
    };

    installationQuery.find(function(results) {
        console.log("installation query results:"+JSON.stringify(results));
    }, function(error) {
        console.log("Got an error " + error.code + " : " + error.message);
    });

        // Parse.Push.send({
        //     where: installationQuery,
        //     data: object
        // }, {useMasterKey: true }).then(function(success) {
        //     console.log("Push sent.");
        //     response.success();
        // }, function(error) {
        //     console.log("Got an error " + error.code + " : " + error.message);
        //     response.success();
        // });

});


Parse.Cloud.define("sendNotification", function(request, response) {
    console.log("sendNotification");

    // Simple syntax to create a new subclass of Parse.Object.
    var TempNotif = Parse.Object.extend("TempNotif");

    // Create a new instance of that class.
    var tempNotif = new TempNotif();

    tempNotif.save(null, {
      success: function(tempNotif) {
        // Execute any logic that should take place after the object is saved.
        alert('New object created with objectId: ' + tempNotif.id);
      },
      error: function(tempNotif, error) {
        // Execute any logic that should take place if the save fails.
        // error is a Parse.Error with an error code and message.
        alert('Failed to create new object, with error code: ' + error.message);
      }
    });
    response.success("Success");
});
