"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertCircle,
  CheckCircle2,
  Mic,
  MicOff,
  Volume2,
  ZoomIn,
  Headphones,
  ChevronRight,
  ChevronLeft,
  HelpCircle,
  Keyboard,
} from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useSpeechRecognition } from "@/hooks/use-speech-recognition"
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis"

// Define the form steps for guided mode
const formSteps = [
  {
    id: "intro",
    title: "Introduction",
    instructions:
      "Welcome to the accessibility survey. This guided mode will help you complete the form step by step. You can use voice commands or keyboard navigation to move through the form. Press the Next button or say 'next' to continue.",
    field: null,
  },
  {
    id: "name",
    title: "Full Name",
    instructions: "Please enter your full name. If you're using voice commands, say 'fill name' followed by your name.",
    field: "name",
  },
  {
    id: "email",
    title: "Email Address",
    instructions:
      "Please enter your email address. If you're using voice commands, say 'fill email' followed by your email.",
    field: "email",
  },
  {
    id: "age",
    title: "Age",
    instructions:
      "Please enter your age. This field is optional. If you're using voice commands, say 'fill age' followed by your age.",
    field: "age",
  },
  {
    id: "experience",
    title: "Experience Rating",
    instructions:
      "How would you rate your experience with our website? Choose from excellent, good, average, poor, or very poor. If you're using voice commands, say the rating you want to select.",
    field: "experience",
  },
  {
    id: "feedback",
    title: "Feedback",
    instructions:
      "Please share any suggestions you have for improving accessibility. If you're using voice commands, say 'fill feedback' followed by your feedback.",
    field: "feedback",
  },
  {
    id: "consent",
    title: "Contact Consent",
    instructions:
      "Would you like to be contacted about your survey responses? If yes, check the consent box. If you're using voice commands, say 'toggle consent' to check or uncheck the box.",
    field: "contactConsent",
  },
  {
    id: "submit",
    title: "Submit Survey",
    instructions:
      "You've completed all the steps. Review your answers and submit the survey when ready. If you're using voice commands, say 'submit form' to submit.",
    field: null,
  },
]

type KeyboardShortcut = {
  key: string
  description: string
  action: () => void
}

