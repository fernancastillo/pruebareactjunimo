// src/utils/admin/usuarioService.js
import { dataService } from '../dataService';

export const usuarioService = {
  async getUsuarios() {
    try {
      console.log('Obteniendo usuarios desde la base de datos Oracle...');
      
      // Usar dataService para obtener usuarios desde la API
      const usuarios = await dataService.getUsuarios();
      console.log('Usuarios obtenidos desde API:', usuarios);
      
      // Enriquecer usuarios con estadísticas de órdenes
      const usuariosEnriquecidos = await this.enriquecerUsuariosConEstadisticas(usuarios);
      console.log('Usuarios enriquecidos:', usuariosEnriquecidos);
      
      return usuariosEnriquecidos;
    } catch (error) {
      console.error('Error obteniendo usuarios desde la API:', error);
      throw new Error('No se pudieron cargar los usuarios desde la base de datos: ' + error.message);
    }
  },

  async enriquecerUsuariosConEstadisticas(usuarios) {
    try {
      console.log('Enriqueciendo usuarios con estadísticas...');
      
      // Obtener órdenes para calcular estadísticas
      const ordenes = await dataService.getOrdenes();
      console.log('Órdenes obtenidas para estadísticas:', ordenes.length);
      
      const usuariosEnriquecidos = usuarios.map(usuario => {
        // Buscar órdenes del usuario - manejar diferentes estructuras de datos
        const ordenesUsuario = ordenes.filter(orden => {
          // Verificar diferentes formas en que el RUN puede estar almacenado
          const runOrden = orden.run || (orden.usuario ? orden.usuario.run : null);
          return runOrden && runOrden.toString() === usuario.run.toString();
        });
        
        console.log(`Usuario ${usuario.run} tiene ${ordenesUsuario.length} órdenes`);
        
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
          // Mantener todos los campos originales
          nombre: usuario.nombre,
          apellidos: usuario.apellidos,
          tipo: usuario.tipo,
          comuna: usuario.comuna,
          region: usuario.region,
          fecha_nacimiento: usuario.fecha_nacimiento
        };
      });
      
      return usuariosEnriquecidos;
    } catch (error) {
      console.error('Error enriqueciendo usuarios con estadísticas:', error);
      // Retornar usuarios sin estadísticas si hay error
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
    const partes = [];
    if (usuario.direccion) partes.push(usuario.direccion);
    if (usuario.comuna) partes.push(usuario.comuna);
    if (usuario.region) partes.push(usuario.region);
    
    return partes.length > 0 ? partes.join(', ') : 'Dirección no especificada';
  },

  async createUsuario(usuarioData) {
    try {
      console.log('Creando usuario en base de datos:', usuarioData);
      
      // Verificar si el RUN ya existe
      const usuariosExistentes = await dataService.getUsuarios();
      const usuarioExistente = usuariosExistentes.find(u => u.run.toString() === usuarioData.run.toString());
      
      if (usuarioExistente) {
        throw new Error('Ya existe un usuario con este RUN');
      }

      // Preparar datos para la API
      const usuarioParaAPI = {
        run: parseInt(usuarioData.run), // Asegurar que sea número
        nombre: usuarioData.nombre.trim(),
        apellidos: usuarioData.apellidos.trim(),
        correo: usuarioData.correo.trim(),
        telefono: usuarioData.telefono ? parseInt(usuarioData.telefono) : null,
        direccion: usuarioData.direccion.trim(),
        comuna: usuarioData.comuna || null,
        region: usuarioData.region || null,
        tipo: usuarioData.tipo,
        fecha_nacimiento: usuarioData.fecha_nacimiento,
        estado: 'Activo'
      };

      console.log('Datos para enviar a API:', usuarioParaAPI);

      // Usar dataService para crear usuario
      const resultado = await dataService.addUsuario(usuarioParaAPI);
      console.log('Usuario creado exitosamente:', resultado);
      
      return {
        ...usuarioParaAPI,
        totalCompras: 0,
        totalGastado: 0,
        fechaRegistro: new Date().toISOString().split('T')[0],
        email: usuarioParaAPI.correo
      };
    } catch (error) {
      console.error('Error creando usuario:', error);
      throw new Error(`Error al crear usuario: ${error.message}`);
    }
  },

  async updateUsuario(run, datosActualizados) {
    try {
      console.log('Actualizando usuario:', run, datosActualizados);
      
      // Obtener usuario actual primero
      const usuarios = await this.getUsuarios();
      const usuarioActual = usuarios.find(u => u.run.toString() === run.toString());
      
      if (!usuarioActual) {
        throw new Error('Usuario no encontrado');
      }

      // Validar que no se intente modificar un administrador
      if (usuarioActual.tipo === 'Admin') {
        throw new Error('No se pueden modificar usuarios administradores');
      }

      // Preparar datos para actualización
      const datosParaActualizar = {
        run: parseInt(run), // Mantener el mismo RUN
        nombre: datosActualizados.nombre.trim(),
        apellidos: datosActualizados.apellidos.trim(),
        correo: datosActualizados.correo.trim(),
        telefono: datosActualizados.telefono ? parseInt(datosActualizados.telefono) : null,
        direccion: datosActualizados.direccion.trim(),
        comuna: datosActualizados.comuna || null,
        region: datosActualizados.region || null,
        // No permitir cambiar tipo desde la edición
        tipo: usuarioActual.tipo,
        fecha_nacimiento: datosActualizados.fecha_nacimiento || usuarioActual.fecha_nacimiento,
        estado: 'Activo'
      };

      console.log('Datos para actualizar:', datosParaActualizar);

      // Usar dataService para actualizar usuario
      await dataService.updateUsuario(datosParaActualizar);
      
      // Recargar datos actualizados
      await this.getUsuarios();
      
      return {
        ...usuarioActual,
        ...datosParaActualizar
      };
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      throw new Error(`Error al actualizar usuario: ${error.message}`);
    }
  },

  async getUsuarioByRun(run) {
    try {
      const usuarios = await this.getUsuarios();
      const usuario = usuarios.find(u => u.run.toString() === run.toString());
      
      if (!usuario) {
        console.log('Usuario no encontrado con RUN:', run);
        return null;
      }
      
      return usuario;
    } catch (error) {
      console.error('Error obteniendo usuario por RUN:', error);
      throw error;
    }
  },

  async deleteUsuario(run) {
    try {
      console.log('Eliminando usuario:', run);
      
      // Obtener usuario para validaciones
      const usuario = await this.getUsuarioByRun(run);
      if (!usuario) {
        throw new Error('Usuario no encontrado');
      }

      // Validar que no sea administrador
      if (usuario.tipo === 'Admin') {
        throw new Error('No se puede eliminar un usuario administrador');
      }

      // Usar dataService para eliminar usuario
      await dataService.deleteUsuario(run);
      console.log('Usuario eliminado exitosamente');
      
      return true;
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      throw new Error(`Error al eliminar usuario: ${error.message}`);
    }
  },

  // Método para obtener órdenes de un usuario específico
  async getOrdenesPorUsuario(run) {
    try {
      console.log('Obteniendo órdenes para usuario:', run);
      
      const todasLasOrdenes = await dataService.getOrdenes();
      const ordenesUsuario = todasLasOrdenes.filter(orden => {
        const runOrden = orden.run || (orden.usuario ? orden.usuario.run : null);
        return runOrden && runOrden.toString() === run.toString();
      });
      
      console.log(`Encontradas ${ordenesUsuario.length} órdenes para usuario ${run}`);
      
      return ordenesUsuario;
    } catch (error) {
      console.error('Error obteniendo órdenes del usuario:', error);
      return [];
    }
  },

  // Método para verificar conexión con la base de datos
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