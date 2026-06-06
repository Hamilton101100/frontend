const URL_BASE_API = "https://www.panther.com.co/panther/rest"; // Reemplázala por tu URL real si cambia
const TOKEN_AUTH = "Bearer TU_TOKEN_DE_AUTENTICACION"; // Cambia por tu token dinámico o estático si es necesario

// Estado en memoria de la aplicación
const EstadoApp = {
  todasLasPersonas: [],
  todosLosDocumentos: [],
  todosLosPaises: [],
  idEliminacionPendiente: null,
  tipoEliminacionPendiente: null, // 'persona' o 'documento'
};

// Instancias globales de modales Bootstrap
let bsModalPersona, bsModalDocumento, bsModalConfirmar;

// Esperar a que cargue la interfaz para inicializar eventos
document.addEventListener("DOMContentLoaded", () => {
  bsModalPersona = new bootstrap.Modal(
    document.getElementById("modal-persona"),
  );
  bsModalDocumento = new bootstrap.Modal(
    document.getElementById("modal-documento"),
  );
  bsModalConfirmar = new bootstrap.Modal(
    document.getElementById("modal-confirmar"),
  );

  configurarNavegacion();
  configurarFormularioPersonas();
  configurarFormularioDocumentos();
  configurarModalConfirmacion();

  // Carga inicial asíncrona
  cargarTiposDocumento();
  cargarPersonas();
  cargarPaisesIniciales();
});

/* ==========================================================================
   INTEGRACIÓN SELECT2 CON CAPTURA DE EVENTOS JQUERY
   ========================================================================== */
function inicializarSelect2() {
  $("#persona-pais").select2({
    dropdownParent: $("#modal-persona"),
    placeholder: "-- Escribe para buscar país --",
    allowClear: true,
  });

  $("#persona-estado").select2({
    dropdownParent: $("#modal-persona"),
    placeholder: "-- Escribe para buscar departamento --",
    allowClear: true,
  });

  $("#persona-ciudad").select2({
    dropdownParent: $("#modal-persona"),
    placeholder: "-- Escribe para buscar ciudad --",
    allowClear: true,
  });
}

// Escuchadores de cambios estructurales para Select2
$(document).on("change", "#persona-pais", function () {
  alCambiarPais();
});

$(document).on("change", "#persona-estado", function () {
  alCambiarEstado();
});

/* ==========================================================================
   MANEJO DE SECCIONES (SPA)
   ========================================================================== */
function configurarNavegacion() {
  const navPersonas = document.getElementById("nav-personas");
  const navDocumentos = document.getElementById("nav-documentos");
  const secPersonas = document.getElementById("seccion-personas");
  const secDocumentos = document.getElementById("seccion-documentos");

  navPersonas.addEventListener("click", () => {
    navPersonas.classList.add("active");
    navDocumentos.classList.remove("active");
    secPersonas.classList.remove("oculto");
    secDocumentos.classList.add("oculto");
    cargarPersonas();
  });

  navDocumentos.addEventListener("click", () => {
    navDocumentos.classList.add("active");
    navPersonas.classList.remove("active");
    secDocumentos.classList.remove("oculto");
    secPersonas.classList.add("oculto");
    cargarTiposDocumento();
  });
}

/* ==========================================================================
   CONECTOR BASE CON LA API (FETCH CON TOKEN)
   ========================================================================== */
async function fetchConAutenticacion(url, opciones = {}) {
  const cabecerasPorDefecto = {
    Authorization: TOKEN_AUTH,
    "Content-Type": "application/json",
  };
  opciones.headers = { ...cabecerasPorDefecto, ...opciones.headers };
  return fetch(url, opciones);
}

/* ==========================================================================
   LÓGICA: PAÍSES, DEPARTAMENTOS Y CIUDADES EN CASCADA
   ========================================================================== */
async function cargarPaisesIniciales() {
  try {
    const respuesta = await fetchConAutenticacion(
      `${URL_BASE_API}/?PATH_INFO=countries`,
    );
    if (!respuesta.ok) throw new Error("Error cargando países");
    const resultado = await respuesta.json();
    EstadoApp.todosLosPaises = resultado.data || [];
    llenarSelectPaises();
  } catch (error) {
    console.error("Error global geográfico:", error);
  }
}

