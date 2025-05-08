"use strict";

const { Gateway, Wallets } = require("fabric-network");
const FabricCAServices = require("fabric-ca-client");
const path = require("path");
const fs = require("fs");

// Función para registrar e inscribir un usuario
async function registerUser(userId, userAffiliation) {
  try {
    // Cargar la conexión profile
    const ccpPath = path.resolve(
      __dirname,
      "connection-profiles",
      "connection-org1.json"
    );
    const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

    // Crear una nueva instancia de CA client
    const caInfo = ccp.certificateAuthorities["ca.org1.example.com"];
    const caTLSCACerts = caInfo.tlsCACerts.pem;
    const ca = new FabricCAServices(
      caInfo.url,
      { trustedRoots: caTLSCACerts, verify: false },
      caInfo.caName
    );

    // Crear una nueva wallet para manejar identidades
    const walletPath = path.join(process.cwd(), "wallets", "org1");
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Verificar si el usuario ya existe
    const userIdentity = await wallet.get(userId);
    if (userIdentity) {
      console.log(`El usuario ${userId} ya existe en la wallet`);
      return;
    }

    // Verificar si el admin existe
    const adminIdentity = await wallet.get("admin");
    if (!adminIdentity) {
      console.log("El usuario admin debe registrarse primero");
      return;
    }

    // Construir el provider de identidad para el admin
    const provider = wallet
      .getProviderRegistry()
      .getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, "admin");

    // Registrar el usuario
    const secret = await ca.register(
      {
        affiliation: userAffiliation,
        enrollmentID: userId,
        role: "client",
      },
      adminUser
    );

    // Inscribir al usuario y guardar en la wallet
    const enrollment = await ca.enroll({
      enrollmentID: userId,
      enrollmentSecret: secret,
    });

    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: "Org1MSP",
      type: "X.509",
    };

    await wallet.put(userId, x509Identity);
    console.log(`Usuario ${userId} registrado e inscrito exitosamente`);
  } catch (error) {
    console.error(`Error al registrar el usuario: ${error}`);
    throw new Error(error);
  }
}

// Función para crear una póliza
async function crearPoliza(
  userId,
  polizaId,
  tipo,
  titular,
  documento,
  vehiculo,
  cobertura,
  primaAnual,
  fechaInicio,
  fechaFin
) {
  try {
    // Cargar la conexión profile
    const ccpPath = path.resolve(
      __dirname,
      "connection-profiles",
      "connection-org1.json"
    );
    const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

    // Crear una nueva wallet para manejar identidades
    const walletPath = path.join(process.cwd(), "wallets", "org1");
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Verificar si el usuario existe
    const userIdentity = await wallet.get(userId);
    if (!userIdentity) {
      console.log(`El usuario ${userId} no existe en la wallet`);
      return;
    }

    // Crear una nueva gateway y usar el usuario
    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: userId,
      discovery: { enabled: true, asLocalhost: true },
    });

    // Obtener la red
    const network = await gateway.getNetwork("seguroschannel");

    // Obtener el contrato
    const contract = network.getContract("seguros");

    // Crear la póliza
    const vehiculoJSON = JSON.stringify(vehiculo);
    const result = await contract.submitTransaction(
      "crearPoliza",
      polizaId,
      tipo,
      titular,
      documento,
      vehiculoJSON,
      cobertura.toString(),
      primaAnual.toString(),
      fechaInicio,
      fechaFin
    );

    console.log(`Póliza creada con éxito: ${result.toString()}`);

    // Desconectar de la gateway
    gateway.disconnect();

    return JSON.parse(result.toString());
  } catch (error) {
    console.error(`Error al crear la póliza: ${error}`);
    throw new Error(error);
  }
}

// Función para consultar una póliza
async function consultarPoliza(userId, polizaId) {
  try {
    // Cargar la conexión profile
    const ccpPath = path.resolve(
      __dirname,
      "connection-profiles",
      "connection-org1.json"
    );
    const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

    // Crear una nueva wallet para manejar identidades
    const walletPath = path.join(process.cwd(), "wallets", "org1");
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Verificar si el usuario existe
    const userIdentity = await wallet.get(userId);
    if (!userIdentity) {
      console.log(`El usuario ${userId} no existe en la wallet`);
      return;
    }

    // Crear una nueva gateway y usar el usuario
    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: userId,
      discovery: { enabled: true, asLocalhost: true },
    });

    // Obtener la red
    const network = await gateway.getNetwork("seguroschannel");

    // Obtener el contrato
    const contract = network.getContract("seguros");

    // Consultar la póliza
    const result = await contract.evaluateTransaction(
      "consultarPoliza",
      polizaId
    );

    console.log(`Póliza consultada: ${result.toString()}`);

    // Desconectar de la gateway
    gateway.disconnect();

    return JSON.parse(result.toString());
  } catch (error) {
    console.error(`Error al consultar la póliza: ${error}`);
    throw new Error(error);
  }
}

// Exportar las funciones
module.exports = {
  registerUser,
  crearPoliza,
  consultarPoliza,
};
