'use strict';

var _ = require('lodash');
var THREE = require('three');
var Immutable = require('immutable');

var Class = require('core/Class.js');
var EventEmitter = require('core/EventEmitter.js');
var NodeCollection = require('core/NodeCollection.js');
var Composer = require('graphics/Composer.js');
var IO = require('IO.js');

var defaults = {
    showFPS: false,
    audioOutput: 'mux',
    videoOutput: 'mp4',
    width: 854,
    height: 480
};

var Stage = function(options) {
    this.stats = {
        fps: 0,
        ms: 0,
        time: 0,
        frames: 0,
        stack: []
    };
    
    this.scenes = new NodeCollection();

    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();

    this.options = _.assign({}, defaults);

    this.renderer = new THREE.WebGLRenderer({ antialias: false });
    this.renderer.setSize(854, 480);
    this.renderer.autoClear = false;

    /*
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.options.width;
    this.canvas.height = this.options.height;
    this.context = this.canvas.getContext('2d');
    this.context.fillStyle = '#ff0000';
    this.context.fillRect(0, 0, this.options.width, this.options.height);
    */

    this.composer = new Composer(this.renderer);
    //this.pass = this.composer.addCanvasPass(this.canvas);

    this.update(options);
};

Class.extend(Stage, NodeCollection, {
    update: function(options) {
        if (typeof options === 'object') {
            for (var prop in options) {
                if (hasOwnProperty.call(this.options, prop)) {
                    this.options[prop] = options[prop];
                }
            }
        }
    },

    addScene: function(scene) {
        this.scenes.addNode(scene);

        scene.addToStage(this);

        //this.composer.addTexturePass(scene.composer.readBuffer, { renderToScreen: true });
    },

    removeScene: function(scene) {
        this.scenes.removeNode(scene);

        scene.removeFromStage(this);
    },

    moveScene(scene, i) {
        var index = this.scenes.indexOf(scene);

        this.scenes.swapNodes(index, index + i);
    },

    getScenes: function() {
        return this.scenes.nodes;
    },

    clear: function() {
        this.scenes.nodes.forEach(function(scene) {
            this.removeScene(scene);
        }.bind(this));
    },

    getDisplays: function() {
        var displays = [];

        this.scenes.nodes.forEach(function(scene) {
            scene.displays.nodes.forEach(function(display) {
                displays.push(display);
            });
        });

        return displays;
    },

    hasScenes: function() {
        return this.scenes.nodes.size > 0;
    },

    renderFrame: function(data, callback) {
        this.renderer.clear();

        this.scenes.nodes.forEach(function(scene) {
            scene.render(data);
        }, this);

        this.updateFPS();

        if (callback) callback();
    },

    renderImage: function(data, format, callback) {
        this.renderFrame(data, function() {
            var img = this.renderer.domElement.toDataURL(format || 'image/png'),
                base64 = img.replace(/^data:image\/\w+;base64,/, ''),
                buffer = new IO.Buffer(base64, 'base64');

            if (callback) callback(buffer);
        }.bind(this));
    },

    renderVideo: function(output_file, fps, duration, func, callback) {
        var started = false,
            frames = duration * fps,
            input_file = new IO.Stream.Transform();

        console.log('rending movie', duration, 'seconds,', fps, 'fps');

        input_file.on('error', function(err) {
            console.log(err);
        });

        this.callback = function(next) {
            if (next < frames) {
                this.renderImage(function(buffer) {
                    input_file.push(buffer);
                    func(next, fps, this.callback);
                }.bind(this));
            }
            else {
                input_file.push(null);
            }
        }.bind(this);

        var ffmpeg = IO.Spawn('./bin/ffmpeg.exe', ['-y', '-f', 'image2pipe', '-vcodec', 'png', '-r', fps, '-i', 'pipe:0', '-vcodec', 'libx264', '-movflags', '+faststart', '-pix_fmt', 'yuv420p', '-f', 'mp4', output_file]);
        input_file.pipe(ffmpeg.stdin);
        //ffmpeg.stdout.pipe(outStream);

        ffmpeg.stderr.on('data', function(data) {
            console.log(data.toString());
            if (!started) {
                func(0, fps, this.callback);
                started = true;
            }
        }.bind(this));

        ffmpeg.stderr.on('end', function() {
            console.log('file has been converted succesfully');
            if (callback) callback();
        });

        ffmpeg.stderr.on('exit', function() {
            console.log('child process exited');
        });

        ffmpeg.stderr.on('close', function() {
            console.log('program closed');
        });
    },

    getSize: function() {
        var canvas =  this.renderer.domElement;

        return {
            width: canvas.width,
            height: canvas.height
        };
    },

    updateFPS: function() {
        var now = performance.now(),
            stats = this.stats;

        if (!stats.time) {
            stats.time = now;
        }

        stats.frames += 1;

        if (now > stats.time + 1000) {
            stats.fps = Math.round((stats.frames * 1000) / (now - stats.time));
            stats.ms = (now - stats.time) / stats.frames;
            stats.time = now;
            stats.frames = 0;

            stats.stack.push(stats.fps);

            if (stats.stack.length > 10) {
                stats.stack.shift();
            }

            this.emit('tick', stats);
        }
    },

    toJSON: function() {
        var scenes = this.scenes.map(function(scene) {
            return scene.toJSON();
        });

        return {
            scenes: scenes,
            options: this.options
        };
    }
});

module.exports = Stage;