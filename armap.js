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
            (r instanceof Armap && r.$push || r.push).call(r, rr);
        }

        return r;
    }

    function $filter ($array, callback, result) {
        var r = result || [];

        for (var rr, l = $array.length, i = 0; i < l; i++) {
            rr = callback.call($array, $array[i], i);
            if (rr == true) {
                (r instanceof Armap && r.$push || r.push).call(r, $array[i]);
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

    var Armap = (function () {

        /** @type {string} */
        var $key;
        /** @type {Array.<string>} */
        var $indexes;
        /** @type {Object.<string, Array.<string>>} */
        var $$indexes;
        /** @type {Array.<Function>} */
        var $getters;
        /** @type {Array} */
        var $defaults;
        /** @type {Object.<string, *>} */
        var $$map;
        /** @type {number} */
        var lastUpdate;

        /**
         * @constructor
         * @class Armap
         * @param {string|function} key
         * @param {Array.<string>=|string=} indexes
         * @param {Array.<*>} defaults
         * @papam {Array.<Function>=} getters
         */
        function Armap(key, indexes, defaults, getters) {
            var $src;

            if (key instanceof Array) {
                $src = key;
                key = indexes;
                indexes = defaults;
                getters = arguments[4];
            }

            if (indexes && typeof(indexes) == 'string') {
                indexes = [indexes];
            }

            $key = key || 'id';
            $indexes = indexes || [];
            $getters = getters || [];
            $defaults = defaults || [];
            $$map = Object.create(null);

            init.call(this);

            lastUpdate = now();

            if ($src) { this.$concat($src); }
        }

        Armap.prototype = Object.create(Array.prototype);
        Armap.prototype.constructor = Armap;

        function now () {
            return new Date().getTime();
        }

        /**
         * Initiate indexes
         * @this {Armap}
         */
        function init () {
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
        function push2Indexes (k, key, $id) {
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
        function removeIndexes (item) {
            var key = $key instanceof Function ? $key.call(this, item) : item[$key];

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
        function getIDsByKeys (keys) {
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
         * Recreate indexes
         */
        Armap.prototype.$reindex = function () {
            init();

            for (var self = this, $id, item, i = this.length; --i >= 0;) {
                item = this[i];
                $id = $key instanceof Function ? $key.call(this, item) : item[$key];
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
        Armap.prototype.$item = function ($id) {
            return $$map[$id];
        }

        /**
         * Add item to array and create index
         * if an item with same key exists - item would be replaces
         * @param {!Object} item
         * @param {string=} key
         */
        Armap.prototype.$push = function (item, key) {
            var $id = key || ($key instanceof Function ? $key.call(this, item) : item[$key]),
                self = this;

            if ($id in $$map) {
                removeIndexes.call(this, $$map[$id], true);
                var i = this.$indexOf($id);
                this[i] = $$map[$id] = item;
            } else {
                var idx = this.length;
                this.push(item);
                $$map[$id] = this[idx];
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
        Armap.prototype.$remove = function (key) {
            var item = $$map[key];
            if (!item) { return; }

            removeIndexes.call(this, item, true);

            var i = this.indexOf(item);
            i > -1 && this.splice(i, 1);
            delete $$map[key];

            lastUpdate = now();
        }

        /**
         * Remove by index
         * @param {Object.<string, string>} $index
         */
        Armap.prototype.$removeByIndex = function ($index) {
            var keys = getIDsByKeys.call(this, $index).slice();

            for (var i = keys.length; --i >= 0;) {
                this.$remove(keys[i]);
            };
        }

        /**
         * Concatinate source array with self
         * @param {Array} $src
         */
        Armap.prototype.$concat = function ($src) {
            for (var l = $src.length, i = 0; i < l; i++) {
                this.$push($src[i]);
            }
        }

        /**
         * Clear collection
         * @param {function=} callback filter values to be emptied
         */
        Armap.prototype.$empty = function (callback) {
            if (callback) {
                var i = 0;
                while (i < this.length) {
                    var r = callback.call(this, this[i], i),
                        key = this[i][$key instanceof Function ? $key.call(this, this[i]) : $key];

                    if (r) { this.$remove(key); } else { i++; }
                }
            } else {
                this.length = 0;
                $$map = Object.create(null);
                init();
            }
            lastUpdate = now();
        }

        /**
         * return aggregated keys
         * @param {string} keyName
         * @param {string=} $value
         * @return {Array.<string>}
         */
        Armap.prototype.$aggregatedKeys = function (keyName, $value) {
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
         * @return {Array.<string>}
         */
        Armap.prototype.$keysByAggregateKey = function (keys) {
            return getIDsByKeys.call(this, keys);
        }

        /**
         * Return values by aggregate key
         * @param {Object} keys
         * @return {Array.<Object>}
         */
        Armap.prototype.$valuesByAggregateKeys = function (keys, responseType) {
            var r = responseType || new Armap($key, $indexes, $defaults, $getters);

            this.$keysByAggregateKey(keys).forEach(function (v) {
                (r instanceof Armap && r.$push || r.push).call(r, $$map[v]);
            });

            return r;
        }

        /**
         * @param {string} $id
         * @return {Object}
         */
        Armap.prototype.$indexOf = function ($id) {
            return this.indexOf($$map[$id]);
        }

        /**
         * Hash list
         * @return {Object.<string, Object>}
         */
        Armap.prototype.$hash = function () {
            return $$map;
        }

        /**
         * Mapping each element and return in requested form
         * @param {function} callback
         * @param {Armap|Array=} resultType
         * @return {Armap|Array}
         */
        Armap.prototype.$map = function (callback, resultType) {
            return $map(this, callback, resultType || new Armap($key, $indexes, $defaults, $getters), true);
        }

        /**
         * Filter each element against callback and return in requested form
         * @param {function} callback
         * @param {Armap|Array=} resultType
         * @return {Armap|Array}
         */
        Armap.prototype.$filter = function (callback, resultType) {
            return $filter(this, callback, resultType || new Armap($key, $indexes, $defaults, $getters));
        }

        Armap.prototype.$lastUpdate = function () {
            return lastUpdate;
        }

        Object.defineProperty(Armap, 'length', { enumerable: false });

        return Armap;
    })();

    return Armap;

});
