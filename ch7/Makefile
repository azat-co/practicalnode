REPORTER = list
MOCHA_OPTS = --ui bdd -c

db:
	echo Seeding blog-test *****************************************************
	./db/seed.sh
test:
	clear

	echo Starting test *********************************************************
	./node_modules/mocha/bin/mocha \
	--reporter $(REPORTER) \
	$(MOCHA_OPTS) \
	tests/*.js
	echo Ending test
start:
	TWITTER_CONSUMER_KEY=ABC \
	TWITTER_CONSUMER_SECRET=XYZXYZ \
	node  app

.PHONY: test db start