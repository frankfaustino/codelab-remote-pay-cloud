const clover = require('remote-pay-cloud')

// RemotePayCloudTutorial object definition
RemotePayCloudTutorial = function() {
  // TODO: Set instance variables for CloverConnector configuration.
  this.merchant_id = window.location.href.match(/merchant_id=([^&]*)/)[1]
  this.access_token = window.location.href.match(/access_token=([^&]*)/)[1]
  this.targetCloverDomain = window.location.href.includes('localhost') ? 'https://sandbox.dev.clover.com' : 'https://www.clover.com'
  this.remoteApplicationId = 'J8DFGXSTS7FM4.HFVTZ860SZM9W'
  this.friendlyId = 'Primary POS'

  console.log(this.merchant_id, this.access_token, this.targetCloverDomain)
}

RemotePayCloudTutorial.prototype.showHelloWorld = function() {
  // TODO: Show a 'Hello World' message on the device.
}

// Define the connect() function. This is invoked onclick of the green 'Connect' button.
RemotePayCloudTutorial.prototype.connect = function() {
  // TODO: Create a configuration object, a CloverConnector, a 
  // CloverConnectorListener, and then initialize the connection.
}

// Perform a sale
RemotePayCloudTutorial.prototype.performSale = function(amount) {
  // TODO: Use the CloverConnector to initiate a sale.
}

module.exports = RemotePayCloudTutorial
