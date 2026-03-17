'use client'

import { Service } from '@/types/staff'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface MenuListProps {
    menuItems: Service[]
}

export function MenuList({ menuItems }: MenuListProps) {
    const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({})

    return (
        <div className="space-y-3 md:space-y-4">
            {menuItems.length > 0 ? (
                menuItems.map((item) => (
                    <div key={item.id} className="flex gap-3 md:gap-4 items-center p-3 md:p-4 bg-zinc-900/80 rounded-lg border border-zinc-800 hover:border-amber-900/50 transition-colors">
                        {item.image_url && (
                            <div className="h-16 w-16 md:h-20 md:w-20 shrink-0 overflow-hidden rounded-md border border-zinc-700">
                                <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0 mr-2 md:mr-4">
                            <div className="font-medium text-base md:text-lg text-zinc-100 truncate">{item.name}</div>
                            {item.description && (
                                <div className="mt-1">
                                    <button
                                        type="button"
                                        className="text-xs text-amber-500 hover:text-amber-400 flex items-center gap-1"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            setExpandedDescriptions(prev => ({
                                                ...prev,
                                                [item.id]: !prev[item.id]
                                            }))
                                        }}
                                    >
                                        {expandedDescriptions[item.id] ? (
                                            <>詳細を閉じる <ChevronUp className="h-3 w-3" /></>
                                        ) : (
                                            <>詳細を見る <ChevronDown className="h-3 w-3" /></>
                                        )}
                                    </button>
                                    {expandedDescriptions[item.id] && (
                                        <div className="text-xs md:text-sm text-zinc-400 mt-2 whitespace-pre-wrap break-words border-t pt-2 border-zinc-700/50">
                                            {item.description}
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="text-xs md:text-sm text-zinc-500 mt-1">{item.duration_minutes}分</div>
                        </div>
                        <span className="font-bold text-base md:text-lg shrink-0 text-amber-400">¥{item.price.toLocaleString()}</span>
                    </div>
                ))
            ) : (
                <p className="text-center text-zinc-500 py-6 text-sm">表示できるメニューがありません。</p>
            )}
        </div>
    )
}
