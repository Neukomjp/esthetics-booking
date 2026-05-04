'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Booking } from '@/types/booking'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Edit, Trash2 } from 'lucide-react'

interface BookingListProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialBookings: any[]
    storeId: string
}

export function BookingList({ initialBookings, storeId }: BookingListProps) {
    const [bookings, setBookings] = useState(initialBookings)
    const [startDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))
    const [endDate] = useState(() => format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'))

    const formatDateTime = (isoString: string) => {
        if (!isoString) return ''
        const date = parseISO(isoString)
        return format(date, 'MM/dd HH:mm', { locale: ja })
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200'
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'confirmed': return '新規予約'
            case 'completed': return '完了'
            case 'cancelled': return 'キャンセル'
            default: return status
        }
    }

    const getRowColor = (status: string) => {
        if (status === 'cancelled') return 'bg-red-50/50 hover:bg-red-50'
        if (status === 'completed') return 'bg-gray-50/50'
        return ''
    }

    return (
        <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-2 bg-white p-3 border border-gray-200 rounded-md shadow-sm">
                <Input type="date" className="w-[140px] h-8 text-[13px]" defaultValue={startDate} />
                <span className="text-gray-500">〜</span>
                <Input type="date" className="w-[140px] h-8 text-[13px]" defaultValue={endDate} />
                
                <Select defaultValue="all">
                    <SelectTrigger className="w-[120px] h-8 text-[13px]">
                        <SelectValue placeholder="キャスト" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">-- キャスト --</SelectItem>
                    </SelectContent>
                </Select>

                <Select defaultValue="all">
                    <SelectTrigger className="w-[120px] h-8 text-[13px]">
                        <SelectValue placeholder="ステータス" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">-- ステータス --</SelectItem>
                        <SelectItem value="confirmed">新規予約</SelectItem>
                        <SelectItem value="completed">完了</SelectItem>
                        <SelectItem value="cancelled">キャンセル</SelectItem>
                    </SelectContent>
                </Select>

                <Input type="text" placeholder="名前・電話番号" className="w-[180px] h-8 text-[13px]" />
                
                <Button className="h-8 px-4 bg-[#4CAF50] hover:bg-[#45a049] text-white text-[13px] font-bold">検索</Button>
            </div>

            <div className="text-sm text-gray-600 mb-2">
                {bookings.length}件中 1-{bookings.length}件 を表示
            </div>

            {/* Table */}
            <div className="border border-gray-300 rounded-sm bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[40px] text-center"><input type="checkbox" /></TableHead>
                            <TableHead className="w-[60px]">詳細</TableHead>
                            <TableHead>登録日</TableHead>
                            <TableHead>予約名</TableHead>
                            <TableHead>予約日時</TableHead>
                            <TableHead>キャスト</TableHead>
                            <TableHead>コース</TableHead>
                            <TableHead className="text-right">売上</TableHead>
                            <TableHead className="text-center">ステータス</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {bookings.map((booking) => (
                            <TableRow key={booking.id} className={getRowColor(booking.status)}>
                                <TableCell className="text-center"><input type="checkbox" /></TableCell>
                                <TableCell>
                                    <button className="text-blue-600 hover:underline text-[12px]">詳細</button>
                                </TableCell>
                                <TableCell className="text-gray-500 text-[12px]">{formatDateTime(booking.created_at)}</TableCell>
                                <TableCell className="font-medium text-blue-600">
                                    {booking.customer_name || 'ゲスト'} {booking.customer_name?.includes('リピーター') ? <span className="text-red-500">リピーター</span> : <span className="text-gray-500 text-[11px]">新規</span>}
                                </TableCell>
                                <TableCell>
                                    {formatDateTime(booking.start_time)}
                                </TableCell>
                                <TableCell className="text-blue-600">
                                    {booking.staff?.name || '指名なし'}
                                </TableCell>
                                <TableCell className="text-gray-600">
                                    {booking.service?.name} {booking.service?.duration_minutes ? `${booking.service.duration_minutes}分` : ''}
                                </TableCell>
                                <TableCell className="text-right text-red-600 font-medium">
                                    {booking.service?.price ? `¥${booking.service.price.toLocaleString()}` : '¥0'}
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="outline" className={`font-normal text-[11px] px-2 py-0 h-5 ${getStatusColor(booking.status)}`}>
                                        {getStatusLabel(booking.status)} ▾
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                        {bookings.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                                    予約が見つかりません。
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
