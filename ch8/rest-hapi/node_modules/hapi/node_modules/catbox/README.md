<a href="https://github.com/spumko"><img src="https://raw.github.com/spumko/spumko/master/images/from.png" align="right" /></a>
![catbox Logo](https://raw.github.com/spumko/catbox/master/images/catbox.png)

Multi-strategy object caching service

[![Build Status](https://secure.travis-ci.org/spumko/catbox.png)](http://travis-ci.org/spumko/catbox)


**catbox** is a multi-strategy key-value object store. It includes support for [Redis](http://redis.io/), [MongoDB](http://www.mongodb.org/),
[Memcached](http://memcached.org/), and a limited memory store (not suitable for production environments). **catbox** provides two interfaces: a low-level `Client` and a high-level
`Policy`.


### Installation

In order to reduce module dependencies, **catbox** does not depend on the [mongodb](https://npmjs.org/package/mongodb) or
[redis](https://npmjs.org/package/redis) modules. To use these strategies, each service must be available on the network and
each module must be manually installed.

### Notes

Since Riak doesn't have ttl built in, a garbage collection function will run periodically to remove expired keys. This function makes a getIndex call, so your riak backend cannot be set to `riak_kv_bitcask_backend`, this call streams the keys that need to be deleted and deletes them as they are received. 
In order to prevent siblings we recomend you set `last_write_wins` on the bucket to true.

### `Client`

The `Client` object provides a low-level cache abstraction. The object is constructed using `new Client(options)` where:

- `options` - is an object with the following keys:
    - `engine` - the cache server implementation. Options are:
        - `redis`
        - `mongodb`
        - `memcache`
        - `memory`
        - `riak`
        - an object with **catbox** compatible interface (use the `memory` cache implementation as prototype).
    - `partition` - the partition name used to isolate the cached results across multiple clients. The partition name is used
      as the MongoDB database name, the Riak bucket, or as a key prefix in Redis and Memcached. To share the cache across multiple clients, use the same
      partition name.
    - additional strategy specific options:
        - MongoDB:
            - `host` - the MongoDB server hostname. Defaults to `'127.0.0.1'`.
            - `port` - the MongoDB server port. Defaults to `27017`.
            - `username` - when the mongo server requires authentication. Defaults to no authentication.
            - `password` - the authentication password when `username` is configured.
            - `poolSize` - number of connections. Defaults to `5`.
        - Redis:
            - `host` - the Redis server hostname. Defaults to `'127.0.0.1'`.
            - `port` - the Redis server port. Defaults to `6379`.
            - `password` - the Redis authentication password when required.
        - Riak:
            - `host` - the Riak server hostname. Defaults to `127.0.0.1`.
            - `port` - the Riak PBC port. Defaults to `8087`.
        - Memcache:
            - `host` - the Memcache server hostname. Defaults to '`127.0.0.1'`. Cannot be used with `location`.
            - `port` - the Memcache server port. Defaults to `11211`. Cannot be used with `location`.
            - `location` - the Memcache server hostname and port. Defaults to ''127.0.0.1:11211''.
            Can be a String, Array, or an Object as per [node-memcached location specification](https://github.com/3rd-Eden/node-memcached#server-locations).
        - Memory:
            - `maxByteSize` - sets an upper limit on the number of bytes that can be stored in the cached. Once this limit is
              reached no additional items will be added to the cache until some expire. The utilized memory calculation is
              a rough approximation and must not be relied on. Defaults to `104857600` (100MB).

#### API

The `Client` object provides the following methods:

- `start(callback)` - creates a connection to the cache server. Must be called before any other method is available.
  The `callback` signature is `function(err)`.
- `stop()` - terminates the connection to the cache server.
- `get(key, callback)` - retrieve an item from the cache engine if found where:
    - `key` - a cache key object (see below).
    - `callback` - a function with the signature `function(err, cached)`. If the item is not found, both `err` and `cached` are `null`.
      If found, the `cached` object contains the following:
        - `item` - the value stored in the cache using `set()`.
        - `stored` - the timestamp when the item was stored in the cache (in milliseconds).
        - `ttl` - the remaining time-to-live (not the original value used when storing the object).
- `set(key, value, ttl, callback)` - store an item in the cache for a specified length of time, where:
    - `key` - a cache key object (see below).
    - `value` - the string or object value to be stored.
    - `ttl` - a time-to-live value in milliseconds after which the item is automatically removed from the cache (or is marked invalid).
    - `callback` - a function with the signature `function(err)`.
- `drop(key, callback)` - remove an item from cache where:
    - `key` - a cache key object (see below).
    - `callback` - a function with the signature `function(err)`.

Any method with a `key` argument takes an object with the following required properties:
- `segment` - a caching segment name. Enables using a single cache server for storing different sets of items with overlapping ids.
- `id` - a unique item identifies (per segment).


### `Policy`

The `Policy` object provides a convenient cache interface by setting a global policy which is automatically applied to every storage action.
The object is constructed using `new Policy(options, [cache, segment])` where:

- `options` - is an object with the following keys:
    - `expiresIn` - relative expiration expressed in the number of milliseconds since the item was saved in the cache. Cannot be used
      together with `expiresAt`.
    - `expiresAt` - time of day expressed in 24h notation using the 'HH:MM' format, at which point all cache records for the route
      expire. Uses local time. Cannot be used together with `expiresIn`.
    - `staleIn` - number of milliseconds to mark an item stored in cache as stale and reload it.  Must be less than `expiresIn`.
    - `staleTimeout` - number of milliseconds to wait before checking if an item is stale.
- `cache` - a `Client` instance (which has already been started).
- `segment` - required when `cache` is provided. The segment name used to isolate cached items within the cache partition.

#### API

The `Policy` object provides the following methods:

- `get(id, callback)` - retrieve an item from the cache where:
    - `id` - the unique item identifier (within the policy segment).
    - `callback` - a function with the signature `function(err, cached)` where `cached` is the object returned by the `client.get()` with
      the additional `isStale` boolean key.
- `set(id, value, ttl, callback)` - store an item in the cache where:
    - `id` - the unique item identifier (within the policy segment).
    - `value` - the string or object value to be stored.
    - `ttl` - a time-to-live **override** value in milliseconds after which the item is automatically removed from the cache (or is marked invalid).
      This should be set to `0` in order to use the caching rules configured when creating the `Policy` object.
    - `callback` - a function with the signature `function(err)`.
- `drop(id, callback)` - remove the item from cache where:
    - `id` - the unique item identifier (within the policy segment).
    - `callback` - a function with the signature `function(err)`.
- `ttl(created)` - given a `created` timestamp in milliseconds, returns the time-to-live left based on the configured rules.
- `getOrGenerate(id, generateFunc, callback)` - get an item from the cache if found, otherwise calls the `generateFunc` to produce a new value
  and stores it in the cache. This method applies the staleness rules. Its arguments are:
    - `id` - the unique item identifier (within the policy segment).
    - `generateFunc` - a function with the signature `function(callback = function (err, result))` where `result` is the value to be stored.
    - `callback` - a function with the signature `function(err, value, cached, report)` where:
        - `err` - any errors encountered.
        - `value` - the fetched or generated value.
        - `cached` - the `cached` object returned by `policy.get()` is the item was found in the cache.
        - `report` - an object with logging information about the operation.
