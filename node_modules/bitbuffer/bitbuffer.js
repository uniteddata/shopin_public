"use strict"

function BitBuffer(number, buffer) {
	var size = Math.ceil(number / 8)
	if (buffer != undefined && buffer.length == size) {
		this.buffer = buffer
	} else {
		this.buffer = new Buffer(size)
		this.buffer.fill(0)
	}
}


BitBuffer.prototype = {
	set: function(index, bool) {
		var pos = index >>> 3
		if(bool) {
			this.buffer[pos] |= 1 << (index % 8)
		} else {
			this.buffer[pos] &= ~(1 << (index % 8))
		}
	},
	get: function(index) {
		return (this.buffer[index >>> 3] & (1 << (index % 8))) != 0
	},
	toggle: function(index) {
		this.buffer[index >>> 3] ^= 1 << (index % 8)
	},
	toBuffer: function() {
		return this.buffer
	}
}

exports.BitBuffer = BitBuffer
