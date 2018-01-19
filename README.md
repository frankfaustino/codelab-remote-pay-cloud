# Clover Remote Pay Cloud Tutorial

This repository contains a tutorial for building a web application that uses [`CloverConnector`](https://clover.github.io/remote-pay-java/1.4.0/docs/com/clover/remote/client/CloverConnector.html) to connect to a Clover device and perform basic operations over cloud.

### Prerequisites
* Read the [Overview of the Clover Platform](https://docs.clover.com/build/architecture/), including the [Developer Guidelines](https://docs.clover.com/build/developer-guidelines/).
* [Set up a developer account](https://www.clover.com/developers) (including your test merchant settings).
* [Ordered a Clover Developer Kit (DevKit)](https://cloverdevkit.com/) and [set it up](https://docs.clover.com/build/devkit/).
* Installed the Cloud Pay Display app on the Clover device.
* Installed NPM on your computer.

Once the repository is cloned to your computer, follow these instructions to get started with Clover's Remote Pay Cloud.

### Setup
In the root project directory, run `npm install`. This will install `webpack` and `webpack-dev-server`, along with Clover's `remote-pay-cloud` and `remote-pay-cloud-api` libraries that contains the modules needed connect to the device.

Run `npm run build` to start webpack dev server, which will bundle your files and enable hot reloading. You can view the app on [http://localhost:8080](http://localhost:8080). Ignore the CloudTest error, you will define it soon.

Let's define a class, called `CloudTest`, with a class function called `run` that will initialize the connection to the device. This is one way to organize the different functions we will implement for the integration.
```javascript
CloudTest = function () {
}

CloudTest.prototype.run = function () {
  // code will be written here
}
```
### Configure a connection

To use Remote Pay Cloud, you will also need access to your Remote Application ID, API token, merchant ID, and device ID.
  * [Create a Remote App ID](https://docs.clover.com/build/create-your-remote-app-id/) (remoteApplicationID) for your semi-integration POS. This is different from your App ID.
  * API token can be retrieved with [OAuth 2.0](https://docs.clover.com/build/oauth-2-0/)
  * merchant ID will be displayed on the url for a [merchant page](https://docs.clover.com/build/merchant-id-and-api-token-for-development/)
  * device ID can be retrieved by making a GET request to
 `https://{clover_server}/v3/merchants/{your_merchant_id}/devices?access_token={your_api_token}`
  * clover server will be the base url for the server (e.g. `https://www.clover.com, https://sandbox.dev.clover.com/`)

First, create a [`CloverConnectorConfiguration`](https://clover.github.io/remote-pay-java/1.4.0/docs/com/clover/remote/client/CloverDeviceConfiguration.html). Use the parameters from the previous step. Keep the other default parameters for now.
  ```javascript
  var connectorConfiguration = new clover.WebSocketCloudCloverDeviceConfiguration(
    {your_remote_id},
    clover.BrowserWebSocketImpl.createInstance, //webSocketFactory
    new clover.ImageUtil(), //imageUtil
    {your_clover_server},
    {your_access_token},
    new clover.HttpSupport(XMLHttpRequest), //httpSupport
    {your_merchant_id},
    {your_device_id},
    "Cloud Test", //friendlyId
    true, //forceConnect
    1000, //heartbeatInterval
    3000 //reconnectDelay
  )
  ```

### Create a Clover Connector
Create a [`CloverConnector`](https://clover.github.io/remote-pay-java/1.4.0/docs/com/clover/remote/client/CloverConnector.html) object. For this we will need to define a configuration for the [`builder`](http://clover.github.io/remote-pay-cloud/1.4.0/classes/_remote_client_cloverconnectorfactorybuilder_.cloverconnectorfactorybuilder.html), and then finally create the connector using our previously defined connector configuration.
  ```javascript
  var builderConfiguration = {}; // we will define a builder configuration object here

  builderConfiguration[clover.CloverConnectorFactoryBuilder.FACTORY_VERSION] = clover.CloverConnectorFactoryBuilder.VERSION_12; // configure the version

  var cloverConnectorFactory = clover.CloverConnectorFactoryBuilder.createICloverConnectorFactory(builderConfiguration); // create a factory builder

  var cloverConnector = cloverConnectorFactory.createICloverConnector(connectorConfiguration); // create connector
  ```

### Add a listener to the Clover Connector
Define a listener (specifically, an [`ICloverConnectorListener`](https://clover.github.io/remote-pay-java/1.4.0/docs/com/clover/remote/client/ICloverConnectorListener.html), as we are writing over predefined events on the CloverConnector interface) for the default connector that will handle the connection to the device. For now, it will handle when the device is connected, ready to process requests, and disconnected. We will define this outside of the initial connection function as we will need it to define a sale listener in a separate class function.
  ```javascript
  var defaultCloverConnectorListener = Object.assign({}, clover.remotepay.ICloverConnectorListener.prototype, {
    onDeviceReady: function (merchantInfo) {
      console.log({message: "Device ready to process requests!", merchantInfo: merchantInfo});
    },

    onDeviceDisconnected: function () {
      console.log({message: "Disconnected"});
    },

    onDeviceConnected: function () {
      console.log({message: "Connected, but not available to process requests"});
    }
  });
  ```

Add the listener to the connector using [`CloverConnector::addCloverConnectorListener()`](https://clover.github.io/remote-pay-java/1.4.0/docs/com/clover/remote/client/CloverConnector.html#addCloverConnectorListener-com.clover.remote.client.ICloverConnectorListener-), passing in the defaultCloverConnectorListener we just defined.

### Initialize the connection
Initialize the connection using [`CloverConnector::initializeConnection()`](https://clover.github.io/remote-pay-java/1.4.0/docs/com/clover/remote/client/CloverConnector.html#initializeConnection--). In the app, click the green connect button. If everything worked correctly, the status bar at the top will display a ready message! You are now able to connect and disconnect from a Clover device.

### Display a message
Define a class function `showMessage()` that will use the [`CloverConnector::showMessage()`](https://clover.github.io/remote-pay-java/1.4.0/docs/com/clover/remote/client/CloverConnector.html#showMessage-java.lang.String-) to display a message through the device through the "Show Message" button. To retrieve the connector, a `getCloverConnector()` has been defined that will retrieve the connector that was set in the `run` function. Now you can show any message to the device. Note that this message will not disappear until it is changed, or the device/application is disconnected.

As an important side note, make sure to properly dispose of the connector on completion of the action (such as showing a message or completing a sale). A `cleanup()` function is defined already that invokes the [`CloverConnector::dispose()`](https://clover.github.io/remote-pay-java/1.4.0/docs/com/clover/remote/client/CloverConnector.html#dispose--) function.

  ```javascript
  CloudTest.prototype.showMessage = function() {
    // This will send a welcome message to the device
    getCloverConnector().showMessage("Welcome to Clover Connector")

    // Make sure to properly dispose of the connector
    cleanup();
  }
  ```

### Add a sale listener
Now add a sale listener. This is done by extending the `defaultCloverConnectorListener` with event handlers for sale actions. We will define onSaleResponse, onConfirmPaymentRequest, and onVerifySignatureRequest. Take a look at [`CloverConnector::acceptPayment()`](https://clover.github.io/remote-pay-java/1.4.0/docs/com/clover/remote/client/CloverConnector.html#acceptPayment-com.clover.sdk.v3.payments.Payment-) and [`CloverConnector::acceptSignature()`](https://clover.github.io/remote-pay-java/1.4.0/docs/com/clover/remote/client/CloverConnector.html#acceptSignature-com.clover.remote.client.messages.VerifySignatureRequest-) for more information.
  ```javascript
  var saleListener = Object.assign({}, defaultCloverConnectorListener, {
    onSaleResponse: function (response) {
      console.log({message: "Sale complete!", response: response});
    },

    onConfirmPaymentRequest: function (request) {
      console.log({message: "Automatically accepting payment", request: request});

      getCloverConnector().acceptPayment(request.getPayment());
    },

    onVerifySignatureRequest: function (request) {
      console.log({message: "Automatically accepting signature", request: request});

      getCloverConnector().acceptSignature(request);
    }
  });
  ```
Add the listener, similar to step 8, passing in the saleListener.

### Make a sale
Let's make a sale! Create a [`SaleRequest`](https://clover.github.io/remote-pay-java/1.4.0/docs/com/clover/remote/client/messages/SaleRequest.html) object using the Remote Pay Cloud API, and set an external id, as well as the amount. The `calculator.js` will have access to the amount on the number pad. We invoke `setAutoAcceptSignature(false)` since we want to see the signature handling.
  ```javascript
  var saleAmount = amount
  var saleRequest = new sdk.remotepay.SaleRequest();
  saleRequest.setExternalId(clover.CloverID.getNewId());
  saleRequest.setAmount(amount);
  saleRequest.setAutoAcceptSignature(false);
  ```
Finally, initiate the sale by calling the [`CloverConnector::sale()`](https://clover.github.io/remote-pay-java/1.4.0/docs/com/clover/remote/client/CloverConnector.html#sale-com.clover.remote.client.messages.SaleRequest-) function, passing in the `saleRequest`. If everything goes smoothly, you should see instructions on the Clover device to process the payment method.

### Handling requests and responses
Congratulations, you made your first sale! Now take a moment to look at the log messages and its contents (you should have requests and responses set in the console.logs). Learn about a [`SaleResponse`](https://clover.github.io/remote-pay-java/1.4.0/docs/com/clover/remote/client/messages/SaleResponse.html).

Make another sale, with the same card/payment method. Take a look at the confirm payment message in the console. You should see a challenges property, which is an array containing any number of potential issues with the transaction. Here you should have a "duplicate payment" message, because we just used the same card!

Now we need to create logic to handle this challenge. One simple way is to create a separate interface to confirm or reject this transaction from the POS. Then, depending on the input, call [`CloverConnect:: acceptPayment()`](https://clover.github.io/remote-pay-java/1.4.0/docs/com/clover/remote/client/CloverConnector.html#acceptPayment-com.clover.sdk.v3.payments.Payment-), or the [`CloverConnector::rejectPayment()`](https://clover.github.io/remote-pay-java/1.4.0/docs/com/clover/remote/client/CloverConnector.html#rejectPayment-com.clover.sdk.v3.payments.Payment-com.clover.remote.Challenge-) connector functions. We will also define some more logic for `onSaleResponse`, since rejecting a payment request will not result in a proper sale.

  ```javascript
  onSaleResponse: function (response) {
    console.log({message: "Sale complete!", response: response});
    if (!response.getIsSale()) {
      console.log({error: "Response is not a sale!"});
      updateStatus("Sale failed.")
    } else {
      updateStatus("Sale complete!");
    }

    cleanup();
  },

  onConfirmPaymentRequest: function (request) {
    console.log({message: "Processing payment...", request: request});
    updateStatus("Processing payment...");
    var challenges = request.getChallenges();
    if (challenges) {
      sign = window.confirm(challenges[0].message);
      if (sign) {
        getCloverConnector().acceptPayment(request.getPayment());
      } else {
        getCloverConnector().rejectPayment(request.getPayment(), challenges[0]);
      }
    } else {
      console.log({message: "Accepted Payment!"});
      cloverConnector.acceptPayment(request.getPayment());
    }
  },
  ```

### Additional Resources
Congratulations! You have now integrated a web application to a clover device, and are able to show messages and perform a sale. But the Clover Connector is capable of so much more. Here are some additional resources to expand on this project, and start integrating these functionalities into a personal application:

  * [Clover Connector Browser SDK](https://github.com/clover/remote-pay-cloud/)
  * [API documentation](http://clover.github.io/remote-pay-cloud/1.4.0/)
  * [API class documentation](https://clover.github.io/remote-pay-cloud-api/1.4.0/)
  * [Example apps](https://github.com/clover/remote-pay-cloud-examples)
  * [Semi-Integration FAQ](https://community.clover.com/spaces/11/semi-integration.html?topics=FAQ)
  * [Clover Developer Community](https://community.clover.com/index.html)