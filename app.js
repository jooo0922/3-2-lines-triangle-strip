"use strict";

let canvas,
  gl,
  shaderProgram,
  hexagonVertexBuffer, // hexagon 모양의 gl.LINE_STRIP을 그릴 때 사용할 버텍스 좌표 데이터 WebGLBuffer를 담을 변수
  triangleVertexBuffer, // gl.TRIANGLES(독립 삼각형)을 그릴 때 사용할 버텍스 좌표 데이터 WebGLBuffer를 담을 변수
  triangleVertexColorBuffer, // gl.TRIANGLES(독립 삼각형)을 그릴 때 사용할 버텍스 색상 데이터 WebGLBuffer를 담을 변수 -> 3-1 예제와는 달리 각각의 배열로 구분해서 저장하는 structure of arrays 방식!
  stripVertexBuffer, // gl.TRIANGLE_STRIP(삼각형 스트립) 및 gl.LINE_STRIP(구분선)을 그릴 때 사용할 버텍스 좌표 데이터 WebGLBuffer를 담을 변수
  stripElementBuffer; // gl.TRIANGLE_STRIP(삼각형 스트립) 및 gl.LINE_STRIP(구분선)을 그릴 때 gl.drawElements() 메서드가 사용할 인덱스가 담긴 엘레먼트 배열 버퍼와 바인딩된 WebGLBuffer를 담을 변수

function createGLContext(canvas) {
  const names = ["webgl", "experimental-webgl"];
  let context = null;

  for (let i = 0; i < names.length; i++) {
    try {
      context = canvas.getContext(names[i]);
    } catch (error) {}

    if (context) {
      break;
    }
  }

  if (context) {
  } else {
    alert("Failed to create WebGL context!");
  }

  return context;
}

