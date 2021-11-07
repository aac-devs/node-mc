/*
 * Primary file for the API
 *
 */

// Dependencies
var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');
var fs = require('fs');

// Instatiate the HTTP server
var httpServer = http.createServer(function(req, res){
  unifiedServer(req, res);
});

// Start the HTTP server
httpServer.listen(config.httpPort, function(){
  console.log(`The server is listening on port ${config.httpPort} in ${config.envName} mode`);
});

// Instantiate the HTTPS server
var httpsServerOptions = {
  'key': fs.readFileSync('./https/key.pem'),
  'cert': fs.readFileSync('./https/cert.pem')
};

var httpsServer = https.createServer(httpsServerOptions, function(req, res){
  unifiedServer(req, res);
});

// Start the HTTPS server
httpsServer.listen(config.httpsPort, function(){
  console.log(`The server is listening on port ${config.httpsPort} in ${config.envName} mode`);
});

// All the server logic for both the http and https server
var unifiedServer = function(req, res){
  console.clear();
  // Get the URL and parse it
  var parsedUrl = url.parse(req.url, true)
  // console.log(parsedUrl);

  // Get the path
  var path = parsedUrl.pathname;
  // console.log(path);

  var trimedPath = path.replace(/^\/+|\/+$/g, '');
  console.log(trimedPath);

  // Get the query string as an object
  var queryStringObject = Object.assign({}, parsedUrl.query);

  // Get the HTTP Method
  var method = req.method.toLowerCase();

  // Get the headers as an Object
  var headers = req.headers;

  // Get the payload, if any
  var decoder = new StringDecoder('utf-8');
  var buffer = '';
  req.on('data', function(data){
    buffer += decoder.write(data);
  })
  req.on('end', function(){
    buffer += decoder.end();

    // Chose the handler this request should go. If one is not found, use the notFound handler
    var chosenHandler = typeof(router[trimedPath]) !== 'undefined' ? router[trimedPath] : handlers.notFound;

    // Contruct the data object to send to the handler
    var data = {
      'trimedPath': trimedPath,
      'queryStringObject': queryStringObject,
      'method': method,
      'headers': headers,
      'payload': buffer
    }

    // Route the request to the handler specified in the router
    chosenHandler(data, function(statusCode, payload){
      // Use the status code called back by the handler, or default to 200
      statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

      // Use the payload calleb back by the handler, or default to an empty object
      payload = typeof(payload) == 'object' ? payload : {};

      // Convert the payload to a string
      var payloadString = JSON.stringify(payload);

      // Return the response
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(payloadString);

      // Log the request path
      console.log('Returning this response:', statusCode, payloadString);
    });
  });
};


// Define the handlers
var handlers = {}

// Sample handler
handlers.sample = function(data, callback){
  // Callback a http status code, and payload object
  callback(406, { 'name': 'sample handler'});
};

// Not found handler
handlers.notFound = function(data, callback){
  callback(404);
};

// Define a request router
var router = {
  'sample': handlers.sample
};
