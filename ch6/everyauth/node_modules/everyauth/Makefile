TESTS = $(shell find test/ -name '*.tobi.js' -o -name '*.test.js')

test:
	mocha --reporter spec $(TESTS)

.PHONY: test
