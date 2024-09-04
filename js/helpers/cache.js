let cache = {};

export const cacheItem = function (name, value) {
    cache[name] = value;
}

export const getItem = function (name) {
    return hasItem(name) ? cache[name] : null;
}

export const hasItem = function (name) {
    return cache.hasOwnProperty(name);
}