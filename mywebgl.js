var gl;

var vs1 =  "attribute vec3 in_vertex; \
            attribute vec3 in_normal; \
            varying lowp vec4 ex_color; \
            uniform mat4 mv; \
            uniform mat4 mvp; \
            \
            void main(void) { \
                ex_color = mv * vec4(in_normal, 0.0); \
                gl_Position = mvp * vec4(in_vertex, 1.0); \
            }";

var ps1 =  "varying lowp vec4 ex_color; \
            \
            void main(void) { \
                gl_FragColor = vec4(ex_color.xyz, 1.0); \
            }";


////////////////////////////////////////////////////////////////////////////////
// vector
////////////////////////////////////////////////////////////////////////////////
var vec4 = (function() {
    // ctor
    function _vec4(x,y,z,w) {
        this.x = parseFloat(x || 0.0);
        this.y = parseFloat(y || 0.0);
        this.z = parseFloat(z || 0.0);
        this.w = parseFloat(w || 1.0);
    };

    _vec4.prototype.add = function(vec) {
        return new _vec4(this.x+vec.x, this.y+vec.y, this.z+vec.z, 1.0);
    };

    _vec4.prototype.sub = function(vec) {
        return new _vec4(this.x-vec.x, this.y-vec.y, this.z-vec.z, 1.0);
    };

    _vec4.prototype.neg = function() {
        return new _vec4(-this.x, -this.y, -this.z, 1.0);
    };

    _vec4.prototype.normSqr = function() {
        return this.dot(this);
    };

    _vec4.prototype.norm = function() {
        return Math.sqrt(this.normSqr());
    };

    _vec4.prototype.normSqr4 = function() {
        return this.dot4(this);
    };

    _vec4.prototype.norm4 = function() {
        return Math.sqrt(this.normSqr4());
    };

    _vec4.prototype.normalize = function() {
        var norm = this.norm();
        return new _vec4(this.x/norm, this.y/norm, this.z/norm, 1);
    };

    _vec4.prototype.normalize4 = function() {
        var norm = this.norm4();
        return new _vec4(this.x/norm, this.y/norm, this.z/norm, this.w/norm);
    };

    _vec4.prototype.dot = function(vec) {
        return this.x*vec.x + this.y*vec.y + this.z*vec.z;
    };

    _vec4.prototype.dot4 = function(vec) {
        return this.x*vec.x + this.y*vec.y + this.z*vec.z + this.w*vec.w;
    };

    _vec4.prototype.cross = function(vec) {
        return new _vec4(this.y*vec.z - this.z*vec.y, this.z*vec.x - this.x*vec.z, this.x*vec.y - this.y*vec.x, 0);
    };

    _vec4.prototype.toString = function() {
        return this.x + "," + this.y + "," + this.z + "," + this.w;
    };

    return _vec4;
}());

