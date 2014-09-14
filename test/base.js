var should  = require('chai').should(),
    assert  = require('chai').assert;

var Armap = require('../armap.js');

describe('armap.js', function () {

    describe('Base functionality', function () {
        var armap;

        before(function () {
             armap = new Armap('id');
        });

        it('Should add values to array', function () {
            for (var i = 0; i < 10; i++) {
                armap.$push({id: i, value: i});
            }

            assert.equal(armap.length, 10);
            assert.deepEqual(armap[0], {id: 0, value: 0});
        });

        it('Should return value by key', function () {
            assert.deepEqual(armap.$item(0), {id: 0, value: 0});
            assert.deepEqual(armap.$item(1), {id: 1, value: 1});
            assert.deepEqual(armap.$item(2), {id: 2, value: 2});
            assert.deepEqual(armap.$item(3), {id: 3, value: 3});
            assert.deepEqual(armap.$item(4), {id: 4, value: 4});
            assert.deepEqual(armap.$item(5), {id: 5, value: 5});
            assert.deepEqual(armap.$item(6), {id: 6, value: 6});
            assert.deepEqual(armap.$item(7), {id: 7, value: 7});
            assert.deepEqual(armap.$item(8), {id: 8, value: 8});
            assert.deepEqual(armap.$item(9), {id: 9, value: 9});
            assert.equal(armap.$item(10), undefined);
        });

        it('Should return index of item', function () {
            assert.equal(armap.$indexOf(5), 5);
        })

        it('Should remove item by key', function () {
            armap.$remove(1);
            armap.$remove(3);
            armap.$remove(5);
            armap.$remove(7);
            armap.$remove(9);
            assert.deepEqual(armap.$item(0), {id: 0, value: 0});
            assert.equal(armap.$item(1), undefined);
            assert.deepEqual(armap.$item(2), {id: 2, value: 2});
            assert.equal(armap.$item(3), undefined);
            assert.deepEqual(armap.$item(4), {id: 4, value: 4});
            assert.equal(armap.$item(5), undefined);
            assert.deepEqual(armap.$item(6), {id: 6, value: 6});
            assert.equal(armap.$item(7), undefined);
            assert.deepEqual(armap.$item(8), {id: 8, value: 8});
            assert.equal(armap.$item(9), undefined);
            assert.equal(armap.length, 5);
        });

        it('Should remove all but filter', function () {
            armap.$empty(function (item, idx) {
                return [2, 4].indexOf(item.id) == -1;
            });

            assert.equal(armap.length, 2);
            assert.deepEqual(armap.$item(2), {id: 2, value: 2});
            assert.deepEqual(armap.$item(4), {id: 4, value: 4});
        })

        it('Should update exists item', function () {
            armap.$push({id: 2, value: 22});
            assert.deepEqual(armap.$item(2), {id: 2, value: 22});
        })

        it('Should empty collection', function () {
            armap.$empty();
            assert.equal(armap.length, 0);
            assert.deepEqual(armap.$hash(), {});
            // assert.deepEqual(armap.$$indexes, {});
        })

    });

    describe('Indexes processing', function () {
        var armap;

        before(function () {
            armap = new Armap('id', ['index1', 'index2']);

            for (var i = 0; i < 50; i ++) {
                armap.$push({id: i, index1: i % 5, index2: i % 10});
            }
            // console.log(armap);
        });

        it('Should return indexes', function () {
            // console.log(armap.$aggregatedKeys('index2'))
            assert.deepEqual(armap.$aggregatedKeys('index1'), ['0', '1', '2', '3', '4']);
            assert.deepEqual(armap.$aggregatedKeys('index2'), ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
        });

        it('Should return keys by index', function () {
            armap.$empty();
            armap.$push({id: 1, index1: 1, index2: 1});
            armap.$push({id: 2, index1: 1, index2: 2});
            armap.$push({id: 3, index1: 1, index2: 1});
            armap.$push({id: 4, index1: 1, index2: 2});
            armap.$push({id: 5, index1: 1, index2: 1});
            armap.$push({id: 6, index1: 2, index2: 2});
            armap.$push({id: 7, index1: 2, index2: 1});
            armap.$push({id: 8, index1: 2, index2: 2});
            armap.$push({id: 9, index1: 2, index2: 1});
            armap.$push({id: 10, index1: 2, index2: 2});

            assert.deepEqual(armap.$keysByAggregateKey({index1: 1, index2: 1}), [1, 3, 5]);
            assert.deepEqual(armap.$keysByAggregateKey({index1: 2, index2: 1}), [7, 9]);
        });

        it('Should return values by index as regular array', function () {
            assert.deepEqual(armap.$valuesByAggregateKeys({index1: 1, index2: 1}, []), [{id: 1, index1: 1, index2: 1}, {id: 3, index1: 1, index2: 1}, {id: 5, index1: 1, index2: 1}]);
            assert.deepEqual(armap.$valuesByAggregateKeys({index1: 2, index2: 1}, []), [{id: 7, index1: 2, index2: 1}, {id: 9, index1: 2, index2: 1}]);
        });

        it('Should clear index after removing all records with such index', function () {
            [6, 7, 8, 9, 10].forEach(function (id) {
                armap.$remove(id);
            });

            assert.equal(armap.$aggregatedKeys('index1').indexOf('2') == -1, true);
        })
    });

    describe('Advanced functionality', function () {
        var armap;

        before(function () {
            armap = new Armap(
                'id',
                ['index1', 'index2'],
                ['b'], // defaults
                [undefined, function (key, item) { // getters
                    return item.id % 2 ? 'e' : ['d', 'c'];
                }]
            );
            armap.$push({id: 1, index1: 1});
            armap.$push({id: 2});
            armap.$push({id: 3, index1: 1});
            armap.$push({id: 4});
            armap.$push({id: 5, index1: 1});
            armap.$push({id: 6});
            armap.$push({id: 7, index1: 1});
            armap.$push({id: 8});
            armap.$push({id: 9, index1: 1});
            armap.$push({id: 10});
        });

        it('Should provide default index value', function () {
            assert.equal(armap.$keysByAggregateKey({index1: 1}).length, 5);
            assert.equal(armap.$keysByAggregateKey({index1: 'b'}).length, 5);
            assert.deepEqual(armap.$keysByAggregateKey({index1: 1}), [1, 3, 5, 7, 9]);
            assert.deepEqual(armap.$keysByAggregateKey({index1: 'b'}), [2, 4, 6, 8, 10]);
        });

        it('Should check index getter', function () {
            assert.deepEqual(armap.$aggregatedKeys('index2', 'e'), [1, 3, 5, 7, 9]);
            assert.deepEqual(armap.$aggregatedKeys('index2', 'd'), [2, 4, 6, 8, 10]);
            assert.deepEqual(armap.$aggregatedKeys('index2', 'c'), [2, 4, 6, 8, 10]);
        });

        it('Should map values and skip undefined values', function () {
            var r = armap.$map(function (v, i) {
                return i % 2 && {
                    id: v.id,
                    index1: 5
                } || undefined
            }, new Armap('id', ['index1']));

            assert.equal(r.length, 5);
            assert.deepEqual(r.$item(2), {id: 2, index1: 5});
            assert.deepEqual(r.$item(4), {id: 4, index1: 5});
            assert.deepEqual(r.$item(6), {id: 6, index1: 5});
            assert.deepEqual(r.$item(8), {id: 8, index1: 5});
            assert.deepEqual(r.$item(10), {id: 10, index1: 5});
        });

        it('Should filter values', function () {
            var r = armap.$filter(function (v) {
                return !!(v.id % 2);
            }, new Armap('id', ['index1']));

            assert.equal(r.length, 5);
            assert.deepEqual(r.$item(1), {id: 1, index1: 1});
            assert.deepEqual(r.$item(3), {id: 3, index1: 1});
            assert.deepEqual(r.$item(5), {id: 5, index1: 1});
            assert.deepEqual(r.$item(7), {id: 7, index1: 1});
            assert.deepEqual(r.$item(9), {id: 9, index1: 1});
        });

        it('Should remove values by aggregated index', function () {
            armap.$removeByIndex({'index2': 'e'});

            assert.equal(armap.length, 5);
            assert.deepEqual(armap.$item(2), {id: 2});
            assert.deepEqual(armap.$item(4), {id: 4});
            assert.deepEqual(armap.$item(6), {id: 6});
            assert.deepEqual(armap.$item(8), {id: 8});
            assert.deepEqual(armap.$item(10), {id: 10});
        })

    })

    describe('bug fixes', function () {
        it('fix #1, remove indexes on custom key', function () {
            var a = new Armap(function (item) { return 'key' + item.id }, ['idx1', 'idx2', 'idx3']);
            a.$push({id: 1, idx1: 'index11', idx2: 'index12', idx3: 'idx'}, 'key1');
            a.$push({id: 2, idx1: 'index21', idx2: 'index22', idx3: 'idx'}, 'key2');
            a.$push({id: 3, idx1: 'index31', idx2: 'index32', idx3: 'idx'}, 'key3');
            a.$push({id: 4, idx1: 'index41', idx2: 'index42', idx3: 'idx'}, 'key4');
            a.$push({id: 5, idx1: 'index51', idx2: 'index52', idx3: 'idx'}, 'key5');
            a.$push({id: 6, idx1: 'index61', idx2: 'index62', idx3: 'idx'}, 'key6');
            a.$push({id: 7, idx1: 'index71', idx2: 'index72', idx3: 'idx'}, 'key7');
            a.$push({id: 8, idx1: 'index81', idx2: 'index82', idx3: 'idx'}, 'key8');
            a.$push({id: 9, idx1: 'index91', idx2: 'index92', idx3: 'idx'}, 'key9');

            a.$remove('key3');

            assert.equal(a.$keysByAggregateKey({idx3: 'idx'}).indexOf('key3'), -1);
        })
    })

})