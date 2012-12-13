
var sfw, lat, lng, currentLead, lastData;
var lastCoords = {};
    
document.addEventListener('deviceready', onDeviceReady);

function onDeviceReady(event) {
	console.log("onDeviceReady fired");

    getLocation();
    
	// Initialize the Salesforce wrapper
	sfw = new SalesforceWrapper();
    
	// Add an event handler for the login button tap event
	$("#login-button").on("touchstart", function (e) {
		console.log("login-button.tap fired");
        
		e.preventDefault();
		// Invoke the Salesforce.com oAuth2 authentication
		sfw.login(setupHomeView);
	});
}

function setupHomeView() {
	console.log("setupHomeView fired");
	app.navigate("#home");
}

function newLeadShow() {
	getLocation();
}

function saveFormData(event) {
    console.log("saveFormData fired");
    
	// Create a data object for the Lead being saved
	var data = {};
	// Populate the data object values
	data.First__c = id("first").value;
	data.Last__c = id("last").value;
	data.Email__c = id("email").value;
	data.Telephone__c = id("telephone").value;
	data.Notes__c = id("notes").value;
    
	// If there is a current lead (i.e. the users is editing an existing lead)
	// then poulate it with the new data
	if (currentLead) {
        console.log("currentLead == yes");
        
		// Copy the new data submitted to the currentLead object in memory
		currentLead.First__c = data.First__c;
		currentLead.Last__c = data.Last__c;
		currentLead.Email__c = data.Email__c;
		currentLead.Telephone__c = data.Telephone__c;
		currentLead.Notes__c = data.Notes__c;
        
		// Use the original lat/long data
		data.Latitude__c = currentLead.Latitude__c;
		data.Longitude__c = currentLead.Longitude__c
	}
	else if (lastCoords) {
        console.log("lastCoords == yes");
        
		data.Latitude__c = lastCoords.latitude;
		data.Longitude__c = lastCoords.longitude;
	}
    
	try {
		if (currentLead == undefined) {
            console.log("currentLead == undefined");
            
			sfw.client.create("Lead__c", data, onSaveSuccess, onSaveError);
		}
		else {
            console.log("currentLead != undefined");
            
			sfw.client.update("Lead__c", currentLead.Id, data, onSaveSuccess, onSaveError);
		}
	}
	catch (e) {
		console.log(e);
	}
}

function onSaveSuccess(result) {
    console.log("onSaveSuccess fired");
    
    navigator.notification.alert("Data Saved", function(){
        app.navigate("#home");
    });
}

function onSaveError(request, status, error) {
    console.log("onSaveError fired");
    
    navigator.notification.alert(request.responseText, null, "An Error Occurred");
}

function editLeadShow() {
	// Load the Edit Lead form
}

function leadsShow() {
	console.log("leadsShow fired");
	/*
    var groupedData = [
		{ First_c: "Doe", Last_c: "John", Email_c: "johndoe@gmail.com", letter: "D" },
		{ First_c: "Seven", Last_c: "Doug", Email_c: "dougseven@gmail.com", letter: "S" },
		{ First_c: "Doe", Last_c: "Jane.", Email_c: "janedoe@gmail.com", letter: "D" },
		{ First_c: "Abdulla", Last_c: "Anthony.", Email_c: "anthonyabdulla@telerik.com", letter: "A" }
	];
 
    $("#leads-listview").kendoMobileListView({
		dataSource: kendo.data.DataSource.create({data: groupedData, group: "letter" }),
		template: $("#leadsListViewTemplate").html(),
		headerTemplate: "${value}"
	});
   */
    
    if(lastData) {
        renderListData();
    } else {
        queryRecords();
    }
}

function queryRecords() {
    console.log("queryRecords fired");
    
    var query = "SELECT Email__c, First__c, Id, Last__c, Latitude__c, Longitude__c, Notes__c, Telephone__c " +
    "FROM Lead__c " + 
    "ORDER BY Last__c, First__c";
    // Execute the Salesforce.com query as an async callback operation
    sfw.client.query(query, onQuerySuccess, onQueryError);
}

function onQuerySuccess(response) {
    console.log("onQuerySuccess fired");
    console.log("response: " + JSON.stringify(response) );
    console.log("response: " + response.records);
    console.log("records: " + JSON.stringify(response.records) );
    
    lastData = { "records": JSON.stringify(response) };
    renderListData();
}

function onQueryError(request, status, error) {
    console.log("onQueryError fired");
    
    navigator.notification.alert(request.responseText, null, "An Error Occurred");
}

function getLocation() {
	navigator.geolocation.getCurrentPosition(onGeolocationSuccess, onGeolocationError, { enableHighAccuracy: true });
}

function renderListData() {
    console.log("renderListData fired");
    
    if(lastData) {
        $("#leads-listview").kendoMobileListView({
	    	dataSource: kendo.data.DataSource.create({data: lastData, group: "Last__c" }),
            schema: {data: "records"},
		    template: $("#leadsListViewTemplate").html(),
		    headerTemplate: "${value}"
	    });
    }    
}

function onGeolocationSuccess(position) {
	lastCoords.latitude = position.coords.latitude;
	lastCoords.longitude = position.coords.longitude;
    
	var latlngString = "Location:<br/>" + lastCoords.latitude + ", " + lastCoords.longitude;
    
	id("latlng").innerHTML = latlngString
	id("edit-latlng").innerHTML = latlngString
}

function onGeolocationError(error) {
	id("latlng").innerText = error.message;
}

function id(elem) {
	return document.getElementById(elem);
}