function loadShaderFromDOM(id) {
  const shaderScript = document.getElementById(id);

  if (!shaderScript) {
    return null;
  }

  let shaderSource = "";
  let currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType === 3) {
      shaderSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }

  let shader;
  if (shaderScript.type === "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else if (shaderScript.type === "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else {
    return null;
  }

  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert("Error compiling shader" + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function setupShaders() {
  const vertexShader = loadShaderFromDOM("shader-vs");
  const fragmentShader = loadShaderFromDOM("shader-fs");

  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shaderProgram);

  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(
    shaderProgram,
    "aVertexPosition"
  );

  shaderProgram.vertexColorAttribute = gl.getAttribLocation(
    shaderProgram,
    "aVertexColor"
  );

  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
}

// 이전 예제와는 달리 여러 개의 프리미티브, structure of arrays 방식 사용, gl.drawElements() 사용 등의 이유로 여러 개의 WebGLBuffer를 만들어줘야 함.
function setupBuffers() {
  // hexagon 모양의 gl.LINE_STRIP을 그릴 때 사용할 버텍스 좌표 데이터 WebGLBuffer 생성
  hexagonVertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, hexagonVertexBuffer);
  const hexagonVertices = [
    -0.3,
    0.6,
    0.0, //v0
    -0.4,
    0.8,
    0.0, //v1
    -0.6,
    0.8,
    0.0, //v2
    -0.7,
    0.6,
    0.0, //v3
    -0.6,
    0.4,
    0.0, //v4
    -0.4,
    0.4,
    0.0, //v5
    -0.3,
    0.6,
    0.0, //v6
  ];
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(hexagonVertices),
    gl.STATIC_DRAW
  ); // 바인딩된 WebGLBuffer에 버텍스 데이터를 기록함.
  hexagonVertexBuffer.itemSize = 3; // 버텍스 하나 당 사용되는 원소 개수(x, y, z니까 항상 3을 넣어줘야 함, gl.vertexAttribPointer()에 사용)
  hexagonVertexBuffer.numberOfItems = 7; // 총 버텍스 개수(gl.drawArrays()에 사용)

  // gl.TRIANGLES(독립 삼각형)을 그릴 때 사용할 버텍스 좌표 데이터 WebGLBuffer 생성
  triangleVertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexBuffer);
  const triangleVertices = [
    0.3,
    0.4,
    0.0, //v0
    0.7,
    0.4,
    0.0, //v1
    0.5,
    0.8,
    0.0, //v2
  ];
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(triangleVertices),
    gl.STATIC_DRAW
  ); // 바인딩된 WebGLBuffer에 버텍스 데이터를 기록함.
  triangleVertexBuffer.itemSize = 3; // 버텍스 하나 당 사용되는 원소 개수(gl.vertexAttribPointer()에 사용)
  triangleVertexBuffer.numberOfItems = 3; // 총 버텍스 개수(gl.drawArrays()에 사용)

  // gl.TRIANGLES(독립 삼각형)을 그릴 때 사용할 버텍스 색상 데이터 WebGLBuffer 따로 생성 -> structure of arrays 방식 사용
  triangleVertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexColorBuffer);
  const colors = [
    1.0,
    0.0,
    0.0,
    1.0, //v0
    0.0,
    1.0,
    0.0,
    1.0, //v1
    0.0,
    0.0,
    1.0,
    1.0, //v2
  ]; // 바로 Float32Array(colors)로 뷰 타입을 생성하기 위해 0 ~ 255 사이의 색상값을 0.0 ~ 1.0 사이의 실수값으로 할당해놓음.
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  triangleVertexColorBuffer.itemSize = 4; // 버텍스 하나 당 사용되는 원소 개수(색상 데이터는 r, g, b, a니까 4개. gl.vertexAttribPointer()에 사용)
  triangleVertexColorBuffer.numberOfItems = 3; // 총 버텍스 개수(gl.drawArrays()에 사용할수도 있지만, 예제에서는 triangleVertexBuffer.numberOfItems으로만 사용했음.)

  // gl.TRIANGLE_STRIP(삼각형 스트립) 및 gl.LINE_STRIP(구분선)을 그릴 때 사용할 버텍스 좌표 데이터 WebGLBuffer 생성
  stripVertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, stripVertexBuffer);
  const stripVertices = [
    // start first strip
    -0.5,
    0.2,
    0.0, //v0
    -0.4,
    0.0,
    0.0, //v1
    -0.3,
    0.2,
    0.0, //v2
    -0.2,
    0.0,
    0.0, //v3
    -0.1,
    0.2,
    0.0, //v4
    0.0,
    0.0,
    0.0, //v5
    0.1,
    0.2,
    0.0, //v6
    0.2,
    0.0,
    0.0, //v7
    0.3,
    0.2,
    0.0, //v8
    0.4,
    0.0,
    0.0, //v9
    0.5,
    0.2,
    0.0, //v10

    // start second strip
    -0.5,
    -0.3,
    0.0, //v11
    -0.4,
    -0.5,
    0.0, //v12
    -0.3,
    -0.3,
    0.0, //v13
    -0.2,
    -0.5,
    0.0, //v14
    -0.1,
    -0.3,
    0.0, //v15
    0.0,
    -0.5,
    0.0, //v16
    0.1,
    -0.3,
    0.0, //v17
    0.2,
    -0.5,
    0.0, //v18
    0.3,
    -0.3,
    0.0, //v19
    0.4,
    -0.5,
    0.0, //v20
    0.5,
    -0.3,
    0.0, //v21
  ]; // 하나의 WebGLBuffer에 2개의 스트립의 버텍스 데이터를 모두 저장했음.
  // -> v10, v11 사이를 끊어줘야 각 스트립이 따로 그려짐 -> 엘레먼트 버퍼 배열에 여분의 인덱스를 추가해서 겹침 삼각형을 만들어서 끊어줘야겠네!
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(stripVertices),
    gl.STATIC_DRAW
  );
  stripVertexBuffer.itemSize = 3; // 버텍스 하나 당 사용되는 원소 개수(gl.vertexAttribPointer()에 사용)
  stripVertexBuffer.numberOfItems = 22; // 총 버텍스 개수(원래라면 gl.drawArrays()에 사용했겠지만, gl.drawElements()로 스트립을 그리므로, 겹침 삼각형에 필요한 여분의 인덱스 개수까지 포함된 stripElementBuffer.numberOfItems를 대신 사용할거임.)

  // gl.TRIANGLE_STRIP(삼각형 스트립) 및 gl.LINE_STRIP(구분선)을 그릴 때 gl.drawElements() 메서드가 사용할 인덱스가 담긴 엘레먼트 배열 버퍼를 바인딩할 WebGLBuffer 생성
  stripElementBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, stripElementBuffer);
  const indices = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    // 여기서부터
    10, 11,
    // 여기까지가 겹침삼각형을 위한 여분의 인덱스 -> 이 겹침삼각형들 덕분에 삼각형 스트립들이 분리되고, 사용된 겹침삼각형들은 GPU가 감지하여 제거.
    11,
    12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
  ];
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices), // 인덱스값은 0 이상의 부호가 없는 정수로 표현되니까 해당 뷰 타입을 생성해줘야 겠지
    gl.STATIC_DRAW
  );
  stripElementBuffer.numberOfItems = 24; // 겹침삼각형에 필요한 여분 인덱스를 1개 줄여서 사용했더니 두번째 삼각형 스트립이 사라졌음.
}

