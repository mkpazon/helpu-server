
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

Parse.Cloud.define("sendNotification", function(request, response) {
    console.log("sendNotification");
    Parse.Cloud.useMasterKey();
     var installationQuery = new Parse.Query(Parse.Installation);
        installationQuery.equalTo("objectId", "Oc3pXVrtFn");
        var object = {
            type: "scheduleConfirmed",
            message: "Your booking has been confirmed"
        };

        Parse.Push.send({
            where: installationQuery,
            data: object
        }, {useMasterKey: true }).then(function(success) {
            console.log("Push sent.");
        }, function(error) {
            console.log("Got an error " + error.code + " : " + error.message);
        });
});
