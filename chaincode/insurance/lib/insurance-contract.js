"use strict";

const { Contract } = require("fabric-contract-api");

class InsuranceContract extends Contract {
  async initLedger(ctx) {
    console.log("Inicializando el ledger con datos de ejemplo");

    const polizas = [
      {
        id: "POL001",
        tipo: "AUTOMOVIL",
        titular: "Juan Pérez",
        documento: "12345678A",
        vehiculo: {
          marca: "Toyota",
          modelo: "Corolla",
          año: 2023,
          placa: "ABC123",
        },
        cobertura: 15000,
        primaAnual: 450,
        fechaInicio: "2025-01-01",
        fechaFin: "2026-01-01",
        activa: true,
        reclamaciones: [],
      },
    ];

    for (const poliza of polizas) {
      await ctx.stub.putState(poliza.id, Buffer.from(JSON.stringify(poliza)));
      console.log(`Poliza ${poliza.id} inicializada`);
    }
  }

  // Crear una nueva póliza
  async crearPoliza(
    ctx,
    id,
    tipo,
    titular,
    documento,
    vehiculoData,
    cobertura,
    primaAnual,
    fechaInicio,
    fechaFin
  ) {
    console.log("Iniciando creación de nueva póliza");

    const exists = await this.polizaExiste(ctx, id);
    if (exists) {
      throw new Error(`La póliza con ID ${id} ya existe`);
    }

    // Parsear el objeto del vehículo
    const vehiculo = JSON.parse(vehiculoData);

    const poliza = {
      id,
      tipo,
      titular,
      documento,
      vehiculo,
      cobertura: parseInt(cobertura),
      primaAnual: parseInt(primaAnual),
      fechaInicio,
      fechaFin,
      activa: true,
      reclamaciones: [],
    };

    await ctx.stub.putState(id, Buffer.from(JSON.stringify(poliza)));
    return JSON.stringify(poliza);
  }

  // Consultar si una póliza existe
  async polizaExiste(ctx, id) {
    const polizaJSON = await ctx.stub.getState(id);
    return polizaJSON && polizaJSON.length > 0;
  }

  // Consultar una póliza por ID
  async consultarPoliza(ctx, id) {
    const polizaJSON = await ctx.stub.getState(id);
    if (!polizaJSON || polizaJSON.length === 0) {
      throw new Error(`La póliza ${id} no existe`);
    }
    return polizaJSON.toString();
  }

  // Consultar todas las pólizas
  async consultarTodasLasPolizas(ctx) {
    const startKey = "";
    const endKey = "";
    const allResults = [];

    const iterator = await ctx.stub.getStateByRange(startKey, endKey);

    while (true) {
      const res = await iterator.next();

      if (res.value && res.value.value.toString()) {
        console.log(res.value.value.toString("utf8"));

        const Key = res.value.key;
        let Record;

        try {
          Record = JSON.parse(res.value.value.toString("utf8"));
        } catch (err) {
          console.log(err);
          Record = res.value.value.toString("utf8");
        }

        allResults.push({ Key, Record });
      }

      if (res.done) {
        console.log("Fin de la lista de pólizas");
        await iterator.close();
        return JSON.stringify(allResults);
      }
    }
  }

  // Registrar una reclamación para una póliza
  async registrarReclamacion(ctx, polizaId, descripcion, monto, fecha) {
    console.log(`Registrando reclamación para póliza ${polizaId}`);

    // Obtener la póliza
    const polizaJSON = await ctx.stub.getState(polizaId);
    if (!polizaJSON || polizaJSON.length === 0) {
      throw new Error(`La póliza ${polizaId} no existe`);
    }

    const poliza = JSON.parse(polizaJSON.toString());

    // Verificar que la póliza esté activa
    if (!poliza.activa) {
      throw new Error(`La póliza ${polizaId} no está activa`);
    }

    // Crear el objeto de reclamación
    const reclamacion = {
      id: `REC-${Date.now()}`,
      descripcion,
      monto: parseInt(monto),
      fecha,
      estado: "PENDIENTE",
    };

    // Añadir la reclamación a la póliza
    if (!poliza.reclamaciones) {
      poliza.reclamaciones = [];
    }

    poliza.reclamaciones.push(reclamacion);

    // Actualizar la póliza en el ledger
    await ctx.stub.putState(polizaId, Buffer.from(JSON.stringify(poliza)));

    return JSON.stringify(reclamacion);
  }

  // Actualizar el estado de una reclamación
  async actualizarEstadoReclamacion(ctx, polizaId, reclamacionId, nuevoEstado) {
    // Obtener la póliza
    const polizaJSON = await ctx.stub.getState(polizaId);
    if (!polizaJSON || polizaJSON.length === 0) {
      throw new Error(`La póliza ${polizaId} no existe`);
    }

    const poliza = JSON.parse(polizaJSON.toString());

    // Encontrar la reclamación
    const reclamacionIndex = poliza.reclamaciones.findIndex(
      (reclamacion) => reclamacion.id === reclamacionId
    );

    if (reclamacionIndex === -1) {
      throw new Error(
        `La reclamación ${reclamacionId} no existe en la póliza ${polizaId}`
      );
    }

    // Actualizar el estado
    poliza.reclamaciones[reclamacionIndex].estado = nuevoEstado;

    // Si la reclamación es aprobada, podemos añadir información adicional
    if (nuevoEstado === "APROBADA") {
      poliza.reclamaciones[reclamacionIndex].fechaAprobacion =
        new Date().toISOString();
    }

    // Actualizar la póliza en el ledger
    await ctx.stub.putState(polizaId, Buffer.from(JSON.stringify(poliza)));

    return JSON.stringify(poliza.reclamaciones[reclamacionIndex]);
  }

  // Cancelar una póliza
  async cancelarPoliza(ctx, id, motivo) {
    const polizaJSON = await ctx.stub.getState(id);
    if (!polizaJSON || polizaJSON.length === 0) {
      throw new Error(`La póliza ${id} no existe`);
    }

    const poliza = JSON.parse(polizaJSON.toString());
    poliza.activa = false;
    poliza.fechaCancelacion = new Date().toISOString();
    poliza.motivoCancelacion = motivo;

    await ctx.stub.putState(id, Buffer.from(JSON.stringify(poliza)));
    return JSON.stringify(poliza);
  }
}

module.exports = InsuranceContract;
