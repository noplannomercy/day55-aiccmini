'use client'

import { useForm, useFieldArray } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { AutoRule } from '@/types'
import { Trash2Icon, PlusIcon } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RuleFormCondition {
  type: 'keyword' | 'priority'
  value: string
}

export interface RuleFormAction {
  type: 'assign_agent' | 'change_status'
  value: string
}

export interface RuleFormData {
  name: string
  priority: number
  conditions: RuleFormCondition[]
  actions: RuleFormAction[]
}

interface RuleFormProps {
  rule?: AutoRule
  onSubmit: (data: RuleFormData) => Promise<void>
  isLoading?: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Converts the persisted AutoRule's JSONB conditions into the flat array
 * structure expected by react-hook-form's useFieldArray.
 */
function parseConditions(rule?: AutoRule): RuleFormCondition[] {
  if (!rule?.conditions) return [{ type: 'keyword', value: '' }]

  const raw = rule.conditions as Record<string, unknown>
  const result: RuleFormCondition[] = []

  if (Array.isArray(raw)) {
    // Already in array-of-{type,value} form.
    return raw.map((c) => ({
      type: (c as RuleFormCondition).type ?? 'keyword',
      value: (c as RuleFormCondition).value ?? '',
    }))
  }

  // Object form — e.g. { keywords: ['urgent'], priority: 'high' }
  if (raw.keywords && Array.isArray(raw.keywords)) {
    for (const kw of raw.keywords as string[]) {
      result.push({ type: 'keyword', value: kw })
    }
  }
  if (raw.priority) {
    result.push({ type: 'priority', value: String(raw.priority) })
  }

  return result.length > 0 ? result : [{ type: 'keyword', value: '' }]
}

/**
 * Converts the persisted AutoRule's JSONB actions into the flat array
 * structure expected by react-hook-form's useFieldArray.
 */
function parseActions(rule?: AutoRule): RuleFormAction[] {
  if (!rule?.actions) return [{ type: 'assign_agent', value: '' }]

  const raw = rule.actions as Record<string, unknown>
  const result: RuleFormAction[] = []

  if (Array.isArray(raw)) {
    return raw.map((a) => ({
      type: (a as RuleFormAction).type ?? 'assign_agent',
      value: (a as RuleFormAction).value ?? '',
    }))
  }

  // Object form — e.g. { assignTo: 'uuid', setStatus: 'in_progress' }
  if (raw.assignTo) {
    result.push({ type: 'assign_agent', value: String(raw.assignTo) })
  }
  if (raw.setStatus) {
    result.push({ type: 'change_status', value: String(raw.setStatus) })
  }

  return result.length > 0 ? result : [{ type: 'assign_agent', value: '' }]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Form for creating or editing an automation rule.
 *
 * Uses react-hook-form with useFieldArray to manage the dynamic condition and
 * action lists. The form data is normalised into the `RuleFormData` shape
 * before being handed to the parent `onSubmit` callback.
 */
export function RuleForm({ rule, onSubmit, isLoading }: RuleFormProps) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RuleFormData>({
    defaultValues: {
      name: rule?.name ?? '',
      priority: rule?.priority ?? 0,
      conditions: parseConditions(rule),
      actions: parseActions(rule),
    },
  })

  const {
    fields: conditionFields,
    append: appendCondition,
    remove: removeCondition,
  } = useFieldArray({ control, name: 'conditions' })

  const {
    fields: actionFields,
    append: appendAction,
    remove: removeAction,
  } = useFieldArray({ control, name: 'actions' })

  // Watch the condition and action type arrays so the Select components stay
  // controlled while react-hook-form manages the values.
  const watchedConditions = watch('conditions')
  const watchedActions = watch('actions')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
      {/* Rule Name */}
      <div className="grid gap-1.5">
        <Label htmlFor="rule-name">규칙 이름</Label>
        <Input
          id="rule-name"
          type="text"
          placeholder="예: 긴급 키워드 자동 배정"
          {...register('name', { required: '규칙 이름을 입력하세요.' })}
          autoComplete="off"
        />
        {errors.name && (
          <p className="text-sm text-destructive" role="alert">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Priority */}
      <div className="grid gap-1.5">
        <Label htmlFor="rule-priority">우선순위</Label>
        <Input
          id="rule-priority"
          type="number"
          {...register('priority', { valueAsNumber: true })}
        />
      </div>

      {/* Conditions */}
      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium">조건</legend>
        {conditionFields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-2">
            <Select
              value={watchedConditions?.[index]?.type ?? 'keyword'}
              onValueChange={(v) =>
                setValue(
                  `conditions.${index}.type`,
                  v as RuleFormCondition['type']
                )
              }
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="keyword">키워드</SelectItem>
                <SelectItem value="priority">우선순위</SelectItem>
              </SelectContent>
            </Select>

            <Input
              className="flex-1"
              placeholder={
                watchedConditions?.[index]?.type === 'priority'
                  ? 'low / medium / high / urgent'
                  : '키워드 입력'
              }
              {...register(`conditions.${index}.value`, {
                required: '값을 입력하세요.',
              })}
            />

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => removeCondition(index)}
              disabled={conditionFields.length <= 1}
              aria-label="조건 삭제"
            >
              <Trash2Icon className="size-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => appendCondition({ type: 'keyword', value: '' })}
        >
          <PlusIcon className="size-4 mr-1" />
          조건 추가
        </Button>
      </fieldset>

      {/* Actions */}
      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium">액션</legend>
        {actionFields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-2">
            <Select
              value={watchedActions?.[index]?.type ?? 'assign_agent'}
              onValueChange={(v) =>
                setValue(
                  `actions.${index}.type`,
                  v as RuleFormAction['type']
                )
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="assign_agent">담당자 배정</SelectItem>
                <SelectItem value="change_status">상태 변경</SelectItem>
              </SelectContent>
            </Select>

            <Input
              className="flex-1"
              placeholder={
                watchedActions?.[index]?.type === 'change_status'
                  ? 'open / in_progress / resolved / closed'
                  : '담당자 ID'
              }
              {...register(`actions.${index}.value`, {
                required: '값을 입력하세요.',
              })}
            />

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => removeAction(index)}
              disabled={actionFields.length <= 1}
              aria-label="액션 삭제"
            >
              <Trash2Icon className="size-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => appendAction({ type: 'assign_agent', value: '' })}
        >
          <PlusIcon className="size-4 mr-1" />
          액션 추가
        </Button>
      </fieldset>

      {/* Submit */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? '저장 중...' : rule ? '수정' : '생성'}
        </Button>
      </div>
    </form>
  )
}
