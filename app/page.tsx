import AccessibleSurveyForm from "@/components/accessible-survey-form"

export default function Home() {
  return (
    <main className="container mx-auto py-10 px-4">
      <h1 className="text-4xl font-bold mb-8 text-center">Accessibility Survey</h1>
      <AccessibleSurveyForm />
    </main>
  )
}
