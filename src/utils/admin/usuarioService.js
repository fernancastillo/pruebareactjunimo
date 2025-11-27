import { dataService } from '../dataService';

export const usuarioService = {
  async getUsuarios() {
    try {
      const usuarios = await dataService.getUsuarios();
      const usuariosEnriquecidos = await this.enriquecerUsuariosConEstadisticas(usuarios);
      return usuariosEnriquecidos;
    } catch (error) {
      throw new Error('No se pudieron cargar los usuarios desde la base de datos: ' + error.message);
    }
  },

  async enriquecerUsuariosConEstadisticas(usuarios) {
    try {
      const ordenes = await dataService.getOrdenes();

      const usuariosEnriquecidos = usuarios.map(usuario => {
        const ordenesUsuario = ordenes.filter(orden => {
          const runOrden = orden.run || (orden.usuario ? orden.usuario.run : null);
          return runOrden && runOrden.toString() === usuario.run.toString();
        });

        const totalCompras = ordenesUsuario.length;
        const totalGastado = ordenesUsuario.reduce((sum, orden) => sum + (orden.total || 0), 0);

        return {
          ...usuario,
          id: usuario.run,
          fechaRegistro: usuario.fecha_registro || usuario.fechaRegistro || '01/01/2024',
          totalCompras,
          totalGastado,
          email: usuario.correo || usuario.email,
          telefono: usuario.telefono ? usuario.telefono.toString() : '',
          direccion: this.formatearDireccion(usuario),
          nombre: usuario.nombre,
          apellidos: usuario.apellidos,
          tipo: usuario.tipo,
          comuna: usuario.comuna,
          region: usuario.region,
          fecha_nacimiento: usuario.fecha_nacimiento || usuario.fechaNac
        };
      });

      return usuariosEnriquecidos;
    } catch (error) {
      return usuarios.map(usuario => ({
        ...usuario,
        id: usuario.run,
        totalCompras: 0,
        totalGastado: 0,
        email: usuario.correo || usuario.email,
        telefono: usuario.telefono ? usuario.telefono.toString() : '',
        direccion: this.formatearDireccion(usuario),
        fechaRegistro: usuario.fecha_registro || usuario.fechaRegistro || '01/01/2024'
      }));
    }
  },

  formatearDireccion(usuario) {
    return usuario.direccion || 'Dirección no especificada';
  },

  async createUsuario(usuarioData) {
    try {
      const runExiste = await this.verificarRUNExistente(usuarioData.run);

      if (runExiste) {
        throw new Error('Ya existe un usuario con este RUN');
      }

      const emailExiste = await this.verificarEmailExistente(usuarioData.correo);

      if (emailExiste) {
        throw new Error('Ya existe un usuario con este email');
      }

      const passwordHash = await this.hashPasswordSHA256(usuarioData.contrasenha);

      const nuevoUsuario = {
        run: usuarioData.run,
        nombre: usuarioData.nombre,
        apellidos: usuarioData.apellidos,
        correo: usuarioData.correo,
        contrasenha: passwordHash,
        telefono: usuarioData.telefono ? parseInt(usuarioData.telefono) : null,
        fechaNac: usuarioData.fecha_nacimiento,
        tipo: usuarioData.tipo,
        region: usuarioData.region || "Región Metropolitana",
        comuna: usuarioData.comuna || "Santiago",
        direccion: usuarioData.direccion
      };

      try {
        const usuarioGuardado = await dataService.addUsuario(nuevoUsuario);

        return {
          ...nuevoUsuario,
          totalCompras: 0,
          totalGastado: 0,
          fechaRegistro: new Date().toISOString().split('T')[0],
          email: nuevoUsuario.correo
        };

      } catch (saveError) {
        throw new Error('Error al guardar el usuario en la base de datos. Intente nuevamente.');
      }

    } catch (error) {
      throw new Error(error.message || 'Error al crear usuario.');
    }
  },

  async hashPasswordSHA256(password) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex.toUpperCase();
    } catch (error) {
      return this.simpleSHA256(password);
    }
  },

  simpleSHA256(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).toUpperCase();
  },

  async verificarEmailExistente(email) {
    try {
      try {
        const usuarioBD = await dataService.getUsuarioByCorreo(email);

        if (usuarioBD && usuarioBD.correo) {
          return true;
        } else {
          return false;
        }

      } catch (endpointError) {
        const todosUsuarios = await dataService.getUsuarios();
        const existe = todosUsuarios.some(user =>
          user.correo && user.correo.toLowerCase() === email.toLowerCase()
        );
        return existe;
      }
    } catch (error) {
      return false;
    }
  },

  async verificarRUNExistente(run) {
    try {
      try {
        const usuarioBD = await dataService.getUsuarioById(run);

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
      return false;
    }
  },

  async updateUsuario(run, datosActualizados) {
    try {
      const datosParaActualizar = {
        run: parseInt(run),
        nombre: datosActualizados.nombre.trim(),
        apellidos: datosActualizados.apellidos.trim(),
        correo: datosActualizados.correo.trim(),
        telefono: datosActualizados.telefono ? parseInt(datosActualizados.telefono) : null,
        direccion: datosActualizados.direccion.trim(),
        comuna: datosActualizados.comuna || null,
        region: datosActualizados.region || null,
        tipo: datosActualizados.tipo,
        fechaNac: this.formatearFechaParaAPI(datosActualizados.fecha_nacimiento),
      };

      if (datosActualizados.contrasenha && datosActualizados.contrasenha.trim() !== '') {
        const passwordHash = await this.hashPasswordSHA256(datosActualizados.contrasenha);
        datosParaActualizar.contrasenha = passwordHash;
      }

      const resultado = await dataService.updateUsuario(datosParaActualizar);
      return resultado;
    } catch (error) {
      throw new Error(`Error al actualizar usuario: ${error.message}`);
    }
  },

  formatearFechaParaAPI(fecha) {
    if (!fecha) return null;
    return fecha;
  },

  async getUsuarioByRun(run) {
    try {
      const usuarios = await this.getUsuarios();
      const usuario = usuarios.find(u => u.run.toString() === run.toString());

      if (!usuario) {
        return null;
      }

      return usuario;
    } catch (error) {
      throw error;
    }
  },

  async deleteUsuario(run) {
    try {
      const usuario = await this.getUsuarioByRun(run);
      if (!usuario) {
        throw new Error('Usuario no encontrado');
      }

      if (usuario.tipo === 'Admin') {
        throw new Error('No se puede eliminar un usuario administrador');
      }

      await dataService.deleteUsuario(run);

      return true;
    } catch (error) {
      throw new Error(`Error al eliminar usuario: ${error.message}`);
    }
  },

  async getOrdenesPorUsuario(run) {
    try {
      const todasLasOrdenes = await dataService.getOrdenes();
      const ordenesUsuario = todasLasOrdenes.filter(orden => {
        const runOrden = orden.run || (orden.usuario ? orden.usuario.run : null);
        return runOrden && runOrden.toString() === run.toString();
      });

      return ordenesUsuario;
    } catch (error) {
      return [];
    }
  },

  async verificarConexion() {
    try {
      const usuarios = await dataService.getUsuarios();
      return {
        conectado: true,
        totalUsuarios: usuarios.length,
        mensaje: 'Conexión exitosa a la base de datos Oracle'
      };
    } catch (error) {
      return {
        conectado: false,
        totalUsuarios: 0,
        mensaje: `Error de conexión: ${error.message}`
      };
    }
  }
};