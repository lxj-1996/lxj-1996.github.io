// 顶点着色器
var VSHADER_SOURCE = `#version 300 es
    in vec4 a_Position;
    in vec4 a_Color;
    in vec4 a_Normal;
    uniform mat4 u_MvpMatrix;// 视图投影矩阵
    uniform mat4 u_ModelMatrix;// 模型矩阵
    uniform mat4 u_NormalMatrix;// 法线矩阵
    uniform float u_carPaint;
    
    out vec4 v_Color;
    out vec3 v_Normal;
    out vec3 v_Position;
    void main(){
        gl_Position = u_MvpMatrix * a_Position;
        // v_Color = a_Color;
        if(u_carPaint == 1.0){
            v_Color = vec4(0.8,0.0,0.1,a_Color.a);
        }else if(u_carPaint == 2.0){
            v_Color = vec4(0.0,0.0,0.502,a_Color.a);
        }
        
        // 经过矩阵变换后的坐标（旋转，平移，放大缩小）;
        v_Position = vec3(u_ModelMatrix*a_Position);
        // 经过矩阵变换后的法线
        v_Normal = normalize(vec3(u_NormalMatrix*a_Normal));
    }
`

// 片元着色器
var FSHADER_SOURCE = `#version 300 es
    precision mediump float;
    uniform vec3 u_LightColor;// 光线的颜色
    uniform vec3 u_LightPosition;// 点光源的位置
    uniform sampler2D uEnvMap;// 反射采样贴图
    in vec4 v_Color;
    in vec3 v_Normal;
    in vec3 v_Position;
    
    out vec4 fragColor;
    // 天空颜色
    vec3 skyColor = vec3(0.2,0.27,0.42);
    // 地面颜色
    vec3 groundColor = vec3(0.055,0.058,0.075);
    const float PI = 3.14159265359;
    // 方向向量-》等距柱状UV
    vec2 dirToRange(vec3 dir){
        float u = atan(dir.z,dir.x)/(2.0*PI)+0.5;
        float v = asin(clamp(dir.y,-1.0,1.0))/PI + 0.5;
        return vec2(u,1.0 - v);// v翻转，因为图片通常从上到下
    }
    vec3 acesFilmic(vec3 x){
        const float a = 2.51;
        const float b = 0.03;
        const float c = 2.43;
        const float d = 0.59;
        const float e = 0.14;
        return clamp((x * (a*x + b)) / (x*(c*x + d) + e),0.0,1.0);
    }
    void main(){
        // 法线插值后还需要再归一化一下，
        vec3 normal = normalize(v_Normal);
        // 光线方向
        vec3 lightDirection = normalize(u_LightPosition - v_Position);
        // 光线与法线的点积
        float nDotL = max(dot(lightDirection,normal),0.0);
        // 漫反射
        vec3 diffuse = v_Color.rgb * nDotL;
        
        // 半程向量高光
        vec3 viePos = vec3(0,3,12);
        vec3 V = normalize(viePos - v_Position);
        vec3 H = normalize(lightDirection + V);
        vec3 specularColor = vec3(0.88,0.93,1.00);
        float spec = pow(max(dot(normal,H),0.0),2560.0);
        vec3 specular = spec * u_LightColor * specularColor;
        
        // 半球环境光
        float hemi = normal.y*0.5+0.5;
        hemi = pow(hemi,5.0);
        vec3 hemisphere_ambient = mix(groundColor,skyColor,hemi);
        
        // 菲涅尔
        vec3 I = -V;
        vec3 R = reflect(I,normal);
        vec3 envColor = texture(uEnvMap,dirToRange(R)).rgb * 1.5;
        float cosTheta = clamp(dot(normal,V),0.0,1.0);
        float fresnel = 0.05 + (1.0 - 0.05)*pow(1.0 - cosTheta,5.0);
        
        vec3 color = vec3(1.0,1.0,1.0);
        if(nDotL > 0.0){
            color = u_LightColor*(diffuse+hemisphere_ambient)+specular+envColor*fresnel*0.2;
        }else{
            color = u_LightColor*(diffuse+hemisphere_ambient)+specular;
        }
        // 颜色映射
        color = acesFilmic(color);
        // 像素输出值
        // 伽马矫正
        fragColor = vec4(pow(color,vec3(1.0/2.2)),v_Color.a);
    }
`

