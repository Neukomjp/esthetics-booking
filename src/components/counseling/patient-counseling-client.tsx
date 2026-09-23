'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Plus } from 'lucide-react'
import { BodyMap } from '@/components/counseling/body-map'
import { QuestionSections } from '@/components/counseling/question-sections'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { counselingSections, type BodyMark, type CounselingSheet } from '@/lib/counseling-sheet'
import { getMyCounselingSheetsAction, submitMyCounselingSheetAction } from '@/lib/actions/counseling-sheet'

type CustomerSummary = { id: string; name: string; phone: string | null }

function todayInJapan() {
    return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' })
}

export function PatientCounselingClient({ customer }: { customer: CustomerSummary }) {
    const [sheets, setSheets] = useState<CounselingSheet[]>([])
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [writing, setWriting] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [consultationDate, setConsultationDate] = useState(todayInJapan)
    const [answers, setAnswers] = useState<Record<string, string>>({})
    const [marks, setMarks] = useState<BodyMark[]>([])

    async function loadSheets(selectId?: string) {
        try {
            const data = await getMyCounselingSheetsAction(customer.id)
            setSheets(data)
            setSelectedId(selectId ?? data[0]?.id ?? null)
            setWriting(data.length === 0)
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

    async function submit() {
        if (!consultationDate || !answers.chiefComplaint?.trim()) {
            toast.error('記入日と主訴を入力してください。')
            return
        }
        setSaving(true)
        try {
            const id = await submitMyCounselingSheetAction(customer.id, { consultationDate, answers, marks })
            toast.success('カウンセリングシートを提出しました。')
            setAnswers({})
            setMarks([])
            setConsultationDate(todayInJapan())
            await loadSheets(id)
        } catch (caught) {
            toast.error(caught instanceof Error ? caught.message : '保存できませんでした。')
        } finally {
            setSaving(false)
        }
    }

    const selected = sheets.find(sheet => sheet.id === selectedId)

    return (
        <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
            <div className="flex flex-wrap items-center gap-3">
                <Button variant="ghost" size="icon" asChild><Link href="/mypage"><ArrowLeft className="h-4 w-4" /></Link></Button>
                <div>
                    <h1 className="text-2xl font-bold">カウンセリングシート</h1>
                    <p className="text-sm text-muted-foreground">{customer.name} 様</p>
                </div>
                {!writing && <Button className="ml-auto" onClick={() => setWriting(true)}><Plus className="mr-2 h-4 w-4" />新しく記入</Button>}
            </div>

            {loading ? <p className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />読み込み中...</p> : error ? (
                <Card><CardContent className="pt-6 text-destructive">{error}</CardContent></Card>
            ) : (
                <>
                    {sheets.length > 0 && (
                        <Card>
                            <CardHeader><CardTitle>提出済みのシート</CardTitle></CardHeader>
                            <CardContent className="flex flex-wrap gap-2">
                                {sheets.map(sheet => (
                                    <Button key={sheet.id} variant={!writing && selectedId === sheet.id ? 'default' : 'outline'} onClick={() => { setWriting(false); setSelectedId(sheet.id) }}>
                                        {sheet.consultationDate} 提出
                                    </Button>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {writing ? (
                        <>
                            <Card>
                                <CardHeader><CardTitle>記入する方</CardTitle></CardHeader>
                                <CardContent className="grid gap-4 sm:grid-cols-3">
                                    <div><p className="text-xs text-muted-foreground">氏名</p><p className="font-medium">{customer.name}</p></div>
                                    <div><p className="text-xs text-muted-foreground">電話番号</p><p className="font-medium">{customer.phone || '未登録'}</p></div>
                                    <div className="space-y-2"><Label htmlFor="consultation-date">記入日</Label><Input id="consultation-date" type="date" value={consultationDate} onChange={event => setConsultationDate(event.target.value)} /></div>
                                </CardContent>
                            </Card>
                            <QuestionSections sections={counselingSections} answers={answers} onChange={setAnswers} idPrefix="patient-new" />
                            <BodyMap marks={marks} onChange={setMarks} allowedKinds={['symptom', 'other']} title="症状のある部位" />
                            <div className="flex justify-end gap-2 pb-8">
                                {sheets.length > 0 && <Button variant="outline" onClick={() => setWriting(false)} disabled={saving}>戻る</Button>}
                                <Button onClick={submit} disabled={saving}>{saving ? '提出中...' : 'シートを提出する'}</Button>
                            </div>
                        </>
                    ) : selected && (
                        <>
                            <Card><CardContent className="pt-6 text-sm">提出日：{selected.consultationDate}　提出後の内容は変更できません。訂正する場合は新しいシートを記入してください。</CardContent></Card>
                            <QuestionSections sections={counselingSections} answers={selected.answers} idPrefix="patient-read" />
                            <BodyMap marks={selected.marks} title="記入した部位" />
                        </>
                    )}
                </>
            )}
        </div>
    )
}
