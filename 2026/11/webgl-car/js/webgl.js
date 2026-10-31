// 光点的位置
var light_X = 2.0, light_Y = 7.0, light_Z = 10.0;
var g_objDoc = null;
var currentAngle = [0, 0, 1];
var g_MvpMatrix = new Matrix4();
var car_Paint = 2.0;
function main() {
    var canvas = document.getElementById('webgl');
    // 获取绘图上下文
    var gl = canvas.getContext('webgl2', {
        antialias: true,// 开启抗锯齿
        depth: true,
        powerPreference: 'high-performance',// 优先选择高性能GPU
        alpha: false
    })

    var carProgram = createProgram(gl, VSHADER_SOURCE, FSHADER_SOURCE);

    carProgram.a_Position = gl.getAttribLocation(carProgram, 'a_Position');
    carProgram.a_Color = gl.getAttribLocation(carProgram, 'a_Color');
    carProgram.a_Normal = gl.getAttribLocation(carProgram, 'a_Normal');

    carProgram.u_MvpMatrix = gl.getUniformLocation(carProgram, 'u_MvpMatrix');
    carProgram.u_ModelMatrix = gl.getUniformLocation(carProgram, 'u_ModelMatrix');
    carProgram.u_NormalMatrix = gl.getUniformLocation(carProgram, 'u_NormalMatrix');

    carProgram.u_LightColor = gl.getUniformLocation(carProgram, 'u_LightColor');
    carProgram.u_LightPosition = gl.getUniformLocation(carProgram, 'u_LightPosition');
    carProgram.uEnvMap = gl.getUniformLocation(carProgram, 'uEnvMap');
    carProgram.u_carPaint = gl.getUniformLocation(carProgram, 'u_carPaint');

    // 输入数据初始化缓冲区数据
    var carModel = initVertexBuffer(gl, carProgram);

    // 汽车装饰条着色器程序
    var zhuangshitiaoProgram = createProgram(gl, ZHUANGSHITIAO_VSHADER_SOURCE, ZHUANGSHITIAO_FSHADER_SOURCE);
    zhuangshitiaoProgram.a_Position = gl.getAttribLocation(zhuangshitiaoProgram, 'a_Position');
    zhuangshitiaoProgram.a_Color = gl.getAttribLocation(zhuangshitiaoProgram, 'a_Color');
    zhuangshitiaoProgram.a_Normal = gl.getAttribLocation(zhuangshitiaoProgram, 'a_Normal');

    zhuangshitiaoProgram.u_MvpMatrix = gl.getUniformLocation(zhuangshitiaoProgram, 'u_MvpMatrix');
    zhuangshitiaoProgram.u_ModelMatrix = gl.getUniformLocation(zhuangshitiaoProgram, 'u_ModelMatrix');
    zhuangshitiaoProgram.u_NormalMatrix = gl.getUniformLocation(zhuangshitiaoProgram, 'u_NormalMatrix');

    zhuangshitiaoProgram.u_LightColor = gl.getUniformLocation(zhuangshitiaoProgram, 'u_LightColor');
    zhuangshitiaoProgram.u_LightPosition = gl.getUniformLocation(zhuangshitiaoProgram, 'u_LightPosition');
    zhuangshitiaoProgram.u_Style = gl.getUniformLocation(zhuangshitiaoProgram, 'u_Style');
    zhuangshitiaoProgram.uEnvMap = gl.getUniformLocation(zhuangshitiaoProgram, 'uEnvMap');
    // 初始化空的缓冲区对象
    var zhuangshitiaoModel = initVertexBuffer(gl, zhuangshitiaoProgram);

    // 车灯着色器程序
    var lampProgram = createProgram(gl, LAMP_VSHADER_SOURCE, LAMP_FSHADER_SOURCE);
    lampProgram.a_Position = gl.getAttribLocation(lampProgram, 'a_Position');
    lampProgram.a_Color = gl.getAttribLocation(lampProgram, 'a_Color');
    lampProgram.a_Normal = gl.getAttribLocation(lampProgram, 'a_Normal');
    lampProgram.a_TexCoord = gl.getAttribLocation(lampProgram, 'a_TexCoord');

    lampProgram.u_MvpMatrix = gl.getUniformLocation(lampProgram, 'u_MvpMatrix');
    lampProgram.u_ModelMatrix = gl.getUniformLocation(lampProgram, 'u_ModelMatrix');
    lampProgram.u_NormalMatrix = gl.getUniformLocation(lampProgram, 'u_NormalMatrix');

    lampProgram.u_LightColor = gl.getUniformLocation(lampProgram, 'u_LightColor');
    lampProgram.u_LightPosition = gl.getUniformLocation(lampProgram, 'u_LightPosition');
    lampProgram.lampTex = gl.getUniformLocation(lampProgram, 'lampTex');
    // 初始化空的缓冲区对象
    var lampModel = initVertexBuffer(gl, lampProgram, true);


    // 设置清空缓冲区颜色
    gl.clearColor(0.3, 0.3, 0.3, 1.0);
    // 开启深度检测
    gl.enable(gl.DEPTH_TEST);
    // 模型矩阵(使用第三方库)
    var modelMatrix = new Matrix4();
    // 投影矩阵(使用第三方库)
    var mvpMatrix = new Matrix4();
    // 法线矩阵(使用第三方库)
    var normalMatrix = new Matrix4();

    // 设置屏幕自适应
    function resize() {
        var displayWidth = window.innerWidth;
        var displayHeight = window.innerHeight;
        canvas.width = displayWidth;
        canvas.height = displayHeight;

        // 设置视觉区域（绘制窗口设置）
        gl.viewport(0, 0, displayWidth, displayHeight);
        mvpMatrix.setPerspective(24, canvas.width / canvas.height, 1, 100);
        mvpMatrix.lookAt(0, 3, 12, 0, 0, 0, 0, 1, 0);
    }
    resize();
    window.addEventListener('resize', resize)
    initEventHandlers(canvas);
    // 加载全景贴图
    var envTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, envTexture);
    // 先用1*1站位，避免图片未加载时问题不完整；
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([30, 60, 120, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    // 开始加载图片
    const envImage = new Image();
    envImage.crossOrigin = 'anonymous';
    envImage.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, envTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, envImage);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }
    envImage.src = './resource/2.jpeg';

    // 加载车灯贴图
    var lampTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, lampTexture);
    // 先用1*1站位，避免图片未加载时问题不完整；
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 60, 120, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    setTimeout(() => {
        const lampImage = new Image();
        lampImage.crossOrigin = 'anonymous';
        lampImage.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, lampTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, lampImage);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        }
        lampImage.src = './resource/4.jpg';
    }, 200)

    readOBJFile('./resource/car.obj', gl, 2).then(res => {
        g_objDoc = res;
        // console.log('g_objDoc',g_objDoc)
        // var g_drawingInfo = onReadComplete(gl,zhuangshitiaoModel,g_objDoc,['20前脸进气格栅外框'],zhuangshitiaoProgram);
        // console.log('g_drawingInfo',g_drawingInfo)
        // return
        var tick = function () {
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.depthMask(true);
            // 汽车主体部分
            gl.useProgram(carProgram);
            gl.uniform1i(carProgram.uEnvMap, 1);// 纹理单元 int
            gl.uniform1f(carProgram.u_carPaint,car_Paint);
            draw(gl, carModel, modelMatrix, mvpMatrix, normalMatrix, carProgram, ['01引擎盖', '02前翼子板', '03前保险杠', '04后翼子板', '05后保险杠', '06尾箱', '09车门前', '10车门后', '07尾箱上玻璃边框']);
            draw(gl, carModel, modelMatrix, mvpMatrix, normalMatrix, carProgram, ['11前门把手', '12后门把手']);
            draw(gl, carModel, modelMatrix, mvpMatrix, normalMatrix, carProgram, ['13车顶中', '14车顶前']);
            draw(gl, carModel, modelMatrix, mvpMatrix, normalMatrix, carProgram, ['33反光镜外壳']);

            // 车灯
            gl.useProgram(lampProgram);
            gl.uniform1i(lampProgram.lampTex, 2)// 纹理单元
            draw(gl, lampModel, modelMatrix, mvpMatrix, normalMatrix, lampProgram, ['17前车灯', '18后车灯中', '19后车灯外'], true);
            // 装饰条(切换着色器程序)

            gl.useProgram(zhuangshitiaoProgram);
            gl.uniform1i(zhuangshitiaoProgram.uEnvMap, 1)// 纹理单元 int
            gl.uniform1f(zhuangshitiaoProgram.u_Style, 1.0);// float
            draw(gl, zhuangshitiaoModel, modelMatrix, mvpMatrix, normalMatrix, zhuangshitiaoProgram, ['15窗户装饰条', '16窗户装饰条立住', '31前轮遮挡', '32后轮遮挡内', '32后轮遮挡内']);
            draw(gl, zhuangshitiaoModel, modelMatrix, mvpMatrix, normalMatrix, zhuangshitiaoProgram, ['29轮胎前']);
            draw(gl, zhuangshitiaoModel, modelMatrix, mvpMatrix, normalMatrix, zhuangshitiaoProgram, ['30轮胎后']);
            gl.uniform1f(zhuangshitiaoProgram.u_Style, 2.0);// float
            draw(gl, zhuangshitiaoModel, modelMatrix, mvpMatrix, normalMatrix, zhuangshitiaoProgram, ['20前脸进气格栅外框', '21前脸进气格栅前', '24前脸栅格进气侧边', '23前脸进气栅格后']);
            gl.uniform1f(zhuangshitiaoProgram.u_Style, 3.0);// float
            draw(gl, zhuangshitiaoModel, modelMatrix, mvpMatrix, normalMatrix, zhuangshitiaoProgram, ['22前底座']);
            gl.uniform1f(zhuangshitiaoProgram.u_Style, 4.0);// float
            draw(gl, zhuangshitiaoModel, modelMatrix, mvpMatrix, normalMatrix, zhuangshitiaoProgram, ['25后底座']);
            gl.uniform1f(zhuangshitiaoProgram.u_Style, 5.0);// float
            draw(gl, zhuangshitiaoModel, modelMatrix, mvpMatrix, normalMatrix, zhuangshitiaoProgram, ['26排气', '27轮毂前', '28轮毂后']);
            gl.uniform1f(zhuangshitiaoProgram.u_Style, 6.0);// float
            draw(gl, zhuangshitiaoModel, modelMatrix, mvpMatrix, normalMatrix, zhuangshitiaoProgram, ['34反光镜镜片']);
            // 关闭深度写入，但保持深度测试开启，这样不透明物体会遮挡透明物体，透明物体不会遮挡不透明物体，透明物体内部之间互相混合
            gl.depthMask(false);
            // 开启混合
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.uniform1f(zhuangshitiaoProgram.u_Style, 7.0);// float
            draw(gl, zhuangshitiaoModel, modelMatrix, mvpMatrix, normalMatrix, zhuangshitiaoProgram, ['35汽车玻璃侧面前', '36汽车玻璃侧面中', '37汽车玻璃侧面后', '39汽车玻璃上', '08尾箱上玻璃']);
            gl.uniform1f(zhuangshitiaoProgram.u_Style, 8.0);// float
            draw(gl, zhuangshitiaoModel, modelMatrix, mvpMatrix, normalMatrix, zhuangshitiaoProgram, ['38汽车玻璃前']);
            requestAnimationFrame(tick, canvas);
        }
        tick();
    })

}

