/* Configuración inicial */
const URL_BASE_API = "https://gestionpersonas.infinityfreeapp.com/panther/rest";

const EstadoApp = {
  usuarioAutenticado: false,
  claveAPI: null,
  idPersonaEditando: null,
  idDocumentoEditando: null,
  idProfesionEditando: null,
  idMascotaEditando: null,
  tiposDocumento: [],
  profesiones: [],
  mascotas: [],
  todosLosPaises: [],
  todosLosEstados: [],
};

let bsModalDocumento;
let bsModalPersona;
let bsModalProfesion;
let bsModalMascota;
let bsModalConfirmar;

/* Helper: peticiones autenticadas */
async function fetchConAutenticacion(url, opciones = {}) {
  const configuracion = {
    method: opciones.method || "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: EstadoApp.claveAPI || "",
    },
  };
  if (opciones.body) configuracion.body = opciones.body;
  return await fetch(url, configuracion);
}

/* Inicialización de Select2 */
function inicializarSelect2() {
  $("#persona-tipo-doc").select2({
    theme: "bootstrap-5",
    width: "100%",
    allowClear: true,
    placeholder: "-- Seleccione --",
    dropdownParent: $("#modal-persona"),
  });

  $("#persona-pais").select2({
    theme: "bootstrap-5",
    width: "100%",
    allowClear: true,
    placeholder: "-- Seleccione un país --",
    dropdownParent: $("#modal-persona"),
  });

  $("#persona-estado").select2({
    theme: "bootstrap-5",
    width: "100%",
    allowClear: true,
    placeholder: "-- Seleccione un estado --",
    dropdownParent: $("#modal-persona"),
  });

  $("#persona-ciudad").select2({
    theme: "bootstrap-5",
    width: "100%",
    allowClear: true,
    placeholder: "-- Seleccione una ciudad --",
    dropdownParent: $("#modal-persona"),
  });
}

/* Inicialización*/
document.addEventListener("DOMContentLoaded", () => {
  bsModalDocumento = new bootstrap.Modal(
    document.getElementById("modal-documento"),
  );
  bsModalPersona = new bootstrap.Modal(
    document.getElementById("modal-persona"),
  );
  bsModalProfesion = new bootstrap.Modal(
    document.getElementById("modal-profesion"),
  );
  bsModalMascota = new bootstrap.Modal(
    document.getElementById("modal-mascota"),
  );
  bsModalConfirmar = new bootstrap.Modal(
    document.getElementById("modal-confirmar"),
  );

  inicializarSelect2();
  configurarNavegacion();
  configurarFormularioLogin();
  configurarFormularioDocumentos();
  configurarFormularioPersonas();
  configurarFormularioProfesiones();
  configurarFormularioMascotas();
  configurarModalConfirmacion();
});

const seccionLogin = document.getElementById("seccion-login");
const panelPrincipal = document.getElementById("panel-principal");
const crudPersonas = document.getElementById("crud-personas");
const crudDocumentos = document.getElementById("crud-documentos");
const crudProfesiones = document.getElementById("crud-profesiones");
const crudMascotas = document.getElementById("crud-mascotas");
const btnNavPersonas = document.getElementById("btn-nav-personas");
const btnNavDocumentos = document.getElementById("btn-nav-documentos");
const btnNavProfesiones = document.getElementById("btn-nav-profesiones");
const btnNavMascotas = document.getElementById("btn-nav-mascotas");
const btnCerrarSesion = document.getElementById("btn-cerrar-sesion");