////////////////////////////////////////////////////////////////////////////////
// matrix
////////////////////////////////////////////////////////////////////////////////
var mat4 = (function() {
    // ctor
    function _mat4(mat) { // mat is array
        this.mat = mat || [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]; // identity by default
    };

    function id(x,y) {
        return (y*4) + x;
    };

    _mat4.prototype.identity = function() {
        this.mat = [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
        return this;
    };

    _mat4.prototype.mult = function(mat) {
        var res = new _mat4();
        if(typeof(mat) == "number") { // mult by a factor
            for(var i=0; i<16; ++i) {
                res.mat[i] = this.mat[i] * mat;
            };
        }
        else { // classic matrix mult
            for(var i = 0; i < 4; ++i) {
                for(var j = 0; j < 4; ++j) {
                    res.mat[id(i,j)] = 0.0;
                    for(var k = 0; k < 4; ++k) {
                        res.mat[id(i,j)] += this.mat[id(i,k)] * mat.mat[id(k,j)];
                    };
                };
            };
        };

        return res;
    };

    _mat4.prototype.transpose = function() {
        return new _mat4([this.mat[0], this.mat[4], this.mat[8], this.mat[12], 
                          this.mat[1], this.mat[5], this.mat[9], this.mat[13], 
                          this.mat[2], this.mat[6], this.mat[10], this.mat[14], 
                          this.mat[3], this.mat[7], this.mat[11], this.mat[15]]);
    };

    _mat4.rotate = function(angle, axis) {
        axis = axis.normalize();

        var s = Math.sin(angle*(Math.PI/180.0));
        var c = Math.cos(angle*(Math.PI/180.0));
        var mat = new _mat4();

        mat.mat[0] = axis.x * axis.x + (1.0 - axis.x * axis.x) * c;
        mat.mat[1] = axis.x * axis.y * (1.0 - c) - (axis.z * s);
        mat.mat[2] = axis.x * axis.z * (1.0 - c) + (axis.y * s);
        mat.mat[3] = 0.0;

        mat.mat[4] = axis.x * axis.y * (1.0 - c) + (axis.z * s);
        mat.mat[5] = axis.y * axis.y + (1.0 - axis.y * axis.y) * c;
        mat.mat[6] = axis.y * axis.z * (1.0 - c) - (axis.x * s);
        mat.mat[7] = 0.0;

        mat.mat[8] = axis.x * axis.z * (1.0 - c) - (axis.y * s);
        mat.mat[9] = axis.y * axis.z * (1.0 - c) + (axis.x * s);
        mat.mat[10] = axis.z * axis.z + (1.0 - axis.z * axis.z) * c;
        mat.mat[11] = 0.0;

        mat.mat[12] = 0.0;
        mat.mat[13] = 0.0;
        mat.mat[14] = 0.0;
        mat.mat[15] = 1.0;

        return mat;
    };

    _mat4.translate = function(vec) {
        return new _mat4([1,0,0,0,0,1,0,0,0,0,1,0,vec.x,vec.y,vec.z,1]);
    };

    _mat4.ortho = function(left, right, bottom, top, znear, zfar) {
        var tx = -(right+left)/(right-left);
        var ty = -(top+bottom)/(top-bottom);
        var tz = -(zfar+znear)/(zfar-znear);

        return new _mat4([2/(right-left), 0, 0, 0, 
                          0, 2/(top-bottom), 0, 0, 
                          0, 0, -2/(zfar-znear), 0, 
                          tx, ty, tz, 1]);
    };

    _mat4.perspective = function(fovy, aspect, znear, zfar) {
        var ymax = znear * Math.tan(fovy * Math.PI / 360.0);
        var ymin = -ymax;
        var xmin = ymin * aspect;
        var xmax = ymax * aspect;

        return _mat4.frustum(xmin, xmax, ymin, ymax, znear, zfar);
    };

    _mat4.frustum = function(left, right, bottom, top, znear, zfar) {
        var x = 2*znear/(right-left);
        var y = 2*znear/(top-bottom);
        var a = (right+left)/(right-left);
        var b = (top+bottom)/(top-bottom);
        var c = -(zfar+znear)/(zfar-znear);
        var d = -2*zfar*znear/(zfar-znear);

        return new _mat4([x, 0, 0, 0, 
                          0, y, 0, 0, 
                          a, b, c, -1, 
                          0, 0, d, 0]);
    };

    _mat4.prototype.toString = function() {
        return this.mat[0] + ',' + this.mat[1] + ',' + this.mat[2] + ',' + this.mat[3] + '\n' + 
               this.mat[4] + ',' + this.mat[5] + ',' + this.mat[6] + ',' + this.mat[7] + '\n' + 
               this.mat[8] + ',' + this.mat[9] + ',' + this.mat[10] + ',' + this.mat[11] + '\n' + 
               this.mat[12] + ',' + this.mat[13] + ',' + this.mat[14] + ',' + this.mat[15];

    };

    return _mat4;
}());

////////////////////////////////////////////////////////////////////////////////
// camera
////////////////////////////////////////////////////////////////////////////////
var Camera = (function() {
    function _Camera() {
        this.position = new vec4(0,0,5);
        this.viewMatrix = new mat4();
        this.speed = 1.0;
        this.rotateX = 0.0;
        this.rotateY = 0.0;
    };

    // axis = 0 -> horizontal
    // axis = 1 -> vertical
    _Camera.prototype.turn = function(axis, angle) {
        //angle /= 5.0;
        if(axis == 0) {
            this.rotateX -= angle;
            if(this.rotateX < 0) this.rotateX = 360;
            if(this.rotateX > 360) this.rotateX = 0;
        }
        else if(axis == 1) {
            this.rotateY -= angle;
            if(this.rotateY < 0) this.rotateY = 0;
            if(this.rotateY > 180) this.rotateY = 180;
        };
    };

    // axis : 0, 1, 2 -> X, Y, Z (X:front,back ; Y:left,right ; Z:up,down)
    // direction : 0, 1 -> forward
    // direction : -1 -> backward
    _Camera.prototype.move = function(axis, direction, speed) {
        if(!speed) speed = this.speed;
        if(!direction) direction = 1;

        speed *= direction;

        if(axis == 0) {
            this.position.x -= speed*Math.sin(this.rotateX*(Math.PI/180.0));
            this.position.y += speed*Math.cos(this.rotateX*(Math.PI/180.0));
        }
        else if(axis == 1) {
            this.position.x += speed*Math.cos(this.rotateX*(Math.PI/180.0));
            this.position.y += speed*Math.sin(this.rotateX*(Math.PI/180.0));
        }
        else if(axis == 2) {
            this.position.z += speed;
        };
    };

    _Camera.prototype.getMatrix = function() {
        this.viewMatrix = mat4.rotate(this.rotateX, new vec4(0,0,1));
        this.viewMatrix = this.viewMatrix.mult(mat4.rotate(this.rotateY, new vec4(Math.cos(this.rotateX*(Math.PI/180.0)), Math.sin(this.rotateX*(Math.PI/180.0)), 0.0)));
        this.viewMatrix = this.viewMatrix.mult(mat4.translate(this.position.neg()));

        return this.viewMatrix;
    };

    return _Camera;
}());

////////////////////////////////////////////////////////////////////////////////
// scene
////////////////////////////////////////////////////////////////////////////////
var Scene = (function() {
    function _Scene() {
        this.elem = [];
    };

    return _Scene;
}());

////////////////////////////////////////////////////////////////////////////////
// mesh
////////////////////////////////////////////////////////////////////////////////
var Mesh = (function() {
    function _Mesh() {
        this.shaderProgram = null;
        this.vertexBuffer = null;
        this.vertexAttribPos = null;
        this.normalBuffer = null;
        this.normalAttribPos = null;
        this.colorBuffer = null;
        this.colorAttribPos = null;
        this.texcoordBuffer = null;
        this.texcoordAttribPos = null;
        this.indexBuffer = null;
        this.indexBufferSize = 0;
        this.mvUniformLoc = null;
        this.mvpUniformLoc = null;
        this.modelMatrix = new mat4();
        this.angle = 1;
    };

    _Mesh.prototype.init = function() {
        gl.useProgram(this.shaderProgram);

        this.vertexAttribPos = gl.getAttribLocation(this.shaderProgram, "in_vertex");
        gl.enableVertexAttribArray(this.vertexAttribPos);

        if(this.normalBuffer) {
            this.normalAttribPos = gl.getAttribLocation(this.shaderProgram, "in_normal");
            gl.enableVertexAttribArray(this.normalAttribPos);
        };

        if(this.colorBuffer) {
            this.colorAttribPos = gl.getAttribLocation(this.shaderProgram, "in_color");
            gl.enableVertexAttribArray(this.colorAttribPos);
        };

        if(this.texcoordBuffer) {
            this.texcoordAttribPos = gl.getAttribLocation(this.shaderProgram, "in_texcoord");
            gl.enableVertexAttribArray(this.texcoordAttribPos);
        };

        this.mvUniformLoc = gl.getUniformLocation(this.shaderProgram, "mv");
        this.mvpUniformLoc = gl.getUniformLocation(this.shaderProgram, "mvp");
    };

    _Mesh.prototype.draw = function(viewMatrix, projMatrix) {
        //console.log("draw mesh");

        //this.angle += 0.1;
        //this.modelMatrix = this.modelMatrix.mult(mat4.rotate(this.angle, new vec4(1,1,1)))
        //this.modelMatrix = mat4.rotate(this.angle, new vec4(1,1,1)).mult(this.modelMatrix);

        var mv = viewMatrix.mult(this.modelMatrix);
        var mvp = projMatrix.mult(mv);

        gl.useProgram(this.shaderProgram);

        gl.uniformMatrix4fv(this.mvUniformLoc, false, new Float32Array(mv.mat));
        gl.uniformMatrix4fv(this.mvpUniformLoc, false, new Float32Array(mvp.mat));

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(this.vertexAttribPos, 3, gl.FLOAT, false, 0, 0);

        if(this.colorBuffer) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
            gl.vertexAttribPointer(this.colorAttribPos, 3, gl.FLOAT, false, 0, 0);
        };

        if(this.normalBuffer) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
            gl.vertexAttribPointer(this.normalAttribPos, 3, gl.FLOAT, false, 0, 0);
        };

        if(this.texcoordBuffer) {
        };

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.indexBufferSize, gl.UNSIGNED_SHORT, 0);
    };

    return _Mesh;
}());

