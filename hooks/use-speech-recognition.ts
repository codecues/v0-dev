"use client"

import { useState, useEffect, useCallback } from "react"

// Add proper type definitions for the Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

interface SpeechRecognitionResult {
  transcript: string
  isFinal: boolean
}

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [hasRecognitionSupport, setHasRecognitionSupport] = useState(false)

  // Check if browser supports speech recognition
  useEffect(() => {
    setHasRecognitionSupport("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
  }, [])

  // Initialize speech recognition
  const recognition = useCallback(() => {
    if (!hasRecognitionSupport) return null

    // Use the appropriate constructor
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognitionInstance = new SpeechRecognition()

    // Configure recognition
    recognitionInstance.continuous = true
    recognitionInstance.interimResults = true
    recognitionInstance.lang = "en-US"

    // Set up event handlers
    recognitionInstance.onstart = () => {
      setIsListening(true)
    }

    recognitionInstance.onend = () => {
      setIsListening(false)
    }

    recognitionInstance.onresult = (event) => {
      const results: SpeechRecognitionResult[] = []

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        results.push({
          transcript: result[0].transcript,
          isFinal: result.isFinal,
        })
      }

      // Get the most recent result
      const mostRecentResult = results[results.length - 1]

      if (mostRecentResult) {
        setTranscript(mostRecentResult.transcript)

        // Clear transcript after processing if it's a final result
        if (mostRecentResult.isFinal) {
          setTimeout(() => {
            setTranscript("")
          }, 1000)
        }
      }
    }

    recognitionInstance.onerror = (event) => {
      console.error("Speech recognition error:", event.error)
      setIsListening(false)
    }

    return recognitionInstance
  }, [hasRecognitionSupport])

  // Start listening
  const startListening = useCallback(() => {
    if (!hasRecognitionSupport) return

    const recognitionInstance = recognition()
    if (recognitionInstance) {
      try {
        recognitionInstance.start()
        setTranscript("")
      } catch (error) {
        console.error("Error starting speech recognition:", error)
      }
    }
  }, [hasRecognitionSupport, recognition])

  // Stop listening
  const stopListening = useCallback(() => {
    if (!hasRecognitionSupport) return

    const recognitionInstance = recognition()
    if (recognitionInstance) {
      try {
        recognitionInstance.stop()
        setTranscript("")
      } catch (error) {
        console.error("Error stopping speech recognition:", error)
      }
    }
  }, [hasRecognitionSupport, recognition])

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    hasRecognitionSupport,
  }
}
