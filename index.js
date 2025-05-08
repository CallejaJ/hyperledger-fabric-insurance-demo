"use strict";

const { registerUser, crearPoliza, consultarPoliza } = require("./app");

async function main() {
  try {
    // Registrar un usuario
    await registerUser("user1", "org1.department1");

    // Crear una póliza
    const vehiculo = {
      marca: "Honda",
      modelo: "Civic",
      año: 2024,
      placa: "XYZ789",
    };

    await crearPoliza(
      "user1",
      "POL002",
      "AUTOMOVIL",
      "Maria López",
      "87654321B",
      vehiculo,
      20000,
      600,
      "2025-05-10",
      "2026-05-10"
    );

    // Consultar la póliza
    const poliza = await consultarPoliza("user1", "POL002");
    console.log(JSON.stringify(poliza, null, 2));
  } catch (error) {
    console.error(`Error en la aplicación: ${error}`);
  }
}

main();
