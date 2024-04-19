import { Injectable } from '@angular/core';
import Konva from 'konva';


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

  rectangle() {
    return new Konva.Rect({
      x: 20,
      y: 20,
      width: 100,
      height: 50,
      stroke: 'black',
      strokeWidth: 2,
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
      height: 100,
      draggable: true, // Alto de la imagen en el lienzo
      name: type,
      src
    });
  }
}
