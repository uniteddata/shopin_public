## License addendum
This project is released under the GNU GPL-3.0 license.
Check out the [LICENSE](LICENSE) file for more information.

The included @deadcanaries/kadence originates from [KADENCE][kadence].

[kadence]: https://gitlab.com/deadcanaries/kadence


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


## Update 0.2: Procedure to onboard nodes and read IP addresses dynamically

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


## Update 0.3: Initial multi-node communication with docker container for nodes

* Changed file structure
* Added support for websocket
* Changed the API so that a single controller can be used in both the API and the socket
* Created a dockerfile
* Added support to run application via the docker container
* Enhanced the dockerfile to build a container so a node can be run out in a docker container
* Added docker-compose.yaml
* Created 6 nodes using the docker-compose file and achieved communication among the nodes


## Update 0.4: Transaction API functionality

* Added transaction API
* Establish a protocol for achieving balance and passing to parameters to make a transaction wihtin the system
* As a transaction is sent to a node, the node finds and verifies the sender and reciever objects from the seed file
* Each address is assigned a name, a balance, an address, and a public and private key in the seed file
* Each node will verify the signature using sender account's public key


## Update 0.5: Transaction API additional functionality and error handling

* Once transaction is verified, node will check the balance of the sender account
* If a sender account has a balance more than the requested ammout, the node will add new balance to the object
* Each node prepares a set for a particular transaction and stores it using iterativeStore() method
* If the balance is insufficient, then a transaction set will be stored using FAIL status
* If a signature mismatch occurs, a node will store the transaction into a set with "Signature mismatch" status


## Update 0.6: Transaction API overall process action

* Added check signature API
* Solved some issue with transaction controller
* Created startFirstNode.sh which will start first DHT node
* Created StartNode.sh which will start other node in our network


## Update 0.7: DLT dashboard and transaciton PKI capture

* Added crontab which will call the above scipts when the server reboots
* Added a funcitonal layout to show wallet lists on the dashoard page
* Connected the dashboard to the DHT server via websocket
* Added display funcitonality for the list of wallets received from the server
* Added a component for manual transaction and for displaying the PKI
* Integrated manual transactions and delivery of the PKI in modal


## Update 0.8: Transaction operations and log

* Added a page for automatic transaction
* The transaction button triggers 100 transactions on the network with an interval of 0.2 seconds
* Added page for the transaction log
* The transaction button shows in real time the log of executed transactions in transaction logs page


## Update 0.9: Additional infrastructure and funcitonality: DKG keys and BLS signatures

* Make an API to generate DKG keys
* Store DKG keys on each node
* Send transaction to leader
* Leader generates master BLS signature key
* Publish transaction to all nodes
* Each node has generated their BLS signature key
