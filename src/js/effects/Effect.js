'use strict';

const Display = require('../display/Display.js');

class Effect extends Display {
    constructor(type, options) {
        super(type, options);
    }

    update(options) {
        if (this.pass && options && options.enabled !== undefined) {
            this.pass.options.enabled = options.enabled;
        }

        return super.update(options);
    }

    setPass(pass) {
        this.pass = pass;
        pass.options.enabled = this.options.enabled;

        this.owner.updatePasses();
    }

    updatePass() {
        this.pass.setUniforms(this.options);
    }

    setSize(width, height) {
        let pass = this.pass;

        if (pass && pass.uniforms) {
            Object.keys(pass.uniforms).forEach(key => {
                if (key === 'resolution') {
                    pass.uniforms[key].value.set(width, height);
                    console.log(pass.uniforms);
                }
            });
        }
    }

    renderToScene(scene) {
        if (this.hasUpdate) {
            this.updatePass();

            this.hasUpdate = false;
        }
    }
}

module.exports = Effect;