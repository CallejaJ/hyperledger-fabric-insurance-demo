#!/bin/bash

# Iniciar la red
docker-compose -f ../docker/docker-compose.yaml up -d

# Esperar un poco para que los contenedores se inicien completamente
sleep 5

# Crear el canal
docker exec cli peer channel create -o orderer.example.com:7050 -c seguroschannel -f /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/channel.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

# Unir al canal
docker exec cli peer channel join -b seguroschannel.block

# Actualizar los anchor peers
docker exec cli peer channel update -o orderer.example.com:7050 -c seguroschannel -f /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/Org1MSPanchors.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
