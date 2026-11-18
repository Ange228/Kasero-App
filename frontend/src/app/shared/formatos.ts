import { Pipe, PipeTransform } from '@angular/core';

/** 12.5 -> "S/ 12.50" */
@Pipe({ name: 'soles' })
export class SolesPipe implements PipeTransform {
  transform(valor: number | null | undefined): string {
    return valor == null ? '—' : 'S/ ' + Number(valor).toFixed(2);
  }
}

/** Fecha ISO -> "12 sep 2026" */
@Pipe({ name: 'fecha' })
export class FechaPipe implements PipeTransform {
  transform(iso: string | null | undefined): string {
    return iso ? new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
  }
}

export const ESTADO: Record<string, string> = {
  PENDIENTE: 'Pendiente', CONFIRMADA: 'Confirmada', EN_PREPARACION: 'En preparación',
  LISTO: 'Listo para recoger', ENTREGADO: 'Entregado'
};
export const MODALIDAD: Record<string, string> = {
  ENVIO: 'Envío a domicilio', RECOJO: 'Recoger en puesto', TERCERO: 'Tercero autorizado'
};