// 车窗装饰条
// 顶点着色器
var ZHUANGSHITIAO_VSHADER_SOURCE = `#version 300 es
    in vec4 a_Position;
    in vec4 a_Color;
    in vec4 a_Normal;
    uniform mat4 u_MvpMatrix;// 视图投影矩阵
    uniform mat4 u_ModelMatrix;// 模型矩阵
    uniform mat4 u_NormalMatrix;// 法线矩阵
    
    
    out vec4 v_Color;
    out vec3 v_Normal;
    out vec3 v_Position;
    void main(){
        gl_Position = u_MvpMatrix * a_Position;
        v_Color = a_Color;
        // 经过矩阵变换后的坐标（旋转，平移，放大缩小）;
        v_Position = vec3(u_ModelMatrix*a_Position);
        // 经过矩阵变换后的法线
        v_Normal = normalize(vec3(u_NormalMatrix*a_Normal));
    }
`
// 片元着色器
var ZHUANGSHITIAO_FSHADER_SOURCE = `#version 300 es
    precision mediump float;
    uniform vec3 u_LightColor;// 光线的颜色
    uniform vec3 u_LightPosition;// 点光源的位置
    uniform sampler2D uEnvMap;// 反射采样贴图
    uniform float u_Style;
    in vec4 v_Color;
    in vec3 v_Normal;
    in vec3 v_Position;
    
    out vec4 fragColor;
        // 天空颜色
    vec3 skyColor = vec3(0.2,0.27,0.42);
    // 地面颜色
    vec3 groundColor = vec3(0.055,0.058,0.075);
    vec3 acesFilmic(vec3 x){
        const float a = 2.51;
        const float b = 0.03;
        const float c = 2.43;
        const float d = 0.59;
        const float e = 0.14;
        return clamp((x * (a*x + b)) / (x*(c*x + d) + e),0.0,1.0);
    }
    
    const float PI = 3.14159265359;
    // 方向向量-》等距柱状UV
    vec2 dirToRange(vec3 dir){
        float u = atan(dir.z,dir.x)/(2.0*PI)+0.5;
        float v = asin(clamp(dir.y,-1.0,1.0))/PI + 0.5;
        return vec2(u,1.0 - v);// v翻转，因为图片通常从上到下
    }
    void main(){
        // 法线插值后还需要再归一化一下，
        vec3 normal = normalize(v_Normal);
        // 光线方向
        vec3 lightDirection = normalize(u_LightPosition - v_Position);
        // 光线与法线的点积
        float nDotL = max(dot(lightDirection,normal),0.0);
        // 漫反射
        vec3 diffuse = v_Color.rgb * nDotL;
        float hemi = normal.y*0.5+0.5;
        hemi = pow(hemi,5.0);
        vec3 hemisphere_ambient = mix(groundColor,skyColor,hemi);
        // 半程向量高光
        vec3 viePos = vec3(0,3,12);
        vec3 V = normalize(viePos - v_Position);
        vec3 H = normalize(lightDirection + V);
        vec3 specularColor = vec3(0.88,0.93,1.00);
        float spec = pow(max(dot(normal,H),0.0),256.0);

        vec3 specular = spec * u_LightColor * specularColor * 0.05;
        
        vec3 color = u_LightColor*(diffuse+hemisphere_ambient)+specular;
        if(u_Style == 2.0){
        
            // 菲涅尔
            vec3 I = -V;
            vec3 R = reflect(I,normal);
            vec3 envColor = texture(uEnvMap,dirToRange(R)).rgb * 1.5;
            float cosTheta = clamp(dot(normal,V),0.0,1.0);
            float fresnel = 0.05 + (1.0 - 0.05)*pow(1.0 - cosTheta,5.0);
        
            spec = pow(max(dot(normal,H),0.0),1440.0);
            specular = spec * u_LightColor * specularColor;
            color = u_LightColor*(diffuse+hemisphere_ambient*0.2)+specular+envColor*fresnel*0.2;
        }
        if(u_Style == 3.0){
            spec = pow(max(dot(normal,H),0.0),256.0);
            specular = spec * u_LightColor * specularColor*0.05;
            color = u_LightColor*(diffuse+hemisphere_ambient*0.3)+specular;
        }
        if(u_Style == 4.0){
            // 菲涅尔
            vec3 I = -V;
            vec3 R = reflect(I,normal);
            vec3 envColor = texture(uEnvMap,dirToRange(R)).rgb * 1.5;
            float cosTheta = clamp(dot(normal,V),0.0,1.0);
            float fresnel = 0.05 + (1.0 - 0.05)*pow(1.0 - cosTheta,5.0);
            
            spec = pow(max(dot(normal,H),0.0),1440.0);
            specular = spec * u_LightColor * specularColor*0.05;
            color = u_LightColor*(diffuse+hemisphere_ambient)+specular+envColor*fresnel*0.1;
        }
        if(u_Style == 5.0){
            // 菲涅尔
            vec3 I = -V;
            vec3 R = reflect(I,normal);
            vec3 envColor = texture(uEnvMap,dirToRange(R)).rgb * 1.5;
            float cosTheta = clamp(dot(normal,V),0.0,1.0);
            float fresnel = 0.05 + (1.0 - 0.05)*pow(1.0 - cosTheta,5.0);
            
            spec = pow(max(dot(normal,H),0.0),500.0);
            specular = spec * u_LightColor * specularColor*10.0;
            color = u_LightColor*(diffuse+hemisphere_ambient)+specular+envColor*fresnel*0.1;
        }
        if(u_Style == 6.0){
            vec3 I = -V;
            vec3 R = reflect(I,normal);
            vec3 envColor = texture(uEnvMap,dirToRange(R)).rgb;
            color = envColor;
        }
        if(u_Style == 7.0){
            // gl_FrontFacing  内置变量用于判断正面与反面
            if(gl_FrontFacing){
                // 正面
                // 高光
                spec = pow(max(dot(normal,H),0.0),2560.0);
                specular = spec * u_LightColor * specularColor;
                // 菲涅尔
                vec3 I = -V;
                vec3 R = reflect(I,normal);
                vec3 envColor = texture(uEnvMap,dirToRange(R)).rgb * 1.5;
                float cosTheta = clamp(dot(normal,V),0.0,1.0);
                float fresnel = 0.05 + (1.0 - 0.05)*pow(1.0 - cosTheta,5.0);
                color = v_Color.rgb+specular+envColor*fresnel*0.1;
                fragColor = vec4(pow(color,vec3(1.0/2.2)),0.9);
            }else{
                // 反面
                color.rgb = v_Color.rgb;
                fragColor = vec4(pow(color,vec3(1.0/2.2)),0.5);
            }
            
        }else if(u_Style == 8.0){
            // gl_FrontFacing  内置变量用于判断正面与反面
            if(gl_FrontFacing){
                // 正面
                // 高光
                spec = pow(max(dot(normal,H),0.0),2560.0);
                specular = spec * u_LightColor * specularColor;
                // 菲涅尔
                vec3 I = -V;
                vec3 R = reflect(I,normal);
                vec3 envColor = texture(uEnvMap,dirToRange(R)).rgb * 1.5;
                float cosTheta = clamp(dot(normal,V),0.0,1.0);
                float fresnel = 0.05 + (1.0 - 0.05)*pow(1.0 - cosTheta,5.0);
                color = v_Color.rgb+specular+envColor*fresnel*0.1;
                fragColor = vec4(pow(color,vec3(1.0/2.2)),spec+fresnel);
            }else{
                // 反面
                color.rgb = v_Color.rgb;
                fragColor = vec4(pow(color,vec3(1.0/2.2)),0.1);
            }
        }else{
                        // 颜色映射
            color = acesFilmic(color);
            // 像素输出值
            // 伽马矫正
            fragColor = vec4(pow(color,vec3(1.0/2.2)),v_Color.a);
        }

    }
`
// 车灯着色器
var LAMP_VSHADER_SOURCE = `#version 300 es
    in vec4 a_Position;
    in vec4 a_Color;
    in vec4 a_Normal;
    in vec2 a_TexCoord;
    uniform mat4 u_MvpMatrix;// 视图投影矩阵
    uniform mat4 u_ModelMatrix;// 模型矩阵
    uniform mat4 u_NormalMatrix;// 法线矩阵
    
    out vec4 v_Color;
    out vec3 v_Normal;
    out vec3 v_Position;
    out vec2 v_TexCoord;
    void main(){
        gl_Position = u_MvpMatrix * a_Position;
        v_Color = a_Color;
        // 经过矩阵变换后的坐标（旋转，平移，放大缩小）;
        v_Position = vec3(u_ModelMatrix*a_Position);
        // 经过矩阵变换后的法线
        v_Normal = normalize(vec3(u_NormalMatrix*a_Normal));
        v_TexCoord = a_TexCoord;
    }
`
var LAMP_FSHADER_SOURCE = `#version 300 es
    precision mediump float;
    uniform vec3 u_LightColor;// 光线的颜色
    uniform vec3 u_LightPosition;// 点光源的位置
    uniform sampler2D lampTex;// 反射采样贴图
    
    in vec4 v_Color;
    in vec3 v_Normal;
    in vec3 v_Position;
    in vec2 v_TexCoord;
    
    out vec4 fragColor;

    void main(){
        // 法线插值后还需要再归一化一下，
        vec3 normal = normalize(v_Normal);
        // 光线方向
        vec3 lightDirection = normalize(u_LightPosition - v_Position);
        // 光线与法线的点积
        float nDotL = max(dot(lightDirection,normal),0.0);
        // 漫反射
        vec3 diffuse = v_Color.rgb * nDotL*u_LightColor;
        vec4 color = texture(lampTex,v_TexCoord);

        // fragColor = vec4(diffuse,v_Color.a);
        fragColor = color;
    }
`
