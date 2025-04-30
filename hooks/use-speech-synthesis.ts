"use client"

import { useState, useEffect, useCallback } from "react"

export function useSpeechSynthesis() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [speaking, setSpeaking] = useState(false)
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null)
  const [volume, setVolume] = useState(1) // 0 to 1
  const [rate, setRate] = useState(1) // 0.1 to 10
  const [pitch, setPitch] = useState(1) // 0 to 2

  // Check if browser supports speech synthesis
  const hasSpeechSynthesis = typeof window !== "undefined" && "speechSynthesis" in window

  // Get available voices
  useEffect(() => {
    if (!hasSpeechSynthesis) return

    // Function to get and set voices
    const updateVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices()
      setVoices(availableVoices)

      // Set default voice (prefer English voices)
      if (availableVoices.length > 0 && !voice) {
        const englishVoice = availableVoices.find((v) => v.lang.includes("en-") && v.localService)
        setVoice(englishVoice || availableVoices[0])
      }
    }

    // Chrome loads voices asynchronously
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices
    }

    // Initial load of voices
    updateVoices()

    return () => {
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = null
      }
    }
  }, [hasSpeechSynthesis])

  // Cancel any ongoing speech
  const cancel = useCallback(() => {
    if (!hasSpeechSynthesis) return

    window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [hasSpeechSynthesis])

  // Speak text
  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      if (!hasSpeechSynthesis || !text) return

      // Cancel any ongoing speech
      cancel()

      // Create utterance
      const utterance = new SpeechSynthesisUtterance(text)

      // Set properties
      if (voice) utterance.voice = voice
      utterance.volume = volume
      utterance.rate = rate
      utterance.pitch = pitch

      // Set event handlers
      utterance.onstart = () => setSpeaking(true)
      utterance.onend = () => {
        setSpeaking(false)
        if (onEnd) onEnd()
      }
      utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event)
        setSpeaking(false)
        if (onEnd) onEnd()
      }

      // Speak
      window.speechSynthesis.speak(utterance)
    },
    [hasSpeechSynthesis, voice, volume, rate, pitch, cancel],
  )

  return {
    speak,
    cancel,
    speaking,
    voices,
    setVoice,
    volume,
    setVolume,
    rate,
    setRate,
    pitch,
    setPitch,
    hasSpeechSynthesis,
  }
}
