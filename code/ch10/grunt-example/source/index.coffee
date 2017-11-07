class Car
  _setType: (type='compact')->
    @type = type
  echoType: ()->
    console.log toyota.type



window.Car = Car
