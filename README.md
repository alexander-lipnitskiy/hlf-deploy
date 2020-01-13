# Hyperledger Fabric Deploy

Fabric network deployment of this project is based on docker swarm multi-machine deployment.

## Installation Prerequisites
1. Docker
2. Docker-compose
3. Docker swarm (in this example 2 nodes, master and worker  required)
4. NFS

NFS installation guide: 
- https://help.ubuntu.com/lts/serverguide/network-file-system.html
- https://vitux.com/install-nfs-server-and-client-on-ubuntu/

## Notes

1. After confugirating Docker Swarm you can get hostnames of your machines. Replace name of your hostname with NODE_HOSTNAME variable.

``` bash
docker node ls
```

2. NFS_ADDR - address of your machine (probably master node)

3. NFS_PATH - path to your NFS folder

4. ```sudo nano /etc/exports``` -> after installing NFS add next sentence ```/nfsvolume *(rw,sync,no_root_squash)```

5. Copy all folders that located inside of nfs folder of the root repository 

## Start Network


## Start CA (1 CA per org)
Go to your NFS directory and replace variables with your keys

BYFN_CA1_PRIVATE_KEY = /nfsvolume/crypto-config/peerOrganizations/org1.example.com/ca

BYFN_CA2_PRIVATE_KEY = /nfsvolume/crypto-config/peerOrganizations/org2.example.com/ca

Than type following command with your configurations:

```docker network create --driver overlay fabric    ```

```bash
export NODE_HOSTNAME_ORG1=alexander-lenovo-ideapad-y700-15isk 
export NODE_HOSTNAME_ORG2=alex-desktop                 
export NETWORK=fabric 
export BYFN_CA1_PRIVATE_KEY=98bdcb13859c9c78982f1b64df35b4afc527e1bd86e57804194f8e1b8901b79d_sk
export BYFN_CA2_PRIVATE_KEY=fb19b6452646b363c192e59404d3eae17009b81645863688793cb53bd6847abb_sk 
export PEER_DOMAIN_ORG1=org1.example.com 
export PEER_DOMAIN_ORG2=org2.example.com 
export NFS_ADDR=192.168.0.248 
export NFS_PATH=/nfsvolume 
docker stack up -c docker-compose-ca.yaml ca
```
  
## Start peers (2 peers per org)

```bash
export PEER_HOSTNAME=peer0 
PEER_DOMAIN=org1.example.com \
FABRIC_LOGGING_SPEC=debug \
CORE_PEER_LOCALMSPID=Org1MSP \
NODE_HOSTNAME=alexander-lenovo-ideapad-y700-15isk \
COUCHDB_PORT=5984 \
NETWORK=fabric \
PORT=7051 \
NFS_ADDR=192.168.0.248  \
NFS_PATH=/nfsvolume \
docker stack up -c peer-couchdb.yaml peer0
```

```bash
export PEER_HOSTNAME=peer1 
PEER_DOMAIN=org1.example.com \
FABRIC_LOGGING_SPEC=debug \
COUCHDB_PORT=6984 \
CORE_PEER_LOCALMSPID=Org1MSP \
NODE_HOSTNAME=alexander-lenovo-ideapad-y700-15isk \
NETWORK=fabric \
PORT=8051 \
NFS_ADDR=192.168.0.248  \
NFS_PATH=/nfsvolume \
docker stack up -c peer-couchdb1.yaml peer1
```

```bash
export PEER_HOSTNAME=peer0 
PEER_DOMAIN=org2.example.com \
FABRIC_LOGGING_SPEC=debug \
CORE_PEER_LOCALMSPID=Org2MSP \
NODE_HOSTNAME=alex-desktop \
COUCHDB_PORT=5984 \
NETWORK=fabric \
PORT=9051 \
NFS_ADDR=192.168.0.248 \
NFS_PATH=/nfsvolume \
docker stack up -c peer-couchdb2.yaml peer2
```

```bash
export PEER_HOSTNAME=peer1
PEER_DOMAIN=org2.example.com \
FABRIC_LOGGING_SPEC=debug \
CORE_PEER_LOCALMSPID=Org2MSP \
NODE_HOSTNAME=alex-desktop \
COUCHDB_PORT=5984 \
NETWORK=fabric \
PORT=10051 \
NFS_ADDR=192.168.0.248 \
NFS_PATH=/nfsvolume \
docker stack up -c peer-couchdb3.yaml peer3
```

### Start Orderer

```bash
ORDERER_HOSTNAME=orderer \
ORDERER_DOMAIN=example.com \
ORDERER_GENERAL_LOCALMSPID=OrdererMSP \
FABRIC_LOGGING_SPEC=debug \
NODE_HOSTNAME=alex-desktop \
NETWORK=fabric \
PORT=7050 \
NFS_ADDR=192.168.0.248 \
NFS_PATH=/nfsvolume \
docker stack up -c orderer.yaml orderer
```

### HF CLI
```bash
PEER_DOMAIN=CLI \                                            
NODE_HOSTNAME=alex-desktop \
NETWORK=fabric \
NFS_ADDR=192.168.0.248 \
NFS_PATH=/nfsvolume \
docker stack up -c docker-compose-cli.yaml cli
```

# Environment variables for PEER0
stil working on this part

```bash
CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
CORE_PEER_ADDRESS=peer0.org1.example.com:7051
CORE_PEER_LOCALMSPID="Org1MSP"
CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
```

```bash
export CHANNEL_NAME=mychannel

peer channel create -o orderer.example.com:7050 -c $CHANNEL_NAME -f ./channel-artifacts/channel.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
```

peer channel join -b mychannel.block

peer channel update -o orderer.example.com:7050 -c $CHANNEL_NAME -f ./channel-artifacts/Org1MSPanchors.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp CORE_PEER_ADDRESS=peer0.org2.example.com:9051 CORE_PEER_LOCALMSPID="Org2MSP" CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt peer channel update -o orderer.example.com:7050 -c $CHANNEL_NAME -f ./channel-artifacts/Org2MSPanchors.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

peer chaincode install -n healthcare -v 1.0 -l node -p /opt/gopath/src/github.com/chaincode/fabcar/Chaincode

CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
CORE_PEER_ADDRESS=peer0.org2.example.com:9051
CORE_PEER_LOCALMSPID="Org2MSP"
CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt

peer chaincode install -n healthcare -v 1.0 -l node -p /opt/gopath/src/github.com/chaincode/fabcar/Chaincode

peer chaincode instantiate -o orderer.example.com:7050 --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem -C $CHANNEL_NAME -n healthcare -l node -v 1.0 -c '{"Args":["initLedger"]}' -P "AND ('Org1MSP.peer','Org2MSP.peer')"

peer chaincode invoke -o orderer.example.com:7050 --tls true --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem -C $CHANNEL_NAME -n healthcare --peerAddresses peer0.org1.example.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt --peerAddresses peer0.org2.example.com:9051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt -c '{"Args":["patientGrantAccess", "FHIR_Bundle","me2", "ka2", "key2"]}'

peer chaincode invoke -o orderer.example.com:7050 --tls true --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem -C $CHANNEL_NAME -n healthcare --peerAddresses peer0.org1.example.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt --peerAddresses peer0.org2.example.com:9051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt -c '{"Args":["createMedicalRecord", "{ \"medicalRecordID\": \"5\", \"type\": \"la\", \"version\": \"1\", \"authorised\": [], \"ipfsHash\": '2', \"owner\": '3',\"author\": '32' }"]}'