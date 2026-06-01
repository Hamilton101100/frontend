/* Configuración global */
const URL_BASE_API = "https://gestionpersonas.infinityfreeapp.com/panther/rest";

const EstadoApp = {
  usuarioAutenticado: false,
  claveAPI: null,
  idPersonaEditando: null,
  idDocumentoEditando: null,
  tiposDocumento: [],
  // Datos en memoria para los selects en cascada
  todosLosPaises: [],
  todosLosEstados: [],
  todasLasCiudades: [],
};

let bsModalDocumento;
let bsModalPersona;
let bsModalConfirmar;

/* Función helper para peticiones autenticadas */
async function fetchConAutenticacion(url, opciones = {}) {
  const configuracion = {
    method: opciones.method || "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: EstadoApp.claveAPI || "",
    },
  };
  if (opciones.body) configuracion.body = opciones.body;
  return fetch(url, configuracion);
}

/* Inicialización */
document.addEventListener("DOMContentLoaded", () => {
  bsModalDocumento = new bootstrap.Modal(
    document.getElementById("modal-documento"),
  );
  bsModalPersona = new bootstrap.Modal(
    document.getElementById("modal-persona"),
  );
  bsModalConfirmar = new bootstrap.Modal(
    document.getElementById("modal-confirmar"),
  );

  configurarNavegacion();
  configurarFormularioLogin();
  configurarFormularioDocumentos();
  configurarFormularioPersonas();
  configurarModalConfirmacion();
});

const seccionLogin = document.getElementById("seccion-login");
const panelPrincipal = document.getElementById("panel-principal");
const crudPersonas = document.getElementById("crud-personas");
const crudDocumentos = document.getElementById("crud-documentos");
const btnNavPersonas = document.getElementById("btn-nav-personas");
const btnNavDocumentos = document.getElementById("btn-nav-documentos");
const btnCerrarSesion = document.getElementById("btn-cerrar-sesion");

/* Navegación */
function configurarNavegacion() {
  btnNavPersonas.addEventListener("click", () => {
    btnNavPersonas.classList.add("active");
    btnNavDocumentos.classList.remove("active");
    crudPersonas.classList.remove("oculto");
    crudDocumentos.classList.add("oculto");
    cargarTablaPersonas();
  });

  btnNavDocumentos.addEventListener("click", () => {
    btnNavDocumentos.classList.add("active");
    btnNavPersonas.classList.remove("active");
    crudDocumentos.classList.remove("oculto");
    crudPersonas.classList.add("oculto");
    cargarTablaDocumentos();
  });

  btnCerrarSesion.addEventListener("click", () => {
    EstadoApp.usuarioAutenticado = false;
    EstadoApp.claveAPI = null;
    EstadoApp.tiposDocumento = [];
    EstadoApp.idPersonaEditando = null;
    EstadoApp.idDocumentoEditando = null;
    EstadoApp.todosLosPaises = [];
    EstadoApp.todosLosEstados = [];
    EstadoApp.todasLasCiudades = [];
    panelPrincipal.classList.add("oculto");
    seccionLogin.classList.remove("oculto");
  });
}

