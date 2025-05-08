#!/bin/bash

# Navegar al directorio docker
cd ../docker

# Crear directorios necesarios
mkdir -p channel-artifacts

# Generar los certificados
../bin/cryptogen generate --config=./cryptogen-config.yaml

# Generar el bloque génesis del canal
../bin/configtxgen -profile TwoOrgsOrdererGenesis -channelID system-channel -outputBlock ./channel-artifacts/genesis.block

# Generar el bloque de transacción del canal
../bin/configtxgen -profile TwoOrgsChannel -outputCreateChannelTx ./channel-artifacts/channel.tx -channelID seguroschannel

# Generar las definiciones de organización
../bin/configtxgen -profile TwoOrgsChannel -outputAnchorPeersUpdate ./channel-artifacts/Org1MSPanchors.tx -channelID seguroschannel -asOrg Org1MSP