function draw() {
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT); // 일단 캔버스 전체를 gl.clearColor에서 지정된 색깔로 싹 한번 칠해줌.

  // hexagon 그리기
  // hexagon의 모든 버텍스에 동일한 상수 버텍스 데이터로 색상값을 전달하고 싶기 때문에, setupShader()에서 활성화시켰던 shaderProgram.vertexColorAttribute를 다시 비활성화 한 것.
  // 왜냐면 aVertexColor 애트리뷰트 변수에는 상수 버텍스 데이터를 쏴줄거니까! p.174, p.178 참고
  gl.disableVertexAttribArray(shaderProgram.vertexColorAttribute);
  gl.vertexAttrib4f(shaderProgram.vertexColorAttribute, 0.0, 0.0, 0.0, 1.0); // hexagon에 필요한 7개의 모든 버텍스의 색상값을 이 상수 버텍스 데이터로 동일하게 넣어줄거임.
  gl.bindBuffer(gl.ARRAY_BUFFER, hexagonVertexBuffer); // 다시 WebGLBuffer를 바인딩해줌. 이걸 draw 함수에서 꼭 다시 해줘야 하는건가?
  gl.vertexAttribPointer(
    shaderProgram.vertexPositionAttribute,
    hexagonVertexBuffer.itemSize,
    gl.FLOAT,
    false,
    0, // WebGLBuffer에서 끼워넣은 버텍스 데이터를 사용하지 않았다면 5번째 인자는 무조건 0으로 때려주면 됨.
    0
  ); // aVertexPosition 애트리뷰트가 hexagon의 WebGLBuffer에서 버텍스 데이터를 어떻게 가져올 건지 방법을 정해줌. p.167 참고.
  gl.drawArrays(gl.LINE_STRIP, 0, hexagonVertexBuffer.numberOfItems); // hexagon 모양의 연속선을 그려줌. -> 색깔은 각 버텍스에 동일하게 지정된 black 컬러로 나올거임.

  // 독립삼각형 그리기 (structure of arrays 방식으로)
  // 위에서 hexagon을 그릴 때 상수 버텍스 데이터를 쓰려고 shaderProgram.vertexColorAttribute을 비활성화했는데,
  // 독립삼각형에서는 다시 버텍스 배열에서 색상 데이터를 사용할거니까 애트리뷰트 배열을 다시 활성화한 것!
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexPositionAttribute,
    triangleVertexBuffer.itemSize,
    gl.FLOAT,
    false,
    0, // 끼워넣기 버텍스 데이터를 사용하지 않았으니 0을 넣으면 됨.
    0
  ); // aVertexPosition 애트리뷰트가 독립삼각형 좌표 데이터의 WebGLBuffer에서 버텍스 데이터를 가져올 방법 정의
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexColorBuffer); // 내 생각에는 gl.vertexAttribPointer로 애트리뷰트가 WebGLBuffer에서 데이터를 가져올 방법을 지정하기 전에, 어떤 WebGLBuffer에서 가져올건지 바인딩을 매번 해줘야 되나 봄!
  gl.vertexAttribPointer(
    shaderProgram.vertexColorAttribute,
    triangleVertexColorBuffer.itemSize,
    gl.FLOAT,
    false,
    0, // 끼워넣기 버텍스 데이터를 사용하지 않으니 0을 넣어줌.
    0
  ); // 색상 버텍스 데이터가 기록된 WebGLBuffer에서도 가져와야 하니까 버퍼 바인딩을 다시 해주고 나서 attribute가 가져올 방법도 다시 지정해준 것!
  gl.drawArrays(gl.TRIANGLES, 0, triangleVertexBuffer.numberOfItems); // 독립삼각형을 그려줌.

  // 삼각형 스트립 그리기 (gl.drawElements() 메서드 사용)
  // 위에서 hexagon 그리느라 비활성화 했던 걸 독립삼각형 그리느라 다시 활성화했던, shaderProgram.vertexColorAttribute를 다시 비활성화할거임.
  // 왜냐? 삼각형 스트립을 하나의 단색으로 채우기 위해, 각 버텍스에 상수 색상 버텍스 데이터를 쏴줘야 하니까!
  gl.disableVertexAttribArray(shaderProgram.vertexColorAttribute);
  gl.bindBuffer(gl.ARRAY_BUFFER, stripVertexBuffer); // 스트립 WebGLBuffer로부터 데이터를 가져오는 방법을 지정하기 전에 바인딩을 해줌.
  gl.vertexAttribPointer(
    shaderProgram.vertexPositionAttribute,
    stripVertexBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  ); // aVertexPosition 애트리뷰트가 스트립 WebGLBuffer로부터 버텍스 데이터를 가져오는 방법을 지정함.
  gl.vertexAttrib4f(shaderProgram.vertexColorAttribute, 1.0, 1.0, 0.0, 1.0); // 모든 삼각형 스트립 버텍스들에 동일하게 쏴줄 색상 상수 데이터를 지정함. -> 이걸 aVertexColor 애트리뷰트로 쏴주라는 거
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, stripElementBuffer); // 얘는 엘레먼트 버퍼가 바인딩된 WebGLBuffer에서 뭘 가져오는 방법을 지정하려고 바인딩한 게 아니라, gl.drawElements()를 사용하려면 엘레먼트 배열 버퍼도 바인딩을 해줘야 함. p.158 예제 코드 참고
  gl.drawElements(
    gl.TRIANGLE_STRIP,
    stripElementBuffer.numberOfItems,
    gl.UNSIGNED_SHORT, // 이거는 엘레먼트 배열 버퍼에 저장된 요소 인덱스의 타입을 지정하는 거라고 함. p.140 참고
    0
  );

  // 삼각형 스트립 구분선 그리기
  // 위에서 삼각형 스트립 그릴 때 사용한 스트립 WebGLBuffer와, 그것을 가져오는 방법을 그대로 사용하되,
  // 각 버텍스들에 쏴줄 상수 버텍스 데이터만 변경해주는거임. 삼각형 스트립 색상이랑 구분선 색상을 다르게 해주려는 것.
  gl.vertexAttrib4f(shaderProgram.vertexColorAttribute, 0.0, 0.0, 0.0, 1.0); // 따라서 aVertexColor 애트리뷰트에 쏴줄 상수 색상 데이터만 다시 지정해주면 됨.
  gl.drawArrays(gl.LINE_STRIP, 0, 11); // 첫번째 스트립 구분선을 그림 -> 첫번째 버텍스(0)부터 11개의 버텍스까지(10) 사용해서 그리겠다는 뜻.
  gl.drawArrays(gl.LINE_STRIP, 11, 11); // 두번째 스트립 구분선을 그림 -> 12번째 버텍스(11)부터 11개의 버텍스까지(21)를 사용해서 그리겠다는 뜻.
}

