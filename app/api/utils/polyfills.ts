// app/api/utils/polyfills.ts
declare global {
    var DOMMatrix: typeof DOMMatrix;
    var DOMPoint: typeof DOMPoint;
    var URL: typeof URL;
  }
  
  interface DOMMatrixInit {
    a?: number;
    b?: number;
    c?: number;
    d?: number;
    e?: number;
    f?: number;
    m11?: number;
    m12?: number;
    m13?: number;
    m14?: number;
    m21?: number;
    m22?: number;
    m23?: number;
    m24?: number;
    m31?: number;
    m32?: number;
    m33?: number;
    m34?: number;
    m41?: number;
    m42?: number;
    m43?: number;
    m44?: number;
  }
  
  class ServerDOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    m11 = 1; m12 = 0; m13 = 0; m14 = 0;
    m21 = 0; m22 = 1; m23 = 0; m24 = 0;
    m31 = 0; m32 = 0; m33 = 1; m34 = 0;
    m41 = 0; m42 = 0; m43 = 0; m44 = 1;
    is2D = true;
    isIdentity = true;
  
    constructor(init?: DOMMatrixInit) {
      if (init) {
        Object.assign(this, init);
      }
    }
  
    translateSelf(x: number, y: number): this {
      this.e += x;
      this.f += y;
      return this;
    }
  
    scaleSelf(x: number, y: number): this {
      this.a *= x;
      this.d *= y;
      return this;
    }
  
    rotateSelf(angle: number): this {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const { a, b, c, d } = this;
      this.a = a * cos + b * sin;
      this.b = -a * sin + b * cos;
      this.c = c * cos + d * sin;
      this.d = -c * sin + d * cos;
      return this;
    }
  
    skewXSelf(angle: number): this {
      const tan = Math.tan(angle);
      const { a, c } = this;
      this.a += this.b * tan;
      this.c += this.d * tan;
      return this;
    }
  
    skewYSelf(angle: number): this {
      const tan = Math.tan(angle);
      const { b, d } = this;
      this.b += this.a * tan;
      this.d += this.c * tan;
      return this;
    }
  }
  
  class ServerDOMPoint {
    x: number;
    y: number;
    z: number;
    w: number;
  
    constructor(x = 0, y = 0, z = 0, w = 1) {
      this.x = x;
      this.y = y;
      this.z = z;
      this.w = w;
    }
  }
  
  export function initializePolyfills(): void {
    if (typeof global !== 'undefined') {
      if (!global.DOMMatrix) {
        global.DOMMatrix = ServerDOMMatrix as any;
      }
      
      if (!global.DOMPoint) {
        global.DOMPoint = ServerDOMPoint as any;
      }
      
      if (!global.URL) {
        const { URL: NodeURL } = require('url');
        global.URL = NodeURL;
      }
    }
  }