/*Navegación*/
function configurarNavegacion() {
  btnNavPersonas.addEventListener("click", () => {
    btnNavPersonas.classList.add("active");
    btnNavDocumentos.classList.remove("active");
    btnNavProfesiones.classList.remove("active");
    btnNavMascotas.classList.remove("active");
    crudPersonas.classList.remove("oculto");
    crudDocumentos.classList.add("oculto");
    crudProfesiones.classList.add("oculto");
    crudMascotas.classList.add("oculto");
    cargarTablaPersonas();
  });

  btnNavDocumentos.addEventListener("click", () => {
    btnNavDocumentos.classList.add("active");
    btnNavPersonas.classList.remove("active");
    btnNavProfesiones.classList.remove("active");
    btnNavMascotas.classList.remove("active");
    crudDocumentos.classList.remove("oculto");
    crudPersonas.classList.add("oculto");
    crudProfesiones.classList.add("oculto");
    crudMascotas.classList.add("oculto");
    cargarTablaDocumentos();
  });

  btnNavProfesiones.addEventListener("click", () => {
    btnNavProfesiones.classList.add("active");
    btnNavPersonas.classList.remove("active");
    btnNavDocumentos.classList.remove("active");
    btnNavMascotas.classList.remove("active");
    crudProfesiones.classList.remove("oculto");
    crudPersonas.classList.add("oculto");
    crudDocumentos.classList.add("oculto");
    crudMascotas.classList.add("oculto");
    cargarTablaProfesiones();
  });

  btnNavMascotas.addEventListener("click", () => {
    btnNavMascotas.classList.add("active");
    btnNavPersonas.classList.remove("active");
    btnNavDocumentos.classList.remove("active");
    btnNavProfesiones.classList.remove("active");
    crudMascotas.classList.remove("oculto");
    crudPersonas.classList.add("oculto");
    crudDocumentos.classList.add("oculto");
    crudProfesiones.classList.add("oculto");
    cargarTablaMascotas();
  });

  btnCerrarSesion.addEventListener("click", () => {
    EstadoApp.usuarioAutenticado = false;
    EstadoApp.claveAPI = null;
    EstadoApp.tiposDocumento = [];
    EstadoApp.profesiones = [];
    EstadoApp.mascotas = [];
    EstadoApp.idPersonaEditando = null;
    EstadoApp.idDocumentoEditando = null;
    EstadoApp.idProfesionEditando = null;
    EstadoApp.idMascotaEditando = null;
    EstadoApp.todosLosPaises = [];
    EstadoApp.todosLosEstados = [];
    panelPrincipal.classList.add("oculto");
    seccionLogin.classList.remove("oculto");
  });
}

/*Login*/
function configurarFormularioLogin() {
  const formularioLogin = document.getElementById("formulario-login");
  const mensajeError = document.getElementById("error-login");

  formularioLogin.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    mensajeError.classList.add("oculto");

    const usuario = document.getElementById("usuario").value;
    const contrasena = document.getElementById("contrasena").value;

    try {
      const respuesta = await fetchConAutenticacion(
        `${URL_BASE_API}/?PATH_INFO=useraction/login`,
        {
          method: "POST",
          body: JSON.stringify({ user: usuario, password: contrasena }),
        },
      );
      if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);

      const texto = await respuesta.text();
      if (!texto) throw new Error("Respuesta vacía del servidor");

      const resultado = JSON.parse(texto);

      if (resultado.code === 200 && resultado.data) {
        EstadoApp.usuarioAutenticado = true;
        EstadoApp.claveAPI = resultado.data.keyAPI;
        formularioLogin.reset();
        seccionLogin.classList.add("oculto");
        panelPrincipal.classList.remove("oculto");
        await Promise.all([
          cargarSelectTiposDocumento(),
          precargarPaises(),
          precargarEstados(),
        ]);
        await cargarTablaPersonas();
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

/* Precarga de países y estados */
async function precargarPaises() {
  try {
    const respuesta = await fetchConAutenticacion(
      `${URL_BASE_API}/?PATH_INFO=countries`,
    );
    if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);
    const resultado = await respuesta.json();
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
    if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);
    const resultado = await respuesta.json();
    EstadoApp.todosLosEstados = Array.isArray(resultado.data)
      ? resultado.data
      : [];
  } catch (error) {
    console.error("Error al precargar estados:", error.message || error);
  }
}

async function cargarCiudadesPorEstado(estadoId) {
  try {
    const respuesta = await fetchConAutenticacion(
      `${URL_BASE_API}/?PATH_INFO=cities/state/${estadoId}`,
    );
    if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);
    const resultado = await respuesta.json();
    return Array.isArray(resultado.data) ? resultado.data : [];
  } catch (error) {
    console.error(
      "Error al cargar ciudades por estado:",
      error.message || error,
    );
    return [];
  }
}

/* Selects en cascada: País → Estado → Ciudad*/
function llenarSelectPaises() {
  const select = document.getElementById("persona-pais");
  select.innerHTML = '<option value="">-- Seleccione un país --</option>';
  EstadoApp.todosLosPaises.forEach((pais) => {
    const opcion = document.createElement("option");
    opcion.value = pais.country_id;
    opcion.textContent = pais.country_name;
    select.appendChild(opcion);
  });
  // Actualizar Select2 después de cambiar las opciones
  $("#persona-pais").trigger("change");
}

