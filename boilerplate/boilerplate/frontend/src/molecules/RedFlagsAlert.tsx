import { Box, Stack, Text } from '@chakra-ui/react'
import type { RedFlagsResult } from '../services/groq'

interface RedFlagsAlertProps {
  result: RedFlagsResult
}

export function RedFlagsAlert({ result }: RedFlagsAlertProps) {
  if (result.nivel === 'ok') return null

  const isCritico = result.nivel === 'critico'
  return (
    <Box
      borderRadius="2xl" p={4} borderWidth="1px"
      bg={isCritico ? '#fff5f5' : '#fffbeb'}
      borderColor={isCritico ? '#feb2b2' : '#fbd38d'}
    >
      <Text fontWeight="700" fontSize="sm" color={isCritico ? 'red.700' : 'orange.700'} mb={2}>
        {isCritico ? '🚨 Red flags críticas' : '⚠️ Alertas moderadas'}
      </Text>
      <Stack gap={1}>
        {result.flags.map(f => (
          <Text key={f} fontSize="sm" color={isCritico ? 'red.600' : 'orange.600'}>• {f}</Text>
        ))}
      </Stack>
      {isCritico && (
        <Text fontSize="xs" color="red.500" mt={2} fontWeight="500">
          Requiere revisión antes de activar plan automatizado
        </Text>
      )}
    </Box>
  )
}