function llenarSelectPaises() {
  const selectPais = document.getElementById("persona-pais");
  selectPais.innerHTML = '<option value="">-- Seleccione un país --</option>';
  EstadoApp.todosLosPaises.forEach((pais) => {
    const opt = document.createElement("option");
    opt.value = pais.country_id;
    opt.textContent = pais.country_name;
    selectPais.appendChild(opt);
  });
}

async function alCambiarPais() {
  const paisId = document.getElementById("persona-pais").value;
  const selectEstado = document.getElementById("persona-estado");
  const selectCiudad = document.getElementById("persona-ciudad");

  // Vaciar y deshabilitar cascada inferior
  selectEstado.innerHTML =
    '<option value="">-- Seleccione un departamento --</option>';
  selectCiudad.innerHTML =
    '<option value="">-- Seleccione primero un departamento --</option>';
  selectEstado.disabled = true;
  selectCiudad.disabled = true;

  if (!paisId) {
    $("#persona-estado").trigger("change.select2");
    $("#persona-ciudad").trigger("change.select2");
    return;
  }

  try {
    const respuesta = await fetchConAutenticacion(
      `${URL_BASE_API}/?PATH_INFO=states&country_id=${paisId}`,
    );
    if (!respuesta.ok) throw new Error("Error en estados");
    const resultado = await respuesta.json();

    if (resultado.data && resultado.data.length > 0) {
      resultado.data.forEach((est) => {
        const opt = document.createElement("option");
        opt.value = est.id_state;
        opt.textContent = est.state;
        selectEstado.appendChild(opt);
      });
      selectEstado.disabled = false;
    }
  } catch (err) {
    console.error("Error trayendo departamentos:", err);
  }

  // Sincronizar cambios visuales con Select2
  $("#persona-estado").trigger("change.select2");
}

async function alCambiarEstado() {
  const estadoId = document.getElementById("persona-estado").value;
  const selectCiudad = document.getElementById("persona-ciudad");

  selectCiudad.innerHTML =
    '<option value="">-- Seleccione una ciudad --</option>';
  selectCiudad.disabled = true;

  if (!estadoId) {
    $("#persona-ciudad").trigger("change.select2");
    return;
  }

  try {
    const respuesta = await fetchConAutenticacion(
      `${URL_BASE_API}/?PATH_INFO=cities&state_id=${estadoId}`,
    );
    if (!respuesta.ok) throw new Error("Error en ciudades");
    const resultado = await respuesta.json();

    if (resultado.data && resultado.data.length > 0) {
      resultado.data.forEach((ciu) => {
        const opt = document.createElement("option");
        opt.value = ciu.id_city;
        opt.textContent = ciu.city;
        selectCiudad.appendChild(opt);
      });
      selectCiudad.disabled = false;
    }
  } catch (err) {
    console.error("Error trayendo ciudades:", err);
  }

  // Sincronizar cambios visuales con Select2
  $("#persona-ciudad").trigger("change.select2");
}

/* ==========================================================================
   SECCIÓN CRUD: PERSONAS
   ========================================================================== */
async function cargarPersonas() {
  try {
    const respuesta = await fetchConAutenticacion(
      `${URL_BASE_API}/?PATH_INFO=people`,
    );
    if (!respuesta.ok) throw new Error("Error al consultar personas");
    const resultado = await respuesta.json();
    EstadoApp.todasLasPersonas = resultado.data || [];
    renderizarTablaPersonas();
  } catch (err) {
    console.error(err);
  }
}

