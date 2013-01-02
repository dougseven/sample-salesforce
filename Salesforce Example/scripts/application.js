var APP = (function($) {
	sfw = {},
	lookupListView = {},
	lastCoords = {},
	lastData = {},
	currentLead = {},
	isEdit = {},
	counter = {},
	viewModel = new kendo.observable({ currentLead: {} });
    
	return {
		// Application Constructor
		initialize: function() {
			console.log("initialize");
			this.bindEvents();
		},
		// Bind Event Listeners
		//
		// Bind any events that are required on startup. Common events are:
		// 'load', 'deviceready', 'offline', and 'online'.
		bindEvents: function() {
			console.log("bindEvents");
			document.addEventListener('deviceready', this.onDeviceReady, false);
		},
		// deviceready Event Handler
		//
		// The scope of 'this' is the event.
		onDeviceReady: function() {
			APP._logEvent("onDeviceReady");
    
			counter = 0;
            
			APP._logEvent("onDeviceReady", counter.toString());
			// Initialize the Salesforce wrapper
			sfw = new SalesforceWrapper();
		},
       
		// ======================================= //
		// ========== Login & Home View ========== //
		// ======================================= //
		login: function() {
			APP._logEvent("login");

			// Invoke the Salesforce.com oAuth2 authentication
			sfw.login(APP.setupHomeView);
		},
        
		setupHomeView: function() {
			APP._logEvent("setupHomeView");
    
			isEdit = false;
			APP.app.navigate("#home");
		},
		
		// ======================================= //
		// ============== Lead View ============== //
		// ======================================= //
		onLeadBeforeShow: function() {
			counter++;
			
			APP._logEvent("onLeadBeforeShow", counter);
            
			if (isEdit) {
                APP._logEvent("onLeadBeforeShow", "isEdit is true");
                
				APP.setupFormView(currentLead);
			}
			else {
                APP._logEvent("onLeadBeforeShow", "isEdit is false");
                
				// If the Lead form is opened by clicking on the menu, 
				// setup the form with no data
				APP.setupFormView(null);
			}
		},
        
		setupFormView: function(data) {
			APP._logEvent("setupFormView");
			APP._logEvent("setupFormView", "data: " + JSON.stringify(data));
            
			currentLead = data;
            
			if (!(data && data.Id)) {
				APP._logEvent("setupFormView", "New Lead");
                
				// Request the current location for a new entry
				navigator.geolocation.getCurrentPosition(
					APP.onGeolocationSuccess, 
					APP.onGeolocationError, 
					{ enableHighAccuracy: true }
					);
			}
			else {
				APP._logEvent("setupFormView", "Edit Lead");

				viewModel.set("currentLead", currentLead);
			}
		},
        
		onGeolocationSuccess: function(position) {
			APP._logEvent("setupFormView", "onGeolocationSuccess");
      
			lastCoords.latitude = position.coords.latitude;
			lastCoords.longitude = position.coords.longitude;
      
			var latlngString = "Location:<br/>" + 
							   lastCoords.latitude + 
							   ", " + 
							   lastCoords.longitude;
                          
			APP._logEvent("setupFormView", latlngString);
      
			APP.id("latlng").innerHTML = latlngString;
		},
        
		onGeolocationError: function(error) {
			APP._logEvent("setupFormView", latlngString);
    
			APP.id("latlng").innerText = error.message;
		},
        
		saveFormData: function() {
			APP._logEvent("saveFormData");
    
			// Create a data object for the Lead being saved
			var data = {};
			// Populate the data object values
			data.First__c = APP.id("first").value;
			data.Last__c = APP.id("last").value;
			data.Email__c = APP.id("email").value;
			data.Telephone__c = APP.id("telephone").value;
			data.Notes__c = APP.id("notes").value;
    
            APP._logEvent("saveFormData", "data.First__c: " + data.First__c);
            APP._logEvent("saveFormData", "data.Last__c: " + data.Last__c);
            
			var lead = this.currentLead;
            
            APP._logEvent("saveFormData", "lead: " + lead);
        
			// If there is a current lead (i.e. the users is editing an existing lead)
			// then poulate it with the new data
			if (lead) {
				APP._logEvent("saveFormData", "currentLead is true");
        
				// Copy the new data submitted to the currentLead object in memory
				lead.First__c = data.First__c;
				lead.Last__c = data.Last__c;
				lead.Email__c = data.Email__c;
				lead.Telephone__c = data.Telephone__c;
				lead.Notes__c = data.Notes__c;
        
				// Use the original lat/long data
				data.Latitude__c = lead.Latitude__c;
				data.Longitude__c = lead.Longitude__c;
			}
			else if (this.lastCoords) {
				APP._logEvent("saveFormData", "lastCoords is true");
        
				// If the app already has the coordinates for the device location, use them
				data.Latitude__c = APP.lastCoords.latitude;
				data.Longitude__c = APP.lastCoords.longitude;
			}
    
			try {
				if (lead === undefined) {
					APP._logEvent("saveFormData", "currentLead is undefined");
            
					// If this is a new record, create it
					sfw.client.create(
						"Lead__c", 
						data, 
						APP.onSaveSuccess, 
						APP.onSaveError
						);
				}
				else {
					APP._logEvent("saveFormData", "currentLead is " + APP.currentLead.Last__c);
            
					// If this is an existing record, update it    
					sfw.client.update(
						"Lead__c", 
						lead.Id, 
						data, 
						APP.onSaveSuccess, 
						APP.onSaveError
						);
				}
			}
			catch (e) {
				APP._logEvent("saveFormData", e);
			}
		},
        
		onSaveSuccess: function(result) {
			APP._logEvent("onSaveSuccess");
    
			APP.isEdit = false;

			navigator.notification.alert("Data Saved", function() {
				// Clear the form
				APP.id("lead-form").reset();
				// Go back
				APP.app.navigate("#:back");
			});
		},
        
		onSaveError: function(request, status, error) {
			APP._logEvent("onSaveError");
    
			navigator.notification.alert(
				request.responseText, 
				null,
				"An Error Occurred"
				);
		},
		
		// ======================================= //
		// ============= Lookup View ============= //
		// ======================================= //
		onLookupInit: function() {
			APP._logEvent("onLookupInit");

			lookupListView = $("#leads-listview").kendoMobileListView({
				autoBind: false,
				template: $("#leadsListViewTemplate").html(),
				headerTemplate: "${value}",
                dataSource: { 
                    dataType: "json", 
                    transport: { 
                        read: APP.onDataSourceRead 
                    } 
                },
				click: APP.lookupListView_onItemClick
			});
            
            APP._logEvent("onLookupInit", "Exit");
		},
        
        onLookupShow: function() {
			APP._logEvent("onLookupShow");
            
			lookupListView.dataSource.read();
            
            APP._logEvent("onLookupShow", "Exit");
		},
        
        onDataSourceRead: function(options) {
			APP._logEvent("onDataSourceRead");
                            
			var query = "SELECT Email__c, First__c, Id, Last__c, " + 
						"Latitude__c, Longitude__c, Notes__c, Telephone__c " +
						"FROM Lead__c " + 
						"ORDER BY Last__c, First__c";
    
			// Execute the Salesforce.com query as an async callback operation
			sfw.client.query(query, APP.onQuerySuccess, APP.onQueryError);
		},

		onQuerySuccess: function(response) {
			APP._logEvent("onQuerySuccess");
                                    
			this.lastData = {"records": response.records};
                                    
			options.success(this.lastData.records);
		},
		
		onQueryError: function(request, status, error) {
			APP._logEvent("onQueryError");
    
			navigator.notification.alert(
				request.responseText, 
				null,
				"An Error Occurred"
				);
		},
        
		lookupListView_onItemClick: function(e) {
            APP._logEvent("onListViewItemClicked");
			APP._logEvent("onLookupInit.click", "Lead selected: " + e.dataItem.Last__c);
                
			currentLead = APP.getRecordById(e.dataItem.Id);
			isEdit = true;
                
			APP.app.navigate("#lead");
		}, 
		
		getRecordById: function(id) {
			APP._logEvent("getRecordById");
			APP._logEvent("getRecordById", "id is " + id);
    
			if (!APP.lastData)
				return;
    
			var records = APP.lastData.records;
    
			for (var i = 0; i < records.length; i++) {
				if (records[i].Id == id) {
					APP._logEvent("getRecordById", "Found record for " + records[i].Last__c);
            
					return records[i];
				}
			}
    
			APP._logEvent("getRecordById", "No record found.");
		},

		id: function(elem) {
			return document.getElementById(elem);
		},

		_logEvent: function(n, s) {
			var msg = n; 
			if (s) {
				msg += " - " + s;
			}
			else {
				msg += " fired.";
			}
			console.log(msg);
		},
        
		app: new kendo.mobile.Application(document.body, { transition: "slide", layout: "default-layout" })
	};
})(jQuery);