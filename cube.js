"use strict";

var canvas;
var gl;

var NumVertices  = 36;
var NumCubes = 8;

var lines = [];
var NumLines = 72;

var points = [];
var colors = [];

var modelview_loc;
var pmatrix_loc;
var color_transform_loc;

// key-adjust variables
var colorOffset = 0;    // c
var cameraHeight = 0;   // up down
var cameraDir = 0;      // left right
var forwardbackward = 0; // i m
var leftright = 0;      // j k
var fov = 0;            // n w

var vBuffer;
var lBuffer;
var vPosition;

var cubePositions = [
  [-10,10,-10],
  [10,-10,-10],
  [-10,-10,-10],
  [10,10,-10],
  [10,10,10],
  [-10,10,10],
  [10,-10,10],
  [-10,-10,10]
];

var vertexColors = [
    [ 1, 0.647059, 0.0, 1.0 ],  // orange
    [ 1.0, 0.0, 0.0, 1.0 ],  // red
    [ 1.0, 1.0, 0.0, 1.0 ],  // yellow
    [ 0.0, 1.0, 0.0, 1.0 ],  // green
    [ 0.0, 0.0, 1.0, 1.0 ],  // blue
    [ 1.0, 0.0, 1.0, 1.0 ],  // magenta
    [ 0.0, 1.0, 1.0, 1.0 ],  // cyan
    [ 1.0, 0.498039, 0.313725, 1.0 ]   // coral
];

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    colorCube(1);

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );


    lBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, lBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(lines), gl.STATIC_DRAW );


    vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    modelview_loc = gl.getUniformLocation(program, "ModelView");
    pmatrix_loc = gl.getUniformLocation(program, "PMatrix");
    color_transform_loc = gl.getUniformLocation(program, "vColor");

    document.onkeydown = handleKeyDown;

    render();
}

function colorCube(color)
{
    if ( color < 0 || color > 7 ) {
      throw "argument must be integers in [0,7]";
    }
    colors = [];
    quad( 1, 0, 3, 2, color );
    quad( 2, 3, 7, 6, color );
    quad( 3, 0, 4, 7, color );
    quad( 6, 5, 1, 2, color );
    quad( 4, 5, 6, 7, color );
    quad( 5, 4, 0, 1, color );
}

function quad(a, b, c, d, color)
{
    var vertices = [
        vec4( -0.5, -0.5,  0.5, 1.0 ),
        vec4( -0.5,  0.5,  0.5, 1.0 ),
        vec4(  0.5,  0.5,  0.5, 1.0 ),
        vec4(  0.5, -0.5,  0.5, 1.0 ),
        vec4( -0.5, -0.5, -0.5, 1.0 ),
        vec4( -0.5,  0.5, -0.5, 1.0 ),
        vec4(  0.5,  0.5, -0.5, 1.0 ),
        vec4(  0.5, -0.5, -0.5, 1.0 )
    ];

    var indices = [ a, b, c, a, c, d ];
    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );
        colors.push( vertexColors[color] );
    }

    var indices_line = [b,a,b,a,d,a,d,c,d,c,b,c];
    for (var j = 0; j < indices_line.length; ++j) {
        lines.push( vertices[indices_line[j]] );
    }
}

function handleKeyDown(e) {
  e = e || window.event;
  var keycode = e.keyCode;
  switch (keycode) {
    case 67:  // c
      colorOffset = (colorOffset + 1) % 8;
      break;
    case 38:  // up
      cameraHeight -= 0.25;
      break;
    case 40:  // down
      cameraHeight += 0.25;
      break;
    case 37:  // left
      cameraDir += 0.25;
      break;
    case 39:  // right
      cameraDir -= 0.25;
      break;
    case 73:  // i
      forwardbackward += 0.25;
      break;
    case 74:  // j
      leftright += 0.25;
      break;
    case 75:  // k
      leftright -= 0.25;
      break;
    case 77:  // m
      forwardbackward -= 0.25;
      break;
    case 82:  // r
      cameraHeight = 0;
      cameraDir = 0;
      forwardbackward = 0;
      leftright = 0;
      fov = 0;
      i = 0;
      break;
    case 78:  // n
      --fov;
      break;
    case 87:  // w
      ++fov;
      break;
    case 187: // +
      break;
  }
}

var i = 0;  // # A global variable that we added

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    i += .2;

    // Set up projection matrix
    var fovy = 30;
    var aspect = gl.canvas.width / gl.canvas.height;
    var near = 1;
    var far = 200;
    var projectionMatrix;

    var vColor;
    var modelview;
    var stack = [];

    modelview = mult( scale(2,2,2), mat4());
    modelview = mult( rotate( 10*i, 0,1,0 ),modelview);
    stack.push(modelview);

    for ( var n = 0; n < NumCubes; ++n ){
      // ModelView Matrix
      modelview = stack.pop();
      stack.push(modelview);
      modelview = mult(translate(cubePositions[n][0]+cameraDir, cubePositions[n][1]+cameraHeight, cubePositions[n][2]+forwardbackward), modelview);
      modelview = mult(translate(0,0,-60), modelview);
      modelview = mult( rotate(leftright, 0,1,0), modelview );
      gl.uniformMatrix4fv( modelview_loc, false, flatten( modelview ) );

      // Projection Matrix
      projectionMatrix = perspective(fovy+fov, aspect, near, far)
      gl.uniformMatrix4fv( pmatrix_loc, false, flatten(projectionMatrix));

      // Assign colors and draw a cube
      gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
      vColor = vertexColors[(n+colorOffset)%8];
      gl.uniform4fv( color_transform_loc, vColor);
      gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
      gl.drawArrays( gl.TRIANGLES, 0, NumVertices );            // # Draw cube

      // Draw white outline for the cube
      gl.bindBuffer( gl.ARRAY_BUFFER, lBuffer );
      vColor = [1,1,1,1];
      gl.uniform4fv( color_transform_loc, vColor);
      gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
      gl.drawArrays( gl.LINES, 0, NumLines );
    }

    requestAnimFrame( render );
}
