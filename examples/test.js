const NBTUtils = require('../nbt');

let nbt = new NBTUtils('BE'); // Big-endian/Little-endian
nbt.Parse('./test.nbt', false /*ifGzip */, (err, data) => {
    if (err) {
        throw new Error(err);
    }
    console.log(data);
});
