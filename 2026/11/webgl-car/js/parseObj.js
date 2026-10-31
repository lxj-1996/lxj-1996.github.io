//获取一个单词的长度
function getWordLength(str,start){
    var n = 0;
    for(var i = start,len = str.length;i<len;i++){
        var c = str.charAt(i);
        if(c == '\t' || c == ' ' || c == '(' || c == ')' || c == '"'){
            break;
        }
    }
    return i -start;
}

// 单个材质对象
 var Matrial = function (name,r,g,b,a){
    this.name = name;
    this.color = new Color(r,g,b,a);
 }

 // 顶点对象
var Vertex = function (x,y,z){
    this.x = x;// 问题八处
    this.y = y;
    this.z = z;
}

// 法线对象
var Normal = function (x,y,z){
    this.x = x;
    this.y = y;
    this.z = z;
}
// 颜色对象
var Color = function (r,g,b,a){
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
}
// uv对象
var UVs = function (s,t){
    this.s = s;
    this.t = t;
}

// 单行解析字符串对象
var StringParser = function (str){
    this.str;// 存储字符
    this.index;// 存储解析到的下标
    this.init(str);// 初始化
}
// 初始化
StringParser.prototype.init = function (str){
    this.str = str;
    this.index = 0;
}

// 跳过分隔符
StringParser.prototype.skipDelimiters = function (){
    for(var i = this.index,len = this.str.length;i<len;i++){
        var c = this.str.charAt(i);
        if(c == '\t' || c == ' ' || c == '(' || c == ')' || c == '"'){
            continue;
        }
        break;
    }
    this.index = i;
}
// 获取单词
StringParser.prototype.getWord = function (){
    this.skipDelimiters();
    var n = getWordLength(this.str,this.index);
    if(n == 0) return null;
    var word = this.str.substr(this.index,n);
    this.index += (n+1);
    return word;// 问题一处
}
// 获取单词并转为整数
StringParser.prototype.getInt = function (){
    return parseInt(this.getWord());
}
// 获取单词并转为浮点数
StringParser.prototype.getFloat = function (){
    return parseFloat(this.getWord());
}
// 模型部件对象
var OBJObject = function (name){
    this.name = name;
    this.faces = new Array(0);
    this.numIndices = 0;
}
OBJObject.prototype.addFace = function (face){
    this.faces.push(face);
    this.numIndices += face.numIndices;
}
// 面对象
var Face = function (materialName){
    this.materialName = materialName;
    if(materialName == null) this.materialName = "";
    this.vIndices = new Array(0);
    this.nIndices = new Array(0);
    this.tIndices = new Array(0);
}
// 绘图信息对象
var DrawingInfo = function (vertices,normals,colors,indices,texCoords){
    this.vertices = vertices;
    this.normals = normals;
    this.colors = colors;
    this.texCoords = texCoords;
    this.indices = indices;
}

// OBJDoc对象
var OBJDoc = function (fileName){
    this.fileName = fileName;
    this.mtls = new Array(0);// 材质
    this.objects = new Array(0);// 模型
    this.vertices = new Array(0);// 坐标
    this.normals = new Array(0);// 法线
    this.uvs = new Array(0);// uv坐标
}
// 解析OBJ
OBJDoc.prototype.parse = function (fileString,scale){
    var lines = fileString.split('\n');
    lines.push(null);
    var index = 0;
    var currentObject = null;
    var currentMaterialName = "";

    var line;
    var sp = new StringParser();
    while((line = lines[index++])!=null){
        sp.init(line);
        var command = sp.getWord();// 获取第一位标识
        if(command == null) continue;
        switch(command){
            case '#':
                continue;
            case 'mtllib':// 问题四
                var path = this.parseMtllib(sp,this.fileName);
                var mtl = new MTLDoc();
                this.mtls.push(mtl);
                var request = new XMLHttpRequest();
                request.onreadystatechange = function (){
                    if(request.readyState == 4){
                        if(request.status != 404){
                            onReadMTLFile(request.responseText,mtl);
                        }else{
                            mtl.complete = true;
                        }
                    }
                }
                request.open('GET',path);
                request.send();
                continue;
            case 'o':
            case 'g':
                var object = this.parseObjectName(sp);
                this.objects.push(object);
                currentObject = object;
                continue;
            case 'v':
                var vertex = this.parseVertex(sp,scale);
                this.vertices.push(vertex);
                continue;
            case 'vn':
                var normal = this.parseNormal(sp);
                this.normals.push(normal);
                continue;
            case 'vt':
                var texCoord = this.parseTexCoord(sp);
                this.uvs.push(texCoord);
                continue;
            case 'usemtl':
                currentMaterialName = this.parseUsemtl(sp);
                continue;
            case 'f':
                var face = this.parseFace(sp,currentMaterialName,this.vertices);
                currentObject.addFace(face);
                continue;
        }
    }
    return true;
}

