"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, CheckCircle2, Volume2, ZoomIn } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"

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

  // Audio elements for feedback
  const successAudio = useRef<HTMLAudioElement | null>(null)
  const errorAudio = useRef<HTMLAudioElement | null>(null)
  const interactionAudio = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Create audio elements
    successAudio.current = new Audio("/success.mp3")
    errorAudio.current = new Audio("/error.mp3")
    interactionAudio.current = new Audio("/click.mp3")

    // Set default volume
    if (successAudio.current) successAudio.current.volume = 0.5
    if (errorAudio.current) errorAudio.current.volume = 0.5
    if (interactionAudio.current) interactionAudio.current.volume = 0.3

    return () => {
      // Cleanup
      successAudio.current = null
      errorAudio.current = null
      interactionAudio.current = null
    }
  }, [])

  // Function to play audio feedback
  const playAudio = (type: "success" | "error" | "interaction") => {
    if (!audioFeedback) return

    switch (type) {
      case "success":
        successAudio.current?.play().catch((e) => console.error("Audio playback failed:", e))
        break
      case "error":
        errorAudio.current?.play().catch((e) => console.error("Audio playback failed:", e))
        break
      case "interaction":
        interactionAudio.current?.play().catch((e) => console.error("Audio playback failed:", e))
        break
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
      announceToScreenReader("Form submitted successfully. Thank you for your feedback.")
    } else {
      // Focus the first field with an error
      const firstErrorField = Object.keys(errors)[0]
      const element = document.getElementById(firstErrorField)
      if (element) {
        element.focus()
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
    <div className="space-y-6">
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
        </CardContent>
      </Card>

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
                  className={`text-xl py-6 px-4 border-2 ${
                    errors.name ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                  } ${getInputContrastClass()}`}
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
                  className={`text-xl py-6 px-4 border-2 ${
                    errors.email ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                  } ${getInputContrastClass()}`}
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
                  className={`text-xl py-6 px-4 border-2 border-gray-300 ${getInputContrastClass()}`}
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
                  className={`space-y-4 ${errors.experience ? `border-2 ${highContrast ? "border-yellow-400" : "border-red-500"} p-4 rounded-md` : ""}`}
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
                  className={`text-xl py-3 px-4 min-h-[150px] border-2 border-gray-300 ${getInputContrastClass()}`}
                  placeholder="Please share your thoughts..."
                  style={formStyle}
                />
              </div>

              <div className="flex items-start space-x-3 pt-4">
                <Checkbox
                  id="contactConsent"
                  checked={formData.contactConsent}
                  onCheckedChange={(checked) => handleChange("contactConsent", Boolean(checked))}
                  className={`h-6 w-6 mt-1 ${highContrast ? "border-yellow-400 text-yellow-400" : ""}`}
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
