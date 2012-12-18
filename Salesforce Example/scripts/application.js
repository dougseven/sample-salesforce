
var sfw, lat, lng, lastData, currentLead;
var lastCoords = {};

viewModel = new kendo.observable({ currentLead: {} });
    
document.addEventListener('deviceready', onDeviceReady);

function onDeviceReady(event) {
	console.log("onDeviceReady fired");
    
	// Initialize the Salesforce wrapper
	sfw = new SalesforceWrapper();
}

function login() {
	console.log("login-button.tap fired");

	// Invoke the Salesforce.com oAuth2 authentication
	sfw.login(setupHomeView);
}

function setupHomeView() {
	console.log("setupHomeView fired");
	app.navigate("#home");
}

function leadShow() {
    console.log("leadShow fired");
	setupFormView();
}
  
function setupFormView(data) {
	console.log("setupFormView fired");

    currentLead = data;
    
	console.log("currentLead: " + JSON.stringify(currentLead));
   
	if (!(data && data.Id)) {
		app.view.title = "New Lead"
		// Request the current location for a new entry
		navigator.geolocation.getCurrentPosition(onGeolocationSuccess, onGeolocationError, { enableHighAccuracy: true });
	}
	else {
		app.view.title = "Edit Lead";
		viewModel.set("currentLead", currentLead);
	}
}

function saveFormData() {
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
	} else if (lastCoords) {
		console.log("lastCoords == yes");
        
		data.Latitude__c = lastCoords.latitude;
		data.Longitude__c = lastCoords.longitude;
	}
    
	try {
		if (currentLead == undefined) {
			console.log("currentLead == undefined");
            // If this is a new record, create it
			sfw.client.create("Lead__c", data, onSaveSuccess, onSaveError);
		} else {
			console.log("currentLead: " + currentLead.Last__c);
            // If this is an existing record, update it    
			sfw.client.update("Lead__c", currentLead.Id, data, onSaveSuccess, onSaveError);
		}
	}
	catch (e) {
		console.log(e);
	}
}

function onSaveSuccess(result) {
	console.log("onSaveSuccess fired");
    
	navigator.notification.alert("Data Saved", function() {
        // Clear the form
        $("#lead-form")[0].reset();
        // Get the updated data
        queryRecords();
        // Go home
		app.navigate("#home");
	});
}

function onSaveError(request, status, error) {
	console.log("onSaveError fired");
    
	navigator.notification.alert(request.responseText, null, "An Error Occurred");
}

function lookupShow() {
	console.log("lookupShow fired");
    
	if (lastData) {
        // If there is data, render the ListView
		renderListData();
	} else {
        // If there is not data, go get it
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
	lastData = { "records": response.records };
	renderListData();
}

function onQueryError(request, status, error) {
	console.log("onQueryError fired");
    
	navigator.notification.alert(request.responseText, null, "An Error Occurred");
}

function renderListData() {
	console.log("renderListData fired");
    
	if (lastData) {
        console.log("lastData records: " + lastData.records.length);
        
		$("#leads-listview").kendoMobileListView({
			dataSource: kendo.data.DataSource.create({data: lastData.records, group: "Last__c" }),
			template: $("#leadsListViewTemplate").html(),
			headerTemplate: "${value}",
			click: function(e) {
				console.log("Lead selected: " + e.dataItem.Last__c);
                
                var data = getRecordById(e.dataItem.Id);
				setupFormView(data);
                
				app.navigate("#lead");
			}
		});
	} else {
        console.log("lastData is null or undefined");
    }
}

function getRecordById(id) {
    console.log("getRecordById fired; id = " + id);
    
	if (!lastData)
		return;
    
	var records = lastData.records;
    
	for (var i = 0; i < records.length; i++) {
		if (records[i].Id == id) {
            console.log("Found record for " + records[i].Last__c);
            
			return records[i];
		}
	}
    
    console.log("No record found.");
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