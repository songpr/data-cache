# data-cache
caching data with LRU Cache and refresh it within specified time.

## Concept
Data cache that include how to fetch/replace/clear items in one place to make it simple to use.

APIs have been kept to be minimal, unless there are useful use cases.
## Installation:

```javascript
npm install data-cache --save
```

## Usage:

```javascript
const Cache = require("data-cache");
const options = { max: 500
              , maxAge: 1200
              , refreshAge : 600 };
const fetch = ()=>Object.entries({ a: 1, b: 2, c: 3 });
const cache = new Cache(fetch,options);
await cache.init()
cache.get("a") // 1

```
## Cache constructor

data-cache constructor requie a fetch function, and an optional options

## Fetch function/async function

a function/async function that return a Iterator object that contains the [key, value] pairs for each
e.g. Map.entries(), OBject.entries(object)

Note: the order of items in entries is important, if the max < size of entries then only 1 to max items are loaded to cached.
Therefore items must be sorted by its prority, which the most important one is the first.
## Options

* `max` The maximum size of the cache. Setting it to 0 then no data will be cached.
   Default is 10000.

* `maxAge` Maximum age in second. Expired items will be removed every refreshAge. 
   Default is 600 seconds.

* `refreshAge` refresh time in second. New data will be fetch on each refresh and expired items will be removed every refreshAge.
   Default is maxAge.

* `resetOnRefresh` true then reset cache on every refresh, so only the new fetch data is cached.
   Default is true
## API

* `async init()`
    Call this function to init cache with the data from fetch function and start the refresh cycle.

* `get(key) => value`

    get the cached data using key. if no key then it will return undefined.
    
    This will update the "recently used"-ness of the key.

    The key and val can be any type. But using object as key have to same object.

* `async close()`

    Clear the cache entirely, throwing away all values, and stop refresh.

* `size`

    Return total number of items currently in cache. Note, that
    expired items are included as part of this item count.

