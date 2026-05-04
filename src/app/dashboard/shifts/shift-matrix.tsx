'use client'

import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShiftDialog } from '@/app/dashboard/stores/[id]/shift-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ShiftMatrixProps {
    storeId: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    staffList: any[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    weeklyShifts: any[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    shiftExceptions: any[]
    weekDates: Date[]
}

export function ShiftMatrix({ storeId, staffList, weeklyShifts, shiftExceptions, weekDates }: ShiftMatrixProps) {
    
    // Helper to get shift text for a specific staff and date
    const getShiftForDate = (staffId: string, date: Date) => {
        // Vercel server might give UTC, we force JST or just use getDay which is local in browser
        const dayOfWeek = date.getDay()
        const dateStr = format(date, 'yyyy-MM-dd')

        // First check exception
        const exception = shiftExceptions.find(e => e.staff_id === staffId && e.date === dateStr)
        if (exception) {
            if (exception.is_holiday) return { text: '休', isOff: true, isException: true }
            const start = exception.start_time?.substring(0, 5) || ''
            const end = exception.end_time?.substring(0, 5) || ''
            return { text: `${start}～${end}`, isOff: false, isException: true }
        }

        // Check regular shift
        const regular = weeklyShifts.find(s => s.staff_id === staffId && s.day_of_week === dayOfWeek)
        if (regular) {
            if (regular.is_holiday) return { text: '休', isOff: true, isException: false }
            const start = regular.start_time?.substring(0, 5) || ''
            const end = regular.end_time?.substring(0, 5) || ''
            return { text: `${start}～${end}`, isOff: false, isException: false }
        }

        return { text: '-', isOff: true, isException: false }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-3 border border-gray-200 rounded-md shadow-sm">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0"><ChevronLeft className="h-4 w-4" /></Button>
                    <span className="font-bold text-[14px]">
                        {format(weekDates[0], 'yyyy年MM月dd日', { locale: ja })} ～ {format(weekDates[6], 'MM月dd日', { locale: ja })}
                    </span>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0"><ChevronRight className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" className="h-8 text-[12px] ml-2">今週</Button>
                </div>
                
                <div className="text-[12px] text-gray-500 flex items-center gap-4">
                    <span><span className="inline-block w-3 h-3 bg-red-100 border border-red-200 mr-1 align-middle"></span>お休み</span>
                    <span><span className="inline-block w-3 h-3 bg-yellow-50 border border-yellow-200 mr-1 align-middle"></span>特別シフト</span>
                </div>
            </div>

            <div className="border border-gray-300 rounded-sm bg-white shadow-sm overflow-x-auto">
                <Table className="min-w-[800px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[180px] sticky left-0 bg-[#f8f9fa] z-10 border-r-2 border-b-2">キャスト</TableHead>
                            {weekDates.map((date, idx) => (
                                <TableHead key={idx} className={`text-center border-b-2 min-w-[100px] ${date.getDay() === 0 ? 'text-red-500 bg-red-50/30' : date.getDay() === 6 ? 'text-blue-500 bg-blue-50/30' : ''}`}>
                                    {format(date, 'MM/dd')} ({format(date, 'E', { locale: ja })})
                                </TableHead>
                            ))}
                            <TableHead className="text-center w-[80px]">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {staffList.map((staff) => (
                            <TableRow key={staff.id}>
                                <TableCell className="sticky left-0 bg-white z-10 border-r-2 font-medium">
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6 rounded-sm">
                                            <AvatarImage src={staff.images?.[0] || staff.avatarUrl} alt={staff.name} className="object-cover" />
                                            <AvatarFallback className="rounded-sm bg-gray-100 text-[10px]">{staff.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-[13px] text-blue-600 truncate max-w-[120px]">{staff.name}</span>
                                    </div>
                                </TableCell>
                                {weekDates.map((date, idx) => {
                                    const shiftInfo = getShiftForDate(staff.id, date)
                                    let cellClass = "text-center text-[12px] "
                                    if (shiftInfo.isOff) cellClass += "bg-red-50/50 text-red-500"
                                    else if (shiftInfo.isException) cellClass += "bg-yellow-50/50 text-yellow-700 font-bold"
                                    else cellClass += "text-gray-700 font-medium"

                                    return (
                                        <TableCell key={idx} className={cellClass}>
                                            {shiftInfo.text}
                                        </TableCell>
                                    )
                                })}
                                <TableCell className="text-center">
                                    <ShiftDialog staffId={staff.id} staffName={staff.name} storeId={storeId} />
                                </TableCell>
                            </TableRow>
                        ))}
                        {staffList.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                                    キャストが登録されていません。
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
