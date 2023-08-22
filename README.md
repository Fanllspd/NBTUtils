<h1 align = "center">NBTUtils</h1>

<p align = "center">Utils for easy parsing nbt files</p>

## Install

Run `npm install nbtutils`

## Demo

Run `npm test`

See the [/examples](./examples) folder for details.

```js
const NBTUtils = require('../nbt');
const fs = require('fs');

let nbt = new NBTUtils('BE'); // Big-endian/Little-endian
nbt.Parse('./test.nbt', false /*ifGzip */, (err, data) => {
    if (err) {
        throw new Error(err);
    }
    console.log(data);
    fs.writeFileSync('test.json', JSON.stringify(data, null, '\t'));
});


```