////////////////////////////////////////////////////////////////////////////////
// webgl engine
////////////////////////////////////////////////////////////////////////////////
var WebglEngine = (function() {
    function _WebglEngine(canvas) {
        this.canvasElement = document.getElementById(canvas);
        this.camera = new Camera();
        this.scene = new Scene();
        this.projMatrix = mat4.perspective(75, 800.0/600.0, 0.01, 1000.0);
        //this.projMatrix = new mat4().ortho(-2, 2, -2, 2, -2, 2);
        //console.log("proj : " + this.projMatrix);
        this.resources = [];
        this.gl = null;

        document.onmousedown = this.handleInputEvents.bind(this);
        document.onmouseup = this.handleInputEvents.bind(this);
        document.onmousemove = this.handleInputEvents.bind(this);
        document.onkeydown = this.handleInputEvents.bind(this);
        document.onkeyup = this.handleInputEvents.bind(this);

        try { // Try to grab the standard context. If it fails, fallback to experimental.
            this.gl = this.canvasElement.getContext("webgl") || this.canvasElement.getContext("experimental-webgl");
            gl = this.gl;
        }
        catch(e) {}
        if(!this.gl) { // If we don't have a GL context, give up now
            alert("Unable to initialize WebGL. Your browser may not support it.");
        }
        this.resizeCanvas(800, 600);

        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);                      // Set clear color to black, fully opaque
        this.gl.enable(this.gl.DEPTH_TEST);                               // Enable depth testing
        this.gl.depthFunc(this.gl.LEQUAL);                                // Near things obscure far things
        this.gl.clear(this.gl.COLOR_BUFFER_BIT|this.gl.DEPTH_BUFFER_BIT);      // Clear the color as well as the depth buffer.
        this.gl.enable(this.gl.CULL_FACE);

        //console.log("MAX_VERTEX_ATTRIBS : " + this.gl.getParameter(this.gl.MAX_VERTEX_ATTRIBS));
    };

    _WebglEngine.prototype.start = function() {
        window.setInterval(this.loop.bind(this), 20);
        //window.setInterval(function(){this.loop();}, 15);
    };

    _WebglEngine.prototype.resizeCanvas = function(x, y) {
        this.canvasElement.width = x;
        this.canvasElement.height = y;

        this.gl.viewport(0, 0, this.canvasElement.width, this.canvasElement.height);

        this.projMatrix = mat4.perspective(75, x/y, 0.01, 1000.0);
    };

    _WebglEngine.prototype.handleInputEvents = function(event) {
        switch(event.type) {
            case "mousedown":
                //console.log("mousedown");
                this.handleInputMouseButton(event, 0);
                break;
            case "mouseup":
                //console.log("mouseup");
                this.handleInputMouseButton(event, 1);
                break;
            case "mousemove":
                //console.log("mousemove");
                this.handleInputMouseMove(event);
                break;
            case "keydown":
                //console.log("keydown");
                this.handleInputKey(event, 0);
                break;
            case "keyup":
                //console.log("keyup");
                //this.handleInputKey(event, 1);
                break;
        };
        //console.log("camera : " + this.camera.rotateX + ", " + this.camera.rotateY + "\n" + this.camera.getMatrix());
    };

    var lastMouseX = 0;
    var lastMouseY = 0;
    _WebglEngine.prototype.handleInputMouseMove = function(event) {
        var deltaX = event.clientX - lastMouseX;
        var deltaY = event.clientY - lastMouseY;
        lastMouseX = event.clientX;
        lastMouseY = event.clientY;

        this.camera.turn(0, deltaX);
        this.camera.turn(1, deltaY);
    };

    // type : 0 -> mousedown
    // type : 1 -> mouseup
    _WebglEngine.prototype.handleInputMouseButton = function(event, type) {
        
    };

    // type : 0 -> keydown
    // type : 1 -> keyup
    _WebglEngine.prototype.handleInputKey = function(event, type) {
        //console.log("key : " + event.keyCode);
        switch(event.keyCode) {
            case KeyboardEvent.DOM_VK_Z:
                this.camera.move(0, 1);
                break;
            case KeyboardEvent.DOM_VK_S:
                this.camera.move(0, -1);
                break;
            case KeyboardEvent.DOM_VK_Q:
                this.camera.move(1, -1);
                break;
            case KeyboardEvent.DOM_VK_D:
                this.camera.move(1, 1);
                break;
            case KeyboardEvent.DOM_VK_R:
                this.camera.move(2, 1);
                break;
            case KeyboardEvent.DOM_VK_F:
                this.camera.move(2, -1);
                break;
        };
    };

    _WebglEngine.prototype.createShader = function(source, type) {
        var shader;
        if(type == "x-shader/x-fragment") {
            shader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
        } else if(type == "x-shader/x-vertex") {
            shader = this.gl.createShader(this.gl.VERTEX_SHADER);
        }
        else { // Unknown shader type
            return null;
        };

        //console.log(type + " : " + source);

        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if(!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error("An error occurred compiling the shaders: " + this.gl.getShaderInfoLog(shader));
            return null;
        };

        return shader;
    };

    // vsSrc , psSrc : shader source string
    _WebglEngine.prototype.createShaderProgram = function(vsSrc, psSrc) {
        var vs = this.createShader(vsSrc, "x-shader/x-vertex");
        var ps = this.createShader(psSrc, "x-shader/x-fragment");

        var program = this.gl.createProgram();
        this.gl.attachShader(program, vs);
        this.gl.attachShader(program, ps);
        this.gl.linkProgram(program);

        if(!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error("Unable to initialize the shader program : " + this.gl.getProgramInfoLog(program));
        };

        return program;
    };

    // buffer : array
    _WebglEngine.prototype.createBuffer = function(buffer) {
        var bufferObject = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, bufferObject);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(buffer), this.gl.STATIC_DRAW);
        return bufferObject;
    };

    _WebglEngine.prototype.createIndexBuffer = function(buffer) {
        var bufferObject = this.gl.createBuffer();
        gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, bufferObject);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER , new Uint16Array(buffer), this.gl.STATIC_DRAW);
        return bufferObject;
    };

    _WebglEngine.prototype.render = function() {
        var viewMatrix = this.camera.getMatrix();

        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        for(var i=0; i<this.scene.elem.length; ++i) {
            this.scene.elem[i].draw(viewMatrix, this.projMatrix);
        };
    };

    _WebglEngine.prototype.loop = function() {
        // update movements

        // render
        this.render();
    };

    return _WebglEngine;
}());