export default function AccessibleSurveyForm() {
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    age: "",
    experience: "",
    feedback: "",
    contactConsent: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [zoomLevel, setZoomLevel] = useState(100)
  const [audioFeedback, setAudioFeedback] = useState(true)
  const [highContrast, setHighContrast] = useState(false)
  const [activeField, setActiveField] = useState<string | null>(null)
  const [helpModalOpen, setHelpModalOpen] = useState(false)

  // Guided mode states
  const [guidedMode, setGuidedMode] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [isReadingInstructions, setIsReadingInstructions] = useState(false)

  const [keyboardShortcutsModalOpen, setKeyboardShortcutsModalOpen] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  // Speech recognition
  const { isListening, transcript, startListening, stopListening, hasRecognitionSupport } = useSpeechRecognition()

  // Speech synthesis
  const { speak, speaking, cancel, voices, setVoice, volume, setVolume, rate, setRate } = useSpeechSynthesis()

  // Process voice commands
  useEffect(() => {
    if (!transcript || !isListening) return

    const processCommand = () => {
      const command = transcript.toLowerCase().trim()
      console.log("Processing command:", command)

      // Guided mode specific commands
      if (guidedMode) {
        if (command.includes("next") || command.includes("next step") || command.includes("continue")) {
          handleNextStep()
          return true
        }

        if (command.includes("previous") || command.includes("back") || command.includes("go back")) {
          handlePreviousStep()
          return true
        }

        if (command.includes("repeat") || command.includes("repeat instructions")) {
          readCurrentStepInstructions()
          return true
        }

        if (command.includes("exit guided mode") || command.includes("exit guide")) {
          setGuidedMode(false)
          announceToScreenReader("Exited guided mode")
          return true
        }
      }

      // Navigation commands
      if (command.includes("go to name") || command.includes("fill name")) {
        document.getElementById("name")?.focus()
        setActiveField("name")
        if (guidedMode) goToStep("name")
        announceToScreenReader("Name field activated")
        return true
      }

      if (command.includes("go to email") || command.includes("fill email")) {
        document.getElementById("email")?.focus()
        setActiveField("email")
        if (guidedMode) goToStep("email")
        announceToScreenReader("Email field activated")
        return true
      }

      if (command.includes("go to age") || command.includes("fill age")) {
        document.getElementById("age")?.focus()
        setActiveField("age")
        if (guidedMode) goToStep("age")
        announceToScreenReader("Age field activated")
        return true
      }

      if (command.includes("go to feedback") || command.includes("fill feedback")) {
        document.getElementById("feedback")?.focus()
        setActiveField("feedback")
        if (guidedMode) goToStep("feedback")
        announceToScreenReader("Feedback field activated")
        return true
      }

      if (command.includes("go to experience") || command.includes("rate experience")) {
        document.getElementById("experience-group")?.focus()
        setActiveField("experience")
        if (guidedMode) goToStep("experience")
        announceToScreenReader("Experience rating activated")
        return true
      }

      // Rating commands
      if (activeField === "experience") {
        if (command.includes("excellent") || command.includes("very good")) {
          handleChange("experience", "Excellent")
          announceToScreenReader("Selected Excellent")
          return true
        }
        if (command.includes("good")) {
          handleChange("experience", "Good")
          announceToScreenReader("Selected Good")
          return true
        }
        if (command.includes("average") || command.includes("neutral")) {
          handleChange("experience", "Average")
          announceToScreenReader("Selected Average")
          return true
        }
        if (command.includes("poor") || command.includes("bad")) {
          handleChange("experience", "Poor")
          announceToScreenReader("Selected Poor")
          return true
        }
        if (command.includes("very poor") || command.includes("terrible")) {
          handleChange("experience", "Very Poor")
          announceToScreenReader("Selected Very Poor")
          return true
        }
      }

      // Checkbox commands
      if (command.includes("toggle consent") || command.includes("check consent") || command.includes("consent")) {
        handleChange("contactConsent", !formData.contactConsent)
        announceToScreenReader(formData.contactConsent ? "Consent unchecked" : "Consent checked")
        return true
      }

      // Form submission
      if (command.includes("submit") || command.includes("submit form") || command.includes("send form")) {
        handleSubmit(new Event("submit") as any)
        return true
      }

      // Help command
      if (command.includes("help") || command.includes("commands") || command.includes("what can i say")) {
        setHelpModalOpen(true)
        announceToScreenReader("Voice command help opened")
        return true
      }

      // Guided mode toggle
      if (command.includes("start guided mode") || command.includes("start guide")) {
        setGuidedMode(true)
        setCurrentStep(0)
        announceToScreenReader("Guided mode activated")
        setTimeout(() => readCurrentStepInstructions(), 500)
        return true
      }

      // Text input for active field
      if (activeField && ["name", "email", "age", "feedback"].includes(activeField)) {
        // Check for clear command
        if (command.includes("clear") || command.includes("clear field") || command.includes("delete")) {
          handleChange(activeField, "")
          announceToScreenReader(`${activeField} field cleared`)
          return true
        }

        // Check for specific text input commands
        if (command.startsWith("type ") || command.startsWith("enter ") || command.startsWith("input ")) {
          const text = command.replace(/^(type|enter|input)\s+/, "")
          handleChange(activeField, text)
          announceToScreenReader(`Entered: ${text}`)
          return true
        }

        // If no specific command prefix, use the entire transcript as input
        if (!command.includes("go to") && !command.includes("submit") && !command.includes("toggle")) {
          handleChange(activeField, transcript)
          announceToScreenReader(`Entered: ${transcript}`)
          return true
        }
      }

      // Stop listening command
      if (command.includes("stop listening") || command.includes("stop recognition")) {
        stopListening()
        announceToScreenReader("Voice recognition stopped")
        return true
      }

      return false
    }

    const commandProcessed = processCommand()
    if (!commandProcessed) {
      announceToScreenReader("Command not recognized. Try again or say 'help' for available commands.")
    }
  }, [transcript, isListening, activeField, guidedMode, currentStep])

  // Function to play audio feedback using Web Audio API
  const playAudio = (
    type: "success" | "error" | "interaction" | "recognition-start" | "recognition-end" | "step-change",
  ) => {
    if (!audioFeedback) return

    try {
      // Create audio context
      const AudioContext = window.AudioContext || window.webkitAudioContext
      const audioContext = new AudioContext()

      // Create oscillator
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      // Connect nodes
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      // Configure sound based on type
      switch (type) {
        case "success":
          oscillator.type = "sine"
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
          oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1)
          gainNode.gain.setValueAtTime(0.5, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
          oscillator.start()
          oscillator.stop(audioContext.currentTime + 0.3)
          break
        case "error":
          oscillator.type = "sawtooth"
          oscillator.frequency.setValueAtTime(300, audioContext.currentTime)
          oscillator.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.2)
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
          oscillator.start()
          oscillator.stop(audioContext.currentTime + 0.2)
          break
        case "interaction":
          oscillator.type = "sine"
          oscillator.frequency.setValueAtTime(600, audioContext.currentTime)
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
          oscillator.start()
          oscillator.stop(audioContext.currentTime + 0.1)
          break
        case "recognition-start":
          oscillator.type = "sine"
          oscillator.frequency.setValueAtTime(440, audioContext.currentTime)
          oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.2)
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
          oscillator.start()
          oscillator.stop(audioContext.currentTime + 0.2)
          break
        case "recognition-end":
          oscillator.type = "sine"
          oscillator.frequency.setValueAtTime(880, audioContext.currentTime)
          oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.2)
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
          oscillator.start()
          oscillator.stop(audioContext.currentTime + 0.2)
          break
        case "step-change":
          oscillator.type = "triangle"
          oscillator.frequency.setValueAtTime(660, audioContext.currentTime)
          oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.1)
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
          oscillator.start()
          oscillator.stop(audioContext.currentTime + 0.2)
          break
      }
    } catch (error) {
      console.error("Audio playback failed:", error)
      // Silently fail if Web Audio API is not supported
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid"
    }

    if (!formData.experience) {
      newErrors.experience = "Please select an option"
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) {
      playAudio("error")
      // Announce errors for screen readers
      const errorMessage = `Form has ${Object.keys(newErrors).length} errors. ${Object.values(newErrors).join(". ")}`
      announceToScreenReader(errorMessage)

      if (guidedMode) {
        // In guided mode, speak the errors
        speak(errorMessage)
      }
    }

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      // In a real application, you would submit the form data to your backend
      console.log("Form submitted:", formData)
      setSubmitted(true)
      playAudio("success")

      const successMessage = "Form submitted successfully. Thank you for your feedback."
      announceToScreenReader(successMessage)

      if (guidedMode) {
        speak(successMessage)
      }
    } else {
      // Focus the first field with an error
      const firstErrorField = Object.keys(errors)[0]
      const element = document.getElementById(firstErrorField)
      if (element) {
        element.focus()

        if (guidedMode) {
          // In guided mode, go to the step with the error
          goToStep(firstErrorField)
        }
      }
    }
  }

  const handleChange = (field: string, value: string | boolean) => {
    playAudio("interaction")

    setFormData({
      ...formData,
      [field]: value,
    })

    // Clear error when field is updated
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: "",
      })
    }

    // In guided mode, provide feedback about the change
    if (guidedMode) {
      if (field === "contactConsent") {
        speak(`Consent ${value ? "checked" : "unchecked"}.`)
      } else if (field === "experience") {
        speak(`Selected ${value}.`)
      } else if (value) {
        speak(`Entered: ${value}`)
      }
    }
  }

  // Function to announce messages to screen readers
  const announceToScreenReader = (message: string) => {
    // Create or update the live region
    let liveRegion = document.getElementById("screen-reader-announcer")
    if (!liveRegion) {
      liveRegion = document.createElement("div")
      liveRegion.id = "screen-reader-announcer"
      liveRegion.className = "sr-only"
      liveRegion.setAttribute("aria-live", "assertive")
      liveRegion.setAttribute("aria-atomic", "true")
      document.body.appendChild(liveRegion)
    }

    // Set the message
    liveRegion.textContent = message

    // Clear after a delay to prevent multiple announcements from stacking
    setTimeout(() => {
      if (liveRegion) liveRegion.textContent = ""
    }, 3000)
  }

  // Handle focus events to track active field
  const handleFocus = (fieldName: string) => {
    setActiveField(fieldName)

    // In guided mode, update the current step when a field gets focus
    if (guidedMode) {
      const stepIndex = formSteps.findIndex((step) => step.field === fieldName)
      if (stepIndex !== -1) {
        setCurrentStep(stepIndex)
      }
    }
  }

  // Toggle speech recognition
  const toggleSpeechRecognition = () => {
    if (isListening) {
      stopListening()
      playAudio("recognition-end")
      announceToScreenReader("Voice recognition stopped")
    } else {
      startListening()
      playAudio("recognition-start")
      announceToScreenReader("Voice recognition started. Say 'help' for available commands.")
    }
  }

  // Guided mode functions
  const toggleGuidedMode = () => {
    const newGuidedMode = !guidedMode
    setGuidedMode(newGuidedMode)

    if (newGuidedMode) {
      // Start at the beginning when entering guided mode
      setCurrentStep(0)
      announceToScreenReader("Guided mode activated")

      // Read the instructions after a short delay
      setTimeout(() => readCurrentStepInstructions(), 500)
    } else {
      // Cancel any ongoing speech when exiting guided mode
      cancel()
      announceToScreenReader("Guided mode deactivated")
    }
  }

  const readCurrentStepInstructions = () => {
    if (!guidedMode || currentStep >= formSteps.length) return

    const step = formSteps[currentStep]
    setIsReadingInstructions(true)

    // Combine step title and instructions
    const textToSpeak = `Step ${currentStep + 1} of ${formSteps.length}: ${step.title}. ${step.instructions}`

    speak(textToSpeak, () => {
      setIsReadingInstructions(false)
    })
  }

  const handleNextStep = () => {
    if (currentStep < formSteps.length - 1) {
      // Cancel any ongoing speech
      cancel()

      // Move to next step
      setCurrentStep((prev) => prev + 1)
      playAudio("step-change")

      // Focus the field for the new step
      const nextStep = formSteps[currentStep + 1]
      if (nextStep.field) {
        const element = document.getElementById(nextStep.field)
        if (element) {
          element.focus()
          setActiveField(nextStep.field)
        }
      }

      // Read the instructions for the new step after a short delay
      setTimeout(() => readCurrentStepInstructions(), 500)
    } else {
      // At the last step, attempt to submit the form
      handleSubmit(new Event("submit") as any)
    }
  }

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      // Cancel any ongoing speech
      cancel()

      // Move to previous step
      setCurrentStep((prev) => prev - 1)
      playAudio("step-change")

      // Focus the field for the new step
      const prevStep = formSteps[currentStep - 1]
      if (prevStep.field) {
        const element = document.getElementById(prevStep.field)
        if (element) {
          element.focus()
          setActiveField(prevStep.field)
        }
      }

      // Read the instructions for the new step after a short delay
      setTimeout(() => readCurrentStepInstructions(), 500)
    }
  }

  const handleKeyboardShortcuts = (e: KeyboardEvent) => {
    // Only process shortcuts if guided mode is active
    if (!guidedMode) return

    // Don't process shortcuts if user is typing in an input field
    const activeElement = document.activeElement
    const isInputActive =
      activeElement instanceof HTMLInputElement ||
      activeElement instanceof HTMLTextAreaElement ||
      activeElement instanceof HTMLSelectElement

    // Allow Escape key to work even when in input fields
    if (e.key === "Escape" && !e.ctrlKey && !e.altKey && !e.shiftKey) {
      if (keyboardShortcutsModalOpen) {
        setKeyboardShortcutsModalOpen(false)
        e.preventDefault()
        return
      }
    }

    // Don't process other shortcuts if user is typing in an input
    if (isInputActive && e.key !== "?") return

    // Process keyboard shortcuts
    switch (e.key) {
      case "ArrowRight":
      case "n":
        if (!e.ctrlKey && !e.altKey && !e.shiftKey) {
          handleNextStep()
          e.preventDefault()
        }
        break
      case "ArrowLeft":
      case "p":
        if (!e.ctrlKey && !e.altKey && !e.shiftKey) {
          handlePreviousStep()
          e.preventDefault()
        }
        break
      case "r":
        if (!e.ctrlKey && !e.altKey && !e.shiftKey) {
          readCurrentStepInstructions()
          e.preventDefault()
        }
        break
      case "g":
        if (!e.ctrlKey && !e.altKey && !e.shiftKey) {
          toggleGuidedMode()
          e.preventDefault()
        }
        break
      case "s":
        if (!e.ctrlKey && !e.altKey && !e.shiftKey && currentStep === formSteps.length - 1) {
          handleSubmit(new Event("submit") as any)
          e.preventDefault()
        }
        break
      case "?":
        if (!e.ctrlKey && !e.altKey && !e.shiftKey) {
          setKeyboardShortcutsModalOpen(true)
          e.preventDefault()
        }
        break
      case "1":
      case "2":
      case "3":
      case "4":
      case "5":
      case "6":
      case "7":
      case "8":
        if (e.altKey && !e.ctrlKey && !e.shiftKey) {
          const stepIndex = Number.parseInt(e.key) - 1
          if (stepIndex >= 0 && stepIndex < formSteps.length) {
            setCurrentStep(stepIndex)
            const step = formSteps[stepIndex]
            if (step.field) {
              const element = document.getElementById(step.field)
              if (element) {
                element.focus()
                setActiveField(step.field)
              }
            }
            setTimeout(() => readCurrentStepInstructions(), 500)
            e.preventDefault()
          }
        }
        break
    }
  }

  const goToStep = (fieldName: string) => {
    const stepIndex = formSteps.findIndex((step) => step.field === fieldName)
    if (stepIndex !== -1) {
      // Cancel any ongoing speech
      cancel()

      // Set the current step
      setCurrentStep(stepIndex)
      playAudio("step-change")

      // Read the instructions for the new step after a short delay
      setTimeout(() => readCurrentStepInstructions(), 500)
    }
  }

  // Apply zoom level to the form content
  const formStyle = {
    fontSize: `${Math.max(100, zoomLevel)}%`,
    lineHeight: zoomLevel > 150 ? "1.8" : "1.5",
  }

  // Apply high contrast if enabled
  const getContrastClass = () => {
    if (!highContrast) return ""
    return "bg-black text-white border-yellow-400"
  }

  const getInputContrastClass = () => {
    if (!highContrast) return ""
    return "bg-black text-white border-yellow-400 placeholder-gray-400"
  }

  useEffect(() => {
    // Add keyboard event listener
    window.addEventListener("keydown", handleKeyboardShortcuts)

    // Clean up
    return () => {
      window.removeEventListener("keydown", handleKeyboardShortcuts)
    }
  }, [guidedMode, currentStep, speaking, keyboardShortcutsModalOpen])

  const getKeyboardShortcuts = (): KeyboardShortcut[] => {
    return [
      {
        key: "→ or N",
        description: "Move to next step",
        action: handleNextStep,
      },
      {
        key: "← or P",
        description: "Move to previous step",
        action: handlePreviousStep,
      },
      {
        key: "R",
        description: "Repeat current instructions",
        action: readCurrentStepInstructions,
      },
      {
        key: "G",
        description: "Toggle guided mode",
        action: toggleGuidedMode,
      },
      {
        key: "S",
        description: "Submit form (on last step)",
        action: () => {
          if (currentStep === formSteps.length - 1) {
            handleSubmit(new Event("submit") as any)
          }
        },
      },
      {
        key: "Alt + 1-8",
        description: "Jump to specific step",
        action: () => {
          announceToScreenReader("Press Alt plus a number from 1 to 8 to jump to that step")
        },
      },
      {
        key: "?",
        description: "Show keyboard shortcuts",
        action: () => setKeyboardShortcutsModalOpen(true),
      },
      {
        key: "Esc",
        description: "Close dialogs",
        action: () => {
          setKeyboardShortcutsModalOpen(false)
          setHelpModalOpen(false)
        },
      },
    ]
  }

  // Voice command help modal
  const VoiceCommandHelp = () => (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${helpModalOpen ? "" : "hidden"}`}
    >
      <div
        className={`bg-white p-6 rounded-lg max-w-2xl max-h-[80vh] overflow-y-auto ${highContrast ? "bg-black text-white border-2 border-yellow-400" : ""}`}
      >
        <h2 className="text-2xl font-bold mb-4" style={formStyle}>
          Voice Command Help
        </h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold mb-2" style={formStyle}>
              Navigation Commands
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              <li style={formStyle}>"Go to name" - Focus the name field</li>
              <li style={formStyle}>"Go to email" - Focus the email field</li>
              <li style={formStyle}>"Go to age" - Focus the age field</li>
              <li style={formStyle}>"Go to feedback" - Focus the feedback field</li>
              <li style={formStyle}>"Go to experience" - Focus the experience rating</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2" style={formStyle}>
              Input Commands
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              <li style={formStyle}>"Type [text]" - Enter text in the active field</li>
              <li style={formStyle}>"Clear" - Clear the active field</li>
              <li style={formStyle}>
                "Excellent/Good/Average/Poor/Very Poor" - Select rating (when experience is active)
              </li>
              <li style={formStyle}>"Toggle consent" - Check or uncheck the consent box</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2" style={formStyle}>
              Form Commands
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              <li style={formStyle}>"Submit form" - Submit the survey</li>
              <li style={formStyle}>"Help" - Show this help dialog</li>
              <li style={formStyle}>"Stop listening" - Turn off voice recognition</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2" style={formStyle}>
              Guided Mode Commands
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              <li style={formStyle}>"Start guided mode" - Start the step-by-step guide</li>
              <li style={formStyle}>"Next" or "Continue" - Move to the next step</li>
              <li style={formStyle}>"Previous" or "Back" - Move to the previous step</li>
              <li style={formStyle}>"Repeat" - Repeat the current instructions</li>
              <li style={formStyle}>"Exit guided mode" - Exit the guided mode</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2" style={formStyle}>
              Keyboard Shortcuts
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              <li style={formStyle}>"→" or "N" - Move to next step</li>
              <li style={formStyle}>"←" or "P" - Move to previous step</li>
              <li style={formStyle}>"R" - Repeat current instructions</li>
              <li style={formStyle}>"G" - Toggle guided mode</li>
              <li style={formStyle}>"S" - Submit form (on last step)</li>
              <li style={formStyle}>"Alt + 1-8" - Jump to specific step</li>
              <li style={formStyle}>"?" - Show keyboard shortcuts</li>
              <li style={formStyle}>"Esc" - Close dialogs</li>
            </ul>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button
            onClick={() => setHelpModalOpen(false)}
            className={highContrast ? "bg-yellow-500 text-black hover:bg-yellow-600" : ""}
            style={formStyle}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  )

  const KeyboardShortcutsHelp = () => (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${keyboardShortcutsModalOpen ? "" : "hidden"}`}
    >
      <div
        className={`bg-white p-6 rounded-lg max-w-2xl max-h-[80vh] overflow-y-auto ${highContrast ? "bg-black text-white border-2 border-yellow-400" : ""}`}
      >
        <h2 className="text-2xl font-bold mb-4 flex items-center" style={formStyle}>
          <Keyboard className="mr-2 h-6 w-6" /> Keyboard Shortcuts
        </h2>
        <div className="space-y-4">
          <p className="text-lg" style={formStyle}>
            The following keyboard shortcuts are available in guided mode:
          </p>
          <div className="grid grid-cols-2 gap-4">
            {getKeyboardShortcuts().map((shortcut, index) => (
              <div key={index} className="flex items-start space-x-2">
                <kbd
                  className={`px-2 py-1 text-sm font-semibold rounded ${
                    highContrast
                      ? "bg-gray-800 text-yellow-400 border border-yellow-400"
                      : "bg-gray-100 text-gray-800 border border-gray-300"
                  }`}
                >
                  {shortcut.key}
                </kbd>
                <span style={formStyle}>{shortcut.description}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button
            onClick={() => setKeyboardShortcutsModalOpen(false)}
            className={highContrast ? "bg-yellow-500 text-black hover:bg-yellow-600" : ""}
            style={formStyle}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  )

  if (submitted) {
    return (
      <Card
        className={`w-full max-w-3xl mx-auto ${highContrast ? "bg-black text-white border-yellow-400" : "bg-green-50 border-green-200"}`}
      >
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className={`h-8 w-8 ${highContrast ? "text-yellow-400" : "text-green-600"}`} />
            <CardTitle className={`text-3xl ${highContrast ? "text-white" : "text-green-800"}`} style={formStyle}>
              Thank You!
            </CardTitle>
          </div>
          <CardDescription className={`text-xl ${highContrast ? "text-gray-300" : "text-green-700"}`} style={formStyle}>
            Your survey response has been submitted successfully.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className={`text-lg ${highContrast ? "text-gray-300" : "text-green-700"}`} style={formStyle}>
            We appreciate your feedback. It will help us improve our services.
          </p>
        </CardContent>
        <CardFooter>
          <Button
            size="lg"
            className={`text-lg py-6 px-8 ${
              highContrast ? "bg-yellow-500 hover:bg-yellow-600 text-black" : "bg-green-600 hover:bg-green-700"
            }`}
            onClick={() => {
              playAudio("interaction")
              setSubmitted(false)
              setFormData({
                name: "",
                email: "",
                age: "",
                experience: "",
                feedback: "",
                contactConsent: false,
              })
            }}
            style={formStyle}
          >
            Submit Another Response
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <div className="space-y-6" ref={formRef}>
      {/* Voice Command Help Modal */}
      <VoiceCommandHelp />
      <KeyboardShortcutsHelp />

      {/* Accessibility Controls */}
      <Card className={`w-full max-w-3xl mx-auto border-2 ${getContrastClass()}`}>
        <CardHeader>
          <CardTitle className="text-2xl" style={formStyle}>
            Accessibility Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="zoom-level" className="text-xl font-bold" style={formStyle}>
                <ZoomIn className="inline mr-2" /> Text Size: {zoomLevel}%
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoomLevel(100)}
                className={highContrast ? "border-yellow-400 text-yellow-400" : ""}
              >
                Reset
              </Button>
            </div>
            <Slider
              id="zoom-level"
              min={100}
              max={200}
              step={10}
              value={[zoomLevel]}
              onValueChange={(value) => {
                setZoomLevel(value[0])
                playAudio("interaction")
              }}
              className={highContrast ? "bg-gray-800" : ""}
            />
          </div>

          <div className="flex items-center space-x-4">
            <Label htmlFor="audio-feedback" className="text-xl font-bold cursor-pointer" style={formStyle}>
              <Volume2 className="inline mr-2" /> Audio Feedback
            </Label>
            <Switch
              id="audio-feedback"
              checked={audioFeedback}
              onCheckedChange={(checked) => {
                setAudioFeedback(checked)
                if (checked) playAudio("interaction")
              }}
            />
          </div>

          <div className="flex items-center space-x-4">
            <Label htmlFor="high-contrast" className="text-xl font-bold cursor-pointer" style={formStyle}>
              High Contrast Mode
            </Label>
            <Switch
              id="high-contrast"
              checked={highContrast}
              onCheckedChange={(checked) => {
                setHighContrast(checked)
                playAudio("interaction")
              }}
            />
          </div>

          <div className="flex items-center space-x-4">
            <Label htmlFor="guided-mode" className="text-xl font-bold cursor-pointer" style={formStyle}>
              <Headphones className="inline mr-2" /> Guided Mode
              <span className={`ml-2 text-sm ${highContrast ? "text-gray-300" : "text-gray-500"}`}>(Press G)</span>
            </Label>
            <Switch id="guided-mode" checked={guidedMode} onCheckedChange={() => toggleGuidedMode()} />
          </div>

          {guidedMode && (
            <div className="space-y-4 p-4 border rounded-md">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold" style={formStyle}>
                  Voice Settings
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={readCurrentStepInstructions}
                  disabled={isReadingInstructions || speaking}
                  className={highContrast ? "border-yellow-400 text-yellow-400" : ""}
                >
                  <HelpCircle className="h-4 w-4 mr-1" /> Repeat Instructions
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="voice-volume" className="text-base" style={formStyle}>
                    Volume: {Math.round(volume * 100)}%
                  </Label>
                </div>
                <Slider
                  id="voice-volume"
                  min={0}
                  max={1}
                  step={0.1}
                  value={[volume]}
                  onValueChange={(value) => setVolume(value[0])}
                  className={highContrast ? "bg-gray-800" : ""}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="voice-rate" className="text-base" style={formStyle}>
                    Speech Rate: {rate}x
                  </Label>
                </div>
                <Slider
                  id="voice-rate"
                  min={0.5}
                  max={2}
                  step={0.1}
                  value={[rate]}
                  onValueChange={(value) => setRate(value[0])}
                  className={highContrast ? "bg-gray-800" : ""}
                />
              </div>

              {voices.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="voice-select" className="text-base" style={formStyle}>
                    Voice
                  </Label>
                  <select
                    id="voice-select"
                    className={`w-full p-2 rounded-md border ${getInputContrastClass()}`}
                    onChange={(e) => {
                      const selectedVoice = voices.find((v) => v.name === e.target.value)
                      if (selectedVoice) setVoice(selectedVoice)
                    }}
                    style={formStyle}
                  >
                    {voices.map((voice) => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {hasRecognitionSupport && (
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xl font-bold" style={formStyle}>
                  <Mic className="inline mr-2" /> Voice Commands
                </Label>
                <Button
                  onClick={toggleSpeechRecognition}
                  variant={isListening ? "destructive" : "default"}
                  className={`${isListening ? "bg-red-500" : ""} ${
                    highContrast && !isListening ? "bg-yellow-500 text-black hover:bg-yellow-600" : ""
                  }`}
                  style={formStyle}
                >
                  {isListening ? (
                    <>
                      <MicOff className="mr-2 h-4 w-4" /> Stop Listening
                    </>
                  ) : (
                    <>
                      <Mic className="mr-2 h-4 w-4" /> Start Voice Input
                    </>
                  )}
                </Button>
              </div>

              {isListening && (
                <div className={`p-3 rounded-md ${highContrast ? "bg-gray-800" : "bg-gray-100"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium" style={formStyle}>
                      Listening...
                    </span>
                    <Badge
                      variant="outline"
                      className={`animate-pulse ${highContrast ? "border-yellow-400 text-yellow-400" : "border-red-500 text-red-500"}`}
                    >
                      Active
                    </Badge>
                  </div>
                  <p className={`text-sm ${highContrast ? "text-gray-300" : "text-gray-600"}`} style={formStyle}>
                    Say "help" for available commands
                  </p>
                  {transcript && (
                    <div className="mt-2 p-2 rounded bg-white bg-opacity-20">
                      <p className="font-medium" style={formStyle}>
                        Heard: {transcript}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Guided Mode Progress Bar */}
      {guidedMode && (
        <div className="w-full max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-lg font-medium ${highContrast ? "text-white" : ""}`} style={formStyle}>
              Step {currentStep + 1} of {formSteps.length}: {formSteps[currentStep].title}
            </span>
            <span className={`text-sm ${highContrast ? "text-gray-300" : "text-gray-500"}`} style={formStyle}>
              {Math.round(((currentStep + 1) / formSteps.length) * 100)}% Complete
            </span>
          </div>
          <Progress
            value={((currentStep + 1) / formSteps.length) * 100}
            className={highContrast ? "bg-gray-800" : ""}
          />

          <div
            className={`mt-2 p-4 rounded-md ${highContrast ? "bg-gray-800 text-white" : "bg-blue-50 text-blue-800"}`}
          >
            <p style={formStyle}>{formSteps[currentStep].instructions}</p>
            <p className={`mt-2 text-sm ${highContrast ? "text-gray-400" : "text-gray-600"}`} style={formStyle}>
              Press{" "}
              <kbd
                className={`px-1 py-0.5 text-xs rounded ${highContrast ? "bg-gray-800 text-yellow-400 border border-yellow-400" : "bg-gray-100 text-gray-800 border border-gray-300"}`}
              >
                ?
              </kbd>{" "}
              for keyboard shortcuts
            </p>

            <div className="flex justify-between mt-4">
              <Button
                variant="outline"
                onClick={handlePreviousStep}
                disabled={currentStep === 0 || speaking}
                className={highContrast ? "border-yellow-400 text-yellow-400" : ""}
              >
                <ChevronLeft className="mr-1 h-4 w-4" /> Previous
              </Button>

              <Button
                variant="outline"
                onClick={() => setKeyboardShortcutsModalOpen(true)}
                className={`mx-2 ${highContrast ? "border-yellow-400 text-yellow-400" : ""}`}
              >
                <Keyboard className="mr-1 h-4 w-4" /> Shortcuts
              </Button>

              <Button
                onClick={handleNextStep}
                disabled={speaking}
                className={highContrast ? "bg-yellow-500 text-black hover:bg-yellow-600" : ""}
              >
                {currentStep === formSteps.length - 1 ? "Submit" : "Next"} <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Survey Form */}
      <Card className={`w-full max-w-3xl mx-auto border-2 ${getContrastClass()}`}>
        <CardHeader className="space-y-2">
          <CardTitle className="text-3xl" style={formStyle}>
            Accessibility Survey
          </CardTitle>
          <CardDescription className={`text-xl ${highContrast ? "text-gray-300" : ""}`} style={formStyle}>
            Please share your experiences to help us improve accessibility.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <div>
                <Label htmlFor="name" className="text-xl font-bold block mb-2" style={formStyle}>
                  Full Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  onFocus={() => handleFocus("name")}
                  className={`text-xl py-6 px-4 border-2 ${
                    errors.name ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                  } ${getInputContrastClass()} ${activeField === "name" ? "ring-2 ring-blue-500" : ""}`}
                  aria-describedby={errors.name ? "name-error" : undefined}
                  aria-invalid={errors.name ? "true" : "false"}
                  style={formStyle}
                />
                {errors.name && (
                  <div
                    id="name-error"
                    className={`flex items-center mt-2 ${highContrast ? "text-yellow-400" : "text-red-600"} text-lg`}
                    style={formStyle}
                  >
                    <AlertCircle className="h-5 w-5 mr-1" />
                    <span>{errors.name}</span>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="email" className="text-xl font-bold block mb-2" style={formStyle}>
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  onFocus={() => handleFocus("email")}
                  className={`text-xl py-6 px-4 border-2 ${
                    errors.email ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                  } ${getInputContrastClass()} ${activeField === "email" ? "ring-2 ring-blue-500" : ""}`}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  aria-invalid={errors.email ? "true" : "false"}
                  style={formStyle}
                />
                {errors.email && (
                  <div
                    id="email-error"
                    className={`flex items-center mt-2 ${highContrast ? "text-yellow-400" : "text-red-600"} text-lg`}
                    style={formStyle}
                  >
                    <AlertCircle className="h-5 w-5 mr-1" />
                    <span>{errors.email}</span>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="age" className="text-xl font-bold block mb-2" style={formStyle}>
                  Age (Optional)
                </Label>
                <Input
                  id="age"
                  type="number"
                  min="0"
                  max="120"
                  value={formData.age}
                  onChange={(e) => handleChange("age", e.target.value)}
                  onFocus={() => handleFocus("age")}
                  className={`text-xl py-6 px-4 border-2 border-gray-300 ${getInputContrastClass()} ${
                    activeField === "age" ? "ring-2 ring-blue-500" : ""
                  }`}
                  style={formStyle}
                />
              </div>

              <div className="space-y-3">
                <Label id="experience-group" className="text-xl font-bold block mb-2" style={formStyle}>
                  How would you rate your experience with our website?
                </Label>
                <RadioGroup
                  aria-labelledby="experience-group"
                  value={formData.experience}
                  onValueChange={(value) => handleChange("experience", value)}
                  onFocus={() => handleFocus("experience")}
                  className={`space-y-4 ${
                    errors.experience
                      ? `border-2 ${highContrast ? "border-yellow-400" : "border-red-500"} p-4 rounded-md`
                      : ""
                  } ${activeField === "experience" ? "ring-2 ring-blue-500 p-4 rounded-md" : ""}`}
                >
                  {["Excellent", "Good", "Average", "Poor", "Very Poor"].map((option) => (
                    <div key={option} className="flex items-center space-x-3">
                      <RadioGroupItem
                        id={option.toLowerCase().replace(" ", "-")}
                        value={option}
                        className={`h-6 w-6 ${highContrast ? "border-yellow-400 text-yellow-400" : ""}`}
                      />
                      <Label
                        htmlFor={option.toLowerCase().replace(" ", "-")}
                        className="text-xl font-medium cursor-pointer"
                        style={formStyle}
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {errors.experience && (
                  <div
                    className={`flex items-center mt-2 ${highContrast ? "text-yellow-400" : "text-red-600"} text-lg`}
                    style={formStyle}
                  >
                    <AlertCircle className="h-5 w-5 mr-1" />
                    <span>{errors.experience}</span>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="feedback" className="text-xl font-bold block mb-2" style={formStyle}>
                  Do you have any suggestions for improving accessibility?
                </Label>
                <Textarea
                  id="feedback"
                  value={formData.feedback}
                  onChange={(e) => handleChange("feedback", e.target.value)}
                  onFocus={() => handleFocus("feedback")}
                  className={`text-xl py-3 px-4 min-h-[150px] border-2 border-gray-300 ${getInputContrastClass()} ${
                    activeField === "feedback" ? "ring-2 ring-blue-500" : ""
                  }`}
                  placeholder="Please share your thoughts..."
                  style={formStyle}
                />
              </div>

              <div className="flex items-start space-x-3 pt-4">
                <Checkbox
                  id="contactConsent"
                  checked={formData.contactConsent}
                  onCheckedChange={(checked) => handleChange("contactConsent", Boolean(checked))}
                  onFocus={() => handleFocus("contactConsent")}
                  className={`h-6 w-6 mt-1 ${highContrast ? "border-yellow-400 text-yellow-400" : ""} ${
                    activeField === "contactConsent" ? "ring-2 ring-blue-500" : ""
                  }`}
                />
                <Label
                  htmlFor="contactConsent"
                  className="text-xl font-medium leading-tight cursor-pointer"
                  style={formStyle}
                >
                  I consent to being contacted about my survey responses
                </Label>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            onClick={handleSubmit}
            size="lg"
            className={`w-full text-xl py-6 font-bold ${
              highContrast ? "bg-yellow-500 hover:bg-yellow-600 text-black" : ""
            }`}
            style={formStyle}
          >
            Submit Survey
          </Button>
        </CardFooter>
      </Card>

      {/* Hidden audio elements for feedback */}
      <div className="sr-only">
        <div id="screen-reader-announcer" aria-live="assertive" aria-atomic="true"></div>
      </div>
    </div>
  )
}
