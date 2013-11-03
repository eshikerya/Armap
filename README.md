# Armap [![Build Status](https://travis-ci.org/eshikerya/Armap.png?branch=master)](https://travis-ci.org/eshikerya/Armap)
mix of Array and Hash object

## Why?
Sometime (aften, actually) we deal with collection of objects (users list, i.e.) and usually we have to process it as *array*. To find specific record we have to look for it in array. If we need this often - make a hash and deal with.
Sometime we need to select a few records with specific field values, i.e. by department of the users. We can use filter for this. It good for a 10 or 100 records, but what if we need it frequently and on large data set? Here Armap was born.

## Usage
**Armap** is regular *array* in prototype. All mathods and properties started with **$** and is not override original methods. So you can work with if this process will not remove the record and will not modify key/index fields.

#### Create instance
```javascript
new Armap(
  defaultKey,
  indexes,
  defaultValuesForIndexes,
  getterForIndexesValues
)
```
where:
* *{string}defaultKey* - name of the field contain primary(unique) key for the record
* *{array}indexes* - list of the field names of indexes
* *{array}defaultValuesForIndexes* - list of default values for indexes which is not set in record
* *{array}getterForIndexesValues* - list of the index getters
example:

```javascript
var data = [
  {id: 1, name: 'John', age: 30, sex: 'male', department: 'development'},
  {id: 2, name: 'Conor', age: 29, sex: 'male', department: 'development,managment'},
  {id: 3, name: 'Jane', age: 30, sex: 'female', department: 'managment'},
  {id: 4, name: 'Anna', age: 25, sex: 'female', department: 'support'},
  {id: 5, name: 'Jack', age: 35, sex, 'male'}
];

var armap = new Armap('id', ['department', 'sex'], ['other'], [function (department) {
    return /,/.test(department) ? department.split(',') : department
}]);
```

#### $push(obj, *optionalKey*)
will add record to **Armap** and maintain key/indexes. In case the record doesn't have key field and/or any other reason you may specify *optional* key
```javascript
for (var l = data.length, i = 0; i < l; i++) {
    armap.$push(data[i]);
}
```

####$item(key)
retrieve record from collection by the key
```javascript
console.log(armap.$item(1));

> {id: 1, name: 'John', age: 30, sex: 'male', department: 'development'}
```

License
-------

The MIT License (MIT) Copyright (c) 2013 First Opinion

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
