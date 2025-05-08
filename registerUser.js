"use strict";

const { Wallets, Gateway } = require("fabric-network");
const FabricCAServices = require("fabric-ca-client");
const fs = require("fs");
const path = require("path");

async function main() {
  try {
    // Cargar la configuración de conexión
    const ccpPath = path.resolve(
      __dirname,
      "connection-profiles",
      "connection-org1.json"
    );
    const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

    // Crear una nueva CA client para interactuar con la CA
    const caURL = ccp.certificateAuthorities["ca.org1.example.com"].url;
    const ca = new FabricCAServices(caURL);

    // Crear una nueva wallet para manejar las identidades
    const walletPath = path.join(process.cwd(), "wallets");
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);

    // Verificar si el usuario ya existe en la wallet
    const userIdentity = await wallet.get("user1");
    if (userIdentity) {
      console.log('El usuario "user1" ya existe en la wallet');
      return;
    }

    // Verificar si el admin existe en la wallet
    const adminIdentity = await wallet.get("admin");
    if (!adminIdentity) {
      console.log('El usuario "admin" debe registrarse primero');
      return;
    }

    // Construir una user identity basada en el certificado de CA
    const provider = wallet
      .getProviderRegistry()
      .getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, "admin");

    // Registrar el usuario, enroll el usuario y guardar en la wallet
    const secret = await ca.register(
      {
        affiliation: "org1.department1",
        enrollmentID: "user1",
        role: "client",
      },
      adminUser
    );
    const enrollment = await ca.enroll({
      enrollmentID: "user1",
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
    await wallet.put("user1", x509Identity);
    console.log(
      'Se ha registrado e inscrito correctamente al usuario "user1" y se ha importado a la wallet'
    );
  } catch (error) {
    console.error(`Error al registrar al usuario: ${error}`);
    process.exit(1);
  }
}

main();
