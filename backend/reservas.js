const express = require('express');
const router = express.Router();
const notificarSlack = require('./notificarSlack');

/* =========================
   📦 MEMORIA SIMPLE
========================= */

let reservas = [];
let idActual = 1;

/* =========================
   📥 GET RESERVAS
========================= */

router.get('/', (req, res) => {
  const estacionamiento = Number(req.query.estacionamiento);

  if (estacionamiento) {
    return res.json(
      reservas.filter(r => r.estacionamiento === estacionamiento)
    );
  }

  res.json(reservas);
});

/* =========================
   ➕ POST RESERVA + SLACK
========================= */

router.post('/', async (req, res) => {
  const { title, start, end, estacionamiento } = req.body;

  if (!title || !start || !end || !estacionamiento) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  const inicioNuevo = new Date(start);
  const finNuevo = new Date(end);

  // VALIDAR CRUCE
  const conflicto = reservas.find(r =>
    r.estacionamiento === Number(estacionamiento) &&
    inicioNuevo < new Date(r.end) &&
    finNuevo > new Date(r.start)
  );

  if (conflicto) {
    return res.status(409).json({ error: 'Horario no disponible' });
  }

  const nuevaReserva = {
    id: idActual++,
    title,
    start,
    end,
    estacionamiento: Number(estacionamiento)
  };

  reservas.push(nuevaReserva);

  // 🔔 SLACK
  await notificarSlack({
    nombre: title,
    estacionamiento,
    inicio: inicioNuevo.toLocaleTimeString('es-CL'),
    fin: finNuevo.toLocaleTimeString('es-CL')
  });

  res.status(201).json(nuevaReserva);
});

/* =========================
   🗑 DELETE RESERVA
========================= */

router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  reservas = reservas.filter(r => r.id !== id);
  res.json({ ok: true });
});

module.exports = router;
