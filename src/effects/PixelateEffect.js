import Effect from 'core/Effect';
import ShaderPass from 'graphics/ShaderPass';
import PixelateShader from 'shaders/PixelateShader';
import HexagonShader from 'shaders/HexagonShader';

const renderOptions = ['Square', 'Hexagon'];

const shaders = {
  Square: PixelateShader,
  Hexagon: HexagonShader,
};

export default class PixelateEffect extends Effect {
  static config = {
    name: 'PixelateEffect',
    description: 'Pixelate effect.',
    type: 'effect',
    label: 'Pixelate',
    defaultProperties: {
      type: 'Square',
      size: 10,
    },
    controls: {
      type: {
        label: 'Type',
        type: 'select',
        items: renderOptions,
      },
      size: {
        label: 'Size',
        type: 'number',
        min: 2,
        max: 240,
        withRange: true,
        withReactor: true,
      },
    },
  };

  constructor(properties) {
    super(PixelateEffect, properties);
  }

  update(properties) {
    const changed = Effect.prototype.update.call(this, properties);

    if (this.pass && properties.type !== undefined) {
      this.pass = this.getShaderPass(this.properties.type);
    }

    return changed;
  }

  updatePass() {
    this.pass.setUniforms({ size: this.properties.size });
  }

  addToScene() {
    this.pass = this.getShaderPass(this.properties.type);
    this.pass.enabled = this.enabled;
  }

  removeFromScene() {
    this.pass = null;
  }

  getShaderPass(type) {
    const pass = new ShaderPass(shaders[type]);
    const { width, height } = this.scene.getSize();

    pass.setUniforms(this.properties);
    pass.setSize(width, height);

    return pass;
  }
}