////////////////////////////////////////////////////////////////////////////////
// entry point
////////////////////////////////////////////////////////////////////////////////
function webgl_start(canvas) {
    var engine = new WebglEngine(canvas);
    engine.resizeCanvas(1900, 800);
    initWorld(engine);
    engine.start();
};

function initWorld(engine) {
    var vertex = [
                // Front face
                -1.0, -1.0,  1.0,
                 1.0, -1.0,  1.0,
                 1.0,  1.0,  1.0,
                -1.0,  1.0,  1.0,
                
                // Back face
                -1.0, -1.0, -1.0,
                -1.0,  1.0, -1.0,
                 1.0,  1.0, -1.0,
                 1.0, -1.0, -1.0,
                
                // Top face
                -1.0,  1.0, -1.0,
                -1.0,  1.0,  1.0,
                 1.0,  1.0,  1.0,
                 1.0,  1.0, -1.0,
                
                // Bottom face
                -1.0, -1.0, -1.0,
                 1.0, -1.0, -1.0,
                 1.0, -1.0,  1.0,
                -1.0, -1.0,  1.0,
                
                // Right face
                 1.0, -1.0, -1.0,
                 1.0,  1.0, -1.0,
                 1.0,  1.0,  1.0,
                 1.0, -1.0,  1.0,
                
                // Left face
                -1.0, -1.0, -1.0,
                -1.0, -1.0,  1.0,
                -1.0,  1.0,  1.0,
                -1.0,  1.0, -1.0
              ];
    var normal = [
                // Front face
                0.0, 0.0, 1.0,
                0.0, 0.0, 1.0,
                0.0, 0.0, 1.0,
                0.0, 0.0, 1.0,
                
                // Back face
                0.0, 0.0, -1.0,
                0.0, 0.0, -1.0,
                0.0, 0.0, -1.0,
                0.0, 0.0, -1.0,
                
                // Top face
                0.0,  1.0, 0.0,
                0.0,  1.0, 0.0,
                0.0,  1.0, 0.0,
                0.0,  1.0, 0.0,
                
                // Bottom face
                0.0, -1.0, 0.0,
                0.0, -1.0, 0.0,
                0.0, -1.0, 0.0,
                0.0, -1.0, 0.0,
                
                // Right face
                 1.0, 0.0, 0.0,
                 1.0, 0.0, 0.0,
                 1.0, 0.0, 0.0,
                 1.0, 0.0, 0.0,
                
                // Left face
                -1.0, 0.0, 0.0,
                -1.0, 0.0, 0.0,
                -1.0, 0.0, 0.0,
                -1.0, 0.0, 0.0,
              ];
    var color = [
                // Front face
                1.0, 0.0,  0.0,
                0.0, 1.0,  0.0,
                0.0, 0.0,  1.0,
                1.0, 1.0,  1.0,
                
                // Back face
                1.0, 0.0,  0.0,
                0.0, 1.0,  0.0,
                0.0, 0.0,  1.0,
                1.0, 1.0,  1.0,
                
                // Top face
                1.0, 0.0,  0.0,
                0.0, 1.0,  0.0,
                0.0, 0.0,  1.0,
                1.0, 1.0,  1.0,
                
                // Bottom face
                1.0, 0.0,  0.0,
                0.0, 1.0,  0.0,
                0.0, 0.0,  1.0,
                1.0, 1.0,  1.0,
                
                // Right face
                1.0, 0.0,  0.0,
                0.0, 1.0,  0.0,
                0.0, 0.0,  1.0,
                1.0, 1.0,  1.0,
                
                // Left face
                1.0, 0.0,  0.0,
                0.0, 1.0,  0.0,
                0.0, 0.0,  1.0,
                1.0, 1.0,  1.0,
              ];
    var index = [
                0,  1,  2,      0,  2,  3,    // front
                4,  5,  6,      4,  6,  7,    // back
                8,  9,  10,     8,  10, 11,   // top
                12, 13, 14,     12, 14, 15,   // bottom
                16, 17, 18,     16, 18, 19,   // right
                20, 21, 22,     20, 22, 23    // left
              ];

    // resource manager
    engine.resources["cubeVertexBO"] = engine.createBuffer(vertex);
    engine.resources["cubeNormalBO"] = engine.createBuffer(normal);
    engine.resources["cubeColorBO"] = engine.createBuffer(color);
    engine.resources["cubeIBO"] = engine.createIndexBuffer(index);
    engine.resources["sampleShader"] = engine.createShaderProgram(vs1, ps1);

    var nb = 10;
    for(var i=0; i<nb; ++i) {
        for(var j=0; j<nb; ++j) {
                var mesh = new Mesh();
                //mesh.shaderProgram = engine.createShaderProgram(vs1, ps1);
                //mesh.vertexBuffer = engine.createBuffer(vertex);
                //mesh.colorBuffer = engine.createBuffer(color);
                //mesh.indexBuffer = engine.createIndexBuffer(index);

                mesh.vertexBuffer = engine.resources["cubeVertexBO"];
                mesh.normalBuffer = engine.resources["cubeNormalBO"];
                //mesh.colorBuffer = engine.resources["cubeColorBO"];
                mesh.indexBuffer = engine.resources["cubeIBO"];
                mesh.shaderProgram = engine.resources["sampleShader"];

                mesh.init();
                mesh.indexBufferSize = index.length;
                mesh.modelMatrix = mat4.translate(new vec4(-nb*2 + 4*i, -nb*2 + 4*j, -5));
                engine.scene.elem.push(mesh);
        };
    };
};
