import type { LookParams } from '@/lib/cameraFilters'

/*
 * Draws the camera through a look on the GPU (WebGL 1, so it runs on every
 * phone browser, iPhones included). One full-screen triangle pair, one
 * fragment shader: exposure, warmth, saturation, contrast, split toning,
 * lifted blacks, vignette and grain.
 *
 * The camera frame is first copied into a plain 2D canvas and only then
 * uploaded to WebGL. Uploading a live camera <video> straight into a WebGL
 * texture is unreliable on some Android GPUs/Chrome builds: the frame comes
 * out sheared, with a black diagonal wedge across the top, and because the
 * photo and recording are taken from this output the wedge was saved too.
 * A 2D drawImage of the video is the well-trodden path (it's what the
 * no-WebGL fallback already uses), so the GPU only ever sees a canvas.
 */

const VERT = `
attribute vec2 p;
varying vec2 v;
uniform float mirror;
void main() {
  v = vec2(mirror > 0.5 ? 1.0 - (p.x * 0.5 + 0.5) : p.x * 0.5 + 0.5, p.y * 0.5 + 0.5);
  gl_Position = vec4(p, 0.0, 1.0);
}`

const FRAG = `
precision mediump float;
varying vec2 v;
uniform sampler2D tex;
uniform float exposure, contrast, saturation, warmth, fade, vignette, grain, mono, seed, aspect;
uniform vec3 shadowTint, highlightTint;
const vec3 W = vec3(0.299, 0.587, 0.114);
void main() {
  vec3 c = texture2D(tex, v).rgb * exposure;
  c += vec3(warmth, warmth * 0.25, -warmth) * 0.5;
  float l = dot(c, W);
  c = mix(vec3(l), c, mono > 0.5 ? 0.0 : saturation);
  c = (c - 0.5) * contrast + 0.5;
  float lum = clamp(dot(c, W), 0.0, 1.0);
  c += shadowTint * (1.0 - smoothstep(0.0, 0.55, lum)) + highlightTint * smoothstep(0.45, 1.0, lum);
  c = fade + c * (1.0 - fade);
  vec2 d = (v - 0.5) * vec2(aspect, 1.0);
  c *= 1.0 - vignette * smoothstep(0.3, 0.95, length(d) * 1.25);
  float n = fract(sin(dot(v * 1000.0 + seed, vec2(12.9898, 78.233))) * 43758.5453);
  c += (n - 0.5) * grain;
  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}`

export class LookRenderer {
  readonly canvas: HTMLCanvasElement
  private gl: WebGLRenderingContext
  private prog: WebGLProgram
  private tex: WebGLTexture
  private u: Record<string, WebGLUniformLocation | null> = {}
  private stage: HTMLCanvasElement
  private stageCtx: CanvasRenderingContext2D | null

  private constructor(canvas: HTMLCanvasElement, gl: WebGLRenderingContext, prog: WebGLProgram, tex: WebGLTexture) {
    this.canvas = canvas
    this.gl = gl
    this.prog = prog
    this.tex = tex
    this.stage = document.createElement('canvas')
    this.stageCtx = this.stage.getContext('2d', { alpha: false })
    for (const name of ['mirror', 'exposure', 'contrast', 'saturation', 'warmth', 'fade', 'vignette', 'grain', 'mono', 'seed', 'aspect', 'shadowTint', 'highlightTint']) {
      this.u[name] = gl.getUniformLocation(prog, name)
    }
  }

  /** Null when the browser has no WebGL; the caller then draws the plain camera. */
  static create(): LookRenderer | null {
    if (typeof document === 'undefined') return null
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl', { premultipliedAlpha: false, antialias: false, preserveDrawingBuffer: true }) as WebGLRenderingContext | null
      if (!gl) return null
      const shader = (type: number, src: string) => {
        const s = gl.createShader(type)!
        gl.shaderSource(s, src)
        gl.compileShader(s)
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader')
        return s
      }
      const prog = gl.createProgram()!
      gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT))
      gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG))
      gl.linkProgram(prog)
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null
      gl.useProgram(prog)
      const buf = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buf)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW)
      const loc = gl.getAttribLocation(prog, 'p')
      gl.enableVertexAttribArray(loc)
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
      const tex = gl.createTexture()!
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      return new LookRenderer(canvas, gl, prog, tex)
    } catch {
      return null
    }
  }

  /** Draw one frame of `source` through `look` into this renderer's canvas (sized w×h). */
  render(source: TexImageSource, w: number, h: number, look: LookParams, mirror: boolean) {
    const { gl, u } = this
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w
      this.canvas.height = h
    }
    gl.viewport(0, 0, w, h)
    gl.bindTexture(gl.TEXTURE_2D, this.tex)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.staged(source, w, h))
    gl.uniform1f(u.mirror, mirror ? 1 : 0)
    gl.uniform1f(u.exposure, look.exposure)
    gl.uniform1f(u.contrast, look.contrast)
    gl.uniform1f(u.saturation, look.saturation)
    gl.uniform1f(u.warmth, look.warmth)
    gl.uniform1f(u.fade, look.fade)
    gl.uniform1f(u.vignette, look.vignette)
    gl.uniform1f(u.grain, look.grain)
    gl.uniform1f(u.mono, look.mono ? 1 : 0)
    gl.uniform1f(u.seed, (performance.now() % 1000) / 10)
    gl.uniform1f(u.aspect, w / h)
    gl.uniform3fv(u.shadowTint, look.shadowTint)
    gl.uniform3fv(u.highlightTint, look.highlightTint)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }

  /** Copy the frame into the 2D staging canvas; fall back to the source if 2D isn't available. */
  private staged(source: TexImageSource, w: number, h: number): TexImageSource {
    const ctx = this.stageCtx
    if (!ctx) return source
    if (this.stage.width !== w || this.stage.height !== h) {
      this.stage.width = w
      this.stage.height = h
    }
    ctx.drawImage(source as CanvasImageSource, 0, 0, w, h)
    return this.stage
  }

  dispose() {
    try {
      this.gl.deleteTexture(this.tex)
      this.gl.deleteProgram(this.prog)
      this.gl.getExtension('WEBGL_lose_context')?.loseContext()
      this.stage.width = 0
      this.stage.height = 0
    } catch {
      // Already gone.
    }
  }
}
