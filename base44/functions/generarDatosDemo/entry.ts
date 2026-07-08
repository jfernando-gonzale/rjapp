import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Solo administradores pueden generar datos demo' }, { status: 403 });

    const DEMO = "DATOS DEMO RJAPP";
    const dAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0]; };
    const dFuture = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0]; };

    // 1. Finca
    const finca = await base44.entities.Finca.create({
      nombre: "Finca Demo RJAPP", ubicacion: "Villavicencio, Meta", responsable: user.full_name || "Admin Demo",
      observaciones: DEMO, estado: "activa"
    });

    // 2. Lotes
    const lotes = await base44.entities.Lote.bulkCreate([
      { nombre: "Lote Demo Bovinos", finca_id: finca.id, especie: "bovino", tipo: "ceba", fecha_inicio: dAgo(180), observaciones: DEMO, estado: "activo" },
      { nombre: "Lote Demo Ovinos", finca_id: finca.id, especie: "ovino", tipo: "cria", fecha_inicio: dAgo(180), observaciones: DEMO, estado: "activo" },
      { nombre: "Lote Demo Equinos", finca_id: finca.id, especie: "equino", tipo: "reproduccion", fecha_inicio: dAgo(180), observaciones: DEMO, estado: "activo" },
    ]);
    const loteBov = lotes[0].id, loteOv = lotes[1].id, loteEq = lotes[2].id;

    // 3. Animales bovinos (8 ceba + 3 hembras + 1 toro + 3 vendidos = 15)
    const bovinos = await base44.entities.Animal.bulkCreate([
      // 8 de ceba
      { numero: "DEMO-B001", sexo: "macho", raza: "Cebú", color: "Blanco", especie: "bovino", estado: "activo", finca_id: finca.id, lote_id: loteBov, fecha_compra: dAgo(150), peso_compra: 320, precio_kilo_compra: 7500, precio_compra: 2400000, ultimo_peso: 430, fecha_ultimo_pesaje: dAgo(7), vendedor: "Finca Los Alisos", observaciones: DEMO },
      { numero: "DEMO-B002", sexo: "macho", raza: "Cebú", color: "Gris", especie: "bovino", estado: "activo", finca_id: finca.id, lote_id: loteBov, fecha_compra: dAgo(150), peso_compra: 340, precio_kilo_compra: 7200, precio_compra: 2448000, ultimo_peso: 410, fecha_ultimo_pesaje: dAgo(7), observaciones: DEMO },
      { numero: "DEMO-B003", sexo: "macho", raza: "Cebú", color: "Rojo", especie: "bovino", estado: "activo", finca_id: finca.id, lote_id: loteBov, fecha_compra: dAgo(150), peso_compra: 300, precio_kilo_compra: 7800, precio_compra: 2340000, ultimo_peso: 380, fecha_ultimo_pesaje: dAgo(7), observaciones: DEMO },
      { numero: "DEMO-B004", sexo: "macho", raza: "Cebú", color: "Blanco", especie: "bovino", estado: "activo", finca_id: finca.id, lote_id: loteBov, fecha_compra: dAgo(150), peso_compra: 350, precio_kilo_compra: 7500, precio_compra: 2625000, ultimo_peso: 440, fecha_ultimo_pesaje: dAgo(7), observaciones: DEMO },
      { numero: "DEMO-B005", sexo: "macho", raza: "Cebú", color: "Pardo", especie: "bovino", estado: "activo", finca_id: finca.id, lote_id: loteBov, fecha_compra: dAgo(150), peso_compra: 310, precio_kilo_compra: 7600, precio_compra: 2356000, ultimo_peso: 360, fecha_ultimo_pesaje: dAgo(7), observaciones: DEMO },
      { numero: "DEMO-B006", sexo: "macho", raza: "Cebú", color: "Gris", especie: "bovino", estado: "activo", finca_id: finca.id, lote_id: loteBov, fecha_compra: dAgo(150), peso_compra: 330, precio_kilo_compra: 7400, precio_compra: 2442000, ultimo_peso: 420, fecha_ultimo_pesaje: dAgo(7), observaciones: DEMO },
      { numero: "DEMO-B007", sexo: "macho", raza: "Cebú", color: "Rojo", especie: "bovino", estado: "activo", finca_id: finca.id, lote_id: loteBov, fecha_compra: dAgo(150), peso_compra: 320, precio_kilo_compra: 7500, precio_compra: 2400000, ultimo_peso: 390, fecha_ultimo_pesaje: dAgo(7), observaciones: DEMO },
      { numero: "DEMO-B008", sexo: "macho", raza: "Cebú", color: "Blanco", especie: "bovino", estado: "activo", finca_id: finca.id, lote_id: loteBov, fecha_compra: dAgo(150), peso_compra: 340, precio_kilo_compra: 7300, precio_compra: 2482000, ultimo_peso: 450, fecha_ultimo_pesaje: dAgo(7), observaciones: DEMO },
      // 3 hembras reproductivas
      { numero: "DEMO-B009", sexo: "hembra", raza: "Cebú", color: "Blanco", especie: "bovino", estado: "activo", finca_id: finca.id, lote_id: loteBov, fecha_nacimiento: dAgo(1200), peso_compra: 380, precio_kilo_compra: 7000, precio_compra: 2660000, ultimo_peso: 450, fecha_ultimo_pesaje: dAgo(30), observaciones: DEMO },
      { numero: "DEMO-B010", sexo: "hembra", raza: "Cebú", color: "Gris", especie: "bovino", estado: "activo", finca_id: finca.id, lote_id: loteBov, fecha_nacimiento: dAgo(1100), peso_compra: 360, precio_kilo_compra: 7000, precio_compra: 2520000, ultimo_peso: 420, fecha_ultimo_pesaje: dAgo(30), observaciones: DEMO },
      { numero: "DEMO-B011", sexo: "hembra", raza: "Cebú", color: "Rojo", especie: "bovino", estado: "activo", finca_id: finca.id, lote_id: loteBov, fecha_nacimiento: dAgo(1300), peso_compra: 400, precio_kilo_compra: 7000, precio_compra: 2800000, ultimo_peso: 460, fecha_ultimo_pesaje: dAgo(30), observaciones: DEMO },
      // 1 toro
      { numero: "DEMO-B012", nombre: "DEMO Toro", sexo: "macho", raza: "Cebú", color: "Blanco", especie: "bovino", estado: "activo", finca_id: finca.id, lote_id: loteBov, fecha_nacimiento: dAgo(1500), precio_compra: 5000000, ultimo_peso: 600, fecha_ultimo_pesaje: dAgo(30), observaciones: DEMO },
      // 3 vendidos
      { numero: "DEMO-B013", sexo: "macho", raza: "Cebú", color: "Gris", especie: "bovino", estado: "vendido", finca_id: finca.id, lote_id: loteBov, fecha_compra: dAgo(150), peso_compra: 350, precio_kilo_compra: 7500, precio_compra: 2625000, ultimo_peso: 480, fecha_ultimo_pesaje: dAgo(10), observaciones: DEMO },
      { numero: "DEMO-B014", sexo: "macho", raza: "Cebú", color: "Blanco", especie: "bovino", estado: "vendido", finca_id: finca.id, lote_id: loteBov, fecha_compra: dAgo(150), peso_compra: 340, precio_kilo_compra: 7300, precio_compra: 2482000, ultimo_peso: 470, fecha_ultimo_pesaje: dAgo(10), observaciones: DEMO },
      { numero: "DEMO-B015", sexo: "macho", raza: "Cebú", color: "Rojo", especie: "bovino", estado: "vendido", finca_id: finca.id, lote_id: loteBov, fecha_compra: dAgo(150), peso_compra: 360, precio_kilo_compra: 7400, precio_compra: 2664000, ultimo_peso: 490, fecha_ultimo_pesaje: dAgo(10), observaciones: DEMO },
    ]);

    // 4. Animales ovinos (1 carnero + 4 ovejas + 3 ceba + 3 corderos = 11)
    const ovinos = await base44.entities.Animal.bulkCreate([
      { numero: "DEMO-O001", sexo: "macho", raza: "Criollo", color: "Blanco", especie: "ovino", estado: "activo", finca_id: finca.id, lote_id: loteOv, fecha_nacimiento: dAgo(900), precio_compra: 600000, ultimo_peso: 70, fecha_ultimo_pesaje: dAgo(30), observaciones: DEMO },
      { numero: "DEMO-O002", sexo: "hembra", raza: "Criollo", color: "Pardo", especie: "ovino", estado: "activo", finca_id: finca.id, lote_id: loteOv, fecha_nacimiento: dAgo(800), precio_compra: 350000, ultimo_peso: 45, fecha_ultimo_pesaje: dAgo(30), observaciones: DEMO },
      { numero: "DEMO-O003", sexo: "hembra", raza: "Criollo", color: "Blanco", especie: "ovino", estado: "activo", finca_id: finca.id, lote_id: loteOv, fecha_nacimiento: dAgo(750), precio_compra: 320000, ultimo_peso: 42, fecha_ultimo_pesaje: dAgo(30), observaciones: DEMO },
      { numero: "DEMO-O004", sexo: "hembra", raza: "Criollo", color: "Negro", especie: "ovino", estado: "activo", finca_id: finca.id, lote_id: loteOv, fecha_nacimiento: dAgo(850), precio_compra: 380000, ultimo_peso: 48, fecha_ultimo_pesaje: dAgo(30), observaciones: DEMO },
      { numero: "DEMO-O005", sexo: "hembra", raza: "Criollo", color: "Blanco", especie: "ovino", estado: "activo", finca_id: finca.id, lote_id: loteOv, fecha_nacimiento: dAgo(780), precio_compra: 300000, ultimo_peso: 40, fecha_ultimo_pesaje: dAgo(30), observaciones: DEMO },
      { numero: "DEMO-O006", sexo: "macho", raza: "Criollo", color: "Pardo", especie: "ovino", estado: "activo", finca_id: finca.id, lote_id: loteOv, fecha_compra: dAgo(120), peso_compra: 25, precio_kilo_compra: 8000, precio_compra: 200000, ultimo_peso: 35, fecha_ultimo_pesaje: dAgo(7), observaciones: DEMO },
      { numero: "DEMO-O007", sexo: "macho", raza: "Criollo", color: "Blanco", especie: "ovino", estado: "activo", finca_id: finca.id, lote_id: loteOv, fecha_compra: dAgo(120), peso_compra: 28, precio_kilo_compra: 8000, precio_compra: 224000, ultimo_peso: 38, fecha_ultimo_pesaje: dAgo(7), observaciones: DEMO },
      { numero: "DEMO-O008", sexo: "macho", raza: "Criollo", color: "Negro", especie: "ovino", estado: "activo", finca_id: finca.id, lote_id: loteOv, fecha_compra: dAgo(120), peso_compra: 22, precio_kilo_compra: 8000, precio_compra: 176000, ultimo_peso: 32, fecha_ultimo_pesaje: dAgo(7), observaciones: DEMO },
      { numero: "DEMO-O009", sexo: "macho", raza: "Criollo", color: "Blanco", especie: "ovino", estado: "activo", finca_id: finca.id, lote_id: loteOv, fecha_nacimiento: dAgo(75), ultimo_peso: 15, fecha_ultimo_pesaje: dAgo(7), observaciones: DEMO },
      { numero: "DEMO-O010", sexo: "hembra", raza: "Criollo", color: "Pardo", especie: "ovino", estado: "activo", finca_id: finca.id, lote_id: loteOv, fecha_nacimiento: dAgo(70), ultimo_peso: 12, fecha_ultimo_pesaje: dAgo(7), observaciones: DEMO },
      { numero: "DEMO-O011", sexo: "macho", raza: "Criollo", color: "Blanco", especie: "ovino", estado: "activo", finca_id: finca.id, lote_id: loteOv, fecha_nacimiento: dAgo(100), ultimo_peso: 18, fecha_ultimo_pesaje: dAgo(7), observaciones: DEMO },
    ]);

    // 5. Animales equinos en Animal (7)
    const equinos = await base44.entities.Animal.bulkCreate([
      { numero: "DEMO-E001", nombre: "DEMO Yegua Donadora 1", sexo: "hembra", raza: "Cuarto de Milla", color: "Alazán", especie: "equino", estado: "activo", finca_id: finca.id, lote_id: loteEq, fecha_nacimiento: dAgo(2400), precio_compra: 3000000, ultimo_peso: 450, fecha_ultimo_pesaje: dAgo(60), observaciones: DEMO },
      { numero: "DEMO-E002", nombre: "DEMO Yegua Donadora 2", sexo: "hembra", raza: "Appaloosa", color: "Manchado", especie: "equino", estado: "activo", finca_id: finca.id, lote_id: loteEq, fecha_nacimiento: dAgo(2200), precio_compra: 2800000, ultimo_peso: 430, fecha_ultimo_pesaje: dAgo(60), observaciones: DEMO },
      { numero: "DEMO-E003", nombre: "DEMO Yegua Receptora 1", sexo: "hembra", raza: "Criollo", color: "Bayo", especie: "equino", estado: "activo", finca_id: finca.id, lote_id: loteEq, fecha_nacimiento: dAgo(2000), precio_compra: 1500000, ultimo_peso: 420, fecha_ultimo_pesaje: dAgo(60), observaciones: DEMO },
      { numero: "DEMO-E004", nombre: "DEMO Yegua Receptora 2", sexo: "hembra", raza: "Criollo", color: "Alazán", especie: "equino", estado: "activo", finca_id: finca.id, lote_id: loteEq, fecha_nacimiento: dAgo(2100), precio_compra: 1600000, ultimo_peso: 440, fecha_ultimo_pesaje: dAgo(60), observaciones: DEMO },
      { numero: "DEMO-E005", nombre: "DEMO Yegua Reproductiva", sexo: "hembra", raza: "Pura Sangre Español", color: "Tordillo", especie: "equino", estado: "activo", finca_id: finca.id, lote_id: loteEq, fecha_nacimiento: dAgo(2600), precio_compra: 5000000, ultimo_peso: 460, fecha_ultimo_pesaje: dAgo(60), observaciones: DEMO },
      { numero: "DEMO-E006", nombre: "DEMO Caballo Appaloosa", sexo: "macho", raza: "Appaloosa", color: "Manchado", especie: "equino", estado: "activo", finca_id: finca.id, lote_id: loteEq, fecha_nacimiento: dAgo(3000), precio_compra: 8000000, ultimo_peso: 550, fecha_ultimo_pesaje: dAgo(60), observaciones: DEMO },
      { numero: "DEMO-E007", nombre: "DEMO Caballo Criollo", sexo: "macho", raza: "Criollo", color: "Bayo", especie: "equino", estado: "activo", finca_id: finca.id, lote_id: loteEq, fecha_nacimiento: dAgo(2800), precio_compra: 4000000, ultimo_peso: 500, fecha_ultimo_pesaje: dAgo(60), observaciones: DEMO },
    ]);

    // 6. Yeguas (5)
    const yeguas = await base44.entities.Yegua.bulkCreate([
      { nombre: "DEMO Yegua Donadora 1", numero: "DEMO-E001", finca_id: finca.id, lote_id: loteEq, raza: "Cuarto de Milla", color: "Alazán", estado_reproductivo: "vacia", tipo_yegua: "donadora", observaciones: DEMO },
      { nombre: "DEMO Yegua Donadora 2", numero: "DEMO-E002", finca_id: finca.id, lote_id: loteEq, raza: "Appaloosa", color: "Manchado", estado_reproductivo: "vacia", tipo_yegua: "donadora", observaciones: DEMO },
      { nombre: "DEMO Yegua Receptora 1", numero: "DEMO-E003", finca_id: finca.id, lote_id: loteEq, raza: "Criollo", color: "Bayo", estado_reproductivo: "preñada", tipo_yegua: "receptora", fecha_probable_parto: dFuture(15), observaciones: DEMO },
      { nombre: "DEMO Yegua Receptora 2", numero: "DEMO-E004", finca_id: finca.id, lote_id: loteEq, raza: "Criollo", color: "Alazán", estado_reproductivo: "parida", tipo_yegua: "receptora", fecha_ultimo_parto: dAgo(30), cria_actual_id: "", observaciones: DEMO },
      { nombre: "DEMO Yegua Reproductiva", numero: "DEMO-E005", finca_id: finca.id, lote_id: loteEq, raza: "Pura Sangre Español", color: "Tordillo", estado_reproductivo: "inseminada", tipo_yegua: "reproductiva", fecha_ultima_inseminacion: dAgo(20), observaciones: DEMO },
    ]);

    // 7. Reproductores (2)
    const reproductores = await base44.entities.Reproductor.bulkCreate([
      { nombre: "DEMO Caballo Appaloosa", numero: "DEMO-R001", raza: "appaloosa", color: "Manchado", fecha_nacimiento: dAgo(3000), finca_id: finca.id, ubicacion: "Lote Demo Equinos", estado: "activo", tipo: "propio", observaciones: DEMO },
      { nombre: "DEMO Caballo Criollo", numero: "DEMO-R002", raza: "criollo", color: "Bayo", fecha_nacimiento: dAgo(2800), finca_id: finca.id, ubicacion: "Lote Demo Equinos", estado: "activo", tipo: "propio", observaciones: DEMO },
    ]);

    // 8. Clientes (3)
    const clientes = await base44.entities.Cliente.bulkCreate([
      { nombre: "DEMO Cliente Bovinos", telefono: "3000000000", ciudad: "Bogotá", departamento: "Cundinamarca", finca_criadero: "Hacienda Demo", tipo_cliente: "bovinos", observaciones: DEMO },
      { nombre: "DEMO Cliente Equinos", telefono: "3100000000", ciudad: "Medellín", departamento: "Antioquia", finca_criadero: "Criadero Demo", tipo_cliente: "equinos", observaciones: DEMO },
      { nombre: "DEMO Cliente Ovinos", telefono: "3200000000", ciudad: "Bucaramanga", departamento: "Santander", finca_criadero: "Granja Demo", tipo_cliente: "ovinos", observaciones: DEMO },
    ]);

    // Helper para generar pesajes
    function genPesajes(animalId, fincaId, loteId, weights) {
      const pesajes = [];
      for (let i = 0; i < weights.length; i++) {
        const { fecha, peso } = weights[i];
        if (i === 0) {
          pesajes.push({ animal_id: animalId, finca_id: fincaId, lote_id: loteId, fecha, peso, observaciones: DEMO });
        } else {
          const prev = pesajes[i - 1];
          const dias = Math.round((new Date(fecha) - new Date(prev.fecha)) / 86400000);
          const diff = peso - prev.peso;
          pesajes.push({ animal_id: animalId, finca_id: fincaId, lote_id: loteId, fecha, peso, peso_anterior: prev.peso, diferencia_peso: diff, dias_entre_pesajes: dias, ganancia_diaria: Math.round((diff / dias) * 100) / 100, observaciones: DEMO });
        }
      }
      return pesajes;
    }

    // 9. Pesajes
    const allPesajes = [];
    const pesajeConfigs = [
      [bovinos[0].id, [{fecha:dAgo(150),peso:320},{fecha:dAgo(120),peso:345},{fecha:dAgo(60),peso:370},{fecha:dAgo(7),peso:430}]],
      [bovinos[1].id, [{fecha:dAgo(150),peso:340},{fecha:dAgo(120),peso:360},{fecha:dAgo(60),peso:385},{fecha:dAgo(7),peso:410}]],
      [bovinos[2].id, [{fecha:dAgo(150),peso:300},{fecha:dAgo(120),peso:315},{fecha:dAgo(60),peso:350},{fecha:dAgo(7),peso:380}]],
      [bovinos[3].id, [{fecha:dAgo(150),peso:350},{fecha:dAgo(120),peso:375},{fecha:dAgo(60),peso:405},{fecha:dAgo(7),peso:440}]],
      [bovinos[4].id, [{fecha:dAgo(150),peso:310},{fecha:dAgo(120),peso:320},{fecha:dAgo(60),peso:340},{fecha:dAgo(7),peso:360}]],
      [bovinos[5].id, [{fecha:dAgo(150),peso:330},{fecha:dAgo(120),peso:350},{fecha:dAgo(60),peso:380},{fecha:dAgo(7),peso:420}]],
      [bovinos[6].id, [{fecha:dAgo(150),peso:320},{fecha:dAgo(120),peso:335},{fecha:dAgo(60),peso:360},{fecha:dAgo(7),peso:390}]],
      [bovinos[7].id, [{fecha:dAgo(150),peso:340},{fecha:dAgo(120),peso:365},{fecha:dAgo(60),peso:400},{fecha:dAgo(7),peso:450}]],
      [bovinos[12].id, [{fecha:dAgo(120),peso:350},{fecha:dAgo(10),peso:480}]],
      [bovinos[13].id, [{fecha:dAgo(120),peso:340},{fecha:dAgo(10),peso:470}]],
      [bovinos[14].id, [{fecha:dAgo(120),peso:360},{fecha:dAgo(10),peso:490}]],
      [ovinos[8].id, [{fecha:dAgo(60),peso:8},{fecha:dAgo(7),peso:15}]],
      [ovinos[9].id, [{fecha:dAgo(60),peso:6},{fecha:dAgo(7),peso:12}]],
      [ovinos[10].id, [{fecha:dAgo(90),peso:10},{fecha:dAgo(7),peso:18}]],
    ];
    for (const [animalId, weights] of pesajeConfigs) {
      allPesajes.push(...genPesajes(animalId, finca.id, loteBov, weights));
    }
    const pesajesCount = allPesajes.length;
    // Crear pesajes en batches de 50
    for (let i = 0; i < allPesajes.length; i += 50) {
      await base44.entities.Pesaje.bulkCreate(allPesajes.slice(i, i + 50));
    }

    // 10. Tratamientos
    await base44.entities.Tratamiento.bulkCreate([
      { especie: "bovino", tipo_registro: "lote", finca_id: finca.id, lote_id: loteBov, fecha: dAgo(120), tipo: "vacuna", producto: "Vacuna Aftosa", dosis: "2 ml", responsable: "Vet Demo", costo: 280000, numero_animales: 12, proxima_fecha: dFuture(30), observaciones: DEMO },
      { especie: "bovino", tipo_registro: "lote", finca_id: finca.id, lote_id: loteBov, fecha: dAgo(90), tipo: "purga", producto: "Ivermectina", dosis: "1 ml/50kg", responsable: "Vet Demo", costo: 350000, numero_animales: 12, proxima_fecha: dFuture(10), observaciones: DEMO },
      { especie: "bovino", tipo_registro: "individual", animal_id: bovinos[4].id, finca_id: finca.id, fecha: dAgo(60), tipo: "vitamina", producto: "Vitamina ADE", dosis: "5 ml", responsable: "Vet Demo", costo: 80000, proxima_fecha: dFuture(5), observaciones: DEMO },
      { especie: "bovino", tipo_registro: "individual", animal_id: bovinos[2].id, finca_id: finca.id, fecha: dAgo(30), tipo: "antibiotico", producto: "Penicilina", dosis: "10 ml", responsable: "Vet Demo", costo: 120000, observaciones: DEMO },
      { especie: "ovino", tipo_registro: "lote", finca_id: finca.id, lote_id: loteOv, fecha: dAgo(90), tipo: "vacuna", producto: "Vacuna Carbón", dosis: "1 ml", responsable: "Vet Demo", costo: 150000, numero_animales: 11, observaciones: DEMO },
      { especie: "ovino", tipo_registro: "lote", finca_id: finca.id, lote_id: loteOv, fecha: dAgo(60), tipo: "purga", producto: "Albendazole", dosis: "1 ml/10kg", responsable: "Vet Demo", costo: 80000, numero_animales: 11, proxima_fecha: dFuture(20), observaciones: DEMO },
      { especie: "equino", tipo_registro: "individual", animal_id: equinos[0].id, finca_id: finca.id, fecha: dAgo(30), tipo: "desparasitacion", producto: "Moxidectina", dosis: "5 ml", responsable: "Vet Demo", costo: 90000, observaciones: DEMO },
      { especie: "equino", tipo_registro: "individual", animal_id: equinos[4].id, finca_id: finca.id, fecha: dAgo(15), tipo: "vitamina", producto: "Complejo B", dosis: "10 ml", responsable: "Vet Demo", costo: 60000, observaciones: DEMO },
    ]);

    // 11. Procedimientos
    await base44.entities.Procedimiento.bulkCreate([
      { especie: "bovino", tipo_registro: "individual", animal_id: bovinos[0].id, finca_id: finca.id, lote_id: loteBov, fecha: dAgo(100), tipo: "topizado", detalle: "Topizado con serrucho", responsable: "Vaquero Demo", costo: 30000, observaciones: DEMO },
      { especie: "bovino", tipo_registro: "individual", animal_id: bovinos[1].id, finca_id: finca.id, lote_id: loteBov, fecha: dAgo(100), tipo: "descorne", detalle: "Descorne quirúrgico", responsable: "Vet Demo", costo: 25000, observaciones: DEMO },
      { especie: "bovino", tipo_registro: "individual", animal_id: bovinos[2].id, finca_id: finca.id, lote_id: loteBov, fecha: dAgo(90), tipo: "castracion", detalle: "Castración con banda", responsable: "Vaquero Demo", costo: 20000, observaciones: DEMO },
      { especie: "bovino", tipo_registro: "individual", animal_id: bovinos[3].id, finca_id: finca.id, lote_id: loteBov, fecha: dAgo(80), tipo: "tatuaje", detalle: "Tatuaje #DEMO-B004", responsable: "Vaquero Demo", costo: 5000, observaciones: DEMO },
      { especie: "equino", tipo_registro: "individual", animal_id: equinos[5].id, finca_id: finca.id, lote_id: loteEq, fecha: dAgo(20), tipo: "herraje", detalle: "Herraje 4 patas", responsable: "Herrador Demo", costo: 120000, observaciones: DEMO },
      { especie: "equino", tipo_registro: "individual", animal_id: equinos[4].id, finca_id: finca.id, lote_id: loteEq, fecha: dAgo(10), tipo: "revision_podal", detalle: "Revisión de cascos", responsable: "Herrador Demo", costo: 40000, observaciones: DEMO },
    ]);

    // 12. Gastos (distribuidos en 4 meses)
    const gastosData = [];
    for (let m = 0; m < 4; m++) {
      const f = dAgo(m * 30 + 15);
      gastosData.push({ fecha: f, valor: 1200000, categoria: "concentrado", especie: "bovino", tipo_gasto: "lote", finca_id: finca.id, lote_id: loteBov, metodo_distribucion: "por_animal", descripcion: "Concentrado bovinos mes " + (m+1), observaciones: DEMO });
      gastosData.push({ fecha: f, valor: 150000, categoria: "sal", especie: "bovino", tipo_gasto: "lote", finca_id: finca.id, lote_id: loteBov, metodo_distribucion: "por_animal", descripcion: "Sal mineralizada", observaciones: DEMO });
      gastosData.push({ fecha: f, valor: 400000, categoria: "concentrado", especie: "ovino", tipo_gasto: "lote", finca_id: finca.id, lote_id: loteOv, metodo_distribucion: "por_animal", descripcion: "Concentrado ovinos", observaciones: DEMO });
      gastosData.push({ fecha: f, valor: 800000, categoria: "pasto", especie: "bovino", tipo_gasto: "lote", finca_id: finca.id, lote_id: loteBov, metodo_distribucion: "por_peso", descripcion: "Pasto corte mes " + (m+1), observaciones: DEMO });
      gastosData.push({ fecha: f, valor: 1500000, categoria: "jornales", especie: "general", tipo_gasto: "finca", finca_id: finca.id, metodo_distribucion: "por_animal", descripcion: "Jornales mes " + (m+1), observaciones: DEMO });
      gastosData.push({ fecha: f, valor: 2000000, categoria: "arriendo", especie: "general", tipo_gasto: "finca", finca_id: finca.id, metodo_distribucion: "no_distribuir", descripcion: "Arriendo finca mes " + (m+1), observaciones: DEMO });
    }
    // Gastos individuales
    gastosData.push({ fecha: dAgo(30), valor: 200000, categoria: "veterinario", especie: "bovino", tipo_gasto: "individual", finca_id: finca.id, lote_id: loteBov, animal_id: bovinos[2].id, metodo_distribucion: "no_distribuir", descripcion: "Consulta veterinaria B003", observaciones: DEMO });
    gastosData.push({ fecha: dAgo(20), valor: 100000, categoria: "transporte", especie: "bovino", tipo_gasto: "individual", finca_id: finca.id, lote_id: loteBov, animal_id: bovinos[4].id, metodo_distribucion: "no_distribuir", descripcion: "Transporte B005", observaciones: DEMO });
    gastosData.push({ fecha: dAgo(15), valor: 120000, categoria: "otros", especie: "equino", tipo_gasto: "individual", finca_id: finca.id, lote_id: loteEq, animal_id: equinos[5].id, metodo_distribucion: "no_distribuir", descripcion: "Herraje caballo", observaciones: DEMO });
    gastosData.push({ fecha: dAgo(60), valor: 300000, categoria: "medicina", especie: "general", tipo_gasto: "general", metodo_distribucion: "no_distribuir", descripcion: "Botiquín general", observaciones: DEMO });
    gastosData.push({ fecha: dAgo(45), valor: 250000, categoria: "insumos", especie: "general", tipo_gasto: "finca", finca_id: finca.id, metodo_distribucion: "por_animal", descripcion: "Insumos finca", observaciones: DEMO });
    gastosData.push({ fecha: dAgo(90), valor: 500000, categoria: "mantenimiento", especie: "general", tipo_gasto: "finca", finca_id: finca.id, metodo_distribucion: "no_distribuir", descripcion: "Mantenimiento cercas", observaciones: DEMO });
    for (let i = 0; i < gastosData.length; i += 50) {
      await base44.entities.Gasto.bulkCreate(gastosData.slice(i, i + 50));
    }

    // 13. Ventas (3 individuales + 3 masivas)
    const ventaMasivaId = crypto.randomUUID();
    await base44.entities.Venta.bulkCreate([
      { fecha: dAgo(10), especie: "bovino", animal_id: bovinos[12].id, finca_id: finca.id, lote_id: loteBov, peso_venta: 480, precio_kilo: 9000, precio_total: 4320000, comprador: "DEMO Cliente Bovinos", costo_transporte: 100000, comision: 86400, otros_descuentos: 0, utilidad_estimada: 1594600, observaciones: DEMO },
      { fecha: dAgo(10), especie: "bovino", animal_id: bovinos[13].id, finca_id: finca.id, lote_id: loteBov, peso_venta: 470, precio_kilo: 8800, precio_total: 4136000, comprador: "DEMO Cliente Bovinos", costo_transporte: 100000, comision: 82720, otros_descuentos: 0, utilidad_estimada: 1462080, venta_masiva_id: ventaMasivaId, observaciones: DEMO + " - Venta masiva" },
      { fecha: dAgo(10), especie: "bovino", animal_id: bovinos[14].id, finca_id: finca.id, lote_id: loteBov, peso_venta: 490, precio_kilo: 9200, precio_total: 4508000, comprador: "DEMO Cliente Bovinos", costo_transporte: 100000, comision: 90160, otros_descuentos: 0, utilidad_estimada: 1591400, venta_masiva_id: ventaMasivaId, observaciones: DEMO + " - Venta masiva" },
      { fecha: dAgo(20), especie: "semen_equino", reproductor_id: reproductores[0].id, cliente_id: clientes[1].id, comprador: "DEMO Cliente Equinos", precio_total: 800000, observaciones: DEMO },
    ]);

    // 14. Inseminaciones (2 transferencias + 1 monta natural)
    await base44.entities.Inseminacion.bulkCreate([
      { yegua_id: yeguas[0].id, finca_id: finca.id, fecha: dAgo(20), tipo: "transferencia_embriones", reproductor: "DEMO Caballo Appaloosa", responsable: "Vet Repro Demo", resultado: "pendiente", observaciones: DEMO },
      { yegua_id: yeguas[2].id, finca_id: finca.id, fecha: dAgo(40), tipo: "transferencia_embriones", reproductor: "DEMO Caballo Appaloosa", responsable: "Vet Repro Demo", resultado: "preñada", observaciones: DEMO },
      { yegua_id: yeguas[4].id, finca_id: finca.id, fecha: dAgo(20), tipo: "monta_natural", reproductor: "DEMO Caballo Criollo", responsable: "Vaquero Demo", resultado: "pendiente", observaciones: DEMO },
    ]);

    // 15. Confirmación de preñez
    await base44.entities.ConfirmacionPreñez.create({
      yegua_id: yeguas[2].id, finca_id: finca.id, fecha: dAgo(15), metodo: "ecografia", fecha_inseminacion: dAgo(40), fecha_probable_parto: dFuture(15), veterinario: "Vet Repro Demo", observaciones: DEMO
    });

    // 16. Repetición de celo
    await base44.entities.RepeticionCelo.create({
      yegua_id: yeguas[0].id, finca_id: finca.id, fecha: dAgo(5), fecha_inseminacion_anterior: dAgo(20), nueva_accion: "reinseminar", observaciones: DEMO
    });

    // 17. Cría y Parto
    const cria = await base44.entities.Cria.create({
      nombre: "DEMO Potro 1", madre_id: yeguas[3].id, finca_id: finca.id, fecha_nacimiento: dAgo(30), sexo: "macho", color: "Bayo", estado: "lactante", observaciones: DEMO
    });
    await base44.entities.Parto.create({
      yegua_id: yeguas[3].id, finca_id: finca.id, fecha: dAgo(30), resultado: "cria_viva", sexo_cria: "macho", nombre_cria: "DEMO Potro 1", color_cria: "Bayo", cria_id: cria.id, observaciones: DEMO
    });

    // 18. Colectas (2)
    await base44.entities.Colecta.bulkCreate([
      { reproductor_id: reproductores[0].id, fecha: dAgo(15), hora: "08:00", responsable: "Lab Demo", numero_dosis: 12, calidad: "excelente", volumen: "15 ml", concentracion: "200M/ml", motilidad: "85%", observaciones: DEMO },
      { reproductor_id: reproductores[1].id, fecha: dAgo(7), hora: "08:30", responsable: "Lab Demo", numero_dosis: 10, calidad: "buena", volumen: "12 ml", concentracion: "180M/ml", motilidad: "75%", observaciones: DEMO },
    ]);

    // 19. Despachos (2)
    await base44.entities.Despacho.bulkCreate([
      { reproductor_id: reproductores[0].id, reproductor: "DEMO Caballo Appaloosa", fecha_despacho: dAgo(5), cliente_id: clientes[1].id, ciudad_destino: "Medellín", departamento_destino: "Antioquia", transportadora: "Envíos Demo", numero_guia: "DEMO-G001", numero_dosis: 5, fecha_estimada_llegada: dAgo(3), valor_cobrado: 800000, estado: "entregado", observaciones: DEMO },
      { reproductor_id: reproductores[1].id, reproductor: "DEMO Caballo Criollo", fecha_despacho: dFuture(3), cliente_id: clientes[1].id, ciudad_destino: "Bogotá", departamento_destino: "Cundinamarca", transportadora: "Envíos Demo", numero_guia: "DEMO-G002", numero_dosis: 4, fecha_estimada_llegada: dFuture(5), valor_cobrado: 600000, estado: "programado", observaciones: DEMO },
    ]);

    // 20. Inconformidad
    await base44.entities.Inconformidad.create({
      reproductor_id: reproductores[0].id, cliente_id: clientes[1].id, despacho_id: "", fecha_reporte: dAgo(2), tipo_novedad: "no_quedo_prenada", descripcion: "Yegua del cliente no quedó preñada con el semen enviado", accion_tomada: "reenvio", estado: "abierta", yegua_cliente: "Yegua Cliente Demo", observaciones: DEMO
    });

    // 21. Servicios internos (2)
    await base44.entities.ServicioInterno.bulkCreate([
      { reproductor_id: reproductores[0].id, fecha: dAgo(20), tipo_servicio: "transferencia_embriones", yegua_id: yeguas[0].id, resultado: "pendiente", responsable: "Vet Repro Demo", observaciones: DEMO },
      { reproductor_id: reproductores[1].id, fecha: dAgo(20), tipo_servicio: "monta_natural", yegua_id: yeguas[4].id, resultado: "pendiente", responsable: "Vaquero Demo", observaciones: DEMO },
    ]);

    // 22. Eventos de calendario
    await base44.entities.EventoCalendario.bulkCreate([
      { titulo: "DEMO - Vacuna aftosa bovinos", tipo_evento: "tratamiento", subtipo: "vacuna", especie: "bovino", finca_id: finca.id, lote_id: loteBov, fecha: dFuture(5), estado: "pendiente", origen: "manual", observaciones: DEMO },
      { titulo: "DEMO - Purga bovinos", tipo_evento: "tratamiento", subtipo: "purga", especie: "bovino", finca_id: finca.id, lote_id: loteBov, fecha: dFuture(10), estado: "pendiente", origen: "manual", observaciones: DEMO },
      { titulo: "DEMO - Parto yegua receptora", tipo_evento: "reproduccion", subtipo: "parto", especie: "equino", finca_id: finca.id, lote_id: loteEq, animal_id: equinos[2].id, fecha: dFuture(15), estado: "pendiente", origen: "manual", observaciones: DEMO },
      { titulo: "DEMO - Destete cordero", tipo_evento: "reproduccion", subtipo: "destete", especie: "ovino", finca_id: finca.id, lote_id: loteOv, fecha: dFuture(20), estado: "pendiente", origen: "manual", observaciones: DEMO },
      { titulo: "DEMO - Purga vencida ovinos", tipo_evento: "tratamiento", subtipo: "purga", especie: "ovino", finca_id: finca.id, lote_id: loteOv, fecha: dAgo(5), estado: "vencido", origen: "manual", observaciones: DEMO },
      { titulo: "DEMO - Colecta programada", tipo_evento: "colecta", subtipo: "colecta", especie: "equino", finca_id: finca.id, lote_id: loteEq, fecha: dFuture(7), estado: "pendiente", origen: "manual", observaciones: DEMO },
      { titulo: "DEMO - Despacho semen", tipo_evento: "despacho", subtipo: "despacho", especie: "equino", finca_id: finca.id, fecha: dFuture(3), estado: "pendiente", origen: "manual", observaciones: DEMO },
      { titulo: "DEMO - Rotación potrero", tipo_evento: "potrero", subtipo: "rotacion", especie: "general", finca_id: finca.id, lote_id: loteBov, fecha: dFuture(25), estado: "pendiente", origen: "manual", observaciones: DEMO },
    ]);

    // 23. Proforma
    await base44.entities.Proforma.create({
      numero: "DEMO-PF-001", fecha: dAgo(3), cliente_id: clientes[0].id, cliente_nombre: "DEMO Cliente Bovinos", especie: "bovino",
      items_json: JSON.stringify([
        { descripcion: "Toro DEMO-B012", cantidad: 1, precio_unitario: 6000000, subtotal: 6000000 },
        { descripcion: "Vaca DEMO-B009", cantidad: 1, precio_unitario: 3500000, subtotal: 3500000 }
      ]),
      subtotal: 9500000, descuento: 200000, total: 9300000, estado: "enviada", validez_dias: 15, observaciones: DEMO
    });

    return Response.json({
      success: true,
      message: "Datos demo creados correctamente. Aislados a tu usuario administrador.",
      counts: {
        fincas: 1, lotes: 3, animales: bovinos.length + ovinos.length + equinos.length,
        yeguas: yeguas.length, reproductores: reproductores.length, clientes: clientes.length,
        pesajes: pesajesCount, gastos: gastosData.length, ventas: 4
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});