function createProgram(gl, vshader, fshader) {
    var vertexShader = loadShader(gl, gl.VERTEX_SHADER, vshader);
    var fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fshader);
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    return program;
}

function loadShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}

function initVertexBuffer(gl, program, useTex = false) {
    // 添加缓冲区对象
    var o = new Object();

    o.vertexBuffer = createEmptyAttayBuffer(gl, program.a_Position, 3, gl.FLOAT);
    o.colorBuffer = createEmptyAttayBuffer(gl, program.a_Color, 4, gl.FLOAT);
    o.normalBuffer = createEmptyAttayBuffer(gl, program.a_Normal, 3, gl.FLOAT);
    if (useTex) {
        o.texCoordBuffer = createEmptyAttayBuffer(gl, program.a_TexCoord, 2, gl.FLOAT);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    o.indexBuffer = gl.createBuffer();
    return o;

}
function createEmptyAttayBuffer(gl, a_attribute, num, type) {
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    gl.enableVertexAttribArray(a_attribute);
    return buffer
}
function draw(gl, model, modelMatrix, mvpMatrix, normalMatrix, program, select = [], useTex = false) {
    // 设置点光源颜色
    gl.uniform3f(program.u_LightColor, 0.7, 0.7, 0.7);
    // 设置点光源位置
    gl.uniform3f(program.u_LightPosition, light_X, light_Y, light_Z);

    var g_drawingInfo = onReadComplete(gl, model, g_objDoc, select, program, useTex);

    // mvpMatrix.multiply(modelMatrix);
    g_MvpMatrix.set(mvpMatrix);
    modelMatrix.setRotate(currentAngle[0], 1, 0, 0);
    modelMatrix.rotate(currentAngle[1], 0, 1, 0);
    modelMatrix.scale(currentAngle[2], currentAngle[2], currentAngle[2]);
    g_MvpMatrix.multiply(modelMatrix);
    // 逆转置矩阵
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(program.u_MvpMatrix, false, g_MvpMatrix.elements);
    gl.uniformMatrix4fv(program.u_ModelMatrix, false, modelMatrix.elements);
    gl.uniformMatrix4fv(program.u_NormalMatrix, false, normalMatrix.elements);
    gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0)
}
// 设置鼠标控制视角
function initEventHandlers(canvas) {
    var dragging = false;
    var lastX = -1, lastY = -1;
    canvas.onmousedown = function (ev) {
        var x = ev.clientX, y = ev.clientY;
        var rect = ev.target.getBoundingClientRect();// 问题二
        if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
            lastX = x;
            lastY = y;
            dragging = true;
        }
    };
    canvas.onmouseup = function (ev) { dragging = false };
    canvas.onmousemove = function (ev) {
        if (dragging) {
            var x = ev.clientX, y = ev.clientY;// 问题一
            var factor = 100 / canvas.height;
            var dx = factor * (x - lastX);
            var dy = factor * (y - lastY);
            currentAngle[0] = Math.max(Math.min(currentAngle[0] + dy, 90.0), -10.0);
            currentAngle[1] = currentAngle[1] + dx;
        }
        lastX = x;
        lastY = y;
    }
    canvas.addEventListener('wheel', function (ev) {
        ev.preventDefault();
        var factor = 0.05;
        if (ev.deltaY > 0) {
            // 向下滚动-缩小
            currentAngle[2] = Math.max(currentAngle[2] - factor, 0.6);
        } else if (ev.deltaY < 0) {
            // 向上滚动-放大
            currentAngle[2] = Math.min(currentAngle[2] + factor, 2.0);
        }
    })
}

function changeCarPaint(val){
    car_Paint = val;
}
