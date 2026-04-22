import { AppShell, Button, Group, Text, Stack, Title } from '@mantine/core'

function App() {
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
          <Button color="orange" mt="md">Play</Button>
        </Stack>
      </AppShell.Main>
    </AppShell>
  )
}

export default App