function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = WebGLDebugUtils.makeDebugContext(createGLContext(canvas));
  setupShaders();
  setupBuffers();
  gl.clearColor(1.0, 1.0, 1.0, 1.0); // 캔버스의 모든 픽셀을 gl.clear()로 채울 때의 색상을 white로 지정함.

  // 아래 3개의 메서드는 back-face를 추려내기 위해 호출함. P.135, P.180 참고
  gl.frontFace(gl.CCW); // 반시계 방향으로 그려지는 삼각형만 관찰자를 향하도록 지정함.
  gl.enable(gl.CULL_FACE); // 면 추려내기 기능 활성화.
  gl.cullFace(gl.BACK); // 후면(시계 방향으로 그려지는 삼각형)을 추려냄. -> 근데 이 예제에서는 모두 반시계 방향으로 그려지므로 추려낼 삼각형이 없음!
  draw();
}

/**
 * 삼각형 스트립을 그릴 때 gl.drawElements() 메서드를 사용하는 이유
 *
 * p.138, p.158 에서도 보면 알겠지만, gl.TRIANGLE_STRIP, gl.TRIANGLE_FAN 처럼
 * 버텍스를 공유하여 그리는 프리미티브의 경우,
 *
 * gl.drawArrays() 보다는 gl.drawElements()를 사용하여 그리는 게
 * 총 메모리 사용량도 적고 성능면에서 더 뛰어나기 때문!
 */

