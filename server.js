const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const http = require("http");
const { Server } = require("socket.io");
const twilio = require("twilio");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(bodyParser.json());
app.use(express.static("public"));

const db = new sqlite3.Database("database.db");

db.run(`CREATE TABLE IF NOT EXISTS citas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT,
  telefono TEXT,
  fecha TEXT,
  hora TEXT
)`);

// 🔴 CONFIGURA TUS DATOS DE TWILIO
const client = twilio("TU_ACCOUNT_SID", "TU_AUTH_TOKEN");

// Horarios permitidos
const horariosSemana = ["09:00","10:30","12:00","13:30","15:00","16:30"];
const horariosSabado = ["09:00","10:30","12:00","13:30"];

app.get("/citas", (req, res) => {
  const { fecha } = req.query;
  db.all("SELECT * FROM citas WHERE fecha = ?", [fecha], (err, rows) => {
    res.json(rows);
  });
});

app.post("/reservar", (req, res) => {
  const { nombre, telefono, fecha, hora } = req.body;

  const diaSemana = new Date(fecha).getDay();
  let horariosValidos = diaSemana === 6 ? horariosSabado : horariosSemana;

  if (diaSemana === 0) {
    return res.json({ mensaje: "Domingo no disponible" });
  }

  if (!horariosValidos.includes(hora)) {
    return res.json({ mensaje: "Horario no válido" });
  }

  db.get(
    "SELECT * FROM citas WHERE fecha = ? AND hora = ?",
    [fecha, hora],
    (err, row) => {

      if (row) {
        return res.json({ mensaje: "Ese horario ya está ocupado" });
      }

      db.run(
        "INSERT INTO citas (nombre, telefono, fecha, hora) VALUES (?, ?, ?, ?)",
        [nombre, telefono, fecha, hora]
      );

      // 🔔 Notificación tiempo real
      io.emit("nuevaCita", { nombre, fecha, hora });

      // 📲 Enviar WhatsApp
      client.messages.create({
        body: `Nueva cita:\nNombre: ${nombre}\nFecha: ${fecha}\nHora: ${hora}`,
        from: "whatsapp:+14155238886",
        to: `whatsapp:+52TU_NUMERO`
      });

      res.json({ mensaje: "Cita reservada correctamente" });
    }
  );
});

io.on("connection", (socket) => {
  console.log("Admin conectado");
});

server.listen(3000, () => console.log("Servidor activo en puerto 3000"));
