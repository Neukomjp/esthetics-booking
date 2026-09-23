'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { BodyMap } from '@/components/counseling/body-map'
import { QuestionSections } from '@/components/counseling/question-sections'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { counselingSections, staffCounselingSections, type BodyMark, type CounselingSheet } from '@/lib/counseling-sheet'
import { getStaffCounselingSheetsAction, saveStaffCounselingNotesAction } from '@/lib/actions/counseling-sheet'

type CustomerSummary = { id: string; name: string; phone: string | null }

export function StaffCounselingClient({ customer }: { customer: CustomerSummary }) {
    const [sheets, setSheets] = useState<CounselingSheet[]>([])
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [staffAnswers, setStaffAnswers] = useState<Record<string, string>>({})
    const [staffMarks, setStaffMarks] = useState<BodyMark[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    function selectSheet(sheet: CounselingSheet) {
        setSelectedId(sheet.id)
        setStaffAnswers(sheet.staffNotes?.answers ?? {})
        setStaffMarks(sheet.staffNotes?.marks ?? [])
    }

    async function loadSheets(selectId?: string) {
        try {
            const data = await getStaffCounselingSheetsAction(customer.id)
            setSheets(data)
            const next = data.find(sheet => sheet.id === selectId) ?? data[0]
            if (next) selectSheet(next)
            else setSelectedId(null)
            setError('')
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : 'シートを読み込めませんでした。')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void loadSheets()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [customer.id])

    async function save() {
        if (!selectedId) return
        setSaving(true)
        try {
            await saveStaffCounselingNotesAction(customer.id, selectedId, { answers: staffAnswers, marks: staffMarks })
            toast.success('所見と施術記録を保存しました。')
            await loadSheets(selectedId)
        } catch (caught) {
            toast.error(caught instanceof Error ? caught.message : '保存できませんでした。')
        } finally {
            setSaving(false)
        }
    }

    const selected = sheets.find(sheet => sheet.id === selectedId)

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild><Link href={`/dashboard/customers/${customer.id}`}><ArrowLeft className="h-4 w-4" /></Link></Button>
                <div>
                    <h1 className="text-2xl font-bold">カウンセリングシート</h1>
                    <p className="text-sm text-muted-foreground">{customer.name} 様・{customer.phone || '電話番号未登録'}</p>
                </div>
            </div>

            {loading ? <p className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />読み込み中...</p> : error ? (
                <Card><CardContent className="pt-6 text-destructive">{error}</CardContent></Card>
            ) : sheets.length === 0 ? (
                <Card><CardContent className="pt-6">お客様から提出されたシートはまだありません。お客様のマイページから記入できます。</CardContent></Card>
            ) : (
                <>
                    <Card>
                        <CardHeader><CardTitle>提出されたシート</CardTitle></CardHeader>
                        <CardContent className="flex flex-wrap gap-2">
                            {sheets.map(sheet => (
                                <Button key={sheet.id} variant={selectedId === sheet.id ? 'default' : 'outline'} onClick={() => selectSheet(sheet)}>
                                    {sheet.consultationDate}{sheet.staffNotes ? '・追記済み' : '・未追記'}
                                </Button>
                            ))}
                        </CardContent>
                    </Card>
                    {selected && (
                        <>
                            <p className="text-lg font-semibold">お客様の回答</p>
                            <QuestionSections sections={counselingSections} answers={selected.answers} idPrefix="staff-patient" />
                            <BodyMap marks={selected.marks} title="お客様が記入した部位" />
                            <p className="text-lg font-semibold">スタッフの追記</p>
                            <QuestionSections sections={staffCounselingSections} answers={staffAnswers} onChange={setStaffAnswers} idPrefix="staff-notes" />
                            <BodyMap
                                marks={staffMarks}
                                overlayMarks={selected.marks}
                                onChange={setStaffMarks}
                                allowedKinds={['needle', 'moxa', 'symptom', 'other']}
                                title="施術部位の記録"
                            />
                            <div className="flex justify-end pb-8">
                                <Button onClick={save} disabled={saving}>{saving ? '保存中...' : 'スタッフの追記を保存'}</Button>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    )
}
