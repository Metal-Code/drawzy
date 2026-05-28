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
  const undoStack = useRef([])
  const skipNextSocketUndo = useRef(false)
  const onCanvasSyncRef = useRef(null)

  const [color, setColor] = useState('#1A1A1A')
  const [brushSize, setBrushSize] = useState(8)
  const [tool, setTool] = useState('pen')

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

  const saveUndoState = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    undoStack.current.push(canvas.toDataURL('image/png'))
    if (undoStack.current.length > 40) undoStack.current.shift()
  }, [])

  const restoreCanvas = useCallback((snapshot) => {
    const canvas = canvasRef.current
    if (!canvas || !snapshot) return
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
    }
    img.src = snapshot
  }, [])

  const hexToRgba = (hex) => {
    const clean = hex.replace('#', '')
    const num = parseInt(clean, 16)
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255, 255]
  }

  const colorsMatch = (data, index, target) => {
    return (
      data[index] === target[0] &&
      data[index + 1] === target[1] &&
      data[index + 2] === target[2] &&
      data[index + 3] === target[3]
    )
  }

  const floodFill = useCallback((ctx, x, y, fillColor) => {
    const canvas = ctx.canvas
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    const startX = Math.floor(x)
    const startY = Math.floor(y)
    if (startX < 0 || startY < 0 || startX >= canvas.width || startY >= canvas.height) return
    const startIndex = (startY * canvas.width + startX) * 4
    const targetColor = [
      data[startIndex],
      data[startIndex + 1],
      data[startIndex + 2],
      data[startIndex + 3],
    ]
    const replacementColor = hexToRgba(fillColor)
    if (
      targetColor[0] === replacementColor[0] &&
      targetColor[1] === replacementColor[1] &&
      targetColor[2] === replacementColor[2] &&
      targetColor[3] === replacementColor[3]
    ) return
    const stack = [[startX, startY]]
    while (stack.length) {
      const [currentX, currentY] = stack.pop()
      if (currentX < 0 || currentY < 0 || currentX >= canvas.width || currentY >= canvas.height) continue
      const index = (currentY * canvas.width + currentX) * 4
      if (!colorsMatch(data, index, targetColor)) continue
      data[index] = replacementColor[0]
      data[index + 1] = replacementColor[1]
      data[index + 2] = replacementColor[2]
      data[index + 3] = replacementColor[3]
      stack.push([currentX + 1, currentY])
      stack.push([currentX - 1, currentY])
      stack.push([currentX, currentY + 1])
      stack.push([currentX, currentY - 1])
    }
    ctx.putImageData(imageData, 0, 0)
  }, [])

  const drawStroke = useCallback((ctx, stroke) => {
    if (stroke.type === 'fill') {
      floodFill(ctx, stroke.x, stroke.y, stroke.color)
      return
    }
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
  }, [floodFill])

  const redrawAll = useCallback((list) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    list.forEach((s) => drawStroke(ctx, s))
  }, [drawStroke])

  const emitCanvasSync = useCallback(() => {
    if (!isDrawer) return
    if (!socket) return
    if (strokeBuffer.current.length > 0) {
      strokeBuffer.current.forEach((s) => socket.emit('draw', { roomId, stroke: s }))
      strokeBuffer.current = []
    }
    const canvas = canvasRef.current
    if (!canvas) return
    socket.emit('canvas-sync', {
      roomId,
      image: canvas.toDataURL('image/png', 0.7),
    })
  }, [socket, roomId, isDrawer])

  // Keep onCanvasSyncRef always up to date so the stable socket listener
  // always calls the latest version which has the freshest canvasRef
  useEffect(() => {
    onCanvasSyncRef.current = ({ image }) => {
      console.log('canvas-sync received, image length:', image?.length)
      const canvas = canvasRef.current
      if (!canvas || !image) return
      const ctx = canvas.getContext('2d')
      const img = new Image()
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      }
      img.src = image
    }
  })

  // Socket listeners — only depends on socket so it never tears down
  // and re-registers due to drawStroke/redrawAll changing
  useEffect(() => {
    if (!socket) return

    const onDraw = (stroke) => {
      const canvas = canvasRef.current
      if (canvas) drawStroke(canvas.getContext('2d'), stroke)
    }

    const onClear = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    const onUndo = ({ strokes: s }) => {
      if (skipNextSocketUndo.current) {
        skipNextSocketUndo.current = false
        return
      }
      redrawAll(s)
    }

    const onCanvasSync = (data) => onCanvasSyncRef.current?.(data)

    socket.on('draw', onDraw)
    socket.on('canvas-cleared', onClear)
    socket.on('undo', onUndo)
    socket.on('canvas-sync', onCanvasSync)

    return () => {
      socket.off('draw', onDraw)
      socket.off('canvas-cleared', onClear)
      socket.off('undo', onUndo)
      socket.off('canvas-sync', onCanvasSync)
    }
  }, [socket])

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    if (strokes.length > 0) redrawAll(strokes)
  }, [])

  // Flush stroke buffer every 16ms
  useEffect(() => {
    if (!isDrawer || !socket) return
    const interval = setInterval(() => {
      if (strokeBuffer.current.length > 0) {
        strokeBuffer.current.forEach((s) => socket.emit('draw', { roomId, stroke: s }))
        strokeBuffer.current = []
      }
    }, 16)
    return () => clearInterval(interval)
  }, [isDrawer, socket, roomId])

  // Clear canvas when strokes reset to empty (new turn)
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
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const pos = getPos(e, canvas)
    saveUndoState()
    if (tool === 'fill') {
      floodFill(ctx, pos.x, pos.y, color)
      emitCanvasSync()
      return
    }
    isDrawing.current = true
    lastPos.current = pos
    const stroke = { ...pos, color, brushSize, tool, type: 'start', lastX: pos.x, lastY: pos.y }
    drawStroke(ctx, stroke)
    strokeBuffer.current.push(stroke)
  }

  const draw = (e) => {
    if (!isDrawer || !isDrawing.current) return
    e.preventDefault()
    const pos = getPos(e, canvasRef.current)
    const stroke = {
      ...pos, color, brushSize, tool, type: 'move',
      lastX: lastPos.current.x, lastY: lastPos.current.y,
    }
    drawStroke(canvasRef.current.getContext('2d'), stroke)
    strokeBuffer.current.push(stroke)
    lastPos.current = pos
  }

  const stopDraw = () => {
    isDrawing.current = false
    lastPos.current = null
  }

  const handleClear = () => {
    saveUndoState()
    const ctx = canvasRef.current.getContext('2d')
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    socket.emit('clear-canvas', { roomId, userId: socket.id })
  }

  const handleUndo = () => {
    const previousState = undoStack.current.pop()
    isDrawing.current = false
    lastPos.current = null
    strokeBuffer.current = []
    if (previousState) {
      restoreCanvas(previousState)
      skipNextSocketUndo.current = true
      if (socket) {
        socket.emit('canvas-sync', { roomId, image: previousState })
      }
    }
    socket.emit('undo', { roomId, userId: socket.id })
  }

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
            cursor: !isDrawer
              ? 'default'
              : tool === 'fill'
              ? `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='22' height='22' viewBox='0 0 22 22'><path d='M3 18l4-4 7 7-4 4z' fill='black' stroke='black' stroke-width='1.5' stroke-linejoin='round'/></svg>") 2 20, crosshair`
              : tool === 'eraser'
              ? `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='${brushSize * 2 + 6}' height='${brushSize * 2 + 6}'><circle cx='${brushSize + 3}' cy='${brushSize + 3}' r='${brushSize}' fill='white' stroke='black' stroke-width='2'/></svg>") ${brushSize + 3} ${brushSize + 3}, crosshair`
              : `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='${brushSize * 2 + 6}' height='${brushSize * 2 + 6}'><circle cx='${brushSize + 3}' cy='${brushSize + 3}' r='${brushSize}' fill='black'/></svg>") ${brushSize + 3} ${brushSize + 3}, crosshair`,
            aspectRatio: '900/560',
            width: '100%',
            height: 'auto',
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
          <div className="grid grid-cols-8 gap-1">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => { setColor(c); if (tool === 'eraser') setTool('pen') }}
                className="w-6 h-6 rounded-full border-2 border-ink press-sm"
                style={{
                  backgroundColor: c,
                  outline: color === c && tool !== 'eraser' ? '3px solid var(--ink)' : 'none',
                  outlineOffset: '2px',
                }}
              />
            ))}
          </div>

          <div className="w-px h-10 bg-ink" />

          <div className="flex items-center gap-2">
            {BRUSH_SIZES.map((s) => (
              <button
                key={s}
                onClick={() => setBrushSize(s)}
                className={`rounded-full bg-ink border-2 border-ink ${brushSize === s ? 'ring-2 ring-pink ring-offset-2 ring-offset-cream' : ''}`}
                style={{ width: s + 8, height: s + 8 }}
              />
            ))}
          </div>

          <div className="w-px h-10 bg-ink" />

          <div className="flex items-center gap-2">
            <button onClick={() => setTool('pen')} className={`btn btn-sm ${tool === 'pen' ? 'btn-yolk' : 'btn-cream'}`}>pen</button>
            <button onClick={() => setTool('eraser')} className={`btn btn-sm ${tool === 'eraser' ? 'btn-yolk' : 'btn-cream'}`}>eraser</button>
            <button onClick={() => setTool('fill')} className={`btn btn-sm ${tool === 'fill' ? 'btn-yolk' : 'btn-cream'}`}>fill</button>
            <button onClick={handleUndo} className="btn btn-sm btn-cream">undo</button>
            <button onClick={handleClear} className="btn btn-sm btn-pink">clear</button>
          </div>
        </div>
      )}
    </div>
  )
}