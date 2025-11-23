// src/utils/tienda/registroService.js
import { dataService } from '../dataService';

export const registroService = {
  registrarUsuario: async (usuarioData) => {
    try {
      // Verificar si el email ya existe en la BD
      let emailExiste;
      try {
        emailExiste = await registroService.verificarEmailExistente(usuarioData.email);
      } catch (verificationError) {
        return {
          success: false,
          error: 'Error de conexión. No se pudo verificar el email. Intente más tarde.'
        };
      }

      if (emailExiste) {
        return {
          success: false,
          error: 'Este email ya está registrado'
        };
      }

      // Verificar si el RUN ya existe en la BD
      let runExiste;
      try {
        runExiste = await registroService.verificarRUNExistente(usuarioData.run);
      } catch (verificationError) {
        return {
          success: false,
          error: 'Error de conexión. No se pudo verificar el RUN. Intente más tarde.'
        };
      }

      if (runExiste) {
        return {
          success: false,
          error: 'Este RUN ya está registrado'
        };
      }

      // Obtener nombre de la región
      const regionSeleccionada = usuarioData.regionNombre || 'Región no especificada';

      // Hashear la contraseña antes de guardarla
      const passwordHash = await registroService.hashPasswordSHA256(usuarioData.password);

      // Preparar datos para la base de datos
      const nuevoUsuario = {
        run: usuarioData.run,
        nombre: usuarioData.nombre,
        apellidos: `${usuarioData.apellido}`,
        correo: usuarioData.email,
        contrasenha: passwordHash,
        telefono: usuarioData.fono ? parseInt(usuarioData.fono) : null,
        fechaNac: usuarioData.fechaNacimiento,
        tipo: 'Cliente',
        region: regionSeleccionada,
        comuna: usuarioData.comuna,
        direccion: usuarioData.direccion,
        activo: 1
      };

      // Guardar en base de datos Oracle
      try {
        await dataService.addUsuario(nuevoUsuario);

        // Verificar que realmente se guardó
        try {
          await dataService.getUsuarioByCorreo(usuarioData.email);
          return {
            success: true,
            user: nuevoUsuario,
            message: '¡Registro exitoso! Bienvenido a Junimo Store.'
          };
        } catch (verificationError) {
          return {
            success: true,
            user: nuevoUsuario,
            message: '¡Registro exitoso! Bienvenido a Junimo Store.'
          };
        }

      } catch (saveError) {
        return {
          success: false,
          error: 'Error al guardar el usuario en la base de datos. Intente nuevamente.'
        };
      }

    } catch (error) {
      return {
        success: false,
        error: error.message || 'Error al registrar usuario.'
      };
    }
  },

  // Función para hashear contraseña con SHA256
  hashPasswordSHA256: async (password) => {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex.toUpperCase();
    } catch (error) {
      return registroService.simpleSHA256(password);
    }
  },

  // Fallback para navegadores que no soportan crypto.subtle
  simpleSHA256: (password) => {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).toUpperCase();
  },

  // Verificar si email existe en la BD - VERSIÓN CORREGIDA (igual que admin)
  verificarEmailExistente: async (email) => {
    try {
      // Primero intentamos con el endpoint específico
      try {
        const usuarioBD = await dataService.getUsuarioByCorreo(email);

        // ✅ CORREGIDO: Verificar explícitamente como en el admin
        if (usuarioBD && usuarioBD.correo) {
          return true;
        } else {
          return false;
        }
      } catch (endpointError) {
        // Si falla el endpoint específico, obtenemos todos los usuarios
        const todosUsuarios = await dataService.getUsuarios();
        const emailExiste = todosUsuarios.some(user => {
          const correoUsuario = user.correo ? user.correo.toLowerCase().trim() : '';
          const emailBuscado = email.toLowerCase().trim();
          return correoUsuario === emailBuscado;
        });
        return emailExiste;
      }
    } catch (error) {
      throw new Error(`No se pudo verificar el email: ${error.message}`);
    }
  },

  // Verificar si RUN existe en la BD - VERSIÓN CORREGIDA (igual que admin)
  verificarRUNExistente: async (run) => {
    try {
      try {
        const usuarioBD = await dataService.getUsuarioById(run);

        // ✅ CORREGIDO: Verificar explícitamente como en el admin
        if (usuarioBD && usuarioBD.run) {
          return true;
        } else {
          return false;
        }
      } catch (endpointError) {
        const todosUsuarios = await dataService.getUsuarios();
        const existe = todosUsuarios.some(user => user.run && user.run.toString() === run.toString());
        return existe;
      }
    } catch (error) {
      throw new Error(`No se pudo verificar el RUN: ${error.message}`);
    }
  },

  // Obtener usuarios desde BD
  obtenerUsuarios: async () => {
    try {
      return await dataService.getUsuarios();
    } catch (error) {
      return [];
    }
  },

  // Obtener usuario por email desde BD
  obtenerUsuarioPorEmail: async (email) => {
    try {
      try {
        return await dataService.getUsuarioByCorreo(email);
      } catch (endpointError) {
        const todosUsuarios = await dataService.getUsuarios();
        return todosUsuarios.find(user =>
          user.correo && user.correo.toLowerCase() === email.toLowerCase()
        );
      }
    } catch (error) {
      return null;
    }
  }
};