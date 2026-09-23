'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { BodyMark, BodyMarkKind, BodyView } from '@/lib/counseling-sheet'

const kindLabels: Record<BodyMarkKind, string> = {
    symptom: '症状',
    needle: '鍼',
    moxa: '灸',
    other: 'その他',
}

const kindColors: Record<BodyMarkKind, string> = {
    symptom: '#dc2626',
    needle: '#2563eb',
    moxa: '#d97706',
    other: '#7c3aed',
}

type Props = {
    marks: BodyMark[]
    onChange?: (marks: BodyMark[]) => void
    overlayMarks?: BodyMark[]
    allowedKinds?: BodyMarkKind[]
    title?: string
}

function Figure({ view, marks, onAdd }: {
    view: BodyView
    marks: BodyMark[]
    onAdd?: (x: number, y: number) => void
}) {
    return (
        <div className="mx-auto w-full max-w-[260px]">
            <p className="mb-2 text-center text-sm font-medium">{view === 'front' ? '正面' : '背面'}</p>
            <svg
                viewBox="0 0 240 420"
                className={`w-full rounded-lg border bg-slate-50 ${onAdd ? 'cursor-crosshair' : ''}`}
                role="img"
                aria-label={`${view === 'front' ? '正面' : '背面'}の人体図。${onAdd ? 'クリックで印を付けます。' : '保存済みの印を表示しています。'}`}
                onClick={event => {
                    if (!onAdd) return
                    const rect = event.currentTarget.getBoundingClientRect()
                    onAdd(
                        Math.max(0, Math.min(100, Math.round((event.clientX - rect.left) / rect.width * 1000) / 10)),
                        Math.max(0, Math.min(100, Math.round((event.clientY - rect.top) / rect.height * 1000) / 10)),
                    )
                }}
            >
                <g fill="#ffffff" stroke="#64748b" strokeWidth="2" strokeLinejoin="round">
                    <ellipse cx="120" cy="44" rx="25" ry="31" />
                    <path d="M109 73 L107 85 Q91 83 78 91 L58 119 L43 185 Q39 196 45 199 Q51 201 55 192 L76 137 L83 116 L87 163 L99 210 L89 260 L94 385 Q96 401 107 401 Q115 400 116 389 L120 278 L124 389 Q125 400 133 401 Q144 401 146 385 L151 260 L141 210 L153 163 L157 116 L164 137 L185 192 Q189 201 195 199 Q201 196 197 185 L182 119 L162 91 Q149 83 133 85 L131 73 Z" />
                </g>
                {view === 'back' ? (
                    <g fill="none" stroke="#cbd5e1" strokeWidth="1.5">
                        <path d="M120 87 L120 215" />
                        <path d="M91 96 Q104 109 120 111 Q136 109 149 96" />
                        <path d="M93 125 Q106 135 120 130 Q134 135 147 125" />
                    </g>
                ) : (
                    <g fill="none" stroke="#cbd5e1" strokeWidth="1.5">
                        <path d="M120 88 L120 211" />
                        <path d="M94 113 Q106 123 120 120 Q134 123 146 113" />
                        <path d="M101 183 Q120 191 139 183" />
                    </g>
                )}
                <text x="8" y="32" fill="#64748b" fontSize="12">右</text>
                <text x="212" y="32" fill="#64748b" fontSize="12">左</text>
                {marks.filter(mark => mark.view === view).map((mark, index) => (
                    <g key={`${mark.view}-${mark.kind}-${mark.x}-${mark.y}-${index}`}>
                        <circle cx={mark.x * 2.4} cy={mark.y * 4.2} r="7" fill={kindColors[mark.kind]} stroke="white" strokeWidth="2" />
                        <title>{kindLabels[mark.kind]}</title>
                    </g>
                ))}
            </svg>
        </div>
    )
}

export function BodyMap({ marks, onChange, overlayMarks = [], allowedKinds = ['symptom', 'other'], title = '身体図' }: Props) {
    const [kind, setKind] = useState<BodyMarkKind>(allowedKinds[0])
    const shownMarks = [...overlayMarks, ...marks]

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{onChange ? '正面・背面の部位をクリックして印を付けます。追加した印は保存時に反映されます。' : '正面・背面に記入された印を表示しています。'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {onChange && (
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="space-y-1">
                            <Label htmlFor="body-mark-kind">印の種類</Label>
                            <select
                                id="body-mark-kind"
                                className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                                value={kind}
                                onChange={event => setKind(event.target.value as BodyMarkKind)}
                            >
                                {allowedKinds.map(value => <option key={value} value={value}>{kindLabels[value]}</option>)}
                            </select>
                        </div>
                        <Button type="button" variant="outline" disabled={marks.length === 0} onClick={() => onChange(marks.slice(0, -1))}>
                            最後の印を取り消す
                        </Button>
                    </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                    {(['front', 'back'] as const).map(view => (
                        <Figure
                            key={view}
                            view={view}
                            marks={shownMarks}
                            onAdd={onChange ? (x, y) => {
                                if (marks.length < 100) onChange([...marks, { view, kind, x, y }])
                            } : undefined}
                        />
                    ))}
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {(['symptom', 'needle', 'moxa', 'other'] as const).filter(value => shownMarks.some(mark => mark.kind === value) || allowedKinds.includes(value)).map(value => (
                        <span key={value} className="inline-flex items-center gap-1">
                            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: kindColors[value] }} />
                            {kindLabels[value]}
                        </span>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
