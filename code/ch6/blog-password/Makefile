REPORTER = list
MOCHA_OPTS = --ui bdd -c

db:
	echo Seeding blog-test *****************************************************
	./seed.sh
test:
	clear

	echo Starting test *********************************************************
	./node_modules/mocha/bin/mocha \
	--reporter $(REPORTER) \
	$(MOCHA_OPTS) \
	tests/*.js
	echo Ending test

.PHONY: test db