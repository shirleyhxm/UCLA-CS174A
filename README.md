# Assignment 1 - Cubes

*CS174A Winter 2017 - Shirley Xuemin He*

### Canvas and Shaders

 * canvas size: 960 x 540

 * uniform variables
   * color -- may vary due to user inputs
   * modelview matrix  -- may vary due to user inputs
   * projection matrix -- fixed
 * attributes 
   * position
```html
void main() // vertex shader
{
    fColor = vColor;
    gl_Position = PMatrix * ModelView * vPosition;
    gl_Position.z = -gl_Position.z;
}
```

### Cubes

**Position** for each cube is determined by the following array, each vector represents the relative position for a corresponding cube.
```javascript
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
```

Similarly, each cube is assigned a different **color** from the following color array:
```javascript
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
```

The eight cubes are rendered one at a time during each unit time cycle. The **transformation** for each cude is performed in such an order:
1. scale
2. rotate
3. translate

To draw the **outlines** of the cubes, I created another buffer *lBuffer* which stores the color vector and the vertex array for drawing lines.

### User Inputs

Functions for all keys except for '+' are implemented. The corresponding effects are done by modifying the modelview matrix.

### Extra Credits

###### 1. Instance each of the eight cubes from the same geometry data.
All cubes are scaled up and moved further from the camera using the same transform matrix. This matrix is pushed onto a stack before the rendering, then it is poped from the stack for each cude during its rendering iteration.

```javascript
modelview = mult( scale(2,2,2), mat4() );
modelview = mult( rotate( 10*i, 0,1,0 ), modelview );
stack.push(modelview);

for ( var n = 0; n < NumCubes; ++n ){
    modelview = stack.pop();
    stack.push(modelview);
    modelview = mult( ... , modelview);
    ...
    gl.uniformMatrix4fv( modelview_loc, false, flatten( modelview ) );
}
```

###### 2.Continuously and individually rotate and scale each of the cubes.
Each cube is horizontally rotating around its own center. The rotation speed is about 20 rpm.
```javascript
var i = 0;
function render()
{	...
	i += 0.2;
    modelview = mult( rotate( 10*i, 0,1,0 ),modelview);
    ...
}
```
