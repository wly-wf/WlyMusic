import { AppShell, Button, Group, Text, Stack, Title } from '@mantine/core'
import { useState } from 'react'

function App() {
  const [playing, setPlaying] = useState(false)

  const handlePlay = async () => {
    try {
      const response = await window.electronAPI?.sendToRust(
        JSON.stringify({ cmd: 'play', data: { path: '/home/wly/Music/test.mp3' } })
      )
      console.log('Play response:', response)
      setPlaying(true)
    } catch (error) {
      console.error('Play error:', error)
    }
  }

  return (
    <AppShell header={{ height: 40 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md">
          <Text fw={700} size="lg">WlyMusic</Text>
        </Group>
      </AppShell.Header>
      <AppShell.Main>
        <Stack align="center" mt="xl">
          <Title order={2}>Welcome to WlyMusic</Title>
          <Text c="dimmed">Win11 Local Music Player</Text>
          <Button
            color="orange"
            mt="md"
            onClick={handlePlay}
            variant={playing ? 'filled' : 'outline'}
          >
            {playing ? 'Playing...' : 'Play'}
          </Button>
        </Stack>
      </AppShell.Main>
    </AppShell>
  )
}

export default App