/**
 * gl.getAttribLocation(shaderProgram, 애트리뷰트 변수 이름)
 *
 * 이 메서드는 주어진 WebGLProgram 안에서 attribute 변수의 위치를 GLint 정수값으로 리턴해 줌.
 *
 * 이 GLint 값은 WebGLProgram 내에서 해당 attribute 변수 이름의 위치가 발견될 경우,
 * GLint 값(0 이상의 정수값)을 리턴하고, 발견하지 못했다면 -1을 리턴해 줌.
 * -> 이 GLint 값이 책에서 말하는 '제네릭 애트리뷰트 인덱스' 값인 것 같음.
 * 
 * 책에서는 WebGL에는 ShaderProgram에서 사용하는 애트리뷰트 변수들을 구분할 수 있는, 고정된 수량의 애트리뷰트 슬롯이 있다고 설명하고 있음.
 * 아마 제네릭 애트리뷰트 인덱스는 이 슬롯 상에서 해당 애트리뷰트 변수가 몇 번째 인덱스인지, 그 바인딩(할당)된 값을 의미하는 게 아닐까 싶음.
 *
 * 책에서는 제네릭 애트리뷰트 인덱스값을 얻는 방법을 2가지가 있다고 설명하는데,
 * 1. gl.bindAttribLocation() 이라는 메서드를 이용해 링크 작업을 수행하기 전에 어떤 인덱스에 해당 애트리뷰트 위치를 바인딩(할당)할 지 직접 정해주는거고,
 * 2. 링크 작업을 수행하고 나면 해당 애트리뷰트 위치가 특정 제네릭 애트리뷰트 인덱스에 자동으로 지정되기 때문에,
 * 링크가 끝나고 자동으로 지정된 제네릭 애트리뷰트 인덱스를 gl.getAttribLocation() 으로 가져오는 방법이 있다고 설명해 줌.
 *
 * 여기서는 당연히 2번의 방법을 사용하고 있을 것이고, 그렇게 가져온 제네릭 애트리뷰트 인덱스값을
 * ShaderProgram 객체의 임의의 프로퍼티에 저장해 놓는 과정이 아래 코드에 해당하겠지!
 *  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(
      shaderProgram,
      "aVertexPosition"
    );
 */

