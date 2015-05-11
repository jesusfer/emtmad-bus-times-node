# emtmad-bus-times-node

Nodejs library to access services from the public API of the Public Transport Authority of Madrid, Spain (EMT)

## API Access

Request access to the API at http://opendata.emtmadrid.es/Formulario

## Installation

emtmad-bus-times-node is packaged using NPM ( https://www.npmjs.com/ ). Just require the package inside your code:

```sh
var emtmadApi = require('emtmad-bus-times-node');
```

## Init API

Call the init function with your credentials:

```sh
emtmadApi.initAPICredentials('YOUR_API_ID','YOUR_API_PASSKEY');
```

## Usage: get incoming buses to a given bus stop

Once the client is initialized, you just need to call the getIncomingBuses(busStopNumber, your_callback_function(jsonOutput) and access the JSON file:

```sh
	var busStopNumber = '1924';

	getIncomingBusesToStop( busStopNumber, function(output){
        if (output.status == 200)
            console.log(output.arrives);
        else if (output.status == 400)
            console.log(output.error);
        else
            console.log("unknown error");
    });
```

If the call to the API is successful, the returned JSON will be like this:

```sh
{
    "status":200,
    "arrives":[{bus0},{bus1}....{busN}]
}
```

Where every **{busN}** object represents an incoming bus to the specified bus stop. The most relevant attributes for each bus are:

```sh
{
    "lineId": "32", # The line of the bus
    "busDistance": 9, # In meters
    "busTimeLeft": 0 # In seconds
}
```


If the call to the API wasn't successful, the returned JSON will be like this:

```sh
{
    "status":400,
    "error": e
}
```

## Troubleshooting

### CORS

The SSL certificate in the endpoint ( https://openbus.emtmadrid.es ) is self-signed, so you will need to add it to your browser's truststore.

## Development

Do you want to contribute? Great! Pull requests are more than welcome.

## Bower version

Check https://github.com/alvaroreig/emtmad-bus-times-bw
