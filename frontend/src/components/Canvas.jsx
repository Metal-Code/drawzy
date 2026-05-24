import { useRef, useEffect, useState, useCallback } from 'react'

const COLORS = ['#000000', '#FFFFFF', '#FF6B6B', '#FFD93D', '#6BCB77', '#4ECDC4', '#A855F7', '#FF6EB4', '#FF8C00', '#1A1B2E']
const BRUSH_SIZES = [4, 8, 16, 28]

export default function Canvas({ isDrawer, socket, roomId, strokes = [] }) {
  const canvasRef = useRef(null)
  const isDrawing = useRef(false)
  const lastPos = useRef(null)
  const strokeBuffer = useRef([])
  const [color, setColor] = useState('#000000')
  const [brushSize, setBrushSize] = useState(8)
  const [tool, setTool] = useState('pen') // pen | eraser

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const drawStroke = useCallback((ctx, stroke) => {
    ctx.beginPath()
    ctx.strokeStyle = stroke.tool === 'eraser' ? '#FFFFFF' : stroke.color
    ctx.lineWidth = stroke.brushSize
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    if (stroke.type === 'start') {
      ctx.moveTo(stroke.x, stroke.y)
      ctx.lineTo(stroke.x, stroke.y)
    } else {
      ctx.moveTo(stroke.lastX, stroke.lastY)
      ctx.lineTo(stroke.x, stroke.y)
    }
    ctx.stroke()
  }, [])

  // Redraw all strokes (used for undo and reconnect)
  const redrawAll = useCallback((strokesList) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    strokesList.forEach(s => drawStroke(ctx, s))
  }, [drawStroke])

  // Listen for incoming draw events
  useEffect(() => {
    if (!socket) return
    const ctx = canvasRef.current?.getContext('2d')

    socket.on('draw', (stroke) => {
      if (ctx) drawStroke(ctx, stroke)
    })
    socket.on('canvas-cleared', () => {
      if (ctx) {
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
    })
    socket.on('undo', ({ strokes: s }) => redrawAll(s))

    return () => {
      socket.off('draw')
      socket.off('canvas-cleared')
      socket.off('undo')
    }
  }, [socket, drawStroke, redrawAll])

  // Replay strokes on reconnect
  useEffect(() => {
    if (strokes.length > 0) redrawAll(strokes)
  }, [])

  // Initialize white canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  // Throttled emit
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
    <div className="flex flex-col gap-3">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={700}
          height={450}
          className={`w-full rounded-3xl border-4 ${isDrawer ? 'border-yellow cursor-crosshair' : 'border-white/20 cursor-default'} bg-white shadow-2xl`}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
        {!isDrawer && (
          <div className="absolute inset-0 rounded-3xl" style={{ pointerEvents: 'none' }} />
        )}
      </div>

      {isDrawer && (
        <div className="card flex items-center gap-4 flex-wrap">
          {/* Colors */}
          <div className="flex gap-1.5 flex-wrap">
            {COLORS.map(c => (
              <button key={c} onClick={() => { setColor(c); setTool('pen') }}
                className={`w-7 h-7 rounded-full border-2 transition-transform active:scale-90 ${color === c && tool === 'pen' ? 'border-yellow scale-110' : 'border-white/20'}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>

          {/* Brush sizes */}
          <div className="flex items-center gap-2">
            {BRUSH_SIZES.map(s => (
              <button key={s} onClick={() => { setBrushSize(s); setTool('pen') }}
                className={`rounded-full bg-white transition-all ${brushSize === s && tool === 'pen' ? 'ring-2 ring-yellow' : ''}`}
                style={{ width: s + 8, height: s + 8 }} />
            ))}
          </div>

          {/* Tools */}
          <button onClick={() => setTool('eraser')}
            className={`font-display px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${tool === 'eraser' ? 'bg-yellow text-navy' : 'bg-navy-light text-cream hover:bg-white/10'}`}>
            🧹 Eraser
          </button>
          <button onClick={handleUndo} className="font-display px-3 py-1.5 rounded-xl text-sm font-semibold bg-navy-light text-cream hover:bg-white/10 transition-all">
            ↩ Undo
          </button>
          <button onClick={handleClear} className="font-display px-3 py-1.5 rounded-xl text-sm font-semibold bg-coral text-white hover:brightness-110 transition-all">
            🗑 Clear
          </button>
        </div>
      )}
    </div>
  )
}
