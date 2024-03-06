import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import Konva from 'konva';
import { ShapeService } from '../services/shape.service';
import { TextNodeService } from '../services/text.service';
import { Shape } from 'konva/lib/Shape';
import { initCanvasData } from '../shared/initMap';
import { Layer } from 'konva/lib/Layer';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss'],
})
export class BoardComponent implements OnInit, AfterViewInit {
	@ViewChild('stageContainer', { static: true }) stageContainer: ElementRef | undefined;
  shapes: any = [];
  stage!: Konva.Stage;
  layer!: Konva.Layer;
  selectedButton: any = {
    'circle': false,
    'rectangle': false,
    'line': false,
    'drawer': false,
    'text': false,
    'image': false,
    'undo': false,
    'erase': false
  }
  erase: boolean = false;
  transformers: Konva.Transformer[] = [];

	constructor(
    private shapeService: ShapeService,
    private textNodeService: TextNodeService
  ) { }

  ngOnInit(): void {
	}

	 ngAfterViewInit(): void {
		const containerElement: HTMLElement = this.stageContainer?.nativeElement;

    // Verificar que containerElement sea un elemento DOM válido
    if (!(containerElement instanceof HTMLElement)) {
      console.error('El contenedor no es un elemento DOM válido.');
      return;
    }

		let width = window.innerWidth * 0.95;
    let height = window.innerHeight;
    this.stage = new Konva.Stage({
      container: this.stageContainer?.nativeElement,
      width: width,
      height: height
    });

		// Verificar que el escenario Konva se haya creado correctamente
    if (!this.stage || !(this.stage instanceof Konva.Stage)) {
      console.error('No se pudo crear el escenario Konva correctamente.');
      return;
    }
    this.layer = new Konva.Layer();

		// TODO Cargar json inicial
		// for(var shape of initCanvasData.children[0].children) {
		// 	console.log('shape - ', shape);
		// 	if (shape.className === 'Rect') {
		// 		var rect = new Konva.Rect(shape.attrs);
		// 		this.layer.add(rect)
		// 	}
		// 	if (shape.className === 'Circle') {
		// 		var circle = new Konva.Circle(shape.attrs);
		// 		this.layer.add(circle)
		// 	}
		// }
    this.stage.add(this.layer);
    this.addDrawerListeners();
	 }

	clearSelection() {
    Object.keys(this.selectedButton).forEach(key => {
      this.selectedButton[key] = false;
    })
  }

	setSelection(type: string) {
    this.selectedButton[type] = true;
  }

	addShape(type: string) {
    this.clearSelection();
		this.selectedButton[type] = true;
    if (type == 'circle') {
      this.addCircle();
    }
    else if (type == 'line') {
      this.addLine();
    }
    else if (type == 'drawer') {
      this.addDrawer();
    }
    else if (type == 'rectangle') {
      this.addRectangle();
    }
    else if (type == 'text') {
      this.addText();
    }
    else if (type == 'image') {
      this.addImage();
    }
  }

	addCircle() {
    const circle = this.shapeService.circle();
    this.shapes.push(circle);
    this.layer.add(circle);
    this.stage.add(this.layer);
    this.addTransformerListeners(circle)
  }

  addRectangle() {
    const rectangle = this.shapeService.rectangle();
    this.shapes.push(rectangle);
    this.layer.add(rectangle);
    this.stage.add(this.layer);
    this.addTransformerListeners(rectangle)
  }

  addLine() {
    const line = this.shapeService.line();
    this.shapes.push(line);
    this.layer.add(line);
    this.stage.add(this.layer);
    this.addTransformerListeners(line)
  }

  addDrawer() {
    this.selectedButton['drawer'] = true;
  }

	addText() {
    const text = this.textNodeService.textNode(this.stage, this.layer);
    this.shapes.push(text.textNode);
    this.transformers.push(text.tr);
  }

	addImage() {
		const image = this.shapeService.image();
    this.shapes.push(image);
    this.layer.add(image);
    this.stage.add(this.layer);
    this.addTransformerListeners(image)

	}

	addDrawerListeners() {
    const component = this;
    let lastLine: any;
    let isPaint: any;
    this.stage.on('mousedown touchstart', function (e) {
      if (!component.selectedButton['drawer'] && !component.erase) {
        return;
      }
      isPaint = true;
      let pos = component.stage.getPointerPosition();
      const mode = component.erase ? 'erase' : 'brush';
      lastLine = component.shapeService.drawer(pos, mode)
      component.shapes.push(lastLine);
      component.layer.add(lastLine);
    });
    this.stage.on('mouseup touchend', function () {
      isPaint = false;
    });

    this.stage.on('mousemove touchmove', function () {
      if (!isPaint) {
        return;
      }
      const position: any = component.stage.getPointerPosition();
      var newPoints = lastLine.points().concat([position.x, position.y]);
      lastLine.points(newPoints);
      component.layer.batchDraw();
    });
  }

  undo() {
    const removedShape = this.shapes.pop();
    this.transformers.forEach(t => {
      t.detach();
    });
    if (removedShape) {
      removedShape.remove();
    }
    this.layer.draw();
  }

  addTransformerListeners(shape: Shape) {
    const component = this;
    const tr = new Konva.Transformer();
		const stage = this.stage;
    this.stage.on('click tap', function (e) {
			if (e.target === stage) {
				tr.nodes([]);
				return;
			}

      if (e.target == shape) {
        component.addDeleteListener(e.target);
        component.layer.add(tr);
        tr.attachTo(e.target);
        component.transformers.push(tr);
        component.layer.draw();

				shape.on('transform', function(e) {
					var scaleX = shape.scaleX();
  				var scaleY = shape.scaleY();
					var scale = (scaleX + scaleY) / 2;
					var newStrokeWidth = 2 / scale;
  				shape.strokeWidth(newStrokeWidth);
					component.layer.batchDraw();
				})
      }
      else {
        tr.detach();
        component.layer.draw();
      }
    });
  }

  addDeleteListener(shape: any) {
    const component = this;
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Delete') {
        shape.remove();
        component.transformers.forEach(t => {
          t.detach();
        });
        const selectedShape = component.shapes.find((s: any) => s._id == shape._id);
        selectedShape.remove();
        e.preventDefault();
      }
      component.layer.batchDraw();
    });
  }

  clearBoard() {
    location.reload();
  }

	saveCanvas() {
		const canvasData = this.stage.toJSON();
		console.log('canvasData', canvasData);
	}
}