/* Formulario de login */
function configurarFormularioLogin() {
  const formularioLogin = document.getElementById("formulario-login");
  const mensajeError = document.getElementById("error-login");

  formularioLogin.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    mensajeError.classList.add("oculto");

    const usuario = document.getElementById("usuario").value;
    const contrasena = document.getElementById("contrasena").value;

    try {
      const respuesta = await fetch(
        `${URL_BASE_API}/?PATH_INFO=useraction/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: usuario, password: contrasena }),
        },
      );
      if (!respuesta.ok) {
        throw new Error(`Error HTTP: ${respuesta.status}`);
      }
      const texto = await respuesta.text();
      if (!texto) {
        throw new Error("Respuesta vacía del servidor");
      }
      const resultado = JSON.parse(texto);

      if (resultado.code === 200 && resultado.data) {
        EstadoApp.usuarioAutenticado = true;
        EstadoApp.claveAPI = resultado.data.keyAPI;
        formularioLogin.reset();
        seccionLogin.classList.add("oculto");
        panelPrincipal.classList.remove("oculto");
        // Precarga todos los datos al iniciar sesión
        await Promise.all([
          cargarTablaPersonas(),
          cargarSelectTiposDocumento(),
          precargarPaises(),
          precargarEstados(),
          precargarCiudades(),
        ]);
      } else {
        mensajeError.textContent = "Credenciales incorrectas.";
        mensajeError.classList.remove("oculto");
      }
    } catch (error) {
      mensajeError.textContent = "Error de comunicación con el servidor.";
      mensajeError.classList.remove("oculto");
    }
  });
}

function alternarContrasena() {
  const campo = document.getElementById("contrasena");
  campo.type = campo.type === "password" ? "text" : "password";
}

/* Precarga de países */
async function precargarPaises() {
  try {
    const respuesta = await fetchConAutenticacion(
      `${URL_BASE_API}/?PATH_INFO=countries`,
    );
    if (!respuesta.ok) {
      throw new Error(`Error HTTP: ${respuesta.status}`);
    }
    const texto = await respuesta.text();
    if (!texto) {
      throw new Error("Respuesta vacía del servidor");
    }
    const resultado = JSON.parse(texto);
    EstadoApp.todosLosPaises = Array.isArray(resultado.data)
      ? resultado.data
      : [];
    llenarSelectPaises();
  } catch (error) {
    console.error("Error al precargar países:", error.message || error);
  }
}

async function precargarEstados() {
  try {
    const respuesta = await fetchConAutenticacion(
      `${URL_BASE_API}/?PATH_INFO=states`,
    );
    if (!respuesta.ok) {
      throw new Error(`Error HTTP: ${respuesta.status}`);
    }
    const texto = await respuesta.text();
    if (!texto) {
      throw new Error("Respuesta vacía del servidor");
    }
    const resultado = JSON.parse(texto);
    EstadoApp.todosLosEstados = Array.isArray(resultado.data)
      ? resultado.data
      : [];
  } catch (error) {
    console.error("Error al precargar estados:", error.message || error);
  }
}

async function precargarCiudades() {
  try {
    const respuesta = await fetchConAutenticacion(
      `${URL_BASE_API}/?PATH_INFO=cities`,
    );
    if (!respuesta.ok) {
      throw new Error(`Error HTTP: ${respuesta.status}`);
    }
    const texto = await respuesta.text();
    if (!texto) {
      throw new Error("Respuesta vacía del servidor");
    }
    const resultado = JSON.parse(texto);
    EstadoApp.todasLasCiudades = Array.isArray(resultado.data)
      ? resultado.data
      : [];
  } catch (error) {
    console.error("Error al precargar ciudades:", error.message || error);
  }
}

async function cargarCiudadesPorEstado(estadoId) {
  try {
    const respuesta = await fetchConAutenticacion(
      `${URL_BASE_API}/?PATH_INFO=cities/state/${estadoId}`,
    );
    if (!respuesta.ok) {
      throw new Error(`Error HTTP: ${respuesta.status}`);
    }
    const texto = await respuesta.text();
    if (!texto) {
      return [];
    }
    const resultado = JSON.parse(texto);
    return Array.isArray(resultado.data) ? resultado.data : [];
  } catch (error) {
    console.error(
      "Error al cargar ciudades por estado:",
      error.message || error,
    );
    return [];
  }
}

function llenarSelectPaises() {
  const select = document.getElementById("persona-pais");
  select.innerHTML = '<option value="">-- Seleccione un país --</option>';
  EstadoApp.todosLosPaises.forEach((pais) => {
    const opcion = document.createElement("option");
    opcion.value = pais.country_id;
    opcion.textContent = pais.country_name;
    select.appendChild(opcion);
  });
}

function alCambiarPais() {
  const paisId = document.getElementById("persona-pais").value;
  const selectEstado = document.getElementById("persona-estado");
  const selectCiudad = document.getElementById("persona-ciudad");

  selectEstado.innerHTML =
    '<option value="">-- Seleccione un estado --</option>';
  selectCiudad.innerHTML =
    '<option value="">-- Seleccione primero un estado --</option>';
  selectEstado.disabled = true;
  selectCiudad.disabled = true;

  if (!paisId) return;

  const estadosFiltrados = EstadoApp.todosLosEstados.filter(
    (e) => String(e.country_id) === String(paisId),
  );

  estadosFiltrados.forEach((estado) => {
    const opcion = document.createElement("option");
    opcion.value = estado.id_state;
    opcion.textContent = estado.state;
    selectEstado.appendChild(opcion);
  });

  selectEstado.disabled = estadosFiltrados.length === 0;
}

async function alCambiarEstado() {
  const estadoId = document.getElementById("persona-estado").value;
  const selectCiudad = document.getElementById("persona-ciudad");

  selectCiudad.innerHTML =
    '<option value="">-- Seleccione una ciudad --</option>';
  selectCiudad.disabled = true;

  if (!estadoId) return;

  const ciudadesFiltradas = await cargarCiudadesPorEstado(estadoId);

  ciudadesFiltradas.forEach((ciudad) => {
    const opcion = document.createElement("option");
    opcion.value = ciudad.id_city;
    opcion.textContent = ciudad.city;
    selectCiudad.appendChild(opcion);
  });

  selectCiudad.disabled = ciudadesFiltradas.length === 0;
}

/* Modal de documentos */
function abrirModalDocumento(doc = null) {
  EstadoApp.idDocumentoEditando = doc ? doc.id : null;
  document.getElementById("doc-nombre-largo").value = doc
    ? doc.nombre_largo
    : "";
  document.getElementById("doc-nombre-corto").value = doc
    ? doc.nombre_corto
    : "";
  document.getElementById("titulo-modal-documento").textContent = doc
    ? "Editar Tipo de Documento"
    : "Nuevo Tipo de Documento";
  bsModalDocumento.show();
}

function cerrarModalDocumento() {
  bsModalDocumento.hide();
  document.getElementById("form-documento").reset();
  EstadoApp.idDocumentoEditando = null;
}

async function abrirModalPersona(persona = null) {
  EstadoApp.idPersonaEditando = persona ? persona.id : null;

  document.getElementById("persona-nombre").value = persona ? persona.name : "";
  document.getElementById("persona-apellido").value = persona
    ? persona.lastName
    : "";
  document.getElementById("persona-telefono").value = persona
    ? String(persona.phone || "")
    : "";
  document.getElementById("persona-num-doc").value = persona
    ? persona.numero_documento || ""
    : "";
  document.getElementById("persona-tipo-doc").value = persona
    ? persona.tipo_documento_id || ""
    : "";

  llenarSelectPaises();

  if (persona && persona.country_id) {
    document.getElementById("persona-pais").value = persona.country_id;
    alCambiarPais();
    if (persona.state_id) {
      document.getElementById("persona-estado").value = persona.state_id;
      await alCambiarEstado();
      if (persona.city_id) {
        document.getElementById("persona-ciudad").value = persona.city_id;
      }
    }
  } else {
    document.getElementById("persona-estado").innerHTML =
      '<option value="">-- Seleccione primero un país --</option>';
    document.getElementById("persona-estado").disabled = true;
    document.getElementById("persona-ciudad").innerHTML =
      '<option value="">-- Seleccione primero un estado --</option>';
    document.getElementById("persona-ciudad").disabled = true;
  }

  document.getElementById("titulo-modal-persona").textContent = persona
    ? "Editar Persona"
    : "Nueva Persona";
  bsModalPersona.show();
}

function cerrarModalPersona() {
  bsModalPersona.hide();
  document.getElementById("form-persona").reset();
  EstadoApp.idPersonaEditando = null;
  document.getElementById("persona-estado").disabled = true;
  document.getElementById("persona-ciudad").disabled = true;
}

function cerrarModalConfirmar() {
  bsModalConfirmar.hide();
  accionConfirmada = null;
}

/* Modal de confirmación */
let accionConfirmada = null;

function configurarModalConfirmacion() {
  document
    .getElementById("modal-btn-confirmar")
    .addEventListener("click", () => {
      bsModalConfirmar.hide();
      if (accionConfirmada) accionConfirmada();
      accionConfirmada = null;
    });
}

function mostrarConfirmacion(mensaje, accion) {
  document.getElementById("modal-mensaje").textContent = mensaje;
  accionConfirmada = accion;
  bsModalConfirmar.show();
}

/* CRUD: Tipo de Documento */
function configurarFormularioDocumentos() {
  document
    .getElementById("form-documento")
    .addEventListener("submit", async (evento) => {
      evento.preventDefault();

      const nombreLargo = document
        .getElementById("doc-nombre-largo")
        .value.trim();
      const nombreCorto = document
        .getElementById("doc-nombre-corto")
        .value.trim()
        .toUpperCase();

      if (!nombreLargo || !nombreCorto) {
        mostrarNotificacion("Por favor completa todos los campos.", "error");
        return;
      }

      const esEdicion = EstadoApp.idDocumentoEditando !== null;
      const url = esEdicion
        ? `${URL_BASE_API}/?PATH_INFO=tipodocumentos/${EstadoApp.idDocumentoEditando}`
        : `${URL_BASE_API}/?PATH_INFO=tipodocumentos`;
      const metodo = esEdicion ? "PUT" : "POST";

      try {
        const respuesta = await fetchConAutenticacion(url, {
          method: metodo,
          body: JSON.stringify({
            nombre_largo: nombreLargo,
            nombre_corto: nombreCorto,
          }),
        });
        if (!respuesta.ok) {
          throw new Error(`Error HTTP: ${respuesta.status}`);
        }
        const texto = await respuesta.text();
        const resultado = JSON.parse(texto);

        if (resultado.code === 200 || resultado.code === 201) {
          cerrarModalDocumento();
          cargarTablaDocumentos();
          cargarSelectTiposDocumento();
          mostrarNotificacion(
            esEdicion ? "Tipo actualizado." : "Tipo creado correctamente.",
          );
        } else {
          mostrarNotificacion("Hubo un problema al guardar.", "error");
        }
      } catch (error) {
        mostrarNotificacion("Error de conexión.", "error");
      }
    });
}

async function cargarTablaDocumentos() {
  const cuerpoTabla = document.getElementById("tabla-documentos-cuerpo");
  cuerpoTabla.innerHTML = "<tr><td colspan='4'>Cargando...</td></tr>";

  try {
    const respuesta = await fetchConAutenticacion(
      `${URL_BASE_API}/?PATH_INFO=tipodocumentos`,
    );
    if (!respuesta.ok) {
      throw new Error(`Error HTTP: ${respuesta.status}`);
    }
    const texto = await respuesta.text();
    if (!texto) {
      throw new Error("Respuesta vacía");
    }
    const resultado = JSON.parse(texto);

    EstadoApp.tiposDocumento = documentos;
    cuerpoTabla.innerHTML = "";

    if (documentos.length === 0) {
      cuerpoTabla.innerHTML =
        "<tr><td colspan='4'>No hay tipos registrados.</td></tr>";
      return;
    }

    documentos.forEach((doc, indice) => {
      const fila = document.createElement("tr");
      // BOTONES ACTUALIZADOS A CLASES NATIVAS DE BOOTSTRAP (`btn-outline-...` y `me-1` para separarlos)
      fila.innerHTML = `
        <td>${indice + 1}</td>
        <td>${doc.nombre_largo || ""}</td>
        <td><span class="badge-tipo">${doc.nombre_corto || ""}</span></td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-success me-1" onclick='abrirModalDocumento(${JSON.stringify(doc)})'>
            <i class="bi bi-pencil-square me-1"></i>Editar
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="eliminarDocumento(${doc.id})">
            <i class="bi bi-trash me-1"></i>Eliminar
          </button>
        </td>
      `;
      cuerpoTabla.appendChild(fila);
    });
  } catch (error) {
    cuerpoTabla.innerHTML = "<tr><td colspan='4'>Error al conectar.</td></tr>";
  }
}

async function cargarSelectTiposDocumento() {
  const selectDoc = document.getElementById("persona-tipo-doc");
  if (!selectDoc) return;
  try {
    const respuesta = await fetchConAutenticacion(
      `${URL_BASE_API}/?PATH_INFO=tipodocumentos`,
    );
    if (!respuesta.ok) {
      throw new Error(`Error HTTP: ${respuesta.status}`);
    }
    const texto = await respuesta.text();
    const resultado = JSON.parse(texto);
    const documentos = Array.isArray(resultado.data)
      ? resultado.data.filter((d) => !d.dateDelete)
      : [];
    EstadoApp.tiposDocumento = documentos;
    selectDoc.innerHTML = '<option value="">-- Seleccione --</option>';
    documentos.forEach((doc) => {
      const opcion = document.createElement("option");
      opcion.value = doc.id;
      opcion.textContent = `${doc.nombre_corto} — ${doc.nombre_largo}`;
      selectDoc.appendChild(opcion);
    });
  } catch (error) {
    console.error("Error al cargar tipos:", error);
  }
}

async function eliminarDocumento(id) {
  mostrarConfirmacion(
    "¿Seguro que deseas eliminar este tipo de documento?",
    async () => {
      try {
        const respuesta = await fetchConAutenticacion(
          `${URL_BASE_API}/?PATH_INFO=tipodocumentos/${id}`,
          { method: "DELETE" },
        );
        if (!respuesta.ok) {
          throw new Error(`Error HTTP: ${respuesta.status}`);
        }
        const texto = await respuesta.text();
        const resultado = JSON.parse(texto);
        if (resultado.code === 200) {
          cargarTablaDocumentos();
          mostrarNotificacion("Tipo eliminado correctamente.");
        } else {
          mostrarNotificacion("No se pudo eliminar.", "error");
        }
      } catch (error) {
        mostrarNotificacion("Error de conexión.", "error");
      }
    },
  );
}

/* CRUD: Personas */
function configurarFormularioPersonas() {
  const selectPais = document.getElementById("persona-pais");
  const selectEstado = document.getElementById("persona-estado");

  if (selectPais) {
    selectPais.addEventListener("change", alCambiarPais);
  }
  if (selectEstado) {
    selectEstado.addEventListener("change", () => {
      alCambiarEstado();
    });
  }

  document
    .getElementById("form-persona")
    .addEventListener("submit", async (evento) => {
      evento.preventDefault();

      const nombre = document.getElementById("persona-nombre").value.trim();
      const apellido = document.getElementById("persona-apellido").value.trim();
      const telefono = document.getElementById("persona-telefono").value.trim();
      const tipoDocId = document.getElementById("persona-tipo-doc").value;
      const numDoc = document.getElementById("persona-num-doc").value.trim();
      const paisId = document.getElementById("persona-pais").value;
      const estadoId = document.getElementById("persona-estado").value;
      const ciudadId = document.getElementById("persona-ciudad").value;

      if (!nombre || !apellido) {
        mostrarNotificacion("Nombre y apellido son obligatorios.", "error");
        return;
      }

      const esEdicion = EstadoApp.idPersonaEditando !== null;
      const url = esEdicion
        ? `${URL_BASE_API}/?PATH_INFO=persons/${EstadoApp.idPersonaEditando}`
        : `${URL_BASE_API}/?PATH_INFO=persons`;
      const metodo = esEdicion ? "PUT" : "POST";

      const datos = {
        name: nombre,
        lastName: apellido,
        phone: telefono || "0",
        tipo_documento_id: tipoDocId ? parseInt(tipoDocId) : null,
        numero_documento: numDoc || null,
        country_id: paisId ? parseInt(paisId) : null,
        state_id: estadoId ? parseInt(estadoId) : null,
        city_id: ciudadId ? parseInt(ciudadId) : null,
      };

      try {
        const respuesta = await fetchConAutenticacion(url, {
          method: metodo,
          body: JSON.stringify(datos),
        });
        if (!respuesta.ok) {
          throw new Error(`Error HTTP: ${respuesta.status}`);
        }
        const texto = await respuesta.text();
        const resultado = JSON.parse(texto);

        if (resultado.code === 200 || resultado.code === 201) {
          cerrarModalPersona();
          cargarTablaPersonas();
          mostrarNotificacion(
            esEdicion
              ? "Persona actualizada."
              : "Persona creada correctamente.",
          );
        } else {
          mostrarNotificacion("Hubo un problema al guardar.", "error");
        }
      } catch (error) {
        mostrarNotificacion("Error de conexión.", "error");
      }
    });
}

async function cargarTablaPersonas() {
  const cuerpoTabla = document.getElementById("tabla-personas-cuerpo");
  cuerpoTabla.innerHTML = "<tr><td colspan='9'>Cargando personas...</td></tr>";

  try {
    if (EstadoApp.tiposDocumento.length === 0) {
      await cargarSelectTiposDocumento();
    }

    const respuesta = await fetchConAutenticacion(
      `${URL_BASE_API}/?PATH_INFO=persons`,
    );
    if (!respuesta.ok) {
      throw new Error(`Error HTTP: ${respuesta.status}`);
    }
    const texto = await respuesta.text();
    const resultado = JSON.parse(texto);
    const personas = Array.isArray(resultado.data)
      ? resultado.data.filter((p) => !p.dateDelete)
      : [];

    cuerpoTabla.innerHTML = "";

    if (personas.length === 0) {
      cuerpoTabla.innerHTML =
        "<tr><td colspan='9'>No hay personas registradas.</td></tr>";
      return;
    }

    personas.forEach((persona, indice) => {
      const tipoDoc = EstadoApp.tiposDocumento.find(
        (t) => t.id == persona.tipo_documento_id,
      );
      const nombreTipo = tipoDoc
        ? `<span class="badge-tipo">${tipoDoc.nombre_corto}</span>`
        : "—";

      const pais = EstadoApp.todosLosPaises.find(
        (p) => p.country_id == persona.country_id,
      );
      const nombrePais = pais ? pais.country_name : "—";

      const estado = EstadoApp.todosLosEstados.find(
        (e) => e.id_state == persona.state_id,
      );
      const nombreEstado = estado ? estado.state : "—";

      const ciudad = EstadoApp.todasLasCiudades.find(
        (c) => c.id_city == persona.city_id,
      );
      const nombreCiudad = ciudad ? ciudad.city : "—";

      const fila = document.createElement("tr");
      // BOTONES ACTUALIZADOS A CLASES NATIVAS DE BOOTSTRAP (`btn-outline-...` y `me-1` para separarlos)
      fila.innerHTML = `
        <td>${indice + 1}</td>
        <td><strong>${persona.name || ""}</strong> ${persona.lastName || ""}</td>
        <td>${persona.phone ? String(persona.phone) : "—"}</td>
        <td>${persona.numero_documento || "—"}</td>
        <td>${nombreTipo}</td>
        <td>${nombrePais}</td>
        <td>${nombreEstado}</td>
        <td>${nombreCiudad}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-success me-1" onclick='abrirModalPersona(${JSON.stringify(persona)})'>
            <i class="bi bi-pencil-square me-1"></i>Editar
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="eliminarPersona(${persona.id})">
            <i class="bi bi-trash me-1"></i>Eliminar
          </button>
        </td>
      `;
      cuerpoTabla.appendChild(fila);
    });
  } catch (error) {
    cuerpoTabla.innerHTML = "<tr><td colspan='9'>Error al conectar.</td></tr>";
  }
}

async function eliminarPersona(id) {
  mostrarConfirmacion("¿Seguro que deseas eliminar esta persona?", async () => {
    try {
      const respuesta = await fetchConAutenticacion(
        `${URL_BASE_API}/?PATH_INFO=persons/${id}`,
        { method: "DELETE" },
      );
      if (!respuesta.ok) {
        throw new Error(`Error HTTP: ${respuesta.status}`);
      }
      const texto = await respuesta.text();
      if (!texto) {
        throw new Error("Respuesta vacía del servidor");
      }
      const resultado = JSON.parse(texto);
      if (resultado.code === 200) {
        cargarTablaPersonas();
        mostrarNotificacion("Persona eliminada correctamente.");
      } else {
        mostrarNotificacion("No se pudo eliminar.", "error");
      }
    } catch (error) {
      mostrarNotificacion("Error de conexión.", "error");
    }
  });
}

/* Notificación flotante */
function mostrarNotificacion(mensaje, tipo = "exito") {
  let notificacion = document.getElementById("notificacion-toast");
  if (!notificacion) {
    notificacion = document.createElement("div");
    notificacion.id = "notificacion-toast";
    notificacion.style.cssText = `
      position:fixed; bottom:2rem; right:2rem;
      padding:.85rem 1.5rem; border-radius:10px;
      font-size:14px; font-weight:500; z-index:9999;
      box-shadow:0 8px 24px rgba(0,0,0,0.3);
      transition:all 0.3s ease; max-width:320px;
    `;
    document.body.appendChild(notificacion);
  }
  if (tipo === "exito") {
    notificacion.style.background = "#0e0e24";
    notificacion.style.border = "1px solid rgba(52,211,153,0.4)";
    notificacion.style.color = "#34d399";
  } else {
    notificacion.style.background = "#0e0e24";
    notificacion.style.border = "1px solid rgba(248,113,113,0.4)";
    notificacion.style.color = "#f87171";
  }
  notificacion.textContent = mensaje;
  notificacion.style.opacity = "1";
  notificacion.style.transform = "translateY(0)";
  setTimeout(() => {
    notificacion.style.opacity = "0";
    notificacion.style.transform = "translateY(20px)";
  }, 3000);
}
