import { Box, Text } from '@chakra-ui/react'

type PlanId = 'freemium' | 'ia' | 'full'

const PLAN_CONFIG: Record<PlanId, { label: string; bg: string; color: string }> = {
  ia:       { label: 'Plan IA',   bg: '#eef2ea', color: '#5F6F52' },
  full:     { label: 'Plan Full', bg: '#fef3c7', color: '#b45309' },
  freemium: { label: 'Freemium',  bg: '#f3f4f6', color: '#6b7280' },
}

interface StatusBadgeProps {
  plan?: string
  size?: 'sm' | 'md'
}

export function PlanBadge({ plan, size = 'sm' }: StatusBadgeProps) {
  const c = plan ? PLAN_CONFIG[plan as PlanId] : null
  const px = size === 'sm' ? 3 : 4
  const py = size === 'sm' ? 1 : 1.5
  const fs = size === 'sm' ? 'xs' : 'sm'
  return (
    <Box px={px} py={py} borderRadius="full" bg={c?.bg ?? '#f3f4f6'} display="inline-flex" alignItems="center">
      <Text fontSize={fs} fontWeight="600" color={c?.color ?? '#6b7280'}>
        {c?.label ?? 'Sin plan'}
      </Text>
    </Box>
  )
}

interface OnboardingBadgeProps { completed: boolean }

export function OnboardingBadge({ completed }: OnboardingBadgeProps) {
  return (
    <Box px={2} py={0.5} borderRadius="full" bg={completed ? '#eef2ea' : '#fff7ed'} display="inline-flex" alignItems="center" gap={1}>
      <Box w={1.5} h={1.5} borderRadius="full" bg={completed ? '#5F6F52' : '#f59e0b'} />
      <Text fontSize="xs" fontWeight="500" color={completed ? '#5F6F52' : '#b45309'}>
        {completed ? 'Onboarding completo' : 'Pendiente'}
      </Text>
    </Box>
  )
}
