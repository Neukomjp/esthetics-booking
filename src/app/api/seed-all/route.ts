import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get organization
        let orgId = (await cookies()).get('organization-id')?.value
        if (!orgId) {
            const { data: orgMembers } = await supabase
                .from('organization_members')
                .select('organization_id')
                .eq('user_id', user.id)
                .limit(1)
            
            orgId = orgMembers?.[0]?.organization_id
        }

        if (!orgId) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        // Get store
        const { data: stores } = await supabase
            .from('stores')
            .select('id')
            .eq('organization_id', orgId)
            .limit(1)

        const storeId = stores?.[0]?.id

        if (!storeId) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 })
        }

        console.log(`Starting demo seed for store: ${storeId}`)

        // 1. Seed Regions
        const { data: regions } = await supabase.from('regions').insert([
            { organization_id: orgId, name: '渋谷エリア', description: '渋谷駅周辺の店舗' },
            { organization_id: orgId, name: '新宿エリア', description: '新宿駅周辺の店舗' }
        ]).select('id')

        // 2. Seed Services (Courses)
        const { data: services } = await supabase.from('services').insert([
            { store_id: storeId, name: 'アロママッサージ60分', duration_minutes: 60, price: 6000, category: 'リラクゼーション' },
            { store_id: storeId, name: 'フェイシャル90分', duration_minutes: 90, price: 12000, category: 'エステ' },
            { store_id: storeId, name: '全身もみほぐし120分', duration_minutes: 120, price: 10000, category: '整体' }
        ]).select('id')

        // 3. Seed Staff (Casts) - Only if none exist
        const { data: existingStaff } = await supabase.from('staff').select('id').eq('store_id', storeId)
        let staffIds = existingStaff?.map(s => s.id) || []

        if (staffIds.length === 0) {
            const { data: newStaff } = await supabase.from('staff').insert([
                { store_id: storeId, name: '佐藤 あい', role: 'セラピスト', bio: '心を込めて施術します。', back_margin_rate: 50 },
                { store_id: storeId, name: '鈴木 ゆき', role: 'エステティシャン', bio: '美容のお悩みご相談ください。', back_margin_rate: 60 },
                { store_id: storeId, name: '高橋 まこ', role: '整体師', bio: 'コリをしっかりほぐします。', back_margin_rate: 55 }
            ]).select('id')
            staffIds = newStaff?.map(s => s.id) || []
        }

        // 4. Seed Customers
        const { data: customers } = await supabase.from('customers').insert([
            { store_id: storeId, name: '山田 太郎', name_kana: 'ヤマダ タロウ', phone: '090-0000-0001', total_visits: 3, total_spent: 24000 },
            { store_id: storeId, name: '田中 花子', name_kana: 'タナカ ハナコ', email: 'hanako@example.com', total_visits: 1, total_spent: 12000 },
            { store_id: storeId, name: '伊藤 次郎', name_kana: 'イトウ ジロウ', phone: '080-1111-2222', total_visits: 5, total_spent: 50000 },
            { store_id: storeId, name: '渡辺 さくら', name_kana: 'ワタナベ サクラ', notes: '強めの圧が好み', total_visits: 0, total_spent: 0 },
            { store_id: storeId, name: '小林 健太', name_kana: 'コバヤシ ケンタ', total_visits: 2, total_spent: 16000 }
        ]).select('id')

        // 5. Seed Expenses
        const today = new Date()
        const formatDate = (date: Date) => date.toISOString().split('T')[0]
        
        await supabase.from('expenses').insert([
            { store_id: storeId, category: '消耗品費', amount: 4500, description: 'マッサージオイル補充', expense_date: formatDate(today) },
            { store_id: storeId, category: '交通費', amount: 1200, description: '備品買い出し交通費', expense_date: formatDate(today) },
            { store_id: storeId, category: '広告宣伝費', amount: 15000, description: '今月のチラシ印刷代', expense_date: formatDate(new Date(today.getTime() - 86400000)) },
            { store_id: storeId, category: '水道光熱費', amount: 23000, description: '先月分の電気代', expense_date: formatDate(new Date(today.getTime() - 86400000 * 2)) },
            { store_id: storeId, category: 'その他', amount: 3000, description: '店舗用のお茶菓子', expense_date: formatDate(new Date(today.getTime() - 86400000 * 3)) }
        ])

        // 6. Seed Bookings
        if (services && services.length > 0 && customers && customers.length > 0 && staffIds.length > 0) {
            const addDays = (days: number) => new Date(today.getTime() + days * 86400000)
            
            await supabase.from('bookings').insert([
                { 
                    store_id: storeId, staff_id: staffIds[0], service_id: services[0].id, customer_id: customers[0].id,
                    customer_name: '山田 太郎', total_price: 6000, status: 'confirmed',
                    start_time: new Date(addDays(1).setHours(13, 0, 0, 0)).toISOString(),
                    end_time: new Date(addDays(1).setHours(14, 0, 0, 0)).toISOString()
                },
                { 
                    store_id: storeId, staff_id: staffIds[1], service_id: services[1].id, customer_id: customers[1].id,
                    customer_name: '田中 花子', total_price: 12000, status: 'pending',
                    start_time: new Date(addDays(2).setHours(15, 0, 0, 0)).toISOString(),
                    end_time: new Date(addDays(2).setHours(16, 30, 0, 0)).toISOString()
                },
                { 
                    store_id: storeId, staff_id: staffIds[2], service_id: services[2].id, customer_id: customers[2].id,
                    customer_name: '伊藤 次郎', total_price: 10000, status: 'confirmed',
                    start_time: new Date(addDays(3).setHours(11, 0, 0, 0)).toISOString(),
                    end_time: new Date(addDays(3).setHours(13, 0, 0, 0)).toISOString()
                },
                { 
                    store_id: storeId, staff_id: staffIds[0], service_id: services[0].id, customer_id: customers[3].id,
                    customer_name: '渡辺 さくら', total_price: 6000, status: 'completed',
                    start_time: new Date(addDays(-1).setHours(14, 0, 0, 0)).toISOString(),
                    end_time: new Date(addDays(-1).setHours(15, 0, 0, 0)).toISOString()
                },
                { 
                    store_id: storeId, staff_id: staffIds[1], service_id: services[2].id, customer_id: customers[4].id,
                    customer_name: '小林 健太', total_price: 10000, status: 'cancelled',
                    start_time: new Date(addDays(0).setHours(18, 0, 0, 0)).toISOString(),
                    end_time: new Date(addDays(0).setHours(20, 0, 0, 0)).toISOString()
                },
                { 
                    store_id: storeId, staff_id: staffIds[2], service_id: services[1].id, customer_id: customers[2].id,
                    customer_name: '伊藤 次郎 (本日分)', total_price: 12000, status: 'completed',
                    start_time: new Date(addDays(0).setHours(12, 0, 0, 0)).toISOString(),
                    end_time: new Date(addDays(0).setHours(13, 30, 0, 0)).toISOString()
                }
            ])
        }

        // 6.5 Seed Salary Settings (so guarantee calculation works)
        for (let i = 0; i < staffIds.length; i++) {
            await supabase.from('staff_salary_settings').upsert({
                staff_id: staffIds[i],
                hourly_wage: 1500,
                guarantee_daily: i === 0 ? 10000 : 0 // 1st staff gets 10000 guarantee
            }, { onConflict: 'staff_id' })
        }

        // 7. Seed Message Scripts
        await supabase.from('message_scripts').insert([
            { store_id: storeId, title: '予約完了のお礼', category: 'greeting', content: '{customer_name}様\n\nこの度はご予約ありがとうございます。\n{date} {time}よりお待ちしております。\n\nキャンセルの場合は前日までにご連絡をお願いいたします。' },
            { store_id: storeId, title: '来店前日リマインド', category: 'reminder', content: '{customer_name}様\n\n明日のご来店をお待ちしております。\nご予約内容: {service_name}\nお気をつけてお越しくださいませ。' }
        ])

        return NextResponse.json({ success: true, message: 'Demo data injected successfully for store: ' + storeId })
    } catch (error: any) {
        console.error('Seeding error:', error)
        return NextResponse.json({ error: error.message || 'Unknown error during seeding' }, { status: 500 })
    }
}
