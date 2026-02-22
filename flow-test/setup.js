/**
 * Test setup - pure HTTP API helpers (no mongoose needed)
 * Uses existing seed data: receptionist1, doctor1 (password: test123)
 */
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', 'backend', '.env') })

const BASE_URL = `http://localhost:${process.env.PORT || 5001}/api/${process.env.API_VERSION || 'v1'}`

/**
 * Login helper - returns access token
 */
export async function login(username, password = 'test123') {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  const data = await res.json()
  if (!data.success && !data.accessToken) {
    throw new Error(`Login failed for ${username}: ${data.message || JSON.stringify(data)}`)
  }
  return data.accessToken
}

/**
 * API request helper
 */
export async function api(method, path, token, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }
  if (body) options.body = JSON.stringify(body)

  const res = await fetch(`${BASE_URL}${path}`, options)
  const data = await res.json()
  return { status: res.status, data }
}

/**
 * Delete resource via API (for cleanup)
 */
export async function apiDelete(token, path) {
  try {
    await fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
  } catch (e) {
    // ignore cleanup errors
  }
}

export { BASE_URL }