function alCambiarPais() {
  const paisId = document.getElementById("persona-pais").value;
  const selectEstado = document.getElementById("persona-estado");
  const selectCiudad = document.getElementById("persona-ciudad");

  // Limpiar estados y ciudades
  selectEstado.innerHTML =
    '<option value="">-- Seleccione un estado --</option>';
  selectCiudad.innerHTML =
    '<option value="">-- Seleccione primero un estado --</option>';

  // Limpiar Select2
  $("#persona-estado").val("").trigger("change");
  $("#persona-ciudad").val("").trigger("change");

  if (!paisId) {
    // Deshabilitar ambos
    selectEstado.disabled = true;
    selectCiudad.disabled = true;
    $("#persona-estado").prop("disabled", true);
    $("#persona-ciudad").prop("disabled", true);
    return;
  }

  // Filtrar y agregar estados
  const estadosFiltrados = EstadoApp.todosLosEstados.filter(
    (e) => String(e.country_id) === String(paisId),
  );

  estadosFiltrados.forEach((estado) => {
    const opcion = document.createElement("option");
    opcion.value = estado.id_state;
    opcion.textContent = estado.state;
    selectEstado.appendChild(opcion);
  });

  // Habilitar o deshabilitar según tengamos estados
  const tieneEstados = estadosFiltrados.length > 0;
  selectEstado.disabled = !tieneEstados;
  $("#persona-estado").prop("disabled", !tieneEstados).trigger("change");

  // Siempre deshabilitar ciudades hasta que se seleccione un estado
  selectCiudad.disabled = true;
  $("#persona-ciudad").prop("disabled", true).trigger("change");
}

async function alCambiarEstado() {
  const estadoId = document.getElementById("persona-estado").value;
  const selectCiudad = document.getElementById("persona-ciudad");

  // Limpiar ciudades
  selectCiudad.innerHTML =
    '<option value="">-- Seleccione una ciudad --</option>';

  // Limpiar Select2
  $("#persona-ciudad").val("").trigger("change");

  if (!estadoId) {
    // Deshabilitar ciudades
    selectCiudad.disabled = true;
    $("#persona-ciudad").prop("disabled", true).trigger("change");
    return;
  }

  // Cargar ciudades del estado
  const ciudadesFiltradas = await cargarCiudadesPorEstado(estadoId);

  ciudadesFiltradas.forEach((ciudad) => {
    const opcion = document.createElement("option");
    opcion.value = ciudad.id_city;
    opcion.textContent = ciudad.city;
    selectCiudad.appendChild(opcion);
  });

  // Habilitar o deshabilitar según tengamos ciudades
  const tieneCiudades = ciudadesFiltradas.length > 0;
  selectCiudad.disabled = !tieneCiudades;
  $("#persona-ciudad").prop("disabled", !tieneCiudades).trigger("change");
}

/* Modal Documento */
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

/* Modal Profesión */
function abrirModalProfesion(profesion = null) {
  EstadoApp.idProfesionEditando = profesion ? profesion.id : null;
  document.getElementById("profesion-nombre").value = profesion
    ? profesion.nombre || ""
    : "";
  document.getElementById("titulo-modal-profesion").textContent = profesion
    ? "Editar Profesión"
    : "Nueva Profesión";
  bsModalProfesion.show();
}

function cerrarModalProfesion() {
  bsModalProfesion.hide();
  document.getElementById("form-profesion").reset();
  EstadoApp.idProfesionEditando = null;
}

/* Modal Mascota */
function abrirModalMascota(mascota = null) {
  EstadoApp.idMascotaEditando = mascota ? mascota.id : null;
  document.getElementById("mascota-especie").value = mascota
    ? mascota.especie || ""
    : "";
  document.getElementById("mascota-raza").value = mascota
    ? mascota.raza || ""
    : "";
  document.getElementById("titulo-modal-mascota").textContent = mascota
    ? "Editar Mascota"
    : "Nueva Mascota";
  bsModalMascota.show();
}

function cerrarModalMascota() {
  bsModalMascota.hide();
  document.getElementById("form-mascota").reset();
  EstadoApp.idMascotaEditando = null;
}

