const clover = require('remote-pay-cloud')

var remotePayCloudTutorial

// RemotePayCloudTutorial object definition
RemotePayCloudTutorial = function() {
  this.merchant_id = window.location.href.match(/merchant_id=([^&]*)/)[1]
  this.access_token = window.location.href.match(/access_token=([^&]*)/)[1]
  this.targetCloverDomain = window.location.href.includes('localhost') ? 'https://sandbox.dev.clover.com' : 'https://www.clover.com'
  this.remoteApplicationId = 'J8DFGXSTS7FM4.HFVTZ860SZM9W'
  this.friendlyId = 'Primary POS'

  remotePayCloudTutorial = this
}

RemotePayCloudTutorial.prototype.setCloverConnectorListener = function(cloverConnector) {
  const _this = this

  return Object.assign({}, clover.remotepay.ICloverConnectorListener.prototype, cloverConnector, {
    onDeviceConnected: function() {
      document.getElementById('status-message').innerHTML = 'Device is connected!'
    },
    onDeviceReady: function(merchantInfo) {
      console.log({ message: '🚀 Device ready to process requests!', merchantInfo })
      document.getElementById('status-message').innerHTML = 'Device is connected and ready!'
    },
    onDeviceError: function(cloverDeviceErrorEvent) {
      console.log({ message: '⚠️ An error has occurred and we could not connect to your Clover Device.', cloverDeviceErrorEvent })
      window.alert(`Message: ${cloverDeviceErrorEvent.getMessage()}`)
    },
    onDeviceDisconnected: function(e) {
      console.log({ message: '❌ Disconnected' })
      document.getElementById('status-message').innerHTML = 'Device is disconnected!'
    },
    onPrintJobStatusResponse: function(e) {
      console.log({ message: '✨ print:' + e })
    },
    onSaleResponse: function(saleResponse) {
      console.log('💰💰💰💰💰', saleResponse)
      if (saleResponse.getSuccess()) {
        const saleRequestAmount = parseInt(window.localStorage.getItem('lastTransactionRequestAmount'))
        const saleResponseAmount = saleResponse.getPayment().getAmount()
        const wasPartialAuth = saleResponseAmount < saleRequestAmount
        const formattedSaleResponseAmount = (saleResponseAmount / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })

        if (wasPartialAuth) {
          const remainingBalance = saleRequestAmount - saleResponseAmount
          const formattedRemainingBalance = (remainingBalance / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
          alert(`Partially authorized for ${formattedSaleResponseAmount} - remaining balance is ${formattedRemainingBalance}. Ask the customer for an additional payment method.`)
          remotePayCloudTutorial.performSale(remainingBalance)
        } else {
          alert(`Sale was successful for ${formattedSaleResponseAmount}`)
        }
      } else {
        alert(`${saleResponse.getReason()} - ${saleResponse.getMessage()}`)
      }
    },
    onVerifySignatureRequest: function(verifySignatureRequest) {
      const canvas = document.getElementById('verify-signature-canvas')
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.scale(0.25, 0.25)
      ctx.beginPath()

      for (let strokeIndex = 0; strokeIndex < verifySignatureRequest.getSignature().strokes.length; strokeIndex++) {
        const stroke = verifySignatureRequest.getSignature().strokes[strokeIndex]
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y)

        for (let pointIndex = 1; pointIndex < stroke.points.length; pointIndex++) {
          ctx.lineTo(stroke.points[pointIndex].x, stroke.points[pointIndex].y)
          ctx.stroke()
        }
      }
      ctx.scale(4, 4)

      setTimeout(function() {
        if (confirm('Would you like to approve this signature?')) {
          _this.cloverConnector.acceptSignature(verifySignatureRequest)
        } else {
          _this.cloverConnector.rejectSignature(verifySignatureRequest)
        }
      }.bind(this), 0)
    },
    onConfirmPaymentRequest: function(confirmPaymentRequest) {
      const challenges = confirmPaymentRequest.getChallenges()
      // console.log(challenges)

      for (let i = 0; i < challenges.length; i++) {
        const isLastChallenge = i === challenges.length - 1

        // console.log('❌❌❌❌', confirmPaymentRequest)
        if (confirm(challenges[i].getMessage())) {
          // console.log('❌❌❌❌', challenges[i].getMessage())
          if (isLastChallenge) {
            _this.cloverConnector.acceptSignature(confirmPaymentRequest)
          }
        } else {
          _this.cloverConnector.rejectPayment(confirmPaymentRequest, confirmPaymentRequest.getChallenges()[i])
        }
      }
    }
  })
}

RemotePayCloudTutorial.prototype.showHelloWorld = function() {
  this.cloverConnector.showMessage('Hello World')
  // this.cloverConnector.resetDevice()
  // const printReq = new clover.remotepay.PrintRequest()
  // printReq.setText(['testing', 'one', 'two'])
  // const deviceId = document.getElementById('select--clover-device-serials').value
  // printReq.setPrintDeviceId(deviceId)
  // this.cloverConnector.print(printReq)
}

RemotePayCloudTutorial.prototype.connect = function() {
  // TODO: Create a configuration object, a CloverConnector, a 
  // CloverConnectorListener, and then initialize the connection.
  const deviceId = document.getElementById('select--clover-device-serials').value
  const { createICloverConnectorFactory, FACTORY_VERSION, VERSION_12 } = clover.CloverConnectorFactoryBuilder
  const cloverConnectorFactoryConfiguration = { [FACTORY_VERSION]: VERSION_12 }
  const cloverConnectorFactory = createICloverConnectorFactory(cloverConnectorFactoryConfiguration)
  
  const configBuilder = new clover.WebSocketCloudCloverDeviceConfigurationBuilder(
    this.remoteApplicationId,
    deviceId,
    this.merchant_id,
    this.access_token
  )

  configBuilder.setCloverServer(this.targetCloverDomain)
  configBuilder.setFriendlyId(this.friendlyId)
  const cloudConfig = configBuilder.build()

  this.cloverConnector = cloverConnectorFactory.createICloverConnector(cloudConfig)
  this.cloverConnector.addCloverConnectorListener(this.setCloverConnectorListener(this.cloverConnector))

  this.setDisposalHandler()
  console.log('🎉', this.cloverConnector)
  this.cloverConnector.initializeConnection()
}

// Perform a sale
RemotePayCloudTutorial.prototype.performSale = function(amount) {
  // TODO: Use the CloverConnector to initiate a sale.
  console.log('💰', amount, clover.CloverID.getNewId())
  const saleReq = new clover.remotepay.SaleRequest()
  saleReq.setAmount(amount)
  saleReq.setExternalId(clover.CloverID.getNewId())
  if (document.getElementById('checkbox-manual-card-entry').checked) {
    saleReq.setCardEntryMethods(clover.CardEntryMethods.ALL)
    document.getElementById('checkbox-manual-card-entry').checked = false
  }

  window.localStorage.setItem('lastTransactionRequestAmount', amount)
  this.cloverConnector.sale(saleReq)
}

RemotePayCloudTutorial.prototype.setDisposalHandler = function() {
  window.onbeforeunload = function(event) {
    try {
      this.cloverConnector.dispose()
    } catch(e) {
      console.error(e)
    }
  }.bind(this)
}

module.exports = RemotePayCloudTutorial
