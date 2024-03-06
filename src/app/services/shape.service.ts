import { Injectable } from '@angular/core';
import Konva from 'konva';


@Injectable({
  providedIn: 'root'
})
export class ShapeService {

  constructor() { }

  circle() {
    return new Konva.Circle({
      x: 100,
      y: 100,
      radius: 70,
      stroke: 'black',
      strokeWidth: 2,
      draggable: true
    });
  }

  line() {
    return new Konva.Line({
      points: [50, 50, 200, 50],
      stroke: 'black',
      strokeWidth: 3,
      draggable: true, // Hacer la línea arrastrable
      tension: 0
    });
  }

  drawer(pos: any, mode: string = 'brush') {
    return new Konva.Line({
      stroke: 'black',
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

  image() {
    var imageObj = new Image();
    imageObj.src = '/assets/auriculares.png';
    return new Konva.Image({
      x: 50,
      y: 50,
      image: imageObj,
      width: 100, // Ancho de la imagen en el lienzo
      height: 100,
      draggable: true // Alto de la imagen en el lienzo
    });
  }

  text() {
    return new Konva.Text({
      text: 'Escribe aquí',
      x: 50,
      y: 80,
      fontSize: 20,
      draggable: true,
      width: 200
    });
  }
}
