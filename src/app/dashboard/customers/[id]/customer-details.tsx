'use client'

import { useState } from 'react'
import { Customer } from '@/lib/types/customer'
import { VisitRecord } from '@/lib/types/visit-record'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface CustomerDetailsProps {
    customer: Customer
    visitRecords: VisitRecord[]
}

export function CustomerDetails({ customer, visitRecords }: CustomerDetailsProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/customers">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">{customer.name}</h1>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${customer.is_registered ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                    {customer.is_registered ? '会員' : 'ゲスト'}
                </span>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">基本情報</TabsTrigger>
                    <TabsTrigger value="history">来店履歴</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>お客様情報</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground">メールアドレス</dt>
                                    <dd className="mt-1 text-sm">{customer.email || '-'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground">電話番号</dt>
                                    <dd className="mt-1 text-sm">{customer.phone || '-'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground">登録日</dt>
                                    <dd className="mt-1 text-sm">{new Date(customer.created_at).toLocaleDateString()}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground">最終来店日</dt>
                                    <dd className="mt-1 text-sm">{customer.last_visit_date ? new Date(customer.last_visit_date).toLocaleDateString() : '-'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground">総来店回数</dt>
                                    <dd className="mt-1 text-sm">{customer.total_visits}回</dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>顧客メモ</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="min-h-[100px] p-2 bg-slate-50 text-sm rounded">
                                {customer.notes || 'メモはありません'}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">来店履歴 ({visitRecords.length}件)</h3>
                    </div>
                    {visitRecords.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground bg-slate-50 rounded-lg border border-dashed">
                            来店履歴はまだありません
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {visitRecords.map((record) => (
                                <Card key={record.id}>
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between">
                                            <CardTitle className="text-md font-semibold">
                                                {new Date(record.visit_date).toLocaleDateString('ja-JP')}
                                            </CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="text-sm p-3 bg-slate-50 rounded-md whitespace-pre-wrap">
                                            {record.content}
                                        </div>
                                        {record.tags && record.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {record.tags.map(tag => (
                                                    <Badge key={tag} variant="secondary" className="font-normal text-xs">#{tag}</Badge>
                                                ))}
                                            </div>
                                        )}
                                        {record.photos && record.photos.length > 0 && (
                                            <div className="flex gap-2 overflow-x-auto pt-2">
                                                {record.photos.map((photo, j) => (
                                                    <div key={Math.random()} className="relative shrink-0 w-24 h-24 rounded-md overflow-hidden bg-slate-100 border">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={photo} alt={`カルテ画像 ${j+1}`} className="object-cover w-full h-full" />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
