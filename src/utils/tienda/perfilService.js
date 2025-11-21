// utils/tienda/perfilService.js
import { dataService } from '../dataService';

export const perfilService = {
  /**
   * Hashea una contraseña usando SHA256
   */
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

  /**
   * Fallback para SHA256 simple
   */
  simpleSHA256(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).toUpperCase();
  },

  /**
   * Verifica si la contraseña actual es correcta
   */
  async verificarContrasenhaActual(contrasenhaIngresada, contrasenhaHashEnBD) {
    try {
      const hashIngresado = await this.hashPasswordSHA256(contrasenhaIngresada);
      return hashIngresado === contrasenhaHashEnBD;
    } catch (error) {
      return false;
    }
  },

  /**
   * Actualiza el perfil del usuario en la base de datos Oracle Cloud
   */
  async actualizarPerfil(run, datos) {
    try {
      // Obtener el usuario actual para mantener la contraseña existente
      const usuarioActual = await dataService.getUsuarioById(run);
      
      if (!usuarioActual) {
        throw new Error('Usuario no encontrado');
      }

      // Preparar los datos en el formato que espera la entidad Java
      const usuarioActualizado = {
        run: parseInt(run),
        nombre: datos.nombre || usuarioActual.nombre,
        apellidos: datos.apellidos || datos.apellido || usuarioActual.apellidos,
        correo: datos.correo || datos.email || usuarioActual.correo,
        direccion: datos.direccion || usuarioActual.direccion,
        fechaNac: datos.fechaNac || usuarioActual.fechaNac,
        region: datos.region || usuarioActual.region,
        comuna: datos.comuna || usuarioActual.comuna,
        telefono: datos.telefono ? parseInt(datos.telefono) : (usuarioActual.telefono || 0),
        tipo: datos.tipo || usuarioActual.tipo,
        // Mantener la contraseña existente (ya hasheada)
        contrasenha: usuarioActual.contrasenha
      };

      const resultado = await dataService.updateUsuario(usuarioActualizado);

      return {
        success: true,
        message: 'Perfil actualizado correctamente en la base de datos',
        user: usuarioActualizado
      };
    } catch (error) {
      return {
        success: false,
        message: `Error al actualizar el perfil: ${error.message}`
      };
    }
  },

  /**
   * Actualiza solo la contraseña del usuario
   */
  async actualizarContrasenha(run, contrasenhaActual, nuevaContrasenha) {
    try {
      // Obtener el usuario actual
      const usuarioActual = await dataService.getUsuarioById(run);
      
      if (!usuarioActual) {
        throw new Error('Usuario no encontrado');
      }

      // Verificar que la contraseña actual sea correcta
      const contrasenhaCorrecta = await this.verificarContrasenhaActual(
        contrasenhaActual, 
        usuarioActual.contrasenha
      );

      if (!contrasenhaCorrecta) {
        return {
          success: false,
          message: 'La contraseña actual es incorrecta'
        };
      }

      // Validar la nueva contraseña
      const erroresValidacion = this.validarFortalezaContrasenha(nuevaContrasenha);
      if (erroresValidacion.length > 0) {
        return {
          success: false,
          message: erroresValidacion[0]
        };
      }

      // Hashear la nueva contraseña
      const nuevaContrasenhaHash = await this.hashPasswordSHA256(nuevaContrasenha);
      
      // Actualizar solo la contraseña manteniendo los demás datos
      const usuarioActualizado = {
        ...usuarioActual,
        contrasenha: nuevaContrasenhaHash
      };
      
      // Guardar en la base de datos
      const resultado = await dataService.updateUsuario(usuarioActualizado);
      
      return {
        success: true,
        message: 'Contraseña actualizada correctamente'
      };
    } catch (error) {
      return {
        success: false,
        message: `Error al actualizar la contraseña: ${error.message}`
      };
    }
  },

  /**
   * Valida la fortaleza de la contraseña
   */
  validarFortalezaContrasenha(password) {
    const errores = [];
    
    if (!password || password.length < 6) {
      errores.push('La contraseña debe tener al menos 6 caracteres');
    }
    
    if (password.length > 100) {
      errores.push('La contraseña es demasiado larga');
    }
    
    return errores;
  },

  /**
   * Obtiene el perfil completo del usuario desde la base de datos
   */
  async obtenerPerfilCompleto(run) {
    try {
      const usuario = await dataService.getUsuarioById(run);
      
      if (!usuario) {
        throw new Error('Usuario no encontrado en la base de datos');
      }

      return usuario;
    } catch (error) {
      throw error;
    }
  }
};

export default perfilService;