import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import Konva from 'konva';
import { ShapeService } from '../services/shape.service';
import { Shape } from 'konva/lib/Shape';
import { initCanvasData } from '../shared/initMap';
import { Operations } from '../utils/operations';
import exportFromJSON from 'export-from-json';

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
  transformer!: Konva.Transformer;
  selectedButton: any = {
    'circle': false,
    'rectangle': false,
    'line': false,
    'drawer': false,
    'text': false,
    'image': false,
    'undo': false,
    'redo': false,
    'erase': false,
    'select': false,
    'fill': false
  }
  color: string = '#000000';
  lineWidth: string = '2';
  erase: boolean = false;
  transformers: Konva.Transformer[] = [];
  isDrawing: boolean = false;
  isDraging: boolean = false;
  isFill: boolean = false;
  isSelect: boolean = false;
  x1: number | undefined;
  y1: number | undefined;
  action: string = '';
  shape?: Konva.Shape;
  operations?: Operations;

	constructor(
    private shapeService: ShapeService
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
    
    this.initStage();

		// Verificar que el escenario Konva se haya creado correctamente
    if (!this.stage || !(this.stage instanceof Konva.Stage)) {
      console.error('No se pudo crear el escenario Konva correctamente.');
      return;
    }
    this.layer = new Konva.Layer();
    this.transformer = new Konva.Transformer();
    this.layer.add(this.transformer);
    this.stage.add(this.layer);
    this.operations = new Operations(this.layer);
    this.addDrawerListeners();
    this.load();
	}

  private initStage() {
    this.stage.on('mousedown', this.start.bind(this));
    this.stage.on('mouseup', this.end.bind(this));
    this.stage.on('mousemove', this.drag.bind(this));
    this.stage.on('click tap', this.select.bind(this));
  }

  start(e: any) {
    const event = e as Konva.KonvaPointerEvent;
    if (this.action) {
      const position = this.stage.getPointerPosition();
      this.x1 = position?.x;
      this.y1 = position?.y;

      if (this.action == 'text') {
        this.addText(e.evt.clientX, e.evt.clientY);
      } else {
        if (this.action == 'drawer') this.drawFree(this.x1 || 0, this.y1 || 0);
        this.isDrawing = true;
      }
    }
  }

  drag() {
    if (this.isDrawing) {
      const position = this.stage.getPointerPosition();
      const x2 = position?.x || 0;
      const y2 = position?.y || 0;
      switch (this.action) {
        case 'line':
          this.drawLine(this.x1 || 0, this.y1 || 0, x2, y2);
          break;
        case 'rectangle':
          this.drawRectange(this.x1 || 0, this.y1 || 0, x2 - (this.x1 || 0), y2 - (this.y1 || 0));
          break;
        case 'circle':
          this.drawCircle(this.x1 || 0, this.y1 || 0, this.distance(this.x1 || 0, this.y1 || 0, x2, y2));
          break;
        case 'drawer':
          this.drawFree(x2, y2);
      }
    }
  }

  end() {
    this.isDrawing = false;
    if (this.isDraging) {
      this.isDraging = false;
      this.operations?.push('Create', this.shape);
      this.addListeners();
    }
  }

  select(e: Konva.KonvaPointerEvent) {
    if (this.isSelect) {
      this.unselect();
      if (e.target != this.stage) {
        this.transformer.setNodes([e.target]);
        e.target.setDraggable(true);
      }
    }
  }

  private unselect() {
    this.transformer.setNodes([]);
    for (const child of this.layer.getChildren()) {
      if (child.getClassName() != 'Transformer') child.setDraggable(false);
    }
  }

  private addListeners() {
    this.shape?.on('dragstart', () => this.shape = <Konva.Shape>this.transformer.getNodes()[0].clone());
    this.shape?.on('dragend', () => this.operations?.push('Update', <Konva.Shape>this.transformer.getNodes()[0], this.shape));
    this.shape?.on('transformstart', () => this.shape = <Konva.Shape>this.transformer.getNodes()[0].clone());
    this.shape?.on('transformend', () => this.operations?.push('Update', <Konva.Shape>this.transformer.getNodes()[0], this.shape));
  }

	clearSelection() {
    Object.keys(this.selectedButton).forEach(key => {
      if (key !== 'fill') {
        this.selectedButton[key] = false;
      }
    })
  }

	setSelection(type: string) {
    this.selectedButton[type] = true;
  }

	addShape(type: string, image?: string) {
    this.action = type;
    this.clearSelection();
		this.selectedButton[type] = true;
    if (type == 'image') {
      this.addImage(image || '');
    }
  }

  drawCircle(x: number, y: number, radius: number) {
    if (this.isDraging) {
      this.shape?.setAttr('radius', radius);
    } else {
      this.isDraging = true;
      this.shape = new Konva.Circle({
        x: x,
        y: y,
        radius: radius,
        stroke: this.color,
        strokeWidth: parseInt(this.lineWidth)
      });
      if (this.isFill) this.shape.setAttr('fill', this.color);

      this.layer.add(this.shape);
    }
  }

  drawRectange(x: number, y: number, w: number, h: number) {
    if (this.isDraging) {
      this.shape?.setAttr('width', w);
      this.shape?.setAttr('height', h);
    } else {
      this.isDraging = true;
      this.shape = new Konva.Rect({
        x: x,
        y: y,
        width: w,
        height: h,
        stroke: this.color,
        strokeWidth: parseInt(this.lineWidth)
      });
      if (this.isFill) this.shape.setAttr('fill', this.color);
      this.layer.add(this.shape);
    }
  }

  drawLine(x1: number, y1: number, x2: number, y2: number) {
    if (this.isDraging) {
      this.shape?.setAttr('points', [x1, y1, x2, y2]);
    } else {
      this.isDraging = true;
      this.shape = new Konva.Line({
        points: [x1, y1, x2, y2],
        stroke: this.color,
        strokeWidth: parseInt(this.lineWidth)
      });

      this.layer.add(this.shape);
    }
  }

  drawFree(x: number, y: number) {
    if (this.isDraging) {
      const points = this.shape?.getAttr('points');
      points.push(x, y);
      this.shape?.setAttr('points', points);
    } else {
      this.isDraging = true;
      this.shape = new Konva.Line({
        points: [x, y, x, y],
        stroke: this.color,
        strokeWidth: parseInt(this.lineWidth),
        lineCap: 'round'
      });

      this.layer.add(this.shape);
    }
  }

	addText(x: number, y: number) {
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    textarea.style.left = x + 'px';
    textarea.style.top = y + 'px';
    textarea.style.width = 200 + 'px';
    textarea.style.position = 'absolute';
    window.setTimeout(() => textarea.focus(), 0);

    textarea.onblur = () => this.replaceTextarea(textarea);
    textarea.onkeydown = (e) => { if (e.key == 'Enter' && !e.shiftKey) this.replaceTextarea(textarea); };
    this.selectSwitch();
  }

  private replaceTextarea(textarea: HTMLTextAreaElement) {
    this.shape = new Konva.Text({
      text: textarea.value,
      x: this.x1,
      y: this.y1,
      fontSize: 24,
      fill: this.color
    });
    document.body.removeChild(textarea);
    this.layer.add(this.shape);
    this.operations?.push('Create', this.shape);
    this.addListeners();
  }

	addImage(type: string) {
		const image = this.shapeService.image(type);
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
      lastLine = component.shapeService.drawer(pos, mode, '#FFFFFF')
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
    if (this.isSelect) this.selectSwitch();
    this.operations?.undo();
  }

  redo() {
    if (this.isSelect) this.selectSwitch();
    this.operations?.redo();
  }

  delete() {
    const nodes = this.transformer.getNodes();
    if (nodes.length != 0) {
      this.shape = <Konva.Shape>nodes[0];
      this.operations?.push('Delete', this.shape);
      this.shape.remove();
      this.unselect();
    }
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
    exportFromJSON({data: JSON.parse(this.stage.toJSON()), fileName: 'museum-map', exportType: 'json' });
		console.log('canvasData', canvasData);
	}

  load() {
		const containerElement: HTMLElement = this.stageContainer?.nativeElement;
    if (!(containerElement instanceof HTMLElement)) {
      console.error('El contenedor no es un elemento DOM válido.');
      return;
    }
    this.stage.destroy();
    this.stage = Konva.Node.create(initCanvasData, this.stageContainer?.nativeElement);
    this.initStage();
    this.layer = this.stage.getChildren()[0];
    this.transformer = this.layer.findOne('Transformer') ||  new Konva.Transformer();;
    this.operations = new Operations(this.layer);

    const images = initCanvasData.children[0].children.filter(obj => obj.className === 'Image');
    images.forEach((obj: any) => {
      const image = new Image();
            image.onload = () => {
                const konvaImage = new Konva.Image({
                    x: obj.attrs.x,
                    y: obj.attrs.y,
                    image: image,
                    width: obj.attrs.width,
                    height: obj.attrs.height,
                    draggable: obj.attrs.draggable,
                    name: obj.attrs.name,
                    src: obj.attrs.src,
                    scaleX: obj.attrs.scaleX,
                    scaleY: obj.attrs.scaleY,
                    strokeWidth: obj.attrs.strokeWidth
                });
                this.layer.add(konvaImage);
                this.stage.batchDraw();
            };
            image.src = obj.attrs.src;
    });
  }

  selectSwitch() {
    this.isSelect = !this.isSelect;
    this.selectedButton['select'] = this.isSelect;
    if (this.isSelect) {
      this.action = '';
    } else {
      this.unselect();
    }
  }

  fillSwitch() {
    this.isFill = !this.isFill;
    this.selectedButton['fill'] = this.isFill;
  }

  private distance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }
}

