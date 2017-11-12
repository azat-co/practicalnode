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
start:
	TWITTER_CONSUMER_KEY=AAAAAAAAAAAAAAAAAAAAA \
	TWITTER_CONSUMER_SECRET=BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB \
  NODE_ENV=development \
	node app.js

.PHONY: test db start