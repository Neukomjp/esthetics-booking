import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { CounselingSection } from '@/lib/counseling-sheet'

type Props = {
    sections: CounselingSection[]
    answers: Record<string, string>
    onChange?: (answers: Record<string, string>) => void
    idPrefix: string
}

export function QuestionSections({ sections, answers, onChange, idPrefix }: Props) {
    return (
        <div className="space-y-5">
            {sections.map(section => (
                <Card key={section.title}>
                    <CardHeader>
                        <CardTitle>{section.title}</CardTitle>
                        {section.description && <CardDescription>{section.description}</CardDescription>}
                    </CardHeader>
                    <CardContent className="grid gap-5 sm:grid-cols-2">
                        {section.fields.map(field => {
                            const id = `${idPrefix}-${field.id}`
                            return (
                                <div key={field.id} className={field.multiline ? 'space-y-2 sm:col-span-2' : 'space-y-2'}>
                                    <Label htmlFor={id}>{field.label}</Label>
                                    {onChange ? field.multiline ? (
                                        <Textarea
                                            id={id}
                                            value={answers[field.id] ?? ''}
                                            onChange={event => onChange({ ...answers, [field.id]: event.target.value })}
                                            placeholder={field.hint}
                                            maxLength={2000}
                                            rows={3}
                                        />
                                    ) : (
                                        <Input
                                            id={id}
                                            value={answers[field.id] ?? ''}
                                            onChange={event => onChange({ ...answers, [field.id]: event.target.value })}
                                            placeholder={field.hint}
                                            maxLength={2000}
                                        />
                                    ) : (
                                        <div id={id} className="min-h-10 rounded-md border bg-slate-50 px-3 py-2 text-sm whitespace-pre-wrap">
                                            {answers[field.id] || '—'}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
