'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, ComposedChart } from 'recharts'

interface ReportsClientProps {
    dailySalesData: any[]
    weeklySalesData: any[]
    monthlySalesData: any[]
    castSalesData: any[]
}

export function ReportsClient({ dailySalesData, weeklySalesData, monthlySalesData, castSalesData }: ReportsClientProps) {

    // Helper for formatting YAxis (currency)
    const formatYAxis = (tickItem: number) => {
        return new Intl.NumberFormat('ja-JP', { notation: "compact", compactDisplay: "short" }).format(tickItem);
    }

    return (
        <Tabs defaultValue="cast" className="space-y-4">
            <TabsList className="bg-white border border-gray-200">
                <TabsTrigger value="cast" className="text-[13px] data-[state=active]:bg-gray-100">キャスト別</TabsTrigger>
                <TabsTrigger value="daily" className="text-[13px] data-[state=active]:bg-gray-100">日別推移</TabsTrigger>
                <TabsTrigger value="weekly" className="text-[13px] data-[state=active]:bg-gray-100">週別推移</TabsTrigger>
                <TabsTrigger value="monthly" className="text-[13px] data-[state=active]:bg-gray-100">月別推移</TabsTrigger>
            </TabsList>

            {/* CAST REPORT */}
            <TabsContent value="cast">
                <Card>
                    <CardHeader>
                        <CardTitle>キャスト別売上</CardTitle>
                        <CardDescription>各キャストの予約数と売上貢献度</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-8 h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={castSalesData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                    <XAxis type="number" tickFormatter={formatYAxis} />
                                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                                    <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} />
                                    <Bar dataKey="totalSales" name="総売上" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="border border-gray-200 rounded-sm bg-white overflow-x-auto">
                            <Table className="min-w-max">
                                <TableHeader>
                                    <TableRow className="bg-gray-50/50">
                                        <TableHead>キャスト名</TableHead>
                                        <TableHead className="text-right">予約数</TableHead>
                                        <TableHead className="text-right">総売上</TableHead>
                                        <TableHead className="text-right">客単価</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {castSalesData.map((cast) => (
                                        <TableRow key={cast.id}>
                                            <TableCell className="font-bold text-blue-600">{cast.name}</TableCell>
                                            <TableCell className="text-right">{cast.bookingCount}件</TableCell>
                                            <TableCell className="text-right font-bold">¥{cast.totalSales.toLocaleString()}</TableCell>
                                            <TableCell className="text-right">¥{cast.avgPrice.toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))}
                                    {castSalesData.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                                データがありません
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* DAILY REPORT */}
            <TabsContent value="daily">
                <Card>
                    <CardHeader>
                        <CardTitle>日別推移 (直近30日)</CardTitle>
                        <CardDescription>日々の売上と予約件数の推移</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={dailySalesData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" tickFormatter={(val) => val.split('-').slice(1).join('/')} />
                                <YAxis yAxisId="left" tickFormatter={formatYAxis} />
                                <YAxis yAxisId="right" orientation="right" />
                                <Tooltip formatter={(value: number, name: string) => name === '売上' ? `¥${value.toLocaleString()}` : `${value}件`} />
                                <Legend />
                                <Bar yAxisId="left" dataKey="sales" name="売上" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Line yAxisId="right" type="monotone" dataKey="bookings" name="予約件数" stroke="#f59e0b" strokeWidth={2} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* WEEKLY REPORT */}
            <TabsContent value="weekly">
                <Card>
                    <CardHeader>
                        <CardTitle>週別推移 (直近12週)</CardTitle>
                        <CardDescription>週ごとの売上トレンド (月曜日始まり)</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={weeklySalesData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="week" tickFormatter={(val) => val.split('-').slice(1).join('/')} />
                                <YAxis yAxisId="left" tickFormatter={formatYAxis} />
                                <YAxis yAxisId="right" orientation="right" />
                                <Tooltip formatter={(value: number, name: string) => name === '売上' ? `¥${value.toLocaleString()}` : `${value}件`} />
                                <Legend />
                                <Bar yAxisId="left" dataKey="sales" name="売上" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                <Line yAxisId="right" type="monotone" dataKey="bookings" name="予約件数" stroke="#ec4899" strokeWidth={2} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* MONTHLY REPORT */}
            <TabsContent value="monthly">
                <Card>
                    <CardHeader>
                        <CardTitle>月別推移 (直近6ヶ月)</CardTitle>
                        <CardDescription>月ごとの売上と予約件数の推移</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={monthlySalesData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" />
                                <YAxis yAxisId="left" tickFormatter={formatYAxis} />
                                <YAxis yAxisId="right" orientation="right" />
                                <Tooltip formatter={(value: number, name: string) => name === '売上' ? `¥${value.toLocaleString()}` : `${value}件`} />
                                <Legend />
                                <Bar yAxisId="left" dataKey="sales" name="売上" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Line yAxisId="right" type="monotone" dataKey="bookings" name="予約件数" stroke="#f97316" strokeWidth={2} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    )
}
