(function (definition) {
    /* jshint strict: false */

    // Montage Require
    if (typeof bootstrap === "function") {
        bootstrap("Armap", definition);

    // CommonJS
    } else if (typeof exports === "object") {
        module.exports = definition();

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
        define(definition);

    // <script>
    } else {
        Armap = definition();
    }

})(function () {
    'use strict';

    var $slice = Array.prototype.slice;

    function $intersect() {
        var args = Array.prototype.slice.call(arguments),
            aLower = [],
            aStack = [],
            count,
            i,
            nArgs,
            nLower,
            oRest = {},
            oTmp = {},
            value,
            compareArrayLength = function(a, b) {
                return (a.length - b.length);
            },
            indexes = function(array, oStack) {
                var i = 0,
                    value,
                    nArr = array.length,
                    oTmp = {};

                for (; nArr > i; ++i) {
                    value = array[i];
                    if (!oTmp[value]) {
                        oStack[value] = 1 + (oStack[value] || 0); // counter
                        oTmp[value] = true;
                    }
                }

                return oStack;
            };

        args.sort(compareArrayLength);
        aLower = args.shift();
        nLower = aLower.length;

        if (0 === nLower) {
            return aStack;
        }

        nArgs = args.length;
        i = nArgs;
        while (i--) {
            oRest = indexes(args.shift(), oRest);
        }

        for (i = 0; nLower > i; ++i) {
            value = aLower[i];
            count = oRest[value];
            if (!oTmp[value]) {
                if (nArgs === count) {
                    aStack.push(value);
                    oTmp[value] = true;
                }
            }
        }

        return aStack;
    }

    function $union(array1, array2) {
        var obj = {},
            i = array1.length,
            j = array2.length,
            newArray = [];

        while (i--) {
            if (!(array1[i] in obj)) {
                obj[array1[i]] = true;
                newArray.push(array1[i]);
            }
        }

        while (j--) {
            if (!(array2[j] in obj)) {
                obj[array2[j]] = true;
                newArray.push(array2[j]);
            }
        }
        return newArray;
    }

    function $map ($array, callback, result, skipUndefined) {
        var r = result || [];
        for (var rr, l = $array.length, i = 0; i < l; i++) {
            rr = callback.call($array, $array[i], i);
            if (skipUndefined && rr === undefined) { continue; }
            (r.$push || r.push).call(r, rr);
        }

        return r;
    }

    function $filter ($array, callback, result) {
        var r = result || [];

        for (var rr, l = $array.length, i = 0; i < l; i++) {
            rr = callback.call($array, $array[i], i);
            if (rr == true) {
                (r.$push || r.push).call(r, $array[i]);
            }
        }

        return r;
    }

    function $concat (array1, array2) {
        var r = new Array(array1.length + array2.length),
            idx = 0;

        [array1, array2].forEach(function (src) {
            for (var l = src.length, i = 0; i < l; i++) {
                r[idx++] = src[i];
            }
        });

        return r;
    }

    function now () {
        return new Date().getTime();
    }

    /**
     * @constructor
     * @class Armap
     * @param {string|function} key
     * @param {Array.<string>=|string=} indexes
     * @param {Array.<*>} defaults
     * @papam {Array.<Function>=} getters
     */
    function Armap(key, indexes, defaults, getters) {
        var $src,
            that = this instanceof Array && this || [];

        if (key instanceof Array) {
            $src = key;
            key = indexes;
            indexes = defaults;
            getters = arguments[4];
        }

        if (indexes && typeof(indexes) == 'string') {
            indexes = [indexes];
        }

        /** @type {string} */
        var $key = key || 'id';
        /** @type {Array.<string>} */
        var $indexes = indexes || [];
        /** @type {Array.<Function>} */
        var $getters = getters || [];
        /** @type {Array} */
        var $defaults = defaults || [];
        /** @type {Object.<string, *>} */
        var $$map = Object.create(null);
        /** @type {Object.<string, Array.<string>>} */
        var $$indexes = Object.create(null);
        /** @type {Object.<string, Object>}*/
        var $$liveLinks = {};
        var lastUpdate = 0;

        /**
         * Initiate indexes
         * @this {Armap}
         */
        var init = function init () {
            /** @type {Object.<string, Array.<string>>} */
            $$indexes = Object.create(null);

            /** Prepare namespaces for indexes */
            $indexes.forEach(function (k) {
                $$indexes[k] = Object.create(null);
            });
        }

        /**
         * key push helper
         * @this {Armap}
         * @private
         * @param {number|string} k
         * @param {number|string} key
         * @param {number|string} $id
         */
        var push2Indexes = function push2Indexes (k, key, $id) {
            if (!(key in $$indexes[k])) { $$indexes[k][key] = []; }
            $$indexes[k][key].push($id);
        }

        /**
         * remove helper
         * @private
         * @this {Armap}
         * @param {!Object} item
         * @param {boolean=} cleanup
         */
        var removeIndexes = function removeIndexes (item) {
            var self = this,
                key = $key instanceof Function ? $key.call(this, item) : item[$key];

            $indexes.forEach(function (k, i) {
                var c = item[k] || $defaults[i];

                c = $getters[i] ? $getters[i].call(self, c, item) : c;

                if (c instanceof Array) {
                    c.forEach(function (v) {
                        var a = $$indexes[k][v],
                            i = a ? a.indexOf(key) : -1;

                        i > -1 && a.splice(i, 1);

                        if (a && a.length == 0) {
                            delete $$indexes[k][v];
                        }
                    })
                } else if (c !== undefined) {
                    var a = $$indexes[k][c],
                        i = a ? a.indexOf(key) : -1;

                    i > -1 && a.splice(i, 1);

                    if (a && a.length == 0) {
                        delete $$indexes[k][c];
                    }
                }
            });
        }

        /**
         * Return IDs by aggregate indexes
         * @param {!Object} keys
         * @return {Array}
         */
        var getIDsByKeys = function getIDsByKeys (keys) {
            var ids;

            for (var key in keys) {
                var nv = [];
                if (keys[key] instanceof Array) {
                    for (var i = keys[key].length; --i >= 0;) {
                        var r = $$indexes[key][keys[key][i]];
                        if (r !== undefined) { nv = $union(nv, r); }
                    }
                } else {
                    nv = $$indexes[key] && $$indexes[key][keys[key]] || [];
                }
                ids = ids ? $intersect(ids, nv) : nv;
            }

            return ids || [];
        }

        /**
         * Return key for item
         * @this {Armap}
         * @param {Object} item
         * @return {*}
         */
        var getKey = function getKey(item) {
            return $key instanceof Function ? $key.call(this, item) : item[$key];
        }

        /**
         * Check keys against the item
         * @param {Object} keys
         * @param {Object} item
         * @return {boolean}
         */
        var checkKeys = function checkKeys(keys, item) {
            for (var k in keys) {
                var v;
                switch (typeof(keys[k])) {
                    case 'function':
                        v = keys[k].call(this, k, item);
                        break;
                    default:
                        v = keys[k];
                        break;
                }
                if (v == item[k]) { return true }
            }
            return false;
        }

        /**
         * Recreate indexes
         */
        that.$reindex = function () {
            init.call(this);

            for (var self = this, $id, item, i = this.length; --i >= 0;) {
                item = this[i];
                $id = getKey.call(this, item),
                $$map[$id] = item;

                $indexes.forEach(function (k, i) {
                    var key = item[k] != undefined ? item[k] : $defaults[i];

                    if ($getters[i]) {
                        key = $getters[i].call(self, key, item);
                    }

                    if (key instanceof Array) {
                        key.forEach(function (v) {
                            push2Indexes.call(self, k, v, $id);
                        });
                    } else if (key !== undefined) {
                        push2Indexes.call(self, k, key, $id);
                    }
                });
            }
            lastUpdate = now();
        }

        /**
         * Get item by ID
         * @param {!string} $id
         * @return {Object}
         */
        that.$item = function ($id) {
            return $$map[$id];
        }

        /**
         * Add item to array and create index
         * if an item with same key exists - item would be replaces
         * @param {!Object} item
         * @param {string=} key
         */
        that.$push = function (item, key) {
            var $id = key || getKey.call(this, item),
                self = this,
                old;

            if ($id in $$map) {
                removeIndexes.call(this, $$map[$id], true);
                var i = this.$indexOf($id);
                old = this[i];
                this[i] = $$map[$id] = item;
            } else {
                var idx = this.length;
                this.push(item);
                $$map[$id] = this[idx];
            }

            for (var k in $$liveLinks) {
                var ll = $$liveLinks[k];
                if (checkKeys(ll.keys, item)) {
                    var mapItem = ll.mapFunc && ll.mapFunc.call(null, item) || item;

                    if (ll.holder.$push) {
                        ll.holder.$push(mapItem, key);
                    } else {
                        if (old) {
                            var i = ll.holder.indexOf(old);
                            i > -1 && (ll.holder[i] = mapItem) || (ll.holder.push(mapItem));
                        } else {
                            ll.holder.push(mapItem);
                        }
                    }
                }
            }

            $indexes.forEach(function (k, i) {
                var key = item[k] != undefined ? item[k] : $defaults[i];

                if ($getters[i]) {
                    key = $getters[i].call(self, key, item);
                }

                if (key instanceof Array) {
                    key.forEach(function (v) {
                        push2Indexes.call(self, k, v, $id);
                    });
                } else if (key !== undefined) {
                    push2Indexes.call(self, k, key, $id);
                }
            });

            lastUpdate = now();
        }

        /**
         * Remove item by key
         * @param {string} key
         * @return {Object}
         */
        that.$remove = function (key) {
            var item = $$map[key];
            if (!item) { return; }

            removeIndexes.call(this, item, true);

            var i = this.indexOf(item);
            i > -1 && this.splice(i, 1);
            delete $$map[key];

            for (var k in $$liveLinks) {
                var lh = $$liveLinks[k].holder,
                    mi = $$liveLinks[k].mapFunc;

                if (lh.$push) {
                    lh.$remove(key);
                } else {
                    i = lh.indexOf(mi && mi.call(null, item) || item);
                    i > -1 && lh.splice(i, 1);
                }
            }

            lastUpdate = now();
        }

        /**
         * Remove by index
         * @param {Object.<string, string>} $index
         */
        that.$removeByIndex = function ($index) {
            var keys = getIDsByKeys.call(this, $index).slice();

            for (var i = keys.length; --i >= 0;) {
                this.$remove(keys[i]);
            };
        }

        /**
         * Concatinate source array with self
         * @param {Array} $src
         */
        that.$concat = function ($src) {
            for (var l = $src.length, i = 0; i < l; i++) {
                this.$push($src[i]);
            }
        }

        /**
         * Clear collection
         * @param {function=} callback filter values to be emptied
         */
        that.$empty = function (callback) {
            if (callback) {
                var i = 0;
                while (i < this.length) {
                    var r = callback.call(this, this[i], i),
                        key = getKey.call(this, this[i]);

                    if (r) { this.$remove(key); } else { i++; }
                }
            } else {
                this.length = 0;
                $$map = Object.create(null);
                init.call(this);
            }
            lastUpdate = now();
        }

        /**
         * return aggregated keys
         * @param {string} keyName
         * @param {string=} $value
         * @return {Array.<string>}
         */
        that.$aggregatedKeys = function (keyName, $value) {
            if (arguments.length == 2) {
                return $$indexes[keyName] && $$indexes[keyName][$value] || [];
            } else {
                var r = [],
                    v = $$indexes[keyName];

                for (var k in v) {
                    r.push(k);
                }

                return r;
            }
        }

        /**
         * return keys by aggregate key
         * @param {Object} keys
         * @param {boolean} createLiveLink
         * @return {Array.<string>}
         */
        that.$keysByAggregateKey = function (keys) {
            return getIDsByKeys.call(this, keys);
        }

        /**
         * Return values by aggregate key
         * @param {Object} keys
         * @param {Array|Armap} responseType
         * @param {boolean} createLiveLink
         * @return {Array.<Object>}
         */
        that.$valuesByAggregateKeys = function (keys, responseType, createLiveLink, mapFunc) {
            var self = this,
                r = responseType || new Armap($key, $indexes, $defaults, $getters);

            if (createLiveLink) {
                var id = new Date().getTime();
                $$liveLinks[id] = {
                    keys: keys,
                    holder: r,
                    mapFunc: mapFunc
                }
                r.$release = (function () {
                    return function () {
                        if (!$$liveLinks[id]) { return }
                        $$liveLinks[id].holder = null;
                        $$liveLinks[id].mapFunc = null;
                        delete $$liveLinks[id];
                    }
                })();
            }

            this.$keysByAggregateKey(keys).forEach(function (v) {
                (r.$push || r.push).call(r, mapFunc && mapFunc.call(null, $$map[v]) || $$map[v]);
            });

            return r;
        }

        /**
         * @param {string} $id
         * @return {Object}
         */
        that.$indexOf = function ($id) {
            return this.indexOf($$map[$id]);
        }

        /**
         * Hash list
         * @return {Object.<string, Object>}
         */
        that.$hash = function () {
            return $$map;
        }

        /**
         * Mapping each element and return in requested form
         * @param {function} callback
         * @param {Armap|Array=} resultType
         * @return {Armap|Array}
         */
        that.$map = function (callback, resultType) {
            return $map(this, callback, resultType || Armap($key, $indexes, $defaults, $getters), true);
        }

        /**
         * Filter each element against callback and return in requested form
         * @param {function} callback
         * @param {Armap|Array=} resultType
         * @return {Armap|Array}
         */
        that.$filter = function (callback, resultType) {
            return $filter(this, callback, resultType || Armap($key, $indexes, $defaults, $getters));
        }

        that.lastUpdate = function () { return lastUpdate }

        init.call(that);

        /** @type {number} */
        lastUpdate = now();

        if ($src) { that.$concat($src); }

        return that;
    }

    Armap.prototype = new Array;
    Armap.prototype.constructor = Armap;

    return Armap;

});