/* Modal Persona */
async function abrirModalPersona(persona = null) {
  await cargarSelectTiposDocumento();
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

  // Actualizar Select2 de tipo de documento
  $("#persona-tipo-doc")
    .val(persona ? persona.tipo_documento_id || "" : "")
    .trigger("change");

  // Llenar países
  llenarSelectPaises();

  if (persona && persona.country_id) {
    // Seleccionar país (esto dispara alCambiarPais)
    $("#persona-pais").val(persona.country_id).trigger("change");

    // Esperar a que se carguen los estados
    await new Promise((r) => setTimeout(r, 150));

    if (persona.state_id) {
      // Seleccionar estado (esto dispara alCambiarEstado)
      $("#persona-estado").val(persona.state_id).trigger("change");

      // Esperar a que se carguen las ciudades
      await new Promise((r) => setTimeout(r, 150));

      if (persona.city_id) {
        // Seleccionar ciudad
        $("#persona-ciudad").val(persona.city_id).trigger("change");
      }
    }
  } else {
    // No hay persona: deshabilitar estados y ciudades
    document.getElementById("persona-estado").innerHTML =
      '<option value="">-- Seleccione primero un país --</option>';
    document.getElementById("persona-estado").disabled = true;

    document.getElementById("persona-ciudad").innerHTML =
      '<option value="">-- Seleccione primero un estado --</option>';
    document.getElementById("persona-ciudad").disabled = true;

    $("#persona-estado").val("").prop("disabled", true).trigger("change");
    $("#persona-ciudad").val("").prop("disabled", true).trigger("change");
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
  // Limpiar Select2
  $("#persona-tipo-doc").val("").trigger("change");
  $("#persona-pais").val("").trigger("change");
  $("#persona-estado").val("").trigger("change").prop("disabled", true);
  $("#persona-ciudad").val("").trigger("change").prop("disabled", true);
}

/* Modal Confirmación */
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

function cerrarModalConfirmar() {
  bsModalConfirmar.hide();
  accionConfirmada = null;
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
        if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);
        const resultado = await respuesta.json();

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
    if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);
    const resultado = await respuesta.json();
    const documentos = Array.isArray(resultado.data)
      ? resultado.data.filter((d) => !d.dateDelete)
      : [];

    EstadoApp.tiposDocumento = documentos;
    cuerpoTabla.innerHTML = "";

    if (documentos.length === 0) {
      cuerpoTabla.innerHTML =
        "<tr><td colspan='4'>No hay tipos registrados.</td></tr>";
      return;
    }

    documentos.forEach((doc, indice) => {
      const fila = document.createElement("tr");
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

function configurarFormularioProfesiones() {
  document
    .getElementById("form-profesion")
    .addEventListener("submit", async (evento) => {
      evento.preventDefault();

      const nombre = document
        .getElementById("profesion-nombre")
        .value.trim();
      if (!nombre) {
        mostrarNotificacion("Por favor ingresa el nombre de la profesión.", "error");
        return;
      }

      const esEdicion = EstadoApp.idProfesionEditando !== null;
      const url = esEdicion
        ? `${URL_BASE_API}/?PATH_INFO=profesiones/${EstadoApp.idProfesionEditando}`
        : `${URL_BASE_API}/?PATH_INFO=profesiones`;
      const metodo = esEdicion ? "PUT" : "POST";

      try {
        const respuesta = await fetchConAutenticacion(url, {
          method: metodo,
          body: JSON.stringify({
            nombre: nombre,
          }),
        });
        if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);
        const resultado = await respuesta.json();

        if (resultado.code === 200 || resultado.code === 201) {
          cerrarModalProfesion();
          cargarTablaProfesiones();
          mostrarNotificacion(
            esEdicion ? "Profesión actualizada." : "Profesión creada correctamente.",
          );
        } else {
          mostrarNotificacion("Hubo un problema al guardar.", "error");
        }
      } catch (error) {
        mostrarNotificacion("Error de conexión.", "error");
      }
    });
}

async function cargarTablaProfesiones() {
  const cuerpoTabla = document.getElementById("tabla-profesiones-cuerpo");
  cuerpoTabla.innerHTML = "<tr><td colspan='3'>Cargando...</td></tr>";

  try {
    const respuesta = await fetchConAutenticacion(
      `${URL_BASE_API}/?PATH_INFO=profesiones`,
    );
    if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);
    const resultado = await respuesta.json();
    const profesiones = Array.isArray(resultado.data)
      ? resultado.data.filter((d) => !d.dateDelete)
      : [];

    EstadoApp.profesiones = profesiones;
    cuerpoTabla.innerHTML = "";

    if (profesiones.length === 0) {
      cuerpoTabla.innerHTML =
        "<tr><td colspan='3'>No hay profesiones registradas.</td></tr>";
      return;
    }

    profesiones.forEach((profesion, indice) => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${profesion.id != null ? profesion.id : indice + 1}</td>
        <td>${profesion.nombre || ""}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-success me-1" onclick='abrirModalProfesion(${JSON.stringify(profesion)})'>
            <i class="bi bi-pencil-square me-1"></i>Editar
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="eliminarProfesion(${profesion.id})">
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

async function eliminarProfesion(id) {
  mostrarConfirmacion(
    "¿Seguro que deseas eliminar esta profesión?",
    async () => {
      try {
        const respuesta = await fetchConAutenticacion(
          `${URL_BASE_API}/?PATH_INFO=profesiones/${id}`,
          { method: "DELETE" },
        );
        if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);
        const resultado = await respuesta.json();
        if (resultado.code === 200) {
          cargarTablaProfesiones();
          mostrarNotificacion("Profesión eliminada correctamente.");
        } else {
          mostrarNotificacion("No se pudo eliminar.", "error");
        }
      } catch (error) {
        mostrarNotificacion("Error de conexión.", "error");
      }
    },
  );
}

function configurarFormularioMascotas() {
  document
    .getElementById("form-mascota")
    .addEventListener("submit", async (evento) => {
      evento.preventDefault();

      const especie = document
        .getElementById("mascota-especie")
        .value.trim();
      const raza = document
        .getElementById("mascota-raza")
        .value.trim();

      if (!especie || !raza) {
        mostrarNotificacion("Por favor ingresa tipo y raza.", "error");
        return;
      }

      const esEdicion = EstadoApp.idMascotaEditando !== null;
      const url = esEdicion
        ? `${URL_BASE_API}/?PATH_INFO=mascotas/${EstadoApp.idMascotaEditando}`
        : `${URL_BASE_API}/?PATH_INFO=mascotas`;
      const metodo = esEdicion ? "PUT" : "POST";

      try {
        const respuesta = await fetchConAutenticacion(url, {
          method: metodo,
          body: JSON.stringify({
            especie: especie || null,
            raza: raza || null,
          }),
        });
        if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);
        const resultado = await respuesta.json();

        if (resultado.code === 200 || resultado.code === 201) {
          cerrarModalMascota();
          cargarTablaMascotas();
          mostrarNotificacion(
            esEdicion ? "Mascota actualizada." : "Mascota creada correctamente.",
          );
        } else {
          mostrarNotificacion("Hubo un problema al guardar.", "error");
        }
      } catch (error) {
        mostrarNotificacion("Error de conexión.", "error");
      }
    });
}

async function cargarTablaMascotas() {
  const cuerpoTabla = document.getElementById("tabla-mascotas-cuerpo");
  cuerpoTabla.innerHTML = "<tr><td colspan='4'>Cargando...</td></tr>";
  try {
    const respuesta = await fetchConAutenticacion(
      `${URL_BASE_API}/?PATH_INFO=mascotas`,
    );
    if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);
    const resultado = await respuesta.json();
    const mascotas = Array.isArray(resultado.data)
      ? resultado.data.filter((d) => !d.dateDelete)
      : [];

    EstadoApp.mascotas = mascotas;
    cuerpoTabla.innerHTML = "";

    if (mascotas.length === 0) {
      cuerpoTabla.innerHTML =
        "<tr><td colspan='4'>No hay mascotas registradas.</td></tr>";
      return;
    }

    mascotas.forEach((mascota, indice) => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${indice + 1}</td>
        <td>${mascota.especie || "—"}</td>
        <td>${mascota.raza || "—"}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-success me-1" onclick='abrirModalMascota(${JSON.stringify(mascota)})'>
            <i class="bi bi-pencil-square me-1"></i>Editar
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="eliminarMascota(${mascota.id})">
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

async function eliminarMascota(id) {
  mostrarConfirmacion(
    "¿Seguro que deseas eliminar esta mascota?",
    async () => {
      try {
        const respuesta = await fetchConAutenticacion(
          `${URL_BASE_API}/?PATH_INFO=mascotas/${id}`,
          { method: "DELETE" },
        );
        if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);
        const resultado = await respuesta.json();
        if (resultado.code === 200) {
          cargarTablaMascotas();
          mostrarNotificacion("Mascota eliminada correctamente.");
        } else {
          mostrarNotificacion("No se pudo eliminar.", "error");
        }
      } catch (error) {
        mostrarNotificacion("Error de conexión.", "error");
      }
    },
  );
}

async function cargarSelectTiposDocumento() {
  const selectDoc = document.getElementById("persona-tipo-doc");
  if (!selectDoc) return;
  try {
    const respuesta = await fetchConAutenticacion(
      `${URL_BASE_API}/?PATH_INFO=tipodocumentos`,
    );
    if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);
    const resultado = await respuesta.json();
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
    // Actualizar Select2 después de cambiar las opciones
    $("#persona-tipo-doc").trigger("change");
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
        if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);
        const resultado = await respuesta.json();
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
  // Usar eventos de Select2 en lugar de eventos nativos
  $("#persona-pais").on("select2:select select2:clear", function () {
    alCambiarPais();
  });

  $("#persona-estado").on("select2:select select2:clear", function () {
    alCambiarEstado();
  });

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
          const textoError = await respuesta.text();
          let mensaje = `Error HTTP: ${respuesta.status}`;
          try {
            mensaje = JSON.parse(textoError).message || mensaje;
          } catch (e) {}
          throw new Error(mensaje);
        }
        const resultado = await respuesta.json();
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
        mostrarNotificacion(error.message || "Error de conexión.", "error");
      }
    });
}

