document.addEventListener('DOMContentLoaded', () => {
  const { connect, showHelloWorld, targetCloverDomain, access_token, merchant_id } = remotePayCloudTutorial

  let displayState = ''
  const numpadKeys = document.querySelectorAll('.numpad--key')
  const total = document.getElementById('total')
  
  const connectKey = document.getElementById('key--connect')
  const chargeKey = document.getElementById('key--charge')
  const helloWorldKey = document.getElementById('key--hello-world')
  
  numpadKeys.forEach((key) => {
    key.addEventListener('click', function() {
      const keyValue = key.id.slice(5, key.id.length)
      
      switch (true) {
        case ('12345678900'.includes(keyValue)):
          if (displayState + keyValue < 1) {
            break
          }
          if (displayState.length < 7) {
            displayState += keyValue
          }
          break
        case keyValue === 'del':
          displayState = displayState.slice(0, displayState.length - 1)
          break
        default:
          break
      }
      
      if (displayState.length === 0 || displayState < 1) {
        total.innerHTML = '0.00'
      } else if (displayState.length === 1) {
        total.innerHTML = '0.0' + displayState
      } else if (displayState.length === 2) {
        total.innerHTML = '0.' + displayState
      } else {
        total.innerHTML = displayState.slice(0, displayState.length - 2) + '.' + displayState.slice(displayState.length - 2, displayState.length)
      }
    })
  })
  
  connectKey.addEventListener('click', function() {
    connect()
  })
  
  chargeKey.addEventListener('click', function() {
  })
  
  helloWorldKey.addEventListener('click', function() {
    showHelloWorld()
  })

  fetch(`${targetCloverDomain}/v3/merchants/${merchant_id}/devices?access_token=${access_token}`)
    .then(response => response.json())
    .then(data => {
      const select = document.getElementById('select--clover-device-serials')

      data.elements.forEach(({ id, serial }) => {
        const firstThree = serial.slice(0, 3)
        const compatibleDevices = new Set(['C02', 'C03', 'C04'])
    
        if (compatibleDevices.has(firstThree)) {
          const option = document.createElement('option')
          option.text = serial
          option.value = id
          select.add(option)
        }
      })
    })
    .catch(error => window.alert(error.toString()))
})
