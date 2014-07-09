
1.2.0 / 2014-02-20
==================

  * Removed hard coded /tmp in favour of real OS temp. (@remy)
  * Update docs and examples.

1.1.4 / 2013-08-28
==================

  * Return `replServer` instance.

1.1.3 / 2013-08-14
==================

  * Fixed 'ctx not defined'. (@thlorenz)
  * Expose `useColors` REPL configuration. (@thlorenz)
  * `socket.end` should be bound to the `socket` object. (@kitcambridge)
  * `getConnections` was not in v0.8, switch to checking for `listen`.

1.1.2 / 2013-08-12
==================

  * Fixed bad reference.

1.1.1 / 2013-08-12
==================

  * Fixed references to repl options.

1.1.0 / 2013-08-12
==================

  * Add js formatting to Readme code blocks. (@timoxley)
  * Add support for custom REPL `start` functions to support `replpad`, et al. (@thlorenz)
  * Clean-up and organize options.
  * Consistent formatting and variable naming.

1.0.2 / 2013-01-03
==================

  * Initial tests.

1.0.1 / 2012-11-17
==================

  * Fixed missing logger default. (@raynos)

1.0.0 / 2012-09-28
==================

  * Release replify.