async function cargarTablaPersonas() {
  const cuerpoTabla = document.getElementById("tabla-personas-cuerpo");
  cuerpoTabla.innerHTML = "<tr><td colspan='9'>Cargando personas...</td></tr>";

  try {
    if (EstadoApp.tiposDocumento.length === 0)
      await cargarSelectTiposDocumento();
    if (EstadoApp.todosLosPaises.length === 0) await precargarPaises();
    if (EstadoApp.todosLosEstados.length === 0) await precargarEstados();

    const respuesta = await fetchConAutenticacion(
      `${URL_BASE_API}/?PATH_INFO=persons`,
    );
    if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);
    const resultado = await respuesta.json();
    const personas = Array.isArray(resultado.data)
      ? resultado.data.filter((p) => !p.dateDelete)
      : [];

    cuerpoTabla.innerHTML = "";

    if (personas.length === 0) {
      cuerpoTabla.innerHTML =
        "<tr><td colspan='9'>No hay personas registradas.</td></tr>";
      return;
    }

    // Mapa de ciudades agrupado por state_id (1 petición por estado)
    const uniqueStateIds = [
      ...new Set(personas.map((p) => p.state_id).filter(Boolean)),
    ];
    const cityNameMap = {};
    await Promise.all(
      uniqueStateIds.map(async (sid) => {
        try {
          const r = await fetchConAutenticacion(
            `${URL_BASE_API}/?PATH_INFO=cities/state/${sid}`,
          );
          if (!r.ok) return;
          const res = await r.json();
          if (Array.isArray(res.data)) {
            res.data.forEach((c) => {
              cityNameMap[Number(c.id_city)] = c.city || "";
            });
          }
        } catch (e) {
          console.warn("Error cargando ciudades estado", sid, e);
        }
      }),
    );

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
      const estado = EstadoApp.todosLosEstados.find(
        (e) => e.id_state == persona.state_id,
      );
      const nombreCiudad = cityNameMap[Number(persona.city_id)] || "—";

      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${indice + 1}</td>
        <td><strong>${persona.name || ""}</strong> ${persona.lastName || ""}</td>
        <td>${persona.phone ? String(persona.phone) : "—"}</td>
        <td>${persona.numero_documento || "—"}</td>
        <td>${nombreTipo}</td>
        <td>${pais ? pais.country_name : "—"}</td>
        <td>${estado ? estado.state : "—"}</td>
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
      if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);
      const resultado = await respuesta.json();
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
