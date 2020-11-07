import Entity from 'core/Entity';
import BezierSpline from 'drawing/BezierSpline';
import { resetCanvas, setColor } from 'utils/canvas';

export default class CanvasWave extends Entity {
  static config = {
    name: 'CanvasWave',
    description: 'Canvas wave.',
    type: 'entity',
    defaultProperties: {
      strokeColor: '#FFFFFF',
      width: 400,
      height: 200,
      lineWidth: 1.0,
      stroke: true,
      fill: false,
      fillColor: null,
      taper: false,
    },
  };

  constructor(properties, canvas) {
    const {
      config: { name, defaultProperties },
    } = CanvasWave;

    super(name, { ...defaultProperties, ...properties });

    this.canvas = canvas || document.createElement('canvas');
    this.canvas.width = this.properties.width;
    this.canvas.height = this.properties.height;

    this.context = this.canvas.getContext('2d');
  }

  /* eslint-disable no-param-reassign */
  render(points, smooth) {
    const { canvas, context } = this;

    const {
      width,
      height,
      strokeColor,
      lineWidth,
      stroke,
      fill,
      fillColor,
      taper,
    } = this.properties;

    // Reset canvas
    resetCanvas(canvas, width, height);

    // Canvas setup
    context.lineWidth = lineWidth;
    context.strokeStyle = strokeColor;

    // Draw wave
    if (smooth) {
      for (let i = 0; i < points.length; i += 2) {
        points[i + 1] = height - points[i + 1] * height;
      }

      context.beginPath();

      // Taper edges
      if (taper) {
        points[0] = 0;
        points[1] = height;

        points[points.length - 2] = width;
        points[points.length - 1] = height;
      }

      // Draw spline
      BezierSpline.drawPath(context, points);

      if (fill && fillColor) {
        setColor(context, fillColor, 0, 0, 0, height);

        // Close loop
        if (taper) {
          context.moveTo(width, height);
          context.lineTo(0, height);
        } else {
          context.moveTo(width, points[points.length - 1]);
          context.lineTo(width, height);
          context.lineTo(0, height);
          context.lineTo(0, points[1]);
        }

        context.fill();
      }

      if (stroke) {
        context.stroke();
      }
    } else {
      context.beginPath();

      for (let i = 0; i < points.length; i += 2) {
        if (i === 0) {
          context.moveTo(points[i], height - points[i + 1] * height);
        } else {
          context.lineTo(points[i], height - points[i + 1] * height);
        }
      }

      if (fill && fillColor) {
        context.closePath();
        context.fill();
      }

      if (stroke) {
        context.stroke();
      }
    }
  }
}