// 获取加载的材质文件名称
OBJDoc.prototype.parseMtllib = function (sp,fileName){
    var i = fileName.lastIndexOf("/");
    var dirPath = "";
    if(i>0) dirPath = fileName.substr(0,i+1);
    return dirPath + sp.getWord();// 获取路径
}
// 获取模型部件名称
OBJDoc.prototype.parseObjectName = function (sp){
    var name = sp.getWord();
    return (new OBJObject(name));
}
// 解析坐标
OBJDoc.prototype.parseVertex = function (sp,scale){

    var x = sp.getFloat() * scale;
    var y = sp.getFloat() * scale;
    var z = sp.getFloat() * scale;
    return (new Vertex(x,y,z));
}
// 解析法线
OBJDoc.prototype.parseNormal = function (sp){
    var x = sp.getFloat();
    var y = sp.getFloat();
    var z = sp.getFloat();
    return (new Normal(x,y,z));
}
// 解析uv parseTexCoord
OBJDoc.prototype.parseTexCoord = function (sp){
    var s = sp.getFloat();
    var t = sp.getFloat();
    return (new UVs(s,t));
}
// 获取使用的材质名称
OBJDoc.prototype.parseUsemtl = function (sp){
    return sp.getWord();
}
// 解析面
OBJDoc.prototype.parseFace = function (sp,materialName,vertices){
    var face = new Face(materialName);
    for(;;){
        var word = sp.getWord();
        if(word == null) break;
        var subWords = word.split('/');
        if(subWords.length >= 1){
            var vi = parseInt(subWords[0]) - 1;
            face.vIndices.push(vi);
        }
        if(subWords.length>=3){
            var ni = parseInt(subWords[2]) - 1;
            face.nIndices.push(ni);//问题二处
            var ti = parseInt(subWords[1]) - 1;
            face.tIndices.push(ti);
        }else{
            face.nIndices.push(-1);
        }
    }
    if(face.vIndices.length>3){
        var n = face.vIndices.length-2;
        var newVIndices = new Array(n*3);
        var newNIndices = new Array(n*3);
        var newTIndices = new Array(n*3);
        for(var i = 0;i<n;i++){
            newVIndices[i*3+0] = face.vIndices[0];
            newVIndices[i*3+1] = face.vIndices[i+1];
            newVIndices[i*3+2] = face.vIndices[i+2];

            newNIndices[i*3+0] = face.nIndices[0];
            newNIndices[i*3+1] = face.nIndices[i+1];
            newNIndices[i*3+2] = face.nIndices[i+2];

            newTIndices[i*3+0] = face.tIndices[0];
            newTIndices[i*3+1] = face.tIndices[i+1];
            newTIndices[i*3+2] = face.tIndices[i+2];
        }
        face.vIndices = newVIndices;
        face.nIndices = newNIndices;
        face.tIndices = newTIndices
    }
    face.numIndices = face.vIndices.length;
    return face;// 问题三处
}
// 根据材质名称设置颜色值
OBJDoc.prototype.findColor = function (name){
    for(var i = 0;i<this.mtls.length;i++){
        for(var j = 0;j<this.mtls[i].materials.length;j++){
            if(this.mtls[i].materials[j].name == name){
                return (this.mtls[i].materials[j].color)
            }
        }
    }
    return (new Color(0.8,0.8,0.8,1));
}
// 检索绘制3d模型的信息
OBJDoc.prototype.getDrawingInfo = function (objName = [],useTex=false){
    var numIndices = 0;
    for(var i = 0;i<this.objects.length;i++){
        if(objName.length == 0){
            numIndices += this.objects[i].numIndices;
        }else{
            if(objName.includes(this.objects[i].name)){
                numIndices += this.objects[i].numIndices;
            }
        }
    }
    var numVertices = numIndices;
    // 类型化数组存储数据
    var vertices = new Float32Array(numVertices*3);
    var normals = new Float32Array(numVertices*3);
    var colors = new Float32Array(numVertices*4);// 问题九
    var texCoords = new Float32Array(numVertices*2);
    var indices = new Uint16Array(numIndices);
    // 设置坐标，法线，颜色
    var index_indices = 0;
    for(var i = 0;i<this.objects.length;i++){
        if(objName.length != 0){
            if(!objName.includes(this.objects[i].name)){
                continue;
            }
        }
        var object = this.objects[i];
        for(var j = 0;j<object.faces.length;j++){
            var face = object.faces[j];
            var color = this.findColor(face.materialName);
            var faceNormal = face.normals;
            for(var k = 0;k<face.vIndices.length;k++){
                indices[index_indices] = index_indices;
                var vIdx = face.vIndices[k];
                var vertex = this.vertices[vIdx];
                // 坐标
                vertices[index_indices*3+0] = vertex.x;
                vertices[index_indices*3+1] = vertex.y;
                vertices[index_indices*3+2] = vertex.z;

                // 颜色
                colors[index_indices*4+0] = color.r;
                colors[index_indices*4+1] = color.g;
                colors[index_indices*4+2] = color.b;
                colors[index_indices*4+3] = color.a;

                // 法线
                var nIdx = face.nIndices[k];
                if(nIdx>=0){
                    var normal = this.normals[nIdx];
                    normals[index_indices*3+0] = normal.x;
                    normals[index_indices*3+1] = normal.y;
                    normals[index_indices*3+2] = normal.z;
                }else{

                }
                // uv坐标
                var tIdx = face.tIndices[k];
                var texCoord = this.uvs[tIdx];
                texCoords[index_indices*2+0] = texCoord.s;
                texCoords[index_indices*2+1] = 1-texCoord.t;
                index_indices ++;
            }
        }
    }
    return new DrawingInfo(vertices,normals,colors,indices,texCoords);
}
// 材质文件对象
var MTLDoc = function (){
    this.complete = false;
    this.materials = new Array(0);
}
MTLDoc.prototype.parseNewmtl = function (sp){
    return sp.getWord();
}
MTLDoc.prototype.parseRGB = function (sp,name){
    var r = sp.getFloat();
    var g = sp.getFloat();
    var b = sp.getFloat();
    return (new Matrial(name,r,g,b,1));
}

