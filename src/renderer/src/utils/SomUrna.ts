let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new window.AudioContext()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

// Bip curto ao apertar números, Branco ou Corrige
export function tocarBipTecla(): void {
  try {
    const ctx = getAudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(920, ctx.currentTime)

    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.07)
  } catch {
    // Ignora caso o sistema não possua dispositivo de saída de áudio
  }
}

// Som clássico de confirmação ("FIM") alternando duas frequências
export function tocarSomConfirmacao(): void {
  try {
    const ctx = getAudioContext()
    const duracaoTotal = 1.3
    const intervaloAlternancia = 0.055
    const inicio = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'triangle'

    // Alterna entre ~1975Hz (Si) e ~2637Hz (Mi) rapidamente, encerrando na nota aguda
    let tempo = inicio
    let alternar = false
    while (tempo < inicio + duracaoTotal - 0.35) {
      osc.frequency.setValueAtTime(alternar ? 2637 : 1975, tempo)
      alternar = !alternar
      tempo += intervaloAlternancia
    }
    osc.frequency.setValueAtTime(2637, tempo)

    gain.gain.setValueAtTime(0.25, inicio)
    gain.gain.setValueAtTime(0.25, inicio + duracaoTotal - 0.1)
    gain.gain.exponentialRampToValueAtTime(0.001, inicio + duracaoTotal)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(inicio)
    osc.stop(inicio + duracaoTotal)
  } catch {
    // Ignora caso o sistema não possua dispositivo de saída de áudio
  }
}