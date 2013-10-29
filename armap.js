(function () {
    function now () {
        return new Date().getTime();
    }

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

    function $map ($array, callback, skipUndefined) {
        var r = [];
        for (var rr, l = $array.length, i = 0; i < l; i++) {
            rr = callback.apply($array, $array[i], i);
            if (skipUndefined && rr === undefined) { continue; }
            r[i] = rr;
        }
        return r;
    }

    /**
     * @class Armap
     * @constructor
     * @extend {Array}
     */
    function Armap (initialSize, defaultKey) {
        var tmp;
        this.$map = {};

        if (arguments.length) {
            switch (true) {
                case typeof(initialSize) == 'string':
                    defaultKey = initialSize;
                    initialSize = undefined;
                    break;
                case initialSize instanceof Array:
                    tmp = initialSize;
                    initialSize = 0;
                    break;
            }
        }

        this.$key = defaultKey || 'id';

        if (initialSize) {
            this.length = initialSize;
        }

        tmp && this.$add(tmp);
        this.lastUpdate = now()
    }

    /**
     * Array decorator
     * @param {array.<Object>} src
     * @return {Armap}
     */
    Armap.$decorate = function (src, key) {
        var ar = new Armap(src.length, key);

        for (var i = src.length; --i >= 0;) {
            ar.$put(i, src[i]);
        }

        ar.lastUpdate = now()

        return ar;
    }

    /**
     * Concatinate 2 armaps
     * @param {Armap|Array} src1
     * @param {Armap|Array} src2
     * @param {string=} key1
     * @return {Armap}
     */
    Armap.$concat = function (src1, src2, key1) {
        var r = new Armap(src1.length + src2.length, key1),
            idx = 0;

        for (var l = src1.length, i = 0; i < l; i++) {
            r.$put(idx++, src1[i]);
        }

        for (var l = src2.length, i = 0; i < l; i++) {
            r.$put(idx++, src2[i]);
        }

        r.lastUpdate = now();

        return r;
    }

    Armap.prototype = [];
    Armap.prototype.constructor = Armap;

    window.Armap = Armap;

    (function (proto) {
        /**
         * @param {Object} item
         */
        proto.$push = function (item, key) {
            var id = key === undefined ? item[this.$key] : key;

            DEBUG && console.assert(id);

            if (id in this.$map) {
                var i = this.$indexOf(id);
                this[i] = this.$map[id] = item;
            } else {
                var idx = this.length;
                this.push(item);
                this.$map[id] = this[idx];
            }
            this.lastUpdate = now()
        }

        /**
         * @param {number} idx
         * @param {Object} item
         */
        proto.$put = function (idx, item) {
            if (this[idx]) {
                var id = this[idx][this.$key],
                    nid = item[this.$key];

                delete this.$map[id];

                this[idx] = this.$map[nid] = item;
            } else {
                this[idx] = this.$map[item[this.$key]] = item;
            }
            this.lastUpdate = now()
        }

        /**
         * @param {number} index
         * @param {number=} howMany
         * @return {array.<Object>}
         */
        proto.$splice = function (index, howMany) {
            var r = this.splice(index, howMany),
                self = this;

            r.forEach(function (d) {
                delete self.$map[d[self.$key]];
            });

            this.lastUpdate = now()

            return r;
        }

        /**
         * @return {Object}
         */
        proto.$shift = function () {
            var r = this.shift();
            delete this.$map[r[this.$key]];
            this.lastUpdate = now();
            return r;
        }

        /**
         * @param {string} id
         */
        proto.$remove = function (id) {
            var i = this.indexOf(this.$map[id]);
            i > -1 && this.splice(i, 1);
            // this.remove(id);
            delete this.$map[id];
            this.lastUpdate = now();
        }

        /**
         * @param {string} id
         * @return {Object}
         */
        proto.$indexOf = function (id) {
            return this.indexOf(this.$map[id]);
        }

        /**
         * return list of keys
         * @return {Array.<string>}
         */
        proto.$keys = function () {
            var r = [],
                self = this;

            this.forEach(function (d) {
                r.push(d[self.$key]);
            })

            return r;
        }

        /**
         * return hashed by ids list of values
         * @return {Object.<string, Object>}
         */
        proto.$hashed = function () {
            return this.$map;
        }

        /**
         * @return {Object}
         */
        proto.$item = function (id) {
            return this.$map[id];
        }

        /**
         * concatinate array
         * @param {Armap} src
         */
        proto.$add = function (src) {
            var idx = this.length,
                l = this.length = this.length + src.length,
                i = 0;

            while (idx < l) {
                this.$put(idx++, src[i++]);
            }
            this.lastUpdate = now();
        }

        /**
         * empty array
         */
        proto.$empty = function () {
            this.length = 0;
            this.$map = {};
            this.lastUpdate = now();
        }
    })(Armap.prototype);

    /**
     * @class Armap2k
     * @constructor
     * @extends {Armap}
     * @param {(number|string)=} initialSize
     * @param {string=} defaultKey
     * @param {string=} defaultAggregateKey
     */
    function Armap2k (initialSize, defaultKey, defaultAggregateKey, defaults) {
        Armap.prototype.constructor.call(this, initialSize, defaultKey);

        if (typeof(initialSize) != 'number') {
            defaults = defaultAggregateKey;
            defaultAggregateKey = defaultKey;
            defaultKey = initialSize;
        }

        this.$aggregateKey = defaultAggregateKey;
        this.$defaults = defaults;
        this.$2dmap = {};
    }

    Armap2k.prototype = new Armap;
    Armap2k.prototype.constructor = Armap2k;

    window.Armap2k = Armap2k;

    (function (proto) {

        /**
         * @override
         * @param {Object} item
         * @param {string} key2 aggregate key
         * @param {string} key1 base key
         */
        proto.$push = function (item, key2, key1) {
            var id = key1 === undefined ? item[this.$key] : key1,
                aid = key2 === undefined ? item[this.$aggregateKey] || this.$defaults : key2;

            DEBUG && console.assert(id !== undefined, 'item id');
            DEBUG && console.assert(aid !== undefined, 'iteam aid');

            if (!(aid in this.$2dmap)) {
                this.$2dmap[aid] = [];
            }

            if (id in this.$map) {
                var a = this.$2dmap[this.$map[id][this.$aggregateKey]],
                    i = a.indexOf(id);
                i > -1 && (a.splice(i, 1));
                // this.$2dmap[this.$map[id][this.$aggregateKey]].remove(id);
            }

            this.$map[id] = item;
            this.$2dmap[aid].push(id);

            this.push(item);
            this.lastUpdate = now();
        }

        /**
         * remove helper
         * @override
         * @this {Armap2k}
         * @param {string} key
         * @param {string} aggregateKey
         * @param {boolean=} cleanup
         */
        function remove2DKey (key, aggregateKey, cleanup) {
            // var idx = this.$2dmap[aggregateKey].indexOf(key);
            // this.$2dmap[aggregateKey].remove(key);//splice(idx, 1);
            var a = this.$2dmap[aggregateKey],
                i = a.indexOf(key);
            i > -1 && a.splice(i, 1);

            if (cleanup && !this.$2dmap[aggregateKey].length) {
                delete this.$2dmap[aggregateKey];
            }
        }

        /**
         * @override
         * @param {number} index
         * @param {number=} howMany
         * @return {Array}
         */
        proto.$splice = function (index, howMany) {
            var r = this.splice(index, howMany),
                self = this;

            r.forEach(function (d) {
                delete self.$map[d[self.$key]];
                remove2DKey.call(self, d[self.$key], d[self.$aggregateKey], true);
            });

            this.lastUpdate = now();
            return r;
        }

        /**
         * @override
         * @return {Object}
         */
        proto.$shift = function () {
            var item = Armap.prototype.$shift.call(this);
            remove2DKey.call(this, item[this.$key], item[this.$aggregateKey], true);
            this.lastUpdate = now();
            return item;
        }

        /**
         * @override
         * @param {string} id
         */
        proto.$remove = function (id) {
            var item = this.$map[id];
            if (!item) { return; }
            remove2DKey.call(this, id, item[this.$aggregateKey], true);
            Armap.prototype.$remove.call(this, id);
        }

        /**
         * @override
         * @param {number} idx
         * @param {Object} item
         */
        proto.$put = function (idx, item) {
            Armap.prototype.$put.call(this, idx, item);
            var aid = item[this.$aggregateKey],
                id = item[this.$key];

            this.$2dmap[aid].indexOf(id) == -1 && this.$2dmap[aid].push(id);
        }

        /**
         * Remove items by aggregateKey
         * @param {string} key
         */
        proto.$removeByAggregateKey = function (key) {
            var ids = this.$2dmap[key],
                self = this;

            (ids || []).forEach(function (d) {
                self.$remove(d);
            });

            delete this.$2dmap[key];
        }

        /**
         * hashed by aggregate key
         * @param {string} id
         * @return {Object.<string, Object>}
         */
        proto.$hashedByAggregate = function (id) {
            var r = {}, self = this;

            (this.$2dmap[id] || []).forEach(function (key) {
                r[key] = self.$map[key];
            });

            return r;
        }

        /**
         * return keys by aggregate key
         * @param {string} key
         * @return {Array.<string>}
         */
        proto.$keysByAggregateKey = function (key) {
            return this.$2dmap[key] || []
        }

        /**
         * Return values by aggregate key
         * @param {string} key
         * @return {Array.<Object>}
         */
        proto.$valuesByAggregateKeys = function (key) {
            var self = this,
                r = new Armap;
            this.$keysByAggregateKey(key).forEach(function (p) {
                r.$push(self.$map[p]);
            });
            return r;
        }

        /**
         * Return aggregated keys
         * @param {string=} key
         * @return {Array}
         */
        proto.$aggregatedKeys = function (key) {
            if (key) {
                return this.$2dmap[key] || []
            } else {
                var r = [];
                for (var i in this.$2dmap) {
                    r.push(i);
                }
                return r;
            }
        }

        /**
         * Map values
         * @param {Function} callback
         * @param {Armap=} returnType
         * @return {Array|Armap}
         */
        proto.$map = function (callback, returnType) {
            var r = returnType || [];

            for (var i = this.length; --i >= 0;) {
                var s = callback.call(this, this[i], i, this);
                r instanceof Armap && r.$push(s) || r.push(s);
            }

            return r;
        }

        /**
         * Empty values
         * @override
         */
        proto.$empty = function () {
            Armap.prototype.$empty.call(this);
            this.$2dmap = {};
        }
    })(Armap2k.prototype);

    /**
     * @class Armap3k
     * @constructor
     * @extends {Armap}
     * @param {!string} defaultKey
     * @param {!Array} keys
     */
    function Armap3k (defaultKey, keys, defaults, getters) {
        Armap.prototype.constructor.call(this, undefined, defaultKey);

        this.$keys = keys;
        this.$defaults = defaults || [];
        this.$getters = getters || [];

        var p = this.$3dmap = {};
        DEBUG && (console.assert(keys instanceof Array));

        // initiate map namespace
        keys.forEach(function (k) {
            p[k] = {};
        });
    }

    Armap3k.prototype = new Armap;
    Armap3k.prototype.constructor = Armap3k;

    window.Armap3k = Armap3k;

    (function (proto) {

        /**
         * key push helper
         * @this {Armap3k}
         * @private
         * @param {number|string} k
         * @param {number|string} key
         * @param {number|string} id
         */
        function pushId2Key (k, key, id) {
            if (!(key in this.$3dmap[k])) { this.$3dmap[k][key] = []; }
            this.$3dmap[k][key].push(id);
        }

        /**
         * @override
         * @param {Object} item
         */
        proto.$push = function (item) {
            var id = item[this.$key],
                self = this;

            if (id && id in this.$map) {
                remove3DKey.call(this, this.$map[id], true);
            }

            Armap.prototype.$push.call(this, item);

            this.$keys.forEach(function (k, i) {
                var key = item[k] || self.$defaults[i];

                if (self.$getters[i]) {
                    key = self.$getters[i].call(self, key, item);
                }

                if (key instanceof Array) {
                    key.forEach(function (v) {
                        pushId2Key.call(self, k, v, id);
                    });
                } else if (key !== undefined) {
                    pushId2Key.call(self, k, key, id);
                }
            });
            this.lastUpdate = now();
        }

        /**
         * remove helper
         * @private
         * @this {Armap3k}
         * @param {!Object} item
         * @param {boolean=} cleanup
         */
        function remove3DKey (item, cleanup) {
            var self = this,
                key = item[this.$key];

            this.$keys.forEach(function (k, i) {
                var c = item[k] || self.$defaults[i];

                c = self.$getters[i] ? self.$getters[i].call(this, c) : c;

                if (c instanceof Array) {
                    c.forEach(function (v) {
                        //self.$3dmap[k][v] && self.$3dmap[k][v].remove(key);
                        var a = self.$3dmap[k][v],
                            i = a ? a.indexOf(key) : -1;
                        i > -1 && a.splice(i, 1);
                    })
                } else if (c !== undefined) {
                    // self.$3dmap[k][c] && self.$3dmap[k][c].remove(key);
                    var a = self.$3dmap[k][c],
                        i = a ? a.indexOf(key) : -1;
                    i > -1 && a.splice(i, 1);
                }
            });
        }

        /**
         * @override
         * @param {number} index
         * @param {number=} howMany
         * @return {Array}
         */
        proto.$splice = function (index, howMany) {
            var r = this.splice(index, howMany),
                self = this;

            r.forEach(function (d) {
                delete self.$map[d[self.$key]];
                remove3DKey.call(self, d, true);
            });

            this.lastUpdate = now();
            return r;
        }

        /**
         * @override
         * @return {Object}
         */
        proto.$shift = function () {
            var item = Armap.prototype.$shift.call(this);
            remove2DKey.call(this, item, true);
            this.lastUpdate = now();
            return item;
        }

        /**
         * @override
         * @param {string} id
         */
        proto.$remove = function (id) {
            var item = this.$map[id];
            if (!item) { return; }
            remove3DKey.call(this, item, true);
            Armap.prototype.$remove.call(this, id);
        }

        /**
         * @override
         * @param {number} idx
         * @param {Object} item
         */
        proto.$put = function (idx, item) {
            Armap.prototype.$put.call(this, idx, item);
            var id = item[this.$key],
                self = this;

            this.$keys.forEach(function (k) {
                var key = item[k];
                if (!(key in self.$3dmap[k])) {
                    self.$3dmap[k][key] = [];
                }
                self.$3dmap[k][key].push(id);
            });
        }

        /**
         * Remove helper
         * @private
         * @this {Armap3k}
         * @param {string} keyName
         * @param {number|string} key
         */
        function removeByAggregateKey(keyName, key) {
            var ids = this.$3dmap[keyName][key],
                self = this;

            (ids || []).forEach(function (d) {
                self.$remove(d);
            });

            delete this.$3dmap[keyName][key];
        }

        /**
         * Remove items by aggregateKey
         * @param {!string} keyName
         * @param {number|string|Array.<{number|string}>} key
         */
        proto.$removeByAggregateKey = function (keyName, key) {
            if (key instanceof Array) {
                var self = this;
                key.forEach(function (v) {
                    removeByAggregateKey.call(self, keyName, v);
                });
            } else {
                removeByAggregateKey.call(this, keyName, key);
            }
            this.lastUpdate = now();
        }

        /**
         * Return IDs by aggregate keys
         * @param {!Object} keys
         * @return {Array}
         */
        function getIDsByKeys (keys) {
            var ids;

            for (var key in keys) {
                var nv = [];
                if (keys[key] instanceof Array) {
                    for (var i = keys[key].length; --i >= 0;) {
                        var r = this.$3dmap[key][keys[key][i]];
                        if (r !== undefined) { nv = $union(nv, r); }
                    }
                } else {
                    nv = this.$3dmap[key][keys[key]] || [];
                }
                ids = ids ? $intersect(ids, nv) : nv;
            }

            return ids || [];
        }

        /**
         * hashed by aggregate key
         * @param {!Object} keys
         * @return {Object.<string, Object>}
         */
        proto.$hashedByAggregate = function (keys) {
            var r = {}, self = this,
                ids = getIDsByKeys.call(this, keys);

            ids.forEach(function (key) {
                r[key] = self.$map[key];
            });

            return r;
        }

        /**
         * return keys by aggregate key
         * @param {Object} keys
         * @return {Array.<string>}
         */
        proto.$keysByAggregateKey = function (keys) {
            return getIDsByKeys.call(this, keys);
        }

        /**
         * Return values by aggregate key
         * @param {Object} keys
         * @return {Array.<Object>}
         */
        proto.$valuesByAggregateKeys = function (keys, responseType) {
            var self = this,
                r = responseType || new Armap(this.$defaultKey);

            this.$keysByAggregateKey(keys).forEach(function (v) {
                r.$push(self.$map[v]);
            });

            return r;
        }

        /**
         * return aggregated keys
         * @param {string} keyName
         * @param {string=} $value
         * @return {Array.<string>}
         */
        proto.$aggregatedKeys = function (keyName, $value) {
            if (arguments.length == 2) {
                return this.$3dmap[keyName] && this.$3dmap[keyName][$value] || [];
            } else {
                var r = [],
                    v = this.$3dmap[keyName];

                for (var k in v) {
                    r.push(k);
                }

                return r;
            }
        }

        /**
         * Empty values
         * @override
         */
        proto.$empty = function () {
            Armap.prototype.$empty.call(this);
            this.$3dmap = {};
            this.lastUpdate = now();
        }
    })(Armap3k.prototype);
})();