/**
 * gl.enableVertexAttribArray()
 *
 * 얘는 뭐냐면, 위에서 설명한 제네릭 애트리뷰트 인덱스가 가리키는, 해당 애트리뷰트가 바인딩된
 * 웹지엘 애트리뷰트 슬롯안의 버텍스 배열을 활성화하는 메서드인 것 같음.
 *
 * 그 제네릭 애트리뷰트 인덱스가 가리키는 슬롯 안에서 버텍스 배열이 활성화되면,
 * "이제부터 거기로 WebGLBuffer에 저장된 버텍스 데이터들을 쏴줄 수 있다. 공급해줄 수 있다" 라고 선언하는 것 같음.
 *
 * 그러면 이제 gl.vertexAttribPointer() 같은 메서드가 해당 제네릭 애트리뷰트 인덱스를 통해 슬롯의 버텍스 배열에 접근이 가능해 짐.
 * 여기로 접근하는 과정을 거쳐서 버텍스 데이터들을 애트리뷰트에 쏴주는 것이지.
 *
 * 이거는 WebGLBuffer에 바인딩된 버텍스 배열로부터 데이터를 받을 때 사용하는거고,
 * 만약에 모든 버텍스에 대해 동일한 상수 버텍스 데이터(주로 색상값)을 쏴주고 싶다면,
 * gl.disableVertexAttribArray() 메서드를 호출해주면 됨.
 *
 * 이렇게 하면, 제네릭 애트리뷰트 인덱스가 가리키는 슬롯에 버텍스 배열을 원래 상태(disabled), 즉 비활성화 해버림.
 * 그 결과 버텍스 배열을 거치지 않고 버텍스 데이터를 쏴주는데, 이때 어떤 상수 버텍스 데이터를 쏴줄 지 결정하는 게 gl.vertexAttrib4f()임.
 * 이거로 상수 버텍스 데이터를 지정해주면, 이거를 버텍스 셰이더의 애트리뷰트 입력값으로 사용하는 것임.
 *
 * 정확한 설명은 아니기 때문에, 일단 좀 더 공부하고 알아보면서 정확하게 정리해야 할 것 같음...
 */

/**
 * hexagonVertices 배열에서 마지막에 v0과 동일한 7번째 버텍스 v6가 추가된 이유
 *
 * draw() 함수에서 hexagon을 gl.LINE_STRIP(즉, 끝이 열린 연결선)으로 그려주므로,
 * 처음 버텍스와 마자막 버텍스를 '연결한 것(gl.LINE_LOOP)처럼 보이게' 하기 위해,
 * 마지막에 똑같은 위치의 버텍스를 하나 더 써준 것!
 *
 * 이렇게 하면 실제로 순환선(gl.LINE_LOOP)를 그리는 것은 아니지만,
 * 마치 '순환선처럼 보이는' 효과를 노린 것!
 */

/**
 * indices에서 추가된 여분의 인덱스가 3개인 이유
 *
 * 첫 번째 스트립의 삼각형이 홀수 개면
 * 겹침 삼각형을 만들기 위한 여분의 인덱스가 3개 필요함! P.142 참고
 */

/**
 * gl.bindBuffer()는 왜 이렇게 자주 쓰이는걸까?
 *
 * 바인딩에 사용되는 메서드는 지금까지 작성한 예제로 미루어 보아 두 가지 경우에 필요한 것 같음.
 *
 * 1. setBuffers() 함수에서 gl.bufferData() 메서드를 이용하여
 * 뷰 타입(타입 배열)생성 시 만들어진 ArrayBuffer에 바이너리 형식으로 저장된 특정 버텍스 데이터를
 * 특정 WebGLBuffer에도 동일하게 기록하고자 할 때
 *
 * 2. draw() 함수에서 gl.vertexAttribPointer() 메서드를 이용하여
 * 특정 WebGLBuffer에 기록된 버텍스 데이터를 버텍스 셰이더의 attribute로 가져오는 방법을 지정하기 전에
 * 어떤 WebGLBuffer에서 가져올건지 명시하고자 할 때
 */
