### Version 3.0 (March 3, 2018)

Emery Rose Hall (emery@deadcanaries.org)  

---

### 0    License

Copyright (C) 2018 Emery Rose Hall  

Permission is granted to copy, distribute and/or modify this document
under the terms of the GNU Free Documentation License, Version 1.3
or any later version published by the Free Software Foundation;
with no Invariant Sections, no Front-Cover Texts, and no Back-Cover Texts.
A copy of the license is included in the "LICENSE" file.

### 1    Introduction

This specification documents the Kadence protocol in its entirety for 
the purpose of enabling its implementation in other languages. Described here, 
is the protocol base - the minimum specification for compatibility with 
Kadence. Additional optional extensions to this work may be defined in a 
future specification.

### 2    Identities

Every node (host computer speaking the Kadence protocol) on the network possesses 
a unique cryptographic identity. This identity is used to derive a special 
160 bit identifier for the purpose of organizaing the overlay structure and 
routing messages _(3.1: Kademlia)_. In order for a node to join the network it 
must generate an identity.

Identities are the RMD160 hash of an Equihash proof where the node's public 
key is the proof input. Messages are signed with the corresponding private key.
This is designed to provide some resilience against sybil and, in particular, 
eclipse attacks. An eclipse attack is a type of censorship by which an attacker 
is able to manipulate the network's routing tables such that the attacker is 
able to "surround" a target without their knowledge.

In every message exchanged on the network, each party will include a tuple 
structure which includes enough information to locate and authenticate each 
party.

```
["<node_id>", { /* <contact> */ }]
```

#### 2.1    Contact Hash Map

The second entry in the identity tuple contains additional information specific 
to addressing the node on the network. This includes:

```
{
  "hostname": "xxxxxxxx.onion",
  "port": 80,
  "protocol": "http:",
  "pubkey": "...",
  "proof": "..."
}
```

Additional properties may be included based on individual use cases within the 
network, however the properties above are **required**.

### 3    Network Structure

