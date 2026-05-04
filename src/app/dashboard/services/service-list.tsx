'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Service } from '@/types/staff'
import { Edit, Trash2, Plus } from 'lucide-react'

// Since we are moving quickly to provide the UI, we'll keep the list read-only or placeholder actions for now
// The actual logic is in menu-manager.tsx. We will just show the dense view.

interface ServiceListProps {
    initialServices: Service[]
    storeId: string
}

export function ServiceList({ initialServices, storeId }: ServiceListProps) {
    const [searchTerm, setSearchTerm] = useState('')

    const filtered = initialServices.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 bg-white p-3 border border-gray-200 rounded-md shadow-sm">
                <Input 
                    type="text" 
                    placeholder="コース名で検索..." 
                    className="w-[200px] h-8 text-[13px]" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button className="h-8 px-4 bg-gray-100 text-gray-700 hover:bg-gray-200 text-[13px] border border-gray-300">絞り込み</Button>
                
                <div className="ml-auto">
                    <Button className="h-8 px-4 bg-[#4CAF50] hover:bg-[#45a049] text-white text-[13px] font-bold">
                        <Plus className="mr-1 h-4 w-4" /> コースを追加
                    </Button>
                </div>
            </div>

            <div className="text-sm text-gray-600 mb-2">
                {filtered.length}件中 1-{filtered.length}件 を表示
            </div>

            <div className="border border-gray-300 rounded-sm bg-white shadow-sm overflow-x-auto">
                <Table className="min-w-max">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[40px] text-center"><input type="checkbox" /></TableHead>
                            <TableHead>コース名</TableHead>
                            <TableHead className="text-right">時間 (分)</TableHead>
                            <TableHead className="text-right">料金 (円)</TableHead>
                            <TableHead className="text-center">表示順</TableHead>
                            <TableHead className="text-center">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map((service) => (
                            <TableRow key={service.id}>
                                <TableCell className="text-center"><input type="checkbox" /></TableCell>
                                <TableCell className="font-bold text-blue-600 text-[13px]">
                                    {service.name}
                                    {service.description && <div className="text-[11px] text-gray-400 font-normal mt-0.5 max-w-[300px] truncate">{service.description}</div>}
                                </TableCell>
                                <TableCell className="text-right text-[12px]">{service.duration_minutes}分</TableCell>
                                <TableCell className="text-right font-medium text-red-600 text-[13px]">¥{service.price.toLocaleString()}</TableCell>
                                <TableCell className="text-center text-[12px] text-gray-500">{service.order_index}</TableCell>
                                <TableCell className="text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button className="text-blue-600 hover:bg-blue-50 p-1 rounded">
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button className="text-red-600 hover:bg-red-50 p-1 rounded">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filtered.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-gray-500 text-[13px]">
                                    コースが登録されていません。
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
