'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, ComposedChart } from 'recharts'
import { Button } from '@/components/ui/button'
import { BarChart3, LineChart as LineChartIcon, TrendingUp, TrendingDown, DollarSign, Users } from 'lucide-react'

interface ReportsClientProps {
    dailySalesData: any[]
    weeklySalesData: any[]
    monthlySalesData: any[]
    castSalesData: any[]
}

export function ReportsClient({ dailySalesData, weeklySalesData, monthlySalesData, castSalesData }: ReportsClientProps) {
    const [chartType, setChartType] = useState<'bar' | 'line'>('bar')

    // Helper for formatting YAxis (currency)
    const formatYAxis = (tickItem: number) => {
        return new Intl.NumberFormat('ja-JP', { notation: "compact", compactDisplay: "short" }).format(tickItem);
    }

    const renderDataSeries = (type: 'sales' | 'expenses' | 'payouts' | 'profit', name: string, color: string, isLineOnly = false) => {
        if (isLineOnly || chartType === 'line') {
            return <Line yAxisId="left" type="monotone" dataKey={type} name={name} stroke={color} strokeWidth={isLineOnly ? 3 : 2} dot={!isLineOnly} />
        }
        return <Bar yAxisId="left" dataKey={type} name={name} fill={color} radius={[4, 4, 0, 0]} />
    }

    const customTooltip = (value: number, name: string) => {
        if (name === '予約件数') return `${value}件`
        return `¥${value.toLocaleString()}`
    }

    const renderSummaryCards = (data: any[], dateKey: string) => {
        const totals = data.reduce((acc, curr) => ({
            sales: acc.sales + (curr.sales || 0),
            profit: acc.profit + (curr.profit || 0),
            payouts: acc.payouts + (curr.payouts || 0),
            expenses: acc.expenses + (curr.expenses || 0),
        }), { sales: 0, profit: 0, payouts: 0, expenses: 0 })

        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <Card>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">期間売上</p>
                            <h3 className="text-xl font-bold text-gray-900">¥{totals.sales.toLocaleString()}</h3>
                        </div>
                        <div className="p-2 bg-blue-100 rounded-full"><DollarSign className="w-4 h-4 text-blue-600" /></div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">粗利</p>
                            <h3 className={`text-xl font-bold ${totals.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>¥{totals.profit.toLocaleString()}</h3>
                        </div>
                        <div className={`p-2 rounded-full ${totals.profit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                            {totals.profit >= 0 ? <TrendingUp className="w-4 h-4 text-green-600" /> : <TrendingDown className="w-4 h-4 text-red-600" />}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">給与支払</p>
                            <h3 className="text-xl font-bold text-gray-900">¥{totals.payouts.toLocaleString()}</h3>
                        </div>
                        <div className="p-2 bg-orange-100 rounded-full"><Users className="w-4 h-4 text-orange-600" /></div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">経費</p>
                            <h3 className="text-xl font-bold text-gray-900">¥{totals.expenses.toLocaleString()}</h3>
                        </div>
                        <div className="p-2 bg-red-100 rounded-full"><DollarSign className="w-4 h-4 text-red-600" /></div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <Tabs defaultValue="cast" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <TabsList className="bg-white border border-gray-200">
                    <TabsTrigger value="cast" className="text-[13px] data-[state=active]:bg-gray-100">キャスト別</TabsTrigger>
                    <TabsTrigger value="daily" className="text-[13px] data-[state=active]:bg-gray-100">日別推移</TabsTrigger>
                    <TabsTrigger value="weekly" className="text-[13px] data-[state=active]:bg-gray-100">週別推移</TabsTrigger>
                    <TabsTrigger value="monthly" className="text-[13px] data-[state=active]:bg-gray-100">月別推移</TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-2 bg-white border border-gray-200 p-1 rounded-md w-fit">
                    <Button 
                        variant={chartType === 'bar' ? 'default' : 'ghost'} 
                        size="sm" 
                        onClick={() => setChartType('bar')}
                        className="h-7 text-xs px-2"
                    >
                        <BarChart3 className="w-3.5 h-3.5 mr-1" /> 棒グラフ
                    </Button>
                    <Button 
                        variant={chartType === 'line' ? 'default' : 'ghost'} 
                        size="sm" 
                        onClick={() => setChartType('line')}
                        className="h-7 text-xs px-2"
                    >
                        <LineChartIcon className="w-3.5 h-3.5 mr-1" /> 折れ線
                    </Button>
                </div>
            </div>

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
                {renderSummaryCards(dailySalesData, 'date')}
                <Card>
                    <CardHeader>
                        <CardTitle>日別推移 (直近30日)</CardTitle>
                        <CardDescription>日々の売上・粗利・予約件数の推移</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={dailySalesData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" tickFormatter={(val) => val.split('-').slice(1).join('/')} />
                                <YAxis yAxisId="left" tickFormatter={formatYAxis} />
                                <YAxis yAxisId="right" orientation="right" />
                                <Tooltip formatter={customTooltip} />
                                <Legend />
                                {renderDataSeries('sales', '売上', '#3b82f6')}
                                {renderDataSeries('payouts', '給与', '#f97316')}
                                {renderDataSeries('expenses', '経費', '#ef4444')}
                                {renderDataSeries('profit', '粗利', '#10b981', true)}
                                <Line yAxisId="right" type="monotone" dataKey="bookings" name="予約件数" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* WEEKLY REPORT */}
            <TabsContent value="weekly">
                {renderSummaryCards(weeklySalesData, 'week')}
                <Card>
                    <CardHeader>
                        <CardTitle>週別推移 (直近12週)</CardTitle>
                        <CardDescription>週ごとの売上・粗利トレンド (月曜日始まり)</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={weeklySalesData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="week" tickFormatter={(val) => val.split('-').slice(1).join('/')} />
                                <YAxis yAxisId="left" tickFormatter={formatYAxis} />
                                <YAxis yAxisId="right" orientation="right" />
                                <Tooltip formatter={customTooltip} />
                                <Legend />
                                {renderDataSeries('sales', '売上', '#3b82f6')}
                                {renderDataSeries('payouts', '給与', '#f97316')}
                                {renderDataSeries('expenses', '経費', '#ef4444')}
                                {renderDataSeries('profit', '粗利', '#10b981', true)}
                                <Line yAxisId="right" type="monotone" dataKey="bookings" name="予約件数" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* MONTHLY REPORT */}
            <TabsContent value="monthly">
                {renderSummaryCards(monthlySalesData, 'month')}
                <Card>
                    <CardHeader>
                        <CardTitle>月別推移 (直近6ヶ月)</CardTitle>
                        <CardDescription>月ごとの売上・粗利・予約件数の推移</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={monthlySalesData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" />
                                <YAxis yAxisId="left" tickFormatter={formatYAxis} />
                                <YAxis yAxisId="right" orientation="right" />
                                <Tooltip formatter={customTooltip} />
                                <Legend />
                                {renderDataSeries('sales', '売上', '#3b82f6')}
                                {renderDataSeries('payouts', '給与', '#f97316')}
                                {renderDataSeries('expenses', '経費', '#ef4444')}
                                {renderDataSeries('profit', '粗利', '#10b981', true)}
                                <Line yAxisId="right" type="monotone" dataKey="bookings" name="予約件数" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    )
}
