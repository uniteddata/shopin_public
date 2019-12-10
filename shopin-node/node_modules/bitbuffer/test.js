"use strict"
var assert = require("assert")
var BitBuffer = require('./bitbuffer').BitBuffer

suite('BitBuffer')

test('#zeroinit', function() {
	var b = new BitBuffer(10)
	assert.equal(b.get(7), false)
	assert.equal(b.get(9), false)
})

test('#set', function() {
	var b = new BitBuffer(32)
	assert.equal(b.get(13), false)
	assert.equal(b.get(14), false)
	assert.equal(b.get(15), false)
	b.set(14, true)
	assert.equal(b.get(13), false)
	assert.equal(b.get(14), true)
	assert.equal(b.get(15), false)
})

function big(bit) {
	var b = new BitBuffer(bit + 1)
	assert.equal(b.get(bit), false)
	b.set(bit, true)
	assert.equal(b.get(bit), true)
	assert.equal(
		(b.buffer[(bit / 8)|0] & (1 << (bit % 8))) != 0,
		true
	)
}

test('#bigone_2852448540', function() {
	var bit = 2852448540
	var bit = Math.pow(2,31)
	big(2852448540)
})

test('#bigone_2g', function() {
	big(Math.pow(2,31))
})

test('#bigone_4g', function() {
	big(Math.pow(2,32) - 1)
})

test('#bigone_8g', function() {
	assert.throws(
		function() {
			b = new BitBuffer(Math.pow(2,33))
		},
		RangeError
	)
})

