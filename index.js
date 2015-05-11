var request = require('request');
module.exports = {
	getIncomingBusesToStop : function (idStop, idClient, passKey, callback ){

		// Response JSON, to be populated later
		var response = {
		};


		// Entry parameters
		var formData = {
			"cultureInfo": "ES",
			"idStop": idStop,
			"idClient": idClient,
			"passKey": passKey
		};

		// Perform API call
		request.post({
			url:'https://openbus.emtmadrid.es/emt-proxy-server/last/geo/GetArriveStop.php', 
			form: formData,
			strictSSL: false

		}, function (err, httpResponse, body) {
			if ( err ) {
				console.error('Error while connecting:');
				response.status = 400;
				response.error = err;
			}else{
				console.log('REST call OK');
				response.status = 200;
				response.arrives = JSON.parse(body);
			}

			if (typeof callback === "function") {
				callback ( response );
			}
		});
	}
}
