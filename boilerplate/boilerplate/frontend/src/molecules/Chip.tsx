import { Box, Flex, Text } from '@chakra-ui/react'

interface ChipProps {
  label: string
  variant?: 'green' | 'beige' | 'rose' | 'orange' | 'red'
}

const VARIANTS = {
  green:  { bg: '#eef2ea', color: '#5F6F52' },
  beige:  { bg: '#F9F4EF', color: '#7a7264' },
  rose:   { bg: '#f5ede7', color: '#9a7059' },
  orange: { bg: '#fff7ed', color: '#b45309' },
  red:    { bg: '#fff5f5', color: '#c53030' },
}

export function Chip({ label, variant = 'green' }: ChipProps) {
  const { bg, color } = VARIANTS[variant]
  return (
    <Box px={3} py={1} bg={bg} borderRadius="full" display="inline-flex" alignItems="center">
      <Text fontSize="xs" color={color} fontWeight="600">{label}</Text>
    </Box>
  )
}

interface ChipGroupProps {
  items: string[]
  variant?: ChipProps['variant']
}

export function ChipGroup({ items, variant = 'green' }: ChipGroupProps) {
  if (!items || items.length === 0) return <Text fontSize="sm" color="#7a7264">—</Text>
  return (
    <Flex gap={2} flexWrap="wrap">
      {items.map(item => <Chip key={item} label={item} variant={variant} />)}
    </Flex>
  )
}
