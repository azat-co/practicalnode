factorial = (x) ->
  if x is 1 then return 1
  x * factorial(x - 1)

window.factorial = factorial