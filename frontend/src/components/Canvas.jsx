import { useRef, useEffect, useState, useCallback } from 'react'

const COLORS = [
  '#1A1A1A', '#FFFFFF', '#8A8A8A', '#6B3F1D',
  '#FF3DA5', '#D6249F', '#FF8A1F', '#E63946',
  '#FFD93D', '#D4A017', '#9CE34A', '#2DA84F',
  '#7ED7E8', '#2A6FD6', '#B197F2', '#7C3AED',
]
const BRUSH_SIZES = [4, 8, 16, 28]

export default function Canvas({ isDrawer, socket, roomId, strokes = [] }) {
  const canvasRef = useRef(null)
  const wrapRef = useRef(null)
  const isDrawing = useRef(false)
  const lastPos = useRef(null)
  const strokeBuffer = useRef([])
  const [color, setColor] = useState('#1A1A1A')
  const [brushSize, setBrushSize] = useState(8)
  const [tool, setTool] = useState('pen')

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if (e.touches) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY }
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
  }

  const drawStroke = useCallback((ctx, stroke) => {
    ctx.beginPath()
    ctx.strokeStyle = stroke.tool === 'eraser' ? '#FFFFFF' : stroke.color
    ctx.lineWidth = stroke.brushSize
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    if (stroke.type === 'start') { ctx.moveTo(stroke.x, stroke.y); ctx.lineTo(stroke.x, stroke.y) }
    else { ctx.moveTo(stroke.lastX, stroke.lastY); ctx.lineTo(stroke.x, stroke.y) }
    ctx.stroke()
  }, [])

  const redrawAll = useCallback((list) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    list.forEach(s => drawStroke(ctx, s))
  }, [drawStroke])

  useEffect(() => {
    if (!socket) return
    const ctx = canvasRef.current?.getContext('2d')
    socket.on('draw', (stroke) => { if (ctx) drawStroke(ctx, stroke) })
    socket.on('canvas-cleared', () => {
      if (ctx) { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height) }
    })
    socket.on('undo', ({ strokes: s }) => redrawAll(s))
    return () => { socket.off('draw'); socket.off('canvas-cleared'); socket.off('undo') }
  }, [socket, drawStroke, redrawAll])

  useEffect(() => { if (strokes.length > 0) redrawAll(strokes) }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  useEffect(() => {
    if (!isDrawer || !socket) return
    const interval = setInterval(() => {
      if (strokeBuffer.current.length > 0) {
        strokeBuffer.current.forEach(s => socket.emit('draw', { roomId, stroke: s }))
        strokeBuffer.current = []
      }
    }, 16)
    return () => clearInterval(interval)
  }, [isDrawer, socket, roomId])

  useEffect(() => {
    if (strokes.length === 0) {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
  }, [strokes])

  const startDraw = (e) => {
    if (!isDrawer) return
    e.preventDefault()
    isDrawing.current = true
    const pos = getPos(e, canvasRef.current)
    lastPos.current = pos
    const stroke = { ...pos, color, brushSize, tool, type: 'start', lastX: pos.x, lastY: pos.y }
    drawStroke(canvasRef.current.getContext('2d'), stroke)
    strokeBuffer.current.push(stroke)
  }
  const draw = (e) => {
    if (!isDrawer || !isDrawing.current) return
    e.preventDefault()
    const pos = getPos(e, canvasRef.current)
    const stroke = { ...pos, color, brushSize, tool, type: 'move', lastX: lastPos.current.x, lastY: lastPos.current.y }
    drawStroke(canvasRef.current.getContext('2d'), stroke)
    strokeBuffer.current.push(stroke)
    lastPos.current = pos
  }
  const stopDraw = () => { isDrawing.current = false; lastPos.current = null }

  const handleClear = () => {
    const ctx = canvasRef.current.getContext('2d')
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    socket.emit('clear-canvas', { roomId, userId: socket.id })
  }
  const handleUndo = () => socket.emit('undo', { roomId, userId: socket.id })

  return (
    <div ref={wrapRef} className="flex flex-col gap-3 min-h-0">
      <div className="flex-1 min-h-0 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={900}
          height={560}
          className="bg-white max-h-full max-w-full"
          style={{
            border: '3px solid var(--ink)',
            boxShadow: '6px 6px 0 var(--ink)',
            cursor: isDrawer ? 'crosshair' : 'default',
            aspectRatio: '900/560',
            width: '100%', height: 'auto'
          }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
      </div>

      {isDrawer && (
        <div className="blok bg-cream p-3 flex items-center gap-4 flex-wrap">
          {/* 16 colors — 2x8 */}
          <div className="grid grid-cols-8 gap-1">
            {COLORS.map(c => (
              <button key={c} onClick={() => { setColor(c); setTool('pen') }}
                className="w-6 h-6 rounded-full border-2 border-ink press-sm"
                style={{ backgroundColor: c, outline: color === c && tool === 'pen' ? '3px solid var(--ink)' : 'none', outlineOffset: '2px' }} />
            ))}
          </div>

          <div className="w-px h-10 bg-ink" />

          {/* Brush sizes */}
          <div className="flex items-center gap-2">
            {BRUSH_SIZES.map(s => (
              <button key={s} onClick={() => { setBrushSize(s); setTool('pen') }}
                className={`rounded-full bg-ink border-2 border-ink ${brushSize === s && tool === 'pen' ? 'ring-2 ring-pink ring-offset-2 ring-offset-cream' : ''}`}
                style={{ width: s + 8, height: s + 8 }} />
            ))}
          </div>

          <div className="w-px h-10 bg-ink" />

          {/* Tools */}
          <div className="flex items-center gap-2">
            <button onClick={() => setTool('pen')}
              className={`btn btn-sm ${tool === 'pen' ? 'btn-yolk' : 'btn-cream'}`}>pen</button>
            <button onClick={() => setTool('eraser')}
              className={`btn btn-sm ${tool === 'eraser' ? 'btn-yolk' : 'btn-cream'}`}>eraser</button>
            <button onClick={handleUndo} className="btn btn-sm btn-cream">undo</button>
            <button onClick={handleClear} className="btn btn-sm btn-pink">clear</button>
          </div>
        </div>
      )}
    </div>
  )
}
