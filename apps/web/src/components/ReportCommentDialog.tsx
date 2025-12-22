import React, { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogTitle,
} from './ui/alert-dialog'
import { Loader2 } from 'lucide-react'
import { Textarea } from './ui/textarea'
import { type ReportReason, REPORT_REASON_LABELS } from '../types/comment'

interface ReportCommentDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (reason: ReportReason, details?: string) => Promise<void>
}

const REPORT_REASONS: ReportReason[] = ['spam', 'abuse', 'harassment', 'other']

const ReportCommentDialog: React.FC<ReportCommentDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null)
  const [details, setDetails] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!selectedReason) {
      setError('请选择举报原因')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await onSubmit(selectedReason, details.trim() || undefined)
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '举报失败，请稍后重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setSelectedReason(null)
    setDetails('')
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <AlertDialog>
      <AlertDialogOverlay onClick={handleClose} />
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader className="pb-2">
          <AlertDialogTitle className="text-base">举报评论</AlertDialogTitle>
        </AlertDialogHeader>

        <div className="space-y-3 px-4">
          {/* 举报原因选择 - 紧凑的标签式 */}
          <div className="flex flex-wrap gap-2">
            {REPORT_REASONS.map((reason) => (
              <button
                key={reason}
                type="button"
                onClick={() => {
                  setSelectedReason(reason)
                  setError(null)
                }}
                className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${selectedReason === reason
                  ? 'border-orange-500 bg-orange-50 text-orange-600'
                  : 'border-border hover:border-orange-300 hover:bg-muted/50'
                  }`}
              >
                {REPORT_REASON_LABELS[reason]}
              </button>
            ))}
          </div>

          {/* 详细描述（可选）- 更紧凑 */}
          <Textarea
            placeholder="补充说明（可选）"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            maxLength={200}
            rows={2}
            className="resize-none text-sm"
          />

          {/* 错误提示 */}
          {error && (
            <div className="text-xs text-red-500">{error}</div>
          )}
        </div>

        <AlertDialogFooter className="pt-3">
          <AlertDialogCancel onClick={handleClose} disabled={isSubmitting} className="h-8 text-sm">
            取消
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedReason}
            className="h-8 text-sm bg-orange-500 hover:bg-orange-600"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              '提交'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default ReportCommentDialog