// 解析材质文件
function onReadMTLFile(fileString,mtl){
    var lines = fileString.split('\n');
    lines.push(null);// 问题五处
    var index = 0;

    var line;
    var name = "";
    var sp = new StringParser();
    while((line = lines[index++])!=null){
        sp.init(line);
        var command = sp.getWord();
        if(command == null) continue;
        switch (command){
            case '#':
                continue;
            case 'newmtl':// 问题六处
                name = mtl.parseNewmtl(sp);
                continue;
            case 'Kd':// 问题七处
                if(name == "") continue;
                var material = mtl.parseRGB(sp,name);
                mtl.materials.push(material);
                name = "";
                continue;
        }
    }
    mtl.complete = true;
}

// 读取一个文件
function readOBJFile(fileName,gl,scale){
    return new Promise((resolve,reject)=>{
        var request = new XMLHttpRequest();
        request.onreadystatechange = function (){
            if(request.readyState === 4 && request.status !== 404){
                resolve(onReadOBJFile(request.responseText,fileName,gl,scale))
            }
        }
        request.onprogress = (event) => {
            if (event.lengthComputable && event.total > 0) {
                // 分母已知，可以算出精确百分比
                const percent = Math.round((event.loaded / event.total) * 100);
                document.getElementsByClassName('modelProgress')[0].innerHTML = '加载模型进度'+percent+'%';
                // onProgress(percent, event.loaded, event.total);
            } else {
                // 分母未知（如分块传输），只报告已加载字节数
                // onProgress(null, event.loaded, 0);
            }
        };
        request.open('GET',fileName);
        request.send();
    })
}
// 文件已经被读取
function  onReadOBJFile(fileString,fileName,gl,scale){
    var objDoc = new OBJDoc(fileName);
    objDoc.parse(fileString,scale);
    return objDoc
}

function onReadComplete(gl,model,objDoc,objName = [],program,useTex=false){
    var drawingInfo = objDoc.getDrawingInfo(objName,useTex);

    // 坐标
    gl.bindBuffer(gl.ARRAY_BUFFER,model.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,drawingInfo.vertices,gl.STATIC_DRAW);
    gl.vertexAttribPointer(program.a_Position,3,gl.FLOAT,false,0,0);

    // 法线
    gl.bindBuffer(gl.ARRAY_BUFFER,model.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,drawingInfo.normals,gl.STATIC_DRAW);
    gl.vertexAttribPointer(program.a_Normal,3,gl.FLOAT,false,0,0);

    // 材质颜色
    gl.bindBuffer(gl.ARRAY_BUFFER,model.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,drawingInfo.colors,gl.STATIC_DRAW);
    gl.vertexAttribPointer(program.a_Color,4,gl.FLOAT,false,0,0);
    // uv坐标
    if(useTex){
        gl.bindBuffer(gl.ARRAY_BUFFER,model.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER,drawingInfo.texCoords,gl.STATIC_DRAW);
        gl.vertexAttribPointer(program.a_TexCoord,2,gl.FLOAT,false,0,0);
    }

    // 索引
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,drawingInfo.indices,gl.STATIC_DRAW);
    return drawingInfo
}