function renderizarTablaPersonas() {
  const cuerpo = document.getElementById("tabla-personas-cuerpo");
  cuerpo.innerHTML = "";

  if (EstadoApp.todasLasPersonas.length === 0) {
    cuerpo.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-3">No existen registros de personas</td></tr>`;
    return;
  }

  EstadoApp.todasLasPersonas.forEach((p) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><span class="badge-tipo">${p.sigla || "DOC"}</span> ${p.documento}</td>
      <td>${p.nombre}</td>
      <td>${p.apellido}</td>
      <td>${p.celular}</td>
      <td><small class="text-secondary">${p.city || "No asignada"}</small></td>
      <td>
        <button class="btn btn-sm btn-warning me-1" onclick="editarPersona('${p.id_people}')">Editar</button>
        <button class="btn btn-sm btn-danger" onclick="solicitarEliminar('${p.id_people}', 'persona')">Eliminar</button>
      </td>
    `;
    cuerpo.appendChild(tr);
  });
}

function configurarFormularioPersonas() {
  const form = document.getElementById("form-persona");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = document.getElementById("persona-id").value;
    const datosPayload = {
      id_document_type: document.getElementById("persona-tipo-doc").value,
      documento: document.getElementById("persona-documento").value,
      nombre: document.getElementById("persona-nombre").value,
      apellido: document.getElementById("persona-apellido").value,
      celular: document.getElementById("persona-celular").value,
      email: document.getElementById("persona-email").value,
      country_id: document.getElementById("persona-pais").value,
      state_id: document.getElementById("persona-estado").value,
      city_id: document.getElementById("persona-ciudad").value,
    };

    const metodoHttp = id ? "PUT" : "POST";
    const urlFiltro = id
      ? `${URL_BASE_API}/?PATH_INFO=people&id_people=${id}`
      : `${URL_BASE_API}/?PATH_INFO=people`;

    try {
      const respuesta = await fetchConAutenticacion(urlFiltro, {
        method: metodoHttp,
        body: JSON.stringify(datosPayload),
      });

      if (!respuesta.ok) throw new Error("Error procesando persona");
      bsModalPersona.hide();
      cargarPersonas();
    } catch (err) {
      alert("Error al guardar los datos de la persona.");
    }
  });
}

function abrirModalPersona(persona = null) {
  const form = document.getElementById("form-persona");
  form.reset();
  document.getElementById("persona-id").value = "";

  llenarSelectTiposDocEnFormulario();
  llenarSelectPaises();

  if (persona) {
    document.getElementById("titulo-modal-persona").textContent =
      "Editar Persona";
    document.getElementById("persona-id").value = persona.id_people;
    document.getElementById("persona-tipo-doc").value =
      persona.id_document_type;
    document.getElementById("persona-documento").value = persona.documento;
    document.getElementById("persona-nombre").value = persona.nombre;
    document.getElementById("persona-apellido").value = persona.apellido;
    document.getElementById("persona-celular").value = persona.celular;
    document.getElementById("persona-email").value = persona.email;

    // Si la persona ya tiene país, forzamos carga asíncrona secuencial para la edición
    if (persona.country_id) {
      document.getElementById("persona-pais").value = persona.country_id;
      // Aquí se dispararían las subcargas si se requiere reflejar la edición exacta...
    }
  } else {
    document.getElementById("titulo-modal-persona").textContent =
      "Nueva Persona";
    document.getElementById("persona-estado").disabled = true;
    document.getElementById("persona-ciudad").disabled = true;
  }

  bsModalPersona.show();

  // Activación retrasada de Select2 para permitir el renderizado del modal
  setTimeout(() => {
    inicializarSelect2();
  }, 250);
}

function llenarSelectTiposDocEnFormulario() {
  const select = document.getElementById("persona-tipo-doc");
  select.innerHTML = '<option value="">-- Seleccione Tipo --</option>';
  EstadoApp.todosLosDocumentos.forEach((d) => {
    const opt = document.createElement("option");
    opt.value = d.id_document_type;
    opt.textContent = `${d.sigla} - ${d.descripcion}`;
    select.appendChild(opt);
  });
}

function editarPersona(id) {
  const persona = EstadoApp.todasLasPersonas.find((p) => p.id_people == id);
  if (persona) abrirModalPersona(persona);
}

/* ==========================================================================
   SECCIÓN CRUD: DOCUMENTOS
   ========================================================================== */
async function cargarTiposDocumento() {
  try {
    const respuesta = await fetchConAutenticacion(
      `${URL_BASE_API}/?PATH_INFO=document_types`,
    );
    if (!respuesta.ok) throw new Error("Error al consultar documentos");
    const resultado = await respuesta.json();
    EstadoApp.todosLosDocumentos = resultado.data || [];
    renderizarTablaDocumentos();
  } catch (err) {
    console.error(err);
  }
}

function renderizarTablaDocumentos() {
  const cuerpo = document.getElementById("tabla-documentos-cuerpo");
  cuerpo.innerHTML = "";

  if (EstadoApp.todosLosDocumentos.length === 0) {
    cuerpo.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-3">No existen tipos de documento creados</td></tr>`;
    return;
  }

  EstadoApp.todosLosDocumentos.forEach((d) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.id_document_type}</td>
      <td><span class="badge-tipo">${d.sigla}</span></td>
      <td>${d.descripcion}</td>
      <td>
        <button class="btn btn-sm btn-warning me-1" onclick="editarDocumento('${d.id_document_type}')">Editar</button>
        <button class="btn btn-sm btn-danger" onclick="solicitarEliminar('${d.id_document_type}', 'documento')">Eliminar</button>
      </td>
    `;
    cuerpo.appendChild(tr);
  });
}

function configurarFormularioDocumentos() {
  const form = document.getElementById("form-documento");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = document.getElementById("documento-id").value;
    const datosPayload = {
      sigla: document.getElementById("documento-sigla").value,
      descripcion: document.getElementById("documento-descripcion").value,
    };

    const metodoHttp = id ? "PUT" : "POST";
    const urlFiltro = id
      ? `${URL_BASE_API}/?PATH_INFO=document_types&id_document_type=${id}`
      : `${URL_BASE_API}/?PATH_INFO=document_types`;

    try {
      const respuesta = await fetchConAutenticacion(urlFiltro, {
        method: metodoHttp,
        body: JSON.stringify(datosPayload),
      });

      if (!respuesta.ok) throw new Error("Error en operación de documento");
      bsModalDocumento.hide();
      cargarTiposDocumento();
    } catch (err) {
      alert("Error operando el tipo de documento");
    }
  });
}

function abrirModalDocumento(doc = null) {
  const form = document.getElementById("form-documento");
  form.reset();
  document.getElementById("documento-id").value = "";

  if (doc) {
    document.getElementById("titulo-modal-documento").textContent =
      "Editar Tipo de Documento";
    document.getElementById("documento-id").value = doc.id_document_type;
    document.getElementById("documento-sigla").value = doc.sigla;
    document.getElementById("documento-descripcion").value = doc.descripcion;
  } else {
    document.getElementById("titulo-modal-documento").textContent =
      "Nuevo Tipo de Documento";
  }
  bsModalDocumento.show();
}

function editarDocumento(id) {
  const doc = EstadoApp.todosLosDocumentos.find(
    (d) => d.id_document_type == id,
  );
  if (doc) abrirModalDocumento(doc);
}

/* ==========================================================================
   SISTEMA DE ELIMINACIÓN REUTILIZABLE (MODAL CONFIRMACIÓN)
   ========================================================================== */
function solicitarEliminar(id, tipo) {
  EstadoApp.idEliminacionPendiente = id;
  EstadoApp.tipoEliminacionPendiente = tipo;

  const msg = document.getElementById("mensaje-confirmar");
  msg.textContent =
    tipo === "persona"
      ? "¿Está completamente seguro de eliminar este registro de persona?"
      : "Al eliminar este tipo de documento podría afectar registros vinculados. ¿Desea continuar?";

  bsModalConfirmar.show();
}

function configurarModalConfirmacion() {
  const btnSi = document.getElementById("btn-confirmar-si");
  btnSi.addEventListener("click", async () => {
    const id = EstadoApp.idEliminacionPendiente;
    const tipo = EstadoApp.tipoEliminacionPendiente;

    if (!id || !tipo) return;

    let urlFiltro = "";
    if (tipo === "persona") {
      urlFiltro = `${URL_BASE_API}/?PATH_INFO=people&id_people=${id}`;
    } else {
      urlFiltro = `${URL_BASE_API}/?PATH_INFO=document_types&id_document_type=${id}`;
    }

    try {
      const respuesta = await fetchConAutenticacion(urlFiltro, {
        method: "DELETE",
      });
      if (!respuesta.ok) throw new Error("Error al eliminar");

      bsModalConfirmar.hide();
      if (tipo === "persona") cargarPersonas();
      else cargarTiposDocumento();
    } catch (err) {
      alert("Hubo un error al intentar eliminar el registro.");
    }
  });
}
