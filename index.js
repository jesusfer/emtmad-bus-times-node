var request = require('request');

// Probably not the best way to share vars between functions in module scope. Please let me know the right way.
var globalIdClient = '';
var globalPasskey = '';

// API variables
var getIncomingBusesToStopUrl = 'https://openbus.emtmadrid.es/emt-proxy-server/last/geo/GetArriveStop.php';

module.exports = {
	initAPICredentials : function (idClient, passKey ){
		globalIdClient = idClient;
		globalPasskey = passKey;
	},
	getIncomingBusesToStop : function (idStop, callback ){

		// Response JSON, to be populated later
		var response = {
		};


		// Entry parameters
		var formData = {
			"cultureInfo": "ES",
			"idStop": idStop,
			"idClient": globalIdClient,
			"passKey": globalPasskey
		};

		// Perform API call
		request.post({
			url: getIncomingBusesToStopUrl, 
			form: formData,
			strictSSL: false // The API certificate looks self signed

		}, function (err, httpResponse, body) {
			if ( err ) {
				console.error('Error while connecting:');
				response.status = 400;
				response.error = err;
			}else{
				console.log('REST call OK');
				response.status = 200;
				response.arrives = (JSON.parse(body)).arrives;
			}

			if (typeof callback === "function") {
				callback ( response );
			}
		});
	}
}
