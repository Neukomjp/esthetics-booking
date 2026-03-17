'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

interface MultiImageUploadProps {
    value?: string[]
    onChange: (urls: string[]) => void
    maxImages?: number
    className?: string
}

export function MultiImageUpload({ value = [], onChange, maxImages = 15, className = '' }: MultiImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (!files.length) return

        if (value.length + files.length > maxImages) {
            toast.error(`画像は最大${maxImages}枚までです`)
            return
        }

        setIsUploading(true)

        try {
            const supabase = createClient()
            const newUrls: string[] = []

            for (const file of files) {
                const fileExt = file.name.split('.').pop()
                const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
                const filePath = `uploads/${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('store_assets')
                    .upload(filePath, file, { cacheControl: '3600', upsert: false })

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('store_assets')
                    .getPublicUrl(filePath)

                newUrls.push(publicUrl)
            }

            onChange([...value, ...newUrls])
        } catch (error: unknown) {
            console.error('Error uploading images:', error)
            toast.error('アップロードに一部失敗しました')
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const removeImage = (indexToRemove: number) => {
        onChange(value.filter((_, index) => index !== indexToRemove))
    }

    return (
        <div className={`space-y-4 ${className}`}>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {value.map((url, index) => (
                    <div key={index} className="relative rounded-md overflow-hidden border bg-muted group aspect-square">
                        <Image src={url} alt={`Uploaded ${index + 1}`} fill className="object-cover" unoptimized />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button type="button" variant="destructive" size="icon" onClick={() => removeImage(index)} className="h-8 w-8 rounded-full">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
                
                {value.length < maxImages && (
                    <div
                        onClick={() => { if (!isUploading) fileInputRef.current?.click() }}
                        className={`border-2 border-dashed rounded-md aspect-square flex flex-col items-center justify-center gap-2 text-muted-foreground transition-colors ${isUploading ? 'bg-muted opacity-70 cursor-not-allowed' : 'hover:bg-muted/50 cursor-pointer'}`}
                    >
                        {isUploading ? (
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        ) : (
                            <>
                                <ImagePlus className="h-6 w-6" />
                                <span className="text-xs">{value.length} / {maxImages}</span>
                            </>
                        )}
                    </div>
                )}
            </div>

            <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
                disabled={isUploading}
            />
        </div>
    )
}
