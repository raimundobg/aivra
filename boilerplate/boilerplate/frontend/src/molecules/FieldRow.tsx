import { Box, Text } from '@chakra-ui/react'

interface FieldRowProps {
  label: string
  value?: string | number | null
  unit?: string
}

export function FieldRow({ label, value, unit }: FieldRowProps) {
  const display = value != null && value !== '' ? `${value}${unit ? ` ${unit}` : ''}` : '—'
  return (
    <Box>
      <Text fontSize="xs" color="#7a7264" mb={0.5} fontWeight="500">{label}</Text>
      <Text fontSize="sm" fontWeight="500" color="#2D3319">{display}</Text>
    </Box>
  )
}
