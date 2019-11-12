# ShopChain

**An approach to create a new layer of decentralized infrastructure that provides value to retailers by assigning consumers ownership of their data.**

Shopin link: https://www.shopin.com

Whitepaper link: https://shopin.docsend.com/view/6i9nhpz




## ShopChain DLT (ShopChain beta): a federated, staked consortium

**ShopChain DLT (Distributed Ledger Technology)** is a permissioned, federated network consortium with superior throughput and security, consisting of known staked participants. 

ShopChain DLT uses a ground-breaking architecture combining DHT (Distributed Hash Tables, https://en.wikipedia.org/wiki/Distributed_hash_table) and consensus nodes (https://medium.com/agorablockchain/what-are-consensus-nodes-and-how-do-they-work-73703f92b941).

Among other innovations, ShopChain DLT leverages BLS signatures to achieve throughput beyond Bitcoin and Ethereum. The BLS signature is an implementation of a digital signature scheme ideated by Boneh, Lynn and Shacham (2001, https://www.iacr.org/archive/asiacrypt2001/22480516.pdf). BLS signatures have efficient computability and non-degeneracy, which means they are easy to use and difficult to tamper with, therefore secure. 

In order for this process to be carried out, nodes engage in a Distributed Key Generation (DKG) process, a mechanism for validating participating nodes (https://en.wikipedia.org/wiki/Distributed_key_generation).







## Update 0.1 (initial commit): Kadence library implementation with initial nodes

* Added kadence library
* Created Kademlia node using kadence library
* Connected two nodes via Join method
* Added express server to create an API
* Put a static primary node's contact in the config file
* Stored a list of static wallets using the IteractiveStore method of kadence
* Created an API to get wallets stored on node
* Added Eth-Crypto library to generate identity and addresses
* Added custom plugin called sendNeighborEcho
* New coming node in network will send Echo message to first (primary node)
* First node will store the contact of incoming node to its routing table


## Update 0.2: Procedure to onboard new nodes and to read IP addresses dynamically

* Added a CONTACT_LIST remote procedure call (RPC) method
* New node procedures:
  * When a new node pings a primary node, the primary node sends the list of contacts in its routing table
  * The new node stores the list of contacts to its routing table so that it has the latest nodes of the network
  * The new node will not save its own contact to routing table
* Improvements to the routing table file inside the kadence library to optimize the hops per lookup
* Implemented changes in allBuckets() method of the routing table component to refresh a wider pool of nodes
* When nodes are connecting, the list of contacts is added to the routing table
* If a CONTACT_LIST is sent to a primary node, the node will store it in its routing table, and if the CONTACT_LIST is sent to a non-primary node, the node will then just print it in console
* Upgraded the static local IP address by adding the command "hostname -i > ip.txt" in order to store the private IP of the machine to the ip.txt file, thus the private IP is read dynamically from the file


## Update 0.3: (coming soon)

