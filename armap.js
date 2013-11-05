(function () {
    'use strict';

    var $slice = Array.prototype.slice;

    function $intersect (array1, array2) {
        var r = [];
        for (var l = array1.length, i = 0; i < l; i++) {
            if (array2.indexOf(array1[i]) > -1 && r.indexOf(array1[i]) == -1) { r.push(array1[i]); }
        }
        return r;
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

    /**
     * @constructor
     * @class Armap
     * @param {string} key
     * @param {Array.<string>=} indexes
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

        /** @type {string} */
        this.$key = key || 'id';
        /** @type {Array.<string>} */
        this.$indexes = indexes || [];
        /** @type {Array.<Function>} */
        this.$getters = getters || [];
        /** @type {Array} */
        this.$defaults = defaults || [];
        /** @type {Object.<string, *>} */
        this.$$map = Object.create(null);

        init.call(this);

        /** @type {number} */
        this.lastUpdate = now();

        if ($src) { this.$concat($src); }
    }

    Armap.prototype = new Array;
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
        var p = this.$$indexes = Object.create(null);

        /** Prepare namespaces for indexes */
        this.$indexes.forEach(function (k) {
            p[k] = Object.create(null);
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
        if (!(key in this.$$indexes[k])) { this.$$indexes[k][key] = []; }
        this.$$indexes[k][key].push($id);
    }

    /**
     * remove helper
     * @private
     * @this {Armap}
     * @param {!Object} item
     * @param {boolean=} cleanup
     */
    function removeIndexes (item) {
        var self = this,
            key = item[this.$key];

        this.$indexes.forEach(function (k, i) {
            var c = item[k] || self.$defaults[i];

            c = self.$getters[i] ? self.$getters[i].call(this, c) : c;

            if (c instanceof Array) {
                c.forEach(function (v) {
                    var a = self.$$indexes[k][v],
                        i = a ? a.indexOf(key) : -1;
                    i > -1 && a.splice(i, 1);

                    if (self.$$indexes[k][v].length == 0) {
                        delete self.$$indexes[k][v];
                    }
                })
            } else if (c !== undefined) {
                var a = self.$$indexes[k][c],
                    i = a ? a.indexOf(key) : -1;
                i > -1 && a.splice(i, 1);

                if (self.$$indexes[k][c].length == 0) {
                    delete self.$$indexes[k][c];
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
                    var r = this.$$indexes[key][keys[key][i]];
                    if (r !== undefined) { nv = $union(nv, r); }
                }
            } else {
                nv = this.$$indexes[key][keys[key]] || [];
            }
            ids = ids ? $intersect(ids, nv) : nv;
        }

        return ids || [];
    }

    /**
     * Recreate indexes
     */
    Armap.prototype.$reindex = function () {
        init.call(this);

        for (var self = this, $id, item, i = this.length; --i >= 0;) {
            item = this[i];
            $id = item[this.$key];
            this.$$map[$id] = item;

            this.$indexes.forEach(function (k, i) {
                var key = item[k] != undefined ? item[k] : self.$defaults[i];

                if (self.$getters[i]) {
                    key = self.$getters[i].call(self, key, item);
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
        this.lastUpdate = now();
    }

    /**
     * Get item by ID
     * @param {!string} $id
     * @return {Object}
     */
    Armap.prototype.$item = function ($id) {
        return this.$$map[$id];
    }

    /**
     * Add item to array and create index
     * if an item with same key exists - item would be replaces
     * @param {!Object} item
     * @param {string=} key
     */
    Armap.prototype.$push = function (item, key) {
        var $id = key || item[this.$key],
            self = this;

        if ($id in this.$$map) {
            removeIndexes.call(this, this.$$map[$id], true);
            var i = this.$indexOf($id);
            this[i] = this.$$map[$id] = item;
        } else {
            var idx = this.length;
            this.push(item);
            this.$$map[$id] = this[idx];
        }

        this.$indexes.forEach(function (k, i) {
            var key = item[k] != undefined ? item[k] : self.$defaults[i];

            if (self.$getters[i]) {
                key = self.$getters[i].call(self, key, item);
            }

            if (key instanceof Array) {
                key.forEach(function (v) {
                    push2Indexes.call(self, k, v, $id);
                });
            } else if (key !== undefined) {
                push2Indexes.call(self, k, key, $id);
            }
        });

        this.lastUpdate = now();
    }

    /**
     * Remove item by key
     * @param {string} key
     * @return {Object}
     */
    Armap.prototype.$remove = function (key) {
        var item = this.$$map[key];
        if (!item) { return; }

        removeIndexes.call(this, item, true);

        var i = this.indexOf(item);
        i > -1 && this.splice(i, 1);
        delete this.$$map[key];

        this.lastUpdate = now();
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
     */
    Armap.prototype.$empty = function () {
        this.length = 0;
        this.$$map = Object.create(null);
        init.call(this);
        this.lastUpdate = now();
    }

    /**
     * return aggregated keys
     * @param {string} keyName
     * @param {string=} $value
     * @return {Array.<string>}
     */
    Armap.prototype.$aggregatedKeys = function (keyName, $value) {
        if (arguments.length == 2) {
            return this.$$indexes[keyName] && this.$$indexes[keyName][$value] || [];
        } else {
            var r = [],
                v = this.$$indexes[keyName];

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
        var self = this,
            r = responseType || new Armap(this.$key, this.$indexes, this.$defaults, this.$getters);

        this.$keysByAggregateKey(keys).forEach(function (v) {
            (r instanceof Armap && r.$push || r.push).call(r, self.$$map[v]);
        });

        return r;
    }

    /**
     * @param {string} $id
     * @return {Object}
     */
    Armap.prototype.$indexOf = function ($id) {
        return this.indexOf(this.$$map[$id]);
    }

    /**
     * Hash list
     * @return {Object.<string, Object>}
     */
    Armap.prototype.$hash = function () {
        return this.$$map;
    }

    /**
     * Mapping each element and return in requested form
     * @param {function} callback
     * @param {Armap|Array=} resultType
     * @return {Armap|Array}
     */
    Armap.prototype.$map = function (callback, resultType) {
        return $map(this, callback, resultType || new Armap(this.$key, this.$indexes, this.$defaults, this.$getters), true);
    }

    /**
     * Filter each element against callback and return in requested form
     * @param {function} callback
     * @param {Armap|Array=} resultType
     * @return {Armap|Array}
     */
    Armap.prototype.$filter = function (callback, resultType) {
        return $filter(this, callback, resultType || new Armap(this.$key, this.$indexes, this.$defaults, this.$getters));
    }

    // export to module/window
    if (typeof module === 'object' && module && typeof module.exports === 'object') {
        module.exports = Armap;
    } else {
        if (typeof define === 'function' && define.amd) {
            define('armap', [], function () { return Armap; } );
        }
    }

    if (typeof window === 'object' && typeof window.document === 'object' ) {
        window['Armap'] = Armap;
    }
})();
