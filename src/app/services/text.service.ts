import { Injectable } from '@angular/core';
import Konva from 'konva';

@Injectable({
  providedIn: 'root'
})
export class TextNodeService {

  constructor() { }

  textNode(stage: Konva.Stage, layer: Konva.Layer) {
    var textNode = new Konva.Text({
      text: 'Escribe aquí',
      x: 50,
      y: 80,
      fontSize: 17,
      draggable: true,
      width: 200,
    });

    layer.add(textNode);

    let tr = new Konva.Transformer({
      node: textNode as any,
      enabledAnchors: ['middle-left', 'middle-right'],
      // set minimum width of text
      boundBoxFunc: function (oldBox, newBox) {
        newBox.width = Math.max(30, newBox.width);
        return newBox;
      }
    });

    textNode.on('transform', function () {
      // reset scale, so only with is changing by transformer
      textNode.setAttrs({
        width: textNode.width() * textNode.scaleX(),
        scaleX: 1,
      });
    });
    layer.add(tr);

    layer.draw();
    textNode.on('dblclick dbltap', () => {
        // hide text node and transformer:
        textNode.hide();
        tr.hide();

        // create textarea over canvas with absolute position
        // first we need to find position for textarea
        // how to find it?

        // at first lets find position of text node relative to the stage:
        var textPosition = textNode.absolutePosition();

        // so position of textarea will be the sum of positions above:
        var areaPosition = {
          x: stage.container().offsetLeft + textPosition.x,
          y: stage.container().offsetTop + textPosition.y,
        };

        // create textarea and style it
        var textarea = document.createElement('textarea');
        document.body.appendChild(textarea);

        // apply many styles to match text on canvas as close as possible
        // remember that text rendering on canvas and on the textarea can be different
        // and sometimes it is hard to make it 100% the same. But we will try...
        textarea.value = textNode.text();
        textarea.style.position = 'absolute';
        textarea.style.top = areaPosition.y + 'px';
        textarea.style.left = areaPosition.x + 'px';
        textarea.style.width = textNode.width() - textNode.padding() * 2 + 'px';
        textarea.style.height =
          textNode.height() - textNode.padding() * 2 + 5 + 'px';
        textarea.style.fontSize = textNode.fontSize() + 'px';
        textarea.style.border = 'none';
        textarea.style.padding = '0px';
        textarea.style.margin = '0px';
        textarea.style.overflow = 'hidden';
        textarea.style.background = 'none';
        textarea.style.outline = 'none';
        textarea.style.resize = 'none';
        textarea.style.lineHeight = textNode.lineHeight().toString();
        textarea.style.fontFamily = textNode.fontFamily();
        textarea.style.transformOrigin = 'left top';
        textarea.style.textAlign = textNode.align();
        textarea.style.color = textNode.fill();
        var rotation = textNode.rotation();
        var transform = '';
        if (rotation) {
          transform += 'rotateZ(' + rotation + 'deg)';
        }

        var px = 0;
        // also we need to slightly move textarea on firefox
        // because it jumps a bit
        var isFirefox =
          navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
        if (isFirefox) {
          px += 2 + Math.round(textNode.fontSize() / 20);
        }
        transform += 'translateY(-' + px + 'px)';

        textarea.style.transform = transform;

        // reset height
        textarea.style.height = 'auto';
        // after browsers resized it we can set actual value
        textarea.style.height = textarea.scrollHeight + 3 + 'px';

        textarea.focus();

        function removeTextarea() {
          textarea.parentNode?.removeChild(textarea);
          window.removeEventListener('click', handleOutsideClick);
          textNode.show();
          tr.show();
          tr.forceUpdate();
        }

        function setTextareaWidth(newWidth: any) {
          if (!newWidth) {
            // set width for placeholder
            newWidth = textNode.text().length * textNode.fontSize();
          }
          // some extra fixes on different browsers
          var isSafari = /^((?!chrome|android).)*safari/i.test(
            navigator.userAgent
          );
          var isFirefox =
            navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
          if (isSafari || isFirefox) {
            newWidth = Math.ceil(newWidth);
          }

          var isEdge =
            document.DOCUMENT_NODE || /Edge/.test(navigator.userAgent);
          if (isEdge) {
            newWidth += 1;
          }
          textarea.style.width = newWidth + 'px';
        }

        textarea.addEventListener('keydown', function (e) {
          // hide on enter
          // but don't hide on shift + enter
          if (e.keyCode === 13 && !e.shiftKey) {
            textNode.text(textarea.value);
            removeTextarea();
          }
          // on esc do not set value back to node
          if (e.keyCode === 27) {
            removeTextarea();
          }
        });

        textarea.addEventListener('keydown', function (e) {
          var scale = textNode.getAbsoluteScale().x;
          setTextareaWidth(textNode.width() * scale);
          textarea.style.height = 'auto';
          textarea.style.height =
            textarea.scrollHeight + textNode.fontSize() + 'px';
        });

        function handleOutsideClick(e: any) {
          if (e.target !== textarea) {
            textNode.text(textarea.value);
            removeTextarea();
          }
        }
        setTimeout(() => {
          window.addEventListener('click', handleOutsideClick);
        });
      });
    return { textNode, tr };
  }
}
