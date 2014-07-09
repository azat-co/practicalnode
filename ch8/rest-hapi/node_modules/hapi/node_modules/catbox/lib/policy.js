// Load modules

var Hoek = require('hoek');


// Declare internals

var internals = {
    day: 24 * 60 * 60 * 1000
};


exports = module.exports = internals.Policy = function (options, cache, segment) {

    Hoek.assert(this.constructor === internals.Policy, 'Cache Policy must be instantiated using new');

    this.rule = internals.Policy.compile(options, !!cache);

    if (cache) {
        var nameErr = cache.validateSegmentName(segment);
        Hoek.assert(nameErr === null, 'Invalid segment name: ' + segment + (nameErr ? ' (' + nameErr.message + ')' : ''));

        this._cache = cache;
        this._segment = segment;
    }
};


internals.Policy.prototype.get = function (id, callback) {

    var self = this;

    if (!this._cache) {
        return callback(null, null);
    }

    this._cache.get({ segment: this._segment, id: id }, function (err, cached) {

        if (err) {
            return callback(err);
        }

        if (cached) {
            cached.isStale = (self.rule.staleIn ? (Date.now() - cached.stored) >= self.rule.staleIn : false);
        }

        return callback(null, cached);
    });
};


internals.Policy.prototype.set = function (id, value, ttl, callback) {

    callback = callback || function () { };

    if (!this._cache) {
        return callback(null);
    }

    ttl = ttl || internals.Policy.ttl(this.rule);
    this._cache.set({ segment: this._segment, id: id }, value, ttl, callback);
};


internals.Policy.prototype.drop = function (id, callback) {

    callback = callback || function () { };

    if (!this._cache) {
        return callback(null);
    }

    this._cache.drop({ segment: this._segment, id: id }, callback);
};


internals.Policy.prototype.ttl = function (created) {

    return internals.Policy.ttl(this.rule, created);
};


internals.Policy.prototype.getOrGenerate = function (id, generateFunc, callback) {

    var self = this;

    var report = null;

    var get = function () {

        // Check if cache enabled

        if (!self._cache) {
            return validate();
        }

        // Lookup in cache

        var timer = new Hoek.Timer();
        self.get(id, function (err, cached) {

            // Error

            if (err) {
                report = err;
                return validate();
            }

            // Not found

            if (!cached ||
                !cached.item) {

                report = { msec: timer.elapsed() };
                return validate();
            }

            // Found

            report = { msec: timer.elapsed(), stored: cached.stored, ttl: cached.ttl, isStale: cached.isStale };
            return validate(cached);
        });
    };

    var validate = function (cached) {

        // Check if found and fresh

        if (cached &&
            !cached.isStale) {

            return callback(null, cached.item, cached, report);
        }

        // Not in cache, or cache stale

        var wasCallbackCalled = false;                      // Track state between stale timeout and generate fresh

        if (cached &&
            cached.isStale) {

            // Set stale timeout

            var timerFunc = function () {

                if (wasCallbackCalled) {
                    return;
                }

                wasCallbackCalled = true;
                return callback(null, cached.item, cached, report);
            };

            cached.ttl -= self.rule.staleTimeout;          // Adjust TTL for when the timeout is invoked (staleTimeout must be valid if isStale is true)
            if (cached.ttl > 0) {
                setTimeout(timerFunc, self.rule.staleTimeout);
            }
        }

        // Generate new value

        generateFunc(function (err, result, isUncacheable) {

            // Error

            if (err ||
                isUncacheable) {

                if (wasCallbackCalled) {
                    self.drop(id);                          // Invalidate cache
                    return;
                }

                wasCallbackCalled = true;
                return callback(err, result, null, report);
            }

            // Valid result

            var value = result;
            var ttl = null;                                 // Use cache policy

            if (value) {
                if (value.getTtl && typeof value.getTtl === 'function') {
                    ttl = value.getTtl();
                }

                if (value.toCache && typeof value.toCache === 'function') {
                    value = value.toCache();
                }
            }

            // Check if already sent stale value

            if (wasCallbackCalled) {
                set(value, ttl);                            // Replace stale cache copy with late-coming fresh copy
                return;
            }

            // New value (arrived before stale timeout if enabled)

            wasCallbackCalled = true;

            set(value, ttl);                                // Save to cache (lazy) and continue
            return callback(null, result, null, report);
        });
    };

    var set = function (value, ttl) {

        if (!self._cache ||
            ttl === 0) {                                    // null or undefined means use policy

            return;
        }

        self.set(id, value, ttl);                           // Lazy save
    };

    get();
};


internals.Policy.compile = function (options, serverSide) {
    /*
     *   {
     *       expiresIn: 30000,
     *       expiresAt: '13:00',
     *       staleIn: 20000,
     *       staleTimeout: 500,
     *   }
     */

    var rule = {};

    if (!options ||
        !Object.keys(options).length) {

        return rule;
    }

    // Validate rule

    Hoek.assert(!!options.expiresIn ^ !!options.expiresAt, 'Rule must include one of expiresIn or expiresAt but not both', options);                                                // XOR
    Hoek.assert(!options.expiresAt || !options.staleIn || options.staleIn < 86400000, 'staleIn must be less than 86400000 milliseconds (one day) when using expiresAt');
    Hoek.assert(!options.expiresIn || !options.staleIn || options.staleIn < options.expiresIn, 'staleIn must be less than expiresIn');
    Hoek.assert(!(!!options.staleIn ^ !!options.staleTimeout), 'Rule must include both of staleIn and staleTimeout or none');                                      // XNOR
    Hoek.assert(!options.staleTimeout || !options.expiresIn || options.staleTimeout < options.expiresIn, 'staleTimeout must be less than expiresIn');
    Hoek.assert(!options.staleTimeout || !options.expiresIn || options.staleTimeout < (options.expiresIn - options.staleIn), 'staleTimeout must be less than the delta between expiresIn and staleIn');

    // Expiration

    if (options.expiresAt) {

        // expiresAt

        var time = /^(\d\d?):(\d\d)$/.exec(options.expiresAt);
        Hoek.assert(time && time.length === 3, 'Invalid time string for expiresAt: ' + options.expiresAt);

        rule.expiresAt = {
            hours: parseInt(time[1], 10),
            minutes: parseInt(time[2], 10)
        };
    }
    else {

        // expiresIn

        rule.expiresIn = options.expiresIn;
    }

    // Stale

    if (options.staleIn) {
        Hoek.assert(serverSide, 'Cannot use stale options without server-side caching');
        rule.staleIn = options.staleIn;
        rule.staleTimeout = options.staleTimeout;
    }

    return rule;
};


internals.Policy.ttl = function (rule, created) {

    var now = Date.now();
    created = created || now;
    var age = now - created;

    if (age < 0) {
        return 0;                                                                   // Created in the future, assume expired/bad
    }

    if (rule.expiresIn) {
        var ttl = rule.expiresIn - age;
        return (ttl > 0 ? ttl : 0);                                                // Can be negative
    }

    if (rule.expiresAt) {
        if (created !== now &&
            now - created > internals.day) {                                        // If the item was created more than a 24 hours ago

            return 0;
        }

        var expiresAt = new Date(created);                                          // Assume everything expires in relation to now
        expiresAt.setHours(rule.expiresAt.hours);
        expiresAt.setMinutes(rule.expiresAt.minutes);
        expiresAt.setSeconds(0);

        var expiresIn = expiresAt.getTime() - created;
        if (expiresIn <= 0) {
            expiresIn += internals.day;                                             // Time passed for today, move to tomorrow
        }

        return expiresIn - age;
    }

    return 0;                                                                       // No rule
};