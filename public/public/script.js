const horariosSemana = ["09:00","10:30","12:00","13:30","15:00","16:30"];
const horariosSabado = ["09:00","10:30","12:00","13:30"];

let horaSeleccionada = "";

const fechaInput = document.getElementById("fecha");
const contenedorHorarios = document.querySelector(".horarios");
const mensaje = document.getElementById("mensaje");

const hoy = new Date().toISOString().split("T")[0];
fechaInput.min = hoy;
fechaInput.value = hoy;

fechaInput.addEventListener("change", cargarHorarios);

async function cargarHorarios() {
  horaSeleccionada = "";
  contenedorHorarios.innerHTML = "";
  mensaje.innerText = "";

  const fecha = fechaInput.value;
  const diaSemana = new Date(fecha).getDay();

  if (diaSemana === 0) {
    mensaje.innerText = "Domingo no disponible";
    return;
  }

  let horarios = diaSemana === 6 ? horariosSabado : horariosSemana;

  const res = await fetch(`/citas?fecha=${fecha}`);
  const citas = await res.json();

  horarios.forEach(hora => {
    const ocupado = citas.some(c => c.hora === hora);
    const btn = document.createElement("button");
    btn.textContent = hora;

    if (ocupado) {
      btn.disabled = true;
    } else {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".horarios button")
          .forEach(b => b.classList.remove("seleccionado"));
        btn.classList.add("seleccionado");
        horaSeleccionada = hora;
      });
    }

    contenedorHorarios.appendChild(btn);
  });
}

document.getElementById("reservar").addEventListener("click", async () => {
  const nombre = document.getElementById("nombre").value;
  const telefono = document.getElementById("telefono").value;
  const fecha = fechaInput.value;

  const res = await fetch("/reservar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, telefono, fecha, hora: horaSeleccionada })
  });

  const data = await res.json();
  mensaje.innerText = data.mensaje;
  cargarHorarios();
});

cargarHorarios();
