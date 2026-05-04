import { redirect } from 'next/navigation'

// 内勤スタッフ管理は「設定→メンバー管理」に統合されました。
// このページにアクセスした場合は設定ページにリダイレクトします。
export default function InternalStaffPage() {
    redirect('/dashboard/settings')
}
