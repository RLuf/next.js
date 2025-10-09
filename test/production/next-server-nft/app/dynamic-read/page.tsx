import fs from 'fs'
import path from 'path'

// This page simulates a customer's code that uses dynamic fs operations.
// Without denied_path protection, this could cause the tracer to include
// the entire .next directory in the bundle (the customer's actual issue).
export default async function Page() {
  // Simulate reading a config file with a dynamic path
  // This is similar to patterns customers use like:
  //   const config = JSON.parse(fs.readFileSync(process.env.CONFIG_PATH))
  const configDir = process.env.CONFIG_DIR || 'config'
  const configFile = 'settings.json'

  let content = 'No config found'
  try {
    // This dynamic path.join could theoretically resolve to any directory
    const configPath = path.join(process.cwd(), configDir, configFile)
    const data = fs.readFileSync(configPath, 'utf-8')
    content = `Config loaded: ${data.substring(0, 50)}...`
  } catch (error) {
    // Expected to fail since we don't have a config file
    content = `Config not found (this is expected in test)`
  }

  return (
    <div>
      <h1>Dynamic File Read Test</h1>
      <p>This page uses dynamic fs.readFileSync that could over-trace</p>
      <p>{content}</p>
    </div>
  )
}
