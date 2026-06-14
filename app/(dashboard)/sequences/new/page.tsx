import NewSequenceForm from '@/components/sequences/new-sequence-form'

export default function NewSequencePage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-medium">New sequence</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure your yoga class
        </p>
      </div>
      <NewSequenceForm />
    </div>
  )
}
