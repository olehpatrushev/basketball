import {
    BaseService
} from "./base.js";

export class CacheService extends BaseService {
    cache = {};

    cacheItem(name, value) {
        this.cache[name] = value;
    }

    getItem(name) {
        return this.hasItem(name) ? this.cache[name] : null;
    }

    hasItem(name) {
        return this.cache.hasOwnProperty(name);
    }
}