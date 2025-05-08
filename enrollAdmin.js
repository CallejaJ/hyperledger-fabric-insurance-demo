"use strict";

const FabricCAServices = require("fabric-ca-client");
const { Wallets } = require("fabric-network");
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
    const caInfo = ccp.certificateAuthorities["ca.org1.example.com"];
    const caTLSCACerts = caInfo.tlsCACerts.pem;
    const ca = new FabricCAServices(
      caInfo.url,
      { trustedRoots: caTLSCACerts, verify: false },
      caInfo.caName
    );

    // Crear una nueva wallet para manejar las identidades
    const walletPath = path.join(process.cwd(), "wallets");
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);

    // Verificar si el admin ya existe en la wallet
    const identity = await wallet.get("admin");
    if (identity) {
      console.log('El usuario "admin" ya existe en la wallet');
      return;
    }

    // Enroll el admin
    const enrollment = await ca.enroll({
      enrollmentID: "admin",
      enrollmentSecret: "adminpw",
    });
    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: "Org1MSP",
      type: "X.509",
    };
    await wallet.put("admin", x509Identity);
    console.log(
      'Se ha registrado correctamente al usuario "admin" y se ha importado a la wallet'
    );
  } catch (error) {
    console.error(`Error al registrar al usuario admin: ${error}`);
    process.exit(1);
  }
}

main();
