var express = require('express');
var request = require('request');
const bodyParser = require('body-parser');
var querystring = require('querystring');
const { search_wiktionary, searchWikipedia } = require('./wikidata')

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').load();
}
var app = express();

const accountSid = process.env.accountSID;
const authToken = process.env.authToken;

const client = require('twilio')(accountSid, authToken);
const MessagingResponse = require('twilio').twiml.MessagingResponse;

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));

app.post('/incoming', async (req, res) => {
	const twiml = new MessagingResponse();
	var query = req.body.Body;
  console.log(query)
	
  wikipedia_data = await searchWikipedia(query);

  if (wikipedia_data){
    var msg = twiml.message();
    console.log(wikipedia_data.thumbnail_url);
    msg.body(wikipedia_data.extract);
  }
  res.writeHead(200, {'Content-Type': 'text/xml'});
  res.end(twiml.toString());

});

app.get('/', function(request, response) {
  response.sendFile(__dirname + '/views/index.html');
});


var listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});

function getLuisIntent(utterance) {

    // endpoint URL
    var endpoint =
        "https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/";

    // Set the LUIS_APP_ID environment variable 
    // to df67dcdb-c37d-46af-88e1-8b97951ca1c2, which is the ID
    // of a public sample application.    
    var luisAppId = process.env.LUIS_APP_ID;

    // Read LUIS key from environment file ".env"
    // You can use the authoring key instead of the endpoint key. 
	// The authoring key allows 1000 endpoint queries a month.
    var endpointKey = process.env.LUIS_ENDPOINT_KEY;

    // Create query string 
    var queryParams = {
        "verbose":  true,
        "q": utterance,
        "subscription-key": endpointKey
    }

    // append query string to endpoint URL
    var luisRequest =
        endpoint + luisAppId +
        '?' + querystring.stringify(queryParams);

    // HTTP Request
    request(luisRequest,
        function (err,
            response, body) {

            // HTTP Response
            if (err)
                console.log(err);
            else {
                var data = JSON.parse(body);

                console.log(`Query: ${data.query}`);
                console.log(`Top Intent: ${data.topScoringIntent.intent}`);
                console.log('Intents:');
                console.log(data.intents);
            }
        });
}

getLuisIntent('define property');