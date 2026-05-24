import { v4 as uuidv4 } from 'uuid'

export const generateGuestId = () => `guest_${uuidv4()}`

export const generateWordHint = (word) =>
  word.split('').map(c => (c === ' ' ? ' ' : '_')).join(' ')

export const formatScore = (score) => score.toLocaleString()

export const playSound = (type) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const sounds = {
      correct: { freq: 523, duration: 0.2, type: 'sine' },
      wrong: { freq: 200, duration: 0.15, type: 'sawtooth' },
      roundStart: { freq: 440, duration: 0.3, type: 'sine' },
      gameOver: { freq: 330, duration: 0.5, type: 'triangle' },
      tick: { freq: 800, duration: 0.05, type: 'square' },
    }
    const s = sounds[type]
    if (!s) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = s.freq
    osc.type = s.type
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + s.duration)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + s.duration)
  } catch (e) {}
}

export const copyToClipboard = async (text) => {
  await navigator.clipboard.writeText(text)
}
