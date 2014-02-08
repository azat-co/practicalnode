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
	TWITTER_CONSUMER_KEY=Cx0UE8nGMIulWZakoLuhg \
	TWITTER_CONSUMER_SECRET=23rLnxijn7ZDbrvvfGyIIpeEJnOecmbFXuZiBTw \
	node  app

.PHONY: test db start