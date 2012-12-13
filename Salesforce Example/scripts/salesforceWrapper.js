/*
The code in this file is taken from the PhoneGap+ Database.com article 
"Building PhoneGap applications powered by Database.com" by Andrew Trice
published at http://www.adobe.com/devnet/phonegap/articles/phonegap-apps-powered-by-developercom.html
*/

function SalesforceWrapper() {
	/* AUTHENTICATION PARAMETERS */
	this.loginUrl = 'https://login.salesforce.com/';
	this.clientId = '3MVG9rFJvQRVOvk6Af29sXr.DmAnygufDREKu_SxIHEgttUcRvmGwK4tr6nvEXX07BpiZX0FnJA==';

	this.redirectUri = 'https://login.salesforce.com/services/oauth2/success';
    
	/* CLASS VARIABLES */
	this.cb = undefined;     //ChildBrowser in PhoneGap
	this.client = undefined; //forceTk client instance
    
	this.init();
}

SalesforceWrapper.prototype.init = function() {
	this.client = new forcetk.Client(this.clientId, this.loginUrl);
	this.cb = window.plugins.childBrowser;
}

SalesforceWrapper.prototype.login = function (successCallback) {
	this.loginSuccess = successCallback;
	var self = this;
	self.cb.onLocationChange = function (loc) {
		if (loc.search(self.redirectUri) >= 0) {
			self.cb.close();
			self.sessionCallback(unescape(loc));
		}
	};
    
    // YOU MUST EDIT THIS METHOD IF YOU WANT TO HIDE THE LOCATION, ADDRESS AND STATUS OF THE CHILD BROWSER WINDOW
	self.cb.showWebPage(
        self.getAuthorizeUrl(self.loginUrl, self.clientId, self.redirectUri),
        { showLocationBar: false, showAddress: false, showNavigationBar: false }
    );
}

SalesforceWrapper.prototype.getAuthorizeUrl = function (loginUrl, clientId, redirectUri) {
	return loginUrl + 'services/oauth2/authorize?display=touch' + '&response_type=token&client_id=' + escape(clientId) + '&redirect_uri=' + escape(redirectUri);
}

SalesforceWrapper.prototype.sessionCallback = function(loc) {
	var oauthResponse = {};
    
	var fragment = loc.split("#")[1];
    
	if (fragment) {
		var nvps = fragment.split('&');
		for (var nvp in nvps) {
			var parts = nvps[nvp].split('=');
			oauthResponse[parts[0]] = unescape(parts[1]);
		}
	}
    
	if (typeof oauthResponse === 'undefined' || typeof oauthResponse['access_token'] === 'undefined') {
		console.log("error");
	}
	else {
		this.client.setSessionToken(oauthResponse.access_token, null, oauthResponse.instance_url);
		if (this.loginSuccess) {
			this.loginSuccess();
		}
	}
	this.loginSuccess = undefined;
}