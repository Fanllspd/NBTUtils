const fs = require('fs');
const zlib = require('zlib');

class NBTUtils {
    constructor(endian = 'LE') {
        this.endian = endian.toUpperCase(); // Big-endian/Little-endian
        this.offset = 0; // Buffer offset
        this.obj = {};
        this.compoundEnd = [];
        this.index = -1;
        this.ifList = false;
        this.tagList = {
            0x00: 'TAG_End',
            0x01: 'TAG_Byte',
            0x02: 'TAG_Short',
            0x03: 'TAG_Int',
            0x04: 'TAG_Long',
            0x05: 'TAG_Float',
            0x06: 'TAG_Double',
            0x07: 'TAG_Byte_Array',
            0x08: 'TAG_String',
            0x09: 'TAG_List',
            0x0a: 'TAG_Compound',
            0x0b: 'TAG_Int_Array',
            0x0c: 'TAG_Long_Array',
        };
    }

    Parse(path, ifGzip, callback) {
        let buf = fs.readFileSync(path);
        if (ifGzip) {
            zlib.unzip(buf, (err, buffer) => {
                if (err) {
                    console.log(err);
                    callback(err, null);
                }
                this.buf = buffer;
                let result = this.selectCmd(this.buf[0]);
                callback(null, result);
            });
        } else {
            this.buf = buf;
            let result = this.selectCmd(this.buf[0]);
            callback(null, result);
        }
    }

    AutoParse(data, callback) {
        this.buf = data;
        let result = this.selectCmd(this.buf[0]);
        callback(null, result);
    }

    selectCmd(tagByte) {
        //console.log(tagByte);
        let tagName;
        let value;
        let tagType = this.tagList[tagByte];
        if (tagByte != 0x00 && this.ifList == false) {
            this.offset += 1;
            tagName = this.readString();
        }
        switch (tagByte) {
            case 0x00: // TAG_End
                return;

            case 0x01: // TAG_Byte
                value = this.readInt8();
                return {
                    [tagName]: {
                        type: tagType,
                        value: value,
                    },
                };

            case 0x02: // TAG_Short
                value = this.readInt16();
                return {
                    [tagName]: {
                        type: tagType,
                        value: value,
                    },
                };

            case 0x03: // TAG_Int
                value = this.readInt32();
                return {
                    [tagName]: {
                        type: tagType,
                        value: value,
                    },
                };

            case 0x04: // TAG_Long
                value = this.readInt64();
                return {
                    [tagName]: {
                        type: tagType,
                        value: value,
                    },
                };

            case 0x05: // TAG_Float
                value = this.readFloat();
                return {
                    [tagName]: {
                        type: tagType,
                        value: value,
                    },
                };

            case 0x06: // TAG_Double
                value = this.readDouble();
                return {
                    [tagName]: {
                        type: tagType,
                        value: value,
                    },
                };

            case 0x07: // TAG_Byte_Array
                let byteArrLen = this.readInt32();
                let byteArr = [];
                for (let i = 0; i < byteArrLen; i++) {
                    let byte = this.readInt8();
                    byteArr.push(byte);
                }
                return {
                    [tagName]: {
                        type: tagType,
                        value: byteArr,
                    },
                };

            case 0x08: // TAG_String
                value = this.readString();
                return {
                    [tagName]: {
                        type: tagType,
                        value: value,
                    },
                };

            case 0x09: // TAG_List
                let listObj = [];
                let tagId = this.readInt8();
                let listLen = this.readInt32();
                this.ifList = true;
                for (let i = 0; i < listLen; i++) {
                    listObj.push(Object.values(this.selectCmd(tagId))[0].value);
                }
                this.ifList = false;
                return {
                    [tagName]: {
                        type: tagType,
                        value: {
                            type: this.tagList[tagId],
                            value: listObj,
                        },
                    },
                };

            case 0x0a: // TAG_Compound
                this.index += 1; // add new compound
                this.compoundEnd[this.index] = false; // Initialize the current level
                let list = this.ifList;
                if (list) {
                    tagName = `entry ${this.index}`;
                    this.ifList = false;
                }
                this.obj[tagName] = {};

                while (!this.compoundEnd[this.index]) {
                    if (this.buf[this.offset] == 0x00) {
                        this.compoundEnd[this.index] = true;
                        this.offset += 1;
                    } else {
                        let objj = this.selectCmd(this.buf[this.offset]); // Recursion produces a Tree Structure
                        Object.assign(this.obj[tagName], objj);
                    }
                }

                if (list) {
                    this.ifList = true;
                }

                this.index -= 1; // Decrease level in order

                return {
                    [tagName]: {
                        type: tagType,
                        value: this.obj[tagName],
                    },
                };

            case 0x0b: // TAG_Int_Array
                let intArrLen = this.readInt32();
                let intArr = [];

                for (let i = 0; i < intArrLen; i++) {
                    let int = this.readInt32();
                    intArr.push(int);
                }
                return {
                    [tagName]: {
                        type: tagType,
                        value: intArr,
                    },
                };

            case 0x0c: // TAG_Long_Array
                let longArrLen = this.readInt32();
                let longArr = [];

                for (let i = 0; i < longArrLen; i++) {
                    let long = this.readInt64();
                    longArr.push(long);
                }
                return {
                    [tagName]: {
                        type: tagType,
                        value: longArr,
                    },
                };
        }
    }

    readInt8() {
        let value = this.buf.readInt8(this.offset);
        this.offset += 1;
        return value;
    }

    readInt16() {
        let value =
            this.endian == 'BE'
                ? this.buf.readInt16BE(this.offset)
                : this.buf.readInt16LE(this.offset);
        this.offset += 2;
        return value;
    }

    readInt32() {
        let value =
            this.endian == 'BE'
                ? this.buf.readInt32BE(this.offset)
                : this.buf.readInt32LE(this.offset);
        this.offset += 4;
        return value;
    }

    readInt64() {
        let value =
            this.endian == 'BE'
                ? this.buf.readBigInt64BE(this.offset)
                : this.buf.readBigInt64LE(this.offset);
        this.offset += 8;
        return value.toString();
    }

    readFloat() {
        let value =
            this.endian == 'BE'
                ? this.buf.readFloatBE(this.offset)
                : this.buf.readFloatLE(this.offset);
        this.offset += 4;
        return value;
    }

    readDouble() {
        let value =
            this.endian == 'BE'
                ? this.buf.readDoubleBE(this.offset)
                : this.buf.readDoubleLE(this.offset);
        this.offset += 8;
        return value;
    }

    getNameLength() {
        let len =
            this.endian == 'BE'
                ? this.buf.readUint16BE(this.offset)
                : this.buf.readUint16LE(this.offset);
        this.offset += 2;
        return len;
    }

    readString() {
        let length = this.getNameLength();
        if (length == 0) {
            return '';
        }
        let string = this.buf.toString('utf-8', this.offset, this.offset + length);
        this.offset += length;
        return string;
    }
}

module.exports = NBTUtils;
