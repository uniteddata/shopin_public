# node-bitbuffer

A bit array, backed by node.js Buffer

## Install

	npm install bitbuffer

## Usage

	var BitBuffer = require('bitbuffer').BitBuffer
	var b = new BitBuffer(10)
	b.get(7) // false
	b.set(7, true)
	b.get(7) // true
	b.toggle(7)
	b.get(7) // false