Kadence employs a **structured** network, meaning that nodes are organized and 
route messages based on a deterministic metric. The network uses a 
[Kademlia](http://www.scs.stanford.edu/~dm/home/papers/kpos.pdf) distributed 
hash table as the basis for the network overlay. In addition to Kademlia, 
Kadence also employs other extensions to mitigate issues and attacks defined 
by the work on [S/Kademlia](http://www.tm.uka.de/doc/SKademlia_2007.pdf). 

#### 3.1    Kademlia

Once an Kadence node has completed generating its identity, it bootstraps its 
routing table by following the Kademlia "join" procedure. This involves 
querying a single known "seed" node for contact information about other nodes 
that possess a Node ID that is close (XOR distance) to its own 
_(`4.4 FIND_NODE`)_. This is done iteratively, sending the same query to the 
`ALPHA` (3) results that are closest, until the further queries no longer 
yield results that are closer or the routing table is sufficiently 
bootstrapped.

#### 3.2    Transport

The Kadence network operates over HTTP and exclusively over 
[Tor](https://torproject.org).

Each Kadence node exposes a V3 hidden service to other nodes for receiving RPC 
messages _(4. Remote Procedure Calls)_. Requests sent to the RPC endpoint 
require a special HTTP header `x-kad-message-id` to be included that matches 
the `id` parameter in the associated RPC message _(4.1 Structure and Authentication)_.

### 4    Remote Procedure Calls

* **Method:** `POST`
* **Path:** `/`
* **Content Type:** `application/json`
* **Headers:** `x-kad-message-id`

#### 4.1    Structure and Authentication

Each remote procedure call sent and received between nodes is composed in the 
same structure. Messages are formatted as a 
[JSON-RPC 2.0](http://www.jsonrpc.org/specification) *batch* payload containing 
3 objects. These objects are positional, so ordering matters. The anatomy of a 
message takes the form of:

```
[{ /* rpc */ },{ /* notification */ },{ /* notification */ }]
```

At position 0 is the RPC request/response object, which must follow the 
JSON-RPC specification for such an object. It must contain the properties: 
`jsonrpc`, `id`, `method`, and `params` if it is a request. It must contain the 
properties: `jsonrpc`, `id`, and one of `result` or `error` if it is a 
response.

At positions 1 and 2 are a JSON-RPC notification object, meaning that it is not 
required to contain an `id` property since no response is required. These two 
notifications always assert methods `IDENTIFY` and `AUTHENTICATE` respectively.
Together, these objects provide the recipient with information regarding the 
identity and addressing information of the sender as well as a cryptographic 
signature to authenticate the payload.

For `STORE` message, an additional `HASHCASH` message is included in the 
payload to prevent spam.

##### Example: Request

```
[
  {
    "jsonrpc": "2.0",
    "id": "<uuid_version_4>",
    "method": "<method_name>",
    "params": ["<parameter_one>", "<parameter_two>"]
  },
  {
    "jsonrpc": "2.0",
    "method": "IDENTIFY",
    "params": [
      "<proof_hash>", 
      {
        "hostname": "sender.onion",
        "port": 80,
        "protocol": "http:",
        "pubkey": "...",
        "proof": "..."
      }
    ]
  },
  {
    "jsonrpc": "2.0",
    "method": "AUTHENTICATE",
    "params": [
      "<payload_signature>",
      "<public_key>"
    ]
  }
]
```

##### Example: Response

```
[
  {
    "jsonrpc": "2.0",
    "id": "<uuid_version_4_from_request>",
    "result": ["<result_one>", "<result_two>"]
  },
  {
    "jsonrpc": "2.0",
    "method": "IDENTIFY",
    "params": [
      "<proof_hash>", 
      {
        "hostname": "receiver.onion",
        "port": 80,
        "protocol": "http:",
        "pubkey": "...",
        "proof": "..."
      }
    ]
  },
  {
    "jsonrpc": "2.0",
    "method": "AUTHENTICATE",
    "params": [
      "<payload_signature>",
      "<public_key>"
    ]
  }
]
```

In the examples above, `proof_hash` and `public_key` must be encoded 
as hexidecimal string and `payload_signature` must be encoded as a
base64 string which is the concatenation of the public key recovery number with 
the actual signature of the payload - excluding the object at index 2 
(`AUTHENTICATE`). This means that the message to be signed is 
`[rpc, identify]`.

> Note the exclusion of a timestamp or incrementing nonce in the payload means 
> that a man-in-the-middle could carry out a replay attack. To combat this, it 
> is urged that the `id` parameter of the RPC message (which is a universally 
> unique identifier) be stored for a reasonable period of time and nodes should 
> reject messages that attempt to use a duplicate UUID.

The rest of this section describes each individual method in the base protocol 
and defines the parameter and result signatures that are expected. If any RPC 
message yields an error, then an `error` property including `code` and 
`message` should be send in place of the `result` property.

#### 4.2    `PING`

This RPC involves one node sending a `PING` message to another, which 
presumably replies. This has a two-fold effect: the recipient of the `PING` 
must update the bucket corresponding to the sender; and, if there is a reply, 
the sender must update the bucket appropriate to the recipient.

Parameters: `[]`  
Results: `[]`

#### 4.3    `FIND_NODE`

Basic kademlia lookup operation that builds a set of K contacts closest to the 
the given key. The `FIND_NODE` RPC includes a 160-bit key. The recipient of the 
RPC returns up to K contacts that it knows to be closest to the key. The 
recipient must return K contacts if at all possible. It may only return fewer 
than K if it is returning all of the contacts that it has knowledge of.

Parameters: `[key_160_hex]`  
Results: `[contact_0, contact_1, ...contactN]`

#### 4.4    `FIND_VALUE`

Kademlia search operation that is conducted as a node lookup and builds a list 
of K closest contacts. If at any time during the lookup the value is returned, 
the search is abandoned. If no value is found, the K closest contacts are 
returned. Upon success, we must store the value at the nearest node seen during 
the search that did not return the value.

A `FIND_VALUE` RPC includes a B=160-bit key. If a corresponding value is 
present on the recipient, the associated data is returned. Otherwise the RPC is 
equivalent to a `FIND_NODE` and a set of K contacts is returned.

If a value is returned, it must be in the form of an object with properties: 
`timestamp` as a UNIX timestamp in milliseconds, `publisher` as a 160 bit 
public key hash in hexidecimal of the original publisher, and `value` which may 
be of mixed type that is valid JSON.

Parameters: `[key_160_hex]`  
Results: `{ timestamp, publisher, value }` or `[...contactN]`

#### 4.5    `STORE`

The sender of the `STORE` RPC provides a key and a block of data and requires 
that the recipient store the data and make it available for later retrieval by 
that key. Kadence **requires** that the key is the RMD160 hash of the supplied blob 
and that the blob is *exactly* equal to 2MiB in size and encoded as base64.

Parameters: `[key_160_hex, 2mib_value_base64]`  
Results: `[key_160_hex, 2mib_value_base64]`

An additional `HASHCASH` payload is appended to this message.

```
{
  "jsonrpc": "2.0",
  "method": "HASHCASH",
  "params": ["<hashcash_stamp>"]
}
```

The stamp follows the hashcash specification. The resource segment of the stamp
is the sender identity, target identity, and method name concatenated. The 
difficulty may be adjusted by community consensus to account for potential 
attacks.

### 9    References

* Kademlia (`http://www.scs.stanford.edu/~dm/home/papers/kpos.pdf`)
* S/Kademlia (`http://www.tm.uka.de/doc/SKademlia_2007.pdf`)

