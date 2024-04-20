import { Injectable } from '@angular/core';
import Konva from 'konva';
import { LineCap } from 'konva/lib/Shape';


@Injectable({
  providedIn: 'root'
})
export class ShapeService {

  constructor() { }

  drawer(pos: any, mode: string = 'brush', stroke: string = '#000000') {
    return new Konva.Line({
      stroke,
      strokeWidth: mode === 'brush' ? 5 : 2,
      globalCompositeOperation:
        mode === 'brush' ? 'source-over' : 'destination-out',
      points: [pos.x, pos.y],
      draggable: true
    });
  }

  circle(x: number, y: number, radius: number, color: string, strokeWidth: number) {
    return new Konva.Circle({
      x,
      y,
      radius,
      stroke: color,
      strokeWidth
    });
  }

  line(x: number, y: number, x2: number, y2: number, color: string, strokeWidth: number, lineCap: LineCap) {
    return new Konva.Line({
      points: [x, y, x2, y2],
      stroke: color,
      strokeWidth,
      lineCap
    });
  }

  rectangle(x: number, y: number, width: number, height: number, color: string, strokeWidth: number) {
    return new Konva.Rect({
      x,
      y,
      width,
      height,
      stroke: color,
      strokeWidth: strokeWidth,
      draggable: true
    });
  }

  image(type: string) {
    let src = '';
    switch (type) {
      case 'headphones':
        src = '/assets/auriculares.png';
        break;
      case 'bathroom':
        src = '/assets/bano.png';
        break;
      case 'elevator':
        src = '/assets/elevar.png';
        break;
      case 'disabled':
        src = '/assets/discapacidad.png';
        break;
    }
    var imageObj = new Image();
    imageObj.src = src;
    return new Konva.Image({
      x: 50,
      y: 50,
      image: imageObj,
      width: 100, // Ancho de la imagen en el lienzo
      height: 100, // Alto de la imagen en el lienzo
      name: type,
      src
    });
  }
}
