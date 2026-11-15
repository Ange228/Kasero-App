import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '../../core/auth.service';
import { Icono } from '../../shared/icono';

@Component({
  selector: 'app-landing',
  imports: [RouterLink, Icono],
  templateUrl: './landing.html',
  styleUrl: './landing.scss'
})
export class Landing {
  protected auth = inject(Auth);

  protected pasos = [
    { icono: 'search', titulo: 'Busca', texto: 'Encuentra puestos y productos por nombre, sector o pasillo.' },
    { icono: 'store', titulo: 'Conoce', texto: 'Mira el perfil de tu casera: precios, pagos y formas de entrega.' },
    { icono: 'calculator', titulo: 'Cotiza', texto: 'Arma tu canasta y compara el total entre varios puestos.' },
    { icono: 'truck', titulo: 'Recibe', texto: 'Elige envío, recojo en el puesto o un tercero autorizado.' }
  ];

  protected beneficios = [
    { icono: 'search', titulo: 'Búsqueda por puesto y sector', texto: 'Filtra por verduras, frutas, carnes, abarrotes o comida y ordena por precio o calificación.' },
    { icono: 'scale', titulo: 'Comparador de canasta', texto: 'La misma canasta en distintos puestos, con la diferencia contra el más económico.' },
    { icono: 'receipt', titulo: 'Cotiza sin compromiso', texto: 'Guarda tu cotización con precios y fecha, y confírmala cuando quieras.' },
    { icono: 'truck', titulo: 'Tres formas de entrega', texto: 'Envío a tu casa, recojo en el puesto o alguien de confianza con código de entrega.' },
    { icono: 'trending-down', titulo: 'Precios transparentes', texto: 'Promedios por producto para saber si el precio que te dan es justo.' },
    { icono: 'smartphone', titulo: 'Pagos que ya usas', texto: 'Cada puesto muestra si recibe Yape, Plin u otros métodos.' }
  ];

  protected sectores = [
    { nombre: 'Frutas', icono: 'apple' }, { nombre: 'Verduras', icono: 'sprout' },
    { nombre: 'Carnes', icono: 'beef' }, { nombre: 'Abarrotes', icono: 'wheat' }
  ];

  protected preguntas = [
    { p: '¿Tiene costo usar Kasero?', r: 'No. Crear tu cuenta, buscar puestos, comparar y cotizar es gratis para los clientes.' },
    { p: '¿Compro a mis caseros de siempre?', r: 'Sí. Kasero no reemplaza al mercado: te conecta con los mismos comerciantes del Mercado del Altiplano.' },
    { p: '¿Cómo pago?', r: 'Cada perfil indica los métodos que acepta el puesto, como Yape o Plin. El comerciante confirma el precio final.' },
    { p: '¿Puedo recoger mi pedido en el mercado?', r: 'Claro. Puedes elegir recoger en el puesto, pedir envío o autorizar a otra persona con un código de entrega.' },
    { p: 'Soy comerciante, ¿cómo participo?', r: 'Por ahora los puestos los registra el administrador de la plataforma. Escríbenos y te sumamos al mercado digital.' }
  ];
}
