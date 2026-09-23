import { z } from 'zod'

export type CounselingField = {
    id: string
    label: string
    hint?: string
    multiline?: boolean
}

export type CounselingSection = {
    title: string
    description?: string
    fields: CounselingField[]
}

export const counselingSections: CounselingSection[] = [
    {
        title: '基本情報',
        description: '氏名と電話番号は顧客情報から表示します。',
        fields: [
            { id: 'nameKana', label: 'フリガナ' },
            { id: 'gender', label: '性別' },
            { id: 'birthDate', label: '生年月日', hint: '例：1990年1月1日' },
            { id: 'address', label: '住所', multiline: true },
            { id: 'occupation', label: '職業' },
            { id: 'referrer', label: '紹介者' },
        ],
    },
    {
        title: '病歴と現在の状態',
        fields: [
            { id: 'pastHistory', label: '既往歴', hint: '病名と発症時の年齢', multiline: true },
            { id: 'familyHistory', label: '家族歴', hint: '分かる範囲で記入', multiline: true },
            { id: 'currentOnset', label: '現病歴：発症時期・症状', multiline: true },
            { id: 'medicalDiagnosis', label: '医療機関での診断', multiline: true },
            { id: 'previousTreatment', label: 'これまでの治療・服薬', multiline: true },
        ],
    },
    {
        title: '症状',
        description: '該当する状態を自由に記録できます。',
        fields: [
            { id: 'sleep', label: '睡眠', hint: '寝つき、眠りの深さ、夢など' },
            { id: 'headache', label: '頭痛・めまい', hint: '頭の重さ、立ちくらみなど' },
            { id: 'appetite', label: '食欲・間食' },
            { id: 'stomach', label: '胃・腹部', hint: '胸やけ、吐き気、腹痛など' },
            { id: 'bowel', label: '便通', hint: '回数、便秘、下痢など' },
            { id: 'cough', label: 'せき・たん' },
            { id: 'nose', label: '鼻', hint: '鼻づまり、鼻水、鼻出血など' },
            { id: 'throat', label: 'のど・口', hint: '渇き、粘り、唾液など' },
            { id: 'chest', label: '胸・呼吸', hint: '動悸、息切れ、胸の重さなど' },
            { id: 'coldness', label: '冷え', hint: '手足、腰、背中、腹など' },
            { id: 'urination', label: '尿', hint: '回数、夜間尿など' },
            { id: 'menstruation', label: '月経・妊娠歴', hint: '必要な場合のみ記入' },
            { id: 'pain', label: 'こり・痛み', hint: '首、肩、背中、腰など' },
            { id: 'numbness', label: 'しびれ', hint: '部位と範囲' },
            { id: 'bodyLocation', label: '症状のある部位', hint: '図に印を付けられない場合もここに記入できます。' },
            { id: 'otherSymptoms', label: 'その他の症状', multiline: true },
        ],
    },
    {
        title: '主訴と生活習慣',
        fields: [
            { id: 'chiefComplaint', label: '主訴（最もつらい症状）', multiline: true },
            { id: 'constitution', label: '体質', hint: '寒がり、暑がり、冷え症など' },
            { id: 'preferences', label: '嗜好', hint: '飲酒、喫煙、食べ物の好みなど', multiline: true },
        ],
    },
]

export const staffCounselingSections: CounselingSection[] = [
    {
        title: '所見・診断（スタッフ記入）',
        fields: [
            { id: 'height', label: '身長（cm）' },
            { id: 'weight', label: '体重（kg）' },
            { id: 'bodyType', label: '体格・肉づき' },
            { id: 'complexion', label: '顔色・くちびる' },
            { id: 'tongue', label: '舌の所見' },
            { id: 'bloodPressure', label: '血圧' },
            { id: 'pulse', label: '脈拍・脈性' },
            { id: 'temperature', label: '体温' },
            { id: 'reflexes', label: '腱反射' },
            { id: 'auscultation', label: '聴打診' },
            { id: 'vision', label: '視力' },
            { id: 'findings', label: 'その他の所見', multiline: true },
            { id: 'diagnosisOne', label: '診断・評価 ①', multiline: true },
            { id: 'diagnosisTwo', label: '診断・評価 ②', multiline: true },
            { id: 'treatmentNotes', label: '施術メモ', multiline: true },
        ],
    },
]

const customerFieldIds = new Set(counselingSections.flatMap(section => section.fields.map(field => field.id)))
const staffFieldIds = new Set(staffCounselingSections.flatMap(section => section.fields.map(field => field.id)))

export const bodyViews = ['front', 'back'] as const
export const bodyMarkKinds = ['symptom', 'needle', 'moxa', 'other'] as const

export type BodyView = typeof bodyViews[number]
export type BodyMarkKind = typeof bodyMarkKinds[number]

export type BodyMark = {
    view: BodyView
    kind: BodyMarkKind
    x: number
    y: number
}

export type CounselingSheetInput = {
    consultationDate: string
    answers: Record<string, string>
    marks: BodyMark[]
}

export type CounselingSheet = CounselingSheetInput & {
    id: string
    customerId: string
    createdAt: string
    updatedAt: string
    staffNotes?: CounselingStaffNotes | null
}

export type CounselingStaffNotes = {
    answers: Record<string, string>
    marks: BodyMark[]
    updatedAt: string
}

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
    const date = new Date(`${value}T00:00:00Z`)
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}, '有効な日付を入力してください。')

export const counselingSheetSchema = z.object({
    consultationDate: dateSchema,
    answers: z.record(z.string(), z.string().trim().max(2000)).refine(answers =>
        Object.keys(answers).length <= customerFieldIds.size && Object.keys(answers).every(key => customerFieldIds.has(key)),
    ).refine(answers => Boolean(answers.chiefComplaint?.trim()), '主訴を入力してください。'),
    marks: z.array(z.object({
        view: z.enum(bodyViews),
        kind: z.enum(['symptom', 'other']),
        x: z.number().finite().min(0).max(100),
        y: z.number().finite().min(0).max(100),
    })).max(100),
})

export const counselingStaffNotesSchema = z.object({
    answers: z.record(z.string(), z.string().trim().max(2000)).refine(answers =>
        Object.keys(answers).length <= staffFieldIds.size && Object.keys(answers).every(key => staffFieldIds.has(key)),
    ),
    marks: z.array(z.object({
        view: z.enum(bodyViews),
        kind: z.enum(bodyMarkKinds),
        x: z.number().finite().min(0).max(100),
        y: z.number().finite().min(0).max(100),
    })).max(100),
})
